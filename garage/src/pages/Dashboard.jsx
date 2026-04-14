import React, { useState, useEffect } from 'react';
import { Activity, Car, CheckCircle, TrendingUp, AlertCircle, Wrench, CalendarCheck } from 'lucide-react';

const Dashboard = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const storedUser = localStorage.getItem('garageUser');
                if (!storedUser) return;
                const user = JSON.parse(storedUser);

                const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
                const data = await res.json();
                if (data.success) {
                    setBookings(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch garage dashboard data", error);
            } finally {
                setLoading(false);
                setLastRefreshed(new Date());
            }
        };

        fetchDashboardData();
        const timer = setInterval(fetchDashboardData, 30000); // 30s refresh
        return () => clearInterval(timer);
    }, []);

    // Derived states
    const activeVehicles = bookings.filter(b => b.status === 'In Progress').length;
    
    const today = new Date().toLocaleDateString();
    const completedToday = bookings.filter(b => 
        b.status === 'Completed' && new Date(b.updatedAt || b.createdAt).toLocaleDateString() === today
    ).length;
    
    const pendingPickups = bookings.filter(b => b.status === 'Ready for Pickup').length;

    const totalRevenue = bookings
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => sum + (parseFloat(String(b.payment?.amount || b.service?.price || '0').replace(/[^0-9.]/g, '')) || 0), 0);

    const activeJobs = bookings.filter(b => ['In Progress', 'Pending', 'Confirmed', 'Ready for Pickup'].includes(b.status)).slice(0, 5);
    const upcomingJobs = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').slice(0, 5);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* KPI Metrics List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl"><Car size={24} /></div>
                        <span className="flex items-center text-[#527FB0] text-sm font-bold bg-blue-50 px-2 py-1 rounded-lg">
                            Active
                        </span>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Vehicles in Garage</p>
                    <h3 className="text-3xl font-black text-[#011023]">{activeVehicles}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><CheckCircle size={24} /></div>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Completed Today</p>
                    <h3 className="text-3xl font-black text-[#011023]">{completedToday}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><AlertCircle size={24} /></div>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Pending Pickups</p>
                    <h3 className="text-3xl font-black text-[#011023]">{pendingPickups}</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><TrendingUp size={24} /></div>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Total Revenue</p>
                    <h3 className="text-3xl font-black text-[#011023]">₹{totalRevenue.toLocaleString()}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Jobs Pipeline */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-extrabold text-[#011023] flex items-center gap-2">
                            <Activity className="text-[#527FB0]" size={20} /> Live Shop Floor
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading active jobs...</div>
                        ) : activeJobs.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">No active jobs right now.</div>
                        ) : activeJobs.map((job) => (
                            <div key={job._id} className="flex items-center justify-between p-4 bg-white/40 border border-blue-50 rounded-xl hover:bg-white/80 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl"><Wrench size={20} /></div>
                                    <div>
                                        <div className="font-bold text-[#011023]">{job.vehicle?.make} {job.vehicle?.model}</div>
                                        <div className="text-xs font-semibold text-gray-500 mt-0.5">{job.bookingId} • {job.vehicle?.number}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-extrabold text-[#011023] flex items-center gap-2">
                            <CalendarCheck className="text-[#527FB0]" size={20} /> Next Arrivals
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading arrivals...</div>
                        ) : upcomingJobs.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">No upcoming arrivals based on schedule.</div>
                        ) : upcomingJobs.map((apt, i) => (
                            <div key={i} className="flex gap-4 p-3 hover:bg-white/40 rounded-xl transition-colors items-center">
                                <div className="font-black text-[#052558] w-14 text-sm">{apt.schedule?.time?.split(' ')[0]}</div>
                                <div>
                                    <p className="font-bold text-[#011023] text-sm">{apt.user?.name}</p>
                                    <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">{apt.service?.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
