import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle2, XCircle, Check, X,  Clock, AlertCircle, Eye, Trash2, Calendar, User, FileText } from 'lucide-react';

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

    const storedUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
    const garageId = storedUser.id || storedUser._id;

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
        } catch (error) {
            console.error("Failed to fetch garage leaves:", error);
        } finally {
            setLoading(false);
        }
    }, [garageId]);

    useEffect(() => {
        fetchGarageLeaves();
        const interval = setInterval(() => fetchGarageLeaves(true), 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [fetchGarageLeaves]);

    const handleStatusUpdate = async (leaveId, newStatus) => {
        setUpdatingId(leaveId);
        try {
            const res = await fetch(`http://localhost:5001/api/leaves/${leaveId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setLeaves(prev => prev.map(l => l._id === leaveId ? { ...l, status: newStatus } : l));
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
        return new Date(dateStr).toLocaleDateString('en-IN', {
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
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Leave Requests</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto text-center h-[860px] relative hide-scrollbar">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold w-[8%]">Leave ID</th>
                                <th className="p-4.5 font-bold w-[9%]">Employee ID</th>
                                <th className="p-4.5 font-bold w-[8%]">Leave</th>
                                {/* <th className="p-4.5 font-bold w-[8.5%]">Leave Type</th> */}
                                <th className="p-4.5 font-bold w-[40%]">Reason</th>
                                <th className="p-4.5 font-bold w-[10%]">Date Applied</th>
                                {/* <th className="p-4.5 font-bold w-[7.5%]">Start</th>
                                <th className="p-4.5 font-bold w-[7.5%]">End</th> */}
                                <th className="p-4.5 font-bold w-[2%]">Status</th>
                                <th className="p-4.5 font-bold w-[2%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase">
                            {loading && leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                                            <p className="text-sm font-medium tracking-widest opacity-60">Fetching leave requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-gray-400 font-bold tracking-widest opacity-60">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : leaves.map((leave) => (
                                <tr key={leave._id} className="hover:bg-blue-50/30 transition-all duration-300">
                                    <td className="p-4 font-semibold text-[#052558] text-sm">
                                        {leave.leaveId || '—'}
                                    </td>
                                    <td className="p-4 font-semibold text-[#011023] text-sm">
                                        {leave.employeeId}
                                    </td>
                                    {/* <td className="p-4">
                                        <span className="font-semibold text-gray-700">{leave.type}</span>
                                    </td> */}
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${leave.leaveTime === 'Half Day' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {leave.leaveTime}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="whitespace-normal">
                                            {leave.reason}
                                        </p>
                                    </td>
                                    <td className="p-4 font-semibold text-sm">
                                        <div className="text-[#011023]">{formatDate(leave.createdAt)}</div>
                                        <div className="text-gray-500 mt-0.5 text-xs">{formatTime(leave.createdAt)}</div>
                                    </td>
                                    {/* <td className="p-4 font-semibold text-center">
                                        {formatDate(leave.startDate)}
                                    </td>
                                    <td className="p-4 font-semibold text-center">
                                        {formatDate(leave.endDate)}
                                    </td> */}
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-widest ${getStatusStyle(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1">
                                            {leave.status === 'Pending' ? (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedLeave(leave); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                                                        disabled={updatingId === leave._id}
                                                        className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                                                        disabled={updatingId === leave._id}
                                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedLeave(leave); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedLeave(leave); setIsDeleteModalOpen(true); }}
                                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                        title="Delete Request"
                                                    >
                                                        <Trash2 size={18} />
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
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011021] truncate">{selectedLeave.employeeName}</span></p>
                                        <p className="text-sm text-gray-500"><span className="text-gray-500 w-24 shrink-0">ID:</span> <span className="font-semibold pl-19 text-gray-700">{selectedLeave.employeeId}</span></p>
                                    </div>
                                </div>

                                {/* Leave Info */}
                                <div className="space-y-1 w-full md:w-[35%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Leave Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
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
                                <div className="bg-white p-4 rounded-xl shadow-sm">
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
                                <div className="bg-white p-4 rounded-xl shadow-sm uppercase">
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
        </div>
    );
};

export default Leave;
