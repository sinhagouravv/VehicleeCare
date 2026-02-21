import React from 'react';
import { Search, MoreVertical, MapPin, Edit, Trash2 } from 'lucide-react';

const Garages = () => {
    // Mock Data based on Locate.jsx GARAGE_DATA structure
    const garages = [
        { id: "GAR-01", name: "Speedy Auto Fix", state: "Maharashtra", district: "Mumbai", address: "123 Main St, Andheri", rating: 4.8, type: ["Petrol", "Diesel"], partner: true },
        { id: "GAR-02", name: "City Center Motors", state: "Maharashtra", district: "Pune", address: "45 MG Road, Camp", rating: 4.5, type: ["Petrol"], partner: true },
        { id: "GAR-03", name: "Eco Drive Garage", state: "Karnataka", district: "Bangalore", address: "Tech Park Rd, Whitefield", rating: 4.9, type: ["EV"], partner: true },
        { id: "GAR-04", name: "Local Mech Hub", state: "Maharashtra", district: "Mumbai", address: "Dharavi Link Rd", rating: 3.9, type: ["Petrol", "Diesel"], partner: false },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Manage Garages</h1>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        Add Garage
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
                            placeholder="Search by name, state, district..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All States</option>
                            <option>Maharashtra</option>
                            <option>Karnataka</option>
                        </select>
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Types</option>
                            <option>Partnered</option>
                            <option>Non-Partnered</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Garage Name</th>
                                <th className="p-4 font-bold">Location</th>
                                <th className="p-4 font-bold">Vehicle Types</th>
                                <th className="p-4 font-bold text-center">Rating</th>
                                <th className="p-4 font-bold">Partnership</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {garages.map((garage) => (
                                <tr key={garage.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{garage.name}</div>
                                        <div className="text-xs text-gray-500 font-medium">ID: {garage.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start gap-1">
                                            <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="font-semibold text-gray-800 text-sm">{garage.district}, {garage.state}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{garage.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {garage.type.map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 font-bold rounded-lg text-sm">
                                            {garage.rating} <span className="text-yellow-400">★</span>
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {garage.partner ? (
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                Verified Partner
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                Independent
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={18} />
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

export default Garages;
