import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Wrench,
    CheckCircle,
    Check,
    Clock,
    AlertCircle,
    User,
    Car,
    ArrowRight,
    Gauge,
    Timer,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const Progress = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [expandedJob, setExpandedJob] = useState(null);

    const fetchProgressData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
            const data = await res.json();

            if (data.success) {
                // Filter for active jobs (Progress pipeline includes all except Cancelled)
                const activeStatuses = ['Pending', 'Confirmed', 'In Progress', 'In Service', 'Completed', 'Delivered'];
                const filtered = data.data.filter(b => activeStatuses.includes(b.status));
                setBookings(filtered);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch progress data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProgressData();
        const timer = setInterval(() => fetchProgressData(true), 5000); // 15s live refresh
        return () => clearInterval(timer);
    }, [fetchProgressData]);

    useEffect(() => {
        if (expandedJob) {
            const element = document.getElementById(`job-card-${expandedJob}`);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }, [expandedJob]);

    const getStatusStep = (status) => {
        switch (status) {
            case 'Pending':
            case 'Confirmed': return 0;
            case 'In Progress': return 1;
            case 'In Service':
            case 'In-Service': return 2;
            case 'Completed':
            case 'Ready for Delivery': return 3;
            case 'Delivered': return 4;
            default: return 0;
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

    const calculateDeliveryDate = (booking) => {
        if (!booking?.serviceDuration || booking.serviceDuration === '—') return null;
        const str = booking.serviceDuration.toLowerCase();
        let days = 0;
        let hours = 0;

        const dMatch = str.match(/(\d+)\s*day/);
        if (dMatch) days = parseInt(dMatch[1], 10);

        const hMatch = str.match(/(\d+)\s*hour/);
        if (hMatch) hours = parseInt(hMatch[1], 10);

        let baseTime = new Date(booking.createdAt || Date.now());
        if (booking.schedule?.date) {
            const parsedSchedule = new Date(`${booking.schedule.date} ${booking.schedule.time || ''}`.trim());
            if (!isNaN(parsedSchedule.getTime())) {
                baseTime = parsedSchedule;
            }
        }

        const deliveryDate = new Date(baseTime);
        deliveryDate.setDate(deliveryDate.getDate() + days);
        deliveryDate.setHours(deliveryDate.getHours() + hours);
        return deliveryDate;
    };

    const getDeliveryDue = (booking) => {
        const deliveryDate = calculateDeliveryDate(booking);
        if (!deliveryDate) return '—';

        return deliveryDate.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const stats = [
        { label: 'Total Active', value: bookings.length },
        { label: 'Pending', value: bookings.filter(b => ['Pending'].includes(b.status)).length },
        { label: 'In Progress', value: bookings.filter(b => ['In Progress'].includes(b.status)).length },
        { label: 'In Service', value: bookings.filter(b => ['In Service'].includes(b.status)).length },
        { label: 'Completed', value: bookings.filter(b => ['Completed'].includes(b.status)).length },
        { label: 'Delivered', value: bookings.filter(b => ['Delivered'].includes(b.status)).length },
    ];

    const activeBookings = bookings.filter(b => b.status !== 'Delivered');
    const deliveredBookings = bookings.filter(b => b.status === 'Delivered');

    const renderJobCard = (job) => (
        <div
            key={job._id}
            id={`job-card-${job._id}`}
            className={`group bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl transition-all duration-500 overflow-hidden 
                ${expandedJob === job._id ? 'shadow-2xl shadow-blue-900/10 scale-[1.01] bg-white/95 ring-1 ring-blue-50' : ''}`}
        >
            <div
                className="px-4.5 py-2.5 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
            >
                <div className="flex items-center gap-6 w-[80%]">
                    <div className=''>
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-[#011023] uppercase tracking-tight leading-none">
                                {job.vehicle?.make} {job.vehicle?.model}
                            </h4>
                            <span className="text-[10.5px] font-semibold text-[#527FB0] bg-blue-50/50 px-2.5 py-0.5 rounded-full border border-blue-100/50 uppercase">
                                {job.bookingId || job._id?.slice(0, 8)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.25">
                            <span className={`text-[12px] font-semibold text-slate-500 uppercase ${expandedJob === job._id ? 'whitespace-normal' : 'truncate block max-w-xl'}`} >{job.service?.title}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <span className={`px-3 py-1 rounded-2xl text-[10.5px] font-bold uppercase border transition-colors duration-500 ${getStatusStyle(job.status)} shadow-sm`}>
                            {job.status}
                        </span>
                    </div>
                </div>
            </div>

            <div 
                className={`grid transition-all duration-500 ease-in-out ${expandedJob === job._id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-6 pt-4 space-y-8 animate-in slide-in-from-top-4 duration-700 ease-out">
                        {/* Status Milestone Track */}
                        <div className="relative px-1">
                            {/* Progress Bar Background */}
                            <div className="absolute top-[1rem] left-12 right-12 h-1.5 bg-slate-100 rounded-full shadow-inner overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 via-emerald-400 to-emerald-400 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    style={{ width: `${(getStatusStep(job.status) / 4) * 100}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center pt-0.5 relative z-10 w-full">
                                {[
                                    { label: 'Pending', icon: <Clock size={14} />, desc: 'Vehicle in queue' },
                                    { label: 'In Progress', icon: <Wrench size={14} />, desc: 'Expert handling' },
                                    { label: 'In Service', icon: <Wrench size={14} />, desc: 'Work ongoing' },
                                    { label: 'Completed', icon: <CheckCircle size={14} />, desc: 'Final validation' },
                                    { label: 'Delivered', icon: <ArrowRight size={14} />, desc: 'Handed over' }
                                ].map((step, idx) => {
                                    const statusStep = getStatusStep(job.status);
                                    // A step is done if we've passed it, OR if we are at it and it's 'Completed' or 'Delivered'
                                    const isDone = job.status === 'Delivered' || 
                                                 (job.status === 'Completed' && idx <= 3) || 
                                                 statusStep > idx;
                                    const isActive = !isDone && statusStep === idx;
                                    
                                    return (
                                        <div key={idx} className="flex flex-col items-center group/step">
                                            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center border-2 transition-all duration-700
                                                ${isDone
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                    : isActive
                                                        ? 'bg-white border-blue-500 text-blue-600 shadow-xl shadow-blue-50 scale-110 ring-4 ring-blue-50'
                                                        : 'bg-white border-slate-100 text-slate-300'}`}>
                                                {isDone 
                                                    ? <Check size={14} strokeWidth={3} /> 
                                                    : React.cloneElement(step.icon, { strokeWidth: 2.5 })}
                                            </div>
                                            <div className="text-center mt-4">
                                                <p className={`text-[11.5px] font-semibold uppercase transition-colors duration-500
                                                    ${isDone 
                                                        ? 'text-emerald-600' 
                                                        : isActive 
                                                            ? 'text-[#052558]' 
                                                            : 'text-slate-300'}`}>
                                                    {step.label}
                                                </p>
                                                <p className={`text-[9.5px] font-black uppercase opacity-60 transition-colors duration-500
                                                    ${isDone ? 'text-emerald-500/100' : 'text-slate-400'}`}>
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grid Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                            <div className="bg-gradient-to-br from-blue-50/50 to-white p-4 rounded-2xl border border-blue-50/80 shadow-sm">
                                <h5 className="text-[14.5px] font-bold uppercase mb-3 border-b border-blue-100/50 pb-3">Expert Assigned</h5>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group/staff">
                                        <div>
                                            <p className="text-[12px] font-semibold leading-none uppercase">
                                                {job.assignedEmployees?.technician?.name || 'Awaiting Lead'} | {job.assignedEmployees?.technician?.id?.role || 'Technician'} | {job.assignedEmployees?.technician?.employeeId || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group/staff opacity-90 transition-opacity hover:opacity-100">
                                        <div>
                                            <p className="text-[12px] font-semibold leading-none uppercase">
                                                {job.assignedEmployees?.mechanic?.name || 'Awaiting'} | {job.assignedEmployees?.mechanic?.id?.role || 'Mechanic'} | {job.assignedEmployees?.mechanic?.employeeId || '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group/time">
                                <div>
                                    <div className="flex justify-between items-start mb-5">
                                        <h5 className="text-[14px] font-bold uppercase mb- border-b border-blue-100/50">Efficiency Protocol</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50/50 mb-2.5 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                                            <span className="text-[12px] font-bold text-[#011023] uppercase">Duration</span>
                                            <span className="text-[12px] font-semibold text-[#011023] uppercase">{job.serviceDuration || '—'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50/50 p- rounded-xl border border-transparent hover:border-slate-100 transition-all">
                                            <span className="text-[12px] font-bold text-[#011023] uppercase">Delivery Due</span>
                                            <span className="text-[12px] font-semibold text-[#011023] uppercase">{getDeliveryDue(job)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Service Progress</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                    {loading ? (
                        <span>Refreshing...</span>
                    ) : lastRefreshed ? (
                        <span>
                            Last refreshed | {lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-6 uppercase gap-4 mb-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-xl border border-white px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                        <p className="text-gray-500 font-semibold">{stat.label}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'blue' ? 'text-[#011023]' : 'text-[#011023]'}`}>{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Shop Floor Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">

                {/* Active Jobs Pipeline */}
                <div className="space-y-5">
                    <div className="space-y-4 max-h-[790px] overflow-y-auto rounded-xl hide-scrollbar">
                        {loading && bookings.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md border border-white p-10 rounded-2xl text-center shadow-sm">
                                <div className="relative w-16 h-16 mx-auto mb-6">
                                    <Activity className="text-blue-200 animate-ping absolute inset-0 opacity-20" size={64} />
                                    <Activity className="text-blue-400 relative z-10" size={64} />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px]">Synchronizing Fleet Data...</p>
                            </div>
                        ) : activeBookings.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md border border-white p-10 rounded-[2.5rem] text-center shadow-sm">
                                <CheckCircle className="mx-auto text-emerald-200 mb-6" size={64} />
                                <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px]">All Services Completed</p>
                            </div>
                        ) : activeBookings.map((job) => renderJobCard(job))}
                    </div>
                </div>

                {/* Delivered Jobs Section */}
                <div className="space-y-5 lg:sticky lg:top-0">
                    <div className="space-y-4 max-h-[790px] overflow-y-auto rounded-xl hide-scrollbar">
                        {deliveredBookings.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md border border-white p-10 rounded-2xl text-center shadow-sm">
                                <Clock className="mx-auto text-slate-200 mb-6" size={64} />
                                <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px]">No Recent Deliveries</p>
                            </div>
                        ) : deliveredBookings.map((job) => renderJobCard(job))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Progress;
