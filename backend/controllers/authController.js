// ================================================================
// controllers/authController.js
// ================================================================
const authService = require('../services/authService');
const { catchAsync } = require('../utils/helpers');

const authController = {
    register: catchAsync(async (req, res) => {
        const user = await authService.register(req.body);
        res.status(201).json({ status: 201, message: 'Registration successful.', data: user });
    }),

    login: catchAsync(async (req, res) => {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json({ status: 200, message: 'Login successful.', data: result });
    }),

    getProfile: catchAsync(async (req, res) => {
        const user = await authService.getProfile(req.user.id);
        res.json({ status: 200, data: user });
    }),

    updateProfile: catchAsync(async (req, res) => {
        const user = await authService.updateProfile(req.user.id, req.body);
        res.json({ status: 200, message: 'Profile updated.', data: user });
    })
};

module.exports = authController;
