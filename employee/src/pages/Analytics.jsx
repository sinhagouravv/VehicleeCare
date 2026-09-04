import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, CheckCircle2, UserCheck, Star, Clock, Trophy, Target, ArrowUpRight } from 'lucide-react';

const Analytics = () => {
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [employeeUser, setEmployeeUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            setEmployeeUser(JSON.parse(storedUser));
        }
    }, []);

    const empId = employeeUser?.employeeId || employeeUser?.id || employeeUser?._id;

    useEffect(() => {
        const fetchBookings = async () => {
            if (!empId) return;
            try {
                const res = await fetch(`http://localhost:5001/api/bookings/employee/${empId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setBookings(data.data || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch bookings for analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [empId]);

    const completedCount = bookings.filter(b => b.status === 'Completed' || b.status === 'Delivered').length;
    const totalAssigned = bookings.length;

    const weeklyData = [
        { day: 'Mon', hours: 0.0, percentage: '0%' },
        { day: 'Tue', hours: 0.0, percentage: '0%' },
        { day: 'Wed', hours: 0.0, percentage: '0%' },
        { day: 'Thu', hours: 0.0, percentage: '0%' },
        { day: 'Fri', hours: 0.0, percentage: '0%' },
        { day: 'Sat', hours: 0.0, percentage: '0%' },
        { day: 'Sun', hours: 0.0, percentage: '0%' }
    ];

    const milestones = [];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Analytics Dashboard</h1>
                </div>
                <div className="text-xs uppercase text-gray-400 font-medium self-center">
                    Last Refreshed | {lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Metric 1 */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={22} />
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${totalAssigned > 0 ? 'text-emerald-600 bg-emerald-100/50' : 'text-gray-500 bg-gray-100'}`}>{totalAssigned > 0 ? 'Active' : 'No Data'}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tasks Completed</p>
                    <h3 className="text-2xl font-black text-[#011023] mt-1">{completedCount} <span className="text-xs text-gray-400 font-medium">/ {totalAssigned} Assigned</span></h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0}%` }}></div>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-500 rounded-xl group-hover:scale-110 transition-transform">
                            <UserCheck size={22} />
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-gray-500 bg-gray-100">No Data</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Attendance Score</p>
                    <h3 className="text-2xl font-black text-[#011023] mt-1">0% <span className="text-xs text-gray-400 font-medium">Present</span></h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '0%' }}></div>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl group-hover:scale-110 transition-transform">
                            <Star size={22} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-gray-500 bg-gray-100">No Rating</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Efficiency Rating</p>
                    <h3 className="text-2xl font-black text-[#011023] mt-1">0.0 <span className="text-xs text-gray-400 font-medium">/ 5.0 Rating</span></h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: '0%' }}></div>
                    </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                            <Clock size={22} />
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-gray-500 bg-gray-100">No Overtime</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Overtime Logged</p>
                    <h3 className="text-2xl font-black text-[#011023] mt-1">0 <span className="text-xs text-gray-400 font-medium">Hours This Month</span></h3>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '0%' }}></div>
                    </div>
                </div>
            </div>

            {/* Detailed Charts & Milestones Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Column 1: Weekly Hours CSS Chart */}
                <div className="lg:col-span-3 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Weekly Work Hours</h4>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Daily hours tracked in current shift pattern</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#527FB0] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                            <TrendingUp size={14} /> AVG: 0.0 HRS / DAY
                        </div>
                    </div>

                    {/* Pure CSS Bar Chart */}
                    <div className="h-64 flex items-end justify-between px-4 pb-2 border-b border-[#e6f0fa]">
                        {weeklyData.map((data, index) => (
                            <div key={index} className="flex flex-col items-center group w-1/8">
                                <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                                    {data.hours}h
                                </span>
                                <div 
                                    style={{ height: `${data.hours * 18}px` }} 
                                    className={`w-10 rounded-t-lg transition-all duration-500 group-hover:scale-x-105 ${
                                        data.hours > 9
                                            ? 'bg-gradient-to-t from-blue-500 to-[#527FB0]'
                                            : data.hours === 0
                                                ? 'bg-gray-100 border border-dashed border-gray-200'
                                                : 'bg-gradient-to-t from-[#052558] to-[#527FB0]'
                                    }`}
                                ></div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Days Labels */}
                    <div className="flex justify-between px-4 mt-3">
                        {weeklyData.map((data, index) => (
                            <span key={index} className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-10 text-center">
                                {data.day}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Column 2: Milestones */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex flex-col">
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Milestones & Awards</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Badges unlocked by performance achievements</p>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        {milestones.length > 0 ? milestones.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-white/40 border border-[#e6f0fa] p-4 rounded-xl hover:bg-white transition-colors">
                                <div className="p-2.5 bg-[#f0f6ff] rounded-xl flex-shrink-0">
                                    {m.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h5 className="text-xs font-black text-[#011023] uppercase tracking-wide truncate">{m.title}</h5>
                                        <span className="text-[9px] font-bold text-gray-400 shrink-0">{m.date}</span>
                                    </div>
                                    <p className="text-[10.5px] text-gray-500 font-medium leading-tight">{m.desc}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex-1 flex items-center justify-center py-16 text-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                No Milestones Unlocked Yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
