import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, ShieldAlert, Loader2, Eye, UserPlus } from 'lucide-react';
import { createPortal } from 'react-dom';

const Makeup = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [employeeUser, setEmployeeUser] = useState(null);

    const [formData, setFormData] = useState({
        missedDate: '',
        makeupDate: '',
        hours: '',
        reason: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            setEmployeeUser(JSON.parse(storedUser));
        }

        // Load historical requests from localStorage for realistic state simulation
        const localRequests = localStorage.getItem('makeupRequests');
        if (localRequests) {
            setRequests(JSON.parse(localRequests));
        } else {
            const initialRequests = [
                {
                    _id: 'MK001',
                    missedDate: '2026-07-02',
                    makeupDate: '2026-07-04',
                    hours: 4,
                    reason: 'Covering up for delayed clock-in due to vehicle maintenance issues.',
                    status: 'Approved',
                    createdAt: '2026-07-03T10:00:00.000Z'
                },
                {
                    _id: 'MK002',
                    missedDate: '2026-07-08',
                    makeupDate: '2026-07-12',
                    hours: 8,
                    reason: 'Compensating shift missed due to emergency medical checkup.',
                    status: 'Pending',
                    createdAt: '2026-07-09T14:30:00.000Z'
                }
            ];
            setRequests(initialRequests);
            localStorage.setItem('makeupRequests', JSON.stringify(initialRequests));
        }
        setLoading(false);
    }, []);

    const handleOpenModal = () => {
        setFormData({
            missedDate: '',
            makeupDate: '',
            hours: '',
            reason: ''
        });
        setError(null);
        setSuccess(null);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.missedDate || !formData.makeupDate || !formData.hours || !formData.reason) {
            setError("Please fill in all fields.");
            return;
        }

        const words = formData.reason.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 5) {
            setError("Reason must be at least 5 words.");
            return;
        }

        setSubmitting(true);

        setTimeout(() => {
            const newRequest = {
                _id: `MK${Math.floor(100 + Math.random() * 900)}`,
                missedDate: formData.missedDate,
                makeupDate: formData.makeupDate,
                hours: parseFloat(formData.hours),
                reason: formData.reason,
                status: 'Pending',
                createdAt: new Date().toISOString()
            };

            const updated = [newRequest, ...requests];
            setRequests(updated);
            localStorage.setItem('makeupRequests', JSON.stringify(updated));

            setSubmitting(false);
            setSuccess("Makeup request submitted successfully!");
            setTimeout(() => {
                setShowModal(false);
            }, 800);
        }, 600);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to cancel this request?")) {
            const updated = requests.filter(r => r._id !== id);
            setRequests(updated);
            localStorage.setItem('makeupRequests', JSON.stringify(updated));
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Makeup Requests</h1>
                <div className="flex items-center gap-4">
                    <button onClick={handleOpenModal} className="flex items-center gap-2 text-[13px] px-12 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity uppercase tracking-tighter text-sm">
                        <Plus size={18} /> Apply Makeup 
                    </button>
                </div>
            </div>

            {/* Request List Card */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f0f6ff] text-[12px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center">Request ID</th>
                                <th className="p-4 font-bold text-center">Missed Shift Date</th>
                                <th className="p-4 font-bold text-center">Target Makeup Date</th>
                                <th className="p-4 font-bold text-center">Makeup Hours</th>
                                <th className="p-4 font-bold text-center">Reason</th>
                                <th className="p-4 font-bold text-center">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[12px] uppercase divide-[#e6f0fa]">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400 font-medium">No makeup time requests logged.</td>
                                </tr>
                            ) : requests.map((req) => (
                                <tr key={req._id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 text-center font-bold text-[#052558]">{req._id}</td>
                                    <td className="p-4 text-center font-semibold text-gray-700">
                                        {new Date(req.missedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4 text-center font-semibold text-gray-700">
                                        {new Date(req.makeupDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4 text-center font-bold text-[#011023]">{req.hours} Hours</td>
                                    <td className="p-4 text-center font-semibold text-gray-500 max-w-xs truncate normal-case" title={req.reason}>
                                        {req.reason}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 text-[10px] font-black tracking-widest rounded-full border ${
                                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            req.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-amber-100 text-amber-700 border-amber-200'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {req.status === 'Pending' ? (
                                            <button
                                                onClick={() => handleDelete(req._id)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Request"
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
                </div>
            </div>

            {/* Portal Modal for Request Submissions */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white/95 backdrop-blur-xl border border-blue-50/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 p-6 space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b border-[#e6f0fa]">
                            <h3 className="text-lg font-black text-[#011023] uppercase tracking-wide">Request Makeup Time</h3>
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
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Missed Shift Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold"
                                    value={formData.missedDate}
                                    onChange={(e) => setFormData({ ...formData, missedDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Target Makeup Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold"
                                    value={formData.makeupDate}
                                    onChange={(e) => setFormData({ ...formData, makeupDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Makeup Hours Needed</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="12"
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold"
                                    placeholder="Enter hours (e.g. 4)"
                                    value={formData.hours}
                                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Reason details</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold normal-case"
                                    placeholder="Enter reasons for missed shift and target coverage plan..."
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
                                ) : 'SUBMIT MAKEUP REQUEST'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Makeup;
