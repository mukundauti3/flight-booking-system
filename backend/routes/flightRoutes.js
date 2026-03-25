// ================================================================
// routes/flightRoutes.js — Public Routes
// ================================================================
const router = require('express').Router();
const ctrl = require('../controllers/flightController');

router.get('/search', ctrl.search);
router.get('/airports', ctrl.getAirports);
router.get('/airlines', ctrl.getAirlines);
router.get('/:id', ctrl.getById);
router.get('/:id/seats', ctrl.getSeatMap);

module.exports = router;
