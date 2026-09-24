# Manakeu

**A financial management workspace for projects, transactions, and approvals.**

Manakeu helps teams record income and expenses, review supporting receipts, track project cash flow, and maintain an audit trail. It combines an existing Express/MySQL backend with a Next.js dashboard that uses real APIs and enforces access based on account roles.

## Features

| Area | Capabilities |
| --- | --- |
| Dashboard | Monthly financial overview, income and expense charts, recent transactions, and pending receipt counts |
| Projects | Create, edit, search, and filter projects |
| Transactions | Record income and expenses with project, date, and type filters |
| Budget adjustments | Correct transaction amounts with a recorded reason |
| Receipts and approvals | Store document references, approve or reject receipts, and request revisions |
| Reports | Project summaries, transaction details, and CSV exports |
| Users and roles | Admin-managed accounts, roles, and account deactivation |
| Activity logs | Searchable, paginated records of workspace changes |
| Profile | Update profile details and change passwords |

The interface includes responsive navigation, forms, validation, pagination, loading indicators, empty states, and error recovery.

**Scope:** Budget adjustments update existing ledger entries; there is no separate planned-budget model. Receipts store document references rather than uploaded files. List CSV exports include the current page.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, App Router, Lucide icons |
| Backend | Node.js, Express.js |
| Database | MySQL; portable MariaDB for isolated local verification |
| Authentication | JWT, bcrypt, backend Google OAuth support |
| Caching | Redis |
| API documentation | Swagger / OpenAPI |
| Integrations | WhatsApp, Twilio, Midtrans |
| Testing | Node.js test runner, real SQL integration tests, Playwright |

### How it works

```text
Browser
   |
   v
Next.js dashboard and server routes
   |  JWT forwarded server-side
   v
Express API
   |-- MySQL: users, projects, ledger, receipts, approvals, logs
   |-- Redis: optional caching
   `-- External providers: optional integrations
```

The web session uses an HttpOnly, SameSite cookie. Express checks the current account status, role, and record ownership on authenticated requests. Financial workflows use database transactions for changes that must succeed or fail together.

## Quick start: Windows local preview

This preview uses a separate local database. **No manual MySQL installation or configuration is required.**

### Requirements

- Node.js 22 or later and npm
- Windows PowerShell
- Internet access for the first dependency and portable database downloads
- Free ports `3001`, `3100`, and `33317`

Clone or download this repository, then open PowerShell in the project root: the folder containing `package.json` and `app.js`. Keep using the same project copy for all commands.

### 1. Install dependencies once

```powershell
npm.cmd ci --ignore-scripts
Push-Location frontend
npm.cmd ci --ignore-scripts
Pop-Location
```

Skip this step if dependencies are already installed and unchanged. Optional integration install scripts are skipped for the local preview; WhatsApp browser setup is separate.

### 2. Start the database and backend: Terminal 1

Run from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1
node scripts/preview-backend.js
```

The launcher downloads a checksum-verified portable MariaDB distribution on its first run, stores it under `.local-test/`, and starts it on loopback port `33317`. It does not install a Windows service.

The preview backend creates the `manakeu_preview` database and a local Admin account. Keep Terminal 1 open.

### 3. Read your login credentials and start the frontend: Terminal 2

Open a second PowerShell window in the **same project root**:

```powershell
Get-Content .local-test\preview-account.json
cd frontend
$env:MANAKEU_API_URL='http://127.0.0.1:3100'
npm.cmd run dev
```

