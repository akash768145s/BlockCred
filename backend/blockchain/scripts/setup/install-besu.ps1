# Install Hyperledger Besu for Windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Hyperledger Besu" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Besu is already installed
$besuInstalled = Get-Command besu -ErrorAction SilentlyContinue
if ($besuInstalled) {
    Write-Host "Besu is already installed!" -ForegroundColor Green
    besu --version
    exit 0
}

Write-Host "Besu is not installed. Please install it manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Download from GitHub Releases" -ForegroundColor Cyan
Write-Host "  1. Visit: https://github.com/hyperledger/besu/releases" -ForegroundColor White
Write-Host "  2. Download the latest Windows release (besu-*-windows.zip)" -ForegroundColor White
Write-Host "  3. Extract to a directory (e.g., C:\besu)" -ForegroundColor White
Write-Host "  4. Add the bin directory to your PATH environment variable" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use Chocolatey (if installed)" -ForegroundColor Cyan
Write-Host "  choco install besu" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Use Scoop (if installed)" -ForegroundColor Cyan
Write-Host "  scoop install besu" -ForegroundColor White
Write-Host ""
Write-Host "After installation, verify with: besu --version" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Press Enter to open the Besu releases page in your browser"
if ($response -eq "" -or $response -eq "y" -or $response -eq "Y") {
    Start-Process "https://github.com/hyperledger/besu/releases"
}

