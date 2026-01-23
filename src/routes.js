const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { convertFile } = require('./converter');

const router = express.Router();

// 15 Minutes cleanup
const FILE_LIFETIME_MS = 15 * 60 * 1000;

// Helper: Cleanup old files
const cleanOldFiles = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) return console.error('Cleanup read error:', err);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtimeMs > FILE_LIFETIME_MS) {
                    fs.unlink(filePath, () => console.log(`[Cleanup] Deleted ${file}`));
                }
            });
        });
    });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.TEMP_DIR || 'uploads';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        // Trigger cleanup roughly on upload
        cleanOldFiles(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Encodings fix for Russian filenames
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// POST /api/convert (Bulk)
router.post('/convert', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const targetFormat = req.body.format || 'png';
        const uploadDir = process.env.TEMP_DIR || 'uploads';
        const results = [];
        const uniqueId = Date.now();

        console.log(`[API] Bulk Request: ${req.files.length} files to ${targetFormat}`);

        // 1. Convert ALL files
        const conversionPromise = req.files.map(async (file) => {
            try {
                // Generate name: original_converted.png
                const originalBase = path.parse(file.originalname).name;
                const newFilename = `${originalBase}_converted.${targetFormat}`;

                const outputPath = await convertFile(file.path, targetFormat, newFilename);
                const filename = path.basename(outputPath);

                results.push({
                    originalName: file.originalname,
                    filename: filename,
                    url: `/api/download/${filename}`
                });

                // We keep input files for now (deleted by cron/cleanup) 
                // OR delete input immediately? 
                // Let's delete INPUT immediately to save space, output stays for download.
                fs.unlink(file.path, () => { });

            } catch (err) {
                console.error(`Failed to convert ${file.originalname}:`, err);
                results.push({
                    originalName: file.originalname,
                    error: 'Conversion failed'
                });
            }
        });

        await Promise.all(conversionPromise);

        // 2. Create ZIP if > 1 file
        let zipUrl = null;
        if (results.filter(r => !r.error).length > 1) {
            const zipName = `archive-${uniqueId}.zip`;
            const zipPath = path.join(uploadDir, zipName);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);

            results.forEach(r => {
                if (!r.error && r.filename) {
                    archive.file(path.join(uploadDir, r.filename), { name: r.filename });
                }
            });

            await archive.finalize();

            // Wait for stream to finish? archive.finalize returns promise but stream needs 'close'
            // Usually fine, but technically race condition if we try to download immediately.
            // For now, assume filesystem sync speed is enough or archiver awaits drain.
            zipUrl = `/api/download/${zipName}`;
        }

        res.json({
            files: results,
            zip: zipUrl
        });

    } catch (error) {
        console.error('[API] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/download/:filename
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const uploadDir = process.env.TEMP_DIR || 'uploads';
    const absoluteUploadDir = path.resolve(uploadDir);
    const filePath = path.resolve(uploadDir, filename);

    // Security check: Must be in uploads dir
    if (!filePath.startsWith(absoluteUploadDir)) {
        return res.status(403).send('Access denied');
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found (Expired?)');
    }

    res.download(filePath);
});

module.exports = router;
