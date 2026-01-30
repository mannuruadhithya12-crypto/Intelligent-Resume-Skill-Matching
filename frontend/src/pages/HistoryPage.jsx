import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FiTrash2, FiClock, FiFileText, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            // Remove from local state
            setHistory(prev => prev.filter(item => item.job_id !== jobId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete analysis');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <FiCheckCircle className="text-emerald-400" />;
            case 'failed':
                return <FiXCircle className="text-red-400" />;
            case 'processing':
                return <FiAlertCircle className="text-amber-400 animate-pulse" />;
            default:
                return <FiClock className="text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'failed':
                return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'processing':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default:
                return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
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

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-full">
            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-red-400">
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Analysis History</h2>
                <p className="text-slate-400">Last 24 hours of AI-powered resume analyses</p>
            </header>

            {history.length === 0 ? (
                <div className="bg-bg-card border border-border-subtle p-12 rounded-xl text-center">
                    <FiFileText className="mx-auto text-6xl text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 mb-2">No Analysis History</h3>
                    <p className="text-slate-500">Your recent analyses will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div
                            key={item.job_id}
                            className="bg-bg-card border border-border-subtle p-6 rounded-xl hover:border-indigo-500/50 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        {getStatusIcon(item.status)}
                                        <h3 className="text-lg font-bold text-white">
                                            {item.jd_filename}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Resumes</div>
                                            <div className="text-white font-bold">{item.resume_count}</div>
                                        </div>
                                        {item.avg_score && (
                                            <div>
                                                <div className="text-slate-500 text-xs mb-1">Avg Score</div>
                                                <div className="text-white font-bold">
                                                    {(item.avg_score * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        )}
                                        {item.processing_time && (
                                            <div>
                                                <div className="text-slate-500 text-xs mb-1">Processing Time</div>
                                                <div className="text-white font-bold">
                                                    {item.processing_time.toFixed(2)}s
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Created</div>
                                            <div className="text-white font-bold text-sm">
                                                {formatDate(item.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    {item.top_candidate && (
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg">
                                            <div className="text-indigo-400 text-xs mb-1">Top Candidate</div>
                                            <div className="text-white font-medium">{item.top_candidate}</div>
                                        </div>
                                    )}

                                    {item.error_message && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                            <div className="text-red-400 text-xs mb-1">Error</div>
                                            <div className="text-white font-medium">{item.error_message}</div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDelete(item.job_id)}
                                    className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete analysis"
                                >
                                    <FiTrash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {history.length > 0 && (
                <div className="text-center text-slate-500 text-sm mt-8">
                    Showing {history.length} analysis{history.length !== 1 ? 'es' : ''} from the last 24 hours
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
