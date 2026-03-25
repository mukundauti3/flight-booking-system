// ================================================================
// pages/BookingHistory.jsx — User's Booking List
// ================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiArrowRight, FiSearch } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

const fmtDT = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtINR = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;

export default function BookingHistory() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        bookingAPI.getAll({ limit: 50 })
            .then(r => setBookings(r.data.data?.bookings || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status.toLowerCase() === filter);

    return (
        <div className="container py-5">
            <div className="page-header">
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>My Bookings</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
                </p>
            </div>

            {/* Filter tabs */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
                {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--glass-border)'}`,
                            color: filter === f ? '#fff' : 'var(--text-secondary)',
                            borderRadius: 999, padding: '6px 18px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
                            textTransform: 'capitalize'
                        }}>
                        {f}
                    </button>
                ))}
            </div>

            {loading && <LoadingSpinner text="Loading bookings..." />}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-5">
                    <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
                    <h5 style={{ fontFamily: 'var(--font-display)' }}>No Bookings Found</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {filter !== 'all' ? 'No bookings with this status.' : "You haven't made any bookings yet."}
                    </p>
                    <button className="btn-sky mt-3" onClick={() => navigate('/flights')}>
                        <FiSearch /> Search Flights
                    </button>
                </div>
            )}

            <div className="d-flex flex-column gap-3 stagger-children">
                {filtered.map(b => (
                    <div key={b.id} className="glass-card p-4" style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/bookings/${b.id}`)}>
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            {/* Route */}
                            <div className="d-flex align-items-center gap-3">
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: 'rgba(0,180,216,0.10)', border: '1px solid rgba(0,180,216,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <MdFlight size={22} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                                        {b.origin_code} → {b.dest_code}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {b.airline_name} · {b.flight_number}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Departure: {fmtDT(b.departure_time)}
                                    </div>
                                </div>
                            </div>

                            {/* Right side */}
                            <div className="d-flex align-items-center gap-3">
                                <span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
                                        {fmtINR(b.total_amount)}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Ref: {b.booking_ref}
                                    </div>
                                </div>
                                <FiArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        {/* Progress bar for Pending */}
                        {b.status === 'Pending' && (
                            <div className="mt-3" style={{
                                background: 'rgba(251,191,36,0.08)', borderRadius: 8,
                                padding: '10px 14px', border: '1px solid rgba(251,191,36,0.2)',
                                fontSize: 13, color: 'var(--warning)'
                            }}>
                                ⏳ Payment pending — click to complete your booking.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
