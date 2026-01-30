import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiPieChart, FiHome, FiUsers, FiSettings, FiClock } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    const { logout, user } = useAuth();

    // Check if user has permission (Admin or HR Manager)
    const canViewAnalytics = user?.role === 'admin' || user?.role === 'hr_manager';

    const navItems = [
        { name: "Dashboard", path: "/", icon: <FiHome /> },
        { name: "Analysis Report", path: "/report", icon: <FiPieChart /> },
        // Only show Analytics if permitted
        ...(canViewAnalytics ? [{ name: "Analytics", path: "/analytics", icon: <FiPieChart /> }] : []),
        { name: "History", path: "/history", icon: <FiClock /> },
        { name: "Candidates", path: "/candidates", icon: <FiUsers /> },
        { name: "Settings", path: "/settings", icon: <FiSettings /> }
    ];

    return (
        <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-border-subtle bg-white dark:bg-bg-card min-h-screen transition-colors">
            <div className="p-6 flex items-center gap-3">
                <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white w-10 h-10 shadow-lg shadow-indigo-500/20">
                    <span className="material-symbols-outlined font-bold text-xl">AI</span>
                </div>
                <div>
                    <h1 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">RecruitAI</h1>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{user?.role ? user.role.replace('_', ' ').toUpperCase() : 'PLAN'}</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                            ${isActive
                                ? 'bg-indigo-50 dark:bg-primary text-indigo-600 dark:text-white shadow-sm dark:shadow-indigo-500/20'
                                : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}
                        `}
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Area with Logout */}
            <div className="p-4 mt-auto space-y-4">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <FiLogOut /> Logout
                </button>

                <UsageStats />
            </div>
        </aside>
    );
}

function UsageStats() {
    const [usage, setUsage] = React.useState(0);
    const limit = 1000;

    React.useEffect(() => {
        import('../../api').then(({ getHistory }) => {
            getHistory().then(data => setUsage(data.length)).catch(console.error);
        });
    }, []);

    const percent = Math.min((usage / limit) * 100, 100);

    return (
        <div className="bg-bg-deep border border-border-subtle rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Usage</h4>
                <span className="text-[10px] text-gray-400">{usage} / {limit}</span>
            </div>
            <div className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
}
