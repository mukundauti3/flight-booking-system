// ================================================================
// components/Navbar.jsx
// ================================================================
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiAirplay, FiSearch, FiBookmark, FiUser,
    FiLogOut, FiSettings, FiMenu, FiX
} from 'react-icons/fi';
import { MdFlight, MdDashboard } from 'react-icons/md';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

    return (
        <nav className="sky-navbar">
            <div className="container">
                <div className="d-flex align-items-center justify-content-between py-3">

                    {/* Brand */}
                    <Link to="/" className="brand d-flex align-items-center gap-2" style={{ textDecoration: 'none' }}>
                        <MdFlight size={26} style={{ color: 'var(--accent)' }} />
                        SkyBooker
                    </Link>

                    {/* Desktop Links */}
                    <div className="d-none d-md-flex align-items-center gap-1">
                        <NavLink to="/flights" className="nav-link px-3 py-2 d-flex align-items-center gap-2">
                            <FiSearch size={15} /> Flights
                        </NavLink>

                        {user && (
                            <NavLink to="/bookings" className="nav-link px-3 py-2 d-flex align-items-center gap-2">
                                <FiBookmark size={15} /> My Bookings
                            </NavLink>
                        )}

                        {isAdmin && (
                            <NavLink to="/admin" className="nav-link px-3 py-2 d-flex align-items-center gap-2"
                                style={{ color: 'var(--accent)' }}>
                                <MdDashboard size={15} /> Admin
                            </NavLink>
                        )}
                    </div>

                    {/* Auth Buttons */}
                    <div className="d-none d-md-flex align-items-center gap-2">
                        {user ? (
                            <div className="d-flex align-items-center gap-3">
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {user.firstName} {user.lastName}
                                </span>
                                <button onClick={handleLogout} className="btn-sky-outline py-2 px-3"
                                    style={{ borderRadius: 'var(--radius-sm)', fontSize: '14px' }}>
                                    <FiLogOut size={14} /> Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <NavLink to="/login" className="btn-sky-outline py-2 px-4" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    Login
                                </NavLink>
                                <NavLink to="/register" className="btn-sky py-2 px-4" style={{ borderRadius: 'var(--radius-sm)' }}>
                                    Sign Up
                                </NavLink>
                            </>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button className="d-md-none btn p-0" onClick={() => setOpen(!open)}
                        style={{ color: 'var(--text-primary)', background: 'none', border: 'none' }}>
                        {open ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {open && (
                    <div className="d-md-none pb-3 anim-fade-in" style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <div className="d-flex flex-column gap-1 pt-3">
                            <NavLink to="/flights" className="nav-link px-2 py-2" onClick={() => setOpen(false)}>
                                ✈ Flights
                            </NavLink>
                            {user && (
                                <NavLink to="/bookings" className="nav-link px-2 py-2" onClick={() => setOpen(false)}>
                                    📋 My Bookings
                                </NavLink>
                            )}
                            {isAdmin && (
                                <NavLink to="/admin" className="nav-link px-2 py-2" onClick={() => setOpen(false)}>
                                    ⚙ Admin
                                </NavLink>
                            )}
                            <div className="d-flex gap-2 mt-2">
                                {user ? (
                                    <button onClick={handleLogout} className="btn-sky-outline px-4 py-2 w-100">
                                        Logout
                                    </button>
                                ) : (
                                    <>
                                        <NavLink to="/login" className="btn-sky-outline px-4 py-2 flex-fill text-center"
                                            onClick={() => setOpen(false)}>Login</NavLink>
                                        <NavLink to="/register" className="btn-sky px-4 py-2 flex-fill text-center"
                                            onClick={() => setOpen(false)}>Sign Up</NavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
