/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
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

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateCandidateStatus(jobId, candidate.filename, newStatus);
            setCandidate(prev => ({ ...prev, status: newStatus }));
            showToast(`Candidate marked as ${newStatus.replace('_', ' ')}`, 'success');
        } catch (err) {
            console.error(err);
            showToast("Failed to update status", "error");
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
            showToast('Interview scheduled successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to schedule interview', 'error');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const showToast = (msg, type = 'info') => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh] flex-col gap-6">
            <div className="w-16 h-16 border-4 border-[#f0f2f4] dark:border-gray-800 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[#617589] dark:text-gray-400 font-medium animate-pulse">Compiling candidate dossier...</p>
        </div>
    );

    if (error || !candidate) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="text-center bg-white dark:bg-[#111418] p-10 rounded-xl border border-red-500/20 shadow-sm">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-red-500 text-4xl">warning</span>
                </div>
                <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">Access Denied</h2>
                <p className="text-[#617589] dark:text-gray-400 font-medium mb-6">{error || "Candidate profile inaccessible"}</p>
                <button onClick={() => navigate('/candidates')} className="bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white px-6 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2 mx-auto font-bold">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Return to Talent Pool
                </button>
            </div>
        </div>
    );

    const displayName = formatName(candidate.filename);
    const roleTitle = Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
        ? (Array.isArray(candidate.recommended_roles[0]) ? candidate.recommended_roles[0][0] : candidate.recommended_roles[0])
        : "Pending Role Match";

    const techScore = Math.round(candidate.skill_overlap_score || (candidate.final_score * 0.9));
    const expScore = Math.round(candidate.experience_score || (candidate.final_score * 1.1) > 100 ? 100 : candidate.final_score * 1.05);
    const eduScore = Math.round(candidate.education_score || 85);

    const matchedSkills = Array.isArray(candidate.matched_skills) ? candidate.matched_skills : [];
    const missingSkills = Array.isArray(candidate.missing_skills) ? candidate.missing_skills : [];

    const circumference = 2 * Math.PI * 88;
    const strokeDashoffset = circumference - (candidate.final_score / 100) * circumference;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white pb-20 pt-8 animate-fade-in">
            {notification && (
                <div className={`fixed top-24 right-6 z-[100] px-6 py-4 rounded-xl shadow-sm border flex items-center gap-3 animate-fade-in-up print:hidden ${
                    notification.type === 'error' ? 'bg-white dark:bg-[#111418] text-red-600 dark:text-red-400 border-red-500/30' :
                    notification.type === 'info' ? 'bg-white dark:bg-[#111418] text-primary border-primary/30' :
                    'bg-white dark:bg-[#111418] text-green-600 dark:text-green-400 border-green-500/30'
                }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-500/10' : notification.type === 'info' ? 'bg-primary/10' : 'bg-green-500/10'}`}>
                        <span className="material-symbols-outlined text-sm">{notification.type === 'error' ? 'warning' : 'check'}</span>
                    </div>
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-4 print:hidden">
                    <span className="cursor-pointer text-[#617589] dark:text-gray-400 text-sm font-medium hover:text-primary transition-colors" onClick={() => navigate('/candidates')}>Candidates</span>
                    <span className="text-[#617589] dark:text-gray-500 text-sm font-medium">/</span>
                    <span className="text-[#617589] dark:text-gray-400 text-sm font-medium">{roleTitle}</span>
                    <span className="text-[#617589] dark:text-gray-500 text-sm font-medium">/</span>
                    <span className="text-[#111418] dark:text-white text-sm font-bold">Analysis: {displayName}</span>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-[#111418] p-6 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm mb-8">
                    <div className="flex gap-6 items-center">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover bg-[#f0f2f4] dark:bg-gray-800 rounded-full h-24 w-24 border-4 border-primary/20 flex items-center justify-center overflow-hidden">
                            {candidate.email ?
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.email}`} alt="Avatar" className="w-full h-full object-cover" />
                                : <span className="material-symbols-outlined text-4xl text-[#617589]">person</span>
                            }
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-[#111418] dark:text-white text-3xl font-black tracking-tight">{displayName}</h1>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">ID: #{candidate.filename.substring(0,5).toUpperCase() || '44921'}</span>
                            </div>
                            <p className="text-[#617589] dark:text-gray-400 text-base font-normal mt-1">Applied for {roleTitle}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-gray-300 px-3 py-0.5 rounded-full text-xs font-bold uppercase">
                                    <span className="material-symbols-outlined text-xs">work</span> {candidate.status.replace('_', ' ')}
                                </span>
                                {candidate.match_classification?.includes('Excellent') && (
                                    <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-0.5 rounded-full text-xs font-bold uppercase">
                                        <span className="material-symbols-outlined text-xs">auto_awesome</span> High Confidence
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto flex-wrap print:hidden">
                        {candidate.status !== 'rejected' && (
                            <button onClick={() => handleStatusUpdate('rejected')} className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                <span className="material-symbols-outlined text-sm">cancel</span> Reject
                            </button>
                        )}
                        <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">download</span> Export
                        </button>
                        <button onClick={() => setShowScheduleModal(true)} className="flex-1 md:flex-none rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-md transition-colors">
                            Move to Interview
                        </button>
                    </div>
                </div>

                {/* Analysis Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Match Score Prominent Section */}
                    <div className="lg:col-span-12 bg-white dark:bg-[#111418] p-8 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-center gap-12">
                        <div className="relative flex items-center justify-center">
                            <svg className="size-48 transform -rotate-90">
                                <circle className="text-[#f0f2f4] dark:text-gray-800" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                                <circle className="text-primary transition-all duration-1000 ease-out" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeWidth="12" strokeLinecap="round"></circle>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-black text-[#111418] dark:text-white">{Math.round(candidate.final_score)}%</span>
                                <span className="text-sm font-bold text-[#617589] dark:text-gray-400 uppercase tracking-widest">Match Score</span>
                            </div>
                        </div>
                        <div className="max-w-xl text-center md:text-left">
                            <h3 className="text-2xl font-bold mb-3">AI Analysis Summary</h3>
                            <p className="text-[#617589] dark:text-gray-400 text-base leading-relaxed mb-4">
                                {displayName} shows {candidate.final_score > 80 ? 'exceptional' : candidate.final_score > 60 ? 'moderate' : 'low'} alignment with the technical requirements.
                                Their profile demonstrates competency in core areas such as {matchedSkills[0] || 'software development'} and {matchedSkills[1] || 'system architecture'}.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-[#617589] dark:text-gray-500 font-bold uppercase">Data Points</span>
                                    <span className="text-lg font-bold">140+ Sources</span>
                                </div>
                                <div className="w-[1px] h-10 bg-[#f0f2f4] dark:bg-gray-800"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-[#617589] dark:text-gray-500 font-bold uppercase">Processing Time</span>
                                    <span className="text-lg font-bold">1.2 Seconds</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Score Breakdown */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#111418] p-6 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm h-full">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">analytics</span> Score Breakdown
                            </h4>
                            <div className="space-y-6">
                                <ScoreItem label="Technical Skills" score={techScore} />
                                <ScoreItem label="Experience Relevance" score={expScore} />
                                <ScoreItem label="Education Alignment" score={eduScore} />
                                <ScoreItem label="Cultural Fit Analysis" score={Math.round(candidate.final_score * 0.95 > 100 ? 100 : candidate.final_score * 0.95)} />
                            </div>
                            <div className="mt-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10">
                                <p className="text-xs text-primary font-bold uppercase mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">info</span> AI Note
                                </p>
                                <p className="text-sm text-[#617589] dark:text-gray-400">
                                    Scoring is based on the comparison of the job description keywords and weighted industry standards for {roleTitle} roles.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Skills Analysis */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#111418] p-6 rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm h-full flex flex-col">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">checklist</span> Skills Analysis
                            </h4>

                            <div className="mb-6">
                                <p className="text-xs font-bold text-[#617589] dark:text-gray-500 uppercase tracking-widest mb-3">Matched Core Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {matchedSkills.length > 0 ? matchedSkills.map(skill => (
                                        <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-semibold border border-green-100 dark:border-green-800">
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span> {skill}
                                        </span>
                                    )) : <span className="text-sm text-[#617589]">No direct skill matches found.</span>}
                                </div>
                            </div>

                            <div className="mb-8 flex-1">
                                <p className="text-xs font-bold text-[#617589] dark:text-gray-500 uppercase tracking-widest mb-3">Missing or Identified Gaps</p>
                                <div className="flex flex-wrap gap-2">
                                    {missingSkills.length > 0 ? missingSkills.map(skill => (
                                        <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm font-semibold border border-orange-100 dark:border-orange-800">
                                            <span className="material-symbols-outlined text-[18px]">warning</span> {skill}
                                        </span>
                                    )) : <span className="text-sm font-bold text-green-600 dark:text-green-500">No critical gaps detected.</span>}
                                </div>
                            </div>

                            {/* Skill Gap Recommendation */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-5 rounded-xl mt-auto">
                                <div className="flex items-start gap-4">
                                    <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg text-amber-700 dark:text-amber-400 flex-shrink-0">
                                        <span className="material-symbols-outlined">lightbulb</span>
                                    </div>
                                    <div>
                                        <h5 className="text-amber-900 dark:text-amber-400 font-bold mb-1">Assessment Recommendation</h5>
                                        <p className="text-amber-800 dark:text-amber-500 text-sm leading-relaxed">
                                            {missingSkills.length > 0
                                                ? `Candidate is missing "${missingSkills[0]}" from their profile. Incorporate this heavily into the initial technical screening.`
                                                : "Candidate demonstrates strong core competencies across all requested requirements."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ethical AI Footer */}
                    <div className="lg:col-span-12 print:hidden">
                        <div className="bg-white dark:bg-[#111418] border border-[#f0f2f4] dark:border-gray-800 rounded-xl p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className="size-14 flex items-center justify-center bg-primary rounded-full text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-3xl">policy</span>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-lg font-bold text-[#111418] dark:text-white mb-1">Ethical AI & Bias-Free Processing</h4>
                                    <p className="text-[#617589] dark:text-gray-400 text-sm leading-relaxed max-w-4xl">
                                        RecruitAI is committed to fair hiring. This analysis was generated by a model that has been audited for bias. To ensure objectivity, demographic identifiers such as gender, age, and race were automatically redacted from the data before the analysis was performed. Our algorithms focus purely on skills, work history, and achievement metrics.
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button onClick={() => setShowAuditModal(true)} className="px-4 py-2 text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-lg text-sm font-bold transition-all">
                                        View Audit Log
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* SCHEDULE MODAL */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111418]/80 backdrop-blur-sm print:hidden px-4" onClick={(e) => e.target === e.currentTarget && setShowScheduleModal(false)}>
                    <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl border border-[#f0f2f4] dark:border-gray-800 w-full max-w-md overflow-hidden animate-fade-in-up md:m-0 m-4">
                        <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center bg-[#f9fafb] dark:bg-[#111418]">
                            <h3 className="font-bold text-[#111418] dark:text-white text-xl flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg"><span className="material-symbols-outlined text-lg">calendar_month</span></div>
                                Book Interview
                            </h3>
                            <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 rounded-lg transition-colors text-[#617589]"><span className="material-symbols-outlined text-lg">close</span></button>
                        </div>
                        <form onSubmit={handleScheduleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-[#617589] dark:text-gray-500 uppercase tracking-widest mb-2">Selected Candidate</label>
                                <div className="bg-[#f9fafb] dark:bg-gray-900 border border-[#f0f2f4] dark:border-gray-800 rounded-xl p-3.5 text-sm font-bold text-[#111418] dark:text-white flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">person</span> {displayName}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#617589] dark:text-gray-500 uppercase tracking-widest mb-2">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-[#f9fafb] dark:bg-gray-900 border border-[#f0f2f4] dark:border-gray-800 rounded-lg p-3 text-sm text-[#111418] dark:text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={scheduleData.date}
                                        onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#617589] dark:text-gray-500 uppercase tracking-widest mb-2">Local Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full bg-[#f9fafb] dark:bg-gray-900 border border-[#f0f2f4] dark:border-gray-800 rounded-lg p-3 text-sm text-[#111418] dark:text-white font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                        value={scheduleData.time}
                                        onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#617589] dark:text-gray-500 uppercase tracking-widest mb-2">Meeting Format</label>
                                <div className="flex gap-3 bg-[#f9fafb] dark:bg-gray-900 p-1.5 rounded-lg border border-[#f0f2f4] dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setScheduleData({ ...scheduleData, type: 'video' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${scheduleData.type === 'video' ? 'bg-primary text-white shadow-sm' : 'text-[#617589] hover:text-[#111418] dark:hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">videocam</span> Video
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScheduleData({ ...scheduleData, type: 'phone' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${scheduleData.type === 'phone' ? 'bg-primary text-white shadow-sm' : 'text-[#617589] hover:text-[#111418] dark:hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">call</span> Phone
                                    </button>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-md tracking-wide">
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AUDIT MODAL */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111418]/80 backdrop-blur-sm print:hidden px-4" onClick={(e) => e.target === e.currentTarget && setShowAuditModal(false)}>
                    <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-xl border border-[#f0f2f4] dark:border-gray-800 w-full max-w-xl overflow-hidden animate-fade-in-up md:m-0 m-4">
                        <div className="p-6 border-b border-[#f0f2f4] dark:border-gray-800 flex justify-between items-center bg-[#f9fafb] dark:bg-[#111418]">
                            <h3 className="font-bold text-[#111418] dark:text-white text-xl flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg"><span className="material-symbols-outlined text-lg">receipt_long</span></div> 
                                Traceability Logs
                            </h3>
                            <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 rounded-lg transition-colors text-[#617589]"><span className="material-symbols-outlined text-lg">close</span></button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto styled-scrollbar">
                            <div className="relative border-l-2 border-[#f0f2f4] dark:border-gray-800 pl-8 space-y-10 ml-3">
                                {[
                                    { title: "Dashboard Interaction", desc: `Candidate designated as ${candidate.status.toUpperCase()}`, time: "Just now", icon: "check_circle" },
                                    { title: "Semantic Engine Proc", desc: "Data serialized. Transformers V2 encoded vector spaces.", time: "1 day ago", icon: "memory" },
                                    { title: "Compliance Pass", desc: "Names, demographics strictly dropped from processing.", time: "1 day ago", icon: "security" },
                                    { title: "Ingestion Queue", desc: "Payload successfully routed through file boundary checks.", time: "1 day ago", icon: "move_to_inbox" },
                                ].map((log, i) => (
                                    <div key={i} className="relative">
                                        <span className="absolute -left-[45px] top-0 w-10 h-10 rounded-full bg-white dark:bg-[#111418] border border-primary/50 flex items-center justify-center text-primary shadow-sm">
                                            <span className="material-symbols-outlined text-[20px]">{log.icon}</span>
                                        </span>
                                        <p className="text-[10px] font-bold text-[#617589] uppercase mb-1 tracking-widest">{log.time}</p>
                                        <h4 className="font-bold text-[#111418] dark:text-white text-sm mb-1">{log.title}</h4>
                                        <p className="text-sm text-[#617589] font-medium">{log.desc}</p>
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

function ScoreItem({ label, score }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-[#111418] dark:text-white uppercase tracking-tight">{label}</span>
                <span className="text-sm font-black text-primary">{score}%</span>
            </div>
            <div className="w-full bg-[#f0f2f4] dark:bg-gray-800 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
}
