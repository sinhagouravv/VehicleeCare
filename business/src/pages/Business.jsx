import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Zap, MapPin, Car, ArrowRight } from 'lucide-react';

const Business = () => {
    return (
        <div id="categories" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-sm font-black text-blue-600 tracking-widest uppercase mb-3">Partner Network</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-[#011023] tracking-tight">Who can join the network?</h3>
                        <p className="mt-5 text-xl text-slate-500">We are rapidly expanding our mobility network. If you operate in these sectors, we want you.</p>
                    </div>
                    <Link to="/register" className="hidden md:flex items-center gap-2 text-[#052558] font-bold uppercase tracking-wider hover:text-blue-600 transition-colors">
                        Join Now <ArrowRight size={20} />
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Service Garages', icon: <Briefcase size={36} />, desc: 'For mechanics, detailers, and full-service auto repair shops.', gradient: 'from-orange-400 to-rose-500', shadow: 'shadow-orange-500/20' },
                        { title: 'Charging Stations', icon: <Zap size={36} />, desc: 'For independent EV charging networks and station owners.', gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
                        { title: 'Parking Lots', icon: <MapPin size={36} />, desc: 'For commercial parking structures and secure lot owners.', gradient: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/20' },
                        { title: 'Parts Stores', icon: <Car size={36} />, desc: 'For verified retailers selling OEM and aftermarket spare parts.', gradient: 'from-[#052558] to-blue-500', shadow: 'shadow-blue-600/20' },
                    ].map((cat, i) => (
                        <div key={i} className="group relative bg-[#f8fafc] p-1 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
                            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${cat.shadow} blur-md -z-10`} />
                            <div className="bg-white p-8 rounded-[22px] h-full border border-slate-100 relative overflow-hidden z-10">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 bg-gradient-to-br ${cat.gradient} text-white shadow-lg`}>
                                    {cat.icon}
                                </div>
                                <h4 className="text-xl font-black text-[#011023] mb-3">{cat.title}</h4>
                                <p className="text-slate-500 leading-relaxed">{cat.desc}</p>
                                <div className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#011023] group-hover:text-amber-600 transition-colors">
                                    Explore <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Business;
