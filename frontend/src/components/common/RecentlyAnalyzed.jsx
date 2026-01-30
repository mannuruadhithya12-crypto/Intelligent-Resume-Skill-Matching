import React, { useEffect, useState } from 'react';
import { getHistory } from '../../api';

export default function RecentlyAnalyzed() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getHistory();
                setHistory(data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };

        fetchHistory();
        // Poll every 5 seconds for updates
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-bg-card/40 p-6 rounded-2xl border border-border-subtle">
            <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Recently Analyzed
                </p>
                <span className="text-[10px] bg-bg-deep px-2 py-1 rounded text-gray-400">Real-time</span>
            </div>

            <div className="space-y-3">
                {history.length === 0 ? (
                    <p className="text-xs text-gray-600 italic">No recent analyses found.</p>
                ) : (
                    history.map((file, i) => (
                        <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 rounded -mx-2 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={`w-1.5 h-1.5 rounded-full ${file.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></span>
                                <p className="text-sm text-gray-300 group-hover:text-white transition-colors truncate max-w-[150px]">{file.name}</p>
                            </div>
                            <span className="text-[10px] text-gray-600 font-mono">{file.time}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
