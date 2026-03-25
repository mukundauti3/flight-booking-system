// ================================================================
// repositories/bookingRepo.js — Booking Data Access
// ================================================================
const { pool } = require('../config/db');

const bookingRepo = {
    /**
     * Create booking record
     */
    async create({ bookingRef, userId, flightId, totalAmount, numPassengers }) {
        const [result] = await pool.execute(
            `INSERT INTO bookings (booking_ref, user_id, flight_id, total_amount, num_passengers, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [bookingRef, userId, flightId, totalAmount, numPassengers]
        );
        return result.insertId;
    },

    /**
     * Add passenger to a booking
     */
    async addPassenger({ bookingId, firstName, lastName, gender, dateOfBirth, nationality, passportNumber, flightSeatId }) {
        const [result] = await pool.execute(
            `INSERT INTO passengers (booking_id, first_name, last_name, gender, date_of_birth, nationality, passport_number, flight_seat_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingId, firstName, lastName, gender || null, dateOfBirth || null,
                nationality || null, passportNumber || null, flightSeatId || null]
        );
        return result.insertId;
    },

    /**
     * Get booking by ID (with flight + airline + airports)
     */
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT b.*, f.flight_number, f.departure_time, f.arrival_time, f.duration_minutes,
              f.base_price, f.flight_type, f.status AS flight_status,
              al.name AS airline_name, al.logo_url,
              ao.code AS origin_code, ao.city AS origin_city,
              ad.code AS dest_code, ad.city AS dest_city
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       JOIN airlines al ON f.airline_id = al.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       WHERE b.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Get booking by booking_ref
     */
    async findByRef(ref) {
        const [rows] = await pool.execute(
            `SELECT b.*, f.flight_number, f.departure_time, f.arrival_time,
              al.name AS airline_name,
              ao.code AS origin_code, ao.city AS origin_city,
              ad.code AS dest_code, ad.city AS dest_city
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       JOIN airlines al ON f.airline_id = al.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       WHERE b.booking_ref = ?`,
            [ref]
        );
        return rows[0] || null;
    },

    /**
     * Get passengers for a booking
     */
    async getPassengers(bookingId) {
        const [rows] = await pool.execute(
            `SELECT p.*, fs.price AS seat_price, s.seat_number, s.seat_class
       FROM passengers p
       LEFT JOIN flight_seats fs ON p.flight_seat_id = fs.id
       LEFT JOIN seats s ON fs.seat_id = s.id
       WHERE p.booking_id = ?`,
            [bookingId]
        );
        return rows;
    },

    /**
     * Get seat IDs for a booking's passengers
     */
    async getSeatIds(bookingId) {
        const [rows] = await pool.execute(
            'SELECT flight_seat_id FROM passengers WHERE booking_id = ? AND flight_seat_id IS NOT NULL',
            [bookingId]
        );
        return rows.map(r => r.flight_seat_id);
    },

    /**
     * Get user's booking history (paginated)
     */
    async findByUser(userId, { limit, offset }) {
        const [rows] = await pool.execute(
            `SELECT b.*, f.flight_number, f.departure_time, f.arrival_time,
              al.name AS airline_name,
              ao.code AS origin_code, ao.city AS origin_city,
              ad.code AS dest_code, ad.city AS dest_city
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       JOIN airlines al ON f.airline_id = al.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC
       LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        const [[{ total }]] = await pool.execute(
            'SELECT COUNT(*) AS total FROM bookings WHERE user_id = ?', [userId]
        );
        return { bookings: rows, total };
    },

    /**
     * Update booking status
     */
    async updateStatus(id, status, extra = {}) {
        const fields = ['status = ?'];
        const values = [status];

        if (status === 'Confirmed') {
            fields.push('confirmed_at = NOW()');
        }
        if (status === 'Cancelled') {
            fields.push('cancelled_at = NOW()');
            if (extra.reason) {
                fields.push('cancellation_reason = ?');
                values.push(extra.reason);
            }
        }

        values.push(id);
        await pool.execute(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    // ---- ADMIN ----

    /**
     * Get all bookings (admin, paginated)
     */
    async findAll({ limit, offset }) {
        const [rows] = await pool.execute(
            `SELECT b.*, u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email,
              f.flight_number, f.departure_time,
              ao.code AS origin_code, ao.city AS origin_city,
              ad.code AS dest_code, ad.city AS dest_city
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN flights f ON b.flight_id = f.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       ORDER BY b.booking_date DESC
       LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM bookings');
        return { bookings: rows, total };
    },

    /**
     * Analytics — dashboard stats
     */
    async getAnalytics() {
        const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role_id = 1) AS total_users,
        (SELECT COUNT(*) FROM flights) AS total_flights,
        (SELECT COUNT(*) FROM bookings) AS total_bookings,
        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'Confirmed') AS total_revenue,
        (SELECT COUNT(*) FROM bookings WHERE status = 'Pending') AS pending_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'Confirmed') AS confirmed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'Cancelled') AS cancelled_bookings
    `);

        // Recent bookings
        const [recentBookings] = await pool.execute(
            `SELECT b.*, u.first_name AS user_first_name, u.last_name AS user_last_name,
              f.flight_number, ao.city AS origin_city, ad.city AS dest_city
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN flights f ON b.flight_id = f.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       ORDER BY b.booking_date DESC LIMIT 10`
        );

        // Popular routes
        const [popularRoutes] = await pool.execute(
            `SELECT ao.city AS origin, ad.city AS destination, COUNT(*) AS booking_count
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       WHERE b.status != 'Cancelled'
       GROUP BY ao.city, ad.city
       ORDER BY booking_count DESC LIMIT 5`
        );

        return { stats, recentBookings, popularRoutes };
    }
};

module.exports = bookingRepo;
