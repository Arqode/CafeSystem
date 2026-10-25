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
