import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Pause, Trash2, Edit, GitBranch, Share2, Edit2, MoreVertical, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function FlowList() {
    const { t } = useTranslation();
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Inline renaming state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchFlows();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchFlows = async () => {
        try {
            const data = await api.get('/flows');
            setFlows(data);
        } catch (err) {
            console.error('Failed to fetch flows', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteFlow = async (id) => {
        if (!confirm(t('confirm_delete_flow'))) return;
        try {
            await api.delete(`/flows/${id}`);
            fetchFlows();
        } catch (err) {
            console.error('Failed to delete flow', err);
        }
    };

    const startRename = (flow) => {
        setEditingId(flow.id);
        setEditName(flow.name);
        setOpenMenuId(null); // Close the menu
    };

    const saveRename = async () => {
        if (!editName.trim()) {
            setEditingId(null); // Cancel if empty
            return;
        }

        const flow = flows.find(f => f.id === editingId);
        if (flow && flow.name !== editName) {
            try {
                await api.put(`/flows/${flow.id}`, { ...flow, name: editName });
                // Optimistic update
                setFlows(flows.map(f => f.id === editingId ? { ...f, name: editName } : f));
            } catch (err) {
                console.error('Failed to rename flow', err);
                alert(t('error_rename_flow'));
                fetchFlows(); // Revert on error
            }
        }
        setEditingId(null);
    };

    const toggleStatus = async (flow) => {
        try {
            await api.put(`/flows/${flow.id}`, { isActive: !flow.isActive });
            fetchFlows();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading automations...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">{t('automations_title')}</h1>
                    <p className="text-gray-500 dark:text-neutral-400">{t('automations_subtitle')}</p>
                </div>
                <Link
                    to="/automations/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    {t('btn_create_flow')}
                </Link>
            </div>

            {flows.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0F0F0F] rounded-xl border border-gray-200 dark:border-[#262626] shadow-sm transition-colors">
                    <GitBranch size={48} className="mx-auto text-gray-400 dark:text-neutral-600 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('no_automations')}</h3>
                    <p className="text-gray-500 dark:text-neutral-400 mb-6">{t('no_automations_subtitle')}</p>
                    <Link
                        to="/automations/new"
                        className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                        {t('btn_get_started')} &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flows.map(flow => (
                        <div key={flow.id} className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-gray-200 dark:border-[#262626] p-6 hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${flow.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-[#1A1A1A] dark:text-neutral-400'}`}>
                                    <GitBranch size={24} />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setOpenMenuId(openMenuId === flow.id ? null : flow.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors"
                                    >
                                        <span className="sr-only">Menu</span>
                                        <MoreVertical size={20} />
                                    </button>

                                    {openMenuId === flow.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-xl py-1 z-50 border border-gray-200 dark:border-[#333] animate-in fade-in zoom-in-95 duration-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startRename(flow);
                                                }}
                                                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center gap-2"
                                            >
                                                <Edit2 size={16} /> {t('btn_edit')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                    deleteFlow(flow.id);
                                                }}
                                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} /> {t('btn_delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {editingId === flow.id ? (
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={saveRename}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveRename();
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                        className="w-full text-lg font-semibold text-gray-900 dark:text-neutral-100 bg-white dark:bg-[#1A1A1A] border border-indigo-500 rounded px-2 py-1 outline-none shadow-sm"
                                    />
                                    <p className="text-xs text-indigo-500 mt-1">{t('placeholder_rename')}</p>
                                </div>
                            ) : (
                                <>
                                    <h3
                                        className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        onDoubleClick={() => startRename(flow)}
                                        title={t('btn_edit')}
                                    >
                                        {flow.name}
                                    </h3>
                                    <p className="text-gray-500 dark:text-neutral-400 text-sm mb-4 line-clamp-2">{flow.description || 'No description provided.'}</p>
                                </>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#262626]">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                                    <span>{flow._count?.executions || 0} {t('label_runs')}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(flow)}
                                        className={`p-2 rounded-lg transition-colors ${flow.isActive
                                            ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-[#1A1A1A] dark:text-neutral-400 dark:hover:bg-[#262626]'
                                            }`}
                                        title={flow.isActive ? t('tooltip_active') : t('tooltip_draft')}
                                    >
                                        {flow.isActive ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                    <Link
                                        to={`/automations/${flow.id}`}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                        title={t('btn_edit')}
                                    >
                                        <Edit size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
