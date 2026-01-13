import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, MessageSquare, LayoutTemplate, MoreHorizontal, Sparkles, Wand2, Loader2, AlertCircle, CheckCircle2, Paperclip } from 'lucide-react';
import api from '../services/api';
import aiService from '../services/ai';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        header: '',
        body: '',
        footer: '',
        name: '',
        header: '',
        body: '',
        footer: '',
        buttons: [], // { type: 'QUICK_REPLY' | 'URL', text: '' }
        files: [] // Array of { mediaId, filename, mimetype }
    });

    const [uploading, setUploading] = useState(false);

    // AI Generation State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // AI Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.getTemplates();
            setTemplates(data.templates || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', header: '', body: '', footer: '', buttons: [] });
        setEditingId(null);
        setAnalysis(null);
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;

        setAiLoading(true);
        try {
            // Pass existing body text so AI can modify it if present
            const generatedText = await aiService.generateMessage(aiPrompt, formData.body);
            setFormData(prev => ({
                ...prev,
                body: generatedText
            }));
            setShowAiModal(false);
            setAiPrompt('');
            setAnalysis(null); // Clear previous analysis
        } catch (err) {
            alert('Failed to generate message with AI');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!formData.body.trim()) {
            alert('Please add body text first.');
            return;
        }
        setAnalyzing(true);
        setAnalysis(null);
        try {
            const result = await aiService.analyzeTemplate(formData.body, formData.name);
            setAnalysis(result);
        } catch (err) {
            alert('Failed to analyze template.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // check size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        try {
            const result = await api.uploadFile(file);
            setFormData(prev => ({
                ...prev,
                files: [...prev.files, {
                    mediaId: result.mediaId,
                    filename: result.filename || file.name,
                    mimetype: result.mimeType || file.type
                }]
            }));
        } catch (err) {
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const removeFile = (index) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        try {
            // Pack structured data into JSON string for storage
            const content = JSON.stringify({
                header: formData.header,
                body: formData.body,
                footer: formData.footer,
                buttons: formData.buttons,
                files: formData.files
            });

            if (editingId) {
                await api.updateTemplate(editingId, { name: formData.name, content });
            } else {
                await api.createTemplate({ name: formData.name, content });
            }
            setShowModal(false);
            fetchTemplates();
            resetForm();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (tpl) => {
        try {
            const parsed = JSON.parse(tpl.content);
            setFormData({
                name: tpl.name,
                header: parsed.header || '',
                body: parsed.body || tpl.content, // Fallback for old simple strings
                footer: parsed.footer || '',
                buttons: parsed.buttons || [],
                files: parsed.files || []
            });
        } catch (e) {
            // Handle legacy text-only templates
            setFormData({
                name: tpl.name,
                header: '',
                body: tpl.content,
                footer: '',
                buttons: []
            });
        }
        setEditingId(tpl.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Start deletion?')) return;
        try {
            await api.deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Design structured WhatsApp messages</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white rounded-xl text-sm font-medium shadow-glow"
                >
                    <Plus size={18} strokeWidth={2} />
                    <span>Create Template</span>
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl skeleton" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <LayoutTemplate size={32} className="text-blue-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No templates yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tpl => {
                        let parsed;
                        try {
                            parsed = JSON.parse(tpl.content);
                        } catch {
                            parsed = { body: tpl.content };
                        }

                        return (
                            <div key={tpl.id} className="bg-white dark:bg-surface-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 p-5 card-hover">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{tpl.name}</h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(tpl)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(tpl.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Preview Mini */}
                                <div className="bg-[#E5DDD5] dark:bg-[#1f2c34] p-3 rounded-lg text-sm relative">
                                    <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg shadow-sm text-gray-900 dark:text-gray-100">
                                        {parsed.header && <p className="font-bold mb-1 opacity-90">{parsed.header}</p>}
                                        <p className="whitespace-pre-wrap">{parsed.body}</p>
                                        {parsed.footer && <p className="text-[10px] text-gray-500 mt-1">{parsed.footer}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Editor Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex animate-slide-up">
                        {/* Editor Side */}
                        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Template' : 'New Template'}</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Template Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary"
                                        placeholder="e.g. welcome_message"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Header (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary"
                                        placeholder="Company Name / Title"
                                        value={formData.header}
                                        onChange={e => setFormData({ ...formData, header: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-medium">Body Text</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                id="tpl-file-upload"
                                                className="hidden"
                                                accept="image/*,application/pdf"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <label
                                                htmlFor="tpl-file-upload"
                                                className={`p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title="Attach Image or PDF"
                                            >
                                                {uploading ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <Paperclip size={16} className="text-gray-500 dark:text-gray-400" />}
                                            </label>
                                            <button
                                                onClick={() => setShowAiModal(true)}
                                                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded-lg"
                                            >
                                                <Sparkles size={14} />
                                                <span>Generate with AI</span>
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full h-32 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary resize-none"
                                        placeholder="Hello {{1}}, thanks for signing up!"
                                        value={formData.body}
                                        onChange={e => setFormData({ ...formData, body: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Use {'{{1}}'}, {'{{2}}'} for variables.</p>

                                    {/* File List */}
                                    {formData.files.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.files.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-xs">
                                                    <Paperclip size={12} className="text-gray-400" />
                                                    <span className="max-w-[150px] truncate text-gray-600 dark:text-gray-300">{file.filename}</span>
                                                    <button
                                                        onClick={() => removeFile(idx)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Footer (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary"
                                        placeholder="Reply STOP to unsubscribe"
                                        value={formData.footer}
                                        onChange={e => setFormData({ ...formData, footer: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Analysis Results */}
                            {analysis && (
                                <div className={`p-4 rounded-xl border ${analysis.verdict === 'good'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : analysis.verdict === 'bad'
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {analysis.verdict === 'good' ? (
                                            <CheckCircle2 size={18} className="text-emerald-600" />
                                        ) : (
                                            <AlertCircle size={18} className={analysis.verdict === 'bad' ? 'text-red-600' : 'text-amber-600'} />
                                        )}
                                        <span className="font-semibold">
                                            Score: {analysis.score}/10
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{analysis.summary}</p>
                                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                                        <ul className="text-sm space-y-1">
                                            {analysis.suggestions.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-gray-600 dark:text-gray-400">{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !formData.body.trim()}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
                                >
                                    {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {analyzing ? 'Analyzing...' : 'Analyze'}
                                </button>
                                <button onClick={handleSave} className="flex-1 py-2.5 btn-primary text-white rounded-xl shadow-glow">
                                    Save Template
                                </button>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="w-1/2 p-6 bg-gray-50 dark:bg-black/40 flex flex-col items-center justify-center">
                            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Preview</h3>
                            <div className="w-[300px] h-[580px] bg-white dark:bg-[#111b21] rounded-[30px] border-[6px] border-gray-900 relative shadow-2xl overflow-hidden flex flex-col">
                                {/* WhatsApp Header Bar */}
                                <div className="h-14 bg-[#008069] dark:bg-[#202c33] flex items-center px-4 gap-3 shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-white/20"></div>
                                    <div className="text-white font-medium text-sm">Business Name</div>
                                </div>

                                {/* Chat Area */}
                                <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 flex-1 overflow-y-auto">
                                    <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                                        {/* Image Preview */}
                                        {formData.files.length > 0 && formData.files[0].mimetype.startsWith('image/') && (
                                            <div className="mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <div className="w-full text-xs text-center p-8 text-gray-400 bg-gray-100 dark:bg-gray-800 flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <Paperclip size={18} />
                                                    </div>
                                                    <span>{formData.files[0].filename}</span>
                                                    <span className="text-[10px] uppercase">(Image Preview)</span>
                                                </div>
                                            </div>
                                        )}
                                        {formData.header && (
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{formData.header}</p>
                                        )}
                                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-tight">
                                            {formData.body || <span className="text-gray-300 italic">Message body...</span>}
                                        </p>
                                        {formData.footer && (
                                            <p className="text-[10px] text-gray-400 mt-2">{formData.footer}</p>
                                        )}
                                        <div className="flex justify-end mt-1">
                                            <span className="text-[10px] text-gray-400">12:00 PM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* AI Generation Modal */}
            {
                showAiModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fade-in p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <Wand2 size={24} />
                                    <h3 className="text-lg font-bold">AI Assistant</h3>
                                </div>
                                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                Describe what you want to say, and I'll write a message for you.
                            </p>

                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-colors resize-none h-32 mb-4"
                                placeholder="e.g. Write a welcome message for new subscribers..."
                                autoFocus
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAiGenerate}
                                    disabled={aiLoading || !aiPrompt.trim()}
                                    className="flex items-center gap-2 px-4 py-2 btn-primary text-white rounded-lg font-medium shadow-glow disabled:opacity-50"
                                >
                                    {aiLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Thinking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>Generate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Templates;
