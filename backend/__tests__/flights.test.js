// ================================================================
// backend/__tests__/flights.test.js — Flight API Tests
// ================================================================
const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');

let server, adminToken;

beforeAll(async () => {
    server = app.listen(0);
    const res = await request(server).post('/api/auth/login').send({
        email: 'admin@skybooker.com', password: 'Admin@1234'
    });
    adminToken = res.body.data?.token;
});

afterAll(async () => {
    await new Promise(r => server.close(r));
    await pool.end();
});

describe('GET /api/flights/search', () => {
    it('returns flights without filters', async () => {
        const res = await request(server).get('/api/flights/search');
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('flights');
        expect(Array.isArray(res.body.data.flights)).toBe(true);
    });

    it('filters by flightType=Domestic', async () => {
        const res = await request(server).get('/api/flights/search?type=Domestic');
        expect(res.statusCode).toBe(200);
        res.body.data.flights.forEach(f => {
            expect(f.flight_type).toBe('Domestic');
        });
    });

    it('sorts by price ascending', async () => {
        const res = await request(server).get('/api/flights/search?sortBy=price_asc');
        expect(res.statusCode).toBe(200);
        const prices = res.body.data.flights.map(f => parseFloat(f.base_price));
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('enforces invalid sortBy safely', async () => {
        const res = await request(server).get('/api/flights/search?sortBy=DROPTABLE');
        expect([200, 400]).toContain(res.statusCode);
        if (res.statusCode === 200) {
            expect(Array.isArray(res.body.data.flights)).toBe(true);
        }
    });
});

describe('GET /api/flights/airports', () => {
    it('returns airport list', async () => {
        const res = await request(server).get('/api/flights/airports');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0]).toHaveProperty('code');
    });
});

describe('Admin — POST /api/admin/flights', () => {
    it('creates a flight with admin token', async () => {
        const res = await request(server)
            .post('/api/admin/flights')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                flightNumber: 'TS999',
                airlineId: 1,
                aircraftId: 1,
                originAirportId: 1,
                destAirportId: 2,
                departureTime: '2027-01-15T06:00:00',
                arrivalTime: '2027-01-15T08:30:00',
                durationMinutes: 150,
                basePrice: 3500,
                flightType: 'Domestic'
            });
        expect([201, 409]).toContain(res.statusCode);
    });

    it('rejects flight creation without admin token', async () => {
        const res = await request(server).post('/api/admin/flights').send({ flightNumber: 'TS999' });
        expect(res.statusCode).toBe(401);
    });
});
