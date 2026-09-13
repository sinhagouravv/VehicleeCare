import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Car, CheckCircle, TrendingUp, AlertCircle, Wrench, CalendarCheck, Clock, ArrowRight } from 'lucide-react';
import { SkeletonBlock } from '../components/Skeleton';
import useGuestGuard from '../hooks/useGuestGuard';
import GuestRestrictedOverlay from '../components/GuestRestrictedOverlay';
import { API_BASE_URL } from '../config/api';

const Dashboard = () => {
    const { isGuest } = useGuestGuard();
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`${API_BASE_URL}/api/bookings/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch garage dashboard data", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => fetchDashboardData(true), 30000); // 30s refresh
        return () => clearInterval(timer);
    }, []);

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

    const onTimePercentage = useMemo(() => {
        if (bookings.length === 0) return 100;
        const now = new Date();
        const onTimeCount = bookings.filter(job => {
            const dueDate = calculateDeliveryDate(job);
            if (!dueDate) return true;
            return job.status === 'Delivered' || dueDate >= now;
        }).length;
        return Math.round((onTimeCount / bookings.length) * 100);
    }, [bookings]);

    const latePercentage = useMemo(() => {
        if (bookings.length === 0) return 0;
        const now = new Date();
        const lateCount = bookings.filter(job => {
            const dueDate = calculateDeliveryDate(job);
            if (!dueDate) return false;
            return job.status !== 'Delivered' && dueDate < now;
        }).length;
        return Math.round((lateCount / bookings.length) * 100);
    }, [bookings]);

    const onTimeDeliveredPercentage = useMemo(() => {
        if (bookings.length === 0) return 0;
        const deliveredJobs = bookings.filter(b => b.status === 'Delivered');
        const onTimeCount = deliveredJobs.filter(job => {
            const dueDate = calculateDeliveryDate(job);
            if (!dueDate) return true;
            const completionDate = new Date(job.updatedAt || Date.now());
            return completionDate <= dueDate;
        }).length;
        return Math.round((onTimeCount / bookings.length) * 100);
    }, [bookings]);

    // Derived states
    const activeVehicles = bookings.filter(b => b.status === 'In Progress' || b.status === 'In Service').length;
    
    const today = new Date().toLocaleDateString();
    const completedToday = bookings.filter(b => 
        b.status === 'Completed' && new Date(b.updatedAt || b.createdAt).toLocaleDateString() === today
    ).length;
    
    const pendingPickups = bookings.filter(b => b.status === 'Ready for Pickup' || b.status === 'Ready for Delivery').length;

    const totalRevenue = bookings
        .filter(b => b.status === 'Completed' || b.status === 'Delivered')
        .reduce((sum, b) => sum + (parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0), 0);

    const activeJobsList = bookings.filter(b => ['In Progress', 'In Service', 'Pending', 'Confirmed'].includes(b.status)).slice(0, 5);
    const upcomingJobs = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').slice(0, 5);

    return (
        <div className="space-y-4 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Dashboard Overview</h1>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed ? (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    ) : (
                        <div className="h-3.5 w-70 bg-slate-200 rounded-full animate-pulse" />
                    )}
                </div>
            </div>

            {/* Dashboard Content Container */}
            <div className="relative flex-1 min-h-0 space-y-4 flex flex-col overflow-hidden">
                {isGuest && <GuestRestrictedOverlay />}

                {/* KPI Metrics List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 bg-blue-50 text-[#527FB0] rounded-xl"><Car size={22} /></div>
                            <span className="flex items-center text-[#527FB0] text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg">Active</span>
                        </div>
                        <p className="text-gray-500 font-semibold mb-1 text-xs uppercase">Active Vehicles</p>
                        {loading ? (
                            <SkeletonBlock className="h-8 w-20 bg-slate-200/80 rounded-md" />
                        ) : (
                            <h3 className="text-2xl font-black text-[#011023]">{activeVehicles}</h3>
                        )}
                    </div>

                    <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl"><CheckCircle size={22} /></div>
                        </div>
                        <p className="text-gray-500 font-semibold mb-1 text-xs uppercase">Completed Today</p>
                        {loading ? (
                            <SkeletonBlock className="h-8 w-20 bg-slate-200/80 rounded-md" />
                        ) : (
                            <h3 className="text-2xl font-black text-[#011023]">{completedToday}</h3>
                        )}
                    </div>

                    <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><AlertCircle size={22} /></div>
                        </div>
                        <p className="text-gray-500 font-semibold mb-1 text-xs uppercase">Ready for Pickup</p>
                        {loading ? (
                            <SkeletonBlock className="h-8 w-20 bg-slate-200/80 rounded-md" />
                        ) : (
                            <h3 className="text-2xl font-black text-[#011023]">{pendingPickups}</h3>
                        )}
                    </div>

                    <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl"><TrendingUp size={22} /></div>
                        </div>
                        <p className="text-gray-500 font-semibold mb-1 text-xs uppercase">Total Revenue</p>
                        {loading ? (
                            <SkeletonBlock className="h-8 w-28 bg-slate-200/80 rounded-md" />
                        ) : (
                            <h3 className="text-2xl font-black text-[#011023]">₹{totalRevenue.toLocaleString()}</h3>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">
                    {/* Active Jobs Pipeline */}
                    <div className="lg:col-span-2 bg-white/70 backdrop-blur-md transform-gpu border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex flex-col min-h-0 overflow-hidden">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h2 className="text-lg font-extrabold text-[#011023] flex items-center gap-2 uppercase">
                                <Activity className="text-[#527FB0]" size={18} /> Live Shop Floor
                            </h2>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3.5 bg-white/40 border border-blue-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <SkeletonBlock className="h-10 w-10 bg-slate-200/80 rounded-xl shrink-0" />
                                            <div className="space-y-1.5">
                                                <SkeletonBlock className="h-4 w-32 bg-slate-200/80 rounded-md" />
                                                <SkeletonBlock className="h-3 w-24 bg-slate-200/80 rounded-md" />
                                            </div>
                                        </div>
                                        <SkeletonBlock className="h-6 w-20 bg-slate-200/80 rounded-full" />
                                    </div>
                                ))
                            ) : activeJobsList.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 uppercase text-xs font-bold">No active jobs right now.</div>
                            ) : activeJobsList.map((job) => (
                                <div key={job._id} className="flex items-center justify-between p-3.5 bg-white/40 border border-blue-50 rounded-xl hover:bg-white/80 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-[#527FB0] rounded-xl group-hover:bg-blue-100 transition-colors"><Wrench size={18} /></div>
                                        <div>
                                            <div className="font-bold text-[#011023] text-sm uppercase">{job.vehicle?.make} {job.vehicle?.model}</div>
                                            <div className="text-[11px] font-semibold text-gray-500 mt-0.5 uppercase tracking-tighter">{job.bookingId} • {job.vehicle?.number}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase shadow-sm
                                            ${job.status === 'In Service' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                                              job.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                              'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse
                                                ${job.status === 'In Service' ? 'bg-indigo-500' : 
                                                  job.status === 'In Progress' ? 'bg-blue-500' : 
                                                  'bg-amber-500'}`}></div>
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Efficiency & Arrivals Column */}
                    <div className="lg:col-span-2 space-y-4 flex flex-col min-h-0 overflow-hidden">
                        {/* Shop Efficiency Meters */}
                        <div className="bg-white/70 backdrop-blur-md border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] shrink-0">
                            <h2 className="text-lg font-extrabold text-[#011023] mb-4 flex items-center gap-2 uppercase">
                                 Efficiency Protocols
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {/* Dashboard Meter: Service Utilization */}
                                <div className="group/progress">
                                    <div className="flex justify-between items-center mb-1.5 text-[#011023]">
                                        <span className="text-[11px] font-bold uppercase block opacity-60">Service Utilization</span>
                                        {loading ? (
                                            <SkeletonBlock className="h-6 w-10 bg-slate-200/80 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black tracking-tighter">
                                                {Math.round((bookings.filter(b => ['In Progress', 'In Service', 'In-Service'].includes(b.status)).length / (bookings.length || 1)) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-white shadow-inner relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#052558] to-blue-400 rounded-full transition-all duration-1000"
                                            style={{ width: loading ? '0%' : `${(bookings.filter(b => ['In Progress', 'In Service', 'In-Service'].includes(b.status)).length / (bookings.length || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Dashboard Meter: On Time Precision */}
                                <div className="group/progress">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[11px] font-bold uppercase block opacity-60 text-emerald-600">On Time Precision</span>
                                        {loading ? (
                                            <SkeletonBlock className="h-6 w-10 bg-slate-200/80 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-emerald-600 tracking-tighter">
                                                {onTimePercentage}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-3.5 bg-emerald-50 rounded-full overflow-hidden p-0.5 border border-white shadow-inner relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                                            style={{ width: loading ? '0%' : `${onTimePercentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Dashboard Meter: Late Delivery */}
                                <div className="group/progress">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[11px] font-bold uppercase block opacity-60 text-rose-600">Late Delivery</span>
                                        {loading ? (
                                            <SkeletonBlock className="h-6 w-10 bg-slate-200/80 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-rose-600 tracking-tighter">
                                                {latePercentage}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-3.5 bg-rose-50 rounded-full overflow-hidden p-0.5 border border-white shadow-inner relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000"
                                            style={{ width: loading ? '0%' : `${latePercentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Dashboard Meter: Active Workflow */}
                                <div className="group/progress">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[11px] font-bold uppercase block opacity-60 text-indigo-600">Active Workflow</span>
                                        {loading ? (
                                            <SkeletonBlock className="h-6 w-10 bg-slate-200/80 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-indigo-600 tracking-tighter">
                                                {Math.round((bookings.filter(b => b.status === 'In Service').length / (bookings.length || 1)) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-3.5 bg-indigo-50 rounded-full overflow-hidden p-0.5 border border-white shadow-inner relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000"
                                            style={{ width: loading ? '0%' : `${Math.round((bookings.filter(b => b.status === 'In Service').length / (bookings.length || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Dashboard Meter: On-time Delivered */}
                                <div className="md:col-span-2 group/progress">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[11px] font-bold uppercase block opacity-60 text-teal-600">On-time Delivered</span>
                                        {loading ? (
                                            <SkeletonBlock className="h-6 w-10 bg-slate-200/80 rounded-md" />
                                        ) : (
                                            <span className="text-xl font-black text-teal-600 tracking-tighter">
                                                {onTimeDeliveredPercentage}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-3.5 bg-teal-50 rounded-full overflow-hidden p-0.5 border border-white shadow-inner relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000"
                                            style={{ width: loading ? '0%' : `${onTimeDeliveredPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Appointments */}
                        <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex-1 min-h-0 overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-3 shrink-0">
                                <h2 className="text-lg font-extrabold text-[#011023] flex items-center gap-2 uppercase">
                                    <CalendarCheck className="text-[#527FB0]" size={18} /> Next Arrivals
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto hide-scrollbar">
                                {loading ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="flex gap-3 p-2.5 rounded-xl items-center border border-transparent">
                                            <SkeletonBlock className="h-4.5 w-12 bg-slate-200/80 rounded-md shrink-0" />
                                            <div className="space-y-1 flex-1">
                                                <SkeletonBlock className="h-3.5 w-24 bg-slate-200/80 rounded-md" />
                                                <SkeletonBlock className="h-3 w-16 bg-slate-200/80 rounded-md" />
                                            </div>
                                        </div>
                                    ))
                                ) : upcomingJobs.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400 uppercase text-xs font-bold md:col-span-2">No upcoming arrivals.</div>
                                ) : upcomingJobs.map((apt, i) => (
                                    <div key={i} className="flex gap-3 p-2.5 hover:bg-white/40 rounded-xl transition-colors items-center border border-transparent hover:border-blue-50 group/apt">
                                        <div className="font-black text-[#052558] w-12 text-xs uppercase">{apt.schedule?.time?.split(' ')[0]}</div>
                                        <div>
                                            <p className="font-bold text-[#011023] text-xs uppercase">{apt.user?.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold truncate max-w-[120px] uppercase opacity-70 tracking-tighter">{apt.service?.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
