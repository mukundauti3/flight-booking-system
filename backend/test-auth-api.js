const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
    console.log('--- Testing Auth Endpoints ---');

    // 1. Test Registration
    console.log('\n[1] Testing Registration...');
    try {
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            firstName: 'Test',
            lastName: 'User',
            email: `test_${Date.now()}@example.com`,
            password: 'Password@123',
            phone: '1234567890',
            gender: 'Male'
        });
        console.log('✅ Registration Status:', regRes.status);
        console.log('Data:', regRes.data);
    } catch (err) {
        console.error('❌ Registration Failed:', err.response ? err.response.data : err.message);
    }

    // 2. Test Login (Existing User)
    console.log('\n[2] Testing Login (user)...');
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'vipul@example.com',
            password: 'User@1234'
        });
        console.log('✅ Login Status:', loginRes.status);
        console.log('Token received:', !!loginRes.data.data.token);
    } catch (err) {
        console.error('❌ Login Failed:', err.response ? err.response.data : err.message);
    }

    // 3. Test Admin Login (Should fail with current DB state)
    console.log('\n[3] Testing Admin Login...');
    try {
        const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@skybooker.com',
            password: 'Admin@1234'
        });
        console.log('✅ Admin Login Status:', adminRes.status);
    } catch (err) {
        console.error('❌ Admin Login Failed (Expected):', err.response ? err.response.data : err.message);
    }
}

testAuth();
