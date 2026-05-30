import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Shield, Clock, Wrench, DollarSign } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 h-screen flex items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-[#011023]">
                                Premium Car Care <br />
                                <span className="text-[#527FB0]">At Your Doorstep</span>
                            </h1>
                            <p className="text-lg text-gray-600 max-w-lg">
                                Experience hassle-free vehicle maintenance with our certified mechanics.
                                We bring the workshop to you, ensuring quality and convenience.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={() => navigate('/book-service', { state: { fromBookButton: true, isNewSession: true } })} className="px-8 py-3 bg-[#052558] hover:bg-[#052558]/90 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-900/20 flex items-center gap-2">
                                    Book Service <ArrowRight size={20} />
                                </button>
                                <a href="#contact" className="px-8 py-3 bg-white/50 hover:bg-white/80 text-[#052558] border border-[#052558]/10 rounded-lg font-semibold transition-all backdrop-blur-sm shadow-sm">
                                    Contact Us
                                </a>
                            </div>
                            <div className="pt-8 flex items-center gap-8 text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Star className="text-yellow-500 fill-yellow-500" size={20} />
                                    <span className="text-[#011023] font-medium">4.9/5 Rating</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="text-[#527FB0]" size={20} />
                                    <span className="text-[#011023] font-medium">Certified Pros</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative hidden md:block">
                            <div className="absolute -inset-4 bg-blue-200/50 rounded-full blur-3xl animate-pulse"></div>
                            {/* Placeholder for a hero image if user wants one, using a stylized div for now */}
                            <div className="relative bg-white/40 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/50 rotate-2 hover:rotate-0 transition-transform duration-500">
                                <div className="bg-gradient-to-tr from-blue-50 to-white rounded-xl overflow-hidden h-80 md:h-96 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                                    <div className="relative z-10 text-center p-6 bg-white/70 backdrop-blur-md rounded-xl border border-white/40 shadow-lg">
                                        <Wrench className="w-12 h-12 text-[#052558] mx-auto mb-2" />
                                        <h3 className="text-xl font-bold text-[#011023]">Expert Mechanics</h3>
                                        <p className="text-gray-600 text-sm">Dedicated to peak performance</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            {/* <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-[#011023] mb-4">Why Choose VehicleeCare?</h2>
                        <p className="text-gray-600">We combine technology with automotive expertise to deliver a seamless service experience.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <Clock className="w-8 h-8 text-[#527FB0]" />, title: "Time Saving", desc: "No more waiting at workshops. We service your car while you relax at home." },
                            { icon: <Shield className="w-8 h-8 text-[#527FB0]" />, title: "Warranty Assured", desc: "All our services come with a warranty on parts and labor for your peace of mind." },
                            { icon: <DollarSign className="w-8 h-8 text-[#527FB0]" />, title: "Transparent Pricing", desc: "Upfront quotes with no hidden charges. Pay only for what your car needs." }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300 hover:border-blue-100 group">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#527FB0] group-hover:text-white transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[#011023] mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {/* <section className="py-20 bg-gradient-to-r from-blue-50 to-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#011023] mb-6">Ready to give your car the care it deserves?</h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Join thousands of satisfied customers who trust VehicleeCare for their automotive needs.</p>
                    <Link to="/contact" className="inline-block px-10 py-4 bg-[#052558] text-white font-bold rounded-lg shadow-xl hover:bg-[#052558]/90 transition-colors transform hover:scale-105">
                        Schedule a Service
                    </Link>
                </div>
            </section>  */}
        </div>
    );
}
export default Home;
