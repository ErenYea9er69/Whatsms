const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all system settings
router.get('/', async (req, res) => {
    try {
        const settings = await prisma.systemConfig.findMany();
        // Convert array to object for easier frontend consumption
        const configMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Inject Platform Config from Environment (for multi-tenant SaaS mode)
        configMap.fbAppId = process.env.FB_APP_ID || configMap.fbAppId || '';
        configMap.fbConfigId = process.env.FB_CONFIG_ID || configMap.fbConfigId || '';

        // Determine the webhook URL dynamically if looking for it (optional helper)
        // but for now just return what's in DB

        res.json(configMap);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// DEBUG: Check environment variables (remove in production)
router.get('/debug-env', async (req, res) => {
    res.json({
        FB_APP_ID: process.env.FB_APP_ID ? 'SET (' + process.env.FB_APP_ID.substring(0, 8) + '...)' : 'NOT SET',
        FB_APP_SECRET: process.env.FB_APP_SECRET ? 'SET (' + process.env.FB_APP_SECRET.substring(0, 4) + '...)' : 'NOT SET',
        FB_CONFIG_ID: process.env.FB_CONFIG_ID ? 'SET (' + process.env.FB_CONFIG_ID.substring(0, 8) + '...)' : 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'not set'
    });
});

// Update system settings (upsert)
router.post('/', async (req, res) => {
    const settings = req.body; // Expecting { key: value, key2: value2 }

    try {
        const operations = Object.entries(settings).map(([key, value]) => {
            return prisma.systemConfig.upsert({
                where: { key },
                update: { value: String(value) },
                create: {
                    key,
                    value: String(value),
                    description: `Config for ${key}`
                }
            });
        });

        await prisma.$transaction(operations);

        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Test WhatsApp connection configuration
router.post('/test', async (req, res) => {
    try {
        const whatsappService = require('../services/whatsapp');
        // Credentials are auto-loaded by the service methods


        // Use a lightweight API call (like getting phone number metrics) or send a self-message if possible
        // Since we don't have a simple 'ping', we'll rely on the fact that loadCredentials throws if config is missing
        // or just return success if we can read the config successfully.

        // Ideally we would make a real call to Meta here.
        // For now, let's assume if we have credentials, it's "configured".
        // A better test would use axios to call a read-only endpoint.

        // Let's try to send a test message to the user's own number if provided, or just validate config presence.
        // Try to send a hello_world template message if a phone number is provided
        const { targetPhone } = req.body;

        if (targetPhone) {
            try {
                await whatsappService.sendTemplateMessage(targetPhone, 'hello_world');
                return res.json({ message: 'Connection Validated: "hello_world" template sent successfully!' });
            } catch (sendError) {
                console.error('Test message failed:', sendError);
                return res.status(500).json({
                    error: `Credentials appear valid, but sending failed: ${sendError.message}. Ensure the "To" number is verified if using a Test Number.`
                });
            }
        }

        res.json({ message: 'Configuration Saved & Validated (No test message sent)' });
    } catch (error) {
        res.status(500).json({ error: 'Connection test failed: ' + error.message });
    }
});

// Disconnect WhatsApp - Clear all WhatsApp credentials from database
router.delete('/whatsapp', async (req, res) => {
    try {
        // Delete all WhatsApp-related config from database
        await prisma.systemConfig.deleteMany({
            where: {
                key: { in: ['accessToken', 'wabaId', 'phoneNumberId'] }
            }
        });

        console.log('[Settings] WhatsApp credentials cleared from database');
        res.json({ success: true, message: 'WhatsApp disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting WhatsApp:', error);
        res.status(500).json({ error: 'Failed to disconnect: ' + error.message });
    }
});

// Embedded Signup Callback - Exchange code for token
router.post('/fb-callback', async (req, res) => {
    // Accept all data from frontend including any direct IDs from embedded signup
    const { code, phone_number_id: directPhoneId, waba_id: directWabaId, redirectUri } = req.body;
    let step = 'init';

    // Log incoming data for debugging
    console.log('[FB-Callback] Received data:', {
        code: code ? 'present' : 'missing',
        directPhoneId: directPhoneId || 'not provided',
        directWabaId: directWabaId || 'not provided',
        redirectUri: redirectUri || 'not provided'
    });

    try {
        step = 'validate_input';
        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required', step });
        }

        step = 'check_env';
        const FB_APP_ID = process.env.FB_APP_ID;
        const FB_APP_SECRET = process.env.FB_APP_SECRET;

        if (!FB_APP_ID || !FB_APP_SECRET) {
            console.error('Missing FB_APP_ID or FB_APP_SECRET in server environment');
            return res.status(500).json({
                error: 'Server configuration error',
                step,
                details: `FB_APP_ID: ${FB_APP_ID ? 'SET' : 'MISSING'}, FB_APP_SECRET: ${FB_APP_SECRET ? 'SET' : 'MISSING'}`
            });
        }

        const axios = require('axios');

        // 1. Exchange Code for Access Token
        step = 'exchange_code';
        console.log('[FB-Callback] Step 1: Exchanging code for token...');
        const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                code: code,
                redirect_uri: redirectUri // Required for code validation
            }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            throw new Error('No access token returned from Facebook');
        }
        console.log('[FB-Callback] Step 1 SUCCESS: Access Token received');

        // 2. Identify WABA ID via debug_token
        step = 'debug_token';
        console.log('[FB-Callback] Step 2: Debugging token to find WABA ID...');
        const debugResponse = await axios.get('https://graph.facebook.com/v21.0/debug_token', {
            params: {
                input_token: accessToken,
                access_token: `${FB_APP_ID}|${FB_APP_SECRET}`
            }
        });

        const granularScopes = debugResponse.data.data?.granular_scopes || [];
        console.log('[FB-Callback] Granular scopes:', JSON.stringify(granularScopes));

        const whatsappScope = granularScopes.find(s => s.scope === 'whatsapp_business_management');

        let wabaId = null;
        let phoneNumberId = null;

        // Method 0: Use direct IDs from frontend if provided by embedded signup
        if (directWabaId) {
            wabaId = directWabaId;
            console.log('[FB-Callback] Using direct WABA ID from frontend:', wabaId);
        }
        if (directPhoneId) {
            phoneNumberId = directPhoneId;
            console.log('[FB-Callback] Using direct Phone ID from frontend:', phoneNumberId);
        }

        // Method 1: Try to get WABA ID from granular scopes target_ids
        if (!wabaId && whatsappScope && whatsappScope.target_ids && whatsappScope.target_ids.length > 0) {
            wabaId = whatsappScope.target_ids[0];
            console.log('[FB-Callback] Found WABA ID from granular scopes:', wabaId);
        }

        // Method 2: If no target_ids, try fetching via businesses API
        if (!wabaId) {
            step = 'discover_waba';
            console.log('[FB-Callback] Step 2b: No target_ids found, trying businesses API...');

            try {
                // First, get the user's businesses
                const businessesResponse = await axios.get('https://graph.facebook.com/v21.0/me/businesses', {
                    params: { access_token: accessToken }
                });

                const businesses = businessesResponse.data.data || [];
                console.log('[FB-Callback] Found businesses:', businesses.map(b => b.id));

                // For each business, check for owned WABAs
                for (const business of businesses) {
                    try {
                        const wabaResponse = await axios.get(`https://graph.facebook.com/v21.0/${business.id}/owned_whatsapp_business_accounts`, {
                            params: { access_token: accessToken }
                        });

                        const wabas = wabaResponse.data.data || [];
                        if (wabas.length > 0) {
                            wabaId = wabas[0].id;
                            console.log('[FB-Callback] Found WABA from business', business.id, ':', wabaId);
                            break;
                        }
                    } catch (wabaErr) {
                        console.log('[FB-Callback] Could not get WABAs for business', business.id);
                    }
                }
            } catch (bizErr) {
                console.log('[FB-Callback] Could not fetch businesses:', bizErr.message);
            }
        }

        // Method 3: If still no WABA, try shared_wabas from debug response
        if (!wabaId && debugResponse.data.data?.shared_wabas) {
            const sharedWabas = debugResponse.data.data.shared_wabas;
            if (sharedWabas.length > 0) {
                wabaId = sharedWabas[0];
                console.log('[FB-Callback] Found WABA from shared_wabas:', wabaId);
            }
        }

        // Method 4: Try to find WABA via client_waba_ids in debug response
        if (!wabaId && debugResponse.data.data) {
            console.log('[FB-Callback] Full debug_token response:', JSON.stringify(debugResponse.data.data, null, 2));

            // Check for client_waba_ids
            if (debugResponse.data.data.client_waba_ids && debugResponse.data.data.client_waba_ids.length > 0) {
                wabaId = debugResponse.data.data.client_waba_ids[0];
                console.log('[FB-Callback] Found WABA from client_waba_ids:', wabaId);
            }

            // Check messaging scope target_ids as well
            const messagingScope = granularScopes.find(s => s.scope === 'whatsapp_business_messaging');
            if (messagingScope && messagingScope.target_ids && messagingScope.target_ids.length > 0) {
                // messaging scope target_ids might be phone_number_ids, try to get WABA from there
                const possiblePhoneId = messagingScope.target_ids[0];
                console.log('[FB-Callback] Found possible phone ID from messaging scope:', possiblePhoneId);

                try {
                    // Try to get WABA from this phone number
                    const phoneWabaResponse = await axios.get(`https://graph.facebook.com/v21.0/${possiblePhoneId}`, {
                        params: {
                            fields: 'id,whatsapp_business_account',
                            access_token: accessToken
                        }
                    });

                    if (phoneWabaResponse.data?.whatsapp_business_account?.id) {
                        wabaId = phoneWabaResponse.data.whatsapp_business_account.id;
                        if (!phoneNumberId) phoneNumberId = possiblePhoneId;
                        console.log('[FB-Callback] Found WABA from messaging scope phone:', wabaId);
                    }
                } catch (phoneErr) {
                    console.log('[FB-Callback] Could not get WABA from messaging scope target:', phoneErr.message);
                }
            }
        }

        if (!wabaId) {
            // Log full debug data when failing
            console.error('[FB-Callback] FAILED - Full debug data:', JSON.stringify(debugResponse.data, null, 2));
            throw new Error('Could not identify WABA ID. Please ensure you completed the WhatsApp Business setup in the popup. Scopes found: ' + JSON.stringify(granularScopes.map(s => s.scope)));
        }
        console.log('[FB-Callback] Step 2 SUCCESS: WABA ID =', wabaId);

        // 3. Get Phone Number ID (skip if already provided from frontend)
        if (!phoneNumberId) {
            step = 'get_phone_numbers';
            console.log('[FB-Callback] Step 3: Fetching phone numbers for WABA', wabaId);
            const phoneResponse = await axios.get(`https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`, {
                params: { access_token: accessToken }
            });

            const phones = phoneResponse.data.data;
            if (!phones || phones.length === 0) {
                throw new Error('No phone numbers found in this WhatsApp Business Account');
            }

            const selectedPhone = phones[0];
            phoneNumberId = selectedPhone.id;
            console.log('[FB-Callback] Step 3 SUCCESS: Phone Number ID =', phoneNumberId);
        } else {
            console.log('[FB-Callback] Step 3 SKIPPED: Using direct Phone ID from frontend');
        }

        // 3.5 Confirm WABA ID from phone number details
        step = 'confirm_waba';
        console.log('[FB-Callback] Step 3.5: Confirming WABA ID from phone number...');
        const phoneDetailsResponse = await axios.get(`https://graph.facebook.com/v21.0/${phoneNumberId}`, {
            params: {
                fields: 'whatsapp_business_account',
                access_token: accessToken
            }
        });

        const confirmedWabaId = phoneDetailsResponse.data?.whatsapp_business_account?.id || wabaId;
        console.log('[FB-Callback] Step 3.5 SUCCESS: Confirmed WABA ID =', confirmedWabaId);

        // 4. Save to Database
        step = 'save_db';
        console.log('[FB-Callback] Step 4: Saving to database...');
        await prisma.$transaction([
            prisma.systemConfig.upsert({ where: { key: 'accessToken' }, update: { value: accessToken }, create: { key: 'accessToken', value: accessToken, description: 'Facebook System User Token' } }),
            prisma.systemConfig.upsert({ where: { key: 'wabaId' }, update: { value: String(confirmedWabaId) }, create: { key: 'wabaId', value: String(confirmedWabaId), description: 'WhatsApp Business Account ID' } }),
            prisma.systemConfig.upsert({ where: { key: 'phoneNumberId' }, update: { value: String(phoneNumberId) }, create: { key: 'phoneNumberId', value: String(phoneNumberId), description: 'WhatsApp Phone Number ID' } }),
            prisma.systemConfig.upsert({ where: { key: 'verifyToken' }, update: {}, create: { key: 'verifyToken', value: 'whatsms_token', description: 'Webhook Verification Token' } })
        ]);
        console.log('[FB-Callback] Step 4 SUCCESS: Database updated');

        res.json({ success: true, message: 'WhatsApp Connected Successfully', wabaId: confirmedWabaId, phoneNumberId });

    } catch (error) {
        const errorDetails = error.response?.data?.error?.message || error.response?.data || error.message;
        console.error(`[FB-Callback] FAILED at step "${step}":`, errorDetails);
        res.status(500).json({
            error: 'Failed to complete Facebook Login',
            step: step,
            details: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails
        });
    }
});

module.exports = router;
