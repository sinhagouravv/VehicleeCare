import React from 'react';
import { Search, Wrench, Plus, Edit, Trash2, SwitchCamera } from 'lucide-react';

const Services = () => {
    const servicesList = [
        { id: "SRV-101", name: "Premium Oil Change", category: "Maintenance", price: "₹2,500", duration: "1.5 hrs", active: true },
        { id: "SRV-102", name: "Complete Brake Pad Replacement", category: "Repairs", price: "₹4,200", duration: "2.5 hrs", active: true },
        { id: "SRV-103", name: "AC Gas Top-up & Cleaning", category: "AC & Heating", price: "₹1,800", duration: "1 hr", active: true },
        { id: "SRV-104", name: "Interior Deep Cleaning", category: "Detailing", price: "₹1,500", duration: "3 hrs", active: false },
        { id: "SRV-105", name: "Wheel Alignment & Balancing", category: "Wheels & Tyres", price: "₹800", duration: "1 hr", active: true },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Services Directory</h1>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    <Plus size={18} />
                    Add Service
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search services..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                        <option>All Categories</option>
                        <option>Maintenance</option>
                        <option>Repairs</option>
                        <option>AC & Heating</option>
                        <option>Detailing</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Service Details</th>
                                <th className="p-4 font-bold">Category</th>
                                <th className="p-4 font-bold">Est. Price</th>
                                <th className="p-4 font-bold">Duration</th>
                                <th className="p-4 font-bold text-center">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {servicesList.map((service) => (
                                <tr key={service.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 text-[#527FB0] rounded-lg">
                                                <Wrench size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#011023]">{service.name}</div>
                                                <div className="text-xs text-gray-500">ID: {service.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700">
                                            {service.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-[#011023]">{service.price}</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-medium">
                                        {service.duration}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${service.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${service.active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                            {service.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit Service">
                                                <Edit size={16} />
                                            </button>
                                            <button className="text-gray-400 hover:text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Toggle Status">
                                                <SwitchCamera size={16} />
                                            </button>
                                            <button className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
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
