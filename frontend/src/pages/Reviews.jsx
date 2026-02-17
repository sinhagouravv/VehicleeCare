import React from 'react';
import { Star, Quote } from 'lucide-react';

const Reviews = () => {
    const reviews = [
        { name: "Sarah Johnson", role: "Car Owner", rating: 5, text: "Absolutely fantastic service! The mechanic arrived on time and fixed my brake issue right in my driveway. Saved me so much time.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" },
        { name: "Michael Chen", role: "Business Professional", rating: 5, text: "I love the transparency. They explained exactly what needed to be done and the price was exactly what they quoted. No surprises.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150" },
        { name: "Emily Davis", role: "Student", rating: 4, text: "Very convenient service. The app is easy to use and booking an appointment was a breeze. Highly recommended for busy people.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150" },
    ];

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-primary-dark mb-4">Customer Stories</h1>
                    <p className="text-gray-600">See what our community has to say about their experience.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative">
                            <Quote className="absolute top-8 right-8 text-light-blue w-12 h-12 opacity-50" />
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className={`${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-8 leading-relaxed relative z-10">"{review.text}"</p>
                            <div className="flex items-center gap-4">
                                <img src={review.image} alt={review.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-light-blue" />
                                <div>
                                    <h4 className="font-bold text-primary-dark">{review.name}</h4>
                                    <p className="text-xs text-gray-500">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reviews;
