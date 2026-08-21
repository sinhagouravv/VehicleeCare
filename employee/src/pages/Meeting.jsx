import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Loader2, AlertCircle, Plus, X, Eye, Trash2, User, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';

const Meeting = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filter states
    const [purposeFilter, setPurposeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Meeting Requests',
            groups: [
                {
                    id: 'type',
                    label: 'Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'ID Card', value: 'ID Card' },
                    ]
                },{
                    id: 'purpose',
                    label: 'Purpose',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Lost', value: 'Lost' },
                        { label: 'Damaged', value: 'Damaged' },
                        { label: 'Stolen', value: 'Stolen' },
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
                purpose: 'all',
                type: 'all',
                status: 'all'
            },
            onChange: (newValues) => {
                if (newValues.purpose !== undefined) setPurposeFilter(newValues.purpose);
                if (newValues.type !== undefined) setTypeFilter(newValues.type);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setPurposeFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig]);
    
    const highlightedRow = useHighlight(meetings);

    const pendingMeeting = meetings.find(m => m.status === 'Pending');

    const [formData, setFormData] = useState({
        purpose: '',
        appointmentDate: '',
        appointmentTime: '10:00',
        reason: ''
    });

    const formatTimeTo12h = (time24) => {
        if (!time24) return '—';
        const [h, m] = time24.split(':');
        const hr = parseInt(h);
        const suffix = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr % 12 || 12;
        return `${String(hr12).padStart(2, '0')}:${m} ${suffix}`;
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

    const formatAppliedTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    };

    const storedUser = JSON.parse(localStorage.getItem('employeeUser') || '{}');
    const empId = storedUser.employeeId || storedUser.id || storedUser._id;

    const fetchMeetings = useCallback(async (silent = false) => {
        if (!empId) return;
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`http://localhost:5001/api/employees/id-card-requests/employee/${empId}`);
            const data = await res.json();
            if (data.success) {
                setMeetings(data.data || []);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Fetch meetings failed:", err);
        } finally {
            setLoading(false);
        }
    }, [empId]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.purpose) {
            setError("Please select a valid purpose.");
            return;
        }

        if (!formData.appointmentDate) {
            setError("Please select an appointment date.");
            return;
        }

        if (!formData.reason.trim()) {
            setError("Please provide a reason for the meeting request.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('http://localhost:5001/api/employees/id-card-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    purpose: formData.purpose,
                    reason: formData.reason,
                    appointmentDate: formData.appointmentDate,
                    appointmentTime: formatTimeTo12h(formData.appointmentTime)
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Meeting request submitted successfully!");
                setFormData({
                    purpose: '',
                    appointmentDate: '',
                    appointmentTime: '10:00',
                    reason: ''
                });
                fetchMeetings(true);
                setTimeout(() => {
                    setShowModal(false);
                    setSuccess(null);
                }, 1500);
            } else {
                setError(data.message || "Failed to submit request.");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            purpose: '',
            appointmentDate: '',
            appointmentTime: '10:00',
            reason: ''
        });
        setError(null);
        setSuccess(null);
        setShowModal(true);
    };

    const openDeleteModal = (meeting) => {
        setSelectedMeeting(meeting);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedMeeting) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/employees/id-card-requests/${selectedMeeting._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchMeetings(true);
                setIsDeleteModalOpen(false);
                setSelectedMeeting(null);
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setDeleting(false);
        }
    };

    const handleView = (meeting) => {
        setSelectedMeeting(meeting);
        setIsViewModalOpen(true);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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
                const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
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

    const filteredMeetings = useMemo(() => {
        const filtered = meetings.filter(meeting => {
            if (purposeFilter !== 'all' && (meeting.purpose || '').toLowerCase() !== purposeFilter.toLowerCase()) return false;
            if (typeFilter !== 'all') {
                const mType = meeting.type || 'ID Card';
                if (mType.toLowerCase() !== typeFilter.toLowerCase()) return false;
            }
            if (statusFilter !== 'all' && meeting.status !== statusFilter) return false;
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(meeting);
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
    }, [meetings, purposeFilter, typeFilter, statusFilter, sortOrder, timeRange]);

    useEffect(() => {
        setResultsCount(filteredMeetings.length);
    }, [filteredMeetings.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Meeting Management</h1>

                <div className="relative group">
                    <button
                        onClick={handleOpenModal}
                        disabled={!!pendingMeeting}
                        className={`flex items-center gap-2 text-[13px] px-12 py-2 bg-gradient-to-r ${pendingMeeting ? 'from-gray-400 to-gray-500 opacity-75 cursor-not-allowed' : 'from-[#052558] to-[#527FB0] hover:opacity-90'} text-white font-bold rounded-xl shadow-md transition-all uppercase text-xs`}
                    >
                        <Plus size={18} />
                        Apply Meeting
                    </button>

                    {pendingMeeting && (
                        <div className="absolute top-full right-0 mt-2 w-76 p-3 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center uppercase tracking-wider border border-white/10 shadow-2xl">
                            Kindly ask the manager to approve or reject the current meeting request to apply for a new meeting
                        </div>
                    )}
                </div>
            </div>

            {/* Meeting Requests Table */}
            <div className="bg-white flex-1 min-h-0 border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f2f7ff] text-[15px] text-center uppercase tracking-wider text-gray-500 border-b border-[#f0f6fc]">
                                <th className="p-4.5 font-bold text-center w-[16%]">Appointment Date</th>
                                <th className="p-4.5 font-bold text-center w-[8.5%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Purpose</th>
                                <th className="p-4.5 font-bold text-center w-[37%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[14%]">Date Applied</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7.5%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                            {loading && meetings.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredMeetings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-sm text-gray-500">
                                        {meetings.length === 0 ? 'No past meeting requests.' : 'No meeting requests match the active filter criteria.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredMeetings.map((meeting) => (
                                    <tr 
                                        key={meeting._id} 
                                        id={`row-${meeting._id}`}
                                        className={`text-center transition-all duration-1000 ${highlightedRow === meeting._id ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}
                                    >
                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center whitespace-nowrap">
                                            <span>{formatDate(meeting.appointmentDate)}</span>
                                            {meeting.appointmentTime && (
                                                <>
                                                    <span className="text-[#052558] mx-1.5">|</span>
                                                    <span className="text-[#052558] text-sm font-semibold uppercase">
                                                        {meeting.appointmentTime}
                                                    </span>
                                                </>
                                            )}
                                        </td>
                                        <td className="p-4 font-semibold text-[#011023] text-sm text-center">
                                            ID Card
                                        </td>
                                        <td className="p-4 font-semibold text-[#011023] text-sm text-center">
                                            {meeting.purpose || '—'}
                                        </td>
                                        <td className="p-4 text-center text-[#011023] font-semibold max-w-xs text-sm truncate">
                                            {meeting.reason}
                                        </td>
                                        <td className="p-4 text-center font-semibold text-[#011023] text-sm whitespace-nowrap">
                                            {(() => {
                                                const rawDate = meeting.createdAt || meeting.updatedAt;
                                                if (!rawDate) return <span>—</span>;
                                                const d = new Date(rawDate);
                                                if (isNaN(d.getTime())) return <span>{rawDate}</span>;
                                                return (
                                                    <>
                                                        <span>{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        <span className="text-gray-600 mx-1.5">|</span>
                                                        <span>{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${
                                                meeting.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                meeting.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {meeting.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-4.5">
                                                <button
                                                    onClick={() => handleView(meeting)}
                                                    className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {meeting.status === 'Approved' && (
                                                    <button
                                                        type="button"
                                                        className="text-gray-400 hover:text-emerald-600 cursor-pointer"
                                                        title={meeting.remarks || "Remarks"}
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                )}
                                                {meeting.status !== 'Approved' && (
                                                    <button 
                                                        onClick={() => openDeleteModal(meeting)}
                                                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
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

            {/* Modal for Applying Meeting */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Apply for Meeting</h2>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6 uppercase overflow-y-auto max-h-[70vh] hide-scrollbar">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        {success}
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Request Type</label>
                                        <input
                                            type="text"
                                            value="ID Card Duplicate"
                                            disabled
                                            className="w-full uppercase px-4 font-semibold text-xs py-2.75 bg-gray-100/70 border border-gray-200 rounded-xl text-gray-700 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Purpose</label>
                                        <select
                                            className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                            value={formData.purpose}
                                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Purpose</option>
                                            <option value="Lost">Lost</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Stolen">Stolen</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">
                                            Appointment Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full uppercase px-4 font-bold text-[#011023] text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-blue-200/50 shadow-sm"
                                            value={formData.appointmentDate}
                                            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">
                                            Appointment Time
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="time"
                                                className="w-full uppercase pl-4 pr-10 font-bold text-[#011023] text-xs py-2.75 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-blue-200/50 shadow-sm appearance-none"
                                                value={formData.appointmentTime}
                                                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                                                required
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#527FB0] opacity-60">
                                                {parseInt(formData.appointmentTime?.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Employee ID</label>
                                        <input
                                            type="text"
                                            value={empId || ''}
                                            disabled
                                            className="w-full uppercase px-4 font-semibold text-xs py-2.75 bg-gray-100/70 border border-gray-200 rounded-xl text-gray-700 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Reason for Request</label>
                                    <textarea
                                        className="w-full uppercase px-4 font-semibold text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none h-24 resize-none"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Kindly describe the reason for your meeting request..."
                                        required
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all uppercase cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#011023] to-[#052558] hover:opacity-95 rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 flex items-center gap-2 uppercase cursor-pointer"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal for Viewing Meeting */}
            {isViewModalOpen && selectedMeeting && createPortal(
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
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Meeting Details</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-sm text-gray-500">Employee ID: <span className="font-semibold text-gray-700">{selectedMeeting.employeeId}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            {/* Quick Stats Bar */}
                            <div className="bg-blue-50/30 py-2 rounded-2xl border border-blue-50 flex mb-5">
                                <div className="w-[20%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Type</p>
                                    <p className="text-sm font-semibold text-[#011023] uppercase text-left truncate">ID Card</p>
                                </div>
                                <div className="w-[20%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Purpose</p>
                                    <p className="text-sm font-semibold text-gray-800 uppercase text-left">{selectedMeeting.purpose || '—'}</p>
                                </div>
                                <div className="w-[30%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Applied On</p>
                                    <p className="text-sm font-semibold text-gray-800 uppercase text-left whitespace-nowrap">
                                        {formatDate(selectedMeeting.createdAt)} <span className="text-gray-400 mx-1">|</span> {formatAppliedTime(selectedMeeting.createdAt)}
                                    </p>
                                </div>
                                <div className="w-[18%] text-center border-x border-blue-100/30 pl-5 text-left">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3">Time Slot</p>
                                    <p className="text-sm font-bold text-gray-700 uppercase">
                                        {selectedMeeting.appointmentTime || '—'}
                                    </p>
                                </div>
                                <div className="w-[12%] text-left pl-3">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-2">Status</p>
                                    <div className="flex">
                                        <span className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-widest border ${getStatusStyle(selectedMeeting.status)}`}>
                                            {selectedMeeting.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Scheduled Appointment Timing */}
                            <div className="space-y-2 mb-7 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Appointment Timing</h4>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-semibold text-[#052558] uppercase">
                                        {selectedMeeting.appointmentDate ? `${formatDate(selectedMeeting.appointmentDate)} at ${selectedMeeting.appointmentTime || '10:00 AM'}` : 'Not scheduled yet'}
                                    </p>
                                </div>
                            </div>

                            {/* Reason for Request */}
                            <div className="space-y-2 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Request</h4>
                                <div className="bg-white p-4 rounded-xl shadow-sm uppercase border border-gray-100">
                                    <h5 className="font-semibold text-[#052558] text-[14px] leading-relaxed whitespace-pre-wrap">{selectedMeeting.reason}</h5>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedMeeting.remarks && (
                                <div className="space-y-2 text-left">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remarks / Review Details</h4>
                                    <div className="bg-white p-4 rounded-xl shadow-sm uppercase border border-gray-100">
                                        <h5 className="font-semibold text-gray-700 text-[14px] leading-relaxed whitespace-pre-wrap">{selectedMeeting.remarks}</h5>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedMeeting && createPortal(
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
                                This will permanently remove the meeting request record. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-0 cursor-pointer"
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

export default Meeting;
