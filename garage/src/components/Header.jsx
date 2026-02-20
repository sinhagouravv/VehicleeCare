import React from 'react';
import { Bell, Search, MapPin } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-20 px-8 flex items-center justify-between bg-white/40 backdrop-blur-xl border-b border-white/60 sticky top-0 z-20">
            {/* Search Bar */}
            <div className="relative w-96 hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search bookings, customers..."
                    className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] placeholder-gray-400"
                />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-green-700">Accepting Jobs</span>
                </div>

                <div className="flex items-center gap-2 text-gray-500 bg-white/60 px-3 py-1.5 rounded-lg border border-white">
                    <MapPin size={16} />
                    <span className="text-xs font-semibold">Mumbai, MH</span>
                </div>

                {/* Notifications */}
                <button className="relative w-10 h-10 flex items-center justify-center bg-white/60 border border-white rounded-xl text-gray-500 hover:text-[#052558] hover:bg-blue-50 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>
    );
};

export default Header;
