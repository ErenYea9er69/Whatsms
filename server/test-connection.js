const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function testConnection() {
    console.log('--- Starting WhatsApp Connection Test ---');

    // 1. Fetch Credentials
    const settings = await prisma.systemConfig.findMany({
        where: { key: { in: ['accessToken', 'phoneNumberId'] } }
    });
    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});

    const token = config.accessToken;
    const phoneId = config.phoneNumberId;

    console.log('Credentials found:');
    console.log('Token:', token ? `${token.substring(0, 10)}...` : 'MISSING');
    console.log('Phone ID:', phoneId || 'MISSING');

    if (!token || !phoneId) {
        console.error('❌ Missing credentials in database.');
        return;
    }

    // 2. Test Fetching Templates (Verify Token/Permissions)
    console.log('\n--- Test 1: Fetching Templates ---');
    try {
        const response = await axios.get(`https://graph.facebook.com/v21.0/${phoneId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Phone ID verified. Associated with:', response.data.verified_name);
    } catch (err) {
        console.error('❌ Failed to verify Phone ID:');
        console.error(err.response?.data || err.message);
        return;
    }

    // 3. Test Sending Message
    const testPhone = '21652213067';
    console.log(`\n--- Test 2: Sending hello_world to ${testPhone} ---`);

    try {
        const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
        const body = {
            messaging_product: 'whatsapp',
            to: testPhone,
            type: 'template',
            template: {
                name: 'hello_world',
                language: { code: 'en_US' }
            }
        };

        const res = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Message Sent Successfully!');
        console.log('Response:', JSON.stringify(res.data, null, 2));

    } catch (err) {
        console.error('❌ Failed to send message:');
        console.error(JSON.stringify(err.response?.data || err.message, null, 2));
    }
}

testConnection()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
