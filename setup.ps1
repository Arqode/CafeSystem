$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) {
  $dbPassword = [guid]::NewGuid().ToString('N')
  $jwtSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  $adminPassword = 'Dash-' + [guid]::NewGuid().ToString('N').Substring(0,12)
  @("DB_PASSWORD=$dbPassword", "JWT_SECRET=$jwtSecret", "ADMIN_PASSWORD=$adminPassword", 'DASHFOOD_DOMAIN=localhost') | Set-Content -LiteralPath '.env' -Encoding ascii
  Write-Host "Admin login: admin"
  Write-Host "Admin password: $adminPassword (also saved in .env)"
}
docker compose up --build -d
if ($LASTEXITCODE -ne 0) { throw 'Docker launch failed. Start Docker Desktop and try again.' }
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try { $health = Invoke-RestMethod -Uri 'http://localhost:4000/api/health' -TimeoutSec 2; if ($health.ok) { break } } catch {}
  Start-Sleep -Seconds 2
}
if (-not $health.ok) { throw 'App is not ready. Run docker compose logs app.' }
Write-Host 'DashFood is ready: http://localhost:4000'
Write-Host 'Staff: admin. Password is ADMIN_PASSWORD in the root .env file.'
