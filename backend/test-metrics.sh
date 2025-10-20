#!/bin/bash

echo "🧪 Testing BlockCred Metrics..."

# Test if backend is running
echo "1. Testing backend health..."
if curl -s http://localhost:8080/api/users > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not responding"
    exit 1
fi

# Test metrics endpoint
echo "2. Testing metrics endpoint..."
if curl -s http://localhost:8080/metrics | grep -q "blockcred_"; then
    echo "✅ Metrics endpoint is working"
else
    echo "❌ Metrics endpoint not responding"
    exit 1
fi

# Test Prometheus
echo "3. Testing Prometheus..."
if curl -s http://localhost:9090/api/v1/query?query=up > /dev/null; then
    echo "✅ Prometheus is running"
else
    echo "❌ Prometheus is not responding"
    echo "   Start with: docker-compose -f docker-compose.monitoring.yml up -d"
fi

# Test Grafana
echo "4. Testing Grafana..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is running"
else
    echo "❌ Grafana is not responding"
    echo "   Start with: docker-compose -f docker-compose.monitoring.yml up -d"
fi

echo ""
echo "🎯 Test completed! Check the following URLs:"
echo "   • Backend: http://localhost:8080"
echo "   • Metrics: http://localhost:8080/metrics"
echo "   • Prometheus: http://localhost:9090"
echo "   • Grafana: http://localhost:3001"
