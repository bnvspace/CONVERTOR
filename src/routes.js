const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { convertFile } = require('./converter');

const router = express.Router();

// Configuration for Multer (Storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.TEMP_DIR || 'uploads';
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /api/convert
router.post('/convert', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const inputPath = req.file.path;
        const targetFormat = req.body.format || 'png';

        console.log(`[API] Request to convert ${req.file.originalname} to ${targetFormat}`);

        // 1. Convert
        const outputPath = await convertFile(inputPath, targetFormat);

        // 2. Send file
        res.download(outputPath, (err) => {
            if (err) {
                console.error('[API] Send error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to send file' });
                }
            }

            // 3. Cleanup (Simple strategy: delete after send)
            // Note: In production, might want a cron job or more robust cleanup
            // Keeping it simple as per KISS, but deleting input/output to save space
            try {
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                console.log('[API] Cleanup successful');
            } catch (cleanupErr) {
                console.error('[API] Cleanup error:', cleanupErr);
            }
        });

    } catch (error) {
        console.error('[API] Conversion error:', error);
        res.status(500).json({ error: 'Conversion failed: ' + error.message });

        // Cleanup input if exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

module.exports = router;
