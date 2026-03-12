import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'Confirmed': return 'bg-blue-100 text-blue-700';
            case 'In Progress': return 'bg-purple-100 text-purple-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setIsViewModalOpen(true);
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
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[10%]">Booking ID</th>
                                <th className="p-4 font-bold text-center w-[14%]">Customer</th>
                                <th className="p-4 font-bold text-center w-[30%]">Service & Vehicle</th>
                                <th className="p-4 font-bold text-center w-[20%]">Date & Time</th>
                                <th className="p-4 font-bold text-center w-[8%]">Amount</th>
                                <th className="p-4 font-bold text-center w-[12%]">Payment ID</th>
                                <th className="p-4 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-sm text-gray-500">Loading assigned bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-sm text-gray-500">No bookings found for this garage.</td>
                                </tr>
                            ) : bookings.map((booking) => (
                                <tr key={booking._id} className="text-center transition-all hover:bg-blue-50/30">
                                    <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center" title={booking.bookingId || booking._id}>
                                        {booking.bookingId || booking._id?.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-[#011023]">{booking.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500 font-mono tracking-wide">{booking.user?.phone || ''}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-semibold text-gray-800 text-sm truncate max-w-[220px] mx-auto" title={booking.service?.title}>
                                            {booking.service?.title}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {booking.vehicle?.make} {booking.vehicle?.model}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm text-gray-600">
                                            {booking.schedule?.date} {booking.schedule?.time}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-bold text-gray-800">
                                            ₹{booking.payment?.amount || booking.service?.price || '0'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-semibold text-[#052558] text-sm">
                                            {booking.payment?.paymentId || '—'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusColor(booking.status)}`}>
                                            {booking.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(booking)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadInvoice(booking)}
                                                className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                                title="Download Invoice"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl font-bold text-[#052558]">Booking Details</h3>
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
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Customer Info */}
                                <div className="space-y-4 w-full md:w-[45%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{selectedBooking.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800">{selectedBooking.user?.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{selectedBooking.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Vehicle Info */}
                                <div className="space-y-4 w-full md:w-[25%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Make:</span> <span className="font-semibold text-[#011023]">{selectedBooking.vehicle?.make || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.model || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Year:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.year || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Plate:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.number || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Payment & Status */}
                                <div className="flex flex-col gap-4 w-full md:w-[30%]">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Payment</h4>
                                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50 flex items-center gap-3">
                                            <span className="text-2xl font-black text-[#011023]">₹{selectedBooking.payment?.amount || selectedBooking.service?.price || '0'}</span>
                                            {selectedBooking.payment?.status === 'Partially Paid' ? (
                                                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs font-bold uppercase">Partial</span>
                                            ) : selectedBooking.payment?.status === 'Completed' ? (
                                                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs font-bold uppercase">Paid</span>
                                            ) : (
                                                <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase">Pending</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Status</h4>
                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusColor(selectedBooking.status)}`}>
                                            {selectedBooking.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Service Details</h4>
                                <div className="bg-white border border-[#e6f0fa] p-4 rounded-xl flex justify-between items-center shadow-sm">
                                    <div>
                                        <h5 className="font-bold text-[#052558] text-lg">{selectedBooking.service?.title || 'General Service'}</h5>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Scheduled for: <span className="font-semibold text-gray-700">{selectedBooking.schedule?.date} at {selectedBooking.schedule?.time}</span>
                                        </p>
                                        {selectedBooking.garage?.name && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Garage: <span className="font-semibold text-gray-700">{selectedBooking.garage.name}</span>
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDownloadInvoice(selectedBooking)}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors"
                                    >
                                        <Download size={16} /> Invoice
                                    </button>
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

export default MyBookings;
