const axios = require('axios');

const LONGCAT_BASE_URL = process.env.LONGCAT_BASE_URL || 'https://api.longcat.chat/openai/v1';
const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY;

const aiService = {
    /**
     * Generate a response from the AI model.
     * @param {Array} messages - Array of message objects [{role: 'user', content: '...'}].
     * @param {string} model - Model to use (default: 'LongCat-Flash-Chat').
     * @returns {Promise<string>} - The AI's response content.
     */
    generateResponse: async (messages, model = 'LongCat-Flash-Chat') => {
        if (!LONGCAT_API_KEY) {
            throw new Error('LONGCAT_API_KEY is not configured');
        }

        try {
            const url = `${LONGCAT_BASE_URL}/chat/completions`;
            console.log(`🤖 calling AI: ${url} (Key length: ${LONGCAT_API_KEY.length})`);

            const response = await axios.post(
                url,
                {
                    model: model,
                    messages: messages,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${LONGCAT_API_KEY}`,
                    },
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error('Invalid response format from Longcat API');
            }
        } catch (error) {
            console.error('Error calling Longcat API:', error.response ? error.response.data : error.message);
            // Throw the actual error message if available, or a generic one
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate AI response';
            throw new Error(errorMessage);
        }
    },
};

module.exports = aiService;
