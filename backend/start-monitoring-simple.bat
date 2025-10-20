@echo off
echo 🚀 Starting BlockCred with Prometheus Monitoring

echo 📦 Installing dependencies...
go mod tidy

echo 🌐 Starting backend with metrics...
echo 📊 Prometheus metrics: http://localhost:8080/metrics
echo 📈 Dashboard metrics: http://localhost:8080/api/metrics/dashboard
echo.

go run main-simple.go
