import React from 'react';
import { TrendingUp, Users, DollarSign, Activity, BarChart2, PieChart } from 'lucide-react';

const Analytics = () => {
    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Analytics Overview</h1>
                <div className="flex gap-3 justify-between">
                    <select className="px-4 py-2.5 bg-white border border-blue-100 rounded-xl text-sm font-bold text-[#052558] focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer shadow-sm">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>This Year</option>
                        <option>All Time</option>
                    </select>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        Download Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={24} /></div>
                        <span className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} className="mr-1" /> +12.5%
                        </span>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Total Revenue</p>
                    <h3 className="text-3xl font-black text-[#011023]">₹4.2M</h3>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><Activity size={24} /></div>
                        <span className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} className="mr-1" /> +8.2%
                        </span>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Service Bookings</p>
                    <h3 className="text-3xl font-black text-[#011023]">1,842</h3>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Users size={24} /></div>
                        <span className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} className="mr-1" /> +24.1%
                        </span>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">New Customers</p>
                    <h3 className="text-3xl font-black text-[#011023]">892</h3>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={24} /></div>
                        <span className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} className="mr-1" /> +4.3%
                        </span>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Conversion Rate</p>
                    <h3 className="text-3xl font-black text-[#011023]">12.8%</h3>
                </div>
            </div>

            {/* Charts Area View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] relative min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-extrabold text-[#011023] flex items-center gap-2">
                            <BarChart2 className="text-[#527FB0]" size={20} /> Revenue Trends
                        </h2>
                    </div>
                    <div className="flex items-center justify-center h-72 border-2 border-dashed border-blue-100 rounded-xl bg-white/40">
                        <p className="text-gray-400 font-medium">Revenue Line Chart Placeholder</p>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] relative min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-extrabold text-[#011023] flex items-center gap-2">
                            <PieChart className="text-[#527FB0]" size={20} /> Popular Services
                        </h2>
                    </div>
                    <div className="flex items-center justify-center h-72 border-2 border-dashed border-blue-100 rounded-xl bg-white/40">
                        <p className="text-gray-400 font-medium">Services Doughnut Chart</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
