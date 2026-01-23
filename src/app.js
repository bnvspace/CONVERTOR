require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const bot = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', routes);

// Basic Route for testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Start Bot
    bot.launch()
        .then(() => console.log('[Bot] Started'))
        .catch((err) => console.error('[Bot] Start failed:', err));

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
});
