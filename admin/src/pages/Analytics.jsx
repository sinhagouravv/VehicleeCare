import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity, BarChart2, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { defaultServicesList } from '../data/servicesData';

const chartData = [
    { name: 'Mon', revenue: 45, booking: 3, charging: 5, users: 2 },
    { name: 'Tue', revenue: 52, booking: 4, charging: 6, users: 4 },
    { name: 'Wed', revenue: 38, booking: 2, charging: 4, users: 1 },
    { name: 'Thu', revenue: 65, booking: 6, charging: 7, users: 5 },
    { name: 'Fri', revenue: 84, booking: 8, charging: 9, users: 8 },
    { name: 'Sun', revenue: 72, booking: 7, charging: 8, users: 6 },
];

const Analytics = () => {
    const [activeChartTab, setActiveChartTab] = useState('REVENUE');
    const [dynamicChartData, setDynamicChartData] = useState([]);
    const [popularServices, setPopularServices] = useState([]);
    const [bookingStats, setBookingStats] = useState({
        total: 0,
        today: 0,
        pending: 0,
        completed: 0
    });
    const [revenueStats, setRevenueStats] = useState({
        total: 0,
        today: 0,
        garage: 0,
        station: 0
    });
    const [userStats, setUserStats] = useState({
        total: 0,
        today: 0,
        active: 0,
        returned: 0
    });
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const formatCurrency = (val) => {
        if (val === 0) return '₹0';
        if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    useEffect(() => {
        const fetchAndCalculatePopularServices = async () => {
            try {
                const [bookingsRes, usersRes] = await Promise.all([
                    fetch('http://localhost:5001/api/bookings'),
                    fetch('http://localhost:5001/api/users')
                ]);
                const result = await bookingsRes.json();
                const usersResult = await usersRes.json();

                if (result.success && result.data) {
                    const servicesMap = {};

                    result.data.forEach(booking => {
                        if (booking.service && booking.service.title) {
                            // Some bookings have multiple services combined with ", "
                            const serviceTitles = booking.service.title.split(',').map(s => s.trim()).filter(s => s);

                            serviceTitles.forEach(title => {
                                // Find real ID from imported service list
                                const foundService = defaultServicesList.find(s => s.name.toLowerCase() === title.toLowerCase());
                                const svcId = foundService ? foundService.id : title.replace(/\s+/g, '').substring(0, 8).toUpperCase();

                                if (servicesMap[svcId]) {
                                    servicesMap[svcId].count += 1;
                                } else {
                                    servicesMap[svcId] = {
                                        id: svcId,
                                        name: title,
                                        count: 1
                                    };
                                }
                            });
                        }
                    });

                    // Calculate Booking Stats
                    const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
                    const todayDateString = new Date().toLocaleDateString('en-CA'); // Gets local YYYY-MM-DD

                    let todayCount = 0;
                    let pendingCount = 0;
                    let completedCount = 0;

                    let totalRev = 0;
                    let todayRev = 0;
                    let garageRev = 0;
                    let stationRev = 0;

                    result.data.forEach(booking => {
                        // Check if booking is created today or scheduled for today
                        const createdAtDate = booking.createdAt ? booking.createdAt.split('T')[0] : '';
                        const scheduledDate = booking.schedule?.date ? new Date(booking.schedule.date).toLocaleDateString('en-CA') : '';
                        const isToday = (createdAtDate === todayDateString || scheduledDate === todayDateString);

                        if (isToday) {
                            todayCount++;
                        }

                        if (booking.status === 'Pending') {
                            pendingCount++;
                        } else if (booking.status === 'Completed') {
                            completedCount++;
                        }

                        // Calculate Revenue
                        if (booking.payment?.status === 'Completed' || booking.status === 'Completed') {
                            const amount = parseFloat(booking.payment?.amount || booking.service?.price || 0);

                            if (!isNaN(amount) && amount > 0) {
                                totalRev += amount;

                                if (isToday) {
                                    todayRev += amount;
                                }

                                // Classify Garage vs Station (EV/Charging = Station)
                                const isEV = booking.vehicle?.fuelType === 'EV' || booking.vehicle?.fuelType === 'Electric';
                                const isCharging = booking.service?.title?.toLowerCase().includes('charg');

                                if (isEV || isCharging) {
                                    stationRev += amount;
                                } else {
                                    garageRev += amount;
                                }
                            }
                        }
                    });

                    // Calculate User Stats
                    // Sort bookings chronologically to calculate streaks and return times properly
                    const sortedBookingsForUsers = [...result.data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    const userMap = {};
                    let todayUserCount = 0;
                    let activeUserCount = 0;
                    let returnedUserCount = 0;

                    sortedBookingsForUsers.forEach(booking => {
                        const userId = booking.user?.email || booking.user?.phone || booking.user?.name;
                        if (!userId) return;

                        const createdAtDate = booking.createdAt ? booking.createdAt.split('T')[0] : '';
                        const bookingDateObj = new Date(createdAtDate);
                        const isToday = (createdAtDate === todayDateString);

                        if (!userMap[userId]) {
                            userMap[userId] = {
                                firstBooking: createdAtDate,
                                lastBooking: createdAtDate,
                                hasBookedToday: isToday,
                                activeStreak: 1, // Booked at least once means streak of 1
                                isReturned: false
                            };
                            if (isToday) todayUserCount++;
                        } else {
                            const lastBookingObj = new Date(userMap[userId].lastBooking);
                            // Difference in days
                            const diffTime = Math.abs(bookingDateObj - lastBookingObj);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays === 1) {
                                // Booked consecutively
                                userMap[userId].activeStreak += 1;
                            } else if (diffDays > 1) {
                                // Streak broken
                                userMap[userId].activeStreak = 1;
                            }

                            // Logic for returned user (booked after 3 days of previous booking)
                            if (diffDays >= 3) {
                                userMap[userId].isReturned = true;
                            }

                            userMap[userId].lastBooking = createdAtDate;
                            if (isToday && !userMap[userId].hasBookedToday) {
                                userMap[userId].hasBookedToday = true;
                                todayUserCount++;
                            }
                        }
                    });

                    // Final Tally for Users
                    let trueTotalUsers = 0;
                    let trueTodayUsers = 0;

                    if (usersResult.success && usersResult.data) {
                        trueTotalUsers = usersResult.data.length;
                        usersResult.data.forEach(user => {
                            const createdDate = user.createdAt ? user.createdAt.split('T')[0] : '';
                            if (createdDate === todayDateString) {
                                trueTodayUsers++;
                            }
                        });
                    } else {
                        // Fallback to booking count if users api fails
                        trueTotalUsers = Object.keys(userMap).length;
                        trueTodayUsers = todayUserCount;
                    }

                    Object.values(userMap).forEach(usr => {
                        // Active user = booked everyday (streak > 1, meaning consecutive days). 
                        // To be explicitly an "active user" currently, they must have booked today as part of a streak.
                        // Adjusting logic based on prompt: "if a user books service everyday then he should be counted as active"
                        if (usr.activeStreak > 1 && usr.hasBookedToday) {
                            activeUserCount++;
                        }

                        if (usr.isReturned) {
                            returnedUserCount++;
                        }
                    });

                    setBookingStats({
                        total: result.data.length,
                        today: todayCount,
                        pending: pendingCount,
                        completed: completedCount
                    });

                    setRevenueStats({
                        total: totalRev,
                        today: todayRev,
                        garage: garageRev,
                        station: stationRev
                    });

                    setUserStats({
                        total: trueTotalUsers,
                        today: trueTodayUsers,
                        active: activeUserCount,
                        returned: returnedUserCount
                    });

                    // Convert map to array, sort by count descending, take top 7
                    const sortedServices = Object.values(servicesMap)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 7);

                    // Build Dynamic Chart Data (Last 7 days strictly starting backwards from Feb 23, 2026)
                    const targetEndDate = new Date('2026-02-23T00:00:00');
                    const chartMap = {};

                    // Initialize the next 7 days chart array starting STRICTLY from Mon, Feb 23, 2026
                    for (let i = 0; i <= 6; i++) {
                        const d = new Date(targetEndDate);
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

                        chartMap[dateStr] = {
                            name: dayName,
                            revenue: 0,
                            booking: 0,
                            charging: 0,
                            users: 0,
                            dateStr: dateStr // keeping reference for sorting
                        };
                    }

                    // Populate chart data from bookings
                    result.data.forEach(booking => {
                        const bDate = booking.createdAt ? booking.createdAt.split('T')[0] : '';
                        if (chartMap[bDate]) {
                            chartMap[bDate].booking += 1;

                            const amount = parseFloat(booking.payment?.amount || booking.service?.price || 0);
                            if (booking.payment?.status === 'Completed' || booking.status === 'Completed') {
                                if (!isNaN(amount) && amount > 0) {
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

                    // Populate chart data from users
                    if (usersResult.success && usersResult.data) {
                        usersResult.data.forEach(user => {
                            const uDate = user.createdAt ? user.createdAt.split('T')[0] : '';
                            if (chartMap[uDate]) {
                                chartMap[uDate].users += 1;
                            }
                        });
                    }

                    // Convert chart map to array in chronological order
                    const finalChartData = Object.values(chartMap).sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
                    setDynamicChartData(finalChartData);

                    setPopularServices(sortedServices);
                    setLastRefreshed(new Date());
                }
            } catch (err) {
                console.error("Error fetching popular services:", err);
            }
        };

        fetchAndCalculatePopularServices();
        const interval = setInterval(fetchAndCalculatePopularServices, 5000);

        return () => clearInterval(interval);
    }, []);

    const currentChartData = dynamicChartData.length > 0 ? dynamicChartData : chartData;
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
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
                        <p className="text-[#011023] font-black text-sm">{activeChartTab}</p>
                        <p className="text-[#011023] font-black text-sm ml-auto">{displayValue}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-1 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Analytics Overview</h1>
                <div className="flex gap-3 justify-between">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {/* {refreshing && <span className="w-1.5 h-1.5 rounded-full bg-[#527FB0] animate-pulse inline-block" />} */}
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : 'Loading…'}
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* revenue Cards */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Revenue</h2>
                    <div className="grid grid-cols-1 uppercase md:grid-cols-2 lg:grid-cols-2 gap-3">


                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Revenue</p>
                                <h3 className="text-sm font-black text-[#011023]">{formatCurrency(revenueStats.garage)}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +12.5%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Revenue</p>
                                <h3 className="text-sm font-black text-[#011023]">{formatCurrency(revenueStats.today)}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +8.2%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Weekly Revenue</p>
                                <h3 className="text-sm font-black text-[#011023]">{formatCurrency(revenueStats.garage)}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +24.1%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Monthly Revenue</p>
                                <h3 className="text-sm font-black text-[#011023]">-</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Hidden for now */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Cards */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Booking</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Booking</p>
                                <h3 className="text-sm font-black text-[#011023]">{bookingStats.total}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +12.5%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Booking</p>
                                <h3 className="text-sm font-black text-[#011023]">{bookingStats.today}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +8.2%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Pending Booking</p>
                                <h3 className="text-sm font-black text-[#011023]">{bookingStats.pending}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +24.1%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Completed Booking</p>
                                <h3 className="text-sm font-black text-[#011023]">{bookingStats.completed}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +4.3%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">

                {/* Charging Cards */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Charging Station</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Charged</p>
                                <h3 className="text-sm font-black text-[#011023]">-</h3>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Charged</p>
                                <h3 className="text-sm font-black text-[#011023]">-</h3>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Charge Utilization</p>
                                <h3 className="text-sm font-black text-[#011023]">-</h3>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider"> Charge Down Time</p>
                                <h3 className="text-sm font-black text-[#011023]">-</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* user Cards */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Users</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Users</p>
                                <h3 className="text-sm font-black text-[#011023]">{userStats.total}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +12.5%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's User</p>
                                <h3 className="text-sm font-black text-[#011023]">{userStats.today}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +8.2%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Employees</p>
                                <h3 className="text-sm font-black text-[#011023]">{userStats.active}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +24.1%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Employees</p>
                                <h3 className="text-sm font-black text-[#011023]">{userStats.returned}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <TrendingUp size={12} className="mr-1" /> +4.3%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            

            {/* Charts Area View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="grid grid-rows-1 lg:grid-rows-3 gap-4.5">

                    {/* Parking Section */}
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold uppercase tracking-tight">Parking</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Users</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.total}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +12.5%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's User</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.today}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +8.2%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Employees</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.active}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +24.1%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Employees</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.returned}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +4.3%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Store Section */}
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold uppercase tracking-tight">Store</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Users</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.total}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +12.5%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's User</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.today}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +8.2%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Employees</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.active}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +24.1%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Employees</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.returned}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +4.3%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Garage Section */}
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold uppercase tracking-tight">Garage</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-[#527FB0] rounded-xl"><DollarSign size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Users</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.total}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +12.5%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Activity size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's User</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.today}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +8.2%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Users size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Total Employees</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.active}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +24.1%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl border border-white pl-3 pr-3 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={15} /></div>
                                    <p className="text-gray-500 font-bold text-[13px] uppercase tracking-wider">Today's Employees</p>
                                    <h3 className="text-sm font-black text-[#011023]">{userStats.returned}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={12} className="mr-1" /> +4.3%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex flex-col gap-2 mt-4.5 lg:mt-0">
                    <h2 className="text-lg  font-bold uppercase tracking-tight">
                        Popular Services
                    </h2>
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex flex-col gap-2.5 h-full min-h-[350px]">
                        {popularServices.map((service, index) => (
                            <div key={index} className="flex items-center uppercase justify-between p-2.5 rounded-xl bg-white/40 border border-blue-50/50 hover:bg-white/80 transition-all duration-300 shadow-sm group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 group-hover:bg-[#052558] text-[#527FB0] group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-xs shadow-sm">
                                        #{index + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#011023] text-[13px] tracking-wide inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px] sm:max-w-[200px]">{service.name}</span>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{service.id}</span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-lg text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                                        <Users size={12} strokeWidth={2.5} /> {service.count} USERS
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >

    );
};

export default Analytics;
