import React, { useState } from 'react';
import { Search, Plus, Filter, Wrench, Settings, AlertCircle, Edit, Trash2 } from 'lucide-react';

const Services = () => {
    // Mock Data
    const [services, setServices] = useState([
        { id: "SRV-001", name: "General Service", category: "Maintenance", duration: "1.5 Hrs", price: "₹3,400", status: "Active" },
        { id: "SRV-002", name: "Full Synthetic Oil Change", category: "Maintenance", duration: "45 Mins", price: "₹4,200", status: "Active" },
        { id: "SRV-003", name: "Brake Pad Match & Replace", category: "Repair", duration: "2 Hrs", price: "₹2,100", status: "Active" },
        { id: "SRV-004", name: "Battery Replacement", category: "Electrical", duration: "30 Mins", price: "₹5,600", status: "Inactive" },
        { id: "SRV-005", name: "AC Gas Top-up", category: "AC/HVAC", duration: "1 Hr", price: "₹1,500", status: "Active" },
        { id: "SRV-006", name: "Wheel Alignment & Balancing", category: "Wheels", duration: "1 Hr", price: "₹800", status: "Active" },
    ]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Maintenance': return <Settings size={14} className="text-blue-500" />;
            case 'Repair': return <Wrench size={14} className="text-amber-500" />;
            case 'Electrical': return <AlertCircle size={14} className="text-red-500" />;
            default: return <Wrench size={14} className="text-gray-500" />;
        }
    }

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Service Catalog</h1>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(5,37,88,0.2)] hover:shadow-[0_12px_25px_rgba(5,37,88,0.3)] hover:-translate-y-0.5 transition-all duration-300">
                    <Plus size={18} /> Add New Service
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search services by name, ID..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Categories</option>
                            <option>Maintenance</option>
                            <option>Repair</option>
                            <option>Electrical</option>
                            <option>Wheels</option>
                        </select>
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 transition-colors">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Service Info</th>
                                <th className="p-4 font-bold">Category</th>
                                <th className="p-4 font-bold">Est. Duration</th>
                                <th className="p-4 font-bold">Starting Price</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {services.map((service) => (
                                <tr key={service.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{service.name}</div>
                                        <div className="text-xs text-gray-500 font-medium uppercase mt-0.5">{service.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                            {getCategoryIcon(service.category)} {service.category}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-gray-600">
                                        {service.duration}
                                    </td>
                                    <td className="p-4 font-black text-[#011023]">
                                        {service.price}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusStyle(service.status)}`}>
                                            {service.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Service">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Service">
                                                <Trash2 size={16} />
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

export default Services;
