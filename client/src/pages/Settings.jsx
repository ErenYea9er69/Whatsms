
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Copy, Check, Globe } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';

const Settings = () => {
    const toast = useToast();
    const [credentials, setCredentials] = useState({
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        verifyToken: 'whatsms_token',
        fbAppId: '',
        fbConfigId: ''
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
                    // Preserve existing credentials or defaults
                    phoneNumberId: data.phoneNumberId || '',
                    wabaId: data.wabaId || '',
                    accessToken: data.accessToken || '',
                    verifyToken: data.verifyToken || 'whatsms_token',
                    fbAppId: data.fbAppId || '',
                    fbConfigId: data.fbConfigId || ''
                });
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const launchWhatsAppSignup = () => {
        // Use environment variables for App ID and Config ID
        const fbAppId = import.meta.env.VITE_FB_APP_ID;
        const fbConfigId = import.meta.env.VITE_FB_CONFIG_ID;

        if (!fbAppId || !fbConfigId) {
            toast.error('WhatsApp setup not configured. Please contact support.');
            console.error('Missing VITE_FB_APP_ID or VITE_FB_CONFIG_ID in environment');
            return;
        }

        // Load FB SDK if not already loaded
        const initAndLogin = () => {
            window.FB.init({
                appId: fbAppId,
                cookie: true,
                xfbml: true,
                version: 'v21.0'
            });

            // Launch Embedded Signup
            window.FB.login(function (response) {
                if (response.authResponse) {
                    console.log('FB Auth Response:', response.authResponse);
                    toast.success('WhatsApp Connected! Saving credentials...');

                    // Save the token to backend
                    const saveCredentials = async () => {
                        try {
                            await apiClient.post('/settings/fb-callback', {
                                accessToken: response.authResponse.accessToken,
                                code: response.authResponse.code
                            });
                            fetchSettings(); // Refresh to show connected status
                        } catch (err) {
                            console.error('Failed to save credentials:', err);
                            toast.error('Failed to save connection. Please try again.');
                        }
                    };
                    saveCredentials();
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                    toast.error('Connection cancelled');
                }
            }, {
                config_id: fbConfigId,
                response_type: 'code',
                override_default_response_type: true,
                extras: {
                    setup: {},
                    featureType: '',
                    sessionInfoVersion: '3'
                }
            });
        };

        // Check if SDK is already loaded
        if (window.FB) {
            initAndLogin();
        } else {
            window.fbAsyncInit = initAndLogin;

            // Inject SDK script
            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {
                    initAndLogin();
                    return;
                }
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
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

    /** Canned Replies Logic */
    const [cannedReplies, setCannedReplies] = useState([]);
    const [newReply, setNewReply] = useState({ title: '', shortcut: '', content: '' });

    useEffect(() => {
        apiClient.getCannedReplies().then(setCannedReplies).catch(console.error);
    }, []);

    const handleCreateReply = async (e) => {
        e.preventDefault();
        try {
            const saved = await apiClient.createCannedReply(newReply);
            setCannedReplies([...cannedReplies, saved]);
            setNewReply({ title: '', shortcut: '', content: '' });
            toast.success('Canned reply created!');
        } catch (error) {
            toast.error(error.message || 'Failed to create canned reply');
        }
    };

    const handleDeleteReply = async (id) => {
        if (!window.confirm('Delete this canned reply?')) return;
        try {
            await apiClient.deleteCannedReply(id);
            setCannedReplies(cannedReplies.filter(r => r.id !== id));
            toast.success('Deleted canned reply');
        } catch (error) {
            toast.error(error.message);
        }
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
                {/* WhatsApp Setup Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">WhatsApp Business API</h3>
                            <p className="text-sm text-gray-400">Connect your business phone number</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Status Indicator */}
                        {credentials.accessToken ? (
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="font-semibold text-green-700 dark:text-green-400">Connected</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">WABA ID</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">{credentials.wabaId || 'Pending...'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phone Number ID</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">{credentials.phoneNumberId || 'Pending...'}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Click the button below to connect your WhatsApp Business Account. You'll be guided through Meta's verification process.
                                </p>
                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-green-500" /> One-click setup
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-green-500" /> Secure OAuth connection
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-green-500" /> No manual API keys needed
                                    </li>
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={launchWhatsAppSignup}
                            className="w-full px-6 py-3.5 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {credentials.accessToken ? 'Reconnect WhatsApp' : 'Setup WhatsApp'}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
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
                                    {copied ? <Check size={16} className="text-blue-500" /> : <Copy size={16} className="text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-background-dark rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Verify Token</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    name="verifyToken"
                                    value={credentials.verifyToken}
                                    onChange={handleChange}
                                    placeholder="whatsms_token"
                                    className="flex-1 w-full px-4 py-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-sm font-mono"
                                />
                                <div className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">Editable</div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Must match the Verify Token in Meta Dashboard</p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl text-sm text-emerald-800 dark:text-emerald-300">
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
