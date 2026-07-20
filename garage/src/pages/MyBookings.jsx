import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X, Users, Trash2, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const highlightedRow = useHighlight(bookings);

    const fetchBookings = useCallback(async (silent = false) => {
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
    }, []);

    useEffect(() => {
        fetchBookings();
        const timer = setInterval(() => fetchBookings(true), 5000);
        return () => clearInterval(timer);
    }, [fetchBookings]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setIsViewModalOpen(true);
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
            alert("Failed to delete booking. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        }) + ' | ' + date.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
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

    const handleDownloadInvoice = (booking) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            doc.setFontSize(22);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare Invoice", 105, 20, null, null, "center");

            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Booking ID: ${booking.bookingId || booking._id}`, 14, 40);

            const bookingDate = new Date(booking.createdAt).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
            doc.text(`Booking Date: ${bookingDate}`, 14, 47);
            doc.text(`Scheduled Slot: ${booking.schedule?.date || 'N/A'} at ${booking.schedule?.time || ''}`, 14, 54);
            doc.text(`Status: ${booking.status || 'Pending'}`, 14, 61);

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Customer Details", 14, 76);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Name: ${booking.user?.name || 'N/A'}`, 14, 84);
            doc.text(`Phone: ${booking.user?.phone || 'N/A'}`, 14, 91);

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Vehicle Details", 14, 106);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Make: ${booking.vehicle?.make || 'N/A'}`, 14, 114);
            doc.text(`Model: ${booking.vehicle?.model || 'N/A'}`, 14, 121);
            doc.text(`Year: ${booking.vehicle?.year || 'N/A'}`, 14, 128);

            const totalAmountStr = booking.payment?.amount || booking.service?.price || '0';
            const totalAmount = parseFloat(totalAmountStr) || 0;
            const basePrice = (totalAmount / 1.18).toFixed(2);
            const gstAmount = (totalAmount - basePrice).toFixed(2);

            autoTable(doc, {
                startY: 140,
                head: [['Service Description', 'Amount']],
                body: [[booking.service?.title || 'General Service', `Rs. ${basePrice}`]],
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
                styles: { fontSize: 11, cellPadding: 6 }
            });

            const finalY = doc.lastAutoTable?.finalY || 140;
            const rightX = 195;
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Subtotal: Rs. ${basePrice}`, rightX, finalY + 15, { align: 'right' });
            doc.text(`GST (18%): Rs. ${gstAmount}`, rightX, finalY + 22, { align: 'right' });
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, rightX, finalY + 34, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("Thank you for using VehicleeCare.", 105, finalY + 55, null, null, "center");

            doc.save(`Invoice-${booking.bookingId || booking._id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Error downloading invoice. Please try again.");
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Assigned Bookings</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : <div className="h-3.5 w-70 bg-slate-200 rounded-full animate-pulse" />}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.75 font-bold text-center w-[10%]">Booking ID</th>
                                <th className="p-4.75 font-bold text-center w-[11%]">Customer</th>
                                <th className="p-4.75 font-bold text-center w-[11%]">Schedule At</th>
                                <th className="p-4.75 font-bold text-center w-[34%]">Service & Vehicle</th>
                                <th className="p-4.75 font-bold text-center w-[7%]">Price</th>
                                <th className="p-4.75 font-bold text-center w-[9.5%]">Payment ID</th>
                                <th className="p-4.75 font-bold text-center w-[9.5%]">Status</th>
                                <th className="p-4.75 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={8} />
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-sm text-gray-500">No bookings found for this garage.</td>
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
                                    <td className="p-3.25 font-semibold text-[#052558] text-sm truncate text-center">
                                        {booking.bookingId || booking._id?.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="font-semibold text-[13px] truncate " title={booking.user?.name}>{booking.user?.name || 'Unknown'}</div>
                                        <div className="text-[11.5px] font-medium text-gray-500 tracking-wide">{booking.user?.userId || ''}</div>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <span className="text-sm font-semibold text-gray-600 flex flex-col items-center">
                                            <span>{booking.schedule?.date}</span>
                                        <span className="text-[11.5px] font-medium text-gray-500 flex flex-col items-center">    <span>{booking.schedule?.time}</span></span>
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="font-semibold text-[#0f172a] text-[13px] uppercase line-clamp-1 leading-snug">
                                            {booking.service?.title}
                                        </div>
                                        <div className="text-[11.5px] font-medium text-slate-500 uppercase mt-1 tracking-wide">
                                            {booking.vehicle?.make} {booking.vehicle?.model}
                                        </div>
                                    </td>
                                    <td className="p-3.25 text-center w-[3%]">
                                        <span className="text-sm font-semibold text-[#011023]">
                                            ₹{booking.payment?.amount || booking.service?.price || '0'}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <span className="font-semibold text-[#052558] text-sm truncate block px-1">
                                            {booking.payment?.paymentId || '—'}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(booking.status)}`}>
                                            {booking.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="flex items-center justify-center gap-3.5">
                                            <button
                                                onClick={() => handleViewDetails(booking)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadInvoice(booking)}
                                                className="text-gray-400 hover:text-emerald-500 transition-colors"
                                            >
                                                <Download size={17} />
                                            </button>
                                            <button
                                                onClick={() => { setBookingToDelete(booking._id); setIsDeleteModalOpen(true); }}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
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

            {/* View Details Modal */ }
    {
        isViewModalOpen && selectedBooking && createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                onClick={() => setIsViewModalOpen(false)}
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                        <div>
                            <h3 className="text-xl uppercase font-bold text-[#052558]">Booking Details</h3>
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
                                <div className="pt-4 rounded-xl uppercase space-y-2">
                                    <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedBooking.user?.name}>{selectedBooking.user?.name || 'N/A'}</span></p>
                                    <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedBooking.user?.phone || 'N/A'}</span></p>
                                    <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedBooking.user?.email}>{selectedBooking.user?.email || 'N/A'}</span></p>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="space-y-4 w-full md:w-[24%]">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                <div className="pt-4 rounded-xl uppercase space-y-2 min-h-[110px]">
                                    <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Brand:</span> <span className="font-semibold text-[#011023]">{selectedBooking.vehicle?.make || 'N/A'}</span></p>
                                    <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.model || 'N/A'}</span></p>
                                    <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Year:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.year || 'N/A'}</span></p>
                                </div>
                            </div>

                            {/* Payment & Status */}
                            <div className="flex flex-col gap-4.5 w-full md:w-[34%]">
                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                    <div className="flex items-center mt-7 gap-3">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                        <div className="flex uppercase items-center gap-2 pl-4">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(selectedBooking.status)}`}>
                                                {selectedBooking.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Duration</h4>
                                        <div className="flex uppercase items-center gap-2 pl-1.5">
                                            <span className="inline-block px-3 py-1 text-xs font-bold rounded-md uppercase text-gray-800">{selectedBooking.serviceDuration || '—'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-bold mb-2 text-gray-400 uppercase tracking-wider">Delivery Due</h4>
                                        <div className="flex uppercase items-center mb-2 gap-2">
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

                            {/* Employees Info - 60% */}
                            <div className="w-full bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm flex divide-x divide-[#e6f0fa]">
                                <div className="w-1/3 pr-4 uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Assigned Employee's</p>
                                    <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedBooking.assignedEmployees?.technician?.name || 'Waiting...'}</h5>
                                    <p className="text-sm text-gray-500 mt-0.5">Technician | {selectedBooking.assignedEmployees?.technician?.employeeId || 'ID Pending'}</p>
                                </div>
                                <div className="w-1/3 px-3 uppercase">
                                    <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedBooking.assignedEmployees?.support?.name || 'Waiting...'}</h5>
                                    <p className="text-sm text-gray-500 mt-0.5">Support Staff | {selectedBooking.assignedEmployees?.support?.employeeId || 'ID Pending'}</p>
                                </div>
                                <div className="w-1/3 pl-8 uppercase">
                                    <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedBooking.assignedEmployees?.mechanic?.name || '—'}</h5>
                                    <p className="text-sm text-gray-500 mt-0.5">Mechanic | {selectedBooking.assignedEmployees?.mechanic?.employeeId || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )
    }
            {/* Delete Confirmation Modal */}
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
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Booking</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the booking record for <span className="text-[#052558] font-bold uppercase">{bookings.find(b => b._id === bookingToDelete)?.user?.name || 'this customer'}</span>. <br/>
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

export default MyBookings;
