// ================================================================
// repositories/ticketRepo.js — Ticket Data Access
// ================================================================
const { pool } = require('../config/db');

const ticketRepo = {
    /**
     * Create ticket for a passenger
     */
    async create({ bookingId, passengerId, ticketNumber, qrCodeData, pdfPath }) {
        const [result] = await pool.execute(
            `INSERT INTO tickets (booking_id, passenger_id, ticket_number, qr_code_data, pdf_path)
       VALUES (?, ?, ?, ?, ?)`,
            [bookingId, passengerId, ticketNumber, qrCodeData || null, pdfPath || null]
        );
        return result.insertId;
    },

    /**
     * Get all tickets for a booking
     */
    async findByBookingId(bookingId) {
        const [rows] = await pool.execute(
            `SELECT t.*, p.first_name, p.last_name, p.gender, p.passport_number,
              s.seat_number, s.seat_class,
              fs.price AS seat_price
       FROM tickets t
       JOIN passengers p ON t.passenger_id = p.id
       LEFT JOIN flight_seats fs ON p.flight_seat_id = fs.id
       LEFT JOIN seats s ON fs.seat_id = s.id
       WHERE t.booking_id = ?
       ORDER BY p.id`,
            [bookingId]
        );
        return rows;
    },

    /**
     * Get single ticket by ticket number
     */
    async findByTicketNumber(ticketNumber) {
        const [rows] = await pool.execute(
            'SELECT * FROM tickets WHERE ticket_number = ?',
            [ticketNumber]
        );
        return rows[0] || null;
    },

    /**
     * Cancel all tickets for a booking
     */
    async cancelByBookingId(bookingId) {
        await pool.execute(
            `UPDATE tickets SET status = 'Cancelled' WHERE booking_id = ?`,
            [bookingId]
        );
    },

    /**
     * Update ticket PDF path
     */
    async updatePdfPath(ticketId, pdfPath) {
        await pool.execute(
            'UPDATE tickets SET pdf_path = ? WHERE id = ?',
            [pdfPath, ticketId]
        );
    }
};

module.exports = ticketRepo;
