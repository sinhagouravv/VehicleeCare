import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, ShieldCheck, Loader, KeyRound, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/LOGO.svg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password States
    const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0 = hidden, 1 = enter admin ID, 2 = enter OTP & new pass
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    // Auto-dismiss notifications after 5 seconds
    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5001/api/auth/store-admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Store Admin Token and ID
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.admin));

                // Redirect to dashboard
                navigate('/');
            } else {
                setError(data.msg || 'Invalid credentials');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(2); // Move to OTP validation view
            } else {
                setError(data.msg || 'The email you entered is not an Admin Email, enter correct email address');
            }
        } catch (err) {
            setError('Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-verify-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(3); // Move to New Password view
            } else {
                setError(data.msg || 'Invalid or expired OTP');
            }
        } catch (err) {
            setError('Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(0); // Hide forgot password modal
                setSuccessMessage('Password updated successfully. Please log in.');
                setEmail(resetEmail); // pre-fill the login input
                setResetOtp('');
                setNewPassword('');
                setConfirmNewPassword('');
                setResetEmail('');
            } else {
                setError(data.msg || 'Failed to update password');
            }
        } catch (err) {
            setError('Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            {/* Soft Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse duration-10000"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-400/15 rounded-full blur-[150px] mix-blend-multiply"></div>
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[100px] mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
            </div>

            <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.06)] z-10 overflow-hidden relative">

                <div className="p-10 relative">

                    {/* ───────────────────────────────────────────────────────── */}
                    {/* BASE LOGIN FORM */}
                    <div className={`transition-all duration-500 ${forgotPasswordStep > 0 ? 'opacity-0 scale-95 pointer-events-none absolute inset-0 p-10' : 'opacity-100 scale-100 relative'}`}>
                        <div className="text-center mb-10 relative">
                            {/* Logo */}
                            <div className="mx-auto flex items-center justify-center relative mb-5 z-10 w-22 h-15">
                                <img src={logo} alt="VehicleeCare Admin" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                            <p className="text-gray-500 font-medium mb-2 text-sm tracking-widest uppercase">
                                vehicleecare
                            </p>
                            <h2 className="text-3xl font-black text-[#011023] tracking-tight uppercase">
                                Store Admin Portal
                            </h2>

                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                    Admin ID or Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] placeholder-gray-400 font-semibold tracking-wide shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] placeholder-gray-400 font-semibold tracking-widest shadow-sm"
                                        required
                                    />
                                    <div
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm py-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center w-4 h-4 rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
                                        <input type="checkbox" className="appearance-none absolute inset-0 w-full h-full cursor-pointer checked:bg-white transition-colors peer" />
                                        <svg className="w-2.5 h-2.5 text-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-500 font-bold group-hover:text-[#011023] transition-colors">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setForgotPasswordStep(1); setError(''); setSuccessMessage(''); }}
                                    className="text-blue-500 font-bold hover:text-blue-600 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative group overflow-hidden bg-gradient-to-r from-[#052558] to-[#527FB0] text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_8px_20px_rgba(5,37,88,0.2)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex justify-center items-center drop-shadow-md">
                                    {loading ? <Loader className="animate-spin" size={20} /> : 'Sign In'}
                                </span>
                            </button>
                        </form>
                    </div>


                    {/* ───────────────────────────────────────────────────────── */}
                    {/* FORGOT PASSWORD MODAL (STEP 1 & 2) */}
                    <div className={`transition-all duration-500 ${forgotPasswordStep > 0 ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-110 pointer-events-none absolute inset-0 p-10 hidden'}`}>
                        <div className="flex justify-center mb-6 relative">
                            <div className="bg-blue-50 text-blue-500 p-4 rounded-full border border-blue-100 shadow-sm relative z-10">
                                <KeyRound size={36} />
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-[#011023] text-center mb-2 tracking-tight uppercase">
                            {forgotPasswordStep === 1 ? 'Reset Password' : 'New Password'}
                        </h3>
                        <p className="text-gray-500 text-center text-sm font-medium mb-8 leading-relaxed">
                            {forgotPasswordStep === 1
                                ? "Enter your Email address to receive a secure 6-digit verification code."
                                : "Check your admin email for the verification code and enter a new password."}
                        </p>

                        {/* STEP 1 FORM */}
                        {forgotPasswordStep === 1 && (
                            <form onSubmit={handleSendResetOtp} className="space-y-6">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                        Admin ID or Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] font-semibold tracking-wide shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex justify-center items-center drop-shadow-md">
                                        {loading ? <Loader className="animate-spin" size={20} /> : 'Send Verification OTP'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setForgotPasswordStep(0); setError(''); }}
                                    className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors pt-2"
                                >
                                    Cancel & Return
                                </button>
                            </form>
                        )}

                        {/* STEP 2 FORM (Verify OTP) */}
                        {forgotPasswordStep === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                        Verification OTP
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="000000"
                                        value={resetOtp}
                                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center tracking-[1em] py-4 bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] text-2xl font-black placeholder-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || resetOtp.length !== 6}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex justify-center items-center drop-shadow-md">
                                        {loading ? <Loader className="animate-spin" size={20} /> : 'Verify OTP'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setForgotPasswordStep(1); setError(''); setResetOtp(''); }}
                                    className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors pt-2"
                                >
                                    Go Back
                                </button>
                            </form>
                        )}

                        {/* STEP 3 FORM (Create New Password) */}
                        {forgotPasswordStep === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] font-semibold tracking-widest shadow-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <div
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] font-semibold tracking-widest shadow-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <div
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !newPassword || !confirmNewPassword}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex justify-center items-center drop-shadow-md">
                                        {loading ? <Loader className="animate-spin" size={20} /> : 'Update Password'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setForgotPasswordStep(2); setError(''); setNewPassword(''); setConfirmNewPassword(''); }}
                                    className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors pt-2"
                                >
                                    Go Back
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>

            {/* FIXED TOP NOTIFICATIONS */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
                {error && (
                    <div className="bg-white border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-[fadeInDown_0.3s_ease-out] font-semibold tracking-wide pointer-events-auto">
                        <ShieldAlert size={20} className="shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-white border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-[fadeInDown_0.3s_ease-out] font-semibold tracking-wide pointer-events-auto">
                        <ShieldCheck size={20} className="shrink-0 text-green-500" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Login;
