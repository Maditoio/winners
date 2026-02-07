# Winner App - Complete Setup Guide

## 🎯 Project Overview

Winner is a modern web application for managing crypto lottery draws powered by Next.js and PostgreSQL. Users can participate in draws, deposit USDT, and earn referral bonuses.

## 📋 What's Included

### Core Features Implemented:

1. **✅ User Authentication**
   - Email/password registration and login
   - Password hashing with bcryptjs
   - Session management with NextAuth.js
   - Protected routes with middleware

2. **✅ Crypto Wallet System**
   - Unique wallet address for each user
   - QR code generation for easy deposits
   - Balance tracking
   - Transaction history

3. **✅ Draw System**
   - Create draws with admin panel
   - Customizable entry prices
   - Max entries limit
   - Countdown timers
   - Prize configuration (1st, 2nd, 3rd, nth place)

4. **✅ Participation**
   - Purchase multiple entries
   - Balance validation
   - Entry tracking
   - Draw history viewing

5. **✅ Referral System**
   - Unique referral code per user
   - Referral link generation
   - 5 USDT bonus for successful referrals
   - Referral tracking dashboard

6. **✅ Admin Panel**
   - Create new draws
   - Set draw dates and prices
   - Configure prizes with images
   - Set entry limits

7. **✅ Prize Management**
   - Multiple prize tiers
   - Prize images and descriptions
   - Prize amounts
   - Winner tracking

## 🛠️ Tech Stack

```
Frontend:
- Next.js 16.1.6
- React 19.2.3
- TypeScript
- Tailwind CSS 4
- QRCode.js

Backend:
- Next.js API Routes
- NextAuth.js 4.24.13

Database:
- PostgreSQL
- Prisma 7.3.0 ORM

Security:
- bcryptjs for password hashing
- NextAuth.js for session management
```

## 📁 Project Structure

```
winner/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── draws/
│   │   │   ├── route.ts (GET all, POST create)
│   │   │   ├── [id]/route.ts (GET details)
│   │   │   ├── [id]/enter/route.ts (POST enter draw)
│   │   │   └── history/route.ts (GET history)
│   │   ├── user/
│   │   │   ├── profile/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   └── referrals/route.ts
│   │   └── wallet/
│   │       └── deposit/route.ts
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── draws/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Providers.tsx
│   ├── Navbar.tsx
│   ├── CountdownTimer.tsx
│   └── DrawCard.tsx
├── lib/
│   ├── prisma.ts
│   └── auth.ts
├── types/
│   └── next-auth.d.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── middleware.ts
├── .env
├── .env.example
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL 12+
- Terminal/Command line access

### Step 1: Install Dependencies
Already completed. Dependencies include:
- Next.js, React, TypeScript
- NextAuth.js for authentication
- Prisma for database ORM
- Tailwind CSS for styling
- bcryptjs for password hashing
- qrcode for QR generation
- nanoid for unique IDs

### Step 2: Configure Database

#### Option A: Local PostgreSQL (macOS)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb winner_db

# Update .env with connection
DATABASE_URL="postgresql://username:password@localhost:5432/winner_db"
```

#### Option B: Docker
```bash
docker run --name winner-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=winner_db -p 5432:5432 -d postgres:15

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/winner_db"
```

#### Option C: Cloud Services
- **Supabase**: https://supabase.com (free tier available)
- **Railway**: https://railway.app
- **Neon**: https://neon.tech
- Use their connection string in .env

### Step 3: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# This will create all tables based on schema.prisma
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

### Step 5: Create Admin Account

1. Sign up at `http://localhost:3000/auth/signup`
2. Note your email address
3. Connect to your database:

```bash
psql winner_db

# Run this SQL (replace email)
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';

# Verify
SELECT email, role FROM "User";
```

## 🔐 Security Setup

### Important: Change Secrets in Production!

1. **NEXTAUTH_SECRET**: Generate a random string
```bash
openssl rand -base64 32
# Output example: B1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w=
```

2. Update `.env`:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. For production, also update:
   - NEXTAUTH_URL to your domain
   - Database connection string
   - Enable HTTPS only

## 📱 Using the Application

### For Users:

1. **Sign Up**
   - Go to `/auth/signup`
   - Enter email, password, optional name
   - Optionally enter a referral code
   - Account and wallet created automatically

2. **Deposit USDT**
   - Go to `/profile`
   - Copy your crypto address or scan QR code
   - Send USDT from a crypto wallet (Metamask, Trust Wallet, etc.)
   - Balance updates automatically

