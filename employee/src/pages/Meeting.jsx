import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Loader2, AlertCircle, Plus, X, Eye, Trash2, User, FileText, CheckCircle, Check, MessageSquare, Send } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';

const Meeting = () => {
    const { triggerAlert } = useAlert();
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

    // Remark Modal States
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkMeeting, setSelectedRemarkMeeting] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

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

        if (!formData.purpose || !formData.appointmentDate || !formData.reason || !formData.reason.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
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

    const handleOpenRemarkModal = (meeting) => {
        setSelectedRemarkMeeting(meeting);
        setRemarkText(meeting.employeeRemark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRemarkMeeting) return;
        if (!remarkText || !remarkText.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }
        setIsSubmittingRemark(true);
        try {
            let empName = selectedRemarkMeeting.employeeName || 'Employee';
            let empId = selectedRemarkMeeting.employeeId || 'EMPLOYEE';
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

            const refId = selectedRemarkMeeting.meetingId || selectedRemarkMeeting.requestId || String(selectedRemarkMeeting._id);
            const targetId = selectedRemarkMeeting.approvedById || selectedRemarkMeeting.actionById || selectedRemarkMeeting.approvedBy || selectedRemarkMeeting.employeeId || '—';
            const targetRole = selectedRemarkMeeting.status === 'Pending' 
                ? 'Manager' 
                : (selectedRemarkMeeting.approvedByRole || selectedRemarkMeeting.actionByRole || 'Manager');

            // Post new Remark to backend (/api/remarks)
            const remarkRes = await fetch('http://localhost:5001/api/remarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkMeeting._id,
                    reporterId: empId,
                    reporterName: empName,
                    remarkerRole: empRole,
                    remarkedRole: targetRole,
                    role: targetRole,
                    customerDetails: targetId,
                    remark: remarkText,
                    status: selectedRemarkMeeting.status || 'Pending'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            const res = await fetch(`http://localhost:5001/api/employees/id-card-requests/${selectedRemarkMeeting._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remark: remarkText, remarks: remarkText, employeeRemark: remarkText })
            });
            const data = await res.json();
            if (data.success) {
                fetchMeetings(true);
            } else {
                setMeetings(prev => prev.map(m => m._id === selectedRemarkMeeting._id ? { ...m, remark: remarkText, remarks: remarkText, employeeRemark: remarkText, remarkId: createdRemarkId } : m));
            }
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Meeting] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkMeeting(null);
            setRemarkText('');
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
                        className={`px-12 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                            pendingMeeting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        <Plus size={16} />
                        APPLY MEETING
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
                                <th className="p-4.5 font-bold text-center w-[9%]">Meeting ID</th>
                                <th className="p-4.5 font-bold text-center w-[14%]">Appointment Date</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Type</th>
                                {/* <th className="p-4.5 font-bold text-center w-[7%]">Purpose</th> */}
                                <th className="p-4.5 font-bold text-center w-[32%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[13.5%]">Date Applied</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
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
                                        data-row-id={meeting._id}
                                        data-meeting-id={meeting.meetingId}
                                        className={`text-center transition-all duration-1000 ${(highlightedRow && (String(highlightedRow).toLowerCase() === String(meeting._id).toLowerCase() || String(highlightedRow).toLowerCase() === String(meeting.meetingId || '').toLowerCase())) ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}
                                    >
                                        <td className="p-4 font-semibold text-[#011023] text-sm text-center uppercase whitespace-nowrap">
                                            {meeting.meetingId || '—'}
                                        </td>
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
                                        {/* <td className="p-4 font-semibold text-[#011023] text-sm text-center">
                                            {meeting.purpose || '—'}
                                        </td> */}
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
                                                {meeting.status === 'Pending' ? (
                                                    <button 
                                                        onClick={() => openDeleteModal(meeting)}
                                                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenRemarkModal(meeting)}
                                                        className="text-gray-400 hover:text-emerald-600 cursor-pointer"
                                                        title={meeting.remarks || "Remarks"}
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

            {/* Modal for Applying Meeting */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Apply for Meeting
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="space-y-4 uppercase text-left">
                            <div className="space-y-4 overflow-y-auto max-h-[70vh] hide-scrollbar">
                                {error && (
                                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-bold">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-bold">
                                        <CheckCircle size={16} />
                                        {success}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Request Type</label>
                                        <input
                                            type="text"
                                            value="ID Card Duplicate"
                                            disabled
                                            className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-600 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Purpose</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                            value={formData.purpose}
                                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        >
                                            <option value=""></option>
                                            <option value="Lost">Lost</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Stolen">Stolen</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">
                                            Appointment Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]"
                                            value={formData.appointmentDate}
                                            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">
                                            Appointment Time
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="time"
                                                className="w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none"
                                                value={formData.appointmentTime}
                                                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#527FB0] opacity-60">
                                                {parseInt(formData.appointmentTime?.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Reason for Request</label>
                                    <textarea
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] h-24 resize-none"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
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
                                ) : (
                                    'SUBMIT REQUEST'
                                )}
                            </button>
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
                                <div className="flex items-center gap-3 mt-0.5">
                                    <p className="text-sm uppercase text-gray-500">Meeting ID: <span className="text-[#011023] font-semibold">{selectedMeeting.meetingId || '—'}</span></p>
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
                                <div className="w-[18%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Purpose</p>
                                    <p className="text-sm font-semibold text-gray-800 uppercase text-left">{selectedMeeting.purpose || '—'}</p>
                                </div>
                                <div className="w-[30%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Applied On</p>
                                    <p className="text-sm font-semibold text-gray-800 uppercase text-left whitespace-nowrap">
                                        {formatDate(selectedMeeting.createdAt)} <span className="text-gray-400 mx-1">|</span> {formatAppliedTime(selectedMeeting.createdAt)}
                                    </p>
                                </div>
                                <div className="w-[18%] text-center pl-5 text-left">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3">Time Slot</p>
                                    <p className="text-sm font-bold text-gray-700 uppercase">
                                        {selectedMeeting.appointmentTime || '—'}
                                    </p>
                                </div>
                                <div className="w-[15%] text-left pl-3">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-2">Status</p>
                                    <div className="flex">
                                        <span className={`px-2.5 py-1.25 text-[11px] font-semibold rounded-full uppercase tracking-widest border ${getStatusStyle(selectedMeeting.status)}`}>
                                            {selectedMeeting.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Scheduled Appointment Timing */}
                            <div className="space-y-2 mb-7 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Appointment Timing</h4>
                                <div className="pt-2">
                                    <p className="text-sm font-semibold text-[#052558] uppercase">
                                        {selectedMeeting.appointmentDate ? `${formatDate(selectedMeeting.appointmentDate)} at ${selectedMeeting.appointmentTime || '10:00 AM'}` : 'Not scheduled yet'}
                                    </p>
                                </div>
                            </div>

                            {/* Reason for Request */}
                            <div className="space-y-2 mb-7 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Request</h4>
                                <div className="pt-2 uppercase">
                                    <h5 className="font-semibold text-[#052558] text-[14px] leading-relaxed whitespace-pre-wrap">{selectedMeeting.reason}</h5>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedMeeting.remarks && (
                                <div className="space-y-2 text-left">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remarks by Authority</h4>
                                    <div className="pt-2 uppercase">
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
            {/* Remark Modal */}
            {isRemarkModalOpen && selectedRemarkMeeting && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkMeeting(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Meeting Remark
                                </h3>
                                {selectedRemarkMeeting.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkMeeting.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkMeeting(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Meeting Info Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meeting ID</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkMeeting.meetingId || selectedRemarkMeeting._id}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkMeeting.status === 'Pending' ? '—' : (
                                        selectedRemarkMeeting.approvedByRole || 
                                        selectedRemarkMeeting.actionByRole || 
                                        selectedRemarkMeeting.approverRole || 
                                        selectedRemarkMeeting.reviewerRole || 
                                        'Manager'
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkMeeting.status === 'Pending' ? '—' : (
                                        selectedRemarkMeeting.approvedById || 
                                        selectedRemarkMeeting.actionById || 
                                        selectedRemarkMeeting.approvedBy || 
                                        selectedRemarkMeeting.actionBy || 
                                        '—'
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-end justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase mr-4.5 tracking-wider mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border ${getStatusStyle(selectedRemarkMeeting.status)}`}>
                                    {selectedRemarkMeeting.status}
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkMeeting.employeeRemark);
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
                                        className={`w-full py-2 border rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm mt-4 flex items-center justify-center gap-2 ${
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
