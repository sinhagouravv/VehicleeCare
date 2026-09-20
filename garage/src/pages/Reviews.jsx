import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Star, Eye, X, Trash2, Loader2, MessageSquare, Check, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';
import { useAlert } from '../context/AlertContext';
import { API_BASE_URL } from '../config/api';

// Module-level cache for instant tab transitions
let cachedReviews = null;
let cachedAllReviews = null;
let cachedAllUsers = null;
let cachedReviewsGarageId = null;
let cachedReviewsTimestamp = null;

const Reviews = () => {
    const { isGuest, guardGuestAction } = useGuestGuard();
    const { triggerAlert } = useAlert();

    const [reviews, setReviews] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedReviewsGarageId === gId && Array.isArray(cachedReviews)) return cachedReviews;
            }
        } catch (e) {}
        return [];
    });
    const [allReviews, setAllReviews] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedReviewsGarageId === gId && Array.isArray(cachedAllReviews)) return cachedAllReviews;
            }
        } catch (e) {}
        return [];
    });
    const [allUsers, setAllUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedReviewsGarageId === gId && Array.isArray(cachedAllUsers)) return cachedAllUsers;
            }
        } catch (e) {}
        return [];
    });
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedReviewsTimestamp ? new Date(cachedReviewsTimestamp) : new Date());
    const [loading, setLoading] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedReviewsGarageId === gId && Array.isArray(cachedReviews)) return false;
            }
        } catch (e) {}
        return true;
    });
    const isFetchingRef = useRef(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Remark states
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkReview, setSelectedRemarkReview] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

    // Filter & Sort states
    const [ratingFilter, setRatingFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_reviews_row_labels');

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.reviewDate,
            item.date,
            item.timestamp,
            item.updatedAt
        ];
        for (const f of fields) {
            if (!f) continue;
            if (f instanceof Date && !isNaN(f.getTime())) return f;
            if (typeof f === 'number') {
                const d = new Date(f);
                if (!isNaN(d.getTime())) return d;
            }
            if (typeof f === 'string') {
                const trimmed = f.trim();
                const ddmmyyyy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
                if (ddmmyyyy) {
                    const day = parseInt(ddmmyyyy[1], 10);
                    const month = parseInt(ddmmyyyy[2], 10) - 1;
                    const year = parseInt(ddmmyyyy[3], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                const d = new Date(trimmed);
                if (!isNaN(d.getTime())) return d;
            }
        }
        if (typeof item._id === 'string' && item._id.length === 24 && /^[a-f\d]{24}$/i.test(item._id)) {
            const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Reviews',
            hasSort: true,
            groups: [
                {
                    id: 'category',
                    label: 'Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Website', value: 'Website' },
                        { label: 'Business', value: 'Business' }
                    ]
                },
                {
                    id: 'rating',
                    label: 'Rating',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: '5 Stars', value: '5' },
                        { label: '4 Stars', value: '4' },
                        { label: '3 Stars', value: '3' },
                        { label: '2 Stars', value: '2' },
                        { label: '1 Star', value: '1' }
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                rating: 'all',
                category: 'all',
                label: 'all',
                sortOrder: 'latest',
                timeRange: 'all'
            },
            onChange: (newValues) => {
                if (newValues.rating !== undefined) setRatingFilter(newValues.rating);
                if (newValues.category !== undefined) setCategoryFilter(newValues.category);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setRatingFilter('all');
                setCategoryFilter('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const getReviewRating = (r) => {
        if (Array.isArray(r.ratings) && r.ratings.length > 0) {
            const sum = r.ratings.reduce((a, b) => a + b, 0);
            return Math.round(sum / r.ratings.length);
        }
        if (r.rating !== undefined && r.rating !== null && r.rating !== '') {
            return Math.round(Number(r.rating));
        }
        if (r.stars !== undefined && r.stars !== null) {
            return Math.round(Number(r.stars));
        }
        return 0;
    };

    const filteredReviews = useMemo(() => {
        let filtered = reviews.filter((r) => {
            if (labelFilter && labelFilter !== 'all') {
                const itemLabel = rowLabels[r._id];
                if (!itemLabel || itemLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            if (ratingFilter && ratingFilter !== 'all') {
                const rRating = getReviewRating(r);
                if (rRating !== Number(ratingFilter)) return false;
            }
            if (categoryFilter && categoryFilter !== 'all') {
                const catStr = (r.category || r.sourceType || 'Website').trim().toLowerCase();
                if (catStr !== categoryFilter.trim().toLowerCase()) return false;
            }
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(r);
                if (itemDate) {
                    const now = new Date();
                    let cutoff;
                    if (timeRange === 'week') {
                        cutoff = new Date();
                        cutoff.setDate(now.getDate() - 7);
                    } else if (timeRange === 'month') {
                        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    }
                    if (cutoff) {
                        cutoff.setHours(0, 0, 0, 0);
                        if (itemDate < cutoff) return false;
                    }
                }
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const dateA = getItemDate(a)?.getTime() || 0;
            const dateB = getItemDate(b)?.getTime() || 0;
            if (sortOrder === 'oldest') {
                return dateA - dateB;
            }
            return dateB - dateA;
        });
    }, [reviews, ratingFilter, categoryFilter, labelFilter, rowLabels, sortOrder, timeRange]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredReviews.length);
        }
    }, [filteredReviews.length, setResultsCount]);

    const highlightedRow = useHighlight(filteredReviews);

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;
        setDeleting(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        setReviews(prev => prev.filter(r => r._id !== reviewToDelete));
        setIsDeleteModalOpen(false);
        setReviewToDelete(null);
        setDeleting(false);
    };

    const fetchReviews = useCallback(async (silent = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && !cachedReviews) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) {
                console.warn("No garage user found in local storage");
                setLoading(false);
                return;
            }
            const garageUser = JSON.parse(storedUser);

            const [websiteRes, businessRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/website-reviews`),
                fetch(`${API_BASE_URL}/api/business-reviews/all`),
                fetch(`${API_BASE_URL}/api/users`)
            ]);
            
            const websiteData = await websiteRes.json();
            const businessData = await businessRes.json();
            const usersData = await usersRes.json();

            const combinedAll = [...websiteData, ...(businessData.data || [])];
            const usersList = usersData.data || [];
            setAllReviews(combinedAll);
            setAllUsers(usersList);

            const garageReviews = websiteData
                .filter(r => r.type === 'garage' && r.targetName?.toLowerCase().trim() === garageUser.name?.toLowerCase().trim())
                .map(r => ({ ...r, sourceType: 'Garage', type: 'Website' }));

            const combined = [...garageReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setReviews(combined);
            const now = new Date();
            setLastRefreshed(now);
            cachedReviews = combined;
            cachedAllReviews = combinedAll;
            cachedAllUsers = usersList;
            cachedReviewsGarageId = garageUser.id;
            cachedReviewsTimestamp = now.getTime();
        } catch (error) {
            console.error('Error fetching reviews', error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchReviews(!!cachedReviews);
        if (isGuest) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchReviews(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchReviews, isGuest]);

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
    const _approvedReviews = reviews.filter(r => r.status === 'Approved');

    const getAverageForReview = (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((a, b) => a + b, 0);
        return Math.round(sum / ratings.length);
    };

    const handleOpenRemarkModal = (rev) => {
        setSelectedRemarkReview(rev);
        setRemarkText(rev.garageRemark || rev.employeeRemark || rev.remark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (guardGuestAction()) return;
        if (!selectedRemarkReview) return;
        if (!remarkText || !remarkText.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }
        setIsSubmittingRemark(true);
        try {
            let garageName = 'Garage';
            let garageId = 'GARAGE';
            let garageRole = 'Garage Owner';
            const storedGarage = localStorage.getItem('garageUser');
            if (storedGarage) {
                try {
                    const u = JSON.parse(storedGarage);
                    garageName = u.name || u.garageName || garageName;
                    garageId = u.garageId || u.userId || u._id || garageId;
                    garageRole = u.role || garageRole;
                } catch (_) {}
            }

            const refId = selectedRemarkReview.reviewId || `RE${selectedRemarkReview._id.slice(-5).toUpperCase().replace(/0/g, '1')}`;
            const targetId = selectedRemarkReview.name || '—';
            const targetRole = 'Customer';

            const remarkRes = await fetch(`${API_BASE_URL}/api/remarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkReview._id,
                    reporterId: garageId,
                    reporterName: garageName,
                    remarkerRole: garageRole,
                    remarkedRole: targetRole,
                    role: targetRole,
                    customerDetails: targetId,
                    remark: remarkText,
                    status: selectedRemarkReview.status || 'Pending'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            setReviews(prev => prev.map(r => r._id === selectedRemarkReview._id ? { ...r, garageRemark: remarkText, remarkId: createdRemarkId } : r));
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Reviews] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkReview(null);
            setRemarkText('');
        }
    };

    return (
        <>
            <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Customer Reviews</h1>
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : 'Loading…'}
                    </div>
                </div>

                {/* Main Content Table */}
                <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                    <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4.5 font-bold text-center w-[9.75%]">Review ID</th>
                                    <th className="p-4.5 font-bold text-center w-[11%]">Reviewer</th>
                                    <th className="p-4.5 font-bold text-center w-[43%]">Review Text</th>
                                    <th className="p-4.5 font-bold text-center w-[8%]">Rating</th>
                                    <th className="p-4.5 font-bold text-center w-[10%]">Date</th>
                                    <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                    <th className="p-4.5 font-bold text-center w-[7.5%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                                {loading && reviews.length === 0 ? (
                                    <TableSkeleton rows={15} cols={7} />
                                ) : filteredReviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-xs font-bold text-gray-400 tracking-widest uppercase opacity-70">No reviews found.</td>
                                    </tr>
                                ) : null}
                                {filteredReviews.map((rev) => (
                                    <tr
                                        key={rev._id}
                                        id={`row-${rev._id}`}
                                        onClick={() => {
                                            if (isLabelMode) {
                                                setActiveLabelRowId(prev => prev === rev._id ? null : rev._id);
                                            }
                                        }}
                                        className={`cursor-pointer transition-colors duration-1000 ${
                                            activeLabelRowId === rev._id
                                                ? 'relative z-40 bg-blue-50/50'
                                                : highlightedRow === rev._id
                                                ? 'bg-emerald-100/60 relative z-20'
                                                : 'hover:bg-blue-50/30'
                                        }`}
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
                                                        topClass="-top-10"
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span className="truncate">{rev.reviewId || `RE${rev._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}</span>
                                            </div>
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
                                        <td className="p-4 text-center uppercase">
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
                                                <button onClick={() => handleOpenRemarkModal(rev)} className="text-gray-400 hover:text-emerald-500 transition-colors">
                                                    <MessageSquare size={17} />
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

            {isRemarkModalOpen && selectedRemarkReview && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkReview(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Review Remark
                                </h3>
                                {selectedRemarkReview.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkReview.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkReview(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Review Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Review ID</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkReview.reviewId || `RE${selectedRemarkReview._id.slice(-5).toUpperCase().replace(/0/g, '1')}`}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    Customer
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase truncate max-w-[120px]">
                                    {selectedRemarkReview.name || '—'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border ${
                                    selectedRemarkReview.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    selectedRemarkReview.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                    {selectedRemarkReview.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkReview.garageRemark || selectedRemarkReview.employeeRemark);
                            return (
                                <form onSubmit={handleRemarkSubmit} className="space-y-4.5 text-left">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Remark</label>
                                        <textarea
                                            rows="4"
                                            disabled={hasExistingRemark}
                                            value={remarkText}
                                            onChange={(e) => setRemarkText(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#f8fafc] uppercase border border-[#cbd5e1] rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold text-sm text-[#011023] resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingRemark || hasExistingRemark}
                                        className={`w-full py-2 border rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-sm mt-4 flex items-center justify-center gap-2 ${
                                            hasExistingRemark 
                                                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                                                : 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3] hover:bg-[#c7d2fe] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {isSubmittingRemark ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> Submitting REMARK...
                                            </>
                                        ) : hasExistingRemark ? (
                                            <>
                                                <Check size={14} /> REMARK SUBMITTED
                                            </>
                                        ) : (
                                            <>
                                                <Send size={14} /> Submit REMARK
                                            </>
                                        )}
                                    </button>
                                </form>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Reviews;
