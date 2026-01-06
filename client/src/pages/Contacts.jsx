import React, { useState } from 'react';
import { Upload, Search, Filter, Plus, MoreHorizontal, Mail, Phone, Tag } from 'lucide-react';

const Contacts = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Placeholder data
    const contacts = [
        { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com', interests: ['Marketing'], lists: ['VIP Clients'] },
        { id: 2, name: 'Jane Smith', phone: '+9876543210', email: 'jane@example.com', interests: ['Sales', 'Tech'], lists: ['New Leads'] },
        { id: 3, name: 'Alice Johnson', phone: '+1122334455', email: 'alice@example.com', interests: ['Development'], lists: ['Team'] },
        { id: 4, name: 'Bob Williams', phone: '+5566778899', email: 'bob@example.com', interests: ['Design'], lists: ['Partners'] },
        { id: 5, name: 'Emma Davis', phone: '+1231231234', email: 'emma@example.com', interests: ['Marketing', 'Sales'], lists: ['VIP Clients', 'Newsletter'] },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your audience and contact lists</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-soft card-hover">
                        <Upload size={18} className="icon-gray" strokeWidth={1.75} />
                        <span>Import CSV</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow">
                        <Plus size={18} strokeWidth={2} />
                        <span>Add Contact</span>
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Contacts', value: '5,678' },
                    { label: 'Active Lists', value: '12' },
                    { label: 'New This Week', value: '124' },
                    { label: 'Avg. Response Rate', value: '68%' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-surface-dark px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800/80 shadow-soft">
                        <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                        <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 icon-gray" size={18} strokeWidth={1.75} />
                        <input
                            type="text"
                            placeholder="Search contacts by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700">
                            <Filter size={16} className="icon-gray" strokeWidth={1.75} />
                            <span>Filter</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700">
                            <Tag size={16} className="icon-gray" strokeWidth={1.75} />
                            <span>Tags</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-background-dark text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 font-semibold">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary" />
                                </th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Phone</th>
                                <th className="px-6 py-4 font-semibold">Interests</th>
                                <th className="px-6 py-4 font-semibold">Lists</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                            {contacts.map((contact, index) => (
                                <tr
                                    key={contact.id}
                                    className="table-row-hover group animate-slide-up"
                                    style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                                >
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold text-sm">
                                                {contact.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Mail size={12} className="icon-gray" />
                                                    {contact.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 dark:text-gray-300 font-mono text-sm flex items-center gap-2">
                                            <Phone size={14} className="icon-gray" strokeWidth={1.75} />
                                            {contact.phone}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {contact.interests.map((tag, i) => (
                                                <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {contact.lists.map((list, i) => (
                                                <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-medium">
                                                    {list}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal size={18} strokeWidth={1.75} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing 1-5 of 5,678 contacts</p>
                    <div className="flex gap-1">
                        <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">Previous</button>
                        <button className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">1</button>
                        <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">2</button>
                        <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">3</button>
                        <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
