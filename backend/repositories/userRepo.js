// ================================================================
// repositories/userRepo.js — User Data Access
// ================================================================
const { pool } = require('../config/db');

const userRepo = {
    /**
     * Find user by email (for login / duplicate check)
     */
    async findByEmail(email) {
        const [rows] = await pool.execute(
            `SELECT u.*, GROUP_CONCAT(r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = ?
       GROUP BY u.id`,
            [email]
        );
        if (!rows[0]) return null;
        // Convert comma-separated roles to array
        rows[0].roles = rows[0].roles ? rows[0].roles.split(',') : [];
        return rows[0];
    },

    /**
     * Find user by ID (for profile / auth)
     */
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
              u.date_of_birth, u.gender, u.address, u.profile_image,
              u.is_active, u.created_at, GROUP_CONCAT(r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
            [id]
        );
        if (!rows[0]) return null;
        rows[0].roles = rows[0].roles ? rows[0].roles.split(',') : [];
        return rows[0];
    },

    /**
     * Create new user (registration)
     */
    async create({ firstName, lastName, email, passwordHash, phone, gender, dateOfBirth }) {
        const [result] = await pool.execute(
            `INSERT INTO users (first_name, last_name, email, password_hash, phone, gender, date_of_birth)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, email, passwordHash, phone || null, gender || null, dateOfBirth || null]
        );
        // Default to 'user' role (ID 1)
        await pool.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, 1)', [result.insertId]);
        return result.insertId;
    },

    /**
     * Update user profile
     */
    async updateProfile(id, { firstName, lastName, phone, gender, dateOfBirth, address, profileImage }) {
        const fields = [];
        const values = [];

        if (firstName) { fields.push('first_name = ?'); values.push(firstName); }
        if (lastName) { fields.push('last_name = ?'); values.push(lastName); }
        if (phone) { fields.push('phone = ?'); values.push(phone); }
        if (gender) { fields.push('gender = ?'); values.push(gender); }
        if (dateOfBirth) { fields.push('date_of_birth = ?'); values.push(dateOfBirth); }
        if (address) { fields.push('address = ?'); values.push(address); }
        if (profileImage) { fields.push('profile_image = ?'); values.push(profileImage); }

        if (fields.length === 0) return;

        values.push(id);
        await pool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },

    /**
     * Get all users (admin)
     */
    async findAll({ limit, offset }) {
        const [rows] = await pool.execute(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
              u.gender, u.is_active, u.created_at, GROUP_CONCAT(r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
            [limit.toString(), offset.toString()]
        );
        rows.forEach(row => {
            row.roles = row.roles ? row.roles.split(',') : [];
        });
        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM users');
        return { users: rows, total };
    }
};

module.exports = userRepo;
