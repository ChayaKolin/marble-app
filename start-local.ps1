# ─────────────────────────────────────────────────────────────────────────────
#  start-local.ps1  —  הרצה מלאה של Marble App לוקלית
#  הרץ: .\start-local.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

$PSQL    = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$MVN     = "C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd"
$DB_NAME = "kostonemarble_db"
$DB_USER = "postgres"
$ROOT    = $PSScriptRoot

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Marble App — Local Startup Script  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. קרא סיסמת PostgreSQL ──────────────────────────────────────────────────
$envFile = Join-Path $ROOT ".env"

if (Test-Path $envFile) {
    $existing = Get-Content $envFile | Where-Object { $_ -match "^SPRING_DATASOURCE_PASSWORD=(.+)" }
    if ($existing) {
        $DB_PASS = ($existing -replace "^SPRING_DATASOURCE_PASSWORD=", "").Trim()
        Write-Host "✔ נמצא .env קיים עם סיסמת DB." -ForegroundColor Green
    }
}

if (-not $DB_PASS) {
    $secPass = Read-Host "הכנס סיסמת PostgreSQL (משתמש postgres)" -AsSecureString
    $DB_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass))
}

# ── 2. וודא שה-DB קיים ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "בודק חיבור ל-PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASS

$dbCheck = & $PSQL -U $DB_USER -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✘ לא ניתן להתחבר ל-PostgreSQL. בדוק שהסיסמה נכונה." -ForegroundColor Red
    exit 1
}

if ($dbCheck -ne "1") {
    Write-Host "יוצר database '$DB_NAME'..." -ForegroundColor Yellow
    & $PSQL -U $DB_USER -h localhost -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
    Write-Host "✔ Database נוצר." -ForegroundColor Green
} else {
    Write-Host "✔ Database '$DB_NAME' כבר קיים." -ForegroundColor Green
}

# ── 3. כתוב / עדכן .env ──────────────────────────────────────────────────────
if (-not (Test-Path $envFile)) {
    $jwtKey = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

    @"
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/$DB_NAME
SPRING_DATASOURCE_USERNAME=$DB_USER
SPRING_DATASOURCE_PASSWORD=$DB_PASS
JWT_SIGNING_KEY=$jwtKey
BASE_URL=http://localhost:5173
UPLOAD_DIR=C:/tmp/uploads
PORT=8080
KOSTONE_SYSTEM_EMAIL=kostonemarble@gmail.com
KOSTONE_EMAIL_PASSWORD=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
"@ | Set-Content $envFile -Encoding utf8
    Write-Host "✔ קובץ .env נוצר." -ForegroundColor Green
}

# ── 4. טען משתני סביבה מה-.env ───────────────────────────────────────────────
Get-Content $envFile | Where-Object { $_ -match "^[A-Z]" } | ForEach-Object {
    $parts = $_ -split "=", 2
    [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1], "Process")
}
Write-Host "✔ משתני סביבה נטענו." -ForegroundColor Green

# ── 5. צור upload dir ─────────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "C:\tmp\uploads" | Out-Null

# ── 6. הרץ Backend בחלון נפרד ────────────────────────────────────────────────
Write-Host ""
Write-Host "מפעיל Backend (Spring Boot על פורט 8080)..." -ForegroundColor Yellow

$envBlock = Get-Content $envFile | Where-Object { $_ -match "^[A-Z]" } | ForEach-Object {
    $parts = $_ -split "=", 2
    "`$env:$($parts[0]) = '$($parts[1])';"
}
$envSetup = $envBlock -join " "

$backendCmd = "$envSetup cd '$ROOT\backend'; & '$MVN' spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

Write-Host "✔ Backend מופעל בחלון נפרד." -ForegroundColor Green

# ── 7. הרץ Frontend בחלון נפרד ───────────────────────────────────────────────
Write-Host "מפעיל Frontend (Vite על פורט 5173)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\frontend'; npm run dev" -WindowStyle Normal

Write-Host "✔ Frontend מופעל בחלון נפרד." -ForegroundColor Green

# ── 8. המתן ופתח דפדפן ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "ממתין לעלות הסרבר (30 שניות)..." -ForegroundColor Yellow

$backendUp = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $backendUp = $true; break }
    } catch {
        try {
            $r2 = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        } catch {
            if ($_.Exception.Response -ne $null) { $backendUp = $true; break }
        }
    }
    Write-Host "  ... ($($i+1)/30)" -ForegroundColor DarkGray
}

if ($backendUp) {
    Write-Host "✔ Backend עלה בהצלחה!" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend לא הגיב תוך 30 שניות — בדוק את החלון שלו." -ForegroundColor Yellow
}

Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  האפליקציה רצה על http://localhost:5173" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
