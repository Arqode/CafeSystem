# DashFood - CafeSystem

Final ICT project, SE-2622. Artur, Adiyat, Erdaulet.
React/TypeScript client, Express API, PostgreSQL 16. Customers order for pickup;
staff manage orders, menu availability and SQL-backed insights. Pay at pickup.

## Local review without Docker

Install Node.js **22.12+ or 24 LTS**. From the repository root:

```sh
npm run setup
npm run review
```

On Windows double-click **StartPreview.cmd**. Keep the terminal open and visit
**http://localhost:4000**. PostgreSQL binaries install through npm. This is the
actual API/database application. Data persists in `.local/postgres`. Stop with Ctrl+C.
Local review binds to loopback. On Windows, ASCII short paths avoid a PostgreSQL
bootstrap failure when the Windows account name contains Cyrillic characters.

**https://localhost:4443** additionally uses a generated self-signed certificate.
It encrypts the connection and produces a browser trust warning. No root certificate
is installed. Public/trusted deployment is not claimed.

## Test accounts for every role

| Role | Credentials | Access |
|---|---|---|
| Customer | Guest, no account/password | Menu, browser receipts, own order status |
| Staff / administrator | `admin`; `ADMIN_PASSWORD` in `.local/review-env.json` | Staff orders, Manage menu, Insights |

For Docker use `ADMIN_PASSWORD` from the root `.env` instead. Locally generated
passwords are excluded from Git. `admin123` works only with explicit `VITE_DEMO=true`,
not in the normal database build.

## Docker

Open Docker Desktop. Run `bash setup.sh` on macOS/Linux or
`powershell -ExecutionPolicy Bypass -File .\setup.ps1` on Windows.
Visit http://localhost:4000. `docker compose stop` preserves database data.
PostgreSQL has no published host port in Compose.

For an owned public domain, set `DASHFOOD_DOMAIN` in `.env`, configure its DNS to
your host and run `docker compose --profile https up --build -d`. Caddy terminates
TLS. Verify the certificate and restrict direct port 4000 access before public use.
Cloud deployment and measured 99% uptime remain unverified.

## Development and checks

`npm run build` compiles both apps. With a separately configured PostgreSQL, export
`DATABASE_URL`, `JWT_SECRET` (16+ characters), `ADMIN_PASSWORD` (8+ characters), run
`npm run seed`, then `npm start`. `npm run dev` starts the API and Vite after DB setup.
Seeding inserts the labelled batch of 120 synthetic orders once.

While the application runs:

```sh
npm test
npm run test:browser
node tools/final-checks.mjs
npm run test:performance
```

Browser checks use installed Google Chrome. CI can set `BROWSER_CHANNEL=chromium`
and run `npx --prefix tools playwright install --with-deps chromium`.
`.github/workflows/verify.yml` repeats build/API/browser/accessibility checks with
PostgreSQL 16. Remote CI is not claimed to have run before pushing the review branch.

Isolated local full assessment, using a fresh synthetic database:

```powershell
$env:REVIEW_CHECKS='1'
node tools/review-local.mjs
```

Results and dated screenshots: `output/evidence`. `tools/monitor.mjs` records health
probes; declare the observation period using `MONITOR_SAMPLES` and
`MONITOR_INTERVAL_MS`. A short local run does not prove long-term availability.

## Final materials

- `output/final/SE2622_DashFood_ICT_FinalProject.pdf`: consolidated report.
- `output/final/DashFood_Final_Presentation.pdf`: final presentation.
- `output/final/DashFood_Demo.webm`: backup recording of the actual app.
- `docs/FINAL_REQUIREMENTS.md`: R1-R15 with evidence.
- `docs/FINAL_TESTING.md`: original success criteria and external retest sheet.
- `docs/FEEDBACK_RESPONSE.md`: response to annotated midterm and Stage 2 findings.
- `docs/FINAL_DEFENSE_RU.md`: Russian presentation notes and live-change practice.
- `docs/CONTRIBUTIONS.md`: individual statement/signature worksheet.

Stage 1 page 5 defines the actual criteria: order in under 2 minutes, reject
unavailable products, and work at 360px. The Stage 2 slides incorrectly substitute
three functional tasks. The team confirms participants tested but did not time them.
Final submission requires genuine human timing, confirmed statements/commits,
R11 wording verification, trusted TLS evidence and a defined uptime observation.

## Security and data

Staff passwords use bcrypt; staff JWTs expire after eight hours. Order lookup now
requires a secret browser receipt token. Sequential IDs alone grant no access.
Server-side token hashes, parameterized SQL, validation and database pricing protect
data operations. One checkout key makes concurrent retries create one order.
Legacy orders without tracking credentials remain visible to staff; the customer
cannot recover them from their number alone. Keep browser data until pickup.

The DB stores pickup names. Phone numbers, addresses and payment details are not
collected. Disk/backup encryption, production retention and hosting location need
operator configuration. Application-level AES-256 at rest is not claimed.
All automated verification orders are synthetic, including those without `is_demo`.
Keep `.local`, `.env`, certificates, private keys and DB files out of Git.

## Code map

`web/src/pages`: customer/staff screens. `web/src/api.ts`: HTTP boundary.
`server/src/index.ts`: validation, auth, transactions. `server/schema.sql`: actual
tables and additive migration. `docs/ANALYSIS.sql`: repeatable queries.
`web/public/media/credits.html`: photo credits. Older reports/evidence and
`comparison` are historical material, not the final assessment record.

Repository: https://github.com/Arqode/CafeSystem

## Verified local HTTPS and persistence

Mac/Linux: `bash setup.sh --https`. The helper verifies the Caddy certificate using
`.local-certs/root.crt`; browser trust requires explicit import. No system trust is changed.
Run `node tools/check-https.mjs` to verify TLS and `node tools/test-persistence.mjs`
to check database retention (brief app/DB restart; run with no concurrent orders).

Russian single-file launch guide: [ИНСТРУКЦИЯ_ДЛЯ_ЭНДКИ.md](ИНСТРУКЦИЯ_ДЛЯ_ЭНДКИ.md).

The monitor resumes its saved schedule on restart with the same settings. Missed slots
count as unavailable; use `MONITOR_NEW_RUN=1` only for a deliberately new window.
Keep the old results before resetting. A short run does not prove 99% long-term uptime.

Final defense guide for all members: [ЗАЩИТА_ФАЙНАЛА.md](ЗАЩИТА_ФАЙНАЛА.md).
