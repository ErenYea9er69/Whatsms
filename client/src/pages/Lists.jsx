import React, { useState, useEffect } from 'react';
import {
    Plus,
    Users,
    MoreHorizontal,
    X,
    Trash2,
    Edit2,
    UserPlus,
    Search,
    ChevronDown,
    Check,
    RefreshCw,
    Tag,
    CheckCheck
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Lists = () => {
    const toast = useToast();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedList, setSelectedList] = useState(null);
    const [listMembers, setListMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddContactsModal, setShowAddContactsModal] = useState(false);
    const [showAddFromListModal, setShowAddFromListModal] = useState(false);

    // Form states
    const [newList, setNewList] = useState({ name: '', description: '' });
    const [allContacts, setAllContacts] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState('');
    const [showTagFilter, setShowTagFilter] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceListId, setSourceListId] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchLists = async () => {
        try {
            setLoading(true);
            const data = await api.getLists();
            setLists(data.lists || []);
        } catch (err) {
            toast.error('Failed to load lists');
        } finally {
            setLoading(false);
        }
    };

    const fetchListMembers = async (listId) => {
        try {
            setLoadingMembers(true);
            const data = await api.getList(listId);
            setListMembers(data.members || []);
        } catch (err) {
            toast.error('Failed to load list members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const fetchAllContacts = async () => {
        try {
            const [contactsData, tagsData] = await Promise.all([
                api.getContacts({ limit: 500 }),
                api.getContactTags()
            ]);
            setAllContacts(contactsData.contacts || []);
            setAllTags(tagsData.tags || []);
        } catch (err) {
            toast.error('Failed to load contacts');
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    useEffect(() => {
        if (selectedList) {
            fetchListMembers(selectedList.id);
        }
    }, [selectedList]);

    const handleCreateList = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.createList(newList);
            toast.success('List created successfully!');
            setShowCreateModal(false);
            setNewList({ name: '', description: '' });
            fetchLists();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteList = async (id) => {
        if (!confirm('Are you sure you want to delete this list?')) return;
        try {
            await api.deleteList(id);
            toast.success('List deleted');
            if (selectedList?.id === id) {
                setSelectedList(null);
                setListMembers([]);
            }
            fetchLists();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAddContacts = async () => {
        if (selectedContacts.length === 0) {
            toast.warning('Select at least one contact');
            return;
        }
        setSaving(true);
        try {
            const result = await api.addContactsToList(selectedList.id, selectedContacts);
            toast.success(`Added ${result.added} contacts, ${result.skipped} already in list`);
            setShowAddContactsModal(false);
            setSelectedContacts([]);
            fetchListMembers(selectedList.id);
            fetchLists(); // Refresh counts
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddFromList = async () => {
        if (!sourceListId) {
            toast.warning('Select a source list');
            return;
        }
        setSaving(true);
        try {
            // Get members from source list
            const sourceData = await api.getList(sourceListId);
            const contactIds = sourceData.members.map(m => m.id);

            if (contactIds.length === 0) {
                toast.info('Source list is empty');
                setSaving(false);
                return;
            }

            const result = await api.addContactsToList(selectedList.id, contactIds);
            toast.success(`Added ${result.added} contacts from list, ${result.skipped} already present`);
            setShowAddFromListModal(false);
            setSourceListId('');
            fetchListMembers(selectedList.id);
            fetchLists();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveContact = async (contactId) => {
        try {
            await api.removeContactFromList(selectedList.id, contactId);
            toast.success('Contact removed from list');
            fetchListMembers(selectedList.id);
            fetchLists();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const openAddContactsModal = () => {
        fetchAllContacts();
        setSelectedContacts([]);
        setSearchQuery('');
        setSelectedTag('');
        setShowTagFilter(false);
        setShowAddContactsModal(true);
    };

    const toggleContactSelection = (contactId) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const filteredContacts = allContacts.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery);
        const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
        return matchesSearch && matchesTag;
    });

    // Get contacts that can be added (not already in list)
    const addableContacts = filteredContacts.filter(c => !listMembers.some(m => m.id === c.id));

    const handleAddAll = () => {
        const idsToAdd = addableContacts.map(c => c.id);
        setSelectedContacts(prev => {
            const existing = new Set(prev);
            idsToAdd.forEach(id => existing.add(id));
            return Array.from(existing);
        });
    };

    const handleClearSelection = () => {
        setSelectedContacts([]);
    };

    // Exclude current list from source options
    const otherLists = lists.filter(l => l.id !== selectedList?.id);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contact Lists</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Organize your contacts into targeted lists</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                >
                    <Plus size={18} strokeWidth={2} />
                    <span>Create List</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lists Sidebar */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                        <h3 className="font-semibold">Your Lists</h3>
                        <button onClick={fetchLists} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <RefreshCw size={16} className="icon-gray" />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl skeleton" />
                                ))}
                            </div>
                        ) : lists.length === 0 ? (
                            <p className="p-4 text-center text-gray-400">No lists yet. Create your first list!</p>
                        ) : (
                            <div className="p-2">
                                {lists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => setSelectedList(list)}
                                        className={`w-full text-left p-3 rounded-xl transition-all mb-1 ${selectedList?.id === list.id
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                                    <Users size={18} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{list.name}</p>
                                                    <p className="text-xs text-gray-400">{list.memberCount} contacts</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {list.description && (
                                            <p className="text-xs text-gray-400 mt-1 pl-13">{list.description}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* List Members */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 overflow-hidden">
                    {!selectedList ? (
                        <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                            <Users size={48} strokeWidth={1} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Select a list</p>
                            <p className="text-sm">Choose a list from the sidebar to view its contacts</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedList.name}</h3>
                                    <p className="text-xs text-gray-400">{selectedList.memberCount} contacts</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowAddFromListModal(true)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                    >
                                        <Users size={16} />
                                        From List
                                    </button>
                                    <button
                                        onClick={openAddContactsModal}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium btn-primary text-white rounded-xl"
                                    >
                                        <UserPlus size={16} />
                                        Add Contacts
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {loadingMembers ? (
                                    <div className="p-4 space-y-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl skeleton" />
                                        ))}
                                    </div>
                                ) : listMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                                        <UserPlus size={40} strokeWidth={1} className="mb-3 opacity-50" />
                                        <p>This list is empty</p>
                                        <p className="text-sm">Add contacts to get started</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                                        {listMembers.map(contact => (
                                            <div key={contact.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold text-sm">
                                                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{contact.name}</p>
                                                        <p className="text-xs text-gray-400">{contact.phone}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveContact(contact.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create List Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up" style={{ opacity: 0 }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Create New List</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateList} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">List Name *</label>
                                <input
                                    type="text"
                                    value={newList.name}
                                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none"
                                    placeholder="e.g. VIP Customers"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={newList.description}
                                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none resize-none"
                                    rows={3}
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 btn-primary text-white rounded-xl font-medium disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create List'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Contacts Modal */}
            {showAddContactsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-lg w-full p-6 animate-slide-up max-h-[80vh] flex flex-col" style={{ opacity: 0 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Add Contacts to {selectedList?.name}</h2>
                            <button onClick={() => setShowAddContactsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">{selectedContacts.length} selected</p>

                        {/* Search and Tag Filter Row */}
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none"
                                />
                            </div>

                            {/* Tag Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowTagFilter(!showTagFilter)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${selectedTag ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <Tag size={16} />
                                    <span className="text-sm">{selectedTag || 'Tag'}</span>
                                    <ChevronDown size={14} />
                                </button>

                                {showTagFilter && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 py-2 max-h-48 overflow-y-auto">
                                        <button
                                            onClick={() => { setSelectedTag(''); setShowTagFilter(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${!selectedTag ? 'text-emerald-600 font-medium' : ''}`}
                                        >
                                            All Tags
                                        </button>
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => { setSelectedTag(tag); setShowTagFilter(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedTag === tag ? 'text-emerald-600 font-medium' : ''}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                        {allTags.length === 0 && (
                                            <p className="px-4 py-2 text-xs text-gray-400">No tags</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add All / Clear buttons */}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={handleAddAll}
                                disabled={addableContacts.length === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCheck size={14} />
                                Add All ({addableContacts.length})
                            </button>
                            {selectedContacts.length > 0 && (
                                <button
                                    onClick={handleClearSelection}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                    Clear
                                </button>
                            )}
                            <span className="ml-auto text-xs text-gray-400">
                                Showing {filteredContacts.length} contacts
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800/80 max-h-60">
                            {filteredContacts.length === 0 ? (
                                <p className="p-4 text-center text-gray-400">No contacts found</p>
                            ) : (
                                filteredContacts.map(contact => {
                                    const isSelected = selectedContacts.includes(contact.id);
                                    const isAlreadyInList = listMembers.some(m => m.id === contact.id);

                                    return (
                                        <button
                                            key={contact.id}
                                            onClick={() => !isAlreadyInList && toggleContactSelection(contact.id)}
                                            disabled={isAlreadyInList}
                                            className={`w-full flex items-center justify-between p-3 transition-colors ${isAlreadyInList
                                                ? 'opacity-50 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary text-xs font-semibold">
                                                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-sm">{contact.name}</p>
                                                    <p className="text-xs text-gray-400">{contact.phone}</p>
                                                </div>
                                            </div>
                                            {isAlreadyInList ? (
                                                <span className="text-xs text-gray-400">Already in list</span>
                                            ) : isSelected ? (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => setShowAddContactsModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium">
                                Cancel
                            </button>
                            <button onClick={handleAddContacts} disabled={saving || selectedContacts.length === 0} className="flex-1 py-2.5 btn-primary text-white rounded-xl font-medium disabled:opacity-50">
                                {saving ? 'Adding...' : `Add ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add From Another List Modal */}
            {showAddFromListModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up" style={{ opacity: 0 }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Copy From Another List</h2>
                            <button onClick={() => setShowAddFromListModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            All contacts from the selected list will be copied to <strong>{selectedList?.name}</strong>
                        </p>

                        <div className="space-y-2 mb-6">
                            {otherLists.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">No other lists available</p>
                            ) : (
                                otherLists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => setSourceListId(list.id.toString())}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${sourceListId === list.id.toString()
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                            : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Users size={18} className="text-gray-400" />
                                            <div className="text-left">
                                                <p className="font-medium">{list.name}</p>
                                                <p className="text-xs text-gray-400">{list.memberCount} contacts</p>
                                            </div>
                                        </div>
                                        {sourceListId === list.id.toString() && (
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowAddFromListModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium">
                                Cancel
                            </button>
                            <button onClick={handleAddFromList} disabled={saving || !sourceListId} className="flex-1 py-2.5 btn-primary text-white rounded-xl font-medium disabled:opacity-50">
                                {saving ? 'Copying...' : 'Copy Contacts'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lists;
