import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Droplet, Disc, Battery, Thermometer, ShieldCheck, ArrowRight, Star } from 'lucide-react';

const Services = () => {
    const navigate = useNavigate();

    // 6 premium services to fill a beautiful 3x2 grid
    const services = [
        { icon: <Settings className="w-6 h-6" />, title: "General Service", price: "₹19", features: ["Engine Oil Change", "Oil Filter Replacement", "30-Point Check"] },
        { icon: <Droplet className="w-6 h-6" />, title: "Deep Cleaning", price: "₹29", features: ["Interior Vacuum", "Foam Wash & Wax", "Tyre Dressing"] },
        { icon: <Disc className="w-6 h-6" />, title: "Brake Service", price: "₹39", features: ["Brake Pads Replacement", "Fluid Top-up", "Disc Resurfacing"] },
        { icon: <Battery className="w-6 h-6" />, title: "Battery Replacement", price: "₹49", features: ["Old Battery Removal", "New Battery Install", "Alternator Check"] },
        { icon: <Thermometer className="w-6 h-6" />, title: "AC Service", price: "₹59", features: ["AC Gas Top-up", "Filter Cleaning", "Cooling Coil Check"] },
        { icon: <ShieldCheck className="w-6 h-6" />, title: "Full Inspection", price: "₹69", features: ["Computer Diagnostics", "Fluid Levels", "Detailed Report"] },
    ];

    const handleBook = () => {
        navigate('/book-service', { state: { fromBookButton: true, isNewSession: true } });
    };

    return (
        <div id="services" className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#f0f6fc] to-white">
            {/* Abstract Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 flex flex-col justify-center h-full pt-20 pb-10">

                {/* Header Section */}
                <div className="text-center md:mb-5">
                    <h2 className="text-4xl upp md:text-4xl font-extrabold text-[#011023] mt-17 mb-4 tracking-tight">
                        Our Signature <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#052558] to-[#527FB0]">Services</span>
                    </h2>
                    <p className="text-gray-600 max-w-4xl mx-auto text-sm md:text-base leading-relaxed">
                        Comprehensive car care solutions utilizing advanced diagnostics and expertise to keep your vehicle in peak condition.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-5 flex-grow content-center">
                    {services.map((service, idx) => (
                        <div key={idx} className="group relative bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(5,37,88,0.08)]  transition-all duration-300 overflow-hidden flex flex-col">
                            {/* Card Hover Light Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                            <div className="p-5 md:p-6 relative z-10 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-xl flex items-center justify-center text-[#052558] group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#052558] group-hover:to-[#527FB0] group-hover:text-white transition-all duration-300 shadow-sm">
                                        {service.icon}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Starting at</p>
                                        <p className="text-2xl font-black text-[#527FB0] group-hover:text-[#052558] transition-colors">{service.price}</p>
                                    </div>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-[#011023] mb-3 group-hover:text-[#052558] transition-colors">{service.title}</h3>
                                <ul className="space-y-2 mb-4 flex-grow">
                                    {service.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center text-gray-600 text-xs md:text-sm font-medium">
                                            <div className="min-w-[6px] h-[6px] bg-gradient-to-r from-[#527FB0] to-[#052558] rounded-full mr-2.5 shadow-sm"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto pt-4 border-t border-gray-100/60">
                                    <button
                                        onClick={handleBook}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold text-[#052558] bg-white/60 border border-blue-100 hover:bg-[#052558] hover:text-white hover:border-[#052558] shadow-sm hover:shadow-md transition-all duration-300 flex justify-center items-center gap-2 group/btn"
                                    >
                                        Book Now
                                        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300 delay-75" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="flex justify-center mb-7 md:mt-5">
                    <button
                        onClick={handleBook}
                        className="group relative px-8 py-3 bg-[#011023] hover:bg-[#052558] text-white text-sm md:text-base font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        Explore All Services
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
};

export default Services;
