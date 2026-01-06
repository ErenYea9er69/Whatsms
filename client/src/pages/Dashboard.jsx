import React from 'react';

const Dashboard = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Welcome back, Admin
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Campaigns', value: '12', color: 'bg-blue-500' },
                    { label: 'Messages Sent', value: '1,234', color: 'bg-green-500' },
                    { label: 'Contacts', value: '5,678', color: 'bg-purple-500' },
                    { label: 'Pending', value: '45', color: 'bg-orange-500' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className={`w-12 h-12 rounded-xl mb-4 ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                            <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex items-center justify-center">
                <p className="text-gray-400">Analytics Chart Placeholder</p>
            </div>
        </div>
    );
};

export default Dashboard;
