import React from 'react';
import { Check } from 'lucide-react';

const Pricing = () => {
    return (
        <div className="bg-white min-h-screen flex items-center py-20 relative">
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-100/40 blur-3xl rounded-full -z-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-[#011023] mb-4">Transparent Pricing</h1>
                    <p className="text-gray-600">Choose a plan that suits your maintenance needs.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Basic Plan */}
                    <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#527FB0] transition-colors relative hover:shadow-xl transform hover:-translate-y-1">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Basic Care</h3>
                        <div className="text-4xl font-bold text-[#011023] mb-6">$199<span className="text-base font-normal text-gray-400">/year</span></div>
                        <ul className="space-y-4 mb-8">
                            {['2 General Services', 'Free Exterior Wash', 'Fluid Top-ups', '10% off on Labor'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600">
                                    <Check size={18} className="text-[#527FB0]" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl border-2 border-[#011023] text-[#011023] font-bold hover:bg-[#011023] hover:text-white transition-colors">Choose Basic</button>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-gradient-to-b from-[#011023] to-[#052558] rounded-2xl p-8 shadow-2xl transform md:-translate-y-4 relative overflow-hidden ring-4 ring-[#527FB0]/20">
                        <div className="absolute top-0 right-0 bg-[#527FB0] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Premium Shield</h3>
                        <div className="text-4xl font-bold text-white mb-6">$399<span className="text-base font-normal text-gray-400">/year</span></div>
                        <ul className="space-y-4 mb-8">
                            {['4 General Services', 'Unlimited Car Washes', 'Wheel Alignment', 'Prioritized Support', '20% off on Spares'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <Check size={18} className="text-[#527FB0]" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl bg-[#527FB0] text-white font-bold hover:bg-[#527FB0]/90 transition-colors shadow-lg shadow-[#527FB0]/20">Choose Premium</button>
                    </div>

                    {/* Ultimate Plan */}
                    <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#527FB0] transition-colors hover:shadow-xl transform hover:-translate-y-1">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Grand Tourer</h3>
                        <div className="text-4xl font-bold text-[#011023] mb-6">$699<span className="text-base font-normal text-gray-400">/year</span></div>
                        <ul className="space-y-4 mb-8">
                            {['Unlimited Services', 'Free Pickup & Drop', 'Deep Interior Cleaning', 'AC Maintenance', 'Quarterly Inspection'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600">
                                    <Check size={18} className="text-[#527FB0]" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl border-2 border-[#011023] text-[#011023] font-bold hover:bg-[#011023] hover:text-white transition-colors">Choose Ultimate</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
