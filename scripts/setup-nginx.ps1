# Run from the project root: .\scripts\setup-nginx.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$script:passed = 0
$script:failed = 0

function Step { Write-Host "`n[STEP] $args" -ForegroundColor Cyan }
function Pass { Write-Host "  [ OK ]  $args" -ForegroundColor Green;  $script:passed++ }
function Fail { Write-Host "  [FAIL]  $args" -ForegroundColor Red;    $script:failed++ }
function Info { Write-Host "  [INFO]  $args" -ForegroundColor DarkGray }

# HEAD request to http://127.0.0.1 with Host header.
# Avoids --resolve which is broken with Windows system curl.exe on loopback.
function Invoke-HttpTest {
    param([string]$Path = "/")
    $out  = & curl.exe -s -I -w "HTTPSTATUS%{http_code}" --max-time 5 `
                -H "Host: novacampus.fr" "http://127.0.0.1$Path" 2>&1
    $text = ($out -join "`n").ToLower()
    $code = if ($text -match "httpstatus(\d+)") { $Matches[1] } else { "000" }
    return @{ Code = $code; Text = $text }
}

# HEAD request to https://127.0.0.1.
# -k skips cert trust; --ssl-no-revoke stops Windows Schannel revocation checks.
# nginx has only one HTTPS block so it handles the request regardless of SNI.
function Invoke-HttpsTest {
    param([string]$Path = "/")
    $out  = & curl.exe -sk --ssl-no-revoke -I -w "HTTPSTATUS%{http_code}" --max-time 5 `
                "https://127.0.0.1$Path" 2>&1
    $text = ($out -join "`n").ToLower()
    $code = if ($text -match "httpstatus(\d+)") { $Matches[1] } else { "000" }
    return @{ Code = $code; Text = $text }
}

# -----------------------------------------------------------------
# 1. Self-signed certificate
# -----------------------------------------------------------------
Step "Generating self-signed TLS certificate"

if (Test-Path "infrastructure/nginx/certs/fullchain.pem") {
    Info "Certificate already exists, skipping."
} else {
    New-Item -ItemType Directory -Force "infrastructure/nginx/certs" | Out-Null
    & docker run --rm `
        -v "${PWD}/infrastructure/nginx/certs:/certs" `
        alpine sh -c "apk add --no-cache openssl 2>/dev/null && openssl req -x509 -nodes -newkey rsa:2048 -days 365 -keyout /certs/privkey.pem -out /certs/fullchain.pem -subj '/CN=novacampus.fr' 2>/dev/null"

    if (-not (Test-Path "infrastructure/nginx/certs/fullchain.pem")) {
        Write-Host "`n[FATAL] Certificate generation failed." -ForegroundColor Red
        exit 1
    }
    Pass "Certificate generated in nginx/certs/"
}

# -----------------------------------------------------------------
# 2. Ensure docker-compose.override.yml exists
# -----------------------------------------------------------------
Step "Checking docker-compose.override.yml"

if (-not (Test-Path "docker-compose.override.yml")) {
    $overrideContent = @"
services:
  nginx:
    volumes:
      - ./infrastructure/nginx/certs:/etc/letsencrypt/live/novacampus.fr:ro
"@
    Set-Content "docker-compose.override.yml" -Value $overrideContent -Encoding utf8
    Pass "Created docker-compose.override.yml"
} else {
    Info "Already exists."
}

# -----------------------------------------------------------------
# 3. Build and start containers
# -----------------------------------------------------------------
Step "Building and starting nginx (dependencies started automatically)"

& docker compose up --build -d nginx
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FATAL] docker compose failed to start." -ForegroundColor Red
    & docker compose logs nginx
    exit 1
}
Pass "Containers started"

# -----------------------------------------------------------------
# 4. Wait for nginx on port 443 (max 60 s)
# -----------------------------------------------------------------
Step "Waiting for nginx on port 443"

$deadline = (Get-Date).AddSeconds(60)
$up = $false
while ((Get-Date) -lt $deadline) {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 443 -WarningAction SilentlyContinue
    if ($tcp.TcpTestSucceeded) { $up = $true; break }
    Write-Host "  ." -NoNewline
    Start-Sleep 2
}
Write-Host ""

if (-not $up) {
    Write-Host "`n[FATAL] nginx did not respond within 60 s." -ForegroundColor Red
    & docker compose logs nginx
    exit 1
}

Start-Sleep 3
Pass "nginx is up"

# -----------------------------------------------------------------
# 5. Quick curl sanity check
# -----------------------------------------------------------------
Step "Verifying curl.exe can reach port 80"

