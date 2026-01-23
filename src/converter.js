const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Converts an input file to a specified format.
 * @param {string} inputPath - Absolute path to input file
 * @param {string} format - Target format (e.g., 'png', 'jpg')
 * @returns {Promise<string>} - Absolute path to the output file
 */
async function convertFile(inputPath, format = 'png', customOutputFilename = null) {
    try {
        const outputFilename = customOutputFilename || `converted-${Date.now()}.${format}`;
        const outputPath = path.join(path.dirname(inputPath), outputFilename);

        console.log(`[Converter] Processing: ${inputPath} -> ${format}`);

        await sharp(inputPath)
            .toFormat(format)
            .toFile(outputPath);

        console.log(`[Converter] Success: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error(`[Converter] Error:`, error.message);
        throw error;
    }
}

module.exports = { convertFile };
