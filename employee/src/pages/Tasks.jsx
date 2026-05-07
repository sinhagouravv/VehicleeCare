import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    Clock,
    X } from 'lucide-react';

import useHighlight from '../hooks/useHighlight';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserRole(user.role || '');
        }
    }, []);

    const highlightedRow = useHighlight(tasks);

    // Multi-step workflow state
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [durationDays, setDurationDays] = useState('');
    const [durationHours, setDurationHours] = useState('');
    const duration = (durationDays !== '' && durationHours !== '') ? `${durationDays} Day${durationDays !== '1' ? 's' : ''}, ${durationHours} Hour${durationHours !== '1' ? 's' : ''}` : '';
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
    const handleViewDetails = (task) => {
        setSelectedTask(task);
        setIsViewModalOpen(true);
    };

    const getDeliveryDue = (booking) => {
        if (!booking?.serviceDuration || booking.serviceDuration === '—') return '—';
        const str = booking.serviceDuration.toLowerCase();
        let days = 0;
        let hours = 0;
        
        const dMatch = str.match(/(\d+)\s*day/);
        if (dMatch) days = parseInt(dMatch[1], 10);
        
        const hMatch = str.match(/(\d+)\s*hour/);
        if (hMatch) hours = parseInt(hMatch[1], 10);
        
        // Use the explicitly scheduled service time as the baseline
        let baseTime = new Date(booking.createdAt || Date.now());
        if (booking.schedule?.date) {
            const parsedSchedule = new Date(`${booking.schedule.date} ${booking.schedule.time || ''}`.trim());
            if (!isNaN(parsedSchedule.getTime())) {
                baseTime = parsedSchedule;
            }
        }
        
        baseTime.setDate(baseTime.getDate() + days);
        baseTime.setHours(baseTime.getHours() + hours);
        
        return baseTime.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
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

    // OTP Input Helpers
    const handleOtpBoxChange = (value, index) => {
        if (value && !/^\d+$/.test(value)) return;
        const paddedOtp = otpInput.padEnd(6, ' ');
        const otpArray = paddedOtp.split('');
        otpArray[index] = value || ' ';
        const finalOtp = otpArray.join('');
        setOtpInput(finalOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-box-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpBoxKeyDown = (e, index) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const paddedOtp = otpInput.padEnd(6, ' ');
            const otpArray = paddedOtp.split('');
            
            if (otpArray[index] !== ' ') {
                // If there's a character, just clear it directly. Bypasses cursor position issues.
                e.preventDefault();
                otpArray[index] = ' ';
                setOtpInput(otpArray.join(''));
            } else if (index > 0) {
                // If already empty, jump back one box and clear it simultaneously
                e.preventDefault();
                otpArray[index - 1] = ' ';
                setOtpInput(otpArray.join(''));
                const prevInput = document.getElementById(`otp-box-${index - 1}`);
                prevInput?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevInput = document.getElementById(`otp-box-${index - 1}`);
            prevInput?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            const nextInput = document.getElementById(`otp-box-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const cleanOtp = otpInput.replace(/\s+/g, '');
        if (!cleanOtp || cleanOtp.length !== 6 || !selectedTaskId) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }
        setIsSubmitting(true);
        try {
            const currentTask = tasks.find(t => t._id === selectedTaskId);
            const currentStatus = currentTask?.status;
            const endpoint = currentStatus === 'Completed' ? 'verify-delivery-otp' : 'verify-otp';
            const body = currentStatus === 'Completed' ? { otp: cleanOtp } : { otp: cleanOtp, duration };

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
                setDurationDays('');
                setDurationHours('');
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
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">My Tasks</h1>
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
                                <th className="p-4.5 font-bold text-center w-[8%]">Action</th>
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
                                            <div className="font-semibold text-[13px] uppercase">
                                                {task.user.name}
                                            </div>
                                            <div className="text-[11.5px] text-slate-500 uppercase">
                                                {task.user.userId}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-semibold text-[13px] uppercase truncate max-w-[150px] mx-auto">
                                            {task.user.phone}
                                        </div>
                                        <div className="text-[11.5px] text-slate-500 lowercase tracking-wide">
                                            {task.user.email}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-semibold text-[13px] uppercase leading-snug">
                                            {task.service.title}
                                        </div>
                                        <div className="text-[11.5px] text-slate-500 uppercase tracking-wide">
                                            {task.vehicle.year} {task.vehicle.make} {task.vehicle.model}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-[14px] font-semibold uppercase">
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
                                            <button 
                                                onClick={() => handleViewDetails(task)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                            >
                                                <Eye size={17} />
                                            </button>
                                             {task.status !== 'Delivered' && userRole === 'Technician' && (
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

            {isViewModalOpen && selectedTask && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Task Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedTask.bookingId || selectedTask._id}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Customer Info */}
                                <div className="space-y-4 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedTask.user?.name}>{selectedTask.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedTask.user?.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedTask.user?.email}>{selectedTask.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Vehicle Info */}
                                <div className="space-y-4 w-full md:w-[24%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2 min-h-[110px]">
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Brand:</span> <span className="font-semibold text-[#011023]">{selectedTask.vehicle?.make || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedTask.vehicle?.model || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Year:</span> <span className="font-semibold text-gray-800">{selectedTask.vehicle?.year || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Payment & Status */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[34%]">
                                    <div className="space-y-1.5">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center mt-7 gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2 pl-6">
                                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusStyle(selectedTask.status)}`}>
                                                    {selectedTask.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Duration</h4>
                                            <div className="flex uppercase items-center gap-2 pl-3">
                                                <span className="inline-block px-3 py-1 text-xs font-bold rounded-md uppercase text-gray-800">{selectedTask.serviceDuration || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-29">Delivery Due</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className="inline-block px-1 py-1 text-xs font-bold rounded-md uppercase text-gray-800">
                                                    {getDeliveryDue(selectedTask)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Service Details</h4>
                                <div className="bg-white border border-[#e6f0fa] p-4 gap-4 rounded-xl flex justify-between items-center shadow-sm">
                                    <div>
                                        <h5 className="font-bold text-[#052558] uppercase text-[15.5px]">{selectedTask.service?.title || 'General Service'}</h5>
                                        <p className="text-sm uppercase text-gray-500 mt-1">Scheduled for: <span className="font-semibold text-gray-700">{selectedTask.schedule?.date} at {selectedTask.schedule?.time}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Garage & Employees Info */}
                            <div className="flex gap-5 -mt-1">
                                {/* Employees Info - 100% */}
                                <div className="w-full bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm flex divide-x divide-[#e6f0fa]">
                                    <div className="w-1/3 pr-4 uppercase">
                                        <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Assigned Employee's</p>
                                        <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedTask.assignedEmployees?.technician?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Technician | {selectedTask.assignedEmployees?.technician?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 px-4 uppercase">
                                        <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedTask.assignedEmployees?.support?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Support Staff | {selectedTask.assignedEmployees?.support?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 pl-4 uppercase">
                                        <h5 className="font-bold text-[#052558] mt-5 text-[15.5px]">{selectedTask.assignedEmployees?.mechanic?.name || '—'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Mechanic | {selectedTask.assignedEmployees?.mechanic?.employeeId || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Duration Modal */}
            {showDurationModal && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setShowDurationModal(false); setDurationDays(''); setDurationHours(''); }} />
                    <div className="relative w-full max-w-xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between relative">
                            <div className="w-8"></div>
                            <div className="text-center absolute left-1/2 -translate-x-1/2 uppercase">
                                <h2 className="text-xl mt-2 font-bold text-[#011023]">Service Duration</h2>
                                <p className="text-[13px] text-gray-500 font-bold mt-1">Enter the estimated time required</p>
                            </div>
                            <button onClick={() => { setShowDurationModal(false); setDurationDays(''); setDurationHours(''); }} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700 relative z-10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase overflow-y-auto hide-scrollbar">
                            <div className="grid grid-cols-2 gap-4 px-5">
                                <div>
                                    <label className="block text-sm text-center font-semibold text-[#011023] mb-2">Days</label>
                                    <select 
                                        className="w-full uppercase px-4 font-semibold text-center text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(e.target.value)}
                                    >
                                        <option value=""></option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => (
                                            <option key={h} value={h}>{h} {h === 1 ? 'Day' : 'Days'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-center font-semibold text-[#011023] mb-2">Hours</label>
                                    <select 
                                        className="w-full uppercase px-4 font-semibold text-center text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(e.target.value)}
                                    >
                                        <option value=""></option>
                                        {[3, 6, 9, 12, 15, 18, 24].map((h) => (
                                            <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-2 grid grid-cols-2 gap-3 pb-8 px-11">
                            <button onClick={() => { setShowDurationModal(false); setDurationDays(''); setDurationHours(''); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95">CANCEL</button>
                            <button 
                                onClick={() => handleSendOTP(selectedTaskId)} 
                                disabled={isSubmitting || !duration} 
                                className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> NEXT...</> : 'NEXT'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showOTPModal && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setShowOTPModal(false); setOtpInput(''); }} />
                    <div className="relative w-full max-w-xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between relative">
                            <div className="w-9"></div>
                            <div className="text-center absolute left-1/2 -translate-x-1/2 uppercase">
                                <h3 className="text-xl mt-2 font-bold text-[#011023] whitespace-nowrap">
                                    {/* {tasks.find(t => t._id === selectedTaskId)?.status === 'Completed' ? 'Verify Delivery' : 'Verify Service'} */}

                                <h2 className="text-xl mt-2 font-bold text-[#011023]">Service Duration</h2>
                                </h3>
                                <p className="text-[13px] uppercase text-gray-500 font-bold mt-1 lowercase first-letter:uppercase">
                                    {/* {isSubmitting && !otpInput ? "Sending OTP to customer..." : "Enter the 6-digit code sent to customer"} */}
                                <p className="text-[13px] text-gray-500 font-bold mt-1">Enter the OTP sent to customer</p>
                                </p>
                            </div>
                            <button onClick={() => { setShowOTPModal(false); setOtpInput(''); }} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700 relative z-10">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-10 space-y-8 flex flex-col items-center overflow-y-auto hide-scrollbar">
                            <div className="text-center">
                                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
                                    6-Digit Verification Code
                                </label>
                                <div className="flex justify-center gap-2 sm:gap-3 w-full px-2">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            id={`otp-box-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={otpInput[index]?.trim() || ''}
                                            onChange={(e) => handleOtpBoxChange(e.target.value, index)}
                                            onKeyDown={(e) => handleOtpBoxKeyDown(e, index)}
                                            onFocus={(e) => e.target.select()}
                                            autoComplete="off"
                                            className="w-10 h-12 text-center text-xl text-[#011023] bg-white/50 border border-white/60 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-sm outline-none caret-transparent selection:bg-transparent selection:text-[#011023]"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-2 grid grid-cols-2 gap-3 pb-8 px-11">
                            <button 
                                onClick={() => { setShowOTPModal(false); setOtpInput(''); }}
                                className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleVerifyOTP}
                                disabled={isSubmitting || otpInput.replace(/\s+/g, '').length !== 6}
                                className="px-2 py-3 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> VERIFYING...</>
                                ) : (
                                    tasks.find(t => t._id === selectedTaskId)?.status === 'Completed' ? "VERIFY & DELIVER" : "VERIFY & START"
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tasks;
