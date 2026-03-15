@echo off
echo ========================================
echo Checking Besu Blockchain Status
echo ========================================
echo.

REM Check if Besu is running by calling eth_blockNumber
curl -X POST http://localhost:8545 ^
    -H "Content-Type: application/json" ^
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" 2>nul | findstr "result" >nul

if %ERRORLEVEL% EQU 0 (
    echo [OK] Besu node is running
    echo.
    echo Fetching blockchain information...
    echo.
    
    REM Get block number
    curl -X POST http://localhost:8545 ^
        -H "Content-Type: application/json" ^
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" 2>nul
    
    echo.
    echo.
    
    REM Get gas price
    curl -X POST http://localhost:8545 ^
        -H "Content-Type: application/json" ^
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_gasPrice\",\"params\":[],\"id\":1}" 2>nul
    
    echo.
    echo.
    
    REM Get network version
    curl -X POST http://localhost:8545 ^
        -H "Content-Type: application/json" ^
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"net_version\",\"params\":[],\"id\":1}" 2>nul
    
    echo.
    echo.
    echo RPC Endpoint: http://localhost:8545
    echo WebSocket: ws://localhost:8546
) else (
    echo [ERROR] Besu node is not running or not accessible
    echo.
    echo Make sure:
    echo   1. Besu is installed and in PATH
    echo   2. You have started the node using: start-besu-blockchain.bat
    echo   3. The node is listening on port 8545
)

echo.
pause

