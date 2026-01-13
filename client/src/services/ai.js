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
                        content: 'You are a helpful marketing assistant. Write a short, engaging WhatsApp message based on the user request. Include emojis where appropriate. distinct call to action. Keep it under 500 characters.'
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
