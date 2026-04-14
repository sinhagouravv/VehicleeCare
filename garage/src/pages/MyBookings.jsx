import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X, Users, Trash2, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';

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
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Assigned Bookings</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[29%]">Service & Vehicle</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Schedule At</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Price</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Payment ID</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[6%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">Loading assigned bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">No bookings found for this garage.</td>
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
                                    <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[10%]" title={booking.bookingId || booking._id}>
                                        {booking.bookingId || booking._id?.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="p-4 text-center w-[12%]">
                                        <div className="font-bold text-[#011023] truncate px-2" title={booking.user?.name}>{booking.user?.name || 'Unknown'}</div>
                                        <div className="text-[11.5px] text-gray-400">{booking.user?.userId || ''}</div>
                                    </td>
                                    <td className="p-4 text-center w-[29%]">
                                        <div className="font-bold text-[#0f172a] text-[13px] uppercase whitespace-normal leading-snug mx-auto">
                                            {booking.service?.title}
                                        </div>
                                        <div className="text-[11.5px] font-medium text-slate-500 uppercase mt-1 tracking-wide">
                                            {booking.vehicle?.make} {booking.vehicle?.model}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[20%]">
                                        <span className="text-sm font-semibold text-gray-600">
                                            {booking.schedule?.date} | {booking.schedule?.time}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[3%]">
                                        <span className="text-sm font-semibold text-[#011023]">
                                            ₹{booking.payment?.amount || booking.service?.price || '0'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[11%]">
                                        <span className="font-semibold text-[#052558] text-sm truncate block px-1" title={booking.payment?.paymentId}>
                                            {booking.payment?.paymentId || '—'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[12%]">
                                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(booking.status)}`}>
                                            {booking.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[6%]">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewDetails(booking)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadInvoice(booking)}
                                                className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                                title="Download Invoice"
                                            >
                                                <Download size={17} />
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

            {/* View Details Modal */ }
    {
        isViewModalOpen && selectedBooking && createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm"
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
                            <div className="space-y-4 w-full md:w-[46%]">
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
                            <div className="flex flex-col gap-4.5 w-full md:w-[35%]">
                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                    <div className="flex items-center mt-7 gap-3">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                        <div className="flex uppercase items-center gap-2">
                                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusColor(selectedBooking.status)}`}>
                                                {selectedBooking.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/30 rounded-xl border border-blue-50 flex items-center gap-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment</h4>
                                        <span className="text-base ml-5 font-black text-[#011023]">₹{selectedBooking.payment?.amount || selectedBooking.service?.price || '0'}</span>
                                        {selectedBooking.payment?.status === 'Partially Paid' ? (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Advance</span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">{selectedBooking.payment?.status || 'Paid'}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Booked At</h4>
                                        <span className="text-xs ml-2 font-bold text-gray-600 uppercase">
                                            {formatDate(selectedBooking.createdAt)}
                                        </span>
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
                            <div className="w-[40%] bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm uppercase">
                                <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Assigned Garage</p>
                                <h5 className="font-bold text-[#052558] text-[15.5px] truncate" title={selectedBooking.garage?.name}>{selectedBooking.garage?.name || 'No Garage Assigned'}</h5>
                                <p className="text-sm text-gray-500 mt-0.5 truncate">{selectedBooking.garage?.district}, {selectedBooking.garage?.state} | {selectedBooking.garage?.id || 'N/A'}</p>
                            </div>

                            {/* Employees Info - 70% */}
                            <div className="w-[70%] bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm flex divide-x divide-[#e6f0fa]">
                                <div className="w-1/2 pr-4 uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Assigned Employee's</p>
                                    <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedBooking.assignedEmployees?.technician?.name || 'Waiting...'}</h5>
                                    <p className="text-sm text-gray-500 mt-0.5">Technician | {selectedBooking.assignedEmployees?.technician?.employeeId || 'ID Pending'}</p>
                                </div>
                                <div className="w-1/2 pl-4 uppercase">
                                    <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedBooking.assignedEmployees?.support?.name || 'Waiting...'}</h5>
                                    <p className="text-sm text-gray-500 mt-0.5">Support Staff | {selectedBooking.assignedEmployees?.support?.employeeId || 'ID Pending'}</p>
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/30 backdrop-blur-sm transition-all duration-300"
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
