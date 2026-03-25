// ================================================================
// backend/__tests__/auth.test.js — Auth API Unit Tests (Jest + Supertest)
// ================================================================
const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');

let server;

beforeAll(async () => {
    server = app.listen(0); // random port
});

afterAll(async () => {
    await new Promise(r => server.close(r));
    await pool.end();
});

// ----------------------------------------------------------------
// POST /api/auth/register
// ----------------------------------------------------------------
describe('POST /api/auth/register', () => {
    const unique = `test_${Date.now()}@example.com`;

    it('registers a new user with valid data', async () => {
        const res = await request(server).post('/api/auth/register').send({
            firstName: 'Test',
            lastName: 'User',
            email: unique,
            password: 'Test@1234'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.user.email).toBe(unique);
    });

    it('rejects duplicate email', async () => {
        const res = await request(server).post('/api/auth/register').send({
            firstName: 'Test',
            lastName: 'User',
            email: unique,
            password: 'Test@1234'
        });
        expect(res.statusCode).toBe(409);
    });

    it('rejects weak password', async () => {
        const res = await request(server).post('/api/auth/register').send({
            firstName: 'Bad', lastName: 'Pass', email: `bad_pass_${Date.now()}@test.com`, password: '1234'
        });
        expect(res.statusCode).toBe(400);
    });

    it('rejects missing email', async () => {
        const res = await request(server).post('/api/auth/register').send({
            firstName: 'No', lastName: 'Email', password: 'Test@1234'
        });
        expect(res.statusCode).toBe(400);
    });
});

// ----------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------
describe('POST /api/auth/login', () => {
    it('logs in with seeded admin credentials', async () => {
        const res = await request(server).post('/api/auth/login').send({
            email: 'admin@skybooker.com',
            password: 'Admin@1234'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.user.role).toBe('admin');
    });

    it('rejects wrong password', async () => {
        const res = await request(server).post('/api/auth/login').send({
            email: 'admin@skybooker.com', password: 'wrongpassword'
        });
        expect(res.statusCode).toBe(401);
    });

    it('rejects non-existent email', async () => {
        const res = await request(server).post('/api/auth/login').send({
            email: 'nobody@nowhere.com', password: 'Test@1234'
        });
        expect(res.statusCode).toBe(401);
    });
});

// ----------------------------------------------------------------
// GET /api/auth/me — Protected Route
// ----------------------------------------------------------------
describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
        const res = await request(server).post('/api/auth/login').send({
            email: 'admin@skybooker.com', password: 'Admin@1234'
        });
        token = res.body.data.token;
    });

    it('returns profile with valid token', async () => {
        const res = await request(server).get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('email');
    });

    it('rejects request without token', async () => {
        const res = await request(server).get('/api/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('rejects request with malformed token', async () => {
        const res = await request(server).get('/api/auth/me')
            .set('Authorization', 'Bearer not_a_real_token');
        expect(res.statusCode).toBe(401);
    });
});
