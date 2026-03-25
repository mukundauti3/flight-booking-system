// ================================================================
// pages/BookingDetails.jsx — Single Booking with Cancel
// ================================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiXCircle, FiFileText } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

const fmtINR = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;
const fmtDT = (dt) => new Date(dt).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
});

export default function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    useEffect(() => {
        bookingAPI.getById(id)
            .then(r => {
                setBooking(r.data.data.booking);
                setPassengers(r.data.data.passengers);
            })
            .catch(() => { toast.error('Booking not found.'); navigate('/bookings'); })
            .finally(() => setLoading(false));
    }, [id]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await bookingAPI.cancel(id, 'Customer requested cancellation');
            toast.success('Booking cancelled. Refund will be processed in 5–7 business days.');
            setBooking(b => ({ ...b, status: 'Cancelled' }));
            setShowCancel(false);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Cancellation failed.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="container py-5"><LoadingSpinner text="Loading booking..." /></div>;

    const canCancel = ['Pending', 'Confirmed'].includes(booking?.status);
    const isConfirmed = booking?.status === 'Confirmed';

    return (
        <div className="container py-5">
            {/* Back */}
            <button onClick={() => navigate('/bookings')} className="btn-sky-outline py-2 px-3 mb-4"
                style={{ fontSize: 14, borderRadius: 8 }}>
                <FiArrowLeft /> My Bookings
            </button>

            <div className="row g-4">
                <div className="col-lg-8">
                    {/* Flight Card */}
                    <div className="glass-card p-4 mb-4 anim-fade-up">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div className="d-flex align-items-center gap-3">
                                <MdFlight size={28} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />
                                <div>
                                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 4 }}>
                                        {booking?.origin_code} → {booking?.dest_code}
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                                        {booking?.airline_name} · {booking?.flight_number}
                                    </p>
                                </div>
                            </div>
                            <span className={`status-badge ${booking?.status?.toLowerCase()}`}>
                                {booking?.status}
                            </span>
                        </div>

                        <div className="row g-3">
                            {[
                                ['Booking Ref', booking?.booking_ref],
                                ['Departure', fmtDT(booking?.departure_time)],
                                ['Arrival', fmtDT(booking?.arrival_time)],
                                ['Passengers', booking?.num_passengers],
                                ['Total Amount', fmtINR(booking?.total_amount)],
                                ['Booked On', fmtDT(booking?.booking_date)]
                            ].map(([label, val]) => (
                                <div key={label} className="col-md-4">
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Passengers */}
                    <div className="glass-card p-4 anim-fade-up" style={{ animationDelay: '0.1s' }}>
                        <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>
                            Passengers
                        </h5>
                        <div className="d-flex flex-column gap-3">
                            {passengers.map((p, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between py-2"
                                    style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                            {p.gender || 'N/A'} · {p.nationality || 'N/A'}
                                            {p.passport_number && ` · Passport: ${p.passport_number}`}
                                        </div>
                                    </div>
                                    {p.seat_number && (
                                        <div style={{
                                            background: 'rgba(0,180,216,0.10)', border: '1px solid rgba(0,180,216,0.25)',
                                            borderRadius: 999, padding: '4px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 600
                                        }}>
                                            {p.seat_number} · {p.seat_class}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions Sidebar */}
                <div className="col-lg-4">
                    <div className="glass-card p-4 anim-slide-right" style={{ position: 'sticky', top: 90 }}>
                        <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>
                            Actions
                        </h5>

                        {isConfirmed && (
                            <button className="btn-sky w-100 py-3 mb-3" style={{ justifyContent: 'center' }}
                                onClick={() => navigate(`/tickets/${id}`)}>
                                <FiFileText /> View Tickets
                            </button>
                        )}

                        {booking?.status === 'Pending' && (
                            <button className="btn-sky w-100 py-3 mb-3" style={{ justifyContent: 'center' }}
                                onClick={() => navigate(`/booking/${id}/payment`)}>
                                💳 Complete Payment
                            </button>
                        )}

                        {canCancel && !showCancel && (
                            <button onClick={() => setShowCancel(true)}
                                className="btn-sky-outline w-100 py-2 mb-3"
                                style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: 14 }}>
                                <FiXCircle /> Cancel Booking
                            </button>
                        )}

                        {showCancel && (
                            <div className="p-3" style={{
                                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                                borderRadius: 'var(--radius-sm)', marginBottom: 12
                            }}>
                                <p style={{ fontSize: 14, marginBottom: 12, color: '#fca5a5' }}>
                                    Are you sure you want to cancel? This action cannot be undone.
                                </p>
                                <div className="d-flex gap-2">
                                    <button onClick={handleCancel} disabled={cancelling}
                                        style={{
                                            flex: 1, background: 'var(--danger)', color: '#fff',
                                            border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer',
                                            fontWeight: 600, fontSize: 13
                                        }}>
                                        {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                    </button>
                                    <button onClick={() => setShowCancel(false)}
                                        style={{
                                            flex: 1, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                                            border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px',
                                            cursor: 'pointer', fontSize: 13
                                        }}>
                                        Keep
                                    </button>
                                </div>
                            </div>
                        )}

                        <button onClick={() => navigate('/flights')} className="btn-sky-outline w-100 py-2"
                            style={{ justifyContent: 'center', fontSize: 13 }}>
                            Book Another Flight
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
