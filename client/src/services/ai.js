import api from './api';

const aiService = {
    /**
     * Generate a message based on a prompt
     * @param {string} prompt - The user's instruction
     * @param {string} existingText - Optional existing text to modify
     * @returns {Promise<string>} - The generated message
     */
    generateMessage: async (prompt, existingText = '') => {
        try {
            const systemContent = existingText.trim()
                ? `You are an expert marketing strategist and copywriter known for creating high-converting WhatsApp campaigns.

The user has **existing content** they want you to **modify, improve, or rewrite** based on their instructions.

**Existing Content:**
"""
${existingText}
"""

**Your Task:**
Follow the user's instructions to modify the existing content. Keep the same general idea unless they ask you to change it completely.

**Guidelines:**
- Keep changes focused on what the user asks
- Maintain the message structure unless told otherwise
- Use *bold* for emphasis, emojis sparingly
- Make it concise and WhatsApp-appropriate

Output ONLY the improved/modified message text. No explanations.`
                : `You are an expert marketing strategist and copywriter known for creating high-converting WhatsApp campaigns.
Your goal is to write a powerful, effective marketing message based on the user's request.

**Strategy Guidelines:**
- **One Core Message:** Focus on a single clear value proposition.
- **Direct & Persuasive:** Use simple language. No buzzwords. No filler.
- **Structure:**
    1. **Hook:** Grab attention instantly (first line).
    2. **Value:** Explain the benefit clearly.
    3. **CTA:** One simple, actionable step (e.g., "Reply YES", "Click here").
- **Formatting:** Use *bold* for emphasis. Use emojis sparingly to highlight key points.
- **No Em Dashes.**

**Output Instructions:**
Provide **3 Distinct Variations** of the message to give the user choices:
1.  **Direct & Urgent** (Focus on scarcity or time-sensitivity)
2.  **Benefit-Focused** (Focus on the problem/solution)
3.  **Friendly & Conversational** (Softer tone)

Separate the variations clearly so the user can copy the one they like.`;

            const response = await api.post('/ai/chat', {
                messages: [
                    { role: 'system', content: systemContent },
                    { role: 'user', content: prompt }
                ]
            });
            return response.content;
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    },

    getAnalyticsInsights: async (campaignIds = []) => {
        try {
            const response = await api.post('/ai/analytics', { campaignIds });
            return response.insights;
        } catch (error) {
            console.error('Error fetching AI analytics:', error);
            throw error;
        }
    },

    analyzeTemplate: async (templateBody, templateName) => {
        try {
            const response = await api.post('/ai/analyze-template', { templateBody, templateName });
            return response;
        } catch (error) {
            console.error('Error analyzing template:', error);
            throw error;
        }
    }
};

export default aiService;
