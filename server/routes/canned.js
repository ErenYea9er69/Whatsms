const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all canned replies
router.get('/', async (req, res) => {
    try {
        const replies = await prisma.cannedReply.findMany({
            orderBy: { title: 'asc' }
        });
        res.json(replies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a canned reply
router.post('/', async (req, res) => {
    try {
        const { title, shortcut, content } = req.body;

        // Ensure shortcut starts with /
        const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;

        const reply = await prisma.cannedReply.create({
            data: {
                title,
                shortcut: formattedShortcut,
                content
            }
        });
        res.json(reply);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Shortcut already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete a canned reply
router.delete('/:id', async (req, res) => {
    try {
        await prisma.cannedReply.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
