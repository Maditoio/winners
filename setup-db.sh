#!/bin/bash
# Database Setup Script for Winner App
# Run this script to automatically set up your database

set -e

echo "🚀 Winner App - Database Setup"
echo "=============================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS: brew install postgresql@15"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✓ PostgreSQL found"
echo ""

# Create database
echo "📦 Creating database 'winner_db'..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'winner_db'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE winner_db;"
echo "✓ Database created"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate
echo "✓ Prisma Client generated"
echo ""

# Run migrations
echo "📝 Running database migrations..."
npm run db:migrate -- --name init
echo "✓ Migrations completed"
echo ""

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the dev server: npm run dev"
echo "2. Open http://localhost:3000"
echo "3. Create an account"
echo "4. (Optional) Make your account an admin in the database:"
echo "   psql winner_db"
echo "   UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your-email@example.com';"
echo ""
