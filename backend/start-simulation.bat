@echo off
echo 🚀 Starting BlockCred in Simulation Mode...

echo ⚠️  CGO compilation issue detected
echo 💡 Using simulation mode (blockchain features simulated)

REM Set environment variables for simulation mode
set BLOCKCHAIN_RPC_URL=http://localhost:8545
set BLOCKCHAIN_PRIVATE_KEY=simulation-mode
set BLOCKCHAIN_CONTRACT_ADDRESS=simulation-mode

echo 📊 Starting backend server...
echo 🌐 Backend: http://localhost:8080
echo 📈 Metrics: http://localhost:8080/metrics
echo.

REM Start the backend (it will run in simulation mode)
go run main.go
