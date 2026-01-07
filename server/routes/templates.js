const express = require('express');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/templates
 * List all message templates
 */
router.get('/', async (req, res) => {
    try {
        const templates = await prisma.messageTemplate.findMany({
            orderBy: { updatedAt: 'desc' }
        });

        res.json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch templates'
        });
    }
});

/**
 * GET /api/templates/:id
 * Get single template
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const template = await prisma.messageTemplate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!template) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Template not found'
            });
        }

        res.json({ template });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch template'
        });
    }
});

/**
 * POST /api/templates
 * Create a new template
 */
router.post('/', async (req, res) => {
    try {
        const { name, content } = req.body;

        if (!name || !content) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Name and content are required'
            });
        }

        const template = await prisma.messageTemplate.create({
            data: { name, content }
        });

        res.status(201).json({
            message: 'Template created successfully',
            template
        });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create template'
        });
    }
});

/**
 * PUT /api/templates/:id
 * Update a template
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, content } = req.body;

        const existing = await prisma.messageTemplate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Template not found'
            });
        }

        const template = await prisma.messageTemplate.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(content && { content })
            }
        });

        res.json({
            message: 'Template updated successfully',
            template
        });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update template'
        });
    }
});

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.messageTemplate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Template not found'
            });
        }

        await prisma.messageTemplate.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete template'
        });
    }
});

module.exports = router;
