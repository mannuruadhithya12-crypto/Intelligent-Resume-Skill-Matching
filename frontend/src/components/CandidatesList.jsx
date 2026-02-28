import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUser, FiMoreVertical, FiSearch, FiFilter, FiLoader, FiPlus,
    FiStar, FiTrendingUp, FiAward, FiCpu, FiCalendar, FiMail,
    FiMapPin, FiCheckCircle, FiXCircle, FiClock, FiGrid, FiList, FiChevronDown
} from 'react-icons/fi';
import { getHistory, getResults } from '../api';
import SkillChip from './SkillChip';

const CandidatesList = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('score');

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
                                analyzed_date: job.timestamp,
                                jd_filename: job.jd_filename
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

    const processedCandidates = useMemo(() => {
        return candidates
            .filter(c => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = c.filename?.toLowerCase().includes(searchLower) ||
                    (Array.isArray(c.recommended_roles) && c.recommended_roles.some(r => r?.toLowerCase().includes(searchLower))) ||
                    (Array.isArray(c.skills?.matched) && c.skills.matched.some(s => s?.toLowerCase().includes(searchLower)));

                if (!matchesSearch) return false;

                if (filterStatus === 'all') return true;
                if (filterStatus === 'excellent') return c.match_classification?.includes('Excellent');
                if (filterStatus === 'good') return c.match_classification?.includes('Good');
                if (filterStatus === 'moderate') return c.match_classification?.includes('Moderate');
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'score') return (b.final_score || 0) - (a.final_score || 0);
                if (sortBy === 'name') return a.filename.localeCompare(b.filename);
                if (sortBy === 'date') return new Date(b.analyzed_date || 0) - new Date(a.analyzed_date || 0);
                return 0;
            });
    }, [candidates, searchTerm, filterStatus, sortBy]);

    const stats = useMemo(() => {
        return {
            total: candidates.length,
            excellent: candidates.filter(c => c.match_classification?.includes('Excellent')).length,
            good: candidates.filter(c => c.match_classification?.includes('Good')).length,
            avgScore: candidates.length > 0 ? (candidates.reduce((sum, c) => sum + (c.final_score || 0), 0) / candidates.length).toFixed(1) : 0
        };
    }, [candidates]);

    return (
        <div className="animate-fade-in space-y-8 max-w-7xl mx-auto p-6 md:p-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight mb-2">Talent Pool</h1>
                    <p className="text-lg text-gray-400 font-light">
                        {loading ? 'Compiling AI database...' : `Managing ${stats.total} intelligently ranked candidates`}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-neon hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
                >
                    <FiPlus /> New Search
                </button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FiUser />} label="Total Profiles" value={stats.total} color="blue" />
                <StatCard icon={<FiStar />} label="Top Tier Picks" value={stats.excellent} color="emerald" />
                <StatCard icon={<FiTrendingUp />} label="Solid Fits" value={stats.good} color="purple" />
                <StatCard icon={<FiAward />} label="Avg System Score" value={`${stats.avgScore}%`} color="indigo" />
            </div>

            {/* Advanced Filters */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-4 shadow-card">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, role, or specific skills..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#050B14] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hid-scrollbar">
                        {/* Filter Group */}
                        <div className="flex gap-2">
                            <FilterButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="All" />
                            <FilterButton active={filterStatus === 'excellent'} onClick={() => setFilterStatus('excellent')} label="Excellent" color="text-emerald-400 border-emerald-500/30 bg-emerald-500/10" />
                            <FilterButton active={filterStatus === 'good'} onClick={() => setFilterStatus('good')} label="Good" color="text-blue-400 border-blue-500/30 bg-blue-500/10" />
                        </div>

                        {/* View Modes */}
                        <div className="flex gap-1 bg-[#050B14] p-1.5 rounded-xl border border-gray-800 shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                            >
                                <FiGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                            >
                                <FiList size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-[#0f172a] border border-gray-800 rounded-2xl h-64 p-6 animate-pulse">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gray-800 rounded-full"></div>
                                <div className="space-y-3 flex-1">
                                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-8 bg-gray-800 rounded w-full"></div>
                                <div className="h-8 bg-gray-800 rounded w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : processedCandidates.length === 0 ? (
                <div className="bg-[#0f172a] border border-gray-800 p-16 rounded-3xl shadow-card text-center relative overflow-hidden">
                    <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiUser className="text-4xl text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Talent Found</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                        {searchTerm || filterStatus !== 'all'
                            ? "We couldn't find any candidates matching your advanced filters."
                            : "Your talent pool is currently empty. Run an intelligence evaluation on the dashboard to populate this list."}
                    </p>
                    {(searchTerm || filterStatus !== 'all') && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="text-primary font-bold hover:text-primary-glow flex items-center gap-2 mx-auto transition-colors"
                        >
                            <FiXCircle /> Clear All Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                    {processedCandidates.map((c, idx) => (
                        viewMode === 'grid' ? (
                            <CandidateCard key={`${c.job_id}-${idx}`} candidate={c} navigate={navigate} delay={idx * 50} />
                        ) : (
                            <CandidateListItem key={`${c.job_id}-${idx}`} candidate={c} navigate={navigate} delay={idx * 50} />
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
        blue: 'text-blue-400 from-blue-500/10 to-transparent border-blue-500/20 bg-blue-500/10',
        emerald: 'text-emerald-400 from-emerald-500/10 to-transparent border-emerald-500/20 bg-emerald-500/10',
        purple: 'text-purple-400 from-purple-500/10 to-transparent border-purple-500/20 bg-purple-500/10',
        indigo: 'text-indigo-400 from-indigo-500/10 to-transparent border-indigo-500/20 bg-indigo-500/10'
    };

    return (
        <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-5 shadow-card relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${colors[color].split(' ')[1]} rounded-bl-full -mr-6 -mt-6 opacity-50 group-hover:scale-110 transition-transform`}></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-xl ${colors[color].split(' ').pop()} ${colors[color].split(' ')[0]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-2xl font-black text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

const FilterButton = ({ active, onClick, label, color }) => {
    const defaultColor = active
        ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-primary'
        : 'bg-[#050B14] text-gray-400 border-gray-800 hover:border-gray-500 hover:text-white';

    const customColor = active ? `${color} shadow-sm` : 'bg-[#050B14] text-gray-400 border-gray-800 hover:border-gray-500 hover:text-white';

    return (
        <button
            onClick={onClick}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border shrink-0 ${color ? customColor : defaultColor}`}
        >
            {label}
        </button>
    );
};

const CandidateCard = ({ candidate, navigate, delay }) => {
    const cleanName = candidate.filename?.replace(/\.(pdf|docx?)$/i, '').replace(/[-_]/g, ' ') || 'Unknown Candidate';
    const scoreVal = candidate.final_score || 0;

    let ringColor = 'border-gray-700 text-gray-500';
    if (scoreVal >= 80) ringColor = 'border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-500/10';
    else if (scoreVal >= 60) ringColor = 'border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-500/10';
    else if (scoreVal >= 40) ringColor = 'border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-amber-500/10';

    return (
        <div
            onClick={() => navigate(`/analysis/${candidate.job_id}/${encodeURIComponent(candidate.filename)}`)}
            className="group bg-[#0f172a] border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4 max-w-[70%]">
                    <div className="w-12 h-12 rounded-full bg-[#050B14] border border-gray-700 flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                        <FiUser size={20} className="text-gray-400 group-hover:text-primary" />
                    </div>
                    <div className="truncate">
                        <h3 className="font-bold text-lg text-white group-hover:text-primary-glow transition-colors truncate capitalize">{cleanName}</h3>
                        <p className="text-xs text-gray-400 font-medium tracking-wide truncate">
                            {Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
                                ? candidate.recommended_roles[0]
                                : 'General Processing'}
                        </p>
                    </div>
                </div>

                <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center shrink-0 ${ringColor}`}>
                    <span className="text-lg font-black">{Math.round(scoreVal)}</span>
                </div>
            </div>

            {/* Skills Preview */}
            <div className="mb-6 flex-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Top Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(candidate.skills?.matched) && candidate.skills.matched.slice(0, 4).map((skill, i) => (
                        <SkillChip key={i} skill={skill} type="match" />
                    ))}
                    {Array.isArray(candidate.skills?.matched) && candidate.skills.matched.length > 4 && (
                        <span className="px-2.5 py-1.5 rounded-lg text-xs font-bold border bg-gray-800/50 text-gray-400 border-gray-700 shrink-0">
                            +{candidate.skills.matched.length - 4} more
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800/50 mt-auto text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <FiClock className="text-gray-400" />
                    {new Date(candidate.analyzed_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-primary font-bold group-hover:translate-x-1 transition-transform">
                    View Full Profile &rarr;
                </div>
            </div>
        </div>
    );
};

const CandidateListItem = ({ candidate, navigate, delay }) => {
    const cleanName = candidate.filename?.replace(/\.(pdf|docx?)$/i, '').replace(/[-_]/g, ' ') || 'Unknown Candidate';
    const scoreVal = candidate.final_score || 0;

    let badgeClass = 'border-gray-700 text-gray-400 bg-gray-800';
    if (candidate.match_classification?.includes('Excellent')) badgeClass = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    else if (candidate.match_classification?.includes('Good')) badgeClass = 'border-blue-500/30 text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    else if (candidate.match_classification?.includes('Moderate')) badgeClass = 'border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]';

    return (
        <div
            onClick={() => navigate(`/analysis/${candidate.job_id}/${encodeURIComponent(candidate.filename)}`)}
            className="group bg-[#0f172a] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:shadow-card transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-4 min-w-[250px] max-w-sm">
                <div className="w-12 h-12 rounded-full bg-[#050B14] border border-gray-700 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:text-primary transition-all">
                    <FiUser size={20} className="text-gray-500 group-hover:text-primary" />
                </div>
                <div className="truncate">
                    <h3 className="font-bold text-white group-hover:text-primary-glow transition-colors truncate capitalize text-lg">{cleanName}</h3>
                    <p className="text-xs text-gray-500 font-medium truncate">
                        {Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
                            ? candidate.recommended_roles[0]
                            : 'General Processing'}
                    </p>
                </div>
            </div>

            <div className="hidden md:flex flex-1 items-center gap-2 overflow-hidden px-4">
                {Array.isArray(candidate.skills?.matched) && candidate.skills.matched.slice(0, 3).map((skill, i) => (
                    <SkillChip key={i} skill={skill} type="match" />
                ))}
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px] mt-4 md:mt-0 pt-4 md:pt-0 border-t border-gray-800/50 md:border-none">
                <div className={`px-4 py-1.5 rounded-lg text-xs font-bold border text-center whitespace-nowrap ${badgeClass}`}>
                    {candidate.match_classification || 'Pending Match'}
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-white">{Math.round(scoreVal)}<span className="text-sm font-medium text-gray-500 ml-1">/100</span></span>
                </div>
            </div>
        </div>
    );
};

export default CandidatesList;
