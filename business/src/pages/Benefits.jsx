import React from 'react';
import { Users, TrendingUp, ShieldCheck, BarChart3, HeadphonesIcon, CalendarDays, Package, Star, Settings } from 'lucide-react';

const Benefits = () => {
    return (
        <div id="benefits" className="min-h-[calc(100vh)] py-20 relative flex items-center bg-slate-50 border-t border-slate-100/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
                <div className="text-center mt-9 mb-12">
                    <h3 className="text-3xl md:text-4xl font-bold text-[#011023] tracking-tight mb-4">Benefits of VehicleeCare</h3>
                    <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-base">We provide the cutting-edge tools and massive auto-audience you need to scale your </p>
                    <p className="text-slate-500 max-w-xl mx-auto leading-relaxed text-base">operations rapidly and securely. Join the revolution. Start growing</p>
                    <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-base"> your business with confidence today.
 </p>
                </div>

                <div className="grid md:grid-cols-2 text-justify lg:grid-cols-3 gap-5.5">
                    {[
                        { icon: <Users size={24} />, title: 'REACH CUSTOMERS', desc: 'Gain instant access to verified vehicle owners searching for trusted services in your area. Our smart matching connects you with high-intent customers.', color: 'blue' },
                        { icon: <TrendingUp size={24} />, title: 'SCALE REVENUE', desc: 'Boost your business by filling unused capacity and securing bookings in advance. Partners see up to 40% revenue growth with targeted demand and smart pricing tools.', color: 'indigo' },
                        { icon: <ShieldCheck size={24} />, title: 'SECURE OPERATIONS', desc: 'Eliminate no-shows and delayed payments with our secure payment system. Funds go directly to your bank while we handle disputes for you.', color: 'emerald' },
                        { icon: <BarChart3 size={24} />, title: 'DEEP ANALYTICS', desc: 'Stop guessing and start tracking with a powerful, easy-to-use dashboard. Monitor performance, analyze customer trends, and optimize your services using real data.', color: 'purple' },
                        { icon: <HeadphonesIcon size={24} />, title: '24/7 SUPPORT', desc: 'You’re never alone on our platform. Get dedicated account support and 24/7 assistance to help your business grow smoothly at every stage.', color: 'orange' },
                        { icon: <CalendarDays size={24} />, title: 'SMART SCHEDULING', desc: 'Eliminate double bookings and conflicts with our AI-powered calendar. Automated reminders reduce no-shows and keep your workflow smooth.', color: 'rose' },
                        { icon: <Package size={24} />, title: 'ADVANCED INVENTORY', desc: 'Sync your parts catalog and track stock levels in real time. Get low-stock alerts and automate reordering from preferred suppliers.', color: 'sky' },
                        { icon: <Star size={24} />, title: 'BUILD REPUTATION', desc: 'Automatically collect and display verified reviews from customers. Build strong online trust, rank higher locally, and position your brand as a top service destination.', color: 'yellow' },
                        { icon: <Settings size={24} />, title: 'CRM INTEGRATION', desc: 'No need to replace your current tools. Easily integrate with your CRM, accounting, and inventory systems to create one unified operational hub.', color: 'teal' }
                    ].map((benefit, i) => (
                        <div key={i} className="group bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-100 flex flex-col">

                            {/* Icon and Title Container (Same Line) */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w - 12 h - 12 shrink - 0 rounded - 2xl flex items - center justify - center bg - ${benefit.color} -50 text - ${benefit.color} -600 group - hover: scale - 110 group - hover: bg - ${benefit.color} -100 transition - all duration - 300`}>
                                    {benefit.icon}
                                </div>
                                <h4 className="text-lg font-bold text-[#011023] uppercase tracking-wide">{benefit.title}</h4>
                            </div>

                            <p className="text-slate-500 leading-relaxed text-sm md:text-base group-hover:text-slate-600 transition-colors">
                                {benefit.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Benefits;
