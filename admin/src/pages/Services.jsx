import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Wrench, Plus, Edit, Trash2, SwitchCamera, X } from 'lucide-react';
import { defaultServicesList } from '../data/servicesData';

const Services = () => {
    const [disabledServices, setDisabledServices] = useState([]);
    const [serviceOverrides, setServiceOverrides] = useState({});

    // Edit Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    // Add Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newService, setNewService] = useState({
        name: '', category: '', fuelType: '', price: '', duration: '', active: true
    });
    const [customServices, setCustomServices] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch disabled services
                const resDisabled = await fetch('http://localhost:5001/api/settings/disabledServices');
                const dataDisabled = await resDisabled.json();
                if (dataDisabled.success && dataDisabled.data) {
                    setDisabledServices(dataDisabled.data);
                }

                // Fetch custom services (newly added)
                const resCustom = await fetch('http://localhost:5001/api/settings/customServices');
                const dataCustom = await resCustom.json();
                let newlyAddedServices = [];
                if (dataCustom.success && dataCustom.data) {
                    newlyAddedServices = dataCustom.data;
                    setCustomServices(newlyAddedServices);
                }

                // Fetch service overrides
                const resOverrides = await fetch('http://localhost:5001/api/settings/serviceOverrides');
                const dataOverrides = await resOverrides.json();

                const overrides = (dataOverrides.success && dataOverrides.data) ? dataOverrides.data : {};
                setServiceOverrides(overrides);

                setServicesList(prev => {
                    const existingIds = new Set(prev.map(s => s.id));
                    const toAdd = newlyAddedServices.filter(s => !existingIds.has(s.id));

                    // Create unmapped raw list
                    const allServices = [...prev, ...toAdd];

                    // Apply price and duration overrides
                    const withOverrides = allServices.map(s => {
                        if (overrides[s.name]) {
                            return { ...s, price: overrides[s.name].price || s.price, duration: overrides[s.name].duration || s.duration };
                        }
                        return s;
                    });

                    // Extract the exact sequence of categories as they appear in defaultServicesList
                    const categoryOrderRaw = [...new Set(defaultServicesList.map(s => s.category))];
                    const getCategoryIndex = (cat, fuel) => {
                        // Some categories exist only in EV/Diesel, we just use the first chronological appearance across all fuels
                        const idx = categoryOrderRaw.indexOf(cat);
                        return idx !== -1 ? idx : 999;
                    };

                    // Group dynamically so new services fit right next to their parent category
                    return withOverrides.sort((a, b) => {
                        // 1. Sort by Fuel Type (Petrol -> Diesel -> EV -> Premium)
                        const fuelOrder = { 'Petrol': 1, 'Diesel': 2, 'EV': 3, 'Premium': 4 };
                        const fuelA = fuelOrder[a.fuelType] || 99;
                        const fuelB = fuelOrder[b.fuelType] || 99;
                        if (fuelA !== fuelB) return fuelA - fuelB;

                        // 2. Sort by Original Category Appearance
                        const catA = getCategoryIndex(a.category, a.fuelType);
                        const catB = getCategoryIndex(b.category, b.fuelType);
                        if (catA !== catB) return catA - catB;

                        return 0; // Same fuel and category
                    });
                });
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const [servicesList, setServicesList] = useState(defaultServicesList);

    const handleSaveService = async (updatedService) => {
        // 1. Update local list state so it reflects instantly
        setServicesList(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
        setIsEditModalOpen(false);
        setSelectedService(null);

        // 2. Prepare the override map
        const newOverrides = { ...serviceOverrides };
        newOverrides[updatedService.name] = {
            price: updatedService.price,
            duration: updatedService.duration
        };
        setServiceOverrides(newOverrides);

        // 3. Save to backend Settings
        try {
            await fetch('http://localhost:5001/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'serviceOverrides', value: newOverrides })
            });
        } catch (err) {
            console.error("Failed to save service override:", err);
        }
    };

    const handleAddNewService = async () => {
        if (!newService.name || !newService.category || !newService.fuelType) {
            alert("Please fill out Name, Category, and Fuel Type");
            return;
        }

        // Generate ID
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomSuffix = '';
        for (let i = 0; i < 5; i++) {
            randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const serviceToAdd = { ...newService, id: `68${randomSuffix}` };

        // Save to state with grouping logic applied
        const updatedCustomServices = [...customServices, serviceToAdd];

        setServicesList(prev => {
            const rawItems = [...prev, serviceToAdd];

            const categoryOrderRaw = [...new Set(defaultServicesList.map(s => s.category))];
            const getCategoryIndex = (cat) => {
                const idx = categoryOrderRaw.indexOf(cat);
                return idx !== -1 ? idx : 999;
            };

            return rawItems.sort((a, b) => {
                const fuelOrder = { 'Petrol': 1, 'Diesel': 2, 'EV': 3, 'Premium': 4 };
                const fuelA = fuelOrder[a.fuelType] || 99;
                const fuelB = fuelOrder[b.fuelType] || 99;
                if (fuelA !== fuelB) return fuelA - fuelB;

                const catA = getCategoryIndex(a.category);
                const catB = getCategoryIndex(b.category);
                if (catA !== catB) return catA - catB;

                return 0;
            });
        });

        setCustomServices(updatedCustomServices);

        setIsAddModalOpen(false);
        setNewService({ name: '', category: '', fuelType: '', price: '', duration: '', active: true });

        // Save back to DB Settings key customServices
        try {
            await fetch('http://localhost:5001/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'customServices', value: updatedCustomServices })
            });
        } catch (err) {
            console.error("Failed to save new custom service:", err);
        }
    };

    const handleDeleteService = async (serviceToDelete) => {
        if (!window.confirm(`Are you sure you want to delete the service: ${serviceToDelete.name}?`)) return;

        const isCustom = customServices.some(s => s.id === serviceToDelete.id);
        if (!isCustom) {
            alert("Cannot delete default system services. To hide them, toggle their status to Inactive.");
            return;
        }

        const updatedCustomServices = customServices.filter(s => s.id !== serviceToDelete.id);

        setCustomServices(updatedCustomServices);
        setServicesList(prev => prev.filter(s => s.id !== serviceToDelete.id));

        try {
            await fetch('http://localhost:5001/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'customServices', value: updatedCustomServices })
            });
        } catch (err) {
            console.error("Failed to delete custom service:", err);
            alert("Failed to delete service. Please try again.");
        }
    };

    const availableCategories = Array.from(new Set(
        servicesList
            .filter(s => s.fuelType === newService.fuelType && s.category)
            .map(s => s.category)
    ));

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Services</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                    <Plus size={18} />
                    Add Service
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full text-left uppercase border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-center text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold">Service ID</th>
                                <th className="p-4.5 font-bold">Service Details</th>
                                <th className="p-4.5 font-bold">Category</th>
                                <th className="p-4.5 font-bold">Fuel Type</th>
                                <th className="p-4.5 font-bold">Price</th>
                                <th className="p-4.5 font-bold">Duration</th>
                                <th className="p-4.5 font-bold text-center">Status</th>
                                <th className="p-4.5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-center divide-[#e6f0fa]">
                            {servicesList.map((service) => (
                                <tr key={service.id} className="hover:bg-blue-50/30 text-center text-xs transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-[13px] text-[#011023]">{service.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="font-semibold text-[13px] text-[#011023]">{service.name}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700">
                                            {service.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700">
                                            {service.fuelType}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold text-[#011023]">{service.price}</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-medium">
                                        {service.duration}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${!disabledServices.includes(service.name) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            {/* <div className={`w-1.5 h-1.5 rounded-full ${!disabledServices.includes(service.name) ? 'bg-emerald-500' : 'bg-gray-400'}`}></div> */}
                                            {!disabledServices.includes(service.name) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="Edit Service"
                                                onClick={() => { setSelectedService(service); setIsEditModalOpen(true); }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Delete"
                                                onClick={() => handleDeleteService(service)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Service Modal via createPortal */}
            {isEditModalOpen && selectedService && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                                    <Wrench size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Edit Service</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">ID: {selectedService.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="flex items-center justify-between text-sm font-bold text-[#011023] mb-1.5">
                                    <span>Service Name</span>
                                    {/* <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Fixed</span> */}
                                </label>
                                <input type="text" value={selectedService.name} readOnly className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/50 text-gray-500 cursor-not-allowed rounded-xl outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 flex items-center justify-between">
                                        <span>Category</span>
                                    </label>
                                    <input type="text" value={selectedService.category} readOnly className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/50 text-gray-500 cursor-not-allowed rounded-xl outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 flex items-center justify-between">
                                        <span>Fuel Type</span>
                                    </label>
                                    <input type="text" value={selectedService.fuelType} readOnly className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/50 text-gray-500 cursor-not-allowed rounded-xl outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Price</label>
                                    <input type="text" value={selectedService.price} onChange={(e) => setSelectedService({ ...selectedService, price: e.target.value })} className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Duration</label>
                                    <input type="text" value={selectedService.duration} onChange={(e) => setSelectedService({ ...selectedService, duration: e.target.value })} className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={() => handleSaveService(selectedService)} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg hover:shadow-blue-600/25">Save Changes</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Service Modal via createPortal */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative w-full uppercase max-w-xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent">
                            <div className="flex items-center gap-3">
                                {/* <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                                    <Plus size={20} />
                                </div> */}
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Add New Service</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Create a new entry</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 uppercase space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5">Service Name</label>
                                <input type="text" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 flex items-center justify-between">
                                        <span>Fuel Type</span>
                                    </label>
                                    <select value={newService.fuelType} onChange={(e) => setNewService({ ...newService, fuelType: e.target.value })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none">
                                        <option value=""></option>
                                        <option value="Petrol">PETROL</option>
                                        <option value="Diesel">DIESEL</option>
                                        <option value="EV">EV</option>
                                        <option value="Premium">PREMIUM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 flex items-center justify-between">
                                        <span>Category</span>
                                    </label>
                                    <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none">
                                        <option value=""></option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Price</label>
                                    <input type="text" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Duration</label>
                                    <input type="text" value={newService.duration} onChange={(e) => setNewService({ ...newService, duration: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex align-items-center justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleAddNewService} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25">Add Service</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Services;
