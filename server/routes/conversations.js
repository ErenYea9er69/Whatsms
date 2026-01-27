const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all conversations (with filters)
router.get('/', async (req, res) => {
    try {
        const { status, assignedToId } = req.query;
        const where = {};

        if (status) where.status = status;
        if (assignedToId) where.assignedToId = parseInt(assignedToId);

        // Find contacts with conversations or just fetch conversations?
        // Our schema has Conversation linked to Contact. 
        // We usually want to show a list of conversations.

        const conversations = await prisma.conversation.findMany({
            where,
            include: {
                contact: true,
                assignedTo: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' } // Most recent activity first
        });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get single conversation details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await prisma.conversation.findUnique({
            where: { id: parseInt(id) },
            include: {
                contact: true,
                assignedTo: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: { sender: true }
                }
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Send a message (Outbound from agent)
router.post('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, senderId, type = 'TEXT' } = req.body;

        // 1. Create the message
        const message = await prisma.conversationMessage.create({
            data: {
                conversationId: parseInt(id),
                content,
                senderId: senderId ? parseInt(senderId) : null,
                direction: 'OUTBOUND',
                type
            },
            include: { sender: true }
        });

        // 2. Update conversation: lastMessage, updatedAt, unreadCount (for user? no, for agent it's read)
        await prisma.conversation.update({
            where: { id: parseInt(id) },
            data: {
                lastMessage: content,
                lastMessageAt: new Date(),
                updatedAt: new Date()
                // status might remain OPEN
            }
        });

        // TODO: TRIGGER EXTERNAL SENDING (TWILIO/ETC) HERE

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Assign conversation
router.put('/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;

        const conversation = await prisma.conversation.update({
            where: { id: parseInt(id) },
            data: {
                assignedToId: assignedToId ? parseInt(assignedToId) : null
            },
            include: { assignedTo: true }
        });

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign conversation' });
    }
});

// Update status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const conversation = await prisma.conversation.update({
            where: { id: parseInt(id) },
            data: { status },
            include: { contact: true, assignedTo: true }
        });

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

module.exports = router;
