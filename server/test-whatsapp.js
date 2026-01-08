
require('dotenv').config();
const { sendTemplateMessage } = require('./services/whatsapp');
const { PrismaClient } = require('@prisma/client');

async function test() {
    console.log('--- Starting WhatsApp API Test (Template: hello_world) ---');

    // User provided number: +216 52 213 067
    const TEST_PHONE = '21652213067';

    try {
        console.log(`Attempting to send hello_world template to ${TEST_PHONE}...`);
        const result = await sendTemplateMessage(TEST_PHONE, "hello_world", "en_US");
        console.log('✅ Template sent successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Failed to send template.');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        process.exit();
    }
}

test();
