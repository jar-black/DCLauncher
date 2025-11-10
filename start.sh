#!/bin/bash

# DCLauncher Startup Script

echo "╔═══════════════════════════════════════╗"
echo "║      DCLauncher - Setup & Start      ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

echo "✅ Docker version: $(docker --version)"

# Check if Docker Compose is installed
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose version: $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    echo "⚠️  Using legacy docker-compose (v1). Consider upgrading to Docker Compose V2."
    echo "✅ Docker Compose version: $(docker-compose --version)"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if projects.json exists
if [ ! -f "projects.json" ]; then
    echo "⚠️  projects.json not found. Creating from example..."
    cp projects.example.json projects.json
    echo "✅ projects.json created. Please edit it with your GitHub repositories."
    echo ""
fi

# Start the application
echo "🚀 Starting DCLauncher..."
echo ""
node launcher.js
