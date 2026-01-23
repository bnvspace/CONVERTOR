# Coding Conventions

> **Reference**: See [vision.md](./vision.md) for architectural and strategic decisions.

## 1. Core Principles
*   **KISS Strictness**: Do not implement features not explicitly requested. Do not abstract "just in case".
*   **No Build Step**: Frontend must run directly from `public/` without Webpack/Vite.
*   **Stateless**: Do not rely on persistent DB.

## 2. Technology Constraints
*   **Backend**: CommonJS (`require()`), Express, Telegraf.
*   **Frontend**: Vanilla JS (ES6+), CSS (no preprocessors), HTML5.
*   **Async/Await**: Use modern async patterns over callbacks.

## 3. Code Style & Quality
*   **Logging**: `console.log` for info, `console.error` for errors. No external loggers.
*   **Error Handling**: Wrap async route handlers in `try/catch`. Return clean 500/400 JSON errors.
*   **Comments**: Only for complex logic. Code should be self-documenting.
*   **File Naming**: `camelCase` for variables/functions, `kebab-case` for filenames.

## 4. Workflows
*   **New Dependencies**: Ask before adding. Prefer standard library or already installed packages.
*   **Refactoring**: Do not refactor unless necessary for the current task.
