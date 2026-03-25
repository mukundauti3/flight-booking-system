require('dotenv').config();
const { pool } = require('./config/db');
(async () => {
    try {
        const sql = "SELECT f.* FROM flights f LIMIT ? OFFSET ?";
        const [rows] = await pool.execute(sql, [20, 0]);
        console.log("Success with limit offset params:", rows.length);
    } catch (e) {
        console.error("Error executing LIMIT OFFSET:", e.message);
    }

    try {
        const sql2 = "SELECT f.* FROM flights f WHERE id = ?";
        const [rows2] = await pool.execute(sql2, [10]);
        console.log("Success with id param:", rows2.length);
    } catch (e) {
        console.error("Error executing ID param:", e.message);
    }

    process.exit();
})();
