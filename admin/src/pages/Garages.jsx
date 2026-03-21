import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, MapPin, Eye, Edit, Trash2, X, Check, Briefcase, Users } from 'lucide-react';
import punjabData from '../garagedata/punjab.json';
import haryanaData from '../garagedata/haryana.json';
import delhiData from '../garagedata/delhi.json';

const GARAGE_LOCATIONS = [...punjabData, ...haryanaData, ...delhiData];
const STATES = [...new Set(GARAGE_LOCATIONS.map(l => l.state))].sort();

const API = 'http://localhost:5001/api/garages';

const VEHICLE_TYPES = ['PETROL', 'DIESEL', 'EV', 'PREMIUM'];

const emptyForm = { name: '', state: '', district: '', address: '', coordinates: '', type: [], rating: '', pickupDrop: '', ownerName: '', ownerContact: '', ownerEmail: '' };

import useHighlight from '../hooks/useHighlight';

const Garages = () => {
    const [garages, setGarages] = useState([]);
    const highlightedRow = useHighlight(garages);
    // Add highlightedRow state for visual feedback
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);

    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
    const [garageEmployees, setGarageEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

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

    const formatDate = (dateStr, includeTime = true) => {
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
        setForm({ name: g.name, state: g.state, district: g.district, address: g.address, coordinates: g.coordinates || '', type: g.type || [], rating: g.rating, partner: g.partner, pickupDrop: g.pickupDrop, ownerName: g.ownerName || '', ownerContact: g.ownerContact || '', ownerEmail: g.ownerEmail || '' });
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
        if (!form.name.trim()) return alert('Garage name is required');
        setSaving(true);
        try {
            const method = editTarget ? 'PUT' : 'POST';
            const url = editTarget ? `${API}/${editTarget._id}` : API;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, rating: form.rating !== '' ? parseFloat(form.rating) : null })
            });
            const data = await res.json();
            if (data.success) {
                await fetchGarages(true);
                closeModal();
            } else {
                alert(data.message || 'Failed to save garage');
            }
        } catch (err) {
            alert('Error saving garage');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this garage?')) return;
        try {
            await fetch(`${API}/${id}`, { method: 'DELETE' });
            setGarages(prev => prev.filter(g => g._id !== id));
        } catch (err) {
            alert('Error deleting garage');
        }
    };

    const filtered = garages.filter(g =>
        [g.garageId, g.name, g.state, g.district, g.address].some(f =>
            f?.toLowerCase().includes(search.toLowerCase())
        )
    );

    const inputClass = "w-full border border-[#e6f0fa] rounded-xl px-4 py-2.5 text-sm text-[#011023] focus:outline-none focus:border-[#527FB0] bg-white";

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Garages</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} /> Add Garage
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[10%]">Garage ID</th>
                                <th className="p-4 font-bold text-center w-[15%]">Garage Name</th>
                                <th className="p-4 font-bold text-center w-[23%]">Location</th>
                                <th className="p-4 font-bold text-center w-[14%]">Vehicle Types</th>
                                <th className="p-4 font-bold text-center w-[8%]">Pickup</th>
                                <th className="p-4 font-bold text-center w-[6%]">Rating</th>
                                <th className="p-4 font-bold text-center w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">No garages found</td></tr>
                            ) : filtered.map((garage) => {
                                const rowId = garage.garageId || garage._id;
                                return (
                                    <tr key={garage._id} id={`row-${rowId}`} className={`transition-all duration-1000 ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}>
                                        <td className="p-4">
                                            <div className="font-bold text-[#052558] tracking-widest">{garage.garageId}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-[#011023]">{garage.name}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <div className="text-center">
                                                    <div className="font-semibold text-gray-800 text-sm">{garage.district}, {garage.state}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5 normal-case">{garage.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {(garage.type || []).map(t => (
                                                    <span key={t} className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                                        t.toLowerCase() === 'ev' ? 'bg-emerald-100 text-emerald-700' :
                                                        t.toLowerCase() === 'petrol' ? 'bg-amber-100 text-amber-700' :
                                                        t.toLowerCase() === 'diesel' ? 'bg-indigo-100 text-indigo-700' :
                                                        t.toLowerCase() === 'hybrid' ? 'bg-purple-100 text-purple-700' :
                                                        t.toLowerCase() === 'cng' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {garage.pickupDrop ? (
                                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs uppercase">Yes</span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-xs uppercase">No</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-full text-xs">
                                                {garage.rating ? `${garage.rating}` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openView(garage)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View">
                                                    <Eye size={17} />
                                                </button>
                                                <button onClick={() => openEdit(garage)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                                    <Edit size={17} />
                                                </button>
                                                <button onClick={() => handleDelete(garage._id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
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

            {/* ─── ADD GARAGE MODAL (emerald, matches Services Add style) ─── */}
            {showModal && !editTarget && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Add New Garage</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Create a new garage entry</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase">
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
                                    <input value={form.ownerEmail} onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Garage Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">State</label>
                                    <select
                                        value={form.state}
                                        onChange={e => setForm(p => ({ ...p, state: e.target.value, district: '', coordinates: '' }))}
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
                                        onChange={e => setForm(p => ({ ...p, district: e.target.value, coordinates: '' }))}
                                        disabled={!form.state}
                                        className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {[...new Set(GARAGE_LOCATIONS.filter(l => l.state === form.state).map(l => l.district))].sort().map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Coordinates</label>
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
                                        className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer disabled:opacity-40"
                                    >
                                        <option value=""></option>
                                        {GARAGE_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map(l => (
                                            <option key={l.place} value={`${l.lat}, ${l.lng}`}>{l.lat}, {l.lng}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Address</label>
                                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>

                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Rating </label>
                                    <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 uppercase">Pickup &amp; Drop</label>
                                    <select value={form.pickupDrop === true ? 'yes' : form.pickupDrop === false ? 'no' : ''} onChange={e => setForm(p => ({ ...p, pickupDrop: e.target.value === '' ? '' : e.target.value === 'yes' }))} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="yes">YES</option>
                                        <option value="no">NO</option>
                                    </select>

                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Vehicle Types</label>
                                    <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 0.55fr 1.3fr' }}>
                                        {VEHICLE_TYPES.map(t => (
                                            <button key={t} type="button" onClick={() => toggleType(t)}
                                                className={`w-full py-2.5 rounded-lg text-xs font-bold border transition-all ${form.type.includes(t) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/60 text-gray-500 border-gray-200 hover:border-emerald-400'}`}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25 disabled:opacity-60">
                                {saving ? 'Adding…' : 'Add Garage'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── EDIT GARAGE MODAL (blue, matches Services Edit style) ─── */}
            {showModal && editTarget && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Edit Garage</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 tracking-widest">ID: {editTarget.garageId}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase">
                            {/* Row 1 — Owner fields */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Name</label>
                                    <input value={form.ownerName || ''} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none " />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Contact</label>
                                    <input readOnly value={form.ownerContact || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Owner Email</label>
                                    <input readOnly value={form.ownerEmail || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                            </div>
                            {/* Row 2 — Garage Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Garage Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none " />
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
                                    <input readOnly value={form.coordinates || ''} placeholder="—" className="w-full px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Address</label>
                                    <input readOnly value={form.address || ''} placeholder="—" className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                            </div>
                            {/* Row 4 — Rating, Pickup & Drop, Vehicle Types */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Rating</label>
                                    <input readOnly type="number" value={form.rating || ''} placeholder="—" className="w-full px-4 font-semibold text-xs py-2.5 bg-gray-100/60 border border-white/40 rounded-xl outline-none text-gray-400 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Pickup &amp; Drop</label>
                                    <select value={form.pickupDrop ? 'yes' : 'no'} onChange={e => setForm(p => ({ ...p, pickupDrop: e.target.value === 'yes' }))} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10">
                                        <option value="yes">YES</option>
                                        <option value="no">NO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Vehicle Types</label>
                                    <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 0.55fr 1.3fr' }}>
                                        {VEHICLE_TYPES.map(t => (
                                            <button key={t} type="button" onClick={() => toggleType(t)}
                                                className={`w-full py-2.5 rounded-lg text-xs font-bold border transition-all ${form.type.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/60 text-gray-500 border-gray-200 hover:border-blue-400'}`}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold uppercase text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 uppercase text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg hover:shadow-blue-600/25 disabled:opacity-60">
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── View Garage Modal ── */}
            {viewTarget && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm transition-all duration-300"
                    onClick={closeView}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Garage Details</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{viewTarget.garageId || viewTarget._id?.slice(0, 8)}</span></p>
                                    <button onClick={() => fetchGarageEmployees(viewTarget.garageId || viewTarget._id)} className="text-gray-400 p-1.5 rounded-lg transition-colors hover:text-blue-600 hover:bg-blue-50" title="Garage Staff">
                                        <Eye size={15} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={closeView}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Owner Info */}
                                <div className="space-y-2 w-full md:w-[42%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Owner Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{viewTarget.ownerName || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{viewTarget.ownerContact || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{viewTarget.ownerEmail || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Garage Info */}
                                <div className="space-y-2 w-full md:w-[42%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Garage Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold ml-2 text-[#011023] truncate">{viewTarget.name || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Rating:</span> <span className="font-semibold ml-2 text-gray-800">{viewTarget.rating ? `${viewTarget.rating} ★` : 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Pickup:</span> <span className="font-semibold ml-2 text-gray-800">{viewTarget.pickupDrop ? 'Yes' : 'No'}</span></p>
                                    </div>
                                </div>

                                {/* Other Details */}
                                {/* <div className="flex flex-col gap-4.5 w-full md:w-[32%]">
                                    <div className="space-y-1.25">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase mt-5 tracking-wider w-24">Partner</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className={`px-2.5 py-1 ml-3 mt-4 text-[10px] font-black rounded-lg uppercase tracking-wider ${viewTarget.partner ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                                    {viewTarget.partner ? 'Active' : 'No'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-4">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Vehicles</h4>
                                            <div className="flex flex-wrap gap-1.5 ml-3">
                                                {(viewTarget.type || []).length > 0 ? (
                                                    viewTarget.type.map(t => (
                                                        <span key={t} className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                                            t.toLowerCase() === 'ev' ? 'bg-emerald-100 text-emerald-700' :
                                                            t.toLowerCase() === 'petrol' ? 'bg-amber-100 text-amber-700' :
                                                            t.toLowerCase() === 'diesel' ? 'bg-indigo-100 text-indigo-700' :
                                                            t.toLowerCase() === 'hybrid' ? 'bg-purple-100 text-purple-700' :
                                                            t.toLowerCase() === 'cng' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>{t}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-600 uppercase">—</span>
                                                )}
                                            </div>
                                        </div>
                                    </div> 
                                </div>*/}
                            </div>

                            {/* Location Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Location Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1 flex justify-between items-center">
                                        <span>Geographic Allocation</span>
                                        {/* <span className="text-[10px] text-gray-400 font-semibold">{viewTarget.district || '—'}, {viewTarget.state || '—'} &bull; {viewTarget.coordinates || '—'}</span> */}
                                    </p>
                                    <h5 className="font-bold text-[#052558] text-[15.5px]">{viewTarget.address || 'No Address Provided'}</h5>
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#011023]/0 backdrop-blur-sm transition-all duration-300" onClick={() => setIsEmployeesModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[50vh] animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="pt-6 pr-6 pl-6 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="text-xl uppercase font-bold text-[#011023] tracking-tight">Garage Staff List</h3>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Employee: <span className="text-[#011023] font-black">{garageEmployees.length}</span></p>
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
                                                        <div className="font-semibold text-gray-500 text-xs uppercase tracking-tight">{employee.userId || employee.employeeId || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="text-xs font-semibold text-[#011023] uppercase tracking-tight">{employee.name}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">{employee.phone || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center px-6">
                                                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full ${
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
        </div>
    );
};

export default Garages;
