# Local development and verification

The original Express/MySQL backend remains at the repository root. The Next.js App Router application lives in `frontend/` and calls the existing API through server route handlers. JWTs stay in an HttpOnly, SameSite cookie. Backend authorization remains authoritative.

## Windows isolated preview

No system MySQL installation or production credentials are needed.

1. Run `powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1`. It downloads the official portable MariaDB archive, verifies its SHA-256, and starts it on loopback port 33317. It creates no Windows service.
2. Run `node scripts/preview-backend.js`. This creates the separate `manakeu_preview` database with an empty schema and a local Admin. Credentials are in the ignored `.local-test/preview-account.json`.
3. In a second terminal, `cd frontend`, run `npm ci`, then:
   ```powershell
   $env:MANAKEU_API_URL='http://127.0.0.1:3100'
   npm run dev
   ```
4. Open http://localhost:3001 and sign in with that local account.

Verification completed: 36 backend tests and 3 browser suites passed; strict TypeScript and production build passed.

The preview uses real database records. Browser tests create financial fixtures only in this isolated database. Production data and the existing .env are untouched. The preview API binds only to loopback; external messaging, payments, Redis, and Google login are disabled in this preview. The local database root has no password and is exclusively for loopback development; never expose this instance to a network.

Stop the Node servers with Ctrl+C. Stop the portable database with `powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Stop`. Data remains under ignored `.local-test/`.

## Verification

- `powershell -ExecutionPolicy Bypass -File scripts/test-local.ps1`: starts the portable DB and runs backend tests, including real SQL workflows in a randomly named database removed after the suite.
- `cd frontend; npm run typecheck; npm run build`: strict TypeScript and production build.
- With both preview servers running, `cd frontend; npm test`: Playwright using installed Microsoft Edge. No paid services or external messages are invoked. Screenshots and failure traces stay in ignored `frontend/test-results/`. Traces may contain local test account input.
- For Linux/macOS, use an isolated MySQL/MariaDB instance and the existing TEST_DB_* variables with RUN_DB_TESTS=1. The portable launcher is Windows-specific.

## Frontend features and scope

Login, live dashboard, projects, income/expense transactions, receipt references, budget adjustments, approvals/revisions, reports/CSV exports, Admin users/roles, activity logs, and profile/password settings. Lists include pagination, search, filters, loading, error/retry and empty states. Navigation respects roles and handles expired sessions.

Budget adjustments use the existing transaction adjustment workflow. There is no planned spending-limit model. Receipts store document references; the backend has no file-upload endpoint. CSV list exports explicitly export the current page. Google OAuth remains available through the existing backend JSON callback; the web login currently uses email/password.

For your normal backend, set server-only MANAKEU_API_URL in frontend/.env.local (see frontend/.env.example). Deploy over HTTPS so production Secure cookies work. Set MANAKEU_WEB_ORIGIN to the exact public frontend origin when behind a reverse proxy. Do not expose JWTs as public environment variables.

## Remaining production checks

Live Google, WhatsApp, Twilio, Midtrans sandbox behavior and a live Redis instance were not exercised with provider accounts. Redis-disabled/failure fallback is covered. Existing production records need the documented schema migration and ownership reconciliation. The existing in-memory OAuth session store needs a shared store for multiple production instances. Six backend high-severity dependency advisories remain in the optional email/WhatsApp browser dependency chains; review compatible provider upgrades before production exposure.
