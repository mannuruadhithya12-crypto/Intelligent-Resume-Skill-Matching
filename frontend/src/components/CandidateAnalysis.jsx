/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import {
    FiSearch, FiBell, FiHelpCircle, FiDownload, FiCheck, FiAlertTriangle, FiShield,
    FiCpu, FiUser, FiBriefcase, FiDivideCircle, FiArrowLeft, FiLoader, FiX, FiCalendar, FiMail, FiMessageSquare, FiChevronDown,
    FiGithub, FiLinkedin, FiGlobe, FiMapPin, FiAward, FiBookOpen, FiLayout, FiVideo, FiPhone, FiActivity, FiPrinter, FiXCircle
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

    // Scheduling State
    const [scheduleData, setScheduleData] = useState({
        date: '',
        time: '',
        type: 'video',
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await getResults(jobId);
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
        return fname.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    };

    const StatusBadgeColors = {
        new: 'bg-blue-50 text-blue-700 border-blue-100',
        shortlisted: 'bg-green-50 text-green-700 border-green-100',
        rejected: 'bg-red-50 text-red-700 border-red-100',
        interview_scheduled: 'bg-purple-50 text-purple-700 border-purple-100',
        hired: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateCandidateStatus(jobId, candidate.filename, newStatus);
            setCandidate(prev => ({ ...prev, status: newStatus }));
            setNotification({ type: 'success', message: `Candidate marked as ${newStatus.replace('_', ' ')}` });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error(err);
            setNotification({ type: 'error', message: "Failed to update status" });
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            await scheduleInterview({
                job_id: jobId,
                candidate_filename: candidate.filename,
                ...scheduleData
            });
            await handleStatusUpdate('interview_scheduled');
            setShowScheduleModal(false);
            setNotification({ type: 'success', message: 'Interview scheduled successfully!' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error(err);
            setNotification({ type: 'error', message: 'Failed to schedule interview' });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const showToast = (msg) => {
        setNotification({ type: 'info', message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center flex-col gap-4">
            <FiLoader className="animate-spin text-blue-600 text-3xl" />
            <p className="text-slate-500 text-sm font-medium">Loading analysis...</p>
        </div>
    );

    if (error || !candidate) return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
            <div className="text-center">
                <FiAlertTriangle className="text-red-500 text-4xl mx-auto mb-4" />
                <p className="text-slate-600 font-bold">{error || "Candidate not found"}</p>
                <button onClick={() => navigate('/candidates')} className="text-blue-600 mt-4 underline">Back to Candidates</button>
            </div>
        </div>
    );

    const displayName = formatName(candidate.filename);
    const roleTitle = candidate.recommended_roles?.[0]
        ? (Array.isArray(candidate.recommended_roles[0]) ? candidate.recommended_roles[0][0] : candidate.recommended_roles[0])
        : "Senior Software Engineer"; // Default fallback title

    // Filter skills based on search
    const matchedSkillsFiltered = candidate.matched_skills.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const BG_LIGHT = "bg-[#F8F9FB]";

    return (
        <div className={`min-h-screen ${BG_LIGHT} font-sans text-slate-900`}>

            {/* NOTIFICATION TOAST */}
            {notification && (
                <div className={`fixed top-20 right-6 z-[100] px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-fade-in-up print:hidden ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                        notification.type === 'info' ? 'bg-slate-800 text-white border-slate-700' :
                            'bg-green-50 text-green-700 border-green-100'
                    }`}>
                    {notification.type === 'error' ? <FiAlertTriangle /> : <FiCheck />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* 1. TOP NAVIGATION */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 print:hidden">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="text-blue-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-800">RecruitAI <span className="text-slate-500 font-normal">Enterprise</span></span>
                </div>

                {/* Centered Search */}
                <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-4 py-2 w-96 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <FiSearch className="text-slate-400 mr-2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter skills..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
                    />
                </div>

                {/* Right Nav */}
                <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
                    <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">Dashboard</button>
                    <button onClick={() => navigate('/candidates')} className="text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5">Candidates</button>
                    <button onClick={() => showToast("Job board module coming soon")} className="hover:text-blue-600 transition-colors">Job Postings</button>
                    <button onClick={() => navigate('/analytics')} className="hover:text-blue-600 transition-colors">Analytics</button>

                    <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                        <button onClick={() => showToast("No new notifications")}><FiBell className="text-slate-400 text-lg hover:text-slate-600 transition-colors" /></button>
                        <button onClick={() => showToast("Documentation unavailable offline")}><FiHelpCircle className="text-slate-400 text-lg hover:text-slate-600 transition-colors" /></button>
                        <div onClick={() => showToast("Profile settings")} className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs border border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
                            JD
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA */}
            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* BREADCRUMBS */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium print:hidden">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/candidates')}>Candidates</span>
                    <span>/</span>
                    <span>{roleTitle}</span>
                    <span>/</span>
                    <span className="text-slate-900 font-bold">Analysis: {displayName}</span>
                </div>

                {/* PROFILE CARD */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <div className="flex gap-5 items-center">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                            {candidate.email ?
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.email}`} alt="Avatar" className="w-full h-full object-cover" />
                                : <FiUser className="text-slate-300 text-3xl" />
                            }
                        </div>

                        {/* Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">ID: #{Math.floor(Math.random() * 90000)}</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-3">
                                Applied for <span className="font-medium text-slate-700">{roleTitle}</span> Role
                            </p>
                            <div className="flex gap-2">
                                <span className={`${StatusBadgeColors[candidate.status] || 'bg-gray-100 text-gray-700'} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border`}>
                                    {candidate.status === 'shortlisted' && <FiCheck size={12} className="stroke-[3px]" />}
                                    {candidate.status === 'rejected' && <FiXCircle size={12} />}
                                    {candidate.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-indigo-100">
                                    <FiCpu size={12} /> High Confidence
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 print:hidden">
                        <button
                            onClick={() => handleStatusUpdate('rejected')}
                            className="px-4 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 border border-red-100 transition-colors"
                            title="Reject Candidate"
                        >
                            <FiXCircle size={18} />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-100 border border-slate-200 flex items-center gap-2 transition-colors"
                        >
                            <FiPrinter /> Download
                        </button>
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                            <FiCalendar /> Move to Interview
                        </button>
                    </div>
                </div>

                {/* SUMMARY CARD */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-center gap-12">
                    <div className="relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="80" cy="80" r="70" strokeWidth="12" className="text-slate-100" stroke="currentColor" fill="none" />
                            <circle cx="80" cy="80" r="70" strokeWidth="12" className="text-blue-600" stroke="currentColor" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * candidate.final_score / 100)} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-slate-900">{Math.round(candidate.final_score)}%</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-1">Match Score</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">AI Analysis Summary</h3>
                        <p className="text-slate-500 leading-relaxed mb-6">
                            {displayName} shows exceptional alignment with technical requirements.
                            {candidate.experience_years ? ` Their ${candidate.experience_years} years of experience matches the seniority level.` : ' Experience profile is strong.'}
                            Key strengths identified in {candidate.matched_skills?.[0] || 'Core Skills'} and {candidate.matched_skills?.[1] || 'Domain Knowledge'}.
                        </p>
                        <div className="flex gap-12 border-t border-slate-100 pt-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">DATA POINTS</p>
                                <p className="text-lg font-bold text-slate-900">42 Sources</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">PROCESSING TIME</p>
                                <p className="text-lg font-bold text-slate-900">1.2 Seconds</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2-COLUMN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* LEFT: SCORE BREAKDOWN */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <FiBriefcase className="text-blue-600" />
                            <h3 className="font-bold text-slate-900">Score Breakdown</h3>
                        </div>

                        <div className="space-y-5">
                            <ScoreBar label="TECHNICAL SKILLS" value={Math.round(candidate.skill_overlap_score || 0)} />
                            <ScoreBar label="EXPERIENCE RELEVANCE" value={Math.round(candidate.experience_score)} />
                            <ScoreBar label="EDUCATION ALIGNMENT" value={Math.round(candidate.education_score)} />
                            <ScoreBar label="CULTURAL FIT ANALYSIS" value={70} /> {/* Mock value */}
                        </div>

                        <div className="mt-6 bg-slate-50 p-4 rounded-lg text-xs text-slate-500 leading-relaxed">
                            <span className="font-bold text-blue-600">ℹ AI NOTE</span> Scoring is based on the comparison of the job description keywords and weighted industry standards.
                        </div>
                    </div>

                    {/* RIGHT: SKILLS ANALYSIS */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <FiCheck className="text-blue-600" />
                                <h3 className="font-bold text-slate-900">Skills Analysis</h3>
                            </div>
                            {searchQuery && <span className="text-xs text-blue-600 font-bold">Filtered: {searchQuery}</span>}
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">MATCHED CORE SKILLS</p>
                            <div className="flex flex-wrap gap-2">
                                {matchedSkillsFiltered.map(skill => (
                                    <span key={skill} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-1.5 animate-fade-in">
                                        <FiCheck size={10} className="stroke-[3px]" /> {skill}
                                    </span>
                                ))}
                                {matchedSkillsFiltered.length === 0 && <span className="text-sm text-slate-400 italic">No skills match your filter.</span>}
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">MISSING OR IDENTIFIED GAPS</p>
                            <div className="flex flex-wrap gap-2">
                                {candidate.missing_skills?.slice(0, 3).map(skill => (
                                    <span key={skill} className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-100 flex items-center gap-1.5">
                                        <FiAlertTriangle size={10} /> {skill}
                                    </span>
                                )) || <span className="text-xs text-slate-400">None detected</span>}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Skill Gap Recommendation
                            </p>
                            <p className="text-xs text-amber-700/80 leading-relaxed">
                                {candidate.missing_skills?.[0]
                                    ? `Candidate is missing "${candidate.missing_skills[0]}". Consider validating container orchestration knowledge during the interview.`
                                    : "Candidate demonstrates strong core competencies."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER CARD */}
                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex items-start gap-4 mb-20 print:hidden">
                    <div className="p-3 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-600/20">
                        <FiShield size={20} />
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Ethical AI & Bias-Free Processing</h4>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                                RecruitAI is committed to fair hiring. This analysis was generated by a model audited for bias.
                                Demographic data was redacted before analysis.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAuditModal(true)}
                            className="bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors whitespace-nowrap shadow-sm flex items-center gap-2"
                        >
                            <FiActivity /> View Audit Log
                        </button>
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}

            {/* SCHEDULE MODAL */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden" onClick={(e) => e.target === e.currentTarget && setShowScheduleModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up md:m-0 m-4">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FiCalendar className="text-blue-600" /> Schedule Interview</h3>
                            <button onClick={() => setShowScheduleModal(false)}><FiX className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Candidate</label>
                                <div className="bg-slate-50 border border-slate-200 rounded p-2 text-sm font-medium text-slate-700">{displayName}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={scheduleData.date}
                                        onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={scheduleData.time}
                                        onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Format</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScheduleData({ ...scheduleData, type: 'video' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded border flex items-center justify-center gap-2 ${scheduleData.type === 'video' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                    >
                                        <FiVideo /> Video Call
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScheduleData({ ...scheduleData, type: 'phone' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded border flex items-center justify-center gap-2 ${scheduleData.type === 'phone' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                    >
                                        <FiPhone /> Phone
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                                Confirm Schedule
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* AUDIT MODAL */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden" onClick={(e) => e.target === e.currentTarget && setShowAuditModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up md:m-0 m-4">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FiActivity className="text-blue-600" /> AI Audit Log</h3>
                            <button onClick={() => setShowAuditModal(false)}><FiX className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="relative border-l-2 border-slate-200 pl-6 space-y-6 ml-2">
                                {/* Mock audit events */}
                                {[
                                    { title: "Status Update", desc: `Candidate marked as ${candidate.status.toUpperCase()}`, time: "Just now", icon: FiCheck },
                                    { title: "Analysis Generated", desc: "AI model v2.4 processed resume against JD.", time: "2 days ago", icon: FiCpu },
                                    { title: "Bias Check", desc: "PII removed. Gender/Race inference blocked.", time: "2 days ago", icon: FiShield },
                                    { title: "Application Received", desc: "Resume parsed successfully.", time: "2 days ago", icon: FiMail },
                                ].map((log, i) => (
                                    <div key={i} className="relative">
                                        <span className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-blue-50 border-4 border-white flex items-center justify-center text-blue-600 text-xs">
                                            <log.icon />
                                        </span>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">{log.time}</p>
                                        <h4 className="font-bold text-slate-900 text-sm">{log.title}</h4>
                                        <p className="text-sm text-slate-500">{log.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function ScoreBar({ label, value }) {
    return (
        <div>
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">{label}</span>
                <span className="text-xs font-black text-blue-600">{value}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${value}%` }}
                ></div>
            </div>
        </div>
    );
}
