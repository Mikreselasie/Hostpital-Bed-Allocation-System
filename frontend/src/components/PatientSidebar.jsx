import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, User, AlertTriangle, MousePointerClick, Plus, Trash2, Clock, ArrowUpDown } from 'lucide-react';
import AssignmentModal from './AssignmentModal';
import AddPatientModal from './AddPatientModal';
import clsx from 'clsx';

export default function PatientSidebar({ queue, beds, onAssign, onManualAssign, onAddPatient, onRemovePatient }) {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [sortBy, setSortBy] = useState('priority'); // 'priority', 'name', 'severity'

    // Sort queue based on selected criteria
    const sortedQueue = useMemo(() => {
        const queueCopy = [...queue];

        if (sortBy === 'name') {
            return queueCopy.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'severity') {
            return queueCopy.sort((a, b) => a.triageLevel - b.triageLevel);
        } else {
            // Default: priority (already sorted by backend)
            return queueCopy;
        }
    }, [queue, sortBy]);

    const handleManualClick = (patient) => {
        setSelectedPatient(patient);
        setIsAssignmentModalOpen(true);
    };

    const handleAssignConfirm = (patient, bedId) => {
        onManualAssign(patient, bedId);
    };

    return (
        <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col h-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="font-bold text-slate-800 text-lg">ER Queue</h2>
                    <p className="text-xs text-slate-400 font-medium">Wait Room</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold flex items-center">{queue.length}</span>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white p-1.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                <ArrowUpDown size={14} className="text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Sort:</span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="priority">Priority (Default)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="severity">Severity (1-5)</option>
                </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <AnimatePresence>
                    {sortedQueue.map((patient) => (
                        <PatientCard
                            key={patient.id}
                            patient={patient}
                            onAssign={() => onAssign(patient)}
                            onManualAssign={() => handleManualClick(patient)}
                            onRemove={() => onRemovePatient(patient.id)}
                        />
                    ))}
                </AnimatePresence>
                {queue.length === 0 && (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-3">
                        <div className="bg-slate-50 p-4 rounded-full">
                            <User size={32} className="opacity-20" />
                        </div>
                        <p className="text-sm font-medium">No patients waiting.</p>
                    </div>
                )}
            </div>

            <AssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                patient={selectedPatient}
                beds={beds}
                onAssign={handleAssignConfirm}
            />

            <AddPatientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={onAddPatient}
            />
        </div>
    );
}

function PatientCard({ patient, onAssign, onManualAssign, onRemove }) {
    // Live Timer Logic
    const [waitTime, setWaitTime] = useState(calculateWaitTime(patient.joinedAt));

    useEffect(() => {
        const interval = setInterval(() => {
            setWaitTime(calculateWaitTime(patient.joinedAt));
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [patient.joinedAt]);

    function calculateWaitTime(joinedAt) {
        if (!joinedAt) return '0m';
        const diff = Date.now() - new Date(joinedAt).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        if (hrs > 0) return `${hrs}h ${mins % 60}m`;
        return `${mins}m`;
    }

    // Triage Styling
    const getBadgeStyle = (level) => {
        if (level === 1) return "bg-red-100 text-red-700 border-red-200";
        if (level <= 3) return "bg-orange-100 text-orange-700 border-orange-200";
        return "bg-blue-100 text-blue-700 border-blue-200";
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-all shadow-sm group relative"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={clsx("w-2 h-10 rounded-full", patient.triageLevel === 1 ? "bg-red-500" : patient.triageLevel <= 3 ? "bg-orange-400" : "bg-blue-400")}></div>
                    <div>
                        <span className="font-bold text-slate-700 block text-sm">{patient.name}</span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{patient.id}</span>
                    </div>
                </div>

                <div className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border uppercase", getBadgeStyle(patient.triageLevel))}>
                    Triage {patient.triageLevel}
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-3 mb-3 pl-5">
                <div className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded">
                    <Clock size={12} className="text-slate-400" />
                    <span>{waitTime}</span>
                </div>
            </div>

            <div className="flex gap-2 pl-5">
                <button
                    onClick={onAssign}
                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                    <ArrowLeftRight size={14} />
                    Smart
                </button>
                <button
                    onClick={onManualAssign}
                    className="flex-1 bg-slate-800 text-white hover:bg-slate-900 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                    <MousePointerClick size={14} />
                    Manual
                </button>
            </div>

            {/* Delete Button (Visible on Hover) */}
            <button
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Remove from Queue"
            >
                <Trash2 size={14} />
            </button>
        </motion.div>
    )
}
