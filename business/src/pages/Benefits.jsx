import React from 'react';
import { Users, TrendingUp, ShieldCheck } from 'lucide-react';

const Benefits = () => {
    return (
        <div id="benefits" className="min-h-[100vh] py-24 relative flex items-center bg-gradient-to-br from-[#010814] via-[#051c3f] to-[#010814] overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="text-center mb-24">
                    <h2 className="text-sm font-black text-blue-400 tracking-[0.2em] uppercase mb-4 opacity-80">The VehicleeCare Advantage</h2>
                    <h3 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">Why partner with us?</h3>
                    <p className="text-xl text-blue-100/70 max-w-3xl mx-auto leading-relaxed font-light">
                        We provide the cutting-edge tools and massive auto-audience you need to scale your operations rapidly and securely.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 relative">
                    {/* Connecting line behind cards on desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent -translate-y-1/2 z-0"></div>

                    {[
                        { icon: <Users size={40} className="text-cyan-400" />, title: 'Reach Customers', desc: 'Instant access to thousands of verified vehicle owners looking for services in your area.', gradient: 'from-cyan-500/20 to-blue-500/20', glow: 'bg-cyan-500' },
                        { icon: <TrendingUp size={40} className="text-purple-400" />, title: 'Scale Revenue', desc: 'Fill unused capacity, secure advanced bookings, and watch your monthly revenue surge.', gradient: 'from-purple-500/20 to-indigo-500/20', glow: 'bg-purple-500' },
                        { icon: <ShieldCheck size={40} className="text-emerald-400" />, title: 'Secure Operations', desc: 'Automated, secure payments deposited directly. Never worry about no-shows again.', gradient: 'from-emerald-500/20 to-teal-500/20', glow: 'bg-emerald-500' }
                    ].map((benefit, i) => (
                        <div key={i} className="group relative z-10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2.5rem] p-px">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-[#011023]/90 rounded-[2.5rem] backdrop-blur-2xl" />
                            </div>
                            <div className="relative h-full bg-slate-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl transition-all duration-300 hover:-translate-y-3 group-hover:bg-slate-800/50 flex flex-col items-center text-center border border-white/5 select-none">

                                {/* Icon Container with Glow */}
                                <div className="relative mb-8">
                                    <div className={`absolute inset-0 ${benefit.glow} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 rounded-full`} />
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${benefit.gradient} border border-white/10 shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                                        {benefit.icon}
                                    </div>
                                </div>

                                <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-50 transition-colors">{benefit.title}</h4>
                                <p className="text-slate-400 leading-relaxed text-lg font-light group-hover:text-slate-300 transition-colors">{benefit.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Benefits;
