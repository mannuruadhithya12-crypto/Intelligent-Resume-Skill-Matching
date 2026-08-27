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
        <div className="flex h-screen items-center justify-center bg-[#FBF9F4]">
            <div className="w-12 h-12 border-4 border-[#E9E1DC] border-t-primary-sage rounded-full animate-spin"></div>
        </div>
    );

    if (!jobId) return (
        <div className="flex flex-col h-screen items-center justify-center bg-[#FBF9F4] text-text-secondary gap-4 font-sans">
            <FiAlertTriangle size={40} className="text-[#E65100]" />
            <h3 className="text-lg font-serif font-bold text-text-primary">No Analysis Reports Found</h3>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-[#3F7655] text-white rounded-full font-semibold border border-[#3F7655] hover:bg-[#315F44] active:translate-y-[1px] focus:ring-2 focus:ring-[#3F7655]/50 focus:outline-none transition-all shadow-sm text-[14px] cursor-pointer opacity-100">
                Start New Analysis
            </button>
        </div>
    );

    return (
        <div className="bg-[#FBF9F4] text-text-primary animate-fade-in font-sans">
            <div className="w-full">
                <ResultsDashboard jobId={jobId} onReset={() => navigate('/')} />
            </div>
        </div>
    );
}
