import React, { useEffect, useState } from 'react';

export default function ScoreCircle({ score, size = 160, strokeWidth = 14 }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (circumference * animatedScore) / 100;

    useEffect(() => {
        // Animate from 0 to actual score on mount
        const timer = setTimeout(() => {
            setAnimatedScore(score);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    // Color logic based on rank
    const getColorClass = () => {
        if (animatedScore >= 90) return 'text-emerald-500';
        if (animatedScore >= 70) return 'text-blue-500';
        if (animatedScore >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getGlowClass = () => {
        if (animatedScore >= 90) return 'drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]';
        if (animatedScore >= 70) return 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]';
        if (animatedScore >= 50) return 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]';
        return 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    };

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90 transform">
                {/* Background Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    className="text-white/10"
                    stroke="currentColor"
                    fill="none"
                />
                {/* Animated Score Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    className={`${getColorClass()} ${getGlowClass()} transition-all duration-1000 ease-out`}
                    stroke="currentColor"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in delay-200">
                <span className="text-4xl font-black text-white">{Math.round(animatedScore)}%</span>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-1 text-center px-2">Match<br />Score</span>
            </div>
        </div>
    );
}
