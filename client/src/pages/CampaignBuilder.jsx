import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Check, ChevronRight, Paperclip, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const CampaignBuilder = () => {
    const [step, setStep] = useState(1);
    const [lists, setLists] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Campaign form state
    const [campaign, setCampaign] = useState({
        name: '',
        messageBody: '',
        selectedLists: [],
        scheduledAt: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [listsData, templatesData] = await Promise.all([
                api.getLists(),
                api.getTemplates()
            ]);
            setLists(listsData.lists || []);
            setTemplates(templatesData.templates || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, label: 'Compose', icon: FileText },
        { number: 2, label: 'Recipients', icon: Users },
        { number: 3, label: 'Review', icon: Check },
    ];

    const toggleList = (listId) => {
        setCampaign(prev => ({
            ...prev,
            selectedLists: prev.selectedLists.includes(listId)
                ? prev.selectedLists.filter(id => id !== listId)
                : [...prev.selectedLists, listId]
        }));
    };

    const applyTemplate = (template) => {
        setCampaign(prev => ({
            ...prev,
            messageBody: template.content
        }));
    };

    const getTotalRecipients = () => {
        return lists
            .filter(list => campaign.selectedLists.includes(list.id))
            .reduce((sum, list) => sum + (list.memberCount || 0), 0);
    };

    const canProceed = () => {
        if (step === 1) return campaign.name && campaign.messageBody;
        if (step === 2) return campaign.selectedLists.length > 0;
        return true;
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);

        try {
            const result = await api.createCampaign({
                name: campaign.name,
                messageBody: campaign.messageBody,
                listIds: campaign.selectedLists,
                scheduledAt: campaign.scheduledAt || null
            });

            // Optionally send immediately
            if (confirm('Campaign created! Would you like to send it now?')) {
                await api.sendCampaign(result.campaign.id);
                alert('Campaign is now sending!');
            }

            navigate('/campaigns');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Compose and send messages to your contacts</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between relative">
                {/* Connector Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800 mx-16" />
                <div
                    className="absolute top-6 left-0 h-0.5 bg-primary mx-16 transition-all duration-500"
                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((s, index) => (
                    <div
                        key={s.number}
                        className={`flex flex-col items-center relative z-10 animate-slide-up`}
                        style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${step > s.number
                                ? 'bg-primary text-white shadow-glow'
                                : step === s.number
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                            {step > s.number ? (
                                <Check size={20} strokeWidth={2.5} />
                            ) : (
                                <s.icon size={20} strokeWidth={1.75} />
                            )}
                        </div>
                        <span className={`mt-3 text-sm font-medium ${step >= s.number ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                            }`}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto"><X size={18} /></button>
                </div>
            )}

            {/* Step Content */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-xl font-semibold">Compose Message</h2>

                        <div>
                            <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                            <input
                                type="text"
                                value={campaign.name}
                                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-colors"
                                placeholder="e.g., January Newsletter"
                            />
                        </div>

                        {/* Templates */}
                        {templates.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Use Template</label>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => applyTemplate(template)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Message *</label>
                            <div className="text-xs text-gray-400 mb-2">
                                Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{name}}'}</code> or <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{phone}}'}</code> for personalization
                            </div>
                            <textarea
                                value={campaign.messageBody}
                                onChange={(e) => setCampaign({ ...campaign, messageBody: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-colors resize-none h-40"
                                placeholder="Hey {{name}}, we have exciting news for you..."
                            />
                            <p className="text-xs text-gray-400 mt-2">{campaign.messageBody.length} characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
                            <input
                                type="datetime-local"
                                value={campaign.scheduledAt}
                                onChange={(e) => setCampaign({ ...campaign, scheduledAt: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-xl font-semibold">Select Recipients</h2>
                        <p className="text-gray-500 dark:text-gray-400">Choose which contact lists will receive this campaign</p>

                        {lists.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">No contact lists found</p>
                                <button
                                    onClick={() => navigate('/contacts')}
                                    className="text-primary hover:underline"
                                >
                                    Create a list first
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {lists.map((list, index) => (
                                    <button
                                        key={list.id}
                                        onClick={() => toggleList(list.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 animate-slide-up ${campaign.selectedLists.includes(list.id)
                                                ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{list.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{list.memberCount || 0} contacts</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${campaign.selectedLists.includes(list.id)
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                {campaign.selectedLists.includes(list.id) && <Check size={14} />}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-lg font-medium">
                                Total Recipients: <span className="text-primary">{getTotalRecipients()}</span>
                            </p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-xl font-semibold">Review Campaign</h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Campaign Name</p>
                                <p className="font-medium">{campaign.name}</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Message</p>
                                <p className="whitespace-pre-wrap">{campaign.messageBody}</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Recipients</p>
                                <p className="font-medium">{getTotalRecipients()} contacts from {campaign.selectedLists.length} lists</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {lists.filter(l => campaign.selectedLists.includes(l.id)).map(list => (
                                        <span key={list.id} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-800 rounded-lg">
                                            {list.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {campaign.scheduledAt && (
                                <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Scheduled For</p>
                                    <p className="font-medium">{new Date(campaign.scheduledAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/campaigns')}
                    className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
                >
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>

                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        disabled={!canProceed()}
                        className="flex items-center gap-2 px-6 py-3 btn-primary text-white rounded-xl font-medium shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Continue</span>
                        <ChevronRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 btn-primary text-white rounded-xl font-medium shadow-glow disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                <span>Create Campaign</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CampaignBuilder;
