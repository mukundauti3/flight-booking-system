// ================================================================
// pages/TicketView.jsx — Digital Ticket with Print/Download
// ================================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';
import { MdFlight, MdQrCode } from 'react-icons/md';

const fmtTime = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtDur = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

export default function TicketView() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ticketAPI.getByBooking(bookingId)
            .then(r => setData(r.data.data))
            .catch(() => { toast.error('Could not load tickets.'); navigate('/bookings'); })
            .finally(() => setLoading(false));
    }, [bookingId]);

    const handlePrint = () => window.print();

    if (loading) return <div className="container py-5"><LoadingSpinner text="Loading tickets..." /></div>;

    const { booking, tickets } = data;

    return (
        <div className="container py-5">
            {/* Controls (hidden when printing) */}
            <div className="d-flex align-items-center justify-content-between mb-4 no-print">
                <button onClick={() => navigate(`/bookings/${bookingId}`)}
                    className="btn-sky-outline py-2 px-3" style={{ fontSize: 14, borderRadius: 8 }}>
                    <FiArrowLeft /> Back
                </button>
                <button onClick={handlePrint} className="btn-sky py-2 px-4" style={{ fontSize: 14 }}>
                    <FiPrinter /> Print Tickets
                </button>
            </div>

            <div style={{ maxWidth: 680, margin: '0 auto' }}>
                {tickets.map((ticket, i) => (
                    <div key={i} className="ticket-card mb-5 anim-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                        {/* Ticket Header */}
                        <div className="ticket-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <MdFlight size={22} style={{ color: 'var(--accent)' }} />
                                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                                        SkyBooker
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Ticket No.
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: 2, color: 'var(--accent)' }}>
                                        {ticket.ticketNumber}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="ticket-body">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="text-center">
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
                                        {ticket.flight.origin}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
                                        Departure
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--accent)', marginTop: 4 }}>
                                        {fmtTime(ticket.flight.departure)}
                                    </div>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                        {fmtDur(ticket.flight.duration)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
                                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border), var(--accent))' }} />
                                        <MdFlight size={20} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />
                                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--accent), var(--border))' }} />
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                        {ticket.flight.flightNumber} · {ticket.flight.airline}
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
                                        {ticket.flight.destination}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
                                        Arrival
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--accent)', marginTop: 4 }}>
                                        {fmtTime(ticket.flight.arrival)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                                📅 {fmtDate(ticket.flight.departure)}
                            </div>
                        </div>

                        {/* Ticket Divider */}
                        <div className="ticket-divider">
                            <div className="ticket-notch" />
                            <div className="ticket-dashed-line" />
                            <div className="ticket-notch" />
                        </div>

                        {/* Passenger Details + QR */}
                        <div className="ticket-body d-flex justify-content-between align-items-start gap-4">
                            <div style={{ flex: 1 }}>
                                <div className="row g-3">
                                    {[
                                        ['Passenger', `${ticket.passenger.firstName} ${ticket.passenger.lastName}`],
                                        ['Gender', ticket.passenger.gender || 'N/A'],
                                        ['Seat', `${ticket.seat.number} · ${ticket.seat.class}`],
                                        ['Booking Ref', booking.bookingRef],
                                        ['Status', ticket.status],
                                        ['Issued', ticket.issuedAt ? new Date(ticket.issuedAt).toLocaleDateString() : '—']
                                    ].map(([label, val]) => (
                                        <div key={label} className="col-6">
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                                                {label}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* QR Code (visual placeholder — real QR generated in Phase 6) */}
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                <div style={{
                                    width: 96, height: 96,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: 10, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 6
                                }}>
                                    <MdQrCode size={48} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Scan at gate</div>
                            </div>
                        </div>

                        {/* Terms footer */}
                        <div style={{ padding: '12px 28px', borderTop: '1px solid var(--glass-border)' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                                This is a valid e-ticket. Please present it (print or digital) at the check-in counter.
                                SkyBooker is not responsible for denied boarding due to invalid travel documents.
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`@media print {
        .no-print { display: none !important; }
        .sky-navbar, .sky-footer { display: none !important; }
        body { background: #fff; color: #000; }
        .ticket-card { border: 1px solid #ccc; page-break-after: always; }
      }`}</style>
        </div>
    );
}
