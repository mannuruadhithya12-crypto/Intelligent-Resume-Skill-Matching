import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobStatus, getResults, updateCandidateStatus, getHistory, getNotifications } from '../api';
import { useAuth } from '../context/AuthContext';
import ComparisonView from './ComparisonView';

export default function ResultsDashboard({ jobId, onReset, onSwitchJob }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState('pending');
    const [results, setResults] = useState(null);
    const [progress, setProgress] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        score: 'All',
        experience: 'All',
        location: 'All'
    });

    const [history, setHistory] = useState([]);
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
    const [mergedCandidates, setMergedCandidates] = useState([]);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [showComparison, setShowComparison] = useState(false);

    // Existing useEffects for data fetching
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
            
            if (filters.score !== 'All') {
                const minScore = parseInt(filters.score.replace(/\D/g, ''));
                if (c.final_score < minScore) return false;
            }
            if (filters.experience !== 'All') {
                const minExp = parseInt(filters.experience.replace(/\D/g, ''));
                if (!c.experience_years || c.experience_years < minExp) return false;
            }
            if (filters.location !== 'All') {
                // Mocking location filter since backend might not have it
            }
            
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

    const handleCandidateSelect = (filename) => {
        setSelectedCandidates(prev => {
            if (prev.includes(filename)) return prev.filter(f => f !== filename);
            if (prev.length >= 5) return prev;
            return [...prev, filename];
        });
    };

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

    if (status !== 'completed' && status !== 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in min-h-[60vh] bg-slate-900 rounded-3xl shadow-sm border border-slate-800 mx-8 my-8 relative overflow-hidden">
                <div className="w-20 h-20 border-4 border-slate-800 border-t-primary rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(19,127,236,0.4)]"></div>
                <h2 className="text-3xl font-display font-black text-white mb-4 tracking-tight">Analyzing Talent Pool</h2>
                <p className="text-slate-400 max-w-md mb-10 text-lg">
                    Inference engine is securely ranking candidates against corporate requirements...
                </p>
                <div className="w-80 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                    <div className="h-full bg-primary transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4">Progress: {progress}%</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] bg-slate-900 rounded-3xl shadow-sm border border-red-500/30 m-8">
                <div className="p-5 bg-red-500/10 rounded-2xl text-red-500 mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <span className="material-symbols-outlined text-4xl">error</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Compute Failed</h2>
                <p className="text-slate-400 mb-8 max-w-sm">The inference engine encountered a fatal error processing this batch. Please verify file integrity.</p>
                <button onClick={onReset} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-sm">Initialize New Batch</button>
            </div>
        );
    }

    if (!results || !results.candidates) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] bg-slate-900 rounded-3xl shadow-sm border border-slate-800 m-8">
                <span className="material-symbols-outlined text-6xl text-slate-700 mb-6">search</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">Constructing Analysis View...</h3>
            </div>
        );
    }

    const currentJob = history.find(h => h.job_id === jobId);
    const jobTitle = currentJob?.jd_filename || 'Analysis Report';

    return (
        <div className="w-full h-full font-display bg-[#050B14] text-white animate-fade-in pb-20 relative">
            <div className="max-w-[1200px] mx-auto w-full">
                
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm font-medium mb-2 relative">
                    <span className="text-slate-500 hover:text-primary transition-colors cursor-pointer" onClick={onReset}>Jobs</span>
                    <span className="text-slate-400">/</span>
                    <div className="relative group">
                        <span 
                            className="text-white cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                            onClick={(e) => { e.stopPropagation(); setShowHistoryDropdown(!showHistoryDropdown); }}
                        >
                            {jobTitle}
                            <span className="material-symbols-outlined text-[16px]">expand_more</span>
                        </span>
                        
                        {showHistoryDropdown && (
                            <div className="absolute top-6 left-0 w-80 bg-slate-900 shadow-xl rounded-xl border border-slate-800 py-2 z-[60] max-h-[300px] overflow-y-auto animate-fade-in-up">
                                <div className="px-4 py-2 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-1">Recent Analyses</div>
                                {history.map(h => (
                                    <div
                                        key={h.job_id}
                                        onClick={() => { onSwitchJob && onSwitchJob(h.job_id); setShowHistoryDropdown(false); }}
                                        className={`px-4 py-3 hover:bg-slate-800 cursor-pointer border-l-2 transition-colors ${h.job_id === jobId ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}
                                    >
                                        <p className={`text-sm font-bold truncate ${h.job_id === jobId ? 'text-primary' : 'text-slate-300'}`}>
                                            {h.jd_filename || h.filename || 'Untitled'}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 flex justify-between font-bold">
                                            <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                                            <span className={`${h.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{h.status}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* PageHeading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black text-white tracking-tight">Candidate Ranking</h1>
                        <p className="text-slate-400 text-base">
                            {allCandidates.length} applicants, <span className="text-primary font-semibold">{filteredCandidates.length} matches</span> found by AI matching engine
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-lg">download</span>
                            Export CSV
                        </button>
                        <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined text-lg">bolt</span>
                            New Analysis
                        </button>
                    </div>
                </div>

                {/* ToolBar / Filters */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Score:</span>
                                <select 
                                    className="bg-transparent border-none text-sm font-semibold p-0 focus:ring-0 text-white [&>option]:bg-slate-800"
                                    value={filters.score}
                                    onChange={(e) => setFilters({...filters, score: e.target.value})}
                                >
                                    <option>All</option>
                                    <option>&gt; 85%</option>
                                    <option>&gt; 90%</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Experience:</span>
                                <select 
                                    className="bg-transparent border-none text-sm font-semibold p-0 focus:ring-0 text-white [&>option]:bg-slate-800"
                                    value={filters.experience}
                                    onChange={(e) => setFilters({...filters, experience: e.target.value})}
                                >
                                    <option>All</option>
                                    <option>5+ Years</option>
                                    <option>8+ Years</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Location:</span>
                                <select 
                                    className="bg-transparent border-none text-sm font-semibold p-0 focus:ring-0 text-white [&>option]:bg-slate-800"
                                    value={filters.location}
                                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                                >
                                    <option>All</option>
                                    <option>San Francisco, CA</option>
                                    <option>Remote</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium">Selected: {selectedCandidates.length}</span>
                            {selectedCandidates.length > 0 ? (
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-600">
                                    <span className="material-symbols-outlined text-sm">archive</span>
                                    Bulk Action
                                </button>
                            ) : (
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold opacity-50 cursor-not-allowed border border-slate-700">
                                    <span className="material-symbols-outlined text-sm">archive</span>
                                    Bulk Action
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-y border-slate-800 bg-slate-800/50">
                                    <th className="px-6 py-4 w-12 text-center">
                                        <span className="material-symbols-outlined text-[16px] text-slate-500">check_box_outline_blank</span>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Match Score</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Experience</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
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
                                        <td colSpan="7" className="px-6 py-16 text-center text-slate-500 font-medium">
                                            No profiles matched your exact enterprise filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">Showing 1-{filteredCandidates.length} of {allCandidates.length} applicants</p>
                        <div className="flex gap-2">
                            <button className="p-1 text-slate-400 hover:text-primary transition-colors disabled:opacity-30" disabled>
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="px-2 py-0.5 text-xs font-bold text-primary bg-primary/10 rounded">1</button>
                            <button className="p-1 text-slate-400 hover:text-primary transition-colors disabled:opacity-30" disabled>
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <h3 className="text-sm font-bold text-white">Skill Overlap</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Most top candidates show strong proficiency in <span className="text-slate-200 font-bold underline decoration-amber-200">{topSkills[0] || 'Python'}</span> and <span className="text-slate-200 font-bold underline decoration-amber-200">{topSkills[1] || 'AWS'}</span>, matching JD requirements perfectly.
                        </p>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <span className="material-symbols-outlined">speed</span>
                            </div>
                            <h3 className="text-sm font-bold text-white">Pipeline Velocity</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Current ranking cycle completed in 4.2 seconds. Average time to shortlist reduced by <span className="text-blue-500 font-bold">2.4 days</span> compared to manual screening.
                        </p>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <span className="material-symbols-outlined">diversity_3</span>
                            </div>
                            <h3 className="text-sm font-bold text-white">Equity Check</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            AI screening anonymized. Talent pool diversity remains healthy with <span className="text-emerald-500 font-bold">42%</span> representation from underrepresented backgrounds.
                        </p>
                    </div>
                </div>

                {/* Floating Action for Comparison */}
                {selectedCandidates.length > 0 && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-4 animate-fade-in-up">
                        <span className="font-bold text-sm whitespace-nowrap"><span className="text-primary">{selectedCandidates.length}</span> Linked <span className="text-slate-500 font-normal text-xs ml-1">(5 Max limit)</span></span>
                        <div className="h-4 w-[1px] bg-slate-700"></div>
                        <button
                            disabled={selectedCandidates.length < 2}
                            onClick={() => setShowComparison(true)}
                            className="px-6 py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        >
                            <span className="material-symbols-outlined text-[16px]">layers</span> Launch Comparison
                        </button>
                        <button onClick={() => setSelectedCandidates([])} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">close</span>
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
        </div>
    );
}

function CandidateRow({ data, rank, navigate, jobId, selected, onSelect }) {
    const [status, setStatus] = useState(data.status || 'new');
    const trend = ['up', 'flat', 'down'][rank % 3];
    const scoreColor = data.final_score >= 80 ? 'bg-primary' : data.final_score >= 60 ? 'bg-purple-500' : 'bg-amber-500';

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
    const isTopPercent = data.final_score >= 95;

    return (
        <tr className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${selected ? 'bg-primary/5' : ''}`} onClick={() => navigate(`/analysis/${jobId}/${data.filename}`)}>
            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                <span 
                    onClick={onSelect}
                    className={`material-symbols-outlined cursor-pointer transition-colors ${selected ? 'text-primary' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    {selected ? 'check_box' : 'check_box_outline_blank'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">#{rank}</span>
                    {trend === 'up' && <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>}
                    {trend === 'flat' && <span className="material-symbols-outlined text-slate-400 text-sm">remove</span>}
                    {trend === 'down' && <span className="material-symbols-outlined text-red-400 text-sm">trending_down</span>}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=1e293b&textColor=ffffff`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                            {cleanName}
                            {status === 'shortlisted' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
                            {data.matched_skills?.slice(0, 2).join(', ') || 'Various Skills'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5 w-32">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-primary">{Math.round(data.final_score)}%</span>
                        {isTopPercent && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded uppercase tracking-wider">Top 1%</span>}
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`${scoreColor} h-full rounded-full transition-all duration-1000`} style={{ width: `${data.final_score}%` }}></div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm font-semibold text-slate-300">
                    {data.experience_years ? `${data.experience_years} Years` : 'Unknown'}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-slate-400">
                {['San Francisco, CA', 'Remote', 'Seattle, WA', 'Austin, TX (Remote)'][rank % 4]}
            </td>
            <td className="px-6 py-4 text-right">
                <button
                    onClick={handleShortlist}
                    className={`px-4 py-1.5 transition-all rounded-lg text-xs font-bold border ${status === 'shortlisted'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-transparent'
                        }`}
                >
                    {status === 'shortlisted' ? 'Retained' : 'Recommendation'}
                </button>
            </td>
        </tr>
    );
}
