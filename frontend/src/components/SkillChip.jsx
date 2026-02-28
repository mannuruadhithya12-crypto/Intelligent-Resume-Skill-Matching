import React from 'react';

export default function SkillChip({ skill, type = 'match' }) {
    const isMatch = type === 'match';

    return (
        <span
            className={`
                px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm
                ${isMatch
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50 hover:shadow-emerald-500/20'
                    : 'bg-amber-900/30 text-amber-400 border-amber-800/50 hover:bg-amber-900/50 hover:shadow-amber-500/20'
                }
            `}
        >
            {isMatch ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )}
            {skill}
        </span>
    );
}
