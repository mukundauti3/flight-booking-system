// ================================================================
// pages/Login.jsx
// ================================================================
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdFlight } from 'react-icons/md';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function Login() {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form.email, form.password);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box anim-fade-up">
                {/* Brand */}
                <div className="text-center mb-4">
                    <MdFlight size={36} style={{ color: 'var(--accent)', marginBottom: 12 }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
                        Sign in to access your bookings
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger py-2 mb-4" style={{ fontSize: 14, borderRadius: 'var(--radius-sm)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="sky-label"><FiMail size={13} /> Email</label>
                        <input type="email" className="sky-input" placeholder="you@example.com"
                            value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>

                    <div className="mb-4">
                        <label className="sky-label"><FiLock size={13} /> Password</label>
                        <input type="password" className="sky-input" placeholder="Your password"
                            value={form.password} onChange={e => set('password', e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-sky w-100 py-3" disabled={loading}
                        style={{ fontSize: 16, justifyContent: 'center' }}>
                        {loading ? 'Signing in...' : <><FiArrowRight /> Sign In</>}
                    </button>
                </form>

                <div className="text-center mt-4" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up</Link>
                </div>

                {/* Demo credentials */}
                <div className="mt-4 p-3" style={{
                    background: 'rgba(0,180,216,0.05)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(0,180,216,0.15)', fontSize: 12, color: 'var(--text-muted)'
                }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Test Credentials</div>
                    <div>User: vipul@example.com / User@1234</div>
                    <div>Admin: admin@skybooker.com / Admin@1234</div>
                </div>
            </div>
        </div>
    );
}
