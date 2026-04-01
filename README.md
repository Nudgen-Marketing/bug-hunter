# Bug Hunter

Bug Hunter is a Chrome Extension game that overlays crawling bugs on real web pages. You pick a tool, squash bugs, reduce stress, and chase a high score.

## Features
- Real-page bug crawling and interaction
- Weapon/tool selection from popup UI
- Stress meter game loop and score feedback
- Local progression storage (best score + achievements)
- Manifest V3 extension architecture

## Tech Stack
- TypeScript
- Preact (popup UI)
- Esbuild
- Chrome Extension Manifest V3
- Vitest

## Project Structure
- `src/content/` : game runtime injected into web pages
- `src/popup/` : extension popup UI
- `src/background/` : service worker bridge for tab injection/actions
- `src/shared/` : progression and storage helpers
- `assets/` : icons and static assets
- `dist/` : build output used by Chrome

## Requirements
- Node.js 18+
- npm 9+
- Chrome 120+

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build extension:
   ```bash
   npm run build
   ```
3. Load in Chrome:
   - Open `chrome://extensions`
   - Enable Developer mode
   - Click **Load unpacked**
   - Select the `dist/` directory

For watch mode during development:
```bash
npm run dev
```

## Scripts
- `npm run build` : production build to `dist/`
- `npm run dev` : watch build with inline sourcemaps
- `npm run typecheck` : TypeScript type check
- `npm test` : run test suite once
- `npm run test:watch` : run tests in watch mode

## Extension Permissions
- `activeTab` : inject gameplay into the active tab only when user starts
- `scripting` : execute content script and attach gameplay runtime
- `storage` : save progression data locally
- `clipboardWrite` : enable copy/share interactions from game UI

## Privacy Notes
- The extension runs only when the user activates it from the popup.
- No account/login is required.
- No remote backend is used for core gameplay.
- Progress data is stored locally via `chrome.storage.local`.

## Build Output
The build process compiles TS/TSX and copies static files into `dist/`:
- `dist/content/main.js`
- `dist/background/main.js`
- `dist/popup/main.js`
- `dist/content.css`
- `dist/index.html`
- `dist/manifest.json`
- `dist/assets/*`

## Version
Current extension version: `2.0.0`
