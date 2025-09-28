#!/bin/bash

echo "🚀 Setting up MuseMarket Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Copy environment file
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please update .env with your actual configuration"
else
    echo "✅ .env file already exists"
fi

# Create dist directory
echo "📁 Creating dist directory..."
mkdir -p dist

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Start MongoDB"
echo "3. Run: npm run dev"
