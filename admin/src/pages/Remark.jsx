import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MessageSquare, Check, Clock, Trash2, X, Loader2, Eye } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { API_BASE_URL } from '../config/api';

import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';

const Remark = ({ isModal = false, onClose, highlightId }) => {
    const location = useLocation();
    const { triggerAlert } = useAlert();
    const { guardGuestAction } = useGuestGuard();
    const [remarks, setRemarks] = useState([]);
    const highlightedRow = useHighlight(remarks, highlightId);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Filter, Sort & Row Label States
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_remarks_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Remarks',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
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

    // Modal states
    const [selectedRemark, setSelectedRemark] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [remarkToDelete, setRemarkToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);



    const fetchRemarks = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/remarks`);
            const result = await res.json();
            if (res.ok) {
                const list = result.data || (Array.isArray(result) ? result : []);
                setRemarks(list);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching remarks:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRemarks();
        const interval = setInterval(() => fetchRemarks(true), 5000);
        return () => clearInterval(interval);
    }, [fetchRemarks]);

    const handleUpdateStatus = async (id, status) => {
        if (guardGuestAction()) return;
        setUpdatingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/remarks/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setRemarks(prev => prev.map(r => r._id === id ? { ...r, status } : r));
                if (selectedRemark && selectedRemark._id === id) {
                    setSelectedRemark(prev => ({ ...prev, status }));
                }
                triggerAlert('Status updated successfully', 'success');
            } else {
                triggerAlert(data.message || "Failed to update remark status.", 'error');
            }
        } catch (error) {
            console.error("Error updating status:", error);
            triggerAlert("Network error. Failed to update status.", 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteRemark = async () => {
        if (guardGuestAction()) return;
        if (!remarkToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/remarks/${remarkToDelete._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setRemarks(prev => prev.filter(r => r._id !== remarkToDelete._id));
                triggerAlert('Remark deleted successfully', 'success');
                setIsDeleteModalOpen(false);
                setRemarkToDelete(null);
            } else {
                triggerAlert(data.message || "Failed to delete remark.", 'error');
            }
        } catch (error) {
            console.error("Error deleting remark:", error);
            triggerAlert("Network error. Failed to delete remark.", 'error');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved':
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending':
            default: return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'staff': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'mechanic': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'technician': return 'bg-amber-100 text-amber-700 font-bold';
            case 'support': return 'bg-indigo-100 text-indigo-700 font-bold';
            case 'chef': return 'bg-orange-100 text-orange-700 font-bold';
            case 'waiter': return 'bg-pink-100 text-pink-700 font-bold';
            case 'cashier': return 'bg-cyan-100 text-cyan-700 font-bold';
            case 'delivery': return 'bg-lime-100 text-lime-700 font-bold';
            case 'customer': return 'bg-teal-100 text-teal-700 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    const formatSubmittedAt = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        return `${day}, ${time.toLowerCase()}`;
    };

    const filteredRemarks = React.useMemo(() => {
        return remarks.filter(r => {
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
            const idA = String(a.remarkId || a._id || '');
            const idB = String(b.remarkId || b._id || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [remarks, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredRemarks.length);
    }, [filteredRemarks.length, setResultsCount]);

    return (
        <div className={`space-y-4 max-w-[97.5rem] mx-auto flex flex-col ${isModal ? 'h-full overflow-hidden' : 'h-[calc(100vh-9.25rem)]'}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-2">
                    Remarks Tracker
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : <div className="h-3.5 w-70 bg-slate-200 rounded-full animate-pulse" />}
                    </div>
                </div>
            </div>

            {/* Main Content List */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-20 shadow-sm bg-[#f0f6ff]">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[8.5%]">Remark ID</th>
                                <th className="p-4 font-bold text-center w-[6%]">Refer ID</th>
                                <th className="p-4 font-bold text-center w-[14%]">Remarked by</th>
                                <th className="p-4 font-bold text-center w-[30%]">Remark Note</th>
                                <th className="p-4 font-bold text-center w-[14%]">Remarked to</th>
                                <th className="p-4 font-bold text-center w-[12%]">Reported At</th>
                                {/* <th className="p-4 font-bold text-center w-[5%]">Status</th> */}
                                <th className="p-4 font-bold text-center w-[4%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                            {loading && remarks.length === 0 ? (
                                <TableSkeleton rows={16} cols={7} />
                            ) : filteredRemarks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400 font-bold">No remarks found.</td>
                                </tr>
                            ) : (
                                filteredRemarks.map((item) => {
                                    const rowId = item.remarkId || item._id;
                                    return (
                                        <tr 
                                            key={item._id} 
                                            id={`row-${rowId}`}
                                            data-row-id={item._id}
                                            data-remark-id={item.remarkId}
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
                                                String(highlightedRow).toLowerCase() === String(item.remarkId || '').toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item.referenceId || '').toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(item.bookingId || '').toLowerCase()
                                            )) ? 'bg-emerald-100/60 rounded-2xl relative z-10 scale-[1.01]' : ''}`}
                                        >
                                            <td className="p-4 font-semibold text-[#052558] text-sm text-center relative w-[8%]">
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
                                                    <span>{item.remarkId || item._id.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-[#011023] text-center w-[8%]">
                                                {item.referenceId || item.bookingId || '—'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="grid grid-cols-2 gap-2 items-center w-full">
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(item.remarkerRole || 'Technician')}`}>
                                                            {item.remarkerRole || 'Technician'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <span className="text-sm font-semibold text-[#052558] truncate">
                                                            {item.reporterId || '—'}
                                                        </span>
                                                    </div>
                                                    
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[280px] uppercase">
                                                {item.remark}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="grid grid-cols-2 gap-2 items-center w-full">
                                                    <div className="flex justify-center">
                                                        <span className="text-sm font-semibold text-[#052558] truncate">
                                                            {item.customerDetails || item.reporterId || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(item.remarkedRole || item.role || 'Customer')}`}>
                                                            {item.remarkedRole || item.role || 'Customer'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold">
                                                <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-center w-full">
                                                    <span className="text-right">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="px-1.5 text-gray-800 font-normal">|</span>
                                                    <span className="text-left">{new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRemark(item);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {/* {item.status !== 'Resolved' && (
                                                        <button
                                                            onClick={() => {
                                                                const nextStatus = item.status === 'In Progress' ? 'Resolved' : 'In Progress';
                                                                handleUpdateStatus(item._id, nextStatus);
                                                            }}
                                                            disabled={updatingId === item._id}
                                                            className="text-gray-400 hover:text-emerald-500 cursor-pointer disabled:opacity-50"
                                                            title="Toggle Status"
                                                        >
                                                            <Check size={18} className="stroke-[2]" />
                                                        </button>
                                                    )}
                                                    {item.status === 'Resolved' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRemark(item);
                                                                setIsViewModalOpen(true);
                                                            }}
                                                            className="text-gray-400 hover:text-emerald-500 cursor-pointer"
                                                            title="View Remark"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </button>
                                                    )} */}
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
            {isViewModalOpen && selectedRemark && createPortal(
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
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Remark Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">Remark ID: <span className="font-semibold text-gray-700">{selectedRemark.remarkId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-8 w-full text-left">
                                <div className="space-y-2 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remark Info</h4>
                                    <div className="pt-4.5 rounded-xl uppercase space-y-3">
                                        <p className="text-sm flex"><span className="text-gray-500 w-32 shrink-0 font-medium">Remarker ID:</span> <span className="font-semibold text-[#052558] truncate">{selectedRemark.reporterId || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-32 shrink-0 font-medium">Remarked To:</span> <span className="font-semibold text-[#052558] truncate">{selectedRemark.customerDetails || selectedRemark.reporterId || '—'}</span></p>
                                        {/* <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0 font-medium">Reporter:</span> <span className="font-semibold text-gray-800 truncate">{selectedRemark.reporterName || '—'}</span></p> */}
                                    </div>
                                </div>
                                <div className="space-y-2 w-full md:w-[34%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remark Rolw</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center"><span className="text-gray-500 w-35 shrink-0 font-medium">Remarker Role</span> <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedRemark.remarkerRole || 'Technician')}`}>{selectedRemark.remarkerRole || 'Technician'}</span></div>
                                        <div className="text-sm flex items-center"><span className="text-gray-500 w-35 shrink-0 font-medium">Remarked Role</span> <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedRemark.remarkedRole || selectedRemark.role || 'Customer')}`}>{selectedRemark.remarkedRole || selectedRemark.role || 'Customer'}</span></div>
                                        {/* <div className="text-sm flex items-center"><span className="text-gray-500 w-28 shrink-0 font-medium">Status</span> <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(selectedRemark.status)}`}>{selectedRemark.status}</span></div> */}
                                    </div>
                                </div>
                                <div className="space-y-2 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                    <div className="pt-4.5 rounded-xl uppercase space-y-3">
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0 font-medium">Reference ID:</span> <span className="font-semibold text-[#011023] truncate">{selectedRemark.referenceId || selectedRemark.bookingId || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0 uppercase font-medium">Submitted On:</span> <span className="font-semibold text-[#052558] text-sm">{formatSubmittedAt(selectedRemark.createdAt)}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Remark Content */}
                            <div className="space-y-3 text-left"> 
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remark Note</h4>
                                <p className="text-[14px] uppercase font-semibold text-justify leading-relaxed text-gray-800">
                                    {selectedRemark.remark}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Remark;
