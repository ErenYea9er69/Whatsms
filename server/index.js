require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { validateEnv } = require('./config/env');

// Validate environment variables on startup
try {
    validateEnv();
} catch (error) {
    console.error('❌ Environment Configuration Error:');
    console.error(error.message);
    process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const listsRoutes = require('./routes/lists');
const campaignsRoutes = require('./routes/campaigns');
const templatesRoutes = require('./routes/templates');
const mediaRoutes = require('./routes/media');
const webhooksRoutes = require('./routes/webhooks');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177'
        ].filter(Boolean); // Remove falsy values

        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler for API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.originalUrl} not found`
        });
    }
    next();
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'File Upload Error',
            message: err.message
        });
    }

    // Custom file filter errors
    if (err.message === 'File type not allowed' || err.message === 'Only CSV files are allowed') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Import Prisma for connection check
const prisma = require('./config/prisma');

async function startServer() {
    try {
        // Verify Database Connection
        await prisma.$connect();
        console.log('✅ Connected to Database (Neon/Postgres)');

        // Start server
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 WhatsSMS Server Running                      ║
║                                                   ║
║   Local:   http://localhost:${PORT}                 ║
║   Health:  http://localhost:${PORT}/api/health      ║
║   Env:     ${process.env.NODE_ENV}                ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }
}

startServer();
