// ================================================================
// pages/admin/AdminFlights.jsx — Flight CRUD
// ================================================================
import { useState, useEffect } from 'react';
import { adminAPI, flightAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';

const fmtDT = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
const fmtINR = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

export default function AdminFlights() {
    const [flights, setFlights] = useState([]);
    const [airlines, setAirlines] = useState([]);
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null); // flight object or null (=create)
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        flightNumber: '', airlineId: '', aircraftId: '1', originAirportId: '', destAirportId: '',
        departureTime: '', arrivalTime: '', durationMinutes: '', basePrice: '', flightType: 'Domestic'
    };
    const [form, setForm] = useState(emptyForm);
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const loadFlights = () =>
        adminAPI.listFlights({ page: 1, limit: 50 })
            .then(r => setFlights(r.data.data?.flights || []));

    useEffect(() => {
        Promise.all([
            loadFlights(),
            flightAPI.airlines().then(r => setAirlines(r.data.data || [])),
            flightAPI.airports().then(r => setAirports(r.data.data || []))
        ]).finally(() => setLoading(false));
    }, []);

    const openEdit = (flight) => {
        setEditing(flight);
        setForm({
            flightNumber: flight.flight_number,
            airlineId: flight.airline_id,
            aircraftId: flight.aircraft_id || '1',
            originAirportId: flight.origin_airport_id || '',
            destAirportId: flight.dest_airport_id || '',
            departureTime: flight.departure_time?.slice(0, 16) || '',
            arrivalTime: flight.arrival_time?.slice(0, 16) || '',
            durationMinutes: flight.duration_minutes,
            basePrice: flight.base_price,
            flightType: flight.flight_type
        });
        setShowForm(true);
    };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                airlineId: parseInt(form.airlineId),
                aircraftId: parseInt(form.aircraftId),
                originAirportId: parseInt(form.originAirportId),
                destAirportId: parseInt(form.destAirportId),
                durationMinutes: parseInt(form.durationMinutes),
                basePrice: parseFloat(form.basePrice)
            };

            if (editing) {
                await adminAPI.updateFlight(editing.id, payload);
                toast.success('Flight updated.');
            } else {
                await adminAPI.createFlight(payload);
                toast.success('Flight created.');
            }
            await loadFlights();
            setShowForm(false);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this flight? This cannot be undone.')) return;
        try {
            await adminAPI.deleteFlight(id);
            toast.success('Flight deleted.');
            setFlights(f => f.filter(x => x.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete failed.');
        }
    };

    if (loading) return <div className="container py-5"><LoadingSpinner text="Loading flights..." /></div>;

    return (
        <div className="container py-5">
            <div className="page-header d-flex justify-content-between align-items-center">
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Manage Flights</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{flights.length} flights in the system</p>
                </div>
                <button className="btn-sky py-2 px-4" onClick={openCreate}>
                    <FiPlus /> Add Flight
                </button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="glass-card p-4 mb-4 anim-fade-up">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
                            {editing ? 'Edit Flight' : 'Add New Flight'}
                        </h5>
                        <button onClick={() => setShowForm(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <FiX size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="sky-label">Flight Number *</label>
                                <input className="sky-input" value={form.flightNumber}
                                    onChange={e => setF('flightNumber', e.target.value)} required />
                            </div>
                            <div className="col-md-3">
                                <label className="sky-label">Airline *</label>
                                <select className="sky-input" value={form.airlineId}
                                    onChange={e => setF('airlineId', e.target.value)} required>
                                    <option value="">Select airline</option>
                                    {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="sky-label">Origin *</label>
                                <select className="sky-input" value={form.originAirportId}
                                    onChange={e => setF('originAirportId', e.target.value)} required>
                                    <option value="">Select</option>
                                    {airports.map(a => <option key={a.id} value={a.id}>{a.city} ({a.code})</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="sky-label">Destination *</label>
                                <select className="sky-input" value={form.destAirportId}
                                    onChange={e => setF('destAirportId', e.target.value)} required>
                                    <option value="">Select</option>
                                    {airports.map(a => <option key={a.id} value={a.id}>{a.city} ({a.code})</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="sky-label">Departure *</label>
                                <input type="datetime-local" className="sky-input" value={form.departureTime}
                                    onChange={e => setF('departureTime', e.target.value)} required />
                            </div>
                            <div className="col-md-3">
                                <label className="sky-label">Arrival *</label>
                                <input type="datetime-local" className="sky-input" value={form.arrivalTime}
                                    onChange={e => setF('arrivalTime', e.target.value)} required />
                            </div>
                            <div className="col-md-2">
                                <label className="sky-label">Duration (mins) *</label>
                                <input type="number" className="sky-input" value={form.durationMinutes}
                                    onChange={e => setF('durationMinutes', e.target.value)} required />
                            </div>
                            <div className="col-md-2">
                                <label className="sky-label">Base Price (₹) *</label>
                                <input type="number" step="0.01" className="sky-input" value={form.basePrice}
                                    onChange={e => setF('basePrice', e.target.value)} required />
                            </div>
                            <div className="col-md-2">
                                <label className="sky-label">Type *</label>
                                <select className="sky-input" value={form.flightType}
                                    onChange={e => setF('flightType', e.target.value)}>
                                    <option>Domestic</option>
                                    <option>International</option>
                                </select>
                            </div>
                            <div className="col-12 d-flex gap-3 justify-content-end">
                                <button type="button" className="btn-sky-outline py-2 px-4" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-sky py-2 px-4" disabled={saving}>
                                    <FiCheck /> {saving ? 'Saving...' : 'Save Flight'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Flights Table */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table sky-table mb-0">
                        <thead>
                            <tr>
                                <th>Flight</th><th>Route</th><th>Departure</th>
                                <th>Duration</th><th>Price</th><th>Type</th>
                                <th>Seats</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flights.map(f => (
                                <tr key={f.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{f.flight_number}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.airline_name}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {f.origin_city} → {f.dest_city}
                                    </td>
                                    <td style={{ fontSize: 13 }}>{fmtDT(f.departure_time)}</td>
                                    <td style={{ fontSize: 13 }}>
                                        {Math.floor(f.duration_minutes / 60)}h {f.duration_minutes % 60}m
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmtINR(f.base_price)}</td>
                                    <td>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                                            background: f.flight_type === 'Domestic' ? 'rgba(0,180,216,0.12)' : 'rgba(124,58,237,0.12)',
                                            color: f.flight_type === 'Domestic' ? 'var(--accent)' : '#a78bfa'
                                        }}>{f.flight_type}</span>
                                    </td>
                                    <td style={{ fontSize: 13, color: f.available_seats > 10 ? 'var(--success)' : 'var(--warning)' }}>
                                        {f.available_seats ?? '—'}
                                    </td>
                                    <td><span className={`status-badge ${f.status?.toLowerCase() || 'confirmed'}`}>{f.status || 'Scheduled'}</span></td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => openEdit(f)}
                                                style={{ background: 'rgba(0,180,216,0.12)', border: 'none', color: 'var(--accent)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(f.id)}
                                                style={{ background: 'rgba(248,113,113,0.12)', border: 'none', color: 'var(--danger)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
