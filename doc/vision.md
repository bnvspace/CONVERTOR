# Technical Vision: CONVERTOR

## 1. Technologies
*   **Runtime**: Node.js LTS
*   **Web Framework**: Express.js
*   **Frontend**: Vanilla JS + HTML5 + CSS3 (No build tools, static delivery)
*   **Bot Framework**: Telegraf
*   **Image Processing**: Sharp
*   **File Uploads**: Multer

## 2. Development Principles
*   **KISS (Keep It Simple, Stupid)**: Minimal dependencies, no over-engineering.
*   **API First**: Core logic is exposed via HTTP API; Web and Bot are clients.
*   **No Database (MVP)**: Stateless operation. Files are processed and cleaned up; no long-term storage or user accounts.
*   **Monolith**: Single server process handles both Web API and Telegram Polling/Webhook.

## 3. Principles of work with LLM
*   **Language**: The agent communicates, reasons, and writes documentation ONLY in Russian.
*   **No English**: Avoid English comments and identifiers unless absolutely necessary (e.g. standard library names).


## 4. Project Structure
```text
/
├── public/              # Static Web Assets
│   ├── index.html       # Single Page Interface
│   └── script.js        # Frontend Logic
├── src/
│   ├── app.js           # Entry Point (Express + Telegraf)
│   ├── routes.js        # HTTP API Routes
│   ├── bot.js           # Telegram Bot Logic
│   └── converter.js     # Core Logic (Sharp wrapper)
├── uploads/             # Temporary Storage
├── package.json
└── README.md
```

## 5. Architecture (Simplified Layered)
1.  **Presentation API**: Express Routes & Telegraf Commands.
2.  **Service Layer**: `converter.js` (Pure logic, unaware of transport).
3.  **Infrastructure**: Local File System (Read/Write/Verify).

## 6. Data Model (In-Memory)
*   **ConversionJob**: Transient object used during processing.
    ```javascript
    {
      id: "uuid-v4",          // Request ID
      inputPath: "uploads/in.gif",
      outputPath: "uploads/out.png",
      format: "png",
      timestamp: 123456789    // For cleanup
    }
    ```

## 7. Scenarios (Happy Paths)
*   **Web Client**:
    1.  User drags file -> `POST /api/upload`.
    2.  User selects format & clicks "Convert" -> `POST /api/convert`.
    3.  Server processes sync -> Returns file download stream.
*   **Telegram Bot**:
    1.  User updates photo.
    2.  Bot downloads to `uploads/`.
    3.  Bot requests target format (Buttons).
    4.  Conversion logic runs.
    5.  Bot uploads result back to user.

## 8. Deployment
*   **Dev**: `npm start`
*   **Prod**: `pm2 start src/app.js` or simple process manager. No complex CI/CD.

## 9. Configuration
*   **Method**: `.env` file (dotenv).
*   **Keys**:
    *   `PORT` (default: 3000)
    *   `TELEGRAM_BOT_TOKEN`
    *   `TEMP_DIR` (default: ./uploads)

## 10. Logging
*   **Console**: Standard `console.log` / `console.error`.
*   **HTTP**: `morgan` middleware for request logging.
