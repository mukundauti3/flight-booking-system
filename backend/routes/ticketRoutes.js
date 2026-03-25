// ================================================================
// routes/ticketRoutes.js — Protected Routes
// ================================================================
const router = require('express').Router();
const ctrl = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:bookingId', ctrl.getTickets);

module.exports = router;
