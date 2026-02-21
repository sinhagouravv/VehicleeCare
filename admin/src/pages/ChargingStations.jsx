import React from 'react';
import { Search, Zap, Plus, MapPin, Edit, Settings } from 'lucide-react';

const ChargingStations = () => {
    const stations = [
        { id: "CS-901", name: "GreenCharge Hub 1", city: "Mumbai", address: "Bandra Kurla Complex", ports: 4, type: "Fast DC", status: "Operational" },
        { id: "CS-902", name: "EcoPower Station", city: "Pune", address: "Hinjewadi Phase 2", ports: 8, type: "Fast DC / AC", status: "Operational" },
        { id: "CS-903", name: "Highway Electrics", city: "Bangalore", address: "Electronic City Toll", ports: 2, type: "AC Type 2", status: "Maintenance" },
        { id: "CS-904", name: "Mall EV Parking", city: "Mumbai", address: "Lower Parel", ports: 6, type: "Fast DC", status: "Operational" },
    ];

    const getStatusColor = (status) => {
        return status === 'Operational' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Charging Stations</h1>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    <Plus size={18} />
                    Add Station
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, city, ID..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                        <option>All Statuses</option>
                        <option>Operational</option>
                        <option>Maintenance</option>
                        <option>Offline</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">Station Info</th>
                                <th className="p-4 font-bold">Location</th>
                                <th className="p-4 font-bold text-center">Ports</th>
                                <th className="p-4 font-bold">Charger Type</th>
                                <th className="p-4 font-bold text-center">Status</th>
                                <th className="p-4 font-bold text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {stations.map((station) => (
                                <tr key={station.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                                                <Zap size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#011023]">{station.name}</div>
                                                <div className="text-xs text-gray-500">ID: {station.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start gap-1.5">
                                            <MapPin size={14} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="font-semibold text-gray-800 text-sm">{station.city}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{station.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-black text-[#052558] text-lg bg-blue-50 px-3 py-1 rounded-lg">
                                            {station.ports}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-100 text-gray-700">
                                            {station.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(station.status)}`}>
                                            {station.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit Station">
                                                <Edit size={16} />
                                            </button>
                                            <button className="text-gray-400 hover:text-[#052558] hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Configure">
                                                <Settings size={16} />
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

export default ChargingStations;
