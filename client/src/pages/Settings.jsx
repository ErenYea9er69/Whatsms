
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
        if (!credentials.fbAppId || !credentials.fbConfigId) {
            toast.error('App ID and Config ID are required');
            return;
        }

        // Load FB SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: credentials.fbAppId,
                cookie: true,
                xfbml: true,
                version: 'v21.0'
            });

            // Launch Login
            window.FB.login(function (response) {
                if (response.authResponse) {
                    const code = response.authResponse.code;
                    // Exchange code for token on backend
                    // Or if using simple flow, we might get accessToken directly depending on config
                    // Ideally we send this code to backend to exchange for long-lived system user token
                    console.log('FB Auth Response:', response.authResponse);

                    /* 
                       NOTE: Real implementation requires passing this 'code' to your backend 
                       to exchange for a System User Access Token via Graph API.
                       For now, we'll try to capture what we can from client-side just to show flow.
                    */

                    // Temporarily saving what we have (this is likely a User Token, not System User)
                    // But for Embedded Signup, the recommended flow returns a code.
                    toast.success('Facebook Connected! Processing...');

                    // Example of saving (in real app, use backend exchange)
                    setCredentials(prev => ({
                        ...prev,
                        accessToken: response.authResponse.accessToken // Temporary
                        // WABA ID comes from subsequent API calls using this token
                    }));

                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, {
                config_id: credentials.fbConfigId, // The config ID from FB Login for Business
                response_type: 'code', // Recommended for security
                override_default_response_type: true,
                extras: {
                    setup: {
                        // Prefill data if available
                    }
                }
            });
        };

        // Inject SDK
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
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
                {/* Embedded Signup Card */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Facebook Connection</h3>
                            <p className="text-sm text-gray-400">Connect your WhatsApp Business Account</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm">Setup Instructions</h4>
                            <ol className="list-decimal pl-4 space-y-1 text-xs text-blue-700 dark:text-blue-400">
                                <li>Create a <strong>Meta App</strong> (Type: Business).</li>
                                <li>Add <strong>WhatsApp</strong> product.</li>
                                <li>Create a <strong>Configuration</strong> in "Facebook Login for Business".</li>
                                <li>Enter your App ID and Config ID below.</li>
                                <li>Click "Connect with Facebook" to onboard.</li>
                            </ol>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Facebook App ID</label>
                            <input
                                type="text"
                                name="fbAppId"
                                value={credentials.fbAppId || ''}
                                onChange={handleChange}
                                placeholder="e.g. 1234567890..."
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Configuration ID</label>
                            <input
                                type="text"
                                name="fbConfigId"
                                value={credentials.fbConfigId || ''}
                                onChange={handleChange}
                                placeholder="e.g. 112233..."
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none focus:border-primary transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>

                        {/* Connected Data (ReadOnly) */}
                        {credentials.accessToken && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">WABA ID</label>
                                    <div className="font-mono text-sm">{credentials.wabaId || 'Not set'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Phone Number ID</label>
                                    <div className="font-mono text-sm">{credentials.phoneNumberId || 'Not set'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Access Token</label>
                                    <div className="text-xs text-gray-400 truncate">••••••••••••••••••••••••</div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                            >
                                <Save size={18} className="inline mr-2" />
                                Save Config
                            </button>

                            <button
                                onClick={launchWhatsAppSignup}
                                disabled={!credentials.fbAppId || !credentials.fbConfigId}
                                className="flex-1 px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                Connect with Facebook
                            </button>
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
