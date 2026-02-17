import React from 'react';
import { Check } from 'lucide-react';

const Pricing = () => {
    return (
        <div className="bg-white min-h-screen py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-primary-dark mb-4">Transparent Pricing</h1>
                    <p className="text-gray-600">Choose a plan that suits your maintenance needs.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Basic Plan */}
                    <div className="border border-gray-200 rounded-2xl p-8 hover:border-secondary-blue transition-colors relative">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Basic Care</h3>
                        <div className="text-4xl font-bold text-primary-dark mb-6">$199<span className="text-base font-normal text-gray-400">/year</span></div>
                        <ul className="space-y-4 mb-8">
                            {['2 General Services', 'Free Exterior Wash', 'Fluid Top-ups', '10% off on Labor'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600">
                                    <Check size={18} className="text-secondary-blue" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl border-2 border-primary-dark text-primary-dark font-bold hover:bg-primary-dark hover:text-white transition-colors">Choose Basic</button>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-primary-dark rounded-2xl p-8 shadow-xl transform md:-translate-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-secondary-blue text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Premium Shield</h3>
                        <div className="text-4xl font-bold text-white mb-6">$399<span className="text-base font-normal text-gray-400">/year</span></div>
                        <ul className="space-y-4 mb-8">
                            {['4 General Services', 'Unlimited Car Washes', 'Wheel Alignment', 'Prioritized Support', '20% off on Spares'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <Check size={18} className="text-secondary-blue" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl bg-secondary-blue text-white font-bold hover:bg-secondary-blue/90 transition-colors shadow-lg shadow-secondary-blue/20">Choose Premium</button>
                    </div>

                    {/* Ultimate Plan */}
                    <div className="border border-gray-200 rounded-2xl p-8 hover:border-secondary-blue transition-colors">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Grand Tourer</h3>
                        <div className="text-4xl font-bold text-primary-dark mb-6">$699<span className="text-base font-normal text-gray-400">/year</span></div>
                        <ul className="space-y-4 mb-8">
                            {['Unlimited Services', 'Free Pickup & Drop', 'Deep Interior Cleaning', 'AC Maintenance', 'Quarterly Inspection'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600">
                                    <Check size={18} className="text-secondary-blue" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl border-2 border-primary-dark text-primary-dark font-bold hover:bg-primary-dark hover:text-white transition-colors">Choose Ultimate</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
