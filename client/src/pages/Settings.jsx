
import React, { useState, useEffect, useRef } from 'react';
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

    // Ref to store embedded signup data - using ref instead of state to avoid closure issues
    const embeddedSignupDataRef = useRef(null);

    // Set up Meta's sessionInfoListener to capture WABA ID and Phone ID
    useEffect(() => {
        const sessionInfoListener = (event) => {
            // Only accept messages from Facebook
            if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
                return;
            }

            try {
                const data = JSON.parse(event.data);
                console.log('[Embedded Signup] Session Info Event:', data);

                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    // Handle different event types from embedded signup
                    if (data.event === 'FINISH') {
                        console.log('[Embedded Signup] Flow completed:', data.data);
                        // Store the IDs from the embedded signup using ref
                        embeddedSignupDataRef.current = {
                            waba_id: data.data?.waba_id,
                            phone_number_id: data.data?.phone_number_id
                        };
                    } else if (data.event === 'CANCEL') {
                        console.log('[Embedded Signup] User cancelled');
                    } else if (data.event === 'ERROR') {
                        console.error('[Embedded Signup] Error:', data.data);
                    }
                }
            } catch (e) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', sessionInfoListener);
        return () => window.removeEventListener('message', sessionInfoListener);
    }, []);

    const launchWhatsAppSignup = () => {
        // Use credentials from backend (Environment or DB)
        const fbAppId = credentials.fbAppId;
        const fbConfigId = credentials.fbConfigId;

        if (!fbAppId || !fbConfigId) {
            toast.error('WhatsApp setup not configured. Please contact support.');
            console.error('Missing fbAppId or fbConfigId in settings response');
            return;
        }

        // Reset embedded signup data for fresh flow
        embeddedSignupDataRef.current = null;

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
                // Log the FULL response for debugging
                console.log('FB FULL Response:', response);
                console.log('FB Auth Response:', response.authResponse);

                if (response.authResponse) {
                    toast.success('WhatsApp Connected! Saving credentials...');

                    // Save the token to backend
                    const saveCredentials = async () => {
                        try {
                            // Get the embedded signup data from session info listener
                            // We may need a slight delay for the message event to arrive
                            await new Promise(resolve => setTimeout(resolve, 500));

                            // Capture current embedded signup data from ref (was set by sessionInfoListener)
                            const currentEmbeddedData = embeddedSignupDataRef.current;
                            console.log('[FB-Callback] Embedded Signup Data:', currentEmbeddedData);

                            // Pass all available data from the popup
                            await apiClient.post('/settings/fb-callback', {
                                accessToken: response.authResponse.accessToken,
                                code: response.authResponse.code,
                                // Include any extra data from embedded signup session listener
                                signedRequest: response.authResponse.signedRequest,
                                graphDomain: response.authResponse.graphDomain,
                                // Pass IDs from session info listener if available
                                phone_number_id: currentEmbeddedData?.phone_number_id || response.phone_number_id,
                                waba_id: currentEmbeddedData?.waba_id || response.waba_id
                            });
                            toast.success('WhatsApp connected successfully!');
                            fetchSettings(); // Refresh to show connected status
                        } catch (err) {
                            console.error('Failed to save credentials:', err);
                            console.error('Full error object:', JSON.stringify(err, null, 2));

                            // Try to extract detailed error from backend
                            const errorData = err.response?.data || err.data || {};
                            console.error('Backend error data:', JSON.stringify(errorData, null, 2));

                            // Build a detailed error message
                            let errorMsg = errorData.details || errorData.error || err.message || 'Unknown error';
                            const errorStep = errorData.step ? ` (Step: ${errorData.step})` : '';

                            // If it's a Facebook error, show the full details
                            if (errorData.full_fb_error) {
                                const fbErr = errorData.full_fb_error.error || {};
                                console.error('Facebook API Error:', {
                                    message: fbErr.message,
                                    code: fbErr.code,
                                    type: fbErr.type,
                                    subcode: fbErr.error_subcode,
                                    trace_id: fbErr.fbtrace_id
                                });

                                // Create a more readable error message
                                errorMsg = `${fbErr.message || errorMsg} [Code: ${fbErr.code || 'N/A'}, Type: ${fbErr.type || 'N/A'}]`;
                            }

                            toast.error(`Connection failed${errorStep}: ${errorMsg}`);
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
                {/* WhatsApp Setup Card - Wizard Style */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">WhatsApp Business API</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {credentials.accessToken ? 'Your account is connected' : 'Connect to start messaging'}
                            </p>
                        </div>
                    </div>

                    {/* Connected State */}
                    {credentials.accessToken ? (
                        <div className="space-y-4">
                            {/* Success Banner */}
                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-800 dark:text-green-300">Successfully Connected</h4>
                                        <p className="text-sm text-green-600 dark:text-green-400">Your WhatsApp Business Account is active</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white dark:bg-gray-800/50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">WABA ID</p>
                                        <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {credentials.wabaId || '—'}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800/50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase font-medium mb-1">Phone Number ID</p>
                                        <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {credentials.phoneNumberId || '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reconnect Button */}
                            <button
                                onClick={launchWhatsAppSignup}
                                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reconnect or Change Number
                            </button>
                        </div>
                    ) : (
                        /* Not Connected State - Wizard */
                        <div className="space-y-5">
                            {/* Step Indicators */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click Connect</span>
                                </div>
                                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-3"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
                                    <span className="text-sm text-gray-400">Verify with Meta</span>
                                </div>
                                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-3"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
                                    <span className="text-sm text-gray-400">Start Messaging</span>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    How It Works
                                </h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                        <span>Connect a <strong>new phone number</strong> or link an <strong>existing WhatsApp Business</strong> account</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                        <span>Meta will verify your business and phone number via SMS</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                        <span>No technical setup required - it's all done automatically</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Prerequisites */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 text-sm">Prerequisites</h4>
                                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                    <li>• A Meta Business account (will be created if you don't have one)</li>
                                    <li>• A phone number that can receive SMS (new or clean history)</li>
                                    <li>• Business name matching your website or social profiles</li>
                                </ul>
                            </div>

                            {/* Main CTA Button */}
                            <button
                                onClick={launchWhatsAppSignup}
                                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                            >
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Connect WhatsApp Now
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                By connecting, you agree to Meta's Terms of Service and WhatsApp Business Terms
                            </p>
                        </div>
                    )}
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
