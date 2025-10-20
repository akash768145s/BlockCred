#!/bin/bash

echo "🚀 Starting BlockCred Monitoring Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Install Go dependencies
echo "📦 Installing Go dependencies..."
go mod tidy

# Start the monitoring stack
echo "🐳 Starting Prometheus, Grafana, and Node Exporter..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Start the BlockCred backend
echo "🔧 Starting BlockCred backend..."
go run main.go &
BACKEND_PID=$!

echo "✅ Monitoring stack started successfully!"
echo ""
echo "📊 Access your monitoring tools:"
echo "   • Prometheus: http://localhost:9090"
echo "   • Grafana: http://localhost:3001 (admin/admin123)"
echo "   • BlockCred Backend: http://localhost:8080"
echo "   • Metrics Endpoint: http://localhost:8080/metrics"
echo ""
echo "🎯 To stop the monitoring stack:"
echo "   docker-compose -f docker-compose.monitoring.yml down"
echo "   kill $BACKEND_PID"
echo ""
echo "Press Ctrl+C to stop the backend server..."

# Wait for the backend process
wait $BACKEND_PID
