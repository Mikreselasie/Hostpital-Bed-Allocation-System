import React from 'react';
import { LayoutDashboard, BedDouble, Users, Sparkles, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function DashboardShell({ children, currentView, onViewChange }) {
    return (
        <div className="flex h-screen bg-medical-50 overflow-hidden flex-row flex-1">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl text-slate-800 tracking-tight">MedBed<span className="text-blue-600">OS</span></span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => onViewChange && onViewChange('dashboard')}
                    />
                    <NavItem
                        icon={<BedDouble size={20} />}
                        label="Ward Management"
                        active={currentView === 'ward'}
                        onClick={() => onViewChange && onViewChange('ward')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="Patient Queue"
                        active={currentView === 'directory'}
                        onClick={() => onViewChange && onViewChange('directory')}
                    />
                    <NavItem icon={<Sparkles size={20} />} label="Housekeeping" />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase">System Status</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-slate-700 font-medium">Online</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm w-full">
                    <h1 className="text-xl font-bold text-slate-800">
                        {currentView === 'dashboard' ? 'ICU / General Ward Overview' :
                            currentView === 'ward' ? 'Ward Management Console' :
                                'Patient Directory'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">Dr. Sarah Connor</p>
                            <p className="text-xs text-slate-500">Chief Officer</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">SC</div>
                    </div>
                </header>

                {/* Scrollable Canvas */}
                <div className="flex-1 overflow-auto p-8 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                active
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}>
            {icon}
            <span>{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
        </button>
    );
}
