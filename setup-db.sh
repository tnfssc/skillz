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
cd apps/api

# Create D1 database
wrangler d1 create skillz-registry

echo ""
echo "✅ Database created!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the database_id from above"
echo "   2. Update apps/api/wrangler.toml with the database_id"
echo "   3. Update apps/web/wrangler.toml with the database_id"
echo ""
echo "2️⃣ Run the following commands to set up the database:"
echo ""
echo "   # Generate migrations"
echo "   cd packages/db"
echo "   pnpm drizzle-kit generate"
echo ""
echo "   # Apply migrations"
echo "   cd ../../apps/api"
echo "   wrangler d1 execute skillz-registry --file=../../packages/db/migrations/0000_*.sql --local"
echo ""
echo "   # Seed demo data"
echo "   wrangler d1 execute skillz-registry --file=../../packages/db/seed.sql --local"
echo ""
echo "3️⃣ Create R2 bucket:"
echo ""
echo "   wrangler r2 bucket create skillz-packages"
echo ""
echo "4️⃣ Start the development servers:"
echo ""
echo "   # API"
echo "   cd apps/api && pnpm dev"
echo ""
echo "   # Web"
echo "   cd apps/web && pnpm dev"
echo ""
