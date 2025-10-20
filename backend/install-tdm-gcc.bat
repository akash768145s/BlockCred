@echo off
echo 🔧 Installing TDM-GCC for CGO compilation...

echo Downloading TDM-GCC...
curl -L -o tdm-gcc.exe "https://github.com/jmeubank/tdm-gcc/releases/download/v10.3.0-tdm-1/tdm-gcc-10.3.0.exe"

echo Installing TDM-GCC...
tdm-gcc.exe /S

echo ✅ TDM-GCC installed! Please restart your terminal and try again.
echo.
echo After restart, run:
echo   go run main.go
