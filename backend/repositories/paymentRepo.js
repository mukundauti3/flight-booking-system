// ================================================================
// repositories/paymentRepo.js — Payment Data Access
// ================================================================
const { pool } = require('../config/db');

const paymentRepo = {
    /**
     * Create payment record (status = Created)
     */
    async create({ bookingId, transactionId, amount, currency, razorpayOrderId }) {
        const [result] = await pool.execute(
            `INSERT INTO payments (booking_id, transaction_id, amount, currency, razorpay_order_id, status)
       VALUES (?, ?, ?, ?, ?, 'Created')`,
            [bookingId, transactionId, amount, currency || 'INR', razorpayOrderId || null]
        );
        return result.insertId;
    },

    /**
     * Find payment by booking ID
     */
    async findByBookingId(bookingId) {
        const [rows] = await pool.execute(
            `SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1`,
            [bookingId]
        );
        return rows[0] || null;
    },

    /**
     * Find payment by ID
     */
    async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * Find by Razorpay order ID
     */
    async findByRazorpayOrderId(orderId) {
        const [rows] = await pool.execute(
            'SELECT * FROM payments WHERE razorpay_order_id = ?', [orderId]
        );
        return rows[0] || null;
    },

    /**
     * Find by Razorpay payment ID (idempotency check)
     */
    async findByRazorpayPaymentId(paymentId) {
        const [rows] = await pool.execute(
            'SELECT * FROM payments WHERE razorpay_payment_id = ?', [paymentId]
        );
        return rows[0] || null;
    },

    /**
     * Update payment after verification
     */
    async updateVerification(id, { razorpayPaymentId, razorpaySignature, status, paymentMethod, gatewayResponse }) {
        await pool.execute(
            `UPDATE payments
       SET razorpay_payment_id = ?, razorpay_signature = ?, status = ?,
           payment_method = ?, gateway_response = ?, payment_date = NOW()
       WHERE id = ?`,
            [razorpayPaymentId, razorpaySignature, status,
                paymentMethod || null, JSON.stringify(gatewayResponse) || null, id]
        );
    },

    /**
     * Update refund status
     */
    async updateRefund(id, { refundId, refundStatus }) {
        await pool.execute(
            `UPDATE payments SET refund_id = ?, refund_status = ?, status = 'Refunded' WHERE id = ?`,
            [refundId, refundStatus, id]
        );
    },

    /**
     * Update status only
     */
    async updateStatus(id, status) {
        await pool.execute('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
    }
};

module.exports = paymentRepo;
