// ================================================================
// middleware/errorHandler.js — Centralized Error Handler
// ================================================================
const errorHandler = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.error(`❌ [${err.statusCode}] ${err.message}`);
        if (err.statusCode === 500) console.error(err.stack);
    }

    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        err.statusCode = 409;
        err.message = 'A record with this value already exists.';
    }

    // MySQL FK constraint
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        err.statusCode = 400;
        err.message = 'Referenced record does not exist.';
    }

    const response = {
        status: err.statusCode,
        error: err.message
    };

    if (err.errors) response.errors = err.errors;

    // Stack trace only in development for 500s
    if (process.env.NODE_ENV === 'development' && err.statusCode === 500) {
        response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
};

module.exports = errorHandler;
