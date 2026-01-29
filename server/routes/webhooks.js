const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsms-webhook-verify-token';

/**
 * GET /api/webhooks/whatsapp
 * Webhook verification endpoint for Meta
 * In multi-tenant mode, we accept any valid verifyToken from any user's WhatsAppCredential
 */
router.get('/whatsapp', async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
        // Check if the token matches any user's verifyToken in WhatsAppCredential
        const matchingCredential = await prisma.whatsAppCredential.findFirst({
            where: { verifyToken: token }
        });

        // Also check legacy SystemConfig for backward compatibility
        let legacyMatch = false;
        if (!matchingCredential) {
            const config = await prisma.systemConfig.findUnique({
                where: { key: 'verifyToken' }
            });
            const storedVerifyToken = config?.value || process.env.WHATSAPP_VERIFY_TOKEN || 'whatsms_token';
            legacyMatch = (token === storedVerifyToken);
        }

        if (mode === 'subscribe' && (matchingCredential || legacyMatch)) {
            console.log('✅ Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            console.warn(`❌ Webhook verification failed. Received token: ${token}`);
            res.sendStatus(403);
        }
    } catch (error) {
        console.error('Webhook verification error:', error);
        res.sendStatus(500);
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

                // Extract phone_number_id to identify which user this belongs to
                const phoneNumberId = value.metadata?.phone_number_id;
                let ownerUserId = null;

                if (phoneNumberId) {
                    const credential = await prisma.whatsAppCredential.findFirst({
                        where: { phoneNumberId: phoneNumberId }
                    });
                    if (credential) {
                        ownerUserId = credential.userId;
                        console.log(`📱 Webhook for user ID: ${ownerUserId} (phone: ${phoneNumberId})`);
                    } else {
                        console.log(`⚠️ No user found for phoneNumberId: ${phoneNumberId}`);
                    }
                }

                // Process status updates (delivered, read, failed)
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await processStatusUpdate(status);
                    }
                }

                // Process incoming messages (replies)
                if (value.messages) {
                    for (const message of value.messages) {
                        await processIncomingMessage(message, value.contacts, ownerUserId);
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
 * @param {object} message - The incoming message object
 * @param {array} contacts - Contact info from WhatsApp
 * @param {number} ownerUserId - The user ID who owns this phone number (for future data isolation)
 */
async function processIncomingMessage(message, contacts, ownerUserId = null) {
    const { from, timestamp, type, text } = message;

    console.log(`📥 Incoming message from ${from}: ${type}${ownerUserId ? ` (User: ${ownerUserId})` : ''}`);

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


    // Trigger Flow Automation (KEYWORD)
    try {
        const flowService = require('../services/FlowService');
        // Find the contact object either from existing or created
        const contact = await prisma.contact.findFirst({
            where: { phone: { endsWith: from.slice(-10) } }
        });

        if (contact) {
            flowService.triggerFlow('KEYWORD', {
                contact,
                message: { body: text?.body || '' }
            });
        }
    } catch (flowError) {
        console.error('Flow keyword trigger error:', flowError);
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