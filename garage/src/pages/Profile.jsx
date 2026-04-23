import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Clock, Calendar, Plus, Wrench, ShieldCheck, Globe, Trash2, LogOut, Loader2, Star, Shield, Smartphone, ArrowRight, Building2, ExternalLink, CreditCard, FileCheck, Landmark } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [garage, setGarage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const navigate = useNavigate();



    useEffect(() => {
        const fetchGarageProfile = async () => {
            try {
                const storedUser = localStorage.getItem('garageUser');
                if (!storedUser) {
                    navigate('/login');
                    return;
                }
                const user = JSON.parse(storedUser);
                
                // Fetch latest data from specific Garage endpoint (backend now handles dbId or 9-digit id)
                const res = await fetch(`http://localhost:5001/api/garages/${user.dbId || user._id || user.id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setGarage(data.data); // result is { success: true, data: garage }
                } else {
                    setGarage(user);
                }
                setLastRefreshed(new Date());
            } catch (error) {
                console.error("Failed to fetch garage profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGarageProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('garageToken');
        localStorage.removeItem('garageUser');
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-2">
                <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                <p className="text-sm font-medium tracking-widest uppercase opacity-60">Architecting profile data...</p>
            </div>
        );
    }

    if (!garage) return null;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header (Leave.jsx style) */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Garage Profile</h1>
                {/* <div className="flex items-center gap-4">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-[13px] px-12 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-opacity uppercase tracking-tighter text-sm">
                        <Plus size={18} />
                        Edit Profile
                    </button>
                </div> */}
            </div>


            {/* Main Content Area (Leave.jsx Glassmorphism Container) */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                <div className="p-8 overflow-y-auto flex-1 hide-scrollbar">
                    
                    {/* Top Identity Block */}
                    <div className="flex flex-col md:flex-row gap-8 mb-12 w-full">
                        {/* Garage Identity */}
                        <div className="space-y-2 w-full md:w-[30%]">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Garage Identity</h4>
                            <div className="bg-blue-50/30 p-6 rounded-2xl uppercase space-y-4 border border-blue-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Building2 size={80} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm flex mb-1.5 leading-relaxed tracking-wider">
                                        <span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Garage ID:</span> 
                                        <span className="font-bold text-[#052558]">{garage.garageId || garage.id || '—'}</span>
                                    </p>
                                    <p className="text-lg font-black text-[#011023] mb-2 uppercase leading-none">{garage.name}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {garage.type && Array.isArray(garage.type) ? garage.type.map((t, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-white/80 text-[#052558] rounded-md text-[9px] font-black tracking-widest border border-blue-100">{t}</span>
                                        )) : (
                                            <span className="px-2 py-0.5 bg-white/80 text-[#052558] rounded-md text-[9px] font-black tracking-widest border border-blue-100">PREMIUM SERVICE</span>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="flex items-center gap-0.5 text-amber-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} fill={i < (garage.rating || 4) ? "currentColor" : "none"} stroke="currentColor" className={i < (garage.rating || 4) ? "" : "text-gray-300"} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">({garage.rating || '4.0'})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ownership Details */}
                        <div className="space-y-2 w-full md:w-[35%]">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ownership details</h4>
                            <div className="bg-blue-50/30 p-6 rounded-2xl uppercase space-y-4 border border-blue-50">
                                <p className="text-sm flex items-center leading-relaxed"><span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Owner Name:</span> <span className="font-bold text-[#011023]">{garage.ownerName || 'NOT AVAILABLE'}</span></p>
                                <p className="text-sm flex items-center leading-relaxed"><span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Email:</span> <span className="font-bold text-gray-700 lowercase truncate">{garage.ownerEmail || garage.email || '—'}</span></p>
                                <p className="text-sm flex items-center leading-relaxed"><span className="text-gray-500 w-24 shrink-0 uppercase text-[10px] font-black">Contact No:</span> <span className="font-bold text-gray-700">{garage.ownerContact || garage.phone || '—'}</span></p>
                            </div>
                        </div>

                        {/* Status & Verification */}
                        <div className="flex flex-col gap-4 w-full md:w-[30%] ml-auto">
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Security & Status</h4>
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Verification Status</p>
                                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-[0.1em] uppercase ${garage.partner ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                            {garage.partner ? 'Verified Partner' : 'Standard Member'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Facility Level</p>
                                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-[0.1em] uppercase ${garage.pickupDrop ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {garage.pickupDrop ? 'Pickup & Drop Active' : 'Basic Facilities'}
                                        </span>
                                    </div>
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-rose-100 text-rose-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                        >
                                            <LogOut size={14} /> SIGN OUT ACCOUNT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mid Section: Operations & Location */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Operations Center */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Operations Center</h4>
                            <div className="bg-white border border-[#e6f0fa] p-8 rounded-2xl shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Working Hours</p>
                                        <p className="text-[15px] font-bold text-[#052558] uppercase flex items-center gap-2">
                                            <Clock size={16} className="text-blue-400" />
                                            {garage.workingHours || '09:00 AM - 08:00 PM'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Operating Cycles</p>
                                        <p className="text-[15px] font-bold text-[#052558] uppercase flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-400" />
                                            {garage.workingDays || 'Monday - Saturday'}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-50">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">Service Capabilities</p>
                                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-600 uppercase leading-relaxed tracking-tight">
                                            {garage.services || 'Premium multi-brand vehicle service, specialized repair, and maintenance logistics support for all variants.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Protocol */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Location Protocol</h4>
                            <div className="bg-white border border-[#e6f0fa] p-8 rounded-2xl shadow-sm space-y-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 text-left">Registered Physical Address</p>
                                    <p className="text-[15px] font-bold text-[#052558] uppercase flex items-start gap-2 leading-relaxed text-left">
                                        <MapPin size={18} className="text-rose-400 shrink-0 mt-0.5" />
                                        {garage.address || 'CURRENTLY NOT MAPPED IN DATABASE'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-2">
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">State Registry</p>
                                        <p className="text-sm font-bold text-gray-700 uppercase">{garage.state || 'PENDING'}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">District Division</p>
                                        <p className="text-sm font-bold text-gray-700 uppercase">{garage.district || 'PENDING'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Contact Channels & Geo-Mapping */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Business Comms</p>
                                <p className="text-sm font-bold text-[#052558]">{garage.phone || garage.ownerContact || '—'}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Smartphone size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">WhatsApp Protocol</p>
                                <p className="text-sm font-bold text-[#052558]">{garage.whatsapp || garage.phone || '—'}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <ExternalLink size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-[#1a3a6d] transition-all text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Geo-Coordinates</p>
                                <p className="text-xs font-mono font-bold text-[#527FB0] tracking-widest">{garage.coordinates || '22.5726° N, 88.3639° E'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 text-slate-500 rounded-xl group-hover:bg-[#052558] group-hover:text-white transition-all">
                                <Globe size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Final Section: Compliance Documents */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Business PAN Index</p>
                                <p className="text-sm font-bold text-[#052558] font-mono tracking-wider">{garage.panCard ? `XXXXX${garage.panCard.slice(-4)}` : 'NOT REGISTERED'}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <CreditCard size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#e6f0fa] p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Owner Adhar Registry</p>
                                <p className="text-sm font-bold text-[#052558] font-mono tracking-wider">{garage.adharCard ? `XXXX XXXX ${garage.adharCard.slice(-4)}` : 'NOT REGISTERED'}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <FileCheck size={18} />
                            </div>
                        </div>

                        <div className="bg-[#052558] p-6 rounded-2xl shadow-lg flex items-center justify-between text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Election Card ID</p>
                                <p className="text-xs font-mono font-bold text-[#C2E8FF] tracking-widest">{garage.voterId || 'NONE MAPPED'}</p>
                            </div>
                            <div className="p-3 bg-white/10 text-white rounded-xl">
                                <Landmark size={18} />
                            </div>
                        </div>
                    </div>

                </div>


                {/* Footer Action (Delete style) */}
                <div className="p-4 bg-gray-50/50 border-t border-[#e6f0fa] flex justify-center">
                    <button className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors">
                        <Trash2 size={14} /> Request Permanent Account Deletion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
