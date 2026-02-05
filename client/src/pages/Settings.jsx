
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Copy, Check, Globe, Moon, Sun } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../services/api';
import { useTranslation } from 'react-i18next';

const Settings = () => {
    const { isDark, toggleTheme } = useTheme();
    const toast = useToast();
    const { t, i18n } = useTranslation();
    const [credentials, setCredentials] = useState({
        phoneNumberId: '',
        accessToken: '',
        wabaId: '',
        verifyToken: 'whatsms_token'
    });
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testPhone, setTestPhone] = useState('');

    // In a real multi-tenant app, this would come from the backend.
    // For single user, we calculate based on current env
    const webhookUrl = `${import.meta.env.VITE_API_URL?.replace('localhost', 'YOUR_PUBLIC_IP') || window.location.origin}/webhooks`;


    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiClient.get('/settings');
            if (data) {
                setCredentials({
                    phoneNumberId: data.phoneNumberId || '',
                    accessToken: data.accessToken || '',
                    wabaId: data.wabaId || '',
                    verifyToken: data.verifyToken || 'whatsms_token'
                });
            }
        } catch (error) {
            console.error('Failed to load settings', error);
            // Fallback to empty if fails, don't show error toast on load to avoid annoyance
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await apiClient.post('/settings', credentials);
            await apiClient.post('/settings', credentials);
            toast.success(t('success_config_saved') || 'Configuration saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error(t('error_config_save') || 'Failed to save configuration');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('settings_title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings_subtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Appearance & Language Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-800/80 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                                <SettingsIcon size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{t('settings_title')}</h3>
                                <p className="text-sm text-gray-400">{t('section_appearance')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Language Selector */}
                            <select
                                value={i18n.language}
                                onChange={(e) => i18n.changeLanguage(e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-primary"
                            >
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                            </select>

                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isDark ? 'bg-emerald-600' : 'bg-gray-200'}`}
                            >
                                <span className="sr-only">Toggle theme</span>
                                <span
                                    className={`${isDark ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 flex items-center justify-center`}
                                >
                                    {isDark ? <Moon size={14} className="text-emerald-600" /> : <Sun size={14} className="text-orange-400" />}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Credentials Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                            <SettingsIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{t('section_credentials')}</h3>
                            <p className="text-sm text-gray-400">{t('section_credentials_subtitle')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('label_phone_id')}</label>
                            <input
                                type="text"
                                name="phoneNumberId"
                                value={credentials.phoneNumberId}
                                onChange={handleChange}
                                placeholder="e.g. 10452..."
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1">{t('hint_phone_id')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('label_access_token')}</label>
                            <div className="relative">
                                <input
                                    type={showToken ? "text" : "password"}
                                    name="accessToken"
                                    value={credentials.accessToken}
                                    onChange={handleChange}
                                    placeholder={t('placeholder_access_token')}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all pr-12 text-gray-900 dark:text-white placeholder:text-gray-400"
                                />
                                <button
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('label_waba_id')} <span className="text-gray-400 text-xs">(Optional)</span></label>
                            <input
                                type="text"
                                name="wabaId"
                                value={credentials.wabaId}
                                onChange={handleChange}
                                placeholder="e.g. 123456789..."
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1">{t('hint_waba_id')}</p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                className="w-full px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {t('btn_save_credentials')}
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <label className="block text-sm font-medium mb-2">{t('label_test_connectivity')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    placeholder="Recipient Phone (e.g. 1555...)"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                />
                                <button
                                    onClick={async () => {
                                        if (!testPhone) {
                                            toast.error(t('error_no_phone'));
                                            return;
                                        }
                                        try {
                                            await handleSave(); // Save first
                                            const res = await apiClient.post('/settings/test', { targetPhone: testPhone });
                                            toast.success(res.message || t('success_connection'));
                                        } catch (err) {
                                            toast.error(err.message || t('error_connection'));
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    title="Send 'hello_world' template"
                                >
                                    <Globe size={18} />
                                    {t('btn_send_test')}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {t('hint_test_message')} <br />
                                <span dangerouslySetInnerHTML={{ __html: t('hint_test_warning') }} />
                            </p>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-1">
                            {t('hint_save_before_test')}
                        </p>
                    </div>
                </div>

                {/* Webhook Configuration */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-800/80 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{t('section_webhook')}</h3>
                            <p className="text-sm text-gray-400">{t('section_webhook_subtitle')}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('label_callback_url')}</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                                    {webhookUrl}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Copy URL"
                                >
                                    {copied ? <Check size={16} className="text-blue-500" /> : <Copy size={16} className="text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('label_verify_token')}</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    name="verifyToken"
                                    value={credentials.verifyToken}
                                    onChange={handleChange}
                                    placeholder="whatsms_token"
                                    className="flex-1 w-full px-4 py-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-sm font-mono"
                                />
                                <div className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">{t('label_editable')}</div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{t('hint_verify_token')}</p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl text-sm text-emerald-800 dark:text-emerald-300">
                            <h4 className="font-semibold mb-1">{t('label_setup_instructions')}</h4>
                            <ol className="list-decimal pl-4 space-y-1 opacity-80">
                                <li>{t('instr_step_1')}</li>
                                <li>{t('instr_step_2')}</li>
                                <li>{t('instr_step_3')}</li>
                                <li>{t('instr_step_4')}</li>
                                <li>{t('instr_step_5')} <code>messages</code>, <code>message_status</code>.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Settings;
