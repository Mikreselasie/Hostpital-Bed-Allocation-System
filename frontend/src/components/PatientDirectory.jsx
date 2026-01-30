import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, User, Activity, Clock, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

export default function PatientDirectory() {
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('triage'); // 'triage', 'name', 'time'
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Waiting', 'Admitted'

    // Fetch Directory Data
    useEffect(() => {
        console.log('PatientDirectory: Fetching initial data...');
        fetch('http://localhost:5000/api/patients/directory')
            .then(res => {
                console.log('PatientDirectory: Response status:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('PatientDirectory: Received data:', data);
                console.log('PatientDirectory: Number of patients:', data.length);
                setPatients(data);
            })
            .catch(err => {
                console.error("PatientDirectory: Failed to fetch directory", err);
            });

        // Poll for updates every 5s
        const interval = setInterval(() => {
            fetch('http://localhost:5000/api/patients/directory')
                .then(res => res.json())
                .then(data => {
                    console.log('PatientDirectory: Poll update - patients count:', data.length);
                    setPatients(data);
                })
                .catch(err => console.error("PatientDirectory: Poll failed", err));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Derived Data
    const filteredPatients = useMemo(() => {
        let result = patients;

        // Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(p => p.status === statusFilter);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.id.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'triage') {
                return a.triageLevel - b.triageLevel;
            } else if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'time') {
                // Approximate time sort (joinedAt)
                return (b.joinedAt || 0) - (a.joinedAt || 0);
            }
            return 0;
        });

        return result;
    }, [patients, searchQuery, sortBy, statusFilter]);

    // Calculate stats
    const waitingCount = patients.filter(p => p.status === 'Waiting').length;
    const admittedCount = patients.filter(p => p.status === 'Admitted').length;

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Controls */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Patient Directory</h2>
                    <p className="text-slate-500">Master list of all admitted and waiting patients.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total</p>
                            <p className="text-lg font-bold text-slate-800">{patients.length}</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Waiting</p>
                            <p className="text-lg font-bold text-amber-600">{waitingCount}</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Admitted</p>
                            <p className="text-lg font-bold text-green-600">{admittedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex gap-4 items-center">
                        {/* Status Filter Chips */}
                        <div className="flex gap-2">
                            {['All', 'Waiting', 'Admitted'].map(filter => (
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

                        <div className="h-6 w-px bg-slate-200"></div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border border-slate-200 text-sm font-bold py-1.5 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="triage">Severity (Triage)</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="time">Recent Arrival</option>
                            </select>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Data Search (Name or ID)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Patient</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Triage</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPatients.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                                                <User size={16} />
                                            </div>
                                            <span className="font-bold text-slate-700">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{p.id}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={p.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <TriageBadge level={p.triageLevel} />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                        {p.location}
                                        {p.ward && <span className="text-xs font-normal text-slate-400 ml-1">({p.ward})</span>}
                                    </td>
                                </tr>
                            ))}
                            {filteredPatients.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-medium">
                                        No patients found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    if (status === 'Admitted') {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            <Activity size={12} /> Admitted
        </span>
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock size={12} /> Waiting
    </span>
}

function TriageBadge({ level }) {
    const colors = {
        1: "bg-red-100 text-red-700 border-red-200",
        2: "bg-orange-100 text-orange-700 border-orange-200",
        3: "bg-yellow-100 text-yellow-700 border-yellow-200",
        4: "bg-blue-100 text-blue-700 border-blue-200",
        5: "bg-slate-100 text-slate-700 border-slate-200"
    };

    return (
        <span className={clsx("px-2.5 py-1 rounded-md text-xs font-bold border", colors[level] || colors[5])}>
            Level {level}
        </span>
    );
}
