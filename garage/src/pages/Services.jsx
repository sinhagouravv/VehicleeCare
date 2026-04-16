import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Filter, Wrench, Settings, AlertCircle, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';

const Services = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const highlightedRow = useHighlight(bookings);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchBookings = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch garage bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
        const timer = setInterval(() => fetchBookings(true), 5000);
        return () => clearInterval(timer);
    }, []);

    const toggleStatus = async (bookingId, field, value) => {
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, [field]: value } : b));
            }
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
        }
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const confirmDelete = async () => {
        if (!bookingToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/${bookingToDelete}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => prev.filter(b => b._id !== bookingToDelete));
                setIsDeleteModalOpen(false);
                setBookingToDelete(null);
            }
        } catch (error) {
            console.error("Failed to delete booking", error);
        } finally {
            setDeleting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryStyle = (category) => {
        const cat = category?.toLowerCase();
        if (cat?.includes('petrol')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (cat?.includes('diesel')) return 'bg-orange-100 text-orange-800 border-orange-200';
        if (cat?.includes('electric') || cat?.includes('ev')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (cat?.includes('cng')) return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Service Management</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[37%]">Service Details</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Assigned To</th>
                                <th className="p-4.5 font-bold text-center w-[5%]">Duration</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-sm text-gray-500">Loading bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-sm text-gray-500">No bookings found.</td>
                                </tr>
                            ) : bookings.map((booking) => {
                                const rowId = booking.bookingId || booking._id;
                                return (
                                    <tr 
                                        key={booking._id} 
                                        id={`row-${rowId}`}
                                        className={`text-center transition-all duration-1000 ${
                                            highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                    <td className="p-4 font-semibold text-[#052558] text-sm text-center w-[8%]">
                                        {booking.bookingId || booking._id?.substring(0, 8).toUpperCase()}
                                    </td>
                                    {/* <td className="p-4 text-center">
                                        {booking.payment?.paymentId || '—'}
                                    </td> */}
                                    <td className="p-4 text-center w-[8%]">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryStyle(booking.vehicle?.fuelType)}`}>
                                            {booking.vehicle?.fuelType || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[45%]">
                                        <div className="font-semibold text-[#0f172a] text-[13.5px] uppercase leading-snug">{booking.service?.title}</div>
                                        <div className="text-[11.5px] text-slate-500 uppercase mt-1 tracking-wide">{booking.service?.id || '—'}</div>
                                    </td>

                                    <td className="p-4 text-center w-[11%]">
                                        <div className="font-semibold text-[13px]">
                                            {booking.assignedEmployees?.technician?.name || 'Waiting...'}
                                        </div>
                                        <div className="text-[11.5px] text-gray-500">
                                            {booking.assignedEmployees?.technician?.employeeId || 'ID Pending'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[5%]">
                                        —
                                    </td>
                                    
                                    {/* <td className="p-4 text-center">
                                        <button 
                                            onClick={() => toggleStatus(booking._id, 'isPickedUp', !booking.isPickedUp)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${booking.isPickedUp ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                        >
                                            {booking.isPickedUp ? 'YES' : 'NO'}
                                        </button>
                                    </td> */}
                                    <td className="p-4 text-center w-[8%]">
                                        <span className={`px-3 py-1 text-xs uppercase font-semibold rounded-full border ${getStatusStyle(booking.status || 'Pending')}`}>
                                            {booking.status || 'Pending'}
                                        </span>
                                    </td>
                                    {/* <td className="p-4 text-center">
                                        <button 
                                            disabled={!booking.isPickedUp}
                                            onClick={() => toggleStatus(booking._id, 'isDelivered', !booking.isDelivered)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${booking.isDelivered ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200 disabled:opacity-50'}`}
                                        >
                                            {booking.isDelivered ? 'YES' : 'NO'}
                                        </button>
                                    </td> */}
                                    <td className="p-4 text-center w-[7%]">
                                        <div className="flex items-center justify-center gap-1">
                                            <button 
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" 
                                                title="View Details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button 
                                                onClick={() => { setBookingToDelete(booking._id); setIsDeleteModalOpen(true); }}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" 
                                                title="Remove"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setBookingToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Cancel Service</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently cancel the booking for <span className="text-[#052558] font-bold uppercase">{bookings.find(b => b._id === bookingToDelete)?.user?.name || 'this customer'}</span>. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setBookingToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Services;
