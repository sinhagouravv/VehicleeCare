import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Download, UserX, Loader2, X, User, Mail, Phone, MapPin, Calendar, ShieldCheck, Clipboard, Ban } from 'lucide-react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [viewEmployee, setViewEmployee] = useState(null);
    const [employeeBookings, setEmployeeBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [banEmployee, setBanEmployee] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banSubmitting, setBanSubmitting] = useState(false);
    const [banSuccess, setBanSuccess] = useState('');

    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchEmployees = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/employees');
            if (!res.ok) throw new Error('Failed to fetch employees');
            const data = await res.json();
            setEmployees(data.data || []);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error(err);
            if (!silent) setError('Failed to load employees. Is the backend running?');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        const interval = setInterval(() => fetchEmployees(true), 5000);
        return () => clearInterval(interval);
    }, [fetchEmployees]);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 font-black';
            case 'franchise': return 'bg-blue-100 text-blue-800 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-semibold';
        }
    };

    const formatRole = (role) => {
        if (role === 'admin') return 'Admin';
        if (role === 'franchise') return 'Franchise Owner';
        return 'Customer';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // ── Open View Modal ────────────────────────────────────────
    const handleViewEmployee = async (employee) => {
        setViewEmployee(employee);
        setEmployeeBookings([]);
        setLoadingBookings(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/employee/${employee._id}`);
            if (res.ok) {
                const data = await res.json();
                setEmployeeBookings(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingBookings(false);
        }
    };

    // ── Download PDF ───────────────────────────────────────────
    const handleDownloadPDF = async (employee) => {
        const doc = new jsPDF();
        const primary = [5, 37, 88];
        const gray = [100, 100, 100];

        doc.setFontSize(20);
        doc.setTextColor(...primary);
        doc.text('VehicleeCare — Employee Report', 105, 18, null, null, 'center');

        doc.setFontSize(11);
        doc.setTextColor(...gray);
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

        doc.setFontSize(13);
        doc.setTextColor(...primary);
        doc.text('Employee Details', 14, 40);

        autoTable(doc, {
            startY: 44,
            body: [
                ['Employee ID', employee.userId || employee.employeeId || '—'],
                ['Full Name', employee.name || '—'],
                ['Email', employee.email || '—'],
                ['Phone', employee.phone || '—'],
                ['Address', employee.address || '—'],
                ['Category', employee.category || 'System'],
                ['Role', formatRole(employee.role)],
                ['Verification', employee.isVerified ? 'Verified' : 'Unverified'],
                ['Joined', formatDate(employee.createdAt)],
            ],
            theme: 'grid',
            headStyles: { fillColor: primary },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            styles: { fontSize: 10, cellPadding: 4 },
        });

        // Fetch bookings
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/employee/${employee._id}`);
            if (res.ok) {
                const data = await res.json();
                const bookings = data.data || [];
                if (bookings.length > 0) {
                    const finalY = doc.lastAutoTable?.finalY || 80;
                    doc.setFontSize(13);
                    doc.setTextColor(...primary);
                    doc.text('Tasks History', 14, finalY + 12);

                    autoTable(doc, {
                        startY: finalY + 17,
                        head: [['Task ID', 'Service', 'Date', 'Status', 'Amount']],
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

        doc.save(`Employee_${employee.userId || employee.employeeId || employee._id}_Report.pdf`);
    };

    // ── Ban/Dismiss Employee ───────────────────────────────────────────────
    const handleBanSubmit = async () => {
        if (!banReason.trim()) return;
        setBanSubmitting(true);
        // (Future: POST to /api/employees/:id/ban with banReason)
        await new Promise(r => setTimeout(r, 900)); // Simulated delay
        setBanSuccess(`Employee "${banEmployee.name}" has been disabled.`);
        setBanSubmitting(false);
        setTimeout(() => {
            setBanEmployee(null);
            setBanReason('');
            setBanSuccess('');
        }, 2000);
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Employees</h1>
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
                                <p className="text-sm font-medium">Loading employees...</p>
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
                                    <th className="p-4.5 font-bold">Employee ID</th>
                                    <th className="p-4.5 font-bold">Employee</th>
                                    <th className="p-4.5 font-bold">Category</th>
                                    <th className="p-4.5 font-bold">Contact</th>
                                    <th className="p-4.5 font-bold">Role</th>
                                    <th className="p-4.5 font-bold">Join Date</th>
                                    <th className="p-4.5 font-bold">Status</th>
                                    <th className="p-4.5 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-gray-400 text-sm">No employees found.</td>
                                    </tr>
                                ) : employees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-[#011023] tracking-wider">{employee.userId || employee.employeeId || '—'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold uppercase text-[#011023]">{employee.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-[#f0f6ff] text-[#527FB0] border border-[#e6f0fa]">
                                                {employee.category || 'System'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-700 text-sm">{employee.email}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{employee.phone || '—'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 text-xs rounded-lg ${getRoleBadge(employee.role)}`}>
                                                {formatRole(employee.role)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600">{formatDate(employee.createdAt)}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-semibold text-gray-700">{employee.isVerified ? 'Verified' : 'Unverified'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleViewEmployee(employee)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Employee">
                                                    <Eye size={17} />
                                                </button>
                                                <button onClick={() => handleDownloadPDF(employee)} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Download Action History">
                                                    <Download size={17} />
                                                </button>
                                                <button onClick={() => { setBanEmployee(employee); setBanReason(''); setBanSuccess(''); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Disable Employee">
                                                    <UserX size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── VIEW EMPLOYEE MODAL ───────────────────────── */}
            {viewEmployee && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setViewEmployee(null)} />
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
                                        {viewEmployee.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[15px] font-black text-white uppercase tracking-wide">{viewEmployee.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded-full">{viewEmployee.userId || viewEmployee.employeeId || viewEmployee._id?.slice(0, 8)}</span>
                                        <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wide">{formatRole(viewEmployee.role)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setViewEmployee(null)} className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex gap-5 p-6 h-[490px] overflow-hidden">
                            {/* Account Details — 40% */}
                            <div className="w-[35%] flex-shrink-0">
                                <p className="text-[11px] text-[#052558] font-black uppercase tracking-widest mb-3">Account Details</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { icon: <Mail size={13} />, label: 'Email', value: viewEmployee.email },
                                        { icon: <Briefcase size={13} />, label: 'Category', value: viewEmployee.category || 'System' },
                                        { icon: <Phone size={13} />, label: 'Phone', value: viewEmployee.phone || '—' },
                                        { icon: <MapPin size={13} />, label: 'Address', value: viewEmployee.address || '—' },
                                        { icon: <Calendar size={13} />, label: 'Joined', value: formatDate(viewEmployee.createdAt) },
                                        { icon: <ShieldCheck size={13} />, label: 'Status', value: viewEmployee.isVerified ? 'Verified ✓' : 'Unverified' },
                                        { icon: <User size={13} />, label: 'Role', value: formatRole(viewEmployee.role) },
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
                                <p className="text-[11px] text-[#052558] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">Tasks History</p>
                                {loadingBookings ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={22} className="animate-spin text-[#527FB0]" />
                                    </div>
                                ) : employeeBookings.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-2xl">No tasks found for this employee.</p>
                                ) : (
                                    <div className="space-y-2 overflow-y-auto gap-3 flex-1 pr-1">
                                        {employeeBookings.map(b => (
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

            {/* ── DISABLE EMPLOYEE MODAL ────────────────────────── */}
            {banEmployee && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setBanEmployee(null)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Red Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                    <Ban size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wide">Disable Employee</h3>
                                    <p className="text-xs text-white/60 mt-0.5">{banEmployee.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setBanEmployee(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
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
                                    <p className="text-[13.5px] uppercase text-gray-500">Please provide a reason for disabling <strong className="text-[#011023]">{banEmployee.name}</strong>. This will be recorded for audit purposes.</p>
                                    <div>
                                        <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Reason for Action</label>
                                        <textarea
                                            rows={4}
                                            value={banReason}
                                            onChange={e => setBanReason(e.target.value)}
                                            className="w-full border-2 border-gray-200 uppercase focus:border-red-300 bg-[#fff8f8] rounded-2xl px-4 py-3 text-sm text-[#011023] placeholder-gray-300 outline-none resize-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button onClick={() => setBanEmployee(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleBanSubmit}
                                            disabled={!banReason.trim() || banSubmitting}
                                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black uppercase tracking-wide hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {banSubmitting ? <><Loader2 size={13} className="animate-spin" /> Proceeding…</> : <><UserX size={13} /> Confirm Action</>}
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

export default Employees;
