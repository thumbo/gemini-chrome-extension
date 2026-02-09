/* Gemini Architect — Background Service Worker */

// Relay keyboard shortcut commands to the active content script
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('gemini.google.com')) {
      chrome.tabs.sendMessage(tab.id, { type: 'GA_COMMAND', command });
    }
  } catch (e) {
    console.error('[GA background] Error relaying command:', e);
  }
});
