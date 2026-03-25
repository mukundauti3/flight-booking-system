# Phase 1: Architecture & Design

> No code. No SQL. Architectural decisions are **final**.

---

## 1. High-Level System Architecture

```
                     ┌───────────────────────────────────────────────────┐
                     │           REVERSE PROXY (nginx / IIS)            │
                     │       TLS termination · gzip · static cache      │
                     └─────┬────────────────────────┬───────────────────┘
                           │                        │
              ┌────────────▼─────────┐    ┌────────▼────────────────┐
              │   React SPA (Vite)   │    │  Static Assets (CDN)   │
              │   Port 5173          │    │  Bootstrap · Fonts     │
              │   Client-side only   │    │  Uploaded images       │
              └────────────┬─────────┘    └─────────────────────────┘
                           │ Axios + JWT Bearer
                           ▼
              ┌───────────────────────────────────────┐
              │   NODE.JS API GATEWAY (Express)       │
              │   Port 5000                           │
              │                                       │
              │   /api/auth/*       Auth & Users      │
              │   /api/flights/*    Flight CRUD/Search │
              │   /api/bookings/*   Booking lifecycle  │
              │   /api/tickets/*    Ticket retrieval   │
              │   /api/admin/*      Admin operations   │
              │   /api/payments/*   Payment proxy  ────┼──── HTTP ────┐
              │   /api/upload/*     Image upload       │              │
              └───────────┬───────────────────────────┘              │
                          │ mysql2 pool (20 conn)                    │
                          ▼                                          ▼
              ┌──────────────────────┐          ┌────────────────────────────┐
              │   MySQL 8.x         │          │  .NET 8 PAYMENT SERVICE    │
              │   Port 3306         │◄── EF ───┤  Port 5100                 │
              │   InnoDB · 13 tables│   Core   │  Razorpay SDK              │
              │   ACID transactions │          │  Webhook endpoint          │
              └──────────────────────┘          │  Email dispatch (SMTP)     │
                                                └────────────────────────────┘
```

---

## 2. Frontend ↔ Backend ↔ Database Flow

- **Frontend** is a pure client-side React SPA — zero server-side rendering
- Every data operation is an **Axios HTTP call** to the Node.js API Gateway
- JWT token is attached to every request via Axios request interceptor
- **401 responses** trigger automatic token discard + redirect to `/login`
- Vite dev server **proxies** `/api/*` to `http://localhost:5000` — no CORS issues in dev
- In production, nginx routes `/api/*` to Node.js and serves the React build as static files
- **Node.js API Gateway** owns all business logic — validates, orchestrates, persists
- All database access goes through **repository layer** → **mysql2 parameterized queries**
- Payment-related requests are **proxied** from Node.js to the .NET Payment Service
- Frontend **never** talks directly to the .NET service or the database

---

## 3. Node.js API Gateway — Responsibilities

- **Authentication**: Register, login, JWT issuance (HS256, 24h), token validation
- **Authorization**: Role-based middleware (`user`, `admin`) gating every protected route
- **Flight Management**: Search with multi-filter, detail retrieval, seat availability queries
- **Booking Lifecycle**: Create → lock seats → await payment → confirm → generate tickets → cancel
- **Ticket Generation**: Create ticket records, generate QR code data, render PDF via `pdfkit`
- **Admin Operations**: CRUD flights, airlines, schedules; analytics aggregation; admin audit logging
- **Payment Proxy**: Forward payment requests to .NET service, receive confirmation, update booking state
- **File Upload**: Accept airline logo / profile image uploads, store to disk, serve via static route
- **Input Validation**: express-validator on every mutating endpoint — sanitize + reject before touching DB
- **Error Handling**: Centralized `AppError` class, global error-catching middleware, structured JSON errors
- **Rate Limiting**: 100 req/15min per IP on all `/api/*` routes
- **Security Headers**: helmet middleware (CSP, X-Frame-Options, HSTS, etc.)

---

## 4. .NET Payment Microservice — Responsibilities

- **Razorpay Order Creation**: Accept booking amount + booking ID → create Razorpay order → return `order_id` + `key_id`
- **Payment Verification**: Receive `razorpay_payment_id` + `razorpay_order_id` + `razorpay_signature` → verify HMAC-SHA256 signature → update `payments` table
- **Webhook Handling**: Expose `/api/webhooks/razorpay` → verify webhook signature → idempotent status updates (handles network failures, retries)
- **Refund Processing**: On booking cancellation, initiate Razorpay refund API → update payment status to `Refunded`
- **Email Dispatch**: After successful payment verification, send booking confirmation email via SMTP (Gmail App Password or SendGrid)
- **Audit Logging**: Every payment event (create, verify, webhook, refund) logged with timestamp, amounts, IDs via Serilog
- **Internal Auth**: Validates shared `X-Api-Key` header on all requests from Node.js — rejects external callers
- **Health Check**: `/health` endpoint for monitoring

