import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CalendarCheck, MapPin, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [dashboardStats, setDashboardStats] = useState({
        bookings: 0,
        users: 0,
        garages: 0,
        stations: 0
    });
    const [chartData, setChartData] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [bookingsRes, usersRes, garagesRes, stationsRes] = await Promise.all([
                    fetch('http://localhost:5001/api/bookings'),
                    fetch('http://localhost:5001/api/users'),
                    fetch('http://localhost:5001/api/garages'),
                    fetch('http://localhost:5001/api/charging-stations')
                ]);

                const bookingsData = await bookingsRes.json();
                const usersData = await usersRes.json();
                const garagesData = await garagesRes.json();
                const stationsData = await stationsRes.json();

                let totalBookings = 0;
                let totalUsers = 0;
                let totalGarages = 0;
                let totalStations = 0;

                if (bookingsData.success && bookingsData.data) {
                    totalBookings = bookingsData.data.length;

                    // Chart Data Computation
                    const targetEndDate = new Date('2026-02-23T00:00:00');
                    const chartMap = {};
                    for (let i = 0; i <= 6; i++) {
                        const d = new Date(targetEndDate);
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().split('T')[0];
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        chartMap[dateStr] = { name: dayName, dateStr, revenue: 0 };
                    }

                    const sortedBookings = [...bookingsData.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    sortedBookings.forEach(booking => {
                        if (booking.status === 'Completed' && booking.createdAt) {
                            const bDate = booking.createdAt.split('T')[0];
                            if (chartMap[bDate]) {
                                const serviceStr = booking.service?.price || '₹0';
                                const priceMatch = serviceStr.replace(/,/g, '').match(/\d+(\.\d+)?/);
                                if (priceMatch) {
                                    chartMap[bDate].revenue += parseFloat(priceMatch[0]);
                                }
                            }
                        }
                    });

                    const finalChartData = Object.values(chartMap).sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
                    setChartData(finalChartData);

                    // Recent Activity Log Computation
                    setRecentActivities(sortedBookings.slice(0, 5));
                }

                if (usersData.success && usersData.data) {
                    totalUsers = usersData.data.length;
                }

                if (garagesData.success && garagesData.data) {
                    totalGarages = garagesData.data.length;
                }

                if (stationsData.success && stationsData.data) {
                    totalStations = stationsData.data.length;
                }

                setDashboardStats({
                    bookings: totalBookings,
                    users: totalUsers,
                    garages: totalGarages,
                    stations: totalStations
                });

                setLastRefreshed(new Date());

            } catch (err) {
                console.error("Dashboard failed to fetch data:", err);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);

        return () => clearInterval(interval);
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const value = payload[0].value;
            const fullDate = data.dateStr ? new Date(data.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const displayValue = `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-lg font-sans">
                    <p className="text-gray-500 font-bold text-xs uppercase mb-1">{label} • {fullDate}</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#527FB0' }}></span>
                        <p className="text-[#011023] font-black text-sm">REVENUE</p>
                        <p className="text-[#011023] font-black text-sm ml-auto">{displayValue}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const stats = [
        { title: "Total Bookings", value: dashboardStats.bookings.toLocaleString(), change: "+12.5%", icon: <CalendarCheck size={24} className="text-[#527FB0]" /> },
        { title: "Active Users", value: dashboardStats.users.toLocaleString(), change: "+5.2%", icon: <Users size={24} className="text-[#527FB0]" /> },
        { title: "Active Garages", value: dashboardStats.garages.toLocaleString(), change: "+2.1%", icon: <MapPin size={24} className="text-[#527FB0]" /> },
        { title: "Active Charging Stations", value: dashboardStats.stations.toLocaleString(), change: "+8.4%", icon: <TrendingUp size={24} className="text-[#527FB0]" /> },
    ];

    return (
        <div className="space-y-8 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
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
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] h-[650px] flex flex-col">
                    <h3 className="text-lg font-bold text-[#011023] mb-4 uppercase tracking-tight">All Trend</h3>
                    <div className="flex-1 w-full min-h-0">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#527FB0" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#527FB0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dx={-10} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#527FB0" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#052558' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 font-medium font-sans">
                                Loading chart data...
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] h-[650px] flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="text-[#052558]" size={20} />
                        <h3 className="text-lg font-bold text-[#011023] uppercase tracking-tight">Recent Activity</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-sans">
                        {recentActivities.map((activity, idx) => (
                            <div key={idx} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#011023] leading-tight">New Booking: {activity.bookingId}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Service: {activity.service?.title || 'Unknown'}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1">
                                        {new Date(activity.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentActivities.length === 0 && (
                            <p className="text-center text-sm text-gray-400 mt-4">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
