import React, { useState, useEffect } from 'react';
import { Users, Target, Award, ShieldCheck, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const About = () => {
    const defaultMissionTexts = [
        { id: 1, content: "At VehicleeCare, we are on a mission to revolutionize car service. We noticed a gap in the market for reliable, transparent car care. Traditional workshops often lack transparency and waste your valuable time and resources." },
        { id: 2, content: "We bridge this gap by bringing certified mechanics directly to you or providing seamless pick-up and drop-off services for major repairs. Our ultimate goal is to make car ownership as stress-free and delightful as possible." },
        { id: 3, content: "We leverage advanced diagnostics and modern service standards to ensure precise, efficient repairs every time. By combining technology with expert craftsmanship, we minimize downtime and maximize your vehicle’s long-term performance and reliability." },
        { id: 4, content: "We believe great car care goes beyond repairs. From transparent communication and timely updates to dedicated customer support, we are committed to delivering a smooth, dependable experience built on trust and excellence." }
    ];

    const [missionTexts, setMissionTexts] = useState(defaultMissionTexts);

    useEffect(() => {
        const interval = setInterval(() => {
            setMissionTexts(prev => {
                const newTexts = [...prev];
                const first = newTexts.shift();
                newTexts.push(first);
                return newTexts;
            });
        }, 7000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div id="about" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#f0f6fc] to-white py-24">
            {/* Abstract Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-[30%] right-[-10%] w-[30%] h-[50%] bg-blue-300/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">

                {/* Header Section */}
                <div className="text-center mt-12 mb-10 md:mb-12">
                    <h1 className="text-4xl md:text-4xl font-extrabold text-[#011023] mb-4 tracking-tight">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#052558] to-[#527FB0]">VehicleeCare</span>
                    </h1>
                    <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
                        We deliver the future of automotive care by combining expertise, transparency, and technology.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-2">
                    {/* Mission Text Area */}
                    <div className="relative ">
                        <div className="absolute -left-6 mt-7 w-20 h-20 bg-blue-100/50 rounded-full blur-2xl -z-10"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#011023] mb-6">Our <span className="text-[#527FB0]">Mission</span></h2>
                        <div className="space-y-6 text-gray-600 leading-relaxed text-sm md:text-base h-[460px] sm:h-[420px] md:h-[360px] lg:h-[320px] relative flex flex-col">

                            {/* Static Outer Box for the top paragraph */}
                            <div className="bg-white/40 backdrop-blur-sm border-l-4 border-[#052558] rounded-r-xl shadow-sm overflow-hidden h-auto relative shrink-0">
                                <AnimatePresence initial={false} mode="wait">
                                    <motion.p
                                        key={missionTexts[0].id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="p-4 px-4 text-justify"
                                    >
                                        {missionTexts[0].content.includes("ultimate goal") ? (
                                            <>We bridge this gap by bringing certified mechanics directly to you or providing seamless pick-up and drop-off services for major repairs. Our ultimate goal is to make car ownership as stress-free and delightful as possible.</>
                                        ) : (
                                            missionTexts[0].content
                                        )}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            {/* Static space for the bottom paragraph to slide through */}
                            <div className="overflow-hidden relative flex-grow">
                                <AnimatePresence initial={false} mode="wait">
                                    <motion.p
                                        key={missionTexts[1].id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="px-4 text-justify absolute w-full"
                                    >
                                        {missionTexts[1].content.includes("ultimate goal") ? (
                                            <>We bridge this gap by bringing certified mechanics directly to you or providing seamless pick-up and drop-off services for major repairs. Our ultimate goal is to make car ownership as stress-free and delightful as possible.</>
                                        ) : (
                                            missionTexts[1].content
                                        )}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 -mt-10 gap-4 md:gap-6 relative">

                        {[
                            { number: "5+", label: "Years Experience", icon: <Award size={20} /> },
                            { number: "10k+", label: "Cars Serviced", icon: <Target size={20} /> },
                            { number: "50+", label: "Expert Mechanics", icon: <Zap size={20} /> },
                            { number: "4.9", label: "Customer Rating", icon: <Heart size={20} fill="currentColor" /> }
                        ].map((stat, idx) => (
                            <div key={idx} className="group bg-white/60 backdrop-blur-xl p-7 md:p-8.5 rounded-2xl text-center shadow-sm border border-white/60 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 text-blue-50/50 group-hover:text-blue-100/50 transform group-hover:scale-150 transition-all duration-500">
                                    {React.cloneElement(stat.icon, { size: 80 })}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#052558] to-[#527FB0] mb-2">{stat.number}</h3>
                                    <p className="text-gray-600 text-xs md:text-sm font-bold tracking-wide uppercase">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Core Values Section */}
                <div className="relative">

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        {[
                            { icon: <Users className="w-8 h-8" />, title: "Customer First", desc: "We prioritize your convenience, safety, and satisfaction above everything else in every decision we make daily. Through transparent processes, certified expertise, and very reliable service standards, we ensure a smooth and dependable experience." },
                            { icon: <ShieldCheck className="w-8 h-8" />, title: "Transparency", desc: "No hidden costs, no surprise fees. We explain every repair and part replacement in plain, simple terms. Before any work begins, you receive a clear breakdown of pricing and service details, so you always know exactly what you're paying for, with complete confidence and clarity." },
                            { icon: <Award className="w-8 h-8" />, title: "Premium Quality", desc: "We use only highly-rated genuine parts and employ rigorously certified, very well skilled, and experienced professionals. Every minor and major service undergoes strict quality checks to ensure your vehicle performs safely, reliably, and at its absolute best." }
                        ].map((value, idx) => (
                            <div key={idx} className="group bg-white/50 backdrop-blur-lg border border-white/60 p-7 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(5,37,88,0.08)] transition-all duration-300">
                                <div className="mb-6 w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center text-[#052558] group-hover:bg-gradient-to-br group-hover:from-[#052558] group-hover:to-[#527FB0] group-hover:text-white  transition-all duration-300 shadow-sm border border-blue-200/50">
                                    {value.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[#011023] mb-3 group-hover:text-[#052558] transition-colors">{value.title}</h3>
                                <p className="text-gray-600 text-justify text-sm leading-relaxed">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default About;
