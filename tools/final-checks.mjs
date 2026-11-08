import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { testEnv as env } from "./test-env.mjs";
import https from "node:https";
const base = process.env.TEST_URL || "http://localhost:4000";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
const page = await ctx.newPage();
const checks = [],
  scans = [];
const pass = (label) => {
  checks.push(label);
  console.log("PASS", label);
};
try {
  if (process.env.TLS_CERT) {
    const tls = await new Promise((resolve, reject) => {
      https
        .get(
          "https://127.0.0.1:4443/api/health",
          { rejectUnauthorized: false },
          (response) => {
            let body = "";
            const protocol = response.socket.getProtocol();
            response.on("data", (chunk) => (body += chunk));
            response.on("end", () =>
              resolve({
                status: response.statusCode,
                protocol,
                body: JSON.parse(body),
              }),
            );
          },
        )
        .on("error", reject);
    });
    assert.equal(tls.status, 200);
    assert.equal(tls.body.database, "connected");
    pass(
      "Local HTTPS health succeeds over " +
        tls.protocol +
        " with a self-signed certificate (trust not asserted)",
    );
  }
  await page.goto(base);
  await page.locator(".product-card").first().waitFor();
  for (const width of [320, 360, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const button of await page.locator("nav button").all()) {
      const b = await button.boundingBox();
      assert.ok(
        b && b.x >= 0 && b.x + b.width <= width,
        "Navigation item is visible at " + width,
      );
    }
  }
  pass(
    "F01: every navigation item is visible at 320, 360, 375, 768 and 1440 px",
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole("searchbox").fill("  Cheeseburger  ");
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.getByRole("searchbox").fill("   ");
  assert.ok((await page.locator(".product-card").count()) >= 8);
  pass("F02: surrounding and whitespace-only search queries work");
  await page.screenshot({
    path: "output/evidence/final-mobile-menu.png",
    fullPage: true,
  });
  async function scan(label) {
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      label + " overflow",
    );
    const a = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    scans.push({
      screen: label,
      violations: a.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
    });
  }
  await scan("Menu 360px");
  await page
    .getByRole("button", { name: "Add Cheeseburger to cart", exact: true })
    .click();
  await page.getByRole("button", { name: "View Cart", exact: true }).click();
  await scan("Cart 360px");
  await page.getByRole("button", { name: "Staff orders", exact: true }).click();
  await scan("Staff login 360px");
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.locator(".badge").first().waitFor();
  await scan("Staff orders 360px");
  await page.getByRole("button", { name: "Manage menu", exact: true }).click();
  const editTrigger = page.getByRole("button", { name: "Edit", exact: true }).last();
  const originalEditButton = await editTrigger.elementHandle();
  await editTrigger.click();
  await page.getByLabel("Name", { exact: true }).waitFor();
  await page.waitForFunction(
    (element) => element === document.activeElement,
    await page.getByLabel("Name", { exact: true }).elementHandle(),
    { timeout: 5000 },
  );
  assert.equal(
    await page
      .getByLabel("Name", { exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  const field = await page.getByLabel("Name", { exact: true }).boundingBox();
  assert.ok(field.y >= 0 && field.y + field.height <= 800);
  pass("F03: editing the last product focuses and displays its form at 360px");
  await scan("Product editor 360px");
  await page.screenshot({ path: "output/evidence/final-editor-focus.png" });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.waitForFunction(
    (element) => element === document.activeElement,
    originalEditButton,
    { timeout: 5000 },
  );
  assert.equal(
    await editTrigger.evaluate((element) => element === document.activeElement),
    true,
  );
  pass("F03: Cancel returns keyboard focus to the originating Edit button");
  await page.getByRole("button", { name: "Insights", exact: true }).click();
  await page.locator(".chart-bars").first().waitFor();
  await scan("Insights 360px");
  const t = (
    await (
      await page.request.post(base + "/api/auth/login", {
        data: { username: "admin", password: env.ADMIN_PASSWORD },
      })
    ).json()
  ).token;
  const dataset = await (
    await page.request.get(base + "/api/analytics", {
      headers: { Authorization: "Bearer " + t },
    })
  ).json();
  writeFileSync(
    "output/evidence/final-dataset.json",
    JSON.stringify(
      { capturedAt: new Date().toISOString(), ...dataset },
      null,
      2,
    ),
  );
  writeFileSync(
    "output/evidence/final-checks.json",
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        browser: browser.version(),
        checks,
        scans,
      },
      null,
      2,
    ),
  );
  assert.ok(
    scans.every((s) => s.violations.length === 0),
    "Accessibility scan violations: " +
      JSON.stringify(scans.filter((s) => s.violations.length)),
  );
  pass("No automated WCAG A/AA violations detected on six screens");
} finally {
  await browser.close();
}
