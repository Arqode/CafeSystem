# My Café — Online Order System

React + TypeScript (web) · Node.js/Express · PostgreSQL · Docker

## 1. Quick start (demo, no server, no database)
    cd web
    npm install
    npm run dev          # http://localhost:5173
Staff login in demo mode: `admin` / `admin123`. Data lives in the browser (localStorage).

## 2. Real mode (REST API + PostgreSQL)
    cp server/.env.example server/.env     # set JWT_SECRET and ADMIN_PASSWORD
    docker compose up --build -d           # PostgreSQL + API on :4000, schema.sql is applied automatically
    cd server && npm install && npm run seed   # creates the admin from .env (needs DATABASE_URL pointing to localhost)
    cd ../web && cp .env.example .env && npm run dev

The switch is one variable: `VITE_API_URL` in `web/.env`.
Empty = demo mode. Filled in = all requests go to the API.

## REST API
| Method | Path | Access |
|---|---|---|
| POST | /api/auth/login | public → JWT |
| GET | /api/products (`?all=1` includes disabled) | public / admin |
| POST, PUT | /api/products, /api/products/:id | admin |
| POST | /api/orders | public (price is calculated on the server) |
| GET | /api/orders/:id | public (order status) |
| GET | /api/orders | admin |
| PATCH | /api/orders/:id/status | admin |

## Structure
- `web/src/api.ts` — only file that knows about data (REST or demo)
- `web/src/store.tsx` — cart (useReducer) and admin session (Context)
- `web/src/pages/` — Menu, Cart, MyOrders, AdminOrders, ManageMenu
- `server/src/index.ts` — Express routes, JWT, SQL; `server/schema.sql` — tables

## Before production
HTTPS (R13) via AWS load balancer/nginx, strong JWT_SECRET and admin password, rate limit on /api/auth/login.

## ICT Assignment 4 — Part B

See [PART_B_REPORT.md](PART_B_REPORT.md) for the asset inventory, sources,
accessibility code, actual verification results, and Network measurement placeholders.
The original source snapshot is in `comparison/before/`; do not edit it.

From the project root, prepare both production demo builds:

```powershell
node tools/build-comparison.mjs
```

Run in two separate terminals:

```powershell
node tools/serve-comparison.mjs before
node tools/serve-comparison.mjs after
```

Before: http://127.0.0.1:4173. After: http://127.0.0.1:4174.
Both servers may already be running in the delivered workspace. Repeat the
functional checks with `npm.cmd --prefix tools run check` while both are running.
Use identical Chrome Network settings (Disable cache, Fast 4G, 360×800, DPR 1)
for the two real screenshots; follow the full instructions in the report.
