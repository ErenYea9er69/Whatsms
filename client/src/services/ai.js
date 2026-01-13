import api from './api';

const aiService = {
    /**
     * Generate a message based on a prompt
     * @param {string} prompt - The user's instruction
     * @returns {Promise<string>} - The generated message
     */
    generateMessage: async (prompt) => {
        try {
            const response = await api.post('/ai/chat', {
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert marketing strategist and copywriter known for creating high-converting WhatsApp campaigns.
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

Separate the variations clearly so the user can copy the one they like.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });
            return response.content;
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    }
};

export default aiService;
