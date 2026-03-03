import React, { useState, useEffect } from "react";
import { TestimonialsColumn } from "../components/ui/testimonials-columns-1";
import { motion } from "motion/react";
import { X, PenLine } from "lucide-react";

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
                    if (user._id || user.id) {
                        setBusinessUserId(user._id || user.id);
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
        if (!userName.trim() || !reviewText.trim()) {
            alert("Name and review text are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5001/api/business-reviews/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: userName,
                    role: userRole,
                    review: reviewText,
                    businessUserId: businessUserId
                })
            });

            const data = await response.json();
            if (data.success) {
                alert("Thank you! Your review has been submitted and is pending approval.");
                setIsModalOpen(false);
                setReviewText(""); // Clear text
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


                    <h2 className="text-4xl font-bold mt-5 text-[#011023]">
                        Reviews
                    </h2>
                    <p className="text-base text-slate-500 mt-4 leading-relaxed font-medium">
                        See how VehicleeCare is transforming auto businesses across the network from real verified partners.
                    </p>
                </motion.div>

                <div className="flex justify-center max-w-7xl mx-auto gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] h-[650px] overflow-hidden">
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

            {/* Review Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative border border-slate-100"
                    >
                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-2xl uppercase text-center align-center font-bold text-[#011023] tracking-tight">Write a Review</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Your Name</label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className={`w-full px-5 py-4 rounded-xl uppercase border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-slate-900 ${isLoggedIn ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'}`}
                                        disabled={isLoggedIn}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Role</label>
                                    <input
                                        type="text"
                                        value={userRole}
                                        readOnly
                                        className="w-full px-5 py-4 rounded-xl uppercase border border-slate-200 focus:outline-none transition-all bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm uppercase font-bold text-slate-700 mb-2">Your Review</label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all bg-slate-50 focus:bg-white h-40 resize-none font-medium text-slate-900 placeholder:text-slate-400"
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={isSubmitting}
                                className="px-8 py-3.5 rounded-xl font-bold bg-[#011023] hover:bg-[#021836] disabled:bg-slate-400 text-white shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </section>
    );
};

export default Reviews;
