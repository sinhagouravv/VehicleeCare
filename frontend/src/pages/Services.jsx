import React from 'react';
import { Settings, Droplet, Disc, Battery, Thermometer, ShieldCheck } from 'lucide-react';

const Services = () => {
    const services = [
        { icon: <Settings className="w-8 h-8" />, title: "General Service", price: "$99", features: ["Engine Oil Change", "Oil Filter Replacement", "Air Filter Cleaning", "30-Point Check"] },
        { icon: <Droplet className="w-8 h-8" />, title: "Deep Cleaning", price: "$49", features: ["Interior Vacuuming", "Dashboard Polishing", "Exterior Foam Wash", "Tyre Dressing"] },
        { icon: <Disc className="w-8 h-8" />, title: "Brake Service", price: "$89", features: ["Front Brake Pads", "Rear Brake Cleaning", "Brake Fluid Top-up", "Brake Disc Check"] },
        { icon: <Battery className="w-8 h-8" />, title: "Battery Replacement", price: "$129", features: ["Old Battery Removal", "New Battery Installation", "Alternator Check", "Warranty Card"] },
        { icon: <Thermometer className="w-8 h-8" />, title: "AC Service", price: "$69", features: ["AC Gas Top-up", "Filter Cleaning", "Condenser Cleaning", "Cooling Check"] },
        { icon: <ShieldCheck className="w-8 h-8" />, title: "Full Inspection", price: "$39", features: ["Comprehensive Diagnostics", "Fluid Level Check", "Suspension Check", "Detailed Report"] },
    ];

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-primary-dark mb-4">Our Services</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">Comprehensive car care solutions designed to keep your vehicle running like new.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="w-14 h-14 bg-light-blue/30 rounded-lg flex items-center justify-center text-secondary-blue mb-6 group-hover:bg-primary-blue group-hover:text-white transition-colors duration-300">
                                    {service.icon}
                                </div>
                                <h3 className="text-xl font-bold text-primary-dark mb-2">{service.title}</h3>
                                <p className="text-3xl font-bold text-secondary-blue mb-6">{service.price}<span className="text-sm font-normal text-gray-400"> / starting</span></p>
                                <ul className="space-y-3">
                                    {service.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center text-gray-600 text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent-blue rounded-full mr-2"></span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                                <button className="w-full py-2 rounded-lg text-primary-blue font-semibold hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200">
                                    Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Services;
