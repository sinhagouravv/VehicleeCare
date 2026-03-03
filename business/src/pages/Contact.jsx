import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Briefcase, Building2, User, CheckCircle } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, type: 'business', subject: `Business Inquiry from ${formData.company || formData.name}` };
            const res = await fetch('http://localhost:5001/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsSuccess(true);
                setFormData({ name: '', email: '', phone: '', company: '', message: '' });
                setTimeout(() => setIsSuccess(false), 5000);
            } else {
                alert("Failed to send message. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting message:", err);
            alert("Error sending message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-slate-50 pb-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center min-h-[calc(100vh-180px)]">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent -z-10" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10" />
            <div className="absolute top-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl -z-10" />

            <div className="max-w-[80rem] w-full px-4 md:px-8 mx-auto">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-4xl font-bold text-[#011023] mb-4">Get in Touch</h1>
                    <p className="text-base text-slate-500 max-w-2xl mx-auto">
                        Ready to accelerate your automotive business? Connect with our partnership team to explore growth opportunities with VehicleeCare.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 md:gap-5 lg:gap-5 w-full">
                    {/* Contact Information Card */}
                    <div className="lg:w-[35%] w-full animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
                        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full hover:shadow-2xl transition-shadow duration-300">
                            <div>
                                <h3 className="text-[24px] uppercase font-bold text-[#011023] mb-8 flex items-center gap-3">
                                    {/* <MessageSquare className="text-blue-600" size={24} /> */}
                                    Contact Information
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors border border-transparent group">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-blue-500 group-hover:scale-105 transition-transform">
                                            <Mail size={20} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                                            <a href="mailto:partners@vehicleecare.com" className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">partners@vehicleecare.com</a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50/30 hover:bg-emerald-50 transition-colors border border-transparent group">
                                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                                            <Phone size={20} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Call Us</p>
                                            <a href="tel:+9118001234567" className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors">+91 1800 123 4567</a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-purple-50/50 transition-colors border border-transparent group">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-purple-500 group-hover:scale-105 transition-transform">
                                            <MapPin size={20} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Headquarters</p>
                                            <span className="text-sm font-semibold text-slate-800 leading-snug block">Level 4, Tech Park<br />New Delhi, India 110001</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-10">
                                <h4 className="font-bold text-[#011023] mb-4 text-xs uppercase tracking-widest">Business Hours</h4>
                                <ul className="space-y-3 text-[13px] text-slate-500">
                                    <li className="flex justify-between items-center"><span className="text-slate-400">Monday - Friday</span> <span className="font-bold text-[#011023]">9:00 AM - 6:00 PM</span></li>
                                    <li className="flex justify-between items-center"><span className="text-slate-400">Saturday</span> <span className="font-bold text-[#011023]">10:00 AM - 4:00 PM</span></li>
                                    <li className="flex justify-between items-center"><span className="text-slate-400">Sunday</span> <span className="font-bold text-blue-400">Closed</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Card */}
                    <div className="lg:w-[65%] w-full animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both flex flex-col">
                        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden flex flex-col h-full">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/80 rounded-bl-full -z-0" />

                            <div className="relative z-10 flex flex-col h-full">
                                <h3 className="text-2xl uppercase font-bold text-[#011023] mb-3">Send us a Message</h3>
                                <p className="text-[13px] text-slate-500 mb-8 max-w-xl">Fill out the form below and our partnership team will get back to you shortly.</p>

                                <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6 mb-6">
                                        <div>
                                            <label htmlFor="name" className="block text-[12.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User className="h-4 w-4 text-slate-300" strokeWidth={2} />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-slate-100 hover:border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium text-[#011023] placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="company" className="block text-[12.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Company Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Building2 className="h-4 w-4 text-slate-300" strokeWidth={2} />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="company"
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-slate-100 hover:border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium text-[#011023] placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6">
                                        <div>
                                            <label htmlFor="email" className="block text-[12.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Mail className="h-4 w-4 text-slate-300" strokeWidth={2} />
                                                </div>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-slate-100 hover:border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium text-[#011023] placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-[12.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone className="h-4 w-4 text-slate-300" strokeWidth={2} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    required
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-slate-100 hover:border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium text-[#011023] placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8 flex-1 flex flex-col">
                                        <label htmlFor="message" className="block text-[12.5px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">How can we help?</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full p-4 rounded-[1.25rem] text-sm border border-slate-100 hover:border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium text-[#011023] placeholder:text-slate-300 resize-none flex-1 min-h-[140px]"
                                        />
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#081222] hover:bg-[#14233c] disabled:bg-slate-400 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-[#081222]/20 hover:-translate-y-0.5 group"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message
                                                    <Send size={15} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal Overlay */}
            {isSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSuccess(false)}
                    />
                    {/* Card */}
                    <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-sm w-full mx-auto animate-in zoom-in-95 duration-200 z-10">
                        <div className="bg-emerald-500 px-8 pt-8 pb-10 flex flex-col items-center">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                                        <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 pt-6 pb-8 flex flex-col items-center text-center -mt-5">
                            <div className="bg-white rounded-2xl shadow-sm px-6 py-4 w-full mb-6 border border-slate-100">
                                <h3 className="text-xl font-bold text-[#011023] mb-1">Message Sent! 🎉</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-1">Thank you for reaching out.</p>
                                <p className="text-gray-500 text-sm leading-relaxed">We will get back to you within <span className="font-bold text-[#011023]">24 hours</span>.</p>
                            </div>
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="w-full py-3.5 bg-[#011023] hover:bg-[#021836] text-white font-bold uppercase tracking-widest text-[11px] rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contact;
