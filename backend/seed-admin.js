require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        console.log('--- Seeding Roles and Admin (Many-to-Many) ---');

        // 1. Ensure Roles
        console.log('Checking roles...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description VARCHAR(255)
            )
        `);
        const [roles] = await pool.execute('SELECT * FROM roles');
        if (roles.length === 0) {
            console.log('Seeding roles...');
            await pool.execute("INSERT INTO roles (id, name, description) VALUES (1, 'user', 'Regular customer'), (2, 'admin', 'System administrator')");
        }

        // 2. Ensure user_roles table
        console.log('Checking user_roles table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INT NOT NULL,
                role_id INT NOT NULL,
                PRIMARY KEY (user_id, role_id),
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
            )
        `);

        // 3. Ensure Admin User
        console.log('Checking admin user...');
        let adminId;
        const [admins] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@skybooker.com']);
        if (admins.length === 0) {
            console.log('Seeding admin user...');
            const passwordHash = await bcrypt.hash('Admin@1234', 12);
            const [result] = await pool.execute(
                "INSERT INTO users (first_name, last_name, email, password_hash, phone, gender, is_active) VALUES ('System', 'Admin', 'admin@skybooker.com', ?, '+91-9999999999', 'Male', 1)",
                [passwordHash]
            );
            adminId = result.insertId;
            console.log('✅ Admin user created: admin@skybooker.com / Admin@1234');
        } else {
            adminId = admins[0].id;
            console.log('Admin user already exists.');
        }
        // Assign Admin role
        await pool.execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, 2)', [adminId]);

        // 4. Ensure Test User
        console.log('Checking test user...');
        let userId;
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', ['vipul@example.com']);
        if (users.length === 0) {
            console.log('Seeding test user...');
            const passwordHash = await bcrypt.hash('User@1234', 12);
            const [result] = await pool.execute(
                "INSERT INTO users (first_name, last_name, email, password_hash, phone, gender, is_active) VALUES ('Vipul', 'Sharma', 'vipul@example.com', ?, '+91-9876543210', 'Male', 1)",
                [passwordHash]
            );
            userId = result.insertId;
            console.log('✅ Test user created: vipul@example.com / User@1234');
        } else {
            userId = users[0].id;
            console.log('Test user already exists.');
        }
        // Assign User role
        await pool.execute('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, 1)', [userId]);

        console.log('✅ Seeding complete.');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
})();
