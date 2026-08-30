import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Plus, Trash2, ShieldAlert, Loader2, Eye, X, Check, MessageSquare, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';

const Overtime = () => {
    const { triggerAlert } = useAlert();
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [employeeUser, setEmployeeUser] = useState(null);
    const [selectedOvertime, setSelectedOvertime] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Remark Modal States
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkOvertime, setSelectedRemarkOvertime] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [hoursFilter, setHoursFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Overtime Requests',
            groups: [
                {
                    id: 'hours',
                    label: 'Hours',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: '2 Hours', value: '2' },
                        { label: '4 Hours', value: '4' },
                        { label: '6 Hours', value: '6' },
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
                        { label: 'Rejected', value: 'Rejected' },
                    ]
                }
            ],
            initialValues: {
                status: 'all',
                hours: 'all'
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.hours !== undefined) setHoursFilter(newValues.hours);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setStatusFilter('all');
                setHoursFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig]);

    const [formData, setFormData] = useState({
        date: '',
        hours: '',
        reason: ''
    });

    const [selectedDate, setSelectedDate] = useState(null);
    const [requestedHours, setRequestedHours] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [fullEmployeeProfile, setFullEmployeeProfile] = useState(null);
    const pendingOvertime = overtimes.find(o => o.status === 'Pending');
    const highlightedRow = useHighlight(overtimes);

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            setEmployeeUser(JSON.parse(storedUser));
        }
    }, []);

    const empId = employeeUser?.employeeId || employeeUser?.id || employeeUser?._id;

    const getFormattedDateString = (dayOffset = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchExtraData = async () => {
            if (!empId) return;
            try {
                const attRes = await fetch(`http://localhost:5001/api/attendance/employee/${empId}`);
                if (attRes.ok) {
                    const data = await attRes.json();
                    if (data.success) setAttendanceRecords(data.data || []);
                }
                const profRes = await fetch(`http://localhost:5001/api/employees/${empId}`);
                if (profRes.ok) {
                    const data = await profRes.json();
                    if (data.success) setFullEmployeeProfile(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch extra overtime data", err);
            }
        };
        fetchExtraData();
    }, [empId]);

    const fetchOvertimes = useCallback(async (silent = false) => {
        if (!empId) return;
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`http://localhost:5001/api/overtime/employee/${empId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setOvertimes(data.data || []);
                }
            }
        } catch (err) {
            console.error("Failed to fetch overtime requests", err);
        } finally {
            setLoading(false);
        }
    }, [empId]);

    useEffect(() => {
        if (empId) {
            fetchOvertimes();
            const interval = setInterval(() => fetchOvertimes(true), 5000);
            return () => clearInterval(interval);
        }
    }, [empId, fetchOvertimes]);

    const handleOpenModal = () => {
        setSelectedDate(null);
        setRequestedHours(null);
        setFormData({
            date: '',
            hours: '',
            reason: ''
        });
        setError(null);
        setSuccess(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedDate || !requestedHours || !formData.reason || !formData.reason.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }

        const targetDate = selectedDate === 'Today' ? getFormattedDateString(0) : getFormattedDateString(1);

        const words = formData.reason.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 5) {
            triggerAlert('Reason must be at least 5 words.', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('http://localhost:5001/api/overtime/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    employeeName: employeeUser.name,
                    employeePhone: employeeUser.phone || '',
                    employeeEmail: employeeUser.email || '',
                    garageId: employeeUser.garageId || 'G001', // default garage mapping if none exists
                    date: targetDate,
                    hours: requestedHours,
                    reason: formData.reason
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess("Overtime request submitted successfully!");
                fetchOvertimes(true);
                setTimeout(() => {
                    setShowModal(false);
                    setSelectedDate(null);
                    setRequestedHours(null);
                }, 800);
            } else {
                setError(data.message || "Failed to submit request.");
            }
        } catch (err) {
            console.error("Submit overtime error", err);
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this overtime request?")) {
            try {
                const res = await fetch(`http://localhost:5001/api/overtime/${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    triggerAlert("Overtime request deleted successfully", "success");
                    fetchOvertimes(true);
                } else {
                    triggerAlert(data.message || "Failed to delete request.", "error");
                }
            } catch (err) {
                console.error("Delete overtime error", err);
                triggerAlert("Network error. Please try again.", "error");
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleOpenRemarkModal = (ot) => {
        setSelectedRemarkOvertime(ot);
        setRemarkText(ot.employeeRemark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRemarkOvertime) return;
        if (!remarkText || !remarkText.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }
        setIsSubmittingRemark(true);
        try {
            let empName = selectedRemarkOvertime.employeeName || 'Employee';
            let empId = selectedRemarkOvertime.employeeId || 'EMPLOYEE';
            let empRole = 'Technician';
            const storedUser = localStorage.getItem('employeeUser');
            if (storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    empName = u.name || u.employeeName || empName;
                    empId = u.employeeId || u.userId || u._id || empId;
                    empRole = u.role || empRole;
                } catch (_) {}
            }

            const refId = selectedRemarkOvertime.overtimeId || String(selectedRemarkOvertime._id);
            const targetId = selectedRemarkOvertime.approvedById || selectedRemarkOvertime.actionById || selectedRemarkOvertime.approvedBy || selectedRemarkOvertime.employeeId || '—';
            const targetRole = selectedRemarkOvertime.status === 'Pending' 
                ? 'Manager' 
                : (selectedRemarkOvertime.approvedByRole || selectedRemarkOvertime.actionByRole || 'Manager');

            // Post new Remark to backend (/api/remarks)
            const remarkRes = await fetch('http://localhost:5001/api/remarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkOvertime._id,
                    reporterId: empId,
                    reporterName: empName,
                    remarkerRole: empRole,
                    remarkedRole: targetRole,
                    role: targetRole,
                    customerDetails: targetId,
                    remark: remarkText,
                    status: selectedRemarkOvertime.status || 'Pending'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            const res = await fetch(`http://localhost:5001/api/overtime/${selectedRemarkOvertime._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeRemark: remarkText })
            });
            const data = await res.json();
            if (data.success) {
                fetchOvertimes(true);
            } else {
                setOvertimes(prev => prev.map(o => o._id === selectedRemarkOvertime._id ? { ...o, employeeRemark: remarkText, remarkId: createdRemarkId } : o));
            }
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Overtime] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkOvertime(null);
            setRemarkText('');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        let dateObj;
        if (typeof d === 'string' && d.includes('-') && !d.includes('T')) {
            const parts = d.split('-');
            if (parts[0].length === 4) {
                dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else {
            dateObj = new Date(d);
        }
        if (isNaN(dateObj.getTime())) return d;
        const day = String(dateObj.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const formatDateToJul = (d) => {
        if (!d) return '—';
        let dateObj;
        if (typeof d === 'string' && d.includes('-') && !d.includes('T')) {
            const parts = d.split('-');
            if (parts[0].length === 4) {
                dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else {
            dateObj = new Date(d);
        }
        if (isNaN(dateObj.getTime())) return d;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const getOvertimeSlot = (hours) => {
        const startHour = 18; // 6 PM
        const endHour = startHour + parseFloat(hours || 0);
        
        const formatHour = (h) => {
            const period = h >= 12 && h < 24 ? 'PM' : 'AM';
            let displayHour = Math.floor(h % 12);
            if (displayHour === 0) displayHour = 12;
            const minutes = (h % 1) === 0.5 ? '30' : '00';
            return `${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
        };
        
        return `${formatHour(startHour)} - ${formatHour(endHour)}`;
    };

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
            item.bookingDate,
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

    const filteredOvertimes = useMemo(() => {
        const filtered = overtimes.filter(ot => {
            if (statusFilter !== 'all' && ot.status !== statusFilter) return false;
            if (hoursFilter !== 'all' && String(ot.hours) !== String(hoursFilter)) return false;
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(ot);
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
    }, [overtimes, statusFilter, hoursFilter, sortOrder, timeRange]);

    useEffect(() => {
        setResultsCount(filteredOvertimes.length);
    }, [filteredOvertimes.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Overtime Requests</h1>
                <div className="relative group">
                    <button
                        onClick={handleOpenModal}
                        disabled={!!pendingOvertime}
                        className={`px-10 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                            pendingOvertime ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        <Plus size={16} /> APPLY OVERTIME
                    </button>

                    {pendingOvertime && (
                        <div className="absolute top-full right-0 mt-2 w-76 p-3 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center uppercase tracking-wider border border-white/10 shadow-2xl">
                            Kindly ask the manager to approve or reject the current overtime to apply for a new overtime
                        </div>
                    )}
                </div>
            </div>

            {/* Overtime Table Log */}
            <div className="bg-white flex-1 min-h-0 border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f2f7ff] text-[15px] text-center uppercase tracking-wider text-gray-500 border-b border-[#f0f6fc]">
                                <th className="p-4.5 font-bold text-center w-[9.5%]">Overtime ID</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Duration</th>
                                <th className="p-4.5 font-bold text-center w-[35%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[13%]">Date Applied</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                            {loading && overtimes.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredOvertimes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-sm text-gray-500">
                                        {overtimes.length === 0 ? 'No overtime logs registered.' : 'No overtime requests match the active filter criteria.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredOvertimes.map((ot) => (
                                    <tr 
                                        key={ot._id} 
                                        id={`row-${ot.overtimeId || ot._id}`}
                                        className={`text-center transition-all duration-1000 ${(highlightedRow === ot.overtimeId || highlightedRow === ot._id) ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}
                                    >
                                        <td className="p-4 font-semibold text-[#011023] text-sm text-center uppercase whitespace-nowrap">
                                            {ot.overtimeId || '—'}
                                        </td>
                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center whitespace-nowrap">
                                            {formatDateToJul(ot.date)}
                                        </td>
                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center uppercase whitespace-nowrap">
                                            {getOvertimeSlot(ot.hours)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <p 
                                                className="whitespace-normal text-center text-[#011023] font-semibold text-sm line-clamp-2 leading-snug overflow-hidden"
                                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                            >
                                                {ot.reason}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center font-semibold text-[#011023] text-sm whitespace-nowrap">
                                            <span>{new Date(ot.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            <span className="text-gray-600 mx-1.5">|</span>
                                            <span>{new Date(ot.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${
                                                ot.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                ot.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {ot.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-4.5">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOvertime(ot);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {ot.status === 'Pending' ? (
                                                    <button 
                                                        onClick={() => handleDelete(ot._id)}
                                                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenRemarkModal(ot)}
                                                        className="text-gray-400 hover:text-emerald-600 cursor-pointer"
                                                        title="Remarks"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setShowModal(false); setSelectedDate(null); setRequestedHours(null); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">Apply Overtime</h3>
                            <button
                                onClick={() => { setShowModal(false); setSelectedDate(null); setRequestedHours(null); }}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 border border-red-100">
                                <ShieldAlert size={14} /> {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide border border-emerald-100">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4.5 text-left">
                            {/* Date Selection */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Select Date</label>
                                <div className="flex gap-3">
                                    {['Today', 'Tomorrow'].map((dateOpt) => {
                                        const isAbsentToday = attendanceRecords.some((r) => 
                                            r.date === getFormattedDateString(0) && r.status === 'Absent'
                                        );
                                        const isTodayDisabled = (dateOpt === 'Today' && fullEmployeeProfile?.shift?.toLowerCase() === 'evening') || 
                                            (dateOpt === 'Today' && fullEmployeeProfile?.shift?.toLowerCase() === 'morning' && overtimes.some((req) => 
                                                req.date === getFormattedDateString(0) && req.status === 'Approved'
                                            )) ||
                                            (dateOpt === 'Today' && isAbsentToday);
                                        const isTomorrowDisabled = dateOpt === 'Tomorrow' && overtimes.some((req) => 
                                            req.date === getFormattedDateString(1) && req.status === 'Approved'
                                        );
                                        
                                        const isDisabled = dateOpt === 'Today' ? isTodayDisabled : isTomorrowDisabled;
                                        
                                        return (
                                            <button
                                                type="button"
                                                key={dateOpt}
                                                onClick={() => {
                                                    if (isDisabled) {
                                                        if (isAbsentToday && dateOpt === 'Today') {
                                                            triggerAlert('You are absent today, so you cannot apply for overtime today.', 'error');
                                                        } else if (fullEmployeeProfile?.shift?.toLowerCase() === 'evening') {
                                                            triggerAlert('Today is not available for Evening shift employees as their shift completes at 9 PM.', 'error');
                                                        } else {
                                                            triggerAlert('You already have an approved overtime request for this date.', 'error');
                                                        }
                                                        return;
                                                    }
                                                    setSelectedDate(dateOpt);
                                                }}
                                                className={`flex-1 py-2 text-xs font-semibold border rounded-xl transition-all ${
                                                    selectedDate === dateOpt
                                                        ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]'
                                                        : 'bg-[#f8fafc] border-[#cbd5e1] text-[#011023] hover:bg-slate-100'
                                                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                {dateOpt.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Hours Selection */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Select Duration</label>
                                <div className="flex gap-3">
                                    {[2, 4, 6].map((hr) => (
                                        <button
                                            type="button"
                                            key={hr}
                                            onClick={() => setRequestedHours(hr)}
                                            className={`flex-1 py-2 text-xs font-semibold border rounded-xl transition-all cursor-pointer ${
                                                requestedHours === hr
                                                    ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]'
                                                    : 'bg-[#f8fafc] border-[#cbd5e1] text-[#011023] hover:bg-slate-100'
                                            }`}
                                        >
                                            {hr} HRS
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reason Input */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Kindly provide a valid reason for Overtime</label>
                                <textarea
                                    rows="5"
                                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] resize-none"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> SUBMITTING...
                                    </>
                                ) : 'SUBMIT REQUEST'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {isViewModalOpen && selectedOvertime && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Overtime Details</h3>
                                <p className="text-sm font-semibold text-gray-500 mt-1 uppercase">ID: <span className="text-[#011023] font-semibold">{selectedOvertime.overtimeId || '—'}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Overtime Info */}
                                <div className="space-y-4 w-full md:w-[45%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Overtime Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Date:</span> <span className="font-semibold text-[#011023]">{formatDateToJul(selectedOvertime.date)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Hours:</span> <span className="font-semibold text-gray-800">{selectedOvertime.hours} Hours</span></p>
                                    </div>
                                </div>

                                {/* Status Details */}
                                <div className="space-y-4 w-full md:w-[55%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Status Details</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <div className="flex items-center gap-6">
                                            <p className="text-sm font-semibold text-gray-500 w-28 shrink-0 uppercase">Status</p>
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border border-transparent uppercase ${
                                                selectedOvertime.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                selectedOvertime.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {selectedOvertime.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-sm font-semibold text-gray-500 w-28 shrink-0 uppercase">Date Applied</p>
                                            <span className="text-sm font-semibold text-gray-750 uppercase">
                                                {selectedOvertime.createdAt ? `${formatDate(selectedOvertime.createdAt)} | ${new Date(selectedOvertime.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Overtime */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Overtime</h4>
                                <div className="pt-2 uppercase">
                                    <h5 className="font-semibold text-[#052558] text-[13px] leading-relaxed whitespace-pre-wrap">{selectedOvertime.reason}</h5>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedOvertime.remarks && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remarks by Authority</h4>
                                    <div className="pt-2 uppercase">
                                        <h5 className="font-semibold text-[#052558] text-[13px] leading-relaxed whitespace-pre-wrap">
                                            {selectedOvertime.remarks}
                                        </h5>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Remark Modal */}
            {isRemarkModalOpen && selectedRemarkOvertime && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkOvertime(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Overtime Remark
                                </h3>
                                {selectedRemarkOvertime.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkOvertime.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkOvertime(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Overtime Info Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Overtime ID</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkOvertime.overtimeId || selectedRemarkOvertime._id}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkOvertime.status === 'Pending' ? '—' : (
                                        selectedRemarkOvertime.approvedByRole || 
                                        selectedRemarkOvertime.actionByRole || 
                                        selectedRemarkOvertime.approverRole || 
                                        selectedRemarkOvertime.reviewerRole || 
                                        'Manager'
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkOvertime.status === 'Pending' ? '—' : (
                                        selectedRemarkOvertime.approvedById || 
                                        selectedRemarkOvertime.actionById || 
                                        selectedRemarkOvertime.approvedBy || 
                                        selectedRemarkOvertime.actionBy || 
                                        '—'
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-end justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase mr-4.5 tracking-wider mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border ${getStatusStyle(selectedRemarkOvertime.status)}`}>
                                    {selectedRemarkOvertime.status}
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkOvertime.employeeRemark);
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

export default Overtime;
