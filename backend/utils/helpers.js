// ================================================================
// utils/helpers.js — Utility Functions
// ================================================================
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate 8-character booking reference (uppercase hex)
 */
const generateBookingRef = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Generate transaction ID: TXN-<epoch>-<random>
 */
const generateTransactionId = () => {
    const epoch = Math.floor(Date.now() / 1000);
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TXN-${epoch}-${rand}`;
};

/**
 * Generate ticket number: TKT-<base36 epoch>-<random>
 */
const generateTicketNumber = () => {
    const epoch = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `TKT-${epoch}-${rand}`;
};

/**
 * Generate UUID v4
 */
const generateUUID = () => uuidv4();

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

/**
 * Format duration minutes to "Xh Ym"
 */
const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

/**
 * Pagination helper
 * @returns {{ limit: number, offset: number, page: number }}
 */
const paginate = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

/**
 * Wrap async route handlers to catch errors
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    generateBookingRef,
    generateTransactionId,
    generateTicketNumber,
    generateUUID,
    formatDate,
    formatDuration,
    paginate,
    catchAsync
};
