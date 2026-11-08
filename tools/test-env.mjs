import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export const root = fileURLToPath(new URL("../", import.meta.url));
const localFile = new URL("../.local/review-env.json", import.meta.url);
const dotenvFile = new URL("../.env", import.meta.url);
const local = existsSync(localFile)
  ? JSON.parse(readFileSync(localFile, "utf8"))
  : {};
const dotenv = existsSync(dotenvFile)
  ? Object.fromEntries(
      readFileSync(dotenvFile, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.includes("=") && !line.startsWith("#"))
        .map((line) => {
          const i = line.indexOf("=");
          return [line.slice(0, i), line.slice(i + 1)];
        }),
    )
  : {};
export const testEnv = { ...dotenv, ...local, ...process.env };
