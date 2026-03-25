USE skybooker_db;

-- ================================================================
-- ADDITIONAL FLIGHTS (30 more flights)
-- Spanning March and April 2026
-- ================================================================

INSERT INTO flights (flight_number, airline_id, aircraft_id, origin_airport_id, dest_airport_id,
                     departure_time, arrival_time, duration_minutes, base_price, flight_type) VALUES
-- Domestic (Mumbai to Bangalore)
('6E-204',  2, 2,  1,  3,  '2026-03-15 09:00:00', '2026-03-15 10:45:00', 105, 3500.00, 'Domestic'),
('AI-104',  1, 1,  1,  3,  '2026-03-15 14:00:00', '2026-03-15 15:45:00', 105, 4200.00, 'Domestic'),
-- Domestic (Delhi to Chennai)
('UK-404',  4, 4,  2,  5,  '2026-03-16 07:00:00', '2026-03-16 09:45:00', 165, 4800.00, 'Domestic'),
('SG-304',  3, 3,  2,  5,  '2026-03-16 11:30:00', '2026-03-16 14:15:00', 165, 3900.00, 'Domestic'),
-- Domestic (Goa to Mumbai)
('QP-504',  5, 5,  7,  1,  '2026-03-17 10:00:00', '2026-03-17 11:15:00',  75, 2900.00, 'Domestic'),
('6E-205',  2, 2,  7,  1,  '2026-03-17 16:00:00', '2026-03-17 17:15:00',  75, 2500.00, 'Domestic'),
-- Domestic (Kolkata to Jaipur)
('AI-105',  1, 1,  6,  9,  '2026-03-18 08:30:00', '2026-03-18 10:45:00', 135, 5500.00, 'Domestic'),
('SG-305',  3, 3,  6,  9,  '2026-03-18 19:00:00', '2026-03-18 21:15:00', 135, 4800.00, 'Domestic'),
-- International (Mumbai to London)
('AI-803',  1, 1,  1, 15,  '2026-03-20 02:00:00', '2026-03-20 07:30:00', 600, 42000.00, 'International'),
-- International (Delhi to New York)
('AI-804',  1, 1,  2, 16,  '2026-03-21 01:30:00', '2026-03-21 07:15:00', 915, 65000.00, 'International'),
-- Domestic (Ahmedabad to Pune)
('6E-206',  2, 2, 10,  8,  '2026-03-22 13:00:00', '2026-03-22 14:15:00',  75, 3200.00, 'Domestic'),
('UK-405',  4, 4, 10,  8,  '2026-03-22 18:30:00', '2026-03-22 19:45:00',  75, 3800.00, 'Domestic'),
-- Domestic (Kochi to Bengaluru)
('QP-505',  5, 5, 11,  3,  '2026-03-23 07:45:00', '2026-03-23 09:00:00',  75, 2800.00, 'Domestic'),
('AI-106',  1, 1, 11,  3,  '2026-03-23 15:00:00', '2026-03-23 16:15:00',  75, 3400.00, 'Domestic'),
-- Domestic (Hyderabad to Delhi)
('6E-207',  2, 2,  4,  2,  '2026-03-24 10:00:00', '2026-03-24 12:15:00', 135, 4200.00, 'Domestic'),
('UK-406',  4, 4,  4,  2,  '2026-03-24 20:30:00', '2026-03-24 22:45:00', 135, 4900.00, 'Domestic'),
-- Domestic (Lucknow to Kolkata)
('SG-306',  3, 3, 12,  6,  '2026-03-25 08:00:00', '2026-03-25 09:30:00',  90, 3600.00, 'Domestic'),
('AI-107',  1, 1, 12,  6,  '2026-03-25 17:30:00', '2026-03-25 19:00:00',  90, 4100.00, 'Domestic'),
-- International (Dubai to Mumbai)
('EK-603',  7, 7, 13,  1,  '2026-03-26 22:00:00', '2026-03-27 02:45:00', 210, 14500.00, 'International'),
-- International (Singapore to Bengaluru)
('SQ-702',  8, 8, 14,  3,  '2026-03-28 10:00:00', '2026-03-28 15:30:00', 330, 21000.00, 'International'),
-- Random Flights for April
('6E-401',  2, 2,  2,  1,  '2026-04-01 06:00:00', '2026-04-01 08:15:00', 135, 3800.00, 'Domestic'),
('AI-401',  1, 1,  1,  2,  '2026-04-02 12:00:00', '2026-04-02 14:15:00', 135, 4500.00, 'Domestic'),
('UK-407',  4, 4,  3,  4,  '2026-04-03 09:00:00', '2026-04-03 10:30:00',  90, 3600.00, 'Domestic'),
('SG-307',  3, 3,  5,  2,  '2026-04-04 15:00:00', '2026-04-04 17:45:00', 165, 4200.00, 'Domestic'),
('QP-506',  5, 5,  8, 10,  '2026-04-05 07:00:00', '2026-04-05 08:15:00',  75, 3100.00, 'Domestic'),
('AI-402',  1, 1, 15,  1,  '2026-04-06 20:00:00', '2026-04-07 05:30:00', 570, 38000.00, 'International'),
('EK-604',  7, 7,  1, 13,  '2026-04-08 04:00:00', '2026-04-08 07:30:00', 210, 15500.00, 'International'),
('SQ-703',  8, 8, 14,  2,  '2026-04-09 13:00:00', '2026-04-09 23:30:00', 630, 22000.00, 'International'),
('6E-402',  2, 2,  9,  2,  '2026-04-10 11:00:00', '2026-04-10 13:15:00', 135, 4200.00, 'Domestic'),
('UK-408',  4, 4,  2, 10,  '2026-04-11 18:00:00', '2026-04-11 20:30:00', 150, 4800.00, 'Domestic');


-- ================================================================
-- GENERATE FLIGHT SEATS FOR NEW FLIGHTS
-- ================================================================
DELIMITER //
DROP PROCEDURE IF EXISTS generate_new_flight_seats//
CREATE PROCEDURE generate_new_flight_seats()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE f_id INT;
    DECLARE f_aircraft_id INT;
    DECLARE f_base_price DECIMAL(10,2);

    -- Cursor for flights that don't have seats yet
    DECLARE cur CURSOR FOR 
        SELECT f.id, f.aircraft_id, f.base_price 
        FROM flights f
        LEFT JOIN flight_seats fs ON f.id = fs.flight_id
        WHERE fs.id IS NULL;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    flight_loop: LOOP
        FETCH cur INTO f_id, f_aircraft_id, f_base_price;
        IF done THEN LEAVE flight_loop; END IF;

        INSERT INTO flight_seats (flight_id, seat_id, price)
        SELECT f_id, s.id, ROUND(f_base_price * s.price_multiplier, 2)
        FROM seats s
        WHERE s.aircraft_id = f_aircraft_id;
    END LOOP;
    CLOSE cur;
END//
DELIMITER ;

CALL generate_new_flight_seats();
DROP PROCEDURE IF EXISTS generate_new_flight_seats;
