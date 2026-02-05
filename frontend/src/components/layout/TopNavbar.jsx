import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiBell, FiGrid } from 'react-icons/fi';

export default function TopNavbar() {
    const { user } = useAuth();

    return (
        <header className="h-20 flex items-center justify-between px-8 py-4 sticky top-0 z-40">
            {/* Blurry background helper */}
            <div className="absolute inset-0 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5 z-0"></div>

            {/* Content container */}
            <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-display font-bold text-white tracking-tight">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-glow to-secondary">{user?.full_name?.split(' ')[0] || 'User'}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search - Glass Style */}
                    <div className="relative group">
                        <input
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all w-72 placeholder-slate-500 shadow-inner"
                            placeholder="Search candidates, skills, or jobs..."
                        />
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative">
                            <FiBell size={20} />
                            <span className="absolute top-2.5 right-2.5 size-2 bg-secondary rounded-full border border-bg-deep animate-pulse"></span>
                        </button>

                        <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <FiGrid size={20} />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-white/10"></div>

                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="text-right hidden md:block">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-primary-glow transition-colors">
                                {user?.role?.replace('_', ' ') || 'Recruiter'}
                            </div>
                        </div>
                        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 p-[2px] shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                            <img
                                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guest'}`}
                                alt="User"
                                className="size-full rounded-[10px] bg-bg-deep object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
