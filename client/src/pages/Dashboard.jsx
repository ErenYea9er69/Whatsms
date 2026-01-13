import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Megaphone,
    Send,
    Users,
    Clock,
    TrendingUp,
    ArrowUpRight,
    Plus,
    Upload,
    BarChart3,
    Activity,
    RefreshCw,
    Sparkles,
    CheckSquare,
    Square,
    X,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import api from '../services/api';
import AiService from '../services/ai';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [campaignStats, setCampaignStats] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [insights, setInsights] = useState([]);

    // Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisScope, setAnalysisScope] = useState('all'); // 'all' | 'select'
    const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Generate mock trend data for last 7 days
    const generateTrendData = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day, i) => ({
            name: day,
            sent: Math.floor(Math.random() * 500) + 100,
            delivered: Math.floor(Math.random() * 450) + 80,
            read: Math.floor(Math.random() * 300) + 50,
        }));
    };

    const [trendData] = useState(generateTrendData);

    // Generate campaign comparison data
    const getCampaignComparisonData = () => {
        return campaigns.slice(0, 5).map(c => ({
            name: c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name,
            delivered: c.statsDelivered || 0,
            read: c.statsRead || 0,
            replied: c.statsReplied || 0,
        }));
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [contactStats, cmpStats, recentCampaigns] = await Promise.all([
                api.getContactStats(),
                api.getCampaignStats(),
                api.getCampaigns({ limit: 5 }),
            ]);

            setStats(contactStats);
            setCampaignStats(cmpStats);
            setCampaigns(recentCampaigns.campaigns || []);
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const ids = analysisScope === 'select' ? selectedCampaignIds : [];
            const newInsights = await AiService.getAnalyticsInsights(ids);
            setInsights(newInsights || []);
            setShowAnalysisModal(false);
        } catch (err) {
            console.error(err);
            alert('Failed to generate insights');
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleCampaignSelection = (id) => {
        setSelectedCampaignIds(prev =>
            prev.includes(id)
                ? prev.filter(cid => cid !== id)
                : [...prev, id]
        );
    };

    const statCards = [
        {
            label: 'Total Campaigns',
            value: campaignStats?.totalCampaigns ?? '-',
            change: `${campaignStats?.activeCampaigns ?? 0} active`,
            trend: campaignStats?.activeCampaigns > 0 ? 'up' : 'neutral',
            icon: Megaphone
        },
        {
            label: 'Messages Sent',
            value: campaignStats?.totalMessagesSent?.toLocaleString() ?? '-',
            change: `${campaignStats?.deliveryRate ?? 0}% delivery rate`,
            trend: 'up',
            icon: Send
        },
        {
            label: 'Total Contacts',
            value: stats?.total?.toLocaleString() ?? '-',
            change: `+${stats?.thisWeek ?? 0} this week`,
            trend: stats?.thisWeek > 0 ? 'up' : 'neutral',
            icon: Users
        },
        {
            label: 'Contact Lists',
            value: stats?.listsCount ?? '-',
            change: 'Active lists',
            trend: 'neutral',
            icon: Clock
        },
    ];

    const getRecentActivity = () => {
        return campaigns.slice(0, 4).map(campaign => ({
            id: campaign.id,
            action: `Campaign "${campaign.name}" ${campaign.status.toLowerCase().replace('_', ' ')}`,
            time: new Date(campaign.updatedAt).toLocaleDateString(),
            type: campaign.status === 'COMPLETED' ? 'success' :
                campaign.status === 'IN_PROGRESS' ? 'info' : 'pending'
        }));
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg skeleton" />
                        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mt-2 skeleton" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-xl skeleton" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-4 skeleton" />
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded mt-2 skeleton" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Welcome back! Here's an overview of your campaigns.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/contacts')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-soft card-hover"
                    >
                        <Upload size={18} className="icon-gray" strokeWidth={1.75} />
                        <span>Import</span>
                    </button>
                    <button
                        onClick={() => navigate('/campaigns/new')}
                        className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                    >
                        <Plus size={18} strokeWidth={2} />
                        <span>New Campaign</span>
                    </button>
                </div>
            </div>

            {/* AI Insights Widget */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-soft relative overflow-hidden animate-slide-up">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold">AI Performance Insights</h2>
                        </div>
                        <button
                            onClick={() => setShowAnalysisModal(true)}
                            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {insights.length > 0 ? 'Analyze Again' : 'Analyze Performance'}
                        </button>
                    </div>

                    {analyzing ? (
                        <div className="flex items-center gap-3 py-4">
                            <Loader2 size={24} className="animate-spin" />
                            <p>Analyzing campaign data...</p>
                        </div>
                    ) : insights.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-4">
                            {insights.map((insight, idx) => (
                                <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                                    <p className="text-sm leading-relaxed opacity-90">{insight}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-4 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                            <p className="opacity-80 mb-2">Get AI-powered recommendations to improve your delivery and read rates.</p>
                            <button
                                onClick={() => setShowAnalysisModal(true)}
                                className="text-sm underline hover:text-white/80"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis Modal */}
            {showAnalysisModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Configure Analysis</h3>
                            <button onClick={() => setShowAnalysisModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div
                                onClick={() => setAnalysisScope('all')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${analysisScope === 'all'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${analysisScope === 'all' ? 'border-primary' : 'border-gray-300'
                                        }`}>
                                        {analysisScope === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <p className="font-medium">Analyze All Data</p>
                                        <p className="text-xs text-gray-500">Includes all past campaigns</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setAnalysisScope('select')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${analysisScope === 'select'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${analysisScope === 'select' ? 'border-primary' : 'border-gray-300'
                                        }`}>
                                        {analysisScope === 'select' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <p className="font-medium">Select Specific Campaigns</p>
                                        <p className="text-xs text-gray-500">Compare specific blasts</p>
                                    </div>
                                </div>

                                {analysisScope === 'select' && (
                                    <div className="pl-8 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {campaigns.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCampaignSelection(c.id);
                                                }}
                                                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer"
                                            >
                                                {selectedCampaignIds.includes(c.id)
                                                    ? <CheckSquare size={18} className="text-primary" />
                                                    : <Square size={18} className="text-gray-400" />
                                                }
                                                <span className="text-sm truncate">{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowAnalysisModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing || (analysisScope === 'select' && selectedCampaignIds.length === 0)}
                                className="flex items-center gap-2 px-6 py-2 btn-primary text-white rounded-lg font-medium shadow-glow disabled:opacity-50"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        <span>Generate Insights</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`stat-card bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 card-hover animate-slide-up stagger-${index + 1}`}
                        style={{ opacity: 0 }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center">
                                <stat.icon size={22} className="icon-gray" strokeWidth={1.75} />
                            </div>
                            {stat.trend === 'up' && (
                                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                                    <TrendingUp size={12} />
                                    <span>Up</span>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{stat.change}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Message Trends Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 animate-slide-up stagger-5" style={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Activity size={20} className="text-white" strokeWidth={1.75} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Message Trends</h3>
                                <p className="text-xs text-gray-400">Last 7 days</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" name="Sent" />
                                <Area type="monotone" dataKey="delivered" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDelivered)" name="Delivered" />
                                <Area type="monotone" dataKey="read" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRead)" name="Read" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-gray-500">Sent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-gray-500">Delivered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-xs text-gray-500">Read</span>
                        </div>
                    </div>
                </div>

                {/* Campaign Comparison Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 animate-slide-up stagger-6" style={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <BarChart3 size={20} className="text-white" strokeWidth={1.75} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Campaign Comparison</h3>
                                <p className="text-xs text-gray-400">Recent campaigns</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        {campaigns.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getCampaignComparisonData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="delivered" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivered" />
                                    <Bar dataKey="read" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Read" />
                                    <Bar dataKey="replied" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Replied" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-400 text-sm">No campaigns yet</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-gray-500">Delivered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-gray-500">Read</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-xs text-gray-500">Replied</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Stats */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 animate-slide-up stagger-7" style={{ opacity: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center">
                            <TrendingUp size={20} className="icon-gray" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h3 className="font-semibold">Performance Overview</h3>
                            <p className="text-xs text-gray-400">Message delivery metrics</p>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{campaignStats?.totalDelivered?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Delivered</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{campaignStats?.totalRead?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Read</p>
                        </div>
                        <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{campaignStats?.totalReplied?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Replied</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{campaignStats?.totalFailed?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Failed</p>
                        </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Delivery Rate</span>
                                <span className="font-semibold text-emerald-600">{campaignStats?.deliveryRate ?? 0}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${campaignStats?.deliveryRate ?? 0}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Read Rate</span>
                                <span className="font-semibold text-blue-600">{campaignStats?.readRate ?? 0}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${campaignStats?.readRate ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 animate-slide-up stagger-8" style={{ opacity: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center">
                            <Activity size={20} className="icon-gray" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h3 className="font-semibold">Recent Campaigns</h3>
                            <p className="text-xs text-gray-400">Latest updates</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {getRecentActivity().length > 0 ? (
                            getRecentActivity().map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 group">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.type === 'success' ? 'bg-emerald-500' :
                                        activity.type === 'pending' ? 'bg-amber-500' : 'bg-primary'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                            {activity.action}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">No campaigns yet</p>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/campaigns')}
                        className="w-full mt-6 py-2.5 text-sm text-primary font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                        View All Campaigns
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

