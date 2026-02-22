import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, Globe, CreditCard, Wrench, Car } from 'lucide-react';
import { defaultServicesList } from '../data/servicesData';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [activeServiceTab, setActiveServiceTab] = useState('PETROL');
    const [disabledServices, setDisabledServices] = useState([]);
    const [customServices, setCustomServices] = useState([]);
    const [billingSettings, setBillingSettings] = useState({
        platformFee: '',
        gst: '',
        convenienceFee: '',
        pickupDropCharges: '',
        handlingCharges: '',
        surgePricing: '',
        emergencyServiceFee: '',
        garageCommission: '',
        franchiseCommission: '',
        refundDeductionPolicy: '',
        enableUpi: false,
        enableCard: false,
        enableCash: false,
        autoRefund: false,
        minPaymentAmount: '',
        invoicePrefix: 'INV-',
        invoiceHsnSac: '',
        companyGst: '',
        billingAddress: '',
        showGstBreakdown: false
    });

    const handleBillingChange = (field, value) => {
        setBillingSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const [notificationSettings, setNotificationSettings] = useState({
        // 1. Booking Notifications
        newBookingAlert: false,
        bookingCancelled: false,
        bookingRescheduled: false,
        serviceCompleted: false,
        pickupAssigned: false,

        // 2. Payment Notifications
        paymentReceived: false,
        paymentFailed: false,
        refundIssued: false,
        pendingPaymentReminder: false,

        // 3. Garage Notifications
        newGarageRegistration: false,
        garageApprovalRequest: false,
        garageSuspended: false,
        lowRatingAlert: false,

        // 4. User Activity Alerts
        newUserRegistration: false,
        suspiciousActivity: false,
        multipleFailedLogins: false,

        // 5. System Alerts
        serverMaintenance: false,
        systemErrors: false,
        featureUpdates: false,
        downtimeNotification: false
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
        lastLoginTime: new Date().toLocaleString(),
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
        alert('Password update functionality will connect to auth service.');
    };

    const handleLogoutAllDevices = () => {
        alert('Logging out of all other devices...');
    };

    const [generalSettings, setGeneralSettings] = useState({
        companyName: '',
        websiteUrl: '',
        supportEmail: '',
        supportPhone: '',
        message: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        headOfficeAddress: '',
        gstNumber: '',
        panNumber: '',
        cin: '',
        hsnSacCode: '',
        defaultCurrency: 'INR (₹)',
        timezone: 'Asia/Kolkata (IST)',
        dateFormat: 'DD/MM/YYYY',
        language: 'English'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleGeneralChange = (field, value) => {
        setGeneralSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/settings/disabledServices');
                const result = await res.json();
                if (result.success && result.data) {
                    setDisabledServices(result.data);
                }

                const resCustom = await fetch('http://localhost:5001/api/settings/customServices');
                const resultCustom = await resCustom.json();
                if (resultCustom.success && resultCustom.data) {
                    setCustomServices(resultCustom.data);
                }

                const billRes = await fetch('http://localhost:5001/api/settings/billingSettings');
                const billResult = await billRes.json();
                if (billResult.success && billResult.data) {
                    setBillingSettings(prev => ({ ...prev, ...billResult.data }));
                }

                const notifRes = await fetch('http://localhost:5001/api/settings/notificationSettings');
                const notifResult = await notifRes.json();
                if (notifResult.success && notifResult.data) {
                    setNotificationSettings(prev => ({ ...prev, ...notifResult.data }));
                }

                const secRes = await fetch('http://localhost:5001/api/settings/securitySettings');
                const secResult = await secRes.json();
                if (secResult.success && secResult.data) {
                    setSecuritySettings(prev => ({ ...prev, ...secResult.data }));
                }

                const genRes = await fetch('http://localhost:5001/api/settings/generalSettings');
                const genResult = await genRes.json();
                if (genResult.success && genResult.data) {
                    setGeneralSettings(prev => ({ ...prev, ...genResult.data }));
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const handleServiceToggle = (serviceName) => {
        setDisabledServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                fetch('http://localhost:5001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'disabledServices', value: disabledServices })
                }),
                fetch('http://localhost:5001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'generalSettings', value: generalSettings })
                }),
                fetch('http://localhost:5001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'billingSettings', value: billingSettings })
                }),
                fetch('http://localhost:5001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'notificationSettings', value: notificationSettings })
                }),
                fetch('http://localhost:5001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'securitySettings', value: securitySettings })
                })
            ]);
            alert('Settings saved successfully!');
        } catch (err) {
            console.error("Error saving settings:", err);
            alert('Error saving settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const getTabClass = (tabName) => {
        return activeTab === tabName
            ? "w-full flex items-center gap-3 px-4 py-3 bg-white/60 shadow-sm border border-blue-100 rounded-xl text-left font-bold text-[#052558] transition-colors"
            : "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/40 border border-transparent hover:border-blue-50 rounded-xl text-left font-semibold text-gray-500 hover:text-[#052558] transition-colors";
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">System Settings</h1>
                <button onClick={handleSaveChanges} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-75 disabled:cursor-not-allowed">
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-5 items-start">

                {/* Navigation Sidebar (Settings Specific) */}
                <div className="w-[16rem] text-sm flex-shrink-0 space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={getTabClass('general')}
                    >
                        <Globe size={18} /> GENERAL
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={getTabClass('services')}
                    >
                        <Car size={18} /> SERVICES
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={getTabClass('billing')}
                    >
                        <CreditCard size={18} /> BILLING
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
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={getTabClass('maintenance')}
                    >
                        <Wrench size={18} /> MAINTENANCE
                    </button>
                </div>

                {/* Main Settings Content */}
                <div className="flex-1 min-w-0 w-full space-y-6">

                    {/* Part 1: General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Basic Platform Info */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold text-[#011023] flex items-center uppercase gap-2">Basic Platform Info</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5">
                                    <div className="grid grid-cols-1 uppercase md:grid-cols-4 gap-4">
                                        <div className="space-y-2 ">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Company Name</label>
                                            <input type="text" value={generalSettings.companyName} onChange={e => handleGeneralChange('companyName', e.target.value)} className="w-full text-[13px] px-4 mt-1.5 uppercase py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Website URL</label>
                                            <input type="url" value={generalSettings.websiteUrl} onChange={e => handleGeneralChange('websiteUrl', e.target.value)} className="w-full text-[13px] px-4 mt-1.5  py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Support Email</label>
                                            <input type="email" value={generalSettings.supportEmail} onChange={e => handleGeneralChange('supportEmail', e.target.value)} className="w-full text-[13px] px-4 mt-1.5 uppercase py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Support Phone</label>
                                            <input type="text" value={generalSettings.supportPhone} onChange={e => handleGeneralChange('supportPhone', e.target.value)} className="w-full text-[13px] px-4 mt-1.5 uppercase py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>

                                    </div>
                                    <div className="space-y-2 mt-2">
                                        <label className="text-[14.5px] uppercase  font-semibold  text-gray-700">Message</label>
                                        <textarea rows="2" value={generalSettings.message} onChange={e => handleGeneralChange('message', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023] custom-scrollbar"></textarea>
                                    </div>


                                </div>
                            </div>

                            {/* Company Address */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6 ">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase flex items-center gap-2">Company Address</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase ">

                                    <div className="grid grid-cols-1 md:grid-cols-4  gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">City</label>
                                            <input type="text" value={generalSettings.city} onChange={e => handleGeneralChange('city', e.target.value)} className="w-full text-[13px] uppercase px-4 mt-1.5 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">State</label>
                                            <input type="text" value={generalSettings.state} onChange={e => handleGeneralChange('state', e.target.value)} className="w-full text-[13px] uppercase px-4 mt-1.5 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Pincode</label>
                                            <input type="text" value={generalSettings.pincode} onChange={e => handleGeneralChange('pincode', e.target.value)} className="w-full text-[13px] uppercase px-4 mt-1.5 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Country</label>
                                            <input type="text" value={generalSettings.country} onChange={e => handleGeneralChange('country', e.target.value)} className="w-full text-[13px] uppercase px-4 mt-1.5 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-2">
                                        <label className="text-[14.5px]  font-semibold  text-gray-700">Head Office Address</label>
                                        <input type="text" value={generalSettings.headOfficeAddress} onChange={e => handleGeneralChange('headOfficeAddress', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                    </div>
                                </div>
                            </div>

                            {/* Legal & Tax Details */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Legal & Tax Details</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">GST Number</label>
                                            <input type="text" maxLength="15" value={generalSettings.gstNumber} onChange={e => handleGeneralChange('gstNumber', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">PAN Number</label>
                                            <input type="text" maxLength="10" value={generalSettings.panNumber} onChange={e => handleGeneralChange('panNumber', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">CIN</label>
                                            <input type="text" maxLength="21" value={generalSettings.cin} onChange={e => handleGeneralChange('cin', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">HSN/SAC Code</label>
                                            <input type="text" maxLength="6" value={generalSettings.hsnSacCode} onChange={e => handleGeneralChange('hsnSacCode', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Localization Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="pt-4 pl-6">
                                    <h2 className="text-lg font-bold uppercase text-[#011023] flex items-center gap-2">Localization Settings</h2>
                                </div>
                                <div className="pt-3 pl-6 pr-5 pb-5 uppercase ">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Default Currency</label>
                                            <select value={generalSettings.defaultCurrency} onChange={e => handleGeneralChange('defaultCurrency', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023]">
                                                <option>INR (₹)</option>
                                                <option>USD ($)</option>
                                                <option>EUR (€)</option>
                                                <option>GBP (£)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Timezone</label>
                                            <select value={generalSettings.timezone} onChange={e => handleGeneralChange('timezone', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023]">
                                                <option>Asia/Kolkata (IST)</option>
                                                <option>UTC (GMT)</option>
                                                <option>America/New_York (EST)</option>
                                                <option>Europe/London (GMT)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Date Format</label>
                                            <select value={generalSettings.dateFormat} onChange={e => handleGeneralChange('dateFormat', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023]">
                                                <option>DD/MM/YYYY</option>
                                                <option>MM/DD/YYYY</option>
                                                <option>YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px]  font-semibold  text-gray-700">Language</label>
                                            <select value={generalSettings.language} onChange={e => handleGeneralChange('language', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023]">
                                                <option>English</option>
                                                <option>Hindi</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Part 2: Security Settings */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">

                            {/* 1. Change Password */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">1️⃣ Change Password</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Update your admin account password.</p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <form onSubmit={handlePasswordChange}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Current Password</label>
                                                <input type="password" placeholder="••••••••" value={securitySettings.currentPassword} onChange={e => handleSecurityChange('currentPassword', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[14.5px] font-semibold text-gray-700 uppercase">New Password</label>
                                                <input type="password" placeholder="••••••••" value={securitySettings.newPassword} onChange={e => handleSecurityChange('newPassword', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023]" />

                                                {/* Password Strength Indicator (Visual Only) */}
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
                                        </div>
                                        <div className="mt-6">
                                            <button type="submit" className="px-5 py-2.5 bg-[#011023] text-white font-bold rounded-xl shadow-sm hover:bg-[#052558] transition-colors uppercase text-[13px]">
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* 2. Two-Factor Authentication */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">2️⃣ Two-Factor Authentication (Very Important)</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Enterprise-level account security.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-[13px] uppercase">Enable 2FA (OTP via Email/SMS)</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={securitySettings.enable2FA} onChange={e => handleSecurityChange('enable2FA', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-[13px] uppercase">Authenticator App Support</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">(Google Authenticator)</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={securitySettings.authenticatorApp} onChange={e => handleSecurityChange('authenticatorApp', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Login Security */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">3️⃣ Login Security</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Monitor and manage active admin sessions.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                                    </div>
                                    <div>
                                        <button onClick={handleLogoutAllDevices} className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl shadow-sm hover:bg-red-100 transition-colors uppercase text-[13px]">
                                            Logout From All Devices
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Session Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">4️⃣ Session Settings</h2>
                                </div>
                                <div className="p-6">
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
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={securitySettings.rememberMe} onChange={e => handleSecurityChange('rememberMe', e.target.checked)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Account Protection */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">5️⃣ Account Protection</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Enforce strict rules to prevent unauthorized access.</p>
                                </div>
                                <div className="p-6">
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
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={securitySettings.enforceStrongPassword} onChange={e => handleSecurityChange('enforceStrongPassword', e.target.checked)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Part 3: Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">

                            {/* 1. Booking Notifications */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">1️⃣ Booking Notifications</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Operational alerts for booking status changes.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">New Booking Alert</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.newBookingAlert} onChange={e => handleNotificationChange('newBookingAlert', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Booking Cancelled</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.bookingCancelled} onChange={e => handleNotificationChange('bookingCancelled', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Booking Rescheduled</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.bookingRescheduled} onChange={e => handleNotificationChange('bookingRescheduled', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Service Completed</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.serviceCompleted} onChange={e => handleNotificationChange('serviceCompleted', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Pickup Assigned</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.pickupAssigned} onChange={e => handleNotificationChange('pickupAssigned', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 2. Payment Notifications */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">2️⃣ Payment Notifications</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Crucial alerts for business control and revenue tracking.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Payment Received</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.paymentReceived} onChange={e => handleNotificationChange('paymentReceived', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Payment Failed</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.paymentFailed} onChange={e => handleNotificationChange('paymentFailed', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Refund Issued</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.refundIssued} onChange={e => handleNotificationChange('refundIssued', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Pending Payment Reminder</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.pendingPaymentReminder} onChange={e => handleNotificationChange('pendingPaymentReminder', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 3. Garage Notifications */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">3️⃣ Garage Notifications</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Alerts regarding partner garage statuses.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">New Garage Registration</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.newGarageRegistration} onChange={e => handleNotificationChange('newGarageRegistration', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Garage Approval Request</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.garageApprovalRequest} onChange={e => handleNotificationChange('garageApprovalRequest', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Garage Suspended</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.garageSuspended} onChange={e => handleNotificationChange('garageSuspended', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Low Rating Alert</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.lowRatingAlert} onChange={e => handleNotificationChange('lowRatingAlert', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 4. User Activity Alerts */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">4️⃣ User Activity Alerts</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Security-level alerts for user actions.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">New User Registration</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.newUserRegistration} onChange={e => handleNotificationChange('newUserRegistration', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Suspicious Activity</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.suspiciousActivity} onChange={e => handleNotificationChange('suspiciousActivity', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Multiple Failed Logins</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.multipleFailedLogins} onChange={e => handleNotificationChange('multipleFailedLogins', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 5. System Alerts */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">5️⃣ System Alerts</h2>
                                    <p className="text-[13px] text-gray-500 mt-1 uppercase">Technical notifications regarding platform health.</p>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Server Maintenance</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.serverMaintenance} onChange={e => handleNotificationChange('serverMaintenance', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">System Errors</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.systemErrors} onChange={e => handleNotificationChange('systemErrors', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Feature Updates</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.featureUpdates} onChange={e => handleNotificationChange('featureUpdates', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Downtime Notification</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={notificationSettings.downtimeNotification} onChange={e => handleNotificationChange('downtimeNotification', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Part 4: Billing Settings */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">

                            {/* 1. Platform Financial Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">Platform Financial Settings</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Platform Fee (₹ or %)</label>
                                            <input type="text" value={billingSettings.platformFee} onChange={e => handleBillingChange('platformFee', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">GST (%)</label>
                                            <input type="number" value={billingSettings.gst} onChange={e => handleBillingChange('gst', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Convenience Fee (₹)</label>
                                            <input type="number" value={billingSettings.convenienceFee} onChange={e => handleBillingChange('convenienceFee', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Pickup & Drop Charges (₹)</label>
                                            <input type="number" value={billingSettings.pickupDropCharges} onChange={e => handleBillingChange('pickupDropCharges', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Handling Charges (₹)</label>
                                            <input type="number" value={billingSettings.handlingCharges} onChange={e => handleBillingChange('handlingCharges', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Emergency Service Fee</label>
                                            <input type="number" value={billingSettings.emergencyServiceFee} onChange={e => handleBillingChange('emergencyServiceFee', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Commission Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">Commission Settings (Very Important)</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Garage Commission (%)</label>
                                            <input type="number" value={billingSettings.garageCommission} onChange={e => handleBillingChange('garageCommission', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Franchise Commission (%)</label>
                                            <input type="number" value={billingSettings.franchiseCommission} onChange={e => handleBillingChange('franchiseCommission', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Refund Deduction Policy (%)</label>
                                            <input type="number" value={billingSettings.refundDeductionPolicy} onChange={e => handleBillingChange('refundDeductionPolicy', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Payment Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">Payment Settings</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Enable UPI</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={billingSettings.enableUpi} onChange={e => handleBillingChange('enableUpi', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-sm uppercase">Enable Card</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={billingSettings.enableCard} onChange={e => handleBillingChange('enableCard', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-[12.5px] uppercase">Enable Cash (COD)</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={billingSettings.enableCash} onChange={e => handleBillingChange('enableCash', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white border border-blue-50 rounded-xl">
                                            <div>
                                                <h3 className="font-bold text-[#011023] text-[12.5px] uppercase">Auto Refund</h3>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={billingSettings.autoRefund} onChange={e => handleBillingChange('autoRefund', e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                            </label>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            {/* 4. Invoice & Tax Settings */}
                            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-[#e6f0fa]">
                                    <h2 className="text-lg font-bold text-[#011023] uppercase">Invoice & Tax Settings</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Invoice Prefix</label>
                                            <input type="text" value={billingSettings.invoicePrefix} onChange={e => handleBillingChange('invoicePrefix', e.target.value)} placeholder="INV-" className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">HSN/SAC Code</label>
                                            <input type="text" maxLength="6" value={billingSettings.invoiceHsnSac} onChange={e => handleBillingChange('invoiceHsnSac', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Company GST Number</label>
                                            <input type="text" maxLength="15" value={billingSettings.companyGst} onChange={e => handleBillingChange('companyGst', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-6">
                                        <label className="text-[14.5px] font-semibold text-gray-700 uppercase">Billing Address</label>
                                        <textarea rows="3" value={billingSettings.billingAddress} onChange={e => handleBillingChange('billingAddress', e.target.value)} className="w-full text-[13px] px-4 py-2.5 mt-1.5 uppercase bg-white border border-blue-100 rounded-xl focus:outline-none text-sm font-medium text-[#011023] custom-scrollbar"></textarea>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Part 5: Maintenance Settings */}
                    {activeTab === 'maintenance' && (
                        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-[#e6f0fa]">
                                <h2 className="text-lg font-bold text-[#011023]">System Maintenance</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage platform availability and updates.</p>
                            </div>
                            <div className="p-6 space-y-6 flex-1">
                                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                    <div>
                                        <h3 className="font-bold text-orange-800 text-sm">Maintenance Mode</h3>
                                        <p className="text-xs text-orange-600 mt-0.5">Disable customer access during system updates.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Maintenance Message</label>
                                    <textarea rows="2" defaultValue="We are currently performing scheduled maintenance. VehicleeCare will be back online shortly." className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 transition-shadow text-sm font-medium text-[#011023] custom-scrollbar"></textarea>
                                </div>

                                <div className="pt-2">
                                    <button className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-white text-[#052558] font-bold rounded-xl shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors">
                                        Clear System Cache
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Part 6: Services Configuration */}
                    {activeTab === 'services' && (
                        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col h-full col-span-1 xl:col-span-2">
                            <div className="pt-6 pl-7 pb-2">
                                <h2 className="text-lg uppercase font-bold text-[#011023]">Service Categories</h2>
                                {/* <p className="text-sm text-gray-500 mt-1">Configure service offerings across different vehicle fuel types.</p> */}
                            </div>
                            <div className="pl-6 pr-6 pt-0.5 flex-1 overflow-hidden flex flex-col">

                                {/* Nested Service Tabs */}
                                <div className="flex gap-2 p-1 bg-blue-50/50 rounded-xl mb-4">
                                    {['PETROL', 'DIESEL', 'EV', 'PREMIUM'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveServiceTab(tab)}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeServiceTab === tab
                                                ? 'bg-white text-[#052558] shadow-sm'
                                                : 'text-gray-500 hover:text-[#052558] hover:bg-white/40'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content Wrapper */}
                                <div className="space-y-8 overflow-y-auto custom-scrollbar" style={{ maxHeight: "calc(100vh - 340px)" }}>

                                    {/* Dynamic Services Tab */}
                                    {(() => {
                                        if (activeServiceTab === 'PREMIUM') return null;

                                        const activeFuelTypeStr = activeServiceTab === 'PETROL' ? 'Petrol' :
                                            activeServiceTab === 'DIESEL' ? 'Diesel' :
                                                activeServiceTab === 'EV' ? 'EV' : '';

                                        const allServices = [...defaultServicesList, ...customServices];
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
                                            // By Category Sequence first
                                            if (catA !== catB) return catA - catB;
                                            // Then maintain relative addition order within the category (implied by array order)
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
                                                    <div key={category} className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-1.5">
                                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">{category}</h3>
                                                        <div className="space-y-0.5 max-h-[140px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                            {items.map(s => (
                                                                <div key={s.id || s.name} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-1.5 last:pb-0">
                                                                    <span className="text-xs uppercase text-gray-700">{s.name}</span>
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input type="checkbox" className="sr-only peer" checked={!disabledServices.includes(s.name)} onChange={() => handleServiceToggle(s.name)} />
                                                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}



                                    {/* Premium */}
                                    {activeServiceTab === 'PREMIUM' && (
                                        <div className="flex flex-col items-center justify-center text-center pb-10 pt-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 min-h-[20rem]">
                                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                                <Car className="text-[#527FB0]" size={32} />
                                            </div>
                                            <h3 className="font-bold text-lg text-[#011023]">Premium Services</h3>
                                            {/* <p className="text-sm text-gray-500 mt-2 max-w-sm">Configuration for white-glove and premium tier services is coming soon.</p> */}
                                        </div>
                                    )}

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
