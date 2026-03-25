// ================================================================
// pages/Register.jsx
// ================================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdFlight } from 'react-icons/md';
import { toast } from 'react-toastify';

export default function Register() {
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        password: '', confirm: '', phone: '', gender: ''
    });
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }

        const result = await register({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            phone: form.phone || undefined,
            gender: form.gender || undefined
        });

        if (result.success) {
            toast.success('Account created! Please log in.');
            navigate('/login');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="auth-page" style={{ paddingTop: 40, paddingBottom: 40 }}>
            <div className="auth-box anim-fade-up" style={{ maxWidth: 520 }}>
                <div className="text-center mb-4">
                    <MdFlight size={36} style={{ color: 'var(--accent)', marginBottom: 12 }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>Create Account</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
                        Join SkyBooker and start booking flights
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger py-2 mb-4" style={{ fontSize: 14, borderRadius: 'var(--radius-sm)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-6">
                            <label className="sky-label">First Name *</label>
                            <input className="sky-input" placeholder="Vipul"
                                value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                        </div>
                        <div className="col-6">
                            <label className="sky-label">Last Name *</label>
                            <input className="sky-input" placeholder="Sharma"
                                value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
                        </div>
                        <div className="col-12">
                            <label className="sky-label">Email *</label>
                            <input type="email" className="sky-input" placeholder="you@example.com"
                                value={form.email} onChange={e => set('email', e.target.value)} required />
                        </div>
                        <div className="col-12">
                            <label className="sky-label">Password * <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(8+ chars, uppercase, number, special char)</span></label>
                            <input type="password" className="sky-input" placeholder="Min 8 characters"
                                value={form.password} onChange={e => set('password', e.target.value)} required />
                        </div>
                        <div className="col-12">
                            <label className="sky-label">Confirm Password *</label>
                            <input type="password" className="sky-input" placeholder="Repeat password"
                                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
                        </div>
                        <div className="col-6">
                            <label className="sky-label">Phone</label>
                            <input className="sky-input" placeholder="+91 98765 43210"
                                value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </div>
                        <div className="col-6">
                            <label className="sky-label">Gender</label>
                            <select className="sky-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="">Prefer not to say</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-sky w-100 py-3 mt-4" disabled={loading}
                        style={{ fontSize: 16, justifyContent: 'center' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center mt-4" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
}
