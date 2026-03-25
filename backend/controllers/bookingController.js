// ================================================================
// controllers/bookingController.js
// ================================================================
const bookingService = require('../services/bookingService');
const { catchAsync } = require('../utils/helpers');

const bookingController = {
    create: catchAsync(async (req, res) => {
        const { flightId, passengers } = req.body;
        const result = await bookingService.createBooking(req.user.id, { flightId, passengers });
        res.status(201).json({ status: 201, message: 'Booking created. Proceed to payment.', data: result });
    }),

    getHistory: catchAsync(async (req, res) => {
        const result = await bookingService.getHistory(req.user.id, req.query);
        res.json({ status: 200, data: result });
    }),

    getDetails: catchAsync(async (req, res) => {
        const result = await bookingService.getDetails(
            parseInt(req.params.id), req.user.id, req.user.role
        );
        res.json({ status: 200, data: result });
    }),

    cancel: catchAsync(async (req, res) => {
        const { reason } = req.body;
        const booking = await bookingService.cancelBooking(
            parseInt(req.params.id), req.user.id, req.user.role, reason
        );
        res.json({ status: 200, message: 'Booking cancelled.', data: booking });
    })
};

module.exports = bookingController;
