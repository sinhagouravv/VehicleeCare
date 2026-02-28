import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, User, Mail, Phone, ArrowLeft, CheckCircle2, Factory, Zap, Car, Briefcase } from 'lucide-react';
import axios from 'axios';

const BUSINESS_CATEGORIES = [
    { id: 'garage', title: 'Service Garage', icon: <Briefcase size={20} />, desc: 'Auto repair, detailing, mechanics' },
    { id: 'charging', title: 'Charging Station', icon: <Zap size={20} />, desc: 'EV charging infrastructure' },
    { id: 'parking', title: 'Parking Lot', icon: <MapPin size={20} />, desc: 'Commercial parking facilities' },
    { id: 'store', title: 'Parts Store', icon: <Car size={20} />, desc: 'Spare parts and accessories retail' },
];

const RegistrationForm = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        businessCategory: '',
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        state: '',
        district: '',
        address: '',
        taxId: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (step === 1 && !formData.businessCategory) {
            setError('Please select a business category to continue.');
            return;
        }
        setError('');
        setStep(s => s + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Actually hit the backend endpoint
            await axios.post('http://localhost:5001/api/business-requests', formData);

            setIsSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#011023] mb-3">Application Submitted!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Thank you for your interest in partnering with VehicleeCare. Our onboarding team will review your application and get back to you within 24-48 hours.
                    </p>
                    <Link to="/" className="inline-block w-full bg-[#011023] hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="flex justify-center mb-6">
                    <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#011023]">
                        VehicleeCare <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Business</span>
                    </Link>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-[#011023]">
                    Partner Application
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                    Step {step} of 3
                </p>

                {/* Progress Bar */}
                <div className="mt-6 max-w-sm mx-auto flex items-center justify-center gap-2">
                    <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-6">

                        {/* STEP 1: CATEGORY SELECTION */}
                        {step === 1 && (
                            <div className="animate-[fadeIn_0.3s_ease-out]">
                                <h3 className="text-lg font-bold text-[#011023] mb-4">What type of business do you operate?</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {BUSINESS_CATEGORIES.map(category => (
                                        <div
                                            key={category.id}
                                            onClick={() => { setFormData({ ...formData, businessCategory: category.id }); setError(''); }}
                                            className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${formData.businessCategory === category.id
                                                ? 'border-blue-600 bg-blue-50/50'
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${formData.businessCategory === category.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {category.icon}
                                            </div>
                                            <h4 className="font-bold text-[#011023]">{category.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-snug">{category.desc}</p>

                                            {formData.businessCategory === category.id && (
                                                <div className="absolute top-4 right-4 text-blue-600">
                                                    <CheckCircle2 size={20} className="fill-blue-100" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: BASIC DETAILS */}
                        {step === 2 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] space-y-5">
                                <h3 className="text-lg font-bold text-[#011023] mb-4">Tell us about your business</h3>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business / Legal Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input type="text" name="businessName" required value={formData.businessName} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm"
                                            placeholder="Acme Auto Services" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Owner / Contact Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm"
                                            placeholder="John Doe" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm"
                                                placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm"
                                                placeholder="+91 98765 43210" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: LOCATION DETAILS */}
                        {step === 3 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] space-y-5">
                                <h3 className="text-lg font-bold text-[#011023] mb-4">Where are you located?</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                                        <input type="text" name="state" required value={formData.state} onChange={handleChange}
                                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm"
                                            placeholder="Punjab" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">District / City</label>
                                        <input type="text" name="district" required value={formData.district} onChange={handleChange}
                                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm"
                                            placeholder="Jalandhar" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <MapPin className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <textarea name="address" required rows={3} value={formData.address} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm resize-none"
                                            placeholder="Shop No 12, Main Market..." />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tax / GST Number (Optional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Factory className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input type="text" name="taxId" value={formData.taxId} onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors sm:text-sm uppercase"
                                            placeholder="22AAAAA0000A1Z5" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Nav Buttons */}
                        <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(s => s - 1)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-[#011023] font-semibold transition-colors px-2 py-2"
                                >
                                    <ArrowLeft size={18} /> Back
                                </button>
                            ) : (
                                <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors px-2 py-2">
                                    <ArrowLeft size={18} /> Cancel
                                </Link>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex justify-center py-3 px-8 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
                            >
                                {step === 3
                                    ? isSubmitting ? 'Submitting...' : 'Submit Application'
                                    : 'Continue'
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;
