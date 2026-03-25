// ================================================================
// services/paymentService.js — Payment Proxy to .NET Microservice
// ================================================================
const axios = require('axios');
const paymentRepo = require('../repositories/paymentRepo');
const AppError = require('../utils/AppError');
const { generateTransactionId } = require('../utils/helpers');

const PAYMENT_URL = () => process.env.PAYMENT_SERVICE_URL || 'http://localhost:5100';
const API_KEY = () => process.env.PAYMENT_SERVICE_API_KEY;

const paymentHeaders = () => ({ 'X-Api-Key': API_KEY(), 'Content-Type': 'application/json' });

const paymentService = {
    /**
     * Create Razorpay order via .NET service
     * Stores the order in DB, returns orderId + key to frontend
     */
    async createOrder({ bookingId, amount, currency = 'INR', userId }) {
        // Check if payment already exists for this booking
        const existing = await paymentRepo.findByBookingId(bookingId);
        if (existing && existing.status === 'Success') {
            throw new AppError('Payment already completed for this booking.', 409);
        }

        let razorpayOrderId;
        try {
            const res = await axios.post(
                `${PAYMENT_URL()}/api/payments/create-order`,
                { bookingId, amount, currency },
                { headers: paymentHeaders(), timeout: 10000 }
            );
            razorpayOrderId = res.data.orderId;
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            throw new AppError(`Payment service error: ${msg}`, 502);
        }

        const transactionId = generateTransactionId();
        const paymentId = await paymentRepo.create({
            bookingId, transactionId, amount, currency, razorpayOrderId
        });

        return {
            paymentId,
            transactionId,
            razorpayOrderId,
            amount,
            currency,
            keyId: null // Returned from .NET; set below
        };
    },

    /**
     * Verify payment signature via .NET service
     * On success: update payment record, return confirmed status
     */
    async verifyPayment({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
        // Idempotency: if already processed
        const alreadyProcessed = await paymentRepo.findByRazorpayPaymentId(razorpayPaymentId);
        if (alreadyProcessed) {
            return { status: 'Success', alreadyProcessed: true };
        }

        let verifyResult;
        try {
            const res = await axios.post(
                `${PAYMENT_URL()}/api/payments/verify`,
                { razorpayOrderId, razorpayPaymentId, razorpaySignature },
                { headers: paymentHeaders(), timeout: 10000 }
            );
            verifyResult = res.data;
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            throw new AppError(`Payment verification failed: ${msg}`, 502);
        }

        if (!verifyResult.valid) {
            throw new AppError('Payment signature verification failed. Possible fraud attempt.', 400);
        }

        // Update DB
        const payment = await paymentRepo.findByRazorpayOrderId(razorpayOrderId);
        if (payment) {
            await paymentRepo.updateVerification(payment.id, {
                razorpayPaymentId,
                razorpaySignature,
                status: 'Success',
                paymentMethod: verifyResult.paymentMethod,
                gatewayResponse: verifyResult.gatewayResponse
            });
        }

        return { status: 'Success', valid: true };
    },

    async getStatus(bookingId) {
        const payment = await paymentRepo.findByBookingId(bookingId);
        if (!payment) return { status: 'NotFound' };
        return { status: payment.status, payment };
    }
};

module.exports = paymentService;
