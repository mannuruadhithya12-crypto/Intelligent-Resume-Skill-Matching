import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationsRead } from '../../api';

export default function TopNavbar() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Refs for clicking outside
    const notifRef = useRef(null);
    const helpRef = useRef(null);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path === '/report') return 'Analysis Report';
        if (path === '/candidates') return 'Talent Pool';
        if (path === '/history') return 'History';
        if (path === '/settings') return 'Settings';
        if (path.includes('/analysis')) return 'Candidate Dossier';
        return 'Workspace';
    };

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const data = await getNotifications(10, false); // Get recent 10
            setNotifications(data || []);
            const unread = (data || []).filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle clicks outside popovers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/candidates?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const handleNotificationClick = async () => {
        setShowNotifications(!showNotifications);
        setShowHelp(false);
        
        if (!showNotifications && unreadCount > 0) {
            try {
                // Mark all read on backend
                await markNotificationsRead();
                setUnreadCount(0);
                // Locally update state to read
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (err) {
                console.error("Failed to mark read", err);
            }
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'Just now';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <header className="h-[72px] shrink-0 flex items-center justify-between px-10 py-4 bg-page border-b border-[#E9E1DC] relative z-40">
            <div className="flex items-center gap-4">
                <h2 className="text-[28px] font-serif font-semibold text-text-primary tracking-tight">
                    {getPageTitle()}
                </h2>
            </div>

            <div className="flex items-center gap-6">
                {/* Search */}
                <div className="relative group hidden md:block z-50">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchSubmit}
                        className="bg-white border border-[#E9E1DC] rounded-[10px] pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-sage focus:ring-1 focus:ring-[#CAECBC] transition-all w-[320px] placeholder-outline shadow-sm font-bold"
                        placeholder="Search candidates, skills, or roles..."
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-sage transition-colors text-[20px]">search</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button 
                            onClick={handleNotificationClick}
                            className={`p-2 rounded-[10px] transition-colors relative ${showNotifications ? 'bg-white text-primary-sage shadow-sm border border-[#E9E1DC]' : 'text-outline hover:text-text-primary hover:bg-[#E9E1DC]/50'}`}
                        >
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-white border-2 border-page">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        
                        {/* Notifications Popover */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-[16px] shadow-[0_8px_30px_rgba(30,27,24,0.12)] border border-[#E9E1DC] overflow-hidden z-50 animate-fade-in-up">
                                <div className="p-4 border-b border-[#E9E1DC] flex items-center justify-between bg-[#FBF9F4]">
                                    <h3 className="font-bold text-text-primary">Notifications</h3>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-text-secondary text-sm font-medium">
                                            No recent notifications.
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className="p-4 border-b border-[#E9E1DC] last:border-0 hover:bg-[#F5ECE7]/30 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-full shrink-0 ${notif.category === 'alert' ? 'bg-[#CAECBC]/30 text-primary-sage' : 'bg-[#E9E1DC]/50 text-text-primary'}`}>
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            {notif.category === 'alert' ? 'task_alt' : 'info'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary leading-tight mb-1">{notif.title}</p>
                                                        <p className="text-xs text-text-secondary mb-2">{notif.content}</p>
                                                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">{formatTime(notif.timestamp)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Help */}
                    <div className="relative" ref={helpRef}>
                        <button 
                            onClick={() => { setShowHelp(!showHelp); setShowNotifications(false); }}
                            className={`p-2 rounded-[10px] transition-colors ${showHelp ? 'bg-white text-primary-sage shadow-sm border border-[#E9E1DC]' : 'text-outline hover:text-text-primary hover:bg-[#E9E1DC]/50'}`}
                        >
                            <span className="material-symbols-outlined text-[24px]">help</span>
                        </button>

                        {/* Help Popover */}
                        {showHelp && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[16px] shadow-[0_8px_30px_rgba(30,27,24,0.12)] border border-[#E9E1DC] overflow-hidden z-50 animate-fade-in-up p-5">
                                <h3 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary-sage text-[20px]">lightbulb</span> Need Help?
                                </h3>
                                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                                    You are currently viewing the <strong className="text-text-primary">{getPageTitle()}</strong>. Use the global search to find candidates across all past analysis runs.
                                </p>
                                <a href="mailto:support@recruitai.com" className="text-sm text-primary-sage font-bold hover:underline">Contact Support &rarr;</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
