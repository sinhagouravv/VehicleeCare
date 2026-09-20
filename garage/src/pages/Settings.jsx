import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Home, Clock, Wrench, Car, Loader2, Bell, Shield } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { defaultServicesList } from '../data/servicesData';
import useGuestGuard from '../hooks/useGuestGuard';

const ToggleSwitch = ({ isActive, onChange, size = 'default' }) => {
    const isSmall = size === 'xs';
    return (
        <button
            type="button"
            onClick={() => onChange(!isActive)}
            className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSmall ? 'h-5 w-9' : 'h-6 w-11'
            } ${isActive ? 'bg-[#527FB0]' : 'bg-gray-200'}`}
        >
            <span
                className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isSmall ? 'h-4 w-4' : 'h-5 w-5'
                } ${isActive ? (isSmall ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'}`}
            />
        </button>
    );
};

const Settings = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const [activeTab, setActiveTab] = useState('services');
    const [activeServiceTab, setActiveServiceTab] = useState('PETROL');
    const [disabledServices, setDisabledServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { triggerAlert } = useAlert();
    const { isGuest, guardGuestAction } = useGuestGuard();

    const garageUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
    const garageId = garageUser._id || garageUser.id; // Prioritize MongoDB _id


    const [notificationSettings, setNotificationSettings] = useState({
        // 1. Booking Notifications
        newBookingAlert: true,
        bookingCancelled: true,
        bookingRescheduled: true,
        serviceCompleted: true,
        pickupAssigned: true,
        pickupCompleted: true,

        // 2. Payment Notifications
        paymentReceived: true,
        paymentFailed: true,
        refundIssued: false,
        pendingPaymentReminder: true,

        // 3. Garage Notifications
        newGarageRegistration: false,
        garageApprovalRequest: false,
        garageSuspended: false,
        lowRatingAlert: true,

        // 4. User Activity Alerts
        newUserRegistration: false,
        suspiciousActivity: true,
        multipleFailedLogins: true,

        // 5. System Alerts
        serverMaintenance: true,
        systemErrors: true,
        featureUpdates: true
    });

    const handleNotificationChange = (field, value) => {
        setNotificationSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const [securitySettings, setSecuritySettings] = useState({
        // 1. Password
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',

        // 2. 2FA
        enable2FA: false,
        authenticatorApp: false,

        // 3. Login Security
        lastLoginTime: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        lastLoginIp: '192.168.1.45',
        activeSessions: 3,

        // 4. Session Settings
        autoLogoutMinutes: 30,
        rememberMe: false,
        maxConcurrentSessions: 3,

        // 5. Account Protection
        lockAfterFailedAttempts: 5,
        passwordExpiryDays: 90,
        enforceStrongPassword: true
    });

    const handleSecurityChange = (field, value) => {
        setSecuritySettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (!securitySettings.newPassword || !securitySettings.confirmNewPassword) {
            triggerAlert('Please fill in both new password fields.', 'warning');
            return;
        }
        if (securitySettings.newPassword !== securitySettings.confirmNewPassword) {
            triggerAlert('New password and confirm password do not match.', 'error');
            return;
        }
        triggerAlert('Password updated successfully.', 'success');
        setSecuritySettings(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }));
    };

    const handleLogoutAllDevices = () => {
        triggerAlert('Logged out from all other devices successfully.', 'success');
    };

    useEffect(() => {
        const fetchSettings = async () => {
            if (!garageId) return;
            try {
                const res = await fetch(`https://vehicleecare.onrender.com/api/garages/${garageId}`);
                const result = await res.json();
                if (result.success && result.data) {
                    setDisabledServices(result.data.disabledServices || []);
                    if (result.data.notificationSettings) {
                        setNotificationSettings(prev => ({ ...prev, ...result.data.notificationSettings }));
                    }
                    if (result.data.securitySettings) {
                        setSecuritySettings(prev => ({ ...prev, ...result.data.securitySettings }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
                triggerAlert("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [garageId, triggerAlert]);

    const handleSave = async () => {
        if (guardGuestAction()) return;
        setSaving(true);
        try {
            const res = await fetch(`https://vehicleecare.onrender.com/api/garages/${garageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disabledServices, notificationSettings, securitySettings })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                triggerAlert("Settings saved successfully", "success");
            } else {
                throw new Error(result.message || 'Server returned an error');
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            triggerAlert(err.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const toggleService = (serviceName) => {
        setDisabledServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
    };

    const getTabClass = (tab) => {
        return activeTab === tab
            ? "w-full flex items-center gap-3 px-4 py-3 bg-white/60 shadow-sm border border-blue-100 rounded-xl text-left font-bold text-[#052558] transition-colors cursor-pointer"
            : "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/40 border border-transparent hover:border-blue-50 rounded-xl text-left font-semibold text-gray-500 hover:text-[#052558] transition-colors cursor-pointer";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#052558] animate-spin" />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto transition-all duration-300`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Settings</h1>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-9 py-1.25 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-[14px] font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={15.5} className="animate-spin" /> : <Save size={15.5} />}
                    {saving ? 'SAVING...' : 'SAVE DETAILS'}
                </button>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-5 items-start">

                {/* Navigation Sidebar */}
                <div className="w-[16rem] text-sm flex-shrink-0 space-y-2">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={getTabClass('services')}
                    >
                        <Car size={18} /> SERVICES
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={getTabClass('notifications')}
                    >
                        <Bell size={18} /> NOTIFICATIONS
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={getTabClass('security')}
                    >
                        <Shield size={18} /> SECURITY
                    </button>
                </div>

                {/* Main Settings Content */}
                <div className="flex-1 min-w-0 w-full space-y-6">

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col h-full">
                            <div className="pt-6 pl-7 pb-2">
                                <h2 className="text-lg uppercase font-bold text-[#011023]">Service Categories</h2>
                            </div>
                            <div className="pl-6 pr-6 pt-0.5 flex-1 overflow-hidden flex flex-col">

                                {/* Nested Service Tabs */}
                                <div className="bg-white border border-[#e6f0fa] rounded-[14px] shadow-xs flex items-center uppercase text-[13px] font-semibold w-fit mb-4">
                                    {['PETROL', 'DIESEL', 'EV'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveServiceTab(tab)}
                                            className={`px-4 py-1.5 rounded-[14px] transition-all uppercase cursor-pointer ${activeServiceTab === tab
                                                ? 'bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] font-semibold'
                                                : 'text-gray-500 hover:text-[#3730a3] border border-transparent'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content Wrapper */}
                                <div className="space-y-8 overflow-y-auto hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ maxHeight: "calc(100vh - 360px)" }}>

                                    {/* Dynamic Services Tab */}
                                    {(() => {
                                        if (activeServiceTab === 'PREMIUM') return null;

                                        const activeFuelTypeStr = activeServiceTab === 'PETROL' ? 'Petrol' :
                                            activeServiceTab === 'DIESEL' ? 'Diesel' :
                                                activeServiceTab === 'EV' ? 'EV' : '';

                                        const allServices = defaultServicesList;
                                        const filteredServices = allServices.filter(s => s.fuelType === activeFuelTypeStr);

                                        // Group dynamically while maintaining intrinsic order from defaultServicesList
                                        const categoryOrderRaw = [...new Set(defaultServicesList.map(s => s.category))];
                                        const getCategoryIndex = (cat) => {
                                            const idx = categoryOrderRaw.indexOf(cat);
                                            return idx !== -1 ? idx : 999;
                                        };

                                        // Apply ordering
                                        const sortedServices = filteredServices.sort((a, b) => {
                                            const catA = getCategoryIndex(a.category);
                                            const catB = getCategoryIndex(b.category);
                                            if (catA !== catB) return catA - catB;
                                            return 0;
                                        });

                                        // Group by category after sorting
                                        const servicesByCategory = sortedServices.reduce((acc, curr) => {
                                            if (!acc[curr.category]) acc[curr.category] = [];
                                            if (!acc[curr.category].find(s => s.name === curr.name)) {
                                                acc[curr.category].push(curr);
                                            }
                                            return acc;
                                        }, {});

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {Object.entries(servicesByCategory).map(([category, items]) => (
                                                    <div key={category} className="space-y-2.5 bg-[#FFFFFF] p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-0.5 ">
                                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">{category}</h3>
                                                        <div className="space-y-0.5 max-h-[140px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                            {items.map(s => (
                                                                <div key={s.id || s.name} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-1.5 last:pb-0">
                                                                    <span className="text-xs uppercase text-gray-700">{s.name}</span>
                                                                    <ToggleSwitch
                                                                        size="xs"
                                                                        isActive={!disabledServices.includes(s.name)}
                                                                        onChange={() => toggleService(s.name)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            {/* 1. Booking Notifications */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Booking Notifications</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                         <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">New Booking Alert</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.newBookingAlert}
                                                onChange={val => handleNotificationChange('newBookingAlert', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Booking Cancelled</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.bookingCancelled}
                                                onChange={val => handleNotificationChange('bookingCancelled', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Booking Rescheduled</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.bookingRescheduled}
                                                onChange={val => handleNotificationChange('bookingRescheduled', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Service Completed</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.serviceCompleted}
                                                onChange={val => handleNotificationChange('serviceCompleted', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Pickup Assigned</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.pickupAssigned}
                                                onChange={val => handleNotificationChange('pickupAssigned', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Pickup Completed</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.pickupCompleted}
                                                onChange={val => handleNotificationChange('pickupCompleted', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Payment Notifications */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Payment Notifications</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Payment Received</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.paymentReceived}
                                                onChange={val => handleNotificationChange('paymentReceived', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Payment Failed</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.paymentFailed}
                                                onChange={val => handleNotificationChange('paymentFailed', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Refund Issued</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.refundIssued}
                                                onChange={val => handleNotificationChange('refundIssued', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Garage Notifications */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                               <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Garage Notifications</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">New Garage Registration</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.newGarageRegistration}
                                                onChange={val => handleNotificationChange('newGarageRegistration', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Garage Approval Request</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.garageApprovalRequest}
                                                onChange={val => handleNotificationChange('garageApprovalRequest', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Garage Suspended</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.garageSuspended}
                                                onChange={val => handleNotificationChange('garageSuspended', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. User Activity Alerts */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">User Activity Alerts</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">New User Registration</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.newUserRegistration}
                                                onChange={val => handleNotificationChange('newUserRegistration', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Suspicious Activity</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.suspiciousActivity}
                                                onChange={val => handleNotificationChange('suspiciousActivity', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Multiple Failed Logins</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.multipleFailedLogins}
                                                onChange={val => handleNotificationChange('multipleFailedLogins', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. System Alerts */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">System Alerts</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Server Maintenance</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.serverMaintenance}
                                                onChange={val => handleNotificationChange('serverMaintenance', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">System Errors</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.systemErrors}
                                                onChange={val => handleNotificationChange('systemErrors', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Feature Updates</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={notificationSettings.featureUpdates}
                                                onChange={val => handleNotificationChange('featureUpdates', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* 1. Change Password */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase flex items-center gap-2">Change Password</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase space-y-6">
                                    <form onSubmit={handlePasswordChange}>
                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Current Password</label>
                                                <input type="password" placeholder="••••••••" value={securitySettings.currentPassword} onChange={e => handleSecurityChange('currentPassword', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[14.5px] font-semibold text-gray-700 uppercase">New Password</label>
                                                <input type="password" placeholder="••••••••" value={securitySettings.newPassword} onChange={e => handleSecurityChange('newPassword', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />

                                                {/* Password Strength Indicator */}
                                                {(securitySettings.newPassword || '').length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex gap-1 h-1">
                                                            <div className={`flex-1 rounded-full ${(securitySettings.newPassword || '').length > 3 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                                            <div className={`flex-1 rounded-full ${(securitySettings.newPassword || '').length > 6 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                                            <div className={`flex-1 rounded-full ${(securitySettings.newPassword || '').length > 8 && /[A-Z]/.test(securitySettings.newPassword || '') && /[0-9]/.test(securitySettings.newPassword || '') ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 font-medium">
                                                            {(securitySettings.newPassword || '').length < 4 ? 'Weak' : (securitySettings.newPassword || '').length < 8 ? 'Fair' : 'Strong'} password
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Confirm Password</label>
                                                <input type="password" placeholder="••••••••" value={securitySettings.confirmNewPassword} onChange={e => handleSecurityChange('confirmNewPassword', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                            </div>
                                            <div className="mt-6">
                                                <button type="submit" className="px-5 py-2.5 bg-[#011023] text-white font-bold rounded-xl shadow-sm hover:bg-[#052558] transition-colors uppercase text-[13px] cursor-pointer">
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* 2. Two-Factor Authentication */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Two-Factor Authentication</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-[13px] uppercase">Enable 2FA (OTP via Email/SMS)</h3>
                                            </div>
                                            <ToggleSwitch
                                                isActive={securitySettings.enable2FA}
                                                onChange={val => handleSecurityChange('enable2FA', val)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-[13px] uppercase">Authenticator App Support</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">(Google Authenticator)</p>
                                            </div>
                                            <ToggleSwitch
                                                isActive={securitySettings.authenticatorApp}
                                                onChange={val => handleSecurityChange('authenticatorApp', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Login Security */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Login Security</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Login Time</p>
                                            <p className="font-bold text-[#011023] text-sm">{securitySettings.lastLoginTime}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Login IP Address</p>
                                            <p className="font-bold text-[#011023] text-sm">{securitySettings.lastLoginIp}</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-xs text-blue-500 uppercase font-semibold mb-1">Active Sessions</p>
                                            <p className="font-bold text-blue-900 text-sm">{securitySettings.activeSessions} Devices</p>
                                        </div>
                                        <div>
                                            <button onClick={handleLogoutAllDevices} className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl shadow-sm hover:bg-red-100 transition-colors uppercase text-[13px] cursor-pointer">
                                                Logout From All Devices
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Session Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Session Settings</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Auto Logout After (Minutes)</label>
                                            <input type="number" value={securitySettings.autoLogoutMinutes} onChange={e => handleSecurityChange('autoLogoutMinutes', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Max Concurrent Sessions</label>
                                            <input type="number" value={securitySettings.maxConcurrentSessions} onChange={e => handleSecurityChange('maxConcurrentSessions', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="pt-8">
                                            <div className="flex items-center justify-between py-2">
                                                <div>
                                                    <h3 className="font-bold text-[#011023] text-[13px] uppercase">Remember Me Option</h3>
                                                </div>
                                                <ToggleSwitch
                                                    isActive={securitySettings.rememberMe}
                                                    onChange={val => handleSecurityChange('rememberMe', val)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Account Protection */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Account Protection</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Lock Account After (Failed Attempts)</label>
                                            <input type="number" value={securitySettings.lockAfterFailedAttempts} onChange={e => handleSecurityChange('lockAfterFailedAttempts', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Password Expiry (Days)</label>
                                            <input type="number" value={securitySettings.passwordExpiryDays} onChange={e => handleSecurityChange('passwordExpiryDays', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="pt-8">
                                            <div className="flex items-center justify-between py-2">
                                                <div>
                                                    <h3 className="font-bold text-[#011023] text-[13px] uppercase">Enforce Strong Password Policy</h3>
                                                </div>
                                                <ToggleSwitch
                                                    isActive={securitySettings.enforceStrongPassword}
                                                    onChange={val => handleSecurityChange('enforceStrongPassword', val)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
