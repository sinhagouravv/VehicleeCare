import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Clock, Calendar, ShieldCheck, LogOut, Loader2, Briefcase, BadgeCheck, PhoneCall, Home, Hash, Shield, CreditCard, FileCheck, Landmark, Trash2, X, Send, Smartphone, Globe, ExternalLink, Plus, Upload } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { SkeletonBlock } from '../components/Skeleton';
import useGuestGuard from '../hooks/useGuestGuard';
import { broadcastEmployeeLogout } from '../hooks/useMultiTabAuthSync';

const DELETION_REASONS = [
    'Employment has ended',
    'Resigned from the organization',
    'Contract or tenure has ended',
    'Transferred to another department',
    'No longer require account access',
    'Account created in error',
    'Requested by HR/Management',
    'Other'
];

const formatPhone = (val) => val.replace(/\D/g, '').slice(0, 10);

const formatPAN = (val) => {
    return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
};

const formatAadhar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
};

const formatVoter = (val) => {
    return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
};

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

const formatRole = (role) => {
    if (!role) return 'STAFF';
    const r = role.trim();
    if (/^SDE\s*I$/i.test(r) || /^SDEI$/i.test(r)) return 'SDE I';
    if (/^SDE\s*II$/i.test(r) || /^SDEII$/i.test(r)) return 'SDE II';
    if (/^SDE\s*III$/i.test(r) || /^SDEIII$/i.test(r)) return 'SDE III';
    if (/^QA\s*I$/i.test(r) || /^QAI$/i.test(r)) return 'QA I';
    if (/^QA\s*II$/i.test(r) || /^QAII$/i.test(r)) return 'QA II';
    if (/^QA\s*III$/i.test(r) || /^QAIII$/i.test(r)) return 'QA III';
    return r.toUpperCase();
};

const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase().replace(/\s+/g, '');
    switch (r) {
        case 'ADMIN': return 'bg-purple-100 text-purple-700 font-bold';
        case 'MANAGER': return 'bg-blue-100 text-blue-700 font-bold';
        case 'STAFF': return 'bg-emerald-100 text-emerald-700 font-bold';
        case 'MECHANIC': return 'bg-emerald-100 text-emerald-700 font-bold';
        case 'TECHNICIAN': return 'bg-amber-100 text-amber-700 font-bold';
        case 'SUPPORT': return 'bg-indigo-100 text-indigo-700 font-bold';
        case 'SDEI': return 'bg-sky-100 text-sky-700 font-bold';
        case 'SDEII': return 'bg-blue-100 text-blue-700 font-bold';
        case 'SDEIII': return 'bg-indigo-100 text-indigo-700 font-bold';
        case 'JUNIOR': return 'bg-emerald-100 text-emerald-700 font-bold';
        case 'SENIOR': return 'bg-violet-100 text-violet-700 font-bold';
        case 'ASSOCIATE': return 'bg-purple-100 text-purple-700 font-bold';
        case 'QAI': return 'bg-amber-100 text-amber-700 font-bold';
        case 'QAII': return 'bg-amber-100 text-amber-700 font-bold';
        case 'QAIII': return 'bg-orange-100 text-orange-700 font-bold';
        case 'SENIORQA': return 'bg-rose-100 text-rose-700 font-bold';
        default: return 'bg-blue-100 text-blue-700 font-bold';
    }
};

const getCategoryBadge = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('developer')) return 'bg-purple-100 text-purple-700 font-bold';
    if (c.includes('tester')) return 'bg-amber-100 text-amber-700 font-bold';
    if (c.includes('manager')) return 'bg-blue-100 text-blue-700 font-bold';
    return 'bg-emerald-100 text-emerald-700 font-bold';
};

