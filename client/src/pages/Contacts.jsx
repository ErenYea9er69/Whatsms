import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Filter, Plus, MoreHorizontal, Mail, Phone, Tag, X, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Form state
    const [newContact, setNewContact] = useState({ name: '', phone: '', interests: '' });
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const fetchContacts = async (page = 1, search = '') => {
        try {
            setLoading(true);
            setError(null);

            const [contactsData, statsData] = await Promise.all([
                api.getContacts({ page, limit: pagination.limit, search }),
                api.getContactStats()
            ]);

            setContacts(contactsData.contacts || []);
            setPagination(contactsData.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchContacts(1, searchQuery);
        }, 300);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchQuery]);

    const handleAddContact = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const interests = newContact.interests
                .split(',')
                .map(i => i.trim())
                .filter(i => i);

            await api.createContact({
                name: newContact.name,
                phone: newContact.phone,
                interests
            });

            setShowAddModal(false);
            setNewContact({ name: '', phone: '', interests: '' });
            fetchContacts(pagination.page, searchQuery);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteContact = async (id) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            await api.deleteContact(id);
            fetchContacts(pagination.page, searchQuery);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const result = await api.importContacts(file);
            setImportResult(result);
            fetchContacts(1, '');
        } catch (err) {
            setImportResult({ error: err.message });
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchContacts(newPage, searchQuery);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your audience and contact lists</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-sm font-medium shadow-soft card-hover"
                    >
                        <Upload size={18} className="icon-gray" strokeWidth={1.75} />
                        <span>Import CSV</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                    >
                        <Plus size={18} strokeWidth={2} />
                        <span>Add Contact</span>
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Contacts', value: stats?.total?.toLocaleString() ?? '-' },
                    { label: 'Active Lists', value: stats?.listsCount ?? '-' },
                    { label: 'New This Week', value: stats?.thisWeek ?? '-' },
                    { label: 'Showing', value: `${contacts.length} of ${pagination.total}` },
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
                            placeholder="Search contacts by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={() => fetchContacts(pagination.page, searchQuery)}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700"
                    >
                        <RefreshCw size={16} className="icon-gray" strokeWidth={1.75} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                        <button onClick={() => fetchContacts()} className="ml-auto text-sm underline">Retry</button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-background-dark text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Phone</th>
                                <th className="px-6 py-4 font-semibold">Interests</th>
                                <th className="px-6 py-4 font-semibold">Lists</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="h-10 w-40 bg-gray-200 dark:bg-gray-800 rounded skeleton" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded skeleton" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded skeleton" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded skeleton" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded skeleton ml-auto" /></td>
                                    </tr>
                                ))
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        {searchQuery ? 'No contacts found matching your search' : 'No contacts yet. Add your first contact!'}
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact, index) => (
                                    <tr
                                        key={contact.id}
                                        className="table-row-hover group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold text-sm">
                                                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                    <p className="text-xs text-gray-400">ID: {contact.id}</p>
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
                                                {(contact.interests || []).slice(0, 2).map((tag, i) => (
                                                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {(contact.interests || []).length > 2 && (
                                                    <span className="px-2 py-1 text-xs text-gray-400">+{contact.interests.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(contact.lists || []).slice(0, 2).map((list, i) => (
                                                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-medium">
                                                        {list.name}
                                                    </span>
                                                ))}
                                                {(contact.lists || []).length > 2 && (
                                                    <span className="px-2 py-1 text-xs text-gray-400">+{contact.lists.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteContact(contact.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={18} strokeWidth={1.75} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pagination.page === pageNum
                                                ? 'bg-primary text-white'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Add Contact</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddContact} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Phone *</label>
                                <input
                                    type="text"
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none"
                                    placeholder="+1234567890"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Interests (comma-separated)</label>
                                <input
                                    type="text"
                                    value={newContact.interests}
                                    onChange={(e) => setNewContact({ ...newContact, interests: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none"
                                    placeholder="marketing, sales"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 btn-primary text-white rounded-xl font-medium disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Add Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Import Contacts</h2>
                            <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Upload a CSV file with columns: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">name</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">phone</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">interests</code>
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleImport}
                                className="w-full"
                                disabled={importing}
                            />

                            {importing && (
                                <div className="flex items-center gap-2 text-primary">
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <span>Importing...</span>
                                </div>
                            )}

                            {importResult && (
                                <div className={`p-4 rounded-xl ${importResult.error ? 'bg-red-50 dark:bg-red-900/20 text-red-700' : 'bg-green-50 dark:bg-green-900/20 text-green-700'}`}>
                                    {importResult.error ? (
                                        <p>{importResult.error}</p>
                                    ) : (
                                        <>
                                            <p className="font-medium">Import complete!</p>
                                            <p className="text-sm mt-1">{importResult.imported} imported, {importResult.skipped} skipped</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
