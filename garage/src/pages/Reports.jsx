import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Download 
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import useGuestGuard from '../hooks/useGuestGuard';
import { API_BASE_URL } from '../config/api';

// Module-level cache for instant tab transitions
let cachedReportsBookings = null;
let cachedReportsGarageId = null;
let cachedReportsTimestamp = null;

const ReportsSkeleton = () => (
    <div className="space-y-4.5 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] pb-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
            <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            <div className="flex items-center gap-3">
                <div className="h-9 w-72 bg-slate-200 rounded-[14px]" />
                <div className="h-9 w-32 bg-slate-200 rounded-[14px]" />
            </div>
        </div>

        {/* 4 Performance Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-xs flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-3.5 w-24 bg-slate-200 rounded" />
                        <div className="h-7 w-28 bg-slate-200 rounded-md" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="h-5 w-16 bg-slate-200 rounded-full" />
                        <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    </div>
                </div>
            ))}
        </div>

        {/* Detailed Analytics Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5">
            {/* Bar Chart Skeleton */}
            <div className="lg:col-span-8 bg-white border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1.5">
                            <div className="h-5 w-48 bg-slate-200 rounded" />
                            <div className="h-3.5 w-36 bg-slate-200 rounded" />
                        </div>
                        <div className="h-6 w-24 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex items-end justify-between h-56 gap-3 pt-4 pb-3 border-b border-gray-100">
                        {[55, 35, 75, 45, 85, 65].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-40 flex items-end">
                                    <div className="w-full bg-slate-200 rounded-t-xl" style={{ height: `${h}%` }} />
                                </div>
                                <div className="h-3 w-8 bg-slate-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-auto pt-3 flex justify-between items-center">
                    <div className="h-3.5 w-36 bg-slate-200 rounded" />
                    <div className="h-3.5 w-44 bg-slate-200 rounded" />
                </div>
            </div>

            {/* Donut Chart Skeleton */}
            <div className="lg:col-span-4 bg-white border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                <div>
                    <div className="h-5 w-48 bg-slate-200 rounded mb-1" />
                    <div className="h-3.5 w-36 bg-slate-200 rounded mb-3" />
                    <div className="flex items-center justify-center py-2">
                        <div className="w-44 h-44 rounded-full border-[18px] border-slate-200 flex flex-col items-center justify-center space-y-1">
                            <div className="h-6 w-12 bg-slate-200 rounded" />
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    <div className="h-3.5 w-20 bg-slate-200 rounded" />
                </div>
            </div>
        </div>

        {/* Top Services Ranking Grid Skeleton */}
        <div className="bg-white border border-[#e6f0fa] rounded-2xl shadow-xs p-4.5 h-[388px]">
            <div className="flex justify-between items-center mb-8.5">
                <div className="space-y-5">
                    <div className="h-5 w-56 bg-slate-200 rounded" />
                    <div className="h-3.5 w-72 bg-slate-200 rounded" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
                            <div className="space-y-3">
                                <div className="h-3.5 w-28 bg-slate-200 rounded" />
                                <div className="h-3 w-16 bg-slate-200 rounded" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="h-3.5 w-14 bg-slate-200 rounded" />
                            <div className="h-3 w-10 bg-slate-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const Reports = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { triggerAlert } = useAlert();
    const { isGuest, guardGuestAction } = useGuestGuard();
    const [bookings, setBookings] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedReportsGarageId === gId && Array.isArray(cachedReportsBookings)) return cachedReportsBookings;
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedReportsGarageId === gId && Array.isArray(cachedReportsBookings)) return false;
            }
        } catch (e) {}
        return true;
    });
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedReportsTimestamp ? new Date(cachedReportsTimestamp) : null);
    const isFetchingRef = useRef(false);
    const [timeFilter, setTimeFilter] = useState('all'); // 'this_month', 'last_30', 'last_6_months', 'all'
    const [activeHoverBar, setActiveHoverBar] = useState(null);
    const [activeHoverFuel, setActiveHoverFuel] = useState(null);

    const fetchReportsData = useCallback(async (silent = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && !cachedReportsBookings) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`${API_BASE_URL}/api/bookings/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                const bData = data.data || [];
                setBookings(bData);
                const now = new Date();
                setLastRefreshed(now);
                cachedReportsBookings = bData;
                cachedReportsGarageId = user.id;
                cachedReportsTimestamp = now.getTime();
            }
        } catch (error) {
            console.error("Failed to fetch reports data", error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchReportsData(!!cachedReportsBookings);
        if (isGuest) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchReportsData(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchReportsData, isGuest]);

    // Filter bookings based on time range
    const filteredBookings = useMemo(() => {
        if (timeFilter === 'all') return bookings;
        const now = new Date();
        return bookings.filter(b => {
            const bDate = new Date(b.createdAt || b.schedule?.date || 0);
            if (isNaN(bDate.getTime())) return true;
            if (timeFilter === 'this_month') {
                return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
            }
            if (timeFilter === 'last_30') {
                const diffDays = (now - bDate) / (1000 * 60 * 60 * 24);
                return diffDays <= 30;
            }
            if (timeFilter === 'last_6_months') {
                const diffDays = (now - bDate) / (1000 * 60 * 60 * 24);
                return diffDays <= 180;
            }
            return true;
        });
    }, [bookings, timeFilter]);

    // Compute key metrics from real data
    const stats = useMemo(() => {
        const total = filteredBookings.length;
        const completed = filteredBookings.filter(b => b.status === 'Completed' || b.status === 'Delivered').length;
        const inProgress = filteredBookings.filter(b => b.status === 'In Progress' || b.status === 'In Service').length;
        const pending = filteredBookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length;
        const cancelled = filteredBookings.filter(b => b.status === 'Cancelled').length;

        const revenue = filteredBookings
            .filter(b => b.status === 'Completed' || b.status === 'Delivered' || b.payment?.status === 'Completed' || b.payment?.status === 'Paid')
            .reduce((sum, b) => {
                const pAmt = b.payment?.amount;
                const sPrice = b.service?.price;
                const rawAmount = pAmt !== undefined && pAmt !== null ? pAmt : (sPrice || '0');
                return sum + (parseFloat(String(rawAmount).replace(/[^0-9.]/g, '')) || 0);
            }, 0);

        const avgOrderValue = completed > 0 ? Math.round(revenue / completed) : (total > 0 ? Math.round(revenue / total) : 0);
        const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            inProgress,
            pending,
            cancelled,
            revenue,
            avgOrderValue,
            efficiency
        };
    }, [filteredBookings]);

    // Compute Fuel Type Breakdown from real data
    const fuelBreakdown = useMemo(() => {
        const counts = { petrol: 0, diesel: 0, ev: 0, cng: 0, hybrid: 0 };
        filteredBookings.forEach(b => {
            const ft = String(b.vehicle?.fuelType || b.vehicle?.fuel || '').toLowerCase();
            const lbl = String(b.vehicle?.make || b.vehicle?.model || '').toLowerCase();
            if (ft.includes('ev') || ft.includes('electric') || lbl.includes(' ev')) counts.ev++;
            else if (ft.includes('diesel') || lbl.includes('diesel')) counts.diesel++;
            else if (ft.includes('cng') || lbl.includes('cng')) counts.cng++;
            else if (ft.includes('hybrid') || lbl.includes('hybrid')) counts.hybrid++;
            else counts.petrol++; // default fallback
        });

        const total = filteredBookings.length;
        return [
            { label: 'Petrol', count: counts.petrol, pct: total > 0 ? Math.round((counts.petrol / total) * 100) : 0, color: 'bg-blue-500', hex: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Diesel', count: counts.diesel, pct: total > 0 ? Math.round((counts.diesel / total) * 100) : 0, color: 'bg-orange-500', hex: '#f97316', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: 'Electric', count: counts.ev, pct: total > 0 ? Math.round((counts.ev / total) * 100) : 0, color: 'bg-emerald-500', hex: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            // { label: 'CNG', count: counts.cng, pct: total > 0 ? Math.round((counts.cng / total) * 100) : 0, color: 'bg-purple-500', hex: '#a855f7', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
            // { label: 'Hybrid', count: counts.hybrid, pct: total > 0 ? Math.round((counts.hybrid / total) * 100) : 0, color: 'bg-teal-500', hex: '#14b8a6', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
        ].filter(item => item.count > 0);
    }, [filteredBookings]);

    // SVG Donut Segments with rounded caps & exact arc segment midpoint positioning for tooltips
    const donutSegments = useMemo(() => {
        const r = 54;
        const C = 2 * Math.PI * r;
        const total = filteredBookings.length || 1;
        const visibleItems = fuelBreakdown.filter(item => item.count > 0);
        const strokeW = 20;
        const capAdjustment = visibleItems.length > 1 ? (strokeW + 2) : 0;

        let cumulativeOffset = 0;
        let cumulativePct = 0;

        return fuelBreakdown.map((item) => {
            const pct = item.pct;
            const segmentLength = (pct / 100) * C;
            const strokeDash = Math.max(segmentLength - capAdjustment, 2);
            const dasharray = `${strokeDash} ${C - strokeDash}`;
            const dashoffset = -cumulativeOffset - (capAdjustment / 2);
            cumulativeOffset += segmentLength;

            // Calculate midpoint angle for positioning tooltip pill on the arc segment
            const midPct = cumulativePct + (pct / 2);
            cumulativePct += pct;
            const midAngleDeg = (midPct / 100) * 360 - 90;
            const midAngleRad = (midAngleDeg * Math.PI) / 180;

            // Container size is 192px (w-48 h-48), center is (96, 96)
            // Outer boundary of ring stroke is at ~77px. Radius = 100px places tooltip completely OUTSIDE the ring!
            const tooltipX = 96 + 100 * Math.cos(midAngleRad);
            const tooltipY = 96 + 100 * Math.sin(midAngleRad);

            return {
                ...item,
                dasharray,
                dashoffset,
                tooltipX,
                tooltipY
            };
        });
    }, [fuelBreakdown, filteredBookings.length]);

    // Compute Top Services Ranking from real data
    const topServices = useMemo(() => {
        const serviceMap = {};
        filteredBookings.forEach(b => {
            const title = b.service?.title || 'General Maintenance';
            if (!serviceMap[title]) {
                serviceMap[title] = { title, count: 0, revenue: 0 };
            }
            serviceMap[title].count++;
            const pAmt = b.payment?.amount;
            const sPrice = b.service?.price;
            const amount = parseFloat(String(pAmt !== undefined && pAmt !== null ? pAmt : (sPrice || '0')).replace(/[^0-9.]/g, '')) || 0;
            serviceMap[title].revenue += amount;
        });

        const totalBookings = filteredBookings.length || 1;
        return Object.values(serviceMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)
            .map(s => ({
                ...s,
                pct: Math.round((s.count / totalBookings) * 100)
            }));
    }, [filteredBookings]);

    // Compute Real Monthly/Weekly Revenue Chart
    const revenueChartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();

        // Build last 6 months buckets
        const buckets = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mName = months[d.getMonth()];
            buckets.push({
                label: `${mName} '${String(d.getFullYear()).slice(-2)}`,
                monthIdx: d.getMonth(),
                year: d.getFullYear(),
                revenue: 0,
                count: 0
            });
        }

        filteredBookings.forEach(b => {
            const bDate = new Date(b.createdAt || b.schedule?.date || 0);
            if (isNaN(bDate.getTime())) return;

            const bucket = buckets.find(bk => bk.monthIdx === bDate.getMonth() && bk.year === bDate.getFullYear());
            if (bucket) {
                bucket.count++;
                const pAmt = b.payment?.amount;
                const sPrice = b.service?.price;
                const amount = parseFloat(String(pAmt !== undefined && pAmt !== null ? pAmt : (sPrice || '0')).replace(/[^0-9.]/g, '')) || 0;
                bucket.revenue += amount;
            }
        });

        const maxRev = Math.max(...buckets.map(b => b.revenue), 1);
        return buckets.map(b => ({
            ...b,
            heightPct: Math.max(Math.round((b.revenue / maxRev) * 100), 10)
        }));
    }, [filteredBookings]);

    // Export CSV Feature
    const exportCSV = () => {
        if (guardGuestAction()) return;
        if (filteredBookings.length === 0) {
            if (triggerAlert) triggerAlert("No report data available to export.", "warning");
            return;
        }

        const headers = ["Booking ID", "Customer Name", "Customer Email", "Customer Phone", "Vehicle", "Fuel Type", "Service Title", "Amount (INR)", "Status", "Schedule Date"];
        const rows = filteredBookings.map(b => [
            b.bookingId || b._id,
            `"${b.user?.name || 'Customer'}"`,
            `"${b.user?.email || 'N/A'}"`,
            `"${b.user?.phone || 'N/A'}"`,
            `"${b.vehicle?.make || ''} ${b.vehicle?.model || ''}"`.trim() || 'N/A',
            `"${b.vehicle?.fuelType || b.vehicle?.fuel || 'N/A'}"`,
            `"${b.service?.title || 'General Service'}"`,
            b.payment?.amount || b.service?.price || 0,
            b.status || 'Pending',
            `"${b.schedule?.date || 'N/A'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `VehicleeCare_Garage_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (triggerAlert) triggerAlert("Report exported successfully as CSV!", "success");
    };

    if (loading && !lastRefreshed) {
        return <ReportsSkeleton />;
    }

    return (
        <div className={`space-y-4.5 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] pb-10 transition-all duration-300`}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
                <div>
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Reports & Analytics</h1>
                    {/* <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider mt-0.5">Real-time Performance, Financial Revenue, & Service Fulfillment</p> */}
                </div>

                <div className="flex flex-wrap items-center gap-3 ">
                    {/* Time Filter Pills */}
                    <div className="bg-white border border-[#e6f0fa] rounded-[14px] shadow-xs flex items-center uppercase text-[13px] font-semibold">
                        <button
                            onClick={() => setTimeFilter('all')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeFilter === 'all' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setTimeFilter('this_month')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeFilter === 'this_month' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setTimeFilter('last_30')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeFilter === 'last_30' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setTimeFilter('last_6_months')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeFilter === 'last_6_months' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            6 Months
                        </button>
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={exportCSV}
                        className="px-8 py-1.25 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-[14px] text-[14px] font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Download size={15.5} />
                        EXPORT CSV
                    </button>

                    {/* <div className="text-[11px] uppercase text-gray-400 font-medium flex items-center gap-2 pl-2">
                        {loading && !lastRefreshed ? (
                            <span>Syncing...</span>
                        ) : lastRefreshed ? (
                            <span>
                                {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        ) : null}
                        {loading && lastRefreshed && (
                            <Loader2 size={12} className="animate-spin text-blue-500" />
                        )}
                    </div> */}
                </div>
            </div>

            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
                {/* Revenue Card */}
                <div className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Income</p>
                        <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>{isGuest ? '₹••••••' : `₹${stats.revenue.toLocaleString()}`}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                            Revenue
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            AOV: <span className={`font-semibold text-gray-700 ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>{isGuest ? '₹••••/order' : `₹${stats.avgOrderValue.toLocaleString()}/order`}</span>
                        </p>
                    </div>
                </div>

                {/* Finalized Services Card */}
                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Services Finalized</p>
                        <h3 className="text-2xl font-bold text-[#011023]">{stats.completed} <span className="text-xs text-gray-400 font-normal">/ {stats.total}</span></h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full uppercase">
                            Output
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            Active Jobs: <span className="font-semibold text-gray-700">{stats.inProgress}</span>
                        </p>
                    </div>
                </div>

                {/* Efficiency Protocol Card */}
                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Success Protocol</p>
                        <h3 className="text-2xl font-bold text-[#011023]">{stats.efficiency}%</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                            Efficiency
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            Pending Protocol: <span className="font-semibold text-gray-700">{stats.pending}</span>
                        </p>
                    </div>
                </div>

                {/* In-Shop Volume Card */}
                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">In-Shop Volume</p>
                        <h3 className="text-2xl font-bold text-[#011023]">{stats.inProgress}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full uppercase">
                            Volume
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            Cancelled Rate: <span className="font-semibold text-gray-700">{stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5">
                {/* Revenue Stream Bar Chart (8 Cols) */}
                <div className="lg:col-span-8 bg-[#ffffff] border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-[#011023] uppercase tracking-tight flex items-center gap-2">
                                    Revenue Stream & Orders
                                </h2>
                                <p className="text-xs text-gray-400 uppercase font-semibold mt-0.5">Monthly Earnings Breakdown</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                                Real-Time Data
                            </span>
                        </div>

                        {/* Interactive Bar Chart Visualization */}
                        <div className="flex items-end justify-between h-56 gap-3 pt-4 pb-3 border-b border-gray-100 relative">
                            {revenueChartData.map((item, i) => (
                                <div 
                                    key={i} 
                                    className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer"
                                    onMouseEnter={() => setActiveHoverBar(i)}
                                    onMouseLeave={() => setActiveHoverBar(null)}
                                >
                                    {/* Tooltip on Hover */}
                                    {activeHoverBar === i && (
                                        <div className="absolute -top-10.5 z-20 bg-[#011023] text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl uppercase whitespace-nowrap animate-in fade-in zoom-in duration-150">
                                            {isGuest ? '₹••••' : `₹${item.revenue.toLocaleString()}`} ({item.count} orders)
                                        </div>
                                    )}

                                    <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-40 flex items-end">
                                        <div 
                                            className="w-full bg-gradient-to-t from-[#052558] to-blue-500 rounded-t-xl transition-all duration-700 group-hover:from-blue-600 group-hover:to-blue-400"
                                            style={{ height: `${item.heightPct}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                            Total Billed Revenue
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                            Average Monthly: <span className={`text-[#011023] font-extrabold ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>{isGuest ? '₹••••••' : `₹${Math.round(stats.revenue / Math.max(revenueChartData.length, 1)).toLocaleString()}`}</span>
                        </p>
                    </div>
                </div>

                {/* Service Category & Fuel Breakdown (4 Cols) */}
                <div className="lg:col-span-4 bg-[#ffffff] border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                    <div>
                        <h2 className="text-lg font-bold text-[#011023] uppercase tracking-tight mb-1 flex items-center gap-2">
                            Vehicle Fuel Type Distribution
                        </h2>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-3">Share of Services by Fuel Type</p>

                        {/* Circular Donut Container */}
                        <div className="flex items-center justify-center py-1 relative">
                            {/* Donut Chart Ring with SVG Rounded Segments & External Floating Tooltip */}
                            <div className="relative shrink-0 flex items-center justify-center overflow-visible">
                                <svg viewBox="0 0 160 160" className="w-44 h-44 -rotate-90 transform drop-shadow-xs overflow-visible">
                                    {donutSegments.length === 0 ? (
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="54"
                                            fill="transparent"
                                            stroke="#e9f2fb"
                                            strokeWidth="20"
                                        />
                                    ) : (
                                        donutSegments.map((seg, i) => (
                                            <circle
                                                key={i}
                                                cx="80"
                                                cy="80"
                                                r="54"
                                                fill="transparent"
                                                stroke={seg.hex}
                                                strokeWidth={activeHoverFuel?.label === seg.label ? "25" : "20"}
                                                strokeLinecap="round"
                                                strokeDasharray={seg.dasharray}
                                                strokeDashoffset={seg.dashoffset}
                                                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                                                onMouseEnter={() => setActiveHoverFuel(seg)}
                                                onMouseLeave={() => setActiveHoverFuel(null)}
                                            />
                                        ))
                                    )}
                                </svg>

                                {/* Center Display: Always Shows 55 VEHICLES */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                                    <span className="text-3xl font-black text-[#011023] leading-none mb-0.5">{filteredBookings.length}</span>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">VEHICLES</span>
                                </div>

                                {/* Floating Dark Tooltip Pill Card positioned over the hovered arc segment */}
                                {activeHoverFuel && (
                                    <div 
                                        className="absolute z-30 bg-[#090d16]/95 text-white px-3 py-1 rounded-full shadow-2xl border border-gray-700/80 flex items-center gap-2.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                                        style={{
                                            left: `${activeHoverFuel.tooltipX}px`,
                                            top: `${activeHoverFuel.tooltipY}px`
                                        }}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-[3px] shrink-0" 
                                            style={{ backgroundColor: activeHoverFuel.hex }} 
                                        />
                                        <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wider">{activeHoverFuel.label}</span>
                                        <span className="text-sm font-black text-white font-mono">{activeHoverFuel.count}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                        <span>Total Vehicles Serviced</span>
                        <span className="text-[#011023] font-bold">{filteredBookings.length} Vehicles</span>
                    </div>
                </div>
            </div>

            {/* Top Performing Services & Recent Orders Table */}
            <div className="bg-[#ffffff] border border-[#e6f0fa] rounded-2xl shadow-xs p-4.5 h-[388px]">
                <div className="flex justify-between items-center mb-8.5">
                    <div>
                        <h2 className="text-lg font-bold text-[#011023] uppercase tracking-tight flex items-center gap-2">
                            Service Performance Ranking
                        </h2>
                        <p className="text-xs text-gray-400 uppercase font-semibold mt-0.5">Top Most Requested Service Packages in Your Garage</p>
                    </div>
                </div>

                {topServices.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-gray-400 uppercase font-medium text-center">No service data available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {topServices.map((srv, i) => (
                            <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-all">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                        {i + 1}
                                    </span>
                                    <div className="space-y-0.5 min-w-0">
                                        <h5 className="font-semibold text-[#011023] text-[14px] uppercase truncate">{srv.title}</h5>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase">Total Orders: <span className="font-bold text-gray-700">{srv.count}</span></p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`font-semibold text-[14px] text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>{isGuest ? '₹••••' : `₹${srv.revenue.toLocaleString()}`}</span>
                                    <p className="text-[11px] font-semibold text-emerald-600 uppercase">{srv.pct}% of total</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
