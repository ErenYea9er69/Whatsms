const express = require('express');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/lists
 * List all contact lists with member counts
 */
router.get('/', async (req, res) => {
    try {
        const lists = await prisma.contactList.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const transformedLists = lists.map(list => ({
            id: list.id,
            name: list.name,
            description: list.description,
            memberCount: list._count.members,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt
        }));

        res.json({ lists: transformedLists });
    } catch (error) {
        console.error('Get lists error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch lists'
        });
    }
});

/**
 * GET /api/lists/:id
 * Get single list with members
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const list = await prisma.contactList.findUnique({
            where: { id: parseInt(id) },
            include: {
                members: {
                    skip,
                    take,
                    include: {
                        contact: true
                    },
                    orderBy: { assignedAt: 'desc' }
                },
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!list) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'List not found'
            });
        }

        res.json({
            list: {
                id: list.id,
                name: list.name,
                description: list.description,
                memberCount: list._count.members,
                createdAt: list.createdAt,
                updatedAt: list.updatedAt
            },
            members: list.members.map(m => m.contact),
            pagination: {
                page: parseInt(page),
                limit: take,
                total: list._count.members,
                totalPages: Math.ceil(list._count.members / take)
            }
        });
    } catch (error) {
        console.error('Get list error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch list'
        });
    }
});

/**
 * POST /api/lists
 * Create a new contact list
 */
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'List name is required'
            });
        }

        const list = await prisma.contactList.create({
            data: { name, description }
        });

        res.status(201).json({
            message: 'List created successfully',
            list
        });
    } catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create list'
        });
    }
});

/**
 * PUT /api/lists/:id
 * Update a contact list
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const existing = await prisma.contactList.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'List not found'
            });
        }

        const list = await prisma.contactList.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            }
        });

        res.json({
            message: 'List updated successfully',
            list
        });
    } catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update list'
        });
    }
});

/**
 * DELETE /api/lists/:id
 * Delete a contact list
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.contactList.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'List not found'
            });
        }

        await prisma.contactList.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete list'
        });
    }
});

/**
 * POST /api/lists/:id/contacts
 * Add contacts to a list
 */
router.post('/:id/contacts', async (req, res) => {
    try {
        const { id } = req.params;
        const { contactIds } = req.body;

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'contactIds array is required'
            });
        }

        const listId = parseInt(id);

        // Verify list exists
        const list = await prisma.contactList.findUnique({
            where: { id: listId }
        });

        if (!list) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'List not found'
            });
        }

        // Add contacts (skip duplicates)
        const results = await Promise.allSettled(
            contactIds.map(contactId =>
                prisma.contactListMember.create({
                    data: {
                        contactId: parseInt(contactId),
                        contactListId: listId
                    }
                })
            )
        );

        const added = results.filter(r => r.status === 'fulfilled').length;
        const skipped = results.filter(r => r.status === 'rejected').length;

        res.json({
            message: 'Contacts added to list',
            added,
            skipped
        });
    } catch (error) {
        console.error('Add contacts error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to add contacts to list'
        });
    }
});

/**
 * DELETE /api/lists/:id/contacts/:contactId
 * Remove a contact from a list
 */
router.delete('/:id/contacts/:contactId', async (req, res) => {
    try {
        const { id, contactId } = req.params;

        await prisma.contactListMember.delete({
            where: {
                contactId_contactListId: {
                    contactId: parseInt(contactId),
                    contactListId: parseInt(id)
                }
            }
        });

        res.json({ message: 'Contact removed from list' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Contact not in this list'
            });
        }
        console.error('Remove contact error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove contact from list'
        });
    }
});

module.exports = router;
