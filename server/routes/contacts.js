const express = require('express');
const { parse } = require('csv-parse');
const multer = require('multer');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/contacts
 * List contacts with pagination and search
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            tag = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } }
            ];
        }

        // Filter by tag
        if (tag) {
            where.tags = { has: tag };
        }

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    lists: {
                        include: {
                            contactList: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            }),
            prisma.contact.count({ where })
        ]);

        // Transform to include list names directly
        const transformedContacts = contacts.map(contact => ({
            ...contact,
            lists: contact.lists.map(l => l.contactList)
        }));

        res.json({
            contacts: transformedContacts,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch contacts'
        });
    }
});

/**
 * GET /api/contacts/stats
 * Get contact statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [total, thisWeek, listsCount] = await Promise.all([
            prisma.contact.count(),
            prisma.contact.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            prisma.contactList.count()
        ]);

        res.json({
            total,
            thisWeek,
            listsCount
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
 * GET /api/contacts/tags
 * Get all unique tags across contacts
 */
router.get('/tags', async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany({
            select: { tags: true }
        });

        // Flatten and get unique tags
        const allTags = contacts.flatMap(c => c.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();

        res.json({ tags: uniqueTags });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch tags'
        });
    }
});

/**
 * GET /api/contacts/:id
 * Get single contact by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await prisma.contact.findUnique({
            where: { id: parseInt(id) },
            include: {
                lists: {
                    include: {
                        contactList: true
                    }
                },
                messages: {
                    include: {
                        campaign: {
                            select: { id: true, name: true }
                        }
                    },
                    orderBy: { sentAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!contact) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Contact not found'
            });
        }

        res.json({ contact });
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch contact'
        });
    }
});

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post('/', async (req, res) => {
    try {
        const { name, phone, interests = [], tags = [], preferences = {} } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Name and phone are required'
            });
        }

        // Check for duplicate phone
        const existing = await prisma.contact.findUnique({
            where: { phone }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A contact with this phone number already exists'
            });
        }

        const contact = await prisma.contact.create({
            data: {
                name,
                phone,
                interests,
                tags,
                preferences
            }
        });

        // Trigger automation flows
        try {
            const flowService = require('../services/FlowService');
            flowService.triggerFlow('NEW_CONTACT', { contact });
        } catch (flowError) {
            console.error('Flow trigger error:', flowError);
        }

        res.status(201).json({
            message: 'Contact created successfully',
            contact
        });
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create contact'
        });
    }
});

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, interests, tags, preferences } = req.body;

        const existing = await prisma.contact.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Contact not found'
            });
        }

        // Check for duplicate phone if changing
        if (phone && phone !== existing.phone) {
            const duplicate = await prisma.contact.findUnique({
                where: { phone }
            });
            if (duplicate) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'A contact with this phone number already exists'
                });
            }
        }

        const contact = await prisma.contact.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(interests && { interests }),
                ...(tags !== undefined && { tags }),
                ...(preferences && { preferences })
            }
        });

        res.json({
            message: 'Contact updated successfully',
            contact
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update contact'
        });
    }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.contact.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Contact not found'
            });
        }

        await prisma.contact.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete contact'
        });
    }
});

/**
 * POST /api/contacts/import
 * Import contacts from CSV file
 * Expected columns: name, phone, interests (comma-separated)
 */
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'CSV file is required'
            });
        }

        const csvData = req.file.buffer.toString('utf-8');

        const records = await new Promise((resolve, reject) => {
            parse(csvData, {
                columns: headers => {
                    if (!Array.isArray(headers)) return [];
                    return headers.map(header => {
                        if (header === null || header === undefined) return '';
                        const h = String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (['name', 'firstname', 'fullname', 'contact', 'customer'].includes(h)) return 'name';
                        if (['phone', 'phonenumber', 'mobile', 'mobilenumber', 'cell', 'tel', 'contactnumber', 'number'].includes(h)) return 'phone';
                        if (['interests', 'tags', 'labels', 'keywords'].includes(h)) return 'interests';
                        return h;
                    });
                },
                skip_empty_lines: true,
                trim: true,
                bom: true,
                relax_column_count: true
            }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
            });
        });

        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (const record of records) {
            const name = record.name || record.Name;
            const phone = record.phone || record.Phone || record.phone_number;
            const interestsStr = record.interests || record.Interests || '';

            if (!name || !phone) {
                skipped++;
                errors.push(`Row missing name or phone`);
                continue;
            }

            const interests = interestsStr
                .split(',')
                .map(i => i.trim())
                .filter(i => i);

            try {
                await prisma.contact.upsert({
                    where: { phone },
                    create: { name, phone, interests },
                    update: { name, interests }
                });
                imported++;
            } catch (err) {
                skipped++;
                errors.push(`Failed to import ${phone}: ${err.message}`);
            }
        }

        res.json({
            message: 'Import completed',
            imported,
            skipped,
            total: records.length,
            errors: errors.slice(0, 10) // Return first 10 errors
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to import contacts',
            details: error.message, // Temporary for debugging
            stack: error.stack // Temporary for debugging
        });
    }
});

