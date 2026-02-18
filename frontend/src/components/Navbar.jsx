import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Car, Phone, Info, DollarSign, MessageSquare, Briefcase } from 'lucide-react';
import logo from '../assets/logo.svg';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Home', path: '#home', icon: <Car size={20} /> },
        { name: 'About', path: '#about', icon: <Info size={20} /> },
        { name: 'Services', path: '#services', icon: <Briefcase size={20} /> },
        // { name: 'Pricing', path: '#pricing', icon: <DollarSign size={20} /> },
        { name: 'Reviews', path: '#reviews', icon: <MessageSquare size={20} /> },
        { name: 'Contact', path: '#contact', icon: <Phone size={20} /> },
    ];

    const handleScroll = (e, path) => {
        e.preventDefault();
        const element = document.querySelector(path);
        if (element) {
            const offset = 80; // height of navbar
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setIsOpen(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 top-0 left-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo - Left */}
                    <div className="flex-shrink-0 cursor-pointer flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src={logo} alt="VehicleeCare Logo" className="h-10 w-auto object-contain transition-transform hover:scale-105" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-[#052558] to-[#527FB0] text-transparent bg-clip-text">
                            Vehiclee<span className="text-[#527FB0]">Care</span>
                        </span>
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

                    {/* Auth Buttons - Right */}
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-[#052558] text-white rounded-lg font-medium hover:bg-[#052558]/90 transition-all shadow-lg shadow-blue-900/20">Get Started</button>
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
                            <button onClick={() => { navigate('/login'); setIsOpen(false); }} className="w-full bg-[#052558] text-white py-2 rounded-lg font-medium">Get Started</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
