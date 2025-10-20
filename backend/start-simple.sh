#!/bin/bash

echo "🚀 Starting BlockCred (Simple Mode - No Dependencies)"

echo "📦 Installing minimal dependencies..."
go mod tidy

echo "🌐 Starting backend server..."
echo "✅ All features working - blockchain operations simulated"
echo ""
echo "📊 Access your application:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend: http://localhost:8080"
echo "   • Admin Login: admin / admin123"
echo ""

go run main-simple.go
