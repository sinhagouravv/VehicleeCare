import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, ClipboardList, Users, Settings, Star, TrendingUp, Wrench, Zap, ChevronLeft, LogOut, Bell, Mail, Briefcase, Car, ShoppingBag, UserSquare2, CreditCard } from 'lucide-react';
import Logo from '../assets/LOGO.svg';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login', { replace: true });
    };
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Analytics', path: '/analytics', icon: <TrendingUp size={20} /> },
        { name: 'Payments', path: '/payments', icon: <CreditCard size={20} /> },
        { name: 'Business', path: '/business', icon: <Briefcase size={20} /> },
        { name: 'Bookings', path: '/bookings', icon: <ClipboardList size={20} /> },
        { name: 'Users', path: '/users', icon: <Users size={20} /> },
        { name: 'Employees', path: '/employees', icon: <UserSquare2 size={20} /> },
        { name: 'Garages', path: '/garages', icon: <Building2 size={20} /> },
        { name: 'Services', path: '/services', icon: <Wrench size={20} /> },
        { name: 'Store', path: '/store', icon: <ShoppingBag size={20} /> },
        { name: 'Stations', path: '/charging-stations', icon: <Zap size={20} /> },
        { name: 'Parking', path: '/parking', icon: <Car size={20} /> },
        { name: 'Messages', path: '/messages', icon: <Mail size={20} /> },
        { name: 'Reviews', path: '/reviews', icon: <Star size={20} /> },
        { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-22' : 'w-67'} transition-all duration-300 bg-white/40 backdrop-blur-md transform-gpu border-r border-[#e6f0fa] h-screen fixed left-0 top-0 flex flex-col shadow-[4px_0_24px_rgba(5,37,88,0.02)] z-20`}>
            {/* Logo Area */}
            <div className={`pt-6 pl-4.5 pr-4.5 border-b border-[#e6f0fa] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} relative`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'block'}`}>
                    <img src={Logo} alt="VehicleeCare Logo" className="-ml-3 w-16 h-16 object-contain drop-shadow-md flex-shrink-0" />
                    <div className="-ml-4">
                        <h1 className="text-xl font-black tracking-tight text-semibold leading-none">VehicleeCare</h1>
                        <p className="text-[#527FB0] font-bold text-[10px] tracking-widest uppercase mt-0.5">Admin Panel</p>
                    </div>
                </div>
                {/* Logo icon only when collapsed */}
                {isCollapsed && (
                    <img
                        src={Logo}
                        alt="VehicleeCare Logo"
                        className="w-24 h-10 object-contain drop-shadow-md flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
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
            <nav className="flex-1 px-4 py-10 uppercase space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
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

            <div className="p-4 border-t text-sm border-[#e6f0fa] bg-white/20 mt-auto">
                <button
                    onClick={handleLogout}
                    className={`w-full bg-white/60 rounded-xl ${isCollapsed ? 'p-2 justify-center' : 'p-3 justify-start'} flex items-center gap-3 border border-white cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors text-gray-600 font-semibold group`}
                >
                    <div className={`${isCollapsed ? '' : 'pl-1'} flex-shrink-0 group-hover:text-red-500 transition-colors`}>
                        <LogOut size={16} />
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
