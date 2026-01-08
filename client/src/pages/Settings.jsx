
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Copy, Check, Globe } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

const Settings = () => {
    const toast = useToast();
    const [credentials, setCredentials] = useState({
        phoneNumberId: '',
        accessToken: ''
    });
    const [loading, setLoading] = useState(true);
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);

    // In a real multi-tenant app, this would come from the backend.
    // For single user, we calculate based on current env
    const webhookUrl = `${import.meta.env.VITE_API_URL?.replace('localhost', 'YOUR_PUBLIC_IP') || window.location.origin}/webhooks`;
    const verifyToken = 'whatsms_token'; // Hardcoded for this demo

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiClient.get('/settings');
            if (data) {
                setCredentials({
                    phoneNumberId: data.phoneNumberId || '',
                    accessToken: data.accessToken || ''
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
            toast.success('Configuration saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error('Failed to save configuration');
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
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your WhatsApp Business API connection</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Credentials Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                            <SettingsIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">API Credentials</h3>
                            <p className="text-sm text-gray-400">Enter your Meta Developer keys</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Phone Number ID</label>
                            <input
                                type="text"
                                name="phoneNumberId"
                                value={credentials.phoneNumberId}
                                onChange={handleChange}
                                placeholder="e.g. 10452..."
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">Found in WhatsApp API Setup</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Access Token</label>
                            <div className="relative">
                                <input
                                    type={showToken ? "text" : "password"}
                                    name="accessToken"
                                    value={credentials.accessToken}
                                    onChange={handleChange}
                                    placeholder="Permanent or Temporary Access Token"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all pr-12"
                                />
                                <button
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                id="save-btn"
                                onClick={handleSave}
                                className="w-full py-2.5 btn-primary text-white rounded-xl font-medium shadow-glow flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Save Configuration
                            </button>
                            <p className="text-xs text-center text-gray-400 mt-3">
                                Note: These credentials are now saved securely in your database.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Webhook Configuration */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Webhook Setup</h3>
                            <p className="text-sm text-gray-400">Connect to Meta for incoming messages</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Callback URL</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                                    {webhookUrl}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Copy URL"
                                >
                                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Verify Token</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                                    {verifyToken}
                                </code>
                                <div className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500">Fixed</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                            <h4 className="font-semibold mb-1">Setup Instructions:</h4>
                            <ol className="list-decimal pl-4 space-y-1 opacity-80">
                                <li>Go to your App Dashboard in Meta Developers.</li>
                                <li>Select <strong>WhatsApp</strong> &gt; <strong>Configuration</strong>.</li>
                                <li>Click <strong>Edit</strong> under Webhook.</li>
                                <li>Paste the Callback URL and Verify Token above.</li>
                                <li>Enable events: <code>messages</code>, <code>message_status</code>.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
