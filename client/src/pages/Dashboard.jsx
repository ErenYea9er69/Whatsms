import React from 'react';
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
    Activity
} from 'lucide-react';

const Dashboard = () => {
    const stats = [
        {
            label: 'Total Campaigns',
            value: '12',
            change: '+3 this month',
            trend: 'up',
            icon: Megaphone
        },
        {
            label: 'Messages Sent',
            value: '1,234',
            change: '+18% vs last week',
            trend: 'up',
            icon: Send
        },
        {
            label: 'Total Contacts',
            value: '5,678',
            change: '+124 new',
            trend: 'up',
            icon: Users
        },
        {
            label: 'Pending',
            value: '45',
            change: '3 scheduled today',
            trend: 'neutral',
            icon: Clock
        },
    ];

    const recentActivity = [
        { id: 1, action: 'Campaign "New Year Promo" completed', time: '2 hours ago', type: 'success' },
        { id: 2, action: '124 new contacts imported', time: '5 hours ago', type: 'info' },
        { id: 3, action: 'Campaign "Weekly Update" started', time: '1 day ago', type: 'info' },
        { id: 4, action: 'Campaign "Survey Request" scheduled', time: '2 days ago', type: 'pending' },
    ];

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
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-soft card-hover">
                        <Upload size={18} className="icon-gray" strokeWidth={1.75} />
                        <span>Import</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow">
                        <Plus size={18} strokeWidth={2} />
                        <span>New Campaign</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
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
                                <h3 className="font-semibold">Campaign Analytics</h3>
                                <p className="text-xs text-gray-400">Messages sent over time</p>
                            </div>
                        </div>
                        <select className="text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 outline-none">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                        </select>
                    </div>

                    {/* Chart Placeholder with visual bars */}
                    <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        {[65, 45, 78, 52, 90, 68, 85].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t-lg transition-all duration-500 hover:from-primary hover:to-primary-dark"
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-xs text-gray-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-gray-500">Messages Sent</span>
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
                            <h3 className="font-semibold">Recent Activity</h3>
                            <p className="text-xs text-gray-400">Latest updates</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
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
                        ))}
                    </div>

                    <button className="w-full mt-6 py-2.5 text-sm text-primary font-medium hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors flex items-center justify-center gap-1">
                        View All Activity
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
