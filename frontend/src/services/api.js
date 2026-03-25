// ================================================================
// services/api.js — Axios API Service Layer
// ================================================================
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

// ---- Request Interceptor: attach JWT ----
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sky_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ---- Response Interceptor: handle 401 ----
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sky_token');
            localStorage.removeItem('sky_user');
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

// ================================================================
// Auth APIs
// ================================================================
export const authAPI = {
    // Matches Express-Validator: { firstName, lastName, email, password }
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// ================================================================
// Flight APIs (all public)
// ================================================================
export const flightAPI = {
    // Expected Search Params: { origin, destination, date, type, minPrice, maxPrice, sortBy, limit, offset }
    search: (params) => api.get('/flights/search', { params }),
    getById: (id) => api.get(`/flights/${id}`),
    getSeats: (id) => api.get(`/flights/${id}/seats`),
    airports: () => api.get('/flights/airports'),
    airlines: () => api.get('/flights/airlines')
};

// ================================================================
// Booking APIs
// ================================================================
export const bookingAPI = {
    create: (data) => api.post('/bookings', data),
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason })
};

// ================================================================
// Payment APIs
// ================================================================
export const paymentAPI = {
    createOrder: (data) => api.post('/payments/create-order', data),
    verify: (data) => api.post('/payments/verify', data),
    getStatus: (bookingId) => api.get(`/payments/${bookingId}/status`)
};

// ================================================================
// Ticket APIs
// ================================================================
export const ticketAPI = {
    getByBooking: (bookingId) => api.get(`/tickets/${bookingId}`)
};

// ================================================================
// Admin APIs
// ================================================================
export const adminAPI = {
    getAnalytics: () => api.get('/admin/analytics'),

    // Flights
    listFlights: (params) => api.get('/admin/flights', { params }),
    createFlight: (data) => api.post('/admin/flights', data),
    updateFlight: (id, data) => api.put(`/admin/flights/${id}`, data),
    deleteFlight: (id) => api.delete(`/admin/flights/${id}`),

    // Airlines
    listAirlines: () => api.get('/admin/airlines'),
    createAirline: (data) => api.post('/admin/airlines', data),
    updateAirline: (id, d) => api.put(`/admin/airlines/${id}`, d),

    // Users & Bookings
    listUsers: (params) => api.get('/admin/users', { params }),
    listBookings: (params) => api.get('/admin/bookings', { params }),

    // Logs
    getLogs: () => api.get('/admin/logs')
};

export default api;
