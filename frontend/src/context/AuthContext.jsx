// ================================================================
// context/AuthContext.jsx — Global Auth State
// ================================================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('sky_user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    // Listen for 401 auto-logout events from Axios interceptor
    useEffect(() => {
        const handleLogout = () => { setUser(null); };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await authAPI.login({ email, password });
            const { token, user: userData } = res.data.data;
            localStorage.setItem('sky_token', token);
            localStorage.setItem('sky_user', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (data) => {
        setLoading(true);
        try {
            await authAPI.register(data);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('sky_token');
        localStorage.removeItem('sky_user');
        setUser(null);
    }, []);

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
