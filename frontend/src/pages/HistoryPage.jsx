import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { FiTrash2, FiClock, FiFileText, FiCheckCircle, FiXCircle, FiAlertCircle, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date', 'score'

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
                return <FiCheckCircle className="text-emerald-400" size={20} />;
            case 'failed':
                return <FiXCircle className="text-red-400" size={20} />;
            case 'processing':
                return <FiAlertCircle className="text-blue-400 animate-pulse" size={20} />;
            default:
                return <FiClock className="text-gray-400" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            case 'failed':
                return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
            case 'processing':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
            default:
                return 'text-gray-400 bg-gray-800 border-gray-700';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffHours < 1) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
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
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-gray-400 font-medium animate-pulse">Loading history vault...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-full min-h-[500px]">
            <div className="bg-[#0f172a] p-8 rounded-2xl border border-red-500/30 text-center shadow-card max-w-md">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiXCircle className="text-red-500 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">History Sync Failed</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button onClick={fetchHistory} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all hover:scale-105">
                    Retry Connection
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-tight">Analysis History</h2>
                    <p className="text-lg text-gray-400 mt-2 font-light">Recent AI-powered candidate evaluations</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search jobs or candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-gray-600"
                        />
                    </div>

                    <div className="relative group/filter">
                        <button className="flex items-center gap-2 bg-[#0f172a] border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-medium transition-all hover:bg-white/5">
                            <FiFilter className="text-gray-400" />
                            Sort: {sortBy === 'date' ? 'Newest' : 'Top Score'}
                            <FiChevronDown className="text-gray-500 ml-1" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-gray-800 rounded-xl shadow-card opacity-0 invisible group-hover/filter:opacity-100 group-hover/filter:visible transition-all duration-200 z-50 overflow-hidden transform origin-top group-hover/filter:scale-100 scale-95">
                            <button onClick={() => setSortBy('date')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${sortBy === 'date' ? 'text-primary font-bold bg-primary/5' : 'text-gray-300'}`}>Newest First</button>
                            <button onClick={() => setSortBy('score')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${sortBy === 'score' ? 'text-primary font-bold bg-primary/5' : 'text-gray-300'}`}>Highest Score</button>
                        </div>
                    </div>
                </div>
            </header>

            {filteredAndSortedHistory.length === 0 ? (
                <div className="bg-[#0f172a] border border-gray-800 p-16 rounded-2xl shadow-card text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-inner">
                        <FiFileText className="text-4xl text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 relative z-10">No Analysis History</h3>
                    <p className="text-gray-400 max-w-md mx-auto relative z-10">
                        {searchQuery ? "No results match your current search filters. Try adjusting your query." : "You haven't run any AI candidate evaluations yet. Start by uploading resumes on the dashboard."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredAndSortedHistory.map((item, index) => (
                        <div
                            key={item.job_id}
                            className="bg-[#0f172a] border border-gray-800 p-6 rounded-2xl shadow-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-all duration-500 group-hover/card:scale-125"></div>

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 shadow-inner">
                                            {getStatusIcon(item.status)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover/card:text-primary-glow transition-colors">
                                                {item.jd_filename}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1.5"><FiClock size={12} /> {formatDate(item.created_at)}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                <span className="flex items-center gap-1.5"><FiFileText size={12} /> {item.resume_count} Resumes</span>
                                            </div>
                                        </div>
                                        <div className="ml-auto lg:ml-4 flex items-center gap-2">
                                            <span className={`px-4 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 backdrop-blur-sm tracking-wide uppercase ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex flex-wrap items-center gap-8 py-4 border-t border-b border-gray-800/50 mb-4 bg-gray-900/20 rounded-xl px-4">
                                        {item.avg_score && (
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Avg Score</div>
                                                <div className="text-lg font-black text-white flex items-center gap-1">
                                                    {(item.avg_score).toFixed(1)}%
                                                </div>
                                            </div>
                                        )}
                                        {item.processing_time && (
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Compute Time</div>
                                                <div className="text-lg font-black text-white font-mono">
                                                    {item.processing_time.toFixed(2)}s
                                                </div>
                                            </div>
                                        )}
                                        {item.top_candidate && (
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider mb-1 flex items-center gap-1"><FiCheckCircle /> Top Match</div>
                                                <div className="text-sm font-bold text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 px-3 py-1.5 rounded-lg inline-flex max-w-full truncate">
                                                    {item.top_candidate}
                                                </div>
                                            </div>
                                        )}

                                        {item.error_message && (
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider mb-1 flex items-center gap-1"><FiAlertCircle /> System Error</div>
                                                <div className="text-sm font-medium text-red-400 bg-red-900/20 border border-red-800/30 px-3 py-1.5 rounded-lg inline-flex max-w-full truncate">
                                                    {item.error_message}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex lg:flex-col items-center justify-end gap-3 min-w-[120px]">
                                    <button
                                        onClick={() => handleDelete(item.job_id)}
                                        className="w-full py-2.5 px-4 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/20 opacity-100 lg:opacity-0 group-hover/card:opacity-100 shadow-sm"
                                        title="Delete analysis record"
                                    >
                                        <FiTrash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredAndSortedHistory.length > 0 && (
                <div className="text-center text-gray-500 text-sm mt-8 border-t border-gray-800 pt-8">
                    Showing <span className="font-bold text-white">{filteredAndSortedHistory.length}</span> analysis module{filteredAndSortedHistory.length !== 1 ? 's' : ''} out of {history.length} total
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
