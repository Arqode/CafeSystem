import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { testEnv as env } from "./test-env.mjs";
const base = process.env.TEST_URL || "http://localhost:4000";
const checks = [];
async function request(path, method = "GET", body, token, headers = {}) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(method === "POST" && path === "/api/orders"
        ? { "Idempotency-Key": randomUUID() }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, data: await r.json() };
}
function ok(condition, label) {
  assert.ok(condition, label);
  checks.push(label);
  console.log("PASS", label);
}
const health = await request("/api/health");
ok(health.data.database === "connected", "PostgreSQL is connected");
const products = (await request("/api/products")).data;
ok(products.length >= 8, "Menu contains at least eight products with prices");
ok(
  (await request("/api/orders")).status === 401,
  "Guest cannot read staff orders",
);
ok(
  (await request("/api/products?all=1")).status === 401,
  "Guest cannot read disabled products",
);
ok(
  (await request("/api/analytics")).status === 401,
  "Guest cannot read statistics",
);
ok(
  (await request("/api/products", "POST", {})).status === 401,
  "Guest cannot change the menu",
);
ok(
  (
    await request("/api/auth/login", "POST", {
      username: "admin",
      password: "incorrect",
    })
  ).status === 401,
  "Wrong password is rejected",
);
const token = (
  await request("/api/auth/login", "POST", {
    username: "admin",
    password: env.ADMIN_PASSWORD,
  })
).data.token;
ok(Boolean(token), "Staff login succeeds");
const stats = (await request("/api/analytics", "GET", undefined, token)).data;
ok(stats.count >= 120, "Database contains at least 120 orders");
ok(
  stats.daily.length >= 3 &&
    stats.popular.length >= 3 &&
    stats.hours.length >= 3,
  "Three charts are populated from database aggregations",
);
ok(
  (
    await request("/api/orders", "POST", {
      customerName: "API Test",
      items: [],
    })
  ).status === 400,
  "Empty order is rejected",
);
ok(
  (
    await request("/api/orders", "POST", {
      customerName: "API Test",
      items: [null],
    })
  ).status === 400,
  "Malformed order line is rejected",
);
ok(
  (
    await request("/api/orders", "POST", {
      customerName: "API Test",
      items: [{ productId: products[0].id, qty: 51 }],
    })
  ).status === 400,
  "Quantity greater than 50 is rejected",
);
for (const customerName of [
  undefined,
  null,
  17,
  {},
  "",
  "   ",
  "123",
  "x".repeat(81),
  "Artur\u0000",
]) {
  ok(
    (
      await request("/api/orders", "POST", {
        customerName,
        items: [{ productId: products[0].id, qty: 1 }],
      })
    ).status === 400,
    "Invalid or missing pickup name is rejected: " +
      JSON.stringify(customerName),
  );
}
ok(
  (await request("/api/analytics", "GET", undefined, token)).data.count ===
    stats.count,
  "Invalid pickup names do not create database orders",
);
const response = await request("/api/orders", "POST", {
  customerName: "  Әлия   O'Neil  ",
  items: [{ productId: products[0].id, qty: 2 }],
  total: 1,
});
const order = response.data;
ok(
  response.status === 201 && order.total === products[0].price * 2,
  "Order is saved with the price calculated by the server",
);
ok(
  order.customerName === "Әлия O'Neil",
  "Pickup name supports Unicode and apostrophes and normalizes spaces",
);
ok(
  (await request(`/api/orders/${order.id}`)).status === 404,
  "Sequential order number alone cannot reveal another order",
);
ok(
  (
    await request(`/api/orders/${order.id}`, "GET", undefined, undefined, {
      "X-Order-Token": "incorrect",
    })
  ).status === 404,
  "Wrong tracking key cannot reveal an order",
);
const publicOrder = (
  await request(`/api/orders/${order.id}`, "GET", undefined, undefined, {
    "X-Order-Token": order.trackingToken,
  })
).data;
ok(publicOrder.id === order.id, "Created order is read from the database");
ok(
  !("customerName" in publicOrder),
  "Public order lookup does not reveal the pickup name",
);
ok(
  (await request("/api/orders", "GET", undefined, token)).data.some(
    (o) => o.id === order.id && o.customerName === "Әлия O'Neil",
  ),
  "Staff order list reads the saved pickup name",
);
ok(
  (
    await request(
      `/api/orders/${order.id}/status`,
      "PATCH",
      { status: "Completed" },
      token,
    )
  ).status === 409,
  "Skipping workflow steps is rejected",
);
for (const status of ["Preparing", "Ready", "Completed"]) {
  ok(
    (
      await request(
        `/api/orders/${order.id}/status`,
        "PATCH",
        { status },
        token,
      )
    ).status === 200,
    `Staff changes status to ${status}`,
  );
  ok(
    (
      await request(`/api/orders/${order.id}`, "GET", undefined, undefined, {
        "X-Order-Token": order.trackingToken,
      })
    ).data.status === status,
    `Customer sees ${status} from database`,
  );
}
const testName = `Verification product ${Date.now()}`;
const input = {
  name: testName,
  category: "Drinks",
  price: 1200,
  description: "Synthetic automated verification item",
  active: true,
};
ok(
  (await request("/api/products", "POST", input, token)).status === 201,
  "Staff can create product",
);
const created = (
  await request("/api/products?all=1", "GET", undefined, token)
).data.find((p) => p.name === testName);
ok(
  (
    await request(
      `/api/products/${created.id}`,
      "PUT",
      { ...created, price: 1400, active: false },
      token,
    )
  ).status === 200,
  "Staff can edit and disable product",
);
ok(
  !(await request("/api/products")).data.some((p) => p.id === created.id),
  "Disabled product is hidden from customer menu",
);
ok(
  (
    await request("/api/orders", "POST", {
      customerName: "API Test",
      items: [{ productId: created.id, qty: 1 }],
    })
  ).status === 400,
  "Disabled product cannot be ordered",
);
for (const path of [
  "/api/orders/nope",
  "/api/orders/-1",
  "/api/products/9999999999999999999999",
])
  ok(
    (
      await request(
        path,
        path.includes("products") ? "PUT" : "GET",
        path.includes("products") ? input : undefined,
        token,
      )
    ).status === 400,
    "Invalid identifiers produce a validation error: " + path,
  );
