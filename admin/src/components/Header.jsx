import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-[#e6f0fa] flex items-center sticky top-0 z-10 shadow-[0_4px_24px_rgba(5,37,88,0.02)]">
            <div className="w-full max-w-[92rem] mx-auto  flex items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        // placeholder="Search bookings, users..."
                        className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] placeholder-gray-400"
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">

                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#052558] to-[#527FB0] flex items-center justify-center text-white shadow-sm">
                            <User size={18} />
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
