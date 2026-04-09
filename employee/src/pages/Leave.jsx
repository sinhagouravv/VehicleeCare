import React, { useState, useEffect, useCallback } from 'react';
import { Plane, Calendar, Clock, Loader2, AlertCircle, Plus, ChevronRight, History, X } from 'lucide-react';

const Leave = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const [formData, setFormData] = useState({
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const storedUser = JSON.parse(localStorage.getItem('employeeUser') || '{}');
    const empId = storedUser.id || storedUser._id;

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
                    ...formData
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Leave request submitted successfully!");
                setFormData({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-[#011023] uppercase tracking-tight">Leave Management</h1>
                
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity uppercase tracking-tighter text-sm">
                    <Plus size={18}/>
                    Apply Leave 
                </button>
            </div>

            {/* Past Leave Requests Table */}
            <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[845px] relative hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[15%]">Date Applied</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[20%]">Duration</th>
                                <th className="p-4.5 font-bold text-center w-[30%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                            {loading && leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
                                    </td>
                                </tr>
                            ) : leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-gray-400 font-bold tracking-widest">
                                        No past leave requests.
                                    </td>
                                </tr>
                            ) : leaves.map((leave) => (
                                <tr key={leave._id} className="text-center hover:bg-blue-50/30 transition-all">
                                    <td className="p-5 font-semibold text-[#052558] text-sm">
                                        {new Date(leave.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-5">
                                        <span className="font-bold text-[#011023] text-[13px]">{leave.type}</span>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-[13px] font-bold text-[#011023]">
                                            {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-black mt-0.5">{leave.totalDays} DAYS</div>
                                    </td>
                                    <td className="p-5 text-gray-600 text-[12px] lowercase tracking-wide normal-case text-center">
                                        <div className="max-w-[300px] mx-auto truncate prose prose-sm" title={leave.reason}>
                                            {leave.reason}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Applying Leave */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm transition-all animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0" 
                        onClick={() => setShowModal(false)}
                    />
                    <div className="bg-white/95 backdrop-blur-xl border border-white rounded-3xl shadow-[0_20px_60px_rgba(5,37,88,0.15)] p-8 w-full max-w-2xl relative z-60 animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-[#011023] uppercase tracking-tight">Apply for Leave</h2>
                            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest opacity-60">Complete the details below to submit your request.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Leave Type</label>
                                    <select
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-[#011023]"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>Planned Leave</option>
                                        <option>Emergency Leave</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-[#011023]"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-[#011023]"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Reason for Leave</label>
                                <textarea
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-[#011023] h-36 resize-none"
                                    placeholder="Briefly explain your reason..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                    <ChevronRight size={16} />
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 bg-gradient-to-r from-[#011023] to-[#052558] text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:opacity-95 transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                            >
                                {submitting ? <Loader2 size={20} className="animate-spin" /> : (
                                    <>
                                        <span>Submit Request</span>
                                        <ChevronRight size={18} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leave;
