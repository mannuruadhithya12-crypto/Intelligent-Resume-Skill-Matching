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
                <div className="w-16 h-16 border-4 border-[#E9E1DC] border-t-primary-sage rounded-full animate-spin"></div>
                <p className="text-text-secondary font-medium animate-pulse">Loading analytics warehouse...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="bg-white p-10 rounded-3xl border border-[#FFCDD2] text-center shadow-paper max-w-lg">
                <div className="w-20 h-20 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiXCircle className="text-[#C62828] text-4xl" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-text-primary mb-2">Access Restricted</h3>
                <p className="text-text-secondary mb-6">{error}</p>
            </div>
        </div>
    );

    if (!data) return null;

    // Chart Design System Tokens for Light Theme
    const chartSettings = {
        grid: { color: 'rgba(30, 27, 24, 0.05)', tickColor: 'transparent' },
        ticks: { color: '#6A6258', font: { family: "'Manrope', sans-serif", size: 11, weight: 'bold' } },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1E1B18',
            bodyColor: '#6A6258',
            borderColor: 'rgba(30, 27, 24, 0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            usePointStyle: true,
            titleFont: { family: "'Manrope', sans-serif", size: 13, weight: 'bold' },
            bodyFont: { family: "'Manrope', sans-serif", size: 12, weight: '500' }
        }
    };

    const skillsData = {
        labels: data.top_skills_demand || [],
        datasets: [
            {
                label: 'Skill Demand',
                data: [65, 59, 80, 81],
                backgroundColor: 'rgba(51, 79, 43, 0.8)', // Primary Sage
                hoverBackgroundColor: 'rgba(51, 79, 43, 1)',
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
                backgroundColor: ['#334F2B', '#E9E1DC'], // Primary Sage and outline
                hoverBackgroundColor: ['#2b4224', '#D1C8C0'],
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
                borderColor: '#334F2B', // Sage
                backgroundColor: 'rgba(51, 79, 43, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#334F2B',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Resumes Parsed',
                data: dailyData.map(d => d.resumes).reverse(),
                borderColor: '#974725', // Terracotta
                backgroundColor: 'rgba(151, 71, 37, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#974725',
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
                backgroundColor: 'rgba(151, 71, 37, 0.8)', // Terracotta
                hoverBackgroundColor: 'rgba(151, 71, 37, 1)',
                borderRadius: 4,
                barThickness: 24,
            },
        ],
    };

    return (
        <div className="animate-fade-in p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E9E1DC] pb-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-serif font-black text-text-primary tracking-tight mb-2">Metrics Dashboard</h1>
                    <p className="text-lg text-text-secondary font-medium">Real-time macro insights into system performance</p>
                </div>
            </header>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Analyses"
                    value={data.total_analyses}
                    icon={<FiUsers />}
                    color="sage"
                    trend="+12% this week"
                />
                <MetricCard
                    title="Resumes Processed"
                    value={data.model_health?.total_resumes_processed || 0}
                    icon={<FiFileText />}
                    color="terracotta"
                    trend="AI Extracted"
                />
                <MetricCard
                    title="Avg Match Score"
                    value={`${((data.avg_score || 0) * 100).toFixed(1)}%`}
                    icon={<FiActivity />}
                    color="navy"
                    trend="Target: 75% | +2.1%"
                />
                <MetricCard
                    title="Compute Latency"
                    value={`${(data.model_health?.avg_processing_time || 0).toFixed(2)}s`}
                    icon={<FiClock />}
                    color="gold"
                    trend="-0.04s vs yesterday"
                />
            </div>

            {/* AI Health Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-[#E9E1DC] p-8 rounded-2xl shadow-paper relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[#CAECBC]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="text-text-primary font-bold mb-6 flex items-center gap-2 relative z-10 text-[15px]">
                        <FiCheckCircle className="text-primary-sage" />
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
                                <div className="text-4xl font-black text-primary-sage font-serif">
                                    {((data.model_health?.success_rate || 0) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-[#E9E1DC] p-8 rounded-2xl shadow-paper">
                    <h3 className="text-text-primary font-bold mb-8 flex items-center gap-2 text-[15px]">
                        <FiCpu className="text-primary-sage" />
                        Inference Engine Diagnostics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <HealthStatBlock label="Drift Detected" value={data.model_health?.drift_detected ? 'Yes' : 'No'} highlight={data.model_health?.drift_detected ? 'text-[#E65100]' : 'text-primary-sage'} />
                        <HealthStatBlock label="Drift Magnitude" value={(data.model_health?.drift_magnitude || 0).toFixed(3)} />
                        <HealthStatBlock label="Global Mean Score" value={`${((data.model_health?.mean_score || 0) * 100).toFixed(1)}%`} />
                        <HealthStatBlock label="Sample Volume" value={data.model_health?.sample_size || 0} />
                    </div>
                </div>
            </div>

            {/* Data Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E9E1DC] p-8 rounded-2xl shadow-paper">
                    <h3 className="text-text-primary font-bold mb-6 tracking-wide text-[15px]">In-Demand Compentencies</h3>
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

                <div className="bg-white border border-[#E9E1DC] p-8 rounded-2xl shadow-paper">
                    <h3 className="text-text-primary font-bold mb-6 tracking-wide text-[15px]">Throughput (Last 12H)</h3>
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
            <div className="bg-white border border-[#E9E1DC] p-8 rounded-2xl shadow-paper mb-10">
                <h3 className="text-text-primary font-bold mb-8 tracking-wide text-[15px]">Historical Processing Volume (7 Days)</h3>
                <div className="h-96">
                    <Line
                        data={trendData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: { mode: 'index', intersect: false },
                            plugins: {
                                legend: { labels: { color: '#6A6258', font: { family: "'Manrope', sans-serif", weight: 'bold' }, usePointStyle: true }, position: 'top', align: 'end' },
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
    // Elegant, natural colors replacing neon
    const colors = {
        sage: 'text-primary-sage bg-[#FBF9F4] border-[#E9E1DC] shadow-sm',
        terracotta: 'text-[#974725] bg-[#FFF8F5] border-[#F2DFD8] shadow-sm',
        navy: 'text-[#1E293B] bg-[#F8FAFC] border-[#E2E8F0] shadow-sm',
        gold: 'text-[#B45309] bg-[#FFFBEB] border-[#FEF3C7] shadow-sm'
    };

    return (
        <div className={`rounded-2xl p-6 border group hover:shadow-paper transition-all duration-300 relative overflow-hidden ${colors[color]}`}>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-outline">{title}</p>
                <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-transparent group-hover:border-current transition-colors opacity-80`}>
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-4xl font-black font-serif text-text-primary mb-2">{value}</h3>
                <p className="text-[13px] font-bold opacity-80">{trend}</p>
            </div>
        </div>
    );
}

function HealthStatBlock({ label, value, highlight = 'text-text-primary' }) {
    return (
        <div className="bg-[#FBF9F4] p-5 rounded-xl border border-[#E9E1DC] shadow-sm">
            <p className="text-[11px] uppercase font-bold text-outline tracking-widest mb-1.5">{label}</p>
            <p className={`text-2xl font-black font-serif ${highlight}`}>{value}</p>
        </div>
    );
}

export default AnalyticsDashboard;
