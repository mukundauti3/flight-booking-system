// ================================================================
// routes/adminRoutes.js — Admin-Only Routes
// ================================================================
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication AND admin role
router.use(authenticate, authorize('admin'));

// Analytics
router.get('/analytics', ctrl.getAnalytics);

// Flights
router.get('/flights', ctrl.listFlights);
router.post('/flights', [
    body('flightNumber').trim().notEmpty().withMessage('Flight number required'),
    body('airlineId').isInt({ min: 1 }).withMessage('Valid airline ID required'),
    body('aircraftId').isInt({ min: 1 }).withMessage('Valid aircraft ID required'),
    body('originAirportId').isInt({ min: 1 }).withMessage('Valid origin airport required'),
    body('destAirportId').isInt({ min: 1 }).withMessage('Valid destination airport required'),
    body('departureTime').isISO8601().withMessage('Valid departure datetime required'),
    body('arrivalTime').isISO8601().withMessage('Valid arrival datetime required'),
    body('durationMinutes').isInt({ min: 1 }).withMessage('Duration in minutes required'),
    body('basePrice').isFloat({ min: 0.01 }).withMessage('Valid base price required'),
    body('flightType').isIn(['Domestic', 'International']).withMessage('Type must be Domestic or International')
], validate, ctrl.createFlight);

router.put('/flights/:id', ctrl.updateFlight);
router.delete('/flights/:id', ctrl.deleteFlight);

// Airlines
router.get('/airlines', ctrl.listAirlines);
router.post('/airlines', [
    body('code').trim().notEmpty().withMessage('Airline IATA code required'),
    body('name').trim().notEmpty().withMessage('Airline name required'),
    body('country').trim().notEmpty().withMessage('Country required')
], validate, ctrl.createAirline);
router.put('/airlines/:id', ctrl.updateAirline);

// Users & Bookings
router.get('/users', ctrl.listUsers);
router.get('/bookings', ctrl.listBookings);

// Audit Logs
router.get('/logs', ctrl.getLogs);

module.exports = router;
