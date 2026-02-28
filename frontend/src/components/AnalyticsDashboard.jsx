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
    ArcElement,
    Filler
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
    ArcElement,
    Filler
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
        <div className="flex justify-center items-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-gray-800 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Loading analytics warehouse...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="bg-[#0f172a] p-10 rounded-3xl border border-red-500/20 text-center shadow-card max-w-lg">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiXCircle className="text-red-500 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Access Restricted</h3>
                <p className="text-gray-400 mb-6">{error}</p>
            </div>
        </div>
    );

    if (!data) return null;

    // Chart Design System Tokens
    const chartSettings = {
        grid: { color: 'rgba(255, 255, 255, 0.05)', tickColor: 'transparent' },
        ticks: { color: '#9CA3AF', font: { family: "'Inter', sans-serif", size: 11 } },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            usePointStyle: true,
            titleFont: { family: "'Inter', sans-serif", size: 13, weight: 'bold' },
            bodyFont: { family: "'Inter', sans-serif", size: 12 }
        }
    };

    const skillsData = {
        labels: data.top_skills_demand || [],
        datasets: [
            {
                label: 'Skill Demand',
                data: [65, 59, 80, 81],
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 32,
            },
        ],
    };

    const successRateData = {
        labels: ['Success', 'Failed'],
        datasets: [
            {
                data: [
                    (data.model_health?.success_rate || 0) * 100,
                    (1 - (data.model_health?.success_rate || 0)) * 100
                ],
                backgroundColor: ['#10B981', '#334155'],
                hoverBackgroundColor: ['#34D399', '#475569'],
                borderWidth: 0,
                cutout: '80%',
            },
        ],
    };

    const dailyData = detailedData?.daily || [];
    const trendData = {
        labels: dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).reverse(),
        datasets: [
            {
                label: 'Analyses Run',
                data: dailyData.map(d => d.jobs).reverse(),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderWidth: 2,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Resumes Parsed',
                data: dailyData.map(d => d.resumes).reverse(),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                borderWidth: 2,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#06b6d4',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true,
            }
        ],
    };

    const hourlyData = detailedData?.hourly || [];
    const hourlyChartData = {
        labels: hourlyData.map(h => new Date(h.hour).toLocaleTimeString('en-US', { hour: 'numeric' })).reverse().slice(0, 12),
        datasets: [
            {
                label: 'Compute Jobs',
                data: hourlyData.map(h => h.jobs).reverse().slice(0, 12),
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                hoverBackgroundColor: 'rgba(192, 132, 252, 1)',
                borderRadius: 4,
                barThickness: 24,
            },
        ],
    };

    return (
        <div className="animate-fade-in p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight mb-2">Metrics Dashboard</h1>
                    <p className="text-lg text-gray-400 font-light">Real-time macro insights into system performance</p>
                </div>
            </header>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Analyses"
                    value={data.total_analyses}
                    icon={<FiUsers />}
                    color="blue"
                    trend="+12% this week"
                />
                <MetricCard
                    title="Resumes Processed"
                    value={data.model_health?.total_resumes_processed || 0}
                    icon={<FiFileText />}
                    color="emerald"
                    trend="AI Extracted"
                />
                <MetricCard
                    title="Avg Match Score"
                    value={`${((data.avg_score || 0) * 100).toFixed(1)}%`}
                    icon={<FiActivity />}
                    color="purple"
                    trend="Target: 75% | +2.1%"
                />
                <MetricCard
                    title="Compute Latency"
                    value={`${(data.model_health?.avg_processing_time || 0).toFixed(2)}s`}
                    icon={<FiClock />}
                    color="indigo"
                    trend="-0.04s vs yesterday"
                />
            </div>

            {/* AI Health Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#0f172a] border border-gray-800 p-8 rounded-2xl shadow-card relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 relative z-10">
                        <FiCheckCircle className="text-emerald-400" />
                        Operation Success Rate
                    </h3>
                    <div className="h-48 flex justify-center relative z-10">
                        <Doughnut
                            data={successRateData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { tooltip: chartSettings.tooltip },
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-6">
                            <div className="text-center">
                                <div className="text-4xl font-black text-emerald-400">
                                    {((data.model_health?.success_rate || 0) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[#0f172a] border border-gray-800 p-8 rounded-2xl shadow-card">
                    <h3 className="text-white font-bold mb-8 flex items-center gap-2">
                        <FiCpu className="text-primary" />
                        Inference Engine Diagnostics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <HealthStatBlock label="Drift Detected" value={data.model_health?.drift_detected ? 'Yes' : 'No'} highlight={data.model_health?.drift_detected ? 'text-amber-400' : 'text-emerald-400'} />
                        <HealthStatBlock label="Drift Magnitude" value={(data.model_health?.drift_magnitude || 0).toFixed(3)} />
                        <HealthStatBlock label="Global Mean Score" value={`${((data.model_health?.mean_score || 0) * 100).toFixed(1)}%`} />
                        <HealthStatBlock label="Sample Volume" value={data.model_health?.sample_size || 0} />
                    </div>
                </div>
            </div>

            {/* Data Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0f172a] border border-gray-800 p-8 rounded-2xl shadow-card">
                    <h3 className="text-white font-bold mb-6 tracking-wide">In-Demand Compentencies</h3>
                    <div className="h-72">
                        <Bar
                            data={skillsData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: chartSettings.tooltip },
                                scales: {
                                    y: { ticks: chartSettings.ticks, grid: chartSettings.grid, beginAtZero: true },
                                    x: { ticks: chartSettings.ticks, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 p-8 rounded-2xl shadow-card">
                    <h3 className="text-white font-bold mb-6 tracking-wide">Throughput (Last 12H)</h3>
                    <div className="h-72">
                        <Bar
                            data={hourlyChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: chartSettings.tooltip },
                                scales: {
                                    y: { ticks: { ...chartSettings.ticks, stepSize: 1 }, grid: chartSettings.grid, beginAtZero: true },
                                    x: { ticks: chartSettings.ticks, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Full Width Line Chart */}
            <div className="bg-[#0f172a] border border-gray-800 p-8 rounded-2xl shadow-card mb-10">
                <h3 className="text-white font-bold mb-8 tracking-wide">Historical Processing Volume (7 Days)</h3>
                <div className="h-96">
                    <Line
                        data={trendData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: { mode: 'index', intersect: false },
                            plugins: {
                                legend: { labels: { color: '#cbd5e1', font: { family: "'Inter', sans-serif" }, usePointStyle: true }, position: 'top', align: 'end' },
                                tooltip: chartSettings.tooltip
                            },
                            scales: {
                                y: { ticks: chartSettings.ticks, grid: chartSettings.grid, beginAtZero: true },
                                x: { ticks: chartSettings.ticks, grid: chartSettings.grid }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

function MetricCard({ title, value, icon, color, trend }) {
    const colors = {
        blue: 'text-blue-400 from-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        emerald: 'text-emerald-400 from-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        purple: 'text-purple-400 from-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
        indigo: 'text-indigo-400 from-indigo-500/10 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
    };

    return (
        <div className={`bg-[#0f172a] rounded-2xl p-6 border group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-gradient-to-br to-transparent ${colors[color]}`}>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
                <div className={`p-2.5 rounded-xl bg-[#050B14] shadow-inner ${colors[color].split(' ')[0]}`}>
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-4xl font-black text-white mb-2">{value}</h3>
                <p className="text-xs font-semibold opacity-80">{trend}</p>
            </div>
        </div>
    );
}

function HealthStatBlock({ label, value, highlight = 'text-white' }) {
    return (
        <div className="bg-[#050B14] p-5 rounded-xl border border-gray-800 shadow-inner">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1.5">{label}</p>
            <p className={`text-2xl font-black ${highlight}`}>{value}</p>
        </div>
    );
}

export default AnalyticsDashboard;
