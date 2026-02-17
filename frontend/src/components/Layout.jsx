import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Car, Phone, Info, DollarSign, MessageSquare, Briefcase } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Home', path: '/', icon: <Car size={20} /> },
        { name: 'About', path: '/about', icon: <Info size={20} /> },
        { name: 'Services', path: '/services', icon: <Briefcase size={20} /> },
        { name: 'Pricing', path: '/pricing', icon: <DollarSign size={20} /> },
        { name: 'Reviews', path: '/reviews', icon: <MessageSquare size={20} /> },
        { name: 'Contact', path: '/contact', icon: <Phone size={20} /> },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 transition-all duration-300 bg-primary-dark/95 backdrop-blur-sm border-b border-primary-blue/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-secondary-blue to-primary-blue p-2 rounded-lg shadow-lg shadow-primary-blue/20">
                            <Car className="h-8 w-8 text-white" strokeWidth={1.5} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-light-blue to-white font-sans">
                            Vehiclee<span className="text-secondary-blue">Care</span>
                        </span>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group ${isActive(item.path)
                                            ? 'text-white bg-primary-blue/40 shadow-[0_0_15px_rgba(5,37,88,0.3)] border border-primary-blue/30'
                                            : 'text-gray-300 hover:text-white hover:bg-primary-blue/20'
                                        }`}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {item.name}
                                    </span>
                                    {isActive(item.path) && (
                                        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-blue/20 to-secondary-blue/20 blur opacity-50" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-primary-blue/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-white"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-primary-dark/95 backdrop-blur-xl border-b border-primary-blue/30">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center gap-3 transition-colors ${isActive(item.path)
                                        ? 'text-white bg-primary-blue/40 border border-primary-blue/30 shadow-lg'
                                        : 'text-gray-300 hover:text-white hover:bg-primary-blue/20'
                                    }`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

const Footer = () => {
    return (
        <footer className="bg-primary-dark text-white border-t border-primary-blue/30 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-tr from-secondary-blue to-primary-blue p-2 rounded-lg">
                                <Car className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-blue to-white">
                                Vehiclee<span className="text-secondary-blue">Care</span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Premium vehicle maintenance and repair services tailored for performance and reliability. Experience the future of car care.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-light-blue">Services</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Engine Diagnostics
                            </li>
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Oil Change & Fluids
                            </li>
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Brake Repair
                            </li>
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Tire Services
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-light-blue">Company</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>About Us
                            </li>
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Careers
                            </li>
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Blog
                            </li>
                            <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary-blue"></span>Contact
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-light-blue">Newsletter</h3>
                        <p className="text-gray-400 text-sm mb-4">Subscribe for latest updates and offers.</p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-primary-blue/20 border border-primary-blue/40 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secondary-blue transition-colors"
                            />
                            <button className="bg-secondary-blue hover:bg-secondary-blue/80 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-secondary-blue/20">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-primary-blue/30 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">© 2024 VehicleeCare. All rights reserved.</p>
                    <div className="flex gap-6 text-gray-500 text-sm">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-grow pt-20">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
