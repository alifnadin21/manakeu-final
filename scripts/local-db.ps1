param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskLocal = Join-Path $taskRoot '.local-test'
$taskBin = Join-Path $taskLocal 'mariadb-11.4.5-winx64\bin'
$taskData = Join-Path $taskLocal 'data'
if ($Stop) {
    & (Join-Path $taskBin 'mariadb-admin.exe') --no-defaults --host=127.0.0.1 --port=33317 --user=root shutdown
    exit $LASTEXITCODE
}
New-Item -ItemType Directory -Force -Path $taskLocal | Out-Null
if (!(Test-Path (Join-Path $taskBin 'mariadbd.exe'))) {
    $taskArchive = Join-Path $taskLocal 'mariadb.zip'
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing 'https://archive.mariadb.org/mariadb-11.4.5/winx64-packages/mariadb-11.4.5-winx64.zip' -OutFile $taskArchive
    if ((Get-FileHash $taskArchive -Algorithm SHA256).Hash -ne 'b7c11d38657f16b837e68199d73670510aadb78f42dfa5d5fdea31a7aab342e3') { throw 'Portable database checksum mismatch' }
    Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskLocal
}
$taskListener = Get-NetTCPConnection -LocalPort 33317 -State Listen -ErrorAction SilentlyContinue
if ($taskListener) {
    $taskProcess = Get-Process -Id $taskListener[0].OwningProcess
    if ($taskProcess.Path -ne (Join-Path $taskBin 'mariadbd.exe')) { throw 'Test port belongs to another process' }
    Write-Output 'Project-local MariaDB already running on 127.0.0.1:33317'
    exit 0
}
if (!(Test-Path (Join-Path $taskData 'mysql'))) {
    & (Join-Path $taskBin 'mariadb-install-db.exe') "--datadir=$taskData" --port=33317
    if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed' }
}
$taskProcess = Start-Process -FilePath (Join-Path $taskBin 'mariadbd.exe') -ArgumentList @('--no-defaults',('--datadir="' + $taskData + '"'),'--port=33317','--bind-address=127.0.0.1','--innodb-buffer-pool-size=64M','--console') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskLocal 'database.out.log') -RedirectStandardError (Join-Path $taskLocal 'database.err.log')
$taskProcess.Id | Set-Content (Join-Path $taskLocal 'database.pid')
$taskReady = $false
for ($taskAttempt = 0; $taskAttempt -lt 100; $taskAttempt++) {
    $taskProcess.Refresh()
    if ($taskProcess.HasExited) { throw 'Local MariaDB exited. See .local-test/database.err.log' }
    $taskClient = New-Object System.Net.Sockets.TcpClient
    try { $taskClient.Connect('127.0.0.1', 33317); $taskReady = $true } catch {} finally { $taskClient.Dispose() }
    if ($taskReady) { break }
    Start-Sleep -Milliseconds 200
}
if (!$taskReady) { throw 'Local MariaDB did not become ready. See .local-test/database.err.log' }
Write-Output 'Project-local MariaDB ready on 127.0.0.1:33317'
