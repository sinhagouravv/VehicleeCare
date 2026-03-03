import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, Zap, MapPin, Car, ArrowRight, TrendingUp, ShieldCheck, Clock, X, Building2, User, Mail, Phone, Factory, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

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
        buttonClasses: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 hover:shadow-blue-600/40'
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
        buttonClasses: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-emerald-600/40'
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
        buttonClasses: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 hover:shadow-purple-600/40'
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
        buttonClasses: 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20 hover:orange-blue-600/40'
    }
];

const RegistrationModal = ({ activeForm, onClose, sections }) => {
    const sectionData = sections.find(s => s.id === activeForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        businessCategory: sectionData ? sectionData.title : '',
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        state: '',
        district: '',
        address: '',
        customField1: '', // Reused for the specialized field per type
        customField2: ''  // Reused for the specialized field per type
    });

    // Helper functions for dynamic strings
    const getCustomLabel1 = () => {
        switch (activeForm) {
            case 'service': return 'Primary Services (e.g., Wash, Repair, Tires)';
            case 'charging': return 'Supported Connectors (e.g., CCS, Type-2)';
            case 'parking': return 'Total Parking Slots Available';
            case 'stores': return 'Store Specialty (e.g., Tyres, Spares, Batteries)';
            default: return 'Additional Details';
        }
    };

    const getCustomLabel2 = () => {
        switch (activeForm) {
            case 'service': return 'Daily Capacity (Vehicles/Day)';
            case 'charging': return 'Total Charging Points';
            case 'parking': return 'Do you offer EV charging? (Yes/No)';
            case 'stores': return 'Do you offer Local Delivery? (Yes/No)';
            default: return 'Other Info';
        }
    };

    const textareaRef = React.useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'address' && textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    // Disable background scrolling when modal is open
    useEffect(() => {
        if (activeForm) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [activeForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Append the custom fields into a notes field before sending to the generic endpoint
            const submitData = {
                ...formData,
                taxId: `${getCustomLabel1()}: ${formData.customField1} | ${getCustomLabel2()}: ${formData.customField2}`
            };

            await axios.post('http://localhost:5001/api/business-requests', submitData);
            setIsSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!activeForm || !sectionData) return null;

    if (isSuccess) {
        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            >
                <div
                    className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 text-center border border-slate-100 animate-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#011023] mb-3">Partnership Requested!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Thank you for your interest in pairing your {sectionData.title} with VehicleeCare. Our integration team will contact you within 24-48 hours.
                    </p>
                    <button onClick={onClose} className="inline-block w-full bg-[#011023] hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors">
                        Got it, Thanks
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative border border-slate-100 my-4 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 -mb-5 md:p-8 border-b border-slate-100 bg-slate-50/50 relative">
                    <div className="flex-1 text-center">
                        <h3 className="text-2xl uppercase font-semibold text-[#011023] tracking-tight">{sectionData.title} Partner</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 absolute right-6 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Business Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="text" name="businessName" required value={formData.businessName} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Owner Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Owner Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Owner Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">State</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="text" name="state" required value={formData.state} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">District</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="text" name="district" required value={formData.district} onChange={handleChange}
                                        className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Full Business Address</label>
                            <div className="relative">
                                <div className="absolute top-3.5 left-3 pointer-events-none">
                                    <MapPin className="h-5 w-5 text-slate-400" />
                                </div>
                                <textarea
                                    name="address"
                                    required
                                    rows={1}
                                    value={formData.address}
                                    onChange={handleChange}
                                    ref={textareaRef}
                                    style={{ minHeight: '52px', overflow: 'hidden' }}
                                    className="w-full pl-10 pr-5 py-3.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium bg-slate-50 focus:bg-white resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl font-bold bg-[#011023] hover:bg-[#021836] disabled:bg-slate-400 text-white shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
                            >
                                {isSubmitting ? 'Sending Request...' : 'Send Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};



const Business = () => {
    const [activeForm, setActiveForm] = useState(null);

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

                                    <div className="pt-2 text-center">
                                        <button onClick={() => setActiveForm(section.id)} className={`group inline-flex items-center gap-3 px-8 py-3 ${section.buttonClasses} text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 shadow-lg hover:-translate-y-1`}>
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

            {/* Registration Modal Overlay */}
            {activeForm && (
                <RegistrationModal
                    activeForm={activeForm}
                    onClose={() => setActiveForm(null)}
                    sections={sections}
                />
            )}
        </div>
    );
};

export default Business;
