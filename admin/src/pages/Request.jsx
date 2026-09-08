import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Eye, Check, X, Trash2, Loader2, MoreVertical } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';

import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Request = ({ isModal = false, onClose, highlightId }) => {
    const location = useLocation();
    const { triggerAlert } = useAlert();
    const [requests, setRequests] = useState([]);
    const highlightedRow = useHighlight(requests, highlightId);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Close 3 dots action menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.request-action-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // Filter, Sort & Row Label States
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_requests_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Requests',
            hasSort: true,
            groups: [
                {
                    key: 'status',
                    label: 'Status',
                    type: 'radio',
                    options: [
                        { label: 'All', value: 'All' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'In Progress', value: 'In Progress' },
                        { label: 'Approved', value: 'Approved' },
                        { label: 'Rejected', value: 'Rejected' },
                    ],
                    value: filterStatus,
                    onChange: (val) => setFilterStatus(val),
                },
                LABEL_FILTER_GROUP,
            ],
            sortOptions: [
                { label: 'Newest First', value: 'latest' },
                { label: 'Oldest First', value: 'oldest' },
            ],
            sortValue: sortOrder,
            onSortChange: (val) => setSortOrder(val),
            onResetAll: () => {
                setFilterStatus('All');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            },
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterStatus, labelFilter, sortOrder, timeRange]);

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);



    const fetchRequests = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('https://vehicleecare.onrender.com/api/requests');
            const result = await res.json();
            if (result.success && result.data) {
                setRequests(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(() => fetchRequests(true), 5000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    const handleUpdateStatus = async (id, status, remark = '') => {
        try {
            const res = await fetch(`https://vehicleecare.onrender.com/api/requests/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, remark })
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.map(r => r._id === id ? { ...r, status, remark } : r));
                triggerAlert(`Request status updated to ${status}`, 'success');
                if (selectedRequest && selectedRequest._id === id) {
                    setSelectedRequest(prev => ({ ...prev, status, remark }));
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            triggerAlert('Failed to update status', 'error');
        }
    };

    const confirmDeleteRequest = async () => {
        if (!requestToDelete) return;
        const targetId = typeof requestToDelete === 'object' ? requestToDelete._id : requestToDelete;
        setDeleting(true);
        try {
            const res = await fetch(`https://vehicleecare.onrender.com/api/requests/${targetId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.filter(r => r._id !== targetId));
                triggerAlert('Request deleted successfully', 'success');
                setIsDeleteModalOpen(false);
                setRequestToDelete(null);
            }
        } catch (error) {
            console.error('Failed to delete request:', error);
            triggerAlert('Failed to delete request', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const formatSubmittedAt = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
    };

    const getPortalBadge = (portalStr) => {
        const portal = (portalStr || 'EMPLOYEE').toUpperCase();
        if (portal === 'GARAGE') {
            return 'bg-purple-100 text-purple-700 border-purple-200';
        } else if (portal === 'USER') {
            return 'bg-teal-100 text-teal-700 border-teal-200';
        }
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const getStatusBadge = (statusStr) => {
        const status = (statusStr || 'Pending').toUpperCase();
        if (status === 'APPROVED' || status === 'RESOLVED') {
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        } else if (status === 'REJECTED') {
            return 'bg-rose-100 text-rose-700 border-rose-200';
        } else if (status === 'IN PROGRESS') {
            return 'bg-purple-100 text-purple-700 border-purple-200';
        }
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const filteredRequests = React.useMemo(() => {
        return requests.filter(r => {
            if (filterStatus !== 'All' && r.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[r._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = r.createdAt ? new Date(r.createdAt) : null;
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
            const idA = String(a.requestId || a._id || '');
            const idB = String(b.requestId || b._id || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [requests, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredRequests.length);
    }, [filteredRequests.length, setResultsCount]);

    return (
        <div className={`space-y-4 max-w-[97.5rem] mx-auto flex flex-col ${isModal ? 'h-full overflow-hidden' : 'h-[calc(100vh-9.25rem)]'}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-2">
                    Requests Tracker
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {!lastRefreshed ? (
                            <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                        ) : (
                            `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content List */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-20 shadow-sm bg-[#f0f6ff]">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[9.25%]">Request ID</th>
                                <th className="p-4 font-bold text-center w-[9.5%]">Requested By</th>
                                <th className="p-4 font-bold text-center w-[7.5%]">Portal</th>
                                <th className="p-4 font-bold text-center w-[8.5%]">Time Period</th>
                                <th className="p-4 font-bold text-center w-[29%]">Reason</th>
                                <th className="p-4 font-bold text-center w-[14%]">Date Request at</th>
                                <th className="p-4 font-bold text-center w-[8.5%]">Status</th>
                                <th className="p-4 font-bold text-center w-[7%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                            {loading && requests.length === 0 ? (
                                <TableSkeleton rows={16} cols={8} />
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">No requests found.</td>
                                </tr>
                            ) : (
                                filteredRequests.map((item) => {
                                    const rowId = item.requestId || item._id;
                                    return (
                                        <tr 
                                            key={item._id} 
                                            id={`row-${rowId}`}
                                            data-row-id={item._id}
                                            data-request-id={item.requestId}
                                            onClick={(e) => {
                                                if (isLabelMode) {
                                                    e.stopPropagation();
                                                    setActiveLabelRowId(prev => prev === item._id ? null : item._id);
                                                }
                                            }}
                                            className={`transition-all duration-1000 border-b border-[#e6f0fa] group ${
                                                isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-white/50'
                                            } ${(highlightedRow && (
                                                String(highlightedRow).toLowerCase() === String(rowId).toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item._id).toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item.requestId || '').toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item.employeeId || '').toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item.userId || '').toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item.displayId || '').toLowerCase()
                                            )) ? 'bg-emerald-100/60 rounded-2xl relative z-10 scale-[1.01]' : ''}`}
                                        >
                                            {/* Request ID */}
                                            <td className="p-4 font-semibold text-[#052558] text-sm text-center relative w-[10%]">
                                                <div className="relative flex items-center justify-center w-full">
                                                    {Boolean(rowLabels[item._id]) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveLabelRowId(prev => prev === item._id ? null : item._id);
                                                            }}
                                                            className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5 z-10"
                                                            title={`Label: ${stripEmoji(rowLabels[item._id] || 'Add label')}`}
                                                        >
                                                            {renderLabelIcon(rowLabels[item._id], 16)}
                                                        </button>
                                                    )}

                                                    {activeLabelRowId === item._id && (
                                                        <FloatingLabelSelector 
                                                            rowId={item._id}
                                                            currentLabel={rowLabels[item._id]}
                                                            onSaveLabel={handleSaveRowLabel}
                                                            labelPopupRef={labelPopupRef}
                                                            topClass='-top-8.5'
                                                            positionClass="-left-4"
                                                        />
                                                    )}
                                                    <span>{item.requestId || 'RQ104921'}</span>
                                                </div>
                                            </td>

                                            {/* Employee / User ID */}
                                            <td className="p-4 text-sm font-semibold text-[#011023] text-center w-[12%] truncate">
                                                {item.employeeId || item.userId || '—'}
                                            </td>

                                            {/* Portal */}
                                            <td className="p-4 text-center w-[10%]">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border uppercase ${getPortalBadge(item.portal)}`}>
                                                    {item.portal || 'EMPLOYEE'}
                                                </span>
                                            </td>

                                            {/* Tentative Time */}
                                            <td className="p-4 text-center text-sm font-semibold text-gray-700 w-[12%] uppercase">
                                                {item.tentativeTime || '—'}
                                            </td>

                                            {/* Reason */}
                                            <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[240px] uppercase w-[26%]">
                                                {item.reason}
                                            </td>

                                            {/* Date Request */}
                                            <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold w-[16%]">
                                                <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-center w-full">
                                                    <span className="text-right">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="px-1.5 text-gray-800 font-semibold">|</span>
                                                    <span className="text-left">{new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4 text-center w-[8%]">
                                                <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border uppercase ${getStatusBadge(item.status)}`}>
                                                    {item.status || 'Pending'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(item);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors flex items-center justify-center"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {(item.status === 'Pending' || item.status === 'PENDING' || item.status === 'In Progress' || item.status === 'IN PROGRESS') ? (
                                                        /* 3-Dots Action Button & Dropdown */
                                                        <div className="relative inline-flex items-center justify-center request-action-menu">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(prev => prev === item._id ? null : item._id);
                                                                }}
                                                                className={`flex items-center justify-center transition-colors cursor-pointer ${
                                                                    openMenuId === item._id
                                                                        ? 'text-blue-600'
                                                                        : 'text-gray-400 hover:text-gray-700'
                                                                }`}
                                                            >
                                                                <MoreVertical size={18} />
                                                            </button>

                                                            {/* Popover Menu with Check ✓ (Up) and Cross ✕ (Down) just above 3-dots */}
                                                            {openMenuId === item._id && (
                                                                <div className="absolute left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200/90 rounded-2xl p-1 flex flex-col items-center gap-1 justify-center animate-in fade-in zoom-in-95 duration-150">
                                                                    {/* Check ✓ (Up - 1st click: In Progress, 2nd click: Approved) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(null);
                                                                            const currStatus = (item.status || '').toLowerCase();
                                                                            const nextStatus = currStatus === 'in progress' ? 'Approved' : 'In Progress';
                                                                            handleUpdateStatus(item._id, nextStatus);
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
                                                                            handleUpdateStatus(item._id, 'Rejected');
                                                                        }}
                                                                        className="text-slate-500 hover:text-rose-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-rose-50 rounded-2xl"
                                                                        title="Reject"
                                                                    >
                                                                        <X size={18} className="stroke-[2]" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRequestToDelete(item);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="text-gray-400 hover:text-rose-600 cursor-pointer transition-colors flex items-center justify-center"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
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

            {/* View Details Modal */}
            {isViewModalOpen && selectedRequest && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Request Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">Request ID: <span className="font-semibold text-gray-700">{selectedRequest.requestId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 rounded-full transition-colors p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="grid grid-cols-3 gap-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 uppercase">
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 block">Employee / User ID</span>
                                    <span className="text-sm font-bold text-[#011023] mt-1 block">{selectedRequest.employeeId || selectedRequest.userId || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 block">Portal</span>
                                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border uppercase mt-1 ${getPortalBadge(selectedRequest.portal)}`}>
                                        {selectedRequest.portal || 'EMPLOYEE'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 block">Requester Name</span>
                                    <span className="text-sm font-bold text-[#052558] mt-1 block">{selectedRequest.name || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 block">Tentative Time</span>
                                    <span className="text-sm font-bold text-gray-700 mt-1 block">{selectedRequest.tentativeTime || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 block">Status</span>
                                    <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border uppercase mt-1 ${getStatusBadge(selectedRequest.status)}`}>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 block">Date Requested</span>
                                    <span className="text-xs font-bold text-gray-700 mt-1 block">{formatSubmittedAt(selectedRequest.createdAt)}</span>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2 text-left uppercase"> 
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason</h4>
                                <p className="text-[15px] uppercase font-bold text-[#011023]">
                                    {selectedRequest.reason}
                                </p>
                            </div>

                            {/* Explanation / Description */}
                            {(selectedRequest.explanation || selectedRequest.description) && (
                                <div className="space-y-2 text-left uppercase"> 
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Detailed Explanation</h4>
                                    <p className="text-[14px] uppercase font-semibold text-justify leading-relaxed text-gray-800 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {selectedRequest.explanation || selectedRequest.description}
                                    </p>
                                </div>
                            )}

                            {selectedRequest.remark && (
                                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-left uppercase">
                                    <span className="text-xs font-bold text-rose-500 block">Admin Remark</span>
                                    <p className="text-sm text-rose-700 font-semibold mt-0.5">{selectedRequest.remark}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && requestToDelete && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setRequestToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Request</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the request <span className="text-[#052558] font-bold uppercase">{typeof requestToDelete === 'object' ? (requestToDelete.requestId || requestToDelete.reason || 'this request') : requestToDelete}</span>. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setRequestToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteRequest}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
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

export default Request;
