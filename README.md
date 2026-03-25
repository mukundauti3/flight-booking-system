# SkyBooker ✈ — Flight Ticket Booking System

> **Production-grade full-stack web application** for domestic & international flight booking.
> Built with React, Node.js, .NET 8, MySQL, and Razorpay.

[![CI/CD](https://github.com/YOUR_USERNAME/skybooker/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/skybooker/actions)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-18-blue)
![.NET](https://img.shields.io/badge/.NET-8-purple)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)

---

## Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Quick Start (Local)](#quick-start-local)
6. [Docker Deployment](#docker-deployment)
7. [Environment Variables](#environment-variables)
8. [API Reference](#api-reference)
9. [Security](#security)
10. [Testing](#testing)
11. [CI/CD](#cicd)
12. [Production Checklist](#production-checklist)

---

## Features

| Category | Details |
|---|---|
| **Auth** | JWT, bcrypt (salt 12), role-based (User / Admin) |
| **Flight Search** | Domestic & International, filter by origin/dest/date/price, sort by price/duration/departure |
| **Seat Selection** | Interactive 3-3 seat map, Economy & Business class, real-time lock (30-min TTL) |
| **Booking** | Multi-passenger, seat locking, 2-hour cancellation window |
| **Payments** | Razorpay — UPI, Cards, NetBanking, Wallets. HMAC-SHA256 verification |
| **E-Tickets** | PDF boarding pass (pdfkit), QR code, per-passenger, email delivery |
| **Admin** | Flight/airline CRUD, analytics dashboard, booking & user management |
| **Security** | Helmet, CORS, rate limiting, parameterized SQL, input validation, XSS headers |
| **Testing** | Jest + Supertest, GitHub Actions CI/CD |
| **Deployment** | Docker Compose — 4 services (MySQL, Node, .NET, Nginx) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (React + Vite)                 │
│       Bootstrap 5  ·  Dark Theme  ·  CSS Animations      │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS (Nginx reverse proxy)
┌───────────────────▼─────────────────────────────────────┐
│           Node.js / Express — Port 5000                  │
│  Auth · Flights · Bookings · Tickets · Admin · Uploads   │
│  JWT Auth  ·  express-validator  ·  helmet  ·  CORS      │
└──────┬───────────────────────────────┬───────────────────┘
       │ mysql2/promise (pool)         │ Axios (internal API key)
       ▼                               ▼
┌──────────────┐               ┌────────────────────────┐
│  MySQL 8.0   │               │ .NET 8 Payment Service  │
│ 13 tables    │               │  Razorpay SDK           │
│ schema.sql   │               │  EF Core (Pomelo)       │
│ seed.sql     │               │  MailKit SMTP           │
└──────────────┘               └────────────────────────┘
```

### Request Flow — Booking + Payment
```
1. User selects seats  →  POST /api/bookings (seat lock, 30 min)
2. Backend creates booking (Pending)  →  returns bookingId
3. Frontend calls  POST /api/payments/create-order
4. Node.js proxies to  .NET POST /payment/create-order  →  Razorpay order
5. Browser opens Razorpay popup
6. User completes payment  →  Razorpay calls handler(response)
7. Frontend calls  POST /api/payments/verify
8. Node.js proxies to  .NET POST /payment/verify  (HMAC-SHA256)
9. .NET confirms → Node.js updates booking to Confirmed
10. PDF generated · Email sent · Seats permanently booked
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Bootstrap 5, Axios, react-toastify |
| **Backend** | Node.js 20, Express 4, mysql2/promise, bcryptjs, jsonwebtoken |
| **PDF / Email** | pdfkit, qrcode, nodemailer |
| **Payment Service** | .NET 8, ASP.NET Core Web API, Razorpay .NET SDK, EF Core, MailKit, Serilog |
| **Database** | MySQL 8.0 — 13 normalized tables |
| **Infra** | Docker, Docker Compose, Nginx, GitHub Actions |

---

## Project Structure

```
Vipul_Cdac_Project/
├── backend/                    # Node.js API
│   ├── config/db.js            # MySQL connection pool
│   ├── middleware/             # auth.js, errorHandler.js, validate.js, upload.js
│   ├── repositories/           # userRepo, flightRepo, bookingRepo, paymentRepo, ticketRepo
│   ├── services/               # authService, flightService, bookingService, paymentService, ticketService
│   ├── controllers/            # authController, flightController, bookingController, paymentController, ticketController, adminController
│   ├── routes/                 # authRoutes, flightRoutes, bookingRoutes, paymentRoutes, ticketRoutes, adminRoutes
│   ├── utils/                  # AppError.js, helpers.js, ticketPdf.js, emailService.js
│   ├── __tests__/              # auth.test.js, flights.test.js
│   ├── uploads/                # generated PDFs, logos, images (gitignored except .gitkeep)
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/         # Navbar, Footer, FlightCard, SeatMap, LoadingSpinner
│   │   ├── context/            # AuthContext.jsx
│   │   ├── pages/              # Home, Login, Register, FlightSearch, SeatSelection,
│   │   │   │                   # BookingConfirmation, BookingHistory, BookingDetails, TicketView
│   │   │   └── admin/          # AdminDashboard, AdminFlights, AdminBookings, AdminUsers
│   │   ├── services/api.js     # Axios service layer (all API modules)
│   │   ├── App.jsx             # Router + Guards (PrivateRoute, AdminRoute)
│   │   ├── main.jsx
│   │   └── index.css           # Premium dark theme + animations
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── payment-service/            # .NET 8 Microservice
│   ├── Controllers/            # PaymentController, WebhookController
│   ├── Services/               # RazorpayService, EmailService
│   ├── Models/                 # Payment.cs, Requests.cs
│   ├── Data/                   # PaymentDbContext.cs
│   ├── Middleware/             # ApiKeyMiddleware.cs
│   ├── Program.cs
│   └── appsettings.json
│
├── database/
│   ├── schema.sql              # 13-table MySQL schema
│   └── seed.sql                # Airports, airlines, flights, users
│
├── docs/
│   ├── PHASE1_ARCHITECTURE.md
│   ├── PHASE2_DATABASE.md
│   └── PHASE3_BACKEND.md
│
├── .github/workflows/ci-cd.yml
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quick Start (Local)

### Prerequisites
- **Node.js** 20+ — [nodejs.org](https://nodejs.org)
- **MySQL** 8.0+ — running locally or via Docker
- **.NET SDK** 8.0 — [dotnet.microsoft.com](https://dotnet.microsoft.com)
- **Razorpay Test Keys** — [dashboard.razorpay.com](https://dashboard.razorpay.com) (free account)

### 1. Clone & Database Setup

```bash
git clone https://github.com/YOUR_USERNAME/skybooker.git
cd skybooker

# Create and seed database
mysql -u root -p -e "CREATE DATABASE skybooker_db CHARACTER SET utf8mb4;"
mysql -u root -p skybooker_db < database/schema.sql
mysql -u root -p skybooker_db < database/seed.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, SMTP credentials, Razorpay keys

npm install
npm run dev          # http://localhost:5000
```

### 3. Payment Service Setup

```bash
cd payment-service
# Edit appsettings.json — set Razorpay keys, MySQL connection string, InternalApiKey

dotnet restore
dotnet run           # http://localhost:7000
```

### 4. Frontend Setup

```bash
cd frontend
cp .env .env.local
# Set VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY

npm install
npm run dev          # http://localhost:5173
```

### 5. Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@skybooker.com` | `Admin@1234` |
| User | `vipul@example.com` | `User@1234` |

---

## Docker Deployment

> One command to run the entire stack.

```bash
# 1. Create a .env file at the project root
cat > .env << 'EOF'
DB_USER=skybooker
DB_PASS=skybooker_secret
DB_ROOT_PASSWORD=rootsecret
JWT_SECRET=your_64+_char_random_secret_here
PAYMENT_SERVICE_API_KEY=internal_api_key_here
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_ADDRESS=noreply@skybooker.com
APP_URL=http://localhost
CORS_ORIGIN=http://localhost
EOF

# 2. Build and start all 4 services
docker compose up --build -d

# 3. Check status
docker compose ps

# App is live at: http://localhost
# API at:         http://localhost/api
# DB port:        http://localhost:3306 (only if needed externally)
```

### Stop & Cleanup
```bash
docker compose down          # Stop
docker compose down -v       # Stop + delete volumes (database data)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | ✅ | `5000` |
| `DATABASE_URL` | ✅ | Full MySQL connection string |
| `JWT_SECRET` | ✅ | Min 64 chars, random |
| `JWT_EXPIRES_IN` | ✅ | `7d` |
| `PAYMENT_SERVICE_URL` | ✅ | .NET service base URL |
| `PAYMENT_SERVICE_API_KEY` | ✅ | Internal API key (shared with .NET) |
| `SMTP_HOST` | ✅ | SMTP server host (`test` = Ethereal dev) |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASS` | ✅ | SMTP password / app password |
| `EMAIL_FROM_ADDRESS` | ✅ | Sender address |
| `UPLOAD_MAX_MB` | ❌ | Max upload size (default: `5`) |
| `CORS_ORIGIN` | ❌ | Frontend origin |

### Payment Service (`appsettings.json`)

| Key | Description |
|---|---|
| `Razorpay:KeyId` | Razorpay API Key ID |
| `Razorpay:KeySecret` | Razorpay API Key Secret |
| `Razorpay:WebhookSecret` | Razorpay Webhook Secret |
| `InternalApiKey` | Must match backend `PAYMENT_SERVICE_API_KEY` |
| `NodeApiUrl` | Backend callback URL |

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT token |
| GET | `/api/auth/me` | User | Get own profile |
| PUT | `/api/auth/profile` | User | Update profile |

### Flights
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/flights/search` | Public | Search with filters & sort |
| GET | `/api/flights/:id` | Public | Flight details |
| GET | `/api/flights/:id/seats` | Public | Seat availability map |
| GET | `/api/flights/airports` | Public | All airports |
| GET | `/api/flights/airlines` | Public | All airlines |

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | User | Create booking + lock seats |
| GET | `/api/bookings` | User | List own bookings |
| GET | `/api/bookings/:id` | User | Booking details + passengers |
| PUT | `/api/bookings/:id/cancel` | User | Cancel (2-hour rule) |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-order` | User | Create Razorpay order |
| POST | `/api/payments/verify` | User | Verify + confirm booking |

### Tickets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tickets/:bookingId` | User | Get tickets (formatted for UI) |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/analytics` | Admin | Dashboard stats |
| POST | `/api/admin/flights` | Admin | Create flight |
| PUT | `/api/admin/flights/:id` | Admin | Update flight |
| DELETE | `/api/admin/flights/:id` | Admin | Delete flight |
| GET | `/api/admin/bookings` | Admin | All bookings |
| GET | `/api/admin/users` | Admin | All users |
| GET | `/api/admin/logs` | Admin | Action audit log |

---

## Security

| Mechanism | Implementation |
|---|---|
| **Auth** | JWT HS256, 7-day expiry, stored in localStorage |
| **Passwords** | bcryptjs, salt rounds 12 |
| **SQL Injection** | Parameterized queries (mysql2), EF Core |
| **XSS / Headers** | `helmet` with CSP, HSTS, X-Frame-Options |
| **CORS** | Explicit origin whitelist via env |
| **Rate Limiting** | `express-rate-limit` — 100 req / 15 min per IP |
| **Input Validation** | `express-validator` on all mutating routes |
| **Payment Sig** | HMAC-SHA256 Razorpay signature verification |
| **Webhook Sig** | Raw body + webhook secret verification |
| **Microservice Auth** | `X-Api-Key` header (internal API key) |
| **File Uploads** | MIME type whitelist, size limit, random filenames |
| **Seat Concurrency** | Pessimistic lock with 30-minute DB-level TTL |

---

## Testing

```bash
# Backend unit + integration tests
cd backend
npm test

# With coverage report
npm run test:coverage
```

### Test Coverage Areas
| Suite | Tests |
|---|---|
| `auth.test.js` | Register, duplicate email, weak password, login success/fail, JWT protected route |
| `flights.test.js` | Search filters, sort, SQL injection guard, airport list, admin CRUD + auth |

> Tests run against a **real MySQL test database** — same schema as production, ensuring SQL correctness, not just mocks.

---

## CI/CD

`.github/workflows/ci-cd.yml` runs on every push to `main` / `develop` and pull request to `main`:

```
Push/PR
  │
  ├─► [Job 1] Backend Tests (Ubuntu + MySQL service container)
  │     npm ci → seed test DB → npm test → upload coverage artifact
  │
  ├─► [Job 2] Frontend Build
  │     npm ci → npm run build → upload dist artifact
  │
  ├─► [Job 3] .NET Build
  │     dotnet restore → dotnet build --configuration Release
  │
  └─► [Job 4] Docker Push (main branch only, after all jobs pass)
        Build backend image → push to Docker Hub
        Build frontend image → push to Docker Hub
```

### Required GitHub Secrets
| Secret | Value |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |

---

## Production Checklist

### Before Going Live

- [ ] **Secrets**: Rotate all default keys (`JWT_SECRET`, `PAYMENT_SERVICE_API_KEY`)
- [ ] **Razorpay**: Switch from `rzp_test_*` to `rzp_live_*` keys
- [ ] **HTTPS**: Configure SSL via Let's Encrypt (Certbot) or Cloudflare
- [ ] **CORS**: Set `CORS_ORIGIN` to your actual frontend domain
- [ ] **Email**: Replace Ethereal with real SMTP (Gmail app password or SendGrid)
- [ ] **Database**: Change default MySQL credentials; enable `require_secure_transport`
- [ ] **Rate Limits**: Tune `RATE_LIMIT_MAX` for your expected traffic
- [ ] **Uploads**: Move to object storage (AWS S3 / Cloudflare R2) for persistence
- [ ] **Monitoring**: Add error tracking (Sentry) and APM (New Relic / Datadog)
- [ ] **Backup**: Schedule MySQL daily backups (`mysqldump` or managed DB backups)
- [ ] **Logs**: Configure centralized logging (Loki / CloudWatch)
- [ ] **Razorpay Webhooks**: Register `https://yourdomain.com/api/webhooks/razorpay` in Razorpay dashboard
- [ ] **CSP**: Tighten Content-Security-Policy header in `helmet` config
- [ ] **Seat Lock Cleanup**: Add a cron job to release expired seat locks: `UPDATE flight_seats SET status='Available', locked_by_booking_id=NULL, lock_expires_at=NULL WHERE status='Locked' AND lock_expires_at < NOW()`

### Recommended Infrastructure (AWS)
```
Route 53 → CloudFront (CDN) → ALB
                                ├── ECS Fargate: Node.js Backend
                                ├── ECS Fargate: .NET Payment Service
                                └── S3 + CloudFront: React Frontend (static)
                              RDS MySQL Multi-AZ
                              S3 Bucket: Uploads
                              SES: Transactional Email
                              Secrets Manager: Env variables
```

---

## Database Schema (Summary)

```sql
users          → roles (FK)
airlines       → aircraft
airports
flights        → airlines, airports (origin/dest), aircraft
seats          → aircraft
flight_seats   → flights, seats        -- availability + lock TTL
bookings       → flights, users
booking_passengers → bookings, flight_seats
payments       → bookings              -- Razorpay columns + refund
tickets        → bookings, booking_passengers, flight_seats
audit_logs     → users
```

Full schema: [`database/schema.sql`](./database/schema.sql)

---

## License

MIT — Free to use for educational purposes.

---

*Built as a CDAC Project Demonstration — SkyBooker © 2026*
