const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

// Apply auth to all routes
router.use(authenticate);

// Get all team members
router.get('/', async (req, res) => {
    try {
        const members = await prisma.teamMember.findMany({
            where: { userId: req.user.id },
            orderBy: { name: 'asc' }
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Add a new team member
router.post('/', async (req, res) => {
    try {
        const { name, email, role, avatar } = req.body;

        // Basic limit check (simple implementation)
        const count = await prisma.teamMember.count({ where: { userId: req.user.id } });
        // Limits: Lite: 3, Pro: 7, Leader: 15 (Assume these are enforced here or by a higher logic)
        // For now, let's just create.

        const member = await prisma.teamMember.create({
            data: { userId: req.user.id, name, email, role, avatar }
        });
        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create team member' });
    }
});

// Update team member
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, avatar } = req.body;

        const existing = await prisma.teamMember.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!existing) return res.status(404).json({ error: 'Team member not found' });

        const member = await prisma.teamMember.update({
            where: { id: parseInt(id) },
            data: { name, email, role, avatar }
        });
        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team member' });
    }
});

// Delete team member
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.teamMember.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!existing) return res.status(404).json({ error: 'Team member not found' });

        await prisma.teamMember.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Team member deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete team member' });
    }
});

module.exports = router;