Open **[http://localhost:3001](http://localhost:3001)** and sign in with the generated email and password. There is no shared default password.

Only **two terminal windows** are needed. The database runs in the background.

### Try the workflow

1. Create a project.
2. Add an income transaction and an expense transaction.
3. Add a receipt reference using the expense transaction's ID.
4. Review the receipt on the Approvals page.
5. Generate a project report and check the totals.
6. Create a User account to explore access restrictions.

The workspace begins empty and stores changes in the real local database. Data persists between restarts.

### Stop and restart

Press **Ctrl+C** in both server terminals. From the project root, stop the database with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Stop
```

To restart, repeat steps 2 and 3. You do not need to reinstall dependencies.

### Common setup issues

| Message or symptom | What to check |
| --- | --- |
| Cannot find `scripts/preview-backend.js` | Run the command from the project root, not your home directory or `frontend/`. |
| `next` is not recognized | Run `npm.cmd ci --ignore-scripts` inside `frontend/` and resolve any installation errors before starting it. |
| Cannot find `preview-account.json` | Start the preview backend first. From inside `frontend/`, use `Get-Content ..\.local-test\preview-account.json`. |
| Test port belongs to another process | Another database or project copy owns port 33317. Stop the earlier preview using its own launcher; do not terminate an unidentified process. |
| Port 3001 or 3100 is already in use | Stop the previous frontend or backend instance before starting another. |

The portable database is for local development only. Its passwordless database account must remain restricted to loopback access.

## Use an existing MySQL database

For a configured environment or a non-Windows development setup:

1. Install the root and frontend dependencies.
2. Copy [`.env.example`](.env.example) to `.env` and configure database credentials, JWT/session secrets, allowed origins, and optional integrations.
3. For a **new, empty database**, import [`migrations/schema-empty.sql`](migrations/schema-empty.sql). Do not import it over existing tables.
4. For an **existing database**, back it up and review/apply [`migrations/001_api_key.sql`](migrations/001_api_key.sql) once as appropriate. Run `npm run db:check` to inspect schema and data issues.
5. Run `npm start` from the project root.
6. Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env.local`. Set `MANAKEU_API_URL` to your backend URL, normally `http://127.0.0.1:3000`.
7. Run `npm run dev` from `frontend/`.

Set `REDIS_ENABLED=false` when Redis is unavailable. Keep `WHATSAPP_ENABLED=false` until its browser dependencies and account are configured.

Public registration creates a User account. For a fresh non-preview database, an administrator must promote the first verified account in the database; subsequent accounts can be managed through the Admin interface.

The historical `dbase_manakeu.sql` is retained for reference. Use the schema-only migration for a clean installation.

## API documentation

| Resource | Local preview | Configured backend default |
| --- | --- | --- |
| API base | `http://127.0.0.1:3100/api` | `http://localhost:3000/api` |
| Swagger UI | `http://127.0.0.1:3100/api-docs` | `http://localhost:3000/api-docs` |
| OpenAPI JSON | `http://127.0.0.1:3100/api-docs.json` | `http://localhost:3000/api-docs.json` |
| Health | `http://127.0.0.1:3100/api/health` | `http://localhost:3000/api/health` |

Authenticated API clients send `Authorization: Bearer <JWT>`.

Core list endpoints return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

Lists support `page`, `limit` (1-100), and `search`. Additional filters depend on the endpoint. Dates use `YYYY-MM-DD`; money values must be positive, fit `DECIMAL(15,2)`, and contain at most two decimal places. Prefer decimal strings in API requests.

Admin accounts manage workspace records and approvals. User accounts access their own records. Approved receipts require revision before related financial changes. Deactivating accounts preserves financial history.

## Testing

### Backend

Run HTTP/unit regressions:

```powershell
npm.cmd test
```

Run the full suite with the isolated Windows database:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-local.ps1
```

Real SQL tests create a random `manakeu_test_<hex>` database and remove it after the suite. Without `RUN_DB_TESTS=1`, the default test command explicitly skips SQL integration tests. Other environments can supply `TEST_DB_*` variables and enable `RUN_DB_TESTS=1`.

### Frontend

From `frontend/`:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
```

Browser tests require both preview servers to be running and Microsoft Edge installed. They use the isolated preview account, create real test records, and clean up their own financial fixtures.

**Last recorded verification:** 36 backend tests passed with no skips, 3 browser workflow suites passed, and the frontend type check and production build passed.

Coverage includes authentication, role and ownership enforcement, CRUD, income/expense calculations, report aggregation, rollback, concurrent approvals, budget adjustments, search, pagination, profile updates, mobile navigation, session handling, and API failure recovery.

## Optional integrations and current limitations

- **Google OAuth:** Available through the existing backend JSON/JWT callback. The web login currently uses email/password.
- **Redis:** Optional caching with namespaced keys and database fallback. Live Redis service verification remains outstanding.
- **WhatsApp and Twilio:** Backend integrations are preserved. Live account verification and provider setup are required.
- **Midtrans:** Payment creation uses the provider API; notifications verify signatures and retrieve provider status. Sandbox is the default. Live sandbox verification remains outstanding.
- **Production readiness:** Review remaining backend dependency advisories, use HTTPS for Secure cookies, configure a shared OAuth session store when scaling, and reconcile existing data before applying migrations. At the last audit, six high-severity advisories remained in email/WhatsApp dependency chains.

These integrations are not prerequisites for testing the core local workspace. See the [backend audit](docs/backend-audit.md) for repair details and verification limits.

## Project structure

```text
Manakeu/
|-- app.js                  # Express entry point
|-- config/                 # Database, Redis, OAuth, Swagger
|-- controllers/            # Financial and account workflows
|-- middleware/             # Authentication, roles, scope, validation
|-- routes/                 # API routes and documentation
|-- utils/                  # Transactions, money, caching, providers
|-- migrations/             # Empty schema and incremental updates
|-- tests/                  # Backend regression and SQL tests
|-- scripts/                # Database checks and isolated preview tools
|-- frontend/
|   |-- app/                # Next.js pages and server route handlers
|   |-- components/         # Dashboard, forms, tables, shared UI
|   |-- lib/                # API and session helpers
|   `-- tests/              # Browser workflows
`-- docs/                   # Audit and local development notes
```

## Further documentation

- [Step-by-step Windows run guide](RUN-MANAKEU.md)
- [Local development and verification](docs/local-development.md)
- [Backend audit](docs/backend-audit.md)

## Credits and license

Original authors: **@Firstianmaker**, **@Auraja**, and **@alifnadn**.

The project package declares the **ISC** license.
