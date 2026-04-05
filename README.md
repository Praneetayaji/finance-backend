# Finance Dashboard Backend

A RESTful backend for a finance dashboard system with role-based access control, financial record management, and summary analytics.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js + Express | Lightweight, widely used, fast to iterate |
| Database | PostgreSQL | Relational model fits structured financial data |
| ORM | Prisma | Type-safe queries, clean migrations, great DX |
| Auth | JWT (Bearer tokens) | Stateless, simple to implement and test |
| Validation | Zod | Schema-first, composable, great error messages |
| Passwords | bcryptjs | Industry standard for hashing |

---

## Project Structure

```
finance-backend/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.js              # Sample data
├── src/
│   ├── config/
│   │   └── db.js            # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.js          # JWT verification middleware
│   │   └── rbac.js          # Role-based access control guards
│   ├── modules/
│   │   ├── auth/            # Register, login, /me
│   │   ├── users/           # User management (Admin only)
│   │   ├── records/         # Financial records CRUD
│   │   └── dashboard/       # Aggregated analytics
│   ├── utils/
│   │   └── errors.js        # Custom error classes
│   └── app.js               # Express app + error handler
└── .env.example
```

Each feature is a self-contained module: `routes → controller → service`. Controllers handle HTTP parsing and validation; services contain business logic and database queries.

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a connection string)

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd finance-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in your DATABASE_URL and JWT_SECRET

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed with sample data + test users
npm run db:seed

# 5. Start the server
npm run dev       # development (nodemon)
npm start         # production
```

The server starts at `http://localhost:3000`.

---

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

---

## Roles & Permissions

| Action | VIEWER | ANALYST | ADMIN |
|---|:---:|:---:|:---:|
| Login / Register | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ (own data) | ✅ (all data) |
| View records | ❌ | ✅ (own only) | ✅ (all) |
| Create records | ❌ | ✅ | ✅ |
| Update records | ❌ | ✅ (own only) | ✅ (all) |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

**Note on data scoping:** ANALYST users see only their own records and their own aggregated dashboard data. VIEWER users can only access the dashboard summary (useful for read-only stakeholders).

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new account (defaults to VIEWER role) |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | All | Get current user info |

**Register / Login body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

---

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id/role` | Update a user's role |
| PATCH | `/api/users/:id/status` | Activate or deactivate a user |

**Update role body:**
```json
{ "role": "ANALYST" }
```

**Update status body:**
```json
{ "isActive": false }
```

---

### Records (ANALYST + ADMIN)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/records` | List records with optional filters |
| GET | `/api/records/:id` | Get a single record |
| POST | `/api/records` | Create a new record |
| PATCH | `/api/records/:id` | Update a record |
| DELETE | `/api/records/:id` | Soft-delete a record (ADMIN only) |

**Query parameters for GET /api/records:**
```
type        INCOME | EXPENSE
category    partial match, case-insensitive
startDate   ISO date string (e.g. 2024-01-01)
endDate     ISO date string
page        default 1
limit       default 20, max 100
```

**Create / Update record body:**
```json
{
  "amount": 1500.00,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-03-15",
  "notes": "March salary payment"
}
```

---

### Dashboard (All roles)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance, recent activity |
| GET | `/api/dashboard/categories` | Totals grouped by category |
| GET | `/api/dashboard/trends?months=6` | Monthly income/expense trends |

**Sample summary response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 13000.00,
    "totalExpenses": 2100.50,
    "netBalance": 10899.50,
    "incomeCount": 4,
    "expenseCount": 4,
    "recentActivity": [...]
  }
}
```

---

## Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@finance.com | admin123 |
| Analyst | analyst@finance.com | analyst123 |
| Viewer | viewer@finance.com | viewer123 |

---

## Error Handling

All errors return a consistent shape:
```json
{
  "success": false,
  "error": "Human readable message"
}
```

| Status | Meaning |
|---|---|
| 400 | Validation error (bad input) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Unexpected server error |

---

## Assumptions & Design Decisions

1. **New registrations default to VIEWER.** Only an Admin can elevate a user's role. This prevents privilege escalation through self-registration.

2. **Soft deletes only.** Financial records are never physically removed — `isDeleted` is flipped to `true`. This preserves audit history and reflects real-world finance systems.

3. **ANALYSTs are scoped to their own data.** An analyst can only read, create, and update their own records. Dashboard data is also scoped to their own records. ADMINs see everything.

4. **VIEWER dashboard shows global aggregates.** VIEWERs are intended for stakeholders who need high-level visibility but no record-level access.

5. **JWT only, no refresh tokens.** Kept simple for this scope. In production you'd add short-lived access tokens + refresh token rotation.

6. **No rate limiting.** Would add `express-rate-limit` in production to protect auth endpoints from brute force.

7. **Decimal precision.** Amounts are stored as `Decimal(12, 2)` in PostgreSQL — never as floats — to avoid rounding errors in financial calculations.

---

## Tradeoffs Considered

- **Prisma vs raw SQL:** Prisma adds a build step (`prisma generate`) but gives type-safe queries and easy migrations. For a project of this size it's the right call.
- **In-process aggregations vs DB-level:** Monthly trends are grouped in JavaScript (not SQL GROUP BY on date parts) for portability. At scale, a raw SQL query would be faster.
- **Single JWT secret:** A production system would rotate secrets and support token revocation (via a blocklist or short expiry).
