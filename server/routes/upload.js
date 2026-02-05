const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const whatsappService = require('../services/whatsapp');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const os = require('os');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use persistent storage in public/uploads for Plesk/Production
        const uploadsDir = path.join(__dirname, '../public/uploads');

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});

const prisma = require('../config/prisma');

// Apply auth middleware
router.use(authenticate);

/**
 * POST /api/upload
 * Upload file to server and then to WhatsApp
 */
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        console.log('📂 [DEBUG] File Upload Request:');
        console.log(`   - Original Name: ${req.file.originalname}`);
        console.log(`   - MimeType: ${mimeType}`);
        console.log(`   - Temp Path: ${filePath}`);
        console.log(`   - File Exists: ${fs.existsSync(filePath)}`);
        console.log(`   - User ID: ${req.user.id}`);

        // Upload to WhatsApp
        console.log('🚀 [DEBUG] Starting WhatsApp Upload...');
        const waMediaId = await whatsappService.uploadMedia(filePath, mimeType, req.user.id);
        console.log(`✅ [DEBUG] WhatsApp Upload Success! Media ID: ${waMediaId}`);

        // Create Media record in DB
        // We store the WhatsApp Media ID in the 'path' field as a convention
        const media = await prisma.media.create({
            data: {
                userId: req.user.id,
                filename: req.file.originalname,
                path: waMediaId, // Store WhatsApp Media ID here
                mimetype: mimeType,
                size: req.file.size
            }
        });

        // Delete local file after successful upload to WhatsApp
        try {
            fs.unlinkSync(filePath);
            console.log('🗑️ [DEBUG] Local file deleted');
        } catch (e) {
            console.error('⚠️ [DEBUG] Failed to delete local file:', e.message);
        }

        res.json({
            success: true,
            media,
            mediaId: media.id // Return DB ID for frontend to link
        });

    } catch (error) {
        console.error('❌ [DEBUG] Upload Route Error:', error);
        console.error('   - Stack:', error.stack);

        // Clean up file if error
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupErr) {
                console.error('   - Failed to cleanup file:', cleanupErr.message);
            }
        }
        res.status(500).json({
            error: 'Failed to upload file to WhatsApp',
            details: error.message
        });
    }
});

module.exports = router;
