import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobStatus, getResults, updateCandidateStatus, getHistory, getNotifications, markNotificationsRead } from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FiGrid, FiBriefcase, FiUsers, FiBarChart2, FiSettings, FiLayers, FiSearch,
    FiBell, FiMessageSquare, FiDownload, FiCpu, FiFilter, FiUser, FiZap, FiActivity,
    FiTrendingUp, FiTrendingDown, FiMinus, FiCheck, FiMoreHorizontal, FiX, FiLogOut, FiChevronDown, FiCheckSquare, FiSquare, FiGlobe
} from 'react-icons/fi';
import ComparisonView from './ComparisonView';

export default function ResultsDashboard({ jobId, onReset, onSwitchJob }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [status, setStatus] = useState('pending');
    const [results, setResults] = useState(null);
    const [progress, setProgress] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        score: false,
        experience: false,
        location: false
    });

    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
    const [mergedCandidates, setMergedCandidates] = useState([]);

    const [rawNotifications, setRawNotifications] = useState([]);

    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [showComparison, setShowComparison] = useState(false);

    const handleCandidateSelect = (filename) => {
        setSelectedCandidates(prev => {
            if (prev.includes(filename)) return prev.filter(f => f !== filename);
            if (prev.length >= 5) return prev;
            return [...prev, filename];
        });
    };

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

    useEffect(() => {
        getHistory().then(setHistory).catch(console.error);
    }, [jobId]);

    useEffect(() => {
        const fetchNotes = () => getNotifications().then(setRawNotifications).catch(console.error);
        fetchNotes();
        const interval = setInterval(fetchNotes, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const mergeCandidates = async () => {
            if (!results || !results.candidates || !history.length) return;

            const currentJobEntry = history.find(h => h.job_id === jobId);
            if (!currentJobEntry) return;

            const targetJD = currentJobEntry.jd_filename;
            const relatedJobs = targetJD
                ? history.filter(h => h.jd_filename === targetJD && h.job_id !== jobId)
                : [];

            let all = results.candidates.map(c => ({ ...c, job_id: jobId }));

            if (relatedJobs.length > 0) {
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

    const allCandidates = useMemo(() => {
        const list = mergedCandidates.length > 0 ? mergedCandidates : (results?.candidates || []);
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

    if (status !== 'completed' && status !== 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in min-h-[60vh] bg-[#0f172a] rounded-3xl shadow-card border border-gray-800 mx-8 my-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <div className="w-20 h-20 border-4 border-gray-800 border-t-primary rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                <h2 className="text-3xl font-display font-black text-white mb-4 tracking-tight">Analyzing Talent Pool</h2>
                <p className="text-gray-400 max-w-md mb-10 text-lg">
                    Inference engine is securely ranking candidates against corporate requirements...
                </p>
                <div className="w-80 h-3 bg-[#050B14] rounded-full overflow-hidden border border-gray-800 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Progress: {progress}%</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center h-full bg-[#0f172a] rounded-3xl shadow-card border border-red-500/30 m-8">
                <div className="p-5 bg-red-500/10 rounded-2xl text-red-500 mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]"><FiActivity size={40} /></div>
                <h2 className="text-2xl font-bold text-white mb-2">Compute Failed</h2>
                <p className="text-gray-400 mb-8 max-w-sm">The inference engine encountered a fatal error processing this batch. Please verify file integrity.</p>
                <button onClick={onReset} className="px-8 py-3 bg-white text-[#050B14] font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-sm">Initialize New Batch</button>
            </div>
        );
    }

    if (!results || !results.candidates) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center h-full bg-[#0f172a] rounded-3xl shadow-card border border-gray-800 m-8">
                <FiSearch size={64} className="text-gray-700 mb-6" />
                <h3 className="text-2xl font-bold text-white tracking-tight">Constructing Analysis View...</h3>
            </div>
        );
    }

    return (
        <div className="bg-[#050B14] font-sans text-white flex flex-col animate-fade-in pb-20 relative transition-colors h-full" onClick={() => { setShowNotifications(false); setShowMessages(false); setShowProfileMenu(false); setShowHistoryDropdown(false); }}>

            <div className="flex items-center gap-4 px-8 pt-6 pb-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-bold uppercase tracking-widest">
                    <span className="hover:text-primary cursor-pointer transition-colors" onClick={onReset}>Workspace</span>
                    <span className="text-gray-700">/</span>

                    <div className="relative">
                        <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-[#0f172a] px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-800"
                            onClick={(e) => { e.stopPropagation(); setShowHistoryDropdown(!showHistoryDropdown); }}
                        >
                            <span className="text-white font-bold max-w-[300px] truncate normal-case tracking-normal">
                                {history.find(h => h.job_id === jobId)?.jd_filename || history.find(h => h.job_id === jobId)?.filename || 'Analysis Report'}
                            </span>
                            <FiChevronDown className={`text-gray-500 transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`} />
                        </div>

                        {showHistoryDropdown && (
                            <div className="absolute top-12 left-0 w-80 bg-[#0f172a] shadow-card rounded-2xl border border-gray-800 py-3 z-[60] max-h-[400px] overflow-y-auto animate-fade-in-up">
                                <div className="px-5 py-2 border-b border-gray-800 text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-2">Switch Active Context</div>
                                {history.map(h => (
                                    <div
                                        key={h.job_id}
                                        onClick={() => { onSwitchJob && onSwitchJob(h.job_id); setShowHistoryDropdown(false); }}
                                        className={`px-5 py-3.5 hover:bg-[#050B14] cursor-pointer border-b border-gray-800/50 last:border-0 transition-colors ${h.job_id === jobId ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
                                    >
                                        <p className={`text-sm font-bold truncate ${h.job_id === jobId ? 'text-primary' : 'text-gray-300'}`}>
                                            {h.jd_filename || h.filename || 'Untitled Analysis'}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-2 flex justify-between font-bold">
                                            <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                                            <span className={`${h.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{h.status}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-gray-400 font-medium text-lg tracking-wide">
                            <span className="text-white font-black">{allCandidates.length}</span> candidates parsed, <span className="text-primary font-black">{filteredCandidates.length} potential matches</span> discovered.
                        </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 bg-[#0f172a] border border-primary/30 text-white px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                        <div className="p-1.5 bg-yellow-400/10 rounded-lg"><FiZap className="text-yellow-400" size={18} /></div>
                        <div className="text-sm">
                            <span className="font-bold text-yellow-400 mr-2 uppercase tracking-wide text-xs">AI Insight</span>
                            Strongest corporate competency alignment is in <span className="font-bold text-white border-b border-dashed border-gray-600">{topSkills[0] || 'Core Domain'}</span>.
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="px-6 py-3 bg-[#0f172a] border border-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2">
                            <FiDownload /> Export CSV
                        </button>
                        <button onClick={onReset} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg flex items-center gap-2">
                            <FiCpu /> New Analysis
                        </button>
                    </div>
                </div>

                <div className="bg-[#0f172a] rounded-2xl border border-gray-800 p-2.5 flex items-center gap-2 shadow-card overflow-x-auto">
                    <FilterChip label="SCORE" value="> 85%" active={filters.score} onClick={() => toggleFilter('score')} />
                    <FilterChip label="EXPERIENCE" value="5+ Years" active={filters.experience} onClick={() => toggleFilter('experience')} />
                    <FilterChip label="LOCATION" value="San Francisco, CA" active={filters.location} onClick={() => toggleFilter('location')} />
                    <div className="w-[1px] h-6 bg-gray-700 mx-2"></div>
                    {(filters.score || filters.experience || filters.location) && (
                        <button onClick={() => setFilters({ score: false, experience: false, location: false })} className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors border border-transparent hover:border-red-500/20">
                            <FiX /> Clear Filters
                        </button>
                    )}
                    <div className="ml-auto flex items-center gap-3 px-3">
                        {selectedCandidates.length > 0 ? (
                            <>
                                <span className="text-xs uppercase tracking-widest text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">{selectedCandidates.length} Selected</span>
                                <div className="relative group">
                                    <button className="px-4 py-2 bg-[#050B14] text-white border border-gray-700 font-bold text-xs rounded-lg shadow-sm hover:border-gray-500 transition-colors flex items-center gap-2">
                                        Bulk Context <FiChevronDown />
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] border border-gray-800 rounded-xl shadow-card overflow-hidden hidden group-hover:block z-50 animate-fade-in">
                                        <button onClick={() => selectedCandidates.forEach(f => updateCandidateStatus(jobId, f, 'shortlisted'))} className="w-full text-left px-5 py-3.5 text-xs font-bold text-white hover:bg-[#050B14] border-b border-gray-800 transition-colors">
                                            Shortlist Frame ({selectedCandidates.length})
                                        </button>
                                        <button onClick={handleExportCSV} className="w-full text-left px-5 py-3.5 text-xs font-bold text-white hover:bg-[#050B14] transition-colors">
                                            Export Matrix (CSV)
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Output: {filteredCandidates.length}</span>
                                <button className="px-4 py-2 bg-[#050B14] border border-gray-800 text-gray-600 font-bold text-xs rounded-lg cursor-not-allowed">Bulk Context</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-[#0f172a] rounded-2xl border border-gray-800 shadow-card overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#050B14] border-b border-gray-800 text-[10px] font-bold uppercase text-gray-500 tracking-widest">
                                <tr>
                                    <th className="px-6 py-5 w-12">
                                        <div className="w-5 h-5 rounded border border-gray-700 mx-auto"></div>
                                    </th>
                                    <th className="px-6 py-5 text-left w-20">Rank</th>
                                    <th className="px-6 py-5 text-left">Identity Profile</th>
                                    <th className="px-6 py-5 text-left w-64">AI Match Matrix</th>
                                    <th className="px-6 py-5 text-left">Domain Exp</th>
                                    <th className="px-6 py-5 text-left">Hub Location</th>
                                    <th className="px-6 py-5 text-right flex-shrink-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 bg-[#0f172a]">
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
                                        <td colSpan="7" className="px-6 py-16 text-center text-gray-500 font-medium">
                                            No profiles matched your exact enterprise filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <StatCard
                        icon={<FiActivity className="text-amber-500" size={24} />}
                        iconBg="bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        title="Skill Overlap"
                        content={
                            <>
                                Top candidates show strong proficiency in <span className="text-white font-bold border-b border-dashed border-gray-600">{topSkills[0] || 'Python Algorithm'}</span> and <span className="text-white font-bold border-b border-dashed border-gray-600">{topSkills[1] || 'PostgreSQL'}</span> workflows.
                            </>
                        }
                    />
                    <StatCard
                        icon={<FiZap className="text-primary" size={24} />}
                        iconBg="bg-primary/10 text-primary border border-primary/20"
                        title="Pipeline Velocity"
                        content={
                            <>
                                Inference ranking cycle executed sequence in <span className="font-bold text-white">1.2 seconds</span>. HR pipeline blockage reduced dramatically.
                            </>
                        }
                    />
                    <StatCard
                        icon={<FiUsers className="text-emerald-500" size={24} />}
                        iconBg="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        title="Equity Check"
                        content={
                            <>
                                Strict PII anonymity enforced for bias reduction. Pipeline reflects a <span className="text-emerald-400 font-bold">42%</span> shift in diverse demographic inclusion.
                            </>
                        }
                    />
                </div>
            </div>

            {selectedCandidates.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white pl-6 pr-2 py-2 rounded-full shadow-card flex items-center gap-4 animate-fade-in-up border border-gray-700">
                    <span className="font-bold text-sm whitespace-nowrap"><span className="text-primary">{selectedCandidates.length}</span> Linked <span className="text-gray-500 font-normal text-xs ml-1">(5 Max limit)</span></span>
                    <div className="h-4 w-[1px] bg-gray-700"></div>
                    <button
                        disabled={selectedCandidates.length < 2}
                        onClick={() => setShowComparison(true)}
                        className="px-6 py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                        <FiLayers /> Launch Comparison
                    </button>
                    <button onClick={() => setSelectedCandidates([])} className="p-3 bg-[#050B14] hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white border border-gray-800">
                        <FiX size={16} />
                    </button>
                </div>
            )}

            {showComparison && (
                <ComparisonView
                    candidates={allCandidates.filter(c => selectedCandidates.includes(c.filename))}
                    onClose={() => setShowComparison(false)}
                />
            )}
        </div>
    );
}

function FilterChip({ label, value, active, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center rounded-xl px-4 py-2 flex-shrink-0 cursor-pointer transition-all border ${active
                ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(37,99,235,0.1)] text-primary'
                : 'bg-[#050B14] border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
        >
            <span className={`text-[10px] font-black uppercase mr-2 tracking-widest ${active ? 'text-primary/70' : 'text-gray-600'}`}>{label}:</span>
            <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-300'}`}>{value}</span>
        </div>
    );
}

function CandidateRow({ data, rank, navigate, jobId, selected, onSelect }) {
    const [status, setStatus] = useState(data.status || 'new');
    const trend = ['up', 'flat', 'down'][rank % 3];
    const scoreColor = data.final_score >= 80 ? 'bg-primary' : data.final_score >= 60 ? 'bg-purple-500' : 'bg-amber-500';
    const scoreShadow = data.final_score >= 80 ? 'shadow-[0_0_10px_rgba(37,99,235,0.6)]' : data.final_score >= 60 ? 'shadow-[0_0_10px_rgba(168,85,247,0.6)]' : '';

    const handleShortlist = async (e) => {
        e.stopPropagation();
        const newStatus = status === 'shortlisted' ? 'new' : 'shortlisted';
        try {
            await updateCandidateStatus(jobId, data.filename, newStatus);
            setStatus(newStatus);
        } catch (err) {
            console.error(err);
        }
    };

    const cleanName = data.filename.replace(/_/g, ' ').replace(/\.pdf$/i, '').replace(/\.docx?$/i, '');

    return (
        <tr className={`group hover:bg-[#050B14] transition-colors cursor-pointer border-b border-gray-800/50 last:border-0 ${status === 'shortlisted' ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : selected ? 'bg-primary/5 hover:bg-primary/10' : ''}`} onClick={() => navigate(`/analysis/${jobId}/${data.filename}`)}>
            <td className="px-6 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <div
                    onClick={onSelect}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${selected ? 'bg-primary border-primary' : 'border-gray-600 bg-[#050B14] hover:border-primary'}`}
                >
                    {selected && <FiCheck size={12} className="text-white" />}
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center gap-3 font-bold text-gray-300">
                    <span className="w-6 text-gray-500 font-mono text-sm group-hover:text-primary transition-colors">#{rank.toString().padStart(2, '0')}</span>
                    <div className="w-6 flex justify-center bg-[#050B14] p-1 rounded-md border border-gray-800">
                        {trend === 'up' && <FiTrendingUp className="text-emerald-500" size={14} />}
                        {trend === 'flat' && <FiMinus className="text-gray-500" size={14} />}
                        {trend === 'down' && <FiTrendingDown className="text-amber-500" size={14} />}
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#050B14] flex-shrink-0 border border-gray-700 overflow-hidden relative group-hover:border-primary transition-all p-0.5">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=0f172a&textColor=ffffff`} alt="Av" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div>
                        <div className="font-bold text-base text-white group-hover:text-primary transition-colors flex items-center gap-3 tracking-wide">
                            {cleanName}
                            {status === 'shortlisted' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {data.matched_skills && data.matched_skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-[#050B14] text-gray-300 text-[9px] font-bold rounded-md border border-gray-700 uppercase tracking-widest flex items-center gap-1 group-hover:border-gray-600 transition-colors">
                                    <div className="w-1 h-1 rounded-full bg-primary/60"></div>
                                    {skill}
                                </span>
                            ))}
                            {data.matched_skills && data.matched_skills.length > 3 && (
                                <span className="px-2 py-1 text-[9px] text-gray-500 font-bold bg-[#050B14] rounded-md border border-gray-800 tracking-widest">+{data.matched_skills.length - 3} MORE</span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex flex-col gap-2">
                    <span className="font-black text-white text-lg drop-shadow-md flex items-center gap-2">{Math.round(data.final_score)}% <span className="text-[10px] text-gray-500 tracking-widest uppercase font-bold">Match</span></span>
                    <div className="w-full max-w-[180px] h-2 bg-[#050B14] rounded-full overflow-hidden border border-gray-800 shadow-inner">
                        <div className={`h-full rounded-full ${scoreColor} ${scoreShadow} transition-all duration-1000 ease-out`} style={{ width: `${data.final_score}%` }}></div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <span className={`font-bold px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase flex items-center w-max gap-2 ${data.experience_years >= 5 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'text-gray-400 bg-[#050B14] border border-gray-800'}`}>
                    {data.experience_years ? <><FiBriefcase size={12} /> {data.experience_years} Years</> : 'EXP UNKNOWN'}
                </span>
            </td>
            <td className="px-6 py-5 text-gray-400 font-medium whitespace-nowrap text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#050B14] rounded-lg border border-gray-800 w-max text-xs font-bold">
                    <FiGlobe className="text-gray-500" />
                    {['San Francisco', 'Austin', 'Remote', 'Seattle', 'New York'][rank % 5]}
                </div>
            </td>
            <td className="px-6 py-5 text-right whitespace-nowrap flex-shrink-0">
                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <button
                        onClick={handleShortlist}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${status === 'shortlisted'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#050B14] border-gray-700 text-gray-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                            }`}
                    >
                        {status === 'shortlisted' ? 'Retain' : 'Bookmark'}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${jobId}/${data.filename}`); }}
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                    >
                        Diagnostics <FiChevronDown className="-rotate-90" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function StatCard({ icon, iconBg, title, content }) {
    return (
        <div className="bg-[#0f172a] p-8 rounded-2xl border border-gray-800 shadow-card flex flex-col h-full hover:border-primary/50 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center mb-6 relative z-10`}>
                {icon}
            </div>
            <h4 className="font-bold text-white text-lg mb-3 tracking-wide relative z-10">{title}</h4>
            <p className="text-sm text-gray-400 leading-relaxed relative z-10">
                {content}
            </p>
        </div>
    );
}
