import { Star, Quote, CheckCircle2, X, ThumbsUp, Send, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Reviews = () => {
    const [selectedReview, setSelectedReview] = useState(null);
    const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

    // User Context Logic
    const [user, setUser] = useState(null);
    const [apiReviews, setApiReviews] = useState([]);
    const [loading, setLoading] = useState(true);

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
            setApiReviews(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setLoading(false);
        }
    };

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

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const newReview = {
            user: user ? (user.id || user._id) : null, // Support both id and _id from current user object
            name: formData.get('name'), // Use custom name or auto-filled
            designation: "Customer",
            text: formData.get('text'),
            ratings: [] // Initialize empty
        };

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            await axios.post(`${apiUrl}/api/website-reviews`, newReview);
            setIsWriteReviewOpen(false);
            alert('Thank you for your review! It will be published once approved.');
        } catch (error) {
            console.error("Error submitting review:", error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error occurred";
            alert(`Failed to submit review: ${errorMessage}\nPlease try again.`);
        }
    };

    // Split reviews into two rows for variety
    // Ensure we have enough items for marquee by duplicating if needed or just splitting
    const midpoint = Math.ceil(displayedReviews.length / 2);
    const firstRow = displayedReviews.slice(0, midpoint);
    const secondRow = displayedReviews.slice(midpoint);

    const ReviewCard = ({ review }) => {
        const avgRating = getAverageRating(review.ratings);

        return (
            <div
                onClick={() => setSelectedReview(review)}
                className="w-[85vw] sm:w-[350px] md:w-[400px] h-[280px] flex flex-col justify-between flex-shrink-0  bg-white/70 backdrop-blur-md border border-white/40 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative group cursor-pointer"
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

                <p className="text-gray-700 leading-relaxed mb-6 font-medium text-sm line-clamp-3">"{review.text}"</p>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shadow-inner flex-shrink-0">
                        {review.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm whitespace-nowrap">{review.name}</h4>
                        <CheckCircle2 size={14} className="text-indigo-500 fill-indigo-50 flex-shrink-0" />
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">{review.designation || review.role || 'Customer'}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative bg-gray-50/50 min-h-[calc(100vh-80px)] pt-24 pb-12 overflow-hidden flex flex-col justify-between">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-[1215px] mx-auto px-6 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Community Reviews
                    </h2>
                </div>
            </div>

            {/* Marquee Section */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading reviews...</div>
            ) : displayedReviews.length > 0 ? (
                <div className="relative w-full max-w-7xl mx-auto space-y-8 overflow-hidden ">
                    {/* Row 1: Left to Right */}
                    <div className="flex overflow-hidden group gap-6">
                        <div className="flex animate-marquee group-hover:pause-on-hover gap-6">
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
                            <div className="flex animate-marquee group-hover:pause-on-hover gap-6" aria-hidden="true">
                                {[...firstRow, ...firstRow, ...firstRow].map((review, i) => (
                                    <ReviewCard key={`r1-dup-${i}`} review={review} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Row 2: Right to Left (only if we have enough reviews for a second row) */}
                    {secondRow.length > 0 && (
                        <div className="flex overflow-hidden group gap-6">
                            <div className="flex animate-marquee-reverse group-hover:pause-on-hover gap-6">
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
                                <div className="flex animate-marquee-reverse group-hover:pause-on-hover gap-6" aria-hidden="true">
                                    {[...secondRow, ...secondRow, ...secondRow].map((review, i) => (
                                        <ReviewCard key={`r2-dup-${i}`} review={review} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gradient Masks for Fade edge effect */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">No reviews yet. Be the first to write one!</div>
            )}

            {/* Write a Review Button */}
            <div className="text-center mt-auto pt-10 relative z-10 w-full mb-8">
                <button
                    onClick={() => setIsWriteReviewOpen(true)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-1"
                >
                    <User size={18} />
                    Write a Review
                </button>
            </div>

            {/* Review Detail Modal */}
            {selectedReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedReview(null)}>
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedReview(null)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl shadow-inner">
                                {selectedReview.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-900">{selectedReview.name}</h3>
                                    <CheckCircle2 size={16} className="text-indigo-500 fill-indigo-50" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">{selectedReview.designation || selectedReview.role || 'Customer'}</p>
                            </div>
                        </div>

                        {/* Rate this Review Section */}
                        <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">Rate this review</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRateReview(selectedReview._id || selectedReview.id, star)}
                                        className="hover:scale-110 transition-transform focus:outline-none"
                                    >
                                        <Star
                                            size={24}
                                            className={`${star <= Math.round(getAverageRating(selectedReview.ratings)) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2 font-medium">
                                Average Rating: {getAverageRating(selectedReview.ratings)} / 5 ({selectedReview.ratings.length} votes)
                            </p>
                        </div>

                        <p className="text-gray-700 text-lg leading-relaxed mb-6">"{selectedReview.text}"</p>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                            <span className="text-sm text-gray-400 font-medium">
                                {selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString() : selectedReview.date || 'Recently'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Write Review Modal */}
            {isWriteReviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsWriteReviewOpen(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsWriteReviewOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Share Your Experience</h3>
                            <p className="text-gray-500">Tell us about your journey with VehicleeCare</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmitReview}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white cursor-not-allowed focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                                        placeholder="John Doe"
                                        defaultValue={user ? user.name : ''}
                                        readOnly={!!user}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Designation</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed outline-none"
                                        value="Customer"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Review</label>
                                <textarea name="text" rows="6" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none resize-none" required></textarea>
                            </div>

                            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                <Send size={18} />
                                Submit Review
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;
