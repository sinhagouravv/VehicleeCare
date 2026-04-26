import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Download, UserX, Loader2, X, User, Mail, Phone, MapPin, Calendar, ShieldCheck, Clipboard, Ban, Briefcase } from 'lucide-react';
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
    const [serviceHistory, setServiceHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
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
            case 'admin': return 'bg-purple-100 text-purple-700 font-bold px-3 py-1 text-xs';
            case 'franchise': return 'bg-blue-100 text-blue-800 font-bold px-3 py-1 text-xs';
            case 'vendor': return 'bg-fuchsia-100 text-fuchsia-700 font-bold px-3 py-1 text-xs';
            default: return 'bg-orange-100 text-orange-700 font-bold px-3 py-1 text-xs';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Verified': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatRole = (role) => {
        if (role === 'admin') return 'Admin';
        if (role === 'franchise') return 'Franchise Owner';
        if (role === 'vendor') return 'Vendor';
        return 'Customer';
    };

    const formatDate = (dateStr, showTime = false) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        if (showTime) {
            const time = new Date(dateStr).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true
            });
            return `${date} | ${time}`;
        }
        return date;
    };

    // ── Open View Modal ────────────────────────────────────────
    const handleViewUser = (user) => {
        setViewUser(user);
    };

    const fetchServiceHistory = async (userId) => {
        setServiceHistory([]);
        setLoadingBookings(true);
        setIsHistoryModalOpen(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setServiceHistory(data.data || []);
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

    // ── Body Scroll Lock ──────────────────────────────────────
    useEffect(() => {
        if (viewUser || banUser || isHistoryModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [viewUser, banUser, isHistoryModalOpen]);

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
                                    <th className="p-4.5 font-bold w-[12%]">User ID</th>
                                    <th className="p-4.5 font-bold w-[15%]">User</th>
                                    <th className="p-4.5 font-bold w-[10%]">Category</th>
                                    <th className="p-4.5 font-bold w-[20%]">Contact</th>
                                    <th className="p-4.5 font-bold w-[10%]">Role</th>
                                    <th className="p-4.5 font-bold w-[20%]">Join Date & Time</th>
                                    <th className="p-4.5 font-bold w-[8%]">Status</th>
                                    <th className="p-4.5 font-bold w-[8%]">Actions</th>
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
                                                <div className="font-semibold text-sm">{user.userId || '—'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-sm uppercase">{user.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-3 uppercase py-1 text-xs font-semibold rounded-full ${user.role === 'vendor' || user.role === 'franchise' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {user.role === 'vendor' || user.role === 'franchise' ? 'Business' : 'Regular'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-gray-500 mt-0.5">{user.phone || '—'}</div>
                                                <div className="font-medium text-gray-700 text-sm">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block uppercase font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                                                    {formatRole(user.role)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm uppercase font-semibold text-gray-600">
                                                    {formatDate(user.createdAt, true)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(user.isVerified ? 'Verified' : 'Pending')}`}>
                                                    {user.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleViewUser(user)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                                        <Eye size={17} />
                                                    </button>
                                                    <button onClick={() => handleDownloadPDF(user)} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors">
                                                        <Download size={17} />
                                                    </button>
                                                    <button onClick={() => { setBanUser(user); setBanReason(''); setBanSuccess(''); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
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
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setViewUser(null)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                             <div>
                                 <h3 className="text-xl uppercase font-bold text-[#052558]">User Details</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                     <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{viewUser.userId || viewUser._id?.slice(0, 8)}</span></p>
                                     <button onClick={() => fetchServiceHistory(viewUser._id)} className="text-gray-400 p-1.5 rounded-lg transition-colors hover:text-blue-600 hover:bg-blue-50">
                                         <Eye size={17} />
                                     </button>
                                 </div>
                             </div>
                            <button 
                                onClick={() => setViewUser(null)} 
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Personal Info */}
                                <div className="space-y-2 w-full md:w-[35%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personal Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{viewUser.name || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{viewUser.phone || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{viewUser.email || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Account Info */}
                                <div className="space-y-2 w-full md:w-[25%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Account Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Role:</span> <span className="font-semibold ml-2 text-[#011023]">{formatRole(viewUser.role)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Type:</span> <span className="font-semibold ml-2 text-gray-800">{viewUser.role === 'vendor' || viewUser.role === 'franchise' ? 'Business' : 'Regular'}</span></p>
                                    </div>
                                </div>

                                {/* Status & Join Info */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[35%]">
                                    <div className="space-y-1.25">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase mt-5 tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className={`px-2.5 py-1 ml-3 mt-4 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${getStatusColor(viewUser.isVerified ? 'Verified' : 'Pending')}`}>
                                                    {viewUser.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Joined At</h4>
                                            <span className="text-xs ml-3 font-bold text-gray-600 uppercase">
                                                {formatDate(viewUser.createdAt, true)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Residential Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Residential Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Geographic Allocation</p>
                                    <h5 className="font-semibold text-[#052558] text-[15.5px]">{viewUser.address || 'No Address Provided'}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── BAN USER MODAL ────────────────────────── */}
            {banUser && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !banSubmitting && setBanUser(null)} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-rose-50 border-b border-rose-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-rose-600 uppercase tracking-wider">Disable User Account</h3>
                            <button 
                                onClick={() => setBanUser(null)}
                                className="absolute right-7 p-2 text-rose-400 rounded-xl transition-colors"
                                disabled={banSubmitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {banSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
                                        <UserX size={32} className="text-red-500" />
                                    </div>
                                    <p className="text-lg font-bold text-[#011023] text-center uppercase tracking-tight">{banSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                                        <p className="text-sm uppercase font-medium text-justify text-rose-700 leading-relaxed">
                                            Are you sure you want to ban <span className="font-bold">"{banUser.name}"</span>? 
                                            This action will revoke all access privileges immediately. This record will be flagged in the security audit registry.
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-left">
                                        <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-center">Please provide a valid and detailed reason for the disabling of this user</label>
                                        <textarea 
                                            value={banReason}
                                            onChange={(e) => setBanReason(e.target.value)}
                                            className="w-full h-32 p-4 bg-white border border-gray-200 mt-3 rounded-2xl text-sm focus:outline-none transition-all resize-none font-medium text-gray-700 shadow-sm"
                                            disabled={banSubmitting}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {!banSuccess && (
                            <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    onClick={() => setBanUser(null)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={banSubmitting}
                                >
                                    Cancel Action
                                </button>
                                <button 
                                    onClick={handleBanSubmit}
                                    disabled={banSubmitting || !banReason.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {banSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Processing…
                                        </>
                                    ) : (
                                        <>
                                            <UserX size={16} />
                                            Confirm Ban
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}


            {/* Service History Modal */}
            {isHistoryModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#011023]/180 backdrop-blur-sm transition-all duration-300" onClick={() => setIsHistoryModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[65vh] animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="pr-6 pl-6 pt-6 pb-1 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="text-xl uppercase font-bold text-[#011023] tracking-tight">Booking History</h3>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Records: <span className="text-[#011023] font-bold">{serviceHistory.length}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                            {serviceHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <Briefcase size={28} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-400 uppercase tracking-widest">No Activity Records</h4>
                                    <p className="text-xs text-gray-300 mt-2 uppercase font-medium">This user hasn't made any bookings yet.</p>
                                </div>
                            ) : (
                                <div className="border border-[#e6f0fa] rounded-2xl overflow-y-auto max-h-[570px] shadow-sm bg-white hide-scrollbar">
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-gray-50 text-[12px] uppercase font-black tracking-widest text-gray-400 border-b border-[#e6f0fa] sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                <th className="p-4 w-[60%] text-center">Booking Details</th>
                                                <th className="p-4 w-[20%] text-center">Schedule</th>
                                                <th className="p-4 w-[20%] text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#e1ecf8]">
                                            {serviceHistory.map((booking) => (
                                                <tr key={booking._id} className="hover:bg-gray-50/50 transition-all duration-300">
                                                    <td className="p-4 text-center">
                                                        <div className="text-xs text-[#011023] font-semibold uppercase">{booking.service?.title || 'General Service'}</div>
                                                        <div className="font-semibold text-gray-400 text-[11px] uppercase mt-0.5 tracking-tight">{booking.bookingId || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center uppercase">
                                                        <div className="font-semibold text-[#011023] text-xs">{formatDate(booking.schedule?.date || booking.createdAt, false)}</div>
                                                        <div className="text-[11px] text-gray-400 font-semibold">{booking.schedule?.time || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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
