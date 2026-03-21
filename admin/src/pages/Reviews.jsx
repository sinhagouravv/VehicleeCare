import React, { useState, useEffect, useMemo } from 'react';
import { Star, Trash2, Eye, CheckCircle, XCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
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

    // Smart mapping: Generate a map of reviewer names to their User IDs from known reviews
    const nameToUserIdMap = useMemo(() => {
        const map = {};
        reviews.forEach(rev => {
            const uid = rev.user?.userId || rev.businessUser?.userId || 
                        rev.userId || rev.user_id ||
                        (typeof rev.user === 'string' ? rev.user : 
                        (typeof rev.businessUser === 'string' ? rev.businessUser : null));
            if (uid && rev.name) {
                // Normalize name: trim, uppercase, and collapse multiple spaces
                const normalizedName = rev.name.trim().toUpperCase().replace(/\s+/g, ' ');
                map[normalizedName] = uid;
            }
        });
        return map;
    }, [reviews]);

    const getDisplayUserId = (rev) => {
        if (!rev) return 'Guest';
        const directId = rev.user?.userId || rev.businessUser?.userId || 
                         rev.userId || rev.user_id ||
                         (typeof rev.user === 'string' ? rev.user : 
                         (typeof rev.businessUser === 'string' ? rev.businessUser : null));
        
        if (directId) return directId;
        
        // Smart fallback: If direct ID is missing, try to find it by name from other reviews
        if (rev.name) {
            const normalizedName = rev.name.trim().toUpperCase().replace(/\s+/g, ' ');
            if (nameToUserIdMap[normalizedName]) {
                return nameToUserIdMap[normalizedName];
            }
        }
        
        return 'Guest';
    };

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
                                            <div className="text-xs text-center text-gray-500">
                                                {getDisplayUserId(rev)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${rev.type === 'Business' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                {rev.type === 'Website' ? 'Garage' : rev.type}
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
                                                        {/* <span className="text-[10px] text-gray-400 font-bold lowercase">({rev.ratings?.length || 0} votes)</span> */}
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
                                                        <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Approved')} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Approve">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Rejected')} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Reject">
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {rev.status === 'Rejected' && (
                                                    <>
                                                        <button className="text-red-500/50 p-1.5 rounded-lg cursor-default" title="Rejected">
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {rev.status === 'Approved' && (
                                                    <>
                                                        <button onClick={() => setSelectedReview(rev)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Full Review">
                                                            <Eye size={18} />
                                                        </button>
                                                        {/* User requested: 'the reject icon should not be there' for approved status */}
                                                        <button onClick={() => handleDelete(rev._id, rev.type)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Permanently Delete">
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
            {selectedReview && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Review Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedReview.reviewId || `RE${selectedReview._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}</span></p>
                            </div>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Reviewer Info */}
                                <div className="space-y-4 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reviewer Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011023] pl-1 truncate">{selectedReview.name}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Type:</span> 
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${selectedReview.type === 'Business' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {selectedReview.type === 'Website' ? 'Garage' : selectedReview.type}
                                            </span>
                                        </p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">User ID:</span> 
                                            <span className="font-semibold text-gray-800 px-1 truncate">
                                                {getDisplayUserId(selectedReview)}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Review Stats */}
                                <div className="space-y-4 w-full md:w-[60%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review Metrics</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-3 border border-blue-50">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500 w-24 shrink-0 text-sm">Rating:</span>
                                            {selectedReview.type === 'Website' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={16} className={i < getAverageForReview(selectedReview.ratings) ? "fill-yellow-400" : "text-gray-200"} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-400">N/A</span>
                                            )}
                                        </div>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Status:</span>
                                            <span className={`px-2.5 py-0.5 text-[10px] ml-4 font-bold uppercase rounded-full tracking-wider ${selectedReview.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                selectedReview.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {selectedReview.status}
                                            </span>
                                        </p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Date:</span> <span className="font-semibold ml-4 text-gray-600">{new Date(selectedReview.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(selectedReview.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Review Text */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review Content</h4>
                                <div className="bg-white border border-[#e6f0fa] p-4 rounded-2xl shadow-sm text-justify relative">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[16px] relative z-10">
                                        {selectedReview.text}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Reviews;
