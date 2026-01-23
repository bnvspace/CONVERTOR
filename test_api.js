const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Create a dummy GIF
const gifPath = path.join(__dirname, 'test_upload.gif');
const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
fs.writeFileSync(gifPath, Buffer.from(gifBase64, 'base64'));

// 2. Prepare Multipart Request
const boundary = '--------------------------' + Date.now();
const fileContent = fs.readFileSync(gifPath);
const filename = 'test_upload.gif';

const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/gif\r\n\r\n`;
const footer = `\r\n--${boundary}--`;

const body = Buffer.concat([
    Buffer.from(header),
    fileContent,
    Buffer.from(footer)
]);

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/convert',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
    }
};

console.log('[Test] Sending POST /api/convert...');

const req = http.request(options, (res) => {
    console.log(`[Test] Status Code: ${res.statusCode}`);

    if (res.statusCode !== 200) {
        console.error('[Test] Failed!');
        res.pipe(process.stdout);
        process.exit(1);
    }

    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
        const resultBuffer = Buffer.concat(chunks);
        console.log(`[Test] Received ${resultBuffer.length} bytes`);

        // Check magic number for PNG (89 50 4E 47)
        if (resultBuffer[0] === 0x89 && resultBuffer[1] === 0x50 && resultBuffer[2] === 0x4E && resultBuffer[3] === 0x47) {
            console.log('[Test] Success! Received valid PNG header.');
            // Cleanup dummy file
            fs.unlinkSync(gifPath);
        } else {
            console.error('[Test] Failed! Not a PNG.');
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`[Test] Problem with request: ${e.message}`);
    process.exit(1);
});

req.write(body);
req.end();
