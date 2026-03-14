import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Download, UserX, Loader2, X, User, Mail, Phone, MapPin, Calendar, ShieldCheck, Clipboard, Ban } from 'lucide-react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';

const Users = () => {
    const [users, setUsers] = useState([]);
    const highlightedRow = useHighlight(users);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [viewUser, setViewUser] = useState(null);
    const [userBookings, setUserBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [banUser, setBanUser] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banSubmitting, setBanSubmitting] = useState(false);
    const [banSuccess, setBanSuccess] = useState('');

    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchUsers = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.data || []);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error(err);
            if (!silent) setError('Failed to load users. Is the backend running?');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(() => fetchUsers(true), 5000);
        return () => clearInterval(interval);
    }, [fetchUsers]);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 font-black';
            case 'franchise': return 'bg-blue-100 text-blue-800 font-bold';
            case 'vendor': return 'bg-[#dcfce7] text-[#065f46] font-bold';
            default: return 'bg-cyan-100 text-cyan-700 font-bold';
        }
    };

    const formatRole = (role) => {
        if (role === 'admin') return 'Admin';
        if (role === 'franchise') return 'Franchise Owner';
        if (role === 'vendor') return 'Vendor';
        return 'Customer';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // ── Open View Modal ────────────────────────────────────────
    const handleViewUser = async (user) => {
        setViewUser(user);
        setUserBookings([]);
        setLoadingBookings(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/user/${user._id}`);
            if (res.ok) {
                const data = await res.json();
                setUserBookings(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingBookings(false);
        }
    };

    // ── Download PDF ───────────────────────────────────────────
    const handleDownloadPDF = async (user) => {
        const doc = new jsPDF();
        const primary = [5, 37, 88];
        const gray = [100, 100, 100];

        doc.setFontSize(20);
        doc.setTextColor(...primary);
        doc.text('VehicleeCare — User Report', 105, 18, null, null, 'center');

        doc.setFontSize(11);
        doc.setTextColor(...gray);
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

        doc.setFontSize(13);
        doc.setTextColor(...primary);
        doc.text('User Details', 14, 40);

        autoTable(doc, {
            startY: 44,
            body: [
                ['User ID', user.userId || '—'],
                ['Full Name', user.name || '—'],
                ['Email', user.email || '—'],
                ['Phone', user.phone || '—'],
                ['Address', user.address || '—'],
                ['Role', formatRole(user.role)],
                ['Verification', user.isVerified ? 'Verified' : 'Unverified'],
                ['Joined', formatDate(user.createdAt)],
            ],
            theme: 'grid',
            headStyles: { fillColor: primary },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            styles: { fontSize: 10, cellPadding: 4 },
        });

        // Fetch bookings
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/user/${user._id}`);
            if (res.ok) {
                const data = await res.json();
                const bookings = data.data || [];
                if (bookings.length > 0) {
                    const finalY = doc.lastAutoTable?.finalY || 80;
                    doc.setFontSize(13);
                    doc.setTextColor(...primary);
                    doc.text('Booking History', 14, finalY + 12);

                    autoTable(doc, {
                        startY: finalY + 17,
                        head: [['Booking ID', 'Service', 'Date', 'Status', 'Amount']],
                        body: bookings.map(b => [
                            b.bookingId || b._id?.slice(0, 8),
                            b.service?.title || '—',
                            formatDate(b.createdAt),
                            b.status || 'Pending',
                            `Rs. ${b.payment?.amount || b.service?.price || '—'}`,
                        ]),
                        theme: 'grid',
                        headStyles: { fillColor: primary, textColor: [255, 255, 255] },
                        styles: { fontSize: 9, cellPadding: 3 },
                    });
                }
            }
        } catch (e) { /* skip bookings if fetch fails */ }

        doc.save(`User_${user.userId || user._id}_Report.pdf`);
    };

    // ── Ban User ───────────────────────────────────────────────
    const handleBanSubmit = async () => {
        if (!banReason.trim()) return;
        setBanSubmitting(true);
        // (Future: POST to /api/users/:id/ban with banReason)
        await new Promise(r => setTimeout(r, 900)); // Simulated delay
        setBanSuccess(`User "${banUser.name}" has been banned.`);
        setBanSubmitting(false);
        setTimeout(() => {
            setBanUser(null);
            setBanReason('');
            setBanSuccess('');
        }, 2000);
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Users</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto text-center h-[860px] relative">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                                <p className="text-sm font-medium">Loading users...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-sm text-red-400 font-medium">{error}</p>
                        </div>
                    ) : (
                        <table className="w-full text-center border-collapse">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4.5 font-bold">User ID</th>
                                    <th className="p-4.5 font-bold">User</th>
                                    <th className="p-4.5 font-bold">Category</th>
                                    <th className="p-4.5 font-bold">Contact</th>
                                    <th className="p-4.5 font-bold">Role</th>
                                    <th className="p-4.5 font-bold">Join Date & Time</th>
                                    <th className="p-4.5 font-bold">Status</th>
                                    <th className="p-4.5 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-gray-400 text-sm">No users found.</td>
                                    </tr>
                                ) : users.map((user) => {
                                    const rowId = user.userId || user._id;
                                    return (
                                        <tr key={user._id} id={`row-${rowId}`} className={`transition-all duration-1000 ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}>
                                            <td className="p-4">
                                                <div className="font-bold text-[#011023] tracking-wider">{user.userId || '—'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold uppercase text-[#011023]">{user.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-3 uppercase py-1 text-xs font-bold rounded-full ${user.role === 'vendor' || user.role === 'franchise' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {user.role === 'vendor' || user.role === 'franchise' ? 'Business' : 'Regular'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-gray-500 mt-0.5">{user.phone || '—'}</div>
                                                <div className="font-medium text-gray-700 text-sm">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2.5 py-1 uppercase text-xs rounded-lg ${getRoleBadge(user.role)}`}>
                                                    {formatRole(user.role)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm uppercase text-gray-600">
                                                    {formatDate(user.createdAt)} | {user.createdAt ? new Date(user.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-semibold uppercase text-gray-700">{user.isVerified ? 'Verified' : 'Unverified'}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleViewUser(user)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View User">
                                                        <Eye size={17} />
                                                    </button>
                                                    <button onClick={() => handleDownloadPDF(user)} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Download PDF">
                                                        <Download size={17} />
                                                    </button>
                                                    <button onClick={() => { setBanUser(user); setBanReason(''); setBanSuccess(''); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Ban User">
                                                        <UserX size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── VIEW USER MODAL ───────────────────────── */}
            {viewUser && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setViewUser(null)} />
                    <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-[#041e49] via-[#052558] to-[#1a4a8a] px-6 py-5 flex items-center justify-between flex-shrink-0 overflow-hidden">
                            {/* Decorative orb */}
                            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                            <div className="absolute -bottom-8 right-20 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

                            <div className="flex items-center gap-4 relative z-10">
                                {/* Initials Avatar */}
                                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <span className="text-base font-black text-white">
                                        {viewUser.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[15px] font-black text-white uppercase tracking-wide">{viewUser.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded-full">{viewUser.userId || viewUser._id?.slice(0, 8)}</span>
                                        <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wide">{formatRole(viewUser.role)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setViewUser(null)} className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex gap-5 p-6 h-[490px] overflow-hidden">
                            {/* Account Details — 40% */}
                            <div className="w-[35%] flex-shrink-0">
                                <p className="text-[11px] text-[#052558] font-black uppercase tracking-widest mb-3">Account Details</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { icon: <Mail size={13} />, label: 'Email', value: viewUser.email },
                                        { icon: <Phone size={13} />, label: 'Phone', value: viewUser.phone || '—' },
                                        { icon: <MapPin size={13} />, label: 'Address', value: viewUser.address || '—' },
                                        { icon: <Calendar size={13} />, label: 'Joined', value: formatDate(viewUser.createdAt) },
                                        { icon: <ShieldCheck size={13} />, label: 'Status', value: viewUser.isVerified ? 'Verified ✓' : 'Unverified' },
                                        { icon: <User size={13} />, label: 'Role', value: formatRole(viewUser.role) },
                                        { icon: <Clipboard size={13} />, label: 'Category', value: viewUser.role === 'vendor' || viewUser.role === 'franchise' ? 'Business' : 'Regular' },
                                    ].map(row => (
                                        <div key={row.label} className="bg-[#f4f9ff] rounded-2xl px-4 py-3 flex items-center gap-2">
                                            <div className="text-[#527FB0] flex-shrink-0">{row.icon}</div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{row.label}</p>
                                                <p className="text-sm text-[#011023] font-semibold truncate">{row.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Booking History — 65% */}
                            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                                <p className="text-[11px] text-[#052558] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">Booking History</p>
                                {loadingBookings ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={22} className="animate-spin text-[#527FB0]" />
                                    </div>
                                ) : userBookings.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-2xl">No bookings found for this user.</p>
                                ) : (
                                    <div className="space-y-2 overflow-y-auto gap-3 flex-1 pr-1">
                                        {userBookings.map(b => (
                                            <div key={b._id} className="bg-[#f4f9ff] rounded-2xl px-4 py-3.5 flex items-center justify-between">
                                                <div className="w-[70%]">
                                                    <p className="text-xs font-bold text-[#011023]">{b.service?.title || 'Service'}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{b.bookingId || b._id?.slice(0, 10)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs  font-bold text-[#011023]">Rs. {b.payment?.amount || b.service?.price || '—'}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(b.createdAt)}</p>
                                                </div>
                                                <span className={`ml-4 text-[10px] font-bold px-2.5 py-1 rounded-full ${b.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                                    {b.status || 'Pending'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── BAN USER MODAL ────────────────────────── */}
            {banUser && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setBanUser(null)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Red Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                    <Ban size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wide">Ban User</h3>
                                    <p className="text-xs text-white/60 mt-0.5">{banUser.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setBanUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {banSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <UserX size={22} className="text-red-500" />
                                    </div>
                                    <p className="text-sm font-bold text-[#011023] text-center">{banSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[13.5px] uppercase text-gray-500">Please provide a reason for banning <strong className="text-[#011023]">{banUser.name}</strong>. This will be recorded for audit purposes.</p>
                                    <div>
                                        <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Reason for Ban</label>
                                        <textarea
                                            rows={4}
                                            value={banReason}
                                            onChange={e => setBanReason(e.target.value)}
                                            className="w-full border-2 border-gray-200 uppercase focus:border-red-300 bg-[#fff8f8] rounded-2xl px-4 py-3 text-sm text-[#011023] placeholder-gray-300 outline-none resize-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button onClick={() => setBanUser(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleBanSubmit}
                                            disabled={!banReason.trim() || banSubmitting}
                                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black uppercase tracking-wide hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {banSubmitting ? <><Loader2 size={13} className="animate-spin" /> Banning…</> : <><UserX size={13} /> Confirm Ban</>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Users;
