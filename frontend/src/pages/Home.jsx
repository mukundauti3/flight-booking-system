// ================================================================
// pages/Home.jsx — Landing Page
// ================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flightAPI } from '../services/api';
import { MdFlight, MdSecurity, MdSupportAgent } from 'react-icons/md';
import { FiSearch, FiArrowRight } from 'react-icons/fi';
import { RiCoupon3Line } from 'react-icons/ri';
import LoadingSpinner from '../components/LoadingSpinner';

const FEATURES = [
    { icon: MdFlight, title: 'Instant Booking', desc: 'Book in under 2 minutes with real-time seat selection.' },
    { icon: MdSecurity, title: 'Secure Payments', desc: 'Razorpay-powered — UPI, NetBanking, Cards, Wallets.' },
    { icon: RiCoupon3Line, title: 'Digital Tickets', desc: 'QR-coded e-tickets delivered instantly after payment.' },
    { icon: MdSupportAgent, title: '24/7 Support', desc: 'Round-the-clock customer support for peace of mind.' }
];

export default function Home() {
    const navigate = useNavigate();
    const [airports, setAirports] = useState([]);
    const [form, setForm] = useState({ origin: '', destination: '', date: '', type: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        flightAPI.airports()
            .then(r => setAirports(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (form.origin) params.set('origin', form.origin);
        if (form.destination) params.set('destination', form.destination);
        if (form.date) params.set('date', form.date);
        if (form.type) params.set('flightType', form.type);
        navigate(`/flights?${params.toString()}`);
    };

    const minDate = new Date().toISOString().split('T')[0];

    return (
        <>
            {/* ---- Hero ---- */}
            <section className="hero-section">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <div className="anim-fade-up">
                                <span style={{
                                    background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.3)',
                                    color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                                    padding: '6px 16px', borderRadius: 999, display: 'inline-block', marginBottom: 24
                                }}>
                                    ✈ Fast · Reliable · Affordable
                                </span>

                                <h1 className="hero-title mb-4">
                                    Book Your<br />
                                    <span className="hero-gradient-text">Dream Flight</span><br />
                                    In Minutes
                                </h1>

                                <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8, maxWidth: 420, marginBottom: 32 }}>
                                    Domestic & international flights. Real-time seat maps. Instant digital tickets.
                                    Zero hidden fees.
                                </p>

                                <div className="d-flex gap-3 flex-wrap">
                                    <button onClick={() => document.getElementById('search-box').scrollIntoView({ behavior: 'smooth' })}
                                        className="btn-sky px-5 py-3" style={{ fontSize: 16 }}>
                                        <FiSearch /> Search Flights
                                    </button>
                                    <button onClick={() => navigate('/flights')}
                                        className="btn-sky-outline px-5 py-3" style={{ fontSize: 16 }}>
                                        Browse All <FiArrowRight />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 anim-float">
                            {/* Stats */}
                            <div className="row g-3">
                                {[['50K+', 'Happy Travelers'], ['200+', 'Routes'], ['99.2%', 'On-Time'], ['4.8★', 'Rating']].map(([num, label]) => (
                                    <div key={label} className="col-6">
                                        <div className="glass-card p-4 text-center">
                                            <div style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: 32, fontWeight: 800,
                                                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent'
                                            }}>{num}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ---- Search Box ---- */}
                    <div id="search-box" className="search-box mt-5 anim-fade-up" style={{ animationDelay: '0.2s' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 24 }}>
                            🔍 Search Flights
                        </h2>
                        {loading ? <LoadingSpinner text="Loading airports..." /> : (
                            <form onSubmit={handleSearch}>
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <label className="sky-label">From</label>
                                        <select className="sky-input" value={form.origin} onChange={e => set('origin', e.target.value)}>
                                            <option value="">Any City</option>
                                            {airports.map(a => (
                                                <option key={a.id} value={a.city}>{a.city} ({a.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="sky-label">To</label>
                                        <select className="sky-input" value={form.destination} onChange={e => set('destination', e.target.value)}>
                                            <option value="">Any City</option>
                                            {airports.map(a => (
                                                <option key={a.id} value={a.city}>{a.city} ({a.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <label className="sky-label">Date</label>
                                        <input type="date" className="sky-input" min={minDate}
                                            value={form.date} onChange={e => set('date', e.target.value)} />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="sky-label">Type</label>
                                        <select className="sky-input" value={form.type} onChange={e => set('type', e.target.value)}>
                                            <option value="">All Flights</option>
                                            <option value="Domestic">Domestic</option>
                                            <option value="International">International</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2 d-flex align-items-end">
                                        <button type="submit" className="btn-sky w-100 py-3">
                                            <FiSearch /> Search
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* ---- Features ---- */}
            <section className="section">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800 }}>
                            Why Choose <span className="gradient-text">SkyBooker?</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>
                            Everything you need for a smooth booking experience.
                        </p>
                    </div>
                    <div className="row g-4 stagger-children">
                        {FEATURES.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="col-md-3 col-sm-6">
                                <div className="glass-card p-4 h-100 text-center">
                                    <div style={{
                                        width: 56, height: 56,
                                        background: 'rgba(0,180,216,0.12)',
                                        border: '1px solid rgba(0,180,216,0.25)',
                                        borderRadius: 14, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 18px'
                                    }}>
                                        <Icon size={26} style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 10 }}>{title}</h5>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
