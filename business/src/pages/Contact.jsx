import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-6">
            <div className="text-center max-w-xl w-full">
                <h1 className="text-4xl font-bold text-[#011023] mb-4">Contact Us</h1>
                <p className="text-slate-500 mb-8">Have questions about joining the VehicleeCare B2B Network? Reach out to our partner success team.</p>

                <div className="flex flex-col gap-5 text-left border border-slate-200 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50">
                    <div className="flex items-center gap-4 text-slate-700">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                            <Mail size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                            <span className="font-semibold">partners@vehicleecare.com</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                            <Phone size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone</p>
                            <span className="font-semibold">+91 1800 123 4567</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Headquarters</p>
                            <span className="font-semibold">Level 4, Tech Park, New Delhi, India</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
