import React from 'react';
import { Search, Eye, Filter, CheckCircle, Clock } from 'lucide-react';

const MyBookings = () => {
    // Mock Data
    const bookings = [
        { id: "BK-8902", type: "General Service", car: "Honda City", plate: "MH02AB1234", customer: "Sarah J.", dropTime: "Today, 10:00 AM", status: "In Progress", amount: "₹3,400" },
        { id: "BK-8905", type: "Full Synthetic Oil", car: "Toyota Innova", plate: "MH04XY9876", customer: "Michael C.", dropTime: "Today, 02:00 PM", status: "Confirmed", amount: "₹4,200" },
        { id: "BK-8910", type: "Brake Pad Match", car: "Hyundai Creta", plate: "MH01CD4567", customer: "Rahul S.", dropTime: "Tomorrow, 09:30 AM", status: "Confirmed", amount: "₹2,100" },
        { id: "BK-8890", type: "Battery Replacement", car: "Maruti Swift", plate: "MH03EF3456", customer: "Priya P.", dropTime: "Yesterday, 04:00 PM", status: "Ready for Pickup", amount: "₹5,600" },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Ready for Pickup': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Confirmed': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Assigned Bookings</h1>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID, Customer, Plate..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Status</option>
                            <option>Confirmed</option>
                            <option>In Progress</option>
                            <option>Ready</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 transition-colors">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Booking ID</th>
                                <th className="p-4 font-bold">Vehicle Details</th>
                                <th className="p-4 font-bold">Service Type</th>
                                <th className="p-4 font-bold">Est. Amount</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                                    <td className="p-4">
                                        <div className="font-bold text-[#052558]">{booking.id}</div>
                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5"><Clock size={12} /> {booking.dropTime}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{booking.car}</div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{booking.plate}</div>
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-gray-700">
                                        {booking.type}
                                    </td>
                                    <td className="p-4 font-black text-[#011023]">
                                        {booking.amount}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusStyle(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="px-3 py-1.5 bg-white border border-blue-100 text-[#052558] font-bold text-xs rounded-lg shadow-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 mx-auto">
                                            <Eye size={14} /> Open Job Card
                                        </button>
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

export default MyBookings;
