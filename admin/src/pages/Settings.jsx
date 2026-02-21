import React from 'react';
import { Save, Bell, Shield, Globe, CreditCard } from 'lucide-react';

const Settings = () => {
    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Platform Settings</h1>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Navigation Sidebar (Settings Specific) */}
                <div className="md:col-span-3 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/60 shadow-sm border border-blue-100 rounded-xl text-left font-bold text-[#052558] transition-colors">
                        <Globe size={18} /> General
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/40 border border-transparent hover:border-blue-50 rounded-xl text-left font-semibold text-gray-500 hover:text-[#052558] transition-colors">
                        <Shield size={18} /> Security
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/40 border border-transparent hover:border-blue-50 rounded-xl text-left font-semibold text-gray-500 hover:text-[#052558] transition-colors">
                        <Bell size={18} /> Notifications
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/40 border border-transparent hover:border-blue-50 rounded-xl text-left font-semibold text-gray-500 hover:text-[#052558] transition-colors">
                        <CreditCard size={18} /> Billing
                    </button>
                </div>

                {/* Main Settings Content */}
                <div className="md:col-span-9 space-y-6">

                    {/* Platform Info Form */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                        <div className="p-6 border-b border-[#e6f0fa]">
                            <h2 className="text-lg font-bold text-[#011023]">General Information</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage core details about the VehicleeCare platform.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Platform Name</label>
                                    <input type="text" defaultValue="VehicleeCare" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Support Email</label>
                                    <input type="email" defaultValue="support@vehicleecare.com" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Platform Description (SEO)</label>
                                <textarea rows="3" defaultValue="Premium door-to-door car repair and maintenance services." className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] custom-scrollbar"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Operational Settings */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                        <div className="p-6 border-b border-[#e6f0fa]">
                            <h2 className="text-lg font-bold text-[#011023]">Operational Settings</h2>
                            <p className="text-sm text-gray-500 mt-1">Configure booking rules and global fees.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                <div>
                                    <h3 className="font-bold text-[#011023] text-sm">Accept New Bookings</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Allow customers to schedule new services via the app.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Platform Fee (₹)</label>
                                    <input type="number" defaultValue="5" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Standard GST (%)</label>
                                    <input type="number" defaultValue="18" className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Settings;
