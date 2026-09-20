import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Loader2, Check, X, Eye, Trash2, Calendar, User, FileText, MessageSquare, MoreVertical, Send } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';
import API_BASE_URL from '../config/api';

// Module-level cache for instant 0ms page revisits
let cachedRequests = null;
let cachedRequestsGarageId = null;
let cachedRequestsTimestamp = 0;

const Meeting = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { triggerAlert } = useAlert();
    const { isGuest, guardGuestAction } = useGuestGuard();
    const [requests, setRequests] = useState(() => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const gId = user.id || user._id;
                if (cachedRequestsGarageId === gId && Array.isArray(cachedRequests)) return cachedRequests;
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const gId = user.id || user._id;
                if (cachedRequestsGarageId === gId && Array.isArray(cachedRequests)) return false;
            }
        } catch (e) {}
        return true;
    });
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedRequestsTimestamp ? new Date(cachedRequestsTimestamp) : null);
    const isFetchingRef = useRef(false);
    const [updatingId, setUpdatingId] = useState(null);
    
    // Modal states
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Remark states
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkRequest, setSelectedRemarkRequest] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

    // Close 3 dots action menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.row-action-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // Filter & Sort states
    const [purposeFilter, setPurposeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_meeting_row_labels');

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.requestDate,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
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

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter ID Card Requests',
            hasSort: true,
            groups: [
                {
                    id: 'type',
                    label: 'Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'ID Card', value: 'ID Card' }
                    ]
                },
                {
                    id: 'purpose',
                    label: 'Purpose',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Lost', value: 'Lost' },
                        { label: 'Damaged', value: 'Damaged' },
                        { label: 'Stolen', value: 'Stolen' }
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Approved', value: 'Approved' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Rejected', value: 'Rejected' }
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                purpose: 'all',
                type: 'all',
                status: 'all',
                label: 'all',
                sortOrder: 'latest',
                timeRange: 'all'
            },
            onChange: (newValues) => {
                if (newValues.purpose !== undefined) setPurposeFilter(newValues.purpose);
                if (newValues.type !== undefined) setTypeFilter(newValues.type);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setPurposeFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const filteredRequests = React.useMemo(() => {
        let filtered = requests.filter((r) => {
            if (labelFilter && labelFilter !== 'all') {
                const itemLabel = rowLabels[r._id];
                if (!itemLabel || itemLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            if (purposeFilter && purposeFilter !== 'all') {
                const purp = (r.reason || r.purpose || '').trim().toLowerCase();
                if (!purp.includes(purposeFilter.trim().toLowerCase())) return false;
            }
            if (typeFilter && typeFilter !== 'all') {
                const t = (r.type || 'ID Card').trim().toLowerCase();
                if (t !== typeFilter.trim().toLowerCase()) return false;
            }
            if (statusFilter && statusFilter !== 'all') {
                const stat = (r.status || '').trim().toLowerCase();
                if (stat !== statusFilter.trim().toLowerCase()) return false;
            }
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(r);
                if (itemDate) {
                    const now = new Date();
                    let cutoff;
                    if (timeRange === 'week') {
                        cutoff = new Date();
                        cutoff.setDate(now.getDate() - 7);
                    } else if (timeRange === 'month') {
                        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    }
                    if (cutoff) {
                        cutoff.setHours(0, 0, 0, 0);
                        if (itemDate < cutoff) return false;
                    }
                }
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const dateA = getItemDate(a)?.getTime() || 0;
            const dateB = getItemDate(b)?.getTime() || 0;
            if (sortOrder === 'oldest') {
                return dateA - dateB;
            }
            return dateB - dateA;
        });
    }, [requests, purposeFilter, typeFilter, statusFilter, labelFilter, rowLabels, sortOrder, timeRange]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredRequests.length);
        }
    }, [filteredRequests.length, setResultsCount]);

    const highlightedRow = useHighlight(filteredRequests);

    // Action Modal States
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'Approved' or 'Rejected'
    const [actionEmpId, setActionEmpId] = useState('');
    const [actionRemarks, setActionRemarks] = useState('');
    const [actionRequestId, setActionRequestId] = useState(null);
    const [managers, setManagers] = useState([]);

    const openActionModal = (requestId, type) => {
        setActionRequestId(requestId);
        setActionType(type);
        setActionEmpId('');
        setActionRemarks('');
        setIsActionModalOpen(true);
    };

    const storedUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
    const garageId = storedUser.id || storedUser._id;

    const fetchGarageRequests = useCallback(async (silent = false) => {
        if (!garageId) return;
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && (!cachedRequests || cachedRequests.length === 0)) setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/employees/id-card-requests/garage/${garageId}`);
            const data = await res.json();
            if (data.success) {
                cachedRequests = data.data || [];
                cachedRequestsGarageId = garageId;
                cachedRequestsTimestamp = Date.now();
                setRequests(cachedRequests);
                setLastRefreshed(new Date());
            }

            // Also fetch managers of this garage
            const empRes = await fetch(`${API_BASE_URL}/api/employees/garage/${garageId}`);
            const empData = await empRes.json();
            if (empData.success) {
                const mgrs = (empData.data || []).filter(emp => String(emp.role || '').toLowerCase() === 'manager' && emp.isVerified !== false);
                setManagers(mgrs);
            }
        } catch (error) {
            console.error("Failed to fetch garage ID card requests/managers:", error);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [garageId]);

    useEffect(() => {
        fetchGarageRequests();
        if (isGuest) return;
        const interval = setInterval(() => fetchGarageRequests(true), 30000);
        return () => clearInterval(interval);
    }, [fetchGarageRequests, isGuest]);

    const handleStatusUpdate = async (e) => {
        if (e) e.preventDefault();
        if (guardGuestAction()) return;
        if(!actionEmpId || !actionRemarks.trim()) {
            triggerAlert('Please select a Manager ID and provide Reason for Action', 'error');
            return;
        }

        setUpdatingId(actionRequestId);
        setIsActionModalOpen(false);
        try {
            const res = await fetch(`${API_BASE_URL}/api/employees/id-card-requests/${actionRequestId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: actionType, employeeId: actionEmpId, remarks: actionRemarks })
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.map(r => r._id === actionRequestId ? { ...r, status: actionType, remarks: actionRemarks } : r));
                triggerAlert('Status updated successfully', 'success');
            } else {
                triggerAlert(data.message || "Failed to update status", 'error');
            }
        } catch (error) {
            console.error("Error updating ID card request status:", error);
            triggerAlert("Error updating status", 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async () => {
        if (guardGuestAction()) return;
        if (!selectedRequest) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/employees/id-card-requests/${selectedRequest._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
                triggerAlert('Request deleted successfully', 'success');
                setIsDeleteModalOpen(false);
                setSelectedRequest(null);
            } else {
                triggerAlert(data.message || "Failed to delete request", 'error');
            }
        } catch (error) {
            console.error("Error deleting ID card request:", error);
            triggerAlert("Error deleting request", 'error');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        if (typeof dateStr !== 'string') dateStr = String(dateStr);

        // Handle DD-MM-YYYY or DD/MM/YYYY
        const ddmmyyyy = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyy) {
            const [, dd, mm, yyyy] = ddmmyyyy;
            const parsed = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
            if (!isNaN(parsed.getTime())) {
                return parsed.toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
            }
        }

        // Handle YYYY-MM-DD
        const yyyymmdd = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (yyyymmdd) {
            const [, yyyy, mm, dd] = yyyymmdd;
            const parsed = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
            if (!isNaN(parsed.getTime())) {
                return parsed.toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
            }
        }

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;

        return d.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const _formatTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleOpenRemarkModal = (req) => {
        setSelectedRemarkRequest(req);
        setRemarkText(req.garageRemark || req.employeeRemark || req.remark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (guardGuestAction()) return;
        if (!selectedRemarkRequest) return;
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

            const refId = selectedRemarkRequest.meetingId || selectedRemarkRequest.requestId || String(selectedRemarkRequest._id);
            const targetId = selectedRemarkRequest.employeeId || '—';
            const targetRole = 'Employee';

            const remarkRes = await fetch(`${API_BASE_URL}/api/remarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkRequest._id,
                    reporterId: garageId,
                    reporterName: garageName,
                    remarkerRole: garageRole,
                    remarkedRole: targetRole,
                    role: targetRole,
                    customerDetails: targetId,
                    remark: remarkText,
                    status: selectedRemarkRequest.status || 'Pending'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            setRequests(prev => prev.map(r => r._id === selectedRemarkRequest._id ? { ...r, garageRemark: remarkText, remarkId: createdRemarkId } : r));
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Meeting] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkRequest(null);
            setRemarkText('');
        }
    };

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] flex flex-col transition-all duration-300`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Meeting Requests</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[9%]">Meeting ID</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[9%]' : 'w-[10%]'}`}>Employee ID</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Type</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[36%]' : 'w-[26%]'}`}>Reason</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Scheduled At</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[6%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase">
                            {loading && filteredRequests.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-gray-400 font-bold tracking-widest opacity-60">
                                        No requests found.
                                    </td>
                                </tr>
                            ) : filteredRequests.map((req) => (
                                <tr 
                                    key={req._id} 
                                    id={`row-${req._id}`}
                                    onClick={() => {
                                        if (isLabelMode) {
                                            setActiveLabelRowId(prev => prev === req._id ? null : req._id);
                                        }
                                    }}
                                    className={`cursor-pointer transition-all duration-1000 ${
                                        activeLabelRowId === req._id
                                            ? 'relative z-40 bg-blue-50/50'
                                            : highlightedRow === req._id 
                                            ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                            : 'hover:bg-blue-50/30'
                                    }`}
                                >
                                    <td className="p-4 font-semibold text-[#011023] text-sm text-center relative">
                                        <div className="relative flex items-center justify-center w-full">
                                            {Boolean(rowLabels[req._id]) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLabelRowId(prev => prev === req._id ? null : req._id);
                                                    }}
                                                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                >
                                                    {renderLabelIcon(rowLabels[req._id], 16)}
                                                </button>
                                            )}

                                            {activeLabelRowId === req._id && (
                                                <FloatingLabelSelector 
                                                    rowId={req._id}
                                                    currentLabel={rowLabels[req._id]}
                                                    onSaveLabel={handleSaveRowLabel}
                                                    labelPopupRef={labelPopupRef}
                                                    topClass="-top-8"
                                                    positionClass="-left-4"
                                                />
                                            )}
                                            <span className="truncate">{req.meetingId || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold text-sm text-gray-700 text-center">
                                        {req.employeeId}
                                    </td>
                                    {/* <td className="p-4 font-semibold text-sm text-gray-700 text-center">
                                        {req.employeeName || '—'}
                                    </td> */}
                                    <td className="p-4 font-semibold text-sm text-gray-700 text-center">
                                        ID card
                                    </td>
                                    {/* <td className="p-4 font-semibold text-sm text-gray-700 text-center">
                                        {req.purpose || req.reason || '—'}
                                    </td> */}
                                    <td className="p-4 text-center">
                                        <p 
                                            className="whitespace-normal text-center text-gray-700 font-semibold line-clamp-2 leading-snug overflow-hidden"
                                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                        >
                                            {req.purpose ? req.reason : (req.additionalInfo || req.reason)}
                                        </p>
                                    </td>
                                    <td className="p-4 font-semibold text-sm whitespace-nowrap text-center">
                                        {req.appointmentDate ? (
                                            <>
                                                <span className="text-[#011023] font-semibold">{formatDate(req.appointmentDate)}</span>
                                                {req.appointmentTime && (
                                                    <span className="inline-flex items-center">
                                                        <span className="text-gray-800 mx-1.5">|</span>
                                                        <span className="text-[#011023] font-semibold">{req.appointmentTime}</span>
                                                    </span>
                                                )}
                                            </>
                                        ) : '—'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-widest ${getStatusStyle(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-4">
                                            <button 
                                                onClick={() => { setSelectedRequest(req); setIsViewModalOpen(true); }}
                                                className="text-gray-400 hover:text-blue-500 flex items-center justify-center cursor-pointer transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {req.status === 'Pending' ? (
                                                /* 3-Dots Action Button & Dropdown */
                                                <div className="relative inline-flex items-center justify-center row-action-menu">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(prev => prev === req._id ? null : req._id);
                                                        }}
                                                        className={`flex items-center justify-center transition-colors cursor-pointer ${
                                                            openMenuId === req._id
                                                                ? 'text-blue-600'
                                                                : 'text-gray-400 hover:text-gray-700'
                                                        }`}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {/* Popover Menu with Check ✓ (Up) and Cross ✕ (Down) just above 3-dots */}
                                                    {openMenuId === req._id && (
                                                        <div className="absolute shadow-xs left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200/90 rounded-2xl p-1 flex flex-col items-center gap-1 justify-center animate-in fade-in zoom-in-95 duration-150">
                                                            {/* Check ✓ (Up - Approve) */}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(null);
                                                                    openActionModal(req._id, 'Approved');
                                                                }}
                                                                className="text-slate-500 hover:text-emerald-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-emerald-50 rounded-2xl"
                                                            >
                                                                <Check size={18} className="stroke-[2]" />
                                                            </button>

                                                            {/* Cross ✕ (Down - Reject) */}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(null);
                                                                    openActionModal(req._id, 'Rejected');
                                                                }}
                                                                className="text-slate-500 hover:text-rose-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-rose-50 rounded-2xl"
                                                            >
                                                                <X size={18} className="stroke-[2]" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleOpenRemarkModal(req)}
                                                    className="text-gray-400 hover:text-emerald-500 transition-colors flex items-center justify-center cursor-pointer"
                                                    title="Meeting Remarks"
                                                >
                                                    <MessageSquare size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {isViewModalOpen && selectedRequest && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Request Details</h3>
                                <p className="text-sm font-semibold text-gray-500 mt-1 uppercase">Meeting ID: <span className="text-[#011023] font-semibold">{selectedRequest.meetingId || '—'}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 mb-7 w-full">
                                {/* Employee Info */}
                                <div className="space-y-1 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Employee Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011021] truncate">{selectedRequest.employeeName || '—'}</span></p>
                                        <p className="text-sm text-gray-500"><span className="text-gray-500 w-24 shrink-0">ID:</span> <span className="font-semibold pl-19 text-gray-700">{selectedRequest.employeeId}</span></p>
                                    </div>
                                </div>

                                {/* Request Info */}
                                <div className="space-y-1 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Appointment Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Type:</span> <span className="font-semibold ">ID CARD</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Purpose:</span> <span className="font-semibold text-[#011023]">{selectedRequest.purpose || selectedRequest.reason || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Status & Remarks */}
                                <div className="flex flex-col gap-4 w-full md:w-[40%]">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Status Details</h4>
                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-center gap-6">
                                                <p className="text-sm text-gray-500 w-16 shrink-0 uppercase">Status</p>
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border border-transparent uppercase tracking-wider ml-5.5 ${getStatusStyle(selectedRequest.status)}`}>
                                                    {selectedRequest.status}
                                                </span>
                                            </div>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0 uppercase">Scheduled</span> <span className="font-semibold text-[#011023] uppercase ml-4">{selectedRequest.appointmentDate ? `${formatDate(selectedRequest.appointmentDate)} | ${selectedRequest.appointmentTime || '—'}` : '—'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Request */}
                            <div className="space-y-2 mb-7">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Request</h4>
                                <div className="pt-2 uppercase">
                                    <h5 className="font-semibold text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap">
                                        {selectedRequest.purpose ? selectedRequest.reason : (selectedRequest.additionalInfo || '—')}
                                    </h5>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedRequest.remarks && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remarks</h4>
                                    <div className="pt-2 uppercase">
                                        <h5 className="font-semibold text-gray-700 text-[13px] leading-relaxed whitespace-pre-wrap">
                                            {selectedRequest.remarks}
                                        </h5>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedRequest && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Request</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the ID card request record for <span className="text-[#052558] font-bold uppercase">{selectedRequest.employeeName || 'Employee'}</span>. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
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

            {/* Action Modal */}
            {isActionModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !updatingId && setIsActionModalOpen(false)} />
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wider">
                                {actionType === 'Approved' ? 'Approve Request' : 'Reject Request'}
                            </h3>
                            <button 
                                onClick={() => setIsActionModalOpen(false)}
                                className="absolute right-7 p-2 text-slate-400 rounded-xl transition-colors hover:bg-slate-200 hover:text-slate-600"
                                disabled={updatingId === actionRequestId}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleStatusUpdate}>
                            {/* Body */}
                            <div className="p-8 space-y-4">
                                <div className="bg-slate-50/50 border border-slate-100 p-1 rounded-2xl">
                                    <p className="text-sm uppercase font-medium text-justify text-slate-700 leading-relaxed">
                                        Please provide employee verification to <span className="font-bold text-[#011023]">{actionType.toLowerCase()}</span> this request. This action will be documented in the internal audit.
                                    </p>
                                </div>

                                <div className="flex gap-2.5 text-left">
                                    <div className="w-[32%]">
                                        <label className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center mb-2">Manager ID</label>
                                        <select 
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2 text-[13px] font-semibold text-[#011023] outline-none transition-all uppercase tracking-wider shadow-sm text-center cursor-pointer appearance-none"
                                            value={actionEmpId}
                                            onChange={e => setActionEmpId(e.target.value)}
                                            disabled={updatingId === actionRequestId}
                                        >
                                            <option value=""></option>
                                            {managers.map(m => (
                                                <option key={m._id || m.employeeId} value={m.employeeId}>
                                                    {m.employeeId} {m.name ? `(${m.name})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-[68%]">
                                        <label className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center mb-2">Reason for Action</label>
                                        <input 
                                            type="text"
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 text-[13px] font-semibold uppercase text-[#011023] outline-none transition-all shadow-sm"
                                            value={actionRemarks}
                                            onChange={e => setActionRemarks(e.target.value)}
                                            disabled={updatingId === actionRequestId}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsActionModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={updatingId === actionRequestId}
                                >
                                    Cancel Action
                                </button>
                                <button 
                                    type="submit"
                                    disabled={updatingId === actionRequestId || !actionEmpId.trim() || !actionRemarks.trim()}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:shadow-none ${actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50'}`}
                                >
                                    {updatingId === actionRequestId ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Action'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {isRemarkModalOpen && selectedRemarkRequest && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkRequest(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Meeting Remark
                                </h3>
                                {selectedRemarkRequest.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkRequest.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkRequest(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Info Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meeting ID</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkRequest.meetingId || selectedRemarkRequest.requestId || selectedRemarkRequest._id}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    Employee
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase truncate max-w-[120px]">
                                    {selectedRemarkRequest.employeeId || '—'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border ${getStatusStyle(selectedRemarkRequest.status)}`}>
                                    {selectedRemarkRequest.status}
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkRequest.garageRemark || selectedRemarkRequest.employeeRemark);
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

export default Meeting;
