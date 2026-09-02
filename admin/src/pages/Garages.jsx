import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, MapPin, Eye, Edit, Trash2, X, Check, Briefcase, Users, Loader2 } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import punjabData from '../garagedata/punjab.json';
import haryanaData from '../garagedata/haryana.json';
import delhiData from '../garagedata/delhi.json';

const getOrderedTypes = (types = []) => {
    if (!Array.isArray(types) || types.length === 0) return [];
    const list = [...types];
    const hasDiesel = list.some(t => t.toLowerCase() === 'diesel');
    if (!hasDiesel || list.length <= 1) return list;

    const dieselItem = list.find(t => t.toLowerCase() === 'diesel');
    const others = list.filter(t => t.toLowerCase() !== 'diesel');

    const mid = Math.ceil(others.length / 2);
    const left = others.slice(0, mid);
    const right = others.slice(mid);

    return [...left, dieselItem, ...right];
};

const formatDocNumber = (...vals) => {
    for (const val of vals) {
        if (val && typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('cloudinary')) {
                return trimmed;
            }
        }
    }
    return '—';
};

const GARAGE_LOCATIONS = [...punjabData, ...haryanaData, ...delhiData];
const STATES = [...new Set(GARAGE_LOCATIONS.map(l => l.state))].sort();

const API = 'http://localhost:5001/api/garages';

const VEHICLE_TYPES = ['PETROL', 'DIESEL', 'EV'];

const emptyForm = { name: '', state: '', district: '', address: '', coordinates: '', type: [], rating: '', pickupDrop: '', workingHours: '', workingDays: '', ownerName: '', ownerContact: '', ownerEmail: '' };

