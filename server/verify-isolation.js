const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testIsolation() {
    try {
        console.log('1. Registering User A...');
        const userA = { username: 'usera_' + Date.now(), password: 'password123' };
        const regA = await axios.post(`${API_URL}/auth/register`, userA);
        const tokenA = regA.data.token;
        console.log('User A registered. Token:', tokenA ? 'YES' : 'NO');

        console.log('2. Registering User B...');
        const userB = { username: 'userb_' + Date.now(), password: 'password123' };
        const regB = await axios.post(`${API_URL}/auth/register`, userB);
        const tokenB = regB.data.token;
        console.log('User B registered. Token:', tokenB ? 'YES' : 'NO');

        console.log('3. User A creating contact...');
        const contactA = { name: 'Contact A', phone: '1234567890' };
        await axios.post(`${API_URL}/contacts`, contactA, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log('Contact A created.');

        console.log('4. User B checking contacts (should be empty)...');
        const listB = await axios.get(`${API_URL}/contacts`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        if (listB.data.contacts.length === 0) {
            console.log('SUCCESS: User B sees 0 contacts.');
        } else {
            console.error('FAILURE: User B sees contacts:', listB.data.contacts);
        }

        console.log('5. User B creating contact...');
        const contactB = { name: 'Contact B', phone: '0987654321' };
        await axios.post(`${API_URL}/contacts`, contactB, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log('Contact B created.');

        console.log('6. User A checking contacts (should have 1)...');
        const listA = await axios.get(`${API_URL}/contacts`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        if (listA.data.contacts.length === 1 && listA.data.contacts[0].name === 'Contact A') {
            console.log('SUCCESS: User A sees only their contact.');
        } else {
            console.error('FAILURE: User A sees unexpected contacts:', listA.data.contacts);
        }

        console.log('7. User A trying to access User B contact (should fail)...');
        // We need ID of Contact B.
        // But we can't see it as User A. We assume ID increments.
        // Better: User B sets a unique property we can try to guess? No.
        // Let's assume User B fetches it to get ID.
        const listB2 = await axios.get(`${API_URL}/contacts`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        const contactBId = listB2.data.contacts[0].id;

        try {
            await axios.get(`${API_URL}/contacts/${contactBId}`, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            console.error('FAILURE: User A could access User B contact.');
        } catch (e) {
            if (e.response && e.response.status === 404) { // or 403
                console.log('SUCCESS: User A got 404 when looking for User B contact.');
            } else {
                console.error('FAILURE: Unexpected error:', e.message);
            }
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testIsolation();
