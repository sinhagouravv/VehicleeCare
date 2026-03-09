import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, CheckCircle, Clock } from 'lucide-react';

const MyBookings = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastRefreshed(new Date());
        }, 5000);
        setLastRefreshed(new Date());
        return () => clearInterval(timer);
    }, []);

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
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Assigned Bookings</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
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
