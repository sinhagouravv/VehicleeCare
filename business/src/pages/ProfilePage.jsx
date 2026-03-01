import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Shield, Crown, Calendar, Clock, Edit3, Save, X, LogOut, Building2, Hash } from 'lucide-react';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('businessToken');
        const storedUser = localStorage.getItem('businessUser');
        if (!token || !storedUser) {
            navigate('/login');
            return;
        }
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setFormData({ name: parsed.name || '', phone: parsed.phone || '', address: parsed.address || '' });
    }, [navigate]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('businessToken');
            const res = await fetch('http://localhost:5001/api/auth/update-profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                const updatedUser = { ...user, ...formData };
                setUser(updatedUser);
                localStorage.setItem('businessUser', JSON.stringify(updatedUser));
                setEditing(false);
            } else {
                alert(data.msg || 'Failed to update profile');
            }
        } catch (err) {
            alert('Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('businessToken');
        localStorage.removeItem('businessUser');
        navigate('/');
    };

    const getPlanDetails = (plan) => {
        switch (plan) {
            case 'Elite': return { color: 'from-amber-400 to-orange-500', badge: 'bg-amber-100 text-amber-700', icon: '👑', price: '₹299/mo' };
            case 'Premium': return { color: 'from-purple-500 to-indigo-600', badge: 'bg-purple-100 text-purple-700', icon: '⚡', price: '₹199/mo' };
            default: return { color: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-700', icon: '🛡️', price: 'Free' };
        }
    };

    if (!user) return null;

    const plan = getPlanDetails(user.subscriptionPlan);
    const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const expiryDate = user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f6ff] via-white to-[#f0f6ff]">
            <div className="max-w-4xl mx-auto px-4 py-12">

                {/* Profile Header Card */}
                <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgba(5,37,88,0.06)] border border-white overflow-hidden mb-6">
                    {/* Gradient Banner */}
                    <div className={`h-32 bg-gradient-to-r ${plan.color} relative`}>
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute top-6 right-6">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${plan.badge} backdrop-blur-sm`}>
                                {plan.icon} {user.subscriptionPlan || 'Basic'} Plan
                            </span>
                        </div>
                    </div>

                    {/* Avatar & Name */}
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12">
                            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-3xl font-black text-[#052558] bg-gradient-to-br from-blue-50 to-blue-100 shrink-0">
                                {(user.name || 'V').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 pt-2 sm:pt-0">
                                <h1 className="text-2xl font-black text-[#011023] uppercase tracking-tight">{user.name}</h1>
                                <p className="text-sm text-gray-500 font-medium mt-0.5">{user.email}</p>
                            </div>
                            <div className="flex gap-2 self-start sm:self-end">
                                {!editing ? (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#052558] hover:bg-blue-100 rounded-xl text-xs font-bold uppercase tracking-wide transition-all"
                                    >
                                        <Edit3 size={14} /> Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50"
                                        >
                                            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => { setEditing(false); setFormData({ name: user.name || '', phone: user.phone || '', address: user.address || '' }); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-xs font-bold uppercase tracking-wide transition-all"
                                        >
                                            <X size={14} /> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                    {/* Personal Info */}
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] border border-white p-6">
                        <h3 className="text-sm font-black text-[#011023] uppercase tracking-wider mb-5 flex items-center gap-2">
                            <User size={16} className="text-[#527FB0]" /> Personal Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><User size={14} /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Full Name</p>
                                    {editing ? (
                                        <input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 w-full text-sm font-semibold text-[#011023] bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#052558]/20"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-[#011023] mt-0.5">{user.name || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><Mail size={14} /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-semibold text-[#011023] mt-0.5">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><Phone size={14} /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                                    {editing ? (
                                        <input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="mt-1 w-full text-sm font-semibold text-[#011023] bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#052558]/20"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-[#011023] mt-0.5">{user.phone || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><MapPin size={14} /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Address</p>
                                    {editing ? (
                                        <input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="mt-1 w-full text-sm font-semibold text-[#011023] bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#052558]/20"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-[#011023] mt-0.5">{user.address || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] border border-white p-6">
                        <h3 className="text-sm font-black text-[#011023] uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Building2 size={16} className="text-[#527FB0]" /> Account Details
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><Hash size={14} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">User ID</p>
                                    <p className="text-sm font-semibold text-[#011023] mt-0.5 font-mono tracking-wide">{user.userId || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><Shield size={14} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Role</p>
                                    <p className="text-sm font-semibold text-[#011023] mt-0.5 capitalize">{user.role || 'Vendor'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><Calendar size={14} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Member Since</p>
                                    <p className="text-sm font-semibold text-[#011023] mt-0.5">{memberSince}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-[#527FB0] mt-0.5"><Clock size={14} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Verification</p>
                                    <p className="text-sm font-semibold mt-0.5">
                                        {user.isVerified ? (
                                            <span className="text-emerald-600">✓ Verified</span>
                                        ) : (
                                            <span className="text-amber-600">⏳ Pending</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] border border-white p-6 mb-6">
                    <h3 className="text-sm font-black text-[#011023] uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Crown size={16} className="text-[#527FB0]" /> Subscription
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl shadow-lg`}>
                                {plan.icon}
                            </div>
                            <div>
                                <p className="text-lg font-black text-[#011023] uppercase">{user.subscriptionPlan || 'Basic'} Plan</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${user.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {user.subscriptionStatus === 'active' ? '● Active' : '○ Inactive'}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{plan.price}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            {user.subscriptionExpiry && (
                                <p className="text-xs text-gray-400 font-medium">
                                    Expires: <span className="font-bold text-gray-600">{expiryDate}</span>
                                </p>
                            )}
                            <button
                                onClick={() => navigate('/#pricing')}
                                className="mt-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-all shadow-md"
                            >
                                {user.subscriptionPlan === 'Basic' ? 'Upgrade Plan' : 'Manage Plan'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="flex justify-end">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-xl text-xs font-bold uppercase tracking-wide transition-all"
                    >
                        <LogOut size={15} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
