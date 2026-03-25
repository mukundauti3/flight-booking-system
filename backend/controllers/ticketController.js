// ================================================================
// controllers/ticketController.js
// ================================================================
const ticketService = require('../services/ticketService');
const { catchAsync } = require('../utils/helpers');

const ticketController = {
    getTickets: catchAsync(async (req, res) => {
        const result = await ticketService.getTicketsForBooking(
            parseInt(req.params.bookingId), req.user.id, req.user.role
        );
        res.json({ status: 200, data: result });
    })
};

module.exports = ticketController;
