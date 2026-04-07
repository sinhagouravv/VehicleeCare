import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, Quote } from 'lucide-react';

const Reviews = () => {
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Filtered/Mock data for employee
    const fetchReviews = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            
            // For now, since there's no specific employee review API, 
            // we'll show high-fidelity mock data that represents feedback 
            // they would receive for their assignments.
            const mockReviews = [
                { id: 1, customer: "Sarah Jenkins", car: "Honda City", date: "Oct 24, 2023", rating: 5, comment: "The technician was very professional. My Honda City feels like new after the service. High-quality work!", serviceId: "64A5B22" },
                { id: 2, customer: "Michael Chen", car: "Toyota Innova", date: "Oct 22, 2023", rating: 4, comment: "Good experience. The support staff was helpful and the service was efficient. Would recommend.", serviceId: "64B7C33" },
                { id: 3, customer: "Rahul Sharma", car: "Hyundai Creta", date: "Oct 20, 2023", rating: 5, comment: "I'm very satisfied with the AC servicing. The team did a great job explaining the issues and fixing them.", serviceId: "64C9D44" },
                { id: 4, customer: "Priya Patel", car: "Maruti Swift", date: "Oct 18, 2023", rating: 5, comment: "Prompt service and transparent pricing. The technician handled the car with care.", serviceId: "64D1E55" },
            ];

            // Wait a bit to simulate API
            await new Promise(resolve => setTimeout(resolve, 600));
            
            setReviews(mockReviews);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Fetch reviews failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        const interval = setInterval(() => fetchReviews(true), 10000);
        return () => clearInterval(interval);
    }, []);

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                    <Star
                        key={index}
                        size={16}
                        className={index < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto pb-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Assignment Feedback</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {loading && reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 size={32} className="animate-spin text-[#527FB0]" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Collecting Feedback...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                        <div 
                            key={review.id} 
                            className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] hover:shadow-lg transition-all duration-300 relative group"
                        >
                            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Quote size={40} className="text-[#052558]" />
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#052558] to-[#527FB0] flex items-center justify-center text-white font-black text-lg shadow-sm">
                                    {review.customer.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-[#011023] uppercase text-sm tracking-tight">{review.customer}</h4>
                                        <div className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm border border-emerald-100">
                                            #{review.serviceId}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{review.car}</p>
                                        <span className="text-gray-300">•</span>
                                        <p className="text-[11px] text-gray-400 font-medium uppercase">{review.date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-50 relative overflow-hidden">
                                <div className="mb-3">
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-[#052558] text-sm leading-relaxed font-medium">
                                    "{review.comment}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reviews;
