import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
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
import { SkeletonBlock } from '../components/Skeleton';
import useGuestGuard from '../hooks/useGuestGuard';
import { API_BASE_URL } from '../config/api';

// Module-level cache for instant tab transitions
let cachedProgressBookings = null;
let cachedProgressGarageId = null;
let cachedProgressTimestamp = null;

const Progress = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { isGuest } = useGuestGuard();
    const [bookings, setBookings] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedProgressGarageId === gId && Array.isArray(cachedProgressBookings)) return cachedProgressBookings;
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedProgressGarageId === gId && Array.isArray(cachedProgressBookings)) return false;
            }
        } catch (e) {}
        return true;
    });
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedProgressTimestamp ? new Date(cachedProgressTimestamp) : null);
    const isFetchingRef = useRef(false);
    const [expandedJob, setExpandedJob] = useState(null);

    const fetchProgressData = useCallback(async (silent = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && !cachedProgressBookings) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`${API_BASE_URL}/api/bookings/garage/${user.id}`);
            const data = await res.json();

            if (data.success) {
                // Filter for active jobs (Progress pipeline includes all except Cancelled)
                const activeStatuses = ['Pending', 'Confirmed', 'In Progress', 'In Service', 'Completed', 'Delivered'];
                const filtered = (data.data || []).filter(b => activeStatuses.includes(b.status));
                setBookings(filtered);
                const now = new Date();
                setLastRefreshed(now);
                cachedProgressBookings = filtered;
                cachedProgressGarageId = user.id;
                cachedProgressTimestamp = now.getTime();
            }
        } catch (error) {
            console.error("Failed to fetch progress data", error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchProgressData(!!cachedProgressBookings);
        if (isGuest) return;
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchProgressData(true);
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [fetchProgressData, isGuest]);

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
        if (!status) return 0;
        const s = status.trim().toLowerCase();
        if (s === 'pending' || s === 'confirmed') return 0;
        if (s === 'in progress' || s === 'inprogress') return 1;
        if (s === 'in service' || s === 'in-service' || s === 'inservice') return 2;
        if (s === 'completed' || s === 'ready for delivery') return 3;
        if (s === 'delivered') return 4;
        return 0;
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

    const renderJobCard = (job) => {
        if (!job || (!job.vehicle?.make && !job.vehicle?.model && !job.service?.title && !job.bookingId)) {
            return (
                <div key={job?._id || Math.random()} className="bg-white/60 backdrop-blur-xl border border-[#e6f0fa] p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center animate-pulse">
                    <div className="space-y-2 w-3/4">
                        <div className="flex items-center gap-3">
                            <SkeletonBlock className="h-5 w-40 bg-slate-200/80 rounded-lg" />
                            <SkeletonBlock className="h-4 w-20 bg-blue-100/50 rounded-full" />
                        </div>
                        <SkeletonBlock className="h-4 w-56 bg-slate-200/60 rounded" />
                    </div>
                    <SkeletonBlock className="h-7 w-24 bg-slate-200/80 rounded-2xl" />
                </div>
            );
        }

        const vehicleTitle = [job.vehicle?.make, job.vehicle?.model].filter(Boolean).join(' ');

        return (
            <div
                key={job._id}
                id={`job-card-${job._id}`}
                className={`group bg-white/70 backdrop-blur-xl border border-[#e6f0fa] rounded-2xl transition-all duration-500 overflow-hidden 
                    ${expandedJob === job._id ? 'scale-[1.01] bg-white/95 ring-1 ring-blue-50/50' : ''}`}
            >
                <div
                    className="px-4.5 py-2.75 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
                >
                    <div className="flex items-center gap-6 w-[80%]">
                        <div className=''>
                            <div className="flex items-center gap-3">
                                {vehicleTitle ? (
                                    <h4 className="font-bold text-[#011023] uppercase tracking-tight leading-none">
                                        {vehicleTitle}
                                    </h4>
                                ) : (
                                    <SkeletonBlock className="h-4.5 w-36 bg-slate-200/80 rounded-md" />
                                )}
                                <span className="text-[10.5px] font-semibold text-[#527FB0] bg-blue-50/50 px-2.5 py-0.5 rounded-full border border-blue-100/50 uppercase">
                                    {job.bookingId || job._id?.slice(0, 8)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.25">
                                {job.service?.title ? (
                                    <span className={`text-[12px] font-semibold text-slate-500 uppercase ${expandedJob === job._id ? 'whitespace-normal' : 'truncate block max-w-xl'}`}>
                                        {job.service.title}
                                    </span>
                                ) : (
                                    <SkeletonBlock className="h-3.5 w-52 bg-slate-200/60 rounded-md" />
                                )}
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
                    <div className="px-4 pb-2 pt-4 space-y-8 animate-in slide-in-from-top-4 duration-700 ease-out">
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
                                    const isDone = idx <= statusStep;
                                    
                                    return (
                                        <div key={idx} className="flex flex-col items-center group/step">
                                            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center border-2 transition-all duration-700
                                                ${isDone
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                    : 'bg-white border-slate-100 text-slate-300'}`}>
                                                {isDone 
                                                    ? <Check size={14} strokeWidth={3} /> 
                                                    : React.cloneElement(step.icon, { strokeWidth: 2.5 })}
                                            </div>
                                            <div className="text-center mt-4">
                                                <p className={`text-[11.5px] font-semibold uppercase transition-colors duration-500
                                                    ${isDone 
                                                        ? 'text-emerald-600' 
                                                        : 'text-slate-300'}`}>
                                                    {step.label}
                                                </p>
                                                <p className={`text-[9.5px] font-bold uppercase opacity-60 transition-colors duration-500
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
                            <div className="px-2">
                                <h5 className="text-[14.5px] font-bold uppercase mb-5">Expert Assigned</h5>
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

                            <div className="px-2 flex flex-col justify-between group/time">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h5 className="text-[14px] font-bold uppercase">Efficiency Protocol</h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2.5 ">
                                            <span className="text-[12px] font-bold text-[#011023] uppercase">Duration</span>
                                            <span className="text-[12px] font-semibold text-[#011023] uppercase">{job.serviceDuration || '—'}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2.5 ">
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
};

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto transition-all duration-300`}>
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Service Progress</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                    {loading && bookings.length === 0 ? (
                        <SkeletonBlock className="h-4 w-60 bg-slate-200/80 rounded" />
                    ) : loading ? (
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
                {loading && bookings.length === 0 ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white/60 backdrop-blur-xl border border-[#e6f0fa] px-6 py-3.25 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center animate-pulse">
                            <SkeletonBlock className="h-4 w-16 bg-slate-200/80 rounded" />
                            <SkeletonBlock className="h-7 w-8 bg-slate-200/80 rounded-lg" />
                        </div>
                    ))
                ) : (
                    stats.map((stat, i) => (
                        <div key={i} className="bg-white/60 backdrop-blur-xl border border-[#e6f0fa] px-6 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                            <p className="text-gray-500 font-semibold">{stat.label}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xl font-bold ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'blue' ? 'text-[#011023]' : 'text-[#011023]'}`}>{stat.value}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Shop Floor Layout */}
            <div className={`grid grid-cols-1 ${isSidebarCollapsed ? 'lg:grid-cols-2' : 'xl:grid-cols-2'} gap-4 items-start transition-all duration-300`}>

                {/* Active Jobs Pipeline */}
                <div className="space-y-5">
                    <div className="space-y-3.25 max-h-[790px] overflow-y-auto rounded-xl hide-scrollbar">
                        {loading && bookings.length === 0 ? (
                            <div className="space-y-4">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="bg-white/60 backdrop-blur-xl border border-[#e6f0fa] p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center animate-pulse">
                                        <div className="space-y-2 w-3/4">
                                            <div className="flex items-center gap-3">
                                                <SkeletonBlock className="h-5 w-40 bg-slate-200/80 rounded-lg" />
                                                <SkeletonBlock className="h-4 w-20 bg-blue-100/50 rounded-full" />
                                            </div>
                                            <SkeletonBlock className="h-4 w-56 bg-slate-200/60 rounded" />
                                        </div>
                                        <SkeletonBlock className="h-7 w-24 bg-slate-200/80 rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        ) : activeBookings.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md border border-[#e6f0fa] p-10 rounded-[2.5rem] text-center shadow-sm">
                                <CheckCircle className="mx-auto text-emerald-200 mb-6" size={64} />
                                <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px]">All Services Completed</p>
                            </div>
                        ) : activeBookings.map((job) => renderJobCard(job))}
                    </div>
                </div>

                {/* Delivered Jobs Section */}
                <div className="space-y-5 lg:sticky lg:top-0">
                    <div className="space-y-3.25 max-h-[790px] overflow-y-auto rounded-xl hide-scrollbar">
                        {loading && bookings.length === 0 ? (
                            <div className="space-y-4">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="bg-white/60 backdrop-blur-xl border border-[#e6f0fa] p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center animate-pulse">
                                        <div className="space-y-2 w-3/4">
                                            <div className="flex items-center gap-3">
                                                <SkeletonBlock className="h-5 w-40 bg-slate-200/80 rounded-lg" />
                                                <SkeletonBlock className="h-4 w-20 bg-blue-100/50 rounded-full" />
                                            </div>
                                            <SkeletonBlock className="h-4 w-56 bg-slate-200/60 rounded" />
                                        </div>
                                        <SkeletonBlock className="h-7 w-24 bg-slate-200/80 rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        ) : deliveredBookings.length === 0 ? (
                            <div className="bg-white/40  border border-[#e6f0fa] p-10 rounded-2xl text-center shadow-sm">
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
