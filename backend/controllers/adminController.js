// ================================================================
// controllers/adminController.js — Admin Operations
// ================================================================
const flightService = require('../services/flightService');
const bookingRepo = require('../repositories/bookingRepo');
const userRepo = require('../repositories/userRepo');
const { pool } = require('../config/db');
const { catchAsync, paginate } = require('../utils/helpers');

const adminController = {
    // ---- ANALYTICS ----
    getAnalytics: catchAsync(async (req, res) => {
        const data = await bookingRepo.getAnalytics();
        res.json({ status: 200, data });
    }),

    // ---- FLIGHTS ----
    listFlights: catchAsync(async (req, res) => {
        const result = await flightService.getAllAdmin(req.query);
        res.json({ status: 200, data: result });
    }),

    createFlight: catchAsync(async (req, res) => {
        const flight = await flightService.createFlight(req.body);
        await logAdminAction(req, 'CREATE_FLIGHT', 'flight', flight.id, req.body);
        res.status(201).json({ status: 201, data: flight });
    }),

    updateFlight: catchAsync(async (req, res) => {
        const flight = await flightService.updateFlight(parseInt(req.params.id), req.body);
        await logAdminAction(req, 'UPDATE_FLIGHT', 'flight', parseInt(req.params.id), req.body);
        res.json({ status: 200, data: flight });
    }),

    deleteFlight: catchAsync(async (req, res) => {
        await flightService.deleteFlight(parseInt(req.params.id));
        await logAdminAction(req, 'DELETE_FLIGHT', 'flight', parseInt(req.params.id), {});
        res.json({ status: 200, message: 'Flight deleted.' });
    }),

    // ---- AIRLINES ----
    listAirlines: catchAsync(async (req, res) => {
        const airlines = await flightService.getAirlines();
        res.json({ status: 200, data: airlines });
    }),

    createAirline: catchAsync(async (req, res) => {
        const id = await flightService.createAirline(req.body);
        await logAdminAction(req, 'CREATE_AIRLINE', 'airline', id, req.body);
        res.status(201).json({ status: 201, data: { id } });
    }),

    updateAirline: catchAsync(async (req, res) => {
        await flightService.updateAirline(parseInt(req.params.id), req.body);
        await logAdminAction(req, 'UPDATE_AIRLINE', 'airline', parseInt(req.params.id), req.body);
        res.json({ status: 200, message: 'Airline updated.' });
    }),

    // ---- USERS ----
    listUsers: catchAsync(async (req, res) => {
        const { page, limit, offset } = paginate(req.query);
        const result = await userRepo.findAll({ limit, offset });
        res.json({ status: 200, data: { ...result, page, limit } });
    }),

    // ---- BOOKINGS ----
    listBookings: catchAsync(async (req, res) => {
        const { page, limit, offset } = paginate(req.query);
        const result = await bookingRepo.findAll({ limit, offset });
        res.json({ status: 200, data: { ...result, page, limit } });
    }),

    // ---- LOGS ----
    getLogs: catchAsync(async (req, res) => {
        const { page, limit, offset } = paginate(req.query);
        const [rows] = await pool.execute(
            `SELECT al.*, u.first_name, u.last_name, u.email
       FROM admin_logs al
       JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        res.json({ status: 200, data: rows });
    })
};

// Helper to write audit log
const logAdminAction = async (req, action, entityType, entityId, details) => {
    try {
        await pool.execute(
            `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, action, entityType, entityId || null,
                JSON.stringify(details),
                req.ip || req.connection.remoteAddress,
                req.headers['user-agent'] || null
            ]
        );
    } catch (_) { /* Non-fatal — don't break the main operation */ }
};

module.exports = adminController;
