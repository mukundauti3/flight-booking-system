// ================================================================
// components/FlightCard.jsx — Animated Flight Result Card
// ================================================================
import { useNavigate } from 'react-router-dom';
import { MdFlight, MdAccessTime, MdAirlineSeatReclineNormal } from 'react-icons/md';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const fmtTime = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtDur = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;
const fmtINR = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;

const seatBadge = (count) => {
    if (count === 0) return { cls: 'sold', label: 'Sold Out' };
    if (count <= 10) return { cls: 'limited', label: `${count} seats left` };
    return { cls: 'available', label: `${count} available` };
};

export default function FlightCard({ flight }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSelect = () => {
        if (!user) {
            toast.info('Please log in to book a flight.');
            navigate('/login');
            return;
        }
        navigate(`/flights/${flight.id}/seats`);
    };

    const sb = seatBadge(flight.available_seats ?? 0);

    return (
        <div className="flight-card anim-fade-up" onClick={handleSelect} role="button">
            {/* Airline Info */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: 'rgba(0,180,216,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(0,180,216,0.25)'
                    }}>
                        <MdFlight size={22} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{flight.airline_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                            {flight.flight_number} · {flight.aircraft_model || 'Aircraft'}
                        </div>
                    </div>
                </div>
                <span className={`seat-badge ${sb.cls}`}>{sb.label}</span>
            </div>

            {/* Route */}
            <div className="flight-route mb-4">
                <div className="text-center">
                    <div className="city-code">{flight.origin_code}</div>
                    <div className="city-name">{flight.origin_city}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                        {fmtTime(flight.departure_time)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {fmtDate(flight.departure_time)}
                    </div>
                </div>

                <div className="route-line">
                    <div className="line" />
                    <MdFlight className="plane-icon" />
                    <div className="line" />
                </div>

                <div className="text-center">
                    <div className="city-code">{flight.dest_code}</div>
                    <div className="city-name">{flight.dest_city}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                        {fmtTime(flight.arrival_time)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {fmtDate(flight.arrival_time)}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                    <span className="d-flex align-items-center gap-1" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        <MdAccessTime size={14} /> {fmtDur(flight.duration_minutes)}
                    </span>
                    <span style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        color: 'var(--text-secondary)'
                    }}>
                        {flight.flight_type}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>from</div>
                        <div className="price-badge">{fmtINR(flight.base_price)}</div>
                    </div>
                    <button className="btn-sky py-2 px-3" onClick={handleSelect}
                        style={{ fontSize: 13, borderRadius: 8 }}>
                        Select <FiArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
}
