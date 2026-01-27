const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get notes for a contact
router.get('/contact/:contactId', async (req, res) => {
    try {
        const { contactId } = req.params;
        const notes = await prisma.contactNote.findMany({
            where: { contactId: parseInt(contactId) },
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Add a note
router.post('/', async (req, res) => {
    try {
        const { contactId, authorId, content } = req.body;

        const note = await prisma.contactNote.create({
            data: {
                contactId: parseInt(contactId),
                authorId: authorId ? parseInt(authorId) : null,
                content
            },
            include: { author: true }
        });
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

module.exports = router;
