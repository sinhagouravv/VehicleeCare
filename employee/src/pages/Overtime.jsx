import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const Overtime = () => {
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [employeeUser, setEmployeeUser] = useState(null);

    const [formData, setFormData] = useState({
        date: '',
        hours: '',
        reason: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            setEmployeeUser(JSON.parse(storedUser));
        }
    }, []);

    const empId = employeeUser?.employeeId || employeeUser?.id || employeeUser?._id;

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

        if (!formData.date || !formData.hours || !formData.reason) {
            setError("Please fill in all fields.");
            return;
        }

        const hoursNum = parseFloat(formData.hours);
        if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 12) {
            setError("Hours must be between 0.5 and 12.");
            return;
        }

        const words = formData.reason.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 5) {
            setError("Reason must be at least 5 words.");
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
                    date: formData.date,
                    hours: hoursNum,
                    reason: formData.reason
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess("Overtime request submitted successfully!");
                fetchOvertimes(true);
                setTimeout(() => {
                    setShowModal(false);
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
                    fetchOvertimes(true);
                } else {
                    alert(data.message || "Failed to delete request.");
                }
            } catch (err) {
                console.error("Delete overtime error", err);
                alert("Network error. Please try again.");
            }
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        // Handle DD-MM-YYYY or YYYY-MM-DD
        if (d.includes('-')) {
            const parts = d.split('-');
            if (parts[0].length === 4) {
                // YYYY-MM-DD to DD-MM-YYYY
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return d.replace(/-/g, '/');
        }
        return d;
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Overtime Requests</h1>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Submit and track overtime hours request approvals</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 px-5 py-3 bg-[#052558] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#527FB0] transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <Plus size={16} /> Request Overtime
                </button>
            </div>

            {/* Overtime Table Log */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-6 border-b border-[#e6f0fa]">
                    <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Overtime Logging Directory</h4>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Official overtime work listings and status</p>
                </div>

                <div className="overflow-x-auto">
                    {loading && overtimes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <Loader2 size={32} className="animate-spin text-[#527FB0]" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Retrieving logs...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f0f6ff] text-[12px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4 font-bold text-center">Request ID</th>
                                    <th className="p-4 font-bold text-center">Overtime Date</th>
                                    <th className="p-4 font-bold text-center">Logged Hours</th>
                                    <th className="p-4 font-bold text-center">Reason</th>
                                    <th className="p-4 font-bold text-center">Date Applied</th>
                                    <th className="p-4 font-bold text-center">Status</th>
                                    <th className="p-4 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[12px] uppercase divide-[#e6f0fa]">
                                {overtimes.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-400 font-medium">No overtime logs registered.</td>
                                    </tr>
                                ) : overtimes.map((ot) => (
                                    <tr key={ot._id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-4 text-center font-bold text-[#052558]">
                                            {`OT-${ot._id.substring(ot._id.length - 5).toUpperCase()}`}
                                        </td>
                                        <td className="p-4 text-center font-semibold text-gray-700">
                                            {formatDate(ot.date)}
                                        </td>
                                        <td className="p-4 text-center font-bold text-[#011023]">{ot.hours} Hours</td>
                                        <td className="p-4 text-center font-semibold text-gray-500 max-w-xs truncate normal-case" title={ot.reason}>
                                            {ot.reason}
                                        </td>
                                        <td className="p-4 text-center font-semibold text-gray-500">
                                            {new Date(ot.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 text-[10px] font-black tracking-widest rounded-full border ${
                                                ot.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                ot.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                                {ot.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {ot.status === 'Pending' ? (
                                                <button
                                                    onClick={() => handleDelete(ot._id)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Log"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 text-xs font-semibold">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Request Modal Portal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/25 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white/95 backdrop-blur-xl border border-blue-50/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-3 border-b border-[#e6f0fa]">
                            <h3 className="text-lg font-black text-[#011023] uppercase tracking-wide">Request Overtime shift</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-[#011023] transition-colors text-sm font-bold cursor-pointer">CLOSE</button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 border border-red-100">
                                <ShieldAlert size={14} /> {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide border border-emerald-100">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-[#011023]">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Overtime Shift Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Hours Requested</label>
                                <input
                                    type="number"
                                    required
                                    step="0.5"
                                    min="0.5"
                                    max="12"
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold"
                                    placeholder="Enter hours (e.g. 3.5)"
                                    value={formData.hours}
                                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Reason description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold normal-case"
                                    placeholder="Explain the workload, tasks to cover, or specific vehicle queue requiring overtime..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 bg-[#052558] hover:bg-[#527FB0] text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> SUBMITTING REQUEST...
                                    </>
                                ) : 'SUBMIT OVERTIME REQUEST'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Overtime;
