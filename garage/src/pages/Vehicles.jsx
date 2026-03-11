import React, { useState, useEffect } from 'react';
import { Car, Search, Wrench, Settings2, Clock, MapPin } from 'lucide-react';

const Vehicles = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastRefreshed(new Date());
        }, 5000);
        setLastRefreshed(new Date());
        return () => clearInterval(timer);
    }, []);

    const vehicles = [
        { id: "MH01CD4567", model: "Hyundai Creta", year: 2021, owner: "Rahul S.", status: "In Service", nextService: "Pending", type: "SUV" },
        { id: "MH02AB1234", model: "Honda City", year: 2019, owner: "Michael C.", status: "Ready", nextService: "Mar 2024", type: "Sedan" },
        { id: "KA05XY9876", model: "Maruti Swift", year: 2022, owner: "Sarah J.", status: "Completed", nextService: "Jan 2024", type: "Hatchback" },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-[#011023] uppercase tracking-tight flex items-center gap-3">
                    Vehicles Directory
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : 'Loading…'}
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex justify-between items-center bg-white/40">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by license plate or model..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Types</option>
                            <option>SUV</option>
                            <option>Sedan</option>
                            <option>Hatchback</option>
                        </select>
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Status</option>
                            <option>In Service</option>
                            <option>Ready</option>
                            <option>Completed</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-white border border-[#e6f0fa] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-black text-[#011023] text-xl tracking-tight">{vehicle.model}</h3>
                                    <p className="text-gray-500 font-semibold text-sm">{vehicle.year} • {vehicle.type}</p>
                                </div>
                                <span className="bg-yellow-100 text-yellow-800 font-mono font-bold px-3 py-1 rounded border border-yellow-200 shadow-sm text-sm">
                                    {vehicle.id}
                                </span>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 font-medium w-24">Owner:</span>
                                    <span className="font-bold text-[#011023]">{vehicle.owner}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 font-medium w-24">Status:</span>
                                    <span className={`font-bold ${vehicle.status === 'In Service' ? 'text-blue-600' :
                                        vehicle.status === 'Ready' ? 'text-emerald-600' : 'text-gray-600'
                                        }`}>
                                        {vehicle.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 font-medium w-24">Next Service:</span>
                                    <span className="font-bold text-gray-700">{vehicle.nextService}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-[#e6f0fa]">
                                <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2">
                                    <Wrench size={14} /> Service History
                                </button>
                                <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2">
                                    <Settings2 size={14} /> Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Vehicles;
