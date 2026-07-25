import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, ShieldCheck, MapPin, Loader2, User, Clock, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FormSkeleton } from '../components/Skeleton';

const Details = () => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const storedUser = localStorage.getItem('employeeUser');
                if (!storedUser) {
                    navigate('/login');
                    return;
                }
                const user = JSON.parse(storedUser);
                const res = await fetch(`http://localhost:5001/api/employees/${user._id || user.employeeId || user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setEmployee(data.data);
                } else {
                    setEmployee(user);
                }
            } catch (err) {
                console.error("Failed to fetch employee details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-[92rem] mx-auto animate-pulse">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
                    </div>
                </div>

                {/* Form Skeleton */}
                <FormSkeleton fields={6} />
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Employment Details</h1>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Official status & deployment assignment details</p>
                </div>
            </div>

            {/* Content layout */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] p-8 space-y-8">
                {/* Deployment Header Info */}
                <div className="flex items-center gap-6 pb-6 border-b border-[#e6f0fa]">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#052558] to-[#527FB0] flex items-center justify-center text-white text-xl font-bold">
                        {employee.name?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#011023] uppercase">{employee.name}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">ID: {employee.employeeId} • {employee.role || 'Staff'}</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${employee.isVerified ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {employee.isVerified ? 'Active & Verified' : 'Pending Verification'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase mt-1.5">Joined | {new Date(employee.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>

                {/* Info Blocks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Block 1: Assignment */}
                    <div className="bg-blue-50/30 border border-blue-50/60 p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-black text-[#052558] uppercase tracking-wider flex items-center gap-2">
                            <Briefcase size={16} className="text-[#527FB0]" /> Professional Assignment
                        </h3>
                        <div className="space-y-3 pt-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Designation:</span>
                                <span className="font-bold text-gray-700 uppercase">{employee.role || 'Staff'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Branch Category:</span>
                                <span className="font-bold text-gray-700 uppercase">{employee.category || 'Garage'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Garage Mapping:</span>
                                <span className="font-mono font-bold text-gray-700 text-xs">{employee.garageId || 'NO_MAP'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Block 2: Work Shift */}
                    <div className="bg-blue-50/30 border border-blue-50/60 p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-black text-[#052558] uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-[#527FB0]" /> Shift Schedule
                        </h3>
                        <div className="space-y-3 pt-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Current Pattern:</span>
                                <span className="font-bold text-gray-700 uppercase">{employee.shift || 'Morning Shift'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Hours / Week:</span>
                                <span className="font-bold text-gray-700">48 Hours</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Timings (EST):</span>
                                <span className="font-bold text-gray-700">09:00 AM - 06:00 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Block 3: Verification */}
                    <div className="bg-blue-50/30 border border-blue-50/60 p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-black text-[#052558] uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[#527FB0]" /> Portal Security & Clearances
                        </h3>
                        <div className="space-y-3 pt-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Work Status:</span>
                                <span className="font-bold text-emerald-600 uppercase">Authorized</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Background Check:</span>
                                <span className="font-bold text-emerald-600 uppercase">Verified</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Digital Pointer:</span>
                                <span className="font-mono text-xs text-gray-500">{(employee._id || employee.id).substring(0, 10)}...</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Work Specifications */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold text-[#011023] uppercase tracking-wide">Key Duties & Policy Consents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-white/40 border border-[#e6f0fa] rounded-xl">
                            <CheckSquare size={16} className="text-[#527FB0] shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-[#011023] uppercase">Shift Check-In Compliance</h4>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Agreed to punch-in and punch-out utilizing geolocation. Maximum of 3 late punches allowed before warning triggers.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-white/40 border border-[#e6f0fa] rounded-xl">
                            <CheckSquare size={16} className="text-[#527FB0] shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-[#011023] uppercase">Equipment & Safety Standards</h4>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Fully certified on workshop equipment operation. Safe handling and protective equipment guidelines acknowledged and signed.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Details;
