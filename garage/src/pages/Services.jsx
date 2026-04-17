import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Filter, Wrench, Settings, AlertCircle, Edit, Trash2, Eye, Loader2, X } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';

const Services = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const highlightedRow = useHighlight(bookings);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getDeliveryDue = (booking) => {
        if (!booking?.serviceDuration || booking.serviceDuration === '—') return '—';
        const str = booking.serviceDuration.toLowerCase();
        let days = 0;
        let hours = 0;
        
        const dMatch = str.match(/(\d+)\s*day/);
        if (dMatch) days = parseInt(dMatch[1], 10);
        
        const hMatch = str.match(/(\d+)\s*hour/);
        if (hMatch) hours = parseInt(hMatch[1], 10);
        
        // Use the explicitly scheduled service time as the baseline, falling back to booking creation time, to ensure the deadline remains statically fixed
        let baseTime = new Date(booking.createdAt || Date.now());
        if (booking.schedule?.date) {
            const parsedSchedule = new Date(`${booking.schedule.date} ${booking.schedule.time || ''}`.trim());
            if (!isNaN(parsedSchedule.getTime())) {
                baseTime = parsedSchedule;
            }
        }
        
        baseTime.setDate(baseTime.getDate() + days);
        baseTime.setHours(baseTime.getHours() + hours);
        
        return baseTime.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

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

    useEffect(() => {
        if (selectedBooking && bookings.length > 0) {
            const updated = bookings.find(b => b._id === selectedBooking._id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedBooking)) {
                setSelectedBooking(updated);
            }
        }
    }, [bookings, selectedBooking]);

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
                                <th className="p-4.5 font-bold text-center w-[8%]">Duration</th>
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
                                    <td className="p-4 text-center w-[8%]">
                                        <span className="font-semibold text-[13px] whitespace-nowrap px-3 py-1.5 rounded-lg uppercase tracking-tight">
                                            {booking.serviceDuration || '—'}
                                        </span>
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
                                                onClick={() => { setSelectedBooking(booking); setIsViewModalOpen(true); }}
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

            {isViewModalOpen && selectedBooking && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Service Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedBooking.bookingId || selectedBooking._id}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Customer Info */}
                                <div className="space-y-4 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedBooking.user?.name}>{selectedBooking.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedBooking.user?.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedBooking.user?.email}>{selectedBooking.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Vehicle Info */}
                                <div className="space-y-4 w-full md:w-[24%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50 min-h-[110px]">
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Brand:</span> <span className="font-semibold text-[#011023]">{selectedBooking.vehicle?.make || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.model || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Year:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.year || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Payment & Status */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[37%]">
                                    <div className="space-y-1.5">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center mt-7 gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2 pl-7">
                                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusStyle(selectedBooking.status)}`}>
                                                    {selectedBooking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Duration</h4>
                                            <div className="flex uppercase items-center gap-2 pl-5">
                                                <span className="inline-block px-3 py-1 text-xs font-bold rounded-md uppercase text-gray-800">{selectedBooking.serviceDuration || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold mb-2 text-gray-400 uppercase tracking-wider w-29">Delivery Due</h4>
                                            <div className="flex uppercase items-center mb-2 gap-2 pl-2">
                                                <span className="inline-block px-1 py-1 text-xs font-bold rounded-md uppercase text-gray-800">
                                                    {getDeliveryDue(selectedBooking)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Service Details</h4>
                                <div className="bg-white border border-[#e6f0fa] p-4 gap-4 rounded-xl flex justify-between items-center shadow-sm">
                                    <div>
                                        <h5 className="font-bold text-[#052558] uppercase text-[15.5px]">{selectedBooking.service?.title || 'General Service'}</h5>
                                        <p className="text-sm uppercase text-gray-500 mt-1">Scheduled for: <span className="font-semibold text-gray-700">{selectedBooking.schedule?.date} at {selectedBooking.schedule?.time}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Garage & Employees Info */}
                            <div className="flex gap-5 -mt-1">
                                {/* Garage Info - 30% */}
                                {/* <div className="w-[40%] bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Assigned Garage</p>
                                    <h5 className="font-bold text-[#052558] text-[15.5px] truncate" title={selectedBooking.garage?.name}>{selectedBooking.garage?.name || 'No Garage Assigned'}</h5>
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">{selectedBooking.garage?.district}, {selectedBooking.garage?.state} | {selectedBooking.garage?.id || 'N/A'}</p>
                                                              {/* Employees Info - 70% */}
                                <div className="w-full bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm flex divide-x divide-[#e6f0fa]">
                                    <div className="w-1/3 pr-4 uppercase">
                                        <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Assigned Employee's</p>
                                        <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedBooking.assignedEmployees?.technician?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Technician | {selectedBooking.assignedEmployees?.technician?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 pl-4 pr-4 uppercase">
                                        <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedBooking.assignedEmployees?.support?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Support Staff | {selectedBooking.assignedEmployees?.support?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 pl-4 uppercase">
                                        <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedBooking.assignedEmployees?.mechanic?.name || '—'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Mechanic | {selectedBooking.assignedEmployees?.mechanic?.employeeId || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
