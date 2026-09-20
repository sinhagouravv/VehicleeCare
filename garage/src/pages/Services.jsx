import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, Plus, Filter, Wrench, Settings, AlertCircle, Edit, Trash2, Eye, Loader2, X, MessageSquare, Download, Check, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';
import { useAlert } from '../context/AlertContext';
import { API_BASE_URL } from '../config/api';

// Module-level cache for instant tab transitions
let cachedBookings = null;
let cachedBookingsGarageId = null;
let cachedBookingsTimestamp = null;

const Services = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { isGuest, guardGuestAction, maskEmail, maskPhone, isRealValue } = useGuestGuard();
    const { triggerAlert } = useAlert();
    const [bookings, setBookings] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedBookingsGarageId === gId && Array.isArray(cachedBookings)) return cachedBookings;
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedBookingsGarageId === gId && Array.isArray(cachedBookings)) return false;
            }
        } catch (e) {}
        return true;
    });
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedBookingsTimestamp ? new Date(cachedBookingsTimestamp) : null);
    const isFetchingRef = useRef(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Remark states
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkBooking, setSelectedRemarkBooking] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

    // Filter states
    const [fuelTypeFilter, setFuelTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_services_row_labels');

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Services',
            groups: [
                {
                    id: 'fuelType',
                    label: 'Fuel Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Petrol', value: 'Petrol' },
                        { label: 'Diesel', value: 'Diesel' },
                        { label: 'EV', value: 'EV' }
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'In Service', value: 'In Service' },
                        { label: 'In Progress', value: 'In Progress' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Pending', value: 'Pending' }
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                fuelType: 'all',
                status: 'all',
                label: 'all'
            },
            onChange: (newValues) => {
                if (newValues.fuelType !== undefined) setFuelTypeFilter(newValues.fuelType);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
            },
            onReset: () => {
                setFuelTypeFilter('all');
                setStatusFilter('all');
                setLabelFilter('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const filteredBookings = React.useMemo(() => {
        return bookings.filter((b) => {
            if (labelFilter && labelFilter !== 'all') {
                const itemLabel = rowLabels[b._id];
                if (!itemLabel || itemLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            if (fuelTypeFilter && fuelTypeFilter !== 'all') {
                const fType = (b.vehicle?.fuelType || '').trim().toLowerCase();
                const targetFType = fuelTypeFilter.trim().toLowerCase();
                if (targetFType === 'ev') {
                    if (!fType.includes('ev') && !fType.includes('electric')) return false;
                } else {
                    if (!fType.includes(targetFType)) return false;
                }
            }
            if (statusFilter && statusFilter !== 'all') {
                const bStat = (b.status || '').trim().toLowerCase();
                if (bStat !== statusFilter.trim().toLowerCase()) return false;
            }
            return true;
        });
    }, [bookings, fuelTypeFilter, statusFilter, labelFilter, rowLabels]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredBookings.length);
        }
    }, [filteredBookings.length, setResultsCount]);

    const highlightedRow = useHighlight(filteredBookings);

    const _formatDate = (dateString) => {
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
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const fetchBookings = useCallback(async (silent = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && !cachedBookings) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`${API_BASE_URL}/api/bookings/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data);
                const now = new Date();
                setLastRefreshed(now);
                cachedBookings = data.data;
                cachedBookingsGarageId = user.id;
                cachedBookingsTimestamp = now.getTime();
            }
        } catch (error) {
            console.error("Failed to fetch garage bookings", error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchBookings(!!cachedBookings);
        if (isGuest) return;
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchBookings(true);
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [fetchBookings, isGuest]);

    useEffect(() => {
        if (selectedBooking && bookings.length > 0) {
            const updated = bookings.find(b => b._id === selectedBooking._id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedBooking)) {
                setSelectedBooking(updated);
            }
        }
    }, [bookings, selectedBooking]);

    const _toggleStatus = async (bookingId, field, value) => {
        if (guardGuestAction()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => {
                    const updated = prev.map(b => b._id === bookingId ? { ...b, [field]: value } : b);
                    cachedBookings = updated;
                    return updated;
                });
            }
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
        }
    };

    const _handleStatusChange = async (bookingId, newStatus) => {
        if (guardGuestAction()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => {
                    const updated = prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b);
                    cachedBookings = updated;
                    return updated;
                });
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const confirmDelete = async () => {
        if (guardGuestAction()) return;
        if (!bookingToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingToDelete}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => {
                    const updated = prev.filter(b => b._id !== bookingToDelete);
                    cachedBookings = updated;
                    return updated;
                });
                setIsDeleteModalOpen(false);
                setBookingToDelete(null);
            }
        } catch (error) {
            console.error("Failed to delete booking", error);
        } finally {
            setDeleting(false);
        }
    };

    const handleDownloadService = (booking) => {
        if (guardGuestAction()) return;
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            doc.setFontSize(20);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare - Service Details", 105, 20, null, null, "center");

            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Booking ID: ${booking.bookingId || booking._id}`, 14, 38);
            doc.text(`Service Title: ${booking.service?.title || 'General Service'}`, 14, 45);
            doc.text(`Scheduled Date: ${booking.schedule?.date || 'N/A'} at ${booking.schedule?.time || ''}`, 14, 52);
            doc.text(`Fuel Type: ${booking.vehicle?.fuelType || 'N/A'}`, 14, 59);

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Customer & Vehicle Details", 14, 74);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Customer Name: ${booking.user?.name || 'N/A'}`, 14, 82);
            doc.text(`Customer Phone: ${booking.user?.phone || 'N/A'}`, 14, 89);
            doc.text(`Customer Email: ${booking.user?.email || 'N/A'}`, 14, 96);

            doc.text(`Make / Model: ${booking.vehicle?.make || ''} ${booking.vehicle?.model || ''}`, 14, 107);
            doc.text(`Year: ${booking.vehicle?.year || 'N/A'}`, 14, 114);

            doc.text(`Status: ${booking.status || 'Pending'}`, 14, 127);
            doc.text(`Duration: ${booking.serviceDuration || '—'}`, 14, 134);

            doc.save(`Service_${booking.bookingId || 'Details'}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF", err);
        }
    };

    const handleOpenRemarkModal = (booking) => {
        setSelectedRemarkBooking(booking);
        setRemarkText(booking.garageRemark || booking.employeeRemark || booking.remark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (guardGuestAction()) return;
        if (!selectedRemarkBooking) return;
        if (!remarkText || !remarkText.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }
        setIsSubmittingRemark(true);
        try {
            let garageName = 'Garage';
            let garageId = 'GARAGE';
            let garageRole = 'Garage Owner';
            const storedGarage = localStorage.getItem('garageUser');
            if (storedGarage) {
                try {
                    const u = JSON.parse(storedGarage);
                    garageName = u.name || u.garageName || garageName;
                    garageId = u.garageId || u.userId || u._id || garageId;
                    garageRole = u.role || garageRole;
                } catch (_) {}
            }

            const refId = selectedRemarkBooking.bookingId || selectedRemarkBooking.serviceId || String(selectedRemarkBooking._id);
            const targetId = selectedRemarkBooking.user?.name || selectedRemarkBooking.userName || selectedRemarkBooking.customerName || '—';
            const targetRole = 'Customer';

            const remarkRes = await fetch(`${API_BASE_URL}/api/remarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkBooking._id,
                    reporterId: garageId,
                    reporterName: garageName,
                    remarkerRole: garageRole,
                    remarkedRole: targetRole,
                    role: targetRole,
                    customerDetails: targetId,
                    remark: remarkText,
                    status: selectedRemarkBooking.status || 'Pending'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            setBookings(prev => prev.map(b => b._id === selectedRemarkBooking._id ? { ...b, garageRemark: remarkText, remarkId: createdRemarkId } : b));
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Services] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkBooking(null);
            setRemarkText('');
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
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] flex flex-col transition-all duration-300`}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Service Management</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10.5%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Assigned To</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[45%]' : 'w-[35%]'}`}>Service Details</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Duration</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-sm text-gray-500">No bookings found.</td>
                                </tr>
                            ) : filteredBookings.map((booking) => {
                                const rowId = booking.bookingId || booking._id;
                                return (
                                    <tr 
                                        key={booking._id} 
                                        id={`row-${rowId}`}
                                        onClick={() => {
                                            if (isLabelMode) {
                                                setActiveLabelRowId(prev => prev === booking._id ? null : booking._id);
                                            }
                                        }}
                                        className={`text-center cursor-pointer transition-all duration-1000 ${
                                            activeLabelRowId === booking._id
                                                ? 'relative z-40 bg-blue-50/50'
                                                : highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                        <td className="p-3.5 font-semibold text-[#052558] text-sm text-center w-[10%] relative">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[booking._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === booking._id ? null : booking._id);
                                                        }}
                                                        className="absolute -left-0.75 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
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
                                                        topClass="-top-9.5"
                                                        positionClass="-left-3.25"
                                                    />
                                                )}
                                                <span className="truncate">{booking.bookingId || booking._id?.substring(0, 8).toUpperCase()}</span>
                                            </div>
                                        </td>
                                    {/* <td className="p-4 text-center">
                                        {booking.payment?.paymentId || '—'}
                                    </td> */}
                                    <td className="p-3.25 text-center w-[8%]">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryStyle(booking.vehicle?.fuelType)}`}>
                                            {booking.vehicle?.fuelType || 'N/A'}
                                        </span>
                                    </td>

                                    <td className="p-3.25 text-center w-[11%]">
                                        <div className="font-semibold text-[13px]">
                                            {booking.assignedEmployees?.technician?.name || '—'}
                                        </div>
                                        <div className="text-[11.5px] text-gray-500">
                                            {booking.assignedEmployees?.technician?.employeeId || '—'}
                                        </div>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="font-semibold text-[#0f172a] text-[13.5px] uppercase leading-snug line-clamp-2">{booking.service?.title}</div>
                                        <div className="text-[11.5px] text-slate-500 uppercase mt-1 line-clamp-1 tracking-wide">{booking.service?.id || '—'}</div>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="flex items-center justify-center">
                                            <span className="font-semibold text-[13px] text-center whitespace-nowrap px-3 py-1.5 rounded-lg uppercase tracking-tight">
                                                {booking.serviceDuration || '—'}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    {/* <td className="p-4 text-center">
                                        <button 
                                            onClick={() => toggleStatus(booking._id, 'isPickedUp', !booking.isPickedUp)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${booking.isPickedUp ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                        >
                                            {booking.isPickedUp ? 'YES' : 'NO'}
                                        </button>
                                    </td> */}
                                    <td className="p-3.25 text-center w-[8%]">
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
                                    <td className="p-3.25 text-center w-[7%]">
                                        <div className="flex items-center justify-center gap-3.5">
                                            <button 
                                                onClick={() => { setSelectedBooking(booking); setIsViewModalOpen(true); }}
                                                className="text-gray-400 hover:text-blue-500 transition-colors" 
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button 
                                                onClick={() => handleDownloadService(booking)}
                                                className="text-gray-400 hover:text-emerald-500 transition-colors" 
                                            >
                                                <Download size={17} />
                                            </button>
                                            <button 
                                                onClick={() => handleOpenRemarkModal(booking)}
                                                className="text-gray-400 hover:text-purple-500 transition-colors" 
                                            >
                                                <MessageSquare size={17} />
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
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
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
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedBooking.user?.name}>{selectedBooking.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className={`font-semibold text-gray-800 truncate ${isGuest && isRealValue(selectedBooking.user?.phone) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskPhone(selectedBooking.user?.phone) || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className={`font-semibold text-gray-800 truncate ${isGuest && isRealValue(selectedBooking.user?.email) ? 'blur-sm select-none pointer-events-none' : ''}`} title={selectedBooking.user?.email}>{maskEmail(selectedBooking.user?.email) || 'N/A'}</span></p>
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
                                <div className="flex flex-col gap-4.5 w-full md:w-[36%]">
                                    <div className="space-y-0.25">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center mt-7 gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2 pl-7">
                                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusStyle(selectedBooking.status)}`}>
                                                    {selectedBooking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Duration</h4>
                                            <div className="flex uppercase items-center gap-2 pl-5">
                                                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-md uppercase text-gray-800">{selectedBooking.serviceDuration || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold mb-2 text-gray-400 uppercase tracking-wider w-30">Delivery Due</h4>
                                            <div className="flex uppercase items-center mb-2 gap-2 pl-2">
                                                <span className="inline-block px- py-1 text-sm font-semibold rounded-md uppercase text-gray-800">
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
                                <div className="gap-4 rounded-xl flex justify-between items-center ">
                                    <div>
                                        <h5 className="font-semibold text-[#052558] uppercase text-sm">{selectedBooking.service?.title || 'General Service'}</h5>
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
                            <div className="w-full pt-2 flex divide-x divide-[#e6f0fa]">
                                    <div className="w-1/3 pr-4 uppercase">
                                        <p className="text-sm font-semibold text-gray-400 mb-3">Assigned Employee's</p>
                                        <h5 className="font-semibold text-[#052558] text-[15.5px]">{selectedBooking.assignedEmployees?.technician?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Technician | {selectedBooking.assignedEmployees?.technician?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 pl-3 uppercase">
                                        <h5 className="font-semibold text-[#052558] mt-8 text-[15.5px]">{selectedBooking.assignedEmployees?.support?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Support Staff | {selectedBooking.assignedEmployees?.support?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 pl-8 uppercase">
                                        <h5 className="font-semibold text-[#052558] mt-8 text-[15.5px]">{selectedBooking.assignedEmployees?.mechanic?.name || '—'}</h5>
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

            {isRemarkModalOpen && selectedRemarkBooking && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkBooking(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Service Remark
                                </h3>
                                {selectedRemarkBooking.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkBooking.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkBooking(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Service / Booking Info Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Service ID</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkBooking.bookingId || selectedRemarkBooking.serviceId || selectedRemarkBooking._id}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkBooking.status === 'Pending' ? '—' : (
                                        selectedRemarkBooking.approvedByRole || 
                                        selectedRemarkBooking.actionByRole || 
                                        selectedRemarkBooking.approverRole || 
                                        selectedRemarkBooking.reviewerRole || 
                                        'Customer'
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase truncate max-w-[120px]">
                                    {selectedRemarkBooking.status === 'Pending' ? '—' : (
                                        selectedRemarkBooking.user?.name || 
                                        selectedRemarkBooking.userName || 
                                        selectedRemarkBooking.customerName || 
                                        '—'
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border ${getStatusStyle(selectedRemarkBooking.status || 'Pending')}`}>
                                    {selectedRemarkBooking.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkBooking.garageRemark || selectedRemarkBooking.employeeRemark);
                            return (
                                <form onSubmit={handleRemarkSubmit} className="space-y-4.5 text-left">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Remark</label>
                                        <textarea
                                            rows="4"
                                            disabled={hasExistingRemark}
                                            value={remarkText}
                                            onChange={(e) => setRemarkText(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#f8fafc] uppercase border border-[#cbd5e1] rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold text-sm text-[#011023] resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingRemark || hasExistingRemark}
                                        className={`w-full py-2 border rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-sm mt-4 flex items-center justify-center gap-2 ${
                                            hasExistingRemark 
                                                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                                                : 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3] hover:bg-[#c7d2fe] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {isSubmittingRemark ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> Submitting REMARK...
                                            </>
                                        ) : hasExistingRemark ? (
                                            <>
                                                <Check size={14} /> REMARK SUBMITTED
                                            </>
                                        ) : (
                                            <>
                                                <Send size={14} /> Submit REMARK
                                            </>
                                        )}
                                    </button>
                                </form>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Services;
