@echo off
echo 🧪 Testing BlockCred Metrics...

REM Test if backend is running
echo 1. Testing backend health...
curl -s http://localhost:8080/api/users >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not responding
    exit /b 1
)

REM Test metrics endpoint
echo 2. Testing metrics endpoint...
curl -s http://localhost:8080/metrics | findstr "blockcred_" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Metrics endpoint is working
) else (
    echo ❌ Metrics endpoint not responding
    exit /b 1
)

REM Test Prometheus
echo 3. Testing Prometheus...
curl -s http://localhost:9090/api/v1/query?query=up >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Prometheus is running
) else (
    echo ❌ Prometheus is not responding
    echo    Start with: docker-compose -f docker-compose.monitoring.yml up -d
)

REM Test Grafana
echo 4. Testing Grafana...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Grafana is running
) else (
    echo ❌ Grafana is not responding
    echo    Start with: docker-compose -f docker-compose.monitoring.yml up -d
)

echo.
echo 🎯 Test completed! Check the following URLs:
echo    • Backend: http://localhost:8080
echo    • Metrics: http://localhost:8080/metrics
echo    • Prometheus: http://localhost:9090
echo    • Grafana: http://localhost:3001
