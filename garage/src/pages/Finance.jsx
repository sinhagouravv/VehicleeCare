import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Landmark, AlertCircle, Loader2, ArrowUpRight, CheckCircle2, ChevronRight, DollarSign, Clock } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const Finance = () => {
    const { triggerAlert } = useAlert();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('UPI');
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

    // Fetch payments data (same endpoint as Payments page)
    const fetchFinanceData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/payments/garage/${user.id}`);
            const result = await res.json();
            if (result.success && result.data) {
                setPayments(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching garage payments for finance page:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinanceData();
        const interval = setInterval(() => fetchFinanceData(true), 5000);
        return () => clearInterval(interval);
    }, [fetchFinanceData]);

    // Financial Metrics Calculation
    const financialStats = useMemo(() => {
        const completedPayments = payments.filter(p => p.status === 'Completed');
        
        const totalEarnings = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const pendingClearance = payments
            .filter(p => p.status === 'Pending')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const averageTicket = completedPayments.length > 0 
            ? Math.round(totalEarnings / completedPayments.length) 
            : 0;

        // Payment Method breakdown
        const methodStats = completedPayments.reduce((acc, p) => {
            const m = p.method || 'Cash';
            acc[m] = (acc[m] || 0) + (p.amount || 0);
            return acc;
        }, { UPI: 0, Cash: 0, Card: 0, 'Net Banking': 0 });

        return {
            totalEarnings,
            pendingClearance,
            averageTicket,
            methodStats,
            completedCount: completedPayments.length
        };
    }, [payments]);

    const handleRequestPayout = (e) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) {
            triggerAlert('Please enter a valid payout amount.', 'error');
            return;
        }
        if (amount > financialStats.totalEarnings) {
            triggerAlert('Payout request exceeds available total earnings.', 'error');
            return;
        }

        setIsSubmittingPayout(true);
        setTimeout(() => {
            triggerAlert(`Payout request of ₹${amount.toLocaleString()} via ${payoutMethod} submitted successfully!`, 'success');
            setPayoutAmount('');
            setPayoutModalOpen(false);
            setIsSubmittingPayout(false);
        }, 1200);
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight flex items-center gap-3">
                        Finance Management
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setPayoutModalOpen(true)}
                        className="bg-gradient-to-tr from-[#052558] to-[#527FB0] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        Request Payout
                    </button>
                    <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                        {loading && !lastRefreshed ? (
                            <span>Syncing Ledger...</span>
                        ) : lastRefreshed ? (
                            <span>
                                Last Refreshed | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        ) : null}
                        {loading && lastRefreshed && (
                            <Loader2 size={12} className="animate-spin text-[#527FB0]" />
                        )}
                    </div>
                </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">Settled</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Earnings</p>
                    <h3 className="text-2xl font-black text-[#011023]">₹{financialStats.totalEarnings.toLocaleString()}</h3>
                </div>

                {/* Pending Revenue */}
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase">Uncleared</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Pending Clearance</p>
                    <h3 className="text-2xl font-black text-[#011023]">₹{financialStats.pendingClearance.toLocaleString()}</h3>
                </div>

                {/* Average Ticket Size */}
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl group-hover:scale-110 transition-transform">
                            <Landmark size={24} />
                        </div>
                        <span className="text-[10px] font-black bg-blue-50 text-[#527FB0] px-2 py-1 rounded-lg uppercase">Metrics</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Average Invoice Size</p>
                    <h3 className="text-2xl font-black text-[#011023]">₹{financialStats.averageTicket.toLocaleString()}</h3>
                </div>

                {/* Volume */}
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-2 py-1 rounded-lg uppercase">Transactions</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Settled Invoices</p>
                    <h3 className="text-2xl font-black text-[#011023]">{financialStats.completedCount}</h3>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Method Distribution */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm lg:col-span-1">
                    <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                        <CreditCard className="text-[#527FB0]" size={22} /> Channels
                    </h2>
                    <div className="space-y-6">
                        {[
                            { label: 'UPI Settlements', value: financialStats.methodStats.UPI, color: 'blue' },
                            { label: 'Cash Payments', value: financialStats.methodStats.Cash, color: 'emerald' },
                            { label: 'Card Transactions', value: financialStats.methodStats.Card, color: 'purple' },
                            { label: 'Net Banking', value: financialStats.methodStats['Net Banking'], color: 'amber' }
                        ].map((item, i) => {
                            const total = Object.values(financialStats.methodStats).reduce((s, val) => s + val, 0);
                            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-bold text-[#011023] uppercase opacity-70">{item.label}</span>
                                        <span className="text-xs font-black text-[#011023]">₹{item.value.toLocaleString()} ({percentage}%)</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-white/50">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${item.color === 'blue' ? 'bg-[#052558]' : item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Earnings Projection / Daily Ledger */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-sm lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[#011023] uppercase mb-8 flex items-center gap-3">
                            <TrendingUp className="text-[#527FB0]" size={22} /> Recent Financial Logs
                        </h2>
                        {payments.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">No recent payouts or transactions.</div>
                        ) : (
                            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                                {payments.slice(0, 5).map((p, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white/40 hover:bg-white/70 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#011023] tracking-wide">{p.paymentId}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {p.method}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-[#011023]">₹{p.amount.toLocaleString()}</p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                        <span>Ledger Audit Status: Compliant</span>
                        <span className="text-[#527FB0]">View All Ledger Logs <ChevronRight size={14} className="inline ml-1" /></span>
                    </div>
                </div>
            </div>

            {/* Payout Settlement Dialog */}
            {payoutModalOpen && (
                <div className="fixed inset-0 bg-[#011023]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-[#e6f0fa] rounded-3xl max-w-md w-full shadow-2xl p-8 space-y-6 transform transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-[#011023] uppercase">Request Settlement</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Available to withdraw: ₹{financialStats.totalEarnings.toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => setPayoutModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleRequestPayout} className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">Payout Amount (₹)</label>
                                <input 
                                    type="number"
                                    required
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder="Enter amount to withdraw"
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#527FB0] outline-none rounded-xl p-3 text-sm font-bold text-[#011023]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">Preferred Method</label>
                                <select 
                                    value={payoutMethod}
                                    onChange={(e) => setPayoutMethod(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#527FB0] outline-none rounded-xl p-3 text-sm font-bold text-[#011023]"
                                >
                                    <option value="UPI">UPI Transfer</option>
                                    <option value="Bank Account">Bank Wire</option>
                                    <option value="Direct Cash Settlement">Cash Outflow</option>
                                </select>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmittingPayout}
                                className="w-full bg-gradient-to-tr from-[#052558] to-[#527FB0] text-white p-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmittingPayout ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing Outflow...
                                    </>
                                ) : (
                                    'Submit Outflow Settlement'
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
