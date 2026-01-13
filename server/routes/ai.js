const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
    try {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const response = await aiService.generateResponse(messages, model);
        res.json({ content: response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
