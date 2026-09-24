# Backend audit and handoff

## Confirmed issues addressed

- Public CRUD, password-hash disclosure, public Admin registration, and unprotected cached reports.
- JWT accepted only Token and trusted stale roles. Bearer/Token now resolve the active account.
- Missing owner IDs on project/transaction/receipt creation and client-selected approvers.
- Missing validation exports and undefined validation constants.
- Overlapping financial transactions shared one MySQL connection. Workflows now lease dedicated connections.
- Non-atomic approvals, duplicate processing, and stale receipt status after approval deletion.
- SQL injection through interpolated receipt status.
- Report amounts multiplied by receipt joins. Summary queries aggregate receipts first.
- Empty-month projects disappeared; month filters now belong in the join.
- Activity report unpacked mysql2 result tuples incorrectly; history pagination and date filters were incomplete.
- Redis authorization commented out, shared search keys across users, and cache failures broke database reads.
- Import-time HTTP listener and WhatsApp startup, dotenv load order, and invalid app.close shutdown.
- Incorrect Twilio logger import; payment/Twilio/Swagger routes unmounted.
- Mock Midtrans tokens and settlement, unsigned webhooks, and ignored persistence failures. Mounted payment flow now uses HTTP and signature/status verification.
- API-key route used the wrong user property and an undefined function; schema lacked a column. Added migration and one-way key hashing.
- Case-sensitive Payments foreign key referenced the wrong transaction-table spelling.
- Error logger included request bodies and passwords.

## Verification and limits

36 backend tests passed with zero failures or skips, including real MySQL-compatible workflows on isolated portable MariaDB 11.4.5. The suite creates and drops only a randomly named test database. It covers rollback, concurrent approval serialization, report aggregation, ownership, authentication, CRUD, filtering and pagination. Real database testing exposed and fixed duplicate approval races and report-detail duplication. Redis-disabled reads no longer open connections.

Google, WhatsApp, Twilio and Midtrans have not been exercised with live accounts. Tests do not contact providers.

Existing data was not modified. The historical dump includes owner ID 0 and inconsistent project/transaction ownership. Do not guess replacement owners: run db:check and reconcile before introducing owner foreign keys.

The Next.js/TypeScript/Tailwind App Router frontend is implemented against existing APIs. Production build and browser integration verification are described in local-development.md.

Access uses existing ID_User columns. No membership-grant table exists; project-members reports contributors rather than authorization grants. Budget adjustment is a ledger correction, not planned-budget management.

Core paginated lists now return data plus pagination. Complex APIs retain legacy response shapes.

Compatible dependency updates reduced the initial audit from 27 advisories (including one critical) to six high advisories in Nodemailer and the WhatsApp/Puppeteer archive dependency chain. Remaining upgrades need compatibility review; do not use audit fix --force blindly.

Production still needs shared OAuth sessions, provider sandbox verification, production-data migration checks, and remaining dependency remediation.

## Reproduce verification

See [local development](local-development.md) for portable database, preview, backend tests and browser tests. No production database architecture was changed for testing.
