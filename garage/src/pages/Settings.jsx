import React, { useState, useEffect } from 'react';
import { Save, Home, Clock, Wrench, Car, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const Settings = () => {
    const [activeServiceTab, setActiveServiceTab] = useState('PETROL');
    const [disabledServices, setDisabledServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { triggerAlert } = useAlert();

    const garageUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
    const garageId = garageUser._id || garageUser.id; // Prioritize MongoDB _id

    useEffect(() => {
        const fetchSettings = async () => {
            if (!garageId) return;
            try {
                const res = await fetch(`http://localhost:5001/api/garages/${garageId}`);
                const result = await res.json();
                if (result.success && result.data) {
                    setDisabledServices(result.data.disabledServices || []);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
                triggerAlert("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [garageId, triggerAlert]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:5001/api/garages/${garageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disabledServices })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                triggerAlert("Settings saved successfully", "success");
            } else {
                throw new Error(result.message || 'Server returned an error');
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            triggerAlert(err.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const toggleService = (serviceName) => {
        setDisabledServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#052558] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Garage Settings</h1>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 text-[13px] mb-1.5 px-12 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity uppercase tracking-tighter text-sm disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Details'}
                </button>
            </div>
            
            {/* Services Configuration */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex flex-col h-full col-span-1 xl:col-span-2">
                <div className="pt-6 pl-7 pb-2">
                    <h2 className="text-lg uppercase font-bold text-[#011023]">Service Categories</h2>
                    {/* <p className="text-sm text-gray-500 mt-1">Configure service offerings across different vehicle fuel types.</p> */}
                </div>
                <div className="pl-6 pr-6 pt-0.5 flex-1 flex flex-col">

                    {/* Nested Service Tabs */}
                    <div className="flex gap-2 p-1 bg-blue-50/50 rounded-xl mb-4">
                        {['PETROL', 'DIESEL', 'EV', 'PREMIUM'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveServiceTab(tab)}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeServiceTab === tab
                                    ? 'bg-white text-[#052558] shadow-sm'
                                    : 'text-gray-500 hover:text-[#052558] hover:bg-white/40'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Wrapper */}
                    <div className="space-y-8 overflow-y-auto hide-scrollbar" style={{ maxHeight: "calc(100vh - 340px)" }}>

                        {/* Petrol */}
                        {activeServiceTab === 'PETROL' && (
                            <>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {/* Section 1 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">General Maintenance</h3>
                                        {['Engine oil change', 'Oil filter replacement', 'Air filter replacement', 'Spark plug replacement', 'Multi-point vehicle inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 2 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Engine & Mechanical</h3>
                                        {['Engine diagnostics', 'Clutch repair', 'Gearbox servicing', 'Suspension repair', 'Brake pad replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 3 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Fuel System</h3>
                                        {['Fuel injector cleaning', 'Throttle body cleaning', 'Fuel pump inspection', 'Fuel filter replacement', 'Fuel line inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 4 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">AC & Electrical</h3>
                                        {['AC gas refill', 'AC compressor repair', 'Battery replacement', 'Alternator repair', 'Starter motor repair'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 5 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Body & Exterior</h3>
                                        {['Dent repair', 'Scratch removal', 'Bumper repair', 'Panel repainting', 'Windshield replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 6 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Cleaning & Detailing</h3>
                                        {['Interior cleaning', 'Exterior wash', 'Full detailing', 'Ceramic coating', 'Dashboard polishing'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 7 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Tyre & Wheel</h3>
                                        {['Tyre replacement', 'Wheel alignment', 'Wheel balancing', 'Puncture repair', 'Tyre rotation'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 8 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Inspection & Diagnostics</h3>
                                        {['Computerized diagnostics', 'Brake inspection', 'Suspension check', 'Battery health test', 'Pre-purchase inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 9 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Battery & Charging</h3>
                                        {['Battery testing', 'Battery replacement', 'Charging system inspection', 'Wiring inspection', 'Fuse replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 10 */}
                                    <div className="space-y-2.5 bg-white p-5 mb-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Roadside Assistance</h3>
                                        {['Towing service', 'Jump start', 'Flat tyre support', 'Emergency fuel delivery', 'Breakdown support'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Diesel */}
                        {activeServiceTab === 'DIESEL' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {/* Section 1 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">General Maintenance</h3>
                                        {['Engine oil change', 'Oil filter replacement', 'Air filter replacement', 'Diesel fuel filter replacement', 'Multi-point vehicle inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 2 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Engine & Mechanical</h3>
                                        {['Engine diagnostics', 'Turbocharger inspection', 'Clutch repair', 'Gearbox servicing', 'Brake pad replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 3 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Diesel Fuel System</h3>
                                        {['Diesel injector cleaning', 'Fuel pump inspection', 'Fuel line cleaning', 'Diesel filter replacement', 'Common rail system check'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 4 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">AC & Electrical</h3>
                                        {['AC gas refill', 'AC compressor repair', 'Battery replacement', 'Alternator repair', 'Starter motor repair'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 5 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Body & Exterior</h3>
                                        {['Dent repair', 'Scratch removal', 'Bumper repair', 'Panel repainting', 'Windshield replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 6 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Cleaning & Detailing</h3>
                                        {['Interior cleaning', 'Exterior wash', 'Full detailing', 'Ceramic coating', 'Dashboard polishing'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 7 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Tyre & Wheel</h3>
                                        {['Tyre replacement', 'Wheel alignment', 'Wheel balancing', 'Puncture repair', 'Tyre rotation'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 8 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Inspection & Diagnostics</h3>
                                        {['Computerized diagnostics', 'Turbo system check', 'Brake inspection', 'Suspension check', 'Pre-purchase inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 9 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Battery & Charging</h3>
                                        {['Battery testing', 'Battery replacement', 'Charging system inspection', 'Wiring inspection', 'Fuse replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 10 */}
                                    <div className="space-y-2.5 bg-white p-5 mb-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Roadside Assistance</h3>
                                        {['Towing service', 'Jump start', 'Flat tyre support', 'Emergency fuel delivery', 'Breakdown support'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* EV */}
                        {activeServiceTab === 'EV' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {/* Section 1 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Battery System Services</h3>
                                        {['Battery health diagnostics', 'Battery cooling system check', 'High-voltage battery inspection', 'Battery pack replacement (authorized)', 'Battery management system (BMS) check'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 2 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Charging System Services</h3>
                                        {['On-board charger inspection', 'Charging port inspection', 'Fast-charging system check', 'Home charger installation', 'Charging cable inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 3 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Motor & Powertrain Services</h3>
                                        {['Electric motor diagnostics', 'Controller inspection', 'Power inverter inspection', 'Regenerative braking system check', 'Drive shaft inspection'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 4 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Electrical & Wiring Services</h3>
                                        {['High-voltage wiring inspection', 'Fuse & relay check', 'Low-voltage (12V) battery replacement', 'Sensor diagnostics', 'ECU diagnostics'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 5 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Brake & Suspension Services</h3>
                                        {['Brake pad replacement', 'Brake fluid replacement', 'Suspension repair', 'Shock absorber inspection', 'Wheel alignment'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 6 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Cooling System Services</h3>
                                        {['Battery cooling system check', 'Thermal management system inspection', 'Coolant level inspection', 'Radiator inspection (if applicable)', 'Cooling fan check'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 7 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Software & Diagnostics</h3>
                                        {['Software updates', 'System recalibration', 'Error code scanning', 'Firmware updates', 'Performance diagnostics'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 8 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Body & Exterior Services</h3>
                                        {['Dent repair', 'Scratch removal', 'Panel repainting', 'Bumper repair', 'Windshield replacement'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 9 */}
                                    <div className="space-y-2.5 bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Cleaning & Detailing</h3>
                                        {['Interior cleaning', 'Exterior wash', 'Full detailing', 'Ceramic coating', 'Dashboard polishing'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Section 10 */}
                                    <div className="space-y-2.5 bg-white p-5 mb-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <h3 className="font-bold text-[#011023] uppercase text-sm border-b border-gray-100 pb-2 mb-3">Tyre & Wheel Services</h3>
                                        {['Tyre replacement', 'Wheel alignment', 'Wheel balancing', 'Puncture repair', 'Tyre rotation'].map(item => (
                                            <div key={item} className="flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <span className="text-xs uppercase text-gray-700">{item}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={!disabledServices.includes(item)}
                                                        onChange={() => toggleService(item)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#527FB0]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}



                        {/* Premium */}
                        {activeServiceTab === 'PREMIUM' && (
                            <div className="flex flex-col items-center justify-center text-center pb-10 pt-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 min-h-[20rem]">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                    <Car className="text-[#527FB0]" size={32} />
                                </div>
                                <h3 className="font-bold text-lg text-[#011023]">Premium Services</h3>
                                {/* <p className="text-sm text-gray-500 mt-2 max-w-sm">Configuration for white-glove and premium tier services is coming soon.</p> */}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
