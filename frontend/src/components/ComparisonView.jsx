import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

export default function ComparisonView({ candidates, onClose }) {
    // Body scroll lock
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!candidates || candidates.length === 0) return null;

    const maxScore = Math.max(...candidates.map(c => c.final_score || 0));

    // Handle missing/empty arrays safely
    const getSkills = (c) => c.matched_skills || [];
    const getGaps = (c) => c.missing_skills || [];

    const modalContent = (
        <div 
            className="fixed inset-0 z-[100] bg-[#181D1A]/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-[#FFFDF9] border border-[#E5DED4] w-full max-w-[1320px] rounded-[20px] shadow-[0_24px_80px_rgba(30,27,24,0.22)] flex flex-col overflow-hidden relative z-[110]"
                style={{ width: 'min(1280px, calc(100vw - 64px))', height: 'min(820px, calc(100vh - 64px))' }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="comparison-title"
            >
                {/* Header */}
                <div className="flex-shrink-0 h-[88px] lg:h-[100px] px-8 py-6 border-b border-[#E6E0D8] bg-[#FFFDF9] flex justify-between items-center z-[120]">
                    <div>
                        <h2 id="comparison-title" className="text-[28px] lg:text-[32px] font-serif font-semibold text-[#211F1B] leading-tight">
                            Candidate Comparison
                        </h2>
                        <p className="text-[14px] lg:text-[15px] text-[#706B63] mt-1">
                            Compare selected candidates side-by-side
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close comparison"
                        className="w-[40px] h-[40px] flex items-center justify-center rounded-xl bg-transparent hover:bg-[#F2EEE7] active:scale-95 transition-all text-[#211F1B] focus:outline-none focus:ring-2 focus:ring-[#3F7655]/50"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-[#FFFDF9] scrollbar-thin scrollbar-thumb-[#D9D2C8] scrollbar-track-transparent">
                    <div className="min-w-[800px]">
                        {/* Grid Structure */}
                        <div className="grid" style={{ gridTemplateColumns: `220px repeat(${candidates.length}, minmax(0, 1fr))` }}>
                            
                            {/* Candidate Headers */}
                            <div className="p-6 border-b border-[#ECE7E0] bg-[#FFFDF9]">
                                {/* Empty top-left cell */}
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="p-6 border-b border-l border-[#ECE7E0] bg-[#F3EEE7] flex flex-col items-center text-center relative">
                                    {c.final_score === maxScore && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8F1DC] text-[#356047] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-[#C9DEC2] shadow-sm whitespace-nowrap">
                                            ★ Top Match
                                        </div>
                                    )}
                                    <div className="w-[64px] h-[64px] rounded-full bg-white mb-4 shadow-sm overflow-hidden p-1 border border-[#E4DED5]">
                                        <img
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.filename}`}
                                            alt={c.filename}
                                            className="w-full h-full rounded-full object-cover bg-[#F7F3EC]"
                                        />
                                    </div>
                                    <h4 className="font-semibold text-[18px] lg:text-[20px] text-[#211F1B] w-full truncate px-2" title={c.filename}>
                                        {c.filename.replace(/_/g, ' ').replace(/\.[^/.]+$/, "")}
                                    </h4>
                                    <p className="text-[14px] text-[#706B63] mt-1">{c.current_role || 'Candidate'}</p>
                                    <p className="text-[12px] text-[#706B63] uppercase tracking-[0.08em] mt-2 font-medium">#{Math.random().toString(36).substring(2, 8)}</p>
                                </div>
                            ))}

                            {/* Match Score */}
                            <div className="px-6 py-6 border-b border-[#ECE7E0] flex items-center">
                                <span className="text-[13px] font-bold text-[#706B63] uppercase tracking-[0.08em]">Match Score</span>
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="px-6 py-8 border-b border-l border-[#ECE7E0] flex flex-col justify-center items-center">
                                    <div className="text-[36px] lg:text-[42px] font-bold text-[#211F1B] font-serif leading-none mb-3">
                                        {Math.round(c.final_score || 0)}%
                                    </div>
                                    <div className="w-full max-w-[160px] h-[8px] bg-[#E9E4DC] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#3F7655] rounded-full" style={{ width: `${Math.min(Math.max(c.final_score || 0, 0), 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            {/* Experience */}
                            <div className="px-6 py-6 border-b border-[#ECE7E0] flex items-center">
                                <span className="text-[13px] font-bold text-[#706B63] uppercase tracking-[0.08em]">Experience</span>
                            </div>
                            {candidates.map((c, i) => (
                                <div key={i} className="px-6 py-6 border-b border-l border-[#ECE7E0] flex items-center">
                                    <span className={`text-[15px] ${c.experience_years ? 'text-[#211F1B]' : 'text-[#706B63]'}`}>
                                        {c.experience_years ? `${c.experience_years} Years` : 'Not specified'}
                                    </span>
                                </div>
                            ))}

                            {/* Skills */}
                            <div className="px-6 py-6 border-b border-[#ECE7E0] flex items-start pt-8">
                                <span className="text-[13px] font-bold text-[#706B63] uppercase tracking-[0.08em]">Matched Skills</span>
                            </div>
                            {candidates.map((c, i) => {
                                const skills = getSkills(c);
                                return (
                                    <div key={i} className="px-6 py-6 border-b border-l border-[#ECE7E0] flex flex-wrap gap-2 content-start">
                                        {skills.length > 0 ? (
                                            skills.map((skill, idx) => (
                                                <span key={idx} className="px-2.5 py-1.5 bg-[#EDF5E5] text-[#315C43] text-[12px] font-semibold rounded-full border border-[#C9DEC2]">
                                                    ✓ {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[#706B63] text-[14px]">No specific skills matched</span>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Gaps */}
                            <div className="px-6 py-6 border-b border-[#ECE7E0] flex items-start pt-8">
                                <span className="text-[13px] font-bold text-[#706B63] uppercase tracking-[0.08em]">Skill Gaps</span>
                            </div>
                            {candidates.map((c, i) => {
                                const gaps = getGaps(c);
                                return (
                                    <div key={i} className="px-6 py-6 border-b border-l border-[#ECE7E0] flex flex-wrap gap-2 content-start">
                                        {gaps.length > 0 ? (
                                            gaps.map((skill, idx) => (
                                                <span key={idx} className="px-2.5 py-1.5 bg-[#F8ECE7] text-[#8B5145] text-[12px] font-medium rounded-full border border-[#E7C9BE]">
                                                    − {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[#3F7655] text-[14px] font-medium flex items-center gap-1.5">
                                                ✓ Strong match profile
                                            </span>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Recommendation */}
                            <div className="px-6 py-6 border-b border-[#ECE7E0] flex items-center">
                                <span className="text-[13px] font-bold text-[#706B63] uppercase tracking-[0.08em]">Recommendation</span>
                            </div>
                            {candidates.map((c, i) => {
                                const isTop = c.final_score === maxScore;
                                return (
                                    <div key={i} className="px-6 py-6 border-b border-l border-[#ECE7E0] flex items-center">
                                        <span className={`text-[15px] font-medium ${isTop ? 'text-[#3F7655]' : 'text-[#706B63]'}`}>
                                            {isTop ? 'Recommended' : 'Good Match'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 h-[72px] lg:h-[80px] px-8 bg-[#FFFDF9] border-t border-[#E6E0D8] flex items-center justify-end z-[120]">
                    <button 
                        onClick={onClose} 
                        className="h-[44px] px-5 bg-white border border-[#D9D2C8] text-[#24221E] text-[14px] font-semibold rounded-xl hover:bg-[#F3EFE8] active:translate-y-[1px] transition-all"
                    >
                        Close Comparison
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
