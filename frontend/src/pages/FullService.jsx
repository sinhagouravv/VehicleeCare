import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings, Droplet, Disc, Battery, Thermometer, ShieldCheck,
    ChevronRight, ChevronLeft, Car, User, Calendar, Clock, ChevronDown,
    CheckCircle, Loader, ArrowLeft, Phone, Mail, Edit, Fuel, Zap, Star,
    Wrench, Truck, Sparkles, Layers, Activity, Cpu, Gauge, Hammer,
    MapPin, CircleDollarSign, QrCode, CreditCard
} from 'lucide-react';

// ─── Service Data ────────────────────────────────────────────────────────────
// ─── Service Data ────────────────────────────────────────────────────────────
const SERVICE_DATA = {
    Petrol: [
        { category: "General Maintenance", options: ["Engine oil change", "Oil filter replacement", "Air filter replacement", "Spark plug replacement", "Multi-point vehicle inspection"] },
        { category: "Engine & Mechanical", options: ["Engine diagnostics", "Clutch repair", "Gearbox servicing", "Suspension repair", "Brake pad replacement"] },
        { category: "Fuel System", options: ["Fuel injector cleaning", "Throttle body cleaning", "Fuel pump inspection", "Fuel filter replacement", "Fuel line inspection"] },
        { category: "AC & Electrical", options: ["AC gas refill", "AC compressor repair", "Battery replacement", "Alternator repair", "Starter motor repair"] },
        { category: "Body & Exterior", options: ["Dent repair", "Scratch removal", "Bumper repair", "Panel repainting", "Windshield replacement"] },
        { category: "Cleaning & Detailing", options: ["Interior cleaning", "Exterior wash", "Full detailing", "Ceramic coating", "Dashboard polishing"] },
        { category: "Tyre & Wheel", options: ["Tyre replacement", "Wheel alignment", "Wheel balancing", "Puncture repair", "Tyre rotation"] },
        { category: "Inspection & Diagnostics", options: ["Computerized diagnostics", "Brake inspection", "Suspension check", "Battery health test", "Pre-purchase inspection"] },
        { category: "Battery & Charging", options: ["Battery testing", "Battery replacement", "Charging system inspection", "Wiring inspection", "Fuse replacement"] },
        { category: "Roadside Assistance", options: ["Towing service", "Jump start", "Flat tyre support", "Emergency fuel delivery", "Breakdown support"] },
    ],
    Diesel: [
        { category: "General Maintenance", options: ["Engine oil change", "Oil filter replacement", "Air filter replacement", "Diesel fuel filter replacement", "Multi-point vehicle inspection"] },
        { category: "Engine & Mechanical", options: ["Engine diagnostics", "Turbocharger inspection", "Clutch repair", "Gearbox servicing", "Brake pad replacement"] },
        { category: "Diesel Fuel System", options: ["Diesel injector cleaning", "Fuel pump inspection", "Fuel line cleaning", "Diesel filter replacement", "Common rail system check"] },
        { category: "AC & Electrical", options: ["AC gas refill", "AC compressor repair", "Battery replacement", "Alternator repair", "Starter motor repair"] },
        { category: "Body & Exterior", options: ["Dent repair", "Scratch removal", "Bumper repair", "Panel repainting", "Windshield replacement"] },
        { category: "Cleaning & Detailing", options: ["Interior cleaning", "Exterior wash", "Full detailing", "Ceramic coating", "Dashboard polishing"] },
        { category: "Tyre & Wheel", options: ["Tyre replacement", "Wheel alignment", "Wheel balancing", "Puncture repair", "Tyre rotation"] },
        { category: "Inspection & Diagnostics", options: ["Computerized diagnostics", "Turbo system check", "Brake inspection", "Suspension check", "Pre-purchase inspection"] },
        { category: "Battery & Charging", options: ["Battery testing", "Battery replacement", "Charging system inspection", "Wiring inspection", "Fuse replacement"] },
        { category: "Roadside Assistance", options: ["Towing service", "Jump start", "Flat tyre support", "Emergency fuel delivery", "Breakdown support"] },
    ],
    EV: [
        { category: "Battery System", options: ["Battery health diagnostics", "Battery cooling system check", "High-voltage battery inspection", "Battery pack replacement", "BMS check"] },
        { category: "Charging System", options: ["On-board charger inspection", "Charging port inspection", "Fast-charging system check", "Home charger installation", "Charging cable inspection"] },
        { category: "Motor & Powertrain", options: ["Electric motor diagnostics", "Controller inspection", "Power inverter inspection", "Regen braking check", "Drive shaft inspection"] },
        { category: "Electrical & Wiring", options: ["HV wiring inspection", "Fuse & relay check", "Low-voltage battery replacement", "Sensor diagnostics", "ECU diagnostics"] },
        { category: "Brake & Suspension", options: ["Brake pad replacement", "Brake fluid replacement", "Suspension repair", "Shock absorber inspection", "Wheel alignment"] },
        { category: "Cooling System", options: ["Battery cooling check", "Thermal management check", "Coolant level inspection", "Radiator inspection", "Cooling fan check"] },
        { category: "Software & Diagnostics", options: ["Software updates", "System recalibration", "Error code scanning", "Firmware updates", "Performance diagnostics"] },
        { category: "Body & Exterior", options: ["Dent repair", "Scratch removal", "Panel repainting", "Bumper repair", "Windshield replacement"] },
        { category: "Cleaning & Detailing", options: ["Interior cleaning", "Exterior wash", "Full detailing", "Ceramic coating", "Dashboard polishing"] },
        { category: "Tyre & Wheel", options: ["Tyre replacement", "Wheel alignment", "Wheel balancing", "Puncture repair", "Tyre rotation"] },
    ]
};

