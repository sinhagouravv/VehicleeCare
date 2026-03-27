import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, MapPin, Eye, Edit, Trash2, Settings, X, Check } from 'lucide-react';
import punjabData from '../../../backend/chargingdata/punjab.json';
import haryanaData from '../../../backend/chargingdata/haryana.json';
import delhiData from '../../../backend/chargingdata/delhi.json';

const STORE_LOCATIONS = [...punjabData, ...haryanaData, ...delhiData];
const STATES = [...new Set(STORE_LOCATIONS.map(l => l.state))].sort();

const STORE_TYPES = ['Fast AC Charge', 'Fast DC Charge'];

const emptyForm = {
    name: '',
    state: '',
    district: '',
    address: '',
    coordinates: '',
    ports: 1,
    type: [],
    status: 'Operational',
    ownerName: '',
    ownerContact: '',
    ownerEmail: ''
};

const initialStores = [];

import useHighlight from '../hooks/useHighlight';

const Store = () => {
    const [stores, setStores] = useState(initialStores);
    const highlightedRow = useHighlight(stores);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/stores');
            const data = await res.json();
            if (data.success) {
                setStores(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
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
        ? [...new Set(STORE_LOCATIONS.filter(l => l.state === form.state).map(l => l.district))].sort()
        : [];

    const availableAddresses = form.district
        ? STORE_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map(l => l.place).sort()
        : [];

    useEffect(() => {
        if (form.state && form.district && form.address) {
            const match = STORE_LOCATIONS.find(l => l.state === form.state && l.district === form.district && l.place === form.address);
            if (match && form.coordinates !== `${match.lat}, ${match.lng}`) {
                setForm(prev => ({ ...prev, coordinates: `${match.lat}, ${match.lng}` }));
            }
        }
    }, [form.state, form.district, form.address]);

    const handleSave = async () => {
        if (!form.name.trim()) return alert('Store name is required');
        setSaving(true);
        try {
            const url = editTarget
                ? `http://localhost:5001/api/stores/${editTarget.id}`
                : 'http://localhost:5001/api/stores';
            const method = editTarget ? 'PUT' : 'POST';

            let payload = { ...form };
            if (!editTarget) {
                payload.id = '62' + Math.floor(1000000 + Math.random() * 9000000).toString().replace(/0/g, '1');
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                if (editTarget) {
                    setStores(prev => prev.map(s => s.id === editTarget.id ? data.data : s));
                } else {
                    setStores(prev => [data.data, ...prev]);
                }
                closeModal();
            } else {
                alert(data.message || 'Error saving store');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save store');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this store?')) return;
        try {
            const res = await fetch(`http://localhost:5001/api/stores/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setStores(prev => prev.filter(s => s.id !== id));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete store');
        }
    };

    const filtered = stores.filter(s =>
        [s.id, s.name, s.state, s.district, s.address].some(f =>
            f?.toLowerCase().includes(search.toLowerCase())
        )
    );

    const getStatusColor = (status) => {
        return status === 'Operational' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';
    };

    const inputClass = "w-full border border-[#e6f0fa] rounded-xl px-4 py-2.5 text-sm text-[#011023] focus:outline-none focus:border-[#527FB0] bg-white";

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Stores</h1>
                <div className="flex items-center gap-3">
                    <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        <Plus size={18} /> Add Store
                    </button>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[13px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center">Store ID</th>
                                <th className="p-4 font-bold text-center">Store Name</th>
                                <th className="p-4 font-bold text-center">Location</th>
                                <th className="p-4 font-bold text-center">Store Type</th>
                                <th className="p-4 font-bold text-center">Delivery</th>
                                <th className="p-4 font-bold text-center">Status</th>
                                <th className="p-4 font-bold text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">No stores found</td></tr>
                            ) : filtered.map((store) => {
                                const rowId = store.id || store._id;
                                return (
                                    <tr key={store.id || store._id} id={`row-${rowId}`} className={`transition-all duration-1000 ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-[#011023] tracking-widest">{store.id}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-[#011023]">{store.name}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-start justify-center gap-1.5">
                                                <div className="text-center">
                                                    <div className="font-semibold text-gray-800 text-sm">{store.district}, {store.state}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{store.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-black text-[#052558] text-[14px] ">
                                                {store.ports}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {(store.type || []).map(t => (
                                                    <span key={t} className="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-100 text-gray-700">{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(store.status)}`}>
                                                {store.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openView(store)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Store">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => openEdit(store)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit Store">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(store.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={16} />
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

            {/* ─── ADD STATION MODAL (emerald) ─── */}
            {showModal && !editTarget && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Add New  Store</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Create a new store entry</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase">
                            {/* Row 1 — Owner Details */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Name</label>
                                    <input value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Contact</label>
                                    <input value={form.ownerContact} onChange={e => setForm(p => ({ ...p, ownerContact: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Email</label>
                                    <input value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none normal-case" />
                                </div>
                            </div>

                            {/* Row 2 — Store Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Store Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">State</label>
                                    <select
                                        value={form.state}
                                        onChange={e => setForm(p => ({ ...p, state: e.target.value, district: '', address: '', coordinates: '' }))}
                                        className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">District</label>
                                    <select
                                        value={form.district}
                                        onChange={e => setForm(p => ({ ...p, district: e.target.value, address: '', coordinates: '' }))}
                                        disabled={!form.state}
                                        className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row 3 — Coordinates + Address */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Coordinates</label>
                                    <select
                                        value={form.coordinates}
                                        onChange={e => {
                                            const coords = e.target.value;
                                            const loc = STORE_LOCATIONS.find(l => `${l.lat}, ${l.lng}` === coords && l.state === form.state && l.district === form.district);
                                            setForm(p => ({
                                                ...p,
                                                coordinates: coords,
                                                address: loc ? `${loc.place}, ${loc.district}, ${loc.state} - ${loc.pincode}` : p.address
                                            }));
                                        }}
                                        disabled={!form.district}
                                        className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {STORE_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map((l, i) => (
                                            <option key={`${l.lat}-${l.lng}-${i}`} value={`${l.lat}, ${l.lng}`}>{l.lat}, {l.lng}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Address / Place</label>
                                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                            </div>

                            {/* Row 4 — Ports, Status, Store Types */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Store Type</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Cafe">Cafe</option>
                                        <option value="Grocery">Grocery</option>
                                        <option value="Restaurant">Restaurant</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Operational">Operational</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Delevery</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 uppercase text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 uppercase text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25 disabled:opacity-60">
                                {saving ? 'Adding…' : 'Add Store'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── EDIT STATION MODAL (blue) ─── */}
            {showModal && editTarget && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Edit Store</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 tracking-widest">ID: {editTarget.id}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase">
                            {/* Row 1 — Owner Details */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Name</label>
                                    <input value={form.ownerName || ''} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Contact</label>
                                    <input readOnly value={form.ownerContact || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Email</label>
                                    <input readOnly value={form.ownerEmail || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed normal-case" />
                                </div>
                            </div>

                            {/* Row 2 — Store Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Store Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">State</label>
                                    <input readOnly value={form.state || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">District</label>
                                    <input readOnly value={form.district || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                            </div>

                            {/* Row 3 — Coordinates + Address */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Coordinates</label>
                                    <input readOnly value={form.coordinates || ''} placeholder="—" className="w-full px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed normal-case" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Address / Place</label>
                                    <input readOnly value={form.address || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                            </div>

                            {/* Row 4 — Ports, Status, Store Types */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Ports</label>
                                    <select value={form.ports} onChange={e => setForm(p => ({ ...p, ports: parseInt(e.target.value) || 1 }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10">
                                        <option value="Operational">Operational</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Store Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {STORE_TYPES.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => toggleType(t)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.type.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/60 text-gray-500 border-gray-200 hover:border-blue-400'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg hover:shadow-blue-600/25 disabled:opacity-60">
                                {saving ? 'Saving…' : 'Save Changes'}
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
                            {/* Row 2 — Store Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Store Name</label>
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
                            {/* Row 4 — Ports, Status, Store Types */}
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
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest">Store Types</label>
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

export default Store;
