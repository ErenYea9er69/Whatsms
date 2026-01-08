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

module.exports = router;
