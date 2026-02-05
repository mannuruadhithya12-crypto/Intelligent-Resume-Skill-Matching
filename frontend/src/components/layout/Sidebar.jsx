import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiPieChart, FiHome, FiUsers, FiSettings, FiClock, FiCpu } from 'react-icons/fi';
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
        <aside className="w-72 flex flex-col border-r border-white/5 bg-bg-deep/50 backdrop-blur-xl min-h-screen relative z-50">
            {/* Logo Area */}
            <div className="p-8 flex items-center gap-4">
                <div className="relative size-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-neon">
                    <FiCpu className="text-white text-xl animate-pulse-slow" />
                    <div className="absolute inset-0 bg-white/20 blur-lg rounded-2xl"></div>
                </div>
                <div>
                    <h1 className="font-display font-bold text-white text-xl tracking-tight leading-none">RecruitAI</h1>
                    <p className="text-[10px] text-primary-glow font-bold uppercase tracking-[0.2em] mt-1">Enterprise</p>
                </div>
            </div>

            <nav className="flex-1 px-6 space-y-2 mt-4">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            relative group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300
                            ${isActive
                                ? 'text-white bg-white/5 shadow-lg shadow-primary/10 border border-primary/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`transition-colors duration-300 ${isActive ? 'text-primary-glow' : 'text-slate-500 group-hover:text-primary-glow'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-neon"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Area with Logout */}
            <div className="p-6 mt-auto space-y-6">
                <UsageStats />

                <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1px]">
                            <div className="size-full rounded-full bg-bg-deep flex items-center justify-center text-xs font-bold text-white">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user?.full_name || 'User'}</p>
                            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                                <FiLogOut size={10} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
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
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 text-primary transform translate-x-1/3 -translate-y-1/3 group-hover:rotate-12 transition-transform duration-700">
                <FiCpu size={50} />
            </div>

            <div className="flex justify-between items-center mb-3 relative z-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculations</h4>
                <span className="text-[10px] font-mono text-primary-glow">{usage}/{limit}</span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10">
                <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-neon transition-all duration-1000"
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
}
