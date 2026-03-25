// ================================================================
// middleware/validate.js — Express-Validator Wrapper
// ================================================================
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Checks validation results. If errors exist, returns 400 with all messages.
 * Usage: router.post('/path', [...rules], validate, controller)
 */
const validate = (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(e => e.msg);
        return next(new AppError('Validation failed', 400, messages));
    }
    next();
};

module.exports = validate;
