import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Settings, Wrench } from 'lucide-react';

const Sidebar = () => {
    // Garage-specific navigation
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'My Bookings', path: '/my-bookings', icon: <CalendarCheck size={20} /> },
        { name: 'Services', path: '/services', icon: <Wrench size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="w-64 bg-white/40 backdrop-blur-2xl border-r border-white/60 h-screen fixed left-0 top-0 flex flex-col shadow-[4px_0_24px_rgba(5,37,88,0.02)] z-20">
            {/* Logo Area */}
            <div className="p-6 border-b border-white/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#052558] to-[#527FB0] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20">
                        G
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-[#011023] leading-none">Vehiclee</h1>
                        <p className="text-[#527FB0] font-bold text-xs tracking-widest uppercase mt-0.5">Garage Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold ${isActive
                                ? 'bg-gradient-to-r from-[#052558] to-[#527FB0] text-white shadow-md translate-x-1'
                                : 'text-gray-600 hover:bg-blue-50/80 hover:text-[#052558]'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Profile/Logout Area */}
            <div className="p-4 border-t border-white/50 bg-white/20">
                <div className="bg-white/60 rounded-xl p-3 flex items-center justify-between border border-white cursor-pointer hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#052558] font-bold text-sm">
                            OM
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-[#011023] truncate">Owner Name</p>
                            <p className="text-[10px] text-gray-500 truncate">owner@garage.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