for (const path of [
  "/api/orders",
  "/api/products",
  "/api/auth/login",
  `/api/orders/${order.id}/status`,
]) {
  ok(
    (
      await request(
        path,
        path.endsWith("status") ? "PATCH" : "POST",
        null,
        token,
      )
    ).status === 400,
    "Null JSON body is rejected: " + path,
  );
}
const key = randomUUID(),
  body = {
    customerName: "Idempotency Test",
    items: [{ productId: products[0].id, qty: 1 }],
  };
const retries = await Promise.all(
  Array.from({ length: 5 }, () =>
    request("/api/orders", "POST", body, undefined, { "Idempotency-Key": key }),
  ),
);
ok(
  retries.every((r) => [200, 201].includes(r.status)) &&
    new Set(retries.map((r) => r.data.id)).size === 1,
  "Five concurrent checkout retries create exactly one order",
);
ok(
  retries.filter((r) => r.status === 201).length === 1,
  "Only the first checkout request creates a record",
);
ok(
  (
    await request(
      "/api/orders",
      "POST",
      { ...body, customerName: "Changed" },
      undefined,
      { "Idempotency-Key": key },
    )
  ).status === 409,
  "Reusing a checkout key for another cart is rejected",
);
ok(
  (
    await request("/api/orders", "POST", {
      customerName: "Duplicate",
      items: [
        { productId: products[0].id, qty: 50 },
        { productId: products[0].id, qty: 50 },
      ],
    })
  ).status === 400,
  "Duplicate product lines cannot bypass the quantity limit",
);
ok(
  (await request("/api/products", "POST", { ...input, price: 1.5 }, token))
    .status === 400,
  "Fractional KZT prices are rejected",
);
mkdirSync(new URL("../output/evidence/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../output/evidence/api-tests.json", import.meta.url),
  JSON.stringify(
    {
      testedAt: new Date().toISOString(),
      base,
      checks,
      syntheticVerificationOrder: order.id,
    },
    null,
    2,
  ),
);
console.log(`${checks.length} API checks passed.`);
