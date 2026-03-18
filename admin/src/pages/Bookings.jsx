import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, MoreVertical, Eye, Download, X, Trash2, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const highlightedRow = useHighlight(bookings);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchBookings = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const res = await fetch('http://localhost:5001/api/bookings');
            const result = await res.json();
            if (result.success && result.data) {
                setBookings(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
        // Poll every 5 seconds for new bookings
        const interval = setInterval(() => fetchBookings(true), 5000);
        return () => clearInterval(interval);
    }, [fetchBookings]);


    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'Confirmed': return 'bg-blue-100 text-blue-700'; // Or 'In Progress'
            case 'Scheduled': return 'bg-purple-100 text-purple-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Are you sure you want to delete this booking?")) return;
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setBookings(bookings.filter(b => b._id !== id));
            } else {
                alert("Failed to delete booking.");
            }
        } catch (err) {
            console.error("Error deleting booking:", err);
            alert("Error deleting booking.");
        }
    };

    const handleDownloadInvoice = (booking) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            // Header
            doc.setFontSize(22);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare Invoice", 105, 20, null, null, "center");

            // Info Details
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

            // Customer Details
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Customer Details", 14, 76);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Name: ${booking.user?.name || 'N/A'}`, 14, 84);
            doc.text(`Phone: ${booking.user?.phone || 'N/A'}`, 14, 91);

            // Vehicle Details
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Vehicle Details", 14, 106);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Make: ${booking.vehicle?.make || 'N/A'}`, 14, 114);
            doc.text(`Model: ${booking.vehicle?.model || 'N/A'}`, 14, 121);
            doc.text(`Year: ${booking.vehicle?.year || 'N/A'}`, 14, 128);

            // Cost calculation
            const totalAmountStr = booking.payment?.amount || booking.service?.price || '0';
            const totalAmount = parseFloat(totalAmountStr) || 0;
            const basePrice = (totalAmount / 1.18).toFixed(2);
            const gstAmount = (totalAmount - basePrice).toFixed(2);

            const tableBody = [
                [booking.service?.title || 'General Service', `Rs. ${basePrice}`]
            ];

            autoTable(doc, {
                startY: 140,
                head: [['Service Description', 'Amount']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
                styles: { fontSize: 11, cellPadding: 6 }
            });

            // Breakdown Summary
            const finalY = doc.lastAutoTable?.finalY || 140;
            const rightRightX = 195;

            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Subtotal: Rs. ${basePrice}`, rightRightX, finalY + 15, { align: 'right' });
            doc.text(`GST (18%): Rs. ${gstAmount}`, rightRightX, finalY + 22, { align: 'right' });
            doc.text(`Platform Fee: Rs. 0.00`, rightRightX, finalY + 29, { align: 'right' });

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, rightRightX, finalY + 41, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("Thank you for using VehicleeCare.", 105, finalY + 60, null, null, "center");

            doc.save(`${displayInvoiceId}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Error downloading invoice. Please try again.");
        }
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setIsViewModalOpen(true);
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

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto  ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Bookings</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {/* {refreshing && <span className="w-1.5 h-1.5 rounded-full bg-[#527FB0] animate-pulse inline-block" />} */}
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem]  border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">

                <div className="overflow-x-hidden overflow-y-auto h-[860px]  relative">
                    <table className="w-full text-left  border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[11%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[22%]">Service</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Schedule At</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Amount</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Payment ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[5%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-sm text-gray-500">
                                        Server is not running. Kindly start the server.
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-sm text-gray-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : bookings.map((booking) => {
                                const rowId = booking.bookingId || booking._id;
                                return (
                                    <tr key={booking._id} id={`row-${rowId}`} className={`text-center mt-2 transition-all duration-1000 ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}>
                                        <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[10%]" title={booking.bookingId || booking._id}>
                                            {booking.bookingId || booking._id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <div className="text-xs font-bold text-[#011023]">{booking.user?.name || "Unknown"}</div>
                                            <div className="text-xs text-gray-500">{booking.user?.userId || ""}</div>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${booking.store ? 'bg-purple-100 text-purple-700' : booking.parking ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {booking.store ? 'Store' : booking.parking ? 'Parking' : 'Garage'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[34%]">
                                            <div className="font-semibold text-gray-800 text-sm " title={booking.service?.title}>
                                                {booking.service?.title}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {booking.vehicle?.make} {booking.vehicle?.model}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center w-[12%]">
                                            <span className="text-sm text-gray-600">
                                                {booking.schedule?.date} <br />
                                                {booking.schedule?.time}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[5%]">
                                            <span className="text-sm font-bold text-gray-800">
                                                ₹{booking.payment?.amount || booking.service?.price || '0'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[9%]">
                                            <span className="font-semibold text-[#052558] text-sm">
                                                {booking.payment?.paymentId || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[7%]">
                                            <span className={`inline-block px-3 py-1 text-[10px] text-center font-bold rounded-full border border-transparent ${getStatusColor(booking.status)}`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[6%]">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleViewDetails(booking)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => handleDownloadInvoice(booking)} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Invoice">
                                                    <Download size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteBooking(booking._id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete Booking">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedBooking && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm"
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

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                <div className="space-y-4 w-full md:w-[46%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedBooking.user?.name}>{selectedBooking.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedBooking.user?.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedBooking.user?.email}>{selectedBooking.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-4 w-full md:w-[24%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Brand:</span> <span className="font-semibold text-[#011023]">{selectedBooking.vehicle?.make || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.model || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Year:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.year || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4.5 w-full md:w-[35%]">
                                    <div className="space-y-1.5">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center mt-7 gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusColor('Pending')}`}>
                                                    {selectedBooking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50/30rounded-xl border border-blue-50 flex items-center gap-4">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment</h4>
                                            <span className="text-base ml-5 font-black text-[#011023]">₹{selectedBooking.payment?.amount || selectedBooking.service?.price || '0'}</span>
                                            {selectedBooking.payment?.status === 'Partially Paid' ? (
                                                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Partially Paid</span>
                                            ) : selectedBooking.payment?.status === 'Completed' ? (
                                                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Completed</span>
                                            ) : (
                                                <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Pending</span>
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
                                <div className="bg-white border border-[#e6f0fa] p-4 gap-5 rounded-xl flex justify-between items-center shadow-sm">
                                    <div>
                                        <h5 className="font-bold text-[#052558] uppercase text-[15.5px]">{selectedBooking.service?.title || 'General Service'}</h5>
                                        <p className="text-sm uppercase text-gray-500 mt-1">Scheduled for: <span className="font-semibold text-gray-700">{selectedBooking.schedule?.date} at {selectedBooking.schedule?.time}</span></p>
                                    </div>
                                </div>
                            </div>

                        {/* Entity & Employees Info */}
                        <div className="flex gap-5 -mt-1">
                            {/* Entity Info - 40% */}
                            <div className="w-[40%] bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm uppercase">
                                <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">
                                    {selectedBooking.store ? 'Assigned Store' : selectedBooking.parking ? 'Assigned Parking' : 'Assigned Garage'}
                                </p>
                                <h5 className="font-bold text-[#052558] text-[15.5px] truncate" title={
                                    selectedBooking.store?.name || selectedBooking.parking?.name || selectedBooking.garage?.name
                                }>
                                    {selectedBooking.store ? (selectedBooking.store?.name || 'No Store Assigned') : 
                                     selectedBooking.parking ? (selectedBooking.parking?.name || 'No Parking Assigned') : 
                                     (selectedBooking.garage?.name || 'No Garage Assigned')}
                                </h5>
                                <p className="text-sm text-gray-500 mt-0.5 truncate">
                                    {selectedBooking.store ? `${selectedBooking.store?.district || ''}, ${selectedBooking.store?.state || ''} | ${selectedBooking.store?.id || 'N/A'}` : 
                                     selectedBooking.parking ? `${selectedBooking.parking?.district || ''}, ${selectedBooking.parking?.state || ''} | ${selectedBooking.parking?.id || 'N/A'}` : 
                                     `${selectedBooking.garage?.district || ''}, ${selectedBooking.garage?.state || ''} | ${selectedBooking.garage?.id || 'N/A'}`}
                                </p>
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
            )}
        </div>
    );
};

export default Bookings;
