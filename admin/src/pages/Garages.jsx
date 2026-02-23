import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MapPin, Eye, Edit, Trash2, X, Check } from 'lucide-react';

const API = 'http://localhost:5001/api/garages';

const VEHICLE_TYPES = ['PETROL', 'DIESEL', 'EV', 'PREMIUM'];

const emptyForm = { name: '', state: '', district: '', address: '', coordinates: '', type: [], rating: '', pickupDrop: false, ownerName: '', ownerContact: '', ownerEmail: '' };

const Garages = () => {
    const [garages, setGarages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

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
        setForm({ name: g.name, state: g.state, district: g.district, address: g.address, type: g.type || [], rating: g.rating, partner: g.partner, pickupDrop: g.pickupDrop });
        setEditTarget(g);
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(emptyForm); };

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
                body: JSON.stringify({ ...form, rating: parseFloat(form.rating) || 0 })
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
                                <th className="p-4 font-bold text-center w-[15%]">Location</th>
                                <th className="p-4 font-bold text-center w-[20%]">Vehicle Types</th>
                                <th className="p-4 font-bold text-center w-[8%]">Pickup</th>
                                <th className="p-4 font-bold text-center w-[9%]">Rating</th>
                                <th className="p-4 font-bold text-center w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">No garages found</td></tr>
                            ) : filtered.map((garage) => (
                                <tr key={garage._id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-[#052558] tracking-widest">{garage.garageId}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023]">{garage.name}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start justify-center gap-1">
                                            <div>
                                                <div className="font-semibold text-gray-800 text-sm">{garage.district}, {garage.state}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 normal-case">{garage.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {(garage.type || []).map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {garage.pickupDrop ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 font-bold rounded-lg text-sm">Yes</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 font-bold rounded-lg text-sm">No</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 font-bold rounded-lg text-sm">
                                            {garage.rating || '—'} <span className="text-yellow-400">★</span>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ADD GARAGE MODAL (emerald, matches Services Add style) ─── */}
            {showModal && !editTarget && (
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
                                    <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">District</label>
                                    <input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Coordinates</label>
                                    <input value={form.coordinates || ''} onChange={e => setForm(p => ({ ...p, coordinates: e.target.value }))} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
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
                                    <select value={form.pickupDrop ? 'yes' : 'no'} onChange={e => setForm(p => ({ ...p, pickupDrop: e.target.value === 'yes' }))} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
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
                </div>
            )}

            {/* ─── EDIT GARAGE MODAL (blue, matches Services Edit style) ─── */}
            {showModal && editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                                    <Edit size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Edit Garage</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 tracking-widest">ID: {editTarget.garageId}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase">
                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5">Garage Name *</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">State</label>
                                    <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">District</label>
                                    <input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5">Address</label>
                                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Rating</label>
                                    <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} className="w-full px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10" />
                                </div>
                                <div className="flex flex-col justify-center gap-2.5 pl-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 uppercase">
                                        <input type="checkbox" checked={form.partner} onChange={e => setForm(p => ({ ...p, partner: e.target.checked }))} className="accent-blue-600 w-4 h-4" />
                                        Verified Partner
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 uppercase">
                                        <input type="checkbox" checked={form.pickupDrop} onChange={e => setForm(p => ({ ...p, pickupDrop: e.target.checked }))} className="accent-blue-600 w-4 h-4" />
                                        Pickup &amp; Drop
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-2">Vehicle Types</label>
                                <div className="flex gap-2 flex-wrap">
                                    {VEHICLE_TYPES.map(t => (
                                        <button key={t} type="button" onClick={() => toggleType(t)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.type.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/60 text-gray-500 border-gray-200 hover:border-blue-400'}`}
                                        >{t}</button>
                                    ))}
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
                </div>
            )}
        </div>
    );
};

export default Garages;
