-- ================================================================
-- SKYBOOKER — FLIGHT TICKET BOOKING APPLICATION
-- Production MySQL 8.x Schema | Phase 2 | Fully Normalized (3NF)
-- ================================================================
-- Execution order: This file is idempotent — DROP IF EXISTS used.
-- Run: mysql -u root -p < database/schema.sql
-- Then: mysql -u root -p < database/seed.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS skybooker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE skybooker_db;

-- ================================================================
-- 1. ROLES
-- Purpose: Lookup table for access control levels
-- Seeded: user (id=1), admin (id=2)
-- ================================================================
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS flight_seats;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS aircrafts;
DROP TABLE IF EXISTS airlines;
DROP TABLE IF EXISTS airports;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(20)     NOT NULL UNIQUE,
    description     VARCHAR(100)    DEFAULT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (name, description) VALUES
  ('user',  'Regular customer'),
  ('admin', 'System administrator');

-- ================================================================
-- 2. USERS
-- Purpose: Registered users and administrators
-- FK: role_id → roles(id)
-- Unique: email
-- ================================================================
CREATE TABLE users (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    role_id         INT             NOT NULL DEFAULT 1,
    first_name      VARCHAR(50)     NOT NULL,
    last_name       VARCHAR(50)     NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20)     DEFAULT NULL,
    date_of_birth   DATE            DEFAULT NULL,
    gender          ENUM('Male','Female','Other') DEFAULT NULL,
    address         TEXT            DEFAULT NULL,
    profile_image   VARCHAR(255)    DEFAULT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_users_email (email),
    INDEX      idx_users_role  (role_id),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 3. AIRPORTS
