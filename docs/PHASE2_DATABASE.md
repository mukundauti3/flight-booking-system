# Phase 2: Database Design

> Aligned with Phase 1 architecture. No backend code. Schema is **final**.

---

## 1. ID & Booking Reference Strategy

| Entity | PK Type | Format | Example |
|--------|---------|--------|---------|
| All tables | `INT AUTO_INCREMENT` | Sequential integer | `1, 2, 3, ...` |
| Booking reference | `CHAR(8)` | 6 random hex uppercase | `A3F2B1C8` |
| Transaction ID | `VARCHAR(50)` | `TXN-<epoch>-<4 hex bytes>` | `TXN-1740000000-A3F2B1C8` |
| Ticket number | `VARCHAR(30)` | `TKT-<base36 epoch>-<4 hex bytes>` | `TKT-1KLF9C0-A3B2` |
| Razorpay order ID | `VARCHAR(50)` | Razorpay-generated | `order_P5jGHR1234abcd` |
| Razorpay payment ID | `VARCHAR(50)` | Razorpay-generated | `pay_P5jGHR5678efgh` |

**Why INT over UUID:**
- MySQL InnoDB clusters on PK — sequential INTs give optimal insert/scan performance
- UUIDs fragment the B-tree, degrade over time
- External-facing identifiers (booking_ref, ticket_number) are random — no information leakage
- Internal IDs never exposed in URLs (booking_ref used instead)

---

## 2. Table Relationships

```
roles ──1:N──► users ──1:N──► bookings ──1:N──► passengers
                │                │                  │
                │                │                  └── FK → flight_seats
                │                │
                │                ├──1:N──► payments
                │                ├──1:N──► tickets ── FK → passengers
                │                └── FK → flights
                │
                └──1:N──► admin_logs

airlines ──1:N──► aircrafts ──1:N──► seats
    │                                   │
    └──1:N──► flights ──1:N──► flight_seats ◄── FK ── seats
                 │
                 ├── FK → airports (origin)
                 └── FK → airports (destination)
```

---

## 3. Table-by-Table Breakdown

### 3.1 `roles`
- Lookup table for user roles
- Seeded with `user` (id=1) and `admin` (id=2) on schema creation
- Users default to role_id=1 (user)

### 3.2 `users`
- Stores registered users and admins
- `email` is UNIQUE — primary login identifier
- `password_hash` stores bcrypt output (60-char, but VARCHAR(255) for flexibility)
- `is_active` allows soft-disable without deletion
- `profile_image` stores relative path to uploaded photo
- FK to `roles` — determines access level

### 3.3 `airports`
- Reference data — seeded with major Indian + international airports
- `code` is IATA code (3-letter, UNIQUE) — used in search queries
- Indexed on `code` and `city` for fast search lookups
- Latitude/longitude for future distance calculations

### 3.4 `airlines`
- Reference data — seeded with major carriers
- `code` is IATA code (2-letter, UNIQUE)
- `logo_url` stores relative path to uploaded logo image
- `is_active` for soft-delete without breaking FK integrity

### 3.5 `aircrafts`
- Defines aircraft models and their seat capacity
- `seat_layout` describes column grouping (e.g., `3-3` for A320, `3-4-3` for A380)
- FK to `airlines` — each aircraft belongs to one airline
- Cascade delete: removing airline removes its aircraft

### 3.6 `seats`
- **Master template** — defines seat positions for an aircraft type
- Not per-flight; per-aircraft. Shared across all flights using that aircraft
- `seat_number` = row + column (e.g., `12A`)
- `seat_class` = Economy / Business / First
- `price_multiplier` adjusts base price (Business = 2.5x, Window = 1.1x, etc.)
- Position flags (`is_window`, `is_aisle`, `is_middle`) for UI rendering

