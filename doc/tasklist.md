# Project Status Report

| Iteration | Status | Goals |
| :--- | :---: | :--- |
| **1. Foundation** | 🔴 | Core Server & Converter Logic |
| **2. Web Interface** | 🔴 | Browser Upload & Conversion |
| **3. Telegram Bot** | 🔴 | Bot Integration |

---

# Iterative Development Plan

## I. Foundation & Core
- [x] **1. Project Structure & Server Skeleton**
    - Setup Express app in `src/app.js`.
    - Configure `morgan` logging.
    - **Test**: Run `npm start`, access `http://localhost:3000` -> returns "OK".
- [ ] **2. Core Converter Logic**
    - Implement `src/converter.js` (GIF -> PNG) using `sharp`.
    - **Test**: Run standalone script to convert a test `sample.gif` -> `sample.png`.

## II. Web Interface (MVP)
- [ ] **3. API Implementation**
    - Setup `src/routes.js` with `multer` for uploads.
    - Create `POST /api/convert` endpoint.
    - **Test**: Send POST request via Curl/Postman -> receive converted file.
- [ ] **4. Frontend Implementation**
    - Create `public/index.html` (Simple form).
    - Create `public/script.js` (Fetch API logic).
    - **Test**: Open browser, upload file, verify automatic download.

## III. Telegram Integration
- [ ] **5. Bot Connection**
    - Config `Telegraf` in `src/bot.js`.
    - Hook into `src/app.js`.
    - **Test**: Send `/start` to bot -> receive welcome message.
- [ ] **6. Bot Conversion Flow**
    - Handle photo messages.
    - Integrate with `converter.js`.
    - **Test**: Send image to bot -> receive converted png.

## IV. Finalization
- [ ] **7. Cleanup & Config**
    - Implement temp file cleanup (unlink after response).
    - Verify `.env` configuration.
    - **Test**: Convert file -> check `uploads/` folder is empty.
