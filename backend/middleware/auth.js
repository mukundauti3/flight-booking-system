// ================================================================
// middleware/auth.js — JWT Authentication + Role Authorization
// ================================================================
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Verify JWT token from Authorization header.
 * Attaches decoded user to req.user
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Authentication required. Please log in.', 401));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Session expired. Please log in again.', 401));
        }
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
};

/**
 * Role-based authorization gate.
 * Must be used AFTER authenticate middleware.
 * @param  {...string} roles — allowed roles (e.g., 'admin')
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return next(new AppError('Access denied. Insufficient permissions.', 403));
        }

        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
            return next(new AppError('Access denied. Insufficient permissions.', 403));
        }
        next();
    };
};

module.exports = { authenticate, authorize };
