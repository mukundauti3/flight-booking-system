// ================================================================
// pages/SeatSelection.jsx — Seat Map + Passenger Details + Book
// ================================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flightAPI, bookingAPI } from '../services/api';
import SeatMap from '../components/SeatMap';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { MdFlight } from 'react-icons/md';
import { FiArrowRight, FiUser, FiPlus, FiTrash2 } from 'react-icons/fi';

const fmt = (dt) => new Date(dt).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false
});
const fmtINR = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;

const emptyPax = { firstName: '', lastName: '', gender: '', dateOfBirth: '', nationality: 'Indian', passportNumber: '', seatId: null };

export default function SeatSelection() {
    const { id: flightId } = useParams();
    const navigate = useNavigate();

    const [flight, setFlight] = useState(null);
    const [seatData, setSeatData] = useState({ seats: [], availableSeats: 0 });
    const [selected, setSelected] = useState([]);  // selected seat objects
    const [passengers, setPassengers] = useState([{ ...emptyPax }]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [step, setStep] = useState(1); // 1=seats, 2=passengers

    useEffect(() => {
        Promise.all([
            flightAPI.getById(flightId),
            flightAPI.getSeats(flightId)
        ]).then(([fr, sr]) => {
            setFlight(fr.data.data);
            setSeatData(sr.data.data);
        }).catch(() => {
            toast.error('Failed to load flight details.');
            navigate('/flights');
        }).finally(() => setLoading(false));
    }, [flightId]);

    // Sync selected seats into passenger seatId fields
    useEffect(() => {
        setPassengers(prev => prev.map((pax, i) => ({
            ...pax,
            seatId: selected[i]?.flight_seat_id ?? null
        })));
    }, [selected]);

    const addPassenger = () => {
        if (passengers.length >= 9) return;
        setPassengers(p => [...p, { ...emptyPax }]);
    };
    const removePassenger = (i) => {
        setPassengers(p => p.filter((_, idx) => idx !== i));
        setSelected(s => s.filter((_, idx) => idx !== i));
    };
    const setPax = (i, k, v) => setPassengers(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

    const handleBook = async () => {
        // Validate required fields
        for (let i = 0; i < passengers.length; i++) {
            const p = passengers[i];
            if (!p.firstName || !p.lastName) {
                toast.error(`Passenger ${i + 1}: First and last name are required.`);
                return;
            }
            if (flight?.flight_type === 'International' && !p.passportNumber) {
                toast.error(`Passenger ${i + 1}: Passport number required for international flights.`);
                return;
            }
        }

        setBooking(true);
        try {
            const payload = {
                flightId: parseInt(flightId),
                passengers: passengers.map((p, i) => ({
                    firstName: p.firstName,
                    lastName: p.lastName,
                    gender: p.gender || undefined,
                    dateOfBirth: p.dateOfBirth || undefined,
                    nationality: p.nationality || undefined,
                    passportNumber: p.passportNumber || undefined,
                    seatId: selected[i]?.flight_seat_id ?? undefined
                }))
            };

            const res = await bookingAPI.create(payload);
            const bookingId = res.data.data.booking.id;
            toast.success('Booking created! Proceeding to payment...');
            navigate(`/booking/${bookingId}/payment`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <div className="container py-5"><LoadingSpinner text="Loading flight & seats..." /></div>;

    return (
        <div className="container py-5">
            {/* Flight Summary Header */}
            <div className="glass-card p-4 mb-4 anim-fade-up">
                <div className="row align-items-center">
                    <div className="col">
                        <div className="d-flex align-items-center gap-3">
                            <MdFlight size={28} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />
                            <div>
                                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 2 }}>
                                    {flight?.origin_code} → {flight?.dest_code}
                                </h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                                    {flight?.airline_name} · {flight?.flight_number} · {fmt(flight?.departure_time)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-auto text-end">
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>from</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--accent)' }}>
                            {fmtINR(flight?.base_price)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{seatData.availableSeats} seats available</div>
                    </div>
                </div>
            </div>

            {/* Step indicator */}
            <div className="d-flex align-items-center gap-3 mb-4">
                {[['1', 'Select Seats'], ['2', 'Passenger Details']].map(([n, label], i) => (
                    <div key={n} className="d-flex align-items-center gap-2">
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: step >= parseInt(n) ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                            color: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700, fontSize: 14,
                            transition: 'background 0.3s ease'
                        }}>{n}</div>
                        <span style={{
                            fontSize: 14, fontWeight: 500,
                            color: step >= parseInt(n) ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}>{label}</span>
                        {i < 1 && <FiArrowRight size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Seat Map */}
            {step === 1 && (
                <div className="anim-fade-in">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                            Choose {passengers.length} Seat{passengers.length > 1 ? 's' : ''}
                        </h5>
                        <div className="d-flex align-items-center gap-2">
                            <button className="btn-sky-outline py-1 px-3" onClick={addPassenger}
                                disabled={passengers.length >= 9} style={{ fontSize: 13, borderRadius: 8 }}>
                                <FiPlus /> Add Passenger
                            </button>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{passengers.length}/9</span>
                        </div>
                    </div>

                    <SeatMap
                        seats={seatData.seats}
                        selectedSeats={selected}
                        onToggle={setSelected}
                        maxSeats={passengers.length}
                    />

                    <div className="d-flex justify-content-end mt-4">
                        <button className="btn-sky py-3 px-5" style={{ fontSize: 15 }}
                            onClick={() => setStep(2)}>
                            Continue to Passenger Details <FiArrowRight />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Passenger forms */}
            {step === 2 && (
                <div className="anim-fade-in">
                    <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 24 }}>
                        Passenger Details
                    </h5>

                    <div className="d-flex flex-column gap-4">
                        {passengers.map((pax, i) => (
                            <div key={i} className="glass-card p-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
                                        <FiUser size={15} style={{ marginRight: 8 }} />
                                        Passenger {i + 1}
                                        {selected[i] && (
                                            <span style={{
                                                marginLeft: 12, fontSize: 12,
                                                background: 'rgba(0,180,216,0.12)',
                                                border: '1px solid rgba(0,180,216,0.3)',
                                                color: 'var(--accent)', padding: '2px 10px', borderRadius: 999
                                            }}>
                                                Seat {selected[i].seat_number}
                                            </span>
                                        )}
                                    </h6>
                                    {passengers.length > 1 && (
                                        <button onClick={() => removePassenger(i)}
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                            <FiTrash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="sky-label">First Name *</label>
                                        <input className="sky-input" value={pax.firstName}
                                            onChange={e => setPax(i, 'firstName', e.target.value)} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="sky-label">Last Name *</label>
                                        <input className="sky-input" value={pax.lastName}
                                            onChange={e => setPax(i, 'lastName', e.target.value)} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="sky-label">Gender</label>
                                        <select className="sky-input" value={pax.gender} onChange={e => setPax(i, 'gender', e.target.value)}>
                                            <option value="">Select</option>
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="sky-label">Date of Birth</label>
                                        <input type="date" className="sky-input" value={pax.dateOfBirth}
                                            onChange={e => setPax(i, 'dateOfBirth', e.target.value)} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="sky-label">Nationality</label>
                                        <input className="sky-input" value={pax.nationality}
                                            onChange={e => setPax(i, 'nationality', e.target.value)} />
                                    </div>
                                    {flight?.flight_type === 'International' && (
                                        <div className="col-md-4">
                                            <label className="sky-label">Passport Number *</label>
                                            <input className="sky-input" placeholder="Required for international"
                                                value={pax.passportNumber} onChange={e => setPax(i, 'passportNumber', e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total + Actions */}
                    <div className="glass-card p-4 mt-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total Amount</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                                    {selected.length > 0
                                        ? fmtINR(selected.reduce((s, x) => s + parseFloat(x.price), 0))
                                        : fmtINR(parseFloat(flight?.base_price || 0) * passengers.length)
                                    }
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {passengers.length} passenger{passengers.length > 1 ? 's' : ''}
                                    {selected.length > 0 ? ` · Seats: ${selected.map(s => s.seat_number).join(', ')}` : ' · No seats selected'}
                                </div>
                            </div>
                            <div className="d-flex gap-3">
                                <button className="btn-sky-outline py-2 px-4" onClick={() => setStep(1)}>
                                    ← Back to Seats
                                </button>
                                <button className="btn-sky py-2 px-5" onClick={handleBook} disabled={booking}
                                    style={{ fontSize: 15 }}>
                                    {booking ? 'Creating Booking...' : <>Confirm & Pay <FiArrowRight /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
