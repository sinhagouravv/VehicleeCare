import React, { useState, useEffect, useCallback } from 'react';
import { UserSquare2, Loader2, Users, ShieldCheck, UserCheck, Shield, Wrench, Briefcase } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const StaffOverview = () => {
    const { triggerAlert } = useAlert();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchStaff = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/employees/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setStaff(data.data || []);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch staff overview", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        const interval = setInterval(() => fetchStaff(true), 5000); // Auto refresh every 5 seconds
        return () => clearInterval(interval);
    }, [fetchStaff]);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'Manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'Mechanic': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Technician': return 'bg-amber-100 text-amber-700 font-bold';
            case 'Support': return 'bg-indigo-100 text-indigo-700 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Mechanic': return <Wrench size={16} className="text-emerald-500" />;
            case 'Manager': return <Briefcase size={16} className="text-blue-500" />;
            case 'Technician': return <ShieldCheck size={16} className="text-amber-500" />;
            case 'Support': return <UserCheck size={16} className="text-indigo-500" />;
            case 'Admin': return <Shield size={16} className="text-purple-500" />;
            default: return <UserSquare2 size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Staff Overview</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                    {loading && !lastRefreshed ? (
                        <span>Refreshing...</span>
                    ) : lastRefreshed ? (
                        <span>
                            Last refreshed | {lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                    ) : null}
                    {loading && lastRefreshed && (
                        <Loader2 size={12} className="animate-spin text-[#527FB0]" />
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 uppercase gap-4 mb-4">
                {[
                    { label: 'Total Staff', value: staff.length, icon: <Users size={20} />, color: 'blue' },
                    { label: 'Mechanics', value: staff.filter(s => s.role === 'Mechanic').length, icon: <Wrench size={20} />, color: 'emerald' },
                    { label: 'Management', value: staff.filter(s => s.role === 'Manager' || s.role === 'Admin').length, icon: <Shield size={20} />, color: 'purple' },
                    { label: 'Verified', value: staff.filter(s => s.isVerified).length, icon: <ShieldCheck size={20} />, color: 'blue' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-xl border border-white px-6 py-4.5 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-gray-400 text-[10px] font-black tracking-widest">{stat.label}</p>
                            <span className="text-2xl font-black text-[#011023]">{stat.value}</span>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : stat.color === 'purple' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-[#527FB0]'}`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Staff Grid/Table */}
            <div className="bg-white/60 backdrop-blur-xl h-[50rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1 hide-scrollbar">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold w-[15%]">Staff ID</th>
                                <th className="p-4.5 font-bold w-[25%] text-left pl-12">Employee Details</th>
                                <th className="p-4.5 font-bold w-[15%]">Role</th>
                                <th className="p-4.5 font-bold w-[15%]">Shift</th>
                                <th className="p-4.5 font-bold w-[15%]">Join Date</th>
                                <th className="p-4.5 font-bold w-[15%]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading && staff.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="animate-spin text-[#527FB0]" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Compiling Records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : staff.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center text-gray-400 uppercase font-bold tracking-widest opacity-60">
                                        No staff records available.
                                    </td>
                                </tr>
                            ) : staff.map((member) => (
                                <tr key={member._id} className="hover:bg-blue-50/30 transition-all group">
                                    <td className="p-5">
                                        <span className="font-bold text-[#011023] tracking-wider bg-white/50 px-3 py-1.5 rounded-lg border border-white/80">
                                            {member.employeeId || '—'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-left pl-12">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[#011023] text-sm uppercase tracking-tight">{member.name}</span>
                                            <span className="text-[11px] font-semibold text-gray-400 lowercase mt-0.5">{member.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-wider ${getRoleBadge(member.role)}`}>
                                                {getRoleIcon(member.role)}
                                                {member.role || 'Staff'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${member.shift === 'Morning' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {member.shift || 'General'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-[#011023]">
                                                {new Date(member.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                Joined Portal
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${member.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            {member.isVerified ? (
                                                <><ShieldCheck size={12} /> Active</>
                                            ) : (
                                                'Pending'
                                            )}
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

export default StaffOverview;