$sanity = Invoke-HttpTest "/"
if ($sanity.Code -eq "000") {
    Write-Host ""
    Write-Host "  curl.exe could not reach http://127.0.0.1/ -- showing nginx logs:" -ForegroundColor Yellow
    & docker compose logs --tail 20 nginx
    Write-Host ""
    Write-Host "  Also confirm nothing else occupies port 80 on this machine:" -ForegroundColor Yellow
    netstat -ano | Select-String ":80 "
    Write-Host ""
    Write-Host "[FATAL] Cannot reach nginx. Check the logs above and re-run." -ForegroundColor Red
    exit 1
}
Pass "curl.exe reaches nginx (HTTP $($sanity.Code))"

# -----------------------------------------------------------------
# 6. Tests
# -----------------------------------------------------------------
Step "Running tests"
Write-Host ""

# 6.1 HTTP -> HTTPS redirect
$r = Invoke-HttpTest "/"
if ($r.Code -eq "301" -and $r.Text -match "location: https://") {
    Pass "HTTP -> HTTPS redirect returns 301"
} else {
    Fail "HTTP -> HTTPS redirect -- got $($r.Code)"
}

# 6.2 HTTPS responds
$r = Invoke-HttpsTest "/"
if ($r.Code -match "^[23]") {
    Pass "HTTPS responds ($($r.Code))"
} else {
    Fail "HTTPS responds -- got $($r.Code)"
}

# 6.3-6.6 Security headers on /
foreach ($header in @(
    "strict-transport-security",
    "x-frame-options",
    "content-security-policy",
    "x-content-type-options"
)) {
    if ($r.Text -match $header) {
        Pass "Header on /:         $header"
    } else {
        Fail "Header MISSING on /: $header"
    }
}

# 6.7 server_tokens off
if ($r.Code -ne "000" -and $r.Text -notmatch "server: nginx/\d") {
    Pass "server_tokens off (nginx version hidden)"
} else {
    Fail "server_tokens -- nginx version is exposed"
}

# 6.8-6.9 Security headers on /_next/static/ (proves add_header inheritance fix)
$rs = Invoke-HttpsTest "/_next/static/test.js"
foreach ($header in @("strict-transport-security", "x-frame-options")) {
    if ($rs.Text -match $header) {
        Pass "Header on /_next/static/: $header (inheritance fix OK)"
    } else {
        Fail "Header MISSING on /_next/static/: $header -- add_header inheritance bug!"
    }
}

# 6.10 API route forwarded (any code != 000 means nginx reached the gateway)
$ra = Invoke-HttpsTest "/api/health"
if ($ra.Code -ne "000") {
    Pass "API route forwarded to gateway (code: $($ra.Code))"
} else {
    Fail "API route -- no response at all (nginx may have crashed)"
}

# 6.11 Rate limiting on /api/auth/ (burst=5, so 503 after 5 rapid requests)
# Sequential requests let the zone refill between calls when upstreams are slow.
# Parallel jobs fire all 12 requests concurrently so they all land within the burst window.
Info "Firing 12 concurrent requests to trigger rate limit..."
$rl_jobs = 1..12 | ForEach-Object {
    Start-Job -ScriptBlock {
        $out  = & curl.exe -sk --ssl-no-revoke -I -w "HTTPSTATUS%{http_code}" `
                    --max-time 3 "https://127.0.0.1/api/auth/login" 2>&1
        $text = ($out -join " ").ToLower()
        if ($text -match "httpstatus(\d+)") { $Matches[1] } else { "000" }
    }
}
$codes = $rl_jobs | Wait-Job | Receive-Job
$rl_jobs | Remove-Job -Force

if ($codes -contains "503") {
    Pass "Rate limiting triggers 503 after burst  (codes: $($codes -join ' '))"
} else {
    Fail "Rate limiting -- no 503 seen  (codes: $($codes -join ' '))"
}

# -----------------------------------------------------------------
# 7. Summary
# -----------------------------------------------------------------
Write-Host ""
Write-Host ("-" * 50) -ForegroundColor White
if ($script:failed -eq 0) {
    Write-Host "  ALL $($script:passed) TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  $($script:passed) passed  |  $($script:failed) FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Last 40 lines of nginx logs:" -ForegroundColor Yellow
    & docker compose logs --tail 40 nginx
}
Write-Host ("-" * 50) -ForegroundColor White
Write-Host ""

exit $(if ($script:failed -gt 0) { 1 } else { 0 })
