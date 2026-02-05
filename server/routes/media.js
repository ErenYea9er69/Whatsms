const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const os = require('os');

// Use persistent storage in public/uploads for Plesk/Production
const uploadsDir = path.join(__dirname, '../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 16 * 1024 * 1024 }, // 16MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/3gpp',
            'audio/mpeg', 'audio/ogg', 'audio/opus',
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /api/media
 * List all uploaded media
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [media, total] = await Promise.all([
            prisma.media.findMany({
                where: { userId: req.user.id },
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.media.count({ where: { userId: req.user.id } })
        ]);

        res.json({
            media,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch media'
        });
    }
});

/**
 * POST /api/media/upload
 * Upload a file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'File is required'
            });
        }

        const media = await prisma.media.create({
            data: {
                filename: req.file.originalname,
                path: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                userId: req.user.id
            }
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            media
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to upload file'
        });
    }
});

/**
 * GET /api/media/:id
 * Get/download a media file
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const media = await prisma.media.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!media) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Media not found'
            });
        }

        const filePath = path.join(uploadsDir, media.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'File not found on disk'
            });
        }

        res.setHeader('Content-Type', media.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${media.filename}"`);
        res.sendFile(filePath);
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get media'
        });
    }
});

/**
 * DELETE /api/media/:id
 * Delete a media file
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const media = await prisma.media.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!media) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Media not found'
            });
        }

        // Delete file from disk
        const filePath = path.join(uploadsDir, media.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await prisma.media.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete media'
        });
    }
});

module.exports = router;
