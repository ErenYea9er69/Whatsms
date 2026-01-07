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
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } }
            ]
        } : {};

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
        const { name, phone, interests = [], preferences = {} } = req.body;

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
                preferences
            }
        });

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
        const { name, phone, interests, preferences } = req.body;

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
                columns: true,
                skip_empty_lines: true,
                trim: true
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
            message: 'Failed to import contacts'
        });
    }
});

module.exports = router;
