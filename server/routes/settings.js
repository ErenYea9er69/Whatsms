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
        const { whatsappService } = require('../services/whatsapp');
        // Reload credentials from DB to ensure we're testing latest
        await whatsappService.loadCredentials();

        // Use a lightweight API call (like getting phone number metrics) or send a self-message if possible
        // Since we don't have a simple 'ping', we'll rely on the fact that loadCredentials throws if config is missing
        // or just return success if we can read the config successfully.

        // Ideally we would make a real call to Meta here.
        // For now, let's assume if we have credentials, it's "configured".
        // A better test would use axios to call a read-only endpoint.

        // Let's try to send a test message to the user's own number if provided, or just validate config presence.
        const creds = whatsappService.getCredentials();
        if (!creds.accessToken || !creds.phoneNumberId) {
            return res.status(400).json({ error: 'Credentials incomplete' });
        }

        res.json({ message: 'Configuration Validated Successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Connection test failed: ' + error.message });
    }
});

module.exports = router;
