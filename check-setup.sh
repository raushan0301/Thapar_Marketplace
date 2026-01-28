#!/bin/bash

# ThaparMarket - Quick Start Script
# This script helps you verify your setup

echo "🎓 ThaparMarket - Setup Verification"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the marketplace directory"
    exit 1
fi

echo "✅ Directory structure looks good"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

echo ""
echo "📦 Checking backend dependencies..."

cd backend

if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed"
    echo "   Run: npm install"
else
    echo "✅ Dependencies installed"
fi

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your credentials"
else
    echo "✅ .env file exists"
    
    # Check if .env has been configured
    if grep -q "your-cloud-name" .env; then
        echo "⚠️  .env file needs configuration"
        echo "   Please edit .env and add your credentials"
    else
        echo "✅ .env appears to be configured"
    fi
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. If dependencies not installed:"
echo "   cd backend && npm install"
echo ""
echo "2. Setup Neon database:"
echo "   - Go to https://neon.tech"
echo "   - Create project and copy connection string"
echo "   - Run the schema: psql <connection-string> -f ../database/schema.sql"
echo ""
echo "3. Setup Cloudinary:"
echo "   - Go to https://cloudinary.com"
echo "   - Copy credentials to .env"
echo ""
echo "4. Setup Gmail App Password:"
echo "   - Go to https://myaccount.google.com/apppasswords"
echo "   - Generate password and add to .env"
echo ""
echo "5. Start the server:"
echo "   cd backend && npm run dev"
echo ""
echo "📖 For detailed instructions, see SETUP.md"
echo ""
