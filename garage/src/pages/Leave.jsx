import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const Leave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

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
                // Update local state
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
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
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Leave Requests</h1>
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
                                <th className="p-4.5 font-bold w-[10%]">Employee ID</th>
                                <th className="p-4.5 font-bold w-[12%] text-left pl-8">Name</th>
                                <th className="p-4.5 font-bold w-[10%]">Leave</th>
                                <th className="p-4.5 font-bold w-[10%]">Leave Type</th>
                                <th className="p-4.5 font-bold w-[20%] text-left pl-8">Reason</th>
                                <th className="p-4.5 font-bold w-[10%]">Start</th>
                                <th className="p-4.5 font-bold w-[10%]">End</th>
                                <th className="p-4.5 font-bold w-[8%]">Status</th>
                                <th className="p-4.5 font-bold w-[10%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase">
                            {loading ? (
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
                                    <td className="p-4 font-semibold text-[#011023] text-sm tracking-widest">
                                        {leave.employeeId}
                                    </td>
                                    <td className="p-4 text-left pl-8 font-bold text-[#052558]">
                                        {leave.employeeName}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-semibold text-gray-700">{leave.type}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${leave.leaveTime === 'Half Day' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {leave.leaveTime}
                                        </span>
                                    </td>
                                    <td className="p-4 text-left pl-8 max-w-[200px]">
                                        <p className="normal-case text-gray-500 font-medium truncate" title={leave.reason}>
                                            {leave.reason}
                                        </p>
                                    </td>
                                    <td className="p-4 font-semibold">
                                        {formatDate(leave.startDate)}
                                    </td>
                                    <td className="p-4 font-semibold">
                                        {formatDate(leave.endDate)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${getStatusStyle(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {leave.status === 'Pending' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                                                    disabled={updatingId === leave._id}
                                                    className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                                                    title="Approve"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                                                    disabled={updatingId === leave._id}
                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-300 tracking-widest">COMPLETED</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leave;
