import React, { useEffect, useState } from 'react';
import { getHistory } from '../api';
import ResultsDashboard from './ResultsDashboard';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function LatestReport() {
    const [jobId, setJobId] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const history = await getHistory();
                if (history && history.length > 0) {
                    // Get latest (history is sorted DESC by default from backend)
                    const latest = history[0];
                    setJobId(latest.job_id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-bg-deep">
            <FiLoader className="animate-spin text-blue-600 text-3xl" />
        </div>
    );

    if (!jobId) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-bg-deep text-slate-500 gap-4">
            <FiAlertTriangle size={40} className="text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Analysis Reports Found</h3>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                Start New Analysis
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-bg-deep text-slate-900 dark:text-white animate-fade-in">
            <div className="w-full">
                <ResultsDashboard jobId={jobId} onReset={() => navigate('/')} />
            </div>
        </div>
    );
}
