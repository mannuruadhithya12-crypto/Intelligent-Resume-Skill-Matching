import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    const { logout, user } = useAuth();
    
    // Check if user has permission (Admin or HR Manager)
    const canViewAnalytics = user?.role === 'admin' || user?.role === 'hr_manager';

    const navItems = [
        { name: "Dashboard", path: "/", icon: "dashboard" },
        { name: "Analysis Report", path: "/report", icon: "analytics" },
        // Only show Analytics if permitted
        ...(canViewAnalytics ? [{ name: "Analytics", path: "/analytics", icon: "insights" }] : []),
        { name: "History", path: "/history", icon: "history" },
        { name: "Talent Pool", path: "/candidates", icon: "groups" },
        { name: "Settings", path: "/settings", icon: "settings" }
    ];

    return (
        <aside className="w-[240px] flex flex-col bg-[#F4F1EA] border-r border-[#E9E1DC] min-h-screen relative z-50">
            {/* Logo Area */}
            <div className="p-8 flex items-center gap-2">
                <div className="flex flex-col">
                    <h1 className="font-serif font-black text-text-primary text-[28px] tracking-tight leading-none">
                        Recruit<span className="text-primary-sage">AI</span>
                    </h1>
                    <p className="text-[9px] text-outline font-black uppercase tracking-[0.25em] mt-1.5 ml-0.5">
                        Enterprise
                    </p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-2">
                <p className="px-4 text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Main Menu</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-bold transition-all duration-200
                            ${isActive
                                ? 'text-[#3F7655] bg-[#E4F0D7] shadow-sm'
                                : 'text-text-secondary hover:text-text-primary hover:bg-[#E9E1DC]/50'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`material-symbols-outlined text-[20px] transition-colors duration-200 ${isActive ? 'text-[#3F7655]' : 'text-outline group-hover:text-text-primary'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Area with Logout */}
            <div className="p-4 mt-auto">
                <div className="bg-[#EFE6E2] p-4 rounded-[12px] flex items-center gap-3">
                    <div className="size-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-primary-sage shadow-sm flex-shrink-0">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-bold text-text-primary truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-text-secondary truncate">{user?.role?.replace('_', ' ') || 'Recruiter'}</p>
                    </div>
                    <button onClick={logout} className="text-outline hover:text-error transition-colors p-1" title="Sign Out">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