**Why .NET for Payments:**
- Type safety on financial amounts (decimal, not float)
- Official Razorpay .NET SDK with strong typing
- Separate process isolation — payment crashes don't take down flights/bookings
- Satisfies project requirement for .NET exposure

---

## 5. Email & Ticket Generation Flow

### Ticket Generation
```
Payment verified (success)
  → .NET notifies Node.js (or Node.js polls after confirming payment)
  → Node.js bookingService.confirmBooking()
      → Mark booking status = 'Confirmed'
      → Mark selected flight_seats as is_available = FALSE
      → For each passenger:
          → Generate unique ticket number (TKT-<timestamp>-<random>)
          → Generate QR code data (JSON: ticket#, booking ref, passenger, flight, seat)
          → Insert into tickets table
      → Generate PDF ticket via pdfkit:
          → Airline header, passenger name, flight route
          → Departure/arrival times, seat number, class
          → Booking ref, ticket number
          → Embedded QR code image (qrcode library → PNG buffer → pdfkit image)
          → Save PDF to /uploads/tickets/<booking_ref>.pdf
```

### Email Flow
```
After ticket generation:
  → .NET Payment Service dispatches confirmation email
  → SMTP transport (Nodemailer on Node.js side, OR SmtpClient on .NET side)
  → Email contains:
      → Booking confirmation summary (HTML template)
      → PDF ticket as attachment
      → Razorpay payment receipt link
  → Fallback: If email fails, ticket is still accessible via /api/tickets/:bookingId
```

### Decision: Email from .NET vs Node.js
- **Primary**: .NET sends email immediately after payment verification (tightest coupling to payment event)
- **Fallback**: Node.js can resend via admin action or user "resend email" button
- Email templates stored as HTML files in each service

---

## 6. Seat Locking & Concurrency Model

### Problem
- Multiple users may attempt to book the same seat simultaneously
- Without locking, double-bookings will occur

### Solution: Pessimistic Locking with TTL

```
SEAT STATES:
  Available  → is_available = TRUE,  locked_until = NULL
  Locked     → is_available = TRUE,  locked_until = <future timestamp>, locked_by = <user_id>
  Booked     → is_available = FALSE, locked_until = NULL
```

### Lock Acquisition (on booking creation)
- When user creates a booking with seat selection:
  - `UPDATE flight_seats SET locked_until = NOW() + 30 MIN, locked_by = ?`
  - `WHERE flight_id = ? AND id IN (?) AND is_available = TRUE AND (locked_until IS NULL OR locked_until < NOW())`
- Check `affectedRows === requestedSeats.length` — if not, some seats were already locked → **reject with 409 Conflict**
- Lock duration: **30 minutes** — enough time to complete payment

### Lock Release
- **On payment success**: `UPDATE flight_seats SET is_available = FALSE, locked_until = NULL, locked_by = NULL`
- **On booking cancellation**: `UPDATE flight_seats SET is_available = TRUE, locked_until = NULL, locked_by = NULL`
- **On lock expiry**: No cron job needed — every seat availability query filters with `AND (locked_until IS NULL OR locked_until < NOW())`
- Expired locks are lazily reclaimed at read time

### Concurrency Guarantees
- MySQL InnoDB row-level locking on `UPDATE` prevents race conditions
- The `WHERE` clause ensures only truly available seats can be locked
- `affectedRows` check is the atomicity guard
- No application-level mutex needed — database handles it

### Edge Case: Payment timeout
- If user locks seats but never pays within 30 minutes:
  - Lock expires automatically
  - Next user's search/booking sees seats as available
  - Stale booking remains in `Pending` status — can be cleaned up by a scheduled task or ignored

---

## 7. Auth & Role-Based Access Strategy

### Roles
| Role | Permissions |
|------|-------------|
| `user` | Register, login, search flights, book, pay, view own bookings/tickets, cancel own bookings |
| `admin` | Everything `user` can do + CRUD flights/airlines/schedules, view all bookings, view users, analytics dashboard, admin logs |

### JWT Strategy
- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: 64-character random string from `.env` — never hardcoded
- **Payload**: `{ id, email, role, firstName, lastName, iat, exp }`
- **Expiry**: 24 hours
- **Storage**: `localStorage` on the client (not cookies)
- **Transmission**: `Authorization: Bearer <token>` header on every API call

