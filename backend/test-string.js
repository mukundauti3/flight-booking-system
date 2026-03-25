require('dotenv').config();
const { pool } = require('./config/db');
(async () => {
    try {
        const sql = "SELECT f.* FROM flights f LIMIT ? OFFSET ?";
        const [rows] = await pool.execute(sql, ["20", "0"]);
        console.log("Success with string limit offset params:", rows.length);
    } catch (e) {
        console.error("Error executing string LIMIT OFFSET:", e.message);
    }
    process.exit();
})();
