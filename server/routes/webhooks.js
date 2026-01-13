const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsms-webhook-verify-token';

/**
 * GET /api/webhooks/whatsapp
 * Webhook verification endpoint for Meta
 */
router.get('/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.warn('❌ Webhook verification failed');
        res.sendStatus(403);
    }
});

const crypto = require('crypto');

// ... (imports)

const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Middleware to verify webhook signature
const verifySignature = (req, res, next) => {
    if (!APP_SECRET) {
        console.warn('⚠️ WHATSAPP_APP_SECRET not set, skipping signature verification');
        return next();
    }

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
    }

    const elements = signature.split('=');
    const signatureHash = elements[1];
    const expectedHash = crypto
        .createHmac('sha256', APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signatureHash !== expectedHash) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
};

/**
 * POST /api/webhooks/whatsapp
 * Receive webhook events from WhatsApp
 */
router.post('/whatsapp', verifySignature, async (req, res) => {
    try {
        const body = req.body;

        // Always respond with 200 immediately to prevent retries
        res.sendStatus(200);

        if (!body.object || body.object !== 'whatsapp_business_account') {
            return;
        }

        // Process entries
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field !== 'messages') continue;

                const value = change.value;

                // Process status updates (delivered, read, failed)
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await processStatusUpdate(status);
                    }
                }

                // Process incoming messages (replies)
                if (value.messages) {
                    for (const message of value.messages) {
                        await processIncomingMessage(message, value.contacts);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
    }
});

/**
 * Process message status updates
 */
async function processStatusUpdate(status) {
    const { id: messageId, status: statusValue, timestamp, recipient_id } = status;

    console.log(`📊 Status update: ${statusValue} for ${recipient_id}`);

    // Find the recipient by phone number and recent campaigns
    const recipient = await prisma.campaignRecipient.findFirst({
        where: {
            contact: {
                phone: { endsWith: recipient_id.slice(-10) } // Match last 10 digits
            },
            status: { in: ['SENT', 'DELIVERED'] }
        },
        orderBy: { sentAt: 'desc' }
    });

    if (!recipient) {
        console.log(`No recipient found for ${recipient_id}`);
        return;
    }

    const updateData = {};

    switch (statusValue) {
        case 'delivered':
            updateData.status = 'DELIVERED';
            updateData.deliveredAt = new Date(parseInt(timestamp) * 1000);
            break;
        case 'read':
            updateData.status = 'READ';
            updateData.readAt = new Date(parseInt(timestamp) * 1000);
            break;
        case 'failed':
            updateData.status = 'FAILED';
            break;
        default:
            return;
    }

    // Update recipient status
    await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: updateData
    });

    // Update campaign stats
    if (statusValue === 'delivered') {
        await prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { statsDelivered: { increment: 1 } }
        });
    } else if (statusValue === 'read') {
        await prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { statsRead: { increment: 1 } }
        });
    } else if (statusValue === 'failed') {
        await prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { statsFailed: { increment: 1 } }
        });
    }
}

/**
 * Process incoming messages (replies)
 * Also auto-creates contacts if they don't exist
 */
async function processIncomingMessage(message, contacts) {
    const { from, timestamp, type, text } = message;

    console.log(`📥 Incoming message from ${from}: ${type}`);

    // Get contact name from WhatsApp if available
    const waContact = contacts?.find(c => c.wa_id === from);
    const contactName = waContact?.profile?.name || `WhatsApp User`;

    // Auto-create or update contact if not exists
    try {
        const existingContact = await prisma.contact.findFirst({
            where: {
                phone: { endsWith: from.slice(-10) }
            }
        });

        if (!existingContact) {
            await prisma.contact.create({
                data: {
                    name: contactName,
                    phone: from,
                    tags: ['whatsapp-import'],
                    interests: [],
                    preferences: {}
                }
            });
            console.log(`✅ Auto-created contact for ${from} (${contactName})`);
        }
    } catch (err) {
        console.error('Failed to auto-create contact:', err);
    }

    // Find recent recipient
    const recipient = await prisma.campaignRecipient.findFirst({
        where: {
            contact: {
                phone: { endsWith: from.slice(-10) }
            },
            status: { in: ['SENT', 'DELIVERED', 'READ'] },
            replied: false
        },
        orderBy: { sentAt: 'desc' }
    });

    if (recipient) {
        // Mark as replied
        await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { replied: true }
        });

        // Update campaign stats
        await prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { statsReplied: { increment: 1 } }
        });

        console.log(`✅ Marked recipient ${recipient.id} as replied`);
    }
}

module.exports = router;