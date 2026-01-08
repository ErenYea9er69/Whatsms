require('dotenv').config();
const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('--- Database Connection Debugger ---');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing from .env');
        return;
    }

    // Mask password for logging
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`URL Configured: ${maskedUrl}`);

    console.log('\n1. Testing with Prisma...');
    try {
        await prisma.$connect();
        console.log('✅ Prisma Connected Successfully!');

        // Try a simple query
        const count = await prisma.user.count();
        console.log(`✅ Connection Verified. User count: ${count}`);

        await prisma.$disconnect();
    } catch (e) {
        console.error('❌ Prisma Connection Failed:', e.message);
        console.error('Error Code:', e.code);
    }

    // console.log('\n2. Testing with pg driver (direct)...');
    // try {
    //     const client = new pg.Client({
    //         connectionString: dbUrl,
    //         ssl: { rejectUnauthorized: false } // Required for Neon
    //     });
    //     await client.connect();
    //     console.log('✅ PG Driver Connected Successfully!');
    //     const res = await client.query('SELECT NOW()');
    //     console.log('✅ Query Result:', res.rows[0]);
    //     await client.end();
    // } catch (e) {
    //     console.error('❌ PG Connection Failed:', e.message);
    // }
}

main();
