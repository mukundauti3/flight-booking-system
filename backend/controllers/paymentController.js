// ================================================================
// controllers/paymentController.js
// ================================================================
const paymentService = require('../services/paymentService');
const bookingService = require('../services/bookingService');
const bookingRepo = require('../repositories/bookingRepo');
const AppError = require('../utils/AppError');
const { catchAsync } = require('../utils/helpers');

const paymentController = {
    /**
     * POST /api/payments/create-order
     * Body: { bookingId, currency? }
     * Creates Razorpay order via .NET service
     */
    createOrder: catchAsync(async (req, res) => {
        const { bookingId, currency } = req.body;

        // Validate booking belongs to user
        const booking = await bookingRepo.findById(bookingId);
        if (!booking) throw new AppError('Booking not found.', 404);
        if (booking.user_id !== req.user.id) throw new AppError('Access denied.', 403);
        if (booking.status === 'Confirmed') throw new AppError('Booking already confirmed.', 409);
        if (booking.status === 'Cancelled') throw new AppError('Cannot pay for a cancelled booking.', 400);

        const result = await paymentService.createOrder({
            bookingId,
            amount: parseFloat(booking.total_amount),
            currency: currency || 'INR',
            userId: req.user.id
        });

        res.status(201).json({ status: 201, data: result });
    }),

    /**
     * POST /api/payments/verify
     * Body: { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
     * Verifies signature via .NET, then triggers booking confirmation
     */
    verifyPayment: catchAsync(async (req, res) => {
        const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        // Verify payment signature with .NET service
        const verifyResult = await paymentService.verifyPayment({
            bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature
        });

        // On success, confirm booking & generate tickets
        const { booking, tickets } = await bookingService.confirmBooking(bookingId);

        res.json({
            status: 200,
            message: 'Payment verified. Booking confirmed.',
            data: { payment: verifyResult, booking, tickets }
        });
    }),

    /**
     * GET /api/payments/:bookingId/status
     */
    getStatus: catchAsync(async (req, res) => {
        const result = await paymentService.getStatus(parseInt(req.params.bookingId));
        res.json({ status: 200, data: result });
    })
};

module.exports = paymentController;
