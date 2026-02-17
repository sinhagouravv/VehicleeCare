import React from 'react';
import { Users, Target, Award } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-white min-h-screen">
            <div className="bg-primary-dark text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold mb-4">About Us</h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">Building the future of automotive care through trust, transparency, and technology.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-primary-dark mb-6">Our Mission</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            At VehicleeCare, we are on a mission to revolutionize the car service industry. We noticed a gap in the market for reliable, transparent, and convenient car care. Traditional workshops often lack transparency and require you to give up your valuable time.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            We bridge this gap by bringing certified mechanics directly to you or providing pick-up and drop-off services for major repairs. Our goal is to make car ownership as stress-free as possible.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <h3 className="text-4xl font-bold text-secondary-blue mb-2">5+</h3>
                            <p className="text-gray-600 font-medium">Years Experience</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <h3 className="text-4xl font-bold text-secondary-blue mb-2">10k+</h3>
                            <p className="text-gray-600 font-medium">Cars Serviced</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <h3 className="text-4xl font-bold text-secondary-blue mb-2">50+</h3>
                            <p className="text-gray-600 font-medium">Expert Mechanics</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl text-center">
                            <h3 className="text-4xl font-bold text-secondary-blue mb-2">4.9</h3>
                            <p className="text-gray-600 font-medium">Customer Rating</p>
                        </div>
                    </div>
                </div>

                <div className="mt-24">
                    <h2 className="text-3xl font-bold text-primary-dark mb-12 text-center">Our Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <Users className="w-10 h-10 text-secondary-blue" />, title: "Customer First", desc: "We prioritize your convenience and safety above everything else." },
                            { icon: <Target className="w-10 h-10 text-secondary-blue" />, title: "Transparency", desc: "No hidden costs. We explain every repair in simple terms." },
                            { icon: <Award className="w-10 h-10 text-secondary-blue" />, title: "Quality", desc: "We use only genuine parts and employ certified professionals." }
                        ].map((value, idx) => (
                            <div key={idx} className="bg-white border border-gray-100 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="mb-4">{value.icon}</div>
                                <h3 className="text-xl font-bold text-primary-dark mb-3">{value.title}</h3>
                                <p className="text-gray-600">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
