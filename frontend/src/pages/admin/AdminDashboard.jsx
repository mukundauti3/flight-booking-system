// ================================================================
// pages/admin/AdminDashboard.jsx — Stats + Recent Bookings + Routes
// ================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MdFlight, MdPeopleAlt, MdBookOnline, MdCurrencyRupee } from 'react-icons/md';
import { FiArrowRight } from 'react-icons/fi';

const fmtINR = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI.getAnalytics()
            .then(r => setData(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="container py-5"><LoadingSpinner text="Loading dashboard..." /></div>;

    const { stats, recentBookings, popularRoutes } = data || {};

    const CARDS = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: MdPeopleAlt, cls: 'blue', prefix: '' },
        { label: 'Total Flights', value: stats?.total_flights || 0, icon: MdFlight, cls: 'purple', prefix: '' },
        { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: MdBookOnline, cls: 'green', prefix: '' },
        { label: 'Total Revenue', value: fmtINR(stats?.total_revenue), icon: MdCurrencyRupee, cls: 'amber', prefix: '' }
    ];

    return (
        <div className="container py-5">
            <div className="page-header">
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Admin Dashboard</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    Overview of SkyBooker operations
                </p>
            </div>

            {/* Quick Nav */}
            <div className="d-flex gap-2 mb-5 flex-wrap">
                {[
                    ['/admin/flights', '✈ Manage Flights'],
                    ['/admin/bookings', '📋 All Bookings'],
                    ['/admin/users', '👥 Users']
                ].map(([to, label]) => (
                    <button key={to} onClick={() => navigate(to)} className="btn-sky-outline py-2 px-4" style={{ fontSize: 13 }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Stat Cards */}
            <div className="row g-4 mb-5 stagger-children">
                {CARDS.map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className="col-md-3 col-sm-6">
                        <div className={`stat-card ${cls}`}>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <span className="stat-label">{label}</span>
                                <Icon size={22} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                            </div>
                            <div className="stat-number">{value}</div>

                            {/* Mini breakdown */}
                            {label === 'Total Bookings' && (
                                <div className="d-flex gap-3 mt-3" style={{ fontSize: 12 }}>
                                    <span style={{ color: 'var(--warning)' }}>⏳ {stats?.pending_bookings} Pending</span>
                                    <span style={{ color: 'var(--success)' }}>✓ {stats?.confirmed_bookings} Confirmed</span>
                                    <span style={{ color: 'var(--danger)' }}>✗ {stats?.cancelled_bookings} Cancelled</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Recent Bookings */}
                <div className="col-lg-8">
                    <div className="glass-card p-4 anim-fade-up">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
                                Recent Bookings
                            </h5>
                            <button onClick={() => navigate('/admin/bookings')} className="btn-sky-outline py-1 px-3"
                                style={{ fontSize: 12 }}>
                                View All <FiArrowRight />
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="table sky-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Ref</th><th>Passenger</th><th>Route</th><th>Date</th><th>Status</th><th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recentBookings || []).slice(0, 8).map(b => (
                                        <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${b.id}`)}>
                                            <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent)' }}>{b.booking_ref}</td>
                                            <td style={{ fontSize: 13 }}>{b.user_first_name} {b.user_last_name}</td>
                                            <td style={{ fontSize: 13, fontWeight: 600 }}>{b.origin_city} → {b.dest_city}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(b.booking_date)}</td>
                                            <td><span className={`status-badge ${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                            <td style={{ fontWeight: 600 }}>{fmtINR(b.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Popular Routes */}
                <div className="col-lg-4">
                    <div className="glass-card p-4 anim-slide-right">
                        <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>
                            Popular Routes
                        </h5>
                        {(popularRoutes || []).map((r, i) => (
                            <div key={i} className="d-flex justify-content-between align-items-center py-3"
                                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.origin} → {r.destination}</div>
                                </div>
                                <div style={{
                                    background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.2)',
                                    borderRadius: 999, padding: '3px 12px', fontSize: 12, color: 'var(--accent)', fontWeight: 600
                                }}>
                                    {r.booking_count} bookings
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
