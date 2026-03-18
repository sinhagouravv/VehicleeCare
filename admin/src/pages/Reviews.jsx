import React, { useState, useEffect } from 'react';
import { Star, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const fetchReviews = async () => {
        try {
            const [websiteRes, businessRes] = await Promise.all([
                axios.get(`${API_URL}/api/website-reviews/admin`),
                axios.get(`${API_URL}/api/business-reviews/all`)
            ]);

            const webReviews = websiteRes.data.map(r => ({ ...r, type: 'Website' }));
            const bizReviews = businessRes.data.data.map(r => ({
                ...r,
                type: 'Business',
                text: r.review,
                designation: r.role,
                status: r.status.charAt(0).toUpperCase() + r.status.slice(1) // capitalize pending to Pending
            }));

            const combined = [...webReviews, ...bizReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setReviews(combined);
            setLastRefreshed(new Date());
            setLoading(false);
        } catch (error) {
            console.error("Error fetching reviews", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            fetchReviews();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (id, type, newStatus) => {
        try {
            if (type === 'Website') {
                await axios.patch(`${API_URL}/api/website-reviews/${id}/status`, { status: newStatus });
            } else {
                await axios.put(`${API_URL}/api/business-reviews/${id}/status`, { status: newStatus.toLowerCase() });
            }
            setReviews(prev => prev.map(rev => rev._id === id ? { ...rev, status: newStatus } : rev));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update review status.");
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
        try {
            if (type === 'Website') {
                await axios.delete(`${API_URL}/api/website-reviews/${id}`);
            } else {
                await axios.delete(`${API_URL}/api/business-reviews/${id}`);
            }
            setReviews(prev => prev.filter(rev => rev._id !== id));
        } catch (error) {
            console.error("Failed to delete review", error);
            alert("Failed to delete review.");
        }
    };

    // Derived Statistics
    const approvedReviews = reviews.filter(r => r.status === 'Approved');
    const pendingReviews = reviews.filter(r => r.status === 'Pending').length;
    const rejectedReviews = reviews.filter(r => r.status === 'Rejected').length;

    // Calculate global average rating from all approved website ratings arrays
    let totalScore = 0;
    let totalVotes = 0;
    const approvedWebsiteReviews = approvedReviews.filter(r => r.type === 'Website');
    approvedWebsiteReviews.forEach(r => {
        if (r.ratings) {
            r.ratings.forEach(val => {
                totalScore += val;
                totalVotes++;
            });
        }
    });
    const avgRating = totalVotes > 0 ? (totalScore / totalVotes).toFixed(1) : "0.0";

    const getAverageForReview = (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((a, b) => a + b, 0);
        return Math.round(sum / ratings.length);
    };

    return (
        <>
            <div className="space-y-6 max-w-[92rem]  mx-auto ">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Customer Reviews</h1>
                    <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                        {loading ? (
                            <span>Refreshing...</span>
                        ) : lastRefreshed ? (
                            <span>
                                Last refreshed | {lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 uppercase gap-5.5">
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                        <p className="text-gray-500 font-semibold">Live Average Rating</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-[#011023]">{avgRating}</span>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                        <p className="text-gray-500 font-semibold">Total Submission</p>
                        <p className="text-2xl font-black text-[#011023]">{reviews.length}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                        <p className="text-gray-500 font-semibold">Pending Approval</p>
                        <p className="text-2xl font-black text-amber-500">{pendingReviews}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex justify-between items-center">
                        <p className="text-gray-500 font-semibold">Rejected Reviews</p>
                        <p className="text-2xl font-black text-red-500">{rejectedReviews}</p>
                    </div>
                </div>

                {/* Main Content Table */}
                <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                    <div className="overflow-x-hidden overflow-y-auto h-[750px] relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4.5 font-bold text-center w-[10%]">Review ID</th>
                                    <th className="p-4.5 font-bold text-center w-[10%]">Reviewer</th>
                                    <th className="p-4.5 font-bold text-center w-[8%]">Type</th>
                                    <th className="p-4.5 font-bold text-center w-[35%]">Review Text</th>
                                    <th className="p-4.5 font-bold text-center w-[6%]">Rating</th>
                                    <th className="p-4.5 font-bold text-center w-[12%]">Date</th>
                                    <th className="p-4.5 font-bold text-center w-[4%]">Status</th>
                                    <th className="p-4.5 font-bold text-center w-[4%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                                {reviews.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">No reviews found in the database.</td>
                                    </tr>
                                )}
                                {reviews.map((rev) => (
                                    <tr key={rev._id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-4 text-center font-semibold text-[#052558] text-[13px] tracking-wide">
                                            {rev.reviewId || `RE${rev._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-bold text-[#011023]">{rev.name}</div>
                                            <div className="text-xs text-center text-gray-500">{rev.designation || 'Customer'}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${rev.type === 'Business' ? 'bg-blue-100/50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {rev.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-center text-gray-600 whitespace-normal" title={rev.text}>{rev.text}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {rev.type === 'Website' ? (
                                                    <>
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={14} className={i < getAverageForReview(rev.ratings) ? "fill-yellow-400" : "text-gray-300"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-bold lowercase">({rev.ratings?.length || 0} votes)</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-300 font-black text-lg">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-xs font-semibold text-[#011023]">
                                            {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(rev.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </td>

                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${rev.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                rev.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {rev.status}
                                            </span>
                                        </td>

                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {rev.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Approved')} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Approve">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Rejected')} className="text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Reject">
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {rev.status === 'Rejected' && (
                                                    <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Approved')} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Approve">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}

                                                {rev.status === 'Approved' && (
                                                    <>
                                                        <button onClick={() => setSelectedReview(rev)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Full Review">
                                                            <Eye size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(rev._id, rev.type)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Permanently Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View Full Review Modal */}
            {
                selectedReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
                        <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative transform transition-all pb-6">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <div>
                                    <h3 className="text-xl font-bold text-[#011023] flex items-center gap-2">
                                        Review Details
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${selectedReview.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedReview.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {selectedReview.status}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">ID: {selectedReview.reviewId || `RE${selectedReview._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-[#011023]">{selectedReview.name}</h4>
                                        <p className="text-sm text-gray-500 font-medium">{selectedReview.designation || 'Customer'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-[#011023] mb-1">
                                            {new Date(selectedReview.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        {selectedReview.type === 'Website' ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} className={i < getAverageForReview(selectedReview.ratings) ? "fill-yellow-400" : "text-gray-200"} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold ml-1">({selectedReview.ratings?.length || 0} votes)</span>
                                            </div>
                                        ) : (
                                            <span className={`px-2 py-1 inline-block text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-100/50 text-blue-600`}>
                                                Business Review
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                                        "{selectedReview.text}"
                                    </p>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 flex justify-end gap-3 mt-2">
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm"
                                >
                                    Close
                                </button>
                                {selectedReview.status === 'Pending' && (
                                    <button
                                        onClick={() => {
                                            handleUpdateStatus(selectedReview._id, selectedReview.type, 'Approved');
                                            setSelectedReview(null);
                                        }}
                                        className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all text-sm flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Reviews;
