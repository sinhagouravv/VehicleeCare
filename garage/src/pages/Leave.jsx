import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle2, XCircle, Check, X,  Clock, AlertCircle, Eye, Trash2, Calendar, User, FileText, MessageSquare } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Leave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    
    // Modal states
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filter & Sort states
    const [durationFilter, setDurationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_leave_row_labels');

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Leave Requests',
            hasSort: true,
            groups: [
                {
                    id: 'duration',
                    label: 'Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Full Day', value: 'Full Day' },
                        { label: 'Half Day', value: 'Half Day' }
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
                {
                    id: 'type',
                    label: 'Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Casual', value: 'Casual Leave' },
                        { label: 'Sick', value: 'Sick Leave' },
                        { label: 'Planned', value: 'Planned Leave' },
                        { label: 'Emergency', value: 'Emergency Leave' }
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                duration: 'all',
                status: 'all',
                type: 'all',
                label: 'all'
            },
            onChange: (newValues) => {
                if (newValues.duration !== undefined) setDurationFilter(newValues.duration);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.type !== undefined) setTypeFilter(newValues.type);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setDurationFilter('all');
                setStatusFilter('all');
                setTypeFilter('all');
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

    const getItemDate = (item) => {
        if (!item) return null;
        if (item.createdAt) {
            const d = new Date(item.createdAt);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    const filteredLeaves = React.useMemo(() => {
        const filtered = leaves.filter((l) => {
            if (durationFilter && durationFilter !== 'all') {
                const durStr = (l.leaveType || l.leaveTime || '').trim().toLowerCase();
                if (durStr !== durationFilter.trim().toLowerCase()) return false;
            }
            if (statusFilter && statusFilter !== 'all') {
                const statStr = (l.status || '').trim().toLowerCase();
                if (statStr !== statusFilter.trim().toLowerCase()) return false;
            }
            if (typeFilter && typeFilter !== 'all') {
                const typeStr = (l.leaveCategory || l.type || l.category || '').trim().toLowerCase();
                const targetKey = typeFilter.trim().toLowerCase().replace('leave', '').trim();
                if (!typeStr.includes(targetKey)) return false;
            }
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(l);
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
            if (labelFilter !== 'all') {
                const currentLabel = rowLabels[l._id];
                if (!currentLabel || currentLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
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
    }, [leaves, durationFilter, statusFilter, typeFilter, labelFilter, rowLabels, sortOrder, timeRange]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredLeaves.length);
        }
    }, [filteredLeaves.length, setResultsCount]);

    const highlightedRow = useHighlight(filteredLeaves);

    // Action Modal States
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'Approved' or 'Rejected'
    const [actionEmpId, setActionEmpId] = useState('');
    const [actionRemarks, setActionRemarks] = useState('');
    const [actionLeaveId, setActionLeaveId] = useState(null);
    const [managers, setManagers] = useState([]);

    const openActionModal = (leaveId, type) => {
        setActionLeaveId(leaveId);
        setActionType(type);
        setActionEmpId('');
        setActionRemarks('');
        setIsActionModalOpen(true);
    };

    const storedUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
    const garageId = storedUser.garageId || storedUser.garage_id || storedUser.id || storedUser._id;

    const fetchGarageLeaves = useCallback(async (silent = false) => {
        if (!garageId) return;
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`http://localhost:5001/api/leaves/garage/${garageId}`);
            const data = await res.json();
            if (data.success) {
                setLeaves(data.data || []);
                setLastRefreshed(new Date());
            }

            // Also fetch managers of this garage
            const empRes = await fetch(`http://localhost:5001/api/employees/garage/${garageId}`);
            const empData = await empRes.json();
            if (empData.success) {
                const mgrs = (empData.data || []).filter(emp => String(emp.role || '').toLowerCase() === 'manager' && emp.isVerified !== false);
                setManagers(mgrs);
            }
        } catch (error) {
            console.error("Failed to fetch garage leaves/managers:", error);
        } finally {
            setLoading(false);
        }
    }, [garageId]);

    useEffect(() => {
        fetchGarageLeaves();
        const interval = setInterval(() => fetchGarageLeaves(true), 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [fetchGarageLeaves]);

    const handleStatusUpdate = async (e) => {
        if (e) e.preventDefault();
        if(!actionEmpId || !actionRemarks.trim()) {
            alert('Please select a Manager ID and provide Reason for Action');
            return;
        }

        setUpdatingId(actionLeaveId);
        setIsActionModalOpen(false);
        try {
            const res = await fetch(`http://localhost:5001/api/leaves/${actionLeaveId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: actionType, employeeId: actionEmpId, remarks: actionRemarks })
            });
            const data = await res.json();
            if (data.success) {
                setLeaves(prev => prev.map(l => l._id === actionLeaveId ? { ...l, status: actionType } : l));
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating leave status:", error);
            alert("Error updating status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedLeave) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/leaves/${selectedLeave._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setLeaves(prev => prev.filter(l => l._id !== selectedLeave._id));
                setIsDeleteModalOpen(false);
                setSelectedLeave(null);
            } else {
                alert(data.message || "Failed to delete request");
            }
        } catch (error) {
            console.error("Error deleting leave request:", error);
            alert("Error deleting request");
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        if (typeof dateStr !== 'string') dateStr = String(dateStr);

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

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const formatTimeTo12h = (time24) => {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        const hr = parseInt(h);
        const suffix = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr % 12 || 12;
        return `${String(hr12).padStart(2, '0')}:${m} ${suffix}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Leave Requests</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : <div className="h-3.5 w-70 bg-slate-200 rounded-full animate-pulse" />}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[9.5%]">Leave ID</th>
                                <th className="p-4.5 font-bold text-center w-[9.5%]">Employee ID</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Leave Type</th>
                                <th className="p-4.5 font-bold text-center w-[7.5%]">Duration</th>
                                <th className="p-4.5 font-bold text-center w-[36%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Date Applied</th>
                                {/* <th className="p-4.5 font-bold w-[7.5%]">Start</th>
                                <th className="p-4.5 font-bold w-[7.5%]">End</th> */}
                                <th className="p-4.5 font-bold text-center w-[7%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase">
                            {loading && filteredLeaves.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredLeaves.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-gray-400 font-bold tracking-widest opacity-60">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : filteredLeaves.map((leave) => (
                                <tr 
                                    key={leave._id} 
                                    id={`row-${leave.leaveId}`}
                                    onClick={() => {
                                        if (isLabelMode) {
                                            setActiveLabelRowId(prev => prev === leave._id ? null : leave._id);
                                        }
                                    }}
                                    className={`text-center cursor-pointer transition-all duration-1000 ${
                                        activeLabelRowId === leave._id 
                                            ? 'relative z-40 bg-blue-50/50'
                                            : highlightedRow === leave.leaveId 
                                            ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                            : 'hover:bg-blue-50/30'
                                    }`}
                                >
                                    <td className="p-3.25 font-semibold text-[#052558] text-sm text-center relative">
                                        <div className="relative flex items-center justify-center w-full">
                                            {Boolean(rowLabels[leave._id]) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLabelRowId(prev => prev === leave._id ? null : leave._id);
                                                    }}
                                                    className="absolute -left-0.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                    title={`Label: ${stripEmoji(rowLabels[leave._id])}`}
                                                >
                                                    {renderLabelIcon(rowLabels[leave._id], 16)}
                                                </button>
                                            )}

                                            {activeLabelRowId === leave._id && (
                                                <FloatingLabelSelector 
                                                    rowId={leave._id}
                                                    currentLabel={rowLabels[leave._id]}
                                                    onSaveLabel={handleSaveRowLabel}
                                                    labelPopupRef={labelPopupRef}
                                                    topClass= "-top-9"
                                                    positionClass="-left-3"
                                                />
                                            )}

                                            <span>{leave.leaveId || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="p-3.25 font-semibold text-[#011023] text-sm text-center">
                                        {leave.employeeId}
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <span className="font-semibold text-gray-700 text-sm">{leave.type}</span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${leave.leaveTime === 'Half Day' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {leave.leaveTime}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <p 
                                            className="whitespace-normal text-[#052558] text-sm font-semibold text-center line-clamp-2 leading-snug overflow-hidden"
                                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                        >
                                            {leave.reason}
                                        </p>
                                    </td>
                                    <td className="p-3.25 font-semibold text-sm text-center">
                                        <div className="text-[#011023]">{formatDate(leave.createdAt)}</div>
                                        <div className="text-[#011023] mt-0.5 text-xs">{formatTime(leave.createdAt)}</div>
                                    </td>
                                    {/* <td className="p-4 font-semibold text-center">
                                        {formatDate(leave.startDate)}
                                    </td>
                                    <td className="p-4 font-semibold text-center">
                                        {formatDate(leave.endDate)}
                                    </td> */}
                                    <td className="p-3.25 text-center">
                                        <span className={`px-2.5 py-1 text-xs font-semibold border border-transparent uppercase rounded-full whitespace-nowrap ${getStatusStyle(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            {leave.status === 'Pending' ? (
                                                <>
                                                    {/* <button 
                                                        onClick={() => { setSelectedLeave(leave); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-500 "
                                                    >
                                                        <Eye size={18} />
                                                    </button> */}
                                                    <button 
                                                        onClick={() => openActionModal(leave._id, 'Approved')}
                                                        disabled={updatingId === leave._id}
                                                        className="text-gray-400 hover:text-emerald-500 "
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openActionModal(leave._id, 'Rejected')}
                                                        disabled={updatingId === leave._id}
                                                        className="text-gray-400 hover:text-red-500 "
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedLeave(leave); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-500 "
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedLeave(leave); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                </>
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
            {isViewModalOpen && selectedLeave && createPortal(
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
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Leave Details</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{selectedLeave.leaveId}</span></p>
                                </div>
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
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011021] truncate">{selectedLeave.employeeName}</span></p>
                                        <p className="text-sm text-gray-500"><span className="text-gray-500 w-24 shrink-0">ID:</span> <span className="font-semibold pl-19 text-gray-700">{selectedLeave.employeeId}</span></p>
                                    </div>
                                </div>

                                {/* Leave Info */}
                                <div className="space-y-1 w-full md:w-[35%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Leave Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Type:</span> <span className="font-semibold text-[#011023]">{selectedLeave.type}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Date:</span> <span className="font-semibold text-gray-800 uppercase">{formatDate(selectedLeave.createdAt)} | {formatTime(selectedLeave.createdAt)}</span></p>
                                    </div>
                                </div>

                                {/* Status & Duration */}
                                <div className="flex flex-col gap-4 w-full md:w-[30%]">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-center gap-6">
                                                <p className="text-sm font-semibold text-gray-500 w-16 shrink-0 uppercase">Status</p>
                                                <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg uppercase tracking-wider  ${getStatusStyle(selectedLeave.status)}`}>
                                                    {selectedLeave.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <p className="text-sm font-semibold text-gray-500 w-16 shrink-0 uppercase">Duration</p>
                                                <span className="text-sm font-semibold text-gray-700 uppercase">
                                                    {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'Day' : 'Days'} ({selectedLeave.leaveTime})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Duration & Timing (Legal Documentation style) */}
                            <div className="space-y-2 mb-7">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Leave Date & Timing</h4>
                                <div className="pt-2">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm font-semibold text-[#052558] uppercase">
                                                {formatDate(selectedLeave.startDate)} {selectedLeave.startTime && `at ${formatTimeTo12h(selectedLeave.startTime)}`} — {formatDate(selectedLeave.endDate)} {selectedLeave.endTime && `at ${formatTimeTo12h(selectedLeave.endTime)}`}
                                            </p>        
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Leave (Residential Archive style) */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Leave</h4>
                                <div className="pt-2 uppercase">
                                    {/* <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 opacity-70">Employee Justification</p> */}
                                    <h5 className="font-semibold text-[#052558] text-[14px] leading-relaxed whitespace-pre-wrap">{selectedLeave.reason}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedLeave && createPortal(
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
                                This will permanently remove the leave record for <span className="text-[#052558] font-bold uppercase">{selectedLeave.employeeName}</span>. <br/>
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
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-0"
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
                                {actionType === 'Approved' ? 'Approve Leave' : 'Reject Leave'}
                            </h3>
                            <button 
                                onClick={() => setIsActionModalOpen(false)}
                                className="absolute right-7 p-2 text-slate-400 rounded-xl transition-colors hover:bg-slate-200 hover:text-slate-600"
                                disabled={updatingId === actionLeaveId}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleStatusUpdate}>
                            {/* Body */}
                            <div className="p-8 space-y-4">
                                <div className="bg-slate-50/50 border border-slate-100 p-1 rounded-2xl">
                                    <p className="text-sm uppercase font-medium text-justify text-slate-700 leading-relaxed">
                                        Please provide employee verification to <span className="font-bold text-[#011023]">{actionType.toLowerCase()}</span> this leave request. This action will be documented in the internal audit.
                                    </p>
                                </div>

                                <div className="flex gap-2.5 text-left">
                                    <div className="w-[32%]">
                                        <label className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center mb-2">Manager ID</label>
                                        <select 
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2 text-[13px] font-semibold text-[#011023] outline-none transition-all uppercase shadow-sm text-center cursor-pointer appearance-none"
                                            value={actionEmpId}
                                            onChange={e => setActionEmpId(e.target.value)}
                                            disabled={updatingId === actionLeaveId}
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
                                            disabled={updatingId === actionLeaveId}
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
                                    disabled={updatingId === actionLeaveId}
                                >
                                    Cancel Action
                                </button>
                                <button 
                                    type="submit"
                                    disabled={updatingId === actionLeaveId || !actionEmpId.trim() || !actionRemarks.trim()}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:shadow-none ${actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50'}`}
                                >
                                    {updatingId === actionLeaveId ? (
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
        </div>
    );
};

export default Leave;
