# Phase 3: Backend APIs (Node.js)

> References Phase 1 (Architecture) and Phase 2 (Database). No frontend code.

---

## API Endpoint Table

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ User | Get current user profile |
| PUT | `/api/auth/profile` | ✅ User | Update profile |

### Flights (Public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/flights/search` | ❌ | Search with filters (origin, dest, date, type, price, sort) |
| GET | `/api/flights/:id` | ❌ | Flight details |
| GET | `/api/flights/:id/seats` | ❌ | Seat map + availability |
| GET | `/api/flights/airports` | ❌ | All active airports |
| GET | `/api/flights/airlines` | ❌ | All active airlines |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | ✅ User | Create booking + lock seats |
| GET | `/api/bookings` | ✅ User | Booking history |
| GET | `/api/bookings/:id` | ✅ User | Booking details + passengers |
| PUT | `/api/bookings/:id/cancel` | ✅ User | Cancel booking (2h rule) |

### Payments (Proxy to .NET)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-order` | ✅ User | Create Razorpay order (proxied) |
| POST | `/api/payments/verify` | ✅ User | Verify payment signature (proxied) |
| GET | `/api/payments/:bookingId/status` | ✅ User | Payment status |

### Tickets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tickets/:bookingId` | ✅ User | Get tickets for booking |
| GET | `/api/tickets/:bookingId/download` | ✅ User | Download PDF ticket |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/analytics` | ✅ Admin | Dashboard stats |
| GET | `/api/admin/flights` | ✅ Admin | List all flights |
| POST | `/api/admin/flights` | ✅ Admin | Create flight + generate seats |
| PUT | `/api/admin/flights/:id` | ✅ Admin | Update flight |
| DELETE | `/api/admin/flights/:id` | ✅ Admin | Delete flight |
| GET | `/api/admin/airlines` | ✅ Admin | List airlines |
| POST | `/api/admin/airlines` | ✅ Admin | Create airline |
| PUT | `/api/admin/airlines/:id` | ✅ Admin | Update airline |
| GET | `/api/admin/users` | ✅ Admin | List all users |
| GET | `/api/admin/bookings` | ✅ Admin | List all bookings |
| POST | `/api/admin/email/resend/:bookingId` | ✅ Admin | Resend confirmation email |

---

## Folder Structure

```
backend/
├── package.json
├── .env / .env.example
├── server.js                    ← Express app + middleware
├── config/
│   └── db.js                    ← MySQL connection pool
├── middleware/
│   ├── auth.js                  ← JWT verify + role guard
│   ├── errorHandler.js          ← Centralized error handling
│   └── validate.js              ← express-validator wrapper
├── routes/
│   ├── authRoutes.js
│   ├── flightRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── ticketRoutes.js
│   └── adminRoutes.js
├── controllers/
│   ├── authController.js
│   ├── flightController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── ticketController.js
│   └── adminController.js
├── services/
│   ├── authService.js
│   ├── flightService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   └── ticketService.js
├── repositories/
│   ├── userRepo.js
│   ├── flightRepo.js
│   ├── bookingRepo.js
│   ├── paymentRepo.js
│   └── ticketRepo.js
├── utils/
│   ├── AppError.js
│   └── helpers.js
└── uploads/
    ├── airlines/
    └── tickets/
```