### Middleware Chain (per route)
```
Public routes:     → controller
Auth routes:       → authenticate → controller
Admin routes:      → authenticate → authorize('admin') → controller
```

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 digit
- At least 1 special character (`!@#$%^&*`)
- Enforced by express-validator on registration
- Hashed with bcryptjs, 12 salt rounds

### Token Lifecycle
- Login returns JWT → stored in localStorage
- Every API call attaches JWT via Axios interceptor
- 401 response → clear localStorage → redirect to `/login`
- Logout → clear localStorage (stateless; no server-side session to invalidate)
- No refresh token (acceptable for 24h session duration at this scale)

---

## 8. Image Storage Strategy

### Use Cases
- Airline logos (admin uploads when creating/editing airlines)
- User profile photos (optional, future)
- Ticket PDFs (generated server-side)

### Strategy: Local Filesystem + Static Serving

```
backend/
  uploads/
    airlines/     ← airline logos (PNG/JPG, max 2MB)
    tickets/      ← generated ticket PDFs
    profiles/     ← user profile photos (future)
```

### Upload Flow
- Frontend sends `multipart/form-data` to `/api/upload/airline-logo`
- Node.js middleware (`multer`) handles the upload:
  - File type validation: `.jpg`, `.jpeg`, `.png`, `.webp` only
  - Max size: 2MB
  - Filename: `airline-<id>-<timestamp>.<ext>` (prevents collisions)
  - Stored in `backend/uploads/airlines/`
- Database stores the relative path: `/uploads/airlines/airline-3-1740000000.png`
- Express static middleware serves `/uploads/*` publicly

### Why Not Cloud Storage (S3)?
- Project scope is local/on-premise deployment
- No AWS/GCP dependency for CDAC submission
- Easy migration path: swap `multer` disk storage with `multer-s3` later if needed

### Production Consideration
- In production with nginx, configure nginx to serve `/uploads/*` directly (bypass Node.js)
- Add cache headers for logo images (immutable content)

---

## 9. Performance & Scalability Decisions

### Database
- **Connection pooling**: 20 connections (Node.js) + 20 connections (.NET) — prevents connection exhaustion
- **Indexes**: Composite indexes on `flight_seats(flight_id, is_available)`, single-column on all FK columns, `flights(departure_time)`, `bookings(user_id)`, `airports(code, city)`
- **Query optimization**: All search queries use indexed `WHERE` + `ORDER BY` + `LIMIT/OFFSET` — no full table scans
- **No N+1 queries**: Seat availability fetched in single JOIN query, not per-seat

### API Gateway
- **Rate limiting**: 100 req/15min per IP — prevents abuse
- **Payload limits**: `express.json({ limit: '10mb' })` — prevents memory exhaustion
- **Response compression**: gzip via nginx (not Node.js — offload to proxy)
- **Stateless**: No server-side sessions — horizontal scaling ready (add Node.js instances behind load balancer)

### Frontend
- **Code splitting**: Vite automatic chunk splitting per route (lazy imports possible)
- **Font preconnect**: Google Fonts loaded via `<link rel="preconnect">` — no render blocking
- **Bootstrap treeshaking**: Import only used CSS components if bundle size matters
- **Seat map rendering**: Virtual rendering not needed — max 500 seats renders in <16ms

### Payment Service
- **Independent scaling**: .NET service can be scaled independently of Node.js
- **Webhook idempotency**: Razorpay may send duplicate webhooks — use `transaction_id` UNIQUE constraint to prevent double-processing
- **Timeout handling**: HTTP calls from Node.js to .NET use 10-second timeout — fail fast, return error to user

### Caching (Future Path, Not Implemented in MVP)
- Airport and airline lists (rarely change) are candidates for in-memory cache (Node.js `Map` with TTL)
- Flight search results could be cached for 30 seconds for identical queries
- Not implementing Redis — overkill for project scope

---

## 10. Cross-Cutting Concerns

### Logging
- **Node.js**: `console.log` in dev, structured JSON logs in production (can upgrade to `winston`)
- **.NET**: Serilog with structured logging to console + file, payment audit trail

### Error Handling
- **Node.js**: Centralized `errorHandler` middleware catches all errors, returns `{ status, error, errors[] }`
- **.NET**: Global exception filter, ProblemDetails response format
- **Frontend**: Axios interceptor catches errors, React Toastify displays user-friendly messages

### Health Checks
- `GET /api/health` on Node.js — returns 200 + timestamp
- `GET /health` on .NET — returns 200 + DB connectivity check

### Monitoring (Production Path)
- nginx access logs for traffic patterns
- Application error logs for debugging
- MySQL slow query log enabled for optimization

---

**Phase 1 is complete. All architectural decisions are final.**
**Awaiting instruction to begin Phase 2: Database Schema.**
