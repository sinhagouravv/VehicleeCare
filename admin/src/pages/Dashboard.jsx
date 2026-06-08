import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CalendarCheck, MapPin, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { defaultServicesList } from '../data/servicesData';

const chartDataFallback = [
    { name: 'Mon', revenue: 45, booking: 3, charging: 5, users: 2 },
    { name: 'Tue', revenue: 52, booking: 4, charging: 6, users: 4 },
    { name: 'Wed', revenue: 38, booking: 2, charging: 4, users: 1 },
    { name: 'Thu', revenue: 65, booking: 6, charging: 7, users: 5 },
    { name: 'Fri', revenue: 84, booking: 8, charging: 9, users: 8 },
    { name: 'Sun', revenue: 72, booking: 7, charging: 8, users: 6 },
];

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
    const [activeChartTab, setActiveChartTab] = useState('REVENUE');
    const [popularServices, setPopularServices] = useState([]);

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

                const targetEndDate = new Date('2026-02-23T00:00:00');
                const chartMap = {};
                for (let i = 0; i <= 6; i++) {
                    const d = new Date(targetEndDate);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    chartMap[dateStr] = { name: dayName, dateStr, revenue: 0, booking: 0, charging: 0, users: 0 };
                }

                if (bookingsData.success && bookingsData.data) {
                    totalBookings = bookingsData.data.length;

                    const servicesMap = {};
                    const sortedBookings = [...bookingsData.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    sortedBookings.forEach(booking => {
                        // Gather popular services
                        if (booking.service && booking.service.title) {
                            const serviceTitles = booking.service.title.split(',').map(s => s.trim()).filter(s => s);
                            serviceTitles.forEach(title => {
                                const foundService = defaultServicesList.find(s => s.name.toLowerCase() === title.toLowerCase());
                                const svcId = foundService ? foundService.id : title.replace(/\s+/g, '').substring(0, 8).toUpperCase();
                                if (servicesMap[svcId]) {
                                    servicesMap[svcId].count += 1;
                                } else {
                                    servicesMap[svcId] = { id: svcId, name: title, count: 1 };
                                }
                            });
                        }

                        // Chart data logic
                        const bDate = booking.createdAt ? booking.createdAt.split('T')[0] : '';
                        if (chartMap[bDate]) {
                            chartMap[bDate].booking += 1;
                            const amountStr = booking.payment?.amount || booking.service?.price || '₹0';
                            let amount = parseFloat(amountStr);
                            if (isNaN(amount)) {
                                const priceMatch = String(amountStr).replace(/,/g, '').match(/\d+(\.\d+)?/);
                                amount = priceMatch ? parseFloat(priceMatch[0]) : 0;
                            }
                            if (booking.payment?.status === 'Completed' || booking.status === 'Completed') {
                                if (amount > 0) {
                                    const isEV = booking.vehicle?.fuelType === 'EV' || booking.vehicle?.fuelType === 'Electric';
                                    const isCharging = booking.service?.title?.toLowerCase().includes('charg');

                                    chartMap[bDate].revenue += amount;
                                    if (isEV || isCharging) {
                                        chartMap[bDate].charging += amount;
                                    }
                                }
                            }
                        }
                    });

                    const sortedServices = Object.values(servicesMap).sort((a, b) => b.count - a.count).slice(0, 7);
                    setPopularServices(sortedServices);

                    // Recent Activity Log Computation
                    setRecentActivities(sortedBookings.slice(0, 5));
                }

                if (usersData.success && usersData.data) {
                    totalUsers = usersData.data.length;
                    usersData.data.forEach(user => {
                        const uDate = user.createdAt ? user.createdAt.split('T')[0] : '';
                        if (chartMap[uDate]) {
                            chartMap[uDate].users += 1;
                        }
                    });
                }

                const finalChartData = Object.values(chartMap).sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
                setChartData(finalChartData);

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

    const currentChartData = chartData.length > 0 ? chartData : chartDataFallback;
    const maxRevenue = currentChartData.reduce((max, obj) => Math.max(max, obj.revenue || 0), 0);
    const useHigherRevenueScale = maxRevenue > 100;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const value = payload[0].value;
            const fullDate = data.dateStr ? new Date(data.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

            let displayValue = value;
            if (activeChartTab === 'REVENUE' || activeChartTab === 'CHARGING STATION') {
                displayValue = `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-lg font-sans">
                    <p className="text-gray-500 font-bold text-xs uppercase mb-1">{label} • {fullDate}</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || '#527FB0' }}></span>
                        <p className="text-[#011023] font-black text-sm">{activeChartTab}</p>
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
            <div className="flex flex-col xl:flex-row justify-start items-start xl:items-center mt-3.5 mb-3.5 gap-3 px-2">
                <h2 className="text-[25px] font-bold uppercase tracking-tight flex items-center gap-2">
                    Statistics
                </h2>

                {/* Custom Tabs */}
                <select
                    value={activeChartTab}
                    onChange={(e) => setActiveChartTab(e.target.value)}
                    className="bg-white/60 backdrop-blur-xl border border-white rounded-xl shadow-[0_4px_20px_rgba(5,37,88,0.04)] px-4 py-1.5 text-[12px] font-bold text-[#052558] focus:outline-none cursor-pointer w-auto transition-all duration-300 appearance-none text-center"
                >
                    {['REVENUE', 'BOOKING', /*'CHARGING STATION',*/ 'USERS'].map((tab) => (
                        <option key={tab} value={tab} className="font-bold">
                            {tab}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white pt-4 pb-4 pr-2 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] relative min-h-[350px] flex flex-col">
                    <div className="flex-1 w-full h-full min-h-[445px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={currentChartData} margin={{ top: 20, right: 30, left: 6, bottom:1 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={
                                            activeChartTab === 'REVENUE' ? '#527FB0' :
                                                activeChartTab === 'BOOKING' ? '#8b5cf6' :
                                                    activeChartTab === 'CHARGING STATION' ? '#f43f5e' : '#f59e0b'
                                        } stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={
                                            activeChartTab === 'REVENUE' ? '#527FB0' :
                                                activeChartTab === 'BOOKING' ? '#8b5cf6' :
                                                    activeChartTab === 'CHARGING STATION' ? '#f43f5e' : '#f59e0b'
                                        } stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    ticks={
                                        activeChartTab === 'REVENUE'
                                            ? (useHigherRevenueScale ? [0, 40, 80, 120, 160, 200] : [0, 20, 40, 60, 80, 100])
                                            : [0, 2, 4, 6, 8, 10]
                                    }
                                    domain={
                                        activeChartTab === 'REVENUE'
                                            ? (useHigherRevenueScale ? [0, 200] : [0, 100])
                                            : [0, 10]
                                    }
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={
                                        activeChartTab === 'REVENUE' ? 'revenue' :
                                            activeChartTab === 'BOOKING' ? 'booking' :
                                                activeChartTab === 'CHARGING STATION' ? 'charging' : 'users'
                                    }
                                    stroke={
                                        activeChartTab === 'REVENUE' ? '#527FB0' :
                                            activeChartTab === 'BOOKING' ? '#8b5cf6' :
                                                activeChartTab === 'CHARGING STATION' ? '#f43f5e' : '#f59e0b'
                                    }
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>


                <div className="flex flex-col -mt-12 gap-2">
                    <h2 className="text-[25px] mb-0.5 font-bold uppercase tracking-tight px-1 flex items-center gap-2">
                        Recent Activity
                    </h2>
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex flex-col gap-2 h-full min-h-[350px] overflow-y-auto">
                        {recentActivities.map((activity, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 bg-white/40 border border-blue-50/50 hover:bg-white/80 transition-all duration-300 shadow-sm rounded-xl">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                    <Clock size={16} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[13px] font-bold text-[#011023] leading-tight flex flex-wrap items-center gap-1.5 uppercase">New Booking <span className="text-[10px] text-gray-400 tracking-wider">#{activity.bookingId}</span></p>
                                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wide">Service: {activity.service?.title || 'Unknown'}</p>
                                    <p className="text-[10px] text-[#527FB0] font-bold uppercase mt-1">
                                        {new Date(activity.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentActivities.length === 0 && (
                            <p className="text-center text-sm font-bold text-gray-400 mt-8">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
