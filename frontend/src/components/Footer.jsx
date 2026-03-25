// ================================================================
// components/Footer.jsx
// ================================================================
import { Link } from 'react-router-dom';
import { MdFlight } from 'react-icons/md';
import { FiGithub, FiMail } from 'react-icons/fi';

export default function Footer() {
    return (
        <footer className="sky-footer">
            <div className="container">
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <MdFlight size={22} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
                                SkyBooker
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, maxWidth: 280 }}>
                            Fast, reliable flight booking for domestic & international travel. Book in minutes, fly with confidence.
                        </p>
                    </div>

                    <div className="col-md-2">
                        <h6 className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Explore</h6>
                        <div className="d-flex flex-column gap-2">
                            {[['/', 'Home'], ['/flights', 'Search Flights'], ['/bookings', 'My Bookings']].map(([to, label]) => (
                                <Link key={to} to={to}
                                    style={{ color: 'var(--text-secondary)', fontSize: 14, transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="col-md-2">
                        <h6 className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Support</h6>
                        <div className="d-flex flex-column gap-2">
                            {[['#', 'Help Center'], ['#', 'Cancellation Policy'], ['#', 'Contact Us']].map(([to, label]) => (
                                <a key={label} href={to}
                                    style={{ color: 'var(--text-secondary)', fontSize: 14, transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                                    {label}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="col-md-4">
                        <h6 className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contact</h6>
                        <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            <FiMail size={14} /> support@skybooker.com
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2"
                    style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        © 2026 SkyBooker. All rights reserved.
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        Built with ❤ using React + Node.js + .NET
                    </span>
                </div>
            </div>
        </footer>
    );
}
