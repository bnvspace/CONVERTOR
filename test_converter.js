const { convertFile } = require('./src/converter');
const fs = require('fs');
const path = require('path');

// Minimal 1x1 GIF Base64
const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const buffer = Buffer.from(gifBase64, 'base64');
const inputPath = path.join(__dirname, 'uploads', 'test_sample.gif');

async function test() {
    // 1. Create sample file
    fs.writeFileSync(inputPath, buffer);
    console.log('Created sample GIF:', inputPath);

    // 2. Convert
    try {
        const outputPath = await convertFile(inputPath, 'png');
        console.log('Test Passed! Output:', outputPath);

        // 3. Cleanup
        // fs.unlinkSync(inputPath); // Optional: keep for verification
        // fs.unlinkSync(outputPath);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

test();
