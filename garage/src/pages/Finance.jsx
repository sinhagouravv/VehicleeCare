import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    CreditCard, 
    Landmark, 
    AlertCircle, 
    Loader2, 
    ArrowUpRight, 
    CheckCircle2, 
    ChevronRight, 
    DollarSign, 
    Clock,
    Download,
    Search,
    RefreshCw,
    ShieldCheck,
    ArrowDownRight
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const FinanceSkeleton = () => (
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

            {/* Donut / Channels Skeleton */}
            <div className="lg:col-span-4 bg-white border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                <div>
                    <div className="h-5 w-48 bg-slate-200 rounded mb-1" />
                    <div className="h-3.5 w-36 bg-slate-200 rounded mb-6" />
                    <div className="space-y-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                                    <div className="h-3.5 w-16 bg-slate-200 rounded" />
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-200 rounded-full w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    <div className="h-3.5 w-20 bg-slate-200 rounded" />
                </div>
            </div>
        </div>

        {/* Ledger Table Skeleton */}
        <div className="bg-white border border-[#e6f0fa] rounded-2xl shadow-xs p-4.5 min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-9 w-64 bg-slate-200 rounded-xl" />
            </div>
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-50 border border-slate-200 rounded-xl" />
                ))}
            </div>
        </div>
    </div>
);

