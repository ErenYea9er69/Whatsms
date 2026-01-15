const express = require('express');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');
const whatsappService = require('../services/whatsapp');
const mockService = require('../services/MockService');

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/campaigns
 * List campaigns with filtering
 */
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = status ? { status } : {};

        const [campaigns, total] = await Promise.all([
            prisma.campaign.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { recipients: true, attachments: true }
                    }
                }
            }),
            prisma.campaign.count({ where })
        ]);

        const transformedCampaigns = campaigns.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            scheduledAt: c.scheduledAt,
            messageBody: c.messageBody,
            recipientCount: c._count.recipients,
            attachmentCount: c._count.attachments,
            statsDelivered: c.statsDelivered,
            statsRead: c.statsRead,
            statsFailed: c.statsFailed,
            statsReplied: c.statsReplied,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        }));

        res.json({
            campaigns: transformedCampaigns,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch campaigns'
        });
    }
});

/**
 * GET /api/campaigns/stats
 * Get overall campaign statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            totalCampaigns,
            activeCampaigns,
            stats
        ] = await Promise.all([
            prisma.campaign.count(),
            prisma.campaign.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.campaign.aggregate({
                _sum: {
                    statsDelivered: true,
                    statsRead: true,
                    statsFailed: true,
                    statsReplied: true
                }
            })
        ]);

        const totalSent = (stats._sum.statsDelivered || 0) + (stats._sum.statsFailed || 0);
        const deliveryRate = totalSent > 0
            ? ((stats._sum.statsDelivered || 0) / totalSent * 100).toFixed(1)
            : 0;
        const readRate = (stats._sum.statsDelivered || 0) > 0
            ? ((stats._sum.statsRead || 0) / (stats._sum.statsDelivered || 1) * 100).toFixed(1)
            : 0;

        res.json({
            totalCampaigns,
            activeCampaigns,
            totalMessagesSent: totalSent,
            totalDelivered: stats._sum.statsDelivered || 0,
            totalRead: stats._sum.statsRead || 0,
            totalFailed: stats._sum.statsFailed || 0,
            totalReplied: stats._sum.statsReplied || 0,
            deliveryRate: parseFloat(deliveryRate),
            readRate: parseFloat(readRate)
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /api/campaigns/:id
 * Get single campaign with details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: { id: parseInt(id) },
            include: {
                attachments: {
                    include: {
                        media: true
                    }
                },
                _count: {
                    select: { recipients: true }
                }
            }
        });

        if (!campaign) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Campaign not found'
            });
        }

        res.json({
            campaign: {
                ...campaign,
                recipientCount: campaign._count.recipients,
                attachments: campaign.attachments.map(a => a.media)
            }
        });
    } catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch campaign'
        });
    }
});

/**
 * GET /api/campaigns/:id/recipients
 * Get campaign recipients with delivery status
 */
router.get('/:id/recipients', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            campaignId: parseInt(id),
            ...(status && { status })
        };

        const [recipients, total] = await Promise.all([
            prisma.campaignRecipient.findMany({
                where,
                skip,
                take,
                include: {
                    contact: {
                        select: { id: true, name: true, phone: true }
                    }
                },
                orderBy: { sentAt: 'desc' }
            }),
            prisma.campaignRecipient.count({ where })
        ]);

        res.json({
            recipients,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Get recipients error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch recipients'
        });
    }
});

/**
 * POST /api/campaigns
 * Create a new campaign (draft)
 */
router.post('/', async (req, res) => {
    try {
        const { name, messageBody, listIds = [], scheduledAt, mediaIds = [] } = req.body;

        if (!name || !messageBody) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Name and messageBody are required'
            });
        }

        // Create campaign
        const campaign = await prisma.campaign.create({
            data: {
                name,
                messageBody,
                status: 'DRAFT',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null
            }
        });

        // Add recipients from lists
        if (listIds.length > 0) {
            const listMembers = await prisma.contactListMember.findMany({
                where: {
                    contactListId: { in: listIds.map(id => parseInt(id)) }
                },
                select: { contactId: true }
            });

            const uniqueContactIds = [...new Set(listMembers.map(m => m.contactId))];

            if (uniqueContactIds.length > 0) {
                await prisma.campaignRecipient.createMany({
                    data: uniqueContactIds.map(contactId => ({
                        campaignId: campaign.id,
                        contactId,
                        status: 'PENDING'
                    })),
                    skipDuplicates: true
                });
            }
        }

        // Add media attachments
        if (mediaIds.length > 0) {
            await prisma.campaignAttachment.createMany({
                data: mediaIds.map(mediaId => ({
                    campaignId: campaign.id,
                    mediaId: parseInt(mediaId)
                }))
            });
        }

        const createdCampaign = await prisma.campaign.findUnique({
            where: { id: campaign.id },
            include: {
                _count: { select: { recipients: true, attachments: true } }
            }
        });

        res.status(201).json({
            message: 'Campaign created successfully',
            campaign: {
                ...createdCampaign,
                recipientCount: createdCampaign._count.recipients,
                attachmentCount: createdCampaign._count.attachments
            }
        });
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create campaign'
        });
    }
});

