import React from 'react';
import { FiCpu, FiClock } from 'react-icons/fi';

const AnalyzeButton = ({ onClick, disabled, uploading }) => {
    return (
        <div className="bg-[#151A23] border border-[#272E3B] rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/5">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`btn-gradient max-w-md ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale' : 'animate-pulse-slow'}`}
            >
                {uploading ? (
                    <span className="flex items-center gap-3">
                        <FiCpu className="animate-spin text-xl" />
                        <span>Processing Analysis...</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-3">
                        <FiCpu className="text-xl" />
                        <span>Run AI Matching Engine</span>
                    </span>
                )}
            </button>
            <div className="flex items-center gap-4 mt-4 opacity-60">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium flex items-center gap-1">
                    <FiClock /> Est. Time: ~12s
                </p>
                <div className="h-1 w-1 bg-slate-600 rounded-full"></div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium text-emerald-500">
                    System Ready
                </p>
            </div>
        </div>
    );
};

export default AnalyzeButton;
