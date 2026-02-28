import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Zap, Car, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight text-[#011023]">VehicleeCare</span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Business</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#benefits" className="text-slate-600 hover:text-[#011023] font-medium transition-colors">Benefits</a>
                            <a href="#categories" className="text-slate-600 hover:text-[#011023] font-medium transition-colors">Categories</a>
                        </div>
                        <div className="flex items-center">
                            <Link
                                to="/register"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                            >
                                Become a Partner <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-[#011023] tracking-tight mb-8">
                        Grow your business with <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            VehicleeCare
                        </span>
                    </h1>
                    <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Join thousands of garages, charging stations, and part stores leveraging the VehicleeCare network to reach more customers and manage their operations efficiently.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-[#011023] hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            Start Selling Today <ArrowRight size={20} />
                        </Link>
                        <a
                            href="#categories"
                            className="px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl font-bold text-lg transition-all shadow-sm hover:bg-slate-50 flex items-center justify-center"
                        >
                            Explore Categories
                        </a>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div id="benefits" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#011023] tracking-tight">Why partner with us?</h2>
                        <p className="mt-4 text-slate-500">We provide the tools and audience you need to scale.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Users size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#011023] mb-3">Reach More Customers</h3>
                            <p className="text-slate-500 leading-relaxed">Get instant access to thousands of vehicle owners looking for services in your specific area.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#011023] mb-3">Increase Revenue</h3>
                            <p className="text-slate-500 leading-relaxed">Fill your unused capacity, get booked in advance, and see your monthly revenue grow consistently.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#011023] mb-3">Secure Payments</h3>
                            <p className="text-slate-500 leading-relaxed">Never worry about no-shows. We process payments securely and deposit directly to your bank account.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div id="categories" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#011023] tracking-tight">Who can join?</h2>
                        <p className="mt-4 text-slate-500">We are expanding our network across multiple mobility sectors.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: 'Service Garages', icon: <Briefcase size={32} />, desc: 'For mechanics, detailers, and full-service auto repair shops.', color: 'text-orange-500', bg: 'bg-orange-50' },
                            { title: 'Charging Stations', icon: <Zap size={32} />, desc: 'For independent EV charging networks and individual station owners.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                            { title: 'Parking Lots', icon: <MapPin size={32} />, desc: 'For commercial parking structures and secure lot owners.', color: 'text-purple-500', bg: 'bg-purple-50' },
                            { title: 'Parts Stores', icon: <Car size={32} />, desc: 'For retailers selling OEM and aftermarket vehicle spare parts.', color: 'text-blue-500', bg: 'bg-blue-50' },
                        ].map((cat, i) => (
                            <div key={i} className="group relative bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${cat.bg} ${cat.color}`}>
                                    {cat.icon}
                                </div>
                                <h3 className="text-lg font-bold text-[#011023] mb-2">{cat.title}</h3>
                                <p className="text-sm text-slate-500">{cat.desc}</p>
                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className={cat.color} size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 bg-gradient-to-br from-[#011023] to-[#0a2540] text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-black mb-6">Ready to accelerate your growth?</h2>
                    <p className="text-xl text-slate-300 mb-10">Application takes less than 5 minutes. Our onboarding team will review and approve your account within 24 hours.</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#011023] rounded-2xl font-bold text-lg hover:bg-slate-100 transition-colors shadow-lg"
                    >
                        Apply Now <ArrowRight size={20} />
                    </Link>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="border-t border-slate-100 py-10 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 grayscale opacity-60">
                        <span className="font-bold text-slate-800">VehicleeCare</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">BUSINESS</span>
                    </div>
                    <p className="text-sm text-slate-400">© 2026 VehicleeCare. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

// Mock missing icons to avoid imports failing immediately
const Users = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const TrendingUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const ShieldCheck = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>;

export default LandingPage;
