@echo off
echo 🧪 Testing BlockCred Metrics

echo 📊 Testing Prometheus metrics endpoint...
curl http://localhost:8080/metrics

echo.
echo 📈 Testing dashboard metrics endpoint...
curl http://localhost:8080/api/metrics/dashboard

echo.
echo ✅ Metrics test completed!
