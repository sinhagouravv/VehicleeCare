import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, Wrench, Plus, Edit, Trash2, SwitchCamera, X, Loader2 } from 'lucide-react';
import { defaultServicesList } from '../data/servicesData';
import { TableSkeleton } from '../components/Skeleton';

import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';
import API_BASE_URL from '../config/api';

const getCategoryBadgeClass = (category) => {
    const cat = (category || '').toLowerCase().trim();
    if (cat.includes('general') || cat.includes('maintenance')) return 'bg-blue-100 text-blue-700';
    if (cat.includes('engine') || cat.includes('mechanical')) return 'bg-amber-100 text-amber-700';
    if (cat.includes('fuel')) return 'bg-rose-100 text-rose-700';
    if (cat.includes('ac') || cat.includes('electrical')) return 'bg-cyan-100 text-cyan-700';
    if (cat.includes('body') || cat.includes('exterior')) return 'bg-purple-100 text-purple-700';
    if (cat.includes('cleaning') || cat.includes('detailing')) return 'bg-emerald-100 text-emerald-700';
    if (cat.includes('tyre') || cat.includes('wheel')) return 'bg-teal-100 text-teal-700';
    if (cat.includes('inspection') || cat.includes('diagnostic')) return 'bg-indigo-100 text-indigo-700';
    if (cat.includes('battery') || cat.includes('charging')) return 'bg-yellow-100 text-yellow-700';
    if (cat.includes('roadside') || cat.includes('assistance')) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
};

// Module-level cache for instant 0ms page revisits
let cachedServicesList = null;
let cachedDisabledServices = null;
let cachedCustomServices = null;
let cachedServiceOverrides = null;
let cachedServicesTimestamp = 0;

