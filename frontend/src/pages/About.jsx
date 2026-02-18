import React from 'react';
import { Users, Target, Award } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-white min-h-screen flex items-center py-20 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-white -z-10"></div>
            <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>

            <div className="w-full">
                <div className="text-center py-16 mb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl font-bold mb-4 text-[#011023]">About Us</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Building the future of automotive care through trust, transparency, and technology.</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-[#011023] mb-6">Our Mission</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                At VehicleeCare, we are on a mission to revolutionize the car service industry. We noticed a gap in the market for reliable, transparent, and convenient car care. Traditional workshops often lack transparency and require you to give up your valuable time.
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                We bridge this gap by bringing certified mechanics directly to you or providing pick-up and drop-off services for major repairs. Our goal is to make car ownership as stress-free as possible.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl text-center shadow-lg border border-white/50 transform hover:-translate-y-1 transition-transform">
                                <h3 className="text-4xl font-bold text-[#527FB0] mb-2">5+</h3>
                                <p className="text-gray-600 font-medium">Years Experience</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl text-center shadow-lg border border-white/50 transform hover:-translate-y-1 transition-transform">
                                <h3 className="text-4xl font-bold text-[#527FB0] mb-2">10k+</h3>
                                <p className="text-gray-600 font-medium">Cars Serviced</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl text-center shadow-lg border border-white/50 transform hover:-translate-y-1 transition-transform">
                                <h3 className="text-4xl font-bold text-[#527FB0] mb-2">50+</h3>
                                <p className="text-gray-600 font-medium">Expert Mechanics</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl text-center shadow-lg border border-white/50 transform hover:-translate-y-1 transition-transform">
                                <h3 className="text-4xl font-bold text-[#527FB0] mb-2">4.9</h3>
                                <p className="text-gray-600 font-medium">Customer Rating</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24">
                        <h2 className="text-3xl font-bold text-[#011023] mb-12 text-center">Our Core Values</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: <Users className="w-10 h-10 text-[#527FB0]" />, title: "Customer First", desc: "We prioritize your convenience and safety above everything else." },
                                { icon: <Target className="w-10 h-10 text-[#527FB0]" />, title: "Transparency", desc: "No hidden costs. We explain every repair in simple terms." },
                                { icon: <Award className="w-10 h-10 text-[#527FB0]" />, title: "Quality", desc: "We use only genuine parts and employ certified professionals." }
                            ].map((value, idx) => (
                                <div key={idx} className="bg-white/80 backdrop-blur-sm border border-white/60 p-8 rounded-xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-2">
                                    <div className="mb-4 bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center">{value.icon}</div>
                                    <h3 className="text-xl font-bold text-[#011023] mb-3">{value.title}</h3>
                                    <p className="text-gray-600">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
