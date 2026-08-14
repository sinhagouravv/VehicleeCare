import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, QrCode, RefreshCw, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import Logo from '../assets/logo.svg';

const VirtualIDCard = () => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            setEmployee(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-2">
                <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                <p className="text-sm font-medium tracking-widest uppercase opacity-60">Rendering security badge...</p>
            </div>
        );
    }

    if (!employee) return null;

    // Custom inline styles for reliable 3D card flip execution
    const perspectiveStyle = {
        perspective: '1000px'
    };

    const cardInnerStyle = {
        position: 'relative',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        cursor: 'pointer'
    };

    const faceStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    };

    const backStyle = {
        ...faceStyle,
        transform: 'rotateY(180deg)'
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Virtual ID Card</h1>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Digital security authorization identity badge</p>
                </div>
            </div>

            {/* Main Interactive ID Badge Layout */}
            <div className="flex flex-col items-center justify-center py-10">
                {/* 3D Perspective Card Wrapper */}
                <div style={perspectiveStyle} className="w-[22rem] h-[34rem] relative select-none">
                    <div style={cardInnerStyle} onClick={handleFlip} className="shadow-[0_20px_50px_rgba(5,37,88,0.15)] rounded-3xl border border-white/20">
                        
                        {/* FRONT SIDE */}
                        <div style={faceStyle} className="bg-gradient-to-b from-[#052558] via-[#0b3272] to-[#011023] text-white">
                            {/* Card Header */}
                            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
                                    <div className="text-left leading-none">
                                        <h4 className="text-xs font-black tracking-wider uppercase leading-none">VehicleeCare</h4>
                                        <span className="text-[7.5px] font-bold text-[#527FB0] tracking-widest uppercase">Employee Identity</span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[7px] font-black tracking-widest uppercase">Verified</span>
                            </div>

                            {/* Card Body Profile */}
                            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                                {/* Portrait Photo Block */}
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#527FB0] to-white p-1 shadow-inner relative overflow-hidden">
                                        {employee.avatar ? (
                                            <img src={employee.avatar} alt="Employee Avatar" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#052558] flex items-center justify-center text-white text-3xl font-black uppercase">
                                                {employee.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1.5 right-1.5 p-1.5 bg-emerald-500 text-white rounded-full border border-[#052558] shadow">
                                        <ShieldCheck size={12} />
                                    </div>
                                </div>

                                <div className="text-center space-y-1">
                                    <h3 className="text-lg font-black tracking-wide uppercase leading-tight">{employee.name}</h3>
                                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">{employee.role || 'Staff'}</p>
                                </div>

                                <div className="pt-4 flex flex-col items-center">
                                    <div className="bg-white p-3.5 rounded-2xl shadow-inner border border-white/10">
                                        <QrCode size={100} className="text-[#011023]" />
                                    </div>
                                    <span className="text-[9px] font-bold text-blue-200 mt-2 font-mono tracking-widest">{(employee._id || employee.id).substring(0, 12).toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="p-5 bg-white/5 border-t border-white/5 flex items-center justify-between text-left">
                                <div>
                                    <p className="text-[7.5px] uppercase tracking-widest text-blue-300">Employee code</p>
                                    <p className="text-xs font-black tracking-wider uppercase font-mono mt-0.5">{employee.employeeId || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[7.5px] uppercase tracking-widest text-blue-300">Deployment</p>
                                    <p className="text-xs font-black tracking-wider uppercase mt-0.5">{employee.category || 'Garage'}</p>
                                </div>
                            </div>
                        </div>

                        {/* BACK SIDE */}
                        <div style={backStyle} className="bg-white text-[#011023] border border-[#e6f0fa]">
                            {/* Card Header */}
                            <div className="p-6 pb-4 flex items-center justify-between border-b border-[#e6f0fa] bg-[#f0f6ff]">
                                <div className="flex items-center gap-2">
                                    <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
                                    <h4 className="text-xs font-black tracking-wider uppercase text-[#052558]">VehicleeCare</h4>
                                </div>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Back Panel</span>
                            </div>

                            {/* Card Body Details */}
                            <div className="flex-1 p-6 space-y-6 text-left text-xs">
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-3">
                                        <Mail size={16} className="text-[#527FB0]" />
                                        <div>
                                            <p className="text-[7.5px] uppercase tracking-widest text-gray-400">Email Address</p>
                                            <p className="font-bold text-[#052558] lowercase">{employee.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-[#527FB0]" />
                                        <div>
                                            <p className="text-[7.5px] uppercase tracking-widest text-gray-400">Contact Number</p>
                                            <p className="font-bold text-[#052558]">{employee.phone || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-[#527FB0]" />
                                        <div>
                                            <p className="text-[7.5px] uppercase tracking-widest text-gray-400">Joining Date</p>
                                            <p className="font-bold text-[#052558]">
                                                {new Date(employee.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Barcode representation (Pure CSS lines) */}
                                <div className="pt-6 flex flex-col items-center">
                                    <div className="h-10 w-full flex bg-gray-50 border border-gray-100 rounded-lg p-2 justify-center gap-0.5">
                                        <div className="w-1 bg-[#011023] h-full"></div>
                                        <div className="w-0.5 bg-[#011023] h-full"></div>
                                        <div className="w-1.5 bg-[#011023] h-full"></div>
                                        <div className="w-0.5 bg-transparent h-full"></div>
                                        <div className="w-1 bg-[#011023] h-full"></div>
                                        <div className="w-2 bg-[#011023] h-full"></div>
                                        <div className="w-0.5 bg-[#011023] h-full"></div>
                                        <div className="w-1.5 bg-[#011023] h-full"></div>
                                        <div className="w-1 bg-[#011023] h-full"></div>
                                        <div className="w-0.5 bg-[#011023] h-full"></div>
                                        <div className="w-2 bg-[#011023] h-full"></div>
                                    </div>
                                    <span className="text-[8px] font-black text-gray-400 mt-1 font-mono tracking-widest">VC-EMP-{employee.employeeId}</span>
                                </div>
                            </div>

                            {/* Card Footer disclaimer */}
                            <div className="p-5 bg-gray-50 border-t border-[#e6f0fa] text-center text-[7.5px] font-bold text-gray-400 uppercase tracking-wide leading-relaxed">
                                This identification card is secure property of VehicleeCare workshop. Return to HR department upon termination of service.
                            </div>
                        </div>

                    </div>
                </div>

                {/* Flip Helper text */}
                <button 
                    onClick={handleFlip}
                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-[#f0f6ff] hover:bg-blue-50 text-[#052558] hover:text-[#527FB0] rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100/50 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                    <RefreshCw size={12} className="animate-spin-slow" /> Flip Security Badge
                </button>
            </div>
        </div>
    );
};

export default VirtualIDCard;
