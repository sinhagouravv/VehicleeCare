import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ShieldAlert, ShieldCheck, Loader, Mail, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.svg';

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        setLoading(true);

        try {
            const res = await fetch('http://localhost:5001/api/auth/business-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMessage('Account created successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                setError(data.msg || 'Failed to create account or API missing');
            }
        } catch (err) {
            setError('Failed to connect to server');
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

            <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.06)] z-10 overflow-hidden relative mt-8 mb-8">

                <div className="p-10 relative">

                    <div className="transition-all duration-500 opacity-100 scale-100 relative">
                        <div className="text-center mb-8 relative">
                            {/* Logo */}
                            <div className="mx-auto flex items-center justify-center mb-5 relative z-10 w-28 h-18">
                                <img src={logo} alt="VehicleeCare Business" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                            <h2 className="text-3xl font-black text-[#011023] tracking-tight uppercase">
                                Create Account
                            </h2>
                            <p className="text-gray-500 uppercase font-medium mt-2 text-sm">
                                Join the VehicleeCare Partner Network
                            </p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-3.5">

                            {/* Name Input */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full uppercase pl-12 pr-4 py-3.5 text-sm bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] font-medium tracking-wide shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/70 text-sm border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] font-medium tracking-wide shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2 group">
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
                                        className="w-full pl-12 pr-12 py-3.5 text-sm bg-white/70 border border-white focus:border-blue-400 rounded-xl focus:outline-none transition-all text-[#011023] font-medium tracking-widest shadow-sm"
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

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-[#052558] to-[#527FB0] text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_8px_20px_rgba(5,37,88,0.2)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex justify-center items-center drop-shadow-md">
                                        {loading ? <Loader className="animate-spin" size={20} /> : 'Sign Up'}
                                    </span>
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <p className="text-sm font-medium text-gray-500">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase tracking-wider text-xs">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </form>
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

export default SignUp;
