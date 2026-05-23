import { Star, Quote, CheckCircle2, X, ThumbsUp, Send, User, PenSquare, Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const Reviews = () => {
    const [selectedReview, setSelectedReview] = useState(null);
    const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

    // User Context Logic
    const [user, setUser] = useState(null);
    const [apiReviews, setApiReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [reviewHoverRating, setReviewHoverRating] = useState(0);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(null);

    // Initial Demo Reviews (Adapted for VehicleeCare)
    const [demoReviews, setDemoReviews] = useState([
        { id: 1, name: "Sarah Johnson", role: "Car Owner", text: "VehicleeCare has completely changed how I manage my car maintenance. The interface is stunning and so easy to use! I used to miss my service dates constantly, but the reminders have saved me multiple times.", ratings: [5, 5, 4, 5], date: "2 days ago" },
        { id: 2, name: "Michael Chen", role: "Customer", text: "Booking a garage is incredibly fast. I can verify availability and prices in seconds before confirming. It makes planning my car's service so much smoother.", ratings: [5, 4, 5], date: "1 week ago" },
        { id: 3, name: "Emily Davis", role: "Customer", text: "The dashboard gives me everything I need at a glance. Highly recommended for anyone looking for a modern vehicle service solution.", ratings: [4, 4, 3], date: "3 weeks ago" },
        { id: 4, name: "David Wilson", role: "Fleet Owner", text: "Clean, minimal, and functional. Exactly what a modern garage booking system should be. The service history tracking is a nice touch.", ratings: [5, 5, 5, 5], date: "1 month ago" },
        { id: 5, name: "Jessica Brown", role: "Customer", text: "I love the new design updates. It feels like a premium app. Great job team! The dark mode is easy on the eyes.", ratings: [5, 4], date: "2 months ago" },
        { id: 6, name: "Robert Taylor", role: "Customer", text: "Very intuitive. It encourages me to keep my car in top shape. I've seen a noticeable improvement in my car's performance since using these top-rated garages.", ratings: [4, 5, 4], date: "3 months ago" },
        { id: 7, name: "Alex Morgan", role: "Car Owner", text: "The service estimates and transparency are a lifesaver. Best vehicle care app hands down.", ratings: [5, 5], date: "4 months ago" },
        { id: 8, name: "Lisa Wong", role: "Customer", text: "Great for tracking multiple vehicles in my family. The notifications for upcoming services are very helpful.", ratings: [5, 4, 5], date: "5 months ago" },
        { id: 9, name: "James Carter", role: "Customer", text: "An amazing collection of verified, high-quality garages. Accessing their services digitally is a breeze.", ratings: [5, 5, 5], date: "6 months ago" },
        { id: 10, name: "Sophie Turner", role: "Customer", text: "The garage recommendations are spot on. I've discovered so many great local mechanics.", ratings: [4, 4], date: "7 months ago" },
    ]);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
        }
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            // Using || 'http://localhost:5001' as a fallback if env var is not set
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await axios.get(`${apiUrl}/api/website-reviews`);
            const websiteReviews = response.data.filter(review => review.type === 'website');
            setApiReviews(websiteReviews);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedReview || isWriteReviewOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedReview, isWriteReviewOpen]);

    // Combine API reviews + remaining Demo reviews to maintain visibility
    // As per user request: "if a user submit 1 review than 1 demo review be removed"
    // This logic removes demo reviews from the FRONT (slice based on apiReviews length)
    // If apiReviews.length >= demoReviews.length, no demo reviews are shown.
    const displayedReviews = [...apiReviews, ...demoReviews.slice(apiReviews.length)];

    // Helper to calculate average rating
    const getAverageRating = (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((a, b) => a + b, 0);
        return Math.round(sum / ratings.length * 10) / 10; // Round to 1 decimal
    };

    const handleRateReview = async (reviewId, rating) => {
        // Check if it's an API review (has _id) or Demo review (has numeric id)
        const isApiReview = typeof reviewId === 'string'; // MongoIDs are strings

        if (isApiReview) {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                const response = await axios.patch(`${apiUrl}/api/website-reviews/${reviewId}/rate`, { rating });
                const updatedReview = response.data;

                setApiReviews(prevReviews =>
                    prevReviews.map(review => review._id === reviewId ? updatedReview : review)
                );

                // Force update selected review if open
                if (selectedReview && selectedReview._id === reviewId) {
                    setSelectedReview(updatedReview);
                }
            } catch (error) {
                console.error("Error rating review:", error);
                alert("Failed to rate review. Please try again.");
            }
        } else {
            // Rate Demo Review locally
            setDemoReviews(prevReviews =>
                prevReviews.map(review => {
                    if (review.id === reviewId) {
                        return { ...review, ratings: [...review.ratings, rating] };
                    }
                    return review;
                })
            );
            // Force update selected review if open to show new average immediately
            if (selectedReview && selectedReview.id === reviewId) {
                setSelectedReview(prev => ({
                    ...prev,
                    ratings: [...prev.ratings, rating]
                }));
            }
        }
    };

    const handleSubmitReview = async () => {
        setReviewSubmitting(true);

        const newReview = {
            user: user ? (user.id || user._id) : null,
            name: user?.name || "Guest",
            designation: "Customer",
            text: reviewText,
            type: "website",
            targetName: "VehicleeCare Website",
            ratings: reviewRating ? [reviewRating] : []
        };

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            await axios.post(`${apiUrl}/api/website-reviews`, newReview);
            setReviewSuccess('Review Submitted Successfully!');
            setTimeout(() => {
                setIsWriteReviewOpen(false);
                setReviewSuccess(null);
                setReviewText("");
                setReviewRating(0);
                setReviewHoverRating(0);
                fetchReviews();
            }, 2000);
        } catch (error) {
            console.error("Error submitting review:", error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error occurred";
            alert("Failed to submit review: " + errorMessage);
        } finally {
            setReviewSubmitting(false);
        }
    };

    // Split reviews into three rows for variety
    // Ensure we have enough items for marquee by duplicating if needed or just splitting
    const thirdPoint1 = Math.ceil(displayedReviews.length / 3);
    const thirdPoint2 = Math.ceil((displayedReviews.length * 2) / 3);
    const firstRow = displayedReviews.slice(0, thirdPoint1);
    const secondRow = displayedReviews.slice(thirdPoint1, thirdPoint2);
    const thirdRow = displayedReviews.slice(thirdPoint2);

    const ReviewCard = ({ review }) => {
        const avgRating = getAverageRating(review.ratings);

        return (
            <div
                onClick={() => setSelectedReview(review)}
                className="w-[85vw] sm:w-[350px] md:w-[400px] h-[290px] flex flex-col justify-between flex-shrink-0 bg-white border border-gray-100 p-5.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group cursor-pointer"
            >
                <Quote className="absolute top-6 right-6 text-gray-200 group-hover:text-indigo-200 transition-colors" size={32} />

                <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={14}
                            className={`${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                        />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">({avgRating})</span>
                </div>

                <p className="text-gray-700 leading-relaxed font-medium text-sm line-clamp-45">"{review.text}"</p>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shadow-inner flex-shrink-0">
                        {review.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase whitespace-nowrap">{review.name}</h4>
                        {/* <CheckCircle2 size={14} className="text-indigo-500 fill-indigo-50 flex-shrink-0" /> */}
                        <span className="text-gray-400">|</span>
                        <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold whitespace-nowrap">{review.designation || review.role || 'Customer'}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative bg-gray-50/50 min-h-[calc(100vh-80px)] pt-36 pb-12 overflow-hidden flex flex-col justify-between">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-[1215px] mx-auto px-6 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-4xl font-bold uppercase text-gray-900 mb-6 tracking-tight">
                        Community Reviews
                    </h2>
                </div>
            </div>

            {/* Marquee Section */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading reviews...</div>
            ) : displayedReviews.length > 0 ? (
                <div className="relative w-full max-w-[1215px] mx-auto space-y-6 overflow-hidden ">
                    {/* Row 1: Left to Right */}
                    <div className="flex overflow-hidden group gap-6 py-1">
                        <div className="flex animate-marquee gap-6">
                            {/* Duplicate for infinite loop if enough items, otherwise just show lists */}
                            {displayedReviews.length > 5 ? (
                                [...firstRow, ...firstRow, ...firstRow].map((review, i) => (
                                    <ReviewCard key={`r1-${i}`} review={review} />
                                ))
                            ) : (
                                displayedReviews.map((review, i) => (
                                    <ReviewCard key={`r1-${i}`} review={review} />
                                ))
                            )}
                        </div>
                        {displayedReviews.length > 5 && (
                            <div className="flex animate-marquee gap-6" aria-hidden="true">
                                {[...firstRow, ...firstRow, ...firstRow].map((review, i) => (
                                    <ReviewCard key={`r1-dup-${i}`} review={review} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Row 2: Right to Left (only if we have enough reviews for a second row) */}
                    {secondRow.length > 0 && (
                        <div className="flex overflow-hidden group gap-6 py-1">
                            <div className="flex animate-marquee-reverse gap-6">
                                {displayedReviews.length > 5 ? (
                                    [...secondRow, ...secondRow, ...secondRow].map((review, i) => (
                                        <ReviewCard key={`r2-${i}`} review={review} />
                                    ))
                                ) : (
                                    secondRow.map((review, i) => (
                                        <ReviewCard key={`r2-${i}`} review={review} />
                                    ))
                                )}
                            </div>
                            {displayedReviews.length > 5 && (
                                <div className="flex animate-marquee-reverse gap-6" aria-hidden="true">
                                    {[...secondRow, ...secondRow, ...secondRow].map((review, i) => (
                                        <ReviewCard key={`r2-dup-${i}`} review={review} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Row 3: Left to Right (only if we have enough reviews for a third row) */}
                    {/* {thirdRow.length > 0 && (
                        <div className="flex overflow-hidden group gap-6 py-4">
                            <div className="flex animate-marquee gap-6">
                                {displayedReviews.length > 5 ? (
                                    [...thirdRow, ...thirdRow, ...thirdRow].map((review, i) => (
                                        <ReviewCard key={`r3-${i}`} review={review} />
                                    ))
                                ) : (
                                    thirdRow.map((review, i) => (
                                        <ReviewCard key={`r3-${i}`} review={review} />
                                    ))
                                )}
                            </div>
                            {displayedReviews.length > 5 && (
                                <div className="flex animate-marquee gap-6" aria-hidden="true">
                                    {[...thirdRow, ...thirdRow, ...thirdRow].map((review, i) => (
                                        <ReviewCard key={`r3-dup-${i}`} review={review} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )} */}

                    {/* Gradient Masks for Fade edge effect */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">No reviews yet. Be the first to write one!</div>
            )}

            {/* Write a Review Button */}
            <div className="text-center mt-auto pt-7 relative z-10 w-full mb-8">
                <button
                    onClick={() => {
                        const section = document.getElementById('reviews');
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth' });
                            setTimeout(() => {
                                setIsWriteReviewOpen(true);
                            }, 500);
                        } else {
                            setIsWriteReviewOpen(true);
                        }
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 uppercase bg-gray-900 hover:bg-black text-white text-sm rounded-xl font-semibold shadow-lg shadow-gray-900/20 transition-all"
                >
                    <User size={18} />
                    Write a Review
                </button>
            </div>

            {selectedReview && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedReview(null)} />
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-7 py-5 bg-white border-b border-gray-100 flex items-center justify-center relative">
                            <h3 className="text-2xl font-semibold text-[#011023] uppercase tracking-wider">Review Details</h3>
                            <button 
                                onClick={() => setSelectedReview(null)}
                                className="absolute right-7 text-gray-400 hover:text-gray-900 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-7">
                            {/* Name and Rating in same line */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shadow-inner flex-shrink-0">
                                        {selectedReview.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg uppercase font-semibold text-[#011023]">{selectedReview.name}</h3>
                                            <CheckCircle size={16} className="text-blue-500" />
                                        </div>
                                        <p className="text-[13px] text-gray-500 uppercase tracking-wider font-semibold">{selectedReview.designation || selectedReview.role || 'Customer'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => handleRateReview(selectedReview._id || selectedReview.id, star)}
                                                className="hover:scale-110 transition-transform focus:outline-none"
                                            >
                                                <Star
                                                    size={18}
                                                    className={`${star <= Math.round(getAverageRating(selectedReview.ratings)) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                                        Rate It! ({getAverageRating(selectedReview.ratings)}/5)
                                    </p>
                                </div>
                            </div>

                            {/* Review Text */}
                            <div className="bg-gray-50/50 border border-gray-100 pt-6 pb-5 rounded-2xl mb-6 relative">
                                {/* <Quote className="absolute top-4 right-4 text-gray-100" size={32} /> */}
                                <p className="text-gray-700 text-[15px] leading-relaxed font-medium relative z-10">"{selectedReview.text}"</p>
                            </div>

                            {/* Date */}
                            <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Posted on {selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString() : selectedReview.date || 'Recently'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            , document.body)}

            {isWriteReviewOpen && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !reviewSubmitting && setIsWriteReviewOpen(false)} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-blue-50 border-b border-blue-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-blue-600 uppercase tracking-wider">Write a Review</h3>
                            <button 
                                onClick={() => setIsWriteReviewOpen(false)}
                                className="absolute right-7 text-blue-400 hover:text-blue-600 rounded-xl transition-colors"
                                disabled={reviewSubmitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {reviewSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                                        <CheckCircle size={32} className="text-green-500" />
                                    </div>
                                    <p className="text-lg font-bold text-[#011023] text-center uppercase tracking-tight">{reviewSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[14.5px] uppercase font-semibold text-blue-700">
                                                Reviewing: <span className="font-bold text-[#052558]">VehicleeCare Website</span>
                                            </p>
                                            <p className="text-[13px] text-blue-500 mt-1 flex items-center gap-1">
                                                <User size={14} />
                                                Posting as <span className="font-semibold uppercase">{user?.name || "Guest"}</span> (ID: {user?.userId || user?._id || user?.id || "N/A"})
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center border-y border-gray-100">
                                            <p className="text-[12.5px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rate your experience</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        disabled={reviewSubmitting}
                                                        className=" hover:scale-110"
                                                        onMouseEnter={() => setReviewHoverRating(star)}
                                                        onMouseLeave={() => setReviewHoverRating(0)}
                                                        onClick={() => setReviewRating(star)}
                                                    >
                                                        <Star 
                                                            size={24} 
                                                            className={`transition-all duration-200 ${
                                                                (reviewHoverRating || reviewRating) >= star 
                                                                ? "text-yellow-400 fill-yellow-400 drop-shadow-xs" 
                                                                : "text-gray-200"
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-left">
                                        <label className="text-[14.25px] pl-1 font-semibold text-[#052558] uppercase tracking-wider flex items-center justify-between">
                                            <span>Share your experience</span>
                                        </label>
                                        <textarea 
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 mt-3 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/10 transition-all resize-none font-medium text-gray-700 shadow-sm"
                                            disabled={reviewSubmitting}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {!reviewSuccess && (
                            <div className="px-6 pb-6 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    onClick={() => setIsWriteReviewOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={reviewSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSubmitReview}
                                    disabled={reviewSubmitting || !reviewText.trim() || reviewRating === 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#052558]/90 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0a3a82] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {reviewSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <PenSquare size={16} />
                                            Submit Review
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default Reviews;
