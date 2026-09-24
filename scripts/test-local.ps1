$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'local-db.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$env:RUN_DB_TESTS='1'
$env:TEST_DB_HOST='127.0.0.1'
$env:TEST_DB_PORT='33317'
$env:TEST_DB_USER='root'
$env:TEST_DB_PASSWORD=''
Set-Location (Split-Path -Parent $PSScriptRoot)
npm.cmd test
exit $LASTEXITCODE
