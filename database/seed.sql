-- ================================================================
-- SKYBOOKER — SEED DATA
-- Run after schema.sql: mysql -u root -p < database/seed.sql
-- ================================================================

USE skybooker_db;

-- ================================================================
-- AIRPORTS (12 Indian + 4 International)
-- ================================================================
INSERT INTO airports (code, name, city, country, timezone) VALUES
  ('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai',       'India', 'Asia/Kolkata'),
  ('DEL', 'Indira Gandhi International Airport',               'Delhi',        'India', 'Asia/Kolkata'),
  ('BLR', 'Kempegowda International Airport',                  'Bengaluru',    'India', 'Asia/Kolkata'),
  ('HYD', 'Rajiv Gandhi International Airport',                'Hyderabad',    'India', 'Asia/Kolkata'),
  ('MAA', 'Chennai International Airport',                     'Chennai',      'India', 'Asia/Kolkata'),
  ('CCU', 'Netaji Subhas Chandra Bose International Airport',  'Kolkata',      'India', 'Asia/Kolkata'),
  ('GOI', 'Goa International Airport',                         'Goa',          'India', 'Asia/Kolkata'),
  ('PNQ', 'Pune Airport',                                      'Pune',         'India', 'Asia/Kolkata'),
  ('JAI', 'Jaipur International Airport',                      'Jaipur',       'India', 'Asia/Kolkata'),
  ('AMD', 'Sardar Vallabhbhai Patel International Airport',    'Ahmedabad',    'India', 'Asia/Kolkata'),
  ('COK', 'Cochin International Airport',                      'Kochi',        'India', 'Asia/Kolkata'),
  ('LKO', 'Chaudhary Charan Singh International Airport',     'Lucknow',      'India', 'Asia/Kolkata'),
  ('DXB', 'Dubai International Airport',                       'Dubai',        'UAE',   'Asia/Dubai'),
  ('SIN', 'Singapore Changi Airport',                          'Singapore',    'Singapore', 'Asia/Singapore'),
  ('LHR', 'Heathrow Airport',                                  'London',       'UK',    'Europe/London'),
  ('JFK', 'John F. Kennedy International Airport',             'New York',     'USA',   'America/New_York');

-- ================================================================
-- AIRLINES (8 carriers)
-- ================================================================
INSERT INTO airlines (code, name, country) VALUES
  ('AI', 'Air India',         'India'),
  ('6E', 'IndiGo',            'India'),
  ('SG', 'SpiceJet',          'India'),
  ('UK', 'Vistara',           'India'),
  ('QP', 'Akasa Air',         'India'),
  ('G8', 'Go First',          'India'),
  ('EK', 'Emirates',          'UAE'),
  ('SQ', 'Singapore Airlines','Singapore');

-- ================================================================
-- AIRCRAFTS (one per airline for simplicity; expandable)
-- ================================================================
INSERT INTO aircrafts (airline_id, model, manufacturer, total_seats, seat_layout) VALUES
  (1, 'Boeing 787-8',      'Boeing',  180, '3-3'),
  (2, 'Airbus A320neo',    'Airbus',  180, '3-3'),
  (3, 'Boeing 737-800',    'Boeing',  180, '3-3'),
  (4, 'Airbus A321neo',    'Airbus',  180, '3-3'),
  (5, 'Boeing 737 MAX 8',  'Boeing',  180, '3-3'),
  (6, 'Airbus A320',       'Airbus',  180, '3-3'),
  (7, 'Boeing 777-300ER',  'Boeing',  300, '3-4-3'),
  (8, 'Airbus A350-900',   'Airbus',  300, '3-3-3');

