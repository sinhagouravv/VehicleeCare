import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, MapPin, Eye, Edit, Trash2, Settings, X, Check } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import punjabData from '../../../backend/chargingdata/punjab.json';
import haryanaData from '../../../backend/chargingdata/haryana.json';
import delhiData from '../../../backend/chargingdata/delhi.json';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useHighlight from '../hooks/useHighlight';

const PARKING_LOCATIONS = [...punjabData, ...haryanaData, ...delhiData];
const STATES = [...new Set(PARKING_LOCATIONS.map(l => l.state))].sort();

const PARKING_TYPES = ['Fast AC Charge', 'Fast DC Charge'];

const emptyForm = {
    name: '',
    state: '',
    district: '',
    address: '',
    coordinates: '',
    ports: '',
    type: [],
    status: '',
    ownerName: '',
    ownerContact: '',
    ownerEmail: ''
};

const initialParkings = [];

const Parking = () => {
    const { triggerAlert } = useAlert();
    const [parkings, setParkings] = useState(initialParkings);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // Filter, Sort & Row Label States
    const [filterStatus, setFilterStatus] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_parking_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Parkings',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Operational', value: 'Operational' },
                        { label: 'Under Maintenance', value: 'Under Maintenance' },
                    ]
                }
            ],
            initialValues: {
                status: filterStatus,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) setFilterStatus(newValues.status);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterStatus('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterStatus, labelFilter, sortOrder, timeRange]);

    const fetchParkings = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/parkings');
            const data = await res.json();
            if (data.success) {
                setParkings(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch parkings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParkings();
    }, []);

    const openAdd = () => { setForm(emptyForm); setEditTarget(null); setShowModal(true); };
    const openEdit = (s) => {
        setForm({
            name: s.name,
            state: s.state,
            district: s.district,
            address: s.address,
            coordinates: s.coordinates || '',
            ports: s.ports || 1,
            type: s.type || [],
            status: s.status || 'Operational',
            ownerName: s.ownerName || '',
            ownerContact: s.ownerContact || '',
            ownerEmail: s.ownerEmail || ''
        });
        setEditTarget(s);
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(emptyForm); };
    const openView = (s) => setViewTarget(s);
    const closeView = () => setViewTarget(null);

    const toggleType = (t) => setForm(prev => ({
        ...prev,
        type: prev.type.includes(t) ? prev.type.filter(x => x !== t) : [...prev.type, t]
    }));

    // Auto-select District & Address based on Location Data hierarchy
    const availableDistricts = form.state
        ? [...new Set(PARKING_LOCATIONS.filter(l => l.state === form.state).map(l => l.district))].sort()
        : [];

    const availableAddresses = form.district
        ? PARKING_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map(l => l.place).sort()
        : [];

    useEffect(() => {
        if (form.state && form.district && form.address) {
            const match = PARKING_LOCATIONS.find(l => l.state === form.state && l.district === form.district && l.place === form.address);
            if (match && form.coordinates !== `${match.lat}, ${match.lng}`) {
                setForm(prev => ({ ...prev, coordinates: `${match.lat}, ${match.lng}` }));
            }
        }
    }, [form.state, form.district, form.address]);

    const handleSave = async () => {
        if (!form.name.trim()) return triggerAlert('Parking name is required', 'error');
        setSaving(true);
        try {
            const url = editTarget
                ? `http://localhost:5001/api/parkings/${editTarget.id}`
                : 'http://localhost:5001/api/parkings';
            const method = editTarget ? 'PUT' : 'POST';

            let payload = { ...form };
            if (!editTarget) {
                payload.id = '63' + Math.floor(1000000 + Math.random() * 9000000).toString().replace(/0/g, '1');
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                if (editTarget) {
                    setParkings(prev => prev.map(s => s.id === editTarget.id ? data.data : s));
                    triggerAlert('Parking updated successfully', 'success');
                } else {
                    setParkings(prev => [data.data, ...prev]);
                    triggerAlert('Parking added successfully', 'success');
                }
                closeModal();
            } else {
                triggerAlert(data.message || 'Error saving parking', 'error');
            }
        } catch (err) {
            console.error(err);
            triggerAlert('Failed to save parking', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`http://localhost:5001/api/parkings/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setParkings(prev => prev.filter(s => s.id !== id));
                triggerAlert('Parking deleted successfully', 'success');
            }
        } catch (err) {
            console.error(err);
            triggerAlert('Failed to delete parking', 'error');
        }
    };

    const filtered = React.useMemo(() => {
        return parkings.filter(s => {
            const matchesSearch = !search || [s.id, s.name, s.state, s.district, s.address].some(f =>
                f?.toLowerCase().includes(search.toLowerCase())
            );
            if (!matchesSearch) return false;

            if (filterStatus !== 'all' && s.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[s.id || s._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = s.createdAt ? new Date(s.createdAt) : null;
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
            const idA = String(a.id || a._id || a.name || '');
            const idB = String(b.id || b._id || b.name || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [parkings, search, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filtered.length);
    }, [filtered.length, setResultsCount]);

    const getStatusColor = (status) => {
        return (status === 'Operational' || status === 'Active' || status === 'Verified' || status === 'Working')
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
            : 'bg-amber-100 text-amber-800 border-amber-200';
    };

    const inputClass = "w-full border border-[#e6f0fa] rounded-xl px-4 py-2.5 text-sm text-[#011023] focus:outline-none focus:border-[#527FB0] bg-white";

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Parkings</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openAdd}
                        className="px-12 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} /> ADD PARKING
                    </button>
                </div>
            </div>

            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[10%]">Parking ID</th>
                                <th className="p-4 font-bold text-center w-[15%]">Parking Name</th>
                                <th className="p-4 font-bold text-center w-[28%]">Location</th>
                                <th className="p-4 font-bold text-center w-[5%]">Ports</th>
                                <th className="p-4 font-bold text-center w-[22%]">Parking Type</th>
                                <th className="p-4 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4 font-bold text-center w-[10%]">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">No parkings found</td></tr>
                            ) : filtered.map((parking) => (
                                <tr 
                                    key={parking.id} 
                                    onClick={(e) => {
                                        if (isLabelMode) {
                                            e.stopPropagation();
                                            const pId = parking.id || parking._id;
                                            setActiveLabelRowId(prev => prev === pId ? null : pId);
                                        }
                                    }}
                                    className={`transition-colors ${
                                        isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                    }`}
                                >
                                    <td className="p-4 text-center w-[10%] relative font-bold text-[#011023] tracking-widest">
                                        <div className="relative flex items-center justify-center w-full">
                                            {Boolean(rowLabels[parking.id || parking._id]) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLabelRowId(prev => prev === (parking.id || parking._id) ? null : (parking.id || parking._id));
                                                    }}
                                                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                    title={`Label: ${stripEmoji(rowLabels[parking.id || parking._id] || 'Add label')}`}
                                                >
                                                    {renderLabelIcon(rowLabels[parking.id || parking._id], 16)}
                                                </button>
                                            )}

                                            {activeLabelRowId === (parking.id || parking._id) && (
                                                <FloatingLabelSelector 
                                                    rowId={parking.id || parking._id}
                                                    currentLabel={rowLabels[parking.id || parking._id]}
                                                    onSaveLabel={handleSaveRowLabel}
                                                    labelPopupRef={labelPopupRef}
                                                    positionClass="-left-4"
                                                />
                                            )}
                                            <span>{parking.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[15%]">
                                        <span className="font-bold text-[#011023]">{parking.name}</span>
                                    </td>
                                    <td className="p-4 text-center w-[28%]">
                                        <div className="flex items-start justify-center gap-1.5">
                                            <div className="text-center">
                                                <div className="font-semibold text-gray-800 text-sm">{parking.district}, {parking.state}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{parking.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[5%]">
                                        <span className="font-black text-[#052558] text-[14px] ">
                                            {parking.ports}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[22%]">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {(parking.type || []).map(t => (
                                                <span key={t} className="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-100 text-gray-700">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusColor(parking.status)}`}>
                                            {parking.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => openView(parking)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Parking">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => openEdit(parking)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit Parking">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(parking.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
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

            {/* Add Parking Modal */}
            {showModal && !editTarget && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={closeModal} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Add Parking
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
                                    <input value={form.ownerContact} onChange={e => setForm(p => ({ ...p, ownerContact: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Owner Email</label>
                                    <input value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Parking Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">State</label>
                                    <select
                                        value={form.state}
                                        onChange={e => setForm(p => ({ ...p, state: e.target.value, district: '', address: '', coordinates: '' }))}
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
                                        onChange={e => setForm(p => ({ ...p, district: e.target.value, address: '', coordinates: '' }))}
                                        disabled={!form.state}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Coordinates</label>
                                    <select
                                        value={form.coordinates}
                                        onChange={e => {
                                            const coords = e.target.value;
                                            const loc = PARKING_LOCATIONS.find(l => `${l.lat}, ${l.lng}` === coords && l.state === form.state && l.district === form.district);
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
                                        {PARKING_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map((l, i) => (
                                            <option key={`${l.lat}-${l.lng}-${i}`} value={`${l.lat}, ${l.lng}`}>{l.lat}, {l.lng}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Address / Place</label>
                                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Ports</label>
                                    <select value={form.ports} onChange={e => setForm(p => ({ ...p, ports: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value="Operational">Operational</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Parking Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PARKING_TYPES.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => toggleType(t)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${form.type.includes(t) ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]' : 'bg-[#f8fafc] border-[#cbd5e1] text-[#011023] hover:bg-slate-100'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                                Cancel
                            </button>
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
                                    'ADD PARKING'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Parking Modal */}
            {showModal && editTarget && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={closeModal} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Edit Parking
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
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Parking Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">State</label>
                                    <input readOnly value={form.state || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">District</label>
                                    <input readOnly value={form.district || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Coordinates</label>
                                    <input readOnly value={form.coordinates || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Address / Place</label>
                                    <input readOnly value={form.address || ''} placeholder="—" className="w-full px-4 py-2.5 bg-slate-100 border border-[#cbd5e1] uppercase rounded-xl font-semibold font-sans text-xs text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Ports</label>
                                    <select value={form.ports} onChange={e => setForm(p => ({ ...p, ports: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value="Operational">Operational</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Parking Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PARKING_TYPES.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => toggleType(t)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${form.type.includes(t) ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]' : 'bg-[#f8fafc] border-[#cbd5e1] text-[#011023] hover:bg-slate-100'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                                Cancel
                            </button>
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

            {/* ── View Modal ── */}
            {viewTarget && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={closeView} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-slate-50/60 to-transparent">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023] uppercase">{viewTarget.name}</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 tracking-widest">ID: {viewTarget.id}</p>
                                </div>
                            </div>
                            <button onClick={closeView} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase">
                            {/* Row 1 — Owner */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Owner Name</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.ownerName || <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Owner Contact</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.ownerContact || <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-widest">Owner Email</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px] normal-case">{viewTarget.ownerEmail || <span className="text-gray-300">—</span>}</div>
                                </div>
                            </div>
                            {/* Row 2 — Parking Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Parking Name</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.name || <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">State</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.state || <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">District</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.district || <span className="text-gray-300">—</span>}</div>
                                </div>
                            </div>
                            {/* Row 3 — Coordinates + Address */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Coordinates</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px] normal-case">{viewTarget.coordinates || <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Address</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.address || <span className="text-gray-300">—</span>}</div>
                                </div>
                            </div>
                            {/* Row 4 — Ports, Status, Parking Types */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Ports</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.ports ?? <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Status</label>
                                    <div className="px-4 py-2.5 bg-gray-100/60 border border-white/40 rounded-xl text-xs font-semibold text-[#011023] min-h-[38px]">{viewTarget.status || <span className="text-gray-300">—</span>}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Parking Types</label>
                                    <div className="flex gap-2">
                                        {(viewTarget.type || []).map(t => (
                                            <div key={t} className="flex-1 py-1.5 text-center rounded-lg text-xs font-bold border bg-gray-100/60 border-white/40 text-[#011023]">{t}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Parking;
