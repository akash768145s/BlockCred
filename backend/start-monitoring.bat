@echo off
echo 🚀 Starting BlockCred Monitoring Stack...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

REM Install Go dependencies
echo 📦 Installing Go dependencies...
go mod tidy

REM Start the monitoring stack
echo 🐳 Starting Prometheus, Grafana, and Node Exporter...
docker-compose -f docker-compose.monitoring.yml up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo ✅ Monitoring stack started successfully!
echo.
echo 📊 Access your monitoring tools:
echo    • Prometheus: http://localhost:9090
echo    • Grafana: http://localhost:3001 (admin/admin123)
echo    • BlockCred Backend: http://localhost:8080
echo    • Metrics Endpoint: http://localhost:8080/metrics
echo.
echo 🎯 To stop the monitoring stack:
echo    docker-compose -f docker-compose.monitoring.yml down
echo.
echo Starting BlockCred backend...
go run main.go
