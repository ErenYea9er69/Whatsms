const express = require('express');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/flows
 * List all flows
 */
router.get('/', async (req, res) => {
    try {
        const flows = await prisma.flow.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { executions: true }
                }
            }
        });
        res.json(flows);
    } catch (error) {
        console.error('Get flows error:', error);
        res.status(500).json({ error: 'Failed to fetch flows' });
    }
});

/**
 * GET /api/flows/:id
 * Get single flow with details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const flow = await prisma.flow.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }

        res.json(flow);
    } catch (error) {
        console.error('Get flow error:', error);
        res.status(500).json({ error: 'Failed to fetch flow' });
    }
});

/**
 * POST /api/flows
 * Create a new flow
 */
router.post('/', async (req, res) => {
    try {
        const { name, description, triggerType, content } = req.body;

        const flow = await prisma.flow.create({
            data: {
                userId: req.user.id,
                name,
                description,
                triggerType: triggerType || 'NEW_CONTACT',
                content: content || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
                isActive: false
            }
        });

        res.status(201).json(flow);
    } catch (error) {
        console.error('Create flow error:', error);
        res.status(500).json({ error: 'Failed to create flow' });
    }
});

/**
 * PUT /api/flows/:id
 * Update a flow
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, triggerType, triggerKeyword, content, isActive } = req.body;

        const existing = await prisma.flow.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!existing) return res.status(404).json({ error: 'Flow not found' });

        const flow = await prisma.flow.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                triggerType,
                triggerKeyword,
                content,
                isActive
            }
        });

        res.json(flow);
    } catch (error) {
        console.error('Update flow error:', error);
        res.status(500).json({ error: 'Failed to update flow' });
    }
});

/**
 * DELETE /api/flows/:id
 * Delete a flow
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.flow.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!existing) return res.status(404).json({ error: 'Flow not found' });

        await prisma.flow.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Flow deleted successfully' });
    } catch (error) {
        console.error('Delete flow error:', error);
        res.status(500).json({ error: 'Failed to delete flow' });
    }
});

module.exports = router;
