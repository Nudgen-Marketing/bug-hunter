# Chrome Web Store Listing — Bug Hunter

## Hero Screenshot Spec
- Size: 1280 x 800 PNG (or 640 x 400 minimum), no transparency.
- Scene: one active webpage with visible crawling bug, stress meter, score popup, and toolbar.
- Composition:
  - Top-left: bug on real page element.
  - Bottom-center: tool + destroy controls.
  - Right side: stress meter with visible percentage.
  - Mid-screen: action feedback (`+100`, splat or particle effect).
- Visual constraints:
  - Keep UI readable at 50% zoom.
  - Avoid personal/private page data in screenshot.
  - Prefer a neutral site (documentation/news page) for broad audience relevance.

## Short Description (132 chars)
Hunt crawling bugs on any webpage, drop your stress meter, and debug chaos with IT-themed tools in this playful Chrome game.

## Keywords
- bug game
- stress relief
- chrome extension game
- web prank
- productivity break
- debug game
- browser mini game
- office fun
- casual game
- developer humor

## Long Description
Bug Hunter turns everyday websites into a playful bug-hunting challenge.

Activate the extension on a page and watch live bugs crawl across real interface elements. Catch them fast to lower your stress meter and rack up points. Let too many escape and pressure rises until the page gets infested.

Core features:
- Real-page bug crawling behavior on live DOM surfaces
- Stress meter loop with win/lose states
- Tool-based bug hits and score feedback
- Legacy destruction effects for extra chaotic fun
- Victory fireworks and quick share prompt

Built for short breaks, laughs, and satisfying “debug the page” moments.

Privacy and safety:
- Runs only when you activate it on the current tab
- Does not permanently modify websites
- Effects are session-based and reset on exit/refresh

If a page is too minimal to play well, Bug Hunter will tell you and avoid launching.

## Chrome Web Store Submission Info

### 1) CWS Dashboard Fields (copy-ready)
- **Extension name**: Bug Hunter
- **Category**: Fun
- **Language**: English (add localized listings later if needed)
- **Short description**:
  - Hunt crawling bugs on any webpage, drop your stress meter, and debug chaos with IT-themed tools in this playful Chrome game.
- **Detailed description**:
  - Use the **Long Description** section above.
- **Version**: 1.0.0
- **Support URL**: Add your support page or GitHub issues URL before submit.
- **Homepage URL**: Add your project homepage (optional but recommended).

### 2) Store Assets Required
- **Extension icon**: 128x128 PNG (already in project icons)
- **Small tile**: 440x280 PNG
- **Marquee promo tile**: 1400x560 PNG (recommended for featuring)
- **Screenshots**: at least 1 image (1280x800 recommended)
- **Optional promo video**: YouTube URL

Use the screenshot spec above to produce a compliant first screenshot.

### 3) Privacy & Compliance (important)
- **Single purpose statement**:
  - Bug Hunter is an interactive browser mini-game that overlays animated bugs on the active webpage for stress-relief gameplay.
- **Data usage**:
  - No personal/sensitive user data collection.
  - No sale or transfer of user data.
  - Local storage only for gameplay progression.
- **Permissions justification**:
  - `activeTab`: start game only on the tab the user activates.
  - `scripting`: inject gameplay runtime and UI overlay.
  - `storage`: save score/achievement progression.
  - `clipboardWrite`: copy/share game text interactions.

### 4) Before Submit Checklist
- [ ] Build a fresh Chrome package from current source (`npm run package:chrome`).
- [ ] Verify `dist/chrome/manifest.json` version and metadata are correct.
- [ ] Validate the exact upload artifact:
  - `node scripts/validate-extension-package.mjs --zip artifacts/bug-hunter-chrome-v$(node -p "require('./package.json').version").zip`
- [ ] Confirm icons exist for 16/32/48/128.
- [ ] Add support URL and contact email in CWS listing.
- [ ] Upload at least one compliant screenshot.
- [ ] Complete Privacy tab answers consistent with real behavior.
- [ ] Test on common pages to ensure no breakage on restricted URLs.
- [ ] Re-check description text for policy-safe claims.

### 5) Suggested Store Tags
- bug game
- stress relief
- browser game
- chrome extension game
- casual game
- developer humor

### 6) Package Upload Notes
- Upload only `artifacts/bug-hunter-chrome-v<version>.zip` to the Chrome Web Store.
- Do not upload root-level legacy zips such as `bug-hunter-v<version>.zip`.
- Recommended zip content root:
  - `manifest.json`
  - `background/main.js`
  - `content/main.js`
  - `popup/main.js`
  - `content.css`
  - `index.html`
  - `assets/`
