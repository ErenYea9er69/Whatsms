import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';

const Settings = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {[
                    {
                        icon: User,
                        title: 'Profile',
                        description: 'Update your account information',
                        status: 'Coming Soon'
                    },
                    {
                        icon: Bell,
                        title: 'Notifications',
                        description: 'Configure notification preferences',
                        status: 'Coming Soon'
                    },
                    {
                        icon: Shield,
                        title: 'Security',
                        description: 'Password and security settings',
                        status: 'Coming Soon'
                    },
                    {
                        icon: Database,
                        title: 'WhatsApp API',
                        description: 'Configure WhatsApp Business API credentials',
                        status: 'Coming Soon'
                    },
                ].map((item, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 card-hover"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <item.icon size={22} className="icon-gray" strokeWidth={1.75} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{item.title}</h3>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
