import React, { useState } from 'react';
import { LayoutDashboard, Users, CheckCircle, Clock } from 'lucide-react';

const StatsCard = ({ title, value, unit, icon, accentColor = "bg-blue-50 text-blue-500" }) => (
    <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${accentColor}`}>
                {icon}
            </div>
        </div>
        <p className="text-gray-500 font-semibold mb-1 text-sm">{title}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#011023]">{value}</h3>
            <span className="text-sm font-bold text-gray-400">{unit}</span>
        </div>
    </div>
);

const Dashboard = () => {
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* KPI Metrics List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                    title="Total Assigned" 
                    value="12" 
                    unit="Tasks" 
                    icon={<LayoutDashboard size={24} />} 
                    accentColor="bg-blue-50 text-[#527FB0]" 
                />
                <StatsCard 
                    title="In Progress" 
                    value="03" 
                    unit="Active" 
                    icon={<Clock size={24} />} 
                    accentColor="bg-amber-50 text-amber-500" 
                />
                <StatsCard 
                    title="Completed" 
                    value="09" 
                    unit="Tasks" 
                    icon={<CheckCircle size={24} />} 
                    accentColor="bg-emerald-50 text-emerald-500" 
                />
            </div>
            
            <div className="mt-8 bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] min-h-[400px]">
                 <h2 className="text-xl font-extrabold text-[#011023] flex items-center gap-2 mb-4">
                    <Users className="text-[#527FB0]" size={20} /> Latest Activity
                 </h2>
                 <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm font-medium">
                     No recent activity found.
                 </div>
            </div>
        </div>
    );
};

export default Dashboard;
