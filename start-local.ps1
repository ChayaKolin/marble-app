# start-local.ps1 — Run Marble App locally
# Usage: .\start-local.ps1

$ErrorActionPreference = "Stop"

$PSQL    = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$MVN     = "C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd"
$DB_NAME = "kostonemarble_db"
$DB_USER = "postgres"
$ROOT    = $PSScriptRoot
$envFile = Join-Path $ROOT ".env"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Marble App - Local Startup         " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Read DB password from .env or prompt
$DB_PASS = $null
if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match "^PGPASSWORD=(.+)" }
    if ($line) {
        $DB_PASS = ($line -replace "^PGPASSWORD=", "").Trim()
        Write-Host "[OK] Found .env with DB password." -ForegroundColor Green
    }
}

if (-not $DB_PASS) {
    $sec = Read-Host "Enter PostgreSQL password (user: postgres)" -AsSecureString
    $DB_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}

# 2. Check PostgreSQL connection and create DB if needed
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASS
$check = & $PSQL -U $DB_USER -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Cannot connect to PostgreSQL. Check your password." -ForegroundColor Red
    exit 1
}
if ($check -ne "1") {
    Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
    & $PSQL -U $DB_USER -h localhost -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
    Write-Host "[OK] Database created." -ForegroundColor Green
} else {
    Write-Host "[OK] Database '$DB_NAME' exists." -ForegroundColor Green
}

# 3. Write .env if missing
if (-not (Test-Path $envFile)) {
    $jwtKey = "k0st0n3M4rbl3S3cur3K3yF0rJWTAuth3nt1c4t10nS3cr3t2024KostonePr0d"
    $content = @"
PGHOST=localhost
PGPORT=5432
PGDATABASE=$DB_NAME
PGUSER=$DB_USER
PGPASSWORD=$DB_PASS
JWT_SIGNING_KEY=$jwtKey
BASE_URL=http://localhost:5173
UPLOAD_DIR=C:/tmp/uploads
PORT=8080
KOSTONE_SYSTEM_EMAIL=kostonemarble@gmail.com
KOSTONE_EMAIL_PASSWORD=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
"@
    $content | Set-Content $envFile -Encoding utf8
    Write-Host "[OK] .env file created." -ForegroundColor Green
}

# 4. Load env vars into current process
Get-Content $envFile | Where-Object { $_ -match "^[A-Z]" } | ForEach-Object {
    $parts = $_ -split "=", 2
    if ($parts.Count -eq 2) {
        [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1], "Process")
    }
}
Write-Host "[OK] Environment variables loaded." -ForegroundColor Green

# 5. Create upload dir
New-Item -ItemType Directory -Force -Path "C:\tmp\uploads" | Out-Null

# 6. Build env setup string for backend window
$envLines = Get-Content $envFile | Where-Object { $_ -match "^[A-Z]" }
$envSetup = ($envLines | ForEach-Object {
    $p = $_ -split "=", 2
    if ($p.Count -eq 2) { "`$env:$($p[0]) = '$($p[1])';" }
}) -join " "

# 7. Start backend in new window
Write-Host "Starting Backend (Spring Boot on port 8080)..." -ForegroundColor Yellow
$backendCmd = "$envSetup cd '$ROOT\backend'; & '$MVN' spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal
Write-Host "[OK] Backend window opened." -ForegroundColor Green

# 8. Start frontend in new window
Write-Host "Starting Frontend (Vite on port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\frontend'; npm run dev" -WindowStyle Normal
Write-Host "[OK] Frontend window opened." -ForegroundColor Green

# 9. Wait for backend then open browser
Write-Host ""
Write-Host "Waiting for backend to start (up to 120s)..." -ForegroundColor Yellow
$backendUp = $false
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep 2
    try {
        Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" -Method POST `
            -Body '{}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null
    } catch {
        if ($_.Exception.Response -ne $null) { $backendUp = $true; break }
    }
    if ($i % 5 -eq 0) { Write-Host "  ...${i}0s" -ForegroundColor DarkGray }
}

if ($backendUp) {
    Write-Host "[OK] Backend is up!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend did not respond in time - check its window." -ForegroundColor Yellow
}

Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  App running at http://localhost:5173 " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
