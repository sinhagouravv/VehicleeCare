import React from 'react';
import { UserSquare2, Search, Star, Phone, CheckCircle, Shield } from 'lucide-react';

const Staff = () => {
    const staffMembers = [
        { id: 1, name: "Amit Kumar", role: "Senior Mechanic", rating: 4.8, jobsCompleted: 342, status: "Active", phone: "+91 91234 56780" },
        { id: 2, name: "Vikram Singh", role: "Electrician", rating: 4.9, jobsCompleted: 156, status: "Active", phone: "+91 81234 56789" },
        { id: 3, name: "Suresh Babu", role: "Washing Expert", rating: 4.6, jobsCompleted: 520, status: "On Leave", phone: "+91 71234 56788" },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] uppercase tracking-tight">Staff Management</h1>
                <button className="px-4 py-2 bg-gradient-to-r from-[#052558] to-[#1a3c75] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
                    + Add Staff
                </button>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex justify-between items-center bg-white/40">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search staff members..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/30 border-b border-[#e6f0fa]">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Rating</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50/50">
                            {staffMembers.map((staff) => (
                                <tr key={staff.id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#011023] text-sm">{staff.name}</p>
                                                <p className="text-xs text-gray-400 font-medium">EMP-{1000 + staff.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-gray-700 text-sm flex items-center gap-1.5 ">
                                                {staff.role === 'Senior Mechanic' && <Shield size={14} className="text-blue-500" />}
                                                {staff.role}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-500">
                                                <Star size={12} fill="currentColor" /> {staff.rating}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                            <Phone size={14} className="text-gray-400" />
                                            {staff.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-[#011023]">
                                            {staff.jobsCompleted} <span className="text-xs text-gray-400 font-medium ml-1">Jobs Completed</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {staff.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Staff;
