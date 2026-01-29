import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Filter, Plus, MoreHorizontal, Mail, Phone, Tag, X, RefreshCw, AlertCircle, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
import api from '../services/api';
import ImportContacts from '../components/ImportContacts';
import { useToast } from '../context/ToastContext';

const Contacts = () => {
    const toast = useToast();
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState(null);
    const [allTags, setAllTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    // Form state
    const [newContact, setNewContact] = useState({ name: '', phone: '', interests: '', tags: '' });
    const [saving, setSaving] = useState(false);

    // WhatsApp Fetch State
    const [fetchingWhatsApp, setFetchingWhatsApp] = useState(false);

    const searchTimeoutRef = useRef(null);

    const fetchContacts = React.useCallback(async (page = 1, search = '', tag = '') => {
        try {
            setLoading(true);
            setError(null);

            const params = { page, limit: pagination.limit };
            if (search) params.search = search;
            if (tag) params.tag = tag;

            const [contactsData, statsData, tagsData] = await Promise.all([
                api.getContacts(params),
                api.getContactStats(),
                api.getContactTags()
            ]);

            setContacts(contactsData.contacts || []);
            setPagination(contactsData.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
            setStats(statsData);
            setAllTags(tagsData.tags || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchContacts(1, searchQuery, selectedTag);
        }, 300);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchQuery, selectedTag, fetchContacts]);

    const handleAddContact = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const interests = newContact.interests
                .split(',')
                .map(i => i.trim())
                .filter(i => i);

            const tags = newContact.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t);

            await api.createContact({
                name: newContact.name,
                phone: newContact.phone,
                interests,
                tags
            });

            setShowAddModal(false);
            setNewContact({ name: '', phone: '', interests: '', tags: '' });
            fetchContacts(pagination.page, searchQuery, selectedTag);
            toast.success('Contact added successfully!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteContact = async (id) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            await api.deleteContact(id);
            fetchContacts(pagination.page, searchQuery, selectedTag);
            toast.success('Contact deleted');
        } catch (err) {
            toast.error(err.message);
        }
    };



    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchContacts(newPage, searchQuery, selectedTag);
        }
    };

    const handleFetchWhatsApp = async () => {
        setFetchingWhatsApp(true);
        try {
            const result = await api.fetchWhatsAppContacts();
            fetchContacts(1, searchQuery, selectedTag);
            if (result.imported > 0) {
                toast.success(`Imported ${result.imported} new contacts from WhatsApp!`);
            } else {
                toast.info(result.message || 'No new contacts to import');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to fetch WhatsApp contacts');
        } finally {
            setFetchingWhatsApp(false);
        }
    };

    const handleTagFilter = (tag) => {
        setSelectedTag(tag);
        setShowTagDropdown(false);
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
                        onClick={handleFetchWhatsApp}
                        disabled={fetchingWhatsApp}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-glow card-hover disabled:opacity-50"
                    >
                        {fetchingWhatsApp ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <MessageSquare size={18} />
                        )}
                        <span>{fetchingWhatsApp ? 'Fetching...' : 'Fetch WhatsApp'}</span>
                    </button>
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
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-soft border border-gray-100 dark:border-gray-800/80 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 icon-gray" size={18} strokeWidth={1.75} />
                        <input
                            type="text"
                            placeholder="Search contacts by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                    </div>

                    {/* Tag Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTagDropdown(!showTagDropdown)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium border ${selectedTag ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                        >
                            <Tag size={16} strokeWidth={1.75} />
                            <span>{selectedTag || 'Filter by Tag'}</span>
                            <ChevronDown size={14} />
                        </button>

                        {showTagDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 py-2 max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => handleTagFilter('')}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${!selectedTag ? 'text-emerald-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    All Contacts
                                </button>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagFilter(tag)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedTag === tag ? 'text-emerald-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                {allTags.length === 0 && (
                                    <p className="px-4 py-2 text-xs text-gray-400">No tags created yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => fetchContacts(pagination.page, searchQuery, selectedTag)}
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
                                <th className="px-6 py-4 font-semibold">Tags</th>
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
                                contacts.map((contact) => (
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
                                                {(contact.tags || []).slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {(contact.tags || []).length > 3 && (
                                                    <span className="px-2 py-1 text-xs text-gray-400">+{contact.tags.length - 3}</span>
                                                )}
                                                {(contact.tags || []).length === 0 && (
                                                    <span className="text-xs text-gray-400">No tags</span>
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
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0s' }}>
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
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Phone *</label>
                                <input
                                    type="text"
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
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
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                                    placeholder="marketing, sales"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={newContact.tags}
                                    onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                                    placeholder="VIP, Hot Lead"
                                />
                                <p className="text-xs text-gray-400 mt-1">Use tags to segment your contacts</p>
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
                <ImportContacts
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        fetchContacts(1, '');
                        // Optional: Keep modal open or close it? 
                        // Usually better to let user close it after seeing success message
                    }}
                />
            )}
        </div>
    );
};

export default Contacts;
