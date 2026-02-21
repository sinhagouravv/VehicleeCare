import React from 'react';
import { Search, MoreVertical, Shield, ShieldAlert, UserCheck } from 'lucide-react';

const Users = () => {
    // Mock Data
    const users = [
        { id: "USR-1092", name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+91 98765 43210", role: "Customer", joinDate: "Jan 12, 2023", status: "Active" },
        { id: "USR-1091", name: "Amit Patel", email: "amit.p@example.com", phone: "+91 91234 56780", role: "Franchise Owner", joinDate: "Oct 10, 2023", status: "Active" },
        { id: "USR-1090", name: "Priya Sharma", email: "priya.s@example.com", phone: "+91 99887 76655", role: "Customer", joinDate: "Nov 05, 2023", status: "Inactive" },
        { id: "USR-1001", name: "Admin System", email: "admin@vehicleecare.com", phone: "-", role: "Super Admin", joinDate: "Jan 01, 2023", status: "Active" },
    ];

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Super Admin': return 'bg-purple-100 text-purple-700 font-black';
            case 'Franchise Owner': return 'bg-blue-100 text-blue-800 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-semibold';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight">Manage Users</h1>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        Invite User
                    </button>
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">

                {/* Filters */}
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Roles</option>
                            <option>Customer</option>
                            <option>Franchise Owner</option>
                            <option>Admin</option>
                        </select>
                        <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold">User</th>
                                <th className="p-4 font-bold">Contact</th>
                                <th className="p-4 font-bold">Role</th>
                                <th className="p-4 font-bold">Join Date</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#052558] font-black shadow-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#011023]">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-700 text-sm">{user.email}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{user.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs rounded-lg ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-gray-600">{user.joinDate}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                                            <span className="text-sm font-semibold text-gray-700">{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {user.role === 'Customer' ? (
                                                <button className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Make Franchise/Admin">
                                                    <Shield size={18} />
                                                </button>
                                            ) : (
                                                <button className="text-gray-400 hover:text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Revoke Access">
                                                    <ShieldAlert size={18} />
                                                </button>
                                            )}
                                            <button className="text-gray-400 hover:text-[#052558] hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
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

export default Users;
