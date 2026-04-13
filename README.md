# Bug Hunter

Bug Hunter is a browser extension game that overlays crawling bugs on real web pages. You pick a tool, squash bugs, reduce stress, and chase a high score.

## Features
- Real-page bug crawling and interaction
- Weapon/tool selection from popup UI
- Stress meter game loop and score feedback
- Local progression storage (best score + achievements)
- Cross-browser Manifest V3 packaging for Chrome, Edge, and Firefox

## Tech Stack
- TypeScript
- Preact (popup UI)
- Esbuild
- Browser Extension Manifest V3
- Vitest

## Project Structure
- `src/content/` : game runtime injected into web pages
- `src/popup/` : extension popup UI
- `src/background/` : service worker bridge for tab injection/actions
- `src/shared/` : progression and storage helpers
- `assets/` : icons and static assets
- `dist/<browser>/` : browser-specific build output
- `artifacts/` : packaged zip files for store uploads

## Requirements
- Node.js 18+
- npm 9+
- Chrome 120+, Edge 120+, or Firefox 128+

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build all browser targets:
   ```bash
   npm run build
   ```
3. Load in Chrome:
   - Open `chrome://extensions`
   - Enable Developer mode
   - Click **Load unpacked**
   - Select the `dist/chrome/` directory
4. Load in Edge:
   - Open `edge://extensions`
   - Enable Developer mode
   - Click **Load unpacked**
   - Select the `dist/edge/` directory
5. Load in Firefox:
   - Open `about:debugging#/runtime/this-firefox`
   - Click **Load Temporary Add-on**
   - Select `/Users/mac/Projects/bug-hunter/dist/firefox/manifest.json`

For watch mode during development:
```bash
npm run dev
```

## Scripts
- `npm run build` : production build for all browsers
- `npm run build:chrome` : production build to `dist/chrome/`
- `npm run build:edge` : production build to `dist/edge/`
- `npm run build:firefox` : production build to `dist/firefox/`
- `npm run dev` : watch Chrome build with inline sourcemaps
- `npm run package:all` : build and zip Chrome, Edge, and Firefox packages into `artifacts/`
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
- Progress data is stored locally via the browser's local extension storage.

## Build Output
The build process compiles TS/TSX and copies static files into browser-specific directories:
- `dist/chrome/*`
- `dist/edge/*`
- `dist/firefox/*`

Each target contains:
- `content/main.js`
- `background/main.js`
- `popup/main.js`
- `content.css`
- `index.html`
- `manifest.json`
- `assets/*`

Release packaging writes store-ready zip files with `manifest.json` at the archive root:
- `artifacts/bug-hunter-chrome-v1.0.0.zip`
- `artifacts/bug-hunter-edge-v1.0.0.zip`
- `artifacts/bug-hunter-firefox-v1.0.0.zip`

## Version
Current extension version: `2.0.0`