// Garage data structured by State > District > Garages
const GARAGE_DATA = {
    Punjab: {
        Jalandhar: [
            { id: 1, name: "Jalandhar City Hub", pickupDrop: ["Yes", "No"] },
            { id: 2, name: "Jalandhar North Point", pickupDrop: ["Yes", "No"] },
        ],
        Ludhiana: [
            { id: 3, name: "Ludhiana Garage", pickupDrop: ["Yes", "No"] },
            { id: 4, name: "Ludhiana South Hub", pickupDrop: ["Yes", "No"] },
        ],
        Amritsar: [
            { id: 5, name: "Amritsar Auto Works", pickupDrop: ["Yes", "No"] },
        ],
        Patiala: [
            { id: 6, name: "Patiala Auto Hub", pickupDrop: ["Yes", "No"] },
        ],
        Bathinda: [
            { id: 7, name: "Bathinda Service Zone", pickupDrop: ["Yes", "No"] },
        ],
        Phagwara: [
            { id: 8, name: "Phagwara Service Point", pickupDrop: ["Yes", "No"] },
        ],
    },
    Haryana: {
        Gurugram: [
            { id: 9, name: "Gurugram Auto Hub", pickupDrop: ["Yes", "No"] },
            { id: 10, name: "Cyber City Garage", pickupDrop: ["Yes", "No"] },
        ],
        Faridabad: [
            { id: 11, name: "Faridabad Service Point", pickupDrop: ["Yes", "No"] },
        ],
        Ambala: [
            { id: 12, name: "Ambala Auto Works", pickupDrop: ["Yes", "No"] },
        ],
    },
    Chandigarh: {
        Chandigarh: [
            { id: 13, name: "Chandigarh Workshop", pickupDrop: ["Yes", "No"] },
            { id: 14, name: "Sector 17 Garage", pickupDrop: ["Yes", "No"] },
        ],
    },
    Delhi: {
        "New Delhi": [
            { id: 15, name: "Connaught Place Hub", pickupDrop: ["Yes", "No"] },
            { id: 16, name: "Karol Bagh Auto Works", pickupDrop: ["Yes", "No"] },
        ],
        Dwarka: [
            { id: 17, name: "Dwarka Service Zone", pickupDrop: ["Yes", "No"] },
        ],
        Rohini: [
            { id: 18, name: "Rohini Auto Hub", pickupDrop: ["Yes", "No"] },
        ],
    },
};

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash on Delivery' },
    { id: 'netbanking', label: 'Net Banking' },
];

const TIME_SLOTS = ["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "1:00 PM - 3:00 PM", "3:00 PM - 5:00 PM", "5:00 PM - 7:00 PM", "7:00 PM - 9:00 PM"];
const YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i); // 2000-2025

