require('dotenv').config();
const { pool } = require('./config/db');

(async () => {
    try {
        console.log('--- Checking Database Info ---');
        const [dbInfo] = await pool.execute('SELECT DATABASE() as db');
        console.log('Current Database:', dbInfo[0].db);

        console.log('\n--- Checking Tables ---');
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        if (tables.some(t => Object.values(t)[0] === 'roles')) {
            console.log('\n--- Checking Roles ---');
            const [roles] = await pool.execute('SELECT * FROM roles');
            console.log('Roles Count:', roles.length);
            console.log(JSON.stringify(roles, null, 2));
        } else {
            console.error('❌ Table "roles" is missing!');
        }

        if (tables.some(t => Object.values(t)[0] === 'users')) {
            console.log('\n--- Checking Users ---');
            const [users] = await pool.execute('SELECT id, email, role_id, is_active FROM users');
            console.log('Users Count:', users.length);
            console.log(JSON.stringify(users, null, 2));
        } else {
            console.error('❌ Table "users" is missing!');
        }

    } catch (err) {
        console.error('❌ Diagnostic failed:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
})();
