import React from 'react';
import { TrendingUp, Users, CalendarCheck, MapPin } from 'lucide-react';

const Dashboard = () => {
    const stats = [
        { title: "Total Bookings", value: "1,284", change: "+12.5%", icon: <CalendarCheck size={24} className="text-[#527FB0]" /> },
        { title: "Active Users", value: "8,591", change: "+5.2%", icon: <Users size={24} className="text-[#527FB0]" /> },
        { title: "Partner Garages", value: "42", change: "+2.1%", icon: <MapPin size={24} className="text-[#527FB0]" /> },
        { title: "Monthly Revenue", value: "₹4.2L", change: "+8.4%", icon: <TrendingUp size={24} className="text-[#527FB0]" /> },
    ];

    return (
        <div className="space-y-8 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Overview</h1>
                    <p className="text-gray-500 font-medium mt-1">Welcome back. Here's what's happening today.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-[0_8px_30px_rgba(5,37,88,0.08)] transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                {stat.icon}
                            </div>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-gray-500 font-semibold text-sm mb-1">{stat.title}</h3>
                        <p className="text-3xl font-black text-[#011023]">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Placeholder for Charts/Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] h-96 flex items-center justify-center">
                    <p className="text-gray-400 font-medium">Revenue Chart Area</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] h-96 flex items-center justify-center">
                    <p className="text-gray-400 font-medium">Recent Activity Log</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
