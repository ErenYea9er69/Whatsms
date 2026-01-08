import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    CheckCircle,
    Clock,
    BarChart3,
    Play,
    Square,
    Trash2,
    RefreshCw,
    Plus,
    Send,
    Eye,
    AlertCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import api from '../services/api';

const CampaignHistory = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [campaignsData, statsData] = await Promise.all([
                api.getCampaigns({ status: filter || undefined, limit: 50 }),
                api.getCampaignStats()
            ]);

            setCampaigns(campaignsData.campaigns || []);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const handleSendCampaign = async (id) => {
        if (!confirm('Start sending this campaign now?')) return;

        try {
            await api.sendCampaign(id);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStopCampaign = async (id) => {
        if (!confirm('Stop this campaign?')) return;

        try {
            await api.stopCampaign(id);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!confirm('Delete this campaign?')) return;

        try {
            await api.deleteCampaign(id);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'COMPLETED':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    text: 'text-blue-600 dark:text-blue-400',
                    icon: CheckCircle,
                    label: 'Completed'
                };
            case 'IN_PROGRESS':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    icon: Play,
                    label: 'In Progress'
                };
            case 'SCHEDULED':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    text: 'text-amber-600 dark:text-amber-400',
                    icon: Clock,
                    label: 'Scheduled'
                };
            case 'STOPPED':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    text: 'text-red-600 dark:text-red-400',
                    icon: XCircle,
                    label: 'Stopped'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-800/50',
                    text: 'text-gray-500 dark:text-gray-400',
                    icon: Clock,
                    label: 'Draft'
                };
        }
    };

    const statSummaries = [
        { label: 'Total Campaigns', value: stats?.totalCampaigns ?? '-', icon: BarChart3 },
        { label: 'Messages Sent', value: stats?.totalMessagesSent?.toLocaleString() ?? '-', icon: Send },
        { label: 'Delivery Rate', value: `${stats?.deliveryRate ?? 0}%`, icon: CheckCircle },
        { label: 'Active Now', value: stats?.activeCampaigns ?? '-', icon: Play },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your marketing campaigns</p>
                </div>
                <button
                    onClick={() => navigate('/campaigns/new')}
                    className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                >
                    <Plus size={18} strokeWidth={2} />
                    <span>New Campaign</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statSummaries.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 shadow-soft flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <stat.icon size={18} className="icon-gray" strokeWidth={1.75} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <button
                    onClick={() => fetchData()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <RefreshCw size={18} className="icon-gray" />
                </button>
                {['', 'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'STOPPED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${filter === status
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {status || 'All'}
                    </button>
                ))}
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={fetchData} className="ml-auto text-sm underline">Retry</button>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl skeleton" />
                                <div className="flex-1">
                                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded skeleton" />
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-2 skeleton" />
                                </div>
                            </div>
                            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl skeleton" />
                        </div>
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark p-12 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={28} className="icon-gray" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {filter ? `No ${filter.toLowerCase().replace('_', ' ')} campaigns found` : 'Create your first campaign to get started'}
                    </p>
                    <button
                        onClick={() => navigate('/campaigns/new')}
                        className="inline-flex items-center gap-2 px-4 py-2 btn-primary text-white rounded-xl font-medium"
                    >
                        <Plus size={18} />
                        Create Campaign
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {campaigns.map((campaign, index) => {
                        const statusConfig = getStatusConfig(campaign.status);
                        const StatusIcon = statusConfig.icon;
                        const successRate = campaign.statsDelivered > 0
                            ? Math.round((campaign.statsRead / campaign.statsDelivered) * 100)
                            : 0;

                        return (
                            <div
                                key={campaign.id}
                                className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 card-hover animate-slide-up group"
                                style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 ${statusConfig.bg} rounded-xl flex items-center justify-center`}>
                                            <StatusIcon size={22} className={statusConfig.text} strokeWidth={1.75} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                <Calendar size={14} className="icon-gray" />
                                                {new Date(campaign.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                                        {statusConfig.label}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <p className="text-lg font-bold">{campaign.recipientCount || 0}</p>
                                        <p className="text-xs text-gray-400">Recipients</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <p className="text-lg font-bold text-blue-600">{campaign.statsDelivered || 0}</p>
                                        <p className="text-xs text-gray-400">Delivered</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <p className="text-lg font-bold text-emerald-600">{campaign.statsRead || 0}</p>
                                        <p className="text-xs text-gray-400">Read</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <p className="text-lg font-bold text-red-600">{campaign.statsFailed || 0}</p>
                                        <p className="text-xs text-gray-400">Failed</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {campaign.status === 'IN_PROGRESS' && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>{campaign.statsDelivered || 0} / {campaign.recipientCount || 0}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500 animate-pulse"
                                                style={{
                                                    width: `${campaign.recipientCount ? (campaign.statsDelivered / campaign.recipientCount) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {campaign.status === 'DRAFT' && (
                                        <button
                                            onClick={() => handleSendCampaign(campaign.id)}
                                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                            title="Send Campaign"
                                        >
                                            <Play size={18} />
                                        </button>
                                    )}
                                    {campaign.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => handleStopCampaign(campaign.id)}
                                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-600 rounded-lg transition-colors"
                                            title="Stop Campaign"
                                        >
                                            <Square size={18} />
                                        </button>
                                    )}
                                    {campaign.status !== 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Delete Campaign"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CampaignHistory;
