#!/bin/bash

# Setup script for Skillz registry database

set -e

echo "🗄️ Setting up Skillz Database"
echo "=============================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "1️⃣ Creating D1 database..."
cd server

# Create D1 database
wrangler d1 create skillz-registry

echo ""
echo "✅ Database created!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the database_id from above"
echo "   2. Update server/wrangler.toml with the database_id"
echo ""
echo "2️⃣ Run migrations:"
echo ""
echo "   cd server"
echo "   pnpm run db:migrate:local"
echo ""
echo "   # Or manually:"
echo "   wrangler d1 execute skillz-registry --file=./db/migrations/0000_*.sql --local"
echo ""
echo "3️⃣ Seed demo data:"
echo ""
echo "   cd server"
echo "   pnpm run db:seed"
echo ""
echo "4️⃣ Create R2 bucket:"
echo ""
echo "   wrangler r2 bucket create skillz-packages"
echo ""
echo "5️⃣ Start the development server:"
echo ""
echo "   pnpm dev"
echo ""
