import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Car, Phone, Info, DollarSign, MessageSquare, Briefcase, User, LogOut, ChevronDown, MapPin } from 'lucide-react';
import logo from '../assets/logo.svg';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const profileRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
        }
        setIsProfileOpen(false);
    }, [location]);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const navItems = [
        { name: 'HOME', path: '#home', icon: <Car size={20} /> },
        { name: 'ABOUT', path: '#about', icon: <Info size={20} /> },
        { name: 'SERVICES', path: '#services', icon: <Briefcase size={20} /> },
        { name: 'LOCATE', path: '#locate', icon: <MapPin size={20} /> },
        // { name: 'Pricing', path: '#pricing', icon: <DollarSign size={20} /> },
        { name: 'REVIEWS', path: '#reviews', icon: <MessageSquare size={20} /> },
        { name: 'CONTACT', path: '#contact', icon: <Phone size={20} /> },
    ];

    const handleScroll = (e, path) => {
        e.preventDefault();
        const element = document.querySelector(path);
        if (element) {
            const offset = 0; // height of navbar
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setIsOpen(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 top-0 left-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo - Left */}
                    <div className="flex-shrink-0 cursor-pointer flex items-center -ml-5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src={logo} alt="VehicleeCare Logo" className="h-10 w-auto object-contain transition-transform hover:scale-105" />
                        {!user && (
                            <span className="text-2xl font-bold bg-gradient-to-r from-[#052558] to-[#527FB0] text-transparent bg-clip-text">
                                Vehiclee<span className="text-[#527FB0]">Care</span>
                            </span>
                        )}
                    </div>

                    {/* Navigation Links - Center */}
                    <div className="hidden md:flex flex-1 justify-center">
                        <div className="flex items-baseline space-x-1">
                            {navItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.path}
                                    onClick={(e) => handleScroll(e, item.path)}
                                    className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group text-gray-600 hover:text-[#052558] hover:bg-blue-50"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {item.name}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Auth Buttons / Profile - Right */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 text-[#052558] font-medium hover:text-[#527FB0] transition-colors focus:outline-none"
                                >
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#052558]">
                                        <User size={17} />
                                    </div>
                                    {/* <span className="max-w-[100px] truncate">{user.name}</span> */}
                                    {/* <ChevronDown size={16} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} /> */}
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-[#052558] truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-[#052558] hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                        >
                                            <User size={16} />
                                            Visit Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} className="px-7 py-2 bg-[#052558] text-white rounded-lg font-medium hover:bg-[#052558]/90 transition-all shadow-lg shadow-blue-900/20">Get Started</button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#052558] focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden absolute w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.path}
                                onClick={(e) => handleScroll(e, item.path)}
                                className="text-gray-600 hover:text-[#052558] hover:bg-blue-50 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                            >
                                {item.icon}
                                {item.name}
                            </a>
                        ))}
                        <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-3 px-3">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 py-2 px-1">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#052558]">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#052558]">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left bg-red-50 text-red-600 py-2 px-3 rounded-lg font-medium flex items-center gap-2">
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { navigate('/login'); setIsOpen(false); }} className="w-full text-left text-[#052558] font-medium py-2">Sign In</button>
                                    <button onClick={() => { navigate('/login'); setIsOpen(false); }} className="w-full bg-[#052558] text-white py-2 rounded-lg font-medium">Get Started</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
