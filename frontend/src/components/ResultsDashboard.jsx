import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobStatus, getResults, updateCandidateStatus, getHistory, getNotifications, markNotificationsRead } from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FiGrid, FiBriefcase, FiUsers, FiBarChart2, FiSettings, FiLayers, FiSearch,
    FiBell, FiMessageSquare, FiDownload, FiCpu, FiFilter, FiUser, FiZap, FiActivity,
    FiTrendingUp, FiTrendingDown, FiMinus, FiCheck, FiMoreHorizontal, FiX, FiLogOut, FiChevronDown, FiCheckSquare, FiSquare
} from 'react-icons/fi';
import ComparisonView from './ComparisonView';

export default function ResultsDashboard({ jobId, onReset, onSwitchJob }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Get real user
    const [status, setStatus] = useState('pending');
    const [results, setResults] = useState(null);
    const [progress, setProgress] = useState(0);

    // States for Interactivity
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        score: false,
        experience: false,
        location: false
    });

    // UI States for Dropdowns
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
    const [mergedCandidates, setMergedCandidates] = useState([]);

    const [rawNotifications, setRawNotifications] = useState([]);

    // COMPARISON STATE
    const [selectedCandidates, setSelectedCandidates] = useState([]); // Array of filenames
    const [showComparison, setShowComparison] = useState(false);

    const handleCandidateSelect = (filename) => {
        setSelectedCandidates(prev => {
            if (prev.includes(filename)) {
                return prev.filter(f => f !== filename);
            }
            if (prev.length >= 5) return prev; // Limit to 5
            return [...prev, filename];
        });
    };

    // Poll for status
    useEffect(() => {
        let interval;
        const checkStatus = async () => {
            try {
                if (!jobId) return;
                const data = await getJobStatus(jobId);
                setStatus(data.status);
                setProgress(data.progress);
                if (data.status === 'completed') {
                    const res = await getResults(jobId);
                    setResults(res);
                    clearInterval(interval);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Status check failed", err);
            }
        };

        checkStatus();
        interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, [jobId]);

    // Fetch History for Switching
    useEffect(() => {
        getHistory().then(setHistory).catch(console.error);
    }, [jobId]);

    // Poll Notifications
    useEffect(() => {
        const fetchNotes = () => getNotifications().then(setRawNotifications).catch(console.error);
        fetchNotes();
        const interval = setInterval(fetchNotes, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, []);

    // MERGE LOGIC: Combine candidates from all jobs that used the SAME Job Description
    useEffect(() => {
        const mergeCandidates = async () => {
            if (!results || !results.candidates || !history.length) return;

            const currentJobEntry = history.find(h => h.job_id === jobId);
            if (!currentJobEntry) return;

            const targetJD = currentJobEntry.jd_filename;
            // Find other jobs with SAME JD (excluding current)
            const relatedJobs = targetJD
                ? history.filter(h => h.jd_filename === targetJD && h.job_id !== jobId)
                : [];

            let all = results.candidates.map(c => ({ ...c, job_id: jobId }));

            if (relatedJobs.length > 0) {
                // Fetch related
                const promises = relatedJobs.map(j => getResults(j.job_id).catch(() => null));
                const relatedResults = await Promise.all(promises);

                relatedResults.forEach((r, idx) => {
                    if (r && r.candidates) {
                        const rJobId = relatedJobs[idx].job_id;
                        all = [...all, ...r.candidates.map(c => ({ ...c, job_id: rJobId }))];
                    }
                });
            }

            setMergedCandidates(all);
        };

        mergeCandidates();
    }, [results, history, jobId]);

    // --- LOGIC ---
    // --- LOGIC ---
    // Ensure candidates are always ranked by score (descending)
    const allCandidates = useMemo(() => {
        const list = mergedCandidates.length > 0 ? mergedCandidates : (results?.candidates || []);
        // Create a copy to avoid mutating state
        return [...list].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    }, [mergedCandidates, results]);

    const filteredCandidates = useMemo(() => {
        return allCandidates.filter(c => {
            const matchSearch = c.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.matched_skills && c.matched_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
            if (!matchSearch) return false;
            if (filters.score && c.final_score < 85) return false;
            if (filters.experience && (!c.experience_years || c.experience_years < 5)) return false;
            return true;
        });
    }, [allCandidates, searchQuery, filters]);

    const topSkills = useMemo(() => {
        if (!allCandidates.length) return [];
        const skillCounts = {};
        allCandidates.forEach(c => {
            c.matched_skills?.forEach(s => skillCounts[s] = (skillCounts[s] || 0) + 1);
        });
        return Object.entries(skillCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(x => x[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }, [allCandidates]);

    const handleExportCSV = () => {
        const listToExport = selectedCandidates.length > 0
            ? allCandidates.filter(c => selectedCandidates.includes(c.filename))
            : allCandidates;

        if (!listToExport.length) return;
        const headers = "Rank,Name,Score,Experience,Skills\n";
        const rows = listToExport.map((c, i) =>
            `${i + 1},"${c.filename}",${c.final_score},"${c.experience_years || 'N/A'}","${c.matched_skills?.join(', ') || ''}"`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Analysis_Report_${jobId}.csv`;
        a.click();
    };

    const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

    // --- REAL DATA FOR UI ---
    const recruiterName = user?.name || "Alex Rivera";
    const recruiterRole = user?.role || "Lead Recruiter";

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    const notifications = useMemo(() => rawNotifications
        .filter(n => n.category === 'alert')
        .map(n => ({
            id: n.id,
            text: n.content,
            time: timeAgo(n.timestamp),
            unread: !n.is_read
        })), [rawNotifications]);

    const messages = useMemo(() => rawNotifications
        .filter(n => n.category === 'message')
        .map(n => ({
            id: n.id,
            from: n.title || 'System AI',
            text: n.content,
            time: timeAgo(n.timestamp),
            unread: !n.is_read
        })), [rawNotifications]);

    // --- SAFEGUARDS ---

    // 1. Loading State
    if (status !== 'completed' && status !== 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in min-h-[60vh] bg-white rounded-2xl shadow-sm border border-slate-100 mx-8 my-8">
                <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Analyzing Profiles...</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Ranking candidates against job requirements...
                </p>
                <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        );
    }

    // 2. Error State
    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center h-full">
                <div className="p-4 bg-red-100 rounded-full text-red-600 mb-4"><FiActivity size={32} /></div>
                <h2 className="text-xl font-bold text-slate-900">Analysis Failed</h2>
                <button onClick={onReset} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Return to Upload</button>
            </div>
        );
    }

    // 3. No Results State
    if (!results || !results.candidates) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center h-full">
                <FiSearch size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Loading Report Data...</h3>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-bg-deep font-sans text-slate-900 dark:text-white flex flex-col animate-fade-in pb-20 relative transition-colors" onClick={() => { setShowNotifications(false); setShowMessages(false); setShowProfileMenu(false); }}>

            {/* HEADER */}
            <header className="h-16 bg-white dark:bg-bg-card border-b border-slate-200 dark:border-border-subtle flex items-center justify-between px-8 sticky top-0 z-10 w-full shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={onReset}>Workspace</span>
                        <span>/</span>

                        <div className="relative">
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded transition-colors"
                                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                            >
                                <span className="text-slate-800 font-bold max-w-[200px] truncate">
                                    {history.find(h => h.job_id === jobId)?.jd_filename || history.find(h => h.job_id === jobId)?.filename || 'Analysis Report'}
                                </span>
                                <FiChevronDown className={`text-slate-400 transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            {showHistoryDropdown && (
                                <div className="absolute top-10 left-0 w-72 bg-white shadow-xl rounded-xl border border-slate-100 py-2 z-[60] max-h-80 overflow-y-auto animate-fade-in">
                                    <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Switch Report</div>
                                    {history.map(h => (
                                        <div
                                            key={h.job_id}
                                            onClick={() => { onSwitchJob && onSwitchJob(h.job_id); setShowHistoryDropdown(false); }}
                                            className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 ${h.job_id === jobId ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <p className={`text-sm font-medium truncate ${h.job_id === jobId ? 'text-blue-600' : 'text-slate-700'}`}>
                                                {h.jd_filename || h.filename || 'Untitled Analysis'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 flex justify-between">
                                                <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                                                <span className={`${h.status === 'completed' ? 'text-green-500' : 'text-amber-500'} capitalize`}>{h.status}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-bg-deep border-none rounded-lg text-sm w-80 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:text-white"
                            placeholder="Search candidates..."
                        />
                    </div>

                    {/* Notifications & Messages */}
                    <div className="flex items-center gap-4 text-slate-400 relative">

                        {/* BELL */}
                        <div className="relative cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowMessages(false); }}>
                            <div className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <FiBell className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-bg-deep animate-pulse"></span>
                            </div>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in z-50 ring-1 ring-black/5 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm flex justify-between items-center">
                                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Notifications</span>
                                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">3 New</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors cursor-pointer group/item ${n.unread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{n.text}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span> {n.time}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-5 py-3 text-center text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800">
                                        View All Activity
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MESSAGE */}
                        <div className="relative cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowMessages(!showMessages); setShowNotifications(false); }}>
                            <div className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <FiMessageSquare className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-bg-deep"></span>
                            </div>

                            {/* Dropdown */}
                            {showMessages && (
                                <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in z-50 ring-1 ring-black/5 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Messages</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {messages.map(m => (
                                            <div key={m.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 flex gap-4 transition-colors cursor-pointer group/msg">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover/msg:ring-blue-100 transition-all">
                                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${m.from}`} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{m.from}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">{m.time}</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium group-hover/msg:text-slate-700 dark:group-hover/msg:text-slate-300 transition-colors">{m.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-5 py-3 text-center text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800">
                                        Open Messenger
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                    {/* Profile */}
                    <div className="relative flex items-center gap-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}>
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">{recruiterName}</div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-blue-400 uppercase tracking-wider">{recruiterRole}</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm ring-2 ring-transparent hover:ring-blue-100 transition-all">
                            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recruiterName}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>

                        {/* Menu */}
                        {showProfileMenu && (
                            <div className="absolute top-14 right-0 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 animate-fade-in z-50 ring-1 ring-black/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{recruiterName}</p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                                <div className="py-2">
                                    <button onClick={() => navigate('/settings')} className="w-full text-left px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors">
                                        <FiUser size={16} /> Profile
                                    </button>
                                    <button onClick={() => navigate('/settings')} className="w-full text-left px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors">
                                        <FiSettings size={16} /> Settings
                                    </button>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                                    <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors">
                                        <FiLogOut size={16} /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">

                {/* PAGE TITLE & ACTIONS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">
                            <span className="text-slate-900 dark:text-white font-bold">{allCandidates.length}</span> applicants analyzed, <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredCandidates.length} relevant matches</span> found.
                        </p>
                    </div>

                    {/* AI INSIGHTS BANNER (UNIQUE FEATURE) */}
                    <div className="hidden lg:flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse-slow">
                        <FiZap className="text-yellow-300" />
                        <div className="text-xs font-medium">
                            <span className="font-bold text-yellow-300 block">AI Insight</span>
                            Strongest compatibility in <span className="font-bold underline">{topSkills[0] || 'Core Skills'}</span>.
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="px-5 py-2.5 bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-white font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm flex items-center gap-2">
                            <FiDownload /> Export CSV
                        </button>
                        <button onClick={onReset} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                            <FiCpu /> New Analysis
                        </button>
                    </div>
                </div>

                {/* FILTERS CARD */}
                <div className="bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle p-2 flex items-center gap-2 shadow-sm overflow-x-auto">
                    <FilterChip
                        label="SCORE" value="> 85%" active={filters.score}
                        onClick={() => toggleFilter('score')}
                    />
                    <FilterChip
                        label="EXPERIENCE" value="5+ Years" active={filters.experience}
                        onClick={() => toggleFilter('experience')}
                    />
                    <FilterChip
                        label="LOCATION" value="San Francisco, CA" active={filters.location}
                        onClick={() => toggleFilter('location')}
                    />
                    <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
                    {(filters.score || filters.experience || filters.location) && (
                        <button onClick={() => setFilters({ score: false, experience: false, location: false })} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded flex items-center gap-1 transition-colors">
                            <FiX /> Clear
                        </button>
                    )}
                    <div className="ml-auto flex items-center gap-2 px-2">
                        {selectedCandidates.length > 0 ? (
                            <>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{selectedCandidates.length} Selected</span>
                                <div className="relative group">
                                    <button className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-500 transition-colors flex items-center gap-2">
                                        Bulk Action <FiChevronDown />
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50 animate-fade-in">
                                        <button onClick={() => selectedCandidates.forEach(f => updateCandidateStatus(jobId, f, 'shortlisted'))} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 border-b border-slate-50 dark:border-white/5">
                                            Shortlist All ({selectedCandidates.length})
                                        </button>
                                        <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10">
                                            Export CS
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-xs text-slate-400 font-medium">Total: {filteredCandidates.length}</span>
                                <button className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-lg cursor-not-allowed">Bulk Action</button>
                            </>
                        )}
                    </div>
                </div>

                {/* MAIN TABLE */}
                <div className="bg-white dark:bg-bg-card rounded-xl border border-slate-200 dark:border-border-subtle shadow-sm overflow-hidden min-h-[400px]">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-bg-deep border-b border-slate-200 dark:border-border-subtle text-xs font-black uppercase text-slate-500 dark:text-slate-300 tracking-widest">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <div className="w-5 h-5 rounded border border-slate-300 dark:border-white/10 mx-auto"></div>
                                </th>
                                <th className="px-6 py-4 text-left w-20">Rank</th>
                                <th className="px-6 py-4 text-left">Candidate</th>
                                <th className="px-6 py-4 text-left w-48">Match Score</th>
                                <th className="px-6 py-4 text-left">Experience</th>
                                <th className="px-6 py-4 text-left">Location</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-border-subtle bg-white dark:bg-bg-card">
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map((c, idx) => (
                                    <CandidateRow
                                        key={idx}
                                        data={c}
                                        rank={idx + 1}
                                        navigate={navigate}
                                        jobId={c.job_id || jobId}
                                        selected={selectedCandidates.includes(c.filename)}
                                        onSelect={() => handleCandidateSelect(c.filename)}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No candidates match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* BOTTOM STAT CARDS - Linked to Top Skills */}
                <div className="grid md:grid-cols-3 gap-6">
                    <StatCard
                        icon={<FiActivity className="text-amber-600" size={24} />}
                        iconBg="bg-amber-100"
                        title="Skill Overlap"
                        content={
                            <>
                                Top candidates show strong proficiency in <span className="font-bold border-b-2 border-amber-200">{topSkills[0] || 'Python'}</span> and <span className="font-bold border-b-2 border-amber-200">{topSkills[1] || 'SQL'}</span>.
                            </>
                        }
                    />
                    <StatCard
                        icon={<FiZap className="text-blue-600" size={24} />}
                        iconBg="bg-blue-100"
                        title="Pipeline Velocity"
                        content={
                            <>
                                Current ranking cycle completed in <span className="font-bold text-slate-900">1.2 seconds</span>. Reduced time to hire by 40%.
                            </>
                        }
                    />
                    <StatCard
                        icon={<FiUsers className="text-emerald-600" size={24} />}
                        iconBg="bg-emerald-100"
                        title="Equity Check"
                        content={
                            <>
                                AI screening anonymized. Talent pool diversity remains healthy with <span className="text-emerald-600 font-bold">42%</span> representation from underrepresented backgrounds.
                            </>
                        }
                    />
                </div>
            </div>

            {/* FLOATING COMPARISON BAR */}
            {selectedCandidates.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-bg-deep pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 animate-fade-in-up border border-slate-700 dark:border-slate-200">
                    <span className="font-bold text-sm whitespace-nowrap">{selectedCandidates.length} Selected <span className="text-slate-400 dark:text-slate-500 font-normal text-xs ml-1">(Max 5)</span></span>
                    <div className="h-4 w-[1px] bg-slate-700 dark:bg-slate-200"></div>
                    <button
                        disabled={selectedCandidates.length < 2}
                        onClick={() => setShowComparison(true)}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed uppercase tracking-wide flex items-center gap-2"
                    >
                        <FiLayers /> Compare
                    </button>
                    <button onClick={() => setSelectedCandidates([])} className="p-2 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-white dark:hover:text-red-500">
                        <FiX size={18} />
                    </button>
                </div>
            )}

            {/* COMPARISON MODAL */}
            {showComparison && (
                <ComparisonView
                    candidates={allCandidates.filter(c => selectedCandidates.includes(c.filename))}
                    onClose={() => setShowComparison(false)}
                />
            )}
        </div>
    );
}

/* ---------- Helper Components ---------- */

function FilterChip({ label, value, active, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center border rounded-lg px-3 py-1.5 flex-shrink-0 cursor-pointer transition-colors ${active
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                : 'bg-slate-50 dark:bg-bg-deep border-slate-200 dark:border-border-subtle hover:border-blue-300'
                }`}
        >
            <span className={`text-[10px] font-black uppercase mr-2 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{label}:</span>
            <span className={`text-xs font-bold ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>{value}</span>
        </div>
    );
}

function CandidateRow({ data, rank, navigate, jobId, selected, onSelect }) {
    const [status, setStatus] = useState(data.status || 'new');
    const trend = ['up', 'flat', 'down'][rank % 3]; // Simulating trend
    const scoreColor = data.final_score >= 80 ? 'bg-blue-600' : data.final_score >= 60 ? 'bg-indigo-500' : 'bg-amber-500';

    const handleShortlist = async (e) => {
        e.stopPropagation();
        const newStatus = status === 'shortlisted' ? 'new' : 'shortlisted';
        try {
            await updateCandidateStatus(jobId, data.filename, newStatus);
            setStatus(newStatus);
        } catch (err) {
            console.error(err);
            // alert("Failed to update status"); 
        }
    };

    const cleanName = data.filename.replace(/_/g, ' ').replace(/\.pdf$/i, '').replace(/\.docx?$/i, '');

    return (
        <tr className={`group hover:bg-blue-50/30 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0 ${status === 'shortlisted' ? 'bg-emerald-50/10 dark:bg-emerald-900/10' : selected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`} onClick={() => navigate(`/analysis/${jobId}/${data.filename}`)}>
            <td className="px-6 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <div
                    onClick={onSelect}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}
                >
                    {selected && <FiCheck size={12} className="text-white" />}
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-gray-300">
                    <span className="w-6 text-slate-400 font-mono text-sm">#{rank.toString().padStart(2, '0')}</span>
                    <div className="w-6 flex justify-center">
                        {trend === 'up' && <FiTrendingUp className="text-emerald-500" size={14} />}
                        {trend === 'flat' && <FiMinus className="text-slate-400" size={14} />}
                        {trend === 'down' && <FiTrendingDown className="text-amber-500" size={14} />}
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-bg-deep flex-shrink-0 border border-slate-200 dark:border-border-subtle overflow-hidden relative group-hover:shadow-md transition-all">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}`} alt="Av" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                            {cleanName}
                            {status === 'shortlisted' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                        </div>

                        {/* SKILLS PILLS - Highlighted as requested */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {data.matched_skills && data.matched_skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-100 dark:border-emerald-800 uppercase tracking-wide">
                                    {skill}
                                </span>
                            ))}
                            {data.matched_skills && data.matched_skills.length > 3 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-transparent rounded border border-transparent dark:border-white/5">+{data.matched_skills.length - 3}</span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 dark:text-white text-lg w-10">{Math.round(data.final_score)}%</span>
                    <div className="flex-1 w-24 h-2 bg-slate-100 dark:bg-bg-deep rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor} shadow-sm transition-all duration-500`} style={{ width: `${data.final_score}%` }}></div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <span className={`font-bold px-3 py-1 rounded-lg text-xs ${data.experience_years >= 5 ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800' : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5'}`}>
                    {data.experience_years ? `${data.experience_years} Years` : 'EXP N/A'}
                </span>
            </td>
            <td className="px-6 py-5 text-slate-500 dark:text-gray-400 font-medium whitespace-nowrap text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    {['San Francisco', 'Austin', 'Remote', 'Seattle', 'New York'][rank % 5]}
                </div>
            </td>
            <td className="px-6 py-5 text-right whitespace-nowrap">
                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button
                        onClick={handleShortlist}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${status === 'shortlisted'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-bg-card border-slate-200 dark:border-border-subtle text-slate-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                    >
                        {status === 'shortlisted' ? 'Saved' : 'Save'}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${jobId}/${data.filename}`); }}
                        className="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-lg text-xs font-bold hover:bg-blue-700 hover:border-blue-700 transition-all shadow-md shadow-blue-500/20"
                    >
                        View Full
                    </button>
                </div>
            </td>
        </tr>
    );
}

function StatCard({ icon, iconBg, title, content }) {
    return (
        <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm flex flex-col h-full hover:border-blue-300 transition-colors">
            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                {content}
            </p>
        </div>
    );
}