/**
 * POST /api/contacts/fetch-whatsapp
 * Fetch contacts from recent WhatsApp conversations
 */
router.post('/fetch-whatsapp', async (req, res) => {
    try {
        const axios = require('axios');

        // Get WhatsApp credentials
        let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        let businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        // Try to get from DB config
        try {
            const settings = await prisma.systemConfig.findMany({
                where: { key: { in: ['accessToken', 'phoneNumberId', 'businessAccountId'] } }
            });
            const dbConfig = settings.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            if (dbConfig.accessToken) accessToken = dbConfig.accessToken;
            if (dbConfig.phoneNumberId) phoneNumberId = dbConfig.phoneNumberId;
            if (dbConfig.businessAccountId) businessAccountId = dbConfig.businessAccountId;
        } catch (e) {
            // Use env vars
        }

        if (!accessToken || !businessAccountId) {
            return res.status(400).json({
                error: 'Configuration Error',
                message: 'WhatsApp credentials not configured. Please set up your API credentials in settings.'
            });
        }

        // Fetch conversations from WhatsApp Business API
        const conversationsUrl = `https://graph.facebook.com/v22.0/${businessAccountId}/conversations`;

        let imported = 0;
        let skipped = 0;
        const errors = [];

        try {
            const response = await axios.get(conversationsUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: { fields: 'name,id' }
            });

            const conversations = response.data?.data || [];

            for (const conv of conversations) {
                // Each conversation has contact info
                // The conversation ID format is like "PHONE_wa_id_..."
                const phoneMatch = conv.id?.match(/(\d{10,15})/);
                if (!phoneMatch) continue;

                const phone = phoneMatch[1];
                const name = conv.name || `WhatsApp ${phone.slice(-4)}`;

                // Check if contact exists
                const existing = await prisma.contact.findFirst({
                    where: { phone: { endsWith: phone.slice(-10) } }
                });

                if (!existing) {
                    try {
                        await prisma.contact.create({
                            data: {
                                name,
                                phone,
                                tags: ['whatsapp-import'],
                                interests: [],
                                preferences: {}
                            }
                        });
                        imported++;
                    } catch (err) {
                        errors.push(`Failed to create ${phone}: ${err.message}`);
                    }
                } else {
                    skipped++;
                }
            }
        } catch (apiError) {
            console.error('WhatsApp API Error:', apiError.response?.data || apiError.message);

            // Fallback: try to get contacts from campaign recipients who replied
            const recentRepliers = await prisma.campaignRecipient.findMany({
                where: { replied: true },
                include: { contact: true },
                distinct: ['contactId']
            });

            // These are already in contacts, so just report what we have
            return res.json({
                message: 'Could not fetch from WhatsApp API. Showing existing contacts who replied to campaigns.',
                imported: 0,
                skipped: recentRepliers.length,
                total: recentRepliers.length,
                note: 'Contacts are automatically added when someone messages your WhatsApp number.'
            });
        }

        res.json({
            message: 'WhatsApp contacts sync completed',
            imported,
            skipped,
            total: imported + skipped,
            errors: errors.slice(0, 5)
        });

    } catch (error) {
        console.error('Fetch WhatsApp error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch WhatsApp contacts'
        });
    }
});

module.exports = router;
