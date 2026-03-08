import React from 'react';
import { Users, Search, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';

const Customers = () => {
    const customers = [
        { id: 1, name: "Rahul Sharma", email: "rahul.s@example.com", phone: "+91 98765 43210", vehicles: 2, totalSpent: 15400, lastVisit: "Oct 24, 2023" },
        { id: 2, name: "Michael Chen", email: "michael.c@example.com", phone: "+91 87654 32109", vehicles: 1, totalSpent: 4200, lastVisit: "Oct 20, 2023" },
        { id: 3, name: "Sarah Jones", email: "sarah.j@example.com", phone: "+91 76543 21098", vehicles: 3, totalSpent: 35000, lastVisit: "Oct 15, 2023" },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight flex items-center gap-3">
                    Customers
                </h1>
                <button className="px-4 py-2 bg-gradient-to-r from-[#052558] to-[#1a3c75] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
                    + Add Customer
                </button>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex justify-between items-center bg-white/40">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search customers by name, phone, or email..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {customers.map((customer) => (
                        <div key={customer.id} className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-[#011023] opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={18} />
                            </button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl">
                                    {customer.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#011023] text-lg leading-tight">{customer.name}</h3>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                        {customer.vehicles} Vehicle{customer.vehicles > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail size={14} className="text-gray-400" />
                                    <span className="truncate">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{customer.phone}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-[#e6f0fa] flex justify-between items-center bg-gray-50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Spent</p>
                                    <p className="text-sm font-black text-[#011023]">₹{customer.totalSpent.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Visit</p>
                                    <p className="text-sm font-bold text-gray-600">{customer.lastVisit}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Customers;
