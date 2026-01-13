const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const whatsappService = require('../services/whatsapp');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
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

        // Upload to WhatsApp
        const waMediaId = await whatsappService.uploadMedia(filePath, mimeType);

        // Create Media record in DB
        // We store the WhatsApp Media ID in the 'path' field as a convention
        const media = await prisma.media.create({
            data: {
                filename: req.file.originalname,
                path: waMediaId, // Store WhatsApp Media ID here
                mimetype: mimeType,
                size: req.file.size
            }
        });

        // Delete local file after successful upload to WhatsApp
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            media,
            mediaId: media.id // Return DB ID for frontend to link
        });

    } catch (error) {
        console.error('Upload error:', error);
        // Clean up file if error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload file to WhatsApp' });
    }
});

module.exports = router;
