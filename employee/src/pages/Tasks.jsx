import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Eye, 
    Check, 
    Loader2, 
    AlertCircle, 
    User, 
    Phone, 
    MapPin, 
    Car, Calendar,
    Clock } from 'lucide-react';

import useHighlight from '../hooks/useHighlight';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const highlightedRow = useHighlight(tasks);

    // Multi-step workflow state
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [duration, setDuration] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTasks = async (silent = false) => {
        try {
            const storedUser = localStorage.getItem('employeeUser');
            if (!storedUser) {
                setError("Please login again.");
                if (!lastRefreshed) setLastRefreshed(new Date());
                return;
            }
            const user = JSON.parse(storedUser);
            // Prioritize MongoDB _id if available, fallback to 9-digit id
            const empId = user._id || user.id;

            if (!empId) {
                setError("Employee identification error. Please re-login.");
                if (!lastRefreshed) setLastRefreshed(new Date());
                return;
            }

            if (!silent) setLoading(true);
            const res = await fetch(`http://localhost:5001/api/bookings/employee/${empId}`);
            if (!res.ok) throw new Error("Server communication error.");
            
            const data = await res.json();
            if (data.success) {
                setTasks(data.data);
                setLastRefreshed(new Date());
                setError(null);
            } else {
                setError(data.message || "Failed to fetch tasks.");
                if (!lastRefreshed) setLastRefreshed(new Date());
            }
        } catch (err) {
            setError(err.message || "Connection failed.");
            if (!lastRefreshed) setLastRefreshed(new Date());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        const timer = setInterval(() => fetchTasks(true), 5000); // Silent refresh every 5s
        return () => clearInterval(timer);
    }, []);

    
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
            }
        } catch (err) {
            console.error("Update failed:", err);
        }
    };
    const handleSendOTP = async (taskId) => {
        if (!taskId) return;
        const currentTask = tasks.find(t => t._id === taskId);
        if (!currentTask) return;

        setIsSubmitting(true);
        setSelectedTaskId(taskId); 

        // For "In Progress" -> "In Service":
        // 1. If we are NOT in the duration modal yet, open it.
        // 2. If we ARE in the duration modal (Next was clicked), open the OTP modal.
        if (currentTask.status === 'In Progress' && !showDurationModal) {
            setShowDurationModal(true);
            setIsSubmitting(false); // Don't block yet, user needs to enter duration
            return;
        }

        // For delivery flow OR when Duration is already completed: open OTP modal immediately
        setShowDurationModal(false);
        setShowOTPModal(true);

        try {
            const endpoint = currentTask.status === 'Completed' ? 'send-delivery-otp' : 'send-otp';
            const res = await fetch(`http://localhost:5001/api/bookings/${taskId}/${endpoint}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || "Failed to send OTP");
                setShowOTPModal(false);
                setSelectedTaskId(null);
            }
        } catch (err) {
            console.error("OTP send failed:", err);
            alert("Connection error. Please try again.");
            setShowOTPModal(false);
            setSelectedTaskId(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpInput || otpInput.length !== 6 || !selectedTaskId) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }
        setIsSubmitting(true);
        try {
            const currentTask = tasks.find(t => t._id === selectedTaskId);
            const currentStatus = currentTask?.status;
            const endpoint = currentStatus === 'Completed' ? 'verify-delivery-otp' : 'verify-otp';
            const body = currentStatus === 'Completed' ? { otp: otpInput } : { otp: otpInput, duration };

            const res = await fetch(`http://localhost:5001/api/bookings/${selectedTaskId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                const nextStatus = currentStatus === 'Completed' ? 'Delivered' : 'In Service';
                setTasks(prev => prev.map(t => t._id === selectedTaskId ? { ...t, status: nextStatus, serviceDuration: duration || t.serviceDuration } : t));
                setShowOTPModal(false);
                setShowDurationModal(false);
                setDuration('');
                setOtpInput('');
                setSelectedTaskId(null);
            } else {
                alert(data.message || "Invalid OTP");
            }
        } catch (err) {
            console.error("OTP verification failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = (task.bookingId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                (task.service?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                (task.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [tasks, searchTerm, filterStatus]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto pb-12">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] uppercase tracking-tight">My Tasks</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[30%]">Service Details</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Time Slot</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4.5 font-black text-center w-[7%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                            {loading && tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="text-gray-400 font-bold tracking-widest">Loading Assignments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-sm text-gray-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : filteredTasks.map((task) => {
                                const rowId = task.bookingId || task._id;
                                return (
                                    <tr 
                                        key={task._id} 
                                        id={`row-${rowId}`}
                                        className={`text-center transition-all duration-1000 ${
                                            highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                    <td className="p-4 font-semibold text-[#052558] text-sm text-center">
                                        {task.bookingId}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-[#011023] text-[13px] uppercase leading-snug">
                                                {task.user.name}
                                            </div>
                                            <div className="text-[11px] text-slate-500 uppercase tracking-tight">
                                                {task.user.userId}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-[#011023] text-[13px] uppercase truncate max-w-[150px] mx-auto">
                                            {task.user.phone}
                                        </div>
                                        <div className="text-[11.5px] text-slate-500 lowercase tracking-wide">
                                            {task.user.email}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-[#011023] text-[13px] uppercase leading-snug">
                                            {task.service.title}
                                        </div>
                                        <div className="text-[11.5px] text-slate-500 uppercase tracking-wide">
                                            {task.vehicle.year} {task.vehicle.make} {task.vehicle.model}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-[14px] font-bold uppercase tracking-tighter">
                                            {task.schedule.date}
                                        </div>
                                        <div className="font-normal text-slate-500 text-[13px] uppercase">
                                            {task.schedule.time}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Details">
                                                <Eye size={17} />
                                            </button>
                                             {task.status !== 'Delivered' && (
                                                <button
                                                    onClick={() => {
                                                        if (task.status === 'In Progress') {
                                                            handleSendOTP(task._id);
                                                        } else if (task.status === 'In Service') {
                                                            handleUpdateStatus(task._id, 'Completed');
                                                        } else if (task.status === 'Completed') {
                                                            handleSendOTP(task._id);
                                                        } else {
                                                            handleUpdateStatus(task._id, 'In Progress');
                                                        }
                                                    }}
                                                    disabled={isSubmitting && selectedTaskId === task._id}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        task.status === 'Delivered' ? 'text-emerald-500 bg-emerald-50' : 
                                                        task.status === 'Completed' ? 'text-blue-600 bg-blue-50' : 
                                                        task.status === 'In Service' ? 'text-emerald-500 bg-emerald-50' : 
                                                        task.status === 'In Progress' ? 'text-purple-600 bg-purple-50' : 
                                                        'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
                                                    } ${isSubmitting && selectedTaskId === task._id ? 'opacity-50' : ''}`}
                                                    title={
                                                        task.status === 'Completed' ? "Mark as Delivered (Verify OTP)" : 
                                                        task.status === 'In Service' ? "Mark as Completed" : 
                                                        task.status === 'In Progress' ? "Start Service (Verify OTP)" : 
                                                        "Mark as In Progress"
                                                    }
                                                >
                                                    {isSubmitting && selectedTaskId === task._id ? (
                                                        <Loader2 size={17} className="animate-spin" />
                                                    ) : (
                                                        <Check size={17} strokeWidth={2.5} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Duration Modal */}
            {showDurationModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-tight mb-2">Service Duration</h3>
                            <p className="text-sm text-gray-500 mb-6">Enter the estimated time required for this service.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Estimated Duration</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. 45 Mins, 2 Hours"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => setShowDurationModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleSendOTP(selectedTaskId)}
                                        disabled={isSubmitting || !duration}
                                        className="flex-1 px-4 py-3 rounded-xl bg-[#011023] text-white text-sm font-bold hover:bg-indigo-600 transition-all uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Next"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Modal */}
            {showOTPModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-tight mb-2">
                                {tasks.find(t => t._id === selectedTaskId)?.status === 'Completed' ? 'Verify Delivery' : 'Verify Service'}
                            </h3>
                            <div className="flex items-center gap-2 mb-6">
                                <p className="text-sm text-gray-500">
                                    {isSubmitting && !otpInput ? "Sending OTP to customer email..." : "Enter the 6-digit OTP sent to the customer's registered email address."}
                                </p>
                                {isSubmitting && !otpInput && <Loader2 className="animate-spin text-indigo-600" size={14} />}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">6-Digit OTP</label>
                                    <input 
                                        type="text"
                                        maxLength="6"
                                        placeholder="Enter OTP"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-center text-2xl tracking-[10px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => setShowOTPModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleVerifyOTP}
                                        disabled={isSubmitting || otpInput.length !== 6}
                                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            tasks.find(t => t._id === selectedTaskId)?.status === 'Completed' ? "Verify & Deliver" : "Verify & Start Service"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
