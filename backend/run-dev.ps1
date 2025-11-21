# PowerShell script to run air with CGO disabled
$env:CGO_ENABLED = "0"
Write-Host "CGO_ENABLED set to 0" -ForegroundColor Green
Write-Host "Starting air..." -ForegroundColor Cyan
air

