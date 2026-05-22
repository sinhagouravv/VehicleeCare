import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, Clock, CheckCircle, Loader, Headphones } from 'lucide-react';
import Footer from '../components/Footer';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle | loading | success | error

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('http://localhost:5001/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                setTimeout(() => setStatus('idle'), 4000);
            } else {
                throw new Error("Failed to send message");
            }
        } catch (err) {
            console.error("Error sending message:", err);
            // Revert back or show error if preferred. Here we just log for now to prevent breaking UX flow.
            alert("Error sending message. Please try again.");
            setStatus('idle');
        }
    };

    const contactInfo = [
        {
            icon: <Phone size={22} />,
            label: 'Phone',
            value: '+91 98765 43210',
            sub: 'Mon–Sat, 9am–8pm'
        },
        {
            icon: <Headphones size={22} />,
            label: 'Customer Support',
            value: 'WhatsApp: +91 98765 43211',
            sub: 'Available 24/7'
        },
        {
            icon: <Mail size={22} />,
            label: 'Email',
            value: 'support@vehicleecare.com',
            sub: 'We reply within 24 hours'
        },
        {
            icon: <MapPin size={22} />,
            label: 'Head Office',
            value: 'Model Town, Jalandhar',
            sub: 'Punjab, India'
        },
        {
            icon: <Clock size={22} />,
            label: 'Working Hours',
            value: '9:00 AM – 8:00 PM',
            sub: 'Monday to Sunday'
        }
    ];

    return (
        <div className="bg-gradient-to-br from-white via-blue-50 to-white h-screen overflow-hidden flex flex-col relative">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100/40 blur-3xl rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-50/60 blur-3xl rounded-full pointer-events-none -z-10" />

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex items-center px-4 sm:px-6 lg:px-8 pb-45">
                <div className="max-w-[1215px] mx-auto w-full">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-[#011023] uppercase mb-4">Get in Touch</h1>
                        <p className="text-gray-500 max-w-2xl mx-auto">Have questions or need a quick service? Reach out and we'll get back to you right away.</p>
                    </div>

                    <div className="grid lg:grid-cols-5 mt-1 gap-5 items-start">
                        {/* Left: Contact Info */}
                        <div className="lg:col-span-2 space-y-4">
                            {contactInfo.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-4 bg-white/70 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="w-11 h-11 ml-1 bg-blue-50 rounded-lg flex items-center justify-center text-[#527FB0] shrink-0 group-hover:bg-[#052558] group-hover:text-white transition-colors">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-[#527FB0] uppercase tracking-wider mb-0.5">{item.label}</p>
                                        <p className="font-bold text-[#011023] text-sm">{item.value}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right: Contact Form */}
                        <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl p-7 rounded-2xl shadow-xl border border-white/50">
                            <h2 className="text-xl font-bold text-[#011023] -mt-2 mb-5">Send Us a Message</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/40 text-[#011023] text-sm placeholder-gray-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/40 text-[#011023] text-sm placeholder-gray-400 transition"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/40 text-[#011023] text-sm placeholder-gray-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Subject *</label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            required
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/40 text-[#011023] text-sm transition"
                                        >
                                            <option value="">Select a topic</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Book a Service">Book a Service</option>
                                            <option value="Complaint">Complaint</option>
                                            <option value="Partnership">Partnership</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Message *</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/40 text-[#011023] text-sm placeholder-gray-400 transition resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader size={18} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Popup Overlay */}
            {status === 'success' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#011023]/40 backdrop-blur-md"
                        onClick={() => setStatus('idle')}
                    />
                    {/* Card */}
                    <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full mx-4">
                        {/* Top gradient band */}
                        <div className="bg-gradient-to-r from-[#052558] to-[#527FB0] px-8 pt-8 pb-10 flex flex-col items-center">
                            {/* Animated ring + icon */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                                        <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                                    </div>
                                </div>
                                {/* Decorative dots */}
                                {/* <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" /> */}
                            </div>
                        </div>
                        {/* Content */}
                        <div className="px-8 pt-6 pb-8 flex flex-col items-center text-center -mt-5">
                            <div className="bg-white rounded-2xl shadow-sm px-6 py-4 w-full mb-4">
                                <h3 className="text-xl font-bold text-[#011023] mb-1">Message Sent! 🎉</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Thank you for reaching out.<br />We'll get back to you within <span className="font-semibold text-[#527FB0]">24 hours</span>.</p>
                            </div>
                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                Done
                            </button>
                            <p className="text-xs text-gray-400 mt-3">Click anywhere outside to dismiss</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-0 w-full">
                <Footer />
            </div>
        </div>
    );
};

export default Contact;
