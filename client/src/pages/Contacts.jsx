import React from 'react';
import { Upload, Search, Filter, Plus } from 'lucide-react';

const Contacts = () => {
    // Placeholder data
    const contacts = [
        { id: 1, name: 'John Doe', phone: '+1234567890', interests: ['Marketing'], lists: ['VIP Clients'] },
        { id: 2, name: 'Jane Smith', phone: '+9876543210', interests: ['Sales', 'Tech'], lists: ['New Leads'] },
        { id: 3, name: 'Alice Johnson', phone: '+1122334455', interests: ['Development'], lists: ['Team'] },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your audience and lists</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Upload size={18} />
                        Import CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-blue-500/30">
                        <Plus size={18} />
                        Add Contact
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-background-dark border-none focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-background-dark text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Interests</th>
                                <th className="px-6 py-4">Lists</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {contacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{contact.name}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{contact.phone}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {contact.interests.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {contact.lists.map((list, i) => (
                                                <span key={i} className="px-2 py-1 text-xs rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                    {list}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-primary transition-colors">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
