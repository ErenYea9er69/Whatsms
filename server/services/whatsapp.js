const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

/**
 * Get WhatsApp Credentials
 * Check DB first, then environment variables
 */
async function getCredentials() {
    let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    try {
        const settings = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['accessToken', 'phoneNumberId'] }
            }
        });

        const dbConfig = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        if (dbConfig.accessToken) accessToken = dbConfig.accessToken;
        if (dbConfig.phoneNumberId) phoneNumberId = dbConfig.phoneNumberId;

    } catch (error) {
        console.error('Failed to fetch settings from DB, using fallback env vars', error);
    }

    return {
        ACCESS_TOKEN: accessToken,
        PHONE_NUMBER_ID: phoneNumberId,
        isMockMode: !accessToken || !phoneNumberId
    };
}

/**
 * Send a text message via WhatsApp
 */
async function sendTextMessage(phone, message) {
    const { ACCESS_TOKEN, PHONE_NUMBER_ID, isMockMode } = await getCredentials();
    const normalizedPhone = phone.replace(/[\s+\-]/g, '');

    if (isMockMode) {
        console.log(`📱 [MOCK] Sending message to ${normalizedPhone}:`);
        console.log(`   "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
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
 */


/**
 * Upload media to WhatsApp API
 * Returns the media ID
 */
async function uploadMedia(filePath, mimeType) {
    const { ACCESS_TOKEN, PHONE_NUMBER_ID, isMockMode } = await getCredentials();
    const fs = require('fs');
    const FormData = require('form-data');

    if (isMockMode) {
        console.log(`📱 [MOCK] Uploading media: ${filePath}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return `mock_media_${Date.now()}`;
    }

    try {
        const form = new FormData();
        form.append('messaging_product', 'whatsapp');
        form.append('file', fs.createReadStream(filePath), { contentType: mimeType });

        const response = await axios.post(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/media`,
            form,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    ...form.getHeaders()
                }
            }
        );
        return response.data.id;
    } catch (error) {
        console.error('WhatsApp Upload Error:', error.response?.data || error.message);
        throw new Error('Failed to upload media to WhatsApp');
    }
}

/**
 * Send a media message via WhatsApp
 */
async function sendMediaMessage(phone, mediaInput, type = 'image', caption = '') {
    const { ACCESS_TOKEN, PHONE_NUMBER_ID, isMockMode } = await getCredentials();
    const normalizedPhone = phone.replace(/[\s+\-]/g, '');

    if (isMockMode) {
        console.log(`📱 [MOCK] Sending ${type} to ${normalizedPhone}:`);
        console.log(`   Media: ${mediaInput}`);
        if (caption) console.log(`   Caption: ${caption}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
            messaging_product: 'whatsapp',
            contacts: [{ wa_id: normalizedPhone }],
            messages: [{ id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
        };
    }

    const mediaPayload = {};
    if (mediaInput.startsWith('http')) {
        mediaPayload.link = mediaInput;
    } else {
        mediaPayload.id = mediaInput;
    }

    if (caption && (type === 'image' || type === 'video' || type === 'document')) {
        mediaPayload.caption = caption;
    }

    // For documents, it's good to have a filename, but we'll skip for now or inferred
    if (type === 'document' && !mediaPayload.caption) {
        // WhatsApp sometimes requires a filename/caption for docs
        mediaPayload.filename = 'attachment.pdf';
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
 */
async function sendTemplateMessage(phone, templateName, languageCode = 'en_US', components = []) {
    const { ACCESS_TOKEN, PHONE_NUMBER_ID, isMockMode } = await getCredentials();
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
 */
async function markAsRead(messageId) {
    const { ACCESS_TOKEN, PHONE_NUMBER_ID, isMockMode } = await getCredentials();

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
    uploadMedia
};
