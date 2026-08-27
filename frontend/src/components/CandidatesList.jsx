import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getHistory, getResults } from '../api';
import SkillChip from './SkillChip';

const CandidatesList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('score');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('q');
        if (q) {
            setSearchTerm(q);
        }
    }, [location.search]);

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
        <div className="animate-fade-in space-y-8 max-w-[1400px] mx-auto p-6 md:p-8 font-sans">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-[36px] font-serif font-bold text-text-primary tracking-tight mb-2 leading-none">Talent Pool</h1>
                    <p className="text-[15px] text-text-secondary">
                        {loading ? 'Aggregating candidate profiles...' : `Managing ${stats.total} intelligently ranked candidates`}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-[#3F7655] text-white rounded-full font-semibold border border-[#3F7655] shadow-sm hover:bg-[#315F44] active:translate-y-[1px] focus:ring-2 focus:ring-[#3F7655]/50 focus:outline-none transition-all flex items-center justify-center gap-2 text-[14px] cursor-pointer opacity-100"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span> New Review
                </button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="group" label="Total Profiles" value={stats.total} color="neutral" />
                <StatCard icon="star" label="Top Matches" value={stats.excellent} color="sage" />
                <StatCard icon="trending_up" label="Solid Fits" value={stats.good} color="blue" />
                <StatCard icon="workspace_premium" label="Avg System Score" value={`${stats.avgScore}%`} color="terracotta" />
            </div>

            {/* Advanced Filters */}
            <div className="bg-white border border-[#E9E1DC] rounded-[24px] p-5 shadow-paper">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search by name, role, or specific skills..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#F5ECE7]/50 border border-[#E9E1DC] rounded-[16px] py-3.5 pl-12 pr-5 text-[14px] text-text-primary placeholder:text-outline focus:outline-none focus:border-primary-sage focus:ring-1 focus:ring-[#CAECBC] transition-all font-bold"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hid-scrollbar">
                        {/* Filter Group */}
                        <div className="flex gap-2">
                            <FilterButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="All" />
                            <FilterButton active={filterStatus === 'excellent'} onClick={() => setFilterStatus('excellent')} label="Excellent" />
                            <FilterButton active={filterStatus === 'good'} onClick={() => setFilterStatus('good')} label="Good" />
                        </div>

                        {/* View Modes */}
                        <div className="flex gap-1 bg-[#F5ECE7]/50 p-1.5 rounded-[12px] border border-[#E9E1DC] shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-text-primary shadow-sm' : 'text-outline hover:text-text-primary'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-text-primary shadow-sm' : 'text-outline hover:text-text-primary'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">view_list</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white border border-[#E9E1DC] rounded-[24px] h-[280px] p-6 animate-pulse shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-[60px] bg-[#F5ECE7] rounded-full"></div>
                                <div className="space-y-3 flex-1">
                                    <div className="h-5 bg-[#F5ECE7] rounded w-3/4"></div>
                                    <div className="h-4 bg-[#F5ECE7] rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-8 bg-[#F5ECE7] rounded-lg w-full"></div>
                                <div className="h-8 bg-[#F5ECE7] rounded-lg w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : processedCandidates.length === 0 ? (
                <div className="bg-white border border-[#E9E1DC] p-20 rounded-[24px] shadow-paper text-center relative overflow-hidden">
                    <div className="size-[100px] bg-[#F5ECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-[48px] text-outline">group_off</span>
                    </div>
                    <h3 className="text-[24px] font-serif font-bold text-text-primary mb-3">No Talent Found</h3>
                    <p className="text-text-secondary text-[15px] max-w-md mx-auto mb-8">
                        {searchTerm || filterStatus !== 'all'
                            ? "We couldn't find any candidates matching your advanced filters."
                            : "Your talent pool is currently empty. Run a review on the dashboard to populate this list."}
                    </p>
                    {(searchTerm || filterStatus !== 'all') && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="text-primary-sage font-bold hover:text-primary-container flex items-center gap-2 mx-auto transition-colors bg-[#CAECBC]/30 px-6 py-2.5 rounded-full"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span> Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-4'}>
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
const StatCard = ({ icon, label, value, color = 'neutral' }) => {
    const colors = {
        neutral: 'text-text-primary bg-[#FBF9F4]',
        sage: 'text-primary-sage bg-[#CAECBC]/30',
        blue: 'text-text-primary bg-white',
        terracotta: 'text-terracotta bg-terracotta/10'
    };

    return (
        <div className="bg-white border border-[#E9E1DC] rounded-[24px] p-6 shadow-paper relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3.5 rounded-[16px] ${colors[color]}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                <div>
                    <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-[28px] font-serif font-bold text-text-primary leading-none">{value}</p>
                </div>
            </div>
        </div>
    );
};

const FilterButton = ({ active, onClick, label }) => {
    const defaultColor = active
        ? 'bg-[#3F7655] text-white border-[#3F7655] shadow-sm hover:bg-[#315F44]'
        : 'bg-transparent text-text-primary border-[#E9E1DC] hover:bg-[#F5ECE7] hover:border-outline-variant';

    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all border shrink-0 cursor-pointer opacity-100 ${defaultColor}`}
        >
            {label}
        </button>
    );
};

const CandidateCard = ({ candidate, navigate, delay }) => {
    const cleanName = candidate.filename?.replace(/\.(pdf|docx?)$/i, '').replace(/[-_]/g, ' ') || 'Unknown Candidate';
    const scoreVal = candidate.final_score || 0;

    let ringColor = 'border-[#E9E1DC] text-text-secondary bg-[#FBF9F4]';
    if (scoreVal >= 80) ringColor = 'border-[#CAECBC] text-primary-sage bg-[#CAECBC]/30 shadow-sm';
    else if (scoreVal >= 60) ringColor = 'border-[#E9E1DC] text-text-primary bg-white shadow-sm';
    else if (scoreVal >= 40) ringColor = 'border-terracotta/30 text-terracotta bg-terracotta/10 shadow-sm';

    return (
        <div
            onClick={() => navigate(`/analysis/${candidate.job_id}/${encodeURIComponent(candidate.filename)}`)}
            className="group bg-white border border-[#E9E1DC] rounded-[24px] p-8 cursor-pointer hover:border-primary-sage/50 hover:shadow-[0_8px_30px_rgba(30,27,24,0.08)] transition-all duration-300 flex flex-col h-full animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4 max-w-[70%]">
                    <div className="size-[56px] rounded-full bg-[#F5ECE7] border border-[#E9E1DC] flex items-center justify-center shrink-0 group-hover:bg-[#CAECBC]/30 group-hover:border-primary-sage/30 group-hover:text-primary-sage transition-colors overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=F5ECE7&textColor=1E1B18`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate">
                        <h3 className="font-bold text-[18px] text-text-primary group-hover:text-primary-sage transition-colors truncate capitalize">{cleanName}</h3>
                        <p className="text-[13px] text-text-secondary font-medium tracking-wide truncate mt-1">
                            {Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
                                ? candidate.recommended_roles[0]
                                : 'General Application'}
                        </p>
                    </div>
                </div>

                <div className={`size-[56px] rounded-[16px] border flex flex-col items-center justify-center shrink-0 ${ringColor}`}>
                    <span className="text-[20px] font-black leading-none">{Math.round(scoreVal)}</span>
                </div>
            </div>

            {/* Skills Preview */}
            <div className="mb-8 flex-1">
                <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-4">Top Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(candidate.skills?.matched) && candidate.skills.matched.slice(0, 4).map((skill, i) => (
                        <SkillChip key={i} skill={skill} type="match" />
                    ))}
                    {Array.isArray(candidate.skills?.matched) && candidate.skills.matched.length > 4 && (
                        <span className="px-3 py-1.5 rounded-lg text-[12px] font-bold border bg-[#F5ECE7] text-text-secondary border-[#E9E1DC] shrink-0">
                            +{candidate.skills.matched.length - 4} more
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-[#E9E1DC] mt-auto text-[12px] text-text-secondary font-bold">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {candidate.analyzed_date ? new Date(candidate.analyzed_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown Date'}
                </div>
                <div className="flex items-center gap-1.5 text-text-primary font-bold group-hover:text-primary-sage group-hover:translate-x-1 transition-all">
                    View Profile <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
            </div>
        </div>
    );
};

const CandidateListItem = ({ candidate, navigate, delay }) => {
    const cleanName = candidate.filename?.replace(/\.(pdf|docx?)$/i, '').replace(/[-_]/g, ' ') || 'Unknown Candidate';
    const scoreVal = candidate.final_score || 0;

    let badgeClass = 'border-[#E9E1DC] text-text-secondary bg-[#F5ECE7]';
    if (candidate.match_classification?.includes('Excellent')) badgeClass = 'border-[#CAECBC] text-primary-sage bg-[#CAECBC]/30 shadow-sm';
    else if (candidate.match_classification?.includes('Good')) badgeClass = 'border-[#E9E1DC] text-text-primary bg-white shadow-sm';
    else if (candidate.match_classification?.includes('Moderate')) badgeClass = 'border-terracotta/30 text-terracotta bg-terracotta/10 shadow-sm';

    return (
        <div
            onClick={() => navigate(`/analysis/${candidate.job_id}/${encodeURIComponent(candidate.filename)}`)}
            className="group bg-white border border-[#E9E1DC] rounded-[20px] p-5 cursor-pointer hover:border-primary-sage/50 hover:shadow-paper transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 animate-fade-in-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-5 min-w-[300px] max-w-md">
                <div className="size-12 rounded-full bg-[#F5ECE7] border border-[#E9E1DC] flex items-center justify-center shrink-0 group-hover:bg-[#CAECBC]/30 group-hover:border-primary-sage/30 transition-all overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=F5ECE7&textColor=1E1B18`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="truncate">
                    <h3 className="font-bold text-text-primary group-hover:text-primary-sage transition-colors truncate capitalize text-[16px]">{cleanName}</h3>
                    <p className="text-[13px] text-text-secondary font-medium truncate mt-0.5">
                        {Array.isArray(candidate.recommended_roles) && candidate.recommended_roles.length > 0
                            ? candidate.recommended_roles[0]
                            : 'General Application'}
                    </p>
                </div>
            </div>

            <div className="hidden md:flex flex-1 items-center gap-2 overflow-hidden px-4">
                {Array.isArray(candidate.skills?.matched) && candidate.skills.matched.slice(0, 3).map((skill, i) => (
                    <SkillChip key={i} skill={skill} type="match" />
                ))}
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 min-w-[220px] mt-4 md:mt-0 pt-4 md:pt-0 border-t border-[#E9E1DC] md:border-none">
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold border text-center whitespace-nowrap tracking-wider uppercase ${badgeClass}`}>
                    {candidate.match_classification || 'Pending Match'}
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[20px] font-black text-text-primary leading-none">{Math.round(scoreVal)}<span className="text-[12px] font-bold text-outline ml-1">/100</span></span>
                </div>
            </div>
        </div>
    );
};

export default CandidatesList;
