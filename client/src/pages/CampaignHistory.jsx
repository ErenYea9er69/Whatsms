import React from 'react';
import { Play, Pause, Clock, CheckCircle, AlertCircle, Calendar, MoreHorizontal, TrendingUp, Eye, Send } from 'lucide-react';

const CampaignHistory = () => {
    const campaigns = [
        { id: 1, name: 'New Year Promo', status: 'Completed', sent: 1250, delivered: 1240, read: 980, date: '2025-01-01' },
        { id: 2, name: 'Weekly Update', status: 'In Progress', sent: 500, delivered: 480, read: 200, date: '2026-01-06' },
        { id: 3, name: 'Survey Request', status: 'Scheduled', sent: 0, delivered: 0, read: 0, date: '2026-01-07' },
        { id: 4, name: 'Draft Campaign', status: 'Draft', sent: 0, delivered: 0, read: 0, date: '-' },
    ];

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Completed':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    icon: CheckCircle
                };
            case 'In Progress':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    text: 'text-blue-600 dark:text-blue-400',
                    icon: Play
                };
            case 'Scheduled':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    text: 'text-amber-600 dark:text-amber-400',
                    icon: Calendar
                };
            default:
                return {
                    bg: 'bg-gray-100 dark:bg-gray-800',
                    text: 'text-gray-600 dark:text-gray-400',
                    icon: AlertCircle
                };
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your campaign history</p>
                </div>
                <div className="flex gap-3">
                    <select className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none shadow-soft">
                        <option>All Status</option>
                        <option>Completed</option>
                        <option>In Progress</option>
                        <option>Scheduled</option>
                        <option>Draft</option>
                    </select>
                    <select className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none shadow-soft">
                        <option>Last 30 days</option>
                        <option>Last 7 days</option>
                        <option>Last 90 days</option>
                        <option>All time</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Campaigns', value: '12', icon: Send },
                    { label: 'Messages Sent', value: '3,890', icon: TrendingUp },
                    { label: 'Avg. Delivery Rate', value: '98.2%', icon: CheckCircle },
                    { label: 'Avg. Read Rate', value: '68%', icon: Eye },
                ].map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-surface-dark px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800/80 shadow-soft flex items-center gap-3">
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

            {/* Campaign Cards */}
            <div className="space-y-4">
                {campaigns.map((campaign, index) => {
                    const statusConfig = getStatusConfig(campaign.status);
                    const StatusIcon = statusConfig.icon;
                    const deliveryRate = campaign.sent > 0 ? Math.round((campaign.delivered / campaign.sent) * 100) : 0;
                    const readRate = campaign.delivered > 0 ? Math.round((campaign.read / campaign.delivered) * 100) : 0;

                    return (
                        <div
                            key={campaign.id}
                            className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 card-hover animate-slide-up group"
                            style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Campaign Info */}
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-xl ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
                                        <StatusIcon size={20} className={statusConfig.text} strokeWidth={1.75} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-lg truncate">{campaign.name}</h3>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} className="icon-gray" strokeWidth={1.75} />
                                                {campaign.date}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span>Campaign #{campaign.id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                {campaign.status !== 'Draft' && campaign.status !== 'Scheduled' && (
                                    <div className="flex items-center gap-6 lg:gap-8">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">{campaign.sent.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Sent</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">
                                                {campaign.delivered.toLocaleString()}
                                                <span className="text-xs text-gray-400 font-normal ml-1">({deliveryRate}%)</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">Delivered</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">
                                                {campaign.read.toLocaleString()}
                                                <span className="text-xs text-gray-400 font-normal ml-1">({readRate}%)</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">Read</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 lg:ml-4">
                                    {campaign.status === 'In Progress' && (
                                        <button
                                            className="p-2.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl transition-colors"
                                            title="Pause Campaign"
                                        >
                                            <Pause size={18} strokeWidth={1.75} />
                                        </button>
                                    )}
                                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
                                        View Report
                                    </button>
                                    <button className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                                        <MoreHorizontal size={18} strokeWidth={1.75} />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar for In Progress campaigns */}
                            {campaign.status === 'In Progress' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-500">Progress</span>
                                        <span className="font-medium">{deliveryRate}% delivered</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-500"
                                            style={{ width: `${deliveryRate}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State for when there are no campaigns */}
            {campaigns.length === 0 && (
                <div className="bg-white dark:bg-surface-dark p-12 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <Send size={28} className="icon-gray" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first campaign to start reaching your audience</p>
                    <button className="px-6 py-2.5 btn-primary text-white font-medium rounded-xl shadow-glow">
                        Create Campaign
                    </button>
                </div>
            )}
        </div>
    );
};

export default CampaignHistory;
