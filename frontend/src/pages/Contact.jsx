import React from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <div className="bg-white min-h-screen py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-16">
                    <div>
                        <h1 className="text-4xl font-bold text-primary-dark mb-6">Get in Touch</h1>
                        <p className="text-gray-600 mb-12">
                            Have questions about our services or need to book an urgent repair?
                            Reach out to us and our support team will get back to you shortly.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="bg-light-blue/20 p-3 rounded-lg text-primary-blue">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary-dark">Phone</h3>
                                    <p className="text-gray-600">+1 (555) 123-4567</p>
                                    <p className="text-sm text-gray-400">Mon-Sat 9am to 6pm</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-light-blue/20 p-3 rounded-lg text-primary-blue">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary-dark">Email</h3>
                                    <p className="text-gray-600">support@vehicleecare.com</p>
                                    <p className="text-sm text-gray-400">Online 24/7</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-light-blue/20 p-3 rounded-lg text-primary-blue">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary-dark">Office</h3>
                                    <p className="text-gray-600">123 Auto Avenue, Tech City</p>
                                    <p className="text-sm text-gray-400">Innovation District, ST 90210</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-lg">
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-blue focus:border-transparent outline-none transition-all" placeholder="John" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-blue focus:border-transparent outline-none transition-all" placeholder="Doe" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-blue focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea rows="4" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-blue focus:border-transparent outline-none transition-all" placeholder="How can we help you?"></textarea>
                            </div>

                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary-blue to-primary-dark text-white font-bold rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
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
