const { Telegraf, Markup, session } = require('telegraf');
const { convertFile } = require('./converter');
const fs = require('fs');
const path = require('path');
const https = require('https');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Middleware
bot.use(session());

// Middleware for logging
bot.use(async (ctx, next) => {
    console.log('--- NEW UPDATE RECEIVED ---');
    console.log('Type:', ctx.updateType);
    if (ctx.message) console.log('Message:', JSON.stringify(ctx.message, null, 2));

    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log(`[Bot] Update type: ${ctx.updateType}, Response time: ${ms}ms`);
});

// /start command
bot.start((ctx) => {
    ctx.reply('Привет! Я бот-конвертер. Отправь мне картинку (как фото), и я сконвертирую её в PNG.');
});

// Handle Photo & Document
bot.on(['photo', 'document'], async (ctx) => {
    console.log('[Bot] File received');
    try {
        let fileId;

        if (ctx.message.photo) {
            fileId = ctx.message.photo.pop().file_id;
        } else if (ctx.message.document) {
            const doc = ctx.message.document;
            // Basic mime check
            if (!doc.mime_type || !doc.mime_type.startsWith('image/')) {
                return ctx.reply('Пожалуйста, отправьте изображение (как фото или файл-картинку).');
            }
            fileId = doc.file_id;
        }

        const fileLink = await ctx.telegram.getFileLink(fileId);

        const tempDir = process.env.TEMP_DIR || 'uploads';
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const ext = path.extname(fileLink.href) || '.jpg';
        const inputFilename = `bot_${ctx.from.id}_${Date.now()}${ext}`;
        const inputPath = path.join(tempDir, inputFilename);

        // Download file
        const file = fs.createWriteStream(inputPath);
        https.get(fileLink.href, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();

                // Stateless: Pass filename in callback data
                // Format: cvt|format|filename
                const baseName = path.basename(inputPath);

                ctx.reply('Картинка получена! В какой формат конвертировать?', Markup.inlineKeyboard([
                    Markup.button.callback('PNG', `cvt|png|${baseName}`),
                    Markup.button.callback('JPG', `cvt|jpg|${baseName}`),
                    Markup.button.callback('WEBP', `cvt|webp|${baseName}`)
                ]));
            });
        }).on('error', (err) => {
            fs.unlink(inputPath, () => { });
            console.error('[Bot] Download Error:', err);
            ctx.reply('Ошибка при скачивании файла.');
        });

    } catch (e) {
        console.error('[Bot] Error:', e);
        ctx.reply('Произошла ошибка при обработке фото.');
    }
});

// Handle Conversion Actions (REGEX to match "cvt|format|filename")
bot.action(/^cvt\|(.+)\|(.+)$/, async (ctx) => {
    const format = ctx.match[1];
    const filename = ctx.match[2];

    try {
        const tempDir = process.env.TEMP_DIR || 'uploads';
        const absoluteTempDir = path.resolve(tempDir);
        const inputPath = path.resolve(tempDir, filename);

        // Security check
        if (!inputPath.startsWith(absoluteTempDir)) {
            return ctx.reply('Ошибка безопасности пути.');
        }

        if (!fs.existsSync(inputPath)) {
            return ctx.reply('Файл истек или удален (перезагрузка сервера?). Отправьте снова.');
        }

        await ctx.reply(`Конвертирую в ${format.toUpperCase()}... ⏳`);

        const outputPath = await convertFile(inputPath, format);

        await ctx.replyWithDocument({ source: outputPath });

        // Cleanup
        setTimeout(() => {
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (e) { console.error('[Bot] Cleanup error', e); }
        }, 1000);

    } catch (e) {
        console.error('[Bot] Conversion Error:', e);
        ctx.reply('Ошибка конвертации: ' + e.message);
    }
});

// Launch logic (Graceful stop is handled by app.js usually, but we can export launch)
// For webhooks/polling, we'll start it in app.js
module.exports = bot;
