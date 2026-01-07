const axios = require('axios');

/**
 * WhatsApp Cloud API Service
 * 
 * When WHATSAPP_ACCESS_TOKEN is not set, runs in mock mode
 * and logs messages instead of sending them.
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const isMockMode = !ACCESS_TOKEN || !PHONE_NUMBER_ID;

if (isMockMode) {
    console.log('⚠️  WhatsApp service running in MOCK MODE');
    console.log('   Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to enable real messaging');
}

/**
 * Send a text message via WhatsApp
 * @param {string} phone - Recipient phone number (with country code, no +)
 * @param {string} message - Message text
 * @returns {Promise<object>} - API response or mock response
 */
async function sendTextMessage(phone, message) {
    // Normalize phone number (remove + and spaces)
    const normalizedPhone = phone.replace(/[\s+\-]/g, '');

    if (isMockMode) {
        console.log(`📱 [MOCK] Sending message to ${normalizedPhone}:`);
        console.log(`   "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 50));

        return {
            messaging_product: 'whatsapp',
            contacts: [{ wa_id: normalizedPhone }],
            messages: [{ id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
        };
    }

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: normalizedPhone,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send message');
    }
}

/**
 * Send a media message via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {string} mediaUrl - Public URL of the media
 * @param {string} type - Media type: 'image', 'document', 'video', 'audio'
 * @param {string} caption - Optional caption for images/videos
 * @returns {Promise<object>}
 */
async function sendMediaMessage(phone, mediaUrl, type = 'image', caption = '') {
    const normalizedPhone = phone.replace(/[\s+\-]/g, '');

    if (isMockMode) {
        console.log(`📱 [MOCK] Sending ${type} to ${normalizedPhone}:`);
        console.log(`   URL: ${mediaUrl}`);
        if (caption) console.log(`   Caption: ${caption}`);

        await new Promise(resolve => setTimeout(resolve, 50));

        return {
            messaging_product: 'whatsapp',
            contacts: [{ wa_id: normalizedPhone }],
            messages: [{ id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
        };
    }

    const mediaPayload = {
        link: mediaUrl
    };

    if (caption && (type === 'image' || type === 'video')) {
        mediaPayload.caption = caption;
    }

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: normalizedPhone,
                type,
                [type]: mediaPayload
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send media');
    }
}

/**
 * Send a template message via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {string} templateName - Name of the approved template
 * @param {string} languageCode - Template language code (e.g., 'en_US')
 * @param {Array} components - Template components (header, body, button params)
 * @returns {Promise<object>}
 */
async function sendTemplateMessage(phone, templateName, languageCode = 'en_US', components = []) {
    const normalizedPhone = phone.replace(/[\s+\-]/g, '');

    if (isMockMode) {
        console.log(`📱 [MOCK] Sending template "${templateName}" to ${normalizedPhone}`);

        await new Promise(resolve => setTimeout(resolve, 50));

        return {
            messaging_product: 'whatsapp',
            contacts: [{ wa_id: normalizedPhone }],
            messages: [{ id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
        };
    }

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: normalizedPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send template');
    }
}

/**
 * Mark a message as read
 * @param {string} messageId - WhatsApp message ID
 * @returns {Promise<object>}
 */
async function markAsRead(messageId) {
    if (isMockMode) {
        console.log(`📱 [MOCK] Marking message ${messageId} as read`);
        return { success: true };
    }

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', error.response?.data || error.message);
        throw new Error('Failed to mark message as read');
    }
}

module.exports = {
    sendTextMessage,
    sendMediaMessage,
    sendTemplateMessage,
    markAsRead,
    isMockMode
};