// ─── Step Indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => {
    const steps = ["Vehicle", "Service", "Garage", "Schedule", "Details", "Review", "Checkout"];
    return (
        <div className="flex items-center justify-center gap-0 mb-4 overflow-x-auto pb-2">
            {steps.map((label, i) => {
                const idx = i + 1;
                const done = idx < current;
                const active = idx === current;
                return (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center min-w-[60px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                                ${done ? 'bg-[#052558] border-[#052558] text-white' :
                                    active ? 'bg-white border-[#527FB0] text-[#052558]' :
                                        'bg-white border-gray-200 text-gray-400'}`}>
                                {done ? <CheckCircle size={14} /> : idx}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${active ? 'text-[#052558]' : 'text-gray-400'}`}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-0.5 w-8 sm:w-16 mb-5 mx-1 transition-all ${done ? 'bg-[#052558]' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FullService = () => {
    const navigate = useNavigate();

    // Global State
    const [fuelType, setFuelType] = useState(null); // 'Petrol', 'Diesel', 'EV', 'Premium'
    const [showFuelMenu, setShowFuelMenu] = useState(false);

    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Helper to reset form on fuel change
    const switchFuelType = (type) => {
        setFuelType(type);
        setShowFuelMenu(false);
        setStep(1);
        setSelectedBrand('');
        setSelectedModel('');
        setSelectedYear('');
        setVehicleType('');
        setTransmission('');
        setVehicleNumber('');
        setVehicleNumber('');
        setSelectedServices({});
        setSelectedState('');
        setSelectedDistrict('');
        setSelectedGarage(null);
        setPickupDrop('');
        setPaymentMethod('');
    };

    // Step 1 – Vehicle Selection (from DB)
    const [carData, setCarData] = useState([]); // Array of { brand, models: [] }
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [transmission, setTransmission] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [carLoading, setCarLoading] = useState(false);

    // Step 2 – Service
    // Step 2 – Service
    const [selectedServices, setSelectedServices] = useState({}); // { category: 'selected option' }

    // Step 3 – Garage
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedGarage, setSelectedGarage] = useState(null);
    const [pickupDrop, setPickupDrop] = useState('');

    // Derived lists for dependent dropdowns
    const stateList = Object.keys(GARAGE_DATA);
    const districtList = selectedState ? Object.keys(GARAGE_DATA[selectedState] || {}) : [];
    const garageList = (selectedState && selectedDistrict) ? (GARAGE_DATA[selectedState]?.[selectedDistrict] || []) : [];
    const pickupDropOptions = selectedGarage ? (selectedGarage.pickupDrop || []) : [];

    // Step 4 – Schedule
    const [schedule, setSchedule] = useState({ date: '', time: '' });

    // Step 5 – Details
    const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '' });

    // Step 7 – Checkout
    const [paymentMethod, setPaymentMethod] = useState('');

    // Fetch cars when fuelType changes
    useEffect(() => {
        if (!fuelType || fuelType === 'Premium') return;

        const fetchCars = async () => {
            setCarLoading(true);
            try {
                const res = await fetch(`http://localhost:5001/api/cars/${fuelType.toLowerCase()}`);
                const result = await res.json();
                if (result.success) {
                    setCarData(result.data);
                    setBrands(result.data.map(c => c.brand));
                }
            } catch (err) {
                console.error("Error fetching cars:", err);
            } finally {
                setCarLoading(false);
            }
        };
        fetchCars();
    }, [fuelType]);

    // Update models when brand changes
    useEffect(() => {
        if (!selectedBrand) {
            setModels([]);
            return;
        }
        const brandData = carData.find(c => c.brand === selectedBrand);
        if (brandData) {
            setModels(brandData.models);
        } else {
            setModels([]);
        }
        setSelectedModel('');
    }, [selectedBrand, carData]);

    const handleScheduleChange = (e) => setSchedule(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleDetailChange = (e) => setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const bookingData = {
                user: details,
                vehicle: {
                    year: selectedYear,
                    make: selectedBrand,
                    model: selectedModel,
                    fuelType,
                    type: vehicleType,
                    transmission,
                    number: vehicleNumber
                },
                service: {
                    title: Object.values(selectedServices).join(', '),
                    price: "TBD" // Price depends on selection, pending backend logic
                },
                garage: {
                    name: selectedGarage?.name,
                    state: selectedState,
                    district: selectedDistrict,
                    pickupDrop
                },
                schedule,
                paymentMethod
            };

            const response = await fetch('http://localhost:5001/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) throw new Error('Booking failed');

            setSubmitted(true);
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Something went wrong! Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-white border-2 border-blue-100 rounded-lg focus:outline-none text-[#011023] text-sm font-semibold transition text-center uppercase disabled:opacity-50 disabled:cursor-not-allowed";
    const selectClass = `${inputClass} cursor-pointer appearance-none px-10`;

    // ── Success Screen ─────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-[fadeInScale_0.3s_ease-out]">
                    <div className="bg-gradient-to-r from-[#052558] to-[#527FB0] px-8 pt-10 pb-12 flex flex-col items-center relative">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center relative z-10">
                            <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                                <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                        {/* Decorative sparkles */}
                        <span className="absolute top-8 right-12 text-white/40 text-2xl">✨</span>
                        <span className="absolute bottom-6 left-10 text-white/30 text-xl">✦</span>
                    </div>
                    <div className="px-8 py-8 text-center">
                        <h2 className="text-2xl font-bold text-[#011023] mb-2">Booking Confirmed! 🎉</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            We've sent a confirmation to <span className="font-semibold text-[#011023]">{details.email || details.phone}</span>.
                        </p>

                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5 text-left space-y-3 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</span>
                                <span className="font-semibold text-[#011023] text-sm text-right">{selectedYear} {selectedBrand} {selectedModel} ({fuelType})</span>
                            </div>
                            <div className="h-px bg-blue-100 w-full" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Service</span>
                                <span className="font-semibold text-[#011023] text-sm text-right max-w-[60%] truncate">
                                    {Object.values(selectedServices).join(', ')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Slot</span>
                                <span className="font-semibold text-[#011023] text-sm">{schedule.date} at {schedule.time}</span>
                            </div>
                            <div className="h-px bg-blue-100 w-full" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-[#052558]">Total</span>
                                <span className="font-bold text-[#527FB0] text-lg">TBD</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} /> Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex flex-col">
            {/* Decorations */}
            <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-blue-100/40 blur-3xl rounded-full pointer-events-none -z-10" />
            <div className="fixed bottom-0 left-0 w-1/3 h-1/3 bg-blue-50/60 blur-3xl rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (fuelType) setFuelType(null); // Go back to fuel selection
                                else navigate('/#services');
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 text-[#052558] transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* Center Fuel Type Display */}
                    {fuelType && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                            <div className="relative">
                                <button
                                    onClick={() => setShowFuelMenu(!showFuelMenu)}
                                    className="bg-[#052558]/5 px-4 py-1.5 rounded-full border border-[#052558]/10 flex items-center gap-2 hover:bg-[#052558]/10 transition-colors"
                                >
                                    {fuelType === 'Petrol' && <Fuel size={14} className="text-[#052558]" />}
                                    {fuelType === 'Diesel' && <Fuel size={14} className="text-[#052558]" />}
                                    {fuelType === 'EV' && <Zap size={14} className="text-green-600" />}
                                    {fuelType === 'Premium' && <Star size={14} className="text-purple-600" />}
                                    <span className="text-xs font-bold text-[#052558] uppercase tracking-wide">{fuelType}</span>
                                </button>

                                {/* Dropdown Menu */}
                                {showFuelMenu && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white rounded-xl shadow-xl border border-blue-100 py-1 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                                        {['Petrol', 'Diesel', 'EV', 'Premium'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => switchFuelType(type)}
                                                className={`w-full px-4 py-2.5 text-xs font-bold uppercase flex items-center justify-center hover:bg-blue-50 transition-colors
                                                    ${fuelType === type ? 'text-[#052558] bg-blue-50/50' : 'text-gray-500'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3.5 pb-2">

                {/* ── Fuel Selection Step ── */}
                {!fuelType ? (
                    <div className="animate-[fadeIn_0.3s_ease-out] max-w-4xl mx-auto mt-4">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-[#011023] uppercase mb-3">Select Fuel Type</h2>
                            <p className="text-gray-500 uppercase">Choose your vehicle category to get started.</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4  gap-6">
                            {[
                                { type: 'PETROL', icon: <Fuel size={32} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                                { type: 'DIESEL', icon: <Fuel size={32} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                                { type: 'EV', icon: <Zap size={32} />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                                { type: 'PREMIUM', icon: <Star size={32} />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => setFuelType(item.type)}
                                    className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-white border-2 hover:border-[#052558] hover:shadow-xl transition-all duration-300 ${item.border}`}
                                >
                                    <div className={`w-16 h-16 rounded-full ${item.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm`}>
                                        <div className={item.color}>{item.icon}</div>
                                    </div>
                                    <span className="font-bold text-[#011023] text-lg">{item.type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : fuelType === 'Premium' ? (
                    <div className="flex flex-col items-center justify-center mt-20 animate-[fadeIn_0.3s_ease-out]">
                        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                            <Star size={48} className="text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#011023] mb-2">Premium Service</h2>
                        <p className="text-gray-500">Dedicated premium support is coming soon!</p>
                        <button onClick={() => setFuelType(null)} className="mt-8 text-[#527FB0] font-medium hover:underline">Choose another type</button>
                    </div>
                ) : (
                    <>
                        {/* ── Standard Booking Flow ── */}
                        <StepIndicator current={step} />

                        {/* ── Step 1: Select Vehicle ── */}
                        {step === 1 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-6xl mx-auto">
                                <h2 className="text-sm font-bold text-[#011023] text-center uppercase mb-5">Select your vehicle</h2>
                                {/* <p className="text-gray-500 text-sm mb-6">We'll use this to recommend services.</p> */}

                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
                                    {/* Brand (Make) */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide text-center">Brand</label>
                                        <div className="relative">
                                            <select
                                                value={selectedBrand}
                                                onChange={e => setSelectedBrand(e.target.value)}
                                                className={`${selectClass} text-center  text-xs uppercase font-semibold`}
                                                disabled={carLoading}
                                            >
                                                <option value=""></option>
                                                {brands.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={16} />
                                            {carLoading && !brands.length && (
                                                <Loader size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#527FB0]" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Model */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide text-center">Model</label>
                                        <div className="relative">
                                            <select
                                                value={selectedModel}
                                                onChange={e => setSelectedModel(e.target.value)}
                                                disabled={!selectedBrand}
                                                className={`${selectClass} text-center text-xs uppercase font-semibold`}
                                            >
                                                <option value=""></option>
                                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={16} />
                                        </div>
                                    </div>

                                    {/* Year */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide text-center">Year</label>
                                        <div className="relative">
                                            <select
                                                value={selectedYear}
                                                onChange={e => setSelectedYear(e.target.value)}
                                                className={`${selectClass} text-center text-xs uppercase font-bold`}
                                                disabled={!selectedModel}
                                            >
                                                <option value=""></option>
                                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={16} />
                                        </div>
                                    </div>

                                    {/* Vehicle Type */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide text-center">Type</label>
                                        <div className="relative">
                                            <select
                                                value={vehicleType}
                                                onChange={e => setVehicleType(e.target.value)}
                                                className={`${selectClass} text-center text-xs uppercase font-bold`}
                                                disabled={!selectedYear}
                                            >
                                                <option value=""></option>
                                                {['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={16} />
                                        </div>
                                    </div>

                                    {/* Transmission */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide text-center">Transmission</label>
                                        <div className="relative">
                                            <select
                                                value={transmission}
                                                onChange={e => setTransmission(e.target.value)}
                                                className={`${selectClass} text-center text-xs uppercase font-bold`}
                                                disabled={!vehicleType}
                                            >
                                                <option value=""></option>
                                                {['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={16} />
                                        </div>
                                    </div>

                                    {/* Vehicle Number */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide text-center">Number</label>
                                        <input
                                            value={vehicleNumber}
                                            onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                                            className={`${inputClass} text-center text-xs uppercase font-bold`}
                                            disabled={!transmission}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Choose Service ── */}
                        {step === 2 && (
                            <div className="animate-[fadeIn_0.3s_ease-out]  max-w-6xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Choose a service</h2>

                                {/* 10 Select Dropdowns Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {(SERVICE_DATA[fuelType] || SERVICE_DATA['Petrol']).map((item, index) => (
                                        <div key={index}>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center truncate" title={item.category}>
                                                {item.category}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={selectedServices[item.category] || ''}
                                                    onChange={e => setSelectedServices(prev => ({
                                                        ...prev,
                                                        [item.category]: e.target.value
                                                    }))}
                                                    className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                                >
                                                    <option value=""></option>
                                                    {item.options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Select Garage ── */}
                        {step === 3 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-5xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Select a Service Center</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* State */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">State</label>
                                        <div className="relative">
                                            <select
                                                value={selectedState}
                                                onChange={e => {
                                                    setSelectedState(e.target.value);
                                                    setSelectedDistrict('');
                                                    setSelectedGarage(null);
                                                    setPickupDrop('');
                                                }}
                                                className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                            >
                                                <option value=""></option>
                                                {stateList.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={14} />
                                        </div>
                                    </div>

                                    {/* District */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">District</label>
                                        <div className="relative">
                                            <select
                                                value={selectedDistrict}
                                                onChange={e => {
                                                    setSelectedDistrict(e.target.value);
                                                    setSelectedGarage(null);
                                                    setPickupDrop('');
                                                }}
                                                disabled={!selectedState}
                                                className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                            >
                                                <option value=""></option>
                                                {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={14} />
                                        </div>
                                    </div>

                                    {/* Garage */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Garage</label>
                                        <div className="relative">
                                            <select
                                                value={selectedGarage?.id || ''}
                                                onChange={e => {
                                                    const g = garageList.find(g => g.id === Number(e.target.value));
                                                    setSelectedGarage(g || null);
                                                    setPickupDrop('');
                                                }}
                                                disabled={!selectedDistrict}
                                                className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                            >
                                                <option value=""></option>
                                                {garageList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={14} />
                                        </div>
                                    </div>

                                    {/* Pickup & Drop */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Pickup &amp; Drop</label>
                                        <div className="relative">
                                            <select
                                                value={pickupDrop}
                                                onChange={e => setPickupDrop(e.target.value)}
                                                disabled={!selectedGarage}
                                                className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                            >
                                                <option value=""></option>
                                                {pickupDropOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 4: Schedule ── */}
                        {step === 4 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Make a Schedule</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Date */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Date</label>
                                        <div className="relative h-10">
                                            {/* Styled text display — auto-formats to DD/MM/YYYY */}
                                            <input
                                                type="text"
                                                placeholder="DD/MM/YYYY"
                                                maxLength={10}
                                                value={schedule.dateDisplay || ''}
                                                onChange={e => {
                                                    let v = e.target.value.replace(/[^0-9]/g, '');
                                                    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                                                    if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
                                                    setSchedule(prev => ({ ...prev, dateDisplay: v }));
                                                    // Parse to YYYY-MM-DD for internal value when complete
                                                    const parts = v.split('/');
                                                    if (parts.length === 3 && parts[2].length === 4) {
                                                        const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                                        setSchedule(prev => ({ ...prev, date: iso, dateDisplay: v }));
                                                    }
                                                }}
                                                className={`${inputClass} text-center text-[10.5px] uppercase font-bold py-2 pr-4 pl-4 h-10 w-full`}
                                            />
                                            {/* Hidden native date picker triggered by calendar icon */}
                                            <input
                                                type="date"
                                                tabIndex={-1}
                                                value={schedule.date || ''}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={e => {
                                                    const iso = e.target.value; // DD-MM-YYYY
                                                    if (!iso) return;
                                                    const [y, m, d] = iso.split('-');
                                                    setSchedule(prev => ({ ...prev, date: iso, dateDisplay: `${d}/${m}/${y}` }));
                                                }}
                                                className="absolute right-0 top-0 h-full w-8 opacity-0 cursor-pointer"
                                            />
                                            <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Time Slot */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Time Slot</label>
                                        <div className="relative">
                                            <select
                                                name="time"
                                                value={schedule.time}
                                                onChange={handleScheduleChange}
                                                className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                            >
                                                <option value=""></option>
                                                {TIME_SLOTS.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 5: Details ── */}
                        {step === 5 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-4xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Your Contact Details</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Full Name</label>
                                        <input
                                            name="name"
                                            value={details.name}
                                            onChange={handleDetailChange}
                                            required
                                            autoComplete="off"
                                            placeholder="John Doe"
                                            className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full`}
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Phone</label>
                                        <input
                                            name="phone"
                                            value={details.phone}
                                            onChange={handleDetailChange}
                                            required
                                            autoComplete="off"
                                            placeholder="+91 98765 43210"
                                            className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full`}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Email</label>
                                        <input
                                            name="email"
                                            value={details.email}
                                            onChange={handleDetailChange}
                                            autoComplete="off"
                                            placeholder="Optional"
                                            className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full`}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 6: Review ── */}
                        {step === 6 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-6xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Review Details</h2>

                                <div className="grid md:grid-cols-[375px] gap-6">
                                    {/* Left side – 5 review cards stacked */}
                                    <div className="flex flex-col gap-4">
                                        {/* Vehicle Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><Car size={18} /></div>
                                                <div>
                                                    <p className="text-[12px] text-gray-400 pb-1 uppercase font-semibold">Vehicle</p>
                                                    <p className="font-bold text-[#011023] pb-0.5 uppercase text-xs">{selectedBrand} {selectedModel} ({selectedYear})</p>
                                                    <p className="text-[10px] text-gray-500">{vehicleNumber} • {transmission}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Service Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><Settings size={18} /></div>
                                                <div>
                                                    <p className="text-[12px] text-gray-400 pb-1 uppercase font-semibold">Service</p>
                                                    <p className="font-bold text-[#011023] pb-0.5 uppercase text-xs">
                                                        {Object.values(selectedServices).filter(s => s).length > 0
                                                            ? Object.values(selectedServices).filter(s => s).map((s, i) => <span key={i} className="block">• {s}</span>)
                                                            : 'No service selected'}
                                                    </p>
                                                    {/* <p className="text-[10px] font-bold uppercase text-[#527FB0]">Price on Inspection</p> */}
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(2)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Garage Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><MapPin size={18} /></div>
                                                <div>
                                                    <p className="text-[12px] text-gray-400 pb-1 uppercase font-semibold">Service Center</p>
                                                    <p className="font-bold pb-0.5 uppercase text-[#011023] text-xs">{selectedGarage?.name}</p>
                                                    <p className="text-[10px] pb-0.5 uppercase text-gray-500">{selectedDistrict}, {selectedState}</p>
                                                    {pickupDrop && <p className="text-[10px] uppercase text-blue-500 font-medium">Pickup & Drop: {pickupDrop}</p>}
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(3)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Schedule Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><Calendar size={18} /></div>
                                                <div>
                                                    <p className="text-[12px] pb-1 text-gray-400 uppercase font-semibold">Date & Time</p>
                                                    <p className="font-bold text-[#011023] text-xs">
                                                        {schedule.dateDisplay || schedule.date} &nbsp;•&nbsp; {schedule.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(4)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Contact Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><User size={18} /></div>
                                                <div>
                                                    <p className="text-[12px] pb-1 text-gray-400 uppercase font-semibold">Customer</p>
                                                    <p className="font-bold pb-0.5 uppercase text-[#011023] text-xs">{details.name}</p>
                                                    <p className="text-[10px] uppercase text-gray-500">{details.phone}{details.email && ` • ${details.email}`}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(5)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>
                                    </div>

                                    {/* Right side – empty for now */}
                                    <div className="hidden md:block" />
                                </div>
                            </div>
                        )}

                        {/* ── Step 7: Checkout ── */}
                        {step === 7 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Checkout</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {PAYMENT_METHODS.map(method => (
                                        <div key={method.id}>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">
                                                {/* {method.label} */}
                                            </label>
                                            <button
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={`w-full h-10 text-center text-[10.5px] uppercase font-bold rounded-lg border transition-all
                                                    ${paymentMethod === method.id
                                                        ? 'bg-[#052558] text-white border-[#052558] shadow-md'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#527FB0] hover:text-[#052558]'}`}
                                            >
                                                {method.label}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sticky Footer Navigation - Conditional Render */}
            {fuelType && (
                <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-5 py-2.5 text-gray-600 font-semibold hover:text-[#052558] disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${step === 1 ? 'invisible' : ''}`}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        <div className="flex-1 flex justify-center text-sm font-medium text-gray-500">
                            {/* Optional: Add some status text or progress bar here if needed */}
                        </div>

                        {step < 7 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={
                                    (step === 1 && (!selectedBrand || !selectedModel || !selectedYear || !vehicleType || !transmission || vehicleNumber.length < 4)) ||
                                    (step === 2 && Object.values(selectedServices).filter(s => s).length === 0) ||
                                    (step === 3 && (!selectedGarage || !pickupDrop)) ||
                                    (step === 4 && (!schedule.date || !schedule.time)) ||
                                    (step === 5 && (!details.name || !details.phone)) ||
                                    submitting
                                }
                                className="flex items-center gap-2 px-8 py-3 bg-[#052558] text-white font-bold rounded-xl hover:bg-[#052558]/90 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !paymentMethod}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? <><Loader size={18} className="animate-spin" /> Confirming...</> : <>Confirm Booking <CheckCircle size={18} /></>}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FullService;