const Profile = () => {
    const { triggerAlert } = useAlert();
    const { isGuest, guardGuestAction, maskEmail, maskPhone, maskAddress, isRealValue } = useGuestGuard();
    const [employee, setEmployee] = useState(null);
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
        name: '',
        employeeId: '',
        email: '',
        phone: '',
        category: '',
        role: '',
        address: '',
        panCard: '',
        adharCard: '',
        voterId: ''
    });
    const navigate = useNavigate();
    const profileFileRef = useRef(null);
    const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

    const handleProfilePictureUpload = async (e) => {
        if (guardGuestAction()) return;
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return triggerAlert('Please select a valid image file', 'error');
        }

        setUploadingProfilePic(true);
        try {
            // Show immediately with base64 for snappy UX
            const reader = new FileReader();
            reader.onload = async () => {
                const dataUrl = reader.result;

                // Optimistic update with base64
                const currentStored = JSON.parse(localStorage.getItem('employeeUser') || '{}');
                const optimistic = { ...currentStored, avatar: dataUrl };
                localStorage.setItem('employeeUser', JSON.stringify(optimistic));
                setEmployee(prev => ({ ...prev, avatar: dataUrl }));
                window.dispatchEvent(new Event('storage'));

                // Upload to Cloudinary via backend
                const empId = employee?._id || employee?.id || employee?.employeeId;
                if (empId) {
                    try {
                        const formData = new FormData();
                        // Use the dedicated avatar endpoint — no whitelist, saves directly to DB
                        formData.append('avatar', file);
                        const apiRes = await fetch(`https://vehicleecare.onrender.com/api/employees/${empId}/avatar`, {
                            method: 'POST',
                            body: formData
                        });

                        if (apiRes.ok) {
                            const apiData = await apiRes.json();
                            // Response: { success: true, data: { avatar: 'https://...' } }
                            const cloudinaryUrl = apiData?.data?.avatar || dataUrl;

                            const stored = JSON.parse(localStorage.getItem('employeeUser') || '{}');
                            const updated = { ...stored, avatar: cloudinaryUrl };
                            localStorage.setItem('employeeUser', JSON.stringify(updated));
                            setEmployee(prev => ({ ...prev, avatar: cloudinaryUrl }));
                            window.dispatchEvent(new Event('storage'));
                        }
                    } catch (apiErr) {
                        console.error("Backend profile pic upload error", apiErr);
                    }
                }

                triggerAlert('Profile picture uploaded successfully!', 'success');
                setUploadingProfilePic(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Failed to upload profile picture", err);
            triggerAlert('Failed to upload profile picture', 'error');
            setUploadingProfilePic(false);
        }
    };

    const isAllDetailsFilled = Boolean(
        formatDocNumber(employee?.panCardNumber, employee?.panNumber, employee?.panCard) &&
        formatDocNumber(employee?.adharCardNumber, employee?.adharNumber, employee?.aadhaarCard, employee?.adharCard) &&
        formatDocNumber(employee?.voterIdNumber, employee?.voterNumber, employee?.voterId)
    );

    const hasProfilePicture = Boolean(
        employee?.avatar ||
        employee?.profilePhoto ||
        employee?.profilePicture ||
        employee?.documents?.avatar ||
        (() => {
            try {
                const u = JSON.parse(localStorage.getItem('employeeUser') || '{}');
                return u?.avatar || u?.profilePhoto || u?.profilePicture;
            } catch (e) {
                return false;
            }
        })()
    );

    const handleOpenEditModal = () => {
        setIsAddModalOpen(true);
    };

    useEffect(() => {
        if (employee && isAddModalOpen) {
            setForm({
                name: employee.name || '',
                employeeId: employee.employeeId || employee._id || '',
                email: employee.email || '',
                phone: employee.phone || '',
                category: employee.category || '',
                role: employee.role || '',
                address: employee.address || '',
                panCard: formatDocNumber(employee.panCardNumber, employee.panNumber, employee.panCard),
                adharCard: formatDocNumber(employee.adharCardNumber, employee.adharNumber, employee.aadhaarCard, employee.adharCard),
                voterId: formatDocNumber(employee.voterIdNumber, employee.voterNumber, employee.voterId)
            });
        }
    }, [employee, isAddModalOpen]);

    const handleSave = async () => {
        if (guardGuestAction()) return;
        if (form.panCard && form.panCard.length !== 10) return triggerAlert('Kindly enter the PAN CARD details correctly');
        if (form.adharCard && form.adharCard.length !== 14) return triggerAlert('Kindly enter the AADHAR CARD details correctly');
        if (form.voterId && form.voterId.length !== 10) return triggerAlert('Kindly enter the VOTER ID details correctly');

        setSaving(true);
        try {
            const targetId = employee._id || employee.id || employee.employeeId;
            const res = await fetch(`https://vehicleecare.onrender.com/api/employees/${targetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                const data = await res.json();
                const updatedEmp = data.data || data;
                setEmployee(updatedEmp);

                // Update localStorage
                const storedUser = localStorage.getItem('employeeUser');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        localStorage.setItem('employeeUser', JSON.stringify({ ...parsed, ...updatedEmp }));
                    } catch (e) {
                        console.error('Failed to update localStorage employeeUser', e);
                    }
                }

                setIsAddModalOpen(false);
                triggerAlert('Profile updated successfully', 'success');

                // Notify admin of employee profile update
                fetch('https://vehicleecare.onrender.com/api/notifications/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventType: 'employee_profile_updated',
                        title: 'Employee Profile Updated',
                        message: `Employee "${employee.name}" (ID: ${employee.employeeId || employee._id}) updated their profile details.`,
                        meta: {
                            employeeId: employee.employeeId || employee._id,
                            name: employee.name,
                            updatedAt: new Date()
                        }
                    })
                }).catch(err => console.error("Notification trigger failed", err));
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (err) {
            console.error('Save failed', err);
            triggerAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const fetchEmployeeProfile = async (isSilent = false) => {
            try {
                const storedUser = localStorage.getItem('employeeUser');
                if (!storedUser) {
                    if (!isSilent) navigate('/login');
                    return;
                }
                const user = JSON.parse(storedUser);
                
                // Fetch latest data from specific Employee endpoint
                const res = await fetch(`https://vehicleecare.onrender.com/api/employees/${user._id || user.employeeId || user.id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    const empData = data.data || user;

                    // Preserve avatar: if backend doesn't return it, keep whatever's in localStorage
                    const storedAvatar = user?.avatar || '';
                    if (!empData.avatar && storedAvatar) {
                        empData.avatar = storedAvatar;
                    }

                    setEmployee(empData);

                    // Fetch mapped Garage details if available
                    if (empData.garageId) {
                        try {
                            const gRes = await fetch(`https://vehicleecare.onrender.com/api/garages/${empData.garageId}`);
                            if (gRes.ok) {
                                const gData = await gRes.json();
                                setGarage(gData.data || gData);
                            }
                        } catch (gErr) {
                            console.error("Failed to fetch garage details for employee", gErr);
                        }
                    }
                } else if (!employee) {
                    setEmployee(user);
                }
                setLastRefreshed(new Date());
            } catch (error) {
                console.error("Failed to fetch employee profile", error);
            } finally {
                if (!isSilent) setLoading(false);
            }
        };

        fetchEmployeeProfile();
        const interval = setInterval(() => {
            fetchEmployeeProfile(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [navigate]);

    const handleLogout = () => {
        broadcastEmployeeLogout();
        navigate('/login', { replace: true });
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            setSelectedReason('');
            setTentativeTime('');
            setDeleteReason('');
        }, 300);
    };

    const handleDeleteRequest = async () => {
        if (guardGuestAction()) return;
        if (!selectedReason) return triggerAlert('Please select a reason for account termination', 'error');
        if (!tentativeTime) return triggerAlert('Please select a tentative time to leave', 'error');
        if (!deleteReason.trim()) return triggerAlert('Please provide a detailed explanation for the deletion request', 'error');
        
        const empName = employee?.name || 'Employee User';
        const empId = employee?.employeeId || employee?._id || 'EMP-01';
        const combinedReason = `${selectedReason} (Timeline: ${tentativeTime}) - ${deleteReason.trim()}`;

        setIsSubmittingDelete(true);
        try {
            // Send to Requests collection for Admin Request tracker
            await fetch('https://vehicleecare.onrender.com/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portal: 'EMPLOYEE',
                    employeeId: empId,
                    userId: empId,
                    name: empName,
                    reason: 'Account Deletion',
                    requestType: 'Account Deletion',
                    type: 'Account Deletion',
                    reasonCategory: selectedReason,
                    explanation: deleteReason.trim(),
                    description: deleteReason.trim(),
                    tentativeTime: tentativeTime
                })
            });

            const res = await fetch('https://vehicleecare.onrender.com/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'account_deletion_request',
                    superCategory: 'adminNotification',
                    title: 'Employee Account Deletion Request',
                    message: `Employee "${empName}" (ID: ${empId}) has requested account deletion. Reason: ${selectedReason} | Timeline: ${tentativeTime}`,
                    meta: {
                        employeeId: empId,
                        name: empName,
                        reasonCategory: selectedReason,
                        tentativeTime: tentativeTime,
                        reasonDetails: deleteReason.trim(),
                        reason: combinedReason,
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

    if (loading) {
        return (
            <div className="space-y-6 max-w-[92rem] mx-auto animate-pulse">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <SkeletonBlock className="h-8 w-56 bg-slate-200 rounded-xl" />
                    <SkeletonBlock className="h-4 w-72 bg-slate-200 rounded-lg" />
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

                    {/* Mid Section: Contact & Location */}
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

    if (!employee) return null;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Employee Profile</h1>
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
                        {/* Employee Identity */}
                        <div className="space-y-2 w-full md:w-[31.5%] text-left">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Employee Identity</h4>
                            <div className="pt-5 uppercase space-y-4 relative overflow-hidden">
                                <div className="relative z-10 space-y-2">
                                    <p className="text-lg font-bold text-[#011023] uppercase leading-none">{employee.name}</p>
                                    <p className="text-sm mt-1 flex leading-relaxed tracking-wider">
                                        <span className="w-8 uppercase text-sm font-semibold">ID:</span> 
                                        <span className="font-semibold text-[#052558]">{employee.employeeId || employee._id || '—'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Employee Details */}
                        <div className="space-y-2 w-full md:w-[34%] text-left">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Employee Details</h4>
                            <div className="py-4 rounded-2xl uppercase space-y-2">
                                <p className="text-[15px] flex items-center leading-relaxed">
                                    <span className="text-gray-500 shrink-0 w-30 uppercase font-bold">Role</span> 
                                    <span className={`inline-block px-3 py-0.5 text-xs font-semibold uppercase rounded-full ${getRoleBadge(employee.role)}`}>
                                        {formatRole(employee.role)}
                                    </span>
                                </p>
                                <p className="text-[15px] flex items-center leading-relaxed">
                                    <span className="text-gray-500 shrink-0 w-30 uppercase font-bold">Category</span> 
                                    <span className={`inline-block px-3 py-0.5 text-xs font-semibold uppercase rounded-full ${getCategoryBadge(employee.category)}`}>
                                        {employee.category || 'General'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Security & Status */}
                        <div className="flex flex-col gap-4 w-full md:w-[30%] ml-auto text-left">
                            <div className="space-y-2">
                                <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Security & Status</h4>
                                <div className="space-y-3 mt-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14.5px] font-bold text-gray-500 uppercase tracking-widest">Verification</p>
                                        <span className={`inline-block px-3 py-0.5 text-xs font-semibold uppercase rounded-full ${
                                            employee.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {employee.isVerified ? 'VERIFIED' : 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[14.5px] font-bold text-gray-500 uppercase tracking-widest">Shift Pattern</p>
                                        <span className={`inline-block px-3 py-0.5 text-xs font-semibold uppercase rounded-full ${
                                            (employee.category || '').toLowerCase() === 'developer' || (employee.shift || '').toLowerCase() === 'full day' ? 'bg-sky-100 text-sky-700' :
                                            (employee.shift || '').toLowerCase() === 'morning' ? 'bg-amber-100 text-amber-700' :
                                            (employee.shift || '').toLowerCase() === 'night' ? 'bg-purple-100 text-purple-700' :
                                            (employee.shift || '').toLowerCase() === 'evening' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {(employee.category || '').toLowerCase() === 'developer' ? 'FULL DAY' : (employee.shift || 'FULL TIME')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mid Section: Operations & Location */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
                        {/* Operations Center */}
                        <div className="space-y-4 lg:col-span-1 text-left">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Operations Center</h4>
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Working Hours</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-center gap-2">
                                            {(employee?.category || '').toLowerCase() === 'developer' ? '09:00 AM - 05:00 PM' : (garage?.workingHours || employee?.workingHours || '09:00 AM - 08:00 PM')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Operating Cycles</p>
                                        <p className="text-[15px] font-semibold text-[#052558] uppercase flex items-center justify-end gap-2">
                                            {garage?.workingDays || employee?.workingDays || 'MON - SAT'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Protocol */}
                        <div className="space-y-4 lg:col-span-2 text-left">
                            <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Residential Protocol</h4>
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center">
                                <div className="grid grid-cols-1 lg:grid-cols-[54.5%_25%_19.75%] gap-1 w-full items-center">
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Permanent Address</p>
                                        <p className={`text-[15px] font-semibold text-[#052558] uppercase flex items-start gap-2 leading-relaxed truncate ${isGuest && isRealValue(employee.address) ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                            {maskAddress(employee.address) || '—'}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">District Division</p>
                                        <p className="text-[15px] font-semibold text-gray-700 uppercase truncate">{employee.district || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">State Registry</p>
                                        <p className="text-[15px] font-semibold text-gray-700 uppercase truncate">{employee.state || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Contact Channels */}
                    <div className="space-y-4 mb-5 text-left">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Communication Center</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Registered Email</p>
                                    <p className={`text-sm font-semibold text-[#052558] lowercase ${isGuest && isRealValue(employee.email) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskEmail(employee.email) || '—'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <Mail size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Mobile Contact</p>
                                    <p className={`text-sm font-semibold text-[#052558] ${isGuest && isRealValue(employee.phone) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskPhone(employee.phone || '9957680366')}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl transition-all">
                                    <Smartphone size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Digital ID Pointer</p>
                                    <p className={`text-sm font-semibold text-[#052558] font-mono ${isGuest && isRealValue(employee._id || employee.id) ? 'blur-sm select-none pointer-events-none' : ''}`}>{(employee._id || employee.id || '').substring(0, 12)}...</p>
                                </div>
                                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl transition-all">
                                    <ShieldCheck size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Employee Legal Details */}
                    <div className="space-y-4 mb-5 text-left">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Employee Legal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {(() => {
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
                                const panNum = formatDocNumber(employee?.panCardNumber, employee?.panNumber, employee?.panCard);
                                const adharNum = formatDocNumber(employee?.adharCardNumber, employee?.adharNumber, employee?.aadhaarCard, employee?.adharCard);
                                const voterNum = formatDocNumber(employee?.voterIdNumber, employee?.voterNumber, employee?.voterId);

                                return (
                                    <>
                                        <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                            <div className="space-y-1 overflow-hidden">
                                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Employee PAN Card</p>
                                                <p className={`text-sm font-semibold text-[#052558] truncate ${isGuest && isRealValue(panNum) ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                                    {panNum ? `XXXXX${panNum.slice(-4)}` : '—'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all shrink-0 ml-2">
                                                <CreditCard size={18} />
                                            </div>
                                        </div>

                                        <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                            <div className="space-y-1 overflow-hidden">
                                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Employee Adhar Card</p>
                                                <p className={`text-sm font-semibold text-[#052558] truncate ${isGuest && isRealValue(adharNum) ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                                    {adharNum ? `XXXX XXXX ${adharNum.slice(-4)}` : '—'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all shrink-0 ml-2">
                                                <CreditCard size={18} />
                                            </div>
                                        </div>

                                        <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all text-left">
                                            <div className="space-y-1 overflow-hidden">
                                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Employee Voter Card</p>
                                                <p className={`text-sm font-semibold text-[#052558] truncate ${isGuest && isRealValue(voterNum) ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                                    {voterNum || '—'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all shrink-0 ml-2">
                                                <CreditCard size={18} />
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Section: Employment Work Details */}
                    <div className="space-y-4 text-left">
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider">Work Registry Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Salary Model</p>
                                    <p className="text-sm font-semibold text-[#052558]">{employee.salaryType || 'MONTHLY'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <CreditCard size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Joining Date</p>
                                    <p className="text-sm font-semibold uppercase text-[#052558]">{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl transition-all">
                                    <Calendar size={18} />
                                </div>
                            </div>

                            <div className="bg-white border border-[#e6f0fa] p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all text-left">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Garage Mapping</p>
                                    <p className="text-sm font-semibold text-[#052558]">{employee.garageId || 'NO MAPPING'}</p>
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
                                    Are you sure you want to request the deletion of your account.
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
                                            {DELETION_REASONS.map((reason) => (
                                                <option key={reason} value={reason}>
                                                    {reason}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="w-[34%]">
                                        <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider block text-center mb-2 truncate" title="Tentative time to leave">
                                            Tentative time to leave
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
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
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
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Employee Name</label>
                                    <input readOnly value={form.name} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Employee ID</label>
                                    <input readOnly value={form.employeeId} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Registered Email</label>
                                    <input readOnly value={form.email} className="w-full px-4 py-2.5 bg-slate-100 uppercase border border-[#cbd5e1] rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed lowercase" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Mobile Contact</label>
                                    <input readOnly value={form.phone} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Department</label>
                                    <input readOnly value={form.category} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Designation</label>
                                    <input readOnly value={form.role} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Employee PAN Card</label>
                                    <input 
                                        readOnly={Boolean(formatDocNumber(employee?.panCardNumber, employee?.panNumber, employee?.panCard))}
                                        value={form.panCard} 
                                        onChange={e => setForm({ ...form, panCard: formatPAN(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            formatDocNumber(employee?.panCardNumber, employee?.panNumber, employee?.panCard)
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={10} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Employee Adhar Card</label>
                                    <input 
                                        readOnly={Boolean(formatDocNumber(employee?.adharCardNumber, employee?.adharNumber, employee?.aadhaarCard, employee?.adharCard))}
                                        value={form.adharCard} 
                                        onChange={e => setForm({ ...form, adharCard: formatAadhar(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            formatDocNumber(employee?.adharCardNumber, employee?.adharNumber, employee?.aadhaarCard, employee?.adharCard)
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={14} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Employee Voter ID</label>
                                    <input 
                                        readOnly={Boolean(formatDocNumber(employee?.voterIdNumber, employee?.voterNumber, employee?.voterId))}
                                        value={form.voterId} 
                                        onChange={e => setForm({ ...form, voterId: formatVoter(e.target.value) })} 
                                        className={`w-full px-4 py-2.5 uppercase rounded-xl font-semibold font-sans text-xs transition-all ${
                                            formatDocNumber(employee?.voterIdNumber, employee?.voterNumber, employee?.voterId)
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-500 outline-none cursor-not-allowed'
                                                : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#011023] focus:outline-none focus:bg-white focus:border-[#a5b4fc]'
                                        }`}
                                        maxLength={10} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Residential Address</label>
                                    <input readOnly value={form.address} className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Profile Picture</label>
                                    <input 
                                        type="file" 
                                        ref={profileFileRef} 
                                        accept="image/*" 
                                        onChange={handleProfilePictureUpload} 
                                        className="hidden" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => profileFileRef.current?.click()}
                                        disabled={uploadingProfilePic || hasProfilePicture}
                                        className={`w-full px-4 py-2.5 rounded-xl font-semibold font-sans text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs ${
                                            hasProfilePicture
                                                ? 'bg-slate-100 border border-[#cbd5e1] text-gray-400 cursor-not-allowed opacity-60'
                                                : 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] hover:bg-[#c7d2fe] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {uploadingProfilePic ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> UPLOADING...
                                            </>
                                        ) : hasProfilePicture ? (
                                            <>
                                                <Upload size={14} /> PHOTO UPLOADED
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} /> UPLOAD PHOTO
                                            </>
                                        )}
                                    </button>
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
