import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUser, FiMoreVertical, FiSearch, FiFilter, FiLoader, FiPlus,
    FiStar, FiTrendingUp, FiAward, FiCpu, FiCalendar, FiMail,
    FiMapPin, FiCheckCircle, FiXCircle, FiClock, FiGrid, FiList
} from 'react-icons/fi';
import { getHistory, getResults } from '../api';

const CandidatesList = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'excellent', 'good', 'moderate'
    const [sortBy, setSortBy] = useState('score'); // 'score', 'name', 'date'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const history = await getHistory();
                if (history && history.length > 0) {
                    const promises = history.map(async (job) => {
                        try {
                            const res = await getResults(job.job_id);
                            return res.candidates ? res.candidates.map(c => ({
                                ...c,
                                job_id: job.job_id,
                                analyzed_date: job.timestamp
                            })) : [];
                        } catch (e) {
                            console.warn(`Failed to load results for job ${job.job_id}`, e);
                            return [];
                        }
                    });

                    const resultsArrays = await Promise.all(promises);
                    const allCandidates = resultsArrays.flat();
                    setCandidates(allCandidates);
                }
            } catch (err) {
                console.error("Failed to fetch candidates:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter and sort candidates
    const processedCandidates = candidates
        .filter(c => {
            const matchesSearch = c.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (Array.isArray(c.recommended_roles) && c.recommended_roles.some(r => r.toLowerCase().includes(searchTerm.toLowerCase())));

            if (!matchesSearch) return false;

            if (filterStatus === 'all') return true;
            if (filterStatus === 'excellent') return c.match_classification === 'Excellent Fit';
            if (filterStatus === 'good') return c.match_classification === 'Good Fit';
            if (filterStatus === 'moderate') return c.match_classification === 'Moderate Fit';
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'score') return (b.final_score || 0) - (a.final_score || 0);
            if (sortBy === 'name') return a.filename.localeCompare(b.filename);
            if (sortBy === 'date') return new Date(b.analyzed_date || 0) - new Date(a.analyzed_date || 0);
            return 0;
        });

    const stats = {
        total: candidates.length,
        excellent: candidates.filter(c => c.match_classification === 'Excellent Fit').length,
        good: candidates.filter(c => c.match_classification === 'Good Fit').length,
        avgScore: candidates.length > 0 ? (candidates.reduce((sum, c) => sum + (c.final_score || 0), 0) / candidates.length).toFixed(1) : 0
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-bg-card to-secondary/10 rounded-2xl border border-border-subtle p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <FiUser className="text-primary-glow" size={28} />
                                </div>
                                Candidate Pool
                            </h1>
                            <p className="text-slate-400 text-sm">
                                {loading ? 'Loading candidates...' : `Managing ${stats.total} candidates across all analyses`}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <FiPlus /> New Analysis
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <StatCard icon={<FiUser />} label="Total" value={stats.total} color="blue" />
                        <StatCard icon={<FiStar />} label="Excellent" value={stats.excellent} color="emerald" />
                        <StatCard icon={<FiTrendingUp />} label="Good Fit" value={stats.good} color="indigo" />
                        <StatCard icon={<FiAward />} label="Avg Score" value={`${stats.avgScore}%`} color="purple" />
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="glass-panel rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, role, or skills..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-deep/50 border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <FilterButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="All" />
                        <FilterButton active={filterStatus === 'excellent'} onClick={() => setFilterStatus('excellent')} label="Excellent" color="emerald" />
                        <FilterButton active={filterStatus === 'good'} onClick={() => setFilterStatus('good')} label="Good" color="blue" />
                        <FilterButton active={filterStatus === 'moderate'} onClick={() => setFilterStatus('moderate')} label="Moderate" color="amber" />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2 bg-bg-deep/50 p-1 rounded-lg border border-border-subtle">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <FiGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <FiList size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 glass-panel rounded-2xl">
                    <FiLoader className="animate-spin text-primary text-4xl mb-4" />
                    <p className="text-slate-400">Loading candidates...</p>
                </div>
            ) : processedCandidates.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl border-dashed">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUser className="text-3xl text-primary" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">No candidates found</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your filters or search term.'
                            : 'Upload resumes to start building your candidate pool.'}
                    </p>
                    <button
                        onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                        className="text-primary hover:text-primary-glow font-medium text-sm"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {processedCandidates.map((c, idx) => (
                        viewMode === 'grid' ? (
                            <CandidateCard key={idx} candidate={c} navigate={navigate} />
                        ) : (
                            <CandidateListItem key={idx} candidate={c} navigate={navigate} />
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper Components
const StatCard = ({ icon, label, value, color = 'blue' }) => {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
        emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
        indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400',
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-sm border rounded-xl p-4`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 bg-white/10 rounded-lg ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{label}</p>
                    <p className="text-2xl font-black text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

const FilterButton = ({ active, onClick, label, color = 'primary' }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${active
            ? `bg-${color} text-white shadow-lg shadow-${color}/30`
            : 'bg-bg-deep/50 text-slate-400 hover:text-white border border-border-subtle hover:border-primary/50'
            }`}
    >
        {label}
    </button>
);

const CandidateCard = ({ candidate, navigate }) => {
    const cleanName = candidate.filename.replace(/\.(pdf|docx?)$/i, '').replace(/_/g, ' ');
    const scoreColor = candidate.final_score >= 80 ? 'emerald' : candidate.final_score >= 60 ? 'blue' : 'amber';

    return (
        <div
            onClick={() => navigate(`/analysis/${candidate.job_id}/${encodeURIComponent(candidate.filename)}`)}
            className="group glass-panel rounded-2xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                        <FiUser className="text-primary-glow" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{cleanName}</h3>
                        <p className="text-xs text-slate-400">
                            {Array.isArray(candidate.recommended_roles?.[0])
                                ? candidate.recommended_roles[0][0]
                                : candidate.recommended_roles?.[0] || 'Applicant'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Score Circle */}
            <div className="flex justify-center my-6">
                <div className="relative size-24">
                    <svg className="size-full -rotate-90">
                        <circle cx="48" cy="48" r="40" strokeWidth="8" className="text-slate-700" stroke="currentColor" fill="none" />
                        <circle
                            cx="48" cy="48" r="40"
                            strokeWidth="8"
                            className={`text-${scoreColor}-500`}
                            stroke="currentColor"
                            fill="none"
                            strokeDasharray="251"
                            strokeDashoffset={251 - (251 * (candidate.final_score || 0)) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-black text-${scoreColor}-400`}>{Math.round(candidate.final_score || 0)}%</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Match</span>
                    </div>
                </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {candidate.matched_skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-primary/10 text-primary-glow text-xs rounded-lg border border-primary/20 font-medium">
                        {skill}
                    </span>
                ))}
                {candidate.matched_skills?.length > 3 && (
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg font-medium">
                        +{candidate.matched_skills.length - 3}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${candidate.match_classification === 'Excellent Fit' ? 'bg-emerald-500/20 text-emerald-400' :
                    candidate.match_classification === 'Good Fit' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                    }`}>
                    {candidate.match_classification || 'Processed'}
                </span>
                <FiCpu className="text-slate-500 group-hover:text-primary transition-colors" />
            </div>
        </div>
    );
};

const CandidateListItem = ({ candidate, navigate }) => {
    const cleanName = candidate.filename.replace(/\.(pdf|docx?)$/i, '').replace(/_/g, ' ');

    return (
        <div
            onClick={() => navigate(`/analysis/${candidate.job_id}/${encodeURIComponent(candidate.filename)}`)}
            className="group glass-panel rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 flex items-center gap-6"
        >
            <div className="size-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform flex-shrink-0">
                <FiUser className="text-primary-glow" size={24} />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate">{cleanName}</h3>
                <p className="text-sm text-slate-400 truncate">
                    {Array.isArray(candidate.recommended_roles?.[0])
                        ? candidate.recommended_roles[0][0]
                        : candidate.recommended_roles?.[0] || 'Applicant'}
                    {candidate.email && ` • ${candidate.email}`}
                </p>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-center">
                    <span className={`text-2xl font-black ${candidate.final_score >= 80 ? 'text-emerald-400' :
                        candidate.final_score >= 60 ? 'text-blue-400' : 'text-amber-400'
                        }`}>
                        {Math.round(candidate.final_score || 0)}%
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Match</p>
                </div>

                <div className="hidden md:flex flex-wrap gap-2 max-w-xs">
                    {candidate.matched_skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-primary/10 text-primary-glow text-xs rounded-lg border border-primary/20">
                            {skill}
                        </span>
                    ))}
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${candidate.match_classification === 'Excellent Fit' ? 'bg-emerald-500/20 text-emerald-400' :
                    candidate.match_classification === 'Good Fit' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                    }`}>
                    {candidate.match_classification || 'Processed'}
                </span>
            </div>
        </div>
    );
};

export default CandidatesList;
