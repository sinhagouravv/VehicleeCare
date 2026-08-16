import React, { useState, useEffect, useMemo } from 'react';
import { Star, Eye, X, Trash2, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
// import useHighlight from '../hooks/useHighlight'; // Keep highlighted row hook
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';

const Reviews = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const [reviews, setReviews] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;
        setDeleting(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        setReviews(prev => prev.filter(r => r._id !== reviewToDelete));
        setIsDeleteModalOpen(false);
        setReviewToDelete(null);
        setDeleting(false);
    };

    const highlightedRow = useHighlight(reviews);

    const fetchReviews = async () => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) {
                console.warn("No garage user found in local storage");
                setLoading(false);
                return;
            }
            const garageUser = JSON.parse(storedUser);

            const [websiteRes, businessRes, usersRes] = await Promise.all([
                fetch(`${API_URL}/api/website-reviews`),
                fetch(`${API_URL}/api/business-reviews/all`),
                fetch(`${API_URL}/api/users`)
            ]);
            
            const websiteData = await websiteRes.json();
            const businessData = await businessRes.json();
            const usersData = await usersRes.json();

            setAllReviews([...websiteData, ...(businessData.data || [])]);
            setAllUsers(usersData.data || []);

            const garageReviews = websiteData
                .filter(r => r.type === 'garage' && r.targetName?.toLowerCase().trim() === garageUser.name?.toLowerCase().trim())
                .map(r => ({ ...r, sourceType: 'Garage', type: 'Website' }));

            const combined = [...garageReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setReviews(combined);
        } catch (error) {
            console.error('Error fetching reviews', error);
        } finally {
            setLastRefreshed(new Date());
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        const interval = setInterval(() => { fetchReviews(); }, 5000);
        return () => clearInterval(interval);
    }, []);

    const userResolvers = useMemo(() => {
        const idMap = {};
        const nameMap = {};
        
        // Populate from reviews first (fallback)
        allReviews.forEach(rev => {
            const uid = rev.user?.userId || rev.businessUser?.userId ||
                rev.userId || rev.user_id ||
                (typeof rev.user === 'string' ? rev.user :
                    (typeof rev.businessUser === 'string' ? rev.businessUser : null));
            if (uid && rev.name) {
                const normalizedName = rev.name.trim().toUpperCase().replace(/\s+/g, ' ');
                const isObjectId = /^[a-f\d]{24}$/i.test(uid);
                if (!nameMap[normalizedName] || !isObjectId) {
                    nameMap[normalizedName] = uid;
                }
            }
        });

        // Populate from users database (highest priority)
        allUsers.forEach(u => {
            if (u._id && u.userId) {
                idMap[u._id] = u.userId;
            }
            if (u.name && u.userId) {
                nameMap[u.name.trim().toUpperCase()] = u.userId;
            }
        });

        return { idMap, nameMap };
    }, [allReviews, allUsers]);

   const getDisplayUserId = (rev) => {
        if (!rev) return 'Guest';
        const directId = rev.user?.userId || rev.businessUser?.userId || 
                         rev.userId || rev.user_id ||
                         (typeof rev.user === 'string' ? rev.user : 
                         (typeof rev.businessUser === 'string' ? rev.businessUser : null));
        
        const isObjectId = /^[a-f\d]{24}$/i.test(directId);
        
        // 1. Direct MongoDB ID mapping: If the ID is a MongoDB ObjectId, check if it maps perfectly to a short User ID
        if (isObjectId && userResolvers.idMap[directId]) {
            return userResolvers.idMap[directId];
        }
        
        // 2. Smart fallback: If direct ID is missing OR is a raw ObjectId, try to find a better one by name
        if ((!directId || isObjectId) && rev.name) {
            const normalizedName = rev.name.trim().toUpperCase().replace(/\s+/g, ' ');
            if (userResolvers.nameMap[normalizedName]) {
                const mappedId = userResolvers.nameMap[normalizedName];
                const mappedIsObjectId = /^[a-f\d]{24}$/i.test(mappedId);
                if (!isObjectId || !mappedIsObjectId) {
                    return mappedId;
                }
            }
        }
        
        if (directId) return directId;
        
        return 'Guest';
    };

    // Derived Statistics
    const approvedReviews = reviews.filter(r => r.status === 'Approved');
    const pendingReviews = reviews.filter(r => r.status === 'Pending').length;
    const rejectedReviews = reviews.filter(r => r.status === 'Rejected').length;

    let totalScore = 0;
    let totalVotes = 0;
    const approvedGarageReviews = approvedReviews.filter(r => r.sourceType === 'Garage');
    approvedGarageReviews.forEach(r => {
        if (r.ratings) {
            r.ratings.forEach(val => { totalScore += val; totalVotes++; });
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
            <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
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

                {/* Main Content Table */}
                <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                    <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4.5 font-bold text-center w-[7.5%]">Review ID</th>
                                    <th className="p-4.5 font-bold text-center w-[11%]">Reviewer</th>
                                    <th className="p-4.5 font-bold text-center w-[40%]">Review Text</th>
                                    <th className="p-4.5 font-bold text-center w-[6%]">Rating</th>
                                    <th className="p-4.5 font-bold text-center w-[13%]">Date</th>
                                    <th className="p-4.5 font-bold text-center w-[7%]">Status</th>
                                    <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                                {loading && reviews.length === 0 ? (
                                    <TableSkeleton rows={15} cols={7} />
                                ) : reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-400 font-medium">No reviews found in the database.</td>
                                    </tr>
                                ) : null}
                                {reviews.map((rev) => (
                                    <tr
                                        key={rev._id}
                                        id={`row-${rev._id}`}
                                        className={`transition-colors duration-1000 ${
                                            highlightedRow === rev._id
                                                ? 'bg-emerald-100/60 relative z-20'
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                        <td className="p-4 text-center font-semibold text-[#052558] text-sm tracking-wide">
                                            {rev.reviewId || `RE${rev._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-semibold text-[#011023]">{rev.name}</div>
                                            <div className="text-xs text-center text-gray-500">
                                                {getDisplayUserId(rev)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <p 
                                                className="text-sm text-center text-gray-600 whitespace-normal line-clamp-2 leading-snug overflow-hidden"
                                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                            >
                                                {rev.text}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {rev.sourceType === 'Garage' ? (
                                                    <>
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={16} className={i < getAverageForReview(rev.ratings) ? "fill-yellow-400" : "text-gray-300"} />
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-300 font-black text-lg">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-sm font-semibold text-[#011023]">
                                            {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(rev.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${rev.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                rev.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {rev.status}
                                            </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => setSelectedReview(rev)} className="text-gray-400 hover:text-blue-500 ">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => { setReviewToDelete(rev._id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500 ">
                                                    <Trash2 size={16} />
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

            {/* View Full Review Modal */}
            {selectedReview && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
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
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Reviewer Info */}
                                <div className="space-y-4 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reviewer Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011023] pl-1 truncate">{selectedReview.name}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Type:</span>
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${selectedReview.sourceType === 'Business' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {selectedReview.sourceType}
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
                                            {selectedReview.sourceType === 'Garage' ? (
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
                                    <p className="text-gray-700 leading-relaxed uppercase whitespace-pre-wrap text-sm relative z-10">
                                        {selectedReview.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setReviewToDelete(null); }}
                >
                    <div
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Review</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the selected review.<br />
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setReviewToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteReview}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Reviews;
