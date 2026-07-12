import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Clock, Calendar, ShieldCheck, LogOut, Loader2, Briefcase, BadgeCheck, PhoneCall, Home, Hash, Shield, CreditCard, FileCheck, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployeeProfile = async () => {
            try {
                const storedUser = localStorage.getItem('employeeUser');
                if (!storedUser) {
                    navigate('/login');
                    return;
                }
                const user = JSON.parse(storedUser);
                
                // Fetch latest data from specific Employee endpoint
                const res = await fetch(`http://localhost:5001/api/employees/${user._id || user.employeeId || user.id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setEmployee(data.data); // result is { success: true, data: employee }
                } else {
                    setEmployee(user);
                }
                setLastRefreshed(new Date());
            } catch (error) {
                console.error("Failed to fetch employee profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('employeeToken');
        localStorage.removeItem('employeeUser');
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-2">
                <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                <p className="text-sm font-medium tracking-widest uppercase opacity-60">Synchronizing identity...</p>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Employee Profile</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Profile Active | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                        : 'Loading Profile…'}
                </div>
            </div>

            {/* Main Content Area (Glassmorphism Container) */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                <div className="p-8 overflow-y-auto flex-1 hide-scrollbar">
                    
                    {/* Top Identity Block */}
                    <div className="flex flex-col md:flex-row gap-8 mb-12 w-full">
                        {/* Employee Identity */}
                        <div className="space-y-2 w-full md:w-[30%]">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Employee Identity</h4>
                            <div className="bg-blue-50/30 p-6 rounded-2xl uppercase space-y-4 border border-blue-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Briefcase size={80} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm flex mb-1.5 leading-relaxed tracking-wider">
                                        <span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Employee ID:</span> 
                                        <span className="font-bold text-[#052558]">{employee.employeeId || '—'}</span>
                                    </p>
                                    <p className="text-lg font-black text-[#011023] mb-2 uppercase leading-none">{employee.name}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-0.5 bg-white/80 text-[#052558] rounded-md text-[9px] font-black tracking-widest border border-blue-100">{employee.role || 'STAFF'}</span>
                                        <span className="px-2 py-0.5 bg-[#052558] text-white rounded-md text-[9px] font-black tracking-widest">{employee.category || 'GENERAL'}</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <BadgeCheck size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {employee.isVerified ? 'Background Verified' : 'Verification Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Metrics */}
                        <div className="space-y-2 w-full md:w-[35%]">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Professional Metrics</h4>
                            <div className="bg-blue-50/30 p-6 rounded-2xl uppercase space-y-4 border border-blue-50">
                                <p className="text-sm flex items-center leading-relaxed">
                                    <span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Shift Pattern:</span> 
                                    <span className="font-bold text-[#011023] flex items-center gap-2">
                                        <Clock size={12} className="text-blue-400" />
                                        {employee.shift || 'MORNING SHIFT'} 
                                    </span>
                                </p>
                                <p className="text-sm flex items-center leading-relaxed">
                                    <span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Salary Model:</span> 
                                    <span className="font-bold text-gray-700">{employee.salaryType || 'MONTHLY'}</span>
                                </p>
                                <p className="text-sm flex items-center leading-relaxed">
                                    <span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Joining Date:</span> 
                                    <span className="font-bold text-gray-700">{new Date(employee.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </p>
                            </div>
                        </div>

                        {/* Status & Security */}
                        <div className="flex flex-col gap-4 w-full md:w-[30%] ml-auto">
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Portal Security</h4>
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Digital ID Pointer</p>
                                        <span className="px-3 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200 text-[9px] font-black tracking-widest font-mono">
                                            {(employee._id || employee.id).substring(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Garage Mapping</p>
                                        <span className="px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200 text-[9px] font-black tracking-widest uppercase">
                                            {employee.garageId || 'NO MAPPING'}
                                        </span>
                                    </div>
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-rose-100 text-rose-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                        >
                                            <LogOut size={14} /> TERMINATE SESSION
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mid Section: Contact & Location */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* communication Center */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Communication Center</h4>
                            <div className="bg-white border border-[#e6f0fa] p-8 rounded-2xl shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="group">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Registered Email</p>
                                        <p className="text-[15px] font-bold text-[#052558] lowercase flex items-center gap-2 group-hover:text-[#527FB0] transition-colors">
                                            <Mail size={16} className="text-blue-400" />
                                            {employee.email}
                                        </p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Mobile contact</p>
                                        <p className="text-[15px] font-bold text-[#052558] uppercase flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                                            <PhoneCall size={16} className="text-emerald-400" />
                                            {employee.phone || 'NOT PROVIDED'}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-50 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Communication Status</p>
                                        <p className="text-xs font-bold text-[#052558] uppercase">Active and reachable for critical task updates.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Residential Protocol */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Residential Protocol</h4>
                            <div className="bg-white border border-[#e6f0fa] p-8 rounded-2xl shadow-sm space-y-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 text-left">Permanent Physical Address</p>
                                    <p className="text-[15px] font-bold text-[#052558] uppercase flex items-start gap-2 leading-relaxed text-left">
                                        <Home size={18} className="text-rose-400 shrink-0 mt-0.5" />
                                        {employee.address || 'CURRENTLY NOT MAPPED IN DATABASE'}
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 text-left">Region Division</p>
                                    <p className="text-sm font-bold text-gray-700 uppercase text-left">REGISTRY PENDING DATABASE MAPPING</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Compliance Documents */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Income Tax Index (PAN)</p>
                                <p className="text-sm font-bold text-[#052558] font-mono tracking-wider">{employee.panCard ? `XXXXX${employee.panCard.slice(-4)}` : 'NOT PROVIDED'}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <CreditCard size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Bio-Metric Identity (Aadhar)</p>
                                <p className="text-sm font-bold text-[#052558] font-mono tracking-wider">{employee.adharCard ? `XXXX XXXX ${employee.adharCard.slice(-4)}` : 'NOT PROVIDED'}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <FileCheck size={18} />
                            </div>
                        </div>

                        <div className="bg-[#011023] p-6 rounded-2xl shadow-lg flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Electoral Registry</p>
                                <p className="text-xs font-mono font-bold text-[#C2E8FF] tracking-widest">{employee.voterId || 'NONE REGISTERED'}</p>
                            </div>
                            <div className="p-3 bg-white/10 text-white rounded-xl">
                                <Landmark size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
