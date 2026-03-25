// ================================================================
// routes/authRoutes.js
// ================================================================
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const strongPassword = body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain a special character (!@#$%^&*)');

router.post('/register', [
    (req, res, next) => {
        // Map snake_case to camelCase for validation
        if (req.body.first_name) req.body.firstName = req.body.firstName || req.body.first_name;
        if (req.body.last_name) req.body.lastName = req.body.lastName || req.body.last_name;
        if (req.body.date_of_birth) req.body.dateOfBirth = req.body.dateOfBirth || req.body.date_of_birth;
        next();
    },
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    strongPassword
], validate, ctrl.register);

router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], validate, ctrl.login);

router.get('/me', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);

module.exports = router;
