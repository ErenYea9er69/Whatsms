const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');

// All settings routes require authentication
router.use(authenticate);

// Get user's WhatsApp credentials
router.get('/', async (req, res) => {
    try {
        const credential = await prisma.whatsAppCredential.findUnique({
            where: { userId: req.user.id }
        });

        if (!credential) {
            // Return empty config if none exists
            return res.json({
                phoneNumberId: '',
                accessToken: '',
                wabaId: '',
                verifyToken: 'whatsms_token'
            });
        }

        res.json({
            phoneNumberId: credential.phoneNumberId || '',
            accessToken: credential.accessToken || '',
            wabaId: credential.wabaId || '',
            verifyToken: credential.verifyToken || 'whatsms_token'
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Save/update user's WhatsApp credentials (upsert)
router.post('/', async (req, res) => {
    const { phoneNumberId, accessToken, wabaId, verifyToken } = req.body;

    if (!phoneNumberId || !accessToken) {
        return res.status(400).json({ error: 'Phone Number ID and Access Token are required' });
    }

    try {
        await prisma.whatsAppCredential.upsert({
            where: { userId: req.user.id },
            update: {
                phoneNumberId,
                accessToken,
                wabaId: wabaId || null,
                verifyToken: verifyToken || 'whatsms_token'
            },
            create: {
                userId: req.user.id,
                phoneNumberId,
                accessToken,
                wabaId: wabaId || null,
                verifyToken: verifyToken || 'whatsms_token'
            }
        });

        res.json({ success: true, message: 'Credentials saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Test WhatsApp connection using user's credentials
router.post('/test', async (req, res) => {
    try {
        const whatsappService = require('../services/whatsapp');
        const { targetPhone } = req.body;

        if (targetPhone) {
            try {
                // Pass the user ID to use their credentials
                await whatsappService.sendTemplateMessage(
                    targetPhone,
                    'hello_world',
                    'en_US',
                    [],
                    req.user.id
                );
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

module.exports = router;
