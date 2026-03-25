// ================================================================
// pages/admin/AdminUsers.jsx — User Listing (read-only)
// ================================================================
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        adminAPI.listUsers({ limit: 100 })
            .then(r => setUsers(r.data.data?.users || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            u.first_name?.toLowerCase().includes(q) ||
            u.last_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="container py-5">
            <div className="page-header">
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>User Management</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    {filtered.length} of {users.length} registered users
                </p>
            </div>

            <div className="mb-4">
                <input className="sky-input" placeholder="Search by name or email..." style={{ maxWidth: 360 }}
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading && <LoadingSpinner text="Loading users..." />}

            {!loading && (
                <div className="glass-card p-0 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table sky-table mb-0">
                            <thead>
                                <tr>
                                    <th>#</th><th>Name</th><th>Email</th><th>Phone</th>
                                    <th>Gender</th><th>Role</th><th>Status</th><th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <tr key={u.id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td style={{ fontSize: 13 }}>{u.phone || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{u.gender || '—'}</td>
                                        <td>
                                            <span style={{
                                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                                                background: u.role_name === 'admin' ? 'rgba(124,58,237,0.15)' : 'rgba(0,180,216,0.10)',
                                                color: u.role_name === 'admin' ? '#a78bfa' : 'var(--accent)',
                                                textTransform: 'capitalize'
                                            }}>
                                                {u.role_name}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                                                background: u.is_active ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                                                color: u.is_active ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {u.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(u.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
                                No users match your search.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
