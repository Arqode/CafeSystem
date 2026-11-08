import { chromium } from "playwright";
import { renameSync, writeFileSync, mkdirSync } from "node:fs";
import { testEnv as env } from "./test-env.mjs";
const base = process.env.TEST_URL || "http://localhost:4000";
mkdirSync("output/final", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 850 },
  recordVideo: { dir: ".work/video", size: { width: 1280, height: 850 } },
});
const page = await ctx.newPage(),
  notes = [],
  start = Date.now();
async function hold(text, ms = 4500) {
  notes.push({ seconds: Math.round((Date.now() - start) / 1000), text });
  await page.waitForTimeout(ms);
}
try {
  await page.goto(base);
  await page.locator(".product-card").first().waitFor();
  await hold("Customer: browse menu, prices and categories.");
  await page.getByRole("searchbox").fill("Cheeseburger");
  await hold("Search the menu.");
  await page
    .getByRole("button", { name: "Add Cheeseburger to cart", exact: true })
    .click();
  await hold("Add a product and see cart feedback.");
  await page.getByRole("button", { name: "View Cart", exact: true }).click();
  await page
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await hold("Review quantity and total. Prices come from the server.");
  await page.getByLabel("Your name", { exact: false }).fill("Demo guest");
  await hold("Enter a pickup name. Payment happens at the cafe.");
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/orders") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Place order · Pay at pickup", exact: true })
    .click();
  const order = await (await response).json();
  await page.locator(".badge").first().waitFor();
  await hold("The order is saved in PostgreSQL and has a New status.");
  await page.getByRole("button", { name: "Staff orders", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const card = page
    .locator(".card")
    .filter({ has: page.getByText("Order #" + order.id, { exact: true }) });
  await card
    .getByRole("button", { name: "Accept order", exact: true })
    .waitFor();
  await hold("Staff receive the same order, including its pickup name.");
  await card.getByRole("button", { name: "Accept order", exact: true }).click();
  await card
    .getByRole("button", { name: "Mark as ready", exact: true })
    .waitFor();
  await hold("Staff accept the order. Its status becomes Preparing.");
  await card
    .getByRole("button", { name: "Mark as ready", exact: true })
    .click();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await page.getByText("Ready", { exact: true }).first().waitFor();
  await hold("The customer sees Ready from the shared database.");
  await page.getByRole("button", { name: "Manage menu", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await hold("Staff can edit prices and disable unavailable products.");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Insights", exact: true }).click();
  await page.locator(".chart-bars").first().waitFor();
  await hold(
    "Insights: product popularity, daily revenue and hourly orders. Data includes synthetic records.",
    6500,
  );
  await page
    .getByRole("heading", { name: "Smart pickup assistant" })
    .scrollIntoViewIfNeeded();
  await hold(
    "The wait estimate is a software simulation. No physical sensor is connected.",
    6500,
  );
} finally {
  const video = page.video();
  await ctx.close();
  renameSync(await video.path(), "output/final/DashFood_Demo.webm");
  writeFileSync(
    "output/final/Demo_timeline.txt",
    notes.map((n) => `${n.seconds}s: ${n.text}`).join("\n") +
      "\n\nSilent recording of the actual local database-backed application. Automated demonstration, not a human usability session.",
  );
  await browser.close();
}