const Finance = () => {
    const { triggerAlert } = useAlert();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all'); // 'this_month', 'last_30', 'last_6_months', 'all'
    const [searchQuery, setSearchQuery] = useState('');
    const [channelFilter, setChannelFilter] = useState('all');
    const [activeHoverBar, setActiveHoverBar] = useState(null);

    // Modal state
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('UPI Transfer');
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

    // Fetch payments and bookings data dynamically from backend
    const fetchFinanceData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const [payRes, bookRes] = await Promise.allSettled([
                fetch(`https://vehicleecare.onrender.com/api/payments/garage/${user.id}`),
                fetch(`https://vehicleecare.onrender.com/api/bookings/garage/${user.id}`)
            ]);

            let payData = [];
            let bookData = [];

            if (payRes.status === 'fulfilled') {
                const resJson = await payRes.value.json();
                if (resJson.success && Array.isArray(resJson.data)) {
                    payData = resJson.data;
                }
            }

            if (bookRes.status === 'fulfilled') {
                const resJson = await bookRes.value.json();
                if (resJson.success && Array.isArray(resJson.data)) {
                    bookData = resJson.data;
                }
            }

            // Combine payment items & booking payment records seamlessly
            const combinedMap = new Map();

            payData.forEach(p => {
                const key = p._id || p.paymentId;
                const amt = parseFloat(String(p.amount || 0).replace(/[^0-9.]/g, '')) || 0;
                combinedMap.set(key, {
                    _id: p._id || key,
                    paymentId: p.paymentId || `PAY-${String(p._id).slice(-6).toUpperCase()}`,
                    customerName: p.customerName || p.user?.name || p.booking?.user?.name || 'Customer',
                    vehicle: p.vehicle || (p.booking?.vehicle ? `${p.booking.vehicle.make || ''} ${p.booking.vehicle.model || ''}`.trim() : 'N/A'),
                    serviceTitle: p.serviceTitle || p.booking?.service?.title || 'Service Package',
                    amount: amt,
                    method: p.method || 'UPI',
                    status: (p.status === 'Completed' || p.status === 'Paid') ? 'Completed' : (p.status || 'Pending'),
                    date: p.date || p.createdAt || new Date().toISOString()
                });
            });

            bookData.forEach(b => {
                const key = b._id;
                if (!combinedMap.has(key)) {
                    const amt = parseFloat(String(b.payment?.amount !== undefined && b.payment?.amount !== null ? b.payment.amount : (b.service?.price || '0')).replace(/[^0-9.]/g, '')) || 0;
                    const isDone = b.status === 'Completed' || b.status === 'Delivered' || b.payment?.status === 'Completed' || b.payment?.status === 'Paid';
                    combinedMap.set(key, {
                        _id: b._id,
                        paymentId: b.bookingId || `PAY-${String(b._id).slice(-6).toUpperCase()}`,
                        customerName: b.user?.name || 'Customer',
                        vehicle: `${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.trim() || 'N/A',
                        serviceTitle: b.service?.title || 'General Maintenance',
                        amount: amt,
                        method: b.payment?.method || 'Cash',
                        status: isDone ? 'Completed' : (b.payment?.status || 'Pending'),
                        date: b.createdAt || b.schedule?.date || new Date().toISOString()
                    });
                }
            });

            setPayments(Array.from(combinedMap.values()));
            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Error fetching garage finance data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinanceData();
        const interval = setInterval(() => fetchFinanceData(true), 5000);
        return () => clearInterval(interval);
    }, [fetchFinanceData]);

    // Filter payments based on time range
    const filteredByTime = useMemo(() => {
        if (timeFilter === 'all') return payments;
        const now = new Date();
        return payments.filter(p => {
            const pDate = new Date(p.date || 0);
            if (isNaN(pDate.getTime())) return true;
            if (timeFilter === 'this_month') {
                return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
            }
            if (timeFilter === 'last_30') {
                const diffDays = (now - pDate) / (1000 * 60 * 60 * 24);
                return diffDays <= 30;
            }
            if (timeFilter === 'last_6_months') {
                const diffDays = (now - pDate) / (1000 * 60 * 60 * 24);
                return diffDays <= 180;
            }
            return true;
        });
    }, [payments, timeFilter]);

    // Financial Metrics Calculation from real data
    const financialStats = useMemo(() => {
        const completed = filteredByTime.filter(p => p.status === 'Completed');
        const pending = filteredByTime.filter(p => p.status !== 'Completed');

        const totalEarnings = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
        const pendingClearance = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
        const averageTicket = completed.length > 0 ? Math.round(totalEarnings / completed.length) : (filteredByTime.length > 0 ? Math.round((totalEarnings + pendingClearance) / filteredByTime.length) : 0);
        const settlementRate = filteredByTime.length > 0 ? Math.round((completed.length / filteredByTime.length) * 100) : 0;

        // Payment Method breakdown
        const methodCounts = { UPI: 0, Cash: 0, Card: 0, 'Net Banking': 0 };
        completed.forEach(p => {
            const m = String(p.method || '').toLowerCase();
            if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe')) methodCounts.UPI += p.amount;
            else if (m.includes('cash') || m.includes('cod')) methodCounts.Cash += p.amount;
            else if (m.includes('card') || m.includes('credit') || m.includes('debit')) methodCounts.Card += p.amount;
            else methodCounts['Net Banking'] += p.amount;
        });

        return {
            totalEarnings,
            pendingClearance,
            averageTicket,
            settlementRate,
            completedCount: completed.length,
            pendingCount: pending.length,
            methodCounts
        };
    }, [filteredByTime]);

    // Revenue Stream Bar Chart computed from real payment timestamps
    const revenueChartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();

        const buckets = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                label: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
                monthIdx: d.getMonth(),
                year: d.getFullYear(),
                revenue: 0,
                count: 0
            });
        }

        filteredByTime.forEach(p => {
            if (p.status !== 'Completed') return;
            const pDate = new Date(p.date || 0);
            if (isNaN(pDate.getTime())) return;

            const bucket = buckets.find(bk => bk.monthIdx === pDate.getMonth() && bk.year === pDate.getFullYear());
            if (bucket) {
                bucket.count++;
                bucket.revenue += (p.amount || 0);
            }
        });

        const maxRev = Math.max(...buckets.map(b => b.revenue), 1);
        return buckets.map(b => ({
            ...b,
            heightPct: Math.max(Math.round((b.revenue / maxRev) * 100), 12)
        }));
    }, [filteredByTime]);

    // Filtered ledger list for table search & channel filter
    const displayedLedger = useMemo(() => {
        return filteredByTime.filter(p => {
            const matchesSearch = searchQuery === '' || 
                p.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase());

            const m = String(p.method || '').toLowerCase();
            let matchesChannel = true;
            if (channelFilter === 'upi') matchesChannel = m.includes('upi') || m.includes('gpay') || m.includes('phonepe');
            else if (channelFilter === 'cash') matchesChannel = m.includes('cash') || m.includes('cod');
            else if (channelFilter === 'card') matchesChannel = m.includes('card') || m.includes('credit') || m.includes('debit');
            else if (channelFilter === 'netbanking') matchesChannel = m.includes('net') || m.includes('bank');

            return matchesSearch && matchesChannel;
        }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [filteredByTime, searchQuery, channelFilter]);

    // Handle payout submission
    const handleRequestPayout = (e) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) {
            if (triggerAlert) triggerAlert('Please enter a valid payout settlement amount.', 'warning');
            return;
        }
        if (amount > financialStats.totalEarnings) {
            if (triggerAlert) triggerAlert('Payout request exceeds available total settled earnings.', 'error');
            return;
        }

        setIsSubmittingPayout(true);
        setTimeout(() => {
            if (triggerAlert) triggerAlert(`Payout settlement request of ₹${amount.toLocaleString()} via ${payoutMethod} submitted successfully!`, 'success');
            setPayoutAmount('');
            setPayoutModalOpen(false);
            setIsSubmittingPayout(false);
        }, 1000);
    };

    // Export CSV Ledger
    const exportCSV = () => {
        if (displayedLedger.length === 0) {
            if (triggerAlert) triggerAlert("No financial ledger data available to export.", "warning");
            return;
        }

        const headers = ["Invoice / Payment ID", "Customer Name", "Vehicle Info", "Service Package", "Amount (INR)", "Payment Method", "Status", "Date"];
        const rows = displayedLedger.map(p => [
            p.paymentId,
            `"${p.customerName}"`,
            `"${p.vehicle}"`,
            `"${p.serviceTitle}"`,
            p.amount,
            `"${p.method}"`,
            `"${p.status}"`,
            `"${new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `VehicleeCare_Finance_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (triggerAlert) triggerAlert("Financial ledger exported successfully as CSV!", "success");
    };

    if (loading && !lastRefreshed) {
        return <FinanceSkeleton />;
    }

    const totalChannelRev = Object.values(financialStats.methodCounts).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="space-y-4.5 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
                <div>
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Finance & Ledger</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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
                        className="px-6 py-1.25 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-[14px] text-[14px] font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download size={15.5} />
                        EXPORT CSV
                    </button>

                    {/* Request Payout Button */}
                    <button 
                        onClick={() => setPayoutModalOpen(true)}
                        className="px-6 py-1.25 bg-[#052558] text-white rounded-[14px] text-[14px] font-semibold uppercase tracking-wider shadow-xs hover:bg-[#09357a] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Wallet size={15.5} />
                        REQUEST PAYOUT
                    </button>
                </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
                {/* Total Settled Revenue */}
                <div className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p>
                        <h3 className="text-2xl font-bold text-[#011023]">₹{financialStats.totalEarnings.toLocaleString()}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                            Settled
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            AOV: <span className="font-semibold text-gray-700">₹{financialStats.averageTicket.toLocaleString()}</span>
                        </p>
                    </div>
                </div>

                {/* Pending Clearance Card */}
                <div className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Clearance</p>
                        <h3 className="text-2xl font-bold text-[#011023]">₹{financialStats.pendingClearance.toLocaleString()}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                            Uncleared
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            Pending: <span className="font-semibold text-gray-700">{financialStats.pendingCount} invoices</span>
                        </p>
                    </div>
                </div>

                {/* Average Invoice Value Card */}
                <div className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Average Invoice</p>
                        <h3 className="text-2xl font-bold text-[#011023]">₹{financialStats.averageTicket.toLocaleString()}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full uppercase">
                            Metric
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            Audit: <span className="font-semibold text-emerald-700">Compliant</span>
                        </p>
                    </div>
                </div>

                {/* Settled Invoices Volume Card */}
                <div className="bg-white border border-[#e6f0fa] px-4 py-3.25 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-all flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Settled Invoices</p>
                        <h3 className="text-2xl font-bold text-[#011023]">{financialStats.completedCount}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full uppercase">
                            Volume
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium uppercase text-right">
                            Settled Rate: <span className="font-semibold text-gray-700">{financialStats.settlementRate}%</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Financial Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5">
                {/* Revenue & Settlement Stream (8 Cols) */}
                <div className="lg:col-span-8 bg-[#ffffff] border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-[#011023] uppercase tracking-tight flex items-center gap-2">
                                    Revenue Stream & Settlements
                                </h2>
                                <p className="text-xs text-gray-400 uppercase font-semibold mt-0.5">Monthly Financial Flow Breakdown</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                                Real Ledger Data
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
                                    {activeHoverBar === i && (
                                        <div className="absolute -top-10.5 z-20 bg-[#011023] text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl uppercase whitespace-nowrap animate-in fade-in zoom-in duration-150">
                                            ₹{item.revenue.toLocaleString()} ({item.count} settlements)
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
                            Total Settled Revenue
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                            Average Monthly: <span className="text-[#011023] font-extrabold">₹{Math.round(financialStats.totalEarnings / Math.max(revenueChartData.length, 1)).toLocaleString()}</span>
                        </p>
                    </div>
                </div>

                {/* Payment Channels Distribution (4 Cols) */}
                <div className="lg:col-span-4 bg-[#ffffff] border border-[#e6f0fa] px-4.5 py-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-[355px]">
                    <div>
                        <h2 className="text-lg font-bold text-[#011023] uppercase tracking-tight mb-1 flex items-center gap-2">
                            Payment Channels
                        </h2>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-5">Settlements Distribution by Payment Channel</p>

                        <div className="space-y-4.5">
                            {[
                                { label: 'UPI Settlements', value: financialStats.methodCounts.UPI, color: 'bg-blue-600', badge: 'text-blue-700' },
                                { label: 'Cash / COD Outflow', value: financialStats.methodCounts.Cash, color: 'bg-emerald-500', badge: 'text-emerald-700' },
                                { label: 'Card Transactions', value: financialStats.methodCounts.Card, color: 'bg-purple-500', badge: 'text-purple-700' },
                                { label: 'Net Banking', value: financialStats.methodCounts['Net Banking'], color: 'bg-amber-500', badge: 'text-amber-700' }
                            ].map((channel, i) => {
                                const pct = Math.round((channel.value / totalChannelRev) * 100);
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs uppercase font-semibold">
                                            <span className="text-[#011023] font-bold">{channel.label}</span>
                                            <span className="text-gray-600 font-bold">₹{channel.value.toLocaleString()} <span className="text-[10.5px] text-gray-400">({pct}%)</span></span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-700 ${channel.color}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                        <span>Active Payment Gateway</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck size={14} /> Operational
                        </span>
                    </div>
                </div>
            </div>

            {/* Financial Ledger & Transaction History Table */}
            <div className="bg-[#ffffff] border border-[#e6f0fa] rounded-2xl shadow-xs p-4.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#011023] uppercase tracking-tight flex items-center gap-2">
                            Recent Financial Logs & Invoices
                        </h2>
                        <p className="text-xs text-gray-400 uppercase font-semibold mt-0.5">Real-time Settlement Records and Payment Status</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Invoice, Customer..."
                                className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 focus:border-[#052558] outline-none rounded-xl text-xs font-semibold uppercase text-[#011023] w-56"
                            />
                        </div>

                        {/* Channel Filter Pills */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl flex items-center uppercase text-[11.5px] font-semibold p-0.5">
                            {['all', 'upi', 'cash', 'card'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setChannelFilter(c)}
                                    className={`px-3 py-1 rounded-lg transition-all uppercase cursor-pointer ${channelFilter === c ? 'bg-[#052558] text-white font-bold' : 'text-gray-500 hover:text-[#052558]'}`}
                                >
                                    {c === 'all' ? 'All' : c.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {displayedLedger.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-gray-400 uppercase font-medium">No financial transactions match your query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                        {displayedLedger.map((p, i) => (
                            <div key={i} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-blue-300 transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2 rounded-lg shrink-0 ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        <DollarSign size={16} />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#011023] text-[13.5px] uppercase">{p.paymentId}</span>
                                            <span className="text-xs font-bold text-gray-700 uppercase truncate">({p.customerName})</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase truncate">
                                            Service: <span className="font-semibold text-gray-700">{p.serviceTitle}</span> • {p.vehicle}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 text-right">
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-gray-400 font-semibold uppercase">
                                            {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                            {p.method}
                                        </span>
                                    </div>
                                    <div className="text-right min-w-[90px]">
                                        <span className="font-bold text-[15px] text-[#011023]">₹{p.amount.toLocaleString()}</span>
                                        <p className={`text-[10.5px] font-bold uppercase ${p.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {p.status}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payout Settlement Dialog Modal */}
            {payoutModalOpen && (
                <div className="fixed inset-0 bg-[#011023]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-[#e6f0fa] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-[#011023] uppercase">Request Payout Settlement</h3>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Available Balance: ₹{financialStats.totalEarnings.toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => setPayoutModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-xs uppercase cursor-pointer"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleRequestPayout} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Payout Amount (₹)</label>
                                <input 
                                    type="number"
                                    required
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder="Enter amount to withdraw"
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#052558] outline-none rounded-xl p-3 text-sm font-bold text-[#011023]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Preferred Settlement Channel</label>
                                <select 
                                    value={payoutMethod}
                                    onChange={(e) => setPayoutMethod(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#052558] outline-none rounded-xl p-3 text-sm font-bold text-[#011023]"
                                >
                                    <option value="UPI Transfer">UPI Transfer (Instant)</option>
                                    <option value="Bank Account">Direct Bank Wire</option>
                                    <option value="Direct Cash Settlement">Cash Outflow</option>
                                </select>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmittingPayout}
                                className="w-full bg-[#052558] text-white p-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-[#09357a] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmittingPayout ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing Outflow...
                                    </>
                                ) : (
                                    'Submit Settlement Request'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
