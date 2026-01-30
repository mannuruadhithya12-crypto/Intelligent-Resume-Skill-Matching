import React from 'react';
import { FiCpu, FiClock } from 'react-icons/fi';

const RunEngineCard = ({ onClick, loading }) => {
    return (
        <div className="bg-bg-card p-10 rounded-2xl text-center border border-border-subtle shadow-xl shadow-indigo-500/5 mt-8 flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent opacity-20 group-hover:opacity-40 transition-opacity"></div>

            <button
                onClick={onClick}
                disabled={loading}
                className={`relative z-10 px-12 py-5 bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] hover:from-[#4338CA] hover:to-[#2563EB] text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto flex items-center justify-center gap-3
          ${loading ? 'opacity-90 cursor-wait' : ''}`}
            >
                {loading ? (
                    <>
                        <FiCpu className="animate-spin text-lg" />
                        <span>Generating Report...</span>
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        <span>Run AI Matching Engine</span>
                    </>
                )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-5 opacity-60">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Estimated time: ~12 seconds
                </p>
            </div>
        </div>
    );
};

export default RunEngineCard;