/**
 * PUT /api/campaigns/:id
 * Update a campaign (only if DRAFT)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, messageBody, scheduledAt } = req.body;

        const existing = await prisma.campaign.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Campaign not found'
            });
        }

        if (existing.status !== 'DRAFT' && existing.status !== 'SCHEDULED') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Can only edit DRAFT or SCHEDULED campaigns'
            });
        }

        const campaign = await prisma.campaign.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(messageBody && { messageBody }),
                ...(scheduledAt !== undefined && {
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : null
                })
            }
        });

        res.json({
            message: 'Campaign updated successfully',
            campaign
        });
    } catch (error) {
        console.error('Update campaign error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update campaign'
        });
    }
});

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.campaign.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Campaign not found'
            });
        }

        if (existing.status === 'IN_PROGRESS') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot delete an in-progress campaign. Stop it first.'
            });
        }

        await prisma.campaign.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete campaign'
        });
    }
});

/**
 * POST /api/campaigns/:id/send
 * Start sending a campaign
 */
router.post('/:id/send', async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: { id: parseInt(id) },
            include: {
                recipients: {
                    where: { status: 'PENDING' },
                    include: {
                        contact: true
                    }
                },
                attachments: {
                    include: { media: true }
                }
            }
        });

        if (!campaign) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Campaign not found'
            });
        }

        if (campaign.status === 'IN_PROGRESS') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Campaign is already in progress'
            });
        }

        if (campaign.status === 'COMPLETED') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Campaign has already been completed'
            });
        }

        if (campaign.recipients.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Campaign has no pending recipients'
            });
        }

        // Update status to IN_PROGRESS
        await prisma.campaign.update({
            where: { id: parseInt(id) },
            data: { status: 'IN_PROGRESS' }
        });

        // Send messages asynchronously
        // In production, this would be a background job
        sendCampaignMessages(campaign);

        res.json({
            message: 'Campaign sending started',
            recipientCount: campaign.recipients.length
        });
    } catch (error) {
        console.error('Send campaign error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to start campaign'
        });
    }
});

/**
 * POST /api/campaigns/:id/stop
 * Stop an in-progress campaign
 */
router.post('/:id/stop', async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: { id: parseInt(id) }
        });

        if (!campaign) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Campaign not found'
            });
        }

        if (campaign.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Campaign is not in progress'
            });
        }

        await prisma.campaign.update({
            where: { id: parseInt(id) },
            data: { status: 'STOPPED' }
        });

        res.json({ message: 'Campaign stopped' });
    } catch (error) {
        console.error('Stop campaign error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to stop campaign'
        });
    }
});

/**
 * Background function to send campaign messages
 */


// ... existing code ...

const pLimit = require('../utils/concurrency');

/**
 * Background function to send campaign messages
 */
async function sendCampaignMessages(campaign) {
    // Check if in Mock Mode using the async function
    const isMockMode = await whatsappService.checkMockMode();

    if (isMockMode) {
        return mockService.startCampaignSimulation(campaign.id);
    }

    console.log(`Starting campaign ${campaign.id} with ${campaign.recipients.length} recipients`);

    // Concurrency limit - optimized for WhatsApp Cloud API
    // Tier 1 allows ~80 msgs/sec. We'll be safe with 20 concurrent.
    const limit = pLimit(20);

    let delivered = 0;
    let failed = 0;
    let skipped = 0;

    // Check if message body looks like a template name (snake_case, no spaces)
    // OR if we're using a test number (which REQUIRES templates for first contact)
    const isTemplateName = /^[a-z0-9_]+$/.test(campaign.messageBody);

    // For Test Numbers: We need to use the hello_world template
    // because test numbers can ONLY initiate conversations with approved templates
    const useTemplate = isTemplateName;

    const tasks = campaign.recipients.map(recipient => {
        return limit(async () => {
            try {
                if (useTemplate) {
                    // Send as template message
                    console.log(`📤 Sending template "${campaign.messageBody}" to ${recipient.contact.phone}`);
                    await whatsappService.sendTemplateMessage(
                        recipient.contact.phone,
                        campaign.messageBody,
                        'en_US'
                    );
                } else {
                    // Send as text message (only works if user has already messaged you first)
                    const personalizedMessage = campaign.messageBody
                        .replace(/\{\{name\}\}/g, recipient.contact.name || '')
                        .replace(/\{\{phone\}\}/g, recipient.contact.phone || '');

                    console.log(`📤 Sending text to ${recipient.contact.phone}: "${personalizedMessage.substring(0, 50)}..."`);
                    await whatsappService.sendTextMessage(
                        recipient.contact.phone,
                        personalizedMessage
                    );
                }

                // 2. Send Attachments
                if (campaign.attachments && campaign.attachments.length > 0) {
                    for (const attachment of campaign.attachments) {
                        const media = attachment.media;

                        // Determine type from mimetype
                        let type = 'document';
                        if (media.mimetype.startsWith('image/')) type = 'image';
                        else if (media.mimetype.startsWith('video/')) type = 'video';
                        else if (media.mimetype.startsWith('audio/')) type = 'audio';

                        await whatsappService.sendMediaMessage(
                            recipient.contact.phone,
                            media.path, // This contains the WhatsApp Media ID
                            type,
                            '' // No caption for subsequent media, or use filename?
                        );
                    }
                }

                // Update recipient status
                await prisma.campaignRecipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date()
                    }
                });

                delivered++;
            } catch (error) {
                console.error(`Failed to send to ${recipient.contact.phone}:`, error.message);

                await prisma.campaignRecipient.update({
                    where: { id: recipient.id },
                    data: { status: 'FAILED' }
                });

                failed++;
            }
        });
    });

    // Wait for all messages to be processed
    await Promise.all(tasks);

    // Update campaign stats
    await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
            status: 'COMPLETED',
            statsDelivered: { increment: delivered },
            statsFailed: { increment: failed }
        }
    });

    console.log(`Campaign ${campaign.id} completed: ${delivered} sent, ${failed} failed`);
}

module.exports = router;
