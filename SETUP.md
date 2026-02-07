# Setup Instructions

## Quick Start

1. Copy the environment variables:
```bash
cp .env.example .env
```

2. Update `.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/winner_db"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. Generate a secret for NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

4. Set up the database:
```bash
# Create the database
createdb winner_db

# Or using psql
psql -U postgres -c "CREATE DATABASE winner_db;"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

5. Run the development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

7. Create an account and then make it admin:
```bash
# Connect to your database
psql winner_db

# Update user role to ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Database Setup Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb winner_db
```

### Option 2: Docker PostgreSQL
```bash
docker run --name winner-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=winner_db -p 5432:5432 -d postgres
```

### Option 3: Cloud Database
Use services like:
- Supabase (free tier available)
- Railway
- Neon
- Heroku Postgres

## Troubleshooting

If you get Prisma errors:
```bash
npx prisma generate
npx prisma migrate reset
```

If port 3000 is busy:
```bash
npm run dev -- -p 3001
```
