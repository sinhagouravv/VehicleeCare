import React from 'react';
import { Save, Home, Clock, Wrench } from 'lucide-react';

const Settings = () => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Garage Settings</h1>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    <Save size={18} />
                    Save Details
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-6 border-b border-[#e6f0fa] flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#527FB0] rounded-lg"><Home size={20} /></div>
                    <div>
                        <h2 className="text-lg font-bold text-[#011023]">Garage Profile</h2>
                        <p className="text-sm text-gray-500 font-medium">Public details shown to customers on the map.</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Garage Name</label>
                            <input type="text" defaultValue="VehicleeCare Downtown" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Contact Number</label>
                            <input type="text" defaultValue="+91 98765 43210" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Full Address</label>
                        <input type="text" defaultValue="Shop 4, Linking Road, Mumbai Central, MH 400008" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                    </div>
                </div>
            </div>

            {/* Operational Settings */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-6 border-b border-[#e6f0fa] flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#527FB0] rounded-lg"><Clock size={20} /></div>
                    <div>
                        <h2 className="text-lg font-bold text-[#011023]">Operating Hours</h2>
                        <p className="text-sm text-gray-500 font-medium">When are you open for receiving vehicles?</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {['Monday - Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/40 border border-blue-50 rounded-xl">
                            <h3 className="font-bold text-[#011023] text-sm">{day}</h3>
                            <div className="flex gap-3 items-center">
                                <input type="time" defaultValue={idx === 2 ? "" : "09:00"} disabled={idx === 2} className="px-3 py-1.5 bg-white border border-blue-100 rounded-lg text-sm font-bold text-[#052558] disabled:opacity-50" />
                                <span className="text-gray-400 font-medium text-sm">to</span>
                                <input type="time" defaultValue={idx === 2 ? "" : "19:00"} disabled={idx === 2} className="px-3 py-1.5 bg-white border border-blue-100 rounded-lg text-sm font-bold text-[#052558] disabled:opacity-50" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Settings;
