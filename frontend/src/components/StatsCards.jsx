import React from 'react';
import { Users, Bed, Clock, AlertCircle } from 'lucide-react';

export default function StatsCards({ beds, queue }) {
    // Calculate Stats
    const totalBeds = beds.length || 50;
    const occupied = beds.filter(b => b.status === 'Occupied').length;
    const available = beds.filter(b => b.status === 'Available').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                label="Occupancy Rate"
                value={`${occupancyRate}%`}
                desc={`${occupied}/${totalBeds} Beds in use`}
                icon={<Bed className="text-blue-600" />}
                trend="+2.4%"
                color="bg-blue-50"
            />
            <StatCard
                label="Available Beds"
                value={available}
                desc="Ready for admission"
                icon={<div className="w-4 h-4 rounded-full bg-status-available" />}
                color="bg-green-50"
            />
            <StatCard
                label="Pending Discharges"
                value="4"
                desc="Scheduled for today"
                icon={<Clock className="text-orange-500" />}
                color="bg-orange-50"
            />
            <StatCard
                label="ER Waitlist"
                value={queue.length}
                desc="Patients waiting"
                icon={<AlertCircle className="text-red-500" />}
                color="bg-red-50"
                alert={queue.length > 5}
            />
        </div>
    );
}

function StatCard({ label, value, desc, icon, color, alert }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} flex items-center justify-center`}>
                    {icon}
                </div>
                {alert && <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">High</span>}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{label}</p>
                <p className="text-xs text-slate-400 mt-2 border-t pt-2 border-slate-50">{desc}</p>
            </div>
        </div>
    );
}
