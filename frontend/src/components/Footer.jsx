import React from 'react';
import { Facebook, Instagram, MapPin } from 'lucide-react';

const WhatsApp = ({ size = 18, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.232-.298.347-.497.114-.198.057-.371-.028-.543-.085-.173-.768-1.85-1.051-2.533-.277-.665-.562-.575-.772-.585-.198-.01-.424-.012-.65-.012-.227 0-.594.084-.905.424-.311.34-1.189 1.162-1.189 2.835 0 1.673 1.218 3.293 1.388 3.522.17.229 2.398 3.66 5.811 5.132 2.35 1.014 2.83 1.014 3.328.954.497-.06 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const Footer = () => {
    const openPolicy = (type, e) => {
        e.preventDefault();
        console.log("Opening policy:", type);
    };

    return (
        <footer className="bg-gradient-to-br from-gray-50 to-blue-50 text-gray-600 py-6 border-t border-white/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-6 text-center gap-10">
                    <div className="text-left">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-[#052558] to-[#527FB0] text-transparent bg-clip-text mb-4">VehicleeCare</h3>
                        <p className="text-justify w-45 text-gray-500 mb-6">Premium quality vehicle service at your doorstep quick and hassle-free.</p>
                        <div className="flex gap-5">
                            <Facebook size={18} className="text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                            <Instagram size={18} className="text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                            <WhatsApp size={20} className="pl-1 pb-0.5 text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                            <MapPin size={18} className="text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Home</li>
                            <li>About Us</li>
                            <li>Services</li>
                            <li>Reviews</li>
                            <li>Contact</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-4">User Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>My Account</li>
                            <li>My Bookings</li>
                            <li>My Payments</li>
                            <li>My Notifications</li>
                            <li>My Service History</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-4">Services</h4>
                        <ul className="space-y-2 text-sm">
                            <li>General Service</li>
                            <li>Engine & Mechanical</li>
                            <li>Inspection & Diagnostics</li>
                            <li>Battery & Charging</li>
                            <li>Roadside Assistance</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-4">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li>FAQ's</li>
                            <li>Careers</li>
                            <li>Support</li>
                            <li>Locations</li>
                            <li>Help Center</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-4 ml-8">For Business
                            <sup className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide ml-1 relative -top-2 cursor-pointer group">
                                BETA
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] normal-case font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center shadow-lg leading-tight">
                                    Our Business section is currently under development, but you may still submit your application.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </sup>
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>Join our team</li>
                            <li>Take a Franchise</li>
                            <li>Charging Stations</li>
                            <li>Dealer Partnership</li>
                            <li>Fleet Maintenance</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 flex flex-col md:flex-row justify-center items-center gap-10">
                    <p>&copy; 2026 VehicleeCare. All rights reserved.</p>
                    <div className="flex gap-10 md:gap-10 pt- flex-wrap justify-center">
                        <button onClick={(e) => openPolicy('terms', e)} className="hover:text-gray-600 transition-colors">Terms of Service</button>
                        <button onClick={(e) => openPolicy('privacy', e)} className="hover:text-gray-600 transition-colors">Privacy Policy</button>
                        <button onClick={(e) => openPolicy('security', e)} className="hover:text-gray-600 transition-colors">Security</button>
                        <button onClick={(e) => openPolicy('status', e)} className="hover:text-gray-600 transition-colors">Status</button>
                        <button onClick={(e) => openPolicy('docs', e)} className="hover:text-gray-600 transition-colors">Docs</button>
                        <button onClick={(e) => openPolicy('refund', e)} className="hover:text-gray-600 transition-colors">Refund Policy</button>
                        <button onClick={(e) => openPolicy('community', e)} className="hover:text-gray-600 transition-colors">Community</button>
                        <button onClick={(e) => openPolicy('cookie', e)} className="hover:text-gray-600 transition-colors">Cookie Policy</button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
