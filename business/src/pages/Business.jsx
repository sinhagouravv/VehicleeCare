import React from 'react';
import { Briefcase, Zap, MapPin, Car, ArrowRight, TrendingUp, ShieldCheck, Clock } from 'lucide-react';

const sections = [
    {
        id: 'service',
        title: 'Service Garages',
        description: (
            <div className="space-y-2.5">
                <p>Connect your garage with drivers facing urgent breakdowns or planning scheduled maintenance in your area. Accept service requests instantly, reduce idle time, and keep your service bays consistently occupied throughout the day.</p>
                <p>Gain access to thousands of daily active vehicle owners actively searching for reliable and verified mechanics. Our intelligent matching system connects you with high-intent customers at the right moment, helping you generate steady and predictable revenue.</p>
                <p>Manage everything from one powerful dashboard automate bookings, send clear and professional estimates, track job status in real time, and monitor daily performance metrics without the hassle of paperwork. Build long-term customer relationships, collect verified reviews, and grow your garage into a trusted local service destination.</p>
                <p>Increase your visibility beyond traditional word-of-mouth marketing. With VehicleeCare, your garage appears in local searches, map listings, and emergency breakdown requests, giving you a strong digital presence that attracts new customers every day without extra advertising costs.</p>
                <p>Improve operational efficiency with smart scheduling tools that prevent double bookings and reduce no-shows through automated reminders. Track parts usage, monitor technician productivity, and optimize turnaround time to serve more customers without increasing overhead.</p>
                <p>Grow confidently with secure digital payments, transparent transaction records, and powerful performance insights that help you understand customer behavior. From onboarding to scaling your operations, our dedicated support team ensures your garage stays competitive in today’s fast-moving automotive market.</p>
            </div>
        ),
        icon: <Briefcase size={28} />,
        stats: ['2.5x Revenue Growth', 'Smart Dispatching', 'Instant Payments'],
        mapQuery: 'auto repair near me',
        color: 'blue'
    },
    {
        id: 'charging',
        title: 'Charging Stations',
        description: (
            <div className="space-y-2.5">
                <p>Connect your charging station with a growing network of EV owners searching for reliable and conveniently located charging points. Get discovered instantly by drivers planning trips or needing quick top-ups nearby.</p>
                <p>Increase station utilization by receiving real-time booking requests and availability updates directly through the platform. Reduce idle charging slots and maintain consistent daily traffic with smart demand matching.</p>
                <p>Display live availability, connector types, charging speeds, and transparent pricing to help drivers make quick and confident decisions. Provide seamless booking confirmations and build long-term customer trust.</p>
                <p>Manage reservations, monitor charging sessions, and track energy consumption from one centralized dashboard. Analyze peak hours and revenue trends to optimize pricing and maximize profitability.</p>
                <p>Enable secure digital payments with automated billing and instant transaction records. Funds are deposited directly into your account for smooth and hassle-free financial management.</p>
                <p>Strengthen your brand with verified reviews, promotional tools, and featured placement options that attract more EV drivers. With performance insights and dedicated support, scale your charging network confidently.</p>
                <p>Stay ahead of the growing electric mobility demand by positioning your station as a trusted charging destination. Our platform helps you capture repeat customers through loyalty-building features and consistent visibility.</p>
                <p>Receive automated notifications for new bookings, session completions, and payment confirmations. Keep operations smooth with smart scheduling tools that minimize wait times and improve customer satisfaction.</p>
                {/* <p>Expand your reach with promotional campaigns, seasonal offers, and premium placement options designed to increase traffic. As EV adoption rises, grow your charging business with scalable tools built for long-term success.</p> */}
            </div>
        ),
        icon: <Zap size={28} />,
        stats: ['Live Slot Booking', 'Dynamic Pricing', 'Usage Analytics'],
        mapQuery: 'ev charging station near me',
        color: 'emerald'
    },
    {
        id: 'parking',
        title: 'Parking Facilities',
        description: (
            <div className="space-y-2.5">
                <p>Connect your parking facility with drivers actively searching for safe and convenient parking spaces nearby. Get discovered instantly by users planning trips, office visits, shopping, or overnight stays.</p>
                <p>Maximize occupancy by accepting advance reservations and real-time parking requests directly through the platform. Reduce empty slots and maintain consistent daily utilization.</p>
                <p>Display live space availability, pricing details, operating hours, and entry instructions to help drivers make quick and confident decisions before arrival.</p>
                <p>Manage bookings, monitor entry and exit timings, and track space utilization from a centralized dashboard. Stay organized without manual registers or paperwork.</p>
                <p>Enable secure digital payments with automated billing and instant confirmations. Funds are transferred directly to your account for smooth financial management.</p>
                <p>Reduce disputes and confusion with transparent booking records and digital receipts. Our system keeps every transaction documented and easily accessible.</p>
                <p>Increase visibility through map listings, local search results, and promotional placements that attract more drivers during peak hours and special events.</p>
                <p>Collect verified customer reviews to build trust and improve your parking facility’s reputation. Higher ratings help you attract more repeat users.</p>
                <p>Scale your parking operations confidently with performance insights, occupancy analytics, and dedicated support designed to help you grow sustainably.</p>
                <p>Launch promotional offers, monthly passes, and priority parking options to increase recurring revenue. With scalable tools and marketing support, grow your parking business efficiently.</p>
            </div>
        ),
        icon: <MapPin size={28} />,
        stats: ['100% Utilization', 'Automated Entry', 'Long-term Permits'],
        mapQuery: 'parking lot near me',
        color: 'purple'
    },
    {
        id: 'stores',
        title: 'Stores',
        description: (
            <div className="space-y-2.5">
                <p>Connect your automotive store with vehicle owners actively searching for genuine parts, accessories, and maintenance products in your area. Get discovered by customers ready to purchase immediately.</p>
                <p>Showcase your full product catalog online with clear pricing, availability, and detailed descriptions. Help customers make informed buying decisions before visiting your store.</p>
                <p>Increase daily sales by receiving direct purchase inquiries and pre-orders through the platform. Convert online visibility into consistent in-store revenue.</p>
                <p>Manage inventory efficiently with real-time stock tracking and low-stock alerts. Stay prepared and avoid missed sales due to unavailable products.</p>
                <p>Offer secure digital payments with automated billing and instant confirmations. Ensure smooth transactions with funds deposited directly into your bank account.</p>
                <p>Promote special discounts, combo offers, and seasonal deals to attract more buyers. Highlight best-selling products to drive faster conversions.</p>
                <p>Gain visibility in local search results and map listings to increase foot traffic. Reach customers who are searching for nearby automotive stores.</p>
                <p>Track daily sales performance, popular products, and revenue trends from a centralized dashboard. Use real insights to optimize pricing and stock planning.</p>
                <p>Enable WhatsApp or direct contact integration for quick customer communication. Respond faster and close more sales efficiently.</p>
                <p>Expand your reach with featured placement options that put your store at the top of search results. Capture more attention during high-demand periods.</p>
                <p>Scale confidently with dedicated support, marketing tools, and performance analytics designed to help your automotive store grow sustainably.</p>
            </div>
        ),
        icon: <Car size={28} />,
        stats: ['B2B Sales', 'Live Inventory Sync', 'Local Delivery Net'],
        mapQuery: 'auto parts store near me',
        color: 'orange'
    }
];

