# API Documentation - Winner App

Complete API reference for the Winner crypto lottery platform.

## Base URL

```
http://localhost:3000/api
```

## Authentication

### Register User
**POST** `/auth/register`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "referralCode": "optional-referral-code"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clxx7xzxx",
    "email": "user@example.com",
    "name": "John Doe",
    "referralCode": "unique-code-here"
  }
}
```

**Errors:**
- 400: User already exists
- 400: Email and password required
- 500: Server error

---

### Sign In
**POST** `/auth/[...nextauth]/route.ts` (via NextAuth)

Use the NextAuth.js sign-in page at `/auth/signin` or call with:

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## User Profile

### Get Profile
**GET** `/user/profile`

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200):**
```json
{
  "id": "clxx7xzxx",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "referralCode": "ref_123456",
  "referralCount": 5,
  "wallet": {
    "balance": "1500.50",
    "cryptoAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42aE"
  }
}
```

**Errors:**
- 401: Unauthorized (not logged in)
- 404: Profile not found
- 500: Server error

---

## Wallet Management

### Get Deposit Address
**GET** `/wallet/deposit`

Retrieve your crypto deposit address.

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200):**
```json
{
  "cryptoAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42aE",
  "balance": "1500.50"
}
```

---

### Webhook: Process Deposit
**POST** `/wallet/deposit`

Receive deposit notifications from crypto payment processors.

**Request Body:**
```json
{
  "txHash": "0x123abc...",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42aE",
  "amount": "100.00",
  "status": "confirmed"
}
```

**Response (200):**
```json
{
  "message": "Deposit processed successfully",
  "transaction": {
    "id": "txn_123",
    "userId": "user_123",
    "type": "DEPOSIT",
    "amount": "100.00",
    "status": "COMPLETED",
    "txHash": "0x123abc...",
    "createdAt": "2025-02-07T10:30:00Z"
  }
}
```

**Errors:**
- 400: Missing required fields
- 404: Wallet not found
- 500: Server error

---

## Transactions

### Get Transaction History
**GET** `/user/transactions?page=1&limit=10`

Retrieve user's transaction history with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "txn_123",
      "userId": "user_123",
      "type": "DEPOSIT",
      "amount": "100.00",
      "status": "COMPLETED",
      "txHash": "0x...",
      "description": "Crypto deposit",
      "createdAt": "2025-02-07T10:30:00Z"
    },
    {
      "id": "txn_124",
      "userId": "user_123",
      "type": "ENTRY_PURCHASE",
      "amount": "10.00",
      "status": "COMPLETED",
      "description": "Purchased 1 entry for Draw Title",
      "createdAt": "2025-02-07T11:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Transaction Types:**
- DEPOSIT: Crypto deposit
- WITHDRAWAL: Withdraw funds
- ENTRY_PURCHASE: Buy draw entry
- PRIZE_WIN: Won a prize
- REFERRAL_BONUS: Referral bonus

**Transaction Status:**
- PENDING: Processing
- COMPLETED: Successfully completed
- FAILED: Failed transaction
- CANCELLED: User cancelled

---

## Draws

### List Active Draws
**GET** `/draws`

Get all currently active and upcoming draws.

**Response (200):**
```json
[
  {
    "id": "draw_123",
    "title": "Grand Prize Draw",
    "description": "Win up to 10,000 USDT",
    "entryPrice": "50.00",
    "maxEntries": 1000,
    "currentEntries": 350,
    "status": "ACTIVE",
    "startDate": "2025-02-01T00:00:00Z",
    "endDate": "2025-02-28T23:59:59Z",
    "drawDate": "2025-03-01T20:00:00Z",
    "firstPrizeImage": "https://...",
    "prizes": [
      {
        "position": 1,
        "name": "First Prize",
        "description": "",
        "prizeAmount": "5000.00",
        "imageUrl": "https://..."
      },
      {
        "position": 2,
        "name": "Second Prize",
        "prizeAmount": "2000.00"
      }
    ]
  }
]
```

---

### Get Draw Details
**GET** `/draws/[id]`

Get detailed information about a specific draw.

**Parameters:**
- `id`: Draw ID (required)

**Response (200):**
```json
{
  "id": "draw_123",
  "title": "Grand Prize Draw",
  "description": "Win up to 10,000 USDT",
  "entryPrice": "50.00",
  "maxEntries": 1000,
  "currentEntries": 350,
  "status": "ACTIVE",
  "drawDate": "2025-03-01T20:00:00Z",
  "prizes": [
    {
      "position": 1,
      "name": "First Prize",
      "prizeAmount": "5000.00"
    }
  ]
}
```

**Errors:**
- 404: Draw not found
- 500: Server error

---

### Enter a Draw
**POST** `/draws/[id]/enter`

Purchase one or more entries for a draw.

**Parameters:**
- `id`: Draw ID (required)

**Request Body:**
```json
{
  "quantity": 2
}
```

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200):**
```json
{
  "message": "Entries purchased successfully",
  "entries": [
    {
      "id": "entry_456",
      "userId": "user_123",
      "drawId": "draw_123",
      "ticketNumber": "TKT7x9k2m1"
    },
    {
      "id": "entry_457",
      "userId": "user_123",
      "drawId": "draw_123",
      "ticketNumber": "TKT8x9k2m2"
    }
  ]
}
```

**Errors:**
- 400: Draw not active
- 400: Insufficient balance
- 400: Not enough entries available
- 401: Unauthorized
- 404: Draw not found
- 500: Server error

---

### Get Draw History
**GET** `/draws/history`

Get completed draws and winners.

**Response (200):**
```json
[
  {
    "id": "draw_100",
    "title": "February Draw 2025",
    "drawDate": "2025-02-28T20:00:00Z",
    "status": "COMPLETED",
    "winners": [
      {
        "id": "winner_1",
        "position": 1,
        "userId": "user_456",
        "ticketNumber": "TKT1a2b3c4d",
        "prizeAmount": "5000.00"
      },
      {
        "id": "winner_2",
        "position": 2,
        "userId": "user_789",
        "prizeAmount": "2000.00"
      }
    ],
    "prizes": [
      {
        "position": 1,
        "name": "Grand Prize",
        "prizeAmount": "5000.00"
      }
    ]
  }
]
```

---

## Referrals

### Get Referral Information
**GET** `/user/referrals`

Get referral code, link, and referral statistics.

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200):**
```json
{
  "referralCode": "ref_a1b2c3d4e5f6",
  "referralCount": 5,
  "totalBonus": "25.00",
  "referralLink": "http://localhost:3000/auth/signup?ref=ref_a1b2c3d4e5f6",
  "referrals": [
    {
      "id": "user_789",
      "email": "friend1@example.com",
      "name": "Friend One",
      "createdAt": "2025-02-05T10:30:00Z"
    },
    {
      "id": "user_890",
      "email": "friend2@example.com",
      "name": "Friend Two",
      "createdAt": "2025-02-04T15:20:00Z"
    }
  ]
}
```

---

## Admin Endpoints

### Create Draw
**POST** `/draws`

Create a new draw (admin only).

**Headers:**
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Grand Prize Draw",
  "description": "Win up to 10,000 USDT",
  "entryPrice": "50.00",
  "maxEntries": 1000,
  "startDate": "2025-02-01T00:00:00Z",
  "endDate": "2025-02-28T23:59:59Z",
  "drawDate": "2025-03-01T20:00:00Z",
  "firstPrizeImage": "https://example.com/image.jpg",
  "prizes": [
    {
      "position": 1,
      "name": "First Prize",
      "description": "Grand prize",
      "prizeAmount": "5000.00",
      "imageUrl": "https://..."
    },
    {
      "position": 2,
      "name": "Second Prize",
      "prizeAmount": "2000.00"
    }
  ]
}
```

**Response (200):**
```json
{
  "id": "draw_123",
  "title": "Grand Prize Draw",
  "entryPrice": "50.00",
  "status": "UPCOMING",
  "prizes": [...]
}
```

**Errors:**
- 401: Unauthorized (not admin)
- 400: Validation error
- 500: Server error

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Description of what went wrong"
}
```

**Common HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 404: Not found
- 500: Server error

---

## Rate Limiting

Currently no rate limiting is configured. For production, implement:
- 100 requests per minute per IP
- 10 registrations per hour per IP
- 100 draw entries per minute per user

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
```
?page=1&limit=20
```

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Examples

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Using JavaScript/Fetch

```javascript
// Register
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// Get profile
const profileResponse = await fetch('/api/user/profile');
const profile = await profileResponse.json();
console.log(profile);

// Enter draw
const enterResponse = await fetch('/api/draws/draw_id/enter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 2 })
});
```

---

## WebSocket/Real-time (Future)

Currently not implemented. Consider adding:
- Real-time draw countdown updates
- Live participant count
- Instant balance updates
- Draw result notifications

---

Last Updated: February 2025
