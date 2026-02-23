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
        <div className="space-y-6 max-w-[92rem]  mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Charging Stations</h1>
                <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    <Plus size={18} />
                    Add Station
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[875px] relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold">Station ID</th>
                                <th className="p-4.5 font-bold">Station Name</th>
                                <th className="p-4.5 font-bold">Location</th>
                                <th className="p-4.5 font-bold text-center">Ports</th>
                                <th className="p-4.5 font-bold">Charger Type</th>
                                <th className="p-4.5 font-bold text-center">Status</th>
                                <th className="p-4.5 font-bold text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {stations.map((station) => (
                                <tr key={station.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className=''>
                                            <div className="font-bold text-[#011023]">{station.id}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <div className="font-bold text-[#011023]">{station.name}</div>
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
