import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Zap, Crown, Minus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRazorpay } from 'react-razorpay';

const Pricing = () => {
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const { error, isLoading, Razorpay } = useRazorpay();
    const navigate = useNavigate();
    const [loadingPlan, setLoadingPlan] = useState(null);

    useEffect(() => {
        if (isCompareModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCompareModalOpen]);

    const handleSelectPlan = async (plan) => {
        const token = localStorage.getItem('businessToken');
        const userStr = localStorage.getItem('businessUser');

        if (!token || !userStr) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userStr);
        setLoadingPlan(plan.name);

        try {
            // Price is string like "₹199"
            const amount = parseInt(plan.price.replace('₹', '').trim(), 10);

            // 1. Create order
            const orderRes = await fetch('http://localhost:5001/api/subscriptions/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planId: plan.name,
                    amount: amount
                })
            });
            const orderData = await orderRes.json();

            if (!orderData.success) {
                alert('Error creating order: ' + orderData.message);
                setLoadingPlan(null);
                return;
            }

            // 2. Initialize Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "VehicleeCare Business",
                description: `${plan.name} Plan Subscription`,
                order_id: orderData.order.id,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch('http://localhost:5001/api/subscriptions/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: plan.name
                            })
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            alert(`Successfully subscribed to ${plan.name} plan!\nPayment ID: ${verifyData.paymentId}`);
                            // Update local storage user
                            const updatedUser = { ...user, subscriptionPlan: plan.name, subscriptionStatus: 'active' };
                            localStorage.setItem('businessUser', JSON.stringify(updatedUser));
                            // Redirect to dashboard and force reload to update Navbar/Home states
                            window.location.href = '/';
                        } else {
                            alert('Payment verification failed');
                        }
                    } catch (err) {
                        alert('Error verifying payment');
                    }
                },
                prefill: {
                    name: user.name || user.businessName || '',
                    email: user.email || ''
                },
                theme: {
                    color: "#052558"
                }
            };

            const rzp = new Razorpay(options);

            // Handle payment failure event
            rzp.on('payment.failed', function (response) {
                console.error(response.error);
                alert('Payment failed: ' + response.error.description);
            });

            rzp.open();

        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Something went wrong processing your subscription");
        } finally {
            setLoadingPlan(null);
        }
    };

    const plans = [
        {
            name: "Basic",
            icon: <Shield size={32} className="text-[#527FB0]" />,
            description: "Perfect for independent garages just getting started.",
            price: "₹99",
            billing: "/ month",
            buttonText: "Choose Plan",
            buttonVariant: "outline",
            features: [
                { text: "1 Business Listing", included: true },
                { text: "Appear in Search Results", included: true },
                { text: "Basic Business Profile Page", included: true },
                { text: "Upload up to 5 Photos", included: true },
                { text: "Customer Inquiry Access", included: true },
                { text: "Application Status Tracking", included: true },
                { text: "Email Support", included: true },
                { text: "Business Hours Display", included: true },
                { text: "Google Maps Location Integration", included: true }

            ]
        },
        {
            name: "Premium",
            icon: <Zap size={32} className="text-white" />,
            description: "Everything you need to grow your business.",
            price: "₹199",
            billing: "/ month",
            buttonText: "Choose Plan",
            buttonVariant: "solid",
            highlighted: true,
            features: [
                { text: "Up to 3 Business Listings", included: true },
                { text: "Featured Badge on Profile", included: true },
                { text: "Higher Search Ranking", included: true },
                { text: "Upload up to 15 Photos", included: true },
                { text: "Basic Analytics (Views & Clicks)", included: true },
                { text: "WhatsApp Lead Integration", included: true },
                { text: "Priority Email Support", included: true },
                { text: "Lead Response Insights", included: true },
                { text: "Customer Reviews & Ratings Management", included: true }
            ]
        },
        {
            name: "Elite",
            icon: <Crown size={32} className="text-[#527FB0]" />,
            description: "For multi-location franchises and large chains.",
            price: "₹299",
            billing: "/ month",
            buttonText: "Choose Plan",
            buttonVariant: "outline",
            features: [
                { text: "More than 5 Business Listings", included: true },
                { text: "Top Search Placement", included: true },
                { text: "Recommended Partner Badge", included: true },
                { text: "Automated Marketing Tools", included: true },
                { text: "Advanced Analytics & Reports", included: true },
                { text: "Booking & Lead Management System", included: true },
                { text: "Dedicated Phone Support", included: true },
                { text: "Homepage Featured Spotlight", included: true },
                { text: "Reduced Platform Commission", included: true }
            ]
        }
    ];

    const comparisonData = [
        { feature: "Business Listings", basic: "1 Listing", premium: "Up to 3 Listings", elite: "Unlimited Listings" },
        { feature: "Search Visibility", basic: "Standard", premium: "Higher Ranking", elite: "Top Placement" },
        { feature: "Featured Badge", basic: false, premium: true, elite: true },
        { feature: "Recommended Badge", basic: false, premium: false, elite: true },
        { feature: "Profile Customization", basic: "Basic Info Only", premium: "Custom Description", elite: "Full Custom Branding" },
        { feature: "Photo Upload Limit", basic: "5 Photos", premium: "15 Photos", elite: "Unlimited Photos" },
        { feature: "Video Upload Support", basic: false, premium: false, elite: true },
        { feature: "Customer Lead Access", basic: true, premium: "Priority", elite: "Priority + Managed" },
        { feature: "WhatsApp Integration", basic: false, premium: true, elite: true },
        { feature: "Booking Management", basic: false, premium: false, elite: "Full System" },
        { feature: "Analytics Dashboard", basic: false, premium: "Basic (Views/Clicks)", elite: "Advanced (Leads/Conversion)" },
        { feature: "Performance Reports", basic: false, premium: "Monthly Summary", elite: "Weekly Detailed Reports" },
        { feature: "Homepage Promotion", basic: false, premium: false, elite: "Rotational Feature" },
        { feature: "Commission Discount", basic: false, premium: false, elite: "Reduced Commission" },
        { feature: "Account Support Type", basic: "Email", premium: "Priority Email", elite: "Dedicated Phone Support" },
        { feature: "Smart Account Manager", basic: false, premium: false, elite: "Dedicated Manager" },
        { feature: "Early Access to Features", basic: false, premium: false, elite: true },
    ];

    return (
        <div id="pricing" className="min-h-screen bg-slate-50 py-16 relative overflow-hidden flex items-center">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/40 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/60 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h1 className="text-3xl md:text-4xl font-bold mt-5 mb-8 text-[#011023]">Pricing</h1>
                    <p className="text-base text-slate-600">
                        Whether you are an independent owner or a nation-wide franchise, VehicleeCare has a tier designed to scale your operations and maximize your revenue.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative -mt-1 rounded-3xl p-6 transition-all duration-300 ${plan.highlighted
                                ? 'bg-gradient-to-br from-[#011023] to-[#052558] text-white shadow-2xl scale-105 md:-mt-3'
                                : 'bg-white text-[#011023] shadow-lg border border-slate-100 hover:shadow-xl'
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="flex items-center uppercase gap-3 mb-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.highlighted ? 'bg-white/10' : 'bg-blue-50'
                                        }`}>
                                        {React.cloneElement(plan.icon, { size: 24 })}
                                    </div>
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                </div>
                                <p className={`text-xs h-8 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-6 flex items-baseline gap-1.5">
                                <span className="text-4xl font-black">{plan.price}</span>
                                {plan.billing !== 'forever' && (
                                    <span className={`text-xs font-medium ${plan.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                                        {plan.billing}
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                        {feature.included ? (
                                            <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${plan.highlighted ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#052558]'
                                                }`}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="mt-0.5 rounded-full p-0.5 shrink-0 bg-slate-100 text-slate-400">
                                                <X size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                        <span className={`text-xs ${!feature.included
                                            ? (plan.highlighted ? 'text-white/50 line-through' : 'text-slate-400 line-through')
                                            : (plan.highlighted ? 'text-white' : 'text-slate-700')
                                            }`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={loadingPlan === plan.name}
                                className={`w-full py-2.5 text-sm rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-70 ${plan.buttonVariant === 'solid'
                                    ? 'bg-white text-[#052558] hover:bg-gray-50 shadow-sm'
                                    : 'border-2 border-[#052558] text-[#052558] hover:bg-[#052558] hover:text-white'
                                    }`}
                            >
                                {loadingPlan === plan.name ? 'Processing...' : plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => setIsCompareModalOpen(true)}
                        className="inline-flex items-center gap-2 text-[#052558] font-semibold uppercase text-sm bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-xl transition-colors border border-blue-200"
                    >
                        Compare Plans Detailed
                    </button>
                </div>
            </div>

            {/* Compare Plans Modal */}
            {isCompareModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setIsCompareModalOpen(false)}
                >
                    <div
                        className="bg-white text-[#011023] rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col relative overflow-hidden border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-center relative p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-xl font-bold uppercase text-center flex items-center gap-2 text-[#052558]">Compare Plans Detailed</h2>
                            <button
                                onClick={() => setIsCompareModalOpen(false)}
                                className="absolute right-6 text-slate-400 hover:text-slate-700 transition-colors p-1"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-0 flex-1 mb-5">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="py-2.5 px-4 font-semibold text-slate-700 border-b border-slate-200 text-center">Feature</th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-700 border-b border-slate-200 min-w-[140px] text-center">
                                            <span className="flex items-center justify-center gap-1.5">Basic (₹99/mo)</span>
                                        </th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-700 border-b border-slate-200 min-w-[150px] text-center">
                                            <span className="flex items-center justify-center gap-1.5">Premium (₹199/mo)</span>
                                        </th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-700 border-b border-slate-200 min-w-[150px] text-center">
                                            <span className="flex items-center justify-center gap-1.5">Elite (₹299/mo)</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="h-5"></tr>
                                    {comparisonData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-2 px-4 text-[13px] font-medium text-slate-800 text-center">{row.feature}</td>

                                            <td className="py-2 px-4 text-[13px] text-slate-600 text-center">
                                                {typeof row.basic === 'boolean'
                                                    ? (row.basic ? <Check size={16} className="text-[#527FB0] mx-auto" strokeWidth={3} /> : <Minus size={16} className="text-slate-300 mx-auto" strokeWidth={3} />)
                                                    : row.basic}
                                            </td>

                                            <td className="py-2 px-4 text-[13px] text-slate-600 text-center">
                                                {typeof row.premium === 'boolean'
                                                    ? (row.premium ? <Check size={16} className="text-[#052558] mx-auto" strokeWidth={3} /> : <Minus size={16} className="text-slate-300 mx-auto" strokeWidth={3} />)
                                                    : row.premium}
                                            </td>

                                            <td className="py-2 px-4 text-[13px] text-slate-600 text-center">
                                                {typeof row.elite === 'boolean'
                                                    ? (row.elite ? <Check size={16} className="text-[#052558] mx-auto" strokeWidth={3} /> : <Minus size={16} className="text-slate-300 mx-auto" strokeWidth={3} />)
                                                    : row.elite}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pricing;
