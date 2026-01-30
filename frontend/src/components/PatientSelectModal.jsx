import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, User, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function PatientSelectModal({ isOpen, onClose, queue, onSelect }) {
    const [selectedPatient, setSelectedPatient] = useState(null);

    const handleConfirm = () => {
        if (selectedPatient) {
            onSelect(selectedPatient);
            onClose();
            setSelectedPatient(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Select Patient from Queue</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-3">
                    {queue.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p>No patients in waiting queue.</p>
                        </div>
                    ) : (
                        queue.map(patient => (
                            <div
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className={clsx(
                                    "p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all",
                                    selectedPatient?.id === patient.id
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                        : "border-slate-200 bg-white hover:border-blue-300 shadow-sm"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-full", patient.triageLevel === 1 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600")}>
                                        {patient.triageLevel === 1 ? <AlertTriangle size={16} /> : <User size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{patient.name}</p>
                                        <p className="text-xs text-slate-500">Triage Level: {patient.triageLevel}</p>
                                    </div>
                                </div>
                                {selectedPatient?.id === patient.id && <Check className="text-blue-600" size={20} />}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedPatient}
                        className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        Assign Selected
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