-- Purpose: Reference data for origin/destination selection
-- Unique: code (IATA 3-letter)
-- ================================================================
CREATE TABLE airports (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(10)     NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    city            VARCHAR(100)    NOT NULL,
    country         VARCHAR(100)    NOT NULL,
    latitude        DECIMAL(10,7)   DEFAULT NULL,
    longitude       DECIMAL(10,7)   DEFAULT NULL,
    timezone        VARCHAR(50)     DEFAULT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_airports_code (code),
    INDEX      idx_airports_city (city),
    INDEX      idx_airports_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 4. AIRLINES
-- Purpose: Carrier reference data
-- Unique: code (IATA 2-letter)
-- ================================================================
CREATE TABLE airlines (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(10)     NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    logo_url        VARCHAR(255)    DEFAULT NULL,
    country         VARCHAR(100)    DEFAULT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_airlines_code (code),
    INDEX      idx_airlines_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 5. AIRCRAFTS
-- Purpose: Aircraft models with seat capacity metadata
-- FK: airline_id → airlines(id) CASCADE
-- ================================================================
CREATE TABLE aircrafts (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    airline_id      INT             NOT NULL,
    model           VARCHAR(100)    NOT NULL,
    manufacturer    VARCHAR(100)    DEFAULT NULL,
    total_seats     INT             NOT NULL,
    seat_layout     VARCHAR(20)     DEFAULT '3-3',
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_aircrafts_airline (airline_id),

    CONSTRAINT fk_aircrafts_airline
        FOREIGN KEY (airline_id) REFERENCES airlines(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 6. SEATS
-- Purpose: Master seat template per aircraft type
-- One row per physical seat position (e.g., A320 → 180 rows)
-- Shared across all flights using this aircraft
-- FK: aircraft_id → aircrafts(id) CASCADE
-- Unique: (aircraft_id, seat_number)
-- ================================================================
CREATE TABLE seats (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    aircraft_id         INT             NOT NULL,
    seat_number         VARCHAR(5)      NOT NULL,
    seat_class          ENUM('Economy','Business','First') DEFAULT 'Economy',
    seat_row            INT             NOT NULL,
    seat_column         CHAR(1)         NOT NULL,
    is_window           BOOLEAN         DEFAULT FALSE,
    is_aisle            BOOLEAN         DEFAULT FALSE,
    is_middle           BOOLEAN         DEFAULT FALSE,
    price_multiplier    DECIMAL(4,2)    DEFAULT 1.00,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_seat_aircraft (aircraft_id, seat_number),
    INDEX      idx_seats_aircraft (aircraft_id),
    INDEX      idx_seats_class (seat_class),

    CONSTRAINT fk_seats_aircraft
        FOREIGN KEY (aircraft_id) REFERENCES aircrafts(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 7. FLIGHTS
-- Purpose: Scheduled flight instances
-- FK: airline_id, aircraft_id, origin_airport_id, dest_airport_id
-- ================================================================
CREATE TABLE flights (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    flight_number       VARCHAR(20)     NOT NULL,
    airline_id          INT             NOT NULL,
    aircraft_id         INT             NOT NULL,
    origin_airport_id   INT             NOT NULL,
    dest_airport_id     INT             NOT NULL,
    departure_time      DATETIME        NOT NULL,
    arrival_time        DATETIME        NOT NULL,
    duration_minutes    INT             NOT NULL,
    base_price          DECIMAL(10,2)   NOT NULL,
    flight_type         ENUM('Domestic','International') DEFAULT 'Domestic',
    status              ENUM('Scheduled','Boarding','Delayed','Cancelled','Completed') DEFAULT 'Scheduled',
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_flights_number    (flight_number),
    INDEX idx_flights_origin    (origin_airport_id),
    INDEX idx_flights_dest      (dest_airport_id),
    INDEX idx_flights_departure (departure_time),
    INDEX idx_flights_status    (status),
    INDEX idx_flights_type      (flight_type),
    INDEX idx_flights_search    (origin_airport_id, dest_airport_id, departure_time, status),

    CONSTRAINT fk_flights_airline  FOREIGN KEY (airline_id)        REFERENCES airlines(id)  ON UPDATE CASCADE,
    CONSTRAINT fk_flights_aircraft FOREIGN KEY (aircraft_id)       REFERENCES aircrafts(id) ON UPDATE CASCADE,
    CONSTRAINT fk_flights_origin   FOREIGN KEY (origin_airport_id) REFERENCES airports(id)  ON UPDATE CASCADE,
    CONSTRAINT fk_flights_dest     FOREIGN KEY (dest_airport_id)   REFERENCES airports(id)  ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 8. FLIGHT_SEATS
-- Purpose: Per-flight seat availability + locking + pricing
-- Generated when a flight is created (INSERT...SELECT from seats)
-- This is the core table for the booking/concurrency model
-- FK: flight_id, seat_id, locked_by
-- Unique: (flight_id, seat_id) — one entry per seat per flight
-- ================================================================
CREATE TABLE flight_seats (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    flight_id       INT             NOT NULL,
    seat_id         INT             NOT NULL,
    is_available    BOOLEAN         DEFAULT TRUE,
    locked_until    DATETIME        DEFAULT NULL,
    locked_by       INT             DEFAULT NULL,
    price           DECIMAL(10,2)   NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_flight_seat    (flight_id, seat_id),
    INDEX      idx_fs_flight     (flight_id),
    INDEX      idx_fs_available  (flight_id, is_available),
    INDEX      idx_fs_lock       (locked_until),

    CONSTRAINT fk_fs_flight  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fs_seat    FOREIGN KEY (seat_id)   REFERENCES seats(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fs_user    FOREIGN KEY (locked_by)  REFERENCES users(id)  ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 9. BOOKINGS
-- Purpose: Central booking record (one per transaction)
-- booking_ref is the user-facing identifier (never the auto-increment id)
-- FK: user_id, flight_id
-- ================================================================
CREATE TABLE bookings (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    booking_ref         CHAR(8)         NOT NULL,
    user_id             INT             NOT NULL,
    flight_id           INT             NOT NULL,
    total_amount        DECIMAL(10,2)   NOT NULL,
    currency            CHAR(3)         DEFAULT 'INR',
    status              ENUM('Pending','Confirmed','Cancelled','Completed') DEFAULT 'Pending',
    num_passengers      INT             NOT NULL DEFAULT 1,
    booking_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    confirmed_at        DATETIME        DEFAULT NULL,
    cancelled_at        DATETIME        DEFAULT NULL,
    cancellation_reason TEXT            DEFAULT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_bookings_ref   (booking_ref),
    INDEX      idx_bookings_user (user_id),
    INDEX      idx_bookings_flight (flight_id),
    INDEX      idx_bookings_status (status),
    INDEX      idx_bookings_date   (booking_date),

    CONSTRAINT fk_bookings_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 10. PASSENGERS
-- Purpose: Individual travelers within a booking
-- Each passenger gets one assigned seat (FK to flight_seats)
-- FK: booking_id CASCADE, flight_seat_id SET NULL
-- ================================================================
CREATE TABLE passengers (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    booking_id          INT             NOT NULL,
    first_name          VARCHAR(50)     NOT NULL,
    last_name           VARCHAR(50)     NOT NULL,
    date_of_birth       DATE            DEFAULT NULL,
    gender              ENUM('Male','Female','Other') DEFAULT NULL,
    nationality         VARCHAR(50)     DEFAULT NULL,
    passport_number     VARCHAR(20)     DEFAULT NULL,
    flight_seat_id      INT             DEFAULT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_pax_booking (booking_id),
    INDEX idx_pax_seat    (flight_seat_id),

    CONSTRAINT fk_pax_booking FOREIGN KEY (booking_id)    REFERENCES bookings(id)     ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pax_seat    FOREIGN KEY (flight_seat_id) REFERENCES flight_seats(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 11. PAYMENTS
-- Purpose: Payment records per booking (supports retries)
-- Razorpay-specific columns for real payment integration
-- Idempotency: UNIQUE on razorpay_order_id and razorpay_payment_id
-- FK: booking_id CASCADE
-- ================================================================
CREATE TABLE payments (
    id                      INT             AUTO_INCREMENT PRIMARY KEY,
    booking_id              INT             NOT NULL,
    transaction_id          VARCHAR(50)     NOT NULL,
    razorpay_order_id       VARCHAR(50)     DEFAULT NULL,
    razorpay_payment_id     VARCHAR(50)     DEFAULT NULL,
    razorpay_signature      VARCHAR(255)    DEFAULT NULL,
    amount                  DECIMAL(10,2)   NOT NULL,
    currency                CHAR(3)         DEFAULT 'INR',
    payment_method          VARCHAR(30)     DEFAULT NULL,
    status                  ENUM('Created','Pending','Success','Failed','Refunded') DEFAULT 'Created',
    refund_id               VARCHAR(50)     DEFAULT NULL,
    refund_status           ENUM('Pending','Processed','Failed') DEFAULT NULL,
    gateway_response        JSON            DEFAULT NULL,
    payment_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_payments_txn         (transaction_id),
    UNIQUE KEY uk_payments_rp_order    (razorpay_order_id),
    UNIQUE KEY uk_payments_rp_payment  (razorpay_payment_id),
    INDEX      idx_payments_booking    (booking_id),
    INDEX      idx_payments_status     (status),
    INDEX      idx_payments_date       (payment_date),

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 12. TICKETS
-- Purpose: Digital e-tickets — one per passenger per booking
-- Generated only after successful payment
-- FK: booking_id CASCADE, passenger_id CASCADE
-- ================================================================
CREATE TABLE tickets (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    booking_id          INT             NOT NULL,
    passenger_id        INT             NOT NULL,
    ticket_number       VARCHAR(30)     NOT NULL,
    qr_code_data        TEXT            DEFAULT NULL,
    pdf_path            VARCHAR(255)    DEFAULT NULL,
    status              ENUM('Active','Used','Cancelled') DEFAULT 'Active',
    issued_at           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tickets_number   (ticket_number),
    INDEX      idx_tickets_booking (booking_id),
    INDEX      idx_tickets_pax     (passenger_id),
    INDEX      idx_tickets_status  (status),

    CONSTRAINT fk_tickets_booking
        FOREIGN KEY (booking_id)   REFERENCES bookings(id)    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_passenger
        FOREIGN KEY (passenger_id) REFERENCES passengers(id)  ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 13. ADMIN_LOGS
-- Purpose: Audit trail for all admin mutations
-- FK: admin_id → users(id)
-- ================================================================
CREATE TABLE admin_logs (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    admin_id        INT             NOT NULL,
    action          VARCHAR(100)    NOT NULL,
    entity_type     VARCHAR(50)     DEFAULT NULL,
    entity_id       INT             DEFAULT NULL,
    details         JSON            DEFAULT NULL,
    ip_address      VARCHAR(45)     DEFAULT NULL,
    user_agent      VARCHAR(255)    DEFAULT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_al_admin   (admin_id),
    INDEX idx_al_action  (action),
    INDEX idx_al_entity  (entity_type, entity_id),
    INDEX idx_al_created (created_at),

    CONSTRAINT fk_al_admin
        FOREIGN KEY (admin_id) REFERENCES users(id)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- SCHEMA COMPLETE — 13 TABLES
-- Next: Run seed.sql for reference data
-- ================================================================