const Services = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { triggerAlert } = useAlert();
    const { guardGuestAction } = useGuestGuard();
    const [servicesList, setServicesList] = useState(() => cachedServicesList || defaultServicesList);
    const [disabledServices, setDisabledServices] = useState(() => cachedDisabledServices || []);
    const [serviceOverrides, setServiceOverrides] = useState(() => cachedServiceOverrides || {});
    const [customServices, setCustomServices] = useState(() => cachedCustomServices || []);
    const isFetchingRef = useRef(false);

    // Edit Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    // Add Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newService, setNewService] = useState({
        name: '', category: '', fuelType: '', price: '', duration: '', active: true
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filter, Sort & Row Label States
    const [filterFuelType, setFilterFuelType] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_services_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Services',
            hasSort: true,
            groups: [
                {
                    id: 'fuelType',
                    label: 'Fuel Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Petrol', value: 'petrol' },
                        { label: 'Diesel', value: 'diesel' },
                        { label: 'EV', value: 'ev' },
                        { label: 'Premium', value: 'premium' },
                    ]
                },
                LABEL_FILTER_GROUP,
            ],
            initialValues: {
                fuelType: filterFuelType,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.fuelType !== undefined) setFilterFuelType(newValues.fuelType);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterFuelType('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterFuelType, labelFilter, sortOrder, timeRange]);

    const fetchSettings = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            // Fetch disabled services, custom services, and overrides in parallel
            const [resDisabled, resCustom, resOverrides] = await Promise.all([
                fetch(`${API_BASE_URL}/api/settings/disabledServices`),
                fetch(`${API_BASE_URL}/api/settings/customServices`),
                fetch(`${API_BASE_URL}/api/settings/serviceOverrides`)
            ]);

            const dataDisabled = await resDisabled.json();
            if (dataDisabled.success && dataDisabled.data) {
                setDisabledServices(dataDisabled.data);
                cachedDisabledServices = dataDisabled.data;
            }

            const dataCustom = await resCustom.json();
            let newlyAddedServices = [];
            if (dataCustom.success && dataCustom.data) {
                newlyAddedServices = dataCustom.data;
                setCustomServices(newlyAddedServices);
                cachedCustomServices = newlyAddedServices;
            }

            const dataOverrides = await resOverrides.json();
            const overrides = (dataOverrides.success && dataOverrides.data) ? dataOverrides.data : {};
            setServiceOverrides(overrides);
            cachedServiceOverrides = overrides;

            setServicesList(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const toAdd = newlyAddedServices.filter(s => !existingIds.has(s.id));

                const allServices = [...prev, ...toAdd];

                const withOverrides = allServices.map(s => {
                    if (overrides[s.name]) {
                        return { ...s, price: overrides[s.name].price || s.price, duration: overrides[s.name].duration || s.duration };
                    }
                    return s;
                });

                const categoryOrderRaw = [...new Set(defaultServicesList.map(s => s.category))];
                const getCategoryIndex = (cat) => {
                    const idx = categoryOrderRaw.indexOf(cat);
                    return idx !== -1 ? idx : 999;
                };

                const sorted = withOverrides.sort((a, b) => {
                    const fuelOrder = { 'Petrol': 1, 'Diesel': 2, 'EV': 3, 'Premium': 4 };
                    const fuelA = fuelOrder[a.fuelType] || 99;
                    const fuelB = fuelOrder[b.fuelType] || 99;
                    if (fuelA !== fuelB) return fuelA - fuelB;

                    const catA = getCategoryIndex(a.category);
                    const catB = getCategoryIndex(b.category);
                    if (catA !== catB) return catA - catB;

                    return 0;
                });

                cachedServicesList = sorted;
                cachedServicesTimestamp = Date.now();
                return sorted;
            });
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveService = async (updatedService) => {
        if (guardGuestAction()) return;
        // 1. Update local list state so it reflects instantly
        setServicesList(prev => {
            const next = prev.map(s => s.id === updatedService.id ? updatedService : s);
            cachedServicesList = next;
            return next;
        });
        setIsEditModalOpen(false);
        setSelectedService(null);

        // 2. Prepare the override map
        const newOverrides = { ...serviceOverrides };
        newOverrides[updatedService.name] = {
            price: updatedService.price,
            duration: updatedService.duration
        };
        setServiceOverrides(newOverrides);
        cachedServiceOverrides = newOverrides;

        // 3. Save to backend Settings
        try {
            await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'serviceOverrides', value: newOverrides })
            });
        } catch (err) {
            console.error("Failed to save service override:", err);
        }
    };

    const handleAddNewService = async () => {
        if (guardGuestAction()) return;
        if (!newService.name || !newService.category || !newService.fuelType) {
            triggerAlert("Please fill out Name, Category, and Fuel Type", "error");
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

            const sorted = rawItems.sort((a, b) => {
                const fuelOrder = { 'Petrol': 1, 'Diesel': 2, 'EV': 3, 'Premium': 4 };
                const fuelA = fuelOrder[a.fuelType] || 99;
                const fuelB = fuelOrder[b.fuelType] || 99;
                if (fuelA !== fuelB) return fuelA - fuelB;

                const catA = getCategoryIndex(a.category);
                const catB = getCategoryIndex(b.category);
                if (catA !== catB) return catA - catB;

                return 0;
            });
            cachedServicesList = sorted;
            return sorted;
        });

        setCustomServices(updatedCustomServices);
        cachedCustomServices = updatedCustomServices;

        setIsAddModalOpen(false);
        setNewService({ name: '', category: '', fuelType: '', price: '', duration: '', active: true });
        triggerAlert("New service added successfully", "success");

        // Save back to DB Settings key customServices
        try {
            await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'customServices', value: updatedCustomServices })
            });
        } catch (err) {
            console.error("Failed to save new custom service:", err);
        }
    };

    const confirmDeleteService = async () => {
        if (guardGuestAction()) return;
        if (!serviceToDelete) return;

        const isCustom = customServices.some(s => s.id === serviceToDelete.id);
        if (!isCustom) {
            triggerAlert("Cannot delete default system services. Toggle status to Inactive instead.", "error");
            setIsDeleteModalOpen(false);
            setServiceToDelete(null);
            return;
        }

        setDeleting(true);
        const updatedCustomServices = customServices.filter(s => s.id !== serviceToDelete.id);

        try {
            await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'customServices', value: updatedCustomServices })
            });
            setCustomServices(updatedCustomServices);
            cachedCustomServices = updatedCustomServices;
            setServicesList(prev => {
                const next = prev.filter(s => s.id !== serviceToDelete.id);
                cachedServicesList = next;
                return next;
            });
            triggerAlert("Service deleted successfully", "success");
            setIsDeleteModalOpen(false);
            setServiceToDelete(null);
        } catch (err) {
            console.error("Failed to delete custom service:", err);
            triggerAlert("Failed to delete service. Please try again.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const availableCategories = Array.from(new Set(
        servicesList
            .filter(s => s.fuelType === newService.fuelType && s.category)
            .map(s => s.category)
    ));

    const filteredServices = React.useMemo(() => {
        return servicesList.filter(service => {
            if (filterFuelType !== 'all') {
                const fuel = (service.fuelType || '').toLowerCase();
                if (fuel !== filterFuelType.toLowerCase()) return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[service.id || service._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = service.createdAt ? new Date(service.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            // 1. Primary sort by Fuel Type: Petrol (1) -> Diesel (2) -> EV (3) -> Premium (4)
            const fuelOrder = { 'petrol': 1, 'diesel': 2, 'ev': 3, 'premium': 4 };
            const fuelA = fuelOrder[(a.fuelType || '').toLowerCase()] || 99;
            const fuelB = fuelOrder[(b.fuelType || '').toLowerCase()] || 99;
            if (fuelA !== fuelB) return fuelA - fuelB;

            // 2. Secondary sort by Category order
            const categoryOrderRaw = [...new Set(defaultServicesList.map(s => s.category))];
            const catA = categoryOrderRaw.indexOf(a.category);
            const catB = categoryOrderRaw.indexOf(b.category);
            if (catA !== -1 && catB !== -1 && catA !== catB) return catA - catB;

            // 3. Fallback to Date / ID sorting
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB && timeA > 0 && timeB > 0) {
                return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
            }
            const idA = String(a.id || a._id || a.name || '');
            const idB = String(b.id || b._id || b.name || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [servicesList, filterFuelType, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredServices.length);
    }, [filteredServices.length, setResultsCount]);

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] flex flex-col transition-all duration-300`}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Services</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-12 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Plus size={16} /> ADD SERVICE
                </button>
            </div>

            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center uppercase border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-center text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[9.25%]">Service ID</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[22%]' : 'w-[19%]'}`}>Service Details</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[18%]' : 'w-[15.5%]'}`}>Category</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[11%]' : 'w-[8%]'}`}>Fuel Type</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[9%]' : 'w-[8%]'}`}>Price</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[10%]' : 'w-[9%]'}`}>Duration</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-center divide-[#e6f0fa]">
                            {filteredServices.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-sm text-gray-500">No services found.</td></tr>
                            ) : filteredServices.map((service) => (
                                <tr 
                                    key={service.id} 
                                    onClick={(e) => {
                                        if (isLabelMode) {
                                            e.stopPropagation();
                                            const sId = service.id || service._id;
                                            setActiveLabelRowId(prev => prev === sId ? null : sId);
                                        }
                                    }}
                                    className={`text-center text-xs transition-colors ${
                                        isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                    }`}
                                >
                                    <td className="p-4 relative font-semibold text-[#052558] text-sm text-center">
                                        <div className="relative flex items-center justify-center w-full">
                                            {Boolean(rowLabels[service.id || service._id]) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLabelRowId(prev => prev === (service.id || service._id) ? null : (service.id || service._id));
                                                    }}
                                                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                    title={`Label: ${stripEmoji(rowLabels[service.id || service._id] || 'Add label')}`}
                                                >
                                                    {renderLabelIcon(rowLabels[service.id || service._id], 16)}
                                                </button>
                                            )}

                                            {activeLabelRowId === (service.id || service._id) && (
                                                <FloatingLabelSelector 
                                                    rowId={service.id || service._id}
                                                    currentLabel={rowLabels[service.id || service._id]}
                                                    onSaveLabel={handleSaveRowLabel}
                                                    labelPopupRef={labelPopupRef}
                                                    positionClass="-left-4"
                                                />
                                            )}
                                            <span>{service.id || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="font-semibold text-sm">{service.name}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${getCategoryBadgeClass(service.category)}`}>
                                            {service.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                            (service.fuelType || '').toLowerCase() === 'ev' ? 'bg-emerald-100 text-emerald-700' :
                                            (service.fuelType || '').toLowerCase() === 'petrol' ? 'bg-amber-100 text-amber-700' :
                                            (service.fuelType || '').toLowerCase() === 'diesel' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {service.fuelType}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-semibold text-sm">{service.price}</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-semibold">
                                        {service.duration}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                            !disabledServices.includes(service.name) 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {!disabledServices.includes(service.name) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-4.5">
                                            <button
                                                className="text-gray-400 hover:text-blue-500"
                                                onClick={() => { setSelectedService(service); setIsEditModalOpen(true); }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-500"
                                                onClick={() => { setServiceToDelete(service); setIsDeleteModalOpen(true); }}
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

            {/* Edit Service Modal */}
            {isEditModalOpen && selectedService && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Edit Service
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 uppercase text-left">
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Service Name</label>
                                <input type="text" value={selectedService.name} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Category</label>
                                    <input type="text" value={selectedService.category} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Fuel Type</label>
                                    <input type="text" value={selectedService.fuelType} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Price</label>
                                    <input type="text" value={selectedService.price} onChange={(e) => setSelectedService({ ...selectedService, price: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Duration</label>
                                    <input type="text" value={selectedService.duration} onChange={(e) => setSelectedService({ ...selectedService, duration: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            <button
                                type="button"
                                onClick={() => handleSaveService(selectedService)}
                                className="flex-1 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                SAVE CHANGES
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Service Modal */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Add New Service
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 uppercase text-left">
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Service Name</label>
                                <input type="text" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Fuel Type</label>
                                    <select value={newService.fuelType} onChange={(e) => setNewService({ ...newService, fuelType: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Petrol">PETROL</option>
                                        <option value="Diesel">DIESEL</option>
                                        <option value="EV">EV</option>
                                        <option value="Premium">PREMIUM</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Category</label>
                                    <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value=""></option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Price</label>
                                    <input type="text" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Duration</label>
                                    <input type="text" value={newService.duration} onChange={(e) => setNewService({ ...newService, duration: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddNewService}
                                className="flex-1 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                ADD SERVICE
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsDeleteModalOpen(false); setServiceToDelete(null); }} />
                    <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 mt-4 mb-1 flex items-center justify-between text-center flex-col gap-4">
                            <div>
                                <h3 className="text-2xl uppercase font-bold text-[#011023]">Remove Service</h3>
                            </div>
                        </div>

                        <div className="p-5 text-center uppercase tracking-tight">
                            <h4 className="font-bold text-[#011023] mb-5">{serviceToDelete?.title}</h4>
                            <p className="text-gray-500 text-[13px] leading-relaxed">
                                Are you sure you want to permanently remove this service from the list? <br />
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>

                        <div className="pt-5 pb-5 grid grid-cols-2 gap-3 px-5">
                            <button onClick={() => { setIsDeleteModalOpen(false); setServiceToDelete(null); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-xs active:scale-95">CANCEL</button>
                            <button
                                onClick={confirmDeleteService}
                                disabled={deleting}
                                className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-0"
                            >
                                {deleting ? <><Loader2 size={16} className="animate-spin" /> REMOVING...</> : 'REMOVE'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Services;
