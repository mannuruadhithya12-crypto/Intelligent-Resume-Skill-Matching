import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { FiTrendingUp, FiUsers, FiActivity, FiCpu, FiFileText, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [detailedData, setDetailedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [basicResponse, detailedResponse] = await Promise.all([
                    api.get('/analytics'),
                    api.get('/analytics/detailed')
                ]);
                setData(basicResponse.data);
                setDetailedData(detailedResponse.data);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 403) {
                    setError("You do not have permission to view this data.");
                } else {
                    setError("Failed to load analytics.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-full text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-full text-red-400">
            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">
                <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                <p>{error}</p>
            </div>
        </div>
    );

    if (!data) return null;

    const skillsData = {
        labels: data.top_skills_demand || [],
        datasets: [
            {
                label: 'Skill Demand',
                data: [65, 59, 80, 81],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                ],
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    const successRateData = {
        labels: ['Success', 'Failed'],
        datasets: [
            {
                label: 'Analysis Success Rate',
                data: [
                    (data.model_health?.success_rate || 0) * 100,
                    (1 - (data.model_health?.success_rate || 0)) * 100
                ],
                backgroundColor: ['#10B981', '#EF4444'],
                borderWidth: 0,
            },
        ],
    };

    // Daily trend data
    const dailyData = detailedData?.daily || [];
    const trendData = {
        labels: dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).reverse(),
        datasets: [
            {
                label: 'Analyses per Day',
                data: dailyData.map(d => d.jobs).reverse(),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Resumes Processed',
                data: dailyData.map(d => d.resumes).reverse(),
                borderColor: 'rgb(34, 211, 238)',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ],
    };

    // Hourly data for last 24 hours
    const hourlyData = detailedData?.hourly || [];
    const hourlyChartData = {
        labels: hourlyData.map(h => new Date(h.hour).toLocaleTimeString('en-US', { hour: 'numeric' })).reverse().slice(0, 12),
        datasets: [
            {
                label: 'Jobs per Hour',
                data: hourlyData.map(h => h.jobs).reverse().slice(0, 12),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 2,
                borderRadius: 6,
            },
        ],
    };

    return (
        <div className="animate-fade-in p-6 space-y-6">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">AI Recruitment Analytics</h2>
                <p className="text-slate-400">Real-time insights into your AI-powered hiring process</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-sm font-medium">Total Analyses</h3>
                        <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400"><FiUsers /></div>
                    </div>
                    <div className="text-3xl font-bold text-white">{data.total_analyses}</div>
                    <div className="text-xs text-emerald-400 mt-2 flex items-center">
                        <FiTrendingUp className="mr-1" /> Last 7 days
                    </div>
                </div>

                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-sm font-medium">Resumes Analyzed</h3>
                        <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400"><FiFileText /></div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {data.model_health?.total_resumes_processed || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">By AI Engine</div>
                </div>

                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl hover:border-cyan-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-sm font-medium">Avg Match Score</h3>
                        <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400"><FiActivity /></div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {((data.avg_score || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Target: 75%</div>
                </div>

                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl hover:border-purple-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-sm font-medium">Avg Processing</h3>
                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400"><FiClock /></div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {(data.model_health?.avg_processing_time || 0).toFixed(1)}s
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Per analysis</div>
                </div>
            </div>

            {/* Success Rate & Model Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-6 flex items-center">
                        <FiCheckCircle className="mr-2 text-emerald-400" />
                        Success Rate
                    </h3>
                    <div className="h-64 flex justify-center relative">
                        <Doughnut
                            data={successRateData}
                            options={{
                                cutout: '70%',
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#9CA3AF', font: { size: 12 } }
                                    }
                                }
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">
                                    {((data.model_health?.success_rate || 0) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">Success</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-bg-card border border-border-subtle p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-6 flex items-center">
                        <FiCpu className="mr-2 text-amber-400" />
                        Model Health Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Drift Detected</div>
                            <div className="text-2xl font-bold text-white">
                                {data.model_health?.drift_detected ?
                                    <span className="text-amber-400">Yes</span> :
                                    <span className="text-emerald-400">No</span>
                                }
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Drift Magnitude</div>
                            <div className="text-2xl font-bold text-white">
                                {(data.model_health?.drift_magnitude || 0).toFixed(3)}
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Mean Score</div>
                            <div className="text-2xl font-bold text-white">
                                {((data.model_health?.mean_score || 0) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Sample Size</div>
                            <div className="text-2xl font-bold text-white">
                                {data.model_health?.sample_size || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-6">Top Skills in Demand</h3>
                    <div className="h-64 flex justify-center">
                        <Bar
                            data={skillsData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        ticks: { color: '#9CA3AF' },
                                        grid: { color: '#374151' },
                                        beginAtZero: true
                                    },
                                    x: {
                                        ticks: { color: '#9CA3AF' },
                                        grid: { display: false }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl">
                    <h3 className="text-white font-bold mb-6">Last 12 Hours Activity</h3>
                    <div className="h-64 flex justify-center">
                        <Bar
                            data={hourlyChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        ticks: { color: '#9CA3AF', stepSize: 1 },
                                        grid: { color: '#374151' },
                                        beginAtZero: true
                                    },
                                    x: {
                                        ticks: { color: '#9CA3AF' },
                                        grid: { display: false }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-bg-card border border-border-subtle p-6 rounded-xl">
                <h3 className="text-white font-bold mb-6">7-Day Trend Analysis</h3>
                <div className="h-80">
                    <Line
                        data={trendData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: { color: '#9CA3AF' },
                                    position: 'top'
                                }
                            },
                            scales: {
                                y: {
                                    ticks: { color: '#9CA3AF' },
                                    grid: { color: '#374151' },
                                    beginAtZero: true
                                },
                                x: {
                                    ticks: { color: '#9CA3AF' },
                                    grid: { color: '#374151' }
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
