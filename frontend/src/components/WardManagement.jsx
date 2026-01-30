import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowLeftRight, UserMinus, User, Activity, Clock, MoreHorizontal, X, Plus, Trash2 } from 'lucide-react';
// ... (imports)

import clsx from 'clsx';
import TransferModal from './TransferModal';

const WARDS = ['ICU', 'Cardiology', 'General', 'Pediatrics'];

const STATUS_COLORS = {
    'Available': 'bg-green-100 text-green-700 border-green-200 ring-green-100',
    'Occupied': 'bg-red-100 text-red-700 border-red-200 ring-red-100',
    'Cleaning': 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-yellow-100',
    'Reserved': 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-100',
    'Maintenance': 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-100',
    'Damaged': 'bg-rose-900 text-rose-100 border-rose-800 ring-rose-900'
};

export default function WardManagement({ beds }) {
    const [selectedWard, setSelectedWard] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Drawer State
    const [selectedPatient, setSelectedPatient] = useState(null); // Actually selecting a BED row

    // Transfer Modal State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferSourceBed, setTransferSourceBed] = useState(null);

    // Add Bed Dropdown State
    const [isAddBedOpen, setIsAddBedOpen] = useState(false);

    // Derived Data: Process ALL beds
    const wardRows = useMemo(() => {
        let filtered = beds;

        // 1. Ward Filter
        if (selectedWard !== 'All') {
            filtered = filtered.filter(b => b.ward === selectedWard);
        }

        // 2. Status Filter
        if (statusFilter !== 'All') {
            if (statusFilter === 'Occupied') {
                filtered = filtered.filter(b => b.status === 'Occupied');
            } else if (statusFilter === 'Available') {
                filtered = filtered.filter(b => b.status === 'Available');
            } else {
                // Generic status match if we add more buttons later
                filtered = filtered.filter(b => b.status === statusFilter);
            }
        }

        // 3. Search (Binary Search optimization possible if sorted, but linear is fine for <100 items)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.id.toLowerCase().includes(query) ||
                (b.status === 'Occupied' && b.patient && b.patient.name.toLowerCase().includes(query))
            );
        }

        // 4. Map to Row Data
        return filtered.map(b => ({
            ...b,
            patientName: b.status === 'Occupied' && b.patient ? b.patient.name : '-',
            priority: b.status === 'Occupied' ? (b.type === 'Critical' ? 'Critical' : 'Standard') : '-',
            los: b.status === 'Occupied' ? '3 Days' : '-'
        }));

    }, [beds, selectedWard, statusFilter, searchQuery]);

    // Actions
    const handleDischarge = async (bed) => {
        if (!confirm(`Discharge patient from ${bed.id}?`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/beds/${bed.id}/discharge`, {
                method: 'PATCH'
            });
            const data = await res.json();
            if (data.success) {
                alert(`Patient discharged. Bed ${bed.id} is now cleaning.`);
                setSelectedPatient(null); // Close drawer
            } else {
                alert("Discharge failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error discharging patient");
        }
    };

    const handleTransferClick = (bed) => {
        setTransferSourceBed(bed);
        setIsTransferOpen(true);
    };

    const executeTransfer = async (source, target) => {
        try {
            const res = await fetch('http://localhost:5000/api/beds/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceBedId: source.id,
                    targetBedId: target.id
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Transferred from ${source.id} to ${target.id}`);
                setSelectedPatient(null);
            } else {
                alert(`Transfer Failed: ${data.error}`);
            }
        } catch (err) {
            alert("Transfer Error");
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedPatient) return;
        try {
            const res = await fetch(`http://localhost:5000/api/beds/${selectedPatient.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.id) { // Success returns the updated bed object
                // Optimistic update
                setSelectedPatient(prev => ({ ...prev, status: newStatus }));
            } else {
                alert("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating status");
        }
    };

    const handleAddBed = async (ward) => {
        try {
            const res = await fetch('http://localhost:5000/api/beds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ward })
            });
            const data = await res.json();
            if (data.success) {
                alert(`New bed added to ${ward}: ${data.bed.id}`);
            } else {
                alert("Failed to add bed");
            }
        } catch (err) {
            console.error(err);
            alert("Error adding bed");
        }
    };

    const handleDeleteBed = async (bed) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete ${bed.id}?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/beds/${bed.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert(`${bed.id} deleted.`);
                setSelectedPatient(null);
            } else {
                alert("Failed to delete bed");
            }
        } catch (err) {
            console.error(err);
            alert("Delete error");
        }
    };

    // Metrics
    const occupancyRate = useMemo(() => {
        if (beds.length === 0) return 0;
        const occupied = beds.filter(b => b.status === 'Occupied').length;
        return Math.round((occupied / beds.length) * 100);
    }, [beds]);

    const criticalCount = useMemo(() => {
        return beds.filter(b => b.status === 'Occupied' && b.type === 'Critical').length;
    }, [beds]);

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Top Controls */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Ward Management</h2>
                    <p className="text-slate-500">Manage bed allocation, transfers, and discharges.</p>
                </div>

                {/* Ward Selector & Metrics */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <button
                            onClick={() => setIsAddBedOpen(!isAddBedOpen)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                        >
                            <Plus size={18} /> Add Bed
                        </button>

                        {/* Click-triggered Dropdown */}
                        {isAddBedOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
                                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Select Ward</p>
                                    <button onClick={() => setIsAddBedOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                </div>
                                {WARDS.map(w => (
                                    <button
                                        key={w}
                                        onClick={() => {
                                            handleAddBed(w);
                                            setIsAddBedOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
                                    >
                                        + {w}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-400 uppercase font-bold">Occupancy</p>
                            <p className="text-lg font-bold text-slate-800">{occupancyRate}%</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-400 uppercase font-bold">Critical</p>
                            <p className="text-lg font-bold text-red-600">{criticalCount}</p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200"></div>

                    <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm"
                    >
                        <option value="All">All Wards</option>
                        {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    {/* Filter Group */}
                    <div className="flex gap-2">
                        {['All', 'Occupied', 'Available'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={clsx(
                                    "px-4 py-1.5 text-sm font-medium rounded-lg transition-all border",
                                    statusFilter === filter
                                        ? "bg-white text-slate-800 border-slate-300 shadow-sm ring-1 ring-slate-200"
                                        : "bg-transparent text-slate-500 border-transparent hover:bg-slate-100"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Patient or Bed ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Bed ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Patient Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Priority</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Ward</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {wardRows.map((bed) => (
                                <tr
                                    key={bed.id}
                                    onClick={() => setSelectedPatient(bed)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{bed.id}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            {bed.status === 'Occupied' && <User size={16} className="text-slate-400" />}
                                            {bed.patientName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold border", STATUS_COLORS[bed.status] || STATUS_COLORS['Reserved'])}>
                                            {bed.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {bed.priority === 'Critical' ? (
                                            <span className="text-red-600 font-bold flex items-center gap-1"><Activity size={14} /> Critical</span>
                                        ) : (
                                            <span className="text-slate-400">{bed.priority}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{bed.ward}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {wardRows.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No beds found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Patient Detail Drawer */}
            <AnimatePresence>
                {selectedPatient && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
                        className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">{selectedPatient.patientName}</h3>
                            <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Vitals Mock */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-100 p-2 rounded-lg"><Activity className="text-blue-600" size={20} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-400 uppercase">Current Bed</p>
                                        <p className="text-xl font-bold text-blue-900">{selectedPatient.id}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-blue-400 uppercase font-bold">Pulse</p><p className="font-bold text-slate-700">82 bpm</p></div>
                                    <div><p className="text-xs text-blue-400 uppercase font-bold">BP</p><p className="font-bold text-slate-700">120/80</p></div>
                                </div>
                            </div>

                            {/* Meta Data */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
                                    <Clock size={16} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Admitted</p>
                                        <p className="text-sm font-medium text-slate-800">Oct 24, 2024 • 3 Days ago</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
                                    <User size={16} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Condition</p>
                                        <p className="text-sm font-medium text-slate-800">{selectedPatient.status === 'Occupied' ? 'Stable' : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>


                            {/* Status Changer for Non-Occupied Beds */}
                            {selectedPatient.status !== 'Occupied' && (
                                <div className="mt-6 border-t border-slate-100 pt-6">
                                    <label className="text-xs text-slate-400 font-bold uppercase block mb-3">Change Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Available', 'Cleaning', 'Maintenance', 'Damaged'].map(st => (
                                            <button
                                                key={st}
                                                onClick={() => handleStatusChange(st)}
                                                className={clsx(
                                                    "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
                                                    selectedPatient.status === st
                                                        ? "bg-slate-800 text-white border-slate-800"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
                            {selectedPatient.status === 'Occupied' ? (
                                <>
                                    <button
                                        onClick={() => handleTransferClick(selectedPatient)}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeftRight size={18} /> Transfer Patient
                                    </button>
                                    <button
                                        onClick={() => handleDischarge(selectedPatient)}
                                        className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                    >
                                        <UserMinus size={18} /> Discharge Patient
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-center text-sm text-slate-400 font-medium py-2">
                                        Current Status: <span className="font-bold text-slate-600">{selectedPatient.status}</span>
                                    </div>

                                    {/* Delete Option for Available/Damaged/Maintenance */}
                                    {['Available', 'Damaged', 'Maintenance'].includes(selectedPatient.status) && (
                                        <button
                                            onClick={() => handleDeleteBed(selectedPatient)}
                                            className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={18} /> Delete Bed
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TransferModal
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                sourceBed={transferSourceBed}
                beds={beds}
                onTransfer={executeTransfer}
            />
        </div >
    );
}
