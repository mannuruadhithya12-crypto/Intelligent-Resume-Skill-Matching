import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TopNavbar() {
    const { user } = useAuth();

    return (
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-border-subtle bg-white/80 dark:bg-bg-card/50 backdrop-blur-md sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Dashboard</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                        {user?.company_id ? `Company #${user.company_id}` : 'My Workspace'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <input
                        className="bg-bg-deep border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors w-64 placeholder-gray-600"
                        placeholder="Search profiles..."
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{user?.full_name || 'Guest User'}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.role?.replace('_', ' ') || 'Viewer'}</div>
                    </div>
                    <div className="w-9 h-9 bg-gray-700 rounded-full border border-gray-600 overflow-hidden cursor-pointer shadow-lg shadow-indigo-500/20">
                        <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guest'}`}
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
