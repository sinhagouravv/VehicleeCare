import React from 'react';
import { Building2, Search, MoreVertical, Plus } from 'lucide-react';

const Franchise = () => {
    // Mock Data for UI presentation
    const franchises = [
        { id: "FR-001", name: "VehicleeCare Downtown", location: "Mumbai Central, MH", owner: "Rajesh Kumar", status: "Active", joinDate: "Jan 15, 2023" },
        { id: "FR-002", name: "VehicleeCare Express", location: "Andheri West, MH", owner: "Priya Sharma", status: "Active", joinDate: "Mar 22, 2023" },
        { id: "FR-003", name: "AutoMasters Franchise", location: "Whitefield, KA", owner: "Amit Patel", status: "Onboarding", joinDate: "Oct 10, 2023" },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Franchise Management</h1>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        <Plus size={18} />
                        Add Franchise
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Total Franchises</p>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 className="text-[#527FB0]" size={24} />
                        </div>
                        <p className="text-3xl font-black text-[#011023]">24</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Active Locations</p>
                    <p className="text-3xl font-black text-emerald-600">21</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">In Onboarding</p>
                    <p className="text-3xl font-black text-amber-500">3</p>
                </div>
            </div>

            {/* Main Content Table (Glassmorphism design matching frontend) */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">

                {/* Filters */}
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search franchises..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Onboarding</option>
                        <option>Suspended</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Franchise ID</th>
                                <th className="p-4 font-bold">Details</th>
                                <th className="p-4 font-bold">Location</th>
                                <th className="p-4 font-bold">Join Date</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {franchises.map((franchise) => (
                                <tr key={franchise.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-semibold text-[#052558] text-sm">{franchise.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{franchise.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                            Owner: {franchise.owner}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-gray-600">{franchise.location}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-gray-600">{franchise.joinDate}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${franchise.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {franchise.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="text-gray-400 hover:text-[#052558] hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                            <MoreVertical size={18} />
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

export default Franchise;
