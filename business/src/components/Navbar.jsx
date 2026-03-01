import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import logo from '../assets/logo.svg';

const Navbar = () => {
    const navigate = useNavigate();
    const navLinkClass = "text-sm font-bold text-gray-500 hover:text-[#011023] transition-colors cursor-pointer uppercase tracking-wider";

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [businessUser, setBusinessUser] = useState(null);

    // Initial load check for authentication status
    useEffect(() => {
        const token = localStorage.getItem('businessToken');
        const user = localStorage.getItem('businessUser');
        if (token && user) {
            setIsLoggedIn(true);
            setBusinessUser(JSON.parse(user));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('businessToken');
        localStorage.removeItem('businessUser');
        setIsLoggedIn(false);
        setBusinessUser(null);
        navigate('/');
    };

    return (
        <nav className="fixed w-full z-50 top-0 left-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 
                  Using relative so the center element can be absolute positioned 
                  to guarantee perfectly symmetrical centering regardless of left/right widths
                */}
                <div className="flex items-center justify-between h-20 relative">

                    {/* LEFT: Logo */}
                    <div className="flex items-center flex-1">
                        <Link to="/" className="flex items-center gap-2">
                            {isLoggedIn ? (
                                <img src={logo} alt="VehicleeCare Business" className="-ml-5 w-20 object-contain" />
                            ) : (
                                <>
                                    <img src={logo} alt="VehicleeCare Logo" className="-ml-5 w-20 object-contain transition-transform hover:scale-105" />
                                </>
                            )}
                        </Link>
                    </div>

                    {/* CENTER: Links (Always strictly centered) */}
                    <div className="hidden lg:flex uppercase absolute left-1/2 -translate-x-1/2 space-x-2 items-center z-10">
                        <a href="/#home" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Home</a>
                        <a href="/#categories" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Business</a>
                        <a href="/#benefits" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Benefits</a>
                        {!(isLoggedIn && businessUser?.subscriptionStatus === 'active') && (
                            <a href="/#pricing" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Pricing</a>
                        )}
                        <a href="/#locate" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Locate</a>
                        <a href="/#reviews" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Reviews</a>
                        <a href="/#contact" className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:text-[#052558] hover:bg-blue-50">Contact</a>
                    </div>

                    {/* RIGHT: Auth/Profile Button */}
                    <div className="flex items-center flex-1 justify-end">
                        {isLoggedIn ? (
                            <div className="group relative">
                                <Link
                                    to="/profile"
                                    className="w-9.5 h-9.5 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#527FB0] hover:bg-blue-100 hover:text-blue-600 transition-all shadow-sm group-hover:shadow-md cursor-pointer"
                                >
                                    <User size={17} />
                                </Link>

                                {/* Hover Dropdown Menu */}
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-sm uppercase font-black text-[#011023] truncate">{businessUser?.name}</p>
                                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{businessUser?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <Link
                                            to="/profile"
                                            className="w-full text-left px-3 py-2.5 text-sm text-[#052558] hover:bg-blue-50 hover:text-blue-700 rounded-xl font-bold transition-colors flex items-center gap-2"
                                        >
                                            <User size={16} /> Visit Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-gradient-to-r from-[#052558] to-[#527FB0] hover:opacity-90 active:scale-95 text-white font-black tracking-widest uppercase transition-all shadow-md hover:shadow-lg px-8 py-3 rounded-xl text-xs"
                            >
                                SIGN IN
                            </Link>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;
