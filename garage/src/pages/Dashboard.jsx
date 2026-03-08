import React from 'react';
import { Activity, Car, CheckCircle, TrendingUp, AlertCircle, Wrench, CalendarCheck } from 'lucide-react';

const Dashboard = () => {
    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Dashboard</h1>
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
                    <h3 className="text-3xl font-black text-[#011023]">12</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><CheckCircle size={24} /></div>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Completed Today</p>
                    <h3 className="text-3xl font-black text-[#011023]">5</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><AlertCircle size={24} /></div>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Pending Pickups</p>
                    <h3 className="text-3xl font-black text-[#011023]">3</h3>
                </div>

                <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><TrendingUp size={24} /></div>
                        <span className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                            +15%
                        </span>
                    </div>
                    <p className="text-gray-500 font-semibold mb-1 text-sm">Weekly Revenue</p>
                    <h3 className="text-3xl font-black text-[#011023]">₹42.5K</h3>
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
                        {[
                            { id: "JOB-402", car: "Honda City", plate: "MH 02 AB 1234", status: "Inspection", time: "Started 10m ago" },
                            { id: "JOB-401", car: "Mahindra Thar", plate: "MH 04 XY 9876", status: "Repairing", time: "Started 1h 15m ago" },
                            { id: "JOB-400", car: "Hyundai i20", plate: "MH 01 CD 4567", status: "Washing", time: "Started 45m ago" },
                        ].map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-4 bg-white/40 border border-blue-50 rounded-xl hover:bg-white/80 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-[#527FB0] rounded-xl"><Wrench size={20} /></div>
                                    <div>
                                        <div className="font-bold text-[#011023]">{job.car}</div>
                                        <div className="text-xs font-semibold text-gray-500 mt-0.5">{job.id} • {job.plate}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        {job.status}
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{job.time}</p>
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
                        {[
                            { time: "14:00", customer: "Rahul S.", service: "General Service" },
                            { time: "15:30", customer: "Amit P.", service: "Brake Pads" },
                            { time: "16:45", customer: "Sneha M.", service: "Oil Change" },
                        ].map((apt, i) => (
                            <div key={i} className="flex gap-4 p-3 hover:bg-white/40 rounded-xl transition-colors">
                                <div className="font-black text-[#052558] w-12 pt-0.5">{apt.time}</div>
                                <div>
                                    <p className="font-bold text-[#011023] text-sm">{apt.customer}</p>
                                    <p className="text-xs text-gray-500 font-medium">{apt.service}</p>
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
