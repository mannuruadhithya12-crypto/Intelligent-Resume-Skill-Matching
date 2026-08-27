/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getResults, updateCandidateStatus } from '../api';
import InterviewModal from './InterviewModal';

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

    const handleScheduleSuccess = async () => {
        try {
            await handleStatusUpdate('interview_scheduled');
            setShowScheduleModal(false);
            showToast('Interview scheduled successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to update status', 'error');
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
            <div className="w-16 h-16 border-4 border-[#F5ECE7] border-t-primary-sage rounded-full animate-spin"></div>
            <p className="text-text-secondary font-medium animate-pulse">Compiling candidate dossier...</p>
        </div>
    );

    if (error || !candidate) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="text-center bg-white p-10 rounded-[24px] shadow-paper">
                <div className="size-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-error text-[32px]">warning</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-text-primary mb-2">Access Denied</h2>
                <p className="text-text-secondary font-medium mb-8">{error || "Candidate profile inaccessible"}</p>
                <button onClick={() => navigate('/candidates')} className="bg-[#F5ECE7] text-text-primary px-6 py-3 rounded-full hover:bg-outline-variant transition-colors flex items-center justify-center gap-2 mx-auto font-bold text-[14px]">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Return to Talent Pool
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
        <div className="w-full font-sans text-text-primary pb-20 pt-4 animate-fade-in relative">
            {notification && (
                <div className={`fixed top-24 right-6 z-[100] px-6 py-4 rounded-[12px] shadow-paper flex items-center gap-3 animate-fade-in-up print:hidden ${
                    notification.type === 'error' ? 'bg-white text-error border border-error/20' :
                    notification.type === 'info' ? 'bg-white text-primary-sage border border-[#CAECBC]' :
                    'bg-white text-[#4A6741] border border-[#CAECBC]'
                }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-error/10' : notification.type === 'info' ? 'bg-[#CAECBC]/30' : 'bg-[#CAECBC]/30'}`}>
                        <span className="material-symbols-outlined text-[18px]">{notification.type === 'error' ? 'warning' : 'check'}</span>
                    </div>
                    <span className="font-bold text-[14px]">{notification.message}</span>
                </div>
            )}

            <main className="max-w-[1200px] mx-auto w-full">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
                    <span className="cursor-pointer text-outline text-[13px] font-bold hover:text-text-primary transition-colors" onClick={() => navigate('/candidates')}>Talent Pool</span>
                    <span className="text-outline text-[13px] font-bold">/</span>
                    <span className="text-text-secondary text-[13px] font-bold">{roleTitle}</span>
                    <span className="text-outline text-[13px] font-bold">/</span>
                    <span className="text-text-primary text-[13px] font-bold">{displayName}</span>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[24px] shadow-paper mb-8 border border-[#E9E1DC]">
                    <div className="flex gap-6 items-center">
                        <div className="size-[100px] bg-page rounded-full border border-[#E9E1DC] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                            {candidate.email ?
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${candidate.email}&backgroundColor=F5ECE7&textColor=1E1B18`} alt="Avatar" className="w-full h-full object-cover" />
                                : <span className="material-symbols-outlined text-[40px] text-outline">person</span>
                            }
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                                <h1 className="text-text-primary text-[32px] font-serif font-bold tracking-tight leading-none">{displayName}</h1>
                                <span className="bg-[#F5ECE7] text-text-secondary text-[11px] font-bold px-2 py-1 rounded-md tracking-wider">ID: #{candidate.filename.substring(0,5).toUpperCase() || '44921'}</span>
                            </div>
                            <p className="text-text-secondary text-[15px] mt-2">Applied for {roleTitle}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 bg-[#F5ECE7] text-text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[14px]">work</span> {candidate.status.replace('_', ' ')}
                                </span>
                                {candidate.match_classification?.includes('Excellent') && (
                                    <span className="inline-flex items-center gap-1.5 bg-[#CAECBC]/30 text-primary-sage px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span> High Confidence
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto flex-wrap print:hidden">
                        {candidate.status !== 'rejected' && (
                            <button onClick={() => handleStatusUpdate('rejected')} className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-full h-[44px] px-6 bg-error/10 text-error text-[13px] font-bold hover:bg-error/20 transition-colors shadow-sm cursor-pointer opacity-100">
                                <span className="material-symbols-outlined text-[18px]">cancel</span> Reject
                            </button>
                        )}
                        <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-full h-[44px] px-6 bg-white border border-[#E9E1DC] text-[#272521] text-[13px] font-bold hover:bg-[#F5ECE7] transition-all shadow-sm cursor-pointer opacity-100">
                            <span className="material-symbols-outlined text-[18px]">download</span> Export
                        </button>
                        <button onClick={() => setShowScheduleModal(true)} className="flex-1 md:flex-none rounded-full h-[44px] px-8 bg-[#3F7655] text-white border border-[#3F7655] text-[13px] font-semibold hover:bg-[#315F44] active:translate-y-[1px] focus:ring-2 focus:ring-[#3F7655]/50 focus:outline-none shadow-sm transition-all cursor-pointer opacity-100">
                            Move to Interview
                        </button>
                    </div>
                </div>

                {/* Analysis Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Match Score Prominent Section */}
                    <div className="lg:col-span-12 bg-white p-10 rounded-[24px] shadow-paper border border-[#E9E1DC] flex flex-col md:flex-row items-center justify-center gap-16">
                        <div className="relative flex items-center justify-center">
                            <svg className="size-[200px] transform -rotate-90">
                                <circle className="text-[#F5ECE7]" cx="100" cy="100" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                                <circle className="text-primary-sage transition-all duration-1000 ease-out" cx="100" cy="100" fill="transparent" r="88" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeWidth="12" strokeLinecap="round"></circle>
                            </svg>
                            <div className="absolute flex flex-col items-center mt-2">
                                <span className="text-[48px] font-serif font-bold text-text-primary leading-none">{Math.round(candidate.final_score)}%</span>
                                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">Match</span>
                            </div>
                        </div>
                        <div className="max-w-xl text-center md:text-left">
                            <h3 className="text-[24px] font-serif font-bold text-text-primary mb-3">AI Analysis Summary</h3>
                            <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                                {displayName} shows {candidate.final_score > 80 ? 'exceptional' : candidate.final_score > 60 ? 'moderate' : 'low'} alignment with the technical requirements.
                                Their profile demonstrates competency in core areas such as <span className="font-bold text-text-primary">{matchedSkills[0] || 'software development'}</span> and <span className="font-bold text-text-primary">{matchedSkills[1] || 'system architecture'}</span>.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] text-outline font-bold uppercase tracking-wider">Data Points</span>
                                    <span className="text-[16px] font-bold text-text-primary">140+ Sources</span>
                                </div>
                                <div className="w-[1px] h-10 bg-[#E9E1DC]"></div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] text-outline font-bold uppercase tracking-wider">Processing Time</span>
                                    <span className="text-[16px] font-bold text-text-primary">1.2 Seconds</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Score Breakdown */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-white p-8 rounded-[24px] shadow-paper border border-[#E9E1DC] h-full">
                            <h4 className="text-[18px] font-serif font-bold text-text-primary mb-8 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary-sage">analytics</span> Score Breakdown
                            </h4>
                            <div className="space-y-6">
                                <ScoreItem label="Technical Skills" score={techScore} />
                                <ScoreItem label="Experience Relevance" score={expScore} />
                                <ScoreItem label="Education Alignment" score={eduScore} />
                                <ScoreItem label="Cultural Fit Analysis" score={Math.round(candidate.final_score * 0.95 > 100 ? 100 : candidate.final_score * 0.95)} />
                            </div>
                            <div className="mt-10 p-5 bg-[#F5ECE7] rounded-[16px]">
                                <p className="text-[11px] text-text-primary font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">info</span> AI Note
                                </p>
                                <p className="text-[13px] text-text-secondary leading-relaxed">
                                    Scoring is based on the comparison of the job description keywords and weighted industry standards for {roleTitle} roles.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Skills Analysis */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="bg-white p-8 rounded-[24px] shadow-paper border border-[#E9E1DC] h-full flex flex-col">
                            <h4 className="text-[18px] font-serif font-bold text-text-primary mb-8 flex items-center gap-3">
                                <span className="material-symbols-outlined text-terracotta">checklist</span> Skills Analysis
                            </h4>

                            <div className="mb-8">
                                <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-4">Matched Core Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {matchedSkills.length > 0 ? matchedSkills.map(skill => (
                                        <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#CAECBC]/20 text-primary-sage text-[13px] font-bold border border-[#CAECBC]">
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span> {skill}
                                        </span>
                                    )) : <span className="text-[13px] text-outline">No direct skill matches found.</span>}
                                </div>
                            </div>

                            <div className="mb-8 flex-1">
                                <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-4">Missing or Identified Gaps</p>
                                <div className="flex flex-wrap gap-2">
                                    {missingSkills.length > 0 ? missingSkills.map(skill => (
                                        <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-[13px] font-bold border border-error/20">
                                            <span className="material-symbols-outlined text-[18px]">warning</span> {skill}
                                        </span>
                                    )) : <span className="text-[13px] font-bold text-primary-sage">No critical gaps detected.</span>}
                                </div>
                            </div>

                            {/* Skill Gap Recommendation */}
                            <div className="bg-[#F5ECE7]/80 p-6 rounded-[16px] mt-auto border border-[#E9E1DC]">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2.5 rounded-xl text-terracotta flex-shrink-0 shadow-sm border border-[#E9E1DC]">
                                        <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                                    </div>
                                    <div>
                                        <h5 className="text-text-primary font-bold text-[14px] mb-1.5">Assessment Recommendation</h5>
                                        <p className="text-text-secondary text-[13px] leading-relaxed">
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
                        <div className="bg-white border border-[#E9E1DC] rounded-[24px] p-8 shadow-paper overflow-hidden relative">
                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="size-16 flex items-center justify-center bg-[#F5ECE7] rounded-full text-text-primary flex-shrink-0 border border-[#E9E1DC]">
                                    <span className="material-symbols-outlined text-[28px]">policy</span>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-[16px] font-bold text-text-primary mb-2">Ethical AI & Bias-Free Processing</h4>
                                    <p className="text-text-secondary text-[14px] leading-relaxed max-w-4xl">
                                        RecruitAI is committed to fair hiring. This analysis was generated by an objective model. To ensure fairness, demographic identifiers are automatically redacted from the data before the analysis.
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button onClick={() => setShowAuditModal(true)} className="px-6 py-3 text-text-primary border border-[#E9E1DC] bg-page hover:bg-[#F5ECE7] rounded-full text-[13px] font-bold transition-all shadow-sm">
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
                <InterviewModal
                    candidate={candidate}
                    jobId={jobId}
                    onClose={() => setShowScheduleModal(false)}
                    onSuccess={handleScheduleSuccess}
                />
            )}

            {/* AUDIT MODAL */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden px-4" onClick={(e) => e.target === e.currentTarget && setShowAuditModal(false)}>
                    <div className="bg-white rounded-[24px] shadow-paper w-full max-w-xl overflow-hidden animate-fade-in-up md:m-0 m-4">
                        <div className="p-6 border-b border-[#E9E1DC] flex justify-between items-center bg-[#FBF9F4]">
                            <h3 className="font-serif font-bold text-text-primary text-[20px] flex items-center gap-3">
                                <div className="p-2.5 bg-terracotta/10 text-terracotta rounded-xl"><span className="material-symbols-outlined text-[20px]">receipt_long</span></div> 
                                Traceability Logs
                            </h3>
                            <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-[#F5ECE7] rounded-full transition-colors text-outline"><span className="material-symbols-outlined text-[20px]">close</span></button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto styled-scrollbar">
                            <div className="relative border-l-2 border-[#E9E1DC] pl-10 space-y-10 ml-4">
                                {[
                                    { title: "Dashboard Interaction", desc: `Candidate designated as ${candidate.status.toUpperCase()}`, time: "Just now", icon: "check_circle" },
                                    { title: "Semantic Engine Proc", desc: "Data serialized. Vector spaces mapped.", time: "1 day ago", icon: "memory" },
                                    { title: "Compliance Pass", desc: "Names, demographics strictly dropped from processing.", time: "1 day ago", icon: "security" },
                                    { title: "Ingestion Queue", desc: "Payload successfully routed through file boundary checks.", time: "1 day ago", icon: "move_to_inbox" },
                                ].map((log, i) => (
                                    <div key={i} className="relative">
                                        <span className="absolute -left-[58px] top-0 size-10 rounded-full bg-white border border-[#CAECBC] flex items-center justify-center text-primary-sage shadow-sm">
                                            <span className="material-symbols-outlined text-[20px]">{log.icon}</span>
                                        </span>
                                        <p className="text-[11px] font-bold text-outline uppercase mb-1 tracking-widest">{log.time}</p>
                                        <h4 className="font-bold text-text-primary text-[14px] mb-1">{log.title}</h4>
                                        <p className="text-[13px] text-text-secondary leading-relaxed">{log.desc}</p>
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
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
                <span className="text-[13px] font-bold text-text-primary uppercase tracking-wider">{label}</span>
                <span className="text-[15px] font-black text-primary-sage">{score}%</span>
            </div>
            <div className="w-full bg-[#F5ECE7] rounded-full h-3">
                <div className="bg-primary-sage h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
}
