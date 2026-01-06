import React from 'react';
import { Play, Pause, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const CampaignHistory = () => {
    const campaigns = [
        { id: 1, name: 'New Year Promo', status: 'Completed', sent: 1250, delivered: 1240, read: 980, date: '2025-01-01' },
        { id: 2, name: 'Weekly Update', status: 'In Progress', sent: 500, delivered: 480, read: 200, date: '2026-01-06' },
        { id: 3, name: 'Survey Request', status: 'Scheduled', sent: 0, delivered: 0, read: 0, date: '2026-01-07' },
        { id: 4, name: 'Draft Campaign', status: 'Draft', sent: 0, delivered: 0, read: 0, date: '-' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Scheduled': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Campaigns</h1>
                <div className="flex gap-2">
                    <select className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Completed</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-lg truncate">{campaign.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                    {campaign.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                                <span className="flex items-center gap-1"><Clock size={14} /> {campaign.date}</span>
                                <span>•</span>
                                <span>ID: #{campaign.id}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 text-sm">
                            <div className="text-center">
                                <p className="font-bold text-lg">{campaign.sent}</p>
                                <p className="text-gray-500 text-xs">Sent</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-green-600 dark:text-green-400">{campaign.delivered}</p>
                                <p className="text-gray-500 text-xs">Delivered</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{campaign.read} <span className="text-xs text-gray-400 font-normal">({Math.round(campaign.read / campaign.delivered * 100 || 0)}%)</span></p>
                                <p className="text-gray-500 text-xs">Read</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {campaign.status === 'In Progress' && (
                                <button className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors" title="Pause">
                                    <Pause size={20} />
                                </button>
                            )}
                            <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
                                View Report
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CampaignHistory;
