// ================================================================
// routes/paymentRoutes.js — Protected Routes
// ================================================================
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/create-order', [
    body('bookingId').isInt({ min: 1 }).withMessage('Valid booking ID required'),
    body('currency').optional().isIn(['INR', 'USD']).withMessage('Currency must be INR or USD')
], validate, ctrl.createOrder);

router.post('/verify', [
    body('bookingId').isInt({ min: 1 }).withMessage('Valid booking ID required'),
    body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID required'),
    body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID required'),
    body('razorpaySignature').notEmpty().withMessage('Razorpay signature required')
], validate, ctrl.verifyPayment);

router.get('/:bookingId/status', ctrl.getStatus);

module.exports = router;
