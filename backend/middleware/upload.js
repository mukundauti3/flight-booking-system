// ================================================================
// middleware/upload.js — Multer Image Upload (Flight / Airline images)
// ================================================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_MB || '5');

// ---- Storage Engine ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.uploadFolder || 'uploads/logos';
        fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        cb(null, `${req.uploadPrefix || 'img'}_${ts}_${rand}${ext}`);
    }
});

// ---- File Filter ----
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(`Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`, 400), false);
    }
};

// ---- Base Multer instance ----
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 }
});

// ---- Airline Logo Upload ----
const uploadAirlineLogo = [
    (req, _res, next) => { req.uploadFolder = 'uploads/logos'; req.uploadPrefix = 'airline'; next(); },
    upload.single('logo'),
    (req, _res, next) => {
        if (req.file) req.logoPath = `/uploads/logos/${req.file.filename}`;
        next();
    }
];

// ---- Flight Hero Image Upload ----
const uploadFlightImage = [
    (req, _res, next) => { req.uploadFolder = 'uploads/flights'; req.uploadPrefix = 'flight'; next(); },
    upload.single('image'),
    (req, _res, next) => {
        if (req.file) req.imagePath = `/uploads/flights/${req.file.filename}`;
        next();
    }
];

// ---- Profile Photo Upload ----
const uploadProfilePhoto = [
    (req, _res, next) => { req.uploadFolder = 'uploads/profiles'; req.uploadPrefix = 'profile'; next(); },
    upload.single('photo'),
    (req, _res, next) => {
        if (req.file) req.photoPath = `/uploads/profiles/${req.file.filename}`;
        next();
    }
];

// ---- Multer error handler ----
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ status: 400, error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` });
        }
        return res.status(400).json({ status: 400, error: err.message });
    }
    next(err);
};

module.exports = { uploadAirlineLogo, uploadFlightImage, uploadProfilePhoto, handleUploadError };
