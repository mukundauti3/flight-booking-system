// ================================================================
// services/flightService.js — Flight Business Logic
// ================================================================
const flightRepo = require('../repositories/flightRepo');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/helpers');

const flightService = {
    async search(query) {
        const { page, limit, offset } = paginate(query);
        const [flights, total] = await Promise.all([
            flightRepo.search({ ...query, limit, offset }),
            flightRepo.countSearch(query)
        ]);
        return { flights, total, page, limit };
    },

    async getFlightById(id) {
        const flight = await flightRepo.findById(id);
        if (!flight) throw new AppError('Flight not found.', 404);
        return flight;
    },

    async getSeatMap(flightId) {
        const flight = await flightRepo.findById(flightId);
        if (!flight) throw new AppError('Flight not found.', 404);

        const seats = await flightRepo.getSeats(flightId);
        const availableSeats = await flightRepo.countAvailableSeats(flightId);

        // Compute class breakdown
        const byClass = seats.reduce((acc, s) => {
            if (!acc[s.seat_class]) acc[s.seat_class] = { total: 0, available: 0 };
            acc[s.seat_class].total++;
            if (s.status === 'Available') acc[s.seat_class].available++;
            return acc;
        }, {});

        return { flight, seats, availableSeats, byClass };
    },

    async getAirports() {
        return flightRepo.getAirports();
    },

    async getAirlines() {
        return flightRepo.getAirlines();
    },

    // ---- ADMIN ----
    async createFlight(data) {
        const flightId = await flightRepo.createFlight(data);
        return flightRepo.findById(flightId);
    },

    async updateFlight(id, data) {
        const flight = await flightRepo.findById(id);
        if (!flight) throw new AppError('Flight not found.', 404);
        if (flight.status === 'Completed' || flight.status === 'Cancelled') {
            throw new AppError('Cannot modify a completed or cancelled flight.', 400);
        }
        await flightRepo.updateFlight(id, data);
        return flightRepo.findById(id);
    },

    async deleteFlight(id) {
        const flight = await flightRepo.findById(id);
        if (!flight) throw new AppError('Flight not found.', 404);
        await flightRepo.deleteFlight(id);
    },

    async getAllAdmin(query) {
        const { page, limit, offset } = paginate(query);
        return flightRepo.findAllAdmin({ limit, offset });
    },

    async createAirline(data) {
        return flightRepo.createAirline(data);
    },

    async updateAirline(id, data) {
        await flightRepo.updateAirline(id, data);
    }
};

module.exports = flightService;
