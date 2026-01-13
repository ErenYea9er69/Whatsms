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
                        content: `You are an expert marketing strategist known for creating high converting short campaigns on WhatsApp.
Create a concise and effective marketing message based on the user's request.

Rules:
- Keep it short, clear, and actionable (under 500 chars).
- Focus on one core message only.
- Writing style: Direct. Persuasive. Simple. No buzzwords. No filler.
- Do not use em dashes.
- Use emojis sparingly but effectively for WhatsApp.
- Include a simple call to action.

Output:
Provide 3 distinct options for the message. Separate them clearly.`
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
