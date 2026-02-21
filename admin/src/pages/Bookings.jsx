import React from 'react';
import { Search, MoreVertical, Eye, FileText } from 'lucide-react';

const Bookings = () => {
    // Mock Data
    const bookings = [
        { id: "BK-8902", customer: "Sarah Johnson", vehicle: "Honda City", service: "Brake Pad Replacement", date: "Oct 24, 2023", amount: "₹3,400", status: "Completed" },
        { id: "BK-8901", customer: "Michael Chen", vehicle: "Toyota Innova", service: "Full Synthetic Oil", date: "Oct 24, 2023", amount: "₹4,200", status: "In Progress" },
        { id: "BK-8900", customer: "Rahul Sharma", vehicle: "Hyundai Creta", service: "General Service", date: "Oct 25, 2023", amount: "₹2,100", status: "Scheduled" },
        { id: "BK-8899", customer: "Priya Patel", vehicle: "Maruti Swift", service: "Battery Replacement", date: "Oct 25, 2023", amount: "₹5,600", status: "Pending" },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Scheduled': return 'bg-purple-100 text-purple-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Manage Bookings</h1>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white text-[#052558] font-bold rounded-xl shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors">
                        Export List
                    </button>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        Create Booking
                    </button>
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">

                {/* Filters */}
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Status</option>
                            <option>Completed</option>
                            <option>In Progress</option>
                            <option>Scheduled</option>
                        </select>
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>Today</option>
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Booking ID</th>
                                <th className="p-4 font-bold">Customer</th>
                                <th className="p-4 font-bold">Service & Vehicle</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Amount</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-semibold text-[#052558] text-sm">{booking.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{booking.customer}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-800 text-sm">{booking.service}</div>
                                        <div className="text-xs text-gray-500">{booking.vehicle}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-gray-600">{booking.date}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-bold text-gray-800">{booking.amount}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                            <button className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Invoice">
                                                <FileText size={18} />
                                            </button>
                                            <button className="text-gray-400 hover:text-[#052558] hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
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

export default Bookings;
