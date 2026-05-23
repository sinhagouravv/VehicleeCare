import React, { useState, useEffect } from "react";
import { TestimonialsColumn } from "../components/ui/testimonials-columns-1";
import { motion } from "motion/react";
import { X, PenLine, Star, CheckCircle, User, PenSquare, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

const testimonials = [
    {
        text: "This platform revolutionized our operations, streamlining service requests and inventory. The network keeps our garage productive.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop",
        name: "Briana Patton",
        role: "Garage Owner",
    },
    {
        text: "Implementing this system was smooth and quick. The customizable, user-friendly interface made technician training effortless.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop",
        name: "Bilal Ahmed",
        role: "Service Manager",
    },
    {
        text: "The real-time tracking is exceptional, guiding us through daily jobs and providing ongoing assistance, ensuring customer satisfaction.",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&auto=format&fit=crop",
        name: "Saman Malik",
        role: "EV Station Operator",
    },
    {
        text: "VehicleeCare's seamless integration enhanced our auto parts delivery network and efficiency. Highly recommend for its intuitive interface.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
        name: "Omar Raza",
        role: "Parts Supplier",
    },
    {
        text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient in managing parking slots.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
        name: "Zainab Hussain",
        role: "Parking Facility Manager",
    },
    {
        text: "The smooth onboarding exceeded expectations. It streamlined dispatching mechanics, improving our overall business performance.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
        name: "Aliza Khan",
        role: "Fleet Coordinator",
    },
    {
        text: "Our business functions improved with a user-friendly setup and positive customer feedback from stranded drivers.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        name: "Farhan Siddiqui",
        role: "Tow Truck Operator",
    },
    {
        text: "They delivered a solution that exceeded expectations, understanding our needs as a large auto repair chain.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
        name: "Sana Sheikh",
        role: "Regional Director",
    },
    {
        text: "Using this platform, our online presence and daily bookings significantly improved, boosting our garage's revenue.",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&auto=format&fit=crop",
        name: "Hassan Ali",
        role: "Shop Owner",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Reviews = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(null);
    const [reviewHoverRating, setReviewHoverRating] = useState(0);
    const [reviewRating, setReviewRating] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [businessUserId, setBusinessUserId] = useState(null);
    const [reviewsData, setReviewsData] = useState(testimonials); // Fallback to initial static data
    const userRole = "Vendor";

    useEffect(() => {
        // Fetch approved reviews
        const fetchReviews = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/business-reviews/approved');
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    // Map the backend data to match the component's expected format
                    const formattedReviews = data.data.map(r => ({
                        text: r.review,
                        // Provide a default image if none exist or use an abstract placeholder
                        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop",
                        name: r.name,
                        role: r.role
                    }));
                    // To keep the columns full, if there are very few reviews, loop them or just pad with static text
                    setReviewsData([...formattedReviews, ...testimonials].slice(0, 9));
                }
            } catch (error) {
                console.error("Failed to fetch reviews", error);
            }
        };

        fetchReviews();

        // Check logged in user
        const storedUser = localStorage.getItem('businessUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user && user.name) {
                    setUserName(user.name);
                    setIsLoggedIn(true);
                    if (user.userId || user._id || user.id) {
                        setBusinessUserId(user.userId || user._id || user.id);
                    }
                }
            } catch (e) {
                console.error("Failed to parse user data");
            }
        }
    }, []);

    // Dynamically calculate columns
    const firstColumn = reviewsData.slice(0, Math.ceil(reviewsData.length / 3));
    const secondColumn = reviewsData.slice(Math.ceil(reviewsData.length / 3), Math.ceil((reviewsData.length / 3) * 2));
    const thirdColumn = reviewsData.slice(Math.ceil((reviewsData.length / 3) * 2));

    const handleSubmitReview = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5001/api/business-reviews/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: userName || "Guest",
                    role: userRole,
                    review: reviewText,
                    businessUserId: businessUserId,
                    ratings: reviewRating ? [reviewRating] : []
                })
            });

            const data = await response.json();
            if (data.success) {
                setReviewSuccess("Review Submitted Successfully!");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setReviewSuccess(null);
                    setReviewText("");
                    setReviewRating(0);
                    setReviewHoverRating(0);
                }, 2000);
            } else {
                alert(data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("An error occurred. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="bg-slate-50 py-24 relative overflow-hidden">
            <div className="container z-10 mx-auto px-4 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-6xl mx-auto text-center mb-12"
                >


                    <h2 className="text-4xl font-bold mt-6 text-[#011023]">
                        Reviews
                    </h2>
                    <p className="text-base text-slate-500 mt-4 leading-relaxed font-medium">
                        See how VehicleeCare is transforming auto businesses across the network from real verified partners.
                    </p>
                </motion.div>

                <div className="flex justify-center max-w-7xl mx-auto gap-6  [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] h-[650px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>

                <div className="mt-10 flex justify-center relative z-20">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative inline-flex items-center gap-3 px-7 py-3 bg-[#011023] hover:bg-[#021836] text-white rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <PenLine size={18} />
                            Write a Review
                        </span>
                    </button>
                </div>
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsModalOpen(false)} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-blue-50 border-b border-blue-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-blue-600 uppercase tracking-wider">Write a Review</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute right-7 text-blue-400 hover:text-blue-600 rounded-xl transition-colors"
                                disabled={isSubmitting}
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
                                                Reviewing: <span className="font-bold text-[#052558]">VehicleeCare Business</span>
                                            </p>
                                            <p className="text-[13px] text-blue-500 mt-1 flex items-center gap-1">
                                                <User size={14} />
                                                Posting as <span className="font-semibold uppercase">{userName || "Guest"}</span> (ID: {businessUserId || "N/A"})
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center border-y border-gray-100">
                                            <p className="text-[12.5px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rate your experience</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        disabled={isSubmitting}
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
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {!reviewSuccess && (
                            <div className="px-6 pb-6 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSubmitReview}
                                    disabled={isSubmitting || !reviewText.trim() || reviewRating === 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#052558]/90 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0a3a82] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isSubmitting ? (
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
        </section>
    );
};

export default Reviews;
