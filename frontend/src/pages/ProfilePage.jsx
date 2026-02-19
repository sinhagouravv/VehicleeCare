import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Car, Settings, MapPin, Calendar,
    CreditCard, ChevronLeft, LogOut, Clipboard, Wrench,
    CheckCircle, ArrowRight, ShieldCheck, X, Loader2, Bell
} from 'lucide-react';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);

    // OTP modal state
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');

    // Edit Profile modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { navigate('/login'); return; }
        setUser(JSON.parse(stored));
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchBookings = async () => {
            setLoadingBookings(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5001/api/bookings/my', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBookings(data.bookings || []);
                }
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
            } finally {
                setLoadingBookings(false);
            }
        };
        fetchBookings();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const openEditModal = () => {
        setEditForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
        setEditError('');
        setEditSuccess('');
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        setEditSaving(true);
        setEditError('');
        setEditSuccess('');
        try {
            const res = await fetch('http://localhost:5001/api/auth/update-profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    name: editForm.name,
                    phone: editForm.phone,
                    address: editForm.address,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setEditError(data.msg || 'Update failed'); return; }
            const updated = { ...user, ...data.user };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            setEditSuccess('Profile updated successfully!');
            setTimeout(() => setShowEditModal(false), 1200);
        } catch (err) {
            setEditError('Network error. Please try again.');
        } finally {
            setEditSaving(false);
        }
    };

    // ── OTP handlers ──────────────────────────────────────────
    const handleSendOtp = async () => {
        setOtpSending(true);
        setOtpError('');
        try {
            const res = await fetch('http://localhost:5001/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg);
            setOtpSent(true);
        } catch (err) {
            setOtpError(err.message || 'Failed to send OTP');
        } finally {
            setOtpSending(false);
        }
    };

    const handleOtpChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < 5) {
            document.getElementById(`otp-${idx + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            document.getElementById(`otp-${idx - 1}`)?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const code = otp.join('');
        if (code.length < 6) { setOtpError('Please enter all 6 digits'); return; }
        setOtpVerifying(true);
        setOtpError('');
        try {
            const res = await fetch('http://localhost:5001/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, otp: code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg);
            // Update local user
            const updatedUser = { ...user, isVerified: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setOtpSuccess('Account verified successfully!');
            setTimeout(() => { setShowOtpModal(false); setOtpSuccess(''); }, 1800);
        } catch (err) {
            setOtpError(err.message || 'Verification failed');
        } finally {
            setOtpVerifying(false);
        }
    };

    const openModal = () => {
        setShowOtpModal(true);
        setOtp(['', '', '', '', '', '']);
        setOtpSent(false);
        setOtpError('');
        setOtpSuccess('');
    };

    if (!user) return null;

    const initials = user.name
        ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    const paymentLabel = (m) =>
        m === 'cash' ? 'Cash on Delivery' : m === 'netbanking' ? 'Net Banking' : m;

    return (
        <div className="min-h-screen bg-[#f0f6ff]">

            {/* ── Edit Profile Modal ── */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s_ease-out]">

                        {/* ── Dark header ── */}
                        <div className="relative bg-gradient-to-br from-[#041e49] via-[#052558] to-[#1a4a8a] px-7 pt-5 pb-5">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                            {/* Close */}
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                            >
                                <X size={15} />
                            </button>

                            {/* Avatar + title */}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <span className="text-xl font-black text-white uppercase">
                                        {(editForm.name || user.name || '?')[0]}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-black text-white uppercase tracking-wide">Edit Profile</h3>
                                    <p className="text-[12px] uppercase text-white/50 mt-0.5">Update your personal details</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Form ── */}
                        <div className="px-7 pt-6 pb-7 -mt-4 relative">
                            {/* Lifted card effect */}
                            <div className="space-y-4">

                                {/* Full Name + Phone in same row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Full Name */}
                                    <div className="group">
                                        <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mt-3 mb-2 group-focus-within:text-[#527FB0] transition-colors">Full Name</label>
                                        <div className="flex items-center gap-3 border-2 border-gray-200 group-focus-within:border-[#527FB0] bg-[#f4f9ff] rounded-2xl px-4 py-3.5 transition-all">
                                            <div className="w-6 h-6 rounded-lg bg-[#052558]/15 flex items-center justify-center flex-shrink-0">
                                                <User size={12} className="text-[#052558]" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                // placeholder="Your full name"
                                                className="flex-1 text-sm text-[#011023] font- uppercase placeholder-gray-300 outline-none bg-transparent w-0"
                                            />
                                        </div>
                                    </div>
                                    {/* Phone */}
                                    <div className="group">
                                        <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mt-3 mb-2 group-focus-within:text-[#527FB0] transition-colors">Phone</label>
                                        <div className="flex items-center gap-3 border-2 border-gray-200 group-focus-within:border-[#527FB0] bg-[#f4f9ff] rounded-2xl px-4 py-3.5 transition-all">
                                            <div className="w-6 h-6 rounded-lg bg-[#052558]/15 flex items-center justify-center flex-shrink-0">
                                                <Phone size={12} className="text-[#052558]" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                                // placeholder="+91 XXXXX XXXXX"
                                                className="flex-1 text-sm text-[#011023] font-semibold placeholder-gray-300 outline-none bg-transparent w-0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email (read-only) */}
                                <div>
                                    <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mt-2 mb-2">
                                        Email <span className="text-gray-300 normal-case font-normal tracking-normal">· cannot change</span>
                                    </label>
                                    <div className="flex items-center gap-3 border-2 border-gray-200 bg-gray-50 rounded-2xl px-4 py-3.5 cursor-not-allowed opacity-60">
                                        <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            <Mail size={12} className="text-gray-400" />
                                        </div>
                                        <span className="text-sm text-gray-400 font-semibold truncate">{user.email}</span>
                                    </div>
                                </div>



                                {/* Address */}
                                <div className="group">
                                    <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mt-2 mb-2 group-focus-within:text-[#527FB0] transition-colors">Address</label>
                                    <div className="flex items-start gap-3 border-2 border-gray-200 group-focus-within:border-[#527FB0] bg-[#f4f9ff] rounded-2xl px-4 py-3.5 transition-all">
                                        <div className="w-6 h-6 rounded-lg bg-[#052558]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin size={12} className="text-[#052558]" />
                                        </div>
                                        <textarea
                                            rows={1}
                                            value={editForm.address}
                                            onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                                            className="flex-1 text-sm text-[#011023] font- uppercase placeholder-gray-300 outline-none bg-transparent resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Feedback */}
                            {editError && (
                                <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                                    <X size={13} className="text-red-400 flex-shrink-0" />
                                    <p className="text-xs text-red-500 font-medium">{editError}</p>
                                </div>
                            )}
                            {editSuccess && (
                                <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                                    <p className="text-xs text-green-600 font-medium">{editSuccess}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-xs font-bold text-gray-400 hover:bg-gray-50 hover:border-gray-200 transition-all uppercase tracking-wide"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={editSaving}
                                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#052558] to-[#1a4a8a] text-white text-xs font-black uppercase tracking-wide hover:from-[#041e49] hover:to-[#052558] transition-all disabled:opacity-60 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                >
                                    {editSaving
                                        ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                                        : <><CheckCircle size={13} /> Save Changes</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── OTP Verification Modal ── */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 relative animate-[fadeIn_0.2s_ease-out]">
                        {/* Close */}
                        <button
                            onClick={() => setShowOtpModal(false)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-5">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                                <ShieldCheck size={24} className="text-[#052558]" />
                            </div>
                            <h3 className="text-base font-black text-[#011023] uppercase">Verify Account</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {otpSent
                                    ? <>OTP sent to <strong className="text-[#527FB0]">{user.email}</strong></>
                                    : 'We\'ll send a 6-digit OTP to your email address'
                                }
                            </p>
                        </div>

                        {otpSuccess ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <CheckCircle size={40} className="text-green-500" />
                                <p className="text-sm font-bold text-green-600">{otpSuccess}</p>
                            </div>
                        ) : !otpSent ? (
                            <button
                                onClick={handleSendOtp}
                                disabled={otpSending}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-[#052558] text-white text-xs font-black uppercase rounded-xl hover:bg-[#052558]/90 transition-colors disabled:opacity-60"
                            >
                                {otpSending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                                {otpSending ? 'Sending…' : 'Send OTP'}
                            </button>
                        ) : (
                            <>
                                {/* 6-digit OTP boxes */}
                                <div className="flex gap-2 justify-center mb-5">
                                    {otp.map((d, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={d}
                                            onChange={e => handleOtpChange(e.target.value, i)}
                                            onKeyDown={e => handleOtpKeyDown(e, i)}
                                            className="w-10 h-12 text-center text-lg font-black text-[#011023] border-2 border-blue-100 rounded-xl focus:border-[#527FB0] focus:outline-none transition-colors"
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={otpVerifying}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#052558] text-white text-xs font-black uppercase rounded-xl hover:bg-[#052558]/90 transition-colors disabled:opacity-60"
                                >
                                    {otpVerifying ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                    {otpVerifying ? 'Verifying…' : 'Verify OTP'}
                                </button>

                                <button
                                    onClick={handleSendOtp}
                                    disabled={otpSending}
                                    className="w-full mt-2 text-xs text-[#527FB0] hover:text-[#052558] transition-colors py-1"
                                >
                                    {otpSending ? 'Resending…' : 'Resend OTP'}
                                </button>
                            </>
                        )}

                        {otpError && (
                            <p className="mt-3 text-xs text-red-500 text-center font-medium">{otpError}</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Hero Header ── */}
            <div className="bg-gradient-to-br from-[#011023] via-[#052558] to-[#1a4a8a] pt-8 pb-24 px-4 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

                <div className="max-w-6xl mx-auto relative">
                    <div className="flex flex-col max-w-5xl ml-3.5 sm:flex-row items-center sm:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {/* <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C2E8FF] via-[#527FB0] to-[#052558] blur-md opacity-60 scale-110" /> */}
                            {/* Border ring */}
                            <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-[#C2E8FF] to-[#052558] shadow-2xl">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a4a8a] to-[#052558] flex items-center justify-center">
                                    <span className="text-3xl font-black text-white tracking-tight select-none">{initials}</span>
                                </div>
                            </div>
                            {/* Verified badge — only shown if verified */}
                            {user.isVerified && (
                                <div className="absolute bottom-0.5 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#052558]">
                                    <CheckCircle size={14} className="text-[#052558] fill-[#C2E8FF]" />
                                </div>
                            )}
                        </div>

                        {/* Name + info */}
                        <div className="flex-1 text-center sm:text-left mb-4.5">
                            {/* Name row + role + verify */}
                            <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                                <h1 className="text-3xl font-black text-white uppercase tracking-tight">{user.name}</h1>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/70">
                                    {user.role || 'Customer'}
                                </span>
                                {/* Verify Now button — only if not verified */}
                                {!user.isVerified && (
                                    <button
                                        onClick={openModal}
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 hover:bg-amber-400/30 transition-colors"
                                    >
                                        <ShieldCheck size={11} /> Verify Now
                                    </button>
                                )}
                                {/* {user.isVerified && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-400">
                                        <CheckCircle size={11} /> Verified
                                    </span>
                                )} */}
                            </div>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
                                {user.email && (
                                    <span className="flex items-center gap-1.5 text-white/60 text-xs">
                                        <Mail size={11} /> {user.email}
                                    </span>
                                )}
                                {user.phone && (
                                    <span className="flex items-center gap-1.5 text-white/60 text-xs">
                                        <Phone size={11} /> {user.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Edit Profile, Settings and Logout */}
                        <div className="flex flex-wrap items-center gap-2.5 mb-6 -mr-24.5">
                            <button onClick={openEditModal} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-all">
                                <User size={13} /> Edit Profile
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-all">
                                <Settings size={13} /> Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-all"
                            >
                                <LogOut size={13} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="max-w-6xl mx-auto px-4 -mt-15 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Bookings', value: loadingBookings ? '—' : bookings.length, icon: <Clipboard size={16} /> },
                        { label: 'Vehicles', value: loadingBookings ? '—' : new Set(bookings.map(b => `${b.vehicle?.make} ${b.vehicle?.model}`)).size || 0, icon: <Car size={16} /> },
                        { label: 'Services', value: loadingBookings ? '—' : new Set(bookings.map(b => b.service?.title)).size || 0, icon: <Wrench size={16} /> },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-white p-4 flex flex-col items-center gap-1 text-center">
                            <div className="text-[#527FB0]">{stat.icon}</div>
                            <p className="text-2xl font-black text-[#011023]">{stat.value}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="max-w-6xl mx-auto px-4 py-5 space-y-8">

                {/* Account Details */}
                <section>
                    <h2 className="text-[11px] text-[#052558] font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={11} /> Account Details
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                        {[
                            { label: 'Full Name', value: user.name, icon: <User size={14} className="text-[#527FB0]" /> },
                            { label: 'Email Address', value: user.email || '—', icon: <Mail size={14} className="text-[#527FB0]" /> },
                            { label: 'Phone Number', value: user.phone || '—', icon: <Phone size={14} className="text-[#527FB0]" /> },
                        ].map(row => (
                            <div key={row.label} className="flex items-center gap-3 px-5 py-5">
                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {row.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{row.label}</p>
                                    <p className="text-sm font-bold text-[#011023] uppercase truncate">{row.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Service History + Payment History (left) | Notifications (right) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

                    {/* Left column: Service History + Payment History */}
                    <div className="flex flex-col gap-4">

                        {/* Service History */}
                        <section>
                            <div className="flex items-center justify-between -mt-3 mb-4">
                                <h2 className="text-[11px] text-[#052558] font-semibold uppercase tracking-widest flex items-center gap-2">
                                    <Clipboard size={12} /> Service History
                                </h2>
                                {!loadingBookings && bookings.length > 0 && (
                                    <span className="text-[10px] bg-[#052558] text-white px-2.5 py-0.5 rounded-full font-bold">
                                        {bookings.length} total
                                    </span>
                                )}
                            </div>

                            <div className="h-[275px] overflow-y-auto rounded-2xl border border-[#C2E8FF] shadow-sm bg-white">
                                {loadingBookings ? (
                                    <div className="h-full bg-white rounded-2xl border border-gray-100 p-16 flex items-center justify-center">
                                        <div className="w-7 h-7 border-[3px] border-[#527FB0] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="h-full bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                                            <Car size={28} className="text-[#527FB0]" />
                                        </div>
                                        <p className="text-sm font-bold text-[#011023] uppercase">No bookings yet</p>
                                        <p className="text-xs text-gray-400 mt-1 mb-5">Book a service to see it here</p>
                                        <button
                                            onClick={() => navigate('/book-service')}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-[#052558] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#052558]/90 transition-colors shadow-lg shadow-blue-900/20"
                                        >
                                            Book a Service <ArrowRight size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {bookings.map((b, i) => (
                                            <div key={b._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                {/* Card header strip */}
                                                <div className="bg-gradient-to-r from-[#052558] to-[#527FB0] px-5 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Car size={14} className="text-white/70" />
                                                        <p className="text-white font-black text-xs uppercase tracking-wide">
                                                            {b.vehicle?.make} {b.vehicle?.model} {b.vehicle?.year && `· ${b.vehicle.year}`}
                                                        </p>
                                                    </div>
                                                    {b.createdAt && (
                                                        <span className="text-white/50 text-[10px] font-medium">
                                                            {new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Card body */}
                                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {b.service?.title && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                <Settings size={13} className="text-[#527FB0]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Service</p>
                                                                <p className="text-xs font-bold text-[#011023] uppercase mt-0.5">{b.service.title}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {b.garage?.name && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                <MapPin size={13} className="text-[#527FB0]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Service Center</p>
                                                                <p className="text-xs font-bold text-[#011023] uppercase mt-0.5">{b.garage.name}</p>
                                                                {b.garage.district && <p className="text-[10px] text-gray-400 uppercase">{b.garage.district}{b.garage.state && `, ${b.garage.state}`}</p>}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(b.schedule?.dateDisplay || b.schedule?.date) && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                <Calendar size={13} className="text-[#527FB0]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Scheduled</p>
                                                                <p className="text-xs font-bold text-[#011023] uppercase mt-0.5">
                                                                    {b.schedule.dateDisplay || b.schedule.date}
                                                                </p>
                                                                {b.schedule.time && <p className="text-[10px] text-gray-400">{b.schedule.time}</p>}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {b.paymentMethod && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                <CreditCard size={13} className="text-[#527FB0]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Payment</p>
                                                                <p className="text-xs font-bold text-[#011023] uppercase mt-0.5">{paymentLabel(b.paymentMethod)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Pickup badge */}
                                                {b.garage?.pickupDrop && (
                                                    <div className="px-5 pb-4">
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[#527FB0] bg-blue-50 px-2.5 py-1 rounded-full">
                                                            <CheckCircle size={9} /> Pickup & Drop: {b.garage.pickupDrop}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Payment History */}
                        <section>
                            <h2 className="text-[11px] text-[#052558] uppercase tracking-widest mb-4 font-semibold flex items-center gap-2">
                                <CreditCard size={12} /> Payment History
                            </h2>
                            <div className="h-[275px] overflow-y-auto  rounded-2xl border border-[#C2E8FF] shadow-sm bg-white">
                                {loadingBookings ? (
                                    <div className="h-full bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center">
                                        <div className="w-6 h-6 border-[3px] border-[#527FB0] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : bookings.filter(b => b.paymentMethod).length === 0 ? (
                                    <div className="h-full bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                                            <CreditCard size={20} className="text-[#527FB0]" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">No payments yet</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {bookings.filter(b => b.paymentMethod).slice(0, 4).map((b, i) => (
                                            <div key={b._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-4">
                                                <div className="w-9 h-9 bg-gradient-to-br from-[#052558] to-[#527FB0] rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <CreditCard size={14} className="text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-[#011023] uppercase truncate">
                                                        {b.service?.title || 'Service Booking'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {paymentLabel(b.paymentMethod)}{b.garage?.name && ` · ${b.garage.name}`}
                                                    </p>
                                                </div>
                                                {b.createdAt && (
                                                    <span className="text-[9px] text-gray-300 font-semibold uppercase flex-shrink-0">
                                                        {new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>{/* end left column */}

                    {/* Right column – Notifications */}
                    <section>
                        <h2 className="text-[11px] text-[#052558] uppercase tracking-widest -mt-3 font-semibold mb-4 flex items-center gap-2">
                            <Bell size={12} /> Notifications
                        </h2>
                        <div className="h-[597px] overflow-y-auto bg-white rounded-2xl border border-[#C2E8FF] shadow-sm divide-y divide-gray-50">
                            {[
                                {
                                    icon: <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0"><User size={14} className="text-[#527FB0]" /></div>,
                                    title: 'Welcome to VehicleeCare!',
                                    body: 'Your account has been created successfully.',
                                    time: user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : 'Recently',
                                    unread: false
                                },
                                ...(!user.isVerified ? [{
                                    icon: <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0"><Bell size={14} className="text-amber-400" /></div>,
                                    title: 'Verify your account',
                                    body: 'Click "Verify Now" to confirm your email address.',
                                    time: 'Action needed',
                                    unread: true
                                }] : [{
                                    icon: <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle size={14} className="text-green-500" /></div>,
                                    title: 'Account Verified',
                                    body: 'Your email has been verified successfully.',
                                    time: 'Completed',
                                    unread: false
                                }]),
                                ...(bookings.length > 0 ? [{
                                    icon: <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0"><Car size={14} className="text-[#527FB0]" /></div>,
                                    title: 'Booking Confirmed',
                                    body: `Your ${bookings[bookings.length - 1]?.service?.title || 'service'} booking is confirmed.`,
                                    time: bookings[bookings.length - 1]?.createdAt
                                        ? new Date(bookings[bookings.length - 1].createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                        : '',
                                    unread: false
                                }] : []),
                            ].map((n, i) => (
                                <div key={i} className={`flex items-start gap-3 px-4 py-4 ${n.unread ? 'bg-blue-50/60' : ''}`}>
                                    {n.icon}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-black text-[#011023] uppercase">{n.title}</p>
                                            {n.unread && <span className="w-1.5 h-1.5 bg-[#527FB0] rounded-full flex-shrink-0" />}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
                                        <p className="text-[9px] text-gray-300 font-semibold uppercase mt-1">{n.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>{/* end outer 2-col grid */}

                {/* Book another CTA */}

                {!loadingBookings && bookings.length > 0 && (
                    <div className="bg-gradient-to-r from-[#052558] to-[#1a4a8a] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-900/20">
                        <div>
                            <p className="text-white font-black uppercase text-sm">Ready for your next service?</p>
                            <p className="text-white/50 text-xs mt-0.5">Book another appointment in minutes</p>
                        </div>
                        <button
                            onClick={() => navigate('/book-service')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#052558] text-xs font-black uppercase rounded-xl hover:bg-blue-50 transition-colors flex-shrink-0"
                        >
                            Book Now <ArrowRight size={13} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
