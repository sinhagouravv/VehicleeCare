import React, { useState, useEffect, useMemo } from 'react';
import { Star, Trash2, Eye, Check, X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';

import useHighlight from '../hooks/useHighlight';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const highlightedRow = useHighlight(reviews);
    const [allUsers, setAllUsers] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filter, Sort & Row Label States
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_reviews_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Reviews',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'status',
                    label: 'Review Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Approved', value: 'Approved' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Rejected', value: 'Rejected' },
                    ]
                }
            ],
            initialValues: {
                status: filterStatus === 'All' ? 'all' : filterStatus,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) {
                    setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                }
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterStatus('All');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterStatus, labelFilter, sortOrder, timeRange]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const fetchReviews = async () => {
        try {
            const [websiteRes, businessRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/website-reviews/admin`),
                axios.get(`${API_URL}/api/business-reviews/all`),
                axios.get(`${API_URL}/api/users`)
            ]);

            setAllUsers(usersRes.data.data || []);

            const webReviews = websiteRes.data.map(r => ({ 
                ...r, 
                sourceType: r.type ? r.type.charAt(0).toUpperCase() + r.type.slice(1) : 'Website',
                type: 'Website' 
            }));
            const bizReviews = businessRes.data.data.map(r => ({
                ...r,
                sourceType: 'Business',
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
    const userResolvers = useMemo(() => {
        const idMap = {};
        const nameMap = {};
        
        // Populate from reviews first (fallback)
        reviews.forEach(rev => {
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
    }, [reviews, allUsers]);

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

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;
        setDeleting(true);
        try {
            const { id, type } = reviewToDelete;
            if (type === 'Website') {
                await axios.delete(`${API_URL}/api/website-reviews/${id}`);
            } else {
                await axios.delete(`${API_URL}/api/business-reviews/${id}`);
            }
            setReviews(prev => prev.filter(rev => rev._id !== id));
            setIsDeleteModalOpen(false);
            setReviewToDelete(null);
        } catch (error) {
            console.error("Failed to delete review", error);
            alert("Failed to delete review.");
        } finally {
            setDeleting(false);
        }
    };

    // Derived Statistics
    const _approvedReviews = reviews.filter(r => r.status === 'Approved');
    const _pendingReviews = reviews.filter(r => r.status === 'Pending').length;
    const _rejectedReviews = reviews.filter(r => r.status === 'Rejected').length;

    const getAverageForReview = (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((a, b) => a + b, 0);
        return Math.round(sum / ratings.length);
    };

    const filteredReviews = React.useMemo(() => {
        return reviews.filter(rev => {
            if (filterStatus !== 'All' && rev.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[rev._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = rev.createdAt ? new Date(rev.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.reviewId || a._id || a.name || '');
            const idB = String(b.reviewId || b._id || b.name || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [reviews, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredReviews.length);
    }, [filteredReviews.length, setResultsCount]);

    return (
        <>
            <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Customer Reviews</h1>
                    <div className="text-xs uppercase text-gray-400 font-medium self-center flex items-center gap-2">
                        {!lastRefreshed ? (
                            <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                        ) : (
                            <span>
                                Last refreshed | {lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Content Table */}
                <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                    <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                        <table className="w-full text-center border-collapse table-fixed">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4.5 font-bold text-center w-[9%]">Review ID</th>
                                    <th className="p-4.5 font-bold text-center w-[9%]">Reviewer</th>
                                    <th className="p-4.5 font-bold text-center w-[9%]">Type</th>
                                    <th className="p-4.5 font-bold text-center w-[35%]">Review Text</th>
                                    <th className="p-4.5 font-bold text-center w-[6.5%]">Rating</th>
                                    <th className="p-4.5 font-bold text-center w-[9%]">Date</th>
                                    <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                    <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                                {loading ? (
                                    <TableSkeleton rows={15} cols={8} />
                                ) : filteredReviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-400 font-medium">No reviews found in the database.</td>
                                    </tr>
                                ) : null}
                                 {!loading && filteredReviews.map((rev) => {
                                     const rowId = rev.reviewId || rev._id;
                                     return (
                                         <tr 
                                             key={rev._id} 
                                             id={`row-${rowId}`}
                                             onClick={(e) => {
                                                 if (isLabelMode) {
                                                     e.stopPropagation();
                                                     setActiveLabelRowId(prev => prev === rev._id ? null : rev._id);
                                                 }
                                             }}
                                             className={`transition-all duration-1000 ${
                                                 isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                             } ${(highlightedRow === rowId || highlightedRow === rev._id || highlightedRow === rev.reviewId) ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : ''}`}
                                         >
                                        <td className="p-4 text-center font-semibold text-[#052558] text-sm tracking-wide relative">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[rev._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === rev._id ? null : rev._id);
                                                        }}
                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[rev._id] || 'Add label')}`}
                                                    >
                                                        {renderLabelIcon(rowLabels[rev._id], 16)}
                                                    </button>
                                                )}

                                                {activeLabelRowId === rev._id && (
                                                    <FloatingLabelSelector 
                                                        rowId={rev._id}
                                                        currentLabel={rowLabels[rev._id]}
                                                        onSaveLabel={handleSaveRowLabel}
                                                        labelPopupRef={labelPopupRef}
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span>{rev.reviewId || `RE${rev._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-semibold text-[#011023]">{rev.name}</div>
                                            <div className="text-xs text-center text-gray-500">
                                                {getDisplayUserId(rev)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                (rev.sourceType || rev.type || '').toLowerCase() === 'business'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : (rev.sourceType || rev.type || '').toLowerCase() === 'website'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {rev.sourceType || rev.type || 'Website'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <p className="text-sm text-gray-600 line-clamp-2 uppercase text-center max-w-lg mx-auto">
                                                {rev.text}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {rev.type === 'Website' ? (
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
                                        <td className="p-4 text-center w-[14%]">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-sm font-semibold text-[#011023]">
                                                    {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {new Date(rev.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${rev.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                rev.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {rev.status}
                                            </span>
                                        </td>

                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                {rev.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Approved')} className="text-gray-400 hover:text-emerald-500 cursor-pointer">
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={() => handleUpdateStatus(rev._id, rev.type, 'Rejected')} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {rev.status === 'Rejected' && (
                                                    <>
                                                        <button onClick={() => setSelectedReview(rev)} className="text-gray-400 hover:text-blue-500 cursor-pointer">
                                                            <Eye size={18} />
                                                        </button>
                                                        {/* User requested: 'the reject icon should not be there' for approved status */}
                                                        <button onClick={() => { setReviewToDelete({ id: rev._id, type: rev.type }); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}

                                                {rev.status === 'Approved' && (
                                                    <>
                                                        <button onClick={() => setSelectedReview(rev)} className="text-gray-400 hover:text-blue-500 cursor-pointer">
                                                            <Eye size={18} />
                                                        </button>
                                                        {/* User requested: 'the reject icon should not be there' for approved status */}
                                                        <button onClick={() => { setReviewToDelete({ id: rev._id, type: rev.type }); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Reviewer Info */}
                                <div className="space-y-4 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reviewer Info</h4>
                                    <div className="uppercase space-y-2">
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011023] pl-1 truncate">{selectedReview.name}</span></p>
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0">User ID:</span> 
                                            <span className="font-semibold text-gray-800 px-1 truncate">
                                                {getDisplayUserId(selectedReview)}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Review Details (Middle Column) */}
                                <div className="space-y-4 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review Details</h4>
                                    <div className="uppercase space-y-2">
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0">Type:</span> 
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                (selectedReview.sourceType || selectedReview.type || '').toLowerCase() === 'business'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : (selectedReview.sourceType || selectedReview.type || '').toLowerCase() === 'website'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {selectedReview.sourceType || selectedReview.type || 'Website'}
                                            </span>
                                        </p>
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-24 shrink-0">Rating:</span>
                                            {(selectedReview.type === 'Website' || selectedReview.sourceType === 'Website' || (selectedReview.ratings && selectedReview.ratings.length > 0)) ? (
                                                <div className="flex items-center gap-1 text-yellow-400 pl-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={16} className={i < getAverageForReview(selectedReview.ratings) ? "fill-yellow-400" : "text-gray-200"} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-400 pl-1">N/A</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Review Stats */}
                                <div className="space-y-4 w-full md:w-[37%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review Metrics</h4>
                                    <div className="uppercase space-y-2">
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0">Status:</span>
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                selectedReview.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                selectedReview.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {selectedReview.status}
                                            </span>
                                        </p>
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0">Date:</span> <span className="font-semibold ml-1 text-gray-600">{new Date(selectedReview.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(selectedReview.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Review Text */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review Content</h4>
                                <div className="text-justify relative">
                                    <p className="font-semibold text-gray-800 leading-relaxed uppercase whitespace-pre-wrap text-sm relative z-10">
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
                                This will permanently remove the selected review. <br/>
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
