import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    IndianRupee,
    TrendingUp,
    PieChart as PieChartIcon,
    Wallet,
    Landmark,
    Calendar,
    RefreshCw,
    CheckCircle2,
    Clock,
    Layers,
    ArrowUpRight,
    CreditCard,
    Smartphone,
    Building2,
    ShieldCheck,
    Loader2,
    Download
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { SkeletonBlock } from '../components/Skeleton';
import useGuestGuard from '../hooks/useGuestGuard';
import { defaultServicesList } from '../data/servicesData';
import API_BASE_URL from '../config/api';

// Module-level caches for instant 0ms revisits
let cachedPayments = null;
let cachedBookings = null;
let cachedRevenueTimestamp = 0;

const COLORS = ['#052558', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCompact = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num.toLocaleString('en-IN')}`;
};

// Custom tooltip for Area Chart
const CustomAreaTooltip = ({ active, payload, label, chartMetric, isGuest }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-[#052558] text-white p-3.5 rounded-2xl shadow-xl border border-white/20 text-xs uppercase tracking-wider backdrop-blur-md">
                <p className="font-bold text-slate-300 mb-2 border-b border-white/10 pb-1">{item.fullLabel || label}</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Realized:
                    </span>
                    <span className="font-black text-white">{isGuest ? '₹••••••' : formatCurrency(item.revenue)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1.5">
                    <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Transactions:
                    </span>
                    <span className="font-black text-white">{item.count} orders</span>
                </div>
                {item.count > 0 && (
                    <div className="flex items-center justify-between gap-4 mt-1.5 text-[10px] text-gray-300 pt-1 border-t border-white/10">
                        <span>Avg Ticket:</span>
                        <span className="font-bold text-amber-300">{isGuest ? '₹••••' : formatCurrency(item.revenue / item.count)}</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

// Custom tooltip for Donut Chart
const CustomPieTooltip = ({ active, payload, isGuest }) => {
    if (active && payload && payload.length) {
        const item = payload[0];
        return (
            <div className="bg-[#052558] text-white p-2.5 rounded-xl shadow-lg border border-white/20 text-xs uppercase backdrop-blur-md">
                <p className="font-bold text-slate-200 mb-1">{item.name}</p>
                <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-black">{isGuest ? '₹••••••' : formatCurrency(item.value)}</span>
                    <span className="text-gray-300 text-[10px]">({item.payload.percent || 0}%)</span>
                </div>
            </div>
        );
    }
    return null;
};

const Revenue = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { isGuest, guardGuestAction } = useGuestGuard();

    const [payments, setPayments] = useState(() => Array.isArray(cachedPayments) ? cachedPayments : []);
    const [bookings, setBookings] = useState(() => Array.isArray(cachedBookings) ? cachedBookings : []);
    const [loading, setLoading] = useState(() => !cachedPayments || !cachedBookings);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedRevenueTimestamp ? new Date(cachedRevenueTimestamp) : null);

    // Filters and View Toggles
    const [timeRange, setTimeRange] = useState('all'); // 'all' | 'this_month' | 'last_30' | 'last_6_months'
    const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'count'
    const [breakdownView, setBreakdownView] = useState('method'); // 'method' | 'category' | 'type'

    const isFetchingRef = useRef(false);

    // Fetch live payments and bookings concurrently
    const fetchFinancialData = useCallback(async (silent = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && (!cachedPayments || cachedPayments.length === 0)) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const [paymentsRes, bookingsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/payments/all`),
                fetch(`${API_BASE_URL}/api/bookings`)
            ]);

            const paymentsJson = await paymentsRes.json();
            const bookingsJson = await bookingsRes.json();

            const pData = (paymentsJson.success && Array.isArray(paymentsJson.data)) ? paymentsJson.data : [];
            const bData = (bookingsJson.success && Array.isArray(bookingsJson.data)) ? bookingsJson.data : [];

            cachedPayments = pData;
            cachedBookings = bData;
            cachedRevenueTimestamp = Date.now();

            setPayments(pData);
            setBookings(bData);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('[Revenue] Failed to fetch live financial ledger:', err);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFinancialData(!!cachedPayments);
        if (isGuest) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchFinancialData(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchFinancialData, isGuest]);

    // Service category lookup table
    const serviceCategoryMap = useMemo(() => {
        const map = new Map();
        defaultServicesList.forEach(s => {
            if (s.name) map.set(s.name.toLowerCase().trim(), s.category);
        });
        return map;
    }, []);

    // Time-filtered datasets
    const filteredPayments = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return payments.filter(p => {
            const dateVal = p.date || p.createdAt;
            if (!dateVal) return timeRange === 'all';
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return timeRange === 'all';

            if (timeRange === 'this_month') {
                return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            }
            if (timeRange === 'last_30') {
                const diffDays = (now - d) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 30;
            }
            if (timeRange === 'last_6_months') {
                const diffDays = (now - d) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 180;
            }
            return true;
        });
    }, [payments, timeRange]);

    // Financial KPI Summary
    const stats = useMemo(() => {
        let grossRealized = 0;
        let realizedCount = 0;
        let pendingPipeline = 0;
        let pendingCount = 0;
        let failedAmount = 0;
        let failedCount = 0;

        const now = new Date();
        const todayDateStr = now.toISOString().split('T')[0];
        let todayRev = 0;
        let todayCount = 0;
        let garageRev = 0;
        let garageCount = 0;
        let subRev = 0;
        let subCount = 0;

        let parkingRev = 0;
        let parkingCount = 0;
        let chargingRev = 0;
        let chargingCount = 0;

        filteredPayments.forEach(p => {
            const amt = Number(p.amount) || 0;
            const pDate = p.date ? new Date(p.date).toISOString().split('T')[0] : '';

            if (p.status === 'Completed') {
                grossRealized += amt;
                realizedCount += 1;
                if (pDate === todayDateStr) {
                    todayRev += amt;
                    todayCount += 1;
                }
                if (p.type === 'Subscription') {
                    subRev += amt;
                    subCount += 1;
                } else {
                    garageRev += amt;
                    garageCount += 1;
                }

                // Parking & Charging Station revenue attribution
                // Only attribute if payment or booking is explicitly a parking or charging station transaction
                const pType = (p.type || '').toLowerCase();
                const bType = (p.booking?.type || '').toLowerCase();
                if (pType === 'parking' || bType === 'parking' || pType === 'parking_station') {
                    parkingRev += amt;
                    parkingCount += 1;
                }
                if (pType === 'charging' || bType === 'charging' || pType === 'charging_station') {
                    chargingRev += amt;
                    chargingCount += 1;
                }
            } else if (p.status === 'Pending') {
                pendingPipeline += amt;
                pendingCount += 1;
            } else if (p.status === 'Failed') {
                failedAmount += amt;
                failedCount += 1;
            }
        });

        const totalTransactions = realizedCount + pendingCount + failedCount;
        const realizationRate = totalTransactions > 0 ? ((realizedCount / totalTransactions) * 100).toFixed(1) : 100;
        const avgTicketSize = realizedCount > 0 ? (grossRealized / realizedCount) : 0;

        return {
            grossRealized,
            realizedCount,
            pendingPipeline,
            pendingCount,
            todayRev,
            todayCount,
            garageRev,
            garageCount,
            subRev,
            subCount,
            parkingRev,
            parkingCount,
            chargingRev,
            chargingCount,
            avgTicketSize,
            realizationRate,
            totalTransactions
        };
    }, [filteredPayments]);

    // Timeline Area Chart Data
    const timelineData = useMemo(() => {
        if (!filteredPayments.length) return [];

        const isShortRange = timeRange === 'last_30' || timeRange === 'this_month';
        const bucketMap = new Map();
        const now = new Date();

        if (isShortRange) {
            let start = new Date();
            let end = new Date();

            if (timeRange === 'this_month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (timeRange === 'last_30') {
                start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
                end = new Date(now);
            }

            const curr = new Date(start);
            while (curr <= end) {
                const key = curr.toISOString().split('T')[0];
                const label = curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                const fullLabel = curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                bucketMap.set(key, { key, name: label, fullLabel, revenue: 0, count: 0 });
                curr.setDate(curr.getDate() + 1);
            }
        } else {
            let startYear = now.getFullYear();
            let startMonth = now.getMonth();
            let endYear = now.getFullYear();
            let endMonth = now.getMonth();

            if (timeRange === 'last_6_months') {
                const startD = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                startYear = startD.getFullYear();
                startMonth = startD.getMonth();
            } else {
                // All Time: find earliest completed payment date
                const validDates = filteredPayments
                    .filter(p => p.status === 'Completed' && (p.date || p.createdAt))
                    .map(p => new Date(p.date || p.createdAt).getTime())
                    .filter(t => !isNaN(t));

                if (validDates.length > 0) {
                    const minDate = new Date(Math.min(...validDates));
                    startYear = minDate.getFullYear();
                    startMonth = minDate.getMonth();
                } else {
                    startYear = now.getFullYear();
                    startMonth = Math.max(0, now.getMonth() - 6);
                }
            }

            const curr = new Date(startYear, startMonth, 1);
            const end = new Date(endYear, endMonth, 1);

            while (curr <= end) {
                const m = String(curr.getMonth() + 1).padStart(2, '0');
                const key = `${curr.getFullYear()}-${m}`;
                const label = curr.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                const fullLabel = curr.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                bucketMap.set(key, { key, name: label, fullLabel, revenue: 0, count: 0 });
                curr.setMonth(curr.getMonth() + 1);
            }
        }

        // Aggregate actual payments into pre-filled continuous buckets
        filteredPayments.forEach(p => {
            if (p.status !== 'Completed') return;
            const dateVal = p.date || p.createdAt;
            if (!dateVal) return;
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return;

            let key = '';
            if (isShortRange) {
                key = d.toISOString().split('T')[0];
            } else {
                const m = String(d.getMonth() + 1).padStart(2, '0');
                key = `${d.getFullYear()}-${m}`;
            }

            const amt = Number(p.amount) || 0;
            if (bucketMap.has(key)) {
                const entry = bucketMap.get(key);
                entry.revenue += amt;
                entry.count += 1;
            } else {
                const label = isShortRange
                    ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                const fullLabel = isShortRange
                    ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                bucketMap.set(key, { key, name: label, fullLabel, revenue: amt, count: 1 });
            }
        });

        const arr = Array.from(bucketMap.values());
        arr.sort((a, b) => a.key.localeCompare(b.key));
        arr.forEach(item => {
            item.revenue = Math.round(item.revenue * 100) / 100;
        });
        return arr;
    }, [filteredPayments, timeRange]);

    // Breakdown Donut Chart Data
    const breakdownData = useMemo(() => {
        const groupMap = {};
        let totalCompleted = 0;

        filteredPayments.forEach(p => {
            if (p.status !== 'Completed') return;
            const amt = Number(p.amount) || 0;
            totalCompleted += amt;

            let groupKey = 'Other';

            if (breakdownView === 'method') {
                groupKey = p.method || 'Unknown';
            } else if (breakdownView === 'type') {
                groupKey = p.type || 'Booking';
            } else if (breakdownView === 'category') {
                // Extract from booking service
                const title = p.booking?.service?.title || '';
                if (title) {
                    const firstService = title.split(',')[0].trim().toLowerCase();
                    groupKey = serviceCategoryMap.get(firstService) || 'General Maintenance';
                } else {
                    groupKey = 'General Maintenance';
                }
            }

            groupMap[groupKey] = (groupMap[groupKey] || 0) + amt;
        });

        const list = Object.entries(groupMap).map(([name, value]) => {
            const roundedVal = Math.round(value * 100) / 100;
            const percent = totalCompleted > 0 ? ((roundedVal / totalCompleted) * 100).toFixed(1) : '0';
            return { name, value: roundedVal, percent };
        });

        return list.sort((a, b) => b.value - a.value);
    }, [filteredPayments, breakdownView, serviceCategoryMap]);

    // Category Performance Ranking
    const categoryRankings = useMemo(() => {
        const catMap = {};
        let grandTotal = 0;

        filteredPayments.forEach(p => {
            if (p.status !== 'Completed') return;
            const amt = Number(p.amount) || 0;
            grandTotal += amt;

            const title = p.booking?.service?.title || '';
            const services = title ? title.split(',').map(s => s.trim()).filter(Boolean) : ['General Service'];
            const apportionedAmt = amt / services.length;

            services.forEach(sName => {
                const cat = serviceCategoryMap.get(sName.toLowerCase()) || 'General Maintenance';
                if (!catMap[cat]) {
                    catMap[cat] = { category: cat, revenue: 0, orders: 0 };
                }
                catMap[cat].revenue += apportionedAmt;
                catMap[cat].orders += 1;
            });
        });

        return Object.values(catMap)
            .map(item => ({
                ...item,
                revenue: Math.round(item.revenue * 100) / 100,
                percent: grandTotal > 0 ? Math.min(100, Math.round((item.revenue / grandTotal) * 100)) : 0
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);
    }, [filteredPayments, serviceCategoryMap]);

    // Recent Verified Transactions
    const recentTransactions = useMemo(() => {
        return [...filteredPayments]
            .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
            .slice(0, 7);
    }, [filteredPayments]);

    // Export CSV Feature
    const exportCSV = () => {
        if (guardGuestAction && guardGuestAction()) return;
        if (filteredPayments.length === 0) return;

        const headers = ["Payment ID", "Transaction ID", "Customer Name", "Customer Email", "Service / Vehicle", "Method", "Status", "Amount (INR)", "Date"];
        const rows = filteredPayments.map(p => [
            p.paymentId || p._id,
            p.transactionId || 'N/A',
            `"${p.user?.name || 'Customer'}"`,
            `"${p.user?.email || 'N/A'}"`,
            `"${p.booking?.service?.title || p.type || 'Booking'}"`,
            p.method || 'Net Banking',
            p.status || 'Completed',
            p.amount || 0,
            p.date ? new Date(p.date).toISOString().split('T')[0] : 'N/A'
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `revenue_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] flex flex-col transition-all duration-300 relative`}>
            {/* Header with Title and Time Filter Pills & Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Revenue Analytics</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Filter Pills */}
                    <div className="bg-white border border-[#e6f0fa] rounded-[14px] shadow-xs flex items-center uppercase text-[13px] font-semibold">
                        <button
                            onClick={() => setTimeRange('all')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeRange === 'all' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setTimeRange('this_month')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeRange === 'this_month' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setTimeRange('last_30')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeRange === 'last_30' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setTimeRange('last_6_months')}
                            className={`px-3.5 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${timeRange === 'last_6_months' ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold' : 'text-gray-500 hover:text-[#3730a3] border border-transparent'}`}
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
                </div>
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4.5 pr-1 pb-4 hide-scrollbar">
                {/* Primary Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <SkeletonBlock className="h-3 w-20 bg-slate-200 rounded" />
                                    <SkeletonBlock className="h-7 w-28 bg-slate-200 rounded-md" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <SkeletonBlock className="h-5 w-16 bg-slate-200 rounded-full" />
                                    <SkeletonBlock className="h-3.5 w-24 bg-slate-200 rounded" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {/* Total Income Card */}
                            <div className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Income</p>
                                    <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                        {isGuest ? '₹••••••' : `₹${Math.round(stats.grossRealized).toLocaleString('en-IN')}`}
                                    </h3>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                                        Revenue
                                    </span>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                        AOV: <span className={`font-semibold text-gray-700 ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                            {isGuest ? '₹••••/order' : `₹${Math.round(stats.avgTicketSize).toLocaleString('en-IN')}/order`}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Today's Revenue Card */}
                            <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Today's Revenue</p>
                                    <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                        {isGuest ? '₹••••••' : formatCurrency(stats.todayRev)}
                                    </h3>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full uppercase">
                                        Daily
                                    </span>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                        Orders: <span className="font-semibold text-gray-700">{stats.todayCount} today</span>
                                    </p>
                                </div>
                            </div>

                            {/* Subscription Revenue Card */}
                            <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Subscription </p>
                                    <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                        {isGuest ? '₹••••••' : formatCurrency(stats.subRev)}
                                    </h3>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full uppercase">
                                        Subscription
                                    </span>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                        Subscribed: <span className="font-semibold text-gray-700">{stats.subCount} active</span>
                                    </p>
                                </div>
                            </div>

                            {/* Garage Revenue Card */}
                            <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Garage Revenue</p>
                                    <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                        {isGuest ? '₹••••••' : formatCurrency(stats.garageRev)}
                                    </h3>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                                        Garage
                                    </span>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                        Fulfilled: <span className="font-semibold text-gray-700">{stats.garageCount} jobs</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Interactive Charts: Timeline & Operational Inflows */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Left: Revenue Velocity Timeline */}
                    <div className="lg:col-span-3 bg-white border border-[#e9f2fb] px-4.5 py-3.5 rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5">
                                <div>
                                    <h2 className="text-lg font-bold text-[#011023] uppercase tracking-wide">
                                        Revenue Velocity Timeline
                                    </h2>
                                    <p className="text-[11px] text-gray-400 uppercase font-semibold">
                                        Historical realized inflows over selected period
                                    </p>
                                </div>
                            </div>

                            {/* Metric Toggle */}
                            <div className="bg-white border border-[#e6f0fa] rounded-[14px] shadow-xs flex items-center uppercase text-[13px] font-semibold self-start sm:self-auto">
                                <button
                                    onClick={() => setChartMetric('revenue')}
                                    className={`px-3.5 py-0.75 text-[12.5px] rounded-xl transition-all uppercase cursor-pointer ${
                                        chartMetric === 'revenue'
                                            ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold'
                                            : 'text-gray-500 hover:text-[#3730a3] border border-transparent'
                                    }`}
                                >
                                    Revenue
                                </button>
                                <button
                                    onClick={() => setChartMetric('count')}
                                    className={`px-3.5 py-0.75 text-[12.5px] rounded-xl transition-all uppercase cursor-pointer ${
                                        chartMetric === 'count'
                                            ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold'
                                            : 'text-gray-500 hover:text-[#3730a3] border border-transparent'
                                    }`}
                                >
                                    Volume
                                </button>
                            </div>
                        </div>

                        {/* Area Chart Container */}
                        <div className="flex-1 w-full">
                            {loading ? (
                                <div className="h-[270px] w-full flex flex-col justify-between pt-4 pb-2 relative">
                                    {/* Grid Lines + Y-Axis Skeletons */}
                                    <div className="absolute inset-0 flex flex-col justify-between pt-5 pb-9 pointer-events-none">
                                        {[800, 600, 400, 200].map((_, i) => (
                                            <div key={i} className="flex items-center gap-2 w-full">
                                                <SkeletonBlock className="h-2.5 w-6 bg-slate-200/60 rounded shrink-0" />
                                                <div className="h-[1px] w-full bg-[#eef2f6]" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* SVG Wave Skeleton */}
                                    <div className="flex-1 w-full relative flex items-end pl-8">
                                        <svg className="w-full h-[175px]" preserveAspectRatio="none" viewBox="0 0 700 175">
                                            <defs>
                                                <linearGradient id="skelWaveGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d="M 0,90 Q 70,25 150,25 T 300,120 T 450,145 T 600,135 T 700,130 L 700,175 L 0,175 Z"
                                                fill="url(#skelWaveGrad)"
                                                className="animate-pulse"
                                            />
                                            <path
                                                d="M 0,90 Q 70,25 150,25 T 300,120 T 450,145 T 600,135 T 700,130"
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="3"
                                                strokeOpacity={0.45}
                                                className="animate-pulse"
                                            />
                                        </svg>
                                    </div>

                                    {/* Bottom X-Axis Ticks */}
                                    <div className="flex justify-between pl-8 pr-1 pt-2 border-t border-[#e2e8f0]">
                                        {['Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26'].map((_, i) => (
                                            <SkeletonBlock key={i} className="h-2.5 w-8 bg-slate-200/70 rounded" />
                                        ))}
                                    </div>
                                </div>
                            ) : timelineData.length === 0 ? (
                                <div className="h-[270px] flex flex-col items-center justify-center text-gray-400 text-xs uppercase font-medium">
                                    No completed revenue recorded for this period.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={270}>
                                    <AreaChart data={timelineData} margin={{ top: 20, right: 20, left: -22, bottom: -10 }}>
                                        <defs>
                                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                            </linearGradient>
                                            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                                        <XAxis
                                            dataKey="name"
                                            interval={timelineData.length > 15 ? 'preserveStartEnd' : 0}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => {
                                                if (!v || v === 0) return '';
                                                return chartMetric === 'revenue' ? formatCompact(v) : v;
                                            }}
                                        />
                                        <Tooltip content={<CustomAreaTooltip chartMetric={chartMetric} isGuest={isGuest} />} />
                                        {chartMetric === 'revenue' ? (
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#revGrad)"
                                            />
                                        ) : (
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#volGrad)"
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Right: Operational Overview & Vertical Streams */}
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex items-center justify-between">
                                    <div className="space-y-1.5">
                                        <SkeletonBlock className="h-3 w-24 bg-slate-200 rounded" />
                                        <SkeletonBlock className="h-7 w-28 bg-slate-200 rounded-md" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <SkeletonBlock className="h-5 w-16 bg-slate-200 rounded-full" />
                                        <SkeletonBlock className="h-3.5 w-24 bg-slate-200 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                {/* Parking Revenue Card */}
                                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Parking Revenue</p>
                                        <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                            {isGuest ? '₹••••••' : formatCurrency(stats.parkingRev)}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-full uppercase">
                                            Parking
                                        </span>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                            Fulfilled: <span className="font-semibold text-gray-700">{stats.parkingCount} {stats.parkingCount === 1 ? 'spot' : 'spots'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Charging Station Revenue Card */}
                                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Charging Revenue</p>
                                        <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                            {isGuest ? '₹••••••' : formatCurrency(stats.chargingRev)}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full uppercase">
                                            Charging
                                        </span>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                            Fulfilled: <span className="font-semibold text-gray-700">{stats.chargingCount} {stats.chargingCount === 1 ? 'session' : 'sessions'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Pending Revenue Card */}
                                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Revenue</p>
                                        <h3 className={`text-2xl font-bold text-[#011023] ${isGuest ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                            {isGuest ? '₹••••••' : formatCurrency(stats.pendingPipeline)}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full uppercase">
                                            Volume
                                        </span>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                            Pending Rate: <span className="font-semibold text-gray-700">
                                                {stats.totalTransactions > 0 ? Math.round((stats.pendingCount / stats.totalTransactions) * 100) : 0}%
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Efficiency Protocol Card */}
                                <div className="bg-[#ffffff] border border-[#e6f0fa] px-4 py-3 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Success Protocol</p>
                                        <h3 className="text-2xl font-bold text-[#011023]">{stats.realizationRate}%</h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                                            Efficiency
                                        </span>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                                            Pending Orders: <span className="font-semibold text-gray-700">{stats.pendingCount}</span>
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Section: Distribution Breakdowns & Recent Verified Inflows */}
                <div className="space-y-6">
                    {/* Visual Distributions: Inflow Breakdown & Category Realization */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Right: Revenue Stream Breakdown */}
                        <div className="bg-white border border-[#e9f2fb] px-4.5 py-3.5 rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex flex-col">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div>
                                        <h2 className="text-base font-bold text-[#011023] uppercase tracking-wide">
                                            Inflow Distribution
                                        </h2>
                                        <p className="text-[11px] text-gray-400 uppercase font-semibold">
                                            Revenue mix by channel
                                        </p>
                                    </div>
                                </div>

                                {/* Breakdown Switcher */}
                                <div className="bg-white border border-[#e6f0fa] rounded-[14px] shadow-xs flex items-center uppercase text-[13px] font-semibold self-start sm:self-auto">
                                    {[
                                        { id: 'method', label: 'Method' },
                                        { id: 'category', label: 'Category' },
                                        { id: 'type', label: 'Type' }
                                    ].map(btn => (
                                        <button
                                            key={btn.id}
                                            onClick={() => setBreakdownView(btn.id)}
                                            className={`px-3.5 py-0.75 text-[12.5px] rounded-xl transition-all uppercase cursor-pointer ${
                                                breakdownView === btn.id
                                                    ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold'
                                                    : 'text-gray-500 hover:text-[#3730a3] border border-transparent'
                                            }`}
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Donut Chart and Legend */}
                            <div className="flex-1 flex flex-col justify-center">
                                {loading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-44">
                                        {/* Left: Donut Skeleton matching 150px diameter */}
                                        <div className="h-44 relative flex items-center justify-center">
                                            <div className="w-[150px] h-[150px] rounded-full border-[19px] border-slate-200/80 animate-pulse flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">Total</span>
                                                    <SkeletonBlock className="h-4 w-12 bg-slate-200 rounded" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Legend Skeletons */}
                                        <div className="space-y-2.5 max-h-44 overflow-hidden pr-1">
                                            {[...Array(3)].map((_, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs py-1">
                                                    <div className="flex items-center gap-2">
                                                        <SkeletonBlock className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-200" />
                                                        <SkeletonBlock className={`h-3 ${idx === 0 ? 'w-24' : idx === 1 ? 'w-20' : 'w-16'} bg-slate-200 rounded`} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <SkeletonBlock className="h-3.5 w-16 bg-slate-200 rounded" />
                                                        <SkeletonBlock className="h-3 w-8 bg-slate-200 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : breakdownData.length === 0 ? (
                                    <div className="h-44 flex items-center justify-center text-xs text-gray-400 uppercase">
                                        No completed transactions.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                        {/* Left: Donut Chart */}
                                        <div className="h-44 relative flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={breakdownData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={56}
                                                        outerRadius={75}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                    >
                                                        {breakdownData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomPieTooltip isGuest={isGuest} />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Total</span>
                                                <span className={`text-sm font-black text-[#011023] ${isGuest ? 'blur-sm select-none' : ''}`}>
                                                    {isGuest ? '₹••••' : formatCompact(stats.grossRealized)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: Legend bars */}
                                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1 hide-scrollbar">
                                            {breakdownData.slice(0, 6).map((item, idx) => (
                                                <div key={item.name} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                                        <span className="font-semibold text-gray-700 uppercase truncate text-[11px]">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`font-bold text-[#011023] ${isGuest ? 'blur-sm select-none' : ''}`}>
                                                            {isGuest ? '₹••••••' : formatCurrency(item.value)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 w-9 text-right font-bold">{item.percent}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Leaderboard */}
                        <div className="bg-white border border-[#e9f2fb] px-4.5 py-3.5 rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex flex-col">
                            <div className="flex items-center gap-2.5 mb-3.5">
                                <div>
                                    <h2 className="text-base font-bold text-[#011023] uppercase tracking-wide">
                                        Category Realization
                                    </h2>
                                    <p className="text-[11px] text-gray-400 uppercase font-semibold">
                                        Highest earning service verticals
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-1 hide-scrollbar">
                                {loading ? (
                                    <div className="space-y-3 flex-1">
                                        {[
                                            { titleW: 'w-36', amtW: 'w-14', progW: '34%', subL: 'w-24', subR: 'w-16' },
                                            { titleW: 'w-28', amtW: 'w-12', progW: '10%', subL: 'w-20', subR: 'w-14' },
                                            { titleW: 'w-32', amtW: 'w-12', progW: '8%', subL: 'w-22', subR: 'w-14' },
                                            { titleW: 'w-38', amtW: 'w-12', progW: '7%', subL: 'w-20', subR: 'w-14' },
                                            { titleW: 'w-30', amtW: 'w-12', progW: '7%', subL: 'w-20', subR: 'w-14' },
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-1.5 mt-3">
                                                <div className="flex items-center justify-between">
                                                    <SkeletonBlock className={`h-3 ${item.titleW} bg-slate-200 rounded`} />
                                                    <SkeletonBlock className={`h-3.5 ${item.amtW} bg-slate-200 rounded`} />
                                                </div>
                                                <div className="h-3 bg-[#f0f6ff] rounded-full overflow-hidden border border-[#e6f0fa]">
                                                    <div className="h-full bg-slate-200/80 rounded-full" style={{ width: item.progW }} />
                                                </div>
                                                <div className="flex justify-between">
                                                    <SkeletonBlock className={`h-2.5 ${item.subL} bg-slate-200/60 rounded`} />
                                                    <SkeletonBlock className={`h-2.5 ${item.subR} bg-slate-200/60 rounded`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : categoryRankings.length === 0 ? (
                                    <div className="h-44 flex items-center justify-center text-xs text-gray-400 uppercase">
                                        No category data available.
                                    </div>
                                ) : (
                                    categoryRankings.slice(0, 5).map((cat, i) => (
                                        <div key={cat.category} className="space-y-1 mt-3">
                                            <div className="flex items-center justify-between text-xs uppercase font-semibold">
                                                <span className="text-gray-700 truncate text-[11px]">{cat.category}</span>
                                                <span className={`font-black text-[#011023] shrink-0 ml-2 ${isGuest ? 'blur-sm select-none' : ''}`}>
                                                    {isGuest ? '₹••••••' : formatCurrency(cat.revenue)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[#f0f6ff] rounded-full overflow-hidden border border-[#e6f0fa]">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${Math.max(5, cat.percent)}%`,
                                                        backgroundColor: COLORS[i % COLORS.length]
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                                                <span>{cat.orders} service items</span>
                                                <span>{cat.percent}% share</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Revenue;
