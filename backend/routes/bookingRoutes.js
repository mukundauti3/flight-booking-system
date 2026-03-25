// ================================================================
// routes/bookingRoutes.js — Protected Routes
// ================================================================
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', [
    body('flightId').isInt({ min: 1 }).withMessage('Valid flight ID is required'),
    body('passengers').isArray({ min: 1, max: 9 }).withMessage('1–9 passengers required'),
    body('passengers.*.firstName').trim().notEmpty().withMessage('Passenger first name required'),
    body('passengers.*.lastName').trim().notEmpty().withMessage('Passenger last name required')
], validate, ctrl.create);

router.get('/', ctrl.getHistory);
router.get('/:id', ctrl.getDetails);
router.put('/:id/cancel', [
    body('reason').optional().isString()
], validate, ctrl.cancel);

module.exports = router;
