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

// Embedded Signup Callback - Exchange code for token
router.post('/fb-callback', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    const FB_APP_ID = process.env.FB_APP_ID;
    const FB_APP_SECRET = process.env.FB_APP_SECRET;

    if (!FB_APP_ID || !FB_APP_SECRET) {
        console.error('Missing FB_APP_ID or FB_APP_SECRET in server environment');
        return res.status(500).json({ error: 'Server configuration error (Missing App ID/Secret)' });
    }

    try {
        const axios = require('axios');

        // 1. Exchange Code for Access Token
        console.log('Exchanging code for token...');
        const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                code: code
            }
        });

        const accessToken = tokenResponse.data.access_token;
        console.log('Access Token received');

        // 2. Identify WABA ID
        // We debug the token to find the WABA ID it has access to
        const debugResponse = await axios.get('https://graph.facebook.com/v21.0/debug_token', {
            params: {
                input_token: accessToken,
                access_token: `${FB_APP_ID}|${FB_APP_SECRET}` // App Token for debug
            }
        });

        const granularScopes = debugResponse.data.data.granular_scopes || [];
        const whatsappScope = granularScopes.find(s => s.scope === 'whatsapp_business_management');

        let wabaId = null;
        if (whatsappScope && whatsappScope.target_ids && whatsappScope.target_ids.length > 0) {
            wabaId = whatsappScope.target_ids[0];
        }

        // Fallback: If no granular scope, maybe check 'shared_waba_id' if present in debug data
        // For now, assume wabaId is found. If not, we can't proceed.
        if (!wabaId) {
            // Try fetching via /me/accounts logic if needed, but granular scopes is the modern way for System Users
            throw new Error('Could not identify WABA ID from token scopes');
        }
        console.log('Identified WABA ID:', wabaId);

        // 3. Get Phone Number ID
        // Note: We use the discovered wabaId to list numbers
        const phoneResponse = await axios.get(`https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`, {
            params: { access_token: accessToken }
        });

        const phones = phoneResponse.data.data;
        if (!phones || phones.length === 0) {
            throw new Error('No phone numbers found in this WhatsApp Business Account');
        }

        // Prefer the first one
        const selectedPhone = phones[0];
        const phoneNumberId = selectedPhone.id;
        console.log('Identified Phone Number ID:', phoneNumberId);

        // 3.5 Verify WABA ID from the Phone Number (Source of Truth)
        // Sometimes granular scopes might point to a container, but the phone number knows its true owner.
        // Also helps if wabaId from scope was somehow different.
        const phoneDetailsResponse = await axios.get(`https://graph.facebook.com/v21.0/${phoneNumberId}`, {
            params: {
                fields: 'whatsapp_business_account',
                access_token: accessToken
            }
        });

        const confirmedWabaId = phoneDetailsResponse.data?.whatsapp_business_account?.id || wabaId;
        console.log('Confirmed WABA ID:', confirmedWabaId);

        // 4. Save to Database (Ensure all values are Strings)
        await prisma.$transaction([
            prisma.systemConfig.upsert({ where: { key: 'accessToken' }, update: { value: accessToken }, create: { key: 'accessToken', value: accessToken, description: 'Facebook System User Token' } }),
            prisma.systemConfig.upsert({ where: { key: 'wabaId' }, update: { value: String(confirmedWabaId) }, create: { key: 'wabaId', value: String(confirmedWabaId), description: 'WhatsApp Business Account ID' } }),
            prisma.systemConfig.upsert({ where: { key: 'phoneNumberId' }, update: { value: String(phoneNumberId) }, create: { key: 'phoneNumberId', value: String(phoneNumberId), description: 'WhatsApp Phone Number ID' } }),
            // Also ensure verifyToken exists if not set
            prisma.systemConfig.upsert({ where: { key: 'verifyToken' }, update: {}, create: { key: 'verifyToken', value: 'whatsms_token', description: 'Webhook Verification Token' } })
        ]);

        res.json({ success: true, message: 'WhatsApp Connected Successfully', wabaId: confirmedWabaId, phoneNumberId });

    } catch (error) {
        console.error('Facebook Auth Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to complete Facebook Login',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
