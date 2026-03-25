require('dotenv').config();
const { pool } = require('./config/db');
(async () => {
  try {
    const limit = 20;
    const offset = 0;
    const sql = "SELECT f.* FROM flights f LIMIT ? OFFSET ?";
    const [rows] = await pool.execute(sql, [limit, offset]);
    console.log("Success with limit offset params:", rows.length);
  } catch (e) {
    console.error("Error executing LIMIT OFFSET:", e.message);
  }
  
  try {
     const sql2 = "SELECT f.* FROM flights f LIMIT 20 OFFSET 0";
     const [rows2] = await pool.execute(sql2);
     console.log("Success hardcoded LIMIT OFFSET:", rows2.length);
  } catch (e) {
     console.error("Error executing hardcoded LIMIT OFFSET:", e.message);
  }
  process.exit();
})();
