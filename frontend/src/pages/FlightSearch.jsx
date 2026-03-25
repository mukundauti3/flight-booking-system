// ================================================================
// pages/FlightSearch.jsx — Search Results with Filters
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { flightAPI } from '../services/api';
import FlightCard from '../components/FlightCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';

export default function FlightSearch() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [airports, setAirports] = useState([]);
    const [flights, setFlights] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        origin: searchParams.get('origin') || '',
        destination: searchParams.get('destination') || '',
        date: searchParams.get('date') || '',
        flightType: searchParams.get('flightType') || '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'departure_asc'
    });

    const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

    useEffect(() => {
        flightAPI.airports().then(r => setAirports(r.data.data || [])).catch(() => { });
    }, []);

    const doSearch = useCallback(async (f) => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (f.origin) params.origin = f.origin;
            if (f.destination) params.destination = f.destination;
            if (f.date) params.date = f.date;
            if (f.flightType) params.type = f.flightType;
            if (f.minPrice) params.minPrice = f.minPrice;
            if (f.maxPrice) params.maxPrice = f.maxPrice;
            if (f.sortBy) params.sortBy = f.sortBy;
            params.limit = 20;

            const res = await flightAPI.search(params);
            const data = res.data.data;
            setFlights(data.flights || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load flights.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial search from URL params
    useEffect(() => { doSearch(filters); }, []); // eslint-disable-line

    const handleSearch = (e) => {
        e.preventDefault();
        const params = {};
        if (filters.origin) params.origin = filters.origin;
        if (filters.destination) params.destination = filters.destination;
        if (filters.date) params.date = filters.date;
        if (filters.flightType) params.flightType = filters.flightType;
        setSearchParams(params);
        doSearch(filters);
    };

    const clearFilters = () => {
        const cleared = { origin: '', destination: '', date: '', flightType: '', minPrice: '', maxPrice: '', sortBy: 'departure_asc' };
        setFilters(cleared);
        setSearchParams({});
        doSearch(cleared);
    };

    const minDate = new Date().toISOString().split('T')[0];

    return (
        <div className="container py-5">
            <div className="row g-4">

                {/* ---- Filters Sidebar ---- */}
                <div className="col-lg-3">
                    <div className="glass-card p-4" style={{ position: 'sticky', top: 90 }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h5 className="mb-0" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                                <FiFilter /> Filters
                            </h5>
                            <button onClick={clearFilters} className="btn p-0"
                                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: 13 }}>
                                <FiX size={14} /> Clear
                            </button>
                        </div>

                        <form onSubmit={handleSearch}>
                            <div className="mb-3">
                                <label className="sky-label">From</label>
                                <select className="sky-input" value={filters.origin} onChange={e => setF('origin', e.target.value)}>
                                    <option value="">Any City</option>
                                    {airports.map(a => <option key={a.id} value={a.city}>{a.city} ({a.code})</option>)}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="sky-label">To</label>
                                <select className="sky-input" value={filters.destination} onChange={e => setF('destination', e.target.value)}>
                                    <option value="">Any City</option>
                                    {airports.map(a => <option key={a.id} value={a.city}>{a.city} ({a.code})</option>)}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="sky-label">Date</label>
                                <input type="date" className="sky-input" min={minDate}
                                    value={filters.date} onChange={e => setF('date', e.target.value)} />
                            </div>

                            <div className="mb-3">
                                <label className="sky-label">Flight Type</label>
                                <select className="sky-input" value={filters.flightType} onChange={e => setF('flightType', e.target.value)}>
                                    <option value="">All</option>
                                    <option value="Domestic">Domestic</option>
                                    <option value="International">International</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="sky-label">Min Price (₹)</label>
                                <input type="number" className="sky-input" placeholder="0"
                                    value={filters.minPrice} onChange={e => setF('minPrice', e.target.value)} />
                            </div>

                            <div className="mb-4">
                                <label className="sky-label">Max Price (₹)</label>
                                <input type="number" className="sky-input" placeholder="500000"
                                    value={filters.maxPrice} onChange={e => setF('maxPrice', e.target.value)} />
                            </div>

                            <div className="mb-4">
                                <label className="sky-label">Sort By</label>
                                <select className="sky-input" value={filters.sortBy} onChange={e => setF('sortBy', e.target.value)}>
                                    <option value="departure_asc">Earliest Departure</option>
                                    <option value="price_asc">Price: Low → High</option>
                                    <option value="price_desc">Price: High → Low</option>
                                    <option value="duration_asc">Shortest Duration</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-sky w-100 py-2" style={{ justifyContent: 'center' }}>
                                <FiSearch /> Search
                            </button>
                        </form>
                    </div>
                </div>

                {/* ---- Results ---- */}
                <div className="col-lg-9">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
                                Available Flights
                            </h4>
                            {!loading && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                                    {total} flight{total !== 1 ? 's' : ''} found
                                </p>
                            )}
                        </div>
                    </div>

                    {loading && <LoadingSpinner text="Searching flights..." />}

                    {error && !loading && (
                        <div className="alert alert-danger">{error}</div>
                    )}

                    {!loading && !error && flights.length === 0 && (
                        <div className="text-center py-5">
                            <div style={{ fontSize: 64, marginBottom: 16 }}>✈️</div>
                            <h5 style={{ fontFamily: 'var(--font-display)' }}>No Flights Found</h5>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                Try different search criteria or clear filters.
                            </p>
                        </div>
                    )}

                    <div className="d-flex flex-column gap-3 stagger-children">
                        {flights.map(flight => (
                            <FlightCard key={flight.id} flight={flight} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
