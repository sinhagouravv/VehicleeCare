import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, MapPin, Eye, Edit, Trash2, Settings, X, Check, Loader2 } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import punjabData from '../../../backend/chargingdata/punjab.json';
import haryanaData from '../../../backend/chargingdata/haryana.json';
import delhiData from '../../../backend/chargingdata/delhi.json';

const STATION_LOCATIONS = [...punjabData, ...haryanaData, ...delhiData];
const STATES = [...new Set(STATION_LOCATIONS.map(l => l.state))].sort();

const CHARGER_TYPES = ['Fast AC Charge', 'Fast DC Charge'];

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

const initialStations = [];

import useHighlight from '../hooks/useHighlight';

const ChargingStations = () => {
    const [stations, setStations] = useState(initialStations);
    const highlightedRow = useHighlight(stations);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stationToDelete, setStationToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchStations = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/charging-stations');
            const data = await res.json();
            if (data.success) {
                setStations(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch stations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStations();
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
        ? [...new Set(STATION_LOCATIONS.filter(l => l.state === form.state).map(l => l.district))].sort()
        : [];

    const availableAddresses = form.district
        ? STATION_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map(l => l.place).sort()
        : [];

    useEffect(() => {
        if (form.state && form.district && form.address) {
            const match = STATION_LOCATIONS.find(l => l.state === form.state && l.district === form.district && l.place === form.address);
            if (match && form.coordinates !== `${match.lat}, ${match.lng}`) {
                setForm(prev => ({ ...prev, coordinates: `${match.lat}, ${match.lng}` }));
            }
        }
    }, [form.state, form.district, form.address]);

    const handleSave = async () => {
        if (!form.name.trim()) return alert('Station name is required');
        setSaving(true);
        try {
            const url = editTarget
                ? `http://localhost:5001/api/charging-stations/${editTarget.id}`
                : 'http://localhost:5001/api/charging-stations';
            const method = editTarget ? 'PUT' : 'POST';

            let payload = { ...form };
            if (!editTarget) {
                payload.id = '67' + Math.floor(1000000 + Math.random() * 9000000).toString().replace(/0/g, '1');
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                if (editTarget) {
                    setStations(prev => prev.map(s => s.id === editTarget.id ? data.data : s));
                } else {
                    setStations(prev => [data.data, ...prev]);
                }
                closeModal();
            } else {
                alert(data.message || 'Error saving station');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save charging station');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteStation = async () => {
        if (!stationToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/charging-stations/${stationToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setStations(prev => prev.filter(s => s.id !== stationToDelete));
                setIsDeleteModalOpen(false);
                setStationToDelete(null);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete charging station');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = stations.filter(s =>
        [s.id, s.name, s.state, s.district, s.address].some(f =>
            f?.toLowerCase().includes(search.toLowerCase())
        )
    );

    const getStatusColor = (status) => {
        return status === 'Operational' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';
    };

    const inputClass = "w-full border border-[#e6f0fa] rounded-xl px-4 py-2.5 text-sm text-[#011023] focus:outline-none focus:border-[#527FB0] bg-white";

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Charging Stations</h1>
                <div className="flex items-center gap-3">
                    <button onClick={openAdd} className="flex items-center text-[13px] gap-2 uppercase px-12 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity">
                        <Plus size={18} /> Add Station
                    </button>
                </div>
            </div>

            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[10%]">Station ID</th>
                                <th className="p-4 font-bold text-center w-[15%]">Station Name</th>
                                <th className="p-4 font-bold text-center w-[25%]">Location</th>
                                <th className="p-4 font-bold text-center w-[8%]">Ports</th>
                                <th className="p-4 font-bold text-center w-[25%]">Charger Type</th>
                                <th className="p-4 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4 font-bold text-center w-[10%]">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] uppercase divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-gray-400 text-sm">No stations found</td></tr>
                            ) : filtered.map((station) => {
                                const rowId = station.id || station._id;
                                return (
                                    <tr key={station.id} id={`row-${rowId}`} className={`transition-all duration-1000 ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}>
                                        <td className="p-4 text-center w-[10%]">
                                            <span className="font-semibold text-sm">{station.id}</span>
                                        </td>
                                        <td className="p-4 text-center w-[15%]">
                                            <span className="font-semibold text-sm">{station.name}</span>
                                        </td>
                                        <td className="p-4 text-center w-[28%]">
                                            <div className="flex items-start justify-center gap-1.5">
                                                <div className="text-center">
                                                    <div className="font-semibold text-gray-800 text-sm">{station.district}, {station.state}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{station.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center w-[5%]">
                                            <span className="font-semibold text-sm">
                                                {station.ports}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[22%]">
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {(station.type || []).map(t => (
                                                    <span key={t} className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                        t.toLowerCase().includes('ac') ? 'bg-blue-100 text-blue-700' :
                                                        t.toLowerCase().includes('dc') ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusColor(station.status)}`}>
                                                {station.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => openView(station)} className="text-gray-400 hover:text-blue-500">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => openEdit(station)} className="text-gray-400 hover:text-blue-500">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => { setStationToDelete(station.id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500">
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
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Add New  Station</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Create a new station entry</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700"><X size={20} /></button>
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

                            {/* Row 2 — Station Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Station Name</label>
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
                                            const loc = STATION_LOCATIONS.find(l => `${l.lat}, ${l.lng}` === coords && l.state === form.state && l.district === form.district);
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
                                        {STATION_LOCATIONS.filter(l => l.state === form.state && l.district === form.district).map((l, i) => (
                                            <option key={`${l.lat}-${l.lng}-${i}`} value={`${l.lat}, ${l.lng}`}>{l.lat}, {l.lng}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Address / Place</label>
                                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                            </div>

                            {/* Row 4 — Ports, Status, Charger Types */}
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
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value="Operational">Operational</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Charger Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CHARGER_TYPES.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => toggleType(t)}
                                                className={`flex-1 py-2.5 uppercase rounded-lg text-xs font-bold border transition-all ${form.type.includes(t) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/60 text-gray-500 border-gray-200 hover:border-emerald-400'}`}
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
                            <button onClick={closeModal} className="px-5 py-2.5 text-sm uppercase font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm uppercase font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25 disabled:opacity-60">
                                {saving ? 'Adding…' : 'Add Station'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── EDIT STATION MODAL (blue) ─── */}
            {showModal && editTarget && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">Edit Station</h2>
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

                            {/* Row 2 — Station Name, State, District */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Station Name</label>
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

                            {/* Row 4 — Ports, Status, Charger Types */}
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
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Charger Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CHARGER_TYPES.map(t => (
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
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={closeView}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Station Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{viewTarget.id}</span></p>
                            </div>
                            <button onClick={closeView} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Owner Info */}
                                <div className="space-y-2 w-full md:w-[38%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Owner Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{viewTarget.ownerName || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{viewTarget.ownerContact || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{viewTarget.ownerEmail || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Station Info */}
                                <div className="space-y-2 w-full md:w-[26%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Station Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold ml-2 text-[#011023] truncate">{viewTarget.name || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Ports:</span> <span className="font-semibold ml-2 text-gray-800">{viewTarget.ports ?? '—'}</span></p>
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-16 shrink-0">Status:</span>
                                            <span className={`ml-2 inline-block px-3 py-0.5 text-[10px] font-bold uppercase rounded-full ${viewTarget.status === 'Operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {viewTarget.status || '—'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {/* Charger Types */}
                                <div className="space-y-2 w-full md:w-[33%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Charger Types</h4>
                                    <div className="flex flex-wrap gap-2 pt-3.5">
                                        {(viewTarget.type || []).length > 0 ? (
                                            (viewTarget.type || []).map(t => (
                                                <span key={t} className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                                    t.toLowerCase().includes('ac') ? 'bg-blue-100 text-blue-700' :
                                                    t.toLowerCase().includes('dc') ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>{t}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 font-bold uppercase">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Location Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Location Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1 flex justify-between items-center">
                                        <span>Geographic Allocation</span>
                                        <span className="text-[10px] text-gray-400 font-semibold normal-case"></span>
                                    </p>
                                    <h5 className="font-semibold text-[#052558] text-[15.5px]">{viewTarget.address || 'No Address Provided'}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setStationToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Remove Station</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the charging station <span className="text-[#052558] font-bold uppercase">{stations.find(s => s.id === stationToDelete)?.name}</span>. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setStationToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteStation}
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

export default ChargingStations;
