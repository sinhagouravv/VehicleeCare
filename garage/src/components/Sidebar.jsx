import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Settings, Wrench, Star, Bell, Menu, ChevronLeft, LogOut } from 'lucide-react';
import Logo from '../assets/LOGO.svg';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    // Garage-specific navigation
    const navItems = [
        { name: 'DASHBOARD', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'MY BOOKINGS', path: '/my-bookings', icon: <CalendarCheck size={20} /> },
        { name: 'SERVICES', path: '/services', icon: <Wrench size={20} /> },
        { name: 'REVIEWS', path: '/reviews', icon: <Star size={20} /> },
        { name: 'NOTIFICATIONS', path: '/notifications', icon: <Bell size={20} /> },
        { name: 'SETTINGS', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-22' : 'w-67'} transition-all duration-300 bg-white/40 backdrop-blur-md transform-gpu border-r border-white/60 h-screen fixed left-0 top-0 flex flex-col shadow-[4px_0_24px_rgba(5,37,88,0.02)] z-20`}>
            {/* Logo Area */}
            <div className={`p-6 border-b border-white/50 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} relative`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'block'}`}>
                    <img src={Logo} alt="VehicleeCare Logo" className="-ml-3 w-16 h-16 object-contain drop-shadow-md flex-shrink-0" />
                    <div className="-ml-4">
                        <h1 className="text-xl font-black tracking-tight text-semibold leading-none">VehicleeCare</h1>
                        <p className="text-[#527FB0] font-bold text-[10px] tracking-widest uppercase mt-0.5">Garage Panel</p>
                    </div>
                </div>
                {/* Logo icon only when collapsed */}
                {isCollapsed && (
                    <img
                        src={Logo}
                        alt="VehicleeCare Logo"
                        className="w-20 h-10 object-contain drop-shadow-md flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        onClick={toggleSidebar}
                    />
                )}

                {/* Toggle Button */}
                {!isCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute right-3 top-10 bg-white border border-blue-100 text-[#052558] rounded-full p-1 shadow-md hover:bg-blue-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-2 space-y-2.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        title={isCollapsed ? item.name : ""}
                        className={({ isActive }) =>
                            `flex items-center text-sm gap-3 ${isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'px-4 py-3'} rounded-xl transition-all duration-300 font-bold outline-none focus:outline-none ${isActive
                                ? 'bg-white text-[#011023] shadow-md'
                                : 'text-gray-500 hover:bg-white/50 items-center hover:text-[#011023]'
                            }`
                        }
                    >
                        {item.icon}
                        {!isCollapsed && <span>{item.name}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Profile/Logout Area */}
            <div className="p-4 border-t text-sm border-white/50 bg-white/20 mt-auto">
                <button
                    className={`w-full bg-white/60 rounded-xl ${isCollapsed ? 'p-2 justify-center' : 'p-3 justify-start'} flex items-center gap-3 border border-white cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors text-gray-600 font-semibold group`}
                    title={isCollapsed ? "Sign Out" : ""}
                >
                    <div className={`${isCollapsed ? '' : 'pl-1'} flex-shrink-0 group-hover:text-red-500 transition-colors`}>
                        <LogOut size={18} />
                    </div>
                    {!isCollapsed && (
                        <span>SIGN OUT</span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