import useHighlight from '../hooks/useHighlight';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Garages = () => {
    const { triggerAlert } = useAlert();
    const [garages, setGarages] = useState([]);
    const highlightedRow = useHighlight(garages);
    // Add highlightedRow state for visual feedback
    const [loading, setLoading] = useState(true);
    const [_search, _setSearch] = useState('');
    const [_filterState, _setFilterState] = useState('ALL');
    const [_filterDistrict, _setFilterDistrict] = useState('ALL');
    const [_filterType, _setFilterType] = useState('ALL');
    const [_lastRefreshed, setLastRefreshed] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);

    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
    const [garageEmployees, setGarageEmployees] = useState([]);
    const [_loadingEmployees, setLoadingEmployees] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [garageToDelete, setGarageToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filter, Sort & Row Label States
    const [filterVehicleType, setFilterVehicleType] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_garages_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Garages',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'vehicleType',
                    label: 'Vehicle Support',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Petrol', value: 'petrol' },
                        { label: 'Diesel', value: 'diesel' },
                        { label: 'EV', value: 'ev' },
                        { label: 'Premium', value: 'premium' },
                    ]
                }
            ],
            initialValues: {
                vehicleType: filterVehicleType,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.vehicleType !== undefined) setFilterVehicleType(newValues.vehicleType);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterVehicleType('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterVehicleType, labelFilter, sortOrder, timeRange]);

    const fetchGarageEmployees = async (garageId) => {
        setGarageEmployees([]);
        setLoadingEmployees(true);
        setIsEmployeesModalOpen(true);
        try {
            const res = await fetch(`http://localhost:5001/api/employees/garage/${garageId}`);
            if (res.ok) {
                const data = await res.json();
                setGarageEmployees(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const _formatDate = (dateStr, includeTime = true) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        if (!includeTime) return day;
        const time = date.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        return `${day} | ${time}`;
    };

    // ── Body Scroll Lock ──────────────────────────────────────
    useEffect(() => {
        if (showModal || viewTarget) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showModal, viewTarget]);

    const fetchGarages = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(API);
            const data = await res.json();
            if (data.success) setGarages(data.data);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Failed to fetch garages:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGarages();
        const interval = setInterval(() => fetchGarages(true), 5000);
        return () => clearInterval(interval);
    }, [fetchGarages]);

    const openAdd = () => { setForm(emptyForm); setEditTarget(null); setShowModal(true); };
    const openEdit = (g) => {
        setForm({ 
            name: g.name || '', 
            state: g.state || '', 
            district: g.district || '', 
            address: g.address || '', 
            coordinates: g.coordinates || '', 
            type: g.type || [], 
            rating: g.rating, 
            partner: g.partner, 
            pickupDrop: g.pickupDrop === true ? 'yes' : g.pickupDrop === false ? 'no' : '', 
            workingHours: g.workingHours || '',
            workingDays: g.workingDays || '',
            ownerName: g.ownerName || '', 
            ownerContact: g.ownerContact || '', 
            ownerEmail: g.ownerEmail || '' 
        });
        setEditTarget(g);
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(emptyForm); };
    const openView = (g) => setViewTarget(g);
    const closeView = () => setViewTarget(null);

    const toggleType = (t) => setForm(prev => ({
        ...prev,
        type: prev.type.includes(t) ? prev.type.filter(x => x !== t) : [...prev.type, t]
    }));

    const handleSave = async () => {
        if (!form.ownerName?.trim()) return triggerAlert('Owner Name is required', 'error');
        if (!form.ownerContact?.trim()) return triggerAlert('Owner Contact Number is required', 'error');
        if (form.ownerContact.trim().length !== 10) return triggerAlert('Contact Number must be 10 digits', 'error');
        if (!form.ownerEmail?.trim()) return triggerAlert('Owner Email Address is required', 'error');
        if (!form.name?.trim()) return triggerAlert('Garage Name is required', 'error');
        if (!form.state?.trim()) return triggerAlert('State is required', 'error');
        if (!form.district?.trim()) return triggerAlert('District is required', 'error');
        if (!form.coordinates?.trim()) return triggerAlert('Coordinates are required', 'error');
        if (!form.address?.trim()) return triggerAlert('Address is required', 'error');
        if (!Array.isArray(form.type) || form.type.length === 0) return triggerAlert('Please select at least one Vehicle Type', 'error');

        setSaving(true);
        try {
            const method = editTarget ? 'PUT' : 'POST';
            const url = editTarget ? `${API}/${editTarget._id}` : API;
            const payload = {
                ...form,
                pickupDrop: form.pickupDrop === 'yes' || form.pickupDrop === true ? true : false
            };
            if (payload.rating !== '' && payload.rating !== null && payload.rating !== undefined) {
                payload.rating = parseFloat(payload.rating);
            } else {
                delete payload.rating;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                await fetchGarages(true);
                triggerAlert(editTarget ? 'Garage updated successfully' : 'Garage added successfully', 'success');
                closeModal();
            } else {
                triggerAlert(data.message || 'Failed to save garage', 'error');
            }
        } catch {
            triggerAlert('Error saving garage', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!garageToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API}/${garageToDelete}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setGarages(prev => prev.filter(g => g._id !== garageToDelete));
                triggerAlert('Garage deleted successfully', 'success');
                setIsDeleteModalOpen(false);
                setGarageToDelete(null);
            } else {
                triggerAlert(data.message || 'Failed to delete garage', 'error');
            }
        } catch (err) {
            console.error('Error deleting garage:', err);
            triggerAlert('Error deleting garage', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const filteredGarages = React.useMemo(() => {
        return garages.filter(g => {
            if (_search) {
                const matches = [g.garageId, g.name, g.state, g.district, g.address].some(f =>
                    f?.toLowerCase().includes(_search.toLowerCase())
                );
                if (!matches) return false;
            }
            if (filterVehicleType !== 'all') {
                const types = (g.type || []).map(t => t.toLowerCase());
                if (!types.includes(filterVehicleType.toLowerCase())) return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[g._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = g.createdAt ? new Date(g.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.garageId || a._id || a.name || '');
            const idB = String(b.garageId || b._id || b.name || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [garages, _search, filterVehicleType, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredGarages.length);
    }, [filteredGarages.length, setResultsCount]);

    const _inputClass = "w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:bg-white/80 focus:border-[#052558] text-[#011023]";

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Garages</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openAdd}
                        className="px-12.5 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} /> ADD GARAGE
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[10.5%]">Garage ID</th>
                                <th className="p-4 font-bold text-center w-[15%]">Garage Name</th>
                                <th className="p-4 font-bold text-center w-[23%]">Location</th>
                                <th className="p-4 font-bold text-center w-[18%]">Vehicle Types</th>
                                <th className="p-4 font-bold text-center w-[8%]">Pickup</th>
                                <th className="p-4 font-bold text-center w-[7%]">Rating</th>
                                <th className="p-4 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredGarages.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">No garages found</td></tr>
                            ) : filteredGarages.map((garage) => {
                                const rowId = garage.garageId || garage._id;
                                return (
                                    <tr 
                                        key={garage._id} 
                                        id={`row-${rowId}`} 
                                        onClick={(e) => {
                                            if (isLabelMode) {
                                                e.stopPropagation();
                                                setActiveLabelRowId(prev => prev === garage._id ? null : garage._id);
                                            }
                                        }}
                                        className={`transition-all duration-1000 ${
                                            isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                        } ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : ''}`}
                                    >
                                        <td className="p-4 text-center w-[10%] relative font-semibold text-[#052558] text-sm">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[garage._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === garage._id ? null : garage._id);
                                                        }}
                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[garage._id] || 'Add label')}`}
                                                    >
                                                        {renderLabelIcon(rowLabels[garage._id], 16)}
                                                    </button>
                                                )}

                                                {activeLabelRowId === garage._id && (
                                                    <FloatingLabelSelector 
                                                        rowId={garage._id}
                                                        currentLabel={rowLabels[garage._id]}
                                                        onSaveLabel={handleSaveRowLabel}
                                                        labelPopupRef={labelPopupRef}
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span>{garage.garageId || garage._id.substring(0, 8).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center w-[16%]">
                                            <div className="font-semibold text-sm text-center">{garage.name}</div>
                                        </td>
                                        <td className="p-4 text-center w-[26%]">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <div className="text-center">
                                                    <div className="font-semibold text-gray-800 text-sm">{garage.district}, {garage.state}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{garage.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center w-[20%]">
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {getOrderedTypes(garage.type).map(t => (
                                                    <span key={t} className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                        t.toLowerCase() === 'ev' ? 'bg-emerald-100 text-emerald-700' :
                                                        t.toLowerCase() === 'petrol' ? 'bg-amber-100 text-amber-700' :
                                                        t.toLowerCase() === 'diesel' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            {garage.pickupDrop ? (
                                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-xs uppercase border border-transparent">Yes</span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-full text-xs uppercase border border-transparent">No</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center w-[8%]">
                                            <span className="inline-block px-4 py-1 bg-amber-100 text-amber-700 font-bold rounded-full text-xs border border-transparent">
                                                {garage.rating ? `${garage.rating}` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                garage.partner || garage.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {garage.partner || garage.isVerified ? 'VERIFIED' : 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => openView(garage)} className="text-gray-400 hover:text-blue-500">
                                                    <Eye size={17} />
                                                </button>
                                                <button onClick={() => openEdit(garage)} className="text-gray-400 hover:text-emerald-500">
                                                    <Edit size={17} />
                                                </button>
                                                <button onClick={() => { setGarageToDelete(garage._id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ADD GARAGE MODAL ─── */}
            {showModal && !editTarget && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={closeModal} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Add New Garage
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 uppercase text-left overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Name</label>
                                    <input value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Contact</label>
                                    <input type="tel" maxLength={10} value={form.ownerContact} onChange={e => setForm(p => ({ ...p, ownerContact: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Email</label>
                                    <input type="email" value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] lowercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Garage Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Working Hours</label>
                                    <select
                                        value={form.workingHours || ''}
                                        onChange={e => setForm(p => ({ ...p, workingHours: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        <option value="09:00 AM - 09:00 PM">09:00 AM - 09:00 PM</option>
                                        <option value="09:00 AM - 08:00 PM">09:00 AM - 08:00 PM</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Operating Cycles</label>
                                    <select
                                        value={form.workingDays || ''}
                                        onChange={e => setForm(p => ({ ...p, workingDays: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        <option value="Monday - Friday">Monday - Friday</option>
                                        <option value="Monday - Saturday">Monday - Saturday</option>
                                        <option value="Monday - Sunday">Monday - Sunday</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">State</label>
                                    <select
                                        value={form.state}
                                        onChange={e => setForm(p => ({ ...p, state: e.target.value, district: '', coordinates: '' }))}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">District</label>
                                    <select
                                        value={form.district}
                                        onChange={e => setForm(p => ({ ...p, district: e.target.value, coordinates: '' }))}
                                        disabled={!form.state}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {[...new Set(GARAGE_LOCATIONS.filter(l => l.state === form.state).map(l => l.district))].sort().map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Coordinates</label>
                                    <select
                                        value={form.coordinates}
                                        onChange={e => {
                                            const coords = e.target.value;
                                            const loc = GARAGE_LOCATIONS.find(l => `${l.lat}, ${l.lng}` === coords && l.state === form.state && l.district === form.district);
                                            setForm(p => ({
                                                ...p,
                                                coordinates: coords,
                                                address: loc ? `${loc.place}, ${loc.district}, ${loc.state} - ${loc.pincode}` : p.address
                                            }));
                                        }}
                                        disabled={!form.district}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {GARAGE_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map(l => (
                                            <option key={l.place} value={`${l.lat}, ${l.lng}`}>{l.lat}, {l.lng}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 w-full">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Address</label>
                                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Pickup &amp; Drop</label>
                                    <select value={form.pickupDrop === true || form.pickupDrop === 'yes' ? 'yes' : form.pickupDrop === false || form.pickupDrop === 'no' ? 'no' : ''} onChange={e => setForm(p => ({ ...p, pickupDrop: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="yes">YES</option>
                                        <option value="no">NO</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Vehicle Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {VEHICLE_TYPES.map(t => (
                                            <button key={t} type="button" onClick={() => toggleType(t)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[#cbd5e1] transition-all cursor-pointer ${form.type.includes(t) ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]' : 'bg-[#f8fafc] border-[#cbd5e1] text-[#011023] hover:bg-slate-100'}`}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            {/* <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                                Cancel
                            </button> */}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> ADDING...
                                    </>
                                ) : (
                                    'ADD GARAGE'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── EDIT GARAGE MODAL ─── */}
            {showModal && editTarget && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={closeModal} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Edit Garage
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 uppercase text-left overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Name</label>
                                    <input value={form.ownerName || ''} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Contact</label>
                                    <input readOnly value={form.ownerContact || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Email</label>
                                    <input readOnly value={form.ownerEmail || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Garage Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Working Hours</label>
                                    <select
                                        value={form.workingHours || ''}
                                        onChange={e => setForm(p => ({ ...p, workingHours: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        <option value="09:00 AM - 09:00 PM">09:00 AM - 09:00 PM</option>
                                        <option value="09:00 AM - 08:00 PM">09:00 AM - 08:00 PM</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Operating Cycles</label>
                                    <select
                                        value={form.workingDays || ''}
                                        onChange={e => setForm(p => ({ ...p, workingDays: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        <option value="Monday - Friday">Monday - Friday</option>
                                        <option value="Monday - Saturday">Monday - Saturday</option>
                                        <option value="Monday - Sunday">Monday - Sunday</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">State</label>
                                    <input readOnly value={form.state || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">District</label>
                                    <input readOnly value={form.district || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Coordinates</label>
                                    <input readOnly value={form.coordinates || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="space-y-2 w-full">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Address</label>
                                <input readOnly value={form.address || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Pickup &amp; Drop</label>
                                    <select value={form.pickupDrop === true || form.pickupDrop === 'yes' ? 'yes' : form.pickupDrop === false || form.pickupDrop === 'no' ? 'no' : ''} onChange={e => setForm(p => ({ ...p, pickupDrop: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="yes">YES</option>
                                        <option value="no">NO</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Vehicle Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {VEHICLE_TYPES.map(t => (
                                            <button key={t} type="button" onClick={() => toggleType(t)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[#cbd5e1] transition-all cursor-pointer ${form.type.includes(t) ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]' : 'bg-[#f8fafc] border-[#cbd5e1] text-[#011023] hover:bg-slate-100'}`}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            {/* <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                                Cancel
                            </button> */}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> SAVING...
                                    </>
                                ) : (
                                    'SAVE CHANGES'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── View Garage Modal ── */}
            {viewTarget && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={closeView}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Garage Details</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{viewTarget.garageId || viewTarget._id?.slice(0, 8)}</span></p>
                                    <button onClick={() => fetchGarageEmployees(viewTarget.garageId || viewTarget._id)} className="text-gray-400 transition-colors hover:text-blue-600 hover:bg-blue-50">
                                        <Eye size={17} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={closeView}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-10 w-full">
                                {/* Owner Info */}
                                <div className="space-y-2 w-full md:w-[33%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Owner Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-17 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{viewTarget.ownerName || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-17 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{viewTarget.ownerContact || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-17 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{viewTarget.ownerEmail || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Garage Info */}
                                <div className="space-y-2 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Garage Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-17 shrink-0">Name:</span> <span className="font-semibold ml-2 text-[#011023] truncate">{viewTarget.name || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-17 shrink-0">Phone:</span> <span className="font-semibold ml-2 text-gray-800 truncate">{viewTarget.garageContact || viewTarget.whatsapp || viewTarget.phone || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-17 shrink-0">Email:</span> <span className="font-semibold ml-2 text-gray-800 truncate">{viewTarget.garageEmail || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Other Details */}
                                <div className="space-y-2 w-full md:w-[37%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-1.75">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-29 shrink-0">Verification:</span>
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                                                (viewTarget.partner === true || viewTarget.partner === 'Active' || viewTarget.partner === 'active' || viewTarget.partner === 'completed' || viewTarget.partner === 'Completed' || viewTarget.verificationStatus === 'completed' || viewTarget.verificationStatus === 'Completed')
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {(viewTarget.partner === true || viewTarget.partner === 'Active' || viewTarget.partner === 'active' || viewTarget.partner === 'completed' || viewTarget.partner === 'Completed' || viewTarget.verificationStatus === 'completed' || viewTarget.verificationStatus === 'Completed')
                                                    ? 'COMPLETED'
                                                    : 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-29 shrink-0">Vehicles:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {getOrderedTypes(viewTarget.type).length > 0 ? (
                                                    getOrderedTypes(viewTarget.type).map(t => (
                                                        <span key={t} className={`inline-block px-2.5 py-1 text-xs font-semibold uppercase rounded-full ${
                                                            t.toLowerCase() === 'ev' ? 'bg-emerald-100 text-emerald-700' :
                                                            t.toLowerCase() === 'petrol' ? 'bg-amber-100 text-amber-700' :
                                                            t.toLowerCase() === 'diesel' ? 'bg-indigo-100 text-indigo-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>{t}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-semibold text-gray-600 uppercase">—</span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm flex items-center">
                                            <span className="text-gray-500 w-29 shrink-0">Joined At:</span>
                                            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                                <span>{viewTarget.createdAt ? new Date(viewTarget.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (viewTarget.joiningDate || viewTarget.joinedDate || viewTarget.date || '—')}</span>
                                                <span className="text-gray-800 font-semibold">|</span>
                                                <span>{viewTarget.createdAt ? new Date(viewTarget.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : (viewTarget.joiningTime || viewTarget.joinedTime || viewTarget.time || '—')}</span>
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Legal Details */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Legal Details</h4>
                                <div className="pt-3 pb-6">
                                    <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-2">
                                        <div className="flex justify-start w-[15%] shrink-0">
                                            <div className="flex flex-col items-center text-center">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">Owner's PAN Card</p>
                                                <p className="text-sm font-semibold text-[#052558] uppercase tracking-wider">{formatDocNumber(viewTarget.panCardNumber, viewTarget.panNumber, viewTarget.panCard)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center w-[20%] shrink-0">
                                            <div className="flex flex-col items-center text-center">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">Owner's Aadhaar Card</p>
                                                <p className="text-sm font-semibold text-[#052558] uppercase tracking-wider">{formatDocNumber(viewTarget.adharCardNumber, viewTarget.adharNumber, viewTarget.aadhaarCard, viewTarget.adharCard)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center w-[17%] shrink-0">
                                            <div className="flex flex-col items-center text-center">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">Owner's Voter ID</p>
                                                <p className="text-sm font-semibold text-[#052558] uppercase tracking-wider">{formatDocNumber(viewTarget.voterIdNumber, viewTarget.voterNumber, viewTarget.voterId)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center w-[18%] shrink-0">
                                            <div className="flex flex-col items-center text-center">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">GST Number</p>
                                                <p className="text-sm font-semibold text-[#052558] uppercase tracking-wider">{viewTarget.gstNumber || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center w-[10%] shrink-0">
                                            <div className="flex flex-col items-center text-center">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">SAC Code</p>
                                                <p className="text-sm font-semibold text-[#052558] uppercase tracking-wider">{viewTarget.sacCode || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mr-1 w-[9%] shrink-0">
                                            <div className="flex flex-col items-center text-center">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">HSN Code</p>
                                                <p className="text-sm font-semibold text-[#052558] uppercase tracking-wider">{viewTarget.hsnCode || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Location Archive</h4>
                                <div className="rounded-xl uppercase">
                                    <p className="text-xs font-semibold text-gray-400 tracking-tight mb-1 flex justify-between items-center">
                                        {/* <span className="text-[10px] text-gray-400 font-semibold">{viewTarget.district || '—'}, {viewTarget.state || '—'} &bull; {viewTarget.coordinates || '—'}</span> */}
                                    </p>
                                    <h5 className="font-semibold text-[#052558] text-sm">{viewTarget.address || 'No Address Provided'}</h5>
                                </div>
                            </div>
                        </div>
                        {/* Footer */}

                    </div>
                </div>,
                document.body
            )}

            {/* Garage Staff Modal */}
            {isEmployeesModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300" onClick={() => setIsEmployeesModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[50vh] animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="pt-6 pr-6 pl-6 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="text-xl uppercase font-bold text-[#011023] tracking-tight">Garage Staff List</h3>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Employee: <span className="text-[#011023] font-bold">{garageEmployees.length}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setIsEmployeesModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                            {garageEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <Users size={28} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-400 uppercase tracking-widest">No Employees Yet</h4>
                                    <p className="text-xs text-gray-300 mt-2 uppercase font-medium">This garage hasn't registered any staff members.</p>
                                </div>
                            ) : (
                                <div className="border border-[#e6f0fa] rounded-2xl overflow-y-auto max-h-[415px] shadow-sm bg-white hide-scrollbar">
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-gray-50 text-[12px] uppercase font-black tracking-widest text-gray-400 border-b border-[#e6f0fa] sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                <th className="p-4 w-[20%] text-center px-6">Emp ID</th>
                                                <th className="p-4 w-[35%] text-center">Employee Name</th>
                                                <th className="p-4 w-[25%] text-center">Contact</th>
                                                <th className="p-4 w-[20%] text-center px-6">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#e1ecf8]">
                                            {garageEmployees.map((employee) => (
                                                <tr key={employee._id} className="hover:bg-gray-50/50 transition-all duration-300">
                                                    <td className="p-4 text-center px-6">
                                                        <div className="font-semibold text-xs uppercase tracking-tight">{employee.userId || employee.employeeId || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="text-xs font-semibold text-[#011023] uppercase tracking-tight">{employee.name}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="text-xs font-semibold tracking-wider whitespace-nowrap">{employee.phone || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center px-6">
                                                        <span className={`inline-block px-3 py-1 text-[11px] font-bold uppercase rounded-full ${
                                                            employee.role === 'Technician' ? 'bg-amber-100 text-amber-700' :
                                                            employee.role === 'Support' ? 'bg-indigo-100 text-indigo-700' :
                                                            employee.role === 'Mechanic' ? 'bg-emerald-100 text-emerald-700' :
                                                            employee.role === 'Admin' ? 'bg-fuchsia-100 text-fuchsia-700' :
                                                            employee.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {employee.role || 'Staff'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setGarageToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Garage</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the garage <span className="text-[#052558] font-bold uppercase">{garages.find(g => g._id === garageToDelete)?.name}</span> from the system. 
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setGarageToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Garages;
