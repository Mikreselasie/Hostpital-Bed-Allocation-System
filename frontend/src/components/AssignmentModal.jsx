import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, BedDouble } from 'lucide-react';
import clsx from 'clsx';

export default function AssignmentModal({ isOpen, onClose, patient, beds, onAssign }) {
    const [selectedBed, setSelectedBed] = useState(null);
    const [availableBeds, setAvailableBeds] = useState([]);
    const [filterWard, setFilterWard] = useState('All');

    useEffect(() => {
        if (isOpen && beds) {
            setAvailableBeds(beds.filter(b => b.status === 'Available'));
        }
    }, [isOpen, beds]);

    const handleConfirm = () => {
        if (selectedBed) {
            onAssign(patient, selectedBed.id);
            onClose();
        }
    };

    const filteredBeds = availableBeds.filter(b => filterWard === 'All' || b.ward === filterWard);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Manual Bed Assignment</h3>
                        <p className="text-sm text-slate-500">Assigning bed for <span className="font-bold text-blue-600">{patient?.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
                    {['All', 'ICU', 'Cardiology', 'General', 'Pediatrics'].map(ward => (
                        <button
                            key={ward}
                            onClick={() => setFilterWard(ward)}
                            className={clsx(
                                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap",
                                filterWard === ward ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {ward}
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredBeds.map(bed => (
                            <button
                                key={bed.id}
                                onClick={() => setSelectedBed(bed)}
                                onDoubleClick={() => { setSelectedBed(bed); handleConfirm(); }}
                                className={clsx(
                                    "p-3 rounded-xl border text-left transition-all group relative overflow-hidden",
                                    selectedBed?.id === bed.id
                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                                )}
                            >
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{bed.ward}</span>
                                <span className={clsx("text-lg font-bold block", selectedBed?.id === bed.id ? "text-blue-700" : "text-slate-700")}>{bed.id}</span>
                                {selectedBed?.id === bed.id && (
                                    <div className="absolute top-2 right-2 text-blue-600"><Check size={16} /></div>
                                )}
                            </button>
                        ))}
                        {filteredBeds.length === 0 && (
                            <div className="col-span-full py-10 text-center text-slate-400 flex flex-col items-center">
                                <BedDouble size={40} className="mb-2 opacity-20" />
                                <p>No available beds in this ward.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                    <div className="text-sm">
                        {selectedBed ? (
                            <span className="text-slate-600">Selected: <strong className="text-slate-900">{selectedBed.id}</strong> ({selectedBed.ward})</span>
                        ) : (
                            <span className="text-slate-400">Please select a bed</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedBed}
                            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                        >
                            Assign Bed
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
