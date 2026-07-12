import React, { useState, useEffect } from 'react';
import { DollarSign, Landmark, Download, FileText, CreditCard, ArrowUpRight, HelpCircle } from 'lucide-react';

const Finance = () => {
    const [employee, setEmployee] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            setEmployee(JSON.parse(storedUser));
        }
    }, []);

    const payslips = [
        { id: 'PS-2026-06', month: 'June 2026', basic: 32000, deductions: 1200, net: 30800 },
        { id: 'PS-2026-05', month: 'May 2026', basic: 32000, deductions: 1200, net: 30800 },
        { id: 'PS-2026-04', month: 'April 2026', basic: 32000, deductions: 1200, net: 30800 },
        { id: 'PS-2026-03', month: 'March 2026', basic: 30000, deductions: 1000, net: 29000 },
        { id: 'PS-2026-02', month: 'February 2026', basic: 30000, deductions: 1000, net: 29000 },
        { id: 'PS-2026-01', month: 'January 2026', basic: 30000, deductions: 1000, net: 29000 }
    ];

    const handleDownload = (id) => {
        setDownloadingId(id);
        setTimeout(() => {
            setDownloadingId(null);
            alert(`Payslip ${id} downloaded successfully.`);
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Finance & Payroll</h1>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Payslip directory, earnings details, and bank account mapping</p>
                </div>
            </div>

            {/* Financial Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Payout Model</p>
                    <h3 className="text-2xl font-black text-[#011023] mt-1">
                        {employee?.salaryType || 'MONTHLY'} PAYOUT
                    </h3>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#052558] text-white rounded-md text-[9px] font-black tracking-widest uppercase">Base Salary</span>
                        <span className="text-[11px] font-bold text-gray-500">Structured by role assignment</span>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Earned (YTD)</p>
                    <h3 className="text-2xl font-black text-[#011023] mt-1">₹1,81,200</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-black tracking-widest">credited</span>
                        <span className="text-[11px] font-bold text-gray-500">Jan - Jun 2026 cumulative</span>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-md transition-all">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Deductions (YTD)</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-1">₹6,600</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[9px] font-black tracking-widest">Tax & PF</span>
                        <span className="text-[11px] font-bold text-gray-500">Professional tax deductions</span>
                    </div>
                </div>
            </div>

            {/* Split layout: Payslips Table and Bank Details Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Payslips Table */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                    <div className="p-6 border-b border-[#e6f0fa]">
                        <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Salary Slips Directory</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Review and download monthly payslip reports</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f0f6ff] text-[12px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4 font-bold text-center">Month</th>
                                    <th className="p-4 font-bold text-center">Basic Pay</th>
                                    <th className="p-4 font-bold text-center">Deductions</th>
                                    <th className="p-4 font-bold text-center">Net Amount</th>
                                    <th className="p-4 font-bold text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[12px] uppercase divide-[#e6f0fa]">
                                {payslips.map((slip) => (
                                    <tr key={slip.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-4 text-center font-bold text-[#011023]">{slip.month}</td>
                                        <td className="p-4 text-center font-semibold text-gray-600">₹{slip.basic.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-center font-semibold text-rose-600">-₹{slip.deductions.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-center font-bold text-emerald-600">₹{slip.net.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDownload(slip.id)}
                                                disabled={downloadingId === slip.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-100 bg-white hover:bg-blue-50 text-[#052558] hover:text-[#527FB0] rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
                                            >
                                                {downloadingId === slip.id ? 'DOWNLOADING...' : (
                                                    <>
                                                        <Download size={12} /> DOWNLOAD
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Column 3: Bank Details */}
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex flex-col">
                    <div className="pb-4 border-b border-[#e6f0fa] mb-6">
                        <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Salary Account Mapping</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Official disbursement banking channel</p>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="bg-gradient-to-br from-[#052558] to-[#527FB0] text-white p-6 rounded-2xl relative overflow-hidden shadow-md">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Landmark size={80} />
                            </div>
                            <div className="relative z-10 flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-blue-200">Disbursement Channel</p>
                                        <h5 className="text-sm font-black uppercase tracking-wider mt-0.5">HDFC BANK LTD</h5>
                                    </div>
                                    <CreditCard size={24} className="text-blue-200" />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest text-blue-200">Account Number</p>
                                    <p className="text-base font-black tracking-widest mt-0.5">•••• •••• •••• 9845</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-[#e6f0fa] pb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">IFSC Code:</span>
                                <span className="font-bold text-gray-700">HDFC0000240</span>
                            </div>
                            <div className="flex justify-between border-b border-[#e6f0fa] pb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">PAN Card Mapping:</span>
                                <span className="font-bold text-gray-700 font-mono uppercase">{employee?.panCard || '—'}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#e6f0fa] pb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Provident Fund (PF):</span>
                                <span className="font-bold text-gray-700 font-mono">MH/BAN/0045231/000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Finance;
