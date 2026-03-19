import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';

const Reviews = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastRefreshed(new Date());
        }, 5000);
        setLastRefreshed(new Date());
        return () => clearInterval(timer);
    }, []);

    // Mock Data
    const reviews = [
        { id: 1, customer: "Sarah J.", car: "Honda City", date: "Oct 24, 2023", rating: 5, comment: "Excellent service! They picked up my car on time and returned it looking brand new. The full synthetic oil change was reasonably priced." },
        { id: 2, customer: "Michael C.", car: "Toyota Innova", date: "Oct 22, 2023", rating: 4, comment: "Good experience overall. The brake pad replacement took a bit longer than estimated, but the staff was very communicative throughout the process." },
        { id: 3, customer: "Rahul S.", car: "Hyundai Creta", date: "Oct 20, 2023", rating: 5, comment: "I've been bringing my cars here for years. Always honest, transparent pricing and top-notch work. Highly recommend their AC servicing." },
        { id: 4, customer: "Priya P.", car: "Maruti Swift", date: "Oct 18, 2023", rating: 3, comment: "Service was okay. The alignment is fine now, but the waiting area could use some better coffee." },
    ];

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
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Customer Reviews</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(5,37,88,0.03)] hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#052558] font-bold text-lg">
                                    {review.customer.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#011023]">{review.customer}</h4>
                                    <p className="text-xs font-semibold text-gray-500">{review.car} • {review.date}</p>
                                </div>
                            </div>
                            <div>
                                {renderStars(review.rating)}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                            <MessageSquare size={14} className="inline-block mr-2 text-blue-400 -mt-1" />
                            {review.comment}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reviews;
