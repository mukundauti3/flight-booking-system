// ================================================================
// repositories/flightRepo.js — Flight Data Access
// ================================================================
const { pool } = require('../config/db');

const flightRepo = {
    /**
     * Search flights with multi-filter, sorting, pagination
     */
    async search({ origin, destination, date, type, minPrice, maxPrice, sortBy, limit, offset }) {
        let sql = `
      SELECT f.*, al.name AS airline_name, al.code AS airline_code, al.logo_url,
             ac.model AS aircraft_model, ac.seat_layout,
             ao.code AS origin_code, ao.city AS origin_city, ao.country AS origin_country,
             ad.code AS dest_code, ad.city AS dest_city, ad.country AS dest_country,
             (SELECT COUNT(*) FROM flight_seats fs
              WHERE fs.flight_id = f.id AND fs.is_available = TRUE
              AND (fs.locked_until IS NULL OR fs.locked_until < NOW())) AS available_seats
      FROM flights f
      JOIN airlines al ON f.airline_id = al.id
      JOIN aircrafts ac ON f.aircraft_id = ac.id
      JOIN airports ao ON f.origin_airport_id = ao.id
      JOIN airports ad ON f.dest_airport_id = ad.id
      WHERE f.status = 'Scheduled' AND f.departure_time > NOW()
    `;
        const params = [];

        if (origin) {
            sql += ' AND (ao.city = ? OR ao.code = ?)';
            params.push(origin, origin);
        }
        if (destination) {
            sql += ' AND (ad.city = ? OR ad.code = ?)';
            params.push(destination, destination);
        }
        if (date) {
            sql += ' AND DATE(f.departure_time) = ?';
            params.push(date);
        }
        if (type) {
            sql += ' AND f.flight_type = ?';
            params.push(type);
        }
        if (minPrice) {
            sql += ' AND f.base_price >= ?';
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            sql += ' AND f.base_price <= ?';
            params.push(parseFloat(maxPrice));
        }

        // Sorting
        const sortMap = {
            price_asc: 'f.base_price ASC',
            price_desc: 'f.base_price DESC',
            duration_asc: 'f.duration_minutes ASC',
            duration_desc: 'f.duration_minutes DESC',
            departure_asc: 'f.departure_time ASC',
            departure_desc: 'f.departure_time DESC'
        };
        sql += ` ORDER BY ${sortMap[sortBy] || 'f.departure_time ASC'}`;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit.toString(), offset.toString());

        const [rows] = await pool.execute(sql, params);
        return rows;
    },

    /**
     * Count search results (for pagination)
     */
    async countSearch({ origin, destination, date, type, minPrice, maxPrice }) {
        let sql = `
      SELECT COUNT(*) AS total
      FROM flights f
      JOIN airports ao ON f.origin_airport_id = ao.id
      JOIN airports ad ON f.dest_airport_id = ad.id
      WHERE f.status = 'Scheduled' AND f.departure_time > NOW()
    `;
        const params = [];

        if (origin) { sql += ' AND (ao.city = ? OR ao.code = ?)'; params.push(origin, origin); }
        if (destination) { sql += ' AND (ad.city = ? OR ad.code = ?)'; params.push(destination, destination); }
        if (date) { sql += ' AND DATE(f.departure_time) = ?'; params.push(date); }
        if (type) { sql += ' AND f.flight_type = ?'; params.push(type); }
        if (minPrice) { sql += ' AND f.base_price >= ?'; params.push(parseFloat(minPrice)); }
        if (maxPrice) { sql += ' AND f.base_price <= ?'; params.push(parseFloat(maxPrice)); }

        const [[{ total }]] = await pool.execute(sql, params);
        return total;
    },

    /**
     * Get single flight with full details
     */
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT f.*, al.name AS airline_name, al.code AS airline_code, al.logo_url,
              ac.model AS aircraft_model, ac.seat_layout, ac.total_seats,
              ao.code AS origin_code, ao.city AS origin_city, ao.name AS origin_airport,
              ad.code AS dest_code, ad.city AS dest_city, ad.name AS dest_airport
       FROM flights f
       JOIN airlines al ON f.airline_id = al.id
       JOIN aircrafts ac ON f.aircraft_id = ac.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       WHERE f.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Get seat map for a flight (all seats with availability status)
     */
    async getSeats(flightId) {
        const [rows] = await pool.execute(
            `SELECT fs.id AS flight_seat_id, fs.flight_id, fs.is_available, fs.price,
              fs.locked_until, fs.locked_by,
              s.seat_number, s.seat_class, s.seat_row, s.seat_column,
              s.is_window, s.is_aisle, s.is_middle,
              CASE
                WHEN fs.is_available = FALSE THEN 'Booked'
                WHEN fs.locked_until IS NOT NULL AND fs.locked_until > NOW() THEN 'Locked'
                ELSE 'Available'
              END AS status
       FROM flight_seats fs
       JOIN seats s ON fs.seat_id = s.id
       WHERE fs.flight_id = ?
       ORDER BY s.seat_row, s.seat_column`,
            [flightId]
        );
        return rows;
    },

    /**
     * Count available seats for a flight (excludes locked)
     */
    async countAvailableSeats(flightId) {
        const [[{ count }]] = await pool.execute(
            `SELECT COUNT(*) AS count
       FROM flight_seats
       WHERE flight_id = ? AND is_available = TRUE
       AND (locked_until IS NULL OR locked_until < NOW())`,
            [flightId]
        );
        return count;
    },

    /**
     * Lock seats for a user (30-minute TTL)
     * Returns affected row count — must equal requested seat count
     */
    async lockSeats(flightId, seatIds, userId) {
        if (!seatIds.length) return 0;

        const placeholders = seatIds.map(() => '?').join(',');
        const [result] = await pool.execute(
            `UPDATE flight_seats
       SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE), locked_by = ?
       WHERE flight_id = ? AND id IN (${placeholders})
       AND is_available = TRUE
       AND (locked_until IS NULL OR locked_until < NOW())`,
            [userId, flightId, ...seatIds]
        );
        return result.affectedRows;
    },

    /**
     * Mark seats as booked (after payment)
     */
    async bookSeats(flightId, seatIds) {
        if (!seatIds.length) return;
        const placeholders = seatIds.map(() => '?').join(',');
        await pool.execute(
            `UPDATE flight_seats
       SET is_available = FALSE, locked_until = NULL, locked_by = NULL
       WHERE flight_id = ? AND id IN (${placeholders})`,
            [flightId, ...seatIds]
        );
    },

    /**
     * Release seat locks (on cancel or expiry)
     */
    async releaseSeats(flightId, seatIds) {
        if (!seatIds.length) return;
        const placeholders = seatIds.map(() => '?').join(',');
        await pool.execute(
            `UPDATE flight_seats
       SET is_available = TRUE, locked_until = NULL, locked_by = NULL
       WHERE flight_id = ? AND id IN (${placeholders})`,
            [flightId, ...seatIds]
        );
    },

    /**
     * Get all airports (active only)
     */
    async getAirports() {
        const [rows] = await pool.execute(
            'SELECT id, code, name, city, country, timezone FROM airports WHERE is_active = TRUE ORDER BY city'
        );
        return rows;
    },

    /**
     * Get all airlines (active only)
     */
    async getAirlines() {
        const [rows] = await pool.execute(
            'SELECT id, code, name, logo_url, country FROM airlines WHERE is_active = TRUE ORDER BY name'
        );
        return rows;
    },

    // ---- ADMIN ----

    /**
     * Create flight + generate flight_seats
     */
    async createFlight(data) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.execute(
                `INSERT INTO flights (flight_number, airline_id, aircraft_id, origin_airport_id, dest_airport_id,
                              departure_time, arrival_time, duration_minutes, base_price, flight_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.flightNumber, data.airlineId, data.aircraftId, data.originAirportId, data.destAirportId,
                data.departureTime, data.arrivalTime, data.durationMinutes, data.basePrice, data.flightType]
            );

            const flightId = result.insertId;

            // Generate flight_seats from aircraft seat template
            await conn.execute(
                `INSERT INTO flight_seats (flight_id, seat_id, price)
         SELECT ?, s.id, ROUND(? * s.price_multiplier, 2)
         FROM seats s WHERE s.aircraft_id = ?`,
                [flightId, data.basePrice, data.aircraftId]
            );

            await conn.commit();
            return flightId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Update flight details
     */
    async updateFlight(id, data) {
        const fields = [];
        const values = [];

        if (data.flightNumber) { fields.push('flight_number = ?'); values.push(data.flightNumber); }
        if (data.departureTime) { fields.push('departure_time = ?'); values.push(data.departureTime); }
        if (data.arrivalTime) { fields.push('arrival_time = ?'); values.push(data.arrivalTime); }
        if (data.durationMinutes) { fields.push('duration_minutes = ?'); values.push(data.durationMinutes); }
        if (data.basePrice) { fields.push('base_price = ?'); values.push(data.basePrice); }
        if (data.status) { fields.push('status = ?'); values.push(data.status); }
        if (data.flightType) { fields.push('flight_type = ?'); values.push(data.flightType); }

        if (fields.length === 0) return;
        values.push(id);

        await pool.execute(`UPDATE flights SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    /**
     * Delete flight (cascade deletes flight_seats)
     */
    async deleteFlight(id) {
        await pool.execute('DELETE FROM flights WHERE id = ?', [id]);
    },

    /**
     * Get all flights for admin (with counts)
     */
    async findAllAdmin({ limit, offset }) {
        const [rows] = await pool.execute(
            `SELECT f.*, al.name AS airline_name, ao.city AS origin_city, ad.city AS dest_city,
              (SELECT COUNT(*) FROM flight_seats fs WHERE fs.flight_id = f.id AND fs.is_available = TRUE) AS available_seats,
              (SELECT COUNT(*) FROM bookings b WHERE b.flight_id = f.id AND b.status != 'Cancelled') AS booking_count
       FROM flights f
       JOIN airlines al ON f.airline_id = al.id
       JOIN airports ao ON f.origin_airport_id = ao.id
       JOIN airports ad ON f.dest_airport_id = ad.id
       ORDER BY f.departure_time DESC
       LIMIT ? OFFSET ?`,
            [limit.toString(), offset.toString()]
        );
        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM flights');
        return { flights: rows, total };
    },

    // ---- ADMIN AIRLINE MANAGEMENT ----

    async createAirline({ code, name, country, logoUrl }) {
        const [result] = await pool.execute(
            'INSERT INTO airlines (code, name, country, logo_url) VALUES (?, ?, ?, ?)',
            [code, name, country, logoUrl || null]
        );
        return result.insertId;
    },

    async updateAirline(id, { name, country, logoUrl, isActive }) {
        const fields = [];
        const values = [];
        if (name !== undefined) { fields.push('name = ?'); values.push(name); }
        if (country !== undefined) { fields.push('country = ?'); values.push(country); }
        if (logoUrl !== undefined) { fields.push('logo_url = ?'); values.push(logoUrl); }
        if (isActive !== undefined) { fields.push('is_active = ?'); values.push(isActive); }
        if (fields.length === 0) return;
        values.push(id);
        await pool.execute(`UPDATE airlines SET ${fields.join(', ')} WHERE id = ?`, values);
    }
};

module.exports = flightRepo;
