// ================================================================
// pages/BookingConfirmation.jsx — Razorpay Payment + Confirmation
// ================================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

const fmtINR = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;
const fmtDT = (dt) => new Date(dt).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
});

export default function BookingConfirmation() {
    const { id: bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        bookingAPI.getById(bookingId)
            .then(r => {
                setBooking(r.data.data.booking);
                setPassengers(r.data.data.passengers);
                if (r.data.data.booking.status === 'Confirmed') {
                    setConfirmed(true);
                }
            })
            .catch(() => { toast.error('Could not load booking.'); navigate('/bookings'); })
            .finally(() => setLoading(false));
    }, [bookingId]);

    const handlePay = async () => {
        setPaying(true);
        try {
            // 1. Create Razorpay order via Node.js proxy → .NET
            const orderRes = await paymentAPI.createOrder({
                bookingId: parseInt(bookingId)
            });
            const { razorpayOrderId, amount, keyId } = orderRes.data.data;

            // 2. Open Razorpay checkout popup
            const rzpKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDERKEY';

            const options = {
                key: rzpKey,
                amount: Math.round(amount * 100), // paise
                currency: 'INR',
                name: 'SkyBooker',
                description: `Flight Booking — ${booking.booking_ref}`,
                order_id: razorpayOrderId,
                prefill: {
                    name: `${passengers[0]?.first_name || ''} ${passengers[0]?.last_name || ''}`,
                    email: '',
                    contact: ''
                },
                theme: { color: '#00b4d8' },
                modal: { ondismiss: () => { setPaying(false); toast.info('Payment cancelled.'); } },
                handler: async (response) => {
                    try {
                        // 3. Verify payment signature
                        await paymentAPI.verify({
                            bookingId: parseInt(bookingId),
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        setConfirmed(true);
                        toast.success('🎉 Payment successful! Booking confirmed.');
                    } catch (err) {
                        toast.error(err.response?.data?.error || 'Payment verification failed.');
                    } finally {
                        setPaying(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Could not initiate payment.');
            setPaying(false);
        }
    };

    if (loading) return <div className="container py-5"><LoadingSpinner text="Loading booking..." /></div>;

    // ---- Confirmed State ----
    if (confirmed) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-7">
                        <div className="glass-card p-5 text-center anim-fade-up">
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'rgba(74,222,128,0.12)',
                                border: '2px solid rgba(74,222,128,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px', animation: 'pulse-glow 2s infinite'
                            }}>
                                <FiCheckCircle size={38} style={{ color: 'var(--success)' }} />
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>
                                Booking Confirmed!
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                                Your flight is booked. A confirmation email has been sent.
                            </p>

                            <div style={{
                                background: 'rgba(0,180,216,0.06)', border: '1px solid rgba(0,180,216,0.15)',
                                borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 32, textAlign: 'left'
                            }}>
                                <div className="d-flex justify-content-between mb-2">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Booking Ref</span>
                                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: 2 }}>
                                        {booking?.booking_ref}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Route</span>
                                    <span style={{ fontWeight: 600 }}>{booking?.origin_code} → {booking?.dest_code}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Departure</span>
                                    <span style={{ fontWeight: 600 }}>{fmtDT(booking?.departure_time)}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Amount Paid</span>
                                    <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 18 }}>
                                        {fmtINR(booking?.total_amount)}
                                    </span>
                                </div>
                            </div>

                            <div className="d-flex gap-3 justify-content-center flex-wrap">
                                <button className="btn-sky py-2 px-5"
                                    onClick={() => navigate(`/tickets/${bookingId}`)}>
                                    View Tickets <FiArrowRight />
                                </button>
                                <button className="btn-sky-outline py-2 px-4"
                                    onClick={() => navigate('/bookings')}>
                                    My Bookings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Payment State ----
    return (
        <>
            {/* Razorpay SDK Script */}
            <script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <h3 className="mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                            Complete Payment
                        </h3>

                        {/* Order Summary */}
                        <div className="glass-card p-4 mb-4 anim-fade-up">
                            <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>
                                Order Summary
                            </h5>

                            <div className="d-flex align-items-center gap-3 mb-4 p-3"
                                style={{ background: 'rgba(0,180,216,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,180,216,0.15)' }}>
                                <MdFlight size={28} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />
                                <div>
                                    <div style={{ fontWeight: 700 }}>{booking?.flight_number} · {booking?.airline_name}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                        {booking?.origin_code} → {booking?.dest_code} · {fmtDT(booking?.departure_time)}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <h6 style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                                    Passengers ({passengers.length})
                                </h6>
                                {passengers.map((p, i) => (
                                    <div key={i} className="d-flex justify-content-between align-items-center py-2"
                                        style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</span>
                                            {p.seat_number && (
                                                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--accent)' }}>
                                                    Seat {p.seat_number} ({p.seat_class})
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                            {p.seat_price ? fmtINR(p.seat_price) : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex justify-content-between align-items-center pt-3">
                                <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 18 }}>Total</span>
                                <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)' }}>
                                    {fmtINR(booking?.total_amount)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="glass-card p-4 mb-4">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div style={{
                                    background: 'rgba(0,180,216,0.12)', border: '1px solid rgba(0,180,216,0.25)',
                                    borderRadius: 10, padding: '8px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 600
                                }}>
                                    🔒 Secured by Razorpay
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                                Pay securely via UPI, NetBanking, Debit/Credit Card, or Wallet.
                                Your seats will be held for <strong style={{ color: 'var(--warning)' }}>30 minutes</strong>.
                            </p>
                        </div>

                        <button className="btn-sky w-100 py-3" style={{ fontSize: 17, justifyContent: 'center' }}
                            onClick={handlePay} disabled={paying}>
                            {paying
                                ? <>Processing...</>
                                : <>
                                    <span style={{ fontSize: 20 }}>💳</span> Pay {fmtINR(booking?.total_amount)} Now
                                </>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
