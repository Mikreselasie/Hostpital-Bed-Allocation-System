import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, AlertTriangle } from 'lucide-react';

export default function TransferModal({ isOpen, onClose, sourceBed, beds, onTransfer }) {
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [availableBeds, setAvailableBeds] = useState([]);

    useEffect(() => {
        if (isOpen && beds) {
            // Filter for Available beds (excluding source obviously)
            setAvailableBeds(beds.filter(b => b.status === 'Available'));
        }
    }, [isOpen, beds]);

    const handleTransfer = () => {
        if (selectedTarget) {
            onTransfer(sourceBed, selectedTarget);
            onClose();
        }
    };

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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Transfer Patient</h3>
                        <p className="text-sm text-slate-500">Select a new bed for the patient.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6">
                    {/* Transfer Visual */}
                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl mb-6">
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase">From</p>
                            <p className="font-bold text-slate-800 text-lg">{sourceBed?.id}</p>
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{sourceBed?.ward}</span>
                        </div>
                        <ArrowRight className="text-blue-300" />
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase">To</p>
                            <p className="font-bold text-blue-700 text-lg">{selectedTarget ? selectedTarget.id : '?'}</p>
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">
                                {selectedTarget ? selectedTarget.ward : 'Select Bed'}
                            </span>
                        </div>
                    </div>

                    {/* Bed Selection */}
                    <label className="text-sm font-bold text-slate-700 block mb-2">Available Beds ({availableBeds.length})</label>
                    <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 grid grid-cols-3 gap-2">
                        {availableBeds.map(bed => (
                            <button
                                key={bed.id}
                                onClick={() => setSelectedTarget(bed)}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${selectedTarget?.id === bed.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                        : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                {bed.id} <span className="text-[10px] block text-slate-400 font-normal">{bed.ward}</span>
                            </button>
                        ))}
                        {availableBeds.length === 0 && (
                            <p className="col-span-3 text-center text-sm text-slate-400 py-4">No available beds.</p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg text-sm">Cancel</button>
                    <button
                        onClick={handleTransfer}
                        disabled={!selectedTarget}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                    >
                        Confirm Transfer
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
