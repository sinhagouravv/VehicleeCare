import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import razorpay from 'razorpay';
import {
    Settings, Droplet, Disc, Battery, Thermometer, ShieldCheck,
    ChevronRight, ChevronLeft, Car, User, Calendar, Clock, ChevronDown,
    CheckCircle, ArrowLeft, Phone, Mail, Edit, Fuel, Zap, Star,
    Wrench, Truck, Sparkles, Layers, Activity, Cpu, Gauge, Hammer,
    MapPin, CircleDollarSign, QrCode, CreditCard
} from 'lucide-react';

// ─── Service Data ────────────────────────────────────────────────────────────
// ─── Service Data ────────────────────────────────────────────────────────────
const SERVICE_DATA = {
    Petrol: [
        { category: "General Maintenance", options: [{ id: "68I974R", name: "Engine oil change", price: 5 }, { id: "684G39Z", name: "Oil filter replacement", price: 5 }, { id: "68O41U9", name: "Air filter replacement", price: 5 }, { id: "68XR374", name: "Spark plug replacement", price: 5 }, { id: "68421AE", name: "Multi-point vehicle inspection", price: 5 }] },
        { category: "Engine & Mechanical", options: [{ id: "68P21D7", name: "Engine diagnostics", price: 5 }, { id: "68237AJ", name: "Clutch repair", price: 5 }, { id: "6819DV5", name: "Gearbox servicing", price: 5 }, { id: "681R7J2", name: "Suspension repair", price: 5 }, { id: "68M193Z", name: "Brake pad replacement", price: 5 }] },
        { category: "Fuel System", options: [{ id: "6827UJ1", name: "Fuel injector cleaning", price: 5 }, { id: "68ZW139", name: "Throttle body cleaning", price: 5 }, { id: "6895F4V", name: "Fuel pump inspection", price: 5 }, { id: "6845K7W", name: "Fuel filter replacement", price: 5 }, { id: "68V319H", name: "Fuel line inspection", price: 5 }] },
        { category: "AC & Electrical", options: [{ id: "681LD94", name: "AC gas refill", price: 5 }, { id: "6825X1P", name: "AC compressor repair", price: 5 }, { id: "6875W3G", name: "Battery replacement", price: 5 }, { id: "68E217Y", name: "Alternator repair", price: 5 }, { id: "68512EB", name: "Starter motor repair", price: 5 }] },
        { category: "Body & Exterior", options: [{ id: "6832M7P", name: "Dent repair", price: 5 }, { id: "684X91N", name: "Scratch removal", price: 5 }, { id: "687X23R", name: "Bumper repair", price: 5 }, { id: "68EA942", name: "Panel repainting", price: 5 }, { id: "68342GS", name: "Windshield replacement", price: 5 }] },
        { category: "Cleaning & Detailing", options: [{ id: "68DN473", name: "Interior cleaning", price: 5 }, { id: "68VY943", name: "Exterior wash", price: 5 }, { id: "68421OM", name: "Full detailing", price: 5 }, { id: "68N13C2", name: "Ceramic coating", price: 5 }, { id: "68972TW", name: "Dashboard polishing", price: 5 }] },
        { category: "Tyre & Wheel", options: [{ id: "68543MY", name: "Tyre replacement", price: 5 }, { id: "687I15A", name: "Wheel alignment", price: 5 }, { id: "68E37A2", name: "Wheel balancing", price: 5 }, { id: "685Y9A4", name: "Puncture repair", price: 5 }, { id: "68B2G71", name: "Tyre rotation", price: 5 }] },
        { category: "Inspection & Diagnostics", options: [{ id: "68479UG", name: "Computerized diagnostics", price: 5 }, { id: "68F521C", name: "Brake inspection", price: 5 }, { id: "68532GH", name: "Suspension check", price: 5 }, { id: "685U1P9", name: "Battery health test", price: 5 }, { id: "681X2D5", name: "Pre-purchase inspection", price: 5 }] },
        { category: "Battery & Charging", options: [{ id: "6841S2C", name: "Battery testing", price: 5 }, { id: "6812VD4", name: "Battery replacement", price: 5 }, { id: "6851A4H", name: "Charging system inspection", price: 5 }, { id: "687A9M5", name: "Wiring inspection", price: 5 }, { id: "68O723L", name: "Fuse replacement", price: 5 }] },
        { category: "Roadside Assistance", options: [{ id: "683BA21", name: "Towing service", price: 5 }, { id: "68471AH", name: "Jump start", price: 5 }, { id: "689I57A", name: "Flat tyre support", price: 5 }, { id: "6851DH7", name: "Emergency fuel delivery", price: 5 }, { id: "68H397A", name: "Breakdown support", price: 5 }] },
    ],
    Diesel: [
        { category: "General Maintenance", options: [{ id: "6857K4S", name: "Engine oil change", price: 5 }, { id: "68195UP", name: "Oil filter replacement", price: 5 }, { id: "6814KN3", name: "Air filter replacement", price: 5 }, { id: "685DP19", name: "Diesel fuel filter replacement", price: 5 }, { id: "68EF394", name: "Multi-point vehicle inspection", price: 5 }] },
        { category: "Engine & Mechanical", options: [{ id: "68279ZV", name: "Engine diagnostics", price: 5 }, { id: "6812W5N", name: "Turbocharger inspection", price: 5 }, { id: "68S419V", name: "Clutch repair", price: 5 }, { id: "68P5C97", name: "Gearbox servicing", price: 5 }, { id: "68251EC", name: "Brake pad replacement", price: 5 }] },
        { category: "Diesel Fuel System", options: [{ id: "682AK14", name: "Diesel injector cleaning", price: 5 }, { id: "68ON125", name: "Fuel pump inspection", price: 5 }, { id: "681XL94", name: "Fuel line cleaning", price: 5 }, { id: "68D12B9", name: "Diesel filter replacement", price: 5 }, { id: "68Y439N", name: "Common rail system check", price: 5 }] },
        { category: "AC & Electrical", options: [{ id: "684F7Q3", name: "AC gas refill", price: 5 }, { id: "68GQ754", name: "AC compressor repair", price: 5 }, { id: "68M32J4", name: "Battery replacement", price: 5 }, { id: "681C27M", name: "Alternator repair", price: 5 }, { id: "68BA715", name: "Starter motor repair", price: 5 }] },
        { category: "Body & Exterior", options: [{ id: "68H492A", name: "Dent repair", price: 5 }, { id: "68P4M73", name: "Scratch removal", price: 5 }, { id: "689A3B7", name: "Bumper repair", price: 5 }, { id: "681UG42", name: "Panel repainting", price: 5 }, { id: "68DR512", name: "Windshield replacement", price: 5 }] },
        { category: "Cleaning & Detailing", options: [{ id: "68G3R47", name: "Interior cleaning", price: 5 }, { id: "68AM572", name: "Exterior wash", price: 5 }, { id: "68349BH", name: "Full detailing", price: 5 }, { id: "685M47E", name: "Ceramic coating", price: 5 }, { id: "68354IJ", name: "Dashboard polishing", price: 5 }] },
        { category: "Tyre & Wheel", options: [{ id: "684HA71", name: "Tyre replacement", price: 5 }, { id: "68D754E", name: "Wheel alignment", price: 5 }, { id: "68NV715", name: "Wheel balancing", price: 5 }, { id: "684G7W9", name: "Puncture repair", price: 5 }, { id: "68715DO", name: "Tyre rotation", price: 5 }] },
        { category: "Inspection & Diagnostics", options: [{ id: "6849G1C", name: "Computerized diagnostics", price: 5 }, { id: "6834KT5", name: "Turbo system check", price: 5 }, { id: "68PF432", name: "Brake inspection", price: 5 }, { id: "68349LG", name: "Suspension check", price: 5 }, { id: "68H2D49", name: "Pre-purchase inspection", price: 5 }] },
        { category: "Battery & Charging", options: [{ id: "687H3O4", name: "Battery testing", price: 5 }, { id: "6895Q2N", name: "Battery replacement", price: 5 }, { id: "6812P3W", name: "Charging system inspection", price: 5 }, { id: "68419DA", name: "Wiring inspection", price: 5 }, { id: "6857H9E", name: "Fuse replacement", price: 5 }] },
        { category: "Roadside Assistance", options: [{ id: "68H731M", name: "Towing service", price: 5 }, { id: "687JT31", name: "Jump start", price: 5 }, { id: "687H21N", name: "Flat tyre support", price: 5 }, { id: "68579ZA", name: "Emergency fuel delivery", price: 5 }, { id: "685AF79", name: "Breakdown support", price: 5 }] },
    ],
    EV: [
        { category: "Battery System", options: [{ id: "68AF192", name: "Battery health diagnostics", price: 5 }, { id: "6845J9D", name: "Battery cooling system check", price: 5 }, { id: "68F54G9", name: "High-voltage battery inspection", price: 5 }, { id: "68321AD", name: "Battery pack replacement", price: 5 }, { id: "6857HA4", name: "BMS check", price: 5 }] },
        { category: "Charging System", options: [{ id: "68O17M2", name: "On-board charger inspection", price: 5 }, { id: "682AQ91", name: "Charging port inspection", price: 5 }, { id: "68924GF", name: "Fast-charging system check", price: 5 }, { id: "68D9H14", name: "Home charger installation", price: 5 }, { id: "681HA27", name: "Charging cable inspection", price: 5 }] },
        { category: "Motor & Powertrain", options: [{ id: "68YX321", name: "Electric motor diagnostics", price: 5 }, { id: "68129AN", name: "Controller inspection", price: 5 }, { id: "68549MH", name: "Power inverter inspection", price: 5 }, { id: "68QD715", name: "Regen braking check", price: 5 }, { id: "68U731D", name: "Drive shaft inspection", price: 5 }] },
        { category: "Electrical & Wiring", options: [{ id: "684W5D3", name: "HV wiring inspection", price: 5 }, { id: "6872T1A", name: "Fuse & relay check", price: 5 }, { id: "68J934L", name: "Low-voltage battery replacement", price: 5 }, { id: "68213CN", name: "Sensor diagnostics", price: 5 }, { id: "6895JC7", name: "ECU diagnostics", price: 5 }] },
        { category: "Brake & Suspension", options: [{ id: "68O5H21", name: "Brake pad replacement", price: 5 }, { id: "6897T3F", name: "Brake fluid replacement", price: 5 }, { id: "68N42K1", name: "Suspension repair", price: 5 }, { id: "68G3J42", name: "Shock absorber inspection", price: 5 }, { id: "683Y5D9", name: "Wheel alignment", price: 5 }] },
        { category: "Cooling System", options: [{ id: "68M21O9", name: "Battery cooling check", price: 5 }, { id: "6823E9X", name: "Thermal management check", price: 5 }, { id: "681M45E", name: "Coolant level inspection", price: 5 }, { id: "68H51L2", name: "Radiator inspection", price: 5 }, { id: "68C192W", name: "Cooling fan check", price: 5 }] },
        { category: "Software & Diagnostics", options: [{ id: "68472BA", name: "Software updates", price: 5 }, { id: "68MN192", name: "System recalibration", price: 5 }, { id: "68435UA", name: "Error code scanning", price: 5 }, { id: "68V759B", name: "Firmware updates", price: 5 }, { id: "68A5K43", name: "Performance diagnostics", price: 5 }] },
        { category: "Body & Exterior", options: [{ id: "6837OD2", name: "Dent repair", price: 5 }, { id: "68419DE", name: "Scratch removal", price: 5 }, { id: "68QA219", name: "Panel repainting", price: 5 }, { id: "68OM459", name: "Bumper repair", price: 5 }, { id: "68AD391", name: "Windshield replacement", price: 5 }] },
        { category: "Cleaning & Detailing", options: [{ id: "681G25I", name: "Interior cleaning", price: 5 }, { id: "681WV92", name: "Exterior wash", price: 5 }, { id: "6894DR2", name: "Full detailing", price: 5 }, { id: "6874PW2", name: "Ceramic coating", price: 5 }, { id: "68X5G21", name: "Dashboard polishing", price: 5 }] },
        { category: "Tyre & Wheel", options: [{ id: "68Q475O", name: "Tyre replacement", price: 5 }, { id: "6879F5O", name: "Wheel alignment", price: 5 }, { id: "6892G7P", name: "Wheel balancing", price: 5 }, { id: "6859D3X", name: "Puncture repair", price: 5 }, { id: "681P4O5", name: "Tyre rotation", price: 5 }] },
    ]
};

