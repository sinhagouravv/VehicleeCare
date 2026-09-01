import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Clock, Calendar, Plus, Wrench, ShieldCheck, Globe, Trash2, LogOut, Loader2, Star, Shield, Smartphone, ArrowRight, Building2, ExternalLink, CreditCard, FileCheck, Landmark, X, AlertTriangle, Send } from 'lucide-react';
import { createPortal } from 'react-dom';


import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { SkeletonBlock } from '../components/Skeleton';

const GARAGE_DELETION_REASONS = [
    'Closing garage business permanently',
    'Relocating garage to a new area/city',
    'Operational or financial difficulties',
    'Switching to a different platform/software',
    'Temporary shutdown or seasonal closure',
    'Garage ownership transfer / sale',
    'Account created by mistake / duplicate account',
    'Other'
];

const Profile = () => {
    const { triggerAlert } = useAlert();
    const [garage, setGarage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [tentativeTime, setTentativeTime] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', ownerName: '', email: '', phone: '', whatsapp: '', garageContact: '', garageEmail: '',
        address: '', workingHours: '', workingDays: '',
        panCard: '', adharCard: '', voterId: '',
        sacCode: '', hsnCode: '', gstNumber: ''
    });
    const navigate = useNavigate();

    const fetchGarageProfile = useCallback(async (isSilent = false) => {
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
            } else if (!isSilent) {
                setGarage(user);
            }
            setLastRefreshed(new Date());
        } catch (error) {
            console.error("Failed to fetch garage profile", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchGarageProfile();
        const interval = setInterval(() => fetchGarageProfile(true), 5000);
        return () => clearInterval(interval);
    }, [fetchGarageProfile]);

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            setSelectedReason('');
            setTentativeTime('');
            setDeleteReason('');
        }, 300);
    };

    const handleDeleteRequest = async () => {
        if (!selectedReason) return triggerAlert('Please select a reason for account termination', 'error');
        if (!tentativeTime) return triggerAlert('Please select a tentative time to leave', 'error');
        if (!deleteReason.trim()) return triggerAlert('Please provide a detailed explanation for the deletion request', 'error');
        
        const gName = garage?.name || garage?.ownerName || 'Garage Center';
        const gId = garage?.garageId || garage?.dbId || garage?._id || 'GARAGE-01';

        setIsSubmittingDelete(true);
        try {
            // Send to Requests collection for Admin Request tracker
            await fetch('http://localhost:5001/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portal: 'GARAGE',
                    employeeId: gId,
                    userId: gId,
                    name: gName,
                    reason: selectedReason,
                    explanation: deleteReason,
                    description: deleteReason,
                    tentativeTime: tentativeTime
                })
            });

            const res = await fetch('http://localhost:5001/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'account_deletion_request',
                    title: 'Garage Deletion Request',
                    message: `Garage "${gName}" (ID: ${gId}) has requested account deletion.\nReason: ${selectedReason}\nTentative Time: ${tentativeTime}\nDetails: ${deleteReason}`,
                    meta: {
                        garageId: gId,
                        name: gName,
                        reason: selectedReason,
                        tentativeTime: tentativeTime,
                        details: deleteReason,
                        requestDate: new Date()
                    }
                })
            });

            if (res.ok) {
                triggerAlert('Your deletion request has been sent to the administration team.', 'success');
                handleCloseDeleteModal();
            } else {
                throw new Error('Failed to send request');
            }
        } catch (error) {
            console.error("Deletion request failed", error);
            triggerAlert('Failed to send deletion request. Please try again later.', 'error');
        } finally {
            setIsSubmittingDelete(false);
        }
    };



    const formatPAN = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const formatAadhar = (val) => val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 14);
    const formatVoter = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const formatDocNumber = (...vals) => {
        for (const val of vals) {
            if (val && typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('cloudinary')) {
                    return trimmed;
                }
            }
        }
        return '';
    };

    const formatGST = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    const formatSAC = (val) => val.replace(/\D/g, '').slice(0, 6);
    const formatHSN = (val) => val.replace(/\D/g, '').slice(0, 8);
    const formatPhone = (val) => val.replace(/\D/g, '').slice(0, 10);

    const isAllDetailsFilled = Boolean(
        garage?.whatsapp?.trim() &&
        formatDocNumber(garage?.panCardNumber, garage?.panNumber, garage?.panCard) &&
        formatDocNumber(garage?.adharCardNumber, garage?.adharNumber, garage?.aadhaarCard, garage?.adharCard) &&
        formatDocNumber(garage?.voterIdNumber, garage?.voterNumber, garage?.voterId) &&
        garage?.gstNumber?.trim() &&
        garage?.sacCode?.trim() &&
        garage?.hsnCode?.trim()
    );

    const handleOpenEditModal = () => {
        setIsAddModalOpen(true);
        if (isAllDetailsFilled) {
            triggerAlert('All the details are updated.\nIf you want to change any details, kindly contact the administrator', 'info');
        }
    };

    useEffect(() => {
        if (garage && isAddModalOpen) {
            setForm({
                name: garage.name || '',
                ownerName: garage.ownerName || '',
                email: garage.ownerEmail || garage.email || '',
                phone: garage.phone || garage.ownerContact || '',
                whatsapp: garage.whatsapp || garage.garageContact || '',
                garageContact: garage.garageContact || garage.whatsapp || '',
                garageEmail: garage.garageEmail || '',
                address: garage.address || '',
                workingHours: garage.workingHours || '',
                workingDays: garage.workingDays || '',
                panCard: formatDocNumber(garage.panCardNumber, garage.panNumber, garage.panCard),
                adharCard: formatDocNumber(garage.adharCardNumber, garage.adharNumber, garage.aadhaarCard, garage.adharCard),
                voterId: formatDocNumber(garage.voterIdNumber, garage.voterNumber, garage.voterId),
                sacCode: garage.sacCode || '',
                hsnCode: garage.hsnCode || '',
                gstNumber: garage.gstNumber || ''
            });
        }
    }, [garage, isAddModalOpen]);

    const handleSave = async () => {
        if (form.panCard && form.panCard.length !== 10) return triggerAlert('Kindly enter the PAN CARD details correctly');
        if (form.adharCard && form.adharCard.length !== 14) return triggerAlert('Kindly enter the AADHAR CARD details correctly');
        if (form.voterId && form.voterId.length !== 10) return triggerAlert('Kindly enter the VOTER ID details correctly');
        if (form.gstNumber && form.gstNumber.length !== 15) return triggerAlert('Kindly enter the GST NUMBER details correctly');
        if (form.sacCode && form.sacCode.length !== 6) return triggerAlert('Kindly enter the SAC CODE details correctly');
        if (form.hsnCode && ![4, 6, 8].includes(form.hsnCode.length)) return triggerAlert('Kindly enter the HSN CODE details correctly');
        if (form.phone && form.phone.length !== 10) return triggerAlert('Kindly enter the PHONE NUMBER details correctly');
        if (form.whatsapp && form.whatsapp.length !== 10) return triggerAlert('Kindly enter the WHATSAPP NUMBER details correctly');

        setSaving(true);
        try {
            const targetId = garage._id || garage.id || garage.dbId || garage.garageId;
            const res = await fetch(`http://localhost:5001/api/garages/${targetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                const data = await res.json();
                const updatedGarage = data.data || data;
                setGarage(updatedGarage);

                // Update localStorage so polling and refreshes retain the updated profile
                const storedUser = localStorage.getItem('garageUser');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        localStorage.setItem('garageUser', JSON.stringify({ ...parsed, ...updatedGarage }));
                    } catch (e) {
                        console.error('Failed to update localStorage garageUser', e);
                    }
                }

                setIsAddModalOpen(false);
                triggerAlert('Profile updated successfully', 'success');

                // Notify admin of garage profile update
                fetch('http://localhost:5001/api/notifications/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventType: 'garage_profile_updated',
                        title: 'Garage Profile Updated',
                        message: `Garage "${garage.name}" (ID: ${garage.garageId}) updated their profile details.`,
                        meta: {
                            garageId: garage.garageId,
                            name: garage.name,
                            updatedAt: new Date()
                        }
                    })
                }).catch(err => console.error("Notification trigger failed", err));
            } else {
                triggerAlert('Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            triggerAlert('An error occurred while updating', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-[92rem] mx-auto animate-pulse">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <SkeletonBlock className="h-8 w-56 bg-slate-200 rounded-xl" />
                    <SkeletonBlock className="h-10 w-44 bg-slate-200 rounded-xl" />
                </div>

                {/* Main Content Area */}
                <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col p-8 space-y-8">
                    {/* Top Identity Block */}
                    <div className="flex flex-col md:flex-row gap-8 w-full">
                        <div className="space-y-2 w-full md:w-[30%]">
                            <SkeletonBlock className="h-4 w-36 bg-slate-200 rounded" />
                            <div className="bg-slate-100/70 p-6 rounded-2xl space-y-4 h-44" />
                        </div>
                        <div className="space-y-2 w-full md:w-[35%]">
                            <SkeletonBlock className="h-4 w-44 bg-slate-200 rounded" />
                            <div className="bg-slate-100/70 p-6 rounded-2xl space-y-4 h-44" />
                        </div>
                        <div className="space-y-2 w-full md:w-[30%] ml-auto">
                            <SkeletonBlock className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="bg-slate-100/70 p-6 rounded-2xl space-y-4 h-44" />
                        </div>
                    </div>

                    {/* Mid Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <SkeletonBlock className="h-4 w-48 bg-slate-200 rounded" />
                            <div className="bg-slate-100/70 p-8 rounded-2xl space-y-6 h-48" />
                        </div>
                        <div className="space-y-2">
                            <SkeletonBlock className="h-4 w-44 bg-slate-200 rounded" />
                            <div className="bg-slate-100/70 p-8 rounded-2xl space-y-6 h-48" />
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-100/70 p-6 rounded-2xl h-20" />
                        <div className="bg-slate-100/70 p-6 rounded-2xl h-20" />
                        <div className="bg-slate-100/70 p-6 rounded-2xl h-20" />
                    </div>
                </div>
            </div>
        );
    }

    if (!garage) return null;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header (Leave.jsx style) */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Garage Profile</h1>
                <div className="flex items-center gap-4 -mt-1.5">
                    <button
                        onClick={handleOpenEditModal}
                        className="px-12 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} /> EDIT PROFILE
                    </button>
                </div>
            </div>


            {/* Main Content Area (Leave.jsx Glassmorphism Container) */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                <div className="p-8 overflow-y-auto flex-1 hide-scrollbar">
                    
                    {/* Top Identity Block */}
                    <div className="flex flex-col md:flex-row gap-8 mb-5 w-full">
                        {/* Garage Identity */}
                        <div className="space-y-2 w-full md:w-[31.5%]">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Garage Identity</h4>
                            <div className="pt-5 rounded-2xl uppercase space-y-4 border border-blue-50 relative overflow-hidden">
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
                        <div className="space-y-2 w-full md:w-[34%]">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Owner Details</h4>
                            <div className="py-4 rounded-2xl uppercase space-y-2">
                                <p className="text-[15px] flex items-center leading-relaxed"><span className="text-gray-500 shrink-0 w-30 uppercase font-bold">Name:</span> <span className="font-semibold text-[#011023]">{garage.ownerName || 'NOT AVAILABLE'}</span></p>
                                <p className="text-[15px] flex items-center leading-relaxed"><span className="text-gray-500 shrink-0 w-30 uppercase font-bold">Email:</span> <span className="font-semibold uppercase lowercase ">{garage.ownerEmail || garage.email || '—'}</span></p>
                            </div>
                        </div>

                        {/* Status & Verification */}
                        <div className="flex flex-col gap-4 w-full md:w-[30%] ml-auto">
                            <div className="space-y-2">
                                <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Security & Status</h4>
                                <div className="space-y-2.5 mt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14.5px] font-bold text-gray-500 uppercase tracking-widest">Verification</p>
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                            (garage.partner === true || garage.partner === 'Active' || garage.partner === 'active' || garage.partner === 'completed' || garage.partner === 'Completed' || garage.verificationStatus === 'completed' || garage.verificationStatus === 'Completed' || garage.isVerified)
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {(garage.partner === true || garage.partner === 'Active' || garage.partner === 'active' || garage.partner === 'completed' || garage.partner === 'Completed' || garage.verificationStatus === 'completed' || garage.verificationStatus === 'Completed' || garage.isVerified)
                                                ? 'VERIFIED'
                                                : 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14.5px] font-bold text-gray-500 uppercase tracking-widest">Facility Level</p>
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                            garage.pickupDrop ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {garage.pickupDrop ? 'PICKUP & DROP ACTIVE' : 'BASIC FACILITIES'}
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
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Working Hours</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-center gap-2">
                                            {garage.workingHours || '—'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Operating Cycles</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-center justify-end gap-2">
                                            {garage.workingDays || '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Protocol */}
                        <div className="space-y-4 lg:col-span-2">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Location Protocol</h4>
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center">
                                <div className="grid grid-cols-1 lg:grid-cols-[54.5%_25%_18%] gap-1 w-full items-center">
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Garage Address</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-start gap-2 leading-relaxed truncate">
                                            {garage.address || 'NOT MAPPED'}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">District Division</p>
                                        <p className="text-[15px] font-semibold text-gray-700 uppercase truncate">{garage.district || '—'}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">State Registry</p>
                                        <p className="text-[15px] font-semibold text-gray-700 uppercase truncate">{garage.state || '—'}</p>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>


                    {/* Bottom Section: Contact Channels & Geo-Mapping */}
                    <div className="space-y-4 mb-5">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Business Communication</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Garage Contact</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.garageContact || garage.whatsapp || garage.phone || '—'}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl transition-all">
                                    <Smartphone size={18} />
                                </div>
                            </div>
                            
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1 overflow-hidden">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Garage Email</p>
                                    <p className="text-sm font-semibold uppercase text-[#052558] truncate">{garage.garageEmail || '—'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all shrink-0 ml-2">
                                    <Mail size={18} />
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
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">PAN Card</p>
                                    <p className="text-sm font-semibold text-[#052558]">
                                        {formatDocNumber(garage?.panCardNumber, garage?.panNumber, garage?.panCard)
                                            ? `XXXXX${formatDocNumber(garage?.panCardNumber, garage?.panNumber, garage?.panCard).slice(-4)}`
                                            : '—'}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Adhar Card</p>
                                    <p className="text-sm font-semibold text-[#052558]">
                                        {formatDocNumber(garage?.adharCardNumber, garage?.adharNumber, garage?.aadhaarCard, garage?.adharCard)
                                            ? `XXXX XXXX ${formatDocNumber(garage?.adharCardNumber, garage?.adharNumber, garage?.aadhaarCard, garage?.adharCard).slice(-4)}`
                                            : '—'}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Voter Card ID</p>
                                    <p className="text-sm font-semibold text-[#052558]">
                                        {formatDocNumber(garage?.voterIdNumber, garage?.voterNumber, garage?.voterId) || '—'}
                                    </p>
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
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Sac Code</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.sacCode || '—'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">HSN Code</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.hsnCode || '—'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">GST Number</p>
                                    <p className="text-sm font-semibold text-[#052558]">{garage.gstNumber || '—'}</p>
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
                        Request Permanent Account Deletion
                    </button>
                </div>
            </div>

            {/* Deletion Request Modal */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSubmittingDelete && handleCloseDeleteModal()} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-rose-50 border-b border-rose-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-rose-600 uppercase tracking-wider">Account Deletion</h3>
                            <button 
                                onClick={handleCloseDeleteModal}
                                className="absolute right-7 p-2 text-rose-400 rounded-xl transition-colors"
                                disabled={isSubmittingDelete}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-5">
                            <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                                <p className="text-sm uppercase font-medium text-justify text-rose-700 leading-relaxed">
                                    Are you sure you want to request the deletion of <span className="font-bold">"{garage.name}"</span>? 
                                    This action will notify the administration team to begin permanent removal of your account. This process is irreversible and you will lose access to your account.
                                </p>
                            </div>

                            <div className="space-y-4 text-left">
                                <div className="flex gap-4">
                                    <div className="w-[66%]">
                                        <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider block text-center mb-2">
                                            Select a reason for account termination
                                        </label>
                                        <select
                                            value={selectedReason}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-rose-300 transition-all font-medium text-gray-700 shadow-sm cursor-pointer uppercase appearance-none"
                                            disabled={isSubmittingDelete}
                                        >
                                            <option value=""></option>
                                            {GARAGE_DELETION_REASONS.map((reason) => (
                                                <option key={reason} value={reason}>
                                                    {reason}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="w-[34%]">
                                        <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider block text-center mb-2 truncate" title="Tentative time to leave">
                                            Tentative time to close
                                        </label>
                                        <select
                                            value={tentativeTime}
                                            onChange={(e) => setTentativeTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none text-center focus:border-rose-300 transition-all font-medium text-gray-700 shadow-sm cursor-pointer uppercase appearance-none"
                                            disabled={isSubmittingDelete}
                                        >
                                            <option value=""></option>
                                            <option value="1 Week">1 Week</option>
                                            <option value="2 Weeks">2 Weeks</option>
                                            <option value="3 Weeks">3 Weeks</option>
                                            <option value="4 Weeks">4 Weeks</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-center mb-2">
                                        Please provide a valid and detailed explanation for the particular reason 
                                    </label>
                                    <textarea 
                                        value={deleteReason}
                                        onChange={(e) => setDeleteReason(e.target.value)}
                                        className="w-full h-30 px-3.5 py-2.5 bg-white uppercase border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-rose-300 transition-all resize-none font-medium text-gray-700 shadow-sm"
                                        disabled={isSubmittingDelete}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4.5">
                            <button 
                                onClick={handleDeleteRequest}
                                disabled={isSubmittingDelete || !selectedReason || !tentativeTime || !deleteReason.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none cursor-pointer"
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

            {/* Edit Profile Modal */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-[960px] overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Update Profile
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 uppercase text-left overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Garage Name</label>
                                    <input readOnly value={form.name} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Name</label>
                                    <input readOnly value={form.ownerName} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Email</label>
                                    <input readOnly value={form.email} className="w-full px-4 py-2.5 bg-slate-100 uppercase border border-[#cbd5e1] rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed lowercase" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Contact</label>
                                    <input readOnly value={form.phone} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Garage Contact</label>
                                    <input 
                                        readOnly={Boolean((garage?.garageContact || garage?.whatsapp)?.trim())}
                                        value={form.garageContact || form.whatsapp} 
                                        onChange={e => setForm({ ...form, garageContact: formatPhone(e.target.value), whatsapp: formatPhone(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            (garage?.garageContact || garage?.whatsapp)?.trim()
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={10} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Garage Email</label>
                                    <input 
                                        readOnly={Boolean(garage?.garageEmail?.trim())}
                                        value={form.garageEmail} 
                                        onChange={e => setForm({ ...form, garageEmail: e.target.value })} 
                                        className={`w-full px-4 py-2.5 rounded-xl font-semibold uppercase font-sans text-xs transition-all ${
                                            garage?.garageEmail?.trim()
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed lowercase'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc] lowercase'
                                        }`}
                                        type="email" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner's PAN Card</label>
                                    <input 
                                        readOnly={Boolean(formatDocNumber(garage?.panCardNumber, garage?.panNumber, garage?.panCard))}
                                        value={form.panCard} 
                                        onChange={e => setForm({ ...form, panCard: formatPAN(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            formatDocNumber(garage?.panCardNumber, garage?.panNumber, garage?.panCard)
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={10} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner's Aadhar Card</label>
                                    <input 
                                        readOnly={Boolean(formatDocNumber(garage?.adharCardNumber, garage?.adharNumber, garage?.aadhaarCard, garage?.adharCard))}
                                        value={form.adharCard} 
                                        onChange={e => setForm({ ...form, adharCard: formatAadhar(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            formatDocNumber(garage?.adharCardNumber, garage?.adharNumber, garage?.aadhaarCard, garage?.adharCard)
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={14} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner's Voter ID</label>
                                    <input 
                                        readOnly={Boolean(formatDocNumber(garage?.voterIdNumber, garage?.voterNumber, garage?.voterId))}
                                        value={form.voterId} 
                                        onChange={e => setForm({ ...form, voterId: formatVoter(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            formatDocNumber(garage?.voterIdNumber, garage?.voterNumber, garage?.voterId)
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={10} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">GST Number</label>
                                    <input 
                                        readOnly={Boolean(garage?.gstNumber?.trim())}
                                        value={form.gstNumber} 
                                        onChange={e => setForm({ ...form, gstNumber: formatGST(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            garage?.gstNumber?.trim()
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={15} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">SAC Code</label>
                                    <input 
                                        readOnly={Boolean(garage?.sacCode?.trim())}
                                        value={form.sacCode} 
                                        onChange={e => setForm({ ...form, sacCode: formatSAC(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            garage?.sacCode?.trim()
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={6} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">HSN Code</label>
                                    <input 
                                        readOnly={Boolean(garage?.hsnCode?.trim())}
                                        value={form.hsnCode} 
                                        onChange={e => setForm({ ...form, hsnCode: formatHSN(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            garage?.hsnCode?.trim()
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={8} 
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Garage Address</label>
                                    <input readOnly value={form.address} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || isAllDetailsFilled}
                                className={`flex-1 py-1.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 ${
                                    isAllDetailsFilled
                                        ? 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                                        : 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] cursor-pointer hover:bg-[#c7d2fe] disabled:opacity-70 disabled:cursor-not-allowed'
                                }`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> UPDATING...
                                    </>
                                ) : (
                                    'UPDATE PROFILE'
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
