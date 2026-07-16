import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileBarChart, Loader2, TrendingUp, TrendingDown, DollarSign, Briefcase, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const Reports = () => {
    const { triggerAlert } = useAlert();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchReportsData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data || []);
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

    // Analytics Calculations
    const stats = useMemo(() => {
        const total = bookings.length;
        const completed = bookings.filter(b => b.status === 'Completed' || b.status === 'Delivered').length;
        const revenue = bookings
            .filter(b => b.status === 'Completed' || b.status === 'Delivered')
            .reduce((sum, b) => sum + (parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0), 0);
        const pending = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length;
        const inProgress = bookings.filter(b => b.status === 'In Progress' || b.status === 'In Service').length;

        return {
            total,
            completed,
            revenue,
            pending,
            inProgress,
            efficiency: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [bookings]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Reports</h1>
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

            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">Revenue</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Income</p>
                    <h3 className="text-2xl font-black text-[#011023]">₹{stats.revenue.toLocaleString()}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
                        <span className="text-[10px] font-black bg-blue-50 text-[#527FB0] px-2 py-1 rounded-lg uppercase">Output</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Services Finalized</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.completed}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase">Efficiency</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Success Protocol</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.efficiency}%</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><AlertCircle size={24} /></div>
                        <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-2 py-1 rounded-lg uppercase">Load</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">In-Shop Volume</p>
                    <h3 className="text-2xl font-black text-[#011023]">{stats.inProgress}</h3>
                </div>
            </div>

            {/* Detailed Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown (Simulated Chart) */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <FileBarChart className="text-[#527FB0]" size={22} /> Monthly Revenue Stream
                    </h2>
                    <div className="flex items-end justify-between h-48 gap-4 px-2">
                        {[45, 60, 40, 75, 50, 90, 65].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div 
                                    className="w-full bg-gradient-to-t from-[#052558] to-blue-400 rounded-t-xl transition-all duration-500 group-hover:to-blue-300"
                                    style={{ height: `${val}%` }}
                                ></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">W0{i+1}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-500 uppercase">Operational Performance Index</p>
                        <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">+12.4% vs Last Period</span>
                    </div>
                </div>

                {/* Service Category Distribution */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <CheckCircle className="text-[#527FB0]" size={22} /> Service Fulfillment
                    </h2>
                    <div className="space-y-6">
                        {[
                            { label: 'General Maintenance', value: 85, color: 'blue' },
                            { label: 'Engine & Mechanical', value: 62, color: 'purple' },
                            { label: 'AC & Electrical', value: 45, color: 'amber' },
                            { label: 'Body & Exterior', value: 28, color: 'emerald' }
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-bold text-[#011023] uppercase opacity-70">{item.label}</span>
                                    <span className="text-xs font-black text-[#011023]">{item.value}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-white/50">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${item.color === 'blue' ? 'bg-[#052558]' : item.color === 'purple' ? 'bg-purple-500' : item.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${item.value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-4 flex justify-center">
                        <button className="text-[10px] font-black text-[#527FB0] uppercase tracking-widest hover:underline">Download Detailed CSV Report</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
