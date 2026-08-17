import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { Plane, Calendar, Clock, Loader2, AlertCircle, Plus, ChevronRight, History, X, Eye, Trash2, User, FileText } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';

const Leave = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [parentLeaveId, setParentLeaveId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    const highlightedRow = useHighlight(leaves);

    const pendingLeave = leaves.find(l => l.status === 'Pending');
    const approvedLeave = leaves.find(l => l.status === 'Approved');

    const [formData, setFormData] = useState({
        type: '',
        leaveTime: '',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '21:00', // 09:00 PM (12 hours after 09:00 AM)
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

    const calculateEndTime = (startTime, leaveType) => {
        if (!startTime) return '21:00';
        const [h, m] = startTime.split(':').map(Number);
        const hoursToAdd = leaveType === 'Half Day' ? 6 : 12;
        const endH = (h + hoursToAdd) % 24;
        return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

    const formatAppliedTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const storedUser = JSON.parse(localStorage.getItem('employeeUser') || '{}');
    const empId = storedUser.employeeId || storedUser.id || storedUser._id;

    const isLeaveEnded = (endDateStr) => {
        if (!endDateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(endDateStr);
        endDate.setHours(0, 0, 0, 0);
        return today > endDate;
    };

    const fetchLeaves = useCallback(async (silent = false) => {
        if (!empId) return;
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`http://localhost:5001/api/leaves/employee/${empId}`);
            const data = await res.json();
            if (data.success) {
                setLeaves(data.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Fetch leaves failed:", err);
        } finally {
            setLoading(false);
        }
    }, [empId]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const words = formData.reason.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length < 10) {
            setError("Reason must be at least 10 words long.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('http://localhost:5001/api/leaves/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    employeeName: storedUser.name,
                    employeePhone: storedUser.phone,
                    employeeEmail: storedUser.email,
                    garageId: storedUser.garageId,
                    parentLeaveId,
                    ...formData
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Leave request submitted successfully!");
                setFormData({
                    type: '',
                    leaveTime: '',
                    startDate: '',
                    startTime: '09:00',
                    endDate: '',
                    endTime: '21:00',
                    reason: ''
                });
                fetchLeaves(true);
                // Close modal after a short delay
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

    // Modal for Applying Leave
    const handleOpenModal = (leaveToExtend = null) => {
        if (leaveToExtend) {
            // Extension mode logic for specific leave
            const lastEnd = new Date(leaveToExtend.endDate);
            const nextStart = new Date(lastEnd);
            nextStart.setDate(nextStart.getDate() + 1);

            const nextStartDateStr = nextStart.toISOString().split('T')[0];

            setFormData({
                ...formData,
                type: leaveToExtend.type,
                leaveTime: leaveToExtend.leaveTime,
                startDate: nextStartDateStr,
                startTime: leaveToExtend.startTime || '09:00',
                endDate: nextStartDateStr,
                endTime: leaveToExtend.endTime || '21:00',
                reason: `Extension of previous leave (${leaveToExtend.leaveId}) ending on ${leaveToExtend.endDate}.`
            });
            setParentLeaveId(leaveToExtend.leaveId);
        } else {
            // New Leave mode
            setFormData({
                type: '',
                leaveTime: '',
                startDate: '',
                startTime: '09:00',
                endDate: '',
                endTime: '21:00',
                reason: ''
            });
            setParentLeaveId(null);
        }
        setShowModal(true);
    };

    const openDeleteModal = (leave) => {
        setSelectedLeave(leave);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedLeave) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/leaves/${selectedLeave._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchLeaves(true);
                setIsDeleteModalOpen(false);
                setSelectedLeave(null);
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setDeleting(false);
        }
    };

    const handleView = (leave) => {
        setSelectedLeave(leave);
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

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Leave Management</h1>

                <div className="relative group">
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={!!pendingLeave}
                        className={`flex items-center gap-2 text-[13px] px-12 py-2 bg-gradient-to-r ${pendingLeave ? 'from-gray-400 to-gray-500 opacity-75' : 'from-[#052558] to-[#527FB0] hover:opacity-90'} text-white font-bold rounded-xl shadow-md transition-all uppercase text-xs`}
                    >
                        <Plus size={18} />
                        Apply Leave
                    </button>

                    {pendingLeave && (
                        <div className="absolute top-full right-0 mt-2 w-76 p-3 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center uppercase tracking-wider border border-white/10 shadow-2xl">
                            Kindly ask the admin to approve or reject the current leave to apply for a new leave
                        </div>
                    )}
                </div>
            </div>

            {/* Past Leave Requests Table */}
            <div className="bg-white flex-1 min-h-0 border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f2f7ff] text-[15px] text-center uppercase tracking-wider text-gray-500 border-b border-[#f0f6fc]">
                                <th className="p-4.5 font-bold text-center w-[7%]">Leave ID</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Leave</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[25%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[8%]"> Start</th>
                                <th className="p-4.5 font-bold text-center w-[8%]"> End</th>
                                {/* <th className="p-4.5 font-bold text-center w-[8%]">Duration</th> */}
                                <th className="p-4.5 font-bold text-center w-[7%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                            {loading && leaves.length === 0 ? (
                                <TableSkeleton rows={15} cols={9} />
                            ) : leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-gray-400 font-bold tracking-widest">
                                        No past leave requests.
                                    </td>
                                </tr>
                            ) : leaves.map((leave) => (
                                <tr 
                                    key={leave._id} 
                                    id={`row-${leave.leaveId}`}
                                    className={`text-center transition-all duration-1000 ${(highlightedRow === leave.leaveId || highlightedRow === leave._id) ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}
                                >
                                    <td className="p-5 font-semibold text-[13px]">
                                        {leave.leaveId || '—'}
                                    </td>
                                    <td className="p-5 font-semibold text-[13px]">
                                        <div className="text-[#052558]">{new Date(leave.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                        <div className="text-gray-500 mt-0.5 text-xs">{new Date(leave.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className="font-semibold text-[13px]">{leave.type}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-lg text-xs border font-semibold uppercase tracking-wide ${leave.leaveTime === 'Half Day' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {leave.leaveTime || 'Full Day'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-[13px] text-center">
                                        <div className="whitespace-normal truncate">
                                            {leave.reason}
                                        </div>
                                    </td>
                                    <td className="p-5 font-semibold text-[13px]">
                                        <div className="text-[#011023]">{new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                        {leave.startTime && <div className="text-gray-500 mt-0.5 text-xs">{formatTimeTo12h(leave.startTime)}</div>}
                                    </td>
                                    <td className="p-5 font-semibold text-[13px]">
                                        <div className="text-[#011023]">{new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                        {leave.endTime && <div className="text-gray-500 mt-0.5 text-xs">{formatTimeTo12h(leave.endTime)}</div>}
                                    </td>
                                    {/* <td className="p-5">
                                        <div className="text-[13px] font-semibold text-[#011023]">{leave.totalDays} DAYS</div>
                                    </td> */}
                                    <td className="p-5">
                                        <span className={`px-4 py-1.5 rounded-full border text-[10.5px] font-semibold uppercase tracking-w ${getStatusStyle(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-4">
                                            {leave.status === 'Approved' && (
                                                <button
                                                    onClick={() => handleOpenModal(leave)}
                                                    disabled={isLeaveEnded(leave.endDate)}
                                                    className={`text-gray-400 rounded-lg transition-colors ${
                                                        isLeaveEnded(leave.endDate) 
                                                            ? 'opacity-30 cursor-not-allowed' 
                                                            : 'hover:text-emerald-500 hover:bg-emerald-50'
                                                    }`}
                                                    title={isLeaveEnded(leave.endDate) ? "The leave has ended you cannot extend the leave now" : "Extend Leave"}
                                                >
                                                    <History size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleView(leave)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {leave.status !== 'Approved' && (
                                                <button 
                                                    onClick={() => openDeleteModal(leave)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Modal for Applying Leave */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Apply for Leave</h2>
                                    {/* <p className="text-xs text-gray-500 font-medium mt-0.5">Complete the details below to submit your request</p> */}
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 uppercase overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Leave Type</label>
                                    <select
                                        className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value=""></option>
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>Planned Leave</option>
                                        <option>Emergency Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Leave Time</label>
                                    <select
                                        className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                        value={formData.leaveTime}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            setFormData({
                                                ...formData,
                                                leaveTime: newType,
                                                endTime: calculateEndTime(formData.startTime, newType)
                                            });
                                        }}
                                        required
                                    >
                                        <option value=""></option>
                                        <option>Full Day</option>
                                        <option>Half Day</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date & Time Grid (Upgraded Metric Layout) */}
                            <div className="grid grid-cols-4 gap-3">
                                {/* Start Date */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full uppercase px-4 font-bold text-[#011023] text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-blue-200/50 shadow-sm"
                                        value={formData.startDate}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            const updates = { ...formData, startDate: newStart };
                                            if (formData.leaveTime === 'Half Day') {
                                                updates.endDate = newStart;
                                            }
                                            setFormData(updates);
                                        }}
                                        required
                                    />
                                </div>

                                {/* Start Time */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">
                                        Start Time
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="time"
                                            className="w-full uppercase pl-4 pr-10 font-bold text-[#011023] text-xs py-2.75 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-blue-200/50 shadow-sm appearance-none"
                                            value={formData.startTime}
                                            onChange={(e) => {
                                                const newStart = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    startTime: newStart,
                                                    endTime: calculateEndTime(newStart, formData.leaveTime)
                                                });
                                            }}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#527FB0] opacity-60">
                                            {parseInt(formData.startTime?.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                        </span>
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full uppercase px-4 font-bold text-[#011023] text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-blue-200/50 shadow-sm"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* End Time */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">
                                        End Time
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="time"
                                            className="w-full uppercase pl-4 pr-10 font-bold text-[#011023] text-xs py-2.75 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-blue-200/50 shadow-sm appearance-none"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#527FB0] opacity-60">
                                            {parseInt(formData.endTime?.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Reason for Leave</label>
                                <textarea
                                    className="w-full uppercase px-4 font-semibold text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none h-24 resize-none"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#011023] to-[#052558] hover:opacity-95 rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 flex items-center gap-2 uppercase"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Modal for Viewing Leave */}
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
                            {/* Quick Stats Bar */}
                            <div className="bg-blue-50/30 py-2 rounded-2xl border border-blue-50 flex mb-5">
                                <div className="w-[25%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Leave</p>
                                    <p className="text-sm font-semibold text-[#011023] uppercase text-left truncate">{selectedLeave.type}</p>
                                </div>
                                <div className="w-[15%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Type</p>
                                    <p className="text-sm font-semibold text-gray-800 uppercase text-left">{selectedLeave.leaveTime}</p>
                                </div>
                                <div className="w-[25%]">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3 text-left">Date & Time</p>
                                    <p className="text-sm font-semibold text-gray-800 uppercase text-left whitespace-nowrap">
                                        {formatDate(selectedLeave.createdAt)} <span className="text-gray-400 mx-1">|</span> {formatAppliedTime(selectedLeave.createdAt)}
                                    </p>
                                </div>
                                <div className="w-[18%] text-center border-x border-blue-100/30 pl-5 text-left">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-3">Duration</p>
                                    <p className="text-sm font-bold text-gray-700 uppercase">
                                        {selectedLeave.totalDays} {selectedLeave.totalDays === 1 ? 'Day' : 'Days'}
                                    </p>
                                </div>
                                <div className="w-[10%] text-left pl-3">
                                    <p className="text-sm font-bold text-gray-400 uppercase mb-2">Status</p>
                                    <div className="flex">
                                        <span className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-widest border ${getStatusStyle(selectedLeave.status)}`}>
                                            {selectedLeave.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Duration & Timing (Legal Documentation style) */}
                            <div className="space-y-2 mb-7 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Leave Date & Timing</h4>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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
                            <div className="space-y-2 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Leave</h4>
                                <div className="bg-white p-4 rounded-xl shadow-sm uppercase border border-gray-100">
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
                                This will permanently remove the leave. <br/>
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
                                onClick={confirmDelete}
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
        </div>
    );
};

export default Leave;
