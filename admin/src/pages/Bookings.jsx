import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, MoreVertical, Eye, Download, X, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Bookings = () => {
    const { triggerAlert } = useAlert();
    const [bookings, setBookings] = useState([]);
    const highlightedRow = useHighlight(bookings);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [_refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filter, Sort & Row Label States
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_bookings_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Bookings',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'status',
                    label: 'Booking Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'In Progress', value: 'In Progress' },
                        { label: 'In Service', value: 'In Service' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Delivered', value: 'Delivered' },
                        { label: 'Cancelled', value: 'Cancelled' },
                    ]
                }
            ],
            initialValues: {
                status: filterStatus === 'All' ? 'all' : filterStatus,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) {
                    setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                }
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterStatus('All');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterStatus, labelFilter, sortOrder, timeRange]);

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
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const confirmDeleteBooking = async () => {
        if (!bookingToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/${bookingToDelete}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setBookings(bookings.filter(b => b._id !== bookingToDelete));
                triggerAlert("Booking deleted successfully", "success");
                setIsDeleteModalOpen(false);
                setBookingToDelete(null);
            } else {
                triggerAlert(data.message || "Failed to delete booking.", "error");
            }
        } catch (err) {
            console.error("Error deleting booking:", err);
            triggerAlert("Error deleting booking.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleDownloadInvoice = (booking) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            doc.setFontSize(22);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare Invoice", 105, 20, null, null, "center");

            const displayInvoiceId = booking.bookingId || booking._id?.slice(0, 8).toUpperCase();
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Booking ID: ${displayInvoiceId}`, 14, 40);

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
            triggerAlert("Invoice downloaded successfully", "success");
        } catch (err) {
            console.error("Error generating PDF:", err);
            triggerAlert("Error downloading invoice. Please try again.", "error");
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

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.bookingDate,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
            item.scheduledAt,
            item.updatedAt
        ];
        for (const f of fields) {
            if (!f) continue;
            if (f instanceof Date && !isNaN(f.getTime())) return f;
            if (typeof f === 'number') {
                const d = new Date(f);
                if (!isNaN(d.getTime())) return d;
            }
            if (typeof f === 'string') {
                const trimmed = f.trim();
                const ddmmyyyy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
                if (ddmmyyyy) {
                    const day = parseInt(ddmmyyyy[1], 10);
                    const month = parseInt(ddmmyyyy[2], 10) - 1;
                    const year = parseInt(ddmmyyyy[3], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                const d = new Date(trimmed);
                if (!isNaN(d.getTime())) return d;
            }
        }
        if (typeof item._id === 'string' && item._id.length === 24 && /^[a-f\d]{24}$/i.test(item._id)) {
            const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    const getBookedAtParts = (booking) => {
        const itemDate = getItemDate(booking);
        if (!itemDate || isNaN(itemDate.getTime())) {
            if (booking.schedule?.date) {
                return { dateStr: booking.schedule.date, timeStr: booking.schedule.time || '' };
            }
            return { dateStr: '—', timeStr: '' };
        }
        const day = itemDate.toLocaleDateString('en-IN', { day: '2-digit' });
        const month = itemDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        const year = itemDate.getFullYear();
        const time = itemDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
        return {
            dateStr: `${day} ${month} ${year}`,
            timeStr: time
        };
    };

    const filteredBookings = React.useMemo(() => {
        return bookings.filter(booking => {
            if (filterStatus !== 'All' && booking.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[booking._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = getItemDate(booking);
                if (itemDate) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = getItemDate(a) || new Date(0);
            const dateB = getItemDate(b) || new Date(0);
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });
    }, [bookings, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredBookings.length);
    }, [filteredBookings.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Bookings</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">

                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[9.5%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[31%]">Service</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Booked At</th>
                                <th className="p-4.5 font-bold text-center w-[9.5%]">Payment ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={8} />
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-sm text-gray-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : filteredBookings.map((booking) => {
                                const rowId = booking.bookingId || booking._id;
                                const { dateStr, timeStr } = getBookedAtParts(booking);
                                return (
                                    <tr 
                                        key={booking._id} 
                                        id={`row-${rowId}`} 
                                        onClick={(e) => {
                                            if (isLabelMode) {
                                                e.stopPropagation();
                                                setActiveLabelRowId(prev => prev === booking._id ? null : booking._id);
                                            }
                                        }}
                                        className={`text-center mt-2 transition-all duration-1000 ${
                                            isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                        } ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : ''}`}
                                    >
                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center relative">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[booking._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === booking._id ? null : booking._id);
                                                        }}
                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[booking._id] || 'Add label')}`}
                                                    >
                                                        {renderLabelIcon(rowLabels[booking._id], 16)}
                                                    </button>
                                                )}

                                                {activeLabelRowId === booking._id && (
                                                    <FloatingLabelSelector 
                                                        rowId={booking._id}
                                                        currentLabel={rowLabels[booking._id]}
                                                        onSaveLabel={handleSaveRowLabel}
                                                        labelPopupRef={labelPopupRef}
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span>{booking.bookingId || booking._id.substring(0, 8).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="text-[13px] font-semibold text-[#011023]">{booking.user?.name || "Unknown"}</div>
                                            <div className="text-xs text-gray-500">{booking.user?.userId || ""}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${booking.store ? 'bg-purple-100 text-purple-700' : booking.parking ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {booking.store ? 'Store' : booking.parking ? 'Parking' : 'Garage'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-semibold text-gray-800 text-sm">
                                                {booking.service?.title}
                                            </div>
                                             <div className="text-xs text-gray-500 uppercase font-medium">
                                                 {(() => {
                                                     const make = (booking.vehicle?.make || booking.vehicle?.brand || '').trim();
                                                     const model = (booking.vehicle?.model || booking.vehicle?.modelName || booking.vehicle?.carModel || booking.vehicle?.name || '').trim();
                                                     const hasValidModel = model && model.toUpperCase() !== 'N/A';
                                                     const hasValidMake = make && make.toUpperCase() !== 'N/A';

                                                     if (hasValidMake && hasValidModel) {
                                                         return make.toLowerCase().includes(model.toLowerCase()) ? make : `${make} ${model}`;
                                                     }
                                                     if (hasValidMake) return make;
                                                     if (hasValidModel) return model;
                                                     return 'N/A';
                                                 })()}
                                             </div>
                                        </td>
                                        <td className="p-4 font-semibold text-[13px] text-center">
                                            <div className="text-[#011023]">{dateStr}</div>
                                            {timeStr && <div className="text-gray-500 mt-0.5 text-xs font-normal">{timeStr}</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-semibold text-[#052558] text-sm">
                                                {booking.payment?.paymentId || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(booking.status)}`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-3.5">
                                                <button onClick={() => handleViewDetails(booking)} className="text-gray-400 hover:text-blue-500">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => handleDownloadInvoice(booking)} className="text-gray-400 hover:text-emerald-500">
                                                    <Download size={18} />
                                                </button>
                                                <button onClick={() => { setBookingToDelete(booking._id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500">
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

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                <div className="space-y-4 w-full md:w-[46%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedBooking.user?.name}>{selectedBooking.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedBooking.user?.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedBooking.user?.email}>{selectedBooking.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-4 w-full md:w-[28%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Brand:</span> <span className="font-semibold text-[#011023]">{selectedBooking.vehicle?.make || selectedBooking.vehicle?.brand || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedBooking.vehicle?.model || selectedBooking.vehicle?.modelName || selectedBooking.vehicle?.carModel || selectedBooking.vehicle?.name || 'N/A'}</span></p>
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
                                        <div className="rounded-xl flex items-center gap-4">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment</h4>
                                            <span className="text-base ml-5 font-bold text-[#011023]">₹{selectedBooking.payment?.amount || selectedBooking.service?.price || '0'}</span>
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
                                onClick={confirmDeleteBooking}
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

export default Bookings;