-- ================================================================
-- SEATS — Generate 180 seats per 3-3 aircraft (Rows 1-30, Columns A-F)
-- Rows 1-5:  Business (price_multiplier = 2.50)
-- Rows 6-30: Economy  (price_multiplier = 1.00)
-- Window: A, F | Aisle: C, D | Middle: B, E
-- ================================================================
-- Aircraft 1 (Air India 787-8)
DELIMITER //
DROP PROCEDURE IF EXISTS generate_seats//
CREATE PROCEDURE generate_seats(IN p_aircraft_id INT, IN p_total_rows INT, IN p_biz_rows INT)
BEGIN
    DECLARE r INT DEFAULT 1;
    DECLARE col CHAR(1);
    DECLARE seat_cls VARCHAR(10);
    DECLARE multiplier DECIMAL(4,2);
    DECLARE is_win BOOLEAN;
    DECLARE is_asl BOOLEAN;
    DECLARE is_mid BOOLEAN;

    WHILE r <= p_total_rows DO
        SET col = 'A';
        WHILE col <= 'F' DO
            -- Determine class
            IF r <= p_biz_rows THEN
                SET seat_cls = 'Business';
                SET multiplier = 2.50;
            ELSE
                SET seat_cls = 'Economy';
                SET multiplier = 1.00;
            END IF;

            -- Determine position
            SET is_win = (col = 'A' OR col = 'F');
            SET is_asl = (col = 'C' OR col = 'D');
            SET is_mid = (col = 'B' OR col = 'E');

            -- Window surcharge
            IF is_win AND seat_cls = 'Economy' THEN
                SET multiplier = 1.10;
            END IF;

            INSERT INTO seats (aircraft_id, seat_number, seat_class, seat_row, seat_column,
                               is_window, is_aisle, is_middle, price_multiplier)
            VALUES (p_aircraft_id, CONCAT(r, col), seat_cls, r, col,
                    is_win, is_asl, is_mid, multiplier);

            -- Next column
            SET col = CHAR(ASCII(col) + 1);
        END WHILE;
        SET r = r + 1;
    END WHILE;
END//
DELIMITER ;

-- Generate seats for each 3-3 aircraft (180 seats: 30 rows × 6 cols, 5 biz rows)
CALL generate_seats(1, 30, 5);
CALL generate_seats(2, 30, 5);
CALL generate_seats(3, 30, 5);
CALL generate_seats(4, 30, 5);
CALL generate_seats(5, 30, 5);
CALL generate_seats(6, 30, 5);
-- Wide-body aircraft: 50 rows for 300 seats (same 6-col for simplicity)
CALL generate_seats(7, 50, 8);
CALL generate_seats(8, 50, 8);

DROP PROCEDURE IF EXISTS generate_seats;

-- ================================================================
-- FLIGHTS (20 scheduled flights — mix of domestic + international)
-- Dates set relative: March 2026
-- ================================================================
INSERT INTO flights (flight_number, airline_id, aircraft_id, origin_airport_id, dest_airport_id,
                     departure_time, arrival_time, duration_minutes, base_price, flight_type) VALUES
