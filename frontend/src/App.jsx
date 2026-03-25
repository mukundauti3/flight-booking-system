// ================================================================
// App.jsx — Router + Layout
// ================================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FlightSearch from './pages/FlightSearch';
import SeatSelection from './pages/SeatSelection';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import BookingDetails from './pages/BookingDetails';
import TicketView from './pages/TicketView';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFlights from './pages/admin/AdminFlights';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';

// Guards
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAdmin } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;
    return children;
};

const PublicOnlyRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
    return (
        <>
            <Navbar />
            <main style={{ minHeight: '80vh' }}>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Home />} />
                    <Route path="/flights" element={<FlightSearch />} />

                    {/* Public only */}
                    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                    <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

                    {/* Protected */}
                    <Route path="/flights/:id/seats" element={<PrivateRoute><SeatSelection /></PrivateRoute>} />
                    <Route path="/booking/:id/payment" element={<PrivateRoute><BookingConfirmation /></PrivateRoute>} />
                    <Route path="/bookings" element={<PrivateRoute><BookingHistory /></PrivateRoute>} />
                    <Route path="/bookings/:id" element={<PrivateRoute><BookingDetails /></PrivateRoute>} />
                    <Route path="/tickets/:bookingId" element={<PrivateRoute><TicketView /></PrivateRoute>} />

                    {/* Admin */}
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/flights" element={<AdminRoute><AdminFlights /></AdminRoute>} />
                    <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    theme="dark"
                    toastStyle={{
                        background: 'rgba(15,22,41,0.95)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        backdropFilter: 'blur(12px)',
                        color: '#f0f4ff'
                    }}
                />
            </BrowserRouter>
        </AuthProvider>
    );
}
