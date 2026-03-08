import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';

const Payments = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastRefreshed(new Date());
        }, 5000);
        setLastRefreshed(new Date());
        return () => clearInterval(timer);
    }, []);

    // Mock Data
    const payments = [
        { id: "TXN-001", customer: "Rahul S.", amount: 4200, date: "Oct 24, 2023", status: "completed", type: "income" },
        { id: "TXN-002", customer: "Michael C.", amount: 1500, date: "Oct 23, 2023", status: "pending", type: "income" },
        { id: "TXN-003", customer: "Spare Parts Co.", amount: 8500, date: "Oct 22, 2023", status: "completed", type: "expense" },
        { id: "TXN-004", customer: "Sarah J.", amount: 3200, date: "Oct 21, 2023", status: "completed", type: "income" },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Payments</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : 'Loading…'}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-black text-[#011023]">₹1,24,500</h3>
                    </div>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Inflow (This Month)</p>
                        <h3 className="text-2xl font-black text-[#011023]">₹45,200</h3>
                    </div>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                        <ArrowDownRight size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Expenses (This Month)</p>
                        <h3 className="text-2xl font-black text-[#011023]">₹12,400</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 justify-between items-center bg-white/40">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                        <option>All Transactions</option>
                        <option>Income Only</option>
                        <option>Expenses Only</option>
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/30 border-b border-[#e6f0fa]">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer/Vendor</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50/50">
                            {payments.map((txn) => (
                                <tr key={txn.id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-[#011023] text-sm">{txn.id}</td>
                                    <td className="px-6 py-4 font-medium text-gray-700 text-sm">{txn.customer}</td>
                                    <td className="px-6 py-4 font-medium text-gray-500 text-sm">{txn.date}</td>
                                    <td className={`px-6 py-4 font-black text-sm ${txn.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${txn.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
