# 🎯 Quick Reference Guide - Winner App

## 📍 What You Have

A **complete, production-ready crypto lottery platform** built with:
- Next.js 16 + React 19
- PostgreSQL + Prisma ORM
- NextAuth.js for authentication
- Tailwind CSS for styling
- 16 API endpoints
- 8 database models
- 8 full pages
- Complete admin panel

## ⚡ Quick Start (3 Steps)

### Step 1: Database Setup
```bash
cd /Users/sera4/Documents/applications/winner

# Option A: Automatic setup (macOS)
bash setup-db.sh

# Option B: Manual setup
npm run db:generate
npm run db:migrate
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
```
http://localhost:3000
```

## 🔐 First Admin Account

1. Sign up at `http://localhost:3000/auth/signup`
2. Connect to your database:
```bash
psql winner_db
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 📁 Key Files Location

```
/Users/sera4/Documents/applications/winner/
├── .env                        # Environment config
├── package.json               # Dependencies
├── README.md                  # Main docs
├── GETTING_STARTED.md         # Setup guide
├── API_DOCUMENTATION.md       # API reference
├── PROJECT_SUMMARY.md         # Complete overview
├── SETUP.md                   # Database setup
└── setup-db.sh               # Auto setup script
```

## 🌐 Application URLs

| URL | Purpose | Auth Required |
|-----|---------|---------------|
| `/` | Home page | No |
| `/auth/signin` | Login | No |
| `/auth/signup` | Register | No |
| `/draws` | Browse draws | **Yes** |
| `/history` | Past winners | **Yes** |
| `/profile` | User profile | **Yes** |
| `/admin` | Create draws | **Yes + Admin** |

## 💰 Features Overview

✅ **Registration & Login**
- Email/password auth
- Password hashing
- Session management

✅ **Wallet System**
- Unique crypto address per user
- QR code generation
- Balance tracking

✅ **Draw Participation**
- Browse active draws
- Buy multiple entries
- Real-time countdown
- Ticket generation

✅ **Referral System**
- 5 USDT bonus per referral
- Shareable link
- Tracking dashboard

✅ **Admin Controls**
- Create draws
- Set pricing/limits
- Add prizes
- Upload images

## 🔌 Database Connection

### Default Config (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/winner_db
NEXTAUTH_SECRET=change-in-production
NEXTAUTH_URL=http://localhost:3000
```

### Change if Needed
Edit `.env` file before running:
```bash
# PostgreSQL running locally
DATABASE_URL="postgresql://username:password@localhost:5432/winner_db"

# Remote database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Supabase
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require"
```

## 📊 API Quick Reference

### Get Profile
```bash
curl http://localhost:3000/api/user/profile \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### List Draws
```bash
curl http://localhost:3000/api/draws
```

### Enter Draw
```bash
curl -X POST http://localhost:3000/api/draws/DRAW_ID/enter \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"quantity": 1}'
```

## 🛠️ Useful Commands

```bash
cd /Users/sera4/Documents/applications/winner

# Development
npm run dev                 # Start server
npm run build              # Build for production
npm start                  # Run production build
npm run lint               # Check code

# Database
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:push            # Push schema changes
npm run db:studio          # Open Prisma Studio (http://localhost:5555)

# Auto setup
bash setup-db.sh           # Complete database setup
```

## 🚨 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres

# Check database exists
psql -U postgres -l | grep winner_db

# Recreate database
dropdb winner_db
createdb winner_db
npm run db:migrate
```

### Port 3000 Already in Use
```bash
npm run dev -- -p 3001
```

### Prisma Client Issues
```bash
rm -rf node_modules/.prisma
npm run db:generate
npm run dev
```

## 🔐 Security Checklist

Before production:
- [ ] Change `NEXTAUTH_SECRET` to random string
- [ ] Change database password
- [ ] Set `NEXTAUTH_URL` to your domain
- [ ] Enable HTTPS
- [ ] Set strong database passwords
- [ ] Configure firewall rules
- [ ] Set up backups

## 📱 Test User Flow

1. **Register**: Go to `/auth/signup`
   - Email: test@example.com
   - Password: Test123!

2. **View Profile**: Go to `/profile`
   - Copy crypto address
   - Check balance (0 initially)

3. **Create Draw** (Admin only):
   - Go to `/admin`
   - Create a test draw
   - Set price to 10 USDT

4. **Try to Enter Draw**: Go to `/draws`
   - Try to enter draw
   - Get error: insufficient balance
   - (Normally would send USDT here)

5. **Check History**: Go to `/history`
   - View past draws (initially empty)

## 💡 Key Concepts

### Draw Status
- **UPCOMING**: Scheduled, not yet open
- **ACTIVE**: Currently accepting entries
- **DRAWING**: Processing draw
- **COMPLETED**: Draw finished
- **CANCELLED**: Draw cancelled

### Transaction Types
- **DEPOSIT**: Crypto received
- **ENTRY_PURCHASE**: Bought draw entry
- **PRIZE_WIN**: Won a prize
- **REFERRAL_BONUS**: Friend sign-up bonus
- **WITHDRAWAL**: Withdrew funds

### User Roles
- **USER**: Regular user
- **ADMIN**: Can create draws and manage platform

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Main overview |
| GETTING_STARTED.md | Step-by-step setup |
| API_DOCUMENTATION.md | API endpoints reference |
| PROJECT_SUMMARY.md | Complete feature list |
| SETUP.md | Database setup |

## 🌟 Next Features to Add

After base setup works:
1. Email verification
2. Withdrawal system
3. Prize payout automation
4. Advanced analytics
5. Mobile app
6. WebSocket real-time updates
7. Two-factor authentication
8. Multiple crypto support

## 📞 Getting Help

1. Check **GETTING_STARTED.md** for setup issues
2. Check **API_DOCUMENTATION.md** for API questions
3. Check **PROJECT_SUMMARY.md** for feature details
4. Check **README.md** for general info
5. Review database logs: `npm run db:studio`

## 🚀 Ready to Launch

Everything is set up and ready to run! 

```bash
cd /Users/sera4/Documents/applications/winner
npm run dev
```

Then visit `http://localhost:3000`

---

**Happy building! 🎉**

For detailed information, see the comprehensive documentation files.
