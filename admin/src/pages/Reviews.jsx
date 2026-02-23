import React, { useState, useEffect } from 'react';
import { Star, MoreVertical, CheckCircle, XCircle } from 'lucide-react';

const Reviews = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);
    useEffect(() => { setLastRefreshed(new Date()); }, []);
    // Mock Data for UI presentation
    const reviews = [
        { id: "REV-4029", customer: "Sarah Johnson", service: "Brake Pad Replacement", rating: 5, date: "Oct 24, 2023", status: "Published", text: "Absolutely fantastic service! The mechanic arrived on time and fixed my brake issue right in my driveway." },
        { id: "REV-4028", customer: "Michael Chen", service: "Full Synthetic Oil Change", rating: 5, date: "Oct 22, 2023", status: "Published", text: "I love the transparency. They explained exactly what needed to be done and the price was exactly what they quoted." },
        { id: "REV-4027", customer: "Emily Davis", service: "General Inspection", rating: 4, date: "Oct 20, 2023", status: "Published", text: "Very convenient service. The app is easy to use and booking an appointment was a breeze." },
        { id: "REV-4026", customer: "James Wilson", service: "AC Gas Top-up", rating: 2, date: "Oct 18, 2023", status: "Pending", text: "The mechanic was slightly late. The AC works better now but it took longer than expected." },
    ];

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Customer Reviews</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5.5">
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-[#011023]">4.8</span>
                        <Star className="text-yellow-400 fill-yellow-400" size={24} />
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Total Reviews</p>
                    <p className="text-3xl font-black text-[#011023]">1,284</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Pending Approval</p>
                    <p className="text-3xl font-black text-amber-500">12</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Rejected Reviews</p>
                    <p className="text-3xl font-black text-red-500">5</p>
                </div>
            </div>

            {/* Main Content Table (Glassmorphism design matching frontend) */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[50rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[700px] relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold">Review ID</th>
                                <th className="p-4.5 font-bold">Customer & Service</th>
                                <th className="p-4.5 font-bold">Rating</th>
                                <th className="p-4.5 font-bold max-w-xs">Review Text</th>
                                <th className="p-4.5 font-bold">Status</th>
                                <th className="p-4.5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa]">
                            {reviews.map((rev) => (
                                <tr key={rev.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-semibold text-[#052558] text-sm">{rev.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{rev.customer}</div>
                                        <div className="text-xs text-gray-500">{rev.service}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < rev.rating ? "fill-yellow-400" : "text-gray-300"} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">{rev.date}</div>
                                    </td>
                                    <td className="p-4 max-w-xs text-sm text-gray-600 truncate">{rev.text}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${rev.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {rev.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {rev.status === 'Pending' && (
                                                <>
                                                    <button className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Approve">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Reject">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="text-gray-400 hover:text-[#052558] hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
