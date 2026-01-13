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

// POST /api/ai/analytics
router.post('/analytics', async (req, res) => {
    try {
        const { campaignIds } = req.body;

        // Build where clause
        const where = {};
        if (campaignIds && Array.isArray(campaignIds) && campaignIds.length > 0) {
            where.id = { in: campaignIds.map(id => parseInt(id)) };
        }

        // 1. Fetch real campaign data
        const [stats, recentCampaigns] = await Promise.all([
            prisma.campaign.aggregate({
                where,
                _sum: {
                    statsDelivered: true,
                    statsRead: true,
                    statsFailed: true,
                    statsReplied: true
                }
            }),
            prisma.campaign.findMany({
                where,
                take: 10, // Increased take for specific analysis
                orderBy: { updatedAt: 'desc' },
                select: {
                    name: true,
                    status: true,
                    statsDelivered: true,
                    statsRead: true,
                    statsReplied: true,
                    messageBody: true
                }
            })
        ]);

        const totalSent = (stats._sum.statsDelivered || 0) + (stats._sum.statsFailed || 0);
        const deliveryRate = totalSent > 0
            ? ((stats._sum.statsDelivered || 0) / totalSent * 100).toFixed(1)
            : 0;
        const readRate = (stats._sum.statsDelivered || 0) > 0
            ? ((stats._sum.statsRead || 0) / (stats._sum.statsDelivered || 1) * 100).toFixed(1)
            : 0;

        // 2. Construct Prompt
        const systemPrompt = `You are a Data Analyst for a marketing platform. Analyze the following campaign performance data and provide 3 key insights.
        
        Data:
        - Delivery Rate: ${deliveryRate}%
        - Read Rate: ${readRate}%
        - Total Replied: ${stats._sum.statsReplied || 0}
        
        Recent Campaigns:
        ${recentCampaigns.map(c => `- "${c.name}": ${c.statsRead} reads, ${c.statsReplied} replies. Body: "${c.messageBody.substring(0, 50)}..."`).join('\n')}
        
        Format your response as a JSON array of strings, e.g. ["Insight 1", "Insight 2", "Insight 3"]. 
        Keep insights actionable and specific. Focus on what worked (e.g. content style) or what needs improvement.
        Do not include markdown formatting or backticks. Just the raw JSON string.`;

        // 3. Generate Insight
        const aiResponse = await aiService.generateResponse([
            { role: 'system', content: systemPrompt }
        ]);

        // 4. Parse (handle potential JSON wrapping)
        let insights = [];
        try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            insights = JSON.parse(cleanJson);
        } catch (e) {
            // Fallback if AI didn't return valid JSON
            insights = [aiResponse];
        }

        res.json({ insights });

    } catch (error) {
        console.error('AI Analytics Error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
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

module.exports = router;
