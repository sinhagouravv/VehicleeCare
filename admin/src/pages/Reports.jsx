import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileBarChart, Loader2, TrendingUp, TrendingDown, ClipboardList, CheckCircle, Clock, AlertCircle, Shield, Briefcase, Activity } from 'lucide-react';

const Reports = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchReportsData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/bookings');
            const result = await res.json();
            if (result.success && result.data) {
                setBookings(result.data);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch reports data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReportsData();
        const interval = setInterval(() => fetchReportsData(true), 5000); // 5 sec refresh
        return () => clearInterval(interval);
    }, [fetchReportsData]);

    const stats = useMemo(() => {
        const total = bookings.length;
        const completed = bookings.filter(b => b.status === 'Completed' || b.status === 'Delivered').length;
        const pending = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length;
        const inProgress = bookings.filter(b => b.status === 'In Progress' || b.status === 'In Service').length;
        const cancelled = bookings.filter(b => b.status === 'Cancelled').length;

        const garagePerformance = bookings.reduce((acc, b) => {
            const garageId = b.garageId || 'Unknown';
            if (!acc[garageId]) acc[garageId] = { total: 0, completed: 0 };
            acc[garageId].total++;
            if (b.status === 'Completed' || b.status === 'Delivered') acc[garageId].completed++;
            return acc;
        }, {});

        return {
            total,
            completed,
            pending,
            inProgress,
            cancelled,
            efficiency: total > 0 ? Math.round((completed / total) * 100) : 0,
            garagesCount: Object.keys(garagePerformance).length
        };
    }, [bookings]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">System Operational Reports</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                    {loading && !lastRefreshed ? (
                        <span>Synchronizing...</span>
                    ) : lastRefreshed ? (
                        <span>
                            Last refreshed | {lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                    ) : null}
                    {loading && lastRefreshed && (
                        <Loader2 size={12} className="animate-spin text-[#527FB0]" />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl group-hover:scale-110 transition-transform"><ClipboardList size={24} /></div>
                        <span className="text-[10px] font-black bg-blue-50 text-[#527FB0] px-2 py-1 rounded-lg uppercase">System Load</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Requests</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.total}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckCircle size={24} /></div>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">Success</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Completed</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.completed}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Activity size={24} /></div>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase">Efficiency</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Operational Precision</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.efficiency}%</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                        <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-2 py-1 rounded-lg uppercase">Coverage</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Garages</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.garagesCount}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <FileBarChart className="text-[#527FB0]" size={22} /> Booking Status Distribution
                    </h2>
                    <div className="space-y-6">
                        {[
                            { label: 'Completed', value: stats.completed, color: 'emerald' },
                            { label: 'In Progress', value: stats.inProgress, color: 'blue' },
                            { label: 'Pending', value: stats.pending, color: 'amber' },
                            { label: 'Cancelled', value: stats.cancelled, color: 'rose' }
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-bold text-[#011023] uppercase opacity-70">{item.label}</span>
                                    <span className="text-xs font-black text-[#011023]">{item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-white/50">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'blue' ? 'bg-[#052558]' : item.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <Briefcase className="text-[#527FB0]" size={22} /> Regional Network Performance
                    </h2>
                    <div className="flex flex-col justify-center items-center h-48">
                         <div className="relative w-32 h-32">
                            <div className="absolute inset-0 rounded-full border-8 border-blue-50"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-[#052558] border-t-transparent border-l-transparent transform -rotate-45"></div>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-black text-[#011023]">{stats.efficiency}%</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Avg Rating</span>
                            </div>
                         </div>
                         <p className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">System-wide performance benchmarks met</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
