// ================================================================
// controllers/flightController.js
// ================================================================
const flightService = require('../services/flightService');
const { catchAsync } = require('../utils/helpers');

const flightController = {
    search: catchAsync(async (req, res) => {
        const result = await flightService.search(req.query);
        res.json({ status: 200, data: result });
    }),

    getById: catchAsync(async (req, res) => {
        const flight = await flightService.getFlightById(parseInt(req.params.id));
        res.json({ status: 200, data: flight });
    }),

    getSeatMap: catchAsync(async (req, res) => {
        const result = await flightService.getSeatMap(parseInt(req.params.id));
        res.json({ status: 200, data: result });
    }),

    getAirports: catchAsync(async (req, res) => {
        const airports = await flightService.getAirports();
        res.json({ status: 200, data: airports });
    }),

    getAirlines: catchAsync(async (req, res) => {
        const airlines = await flightService.getAirlines();
        res.json({ status: 200, data: airlines });
    })
};

module.exports = flightController;
