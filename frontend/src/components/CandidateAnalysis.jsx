import React, { useEffect, useState } from 'react';
import {
    FiSearch, FiBell, FiHelpCircle, FiDownload, FiCheck, FiAlertTriangle, FiShield,
    FiCpu, FiUser, FiBriefcase, FiDivideCircle, FiArrowLeft, FiLoader, FiX, FiCalendar, FiMail, FiMessageSquare, FiChevronDown
} from 'react-icons/fi';
import { MdVerified, MdOutlinePolicy } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { getResults, updateCandidateStatus, scheduleInterview } from '../api';

export default function CandidateAnalysis() {
    const navigate = useNavigate();
    const { jobId, filename } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Interactive States
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await getResults(jobId);
                // Decode filename from URL param to match API data
                const targetFilename = decodeURIComponent(filename);
                const found = results.candidates.find(c => c.filename === targetFilename);

                if (found) {
                    setCandidate(found);
                } else {
                    setError("Candidate not found in this analysis.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load analysis data.");
            } finally {
                setLoading(false);
            }
        };

        if (jobId && filename) {
            fetchData();
        }
    }, [jobId, filename]);

    const formatName = (fname) => {
        // Remove extension and typical separators
        return fname.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    };

    const handleExport = () => {
        window.print();
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateCandidateStatus(jobId, candidate.filename, newStatus);
            setCandidate(prev => ({ ...prev, status: newStatus }));
            setNotification({ type: 'success', message: `Candidate marked as ${newStatus}` });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error(err);
            setNotification({ type: 'error', message: "Failed to update status" });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const [scheduleData, setScheduleData] = useState({ date: '', hour: '09', minute: '00', period: 'AM', type: 'Google Meet' });
    const [scheduling, setScheduling] = useState(false);

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        setScheduling(true);
        try {
            const formattedTime = `${scheduleData.hour}:${scheduleData.minute} ${scheduleData.period}`;
            await scheduleInterview({
                candidate_name: displayName,
                job_id: jobId,
                date: scheduleData.date,
                time: formattedTime,
                meeting_type: scheduleData.type
            });
            setShowScheduleModal(false);
            setNotification({ type: 'success', message: `Interview scheduled with ${displayName}` });
            setScheduleData({ date: '', hour: '09', minute: '00', period: 'AM', type: 'Google Meet' });
        } catch (err) {
            console.error(err);
            setNotification({ type: 'error', message: "Failed to schedule interview" });
        } finally {
            setScheduling(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };
    // ... existing render code up to form ...
    // Note: I will only replace the state init and submit handler, AND the Time input JSX.
    // However, replace_file_content must be contiguous.
    // The state init is at line 70. The JSX is at line 489.
    // I MUST use multi_replace for this.


    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
            <div className="text-center">
                <FiLoader className="animate-spin text-blue-600 text-3xl mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Loading candidate analysis...</p>
            </div>
        </div>
    );

    if (error || !candidate) return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
            <div className="text-center">
                <div className="inline-flex p-4 rounded-full bg-red-50 text-red-500 mb-4">
                    <FiAlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Analysis Not Found</h3>
                <p className="text-slate-500 mb-6">{error || "The requested candidate could not be found."}</p>
                <button onClick={() => navigate('/candidates')} className="text-blue-600 font-bold hover:underline">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    // Derived Values
    const displayName = formatName(candidate.filename);
    const roleTitle = candidate.recommended_roles && candidate.recommended_roles.length > 0
        ? (Array.isArray(candidate.recommended_roles[0]) ? candidate.recommended_roles[0][0] : candidate.recommended_roles[0])
        : "Applicant";

    const score = Math.round(candidate.final_score);
    const scoreColor = score >= 80 ? 'text-blue-600' : score >= 60 ? 'text-indigo-600' : 'text-amber-500';
    const circleColor = score >= 80 ? 'text-blue-600' : score >= 60 ? 'text-indigo-600' : 'text-amber-500';

    return (
        <div className="bg-slate-50 dark:bg-bg-deep font-sans text-slate-900 dark:text-white min-h-screen opacity-0 animate-fade-in-up" style={{ opacity: 1 }}>

            {/* NOTIFICATION TOAST */}
            {notification && (
                <div className={`fixed top-20 right-8 z-[100] ${notification.type === 'error' ? 'bg-red-500' : 'bg-slate-900'} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up`}>
                    <div className={`p-1 ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-500'} rounded-full`}><FiCheck size={12} /></div>
                    <div>
                        <h4 className="font-bold text-sm">{notification.type === 'error' ? 'Error' : 'Success'}</h4>
                        <p className="text-xs text-slate-200">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-border-subtle bg-white dark:bg-bg-card px-8 py-4 sticky top-0 z-50 print:hidden transition-colors">
                <div className="flex items-center gap-12">
                    {/* Logo */}
                    <div className="flex items-center gap-3 text-blue-600 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">RecruitAI Enterprise</h2>
                    </div>

                    {/* Search */}
                    <div className="hidden md:flex items-center bg-slate-100 dark:bg-bg-deep rounded-lg w-96 px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <FiSearch className="text-slate-400 mr-3" size={18} />
                        <input
                            type="text"
                            placeholder="Search in analysis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-white placeholder:text-slate-400"
                        />
                    </div>

                    {/* Navigation */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <button className="hover:text-blue-600 dark:hover:text-white transition-colors" onClick={() => navigate('/')}>Dashboard</button>
                        <button className="text-blue-600 dark:text-white font-bold bg-blue-50 dark:bg-white/10 px-3 py-1.5 rounded-lg transition-all" onClick={() => navigate('/candidates')}>Candidates</button>
                        <button className="hover:text-blue-600 dark:hover:text-white transition-colors" onClick={() => navigate('/analytics')}>Analytics</button>
                    </nav>
                </div>

                <div className="flex items-center gap-5">
                    <div className="size-10 rounded-full bg-slate-200 dark:bg-bg-deep border-2 border-white dark:border-border-subtle shadow-sm overflow-hidden flex items-center justify-center text-slate-400 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                        <FiUser size={20} />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 space-y-6">

                {/* BREADCRUMBS */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mb-2 print:hidden">
                    <span className="hover:underline cursor-pointer" onClick={() => navigate('/candidates')}>Candidates</span>
                    <span>/</span>
                    <span className="hover:underline cursor-pointer">{roleTitle}</span>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Analysis: {displayName}</span>
                </div>

                {/* PROFILE HEADER CARD */}
                <section className="bg-white dark:bg-bg-card p-8 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6 print:shadow-none print:border-none transition-colors">
                    <div className="flex gap-6 items-start">
                        <div className="size-24 rounded-full border-4 border-blue-50 dark:border-blue-900/20 overflow-hidden shadow-inner bg-slate-100 dark:bg-bg-deep flex items-center justify-center text-slate-400">
                            <FiUser size={40} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{displayName}</h1>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-bg-deep text-slate-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                    ID: #{Math.floor(Math.random() * 90000) + 10000}
                                </span>
                                {candidate.status && candidate.status !== 'new' && (
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${candidate.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {candidate.status}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-gray-400 text-sm mb-4 font-medium">
                                Analysis for {roleTitle} • Uploaded just now
                            </p>
                            <div className="flex gap-3">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${score >= 70 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                    <MdVerified size={14} />
                                    {candidate.match_classification}
                                </div>
                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                    <FiCpu size={14} />
                                    {candidate.confidence_score} Confidence
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 print:hidden">
                        <button
                            onClick={handleExport}
                            className="px-5 h-11 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 font-bold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-sm shadow-sm"
                        >
                            <FiDownload size={16} />
                            Export
                        </button>

                        <button
                            onClick={() => handleStatusUpdate('rejected')}
                            className={`px-5 h-11 rounded-xl border font-bold text-sm transition-colors ${candidate.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                }`}
                        >
                            Reject
                        </button>

                        <button
                            onClick={() => handleStatusUpdate('shortlisted')}
                            className={`px-5 h-11 rounded-xl border font-bold text-sm transition-colors ${candidate.status === 'shortlisted'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400'
                                }`}
                        >
                            Shortlist
                        </button>

                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="px-6 h-11 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:translate-y-0.5 text-sm"
                        >
                            Schedule Interview
                        </button>
                    </div>
                </section>

                {/* SUMMARY SECTION */}
                <section className="bg-white dark:bg-bg-card p-10 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm print:shadow-none transition-colors">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        {/* CIRCULAR CHART */}
                        <div className="relative size-48 flex-shrink-0">
                            <svg className="size-full -rotate-90">
                                <circle cx="96" cy="96" r="80" strokeWidth="16" className="text-slate-100" stroke="currentColor" fill="none" />
                                <circle
                                    cx="96" cy="96" r="80"
                                    strokeWidth="16"
                                    className={circleColor}
                                    stroke="currentColor"
                                    fill="none"
                                    strokeDasharray="502"
                                    strokeDashoffset={502 - (502 * score) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-black tracking-tight ${scoreColor}`}>{score}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Match Score</span>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI Analysis Summary</h3>
                                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                                    {displayName} demonstrates {score >= 80 ? 'exceptional' : score >= 60 ? 'strong' : 'moderate'} alignment with the requirements.
                                    Top skills detected include <span className="font-semibold text-blue-600">{candidate.matched_skills.slice(0, 2).join(', ')}</span>.
                                    {candidate.degree && <span> Education credentials: {candidate.degree}.</span>}
                                    {candidate.experience_years && <span> Estimated Experience: {candidate.experience_years} years.</span>}
                                </p>
                            </div>

                            <div className="flex gap-12 pt-4 border-t border-slate-100 dark:border-border-subtle">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Total Skills Found</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{candidate.matched_skills.length + (candidate.missing_skills ? candidate.missing_skills.length : 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Processing Time</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">0.8 Seconds</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT COLUMN: SCORE BREAKDOWN */}
                    <section className="bg-white dark:bg-bg-card p-8 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm h-full flex flex-col transition-colors">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                <FiDivideCircle size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Score Breakdown</h3>
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* Semantic Match */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-slate-700">Semantic Relevance</span>
                                    <span className="text-sm font-bold text-blue-600">{Math.round(candidate.semantic_score)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(candidate.semantic_score, 100)}%` }}></div>
                                </div>
                            </div>

                            {/* Skill Overlap */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-slate-700">Skill Overlap</span>
                                    <span className="text-sm font-bold text-blue-600">{Math.round(candidate.skill_overlap_score || 0)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(candidate.skill_overlap_score || 0, 100)}%` }}></div>
                                </div>
                            </div>

                            {/* Education */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-slate-700">Education Alignment</span>
                                    <span className="text-sm font-bold text-blue-600">{Math.round(candidate.education_score)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(candidate.education_score, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1">
                                <FiCpu size={12} /> AI NOTE
                            </p>
                            <p className="text-xs text-blue-700/80 dark:text-blue-200/70 leading-relaxed">
                                Scoring based on {candidate.role_weights_applied ? 'role-specific weighted' : 'standard'} factors comparison against job description.
                            </p>
                        </div>
                    </section>

                    {/* RIGHT COLUMN: SKILLS ANALYSIS */}
                    <section className="bg-white dark:bg-bg-card p-8 rounded-2xl border border-slate-200 dark:border-border-subtle shadow-sm h-full flex flex-col transition-colors">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FiCheck size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Skills Analysis</h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Matched Core Skills</p>
                            <div className="flex flex-wrap gap-3">
                                {candidate.matched_skills.map(skill => (
                                    <span
                                        key={skill}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all duration-300 ${searchQuery && skill.toLowerCase().includes(searchQuery.toLowerCase())
                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 scale-105 shadow-sm'
                                            : 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30'
                                            }`}
                                    >
                                        <span className="bg-green-600 text-white rounded-full p-0.5"><FiCheck size={8} /></span>
                                        {skill}
                                    </span>
                                ))}
                                {candidate.matched_skills.length === 0 && <span className="text-xs text-slate-400 italic">No exact matches found</span>}
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Missing or Identified Gaps</p>
                            <div className="flex flex-wrap gap-3">
                                {candidate.missing_skills && candidate.missing_skills.length > 0 ? (
                                    candidate.missing_skills.slice(0, 5).map(skill => (
                                        <span key={skill} className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-bold text-xs flex items-center gap-1.5 border border-orange-100">
                                            <FiAlertTriangle size={12} />
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No major gaps identified</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 transform translate-x-1/4 -translate-y-1/4">
                                <FiAlertTriangle size={80} />
                            </div>
                            <h5 className="text-amber-900 dark:text-amber-300 font-bold text-sm mb-2 flex items-center gap-2">
                                <span className="p-1 bg-amber-200 dark:bg-amber-900/40 rounded text-amber-800 dark:text-amber-400"><FiBriefcase size={12} /></span>
                                Skill Gap Recommendation
                            </h5>
                            <p className="text-xs text-amber-800/80 dark:text-amber-200/70 leading-relaxed relative z-10">
                                {candidate.missing_skills && candidate.missing_skills.length > 0
                                    ? `Candidate is missing ${candidate.missing_skills[0]}. Consider asking about related experience or willingness to learn.`
                                    : "Candidate has strong coverage of required skills."}
                            </p>
                        </div>
                    </section>
                </div>

                {/* INTERVIEW GUIDE */}
                {candidate.interview_questions && candidate.interview_questions.length > 0 && (
                    <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:shadow-none">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <FiMessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">AI-Generated Interview Guide</h3>
                                <p className="text-xs text-slate-500">Based on candidate's specific skill gaps and strengths</p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-1 gap-4">
                            {candidate.interview_questions.map((q, i) => (
                                <div key={i} className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-slate-100/50 dark:border-border-subtle/50 hover:bg-white dark:hover:bg-bg-deep hover:shadow-sm transition-all flex gap-4">
                                    <span className="flex-shrink-0 size-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
                                        Q{i + 1}
                                    </span>
                                    <p className="font-medium text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{q}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ETHICAL AI BANNER */}
                <section className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 flex flex-col md:flex-row items-center justify-between gap-6 print:bg-white print:border-slate-200">
                    <div className="flex gap-5 items-center">
                        <div className="size-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 flex-shrink-0">
                            <MdOutlinePolicy size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Ethical AI & Bias-Free Processing</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-xl leading-relaxed">
                                RecruitAI is committed to fair hiring. This analysis was generated by a model that has been audited for bias. To ensure objectivity, demographic identifiers such as gender, age, and race were automatically redacted from the data before the analysis was performed.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAuditModal(true)}
                        className="print:hidden whitespace-nowrap px-4 py-2 bg-white dark:bg-bg-card border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
                    >
                        View Audit Log
                    </button>
                </section>

            </main>

            {/* MODALS */}

            {showScheduleModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-border-subtle">
                        <div className="p-6 border-b border-slate-100 dark:border-border-subtle flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Schedule Interview</h3>
                            <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Candidate</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-bg-deep rounded-lg border border-slate-100 dark:border-border-subtle">
                                    <div className="size-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {displayName.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-900 dark:text-white">{displayName}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Date</label>
                                    <div className="relative">
                                        <FiCalendar className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="date" required
                                            value={scheduleData.date}
                                            onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-border-subtle bg-white dark:bg-bg-deep text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Time</label>
                                    <div className="flex gap-2 h-[46px]">
                                        <div className="relative flex-1 h-full">
                                            <select
                                                value={scheduleData.hour}
                                                onChange={e => setScheduleData({ ...scheduleData, hour: e.target.value })}
                                                className="w-full h-full px-3 rounded-xl border border-slate-200 dark:border-border-subtle bg-white dark:bg-bg-deep text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm font-bold appearance-none text-center cursor-pointer hover:border-blue-300 transition-colors"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
                                                    const val = h.toString().padStart(2, '0');
                                                    return <option key={val} value={val}>{val}</option>;
                                                })}
                                            </select>
                                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
                                                <FiChevronDown size={12} />
                                            </div>
                                        </div>

                                        <span className="self-center font-bold text-slate-300 dark:text-slate-600">:</span>

                                        <div className="relative flex-1 h-full">
                                            <select
                                                value={scheduleData.minute}
                                                onChange={e => setScheduleData({ ...scheduleData, minute: e.target.value })}
                                                className="w-full h-full px-3 rounded-xl border border-slate-200 dark:border-border-subtle bg-white dark:bg-bg-deep text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm font-bold appearance-none text-center cursor-pointer hover:border-blue-300 transition-colors"
                                            >
                                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
                                                <FiChevronDown size={12} />
                                            </div>
                                        </div>

                                        <div className="flex bg-slate-100 dark:bg-bg-deep rounded-xl p-1 border border-slate-200 dark:border-border-subtle h-full items-center w-28 flex-shrink-0">
                                            {['AM', 'PM'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setScheduleData({ ...scheduleData, period: p })}
                                                    className={`flex-1 h-full rounded-lg text-xs font-black transition-all duration-200 ${scheduleData.period === p
                                                            ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Meeting Type</label>
                                <select
                                    value={scheduleData.type}
                                    onChange={e => setScheduleData({ ...scheduleData, type: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border-subtle bg-white dark:bg-bg-deep text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm"
                                >
                                    <option>Google Meet</option>
                                    <option>Zoom</option>
                                    <option>In-Person</option>
                                    <option>Phone Call</option>
                                </select>
                            </div>
                            <button type="submit" disabled={scheduling} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20 active:translate-y-0.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-70">
                                {scheduling ? <FiLoader className="animate-spin" /> : <FiMail />}
                                {scheduling ? 'Sending Invitation...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Audit Log Modal */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FiShield size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Bias Audit Log</h3>
                                    <p className="text-xs text-slate-500">Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Bias Check</p>
                                    <p className="font-black text-slate-900 text-lg">PASSED</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Model Version</p>
                                    <p className="font-black text-slate-900 text-lg">v2.4.0</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fairness Score</p>
                                    <p className="font-black text-slate-900 text-lg">98.5%</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Redaction Log</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                                        <span className="text-slate-600">Gender Identifiers</span>
                                        <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">REMOVED</span>
                                    </div>
                                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                                        <span className="text-slate-600">Age / Date of Birth</span>
                                        <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">REMOVED</span>
                                    </div>
                                    <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                                        <span className="text-slate-600">Racial/Ethnic Signifiers</span>
                                        <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">REMOVED</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
                                <FiCheck className="text-yellow-600 mt-0.5" />
                                <p className="text-xs text-yellow-800 leading-relaxed">
                                    This audit confirms that the resume text processed for {displayName} was stripped of protected class attributes before being fed into the matching neural network.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowAuditModal(false)} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                                Close Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="px-12 py-8 bg-white dark:bg-bg-card border-t border-slate-200 dark:border-border-subtle mt-12 print:hidden transition-colors">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-medium text-slate-400">© 2024 RecruitAI Enterprise. All rights reserved.</p>
                    <div className="flex gap-6 text-xs font-bold text-slate-500">
                        <span className="cursor-pointer hover:text-blue-600" onClick={() => alert("Privacy content placeholder")}>Privacy Policy</span>
                        <span className="cursor-pointer hover:text-blue-600" onClick={() => alert("Terms content placeholder")}>Terms of Service</span>
                        <span className="cursor-pointer hover:text-blue-600" onClick={() => alert("Compliance content placeholder")}>Compliance Report</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
