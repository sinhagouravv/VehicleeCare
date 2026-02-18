import React from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <div className="bg-white min-h-screen flex items-center py-20 relative">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-[#011023] mb-6">Get in Touch</h1>
                        <p className="text-gray-600 mb-8 text-lg">
                            Have questions or need a quick service? Reach out to us and we'll get back to you immediately.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#527FB0]">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#011023]">Phone</h3>
                                    <p className="text-gray-600">+1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#527FB0]">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#011023]">Email</h3>
                                    <p className="text-gray-600">support@vehicleecare.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#527FB0]">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#011023]">Location</h3>
                                    <p className="text-gray-600">123 Auto Drive, Beverly Hills, CA 90210</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
                        <h2 className="text-2xl font-bold text-[#011023] mb-6">Send Message</h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                            </div>

                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#052558] to-[#011023] text-white font-bold rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                Send Message <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
