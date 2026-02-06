const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
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



// POST /api/ai/analyze-template
router.post('/analyze-template', async (req, res) => {
    try {
        const { templateBody, templateName } = req.body;

        if (!templateBody) {
            return res.status(400).json({ error: 'Template body is required' });
        }

        const systemPrompt = `You are a WhatsApp marketing expert. Analyze the following message template and provide feedback.

Template Name: "${templateName || 'Untitled'}"
Template Body:
"""
${templateBody}
"""

Evaluate the template based on:
1. Clarity - Is the message clear and easy to understand?
2. Call-to-Action - Is there a clear CTA?
3. Length - Is it appropriate for WhatsApp (concise)?
4. Engagement - Will it grab attention?
5. Personalization - Does it use personalization tokens like {{name}}?

Response format (JSON):
{
  "score": <number 1-10>,
  "verdict": "<'good' | 'needs_improvement' | 'bad'>",
  "summary": "<one sentence overall assessment>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...] // Empty array if template is good
}

If the template is good (score >= 7), keep suggestions minimal or empty.
Do not include markdown or backticks. Just the raw JSON.`;

        const aiResponse = await aiService.generateResponse([
            { role: 'system', content: systemPrompt }
        ]);

        // Parse response
        let analysis = {};
        try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(cleanJson);
        } catch (e) {
            analysis = {
                score: 5,
                verdict: 'needs_improvement',
                summary: 'Unable to fully analyze the template.',
                suggestions: [aiResponse]
            };
        }

        res.json(analysis);

    } catch (error) {
        console.error('AI Template Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze template' });
    }
});

// POST /api/ai/chat-assistant - Conversational AI for templates/campaigns
router.post('/chat-assistant', async (req, res) => {
    try {
        const { messages, currentContent, contentType = 'template' } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Build context-aware system prompt
        const systemPrompt = `You are an expert WhatsApp marketing assistant helping the user create effective ${contentType}s.

${currentContent ? `**Current ${contentType} content:**
"""
${currentContent}
"""

When the user asks to analyze, edit, or improve "my text" or "current text", refer to the content above.` : `The user hasn't written any content yet. Help them get started or answer their questions.`}

**Your capabilities:**
1. **Analyze** - Review their text and provide constructive feedback on clarity, engagement, and effectiveness
2. **Edit** - Make specific improvements like making text shorter, adding emojis, improving CTAs
3. **Generate** - Create new message content based on their requirements
4. **Advise** - Answer questions about WhatsApp marketing best practices

**Guidelines:**
- Be concise and actionable
- When providing edited/generated text, present it clearly so they can copy it
- Use *bold* formatting for emphasis when suggesting text
- Keep WhatsApp character limits in mind (messages should be scannable)
- For edits, show the improved version directly (don't explain what you changed unless asked)

Be helpful, friendly, and focused on making their ${contentType} more effective.`;

        // Build messages array with system prompt
        const aiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const response = await aiService.generateResponse(aiMessages);
        res.json({ content: response });

    } catch (error) {
        console.error('AI Chat Assistant Error:', error);
        res.status(500).json({ error: error.message || 'Failed to get AI response' });
    }
});

module.exports = router;
