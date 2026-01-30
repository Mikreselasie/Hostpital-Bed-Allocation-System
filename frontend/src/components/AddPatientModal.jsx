import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddPatientModal({ isOpen, onClose, onAdd }) {
    const [name, setName] = useState('');
    const [triage, setTriage] = useState(3); // Default: Urgent (Orange)

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({ name, triageLevel: triage });
        setName('');
        setTriage(3);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <UserPlus size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">New Admission</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Patient Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Triage Priority</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setTriage(level)}
                                        className={`py-3 rounded-lg font-bold text-sm border-2 transition-all flex flex-col items-center gap-1 ${triage === level
                                                ? getTriageActiveClasses(level)
                                                : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                            }`}
                                    >
                                        <span>{level}</span>
                                        <span className="text-[10px] uppercase font-bold">{getTriageLabel(level)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                        >
                            <Check size={20} /> Admit to Queue
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function getTriageActiveClasses(level) {
    if (level === 1) return "border-red-500 bg-red-50 text-red-600";
    if (level === 2) return "border-orange-500 bg-orange-50 text-orange-600";
    if (level === 3) return "border-yellow-500 bg-yellow-50 text-yellow-600";
    if (level === 4) return "border-blue-500 bg-blue-50 text-blue-600";
    return "border-slate-500 bg-slate-50 text-slate-600";
}

function getTriageLabel(level) {
    if (level === 1) return "Resus";
    if (level === 2) return "Emerg";
    if (level === 3) return "Urgent";
    if (level === 4) return "Less";
    return "Non-U";
}
