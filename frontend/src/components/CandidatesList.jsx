import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMoreVertical, FiSearch, FiFilter, FiLoader, FiPlus } from 'react-icons/fi';
import { getHistory, getResults } from '../api';

const CandidatesList = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [jobId, setJobId] = useState(null); // Keep for context if needed, but primarily we use list


    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch analysis history 
                const history = await getHistory();
                if (history && history.length > 0) {
                    // Fetch results for ALL jobs to show complete candidate pool
                    // Using Promise.all to fetch in parallel
                    const promises = history.map(async (job) => {
                        try {
                            const res = await getResults(job.job_id);
                            // Attach job_id to each candidate for correct navigation
                            return res.candidates ? res.candidates.map(c => ({ ...c, job_id: job.job_id })) : [];
                        } catch (e) {
                            console.warn(`Failed to load results for job ${job.job_id}`, e);
                            return [];
                        }
                    });

                    const resultsArrays = await Promise.all(promises);
                    // Flatten the array of arrays
                    const allCandidates = resultsArrays.flat();

                    setCandidates(allCandidates);

                    // Set latest job ID just in case
                    if (history[0]) setJobId(history[0].job_id);
                }
            } catch (err) {
                console.error("Failed to fetch candidates:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredCandidates = candidates.filter(c =>
        c.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(c.recommended_roles) && c.recommended_roles.some(r => r.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <div className="animate-fade-in">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Candidates</h2>
                    <p className="text-slate-400 text-sm">
                        {loading ? 'Loading candidates...' : `Showing ${filteredCandidates.length} candidates from all analysis history`}
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1F2937] border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <button className="bg-[#1F2937] hover:bg-[#374151] text-white px-4 py-2 rounded-xl text-sm font-medium border border-[#374151] flex items-center gap-2 transition-colors">
                        <FiFilter /> Filter
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-colors flex items-center gap-2"
                    >
                        <FiPlus /> Add Candidate
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <FiLoader className="animate-spin text-primary text-3xl" />
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-20 bg-bg-card rounded-xl border border-border-subtle border-dashed">
                    <div className="w-16 h-16 bg-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUser className="text-2xl text-slate-500" />
                    </div>
                    <h3 className="text-white font-bold mb-2">No candidates found</h3>
                    <p className="text-slate-400 text-sm mb-6">Try adjusting your search or upload new resumes.</p>
                    <button onClick={() => navigate('/')} className="text-primary hover:text-primary-light font-medium text-sm">
                        Go to Dashboard
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCandidates.map((c, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/analysis/${c.job_id}/${c.filename}`)}
                            className="group bg-bg-card border border-border-subtle hover:border-primary/50 hover:bg-bg-card/80 transition-all duration-200 rounded-xl p-5 cursor-pointer flex flex-col md:flex-row items-center gap-6"
                        >
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="size-12 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-primary bg-[#1F2937] flex items-center justify-center transition-colors">
                                    <FiUser className="text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-primary transition-colors text-lg">{c.filename}</h3>
                                    <p className="text-slate-400 text-xs">
                                        {c.recommended_roles && c.recommended_roles.length > 0 ? c.recommended_roles[0] : 'Applicant'}
                                        {c.email ? ` • ${c.email}` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Match Score */}
                            <div className="flex flex-col items-center w-24">
                                <span className={`text-2xl font-bold ${c.final_score >= 80 ? 'text-emerald-400' : c.final_score >= 60 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {c.final_score ? c.final_score.toFixed(0) : 0}%
                                </span>
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Match</span>
                            </div>

                            {/* Skills */}
                            <div className="hidden md:flex flex-wrap gap-2 flex-1 justify-center max-w-sm">
                                {c.matched_skills && c.matched_skills.slice(0, 3).map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-[#151A23] text-slate-300 text-xs rounded-lg border border-border-subtle">
                                        {skill}
                                    </span>
                                ))}
                                {c.matched_skills && c.matched_skills.length > 3 && (
                                    <span className="px-2 py-1 bg-[#151A23] text-slate-500 text-xs rounded-lg border border-border-subtle">
                                        +{c.matched_skills.length - 3}
                                    </span>
                                )}
                            </div>

                            {/* Status & Action */}
                            <div className="flex items-center gap-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.match_classification === 'Excellent Fit' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    c.match_classification === 'Good Fit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {c.match_classification || 'Processed'}
                                </span>

                                <button className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <FiMoreVertical size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CandidatesList;
