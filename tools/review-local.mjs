import EmbeddedPostgres from "embedded-postgres";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { generate } from "selfsigned";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
// PostgreSQL's Windows bootstrap needs an ASCII data path on legacy system code pages.
const nativeRoot =
  process.platform === "win32"
    ? execFileSync("cmd.exe", ["/d", "/c", "for %I in (.) do @echo %~sI"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
    : root;
const data = path.join(nativeRoot, ".local");
mkdirSync(data, { recursive: true });
const envFile = path.join(data, "review-env.json");
if (!existsSync(envFile))
  writeFileSync(
    envFile,
    JSON.stringify(
      {
        ADMIN_PASSWORD: "Dash-" + randomBytes(8).toString("hex"),
        JWT_SECRET: randomBytes(32).toString("hex"),
        DB_PASSWORD: randomBytes(16).toString("hex"),
      },
      null,
      2,
    ),
  );
const secrets = JSON.parse(readFileSync(envFile, "utf8"));
const certFile = path.join(data, "localhost.pem"),
  keyFile = path.join(data, "localhost-key.pem");
if (!existsSync(certFile) || !existsSync(keyFile)) {
  const pems = await generate([{ name: "commonName", value: "localhost" }], {
    algorithm: "sha256",
    keySize: 2048,
    extensions: [
      { name: "basicConstraints", cA: false },
      { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
      { name: "extKeyUsage", serverAuth: true },
      {
        name: "subjectAltName",
        altNames: [
          { type: 2, value: "localhost" },
          { type: 7, ip: "127.0.0.1" },
        ],
      },
    ],
  });
  writeFileSync(certFile, pems.cert);
  writeFileSync(keyFile, pems.private);
}
const pgPort = Number(process.env.LOCAL_DB_PORT || 55432);
const databaseDir = path.join(
  data,
  process.env.REVIEW_CHECKS === "1" ? "checks-" + Date.now() : "postgres",
);
const nativeBin = path.join(
  nativeRoot,
  "tools/node_modules/@embedded-postgres/windows-x64/native/bin",
);
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "cafe",
  password: secrets.DB_PASSWORD,
  port: pgPort,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: (message) => {
    if (/FATAL|PANIC|ERROR/.test(message)) console.error(message);
  },
  onError: (message) => console.error(String(message).trim()),
  autoRehydrateSymlinks: true,
});
let nativePg;
let server;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (server && !server.killed && server.exitCode === null) {
    const done = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await done;
  }
  if (nativePg) {
    execFileSync(
      path.join(nativeBin, "pg_ctl.exe"),
      ["-D", databaseDir, "-m", "fast", "-w", "stop"],
      { stdio: "pipe" },
    );
    nativePg = undefined;
  } else if (process.platform !== "win32") await pg.stop();
}
process.on("SIGINT", () => void stop().then(() => process.exit()));
process.on("SIGTERM", () => void stop().then(() => process.exit()));
try {
  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
    if (process.platform === "win32") {
      const passwordFile = path.join(data, "init-password");
      writeFileSync(passwordFile, secrets.DB_PASSWORD + "\n");
      try {
        execFileSync(
          path.join(nativeBin, "initdb.exe"),
          [
            "-D",
            databaseDir,
            "-U",
            "cafe",
            "--auth=scram-sha-256",
            "--encoding=UTF8",
            "--locale=C",
            "--pwfile=" + passwordFile,
          ],
          { stdio: "pipe" },
        );
      } finally {
        unlinkSync(passwordFile);
      }
    } else await pg.initialise();
  }
  if (process.platform === "win32") {
    await new Promise((resolve, reject) => {
      nativePg = spawn(
        path.join(nativeBin, "postgres.exe"),
        ["-D", databaseDir, "-p", String(pgPort), "-h", "127.0.0.1"],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      let log = "";
      nativePg.stderr.on("data", (chunk) => {
        log += chunk;
        if (log.includes("database system is ready to accept connections"))
          resolve();
      });
      nativePg.once("error", reject);
      nativePg.once("exit", (code) => {
        if (!stopping)
          reject(new Error("PostgreSQL stopped (" + code + "): " + log));
      });
    });
  } else await pg.start();
  const client = pg.getPgClient("postgres");
  await client.connect();
  if (
    !(await client.query("SELECT 1 FROM pg_database WHERE datname='cafe'"))
      .rowCount
  )
    await client.query("CREATE DATABASE cafe");
  await client.end();
  const env = {
    ...process.env,
    ...secrets,
    DATABASE_URL: `postgres://cafe:${secrets.DB_PASSWORD}@127.0.0.1:${pgPort}/cafe`,
    PORT: process.env.PORT || "4000",
    HOST: "127.0.0.1",
    TLS_CERT: certFile,
    TLS_KEY: keyFile,
    TLS_PORT: "4443",
    CORS_ORIGIN: "http://localhost:4000",
    NODE_ENV: "production",
  };
  const seed = spawn(process.execPath, ["server/dist/seed.js"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  const result = await new Promise((resolve) => seed.once("exit", resolve));
  if (result !== 0) throw new Error("Database initialization failed.");
  server = spawn(process.execPath, ["server/dist/index.js"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  server.once("exit", () => {
    if (!stopping) void stop().then(() => process.exit(1));
  });
  console.log(
    "Local PostgreSQL 16 review. Staff login: admin. Password is in .local/review-env.json. Keep this terminal open.",
  );
  if (process.env.REVIEW_CHECKS === "1") {
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if ((await fetch("http://127.0.0.1:" + env.PORT + "/api/health")).ok)
          break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (const script of (
      process.env.REVIEW_SCRIPTS ||
      "test-api.mjs,test-browser.mjs,final-checks.mjs,measure-performance.mjs"
    ).split(",")) {
      const child = spawn(process.execPath, ["tools/" + script], {
        cwd: root,
        env: { ...env, TEST_URL: "http://127.0.0.1:" + env.PORT },
        stdio: "inherit",
      });
      if ((await new Promise((resolve) => child.once("exit", resolve))) !== 0)
        throw new Error(script + " failed");
    }
    await stop();
  }
} catch (error) {
  console.error(error);
  await stop();
  process.exitCode = 1;
}
