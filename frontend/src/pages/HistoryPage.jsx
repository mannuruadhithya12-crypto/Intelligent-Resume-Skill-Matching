import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date', 'score'
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/history');
            setHistory(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (jobId) => {
        if (!confirm('Are you sure you want to delete this analysis?')) return;

        try {
            await api.delete(`/history/${jobId}`);
            setHistory(prev => prev.filter(item => item.job_id !== jobId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete analysis');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <span className="material-symbols-outlined text-[20px]">check_circle</span>;
            case 'failed':
                return <span className="material-symbols-outlined text-[20px]">cancel</span>;
            case 'processing':
                return <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>;
            default:
                return <span className="material-symbols-outlined text-[20px]">schedule</span>;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-primary-sage bg-[#CAECBC]/30 border-[#CAECBC]';
            case 'failed':
                return 'text-error bg-error/10 border-error/20';
            case 'processing':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-text-secondary bg-[#F5ECE7] border-[#E9E1DC]';
        }
    };

    const getIconColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-primary-sage bg-[#CAECBC]/30';
            case 'failed':
                return 'text-error bg-error/10';
            case 'processing':
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-outline bg-[#F5ECE7]';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffHours < 1) {
            return `${Math.max(0, diffMins)} min${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${Math.max(0, diffHours)} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const filteredAndSortedHistory = useMemo(() => {
        let result = history.filter(item =>
            item.jd_filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.top_candidate?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortBy === 'score') {
            result.sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));
        } else {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return result;
    }, [history, searchQuery, sortBy]);

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[500px]">
            <div className="flex flex-col items-center gap-6">
                <div className="size-16 rounded-full border-4 border-[#F5ECE7] border-t-primary-sage animate-spin"></div>
                <p className="text-text-secondary font-medium animate-pulse">Loading history vault...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-full min-h-[500px]">
            <div className="bg-white p-10 rounded-[24px] border border-error/20 text-center shadow-paper max-w-md">
                <div className="size-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-[32px] text-error">warning</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-text-primary mb-3">History Sync Failed</h3>
                <p className="text-text-secondary mb-8">{error}</p>
                <button onClick={fetchHistory} className="px-8 py-3 bg-page hover:bg-outline-variant text-text-primary rounded-full font-bold transition-all border border-[#E9E1DC]">
                    Retry Connection
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-10 animate-fade-in max-w-[1400px] mx-auto font-sans">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E9E1DC] pb-8">
                <div>
                    <h2 className="text-[36px] font-serif font-bold text-text-primary tracking-tight leading-none mb-3">Analysis History</h2>
                    <p className="text-[15px] text-text-secondary">Recent AI-powered candidate evaluations</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-[300px]">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search jobs or candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-[#E9E1DC] rounded-full py-3 pl-12 pr-5 text-[14px] font-bold text-text-primary focus:outline-none focus:border-primary-sage focus:ring-1 focus:ring-[#CAECBC] transition-all placeholder-outline shadow-sm"
                        />
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center gap-2 bg-white border border-[#E9E1DC] hover:border-outline-variant rounded-full px-5 py-3 text-[13px] text-text-primary font-bold transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">sort</span>
                            Sort: {sortBy === 'date' ? 'Newest' : 'Top Score'}
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                        </button>
                        {showSortDropdown && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white border border-[#E9E1DC] rounded-[16px] shadow-paper z-50 overflow-hidden animate-fade-in-up">
                                <button onClick={() => {setSortBy('date'); setShowSortDropdown(false);}} className={`w-full text-left px-5 py-3.5 text-[13px] hover:bg-[#F5ECE7] transition-colors ${sortBy === 'date' ? 'text-primary-sage font-bold bg-[#CAECBC]/10' : 'text-text-primary font-bold'}`}>Newest First</button>
                                <button onClick={() => {setSortBy('score'); setShowSortDropdown(false);}} className={`w-full text-left px-5 py-3.5 text-[13px] hover:bg-[#F5ECE7] transition-colors ${sortBy === 'score' ? 'text-primary-sage font-bold bg-[#CAECBC]/10' : 'text-text-primary font-bold'}`}>Highest Score</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {filteredAndSortedHistory.length === 0 ? (
                <div className="bg-white border border-[#E9E1DC] p-20 rounded-[24px] shadow-paper text-center relative overflow-hidden">
                    <div className="size-[100px] bg-[#F5ECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-[40px] text-outline">history</span>
                    </div>
                    <h3 className="text-[24px] font-serif font-bold text-text-primary mb-3">No Analysis History</h3>
                    <p className="text-text-secondary text-[15px] max-w-md mx-auto">
                        {searchQuery ? "No results match your current search filters. Try adjusting your query." : "You haven't run any AI candidate evaluations yet. Start by uploading resumes on the dashboard."}
                    </p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[39px] top-[24px] bottom-0 w-[2px] bg-[#F5ECE7] z-0 hidden lg:block"></div>
                    
                    <div className="space-y-6">
                        {filteredAndSortedHistory.map((item, index) => (
                            <div
                                key={item.job_id}
                                className="relative flex items-start gap-8 z-10 group/card"
                            >
                                {/* Timeline Dot */}
                                <div className="hidden lg:flex flex-col items-center pt-6">
                                    <div className="size-[20px] rounded-full bg-white border-4 border-[#E9E1DC] group-hover/card:border-primary-sage transition-colors"></div>
                                </div>
                                
                                <div 
                                    className="flex-1 bg-white border border-[#E9E1DC] p-8 rounded-[24px] shadow-sm hover:shadow-paper hover:border-primary-sage/30 transition-all duration-300 relative overflow-hidden animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className={`size-12 rounded-[14px] flex items-center justify-center shadow-sm ${getIconColor(item.status)}`}>
                                                    {getStatusIcon(item.status)}
                                                </div>
                                                <div>
                                                    <h3 className="text-[20px] font-serif font-bold text-text-primary group-hover/card:text-primary-sage transition-colors truncate max-w-sm md:max-w-xl">
                                                        {item.jd_filename}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1.5 text-[13px] text-text-secondary font-bold">
                                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">schedule</span> {formatDate(item.created_at)}</span>
                                                        <span className="size-1 rounded-full bg-outline"></span>
                                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">description</span> {item.resume_count} Resumes</span>
                                                    </div>
                                                </div>
                                                <div className="ml-auto lg:ml-4 flex items-center gap-2">
                                                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 tracking-wider uppercase shadow-sm ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="flex flex-wrap items-center gap-8 py-4 border-t border-b border-[#E9E1DC] mb-4 bg-[#FBF9F4] rounded-[16px] px-6">
                                                {item.avg_score && (
                                                    <div>
                                                        <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1.5">Avg Score</div>
                                                        <div className="text-[20px] font-black text-text-primary flex items-center gap-1 leading-none">
                                                            {(item.avg_score).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                )}
                                                {item.processing_time && (
                                                    <div>
                                                        <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1.5">Compute Time</div>
                                                        <div className="text-[20px] font-black text-text-primary leading-none">
                                                            {item.processing_time.toFixed(2)}s
                                                        </div>
                                                    </div>
                                                )}
                                                {item.top_candidate && (
                                                    <div className="flex-1 min-w-[200px]">
                                                        <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">star</span> Top Match</div>
                                                        <div className="text-[14px] font-bold text-primary-sage bg-[#CAECBC]/30 px-3 py-1.5 rounded-lg inline-flex max-w-full truncate border border-[#CAECBC]">
                                                            {item.top_candidate}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.error_message && (
                                                    <div className="flex-1 min-w-[200px]">
                                                        <div className="text-[11px] font-bold text-error uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">warning</span> System Error</div>
                                                        <div className="text-[14px] font-bold text-error bg-error/10 px-3 py-1.5 rounded-lg inline-flex max-w-full truncate border border-error/20">
                                                            {item.error_message}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col items-center justify-end gap-3 min-w-[120px]">
                                            <button
                                                onClick={() => handleDelete(item.job_id)}
                                                className="w-full py-3 px-5 text-[13px] font-bold text-error bg-white hover:bg-error/10 rounded-full transition-all duration-300 flex items-center justify-center gap-2 border border-error/30 shadow-sm lg:opacity-0 group-hover/card:opacity-100"
                                                title="Delete analysis record"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredAndSortedHistory.length > 0 && (
                <div className="text-center text-text-secondary text-[14px] mt-8 pt-8 font-medium">
                    Showing <span className="font-bold text-text-primary">{filteredAndSortedHistory.length}</span> analysis module{filteredAndSortedHistory.length !== 1 ? 's' : ''} out of {history.length} total
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
