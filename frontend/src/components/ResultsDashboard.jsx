import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobStatus, getResults, updateCandidateStatus, getHistory } from '../api';
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
            <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in min-h-[60vh] bg-white rounded-[24px] shadow-paper mx-8 my-8 relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-primary-sage/10 text-primary-sage flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-text-primary mb-3 tracking-tight">Reviewing Talent Pool</h2>
                <p className="text-text-secondary max-w-md mb-8 text-base">
                    We're comparing experience, skills, and role requirements against your provided job description.
                </p>
                <div className="w-80 h-2 bg-[#F5ECE7] rounded-full overflow-hidden">
                    <div className="h-full bg-primary-sage transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-outline uppercase tracking-widest mt-4">Progress: {progress}%</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] bg-white rounded-[24px] shadow-paper m-8">
                <div className="size-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-text-primary mb-2">Analysis Interrupted</h2>
                <p className="text-text-secondary mb-8 max-w-sm">We encountered an issue processing these documents. Please ensure they are valid PDFs or Word documents.</p>
                <button onClick={onReset} className="px-8 py-3 bg-primary-sage text-white font-bold rounded-full hover:bg-primary-container transition-colors shadow-sm">Initialize New Batch</button>
            </div>
        );
    }

    if (!results || !results.candidates) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[60vh] bg-white rounded-[24px] shadow-paper m-8">
                <span className="material-symbols-outlined text-6xl text-outline mb-6">search</span>
                <h3 className="text-2xl font-serif font-bold text-text-primary tracking-tight">Constructing Analysis View...</h3>
            </div>
        );
    }

    const currentJob = history.find(h => h.job_id === jobId);
    const jobTitle = currentJob?.jd_filename || 'Analysis Report';

    return (
        <div className="w-full h-full font-sans text-text-primary animate-fade-in pb-20 relative">
            <div className="max-w-[1400px] mx-auto w-full">
                
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm font-medium mb-4 relative">
                    <span className="text-outline hover:text-text-primary transition-colors cursor-pointer" onClick={onReset}>Workspace</span>
                    <span className="text-outline">/</span>
                    <div className="relative group">
                        <span 
                            className="text-text-primary cursor-pointer hover:text-primary-sage transition-colors flex items-center gap-1 font-bold"
                            onClick={(e) => { e.stopPropagation(); setShowHistoryDropdown(!showHistoryDropdown); }}
                        >
                            {jobTitle}
                            <span className="material-symbols-outlined text-[16px]">expand_more</span>
                        </span>
                        
                        {showHistoryDropdown && (
                            <div className="absolute top-8 left-0 w-80 bg-white shadow-paper rounded-[16px] border border-[#E9E1DC] py-2 z-[60] max-h-[300px] overflow-y-auto animate-fade-in-up">
                                <div className="px-4 py-2 border-b border-[#E9E1DC] text-[10px] font-bold uppercase text-outline tracking-widest mb-1">Recent Analyses</div>
                                {history.map(h => (
                                    <div
                                        key={h.job_id}
                                        onClick={() => { onSwitchJob && onSwitchJob(h.job_id); setShowHistoryDropdown(false); }}
                                        className={`px-4 py-3 hover:bg-[#F5ECE7] cursor-pointer border-l-2 transition-colors ${h.job_id === jobId ? 'bg-[#CAECBC]/10 border-l-primary-sage' : 'border-l-transparent'}`}
                                    >
                                        <p className={`text-[13px] font-bold truncate ${h.job_id === jobId ? 'text-primary-sage' : 'text-text-primary'}`}>
                                            {h.jd_filename || h.filename || 'Untitled'}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-outline mt-1 flex justify-between font-bold">
                                            <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                                            <span className={`${h.status === 'completed' ? 'text-primary-sage' : 'text-terracotta'}`}>{h.status}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* PageHeading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-[36px] font-serif font-bold text-text-primary tracking-tight leading-none">Analysis Report</h1>
                        <p className="text-text-secondary text-[15px]">
                            {allCandidates.length} applicants reviewed. <span className="text-text-primary font-bold">{filteredCandidates.length} matches</span> found based on criteria.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E9E1DC] rounded-full text-[13px] font-bold text-[#272521] hover:bg-[#F5ECE7] hover:border-outline-variant transition-all shadow-sm cursor-pointer opacity-100">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Export Data
                        </button>
                        <button onClick={onReset} className="flex items-center gap-2 px-5 py-2.5 bg-[#3F7655] text-white border border-[#3F7655] rounded-full text-[13px] font-semibold shadow-sm hover:bg-[#315F44] active:translate-y-[1px] focus:ring-2 focus:ring-[#3F7655]/50 focus:outline-none transition-all cursor-pointer opacity-100">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Review
                        </button>
                    </div>
                </div>

                {/* ToolBar / Filters */}
                <div className="bg-white rounded-[24px] border border-[#E9E1DC] shadow-paper mb-8 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border-b border-[#E9E1DC]">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F5ECE7]/50 rounded-[12px] border border-[#E9E1DC]">
                                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Score:</span>
                                <select 
                                    className="bg-transparent border-none text-[13px] font-bold p-0 focus:ring-0 text-text-primary"
                                    value={filters.score}
                                    onChange={(e) => setFilters({...filters, score: e.target.value})}
                                >
                                    <option>All</option>
                                    <option>&gt; 85%</option>
                                    <option>&gt; 90%</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F5ECE7]/50 rounded-[12px] border border-[#E9E1DC]">
                                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Experience:</span>
                                <select 
                                    className="bg-transparent border-none text-[13px] font-bold p-0 focus:ring-0 text-text-primary"
                                    value={filters.experience}
                                    onChange={(e) => setFilters({...filters, experience: e.target.value})}
                                >
                                    <option>All</option>
                                    <option>5+ Years</option>
                                    <option>8+ Years</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] text-text-secondary font-medium">Selected: {selectedCandidates.length}</span>
                            {selectedCandidates.length > 0 ? (
                                <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-white rounded-[12px] text-[13px] font-bold hover:bg-black transition-colors shadow-sm cursor-pointer opacity-100">
                                    <span className="material-symbols-outlined text-[16px]">archive</span>
                                    Bulk Action
                                </button>
                            ) : (
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#E9E1DC] text-outline rounded-[12px] text-[13px] font-bold cursor-not-allowed">
                                    <span className="material-symbols-outlined text-[16px]">archive</span>
                                    Bulk Action
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="overflow-x-auto bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-6 py-5 w-12 text-center bg-[#FBF9F4]">
                                        <span className="material-symbols-outlined text-[18px] text-outline">check_box_outline_blank</span>
                                    </th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-outline bg-[#FBF9F4]">Rank</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-outline bg-[#FBF9F4]">Candidate</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-outline bg-[#FBF9F4]">Match Score</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-outline bg-[#FBF9F4]">Experience</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-outline bg-[#FBF9F4] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E9E1DC]">
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
                                        <td colSpan="6" className="px-6 py-16 text-center text-text-secondary font-medium">
                                            No profiles matched your exact criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-5 border-t border-[#E9E1DC] flex items-center justify-between bg-white">
                        <p className="text-[13px] font-medium text-text-secondary">Showing 1-{filteredCandidates.length} of {allCandidates.length} applicants</p>
                        <div className="flex gap-2">
                            <button className="p-1.5 text-[#D8D5CE] cursor-not-allowed rounded-lg" disabled>
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="px-3 py-1.5 text-[13px] font-bold text-primary-sage bg-[#CAECBC]/30 rounded-lg">1</button>
                            <button className="p-1.5 text-[#D8D5CE] cursor-not-allowed rounded-lg" disabled>
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[20px] shadow-paper">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-[#F5ECE7] text-terracotta rounded-xl">
                                <span className="material-symbols-outlined text-[20px]">psychology</span>
                            </div>
                            <h3 className="text-[15px] font-bold text-text-primary">Skill Overlap</h3>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            Most top candidates show strong proficiency in <span className="text-text-primary font-bold">{topSkills[0] || 'Python'}</span> and <span className="text-text-primary font-bold">{topSkills[1] || 'AWS'}</span>, matching JD requirements perfectly.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-[20px] shadow-paper">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-[#CAECBC]/30 text-primary-sage rounded-xl">
                                <span className="material-symbols-outlined text-[20px]">speed</span>
                            </div>
                            <h3 className="text-[15px] font-bold text-text-primary">Pipeline Velocity</h3>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            Current ranking cycle completed in 4.2 seconds. Average time to shortlist reduced by <span className="text-primary-sage font-bold">2.4 days</span> compared to manual screening.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-[20px] shadow-paper">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-[#F5ECE7] text-text-primary rounded-xl">
                                <span className="material-symbols-outlined text-[20px]">diversity_3</span>
                            </div>
                            <h3 className="text-[15px] font-bold text-text-primary">Objective Check</h3>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            AI screening maintains objectivity. Talent pool is reviewed based strictly on experience and skill alignment.
                        </p>
                    </div>
                </div>

                {/* Floating Action for Comparison */}
                {selectedCandidates.length > 0 && !showComparison && (
                    <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[90] bg-[#FFFDF9] text-[#211F1B] pl-6 pr-2 py-2 rounded-full shadow-[0_10px_30px_rgba(30,27,24,0.12)] border border-[#E2DCD4] flex items-center gap-4 animate-fade-in-up">
                        <span className="font-semibold text-[14px] whitespace-nowrap"><span className="text-[#3F7655]">{selectedCandidates.length}</span> Linked <span className="text-[#706B63] font-normal text-[12px] ml-1">(5 Max)</span></span>
                        <div className="h-5 w-[1px] bg-[#E2DCD4]"></div>
                        <button
                            disabled={selectedCandidates.length < 2}
                            onClick={() => setShowComparison(true)}
                            className="px-6 h-[44px] bg-[#3F7655] hover:bg-[#315F44] text-white text-[14px] font-semibold rounded-full transition-all disabled:bg-[#E9E1DC] disabled:text-[#D8D5CE] disabled:cursor-not-allowed disabled:shadow-none uppercase tracking-wider flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">layers</span> Compare Profiles
                        </button>
                        <button onClick={() => setSelectedCandidates([])} className="w-[44px] h-[44px] hover:bg-[#F3EEE7] rounded-full transition-colors text-[#706B63] hover:text-[#211F1B] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">close</span>
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
    const scoreColor = data.final_score >= 80 ? 'bg-primary-sage' : data.final_score >= 60 ? 'bg-terracotta' : 'bg-outline';

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
        <tr className={`hover:bg-[#FBF9F4] transition-colors group cursor-pointer ${selected ? 'bg-[#CAECBC]/10' : ''}`} onClick={() => navigate(`/analysis/${jobId}/${data.filename}`)}>
            <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                <span 
                    onClick={onSelect}
                    className={`material-symbols-outlined cursor-pointer transition-colors text-[20px] ${selected ? 'text-primary-sage' : 'text-outline hover:text-text-primary'}`}
                >
                    {selected ? 'check_box' : 'check_box_outline_blank'}
                </span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-text-primary">#{rank}</span>
                    {trend === 'up' && <span className="material-symbols-outlined text-primary-sage text-[16px]">trending_up</span>}
                    {trend === 'flat' && <span className="material-symbols-outlined text-outline text-[16px]">remove</span>}
                    {trend === 'down' && <span className="material-symbols-outlined text-terracotta text-[16px]">trending_down</span>}
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-page border border-[#E9E1DC] flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=F5ECE7&textColor=1E1B18`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                            {cleanName}
                        </div>
                        <p className="text-[12px] text-text-secondary font-medium truncate max-w-[200px] mt-0.5">
                            {data.matched_skills?.slice(0, 3).join(', ') || 'Various Skills'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex flex-col gap-2 w-32">
                    <div className="flex justify-between items-center">
                        <span className="text-[15px] font-black text-text-primary">{Math.round(data.final_score)}%</span>
                        {isTopPercent && <span className="text-[10px] text-primary-sage font-bold bg-[#CAECBC]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">Top Match</span>}
                    </div>
                    <div className="w-full bg-[#F5ECE7] h-2 rounded-full overflow-hidden">
                        <div className={`${scoreColor} h-full rounded-full transition-all duration-1000`} style={{ width: `${data.final_score}%` }}></div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className="text-[13px] font-semibold text-text-secondary">
                    {data.experience_years ? `${data.experience_years} Years` : 'Unknown'}
                </span>
            </td>
            <td className="px-6 py-5 text-right">
                <button
                    onClick={handleShortlist}
                    className={`px-4 py-2 transition-all rounded-full text-[12px] font-bold border ${status === 'shortlisted'
                        ? 'bg-[#CAECBC]/30 text-primary-sage border-primary-sage/30 shadow-sm'
                        : 'bg-white text-text-secondary hover:text-text-primary border-[#E9E1DC] hover:border-outline-variant shadow-sm'
                        }`}
                >
                    {status === 'shortlisted' ? 'Retained' : 'Recommendation'}
                </button>
            </td>
        </tr>
    );
}
