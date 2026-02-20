import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Users, MapPin, Settings, Star } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Bookings', path: '/bookings', icon: <CalendarCheck size={20} /> },
        { name: 'Users', path: '/users', icon: <Users size={20} /> },
        { name: 'Garages', path: '/garages', icon: <MapPin size={20} /> },
        { name: 'Reviews', path: '/reviews', icon: <Star size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="w-64 h-screen bg-white/60 backdrop-blur-xl border-r border-[#e6f0fa] flex flex-col fixed left-0 top-0 z-20 shadow-[4px_0_24px_rgba(5,37,88,0.02)]">
            <div className="h-20 flex items-center px-8 border-b border-[#e6f0fa]">
                <h1 className="text-2xl font-black text-[#011023] tracking-tighter">
                    Admin<span className="text-[#527FB0]">Panel</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
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

            <div className="p-4 border-t border-[#e6f0fa]">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                    <p className="text-sm font-bold text-[#052558] truncate">admin@vehicleecare.com</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