const Business = () => {
    return (
        <div id="categories" className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20.5">
                <div className="text-center pt-10">
                    <h3 className="text-3xl md:text-3xl font-bold text-[#011023] tracking-tight mb-4">Business with VehicleeCare</h3>
                    <p className="text-slate-500 max-w-4xl mx-auto leading-relaxed text-base">
                        We are rapidly expanding our mobility network. If you operate in these critical sectors, you belong on our platform grids.
                    </p>
                </div>
            </div>

            {sections.map((section, index) => {
                const isEven = index % 2 === 0;

                return (
                    <div key={section.id} className={`min-h-[calc(100vh-120px)] ${index !== 0 ? 'lg:py-24' : 'lg:pb-24 lg:pt-0'} flex items-center relative ${index !== 0 ? 'border-t border-slate-100/50' : ''} even:bg-slate-50/50`}>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/60 via-transparent to-transparent -z-10" />

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                            <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12`}>

                                {/* Content Side */}
                                <div className="flex-1 space-y-5 w-full">
                                    <h3 className="text-3xl uppercase md:text-4xl text-center lg:text-3xl font-bold text-[#011023] leading-tight tracking-tight">
                                        {section.title}
                                    </h3>

                                    <div className="text-sm text-justify text-slate-500 leading-relaxed font-normal">
                                        {section.description}
                                    </div>

                                    {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                                        {section.stats.map((stat, i) => (
                                            <div key={i} className="flex flex-col gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 transition-colors hover:text-blue-600">
                                                    {i === 0 ? <TrendingUp size={20} /> : i === 1 ? <ShieldCheck size={20} /> : <Clock size={20} />}
                                                </div>
                                                <span className="font-bold text-[#011023] text-sm leading-snug">{stat}</span>
                                            </div>
                                        ))}
                                    </div> */}

                                    <div className="pt-2 text-center">
                                        <button className={`group inline-flex items-center gap-3 px-8 py-3 bg-${section.color}-600 hover:bg-${section.color}-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 shadow-lg shadow-${section.color}-600/20 hover:shadow-${section.color}-600/40 hover:-translate-y-1`}>
                                            Partner With Us
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Map Side: Google Maps iframe */}
                                <div className="w-full lg:max-w-[40rem] lg:mt-0">
                                    <div className="relative w-full h-[500px] lg:h-[750px] bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200 group">
                                        <iframe
                                            title={`${section.title} Map`}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(section.mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                            allowFullScreen
                                        ></iframe>

                                        {/* Overlay to prevent accidental map scrolling while scrolling the page, clicking removes pointer-events */}
                                        <div className="absolute inset-0 bg-transparent group-hover:pointer-events-none transition-all duration-300 flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 text-sm font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-auto mb-6 transform hover:scale-105 cursor-pointer pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.1)]">
                                                Click to interact with map
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Business;
