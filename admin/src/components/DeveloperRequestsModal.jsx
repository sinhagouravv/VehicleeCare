import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Check, MoreVertical } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from './RowLabel';
import API_BASE_URL from '../config/api';

const DeveloperRequestsModal = ({ isOpen, onClose, isSidebarCollapsed = true }) => {
    const { triggerAlert } = useAlert();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // 3-dot dropdown menu & status update states
    const [openMenuId, setOpenMenuId] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    // Filter, Sort & Row Label States
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { filterConfig: activeContextConfig, setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_developer_requests_labels');

    const previousConfigRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            if (activeContextConfig && activeContextConfig.title !== 'Filter Developer Requests') {
                previousConfigRef.current = activeContextConfig;
            }
        }
    }, [isOpen, activeContextConfig]);

    // Register filter options when modal is open
    useEffect(() => {
        if (!isOpen) return;

        if (activeContextConfig && activeContextConfig.title !== 'Filter Developer Requests') {
            previousConfigRef.current = activeContextConfig;
        }

        setFilterConfig({
            title: 'Filter Developer Requests',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'category',
                    label: 'Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Leave', value: 'Leave' },
                        { label: 'Meeting', value: 'Meeting' },
                        { label: 'Overtime', value: 'Overtime' },
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Approved', value: 'Approved' },
                        { label: 'Rejected', value: 'Rejected' },
                    ]
                }
            ],
            initialValues: {
                category: filterCategory === 'All' ? 'all' : filterCategory,
                status: filterStatus === 'All' ? 'all' : filterStatus,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.category !== undefined) {
                    setFilterCategory(newValues.category === 'all' ? 'All' : newValues.category);
                }
                if (newValues.status !== undefined) {
                    setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                }
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterCategory('All');
                setFilterStatus('All');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(previousConfigRef.current || null);
        };
    }, [isOpen, setFilterConfig, filterCategory, filterStatus, labelFilter, sortOrder, timeRange]);

    // Format date string to display: DD Mon YYYY | hh:mm:ss am/pm (12-hour format)
    const formatSubmittedAt = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        return `${day} | ${time}`;
    };

    // Category pill styling matching Bug.jsx / UploadDocuments
    const getCategoryColor = (category) => {
        switch (category?.toLowerCase()) {
            case 'leave':
                return 'bg-blue-100 text-blue-700';
            case 'meeting':
                return 'bg-purple-100 text-purple-700';
            case 'overtime':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-purple-100 text-purple-700';
        }
    };

    // Status pill styling matching Bug.jsx
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'resolved':
            case 'active':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'rejected':
            case 'expired':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            default:
                return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    // Helpers to separate date and duration
    const getRequestDate = (req) => {
        if (!req) return 'N/A';
        if (req.requestDate) return req.requestDate;
        if (!req.duration) return 'N/A';
        
        // Meeting format: "22 SEPT 2026 | 13:00 - 13:30"
        if (req.duration.includes('|')) {
            return req.duration.split('|')[0].trim();
        }
        
        // Leave / Overtime format with parentheses: "9 DAYS (15 SEPT 2026 - 23 SEPT 2026)" or "2 HOURS (21-09-2026)"
        const match = req.duration.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            const inner = match[1].trim();
            const parts = inner.split(/[-/]/);
            if (parts.length === 3 && parts[2].length === 4) {
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                }
            }
            return inner.toUpperCase();
        }
        
        return req.duration;
    };

    const getRequestDuration = (req) => {
        if (!req) return 'N/A';
        if (req.category?.toLowerCase() === 'meeting') {
            if (req.details?.appointmentTime) return req.details.appointmentTime;
            if (req.duration?.includes('|')) {
                return req.duration.split('|')[1].trim();
            }
        }
        if (req.duration) {
            if (req.duration.includes('(')) {
                return req.duration.split('(')[0].trim().toUpperCase();
            }
            return req.duration.toUpperCase();
        }
        return 'N/A';
    };

    const getFullDurationDisplay = (req) => {
        if (!req) return 'N/A';
        const cat = req.category?.toLowerCase();
        const date = getRequestDate(req);
        const duration = getRequestDuration(req);

        if (cat === 'leave') {
            if (date && date !== 'N/A') {
                const match = date.match(/\(([^)]+)\)/);
                return (match ? match[1].trim() : date).toUpperCase();
            }
            return (duration || req.duration || 'N/A').toUpperCase();
        }

        if (cat === 'overtime') {
            const cleanDuration = duration && duration !== 'N/A' ? duration : (req.duration || '');
            if (date && date !== 'N/A' && cleanDuration) {
                return `${date} | ${cleanDuration}`.toUpperCase();
            }
            return (date && date !== 'N/A' ? date : (cleanDuration || 'N/A')).toUpperCase();
        }

        if (cat === 'meeting') {
            if (date && date !== 'N/A' && duration && duration !== 'N/A') {
                return `${date} | ${duration}`.toUpperCase();
            }
            return (date && date !== 'N/A' ? date : (duration || 'N/A')).toUpperCase();
        }

        if (duration && duration !== 'N/A' && date && date !== 'N/A') {
            return `${date} | ${duration}`.toUpperCase();
        }

        return (date && date !== 'N/A' ? date : (req.duration || duration || 'N/A')).toUpperCase();
    };

    // Fetch live developer requests from backend
    const fetchRequests = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/developer-requests?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setRequests(data.data);
                }
            }
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Failed to fetch developer requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Polling & cross-tab sync when modal is open
    useEffect(() => {
        if (!isOpen) return;

        fetchRequests();

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchRequests(true);
            }
        }, 5000);

        let bc;
        try {
            bc = new BroadcastChannel('developer_requests_channel');
            bc.onmessage = () => {
                fetchRequests(true);
            };
        } catch (e) {}

        const handleFocus = () => fetchRequests(true);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            if (bc) bc.close();
        };
    }, [isOpen, fetchRequests]);

    // Filter, sort and label processing
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            // Category filter
            if (filterCategory !== 'All' && req.category?.toLowerCase() !== filterCategory.toLowerCase()) {
                return false;
            }

            // Status filter
            if (filterStatus !== 'All' && req.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }

            // Row label filter
            const rowId = String(req._id || req.referenceId || req.requestId);
            if (labelFilter !== 'all') {
                const label = rowLabels[rowId] || (req.referenceId ? rowLabels[req.referenceId] : null) || (req.requestId ? rowLabels[req.requestId] : null);
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }

            // Time range filter
            if (timeRange !== 'all') {
                const itemDate = req.createdAt ? new Date(req.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }

            return true;
        }).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.referenceId || a.requestId || a._id || '');
            const idB = String(b.referenceId || b.requestId || b._id || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [requests, filterCategory, filterStatus, labelFilter, sortOrder, timeRange, rowLabels]);

    // Update active results count in filter context
    useEffect(() => {
        if (isOpen) {
            setResultsCount(filteredRequests.length);
        }
    }, [filteredRequests.length, isOpen, setResultsCount]);

    // Close 3-dot menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.dev-action-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [openMenuId]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (openMenuId) {
                    setOpenMenuId(null);
                } else if (isViewModalOpen) {
                    setIsViewModalOpen(false);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isViewModalOpen, openMenuId, onClose]);

    // Update status handler (Approve / Reject / Pending)
    const handleUpdateStatus = async (category, id, nextStatus) => {
        try {
            setUpdatingStatusId(id);
            const res = await fetch(`${API_BASE_URL}/api/developer-requests/${category.toLowerCase()}/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus, reviewerName: 'Administrator' })
            });
            const data = await res.json();
            if (data.success) {
                triggerAlert(`Request marked as ${nextStatus}!`, 'success');
                setRequests(prev => prev.map(r => r._id === id ? { ...r, status: nextStatus } : r));
                if (selectedRequest && selectedRequest._id === id) {
                    setSelectedRequest(prev => ({ ...prev, status: nextStatus }));
                }
            } else {
                triggerAlert(data.message || 'Failed to update request status', 'error');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            triggerAlert('Network error while updating status', 'error');
        } finally {
            setUpdatingStatusId(null);
            setOpenMenuId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Blur covering Sidebar (left-0), Top, and Bottom, stopping before right action buttons */}
            <div 
                className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[15.75rem]'}`}>
                <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                    
                    <div className="space-y-4 max-w-[97.5rem] mx-auto flex flex-col h-full overflow-hidden w-full">
                        
                        {/* Header matching Bug.jsx / GuestAdminDetailsModal */}
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-2">
                                Developer Requests
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                                    {!lastRefreshed ? (
                                        <div className="h-4 w-64 bg-slate-200/80 rounded-md animate-pulse" />
                                    ) : (
                                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content List matching Bug.jsx:L314-L432 */}
                        <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                            <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                                <table className="w-full text-center border-collapse table-fixed">
                                    <thead className="sticky top-0 z-30 shadow-sm bg-[#f0f6ff]">
                                        <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                            <th className="p-4 font-bold text-center w-[8.5%]">Refer ID</th>
                                            <th className="p-4 font-bold text-center w-[7.5%]">Developer</th>
                                            <th className="p-4 font-bold text-center w-[9%]">Category</th>
                                            <th className="p-4 font-bold text-center w-[8.5%]">Duration</th>
                                            <th className="p-4 font-bold text-center w-[30%]">Reason</th>
                                            <th className="p-4 font-bold text-center w-[14%]">Date Applied</th>
                                            <th className="p-4 font-bold text-center w-[8%]">Status</th>
                                            <th className="p-4 font-bold text-center w-[7%]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                                        {loading && requests.length === 0 ? (
                                            Array.from({ length: 15 }).map((_, i) => (
                                                <tr key={i} className="border-b border-[#e6f0fa] animate-pulse">
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-20 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-24 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-20 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-32 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-48 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-28 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-16 mx-auto" /></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-slate-200/80 rounded-md w-10 mx-auto" /></td>
                                                </tr>
                                            ))
                                        ) : filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">
                                                    No developer requests found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map((req) => {
                                                const rowId = String(req._id || req.referenceId || req.requestId);
                                                const rowLabel = rowLabels[rowId] || (req.referenceId ? rowLabels[req.referenceId] : null) || (req.requestId ? rowLabels[req.requestId] : null);

                                                return (
                                                    <tr 
                                                        key={`${req.category}-${req._id}`}
                                                        onClick={() => {
                                                            if (isLabelMode) {
                                                                setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                            }
                                                        }}
                                                        className={`transition-all duration-300 border-b border-[#e6f0fa] group ${
                                                            isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-white/50'
                                                        }`}
                                                    >
                                                        {/* Reference ID matching Bug.jsx ID column with Row Label */}
                                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center relative">
                                                            <div className="relative flex items-center justify-center w-full">
                                                                {Boolean(rowLabel) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                                        }}
                                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5 z-10"
                                                                        title={`Label: ${stripEmoji(rowLabel || 'Add label')}`}
                                                                    >
                                                                        {renderLabelIcon(rowLabel, 16)}
                                                                    </button>
                                                                )}

                                                                {activeLabelRowId === rowId && (
                                                                    <FloatingLabelSelector 
                                                                        rowId={rowId}
                                                                        currentLabel={rowLabel}
                                                                        onSaveLabel={handleSaveRowLabel}
                                                                        labelPopupRef={labelPopupRef}
                                                                        topClass="-top-8.5"
                                                                        positionClass="-left-4"
                                                                    />
                                                                )}
                                                                <span>{(req.referenceId || req.requestId || '').replace(/-/g, '').toUpperCase()}</span>
                                                            </div>
                                                        </td>

                                                    {/* Developer ID matching Bug.jsx reporter column */}
                                                    <td className="p-4 text-sm font-semibold text-[#052558] text-center">
                                                        <span>{req.developerId}</span>
                                                    </td>

                                                    {/* Category pill matching Bug.jsx portal column */}
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase ${getCategoryColor(req.category)}`}>
                                                            {req.category}
                                                        </span>
                                                    </td>

                                                    {/* Duration (Only Date displayed in table, 2 lines for Leave range) */}
                                                    <td className="p-4 text-center text-sm font-semibold text-gray-800">
                                                        {(() => {
                                                            const dateStr = getRequestDate(req);
                                                            if (req.category?.toLowerCase() === 'leave' && dateStr.includes(' - ')) {
                                                                const [startDate, endDate] = dateStr.split(' - ');
                                                                if (startDate && endDate) {
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center leading-tight gap-0.5">
                                                                            <span>{startDate}</span>
                                                                            <span>{endDate}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                            }
                                                            return <span>{dateStr}</span>;
                                                        })()}
                                                    </td>

                                                    {/* Reason matching Bug.jsx title column */}
                                                    <td className="p-4 pl-4 max-w-[140px] text-center align-middle font-semibold text-[#011023] uppercase">
                                                        <div className="flex items-center justify-center w-full">
                                                            <span className="truncate">{req.reason}</span>
                                                        </div>
                                                    </td>

                                                    {/* Date Applied matching Bug.jsx Reported At column */}
                                                    <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold">
                                                        <div className="flex items-center justify-center w-full">
                                                            <span className="flex-1 text-right">
                                                                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className="px-1.5 text-gray-700">|</span>
                                                            <span className="flex-1 text-left">
                                                                {new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status matching Bug.jsx status column */}
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent uppercase ${getStatusColor(req.status)}`}>
                                                            {req.status}
                                                        </span>
                                                    </td>

                                                    {/* Action matching Bug.jsx: Eye + 3-Dot menu */}
                                                    <td className="p-4 text-center relative">
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(req);
                                                                    setIsViewModalOpen(true);
                                                                }}
                                                                className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                                                            >
                                                                <Eye size={18} />
                                                            </button>

                                                            {/* 3-Dots Action Button & Dropdown */}
                                                            <div className="relative inline-flex items-center justify-center dev-action-menu">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (req.status?.toLowerCase() !== 'pending') return;
                                                                        setOpenMenuId(prev => prev === req._id ? null : req._id);
                                                                    }}
                                                                    className={`flex items-center justify-center transition-colors ${
                                                                        req.status?.toLowerCase() === 'pending'
                                                                            ? openMenuId === req._id
                                                                                ? 'text-blue-600 cursor-pointer'
                                                                                : 'text-gray-400 hover:text-gray-700 cursor-pointer'
                                                                            : 'text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>

                                                                {/* Popover Menu with Check ✓ (Up) and Cross ✕ (Down) in the center of 3-dots - Pending only */}
                                                                {openMenuId === req._id && req.status?.toLowerCase() === 'pending' && (
                                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-slate-200/90 rounded-2xl p-1 flex flex-col items-center gap-1 justify-center shadow-md animate-in fade-in zoom-in-95 duration-150">
                                                                        {/* Check ✓ (Up - Approve) */}
                                                                        <button
                                                                            type="button"
                                                                            disabled={updatingStatusId === req._id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenMenuId(null);
                                                                                handleUpdateStatus(req.category, req._id, 'Approved');
                                                                            }}
                                                                            className="text-slate-500 hover:text-emerald-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-emerald-50 rounded-2xl"
                                                                        >
                                                                            <Check size={18} className="stroke-[2]" />
                                                                        </button>

                                                                        {/* Cross ✕ (Down - Reject) */}
                                                                        <button
                                                                            type="button"
                                                                            disabled={updatingStatusId === req._id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenMenuId(null);
                                                                                handleUpdateStatus(req.category, req._id, 'Rejected');
                                                                            }}
                                                                            className="text-slate-500 hover:text-rose-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-rose-50 rounded-2xl"
                                                                        >
                                                                            <X size={18} className="stroke-[2]" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedRequest && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Request Details</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    ID: <span className="font-semibold text-gray-700">{(selectedRequest.referenceId || selectedRequest.requestId || '').replace(/-/g, '').toUpperCase()}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Grid matching Bug.jsx:L458-L501 */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full text-left">
                                {/* Developer Info (matching Reporter Info in Bug.jsx) */}
                                <div className="space-y-4 w-full md:w-[28%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Developer Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex">
                                            <span className="text-gray-500 w-20 shrink-0 font-medium">Name:</span>
                                            <span className="font-semibold text-[#011023] truncate" title={selectedRequest.developerName}>
                                                {selectedRequest.developerName || 'N/A'}
                                            </span>
                                        </p>
                                        <p className="text-sm flex">
                                            <span className="text-gray-500 w-20 shrink-0 font-medium">ID:</span>
                                            <span className="font-semibold text-gray-800 truncate">
                                                {selectedRequest.developerId || 'N/A'}
                                            </span>
                                        </p>
                                        {/* {selectedRequest.role && (
                                            <p className="text-sm flex">
                                                <span className="text-gray-500 w-20 shrink-0 font-medium">Role:</span>
                                                <span className="font-semibold text-gray-600 truncate">
                                                    {selectedRequest.role}
                                                </span>
                                            </p>
                                        )} */}
                                    </div>
                                </div>

                                {/* Request Meta (matching Issue Meta in Bug.jsx) */}
                                <div className="space-y-4 w-full md:w-[38%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Request Meta</h4>
                                    <div className="pt-3 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-24 shrink-0 font-medium">Category:</span>
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold uppercase rounded-full ${getCategoryColor(selectedRequest.category)}`}>
                                                {selectedRequest.category}
                                            </span>
                                        </div>
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-24 shrink-0 font-medium">Duration:</span>
                                            <span className="font-semibold text-[#011023]  text-sm">
                                                {getFullDurationDisplay(selectedRequest)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline (matching Timeline in Bug.jsx) */}
                                <div className="space-y-4 w-full md:w-[34%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timeline</h4>
                                    <div className="pt-2.5 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-24 shrink-0 font-medium">Status:</span>
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold ml-3.5 rounded-full border border-transparent ${getStatusColor(selectedRequest.status)}`}>
                                                {selectedRequest.status}
                                            </span>
                                        </div>
                                        <p className="text-sm flex">
                                            <span className="text-gray-500 w-28 shrink-0 uppercase font-medium">Applied On:</span>
                                            <span className="font-semibold text-[#011023] text-sm">
                                                {formatSubmittedAt(selectedRequest.createdAt)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Request Subject & Details (matching Bug Subject & Details in Bug.jsx) */}
                            <div className="space-y-3 text-left"> 
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Request Subject and Details</h4>
                                <p className="text-[14px] uppercase font-semibold text-justify leading-relaxed">
                                    <span className="text-[#052558] font-semibold">{selectedRequest.type}</span>
                                    <span className="text-gray-700 mx-2 font-semibold">|</span>
                                    <span className="text-gray-800 font-semibold">{selectedRequest.reason}</span>
                                </p>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default DeveloperRequestsModal;