// Garage data structured by State > District > Garages
// Garage data is now fetched live from /api/garages — no hardcoded list

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash on Delivery' },
    { id: 'netbanking', label: 'Net Banking' },
];

const TIME_SLOTS = ["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "1:00 PM - 3:00 PM", "3:00 PM - 5:00 PM", "5:00 PM - 7:00 PM", "7:00 PM - 9:00 PM"];
const YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i); // 2000-2025

// ─── Step Indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => {
    const steps = ["Vehicle", "Garage", "Service", "Schedule", "Details", "Review", "Checkout"];
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

const ServiceDropdown = ({ options, value, onChange, garageDisabledServices }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const inputClass = "w-full px-4 py-2.5 bg-white border-2 border-blue-100 rounded-lg focus:outline-none text-[#011023] text-sm font-semibold transition text-center uppercase disabled:opacity-50 disabled:cursor-not-allowed";
    const selectClass = `${inputClass} cursor-pointer appearance-none px-10`;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`${selectClass} w-full text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10 flex items-center justify-center gap-2 relative truncate pr-10`}
            >
                <span className="truncate">{value || ''}</span>
                <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white/60 backdrop-blur-xl rounded-xl shadow-md border border-white/80 overflow-visible py-1 animate-[fadeIn_0.2s_ease-out] origin-top">
                    <div 
                        className="px-4 py-2 text-[10px] text-gray-400 hover:bg-white/40 cursor-pointer uppercase font-bold text-center border-b border-white/20 mb-1"
                        onClick={() => { onChange(''); setIsOpen(false); }}
                    >
                        None
                    </div>
                    <div className="hide-scrollbar">
                        {options.map(opt => {
                            const isBlocked = garageDisabledServices.includes(opt.name);
                            return (
                                <div
                                    key={opt.name}
                                    className={`group relative px-4 py-2.5 text-[10.5px] uppercase font-bold text-center transition-colors
                                        ${isBlocked 
                                            ? 'text-gray-300 cursor-not-allowed bg-gray-50/10' 
                                            : 'text-[#011023] hover:bg-blue-50/50 hover:text-[#052558] cursor-pointer'}`}
                                    onClick={() => {
                                        if (!isBlocked) {
                                            onChange(opt.name);
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    {opt.name}
                                    {isBlocked && (
                                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 uppercase w-60 bg-red-200 text-red-900 font-semibold text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow- pointer-events-none group-hover:block hidden text-center normal-case">
                                            This service is currently unavailable at this garage
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-red-200"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FullService = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // ─── Route Guard: Redirect if not from Book Button ────────────────────────
    useEffect(() => {
        if (!location.state?.fromBookButton) {
            navigate('/services', { replace: true });
        }
    }, [location, navigate]);

    // ─── Helper for Session Persistence ──────────────────────────────────────
    const SESSION_KEY = 'service_booking_session';

    const getSessionState = (key, defaultValue) => {
        // If it's a new session start, ignore storage (we will clear it in effect)
        if (location.state?.isNewSession) return defaultValue;

        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed[key] !== undefined ? parsed[key] : defaultValue;
            }
        } catch (e) { console.error("Error reading session", e); }
        return defaultValue;
    };

    // Global State
    const [fuelType, setFuelType] = useState(() => getSessionState('fuelType', null));
    const [showFuelMenu, setShowFuelMenu] = useState(false);

    const [step, setStep] = useState(() => getSessionState('step', 1));
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showServiceBreakdown, setShowServiceBreakdown] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [payTrackingId, setPayTrackingId] = useState('');

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

    const [selectedBrand, setSelectedBrand] = useState(() => getSessionState('selectedBrand', ''));
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(() => getSessionState('selectedModel', ''));
    const [selectedYear, setSelectedYear] = useState(() => getSessionState('selectedYear', ''));
    const [vehicleType, setVehicleType] = useState(() => getSessionState('vehicleType', '')); // 'Private' or 'Commercial'
    const [transmission, setTransmission] = useState(() => getSessionState('transmission', '')); // 'Manual' or 'Automatic'
    const [vehicleNumber, setVehicleNumber] = useState(() => getSessionState('vehicleNumber', ''));
    const [carLoading, setCarLoading] = useState(false);

    // Step 2 – Service
    const [selectedServices, setSelectedServices] = useState(() => getSessionState('selectedServices', {}));

    // ── Application State ──────────────────────────────────────────────────────
    const [disabledServices, setDisabledServices] = useState([]);
    const [customServices, setCustomServices] = useState([]);
    const [serviceOverrides, setServiceOverrides] = useState({});

    // Fetch disabled services & overrides from DB
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch disabled services
                const resDisabled = await fetch('http://localhost:5001/api/settings/disabledServices');
                const dataDisabled = await resDisabled.json();
                if (dataDisabled.success && dataDisabled.data) {
                    setDisabledServices(dataDisabled.data);
                }

                // Fetch custom services
                const resCustom = await fetch('http://localhost:5001/api/settings/customServices');
                const dataCustom = await resCustom.json();
                if (dataCustom.success && dataCustom.data) {
                    setCustomServices(dataCustom.data);
                }

                // Fetch service overrides
                const resOverrides = await fetch('http://localhost:5001/api/settings/serviceOverrides');
                const dataOverrides = await resOverrides.json();
                if (dataOverrides.success && dataOverrides.data) {
                    setServiceOverrides(dataOverrides.data);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, []);

    // Dynamically merge custom services into the hardcoded SERVICE_DATA structure
    const dynamicServiceData = useMemo(() => {
        const data = JSON.parse(JSON.stringify(SERVICE_DATA));
        customServices.forEach(cs => {
            const fuelCategories = data[cs.fuelType];
            if (fuelCategories) {
                let cat = fuelCategories.find(c => c.category === cs.category);
                if (!cat) {
                    cat = { category: cs.category, options: [] };
                    fuelCategories.push(cat);
                }
                if (!cat.options.find(opt => opt.name === cs.name)) {
                    cat.options.push({ name: cs.name, price: parseFloat(String(cs.price).replace(/[^0-9.]/g, '')) || 5 });
                }
            }
        });
        return data;
    }, [customServices]);

    // ─── Live Garages from API ────────────────────────────────────────────────
    const [liveGarages, setLiveGarages] = useState([]);
    useEffect(() => {
        fetch('http://localhost:5001/api/garages')
            .then(r => r.json())
            .then(d => { if (d.success) setLiveGarages(d.data); })
            .catch(() => { });
    }, []);

    // Step 3 – Garage
    const [selectedState, setSelectedState] = useState(() => getSessionState('selectedState', ''));
    const [selectedDistrict, setSelectedDistrict] = useState(() => getSessionState('selectedDistrict', ''));
    const [selectedGarage, setSelectedGarage] = useState(() => getSessionState('selectedGarage', null));
    const [pickupDrop, setPickupDrop] = useState(() => getSessionState('pickupDrop', ''));

    // Derived lists
    const stateList = [...new Set(liveGarages.map(g => g.state).filter(Boolean))].sort();
    const districtList = selectedState
        ? [...new Set(liveGarages.filter(g => g.state === selectedState).map(g => g.district).filter(Boolean))].sort()
        : [];
    const garageList = (selectedState && selectedDistrict)
        ? liveGarages
            .filter(g => g.state === selectedState && g.district === selectedDistrict)
            .map(g => ({
                _id: g._id,
                id: g.garageId,
                name: g.name,
                pickupDrop: g.pickupDrop ? ['Yes', 'No'] : ['No'],
                disabledServices: g.disabledServices || []
            }))
        : [];
    const pickupDropOptions = selectedGarage ? (selectedGarage.pickupDrop || []) : [];

    // Step 4 – Schedule
    const [schedule, setSchedule] = useState(() => getSessionState('schedule', { date: '', time: '' }));

    // Step 5 – Details
    const [details, setDetails] = useState(() => getSessionState('details', { name: '', phone: '', email: '', address: '', notes: '' }));

    // Step 7 – Checkout
    const [paymentMethod, setPaymentMethod] = useState(() => getSessionState('paymentMethod', ''));

    // ─── Persistence Effect ──────────────────────────────────────────────────
    useEffect(() => {
        // If this is a fresh start, clear old session and remove the flag from history
        if (location.state?.isNewSession) {
            sessionStorage.removeItem(SESSION_KEY);
            // Replace history to remove 'isNewSession' so reload works normally
            navigate('.', { replace: true, state: { ...location.state, isNewSession: false } });
        }
    }, [location.state, navigate]);

    // Auto-fill contact details from logged-in user account
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            setDetails(prev => ({
                ...prev,
                name: u.name || prev.name,
                email: u.email || prev.email,
                phone: u.phone || prev.phone,
                address: u.address || prev.address,
            }));
        }
    }, []);

    // Save state on change
    useEffect(() => {
        // Don't save if in the middle of a reset (prevent overwriting with defaults before reset completes)
        if (location.state?.isNewSession) return;

        const stateToSave = {
            fuelType, step, selectedBrand, selectedModel, selectedYear,
            vehicleType, transmission, vehicleNumber, selectedServices,
            selectedState, selectedDistrict, selectedGarage, pickupDrop,
            schedule, details, paymentMethod
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
    }, [fuelType, step, selectedBrand, selectedModel, selectedYear, vehicleType, transmission, vehicleNumber, selectedServices, selectedState, selectedDistrict, selectedGarage, pickupDrop, schedule, details, paymentMethod, location.state]);

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

    // ─── Calculate Total Price ───────────────────────────────────────────────
    const calculateTotal = () => {
        if (!fuelType) return 0;
        let total = 0;
        const currentFuelData = dynamicServiceData[fuelType];
        if (!currentFuelData) return 0;

        Object.entries(selectedServices).forEach(([category, serviceName]) => {
            if (!serviceName) return;
            const catData = currentFuelData.find(c => c.category === category);
            if (catData) {
                const option = catData.options.find(opt => opt.name === serviceName);
                if (option) {
                    // Pull overridden price or default to option.price
                    const priceStr = serviceOverrides[option.name]?.price || option.price;
                    const priceVal = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
                    total += priceVal;
                }
            }
        });
        return total;
    };

    const calculateGrandTotal = () => {
        const base = calculateTotal();
        const gst = base * 0.18;
        const pickupCharge = pickupDrop === 'Yes' ? 4 : 0;
        const fees = pickupCharge + 3 + 2; // Pickup (if yes) + Convenience + Handling
        return (base + gst + fees).toFixed(2);
    };

    const handleScheduleChange = (e) => setSchedule(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleDetailChange = (e) => setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // ─── Razorpay Helper ─────────────────────────────────────────────────────
    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const saveBooking = async (paymentId = 'CASH') => {
        try {
            // Retrieve user info from local storage to get the ID if it exists
            const storedUser = localStorage.getItem('user');
            const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

            const bookingData = {
                user: {
                    ...details,
                    name: loggedInUser?.name || details.name,
                    email: loggedInUser?.email || details.email,
                    id: loggedInUser ? (loggedInUser.id || loggedInUser._id) : undefined,
                    userId: loggedInUser ? loggedInUser.userId : undefined
                },
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
                    id: Object.entries(selectedServices)
                        .map(([category, name]) => {
                            const fuelData = dynamicServiceData[fuelType] || [];
                            const cat = fuelData.find(c => c.category === category);
                            const opt = cat?.options.find(o => o.name === name);
                            return opt?.id;
                        })
                        .filter(Boolean)
                        .join(', '),
                    title: Object.values(selectedServices).join(', '),
                    price: calculateGrandTotal()
                },
                garage: {
                    id: selectedGarage?.id,
                    name: selectedGarage?.name,
                    state: selectedState,
                    district: selectedDistrict,
                    pickupDrop
                },
                schedule,
                paymentMethod,
                paymentId
            };

            const response = await fetch('http://localhost:5001/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Booking failed');

            if (data.success && data.data && data.data.bookingId) {
                setBookingId(data.data.bookingId);
                setPayTrackingId(data.paymentId || '');
            }

            // We don't reset form state here anymore so the Success Screen can display it.
            // It will be reset if they click "Book Another Service".
            sessionStorage.removeItem(SESSION_KEY);

            setSubmitted(true);
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(`Booking failed: ${error.message || 'Please try again.'}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Preload Razorpay Script ─────────────────────────────────────────────
    useEffect(() => {
        loadScript('https://checkout.razorpay.com/v1/checkout.js');
    }, []);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!selectedGarage || !schedule.date || !schedule.time || !details.name || !details.phone) {
            alert('Please fill in all details');
            return;
        }

        setSubmitting(true);
        try {
            if (paymentMethod === 'netbanking') {
                // Retry loading if missing (due to adblocker or network)
                if (!window.Razorpay) {
                    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                }

                if (!window.Razorpay) {
                    alert('Razorpay SDK could not be loaded. Please disable any Ad Blockers and try again.');
                    setSubmitting(false);
                    return;
                }

                const totalAmount = parseFloat(calculateGrandTotal());

                const orderRes = await fetch('http://localhost:5001/api/payments/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: totalAmount })
                });
                const orderData = await orderRes.json();

                if (!orderData.success) throw new Error("Order creation failed");

                const options = {
                    key: 'rzp_test_SDOW0Mi3saqtVB',
                    amount: orderData.order.amount,
                    currency: "INR",
                    name: "VehicleeCare",
                    description: "Car Service Booking",
                    order_id: orderData.order.id,
                    handler: async function (response) {
                        const verifyRes = await fetch('http://localhost:5001/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            saveBooking(response.razorpay_payment_id);
                        } else {
                            alert("Payment verification failed");
                            setSubmitting(false);
                        }
                    },
                    prefill: {
                        name: details.name || undefined,
                        email: details.email || undefined,
                        contact: details.phone || undefined
                    },
                    theme: { color: "#052558" },
                    modal: {
                        ondismiss: function () {
                            setSubmitting(false);
                        }
                    }
                };

                const paymentObject = new window.Razorpay(options);

                paymentObject.on('payment.failed', function (response) {
                    alert(response.error.description);
                    setSubmitting(false);
                });

                paymentObject.open();

            } else {
                // COD — collect 25% advance via Razorpay
                const totalAmount = parseFloat(calculateGrandTotal());
                const advanceAmount = Math.round(totalAmount * 0.25);

                const confirmed = window.confirm(
                    `For continuing with Cash on Delivery you need to pay 25% of your total amount (₹${advanceAmount}) as an advance.\n\nClick OK to proceed with the advance payment.`
                );

                if (!confirmed) {
                    setSubmitting(false);
                    return;
                }

                // Load Razorpay if not already loaded
                if (!window.Razorpay) {
                    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                }
                if (!window.Razorpay) {
                    alert('Razorpay SDK could not be loaded. Please disable any Ad Blockers and try again.');
                    setSubmitting(false);
                    return;
                }

                const orderRes = await fetch('http://localhost:5001/api/payments/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: advanceAmount })
                });
                const orderData = await orderRes.json();
                if (!orderData.success) throw new Error('Order creation failed');

                const options = {
                    key: 'rzp_test_SDOW0Mi3saqtVB',
                    amount: orderData.order.amount,
                    currency: 'INR',
                    name: 'VehicleeCare',
                    description: `COD Advance (25% of ₹${totalAmount})`,
                    order_id: orderData.order.id,
                    handler: async function (response) {
                        const verifyRes = await fetch('http://localhost:5001/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            // Save booking — mark as COD with advance paid
                            saveBooking(response.razorpay_payment_id);
                        } else {
                            alert('Advance payment verification failed. Booking not confirmed.');
                            setSubmitting(false);
                        }
                    },
                    prefill: {
                        name: details.name || undefined,
                        email: details.email || undefined,
                        contact: details.phone || undefined
                    },
                    theme: { color: '#052558' },
                    modal: {
                        ondismiss: function () {
                            setSubmitting(false);
                        }
                    }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (response) {
                    alert(response.error.description);
                    setSubmitting(false);
                });
                paymentObject.open();
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            alert('Something went wrong! Please try again.');
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
                            {bookingId && (
                                <>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Booking ID</span>
                                        <span className="font-bold text-[#052558] text-sm text-right">{bookingId}</span>
                                    </div>
                                    <div className="h-px bg-blue-100 w-full" />
                                </>
                            )}
                            {payTrackingId && (
                                <>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Payment ID</span>
                                        <span className="font-bold text-[#052558] text-sm text-right">{payTrackingId}</span>
                                    </div>
                                    <div className="h-px bg-blue-100 w-full" />
                                </>
                            )}
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
                                <span className="text-sm font-bold text-[#052558]">Total Paid (with GST)</span>
                                <span className="font-bold text-[#527FB0] text-lg">₹{calculateGrandTotal()}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity uppercase tracking-wide mb-3"
                        >
                            Track Booking Status
                        </button>

                        <button
                            onClick={() => {
                                setStep(1);
                                setSelectedBrand('');
                                setSelectedModel('');
                                setSelectedYear('');
                                setVehicleType('');
                                setTransmission('');
                                setVehicleNumber('');
                                setSelectedServices({});
                                setSelectedState('');
                                setSelectedDistrict('');
                                setSelectedGarage(null);
                                setPickupDrop('');
                                setSchedule({ date: '', time: '' });
                                setDetails(prev => ({ ...prev, notes: '' }));
                                setPaymentMethod('');
                                setBookingId('');
                                setSubmitted(false);
                            }}
                            className="w-full px-4 py-3 bg-blue-50 text-[#052558] font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors uppercase tracking-wide"
                        >
                            Book Another Service
                        </button>

                        {/* Top-left arrow (optional now that we have buttons, but keeping for consistency) */}
                        <button
                            onClick={() => navigate('/services')}
                            className="absolute top-9.5 -left-20 text-white/50 hover:text-white transition-colors"
                            title="Back to Services"
                        >
                            <ArrowLeft size={20} />
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
                            onClick={() => navigate('/#home')}
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

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                            {[
                                { type: 'Petrol', icon: <Fuel size={32} />, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-200', shadow: 'hover:shadow-blue-200', ring: 'group-hover:ring-blue-300' },
                                { type: 'Diesel', icon: <Fuel size={32} />, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-200', shadow: 'hover:shadow-orange-200', ring: 'group-hover:ring-orange-300' },
                                { type: 'EV', icon: <Zap size={32} />, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-200', shadow: 'hover:shadow-green-200', ring: 'group-hover:ring-green-300' },
                                { type: 'Premium', icon: <Star size={32} />, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-200', shadow: 'hover:shadow-purple-200', ring: 'group-hover:ring-purple-300' },
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => setFuelType(item.type)}
                                    className={`group relative flex flex-col items-center justify-center p-6 h-60 rounded-3xl bg-white/60 backdrop-blur-xl border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${item.border} ${item.shadow}`}
                                >
                                    <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none`} />

                                    <div className={`w-20 h-20 rounded-2xl ${item.bg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-sm ring-1 ring-white/50`}>
                                        <div className={item.color}>{item.icon}</div>
                                    </div>

                                    <h3 className="font-black text-[#011023] text-xl tracking-tight uppercase mb-1">{item.type}</h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-[#052558] transition-colors">Select</span>

                                    {/* Hover Ring Effect */}
                                    <div className={`absolute inset-0 rounded-3xl border-2 border-transparent transition-all duration-300 ${item.ring} opacity-0 group-hover:opacity-100`} />
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
                                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Loading...</span>
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
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 4) setVehicleNumber(val);
                                            }}
                                            maxLength={4}
                                            className={`${inputClass} text-center text-xs uppercase font-bold`}
                                            disabled={!transmission}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Choose Service ── */}
                        {step === 3 && (
                            <div className="animate-[fadeIn_0.3s_ease-out]  max-w-6xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Select a Service</h2>

                        {/* 10 Select Dropdowns Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {(dynamicServiceData[fuelType] || dynamicServiceData['Petrol']).map((item, index) => {
                                const availableOptions = item.options.filter(opt => !disabledServices.includes(opt.name));
                                if (availableOptions.length === 0) return null;

                                return (
                                    <div key={index}>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center truncate" title={item.category}>
                                            {item.category}
                                        </label>
                                        <ServiceDropdown
                                            options={availableOptions}
                                            value={selectedServices[item.category] || ''}
                                            onChange={val => setSelectedServices(prev => ({
                                                ...prev,
                                                [item.category]: val
                                            }))}
                                            garageDisabledServices={selectedGarage?.disabledServices || []}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                            </div>
                        )}

                        {/* ── Step 3: Select Garage ── */}
                        {step === 2 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-5xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Select a Garage</h2>

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
                                                value={selectedGarage && selectedGarage._id ? selectedGarage._id : ''}
                                                onChange={e => {
                                                    const gId = e.target.value;
                                                    const g = garageList.find(g => String(g._id) === String(gId));
                                                    setSelectedGarage(g || null);
                                                    setPickupDrop('');
                                                }}
                                                disabled={!selectedDistrict}
                                                className={`${selectClass} text-center text-[10.5px] uppercase font-bold py-2 px-8 h-10`}
                                            >
                                                <option value=""></option>
                                                {garageList.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
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
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-6xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Your Contact Details</h2>

                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    {/* Full Name */}
                                    <div className="w-full sm:w-[20%]">
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Full Name</label>
                                        <input
                                            name="name"
                                            value={details.name}
                                            readOnly
                                            className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full bg-[#f4f9ff] cursor-not-allowed select-none`}
                                        />
                                    </div>

                                    {/* Phone */}
                                    {(() => {
                                        const hasPhone = !!JSON.parse(localStorage.getItem('user') || '{}')?.phone;
                                        return (
                                            <div className="w-full sm:w-[15%]">
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Phone</label>
                                                <input
                                                    name="phone"
                                                    value={details.phone}
                                                    readOnly={hasPhone}
                                                    onChange={!hasPhone ? handleDetailChange : undefined}
                                                    // placeholder={!hasPhone ? 'Enter phone number' : ''}
                                                    required
                                                    className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full ${hasPhone ? 'bg-[#f4f9ff] cursor-not-allowed select-none' : ''}`}
                                                />
                                            </div>
                                        );
                                    })()}

                                    {/* Email */}
                                    <div className="w-full sm:w-[30%]">
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Email</label>
                                        <input
                                            name="email"
                                            value={details.email}
                                            readOnly
                                            className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full bg-[#f4f9ff] cursor-not-allowed select-none`}
                                        />
                                    </div>

                                    {/* Address */}
                                    {(() => {
                                        const hasAddress = !!JSON.parse(localStorage.getItem('user') || '{}')?.address;
                                        return (
                                            <div className="w-full sm:w-[36%]">
                                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">Address</label>
                                                <input
                                                    name="address"
                                                    value={details.address}
                                                    readOnly={hasAddress}
                                                    onChange={!hasAddress ? handleDetailChange : undefined}
                                                    required
                                                    className={`${inputClass} text-center text-[11px] uppercase font-bold py-2 px-4 h-10 w-full ${hasAddress ? 'bg-[#f4f9ff] cursor-not-allowed select-none' : ''}`}
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* ── Step 6: Review ── */}
                        {step === 6 && (
                            <div className="animate-[fadeIn_0.3s_ease-out] max-w-6xl mx-auto">
                                <h2 className="text-sm text-center font-bold text-[#011023] uppercase mb-5">Review Details</h2>

                                <div className="grid md:grid-cols-[300px] gap-6">
                                    {/* Left side – 5 review cards stacked */}
                                    <div className="flex flex-col gap-4">
                                        {/* Vehicle Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><Car size={18} /></div> */}
                                                <div>
                                                    <p className="text-[12px] text-gray-400 pb-1 uppercase font-semibold">Vehicle</p>
                                                    <p className="font-bold text-[#011023] pb-0.5 uppercase text-xs">{selectedBrand} {selectedModel} &nbsp;|&nbsp; {selectedYear} &nbsp;|&nbsp; {vehicleNumber} &nbsp;|&nbsp; {transmission}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Service Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><Settings size={18} /></div> */}
                                                <div>
                                                    <p className="text-[12px] text-gray-400 pb-1 uppercase font-semibold">Service</p>
                                                    <p className="font-bold text-[#011023] pb-0.5 uppercase text-xs">
                                                        {Object.values(selectedServices).filter(s => s).length > 0
                                                            ? Object.values(selectedServices).filter(s => s).map((s, i) => <span key={i} className="block">{s}</span>)
                                                            : 'No service selected'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(2)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Garage Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><MapPin size={18} /></div> */}
                                                <div>
                                                    <p className="text-[12px] text-gray-400 pb-1 uppercase font-semibold">Service Center</p>
                                                    <p className="font-bold pb-0.5 uppercase text-[#011023] text-xs">{selectedGarage?.name}</p>
                                                    {/* <p className="text-[10px] font-bold uppercase text-[#527FB0]">Total: ₹{calculateGrandTotal()}</p> */}
                                                    <p className="text-[10px] pb-0.5 uppercase text-gray-500">{selectedDistrict}, {selectedState}</p>
                                                    {pickupDrop && <p className="text-[10px] uppercase text-blue-500 font-medium">Pickup & Drop: {pickupDrop}</p>}
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(3)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Schedule Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><Calendar size={18} /></div> */}
                                                <div>
                                                    <p className="text-[12px] pb-1 text-gray-400 uppercase font-semibold">Date & Time</p>
                                                    <p className="font-bold text-[#011023] text-xs">
                                                        {schedule.dateDisplay || schedule.date} &nbsp;|&nbsp; {schedule.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(4)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#527FB0] transition-colors"><Edit size={14} /></button>
                                        </div>

                                        {/* Contact Card */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#527FB0]"><User size={18} /></div> */}
                                                <div>
                                                    <p className="text-[12px] pb-1 text-gray-400 uppercase font-semibold">Customer</p>
                                                    <p className="font-bold pb-0.5 uppercase text-[#011023] text-xs">{details.name}</p>
                                                    <p className="text-[10px] uppercase text-gray-500">{details.phone}</p> 
                                                    <p className="text-[10px] uppercase text-gray-500"> {details.email && ` ${details.email}`}</p>
                                                    <p className="text-[10px] uppercase text-gray-500"> {details.address && ` ${details.address}`}</p>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    {PAYMENT_METHODS.map(method => (
                                        <div key={method.id}>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide text-center">
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

                                {/* Bill Summary */}
                                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-6">
                                    <div className="bg-[#052558]/5 p-4 border-b border-gray-100">
                                        <p className="text-xs font-bold text-[#052558] uppercase tracking-wide text-center">Billing Summary</p>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        {/* Service Cost row — expandable when >1 service selected */}
                                        {(() => {
                                            const selectedEntries = Object.entries(selectedServices).filter(([, v]) => v);
                                            const currentFuelData = dynamicServiceData[fuelType] || [];
                                            const canExpand = selectedEntries.length > 1;
                                            return (
                                                <>
                                                    <div
                                                        className={`flex justify-between items-center text-xs ${canExpand ? 'cursor-pointer select-none' : ''}`}
                                                        onClick={() => canExpand && setShowServiceBreakdown(p => !p)}
                                                    >
                                                        <span className="flex items-center gap-1 text-gray-500 font-medium uppercase">
                                                            Service Cost
                                                            {canExpand && (
                                                                <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${showServiceBreakdown ? 'rotate-180' : ''}`} />
                                                            )}
                                                        </span>
                                                        <span className="font-bold text-[#011023]">₹{calculateTotal()}</span>
                                                    </div>
                                                    {canExpand && showServiceBreakdown && (
                                                        <div className="ml-2 mt-1 space-y-1 border-l-2 border-blue-100 pl-3">
                                                            {selectedEntries.map(([category, serviceName]) => {
                                                                const catData = currentFuelData.find(c => c.category === category);
                                                                const option = catData?.options.find(o => o.name === serviceName);
                                                                const priceStr = serviceOverrides[serviceName]?.price || option?.price || 0;
                                                                const price = parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
                                                                return (
                                                                    <div key={category} className="flex justify-between items-center text-[10px]">
                                                                        <span className="text-gray-400 uppercase truncate max-w-[65%]">{serviceName}</span>
                                                                        <span className="font-semibold text-gray-600">₹{price}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 font-medium uppercase">GST (18%)</span>
                                            <span className="font-bold text-[#011023]">₹{(calculateTotal() * 0.18).toFixed(2)}</span>
                                        </div>
                                        {/* Will be improved later according to the distance */}
                                        {pickupDrop === 'Yes' && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium uppercase">Pickup & Drop</span>
                                                <span className="font-bold text-[#011023]">₹{4}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 font-medium uppercase">Convenience Fee</span>
                                            <span className="font-bold text-[#011023]">₹{3}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 font-medium uppercase">Handling Charges</span>
                                            <span className="font-bold text-[#011023]">₹{2}</span>
                                        </div>
                                        <div className="my-2 border-t border-dashed border-gray-200"></div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-[#052558] uppercase">Total Payable</span>
                                            <span className="font-bold text-[#527FB0] text-lg">₹{calculateGrandTotal()}</span>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sticky Footer Navigation - Conditional Render */}
            {fuelType && (
                <div className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-white/40 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                    <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className={`group flex items-center gap-2 px-6 py-3 text-gray-500 font-bold uppercase text-xs tracking-wider hover:text-[#052558] hover:bg-blue-50/50 rounded-2xl transition-all disabled:opacity-0 disabled:cursor-not-allowed ${step === 1 ? 'invisible' : ''}`}
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>

                        <div className="flex-1 flex justify-center text-sm font-medium text-gray-500">
                            {/* Optional: Add some status text or progress bar here if needed */}
                        </div>

                        {step < 7 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={
                                    (step === 1 && (!selectedBrand || !selectedModel || !selectedYear || !vehicleType || !transmission || vehicleNumber.length < 4)) ||
                                    (step === 2 && (!selectedGarage || !pickupDrop)) ||
                                    (step === 3 && Object.values(selectedServices).filter(s => s).length === 0) ||
                                    (step === 4 && (!schedule.date || !schedule.time)) ||
                                    (step === 5 && (!details.name || !details.phone)) ||
                                    submitting
                                }
                                className="flex items-center gap-3 px-6 py-2.5 bg-[#052558] text-white font-bold rounded-2xl shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 hover:bg-[#052558]/90 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                            >
                                <span className="uppercase tracking-wide text-xs">Next</span>
                                <ChevronRight size={14} className='-mr-2' />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || !paymentMethod}
                                className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-blue-900/30 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                            >
                                {submitting
                                    ? <><span className="uppercase tracking-wide text-xs">Processing...</span></>
                                    : <><span className="uppercase tracking-wide text-xs">Confirm Booking</span>
                                    </>
                                }
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default FullService;