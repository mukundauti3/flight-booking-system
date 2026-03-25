// ================================================================
// services/authService.js — Auth Business Logic
// ================================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');
const AppError = require('../utils/AppError');

const authService = {
    async register({ firstName, lastName, email, password, phone, gender, dateOfBirth }) {
        const existing = await userRepo.findByEmail(email);
        if (existing) throw new AppError('Email already registered.', 409);

        const passwordHash = await bcrypt.hash(password, 12);
        const userId = await userRepo.create({
            firstName, lastName, email, passwordHash, phone, gender, dateOfBirth
        });

        const user = await userRepo.findById(userId);
        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            roles: user.roles
        };
    },

    async login(email, password) {
        const user = await userRepo.findByEmail(email);
        if (!user) throw new AppError('Invalid email or password.', 401);
        if (!user.is_active) throw new AppError('Account is disabled. Contact support.', 403);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new AppError('Invalid email or password.', 401);

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                roles: user.roles,
                firstName: user.first_name,
                lastName: user.last_name
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                roles: user.roles
            }
        };
    },

    async getProfile(userId) {
        const user = await userRepo.findById(userId);
        if (!user) throw new AppError('User not found.', 404);
        return user;
    },

    async updateProfile(userId, data) {
        await userRepo.updateProfile(userId, data);
        return userRepo.findById(userId);
    }
};

module.exports = authService;
