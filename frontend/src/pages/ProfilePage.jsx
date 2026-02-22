import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Car, Settings, MapPin, Calendar,
    CreditCard, ChevronLeft, LogOut, Clipboard, Wrench,
    CheckCircle, ArrowRight, ShieldCheck, X, Loader2, Bell, Eye, EyeOff, ArrowLeft, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


const paymentLabel = (method) => {
    switch (method) {
        case 'Card': return 'Credit/Debit Card';
        case 'UPI': return 'UPI Payment';
        case 'Net Banking': return 'Net Banking';
        case 'Cash': return 'Cash on Delivery';
        default: return method;
    }
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

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

    // Settings modal state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState({});
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');
    const [notifPrefs, setNotifPrefs] = useState({ email: user?.emailNotifications ?? true, sms: false, service: false });
    // Settings OTP step: 'change-password' | 'delete-account' | ''
    const [sOtpAction, setSotpAction] = useState('');
    const [sOtp, setSotp] = useState(new Array(6).fill(''));
    const [sOtpSending, setSotpSending] = useState(false);
    const [sOtpVerifying, setSotpVerifying] = useState(false);
    const [sOtpError, setSotpError] = useState('');

    // Email Reminder Popup State
    const [showEmailReminder, setShowEmailReminder] = useState(false);

    // Global toast notification
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const showToast = (msg, type = 'success') => {
        setToast({ visible: true, message: msg, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500);
    };

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { navigate('/login'); return; }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);

        // Fetch fresh user data from DB (to pull userId and latest fields)
        const mongoId = parsedUser.id || parsedUser._id;
        if (mongoId) {
            fetch('http://localhost:5001/api/auth/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mongoId })
            })
                .then(r => r.json())
                .then(freshUser => {
                    if (freshUser && freshUser.id) {
                        const merged = { ...parsedUser, ...freshUser };
                        localStorage.setItem('user', JSON.stringify(merged));
                        setUser(merged);
                    }
                })
                .catch(() => { }); // silently fail — localStorage data already loaded
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            setLoadingBookings(true);
            setLoadingPayments(true);
            setLoadingNotifications(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const userId = user.id || user._id;

                // Parallel fetch
                const [resB, resP, resN] = await Promise.all([
                    fetch(`http://localhost:5001/api/bookings/user/${userId}`, { headers }),
                    fetch(`http://localhost:5001/api/payments/user/${userId}`, { headers }),
                    fetch(`http://localhost:5001/api/notifications/user/${userId}`, { headers })
                ]);

                if (resB.ok) {
                    const dataB = await resB.json();
                    setBookings(dataB.data || []);
                }
                if (resP.ok) {
                    const dataP = await resP.json();
                    setPayments(dataP.data || []);
                }
                if (resN.ok) {
                    const dataN = await resN.json();
                    setNotifications(dataN.data || []);
                }

            } catch (err) {
                console.error('Failed to fetch history:', err);
                // Optionally showToast('Failed to load history', 'error');
            } finally {
                setLoadingBookings(false);
                setLoadingPayments(false);
                setLoadingNotifications(false);
            }
        };
        fetchHistory();
    }, [user]);

    useEffect(() => {
        let interval;
        if (user && !notifPrefs.email) {
            interval = setInterval(() => {
                setShowEmailReminder(true);
                setTimeout(() => setShowEmailReminder(false), 5000);
            }, 15000);
        }
        return () => clearInterval(interval);
    }, [user, notifPrefs.email]);

    useEffect(() => {
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
            // Also ensure we reset to auto/unset
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

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
            showToast('Profile updated successfully!');
            setTimeout(() => setShowEditModal(false), 800);
        } catch (err) {
            setEditError('Network error. Please try again.');
        } finally {
            setEditSaving(false);
        }
    };

    const handleSendSettingsOtp = async (action) => {
        if (action === 'change-password') {
            if (!pwForm.current) { showToast('Current password is required.', 'error'); return; }
            if (pwForm.next.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
            if (pwForm.next !== pwForm.confirm) { showToast('Passwords do not match.', 'error'); return; }
        }
        setSotpSending(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/send-settings-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id || user._id, purpose: action, currentPassword: pwForm.current }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.msg || 'Failed to send OTP', 'error'); return; }
            setSotp(new Array(6).fill(''));
            setSotpAction(action);
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setSotpSending(false);
        }
    };

    const handleVerifyPwOtp = async () => {
        setSotpVerifying(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/change-password-otp', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id || user._id, otp: sOtp.join(''), newPassword: pwForm.next }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.msg || 'Invalid OTP', 'error'); return; }
            setPwForm({ current: '', next: '', confirm: '' });
            setSotp(new Array(6).fill('')); setSotpAction('');
            setShowSettingsModal(false);
            showToast('Password changed successfully!');
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setSotpVerifying(false);
        }
    };

    const handleVerifyDeleteOtp = async () => {
        setSotpVerifying(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id || user._id, otp: sOtp.join('') }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.msg || 'Invalid OTP', 'error'); return; }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setSotpVerifying(false);
        }
    };

    const handleSotpChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...sOtp];
        next[idx] = val;
        setSotp(next);
        if (val && idx < 5) document.getElementById(`sotp-${idx + 1}`)?.focus();
    };

    const handleSotpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !sOtp[idx] && idx > 0) {
            document.getElementById(`sotp-${idx - 1}`)?.focus();
        }
    };

    const handleNotifToggle = async (key) => {
        const newVal = !notifPrefs[key];
        setNotifPrefs(p => ({ ...p, [key]: newVal }));

        // If it's email, sync with backend
        if (key === 'email') {
            try {
                const res = await fetch('http://localhost:5001/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id || user._id, emailNotifications: newVal })
                });
                const data = await res.json();
                if (res.ok) {
                    const updatedUser = { ...user, emailNotifications: newVal };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                    showToast(`Email notifications ${newVal ? 'enabled' : 'disabled'}`);
                }
            } catch (error) {
                console.error('Failed to update preference');
            }
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    const handleDownloadInvoice = (booking) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            // Header
            doc.setFontSize(22);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare Invoice", 105, 20, null, null, "center");

            // Info Details
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Booking ID: ${booking.bookingId || booking._id}`, 14, 40);

            const bookingDate = new Date(booking.createdAt).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
            doc.text(`Booking Date: ${bookingDate}`, 14, 47);
            doc.text(`Scheduled Slot: ${booking.schedule?.date || 'N/A'} at ${booking.schedule?.time || ''}`, 14, 54);
            doc.text(`Status: ${booking.status || 'Pending'}`, 14, 61);

            // Customer Details
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Customer Details", 14, 76);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);

            const cName = booking.user?.name || user?.name || 'N/A';
            const cPhone = booking.user?.phone || user?.phone || 'N/A';
            doc.text(`Name: ${cName}`, 14, 84);
            doc.text(`Phone: ${cPhone}`, 14, 91);

            // Vehicle Details
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("Vehicle Details", 14, 106);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Make: ${booking.vehicle?.make || 'N/A'}`, 14, 114);
            doc.text(`Model: ${booking.vehicle?.model || 'N/A'}`, 14, 121);
            doc.text(`Year: ${booking.vehicle?.year || 'N/A'}`, 14, 128);

            // Cost calculation
            const totalAmountStr = booking.payment?.amount || booking.service?.price || '0';
            const totalAmount = parseFloat(totalAmountStr) || 0;
            const basePrice = (totalAmount / 1.18).toFixed(2);
            const gstAmount = (totalAmount - basePrice).toFixed(2);

            const tableBody = [
                [booking.service?.title || 'General Service', `Rs. ${basePrice}`]
            ];

            autoTable(doc, {
                startY: 140,
                head: [['Service Description', 'Amount']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
                styles: { fontSize: 11, cellPadding: 6 }
            });

            // Breakdown Summary
            const finalY = doc.lastAutoTable?.finalY || 140;
            const rightRightX = 195;

            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Subtotal: Rs. ${basePrice}`, rightRightX, finalY + 15, { align: 'right' });
            doc.text(`GST (18%): Rs. ${gstAmount}`, rightRightX, finalY + 22, { align: 'right' });
            doc.text(`Platform Fee: Rs. 0.00`, rightRightX, finalY + 29, { align: 'right' });

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, rightRightX, finalY + 41, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("Thank you for using VehicleeCare.", 105, finalY + 60, null, null, "center");

            doc.save(`Invoice_${booking.bookingId || booking._id}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Error downloading invoice. Please try again.");
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-[#FDFDFD] relative">

            {/* ── Global Toast ── */}
            <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl ${toast.type === 'error' ? 'bg-red-500 shadow-red-200' : 'bg-[#052558] shadow-blue-900/30'}`}>
                    {toast.type === 'error'
                        ? <X size={15} className="text-white flex-shrink-0" />
                        : <CheckCircle size={15} className="text-[#7dd3fc] flex-shrink-0" />}
                    {toast.message}
                </div>
            </div>

            {/* ── Settings Modal ── */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">

                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-[#041e49] via-[#052558] to-[#1a4a8a] px-7 pt-5 pb-5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                            <button onClick={() => { setShowSettingsModal(false); setSotpAction(''); setPwError(''); setSotpError(''); }} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                <X size={15} />
                            </button>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Settings size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-black text-white uppercase tracking-wide">Settings</h3>
                                    <p className="text-[12px] uppercase text-white/50 mt-0.5">Manage your account preferences</p>
                                </div>
                            </div>
                        </div>

                        {/* Body — 2-column */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

                            {/* ── LEFT: Change Password ── */}
                            <div className="pl-5.5 pr-1 pt-6 pb-6 space-y-3">
                                <p className="text-[12px] text-[#052558] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldCheck size={11} /> Change Password
                                </p>
                                {[
                                    { label: 'Current Password', key: 'current' },
                                    { label: 'New Password', key: 'next' },
                                    { label: 'Confirm New Password', key: 'confirm' },
                                ].map(f => (
                                    <div key={f.key} className="group">
                                        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-1.5 group-focus-within:text-[#527FB0] transition-colors">{f.label}</label>
                                        <div className="flex items-center gap-3 border-2 border-gray-200 group-focus-within:border-[#527FB0] bg-[#f4f9ff] rounded-2xl px-4 py-3 transition-all">
                                            <div className="w-6 h-6 rounded-lg bg-[#052558]/15 flex items-center justify-center flex-shrink-0">
                                                <ShieldCheck size={12} className="text-[#052558]" />
                                            </div>
                                            <input
                                                type={showPasswords[f.key] ? 'text' : 'password'}
                                                value={pwForm[f.key]}
                                                onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                className="flex-1 text-sm text-[#011023] font-semibold placeholder-gray-300 outline-none bg-transparent"
                                            />
                                            <button
                                                onClick={() => setShowPasswords(p => ({ ...p, [f.key]: !p[f.key] }))}
                                                className="text-gray-400 hover:text-[#052558] transition-colors"
                                            >
                                                {showPasswords[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => handleSendSettingsOtp('change-password')}
                                    disabled={sOtpSending && sOtpAction === 'change-password'}
                                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#052558] to-[#1a4a8a] text-white text-xs mt-4 font-black uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                >
                                    {sOtpSending && sOtpAction === 'change-password'
                                        ? <><Loader2 size={13} className="animate-spin" /> Sending OTP…</>
                                        : <><ShieldCheck size={13} /> Update Password</>}
                                </button>
                            </div>

                            {/* ── RIGHT: Notifications + Danger Zone ── */}
                            <div className="px-4 pt-6 pb-7 space-y-5">
                                {/* Notification Preferences */}
                                <div>
                                    <p className="text-[12px] text-[#052558] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Bell size={11} /> Notifications
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'email', label: 'Email Notifications', sub: 'Booking confirmations, updates' },
                                            { key: 'sms', label: 'SMS Notifications', sub: 'OTP & reminders via text', beta: true },
                                            { key: 'service', label: 'Service Reminders', sub: 'Upcoming service alerts', beta: true },
                                        ].map(({ key, label, sub, beta }) => (
                                            <div key={key} className={`flex items-center justify-between border-2 rounded-2xl px-3.5 py-2.5 ${beta ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-[#f4f9ff] border-gray-100'}`}>
                                                <div>
                                                    <p className="text-sm font-bold text-[#011023] flex items-center gap-2">
                                                        {label}
                                                        {beta && <span className="bg-[#052558]/10 text-[#052558] text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">BETA</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                                                </div>
                                                <button
                                                    disabled={beta}
                                                    onClick={() => !beta && handleNotifToggle(key)}
                                                    className={`w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 relative ${notifPrefs[key] ? 'bg-[#052558]' : 'bg-gray-200'} ${beta ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${notifPrefs[key] ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Danger Zone */}
                                <div>
                                    <p className="text-[12px] text-red-400 font-black uppercase tracking-widest -mt-5.5 mb-3">Danger Zone</p>
                                    <button
                                        onClick={() => handleSendSettingsOtp('delete-account')}
                                        disabled={sOtpSending && sOtpAction === 'delete-account'}
                                        className="w-full py-3 rounded-2xl border-2 border-red-100 text-xs font-bold text-red-400 hover:bg-red-50 hover:border-red-200 transition-all uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {sOtpSending && sOtpAction === 'delete-account'
                                            ? <><Loader2 size={13} className="animate-spin text-red-400" /> Sending OTP…</>
                                            : 'Delete Account'}
                                    </button>
                                    {/* <p className="text-[10px] text-gray-400 text-center mt-2">An OTP will be sent to your email to confirm.</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── OTP Verification Popup ── */}
            {sOtpAction && (
                <div
                    onClick={() => { setSotpAction(''); setSotp(new Array(6).fill('')); }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 relative animate-[fadeIn_0.2s_ease-out]"
                    >
                        {/* Close */}
                        <button
                            onClick={() => { setSotpAction(''); setSotp(new Array(6).fill('')); }}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                        >
                            <X size={15} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-5">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                                {sOtpAction === 'delete-account'
                                    ? <ShieldCheck size={24} className="text-red-500" />
                                    : <ShieldCheck size={24} className="text-[#052558]" />}
                            </div>
                            <h3 className="text-base font-black text-[#011023] uppercase">
                                {sOtpAction === 'delete-account' ? 'Delete Account' : 'Verify Action'}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Enter the 6-digit code sent to <strong className="text-[#527FB0]">{user.email}</strong>
                            </p>
                        </div>

                        {/* 6-digit OTP boxes */}
                        <div className="flex gap-2 justify-center mb-6">
                            {sOtp.map((d, i) => (
                                <input
                                    key={i}
                                    id={`sotp-${i}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={e => handleSotpChange(e.target.value, i)}
                                    onKeyDown={e => handleSotpKeyDown(e, i)}
                                    className={`w-10 h-12 text-center text-lg font-black text-[#011023] border-2 rounded-xl focus:outline-none transition-colors ${sOtpAction === 'delete-account' ? 'border-red-100 focus:border-red-400' : 'border-blue-100 focus:border-[#527FB0]'}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={sOtpAction === 'change-password' ? handleVerifyPwOtp : handleVerifyDeleteOtp}
                            disabled={sOtp.join('').length < 6 || sOtpVerifying}
                            className={`w-full flex items-center justify-center gap-2 py-3 text-white text-xs font-black uppercase rounded-xl transition-all disabled:opacity-60 ${sOtpAction === 'delete-account' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#052558] hover:bg-[#052558]/90'}`}
                        >
                            {sOtpVerifying
                                ? <Loader2 size={15} className="animate-spin" />
                                : <CheckCircle size={15} />}
                            {sOtpVerifying ? 'Verifying…' : 'Confirm'}
                        </button>

                        <button
                            onClick={() => { setSotpAction(''); setSotp(new Array(6).fill('')); }}
                            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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
                                            onInput={e => {
                                                e.target.style.height = 'auto';
                                                const lineHeight = 24;
                                                const maxH = lineHeight * 2;
                                                e.target.style.height = Math.min(e.target.scrollHeight, maxH) + 'px';
                                            }}
                                            className="flex-1 text-sm text-[#011023] font- uppercase placeholder-gray-300 outline-none bg-transparent resize-none leading-relaxed overflow-hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Error feedback */}
                            {editError && (
                                <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                                    <X size={13} className="text-red-400 flex-shrink-0" />
                                    <p className="text-xs text-red-500 font-medium">{editError}</p>
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
                    {/* Back to Home Arrow */}
                    <button
                        onClick={() => navigate('/')}
                        className="absolute top-9.5 -left-20 text-white/50 hover:text-white transition-colors"
                        title="Back to Home"
                    >
                        <ArrowLeft size={20} />
                    </button>

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
                            {/* Name row + verify */}
                            <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                                <h1 className="text-3xl font-black text-white uppercase tracking-tight">{user.name}</h1>
                                {/* Verify Now button — only if not verified */}
                                {!user.isVerified && (
                                    <button
                                        onClick={openModal}
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 hover:bg-amber-400/30 transition-colors"
                                    >
                                        <ShieldCheck size={11} /> Verify Now
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
                                {(user.userId || user.id) && (
                                    <span className="flex items-center gap-1.5 text-white/60 text-xs font-bold tracking-widest">
                                        <User size={11} /> {user.userId || user.id}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Edit Profile, Settings and Logout */}
                        <div className="flex flex-wrap items-center gap-2.5 mb-7 -mr-24.5">
                            <button onClick={openEditModal} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-all">
                                <User size={13} /> Edit Profile
                            </button>
                            <div className="relative">
                                {showEmailReminder && (
                                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-70 bg-[#052558] text-white text-[10px] font-bold text-center py-2 px-3 rounded-xl shadow-xl z-50 animate-[fadeIn_0.3s_ease-out] after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-b-[#052558]">
                                        Turn on Email Notification to get upgrades
                                    </div>
                                )}
                                <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-all">
                                    <Settings size={13} /> Settings
                                </button>
                            </div>
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-wrap">
                        {[
                            { label: 'Full Name', value: user.name, icon: <User size={14} className="text-[#527FB0]" />, width: 'lg:w-[19%]' },
                            { label: 'Email Address', value: user.email || '—', icon: <Mail size={14} className="text-[#527FB0]" />, width: 'lg:w-[29%]' },
                            { label: 'Phone Number', value: user.phone || '—', icon: <Phone size={14} className="text-[#527FB0]" />, width: 'lg:w-[18%]' },
                            { label: 'Address', value: user.address || '—', icon: <MapPin size={14} className="text-[#527FB0]" />, width: 'lg:w-[34%]' },
                        ].map((row, i) => (
                            <div
                                key={row.label}
                                className={`
                                    flex items-center gap-3 px-5 py-5 w-full sm:w-1/2 ${row.width} border-gray-100
                                    ${i < 3 ? 'border-b' : ''} 
                                    ${i < 2 ? 'sm:border-b' : 'sm:border-b-0'}
                                    ${i % 2 === 0 ? 'sm:border-r' : 'sm:border-r-0'}
                                    lg:border-b-0 
                                    ${i < 3 ? 'lg:border-r' : 'lg:border-r-0'}
                                `}
                            >
                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {row.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{row.label}</p>
                                    <p className="text-sm font-bold text-[#011023] uppercase truncate" title={row.value}>{row.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Service History + Payment History (left) | Notifications (right) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

                    {/* Left column: Service History + Payment History */}
                    <div className="flex flex-col gap-4">

                        {/* Booking History */}
                        <section>
                            <div className="flex items-center justify-between -mt-3 mb-4">
                                <h2 className="text-[11px] text-[#052558] font-semibold uppercase tracking-widest flex items-center gap-2">
                                    <Clipboard size={12} /> Booking History
                                </h2>
                                {!loadingBookings && bookings.length > 0 && (
                                    <span className="text-[10px] bg-[#052558] text-white px-2.5 py-0.5 rounded-full font-bold">
                                        {bookings.length} total
                                    </span>
                                )}
                            </div>

                            <div className="h-[275px] overflow-hidden rounded-2xl border border-[#C2E8FF] shadow-sm bg-white">
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
                                                            {b.bookingId && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[9px] text-[#C2E8FF] tracking-widest">{b.bookingId}</span>}
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

                                                {/* Status & Actions Footer */}
                                                <div className="bg-gray-50 border-t border-gray-100 flex items-center justify-between px-5 py-3">
                                                    <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${getStatusColor(b.status)}`}>
                                                        {b.status || 'Pending'}
                                                    </span>
                                                    <button onClick={() => handleDownloadInvoice(b)} className="text-[#052558] font-black text-[10px] uppercase tracking-widest hover:text-[#527FB0] transition-colors flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg active:scale-95">
                                                        <Download size={13} /> Invoice
                                                    </button>
                                                </div>
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
                            <div className="h-[275px] overflow-hidden  rounded-2xl border border-[#C2E8FF] shadow-sm bg-white">
                                {loadingPayments ? (
                                    <div className="h-full bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center">
                                        <div className="w-6 h-6 border-[3px] border-[#527FB0] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : payments.length === 0 ? (
                                    <div className="h-full bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                                            <CreditCard size={20} className="text-[#527FB0]" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">No payments yet</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 p-4">
                                        {payments.map((p, i) => (
                                            <div key={p._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                                                <div className="w-9 h-9 bg-gradient-to-br from-[#052558] to-[#527FB0] rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <CreditCard size={14} className="text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-[#011023] uppercase truncate">
                                                        {p.booking?.service?.title || 'Service Payment'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                                        {p.method} • <span className={`${p.status === 'Completed' ? 'text-green-600' : 'text-amber-500'}`}>{p.status}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[#011023]">₹{p.amount}</p>
                                                    <p className="text-[9px] text-gray-400 mt-0.5 font-bold uppercase">
                                                        {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
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
                        <div className="h-[597px] overflow-hidden bg-white rounded-2xl border border-[#C2E8FF] shadow-sm divide-y divide-gray-50">
                            {loadingNotifications ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-7 h-7 border-[3px] border-[#527FB0] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Bell size={28} className="text-[#527FB0]" />
                                    </div>
                                    <p className="text-sm font-bold text-[#011023] uppercase">No Notifications</p>
                                    <p className="text-xs text-gray-400 mt-1">We'll let you know when something important happens.</p>
                                </div>
                            ) : (
                                notifications.map((n, i) => (
                                    <div key={n._id || i} className={`flex items-start gap-4 px-5 py-5 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/40 relative' : ''}`}>
                                        {/* Unread indicator dot */}
                                        {!n.isRead && (
                                            <div className="absolute top-5 right-5 w-2 h-2 bg-blue-500 rounded-full shadow-sm ring-2 ring-white" />
                                        )}

                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${n.type === 'success' ? 'bg-green-50 text-green-600' :
                                            n.type === 'error' ? 'bg-red-50 text-red-500' :
                                                'bg-blue-50 text-[#527FB0]'
                                            }`}>
                                            {n.type === 'success' ? <CheckCircle size={15} /> :
                                                n.type === 'error' ? <X size={15} /> :
                                                    <Bell size={15} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-[#011023] uppercase leading-snug">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wide">
                                                {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
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
