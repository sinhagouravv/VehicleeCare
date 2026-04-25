import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Clock, Calendar, Plus, Wrench, ShieldCheck, Globe, Trash2, LogOut, Loader2, Star, Shield, Smartphone, ArrowRight, Building2, ExternalLink, CreditCard, FileCheck, Landmark, X, AlertTriangle, Send } from 'lucide-react';
import { createPortal } from 'react-dom';


import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [garage, setGarage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
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

    const handleDeleteRequest = async () => {
        if (!deleteReason.trim()) return alert('Please provide a reason for deletion');
        
        setIsSubmittingDelete(true);
        try {
            // Logic to send deletion request to admin
            // We can use the existing notification system or a dedicated endpoint
            const res = await fetch('http://localhost:5001/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'account_deletion_request',
                    title: 'Account Deletion Request',
                    message: `Garage "${garage.name}" (ID: ${garage.garageId}) has requested account deletion.`,
                    meta: {
                        garageId: garage.garageId,
                        name: garage.name,
                        reason: deleteReason,
                        requestDate: new Date()
                    }
                })
            });

            if (res.ok) {
                alert('Your deletion request has been sent to the administration team. They will review it and get back to you shortly.');
                setIsDeleteModalOpen(false);
                setDeleteReason('');
            } else {
                throw new Error('Failed to send request');
            }
        } catch (error) {
            console.error("Deletion request failed", error);
            alert('Failed to send deletion request. Please try again later.');
        } finally {
            setIsSubmittingDelete(false);
        }
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
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-[13px] px-12 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-opacity uppercase tracking-tighter text-sm">
                        <Plus size={18} />
                        Edit Profile
                    </button>
                </div>
            </div>


            {/* Main Content Area (Leave.jsx Glassmorphism Container) */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                <div className="p-8 overflow-y-auto flex-1 hide-scrollbar">
                    
                    {/* Top Identity Block */}
                    <div className="flex flex-col md:flex-row gap-8 mb-5 w-full">
                        {/* Garage Identity */}
                        <div className="space-y-2 w-full md:w-[30%]">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Garage Identity</h4>
                            <div className="bg-blue-50/30 py-5 rounded-2xl uppercase space-y-4 border border-blue-50 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-lg font-bold text-[#011023] mb-2 uppercase leading-none">{garage.name}</p>
                                    <p className="text-sm flex mb-2.5 leading-relaxed tracking-wider">
                                        <span className="w-8 uppercase text-sm font-semibold">ID:</span> 
                                        <span className="font-semibold text-[#052558]">{garage.garageId || garage.id || '—'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ownership Details */}
                        <div className="space-y-2 w-full md:w-[35%]">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Owner Details</h4>
                            <div className="py-4 rounded-2xl uppercase space-y-2">
                                <p className="text-[15px] flex items-center leading-relaxed"><span className="text-gray-500 shrink-0 w-30 uppercase font-bold">Name:</span> <span className="font-semibold text-[#011023]">{garage.ownerName || 'NOT AVAILABLE'}</span></p>
                                <p className="text-[15px] flex items-center leading-relaxed"><span className="text-gray-500 shrink-0 w-30 uppercase font-bold">Email:</span> <span className="font-semibold lowercase ">{garage.ownerEmail || garage.email || '—'}</span></p>
                            </div>
                        </div>

                        {/* Status & Verification */}
                        <div className="flex flex-col gap-4 w-full md:w-[30%] ml-auto">
                            <div className="space-y-2">
                                <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Security & Status</h4>
                                <div className="space-y-2 mt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14.5px] font-bold text-gray-500 uppercase tracking-widest">Verification</p>
                                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-[0.1em] uppercase ${garage.partner ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                            {garage.partner ? 'Verified Partner' : 'Standard Member'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14.5px] font-bold text-gray-500 uppercase tracking-widest">Facility Level</p>
                                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-[0.1em] uppercase ${garage.pickupDrop ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {garage.pickupDrop ? 'Pickup & Drop Active' : 'Basic Facilities'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mid Section: Operations & Location */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
                        {/* Operations Center */}
                        <div className="space-y-4 lg:col-span-1">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Operations Center</h4>
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Working Hours</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-center gap-2">
                                            {garage.workingHours || '09:00 AM - 09:00 PM'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Operating Cycles</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-center gap-2">
                                            {garage.workingDays || 'Monday - Saturday'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Protocol */}
                        <div className="space-y-4 lg:col-span-2">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Location Protocol</h4>
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center">
                                <div className="grid grid-cols-1 lg:grid-cols-[59%_21%_18%] gap-1 w-full items-center">
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Garage Address</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-start gap-2 leading-relaxed truncate">
                                            {garage.address || 'NOT MAPPED'}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">State Registry</p>
                                        <p className="text-[15px] font-semibold text-gray-700 uppercase truncate">{garage.state || 'PENDING'}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">District Division</p>
                                        <p className="text-[15px] font-semibold text-gray-700 uppercase truncate">{garage.district || 'PENDING'}</p>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>


                    {/* Bottom Section: Contact Channels & Geo-Mapping */}
                    <div className="space-y-4 mb-5">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Business Communication</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Business Comms</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.phone || garage.ownerContact || '—'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <Smartphone size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">WhatsApp Protocol</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.whatsapp || garage.phone || '—'}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl transition-all">
                                    <Smartphone size={18} />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Geo-Coordinates</p>
                                    <p className="text-sm font-semibold">{garage.coordinates || '22.5726° N, 88.3639° E'}</p>
                                </div>
                                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl transition-all">
                                    <Globe size={18} />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Final Section: Compliance Documents */}
                    <div className="space-y-4 mb-5">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Owner Legal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Business PAN Card</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.panCard ? `XXXXX${garage.panCard.slice(-4)}` : 'NOT PROVIDED'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Business Adhar Card</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.adharCard ? `XXXX XXXX ${garage.adharCard.slice(-4)}` : 'NOT PROVIDED'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group  transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Election Card ID</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.voterId || 'NOT PROVIDED'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Final Section: Compliance Documents */}
                    <div className="space-y-4">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Business Legal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Business Sac Code</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.sacCode || 'NOT PROVIDED'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Business HSN Code</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.hsnCode || 'NOT PROVIDED'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Business GST Number</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.gstNumber || 'NOT PROVIDED'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                        </div>
                    </div>


                </div>


                {/* Footer Action (Delete style) */}
                <div className="p-4 bg-gray-50/50 border-t border-[#e6f0fa] flex justify-center">
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
                    >
                        <Trash2 size={14} /> Request Permanent Account Deletion
                    </button>
                </div>
            </div>

            {/* Deletion Request Modal */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSubmittingDelete && setIsDeleteModalOpen(false)} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-rose-50 border-b border-rose-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-rose-600 uppercase tracking-wider">Account Deletion</h3>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="absolute right-7 p-2 text-rose-400 rounded-xl transition-colors"
                                disabled={isSubmittingDelete}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                                <p className="text-sm uppercase font-medium text-justify text-rose-700 leading-relaxed">
                                    Are you sure you want to request the deletion of <span className="font-bold">"{garage.name}"</span>? 
                                    This action will notify the administration team to begin permanent removal of your records. This process is irreversible and you will lose access to your account.


                                </p>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-center">Please provide a valid and detailed reason for the termination of your garage</label>
                                <textarea 
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    className="w-full h-32 p-4 bg-white border border-gray-200 mt-3 rounded-2xl text-sm focus:outline-none transition-all resize-none font-medium text-gray-700 shadow-sm"
                                    disabled={isSubmittingDelete}
                                />
                            </div>
                        </div>


                        {/* Footer */}
                        <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4.5">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                disabled={isSubmittingDelete}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteRequest}
                                disabled={isSubmittingDelete || !deleteReason.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isSubmittingDelete ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Send Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


export default Profile;