### 3.7 `flights`
- Each row = one scheduled flight instance
- FK to `airlines`, `aircrafts`, `airports` (origin + destination)
- `base_price` is the Economy baseline — actual seat prices computed as `base_price × seat.price_multiplier`
- `status` tracks lifecycle: Scheduled → Delayed/Cancelled/Completed
- Indexed on `departure_time` for date-range search, `status` for active-flight filtering

### 3.8 `flight_seats`
- **Per-flight seat availability** — the core of the booking system
- One row per seat per flight (flight 1 with 180 seats = 180 rows in this table)
- Generated when a flight is created (INSERT ... SELECT from seats WHERE aircraft_id = ?)
- `is_available`: TRUE = open, FALSE = booked (sold)
- `locked_until` + `locked_by`: pessimistic lock for concurrency (Phase 1 §6)
- `price`: pre-computed `base_price × price_multiplier` — no runtime math
- Composite index `(flight_id, is_available)` for fast availability count
- UNIQUE `(flight_id, seat_id)` prevents duplicate seat entries

### 3.9 `bookings`
- Central booking record — one per transaction
- `booking_ref` is the user-facing 8-char identifier (UNIQUE, indexed)
- `status` lifecycle: Pending → Confirmed → Completed | Cancelled
- `cancelled_at` + `cancellation_reason` populated only on cancellation
- FK to `users` and `flights`
- Indexed on `user_id` for booking history queries

### 3.10 `passengers` (renamed from `booking_passengers`)
- Stores passenger details per booking (supports multi-passenger bookings)
- Each passenger can have an assigned `flight_seat_id` (FK to `flight_seats`)
- `passport_number` required for international flights
- `nationality` added for international travel compliance
- Cascade delete on booking deletion

### 3.11 `payments`
- One or more payments per booking (handles retries)
- Razorpay-specific columns: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
- `payment_method`: captures what the user used on Razorpay checkout
- `gateway_response`: full JSON payload from Razorpay for audit
- `refund_id` + `refund_status`: populated when refund is processed
- UNIQUE on `razorpay_order_id` prevents duplicate order creation
- UNIQUE on `razorpay_payment_id` prevents duplicate webhook processing (idempotency)

### 3.12 `tickets`
- One ticket per passenger per booking
- Generated only after payment confirmation
- `ticket_number` is the unique identifier printed on the e-ticket
- `qr_code_data` stores JSON payload embedded in the QR code
- `pdf_path` stores relative path to the generated PDF file
- `status`: Active → Used (after travel) | Cancelled (on booking cancel)

### 3.13 `admin_logs`
- Audit trail for all admin mutations
- `action`: verb like CREATE_FLIGHT, UPDATE_AIRLINE, DELETE_FLIGHT
- `entity_type` + `entity_id`: what was affected
- `details`: JSON with the request body / change diff
- `ip_address`: for security auditing
- Indexed on `admin_id` and `created_at` for chronological queries

---

## 4. Seat Availability & Locking Model (Schema Support)

The `flight_seats` table implements the pessimistic lock model defined in Phase 1:

```
┌──────────────────────────────────────────────────────────────┐
│ flight_seats row                                             │
│                                                              │
│  is_available = TRUE   locked_until = NULL     → AVAILABLE   │
│  is_available = TRUE   locked_until = <future> → LOCKED      │
│  is_available = TRUE   locked_until = <past>   → AVAILABLE   │
│  is_available = FALSE  locked_until = NULL     → BOOKED      │
└──────────────────────────────────────────────────────────────┘
```

- **Lock acquisition**: `UPDATE ... SET locked_until = NOW() + INTERVAL 30 MINUTE, locked_by = ? WHERE is_available = TRUE AND (locked_until IS NULL OR locked_until < NOW())`
- **Lock release on payment**: `UPDATE ... SET is_available = FALSE, locked_until = NULL`
- **Lock release on cancel**: `UPDATE ... SET is_available = TRUE, locked_until = NULL`
- **Lazy expiry**: No cron job — expired locks are invisible to availability queries via `WHERE` filter

---

## 5. Complete CREATE TABLE SQL

Below is the finalized production schema. See `database/schema.sql`.
