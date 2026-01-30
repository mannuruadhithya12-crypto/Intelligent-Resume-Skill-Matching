import React from 'react';
import { FiX, FiCheck, FiMinus, FiAward, FiBriefcase, FiAlertCircle } from 'react-icons/fi';

export default function ComparisonView({ candidates, onClose }) {
    if (!candidates || candidates.length === 0) return null;

    // Get the winner for scoring
    const maxScore = Math.max(...candidates.map(c => c.final_score));

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-bg-card w-full max-w-[98vw] h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-border-subtle overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-border-subtle flex justify-between items-center bg-slate-50/50 dark:bg-bg-deep/50">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Candidate Comparison</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Analyzing {candidates.length} profiles side-by-side</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white dark:bg-bg-card border border-slate-200 dark:border-border-subtle rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm text-slate-500 dark:text-white group"
                    >
                        <FiX size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className="min-w-fit">
                        <div className="grid" style={{ gridTemplateColumns: `280px repeat(${candidates.length}, minmax(320px, 1fr))` }}>

                            {/* 1. Header Row (Avatars) */}
                            <div className="p-6 flex flex-col justify-end border-b border-slate-100 dark:border-border-subtle bg-slate-50/30 dark:bg-bg-deep/30">
                                <span className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">PROFILES</span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Candidates</h3>
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className={`p-6 border-b border-l border-slate-100 dark:border-border-subtle flex flex-col items-center text-center relative ${c.final_score === maxScore ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}>
                                    {c.final_score === maxScore && (
                                        <div className="absolute top-0 mt-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider border border-yellow-300 z-10">
                                            <FiAward size={12} /> Top Match
                                        </div>
                                    )}
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-bg-deep mb-4 shadow-sm overflow-hidden p-1 border border-slate-200 dark:border-border-subtle">
                                        <img
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.filename}`}
                                            alt={c.filename}
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                    </div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white w-full truncate px-4" title={c.filename}>
                                        {c.filename.replace(/_/g, ' ').replace(/\.[^/.]+$/, "")}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{c.email || 'Candidate via Upload'}</p>
                                </div>
                            ))}

                            {/* 2. Match Score */}
                            <div className="p-6 border-b border-slate-100 dark:border-border-subtle font-bold text-slate-500 dark:text-slate-400 flex items-center">
                                Match Score
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="p-6 border-b border-l border-slate-100 dark:border-border-subtle flex flex-col justify-center">
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className={`text-4xl font-black ${c.final_score >= 80 ? 'text-blue-600 dark:text-blue-400' : c.final_score >= 60 ? 'text-slate-700 dark:text-slate-300' : 'text-amber-500'}`}>
                                            {Math.round(c.final_score)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-bg-deep rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${c.final_score >= 80 ? 'bg-blue-600' : c.final_score >= 60 ? 'bg-slate-600' : 'bg-amber-500'}`} style={{ width: `${c.final_score}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            {/* 3. Experience */}
                            <div className="p-6 border-b border-slate-100 dark:border-border-subtle font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <FiBriefcase /> Experience
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="p-6 border-b border-l border-slate-100 dark:border-border-subtle hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <p className={`font-bold text-lg ${c.experience_years ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                                        {c.experience_years ? (
                                            <>
                                                <span className="text-2xl text-blue-600 dark:text-blue-400 mr-1">{c.experience_years}</span> <span className="text-sm uppercase text-slate-500 dark:text-slate-400">Years</span>
                                            </>
                                        ) : 'Not specified'}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        {c.experience_summary || "See full analysis for detailed work history."}
                                    </p>
                                </div>
                            ))}

                            {/* 4. Skills Match */}
                            <div className="p-6 border-b border-slate-100 dark:border-border-subtle font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <FiCheck className="text-emerald-500" /> Matched Skills
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="p-6 border-b border-l border-slate-100 dark:border-border-subtle hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex flex-wrap gap-2">
                                        {c.matched_skills && c.matched_skills.length > 0 ? (
                                            c.matched_skills.map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-lg border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wide shadow-sm">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">No specific skills matched</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* 5. Gaps / Missing */}
                            <div className="p-6 border-b border-slate-100 dark:border-border-subtle font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <FiAlertCircle className="text-amber-500" /> Potential Gaps
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="p-6 border-b border-l border-slate-100 dark:border-border-subtle bg-slate-50/30 dark:bg-black/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex flex-wrap gap-2">
                                        {c.missing_skills && c.missing_skills.length > 0 ? (
                                            c.missing_skills.slice(0, 5).map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg border border-red-200 dark:border-red-500/30 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                <FiCheck /> Strong match profile
                                            </span>
                                        )}
                                        {c.missing_skills && c.missing_skills.length > 5 && (
                                            <span className="text-xs text-slate-400 pt-1 font-bold">+{c.missing_skills.length - 5} more</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-border-subtle bg-white dark:bg-bg-card flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-bg-deep font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                        Close Comparison
                    </button>
                </div>
            </div>
        </div>
    );
}
