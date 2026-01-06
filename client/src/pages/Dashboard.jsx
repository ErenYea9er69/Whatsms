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
    RefreshCw
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [campaignStats, setCampaignStats] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [contactStats, cmpStats, recentCampaigns] = await Promise.all([
                api.getContactStats(),
                api.getCampaignStats(),
                api.getCampaigns({ limit: 5 })
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Analytics Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 animate-slide-up stagger-5" style={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center">
                                <BarChart3 size={20} className="icon-gray" strokeWidth={1.75} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Campaign Performance</h3>
                                <p className="text-xs text-gray-400">Message delivery overview</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-2xl font-bold text-primary">{campaignStats?.totalDelivered?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Delivered</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-2xl font-bold text-emerald-500">{campaignStats?.totalRead?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Read</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-2xl font-bold text-amber-500">{campaignStats?.totalReplied?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Replied</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-2xl font-bold text-red-500">{campaignStats?.totalFailed?.toLocaleString() ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Failed</p>
                        </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Delivery Rate</span>
                                <span className="font-medium">{campaignStats?.deliveryRate ?? 0}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${campaignStats?.deliveryRate ?? 0}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-500">Read Rate</span>
                                <span className="font-medium">{campaignStats?.readRate ?? 0}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${campaignStats?.readRate ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 animate-slide-up stagger-6" style={{ opacity: 0 }}>
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
                        className="w-full mt-6 py-2.5 text-sm text-primary font-medium hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors flex items-center justify-center gap-1"
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
