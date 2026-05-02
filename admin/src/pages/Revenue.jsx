import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndianRupee, Loader2, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Landmark } from 'lucide-react';

const Revenue = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchRevenueData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/bookings');
            const result = await res.json();
            if (result.success && result.data) {
                setBookings(result.data);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch revenue data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRevenueData();
        const interval = setInterval(() => fetchRevenueData(true), 5000); // 5 sec refresh
        return () => clearInterval(interval);
    }, [fetchRevenueData]);

    const stats = useMemo(() => {
        const totalRev = bookings.reduce((sum, b) => {
            if (b.payment?.status === 'Completed' || b.status === 'Completed' || b.status === 'Delivered') {
                return sum + (parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0);
            }
            return sum;
        }, 0);

        const today = new Date().toLocaleDateString('en-CA');
        const todayRev = bookings.reduce((sum, b) => {
            const createdAtDate = b.createdAt ? b.createdAt.split('T')[0] : '';
            if (createdAtDate === today && (b.payment?.status === 'Completed' || b.status === 'Completed' || b.status === 'Delivered')) {
                return sum + (parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0);
            }
            return sum;
        }, 0);

        // Category-wise revenue
        const categories = bookings.reduce((acc, b) => {
            if (b.payment?.status === 'Completed' || b.status === 'Completed' || b.status === 'Delivered') {
                const cat = b.service?.category || 'General';
                const amt = parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0;
                acc[cat] = (acc[cat] || 0) + amt;
            }
            return acc;
        }, {});

        return {
            totalRev,
            todayRev,
            categories,
            avgBookingValue: bookings.length > 0 ? Math.round(totalRev / bookings.length) : 0
        };
    }, [bookings]);

    const formatCurrency = (val) => {
        return `₹${val.toLocaleString('en-IN')}`;
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Revenue Analytics</h1>
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
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><IndianRupee size={24} /></div>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">Total</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Gross Revenue</p>
                    <h3 className="text-2xl font-black text-[#011023]">{formatCurrency(stats.totalRev)}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-black bg-blue-50 text-[#527FB0] px-2 py-1 rounded-lg uppercase">Daily</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Today's Earnings</p>
                    <h3 className="text-2xl font-black text-[#011023]">{formatCurrency(stats.todayRev)}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
                        <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-2 py-1 rounded-lg uppercase">Average</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Ticket Size</p>
                    <h3 className="text-2xl font-black text-[#011023]">{formatCurrency(stats.avgBookingValue)}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Landmark size={24} /></div>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase">Status</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Commission Pool</p>
                    <h3 className="text-2xl font-black text-[#011023]">{formatCurrency(Math.round(stats.totalRev * 0.15))}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <TrendingUp className="text-[#527FB0]" size={22} /> Earnings Growth
                    </h2>
                    <div className="flex items-end justify-between h-56 gap-4 px-2">
                        {[30, 45, 35, 60, 55, 80, 70, 95, 85, 100].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div 
                                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-500 group-hover:from-emerald-500"
                                    style={{ height: `${val}%` }}
                                ></div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">M0{i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <PieChart className="text-[#527FB0]" size={22} /> Revenue Stream
                    </h2>
                    <div className="space-y-6">
                        {Object.entries(stats.categories).slice(0, 4).map(([cat, val], i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-bold text-[#011023] uppercase opacity-70">{cat}</span>
                                    <span className="text-xs font-black text-[#011023]">{formatCurrency(val)}</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-white">
                                    <div 
                                        className={`h-full rounded-full ${i === 0 ? 'bg-[#052558]' : i === 1 ? 'bg-emerald-500' : i === 2 ? 'bg-amber-500' : 'bg-purple-500'}`}
                                        style={{ width: `${(val / stats.totalRev) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Revenue;
