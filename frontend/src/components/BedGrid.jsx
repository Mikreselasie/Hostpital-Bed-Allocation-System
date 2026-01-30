import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import TransferModal from './TransferModal';

const STATUS_COLORS = {
    'Available': 'bg-status-available',
    'Occupied': 'bg-status-occupied',
    'Cleaning': 'bg-status-cleaning',
    'Reserved': 'bg-status-reserved'
};

const WARD_FILTERS = ['All', 'ICU', 'Cardiology', 'General', 'Pediatrics'];
const STATUS_FILTERS = ['All', 'Available', 'Occupied', 'Cleaning'];

import PatientSelectModal from './PatientSelectModal';

export default function BedGrid({ beds, queue, onBedClick, onAssign }) {
    const [selectedWard, setSelectedWard] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [search, setSearch] = useState('');
    const [activeBed, setActiveBed] = useState(null);

    // Transfer & Assign Logic State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    const filteredBeds = beds.filter(bed => {
        const matchesWard = selectedWard === 'All' || bed.ward === selectedWard;
        const matchesStatus = selectedStatus === 'All' || bed.status === selectedStatus;
        const matchesSearch = bed.id.toLowerCase().includes(search.toLowerCase());
        return matchesWard && matchesStatus && matchesSearch;
    });

    const handleTransferClick = () => {
        if (activeBed && activeBed.status === 'Occupied') {
            setIsTransferOpen(true);
        } else {
            alert("Only Occupied beds can transfer patients.");
        }
    };

    const handleAssignClick = () => {
        if (activeBed && activeBed.status === 'Available') {
            setIsAssignOpen(true);
        }
    };

    const handlePatientSelect = (patient) => {
        if (activeBed) {
            onAssign(patient, activeBed.id);
            setActiveBed(null);
        }
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
                setActiveBed(null); // Close drawer
            } else {
                alert(`Transfer Failed: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Transfer Error");
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full flex-1 shadow-sm min-h-[500px]">
            {/* Header & Controls */}
            <div className="flex flex-col space-y-4 mb-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Live Ward Map</h2>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Bed ID..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Ward Filter Pills */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {WARD_FILTERS.map(ward => (
                            <button
                                key={ward}
                                onClick={() => setSelectedWard(ward)}
                                className={clsx(
                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                                    selectedWard === ward ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {ward}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2"></div>

                    {/* Status Filter Chips */}
                    <div className="flex gap-2">
                        {STATUS_FILTERS.map(status => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={clsx(
                                    "px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-2",
                                    selectedStatus === status
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {status !== 'All' && <div className={clsx("w-2 h-2 rounded-full", STATUS_COLORS[status])} />}
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence>
                    {filteredBeds.map((bed) => (
                        <BedCard key={bed.id} bed={bed} onClick={() => setActiveBed(bed)} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Detail Drawer */}
            <AnimatePresence>
                {activeBed && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
                        onClick={() => setActiveBed(null)}
                    >
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="w-96 bg-white h-full shadow-2xl p-8 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold">{activeBed.id}</h3>
                                <button onClick={() => setActiveBed(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Status</label>
                                    <div className={clsx("mt-1 px-4 py-2 rounded-lg text-white font-bold inline-block", STATUS_COLORS[activeBed.status])}>
                                        {activeBed.status}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Ward Location</label>
                                    <p className="text-lg font-medium text-slate-800">{activeBed.ward}</p>
                                </div>

                                {activeBed.status === 'Occupied' && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <label className="text-xs text-blue-400 font-bold uppercase">Patient</label>
                                        <p className="text-lg font-bold text-blue-900">
                                            {activeBed.patient ? activeBed.patient.name : 'Unknown'}
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            {activeBed.patient && activeBed.patient.joinedAt
                                                ? `Joined Queue: ${new Date(activeBed.patient.joinedAt).toLocaleTimeString()}`
                                                : 'No admission time'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                {activeBed.status === 'Occupied' ? (
                                    <button
                                        onClick={handleTransferClick}
                                        className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Transfer Patient <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAssignClick}
                                        disabled={activeBed.status !== 'Available'}
                                        className={clsx(
                                            "w-full py-3 font-bold rounded-xl transition-colors",
                                            activeBed.status === 'Available'
                                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        {activeBed.status === 'Available' ? 'Assign Patient' : 'Not Available'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transfer Modal */}
            <TransferModal
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                sourceBed={activeBed}
                beds={beds}
                onTransfer={executeTransfer}
            />

            {/* Patient Select Modal */}
            <PatientSelectModal
                isOpen={isAssignOpen}
                onClose={() => setIsAssignOpen(false)}
                queue={queue}
                onSelect={handlePatientSelect}
            />
        </div>
    );
}

function BedCard({ bed, onClick }) {
    // Small helper for initials
    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4, shadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
            onClick={onClick}
            className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer relative overflow-hidden group min-h-[100px]"
        >
            <div className={clsx("absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full transition-colors duration-300", STATUS_COLORS[bed.status])} />

            <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-bold text-slate-400">{bed.id}</span>
                <div className={clsx("w-2 h-2 rounded-full", STATUS_COLORS[bed.status])} />
            </div>

            <div className="mb-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{bed.ward}</p>
                <div className="mt-1 h-6">
                    {bed.status === 'Occupied' ? (
                        <span className="font-bold text-slate-800">
                            {bed.patient ? getInitials(bed.patient.name) : '??'}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-300 italic">Empty</span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
