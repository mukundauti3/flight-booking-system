// ================================================================
// components/SeatMap.jsx — Interactive Seat Selection
// ================================================================

const COLUMNS = ['A', 'B', 'C', '', 'D', 'E', 'F']; // '' = aisle gap

export default function SeatMap({ seats, selectedSeats, onToggle, maxSeats = 1 }) {
    if (!seats?.length) return null;

    // Group seats by row
    const rows = seats.reduce((acc, s) => {
        const r = s.seat_row;
        if (!acc[r]) acc[r] = {};
        acc[r][s.seat_column] = s;
        return acc;
    }, {});
    const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b);

    const isSelected = (s) => selectedSeats.some(x => x.flight_seat_id === s.flight_seat_id);

    const getSeatState = (s) => {
        if (s.status === 'Booked') return 'booked';
        if (s.status === 'Locked') return 'locked';
        if (isSelected(s)) return 'selected';
        return 'available';
    };

    const handleClick = (s) => {
        if (s.status === 'Booked' || s.status === 'Locked') return;
        if (isSelected(s)) {
            onToggle(selectedSeats.filter(x => x.flight_seat_id !== s.flight_seat_id));
            return;
        }
        if (selectedSeats.length >= maxSeats) return;
        onToggle([...selectedSeats, s]);
    };

    const isBusiness = (s) => s.seat_class === 'Business' || s.seat_class === 'First';

    return (
        <div className="seat-map-wrapper">
            {/* Legend */}
            <div className="d-flex flex-wrap gap-3 mb-4">
                {[
                    ['available', 'Available'],
                    ['selected', 'Selected'],
                    ['booked', 'Booked'],
                    ['locked', 'Locked']
                ].map(([cls, label]) => (
                    <div key={cls} className="d-flex align-items-center gap-2">
                        <div className={`seat ${cls}`} style={{ width: 24, height: 24, fontSize: 9, cursor: 'default', animation: 'none', transform: 'none' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                ))}
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Business</span>
                </div>
            </div>

            {/* Column headers */}
            <div className="seat-row mb-2" style={{ marginLeft: 36 }}>
                {COLUMNS.map((col, i) => (
                    <div key={i} style={{
                        width: col ? 38 : 28,
                        textAlign: 'center',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontWeight: 600
                    }}>
                        {col}
                    </div>
                ))}
            </div>

            {/* Seat grid */}
            <div className="seat-grid">
                {rowNums.map(rowNum => (
                    <div key={rowNum} className="seat-row">
                        <div className="seat-row-label">{rowNum}</div>
                        {COLUMNS.map((col, idx) => {
                            if (!col) return <div key={idx} className="seat-gap" />;
                            const s = rows[rowNum]?.[col];
                            if (!s) return <div key={idx} style={{ width: 38, height: 38 }} />;
                            const state = getSeatState(s);
                            return (
                                <div
                                    key={col}
                                    className={`seat ${state} ${isBusiness(s) ? 'business' : ''}`}
                                    style={isBusiness(s) && state === 'available' ? {
                                        background: 'rgba(124,58,237,0.15)',
                                        borderColor: 'rgba(124,58,237,0.35)',
                                        color: '#a78bfa'
                                    } : {}}
                                    onClick={() => handleClick(s)}
                                    title={`${s.seat_number} · ${s.seat_class} · ₹${parseFloat(s.price).toLocaleString('en-IN')}`}
                                >
                                    {s.seat_column}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Selected summary */}
            {selectedSeats.length > 0 && (
                <div className="mt-4 p-3" style={{
                    background: 'rgba(0,180,216,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(0,180,216,0.2)'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selected: </span>
                            <span style={{ fontWeight: 600 }}>
                                {selectedSeats.map(s => s.seat_number).join(', ')}
                            </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
                            ₹{selectedSeats.reduce((sum, s) => sum + parseFloat(s.price), 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