3. **Participate in Draws**
   - View active draws at `/draws`
   - Click "Enter Draw"
   - Select quantity of entries
   - Confirm purchase (deducts from balance)
   - Get unique ticket numbers

4. **Check History**
   - View past winners at `/history`
   - See all prize tiers
   - View winner information

5. **Referrals**
   - Share referral link from `/profile`
   - Get 5 USDT bonus per signup
   - Track referrals in profile

### For Admins:

1. **Access Admin Panel**
   - Go to `/admin`
   - Only available to admin accounts

2. **Create a Draw**
   - Fill in draw title and description
   - Set entry price in USDT
   - Set max entries (optional)
   - Choose start, end, and draw dates
   - Add prize tiers with details
   - Click "Create Draw"

3. **After Draw**
   - Update draw status in database
   - Add winners through database
   - Winners see results in history

## 🔗 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/signin (via NextAuth)
```

### User Profile
```
GET /api/user/profile
GET /api/user/transactions
GET /api/user/referrals
```

### Wallet
```
GET /api/wallet/deposit (get address)
POST /api/wallet/deposit (webhook for deposits)
```

### Draws
```
GET /api/draws (list active)
POST /api/draws (create - admin only)
GET /api/draws/[id] (get details)
POST /api/draws/[id]/enter (enter draw)
GET /api/draws/history (completed draws)
```

## 🗄️ Database Models

### User
- id, email, password, name, role
- referralCode, referrals, referredBy
- Relations: wallet, entries, transactions

### Wallet
- id, userId, balance, cryptoAddress
- Stores user's crypto balance and deposit address

### Draw
- id, title, description, entryPrice
- status, dates, maxEntries, currentEntries
- Relations: entries, winners, prizes

### Entry
- id, userId, drawId, ticketNumber
- Track user participation in draws

### Transaction
- id, userId, type, amount, status
- DEPOSIT, WITHDRAWAL, ENTRY_PURCHASE, PRIZE_WIN, REFERRAL_BONUS

### Winner
- id, drawId, userId, position, prizeAmount
- Track draw winners and prize amounts

### Prize
- id, drawId, position, name, prizeAmount
- Define prize tiers for each draw

## 🔄 Crypto Deposit Webhook Setup

The app includes a webhook endpoint for automatic deposit processing:

```
POST /api/wallet/deposit
Body: {
  "txHash": "0x...",
  "toAddress": "0x...",
  "amount": "100.00",
  "status": "confirmed"
}
```

### To Integrate Real Crypto Payments:

1. Use a service like:
   - Coinbase Commerce
   - NOWPayments
   - Moralis Web3
   - Chainlink Functions

2. Configure webhook in their dashboard to call your endpoint

3. Service will notify your app when deposits arrive

4. Balance updates automatically in user wallet

## 📊 Monitor Your App

### Using Prisma Studio:
```bash
npm run db:studio
```
Opens: `http://localhost:5555`

View and edit database directly!

### Check Logs:
```bash
# Terminal logs while running
npm run dev

# Check recent entries
tail -f .next/server/logs.log
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql winner_db

# Reset migrations
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

### Authentication Issues
- Clear browser cookies
- Check NEXTAUTH_SECRET value
- Verify database has User table
- Check /api/auth/signin endpoint

### Port Already in Use
```bash
npm run dev -- -p 3001
```

### Prisma Client Errors
```bash
rm -rf node_modules/.prisma
npm run db:generate
```

## 📈 Next Steps for Production

1. **Set up payment processing**
   - Integrate Coinbase Commerce or NOWPayments
   - Configure webhook for auto-deposits

2. **Deploy to production**
   - Vercel (recommended for Next.js)
   - AWS, Railway, or your own server
   - Update environment variables

3. **Security checklist**
   - [ ] Change all secrets
   - [ ] Enable HTTPS
   - [ ] Set up SSL certificate
   - [ ] Configure CORS
   - [ ] Enable rate limiting
   - [ ] Set up logging/monitoring

4. **Performance**
   - [ ] Enable caching
   - [ ] Optimize images
   - [ ] Set up CDN
   - [ ] Database indexes

5. **Features to add**
   - [ ] Email verification
   - [ ] 2FA authentication
   - [ ] Withdrawal system
   - [ ] Mobile app
   - [ ] Advanced analytics
   - [ ] Multi-language support

## 📞 Support & Documentation

- **Prisma**: https://www.prisma.io/docs
- **Next.js**: https://nextjs.org/docs
- **NextAuth**: https://next-auth.js.org
- **Tailwind CSS**: https://tailwindcss.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs

## 📄 License

MIT License - Feel free to use and modify!

---

Happy building! 🚀

Need help? Check the README.md for additional information.
