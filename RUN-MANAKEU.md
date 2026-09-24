# Run Manakeu locally (Windows)

Requirements: Node.js 22+, PowerShell, and internet access for the initial dependency/database downloads. You do NOT need to install or configure MySQL.

Extract this ZIP first. Open PowerShell in the extracted Manakeu folder (the folder containing package.json).

## 1. Install dependencies once

```powershell
npm.cmd ci --ignore-scripts
Push-Location frontend
npm.cmd ci --ignore-scripts
Pop-Location
```

Optional integration install scripts are skipped for this isolated preview. WhatsApp browser setup is separate if you enable that integration later.

## 2. Start the local database and backend

In the project folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1
node scripts/preview-backend.js
```

Keep this terminal open. The first database download is approximately 87 MB. The script verifies the download and starts an isolated MariaDB instance on 127.0.0.1:33317. Backend runs on http://127.0.0.1:3100.

## 3. Start the frontend

Open a SECOND PowerShell terminal in the same project folder:

```powershell
Get-Content .local-test/preview-account.json
Set-Location frontend
$env:MANAKEU_API_URL='http://127.0.0.1:3100'
npm.cmd run dev
```

Open **http://localhost:3001**. Sign in using the email/password displayed by the Get-Content command. These credentials are generated locally on the first backend launch.

The workspace starts empty. Create a project, record income/expenses, add a receipt reference using the transaction ID, approve it, and generate a report. All changes use the real local database and persist between restarts.

## Stop or restart

Press Ctrl+C in each Node terminal. Stop the local database using:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Stop
```

Repeat steps 2 and 3 to restart. If ports 3001, 3100 or 33317 are already in use, stop your previous Manakeu preview first.

## Tests

Backend including real SQL:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-local.ps1
```

Frontend (browser tests need the two preview servers running and Microsoft Edge installed):

```powershell
Set-Location frontend
npm.cmd run build
npm.cmd test
```

Verified: 36 backend tests, 3 browser workflow suites, and production build passed. Browser fixtures are scoped to the preview database and cleaned up by the tests.

## Package contents and limits

The original backend is preserved; the new frontend is under frontend/. Production architecture remains Express/MySQL. This ZIP excludes credentials, .env, node_modules, build output, logs and local database data. Your existing production .env is not included.

Live Google/WhatsApp/Twilio/Midtrans and Redis service verification is still required before production. Six backend dependency advisories remain in email/WhatsApp dependency chains. The web login uses email/password; the existing backend Google JSON callback is preserved. See README.md, docs/backend-audit.md and docs/local-development.md for details, migration requirements and production setup.
