// ================================================================
// pages/admin/AdminBookings.jsx — All Bookings Table
// ================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const fmtDT = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtINR = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

export default function AdminBookings() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        adminAPI.listBookings({ limit: 100 })
            .then(r => setBookings(r.data.data?.bookings || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = bookings
        .filter(b => filter === 'all' || b.status.toLowerCase() === filter)
        .filter(b => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                b.booking_ref.toLowerCase().includes(q) ||
                b.user_first_name?.toLowerCase().includes(q) ||
                b.user_last_name?.toLowerCase().includes(q) ||
                b.flight_number?.toLowerCase().includes(q)
            );
        });

    return (
        <div className="container py-5">
            <div className="page-header">
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>All Bookings</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    {filtered.length} of {bookings.length} bookings
                </p>
            </div>

            {/* Filters */}
            <div className="d-flex gap-3 mb-4 flex-wrap align-items-center">
                <input className="sky-input" placeholder="Search by ref, name, flight..." style={{ maxWidth: 280 }}
                    value={search} onChange={e => setSearch(e.target.value)} />
                <div className="d-flex gap-2 flex-wrap">
                    {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--glass-border)'}`,
                            color: filter === f ? '#fff' : 'var(--text-secondary)',
                            borderRadius: 999, padding: '6px 18px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, transition: 'all 0.2s', textTransform: 'capitalize'
                        }}>{f}</button>
                    ))}
                </div>
            </div>

            {loading && <LoadingSpinner text="Loading bookings..." />}

            {!loading && (
                <div className="glass-card p-0 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table sky-table mb-0">
                            <thead>
                                <tr>
                                    <th>Ref</th><th>Passenger</th><th>Route</th>
                                    <th>Departure</th><th>Passengers</th><th>Amount</th>
                                    <th>Booked</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => (
                                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${b.id}`)}>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>
                                                {b.booking_ref}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>
                                            <div style={{ fontWeight: 600 }}>{b.user_first_name} {b.user_last_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.user_email}</div>
                                        </td>
                                        <td style={{ fontWeight: 600, fontSize: 13 }}>
                                            {b.origin_code} → {b.dest_code}
                                        </td>
                                        <td style={{ fontSize: 13 }}>{fmtDT(b.departure_time)}</td>
                                        <td style={{ fontSize: 13, textAlign: 'center' }}>{b.num_passengers}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmtINR(b.total_amount)}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDT(b.booking_date)}</td>
                                        <td><span className={`status-badge ${b.status?.toLowerCase()}`}>{b.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
                                No bookings match your filters.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
