const PROTECTED_URL_PATTERN = /^(chrome:\/\/|chrome-extension:\/\/|about:)/;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'activate') return;

  const { tabId, weapon, mute, tool } = message;
  const selectedMode = 'free-play' as const;

  if (!tabId) {
    sendResponse({ ok: false, error: 'No tab' });
    return;
  }

  (async () => {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url || PROTECTED_URL_PATTERN.test(tab.url)) {
        sendResponse({ ok: false, error: 'Cannot run on this page' });
        return;
      }

      // Inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['dist/content.css'],
      });

      // Set globals before content script runs
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (w: string, m: boolean, selectedModeArg: 'free-play' | 'challenge', selectedToolArg: string) => {
          (window as any).bugCatcherWeapon = w;
          (window as any).bugCatcherMute = m;
          (window as any).bugCatcherActivate = true;
          (window as any).bugCatcherMode = selectedModeArg;
          (window as any).bugCatcherTool = selectedToolArg;
          // Legacy compat
          (window as any).pageDestroyerWeapon = w;
          (window as any).pageDestroyerMute = m;
          (window as any).pageDestroyerActivate = true;
        },
        args: [weapon || 'slipper', !!mute, selectedMode, tool || 'destroy-tools'],
      });

      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['dist/content/main.js'],
      });

      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true; // Keep message channel open for async response
});