-- Domestic
('AI-101',  1, 1,  1,  2,  '2026-03-05 06:00:00', '2026-03-05 08:15:00', 135, 4500.00, 'Domestic'),
('AI-102',  1, 1,  2,  1,  '2026-03-05 10:00:00', '2026-03-05 12:15:00', 135, 4500.00, 'Domestic'),
('6E-201',  2, 2,  1,  3,  '2026-03-05 07:30:00', '2026-03-05 09:00:00',  90, 3200.00, 'Domestic'),
('6E-202',  2, 2,  3,  1,  '2026-03-05 14:00:00', '2026-03-05 15:30:00',  90, 3200.00, 'Domestic'),
('SG-301',  3, 3,  2,  3,  '2026-03-06 08:00:00', '2026-03-06 10:30:00', 150, 3800.00, 'Domestic'),
('SG-302',  3, 3,  3,  2,  '2026-03-06 16:00:00', '2026-03-06 18:30:00', 150, 3800.00, 'Domestic'),
('UK-401',  4, 4,  1,  4,  '2026-03-07 09:00:00', '2026-03-07 10:30:00',  90, 3500.00, 'Domestic'),
('UK-402',  4, 4,  4,  1,  '2026-03-07 18:00:00', '2026-03-07 19:30:00',  90, 3500.00, 'Domestic'),
('QP-501',  5, 5,  2,  5,  '2026-03-08 06:30:00', '2026-03-08 09:15:00', 165, 4200.00, 'Domestic'),
('QP-502',  5, 5,  5,  2,  '2026-03-08 12:00:00', '2026-03-08 14:45:00', 165, 4200.00, 'Domestic'),
('6E-203',  2, 2,  1,  7,  '2026-03-09 11:00:00', '2026-03-09 12:10:00',  70, 2800.00, 'Domestic'),
('AI-103',  1, 1,  2,  8,  '2026-03-09 07:00:00', '2026-03-09 09:00:00', 120, 3000.00, 'Domestic'),
('SG-303',  3, 3,  3,  6,  '2026-03-10 13:00:00', '2026-03-10 15:30:00', 150, 3900.00, 'Domestic'),
('UK-403',  4, 4,  9,  1,  '2026-03-11 05:30:00', '2026-03-11 07:30:00', 120, 3600.00, 'Domestic'),
('QP-503',  5, 5, 10,  3,  '2026-03-12 14:30:00', '2026-03-12 17:00:00', 150, 4000.00, 'Domestic'),
-- International
('EK-601',  7, 7,  1, 13,  '2026-03-10 02:00:00', '2026-03-10 05:30:00', 210, 15000.00, 'International'),
('EK-602',  7, 7, 13,  1,  '2026-03-10 10:00:00', '2026-03-10 15:30:00', 210, 15000.00, 'International'),
('SQ-701',  8, 8,  3, 14,  '2026-03-11 01:00:00', '2026-03-11 07:30:00', 330, 18000.00, 'International'),
('AI-801',  1, 1,  2, 15,  '2026-03-12 21:00:00', '2026-03-13 06:30:00', 570, 35000.00, 'International'),
('AI-802',  1, 1,  2, 16,  '2026-03-13 23:00:00', '2026-03-14 11:30:00', 870, 45000.00, 'International');

-- ================================================================
-- FLIGHT_SEATS — Generate availability for each flight
-- Copies seats from the aircraft's master seat list into flight_seats
-- Price = base_price × price_multiplier
-- ================================================================
DELIMITER //
DROP PROCEDURE IF EXISTS generate_flight_seats//
CREATE PROCEDURE generate_flight_seats()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE f_id INT;
    DECLARE f_aircraft_id INT;
    DECLARE f_base_price DECIMAL(10,2);

    DECLARE cur CURSOR FOR SELECT id, aircraft_id, base_price FROM flights;
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

CALL generate_flight_seats();
DROP PROCEDURE IF EXISTS generate_flight_seats;

-- ================================================================
-- ADMIN USER
-- Password: Admin@1234 (bcrypt hash, 12 rounds)
-- role_id = 2 (admin)
-- ================================================================
INSERT INTO users (role_id, first_name, last_name, email, password_hash, phone, gender) VALUES
  (2, 'System', 'Admin', 'admin@skybooker.com',
   '$2a$12$LJ3m4ys3Lk0TSwHjfY7fuOF7ntXnVpWWS20RFp1Ws8zuerMFNBfmW',
   '+91-9999999999', 'Male');

-- ================================================================
-- SAMPLE USER (for testing)
-- Password: User@1234 (bcrypt hash, 12 rounds)
-- role_id = 1 (user)
-- ================================================================
INSERT INTO users (role_id, first_name, last_name, email, password_hash, phone, gender) VALUES
  (1, 'Vipul', 'Sharma', 'vipul@example.com',
   '$2a$12$LJ3m4ys3Lk0TSwHjfY7fuOF7ntXnVpWWS20RFp1Ws8zuerMFNBfmW',
   '+91-9876543210', 'Male');

-- ================================================================
-- SEED COMPLETE
-- Admin login:  admin@skybooker.com / Admin@1234
-- User login:   vipul@example.com  / User@1234
-- Flights:      20 (15 domestic + 5 international)
-- Airports:     16 (12 Indian + 4 international)
-- Airlines:     8
-- Aircraft:     8
-- Seats:        ~1680 master seats → ~5400 flight_seats
-- ================================================================
