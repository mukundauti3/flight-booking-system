// ================================================================
// server.js — Express Application Entry Point
// ================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ----- Security Middleware -----
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ----- Rate Limiting -----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 minutes
  max: 100,                           // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ----- Body Parsing -----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----- Static File Serving -----
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----- Root Route -----
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SkyBooker API',
    version: '1.0.0',
    healthCheck: '/api/health',
    docs: 'https://github.com/Vipul23Deshmukh/Cdac_Final_Project'
  });
});

// ----- Health Check -----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'skybooker-api' });
});

// ----- API Routes -----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/flights', require('./routes/flightRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ----- 404 Handler -----
app.use((req, res) => {
  res.status(404).json({ status: 404, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ----- Global Error Handler -----
app.use(errorHandler);

// ----- Start Server -----
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`\n  🚀 SkyBooker API running on http://localhost:${PORT}`);
      console.log(`  📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  💳 Payment service: ${process.env.PAYMENT_SERVICE_URL || 'not configured'}\n`);
    });
  } catch (err) {
    console.error('CRITICAL: Server failed to start due to database error.');
    console.error('The server will remain alive but unable to process DB requests.');
    console.log('Please fix the database issue and the server will restart automatically (if using nodemon).');
  }
};

start();

module.exports = app;
