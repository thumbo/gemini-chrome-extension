/* Gemini Architect — Keyboard Shortcut Dispatcher */
(function (GA) {

  const ACTIONS = {
    'copy-last-response': () => GA.copyLastResponse && GA.copyLastResponse(),
    'copy-conversation':  () => GA.copyConversation && GA.copyConversation(),
    'toggle-wide-mode':   () => GA.toggleWideMode && GA.toggleWideMode(),
    'new-chat':           () => {
      const btn = document.querySelector('a[href="/app"] button, a[href="/app"], button[aria-label*="New chat"], [data-test-id="new-chat"]');
      if (btn) btn.click();
      else window.location.href = '/app';
    }
  };

  // Map storage key names to chrome.commands names
  const SHORTCUT_KEY_MAP = {
    copyLastResponse: 'copy-last-response',
    copyConversation: 'copy-conversation',
    toggleWide:       'toggle-wide-mode',
    newChat:          'new-chat'
  };

  // --------------- Listen for messages from background ---------------
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'GA_COMMAND' && ACTIONS[msg.command]) {
      ACTIONS[msg.command]();
    }
  });

  // --------------- Parse shortcut string ---------------
  function parseShortcut(str) {
    if (!str) return null;
    const parts = str.split('+').map(p => p.trim().toLowerCase());
    return {
      alt:   parts.includes('alt'),
      ctrl:  parts.includes('ctrl') || parts.includes('control'),
      shift: parts.includes('shift'),
      meta:  parts.includes('meta') || parts.includes('cmd'),
      key:   parts.filter(p => !['alt','ctrl','control','shift','meta','cmd'].includes(p))[0] || ''
    };
  }

  function matchesShortcut(e, parsed) {
    if (!parsed || !parsed.key) return false;
    return (
      e.altKey   === parsed.alt &&
      e.ctrlKey  === parsed.ctrl &&
      e.shiftKey === parsed.shift &&
      e.metaKey  === parsed.meta &&
      e.key.toLowerCase() === parsed.key
    );
  }

  // --------------- Keydown listener for custom combos ---------------
  let parsedShortcuts = {};

  async function loadShortcuts() {
    const shortcuts = await GA.getShortcuts();
    parsedShortcuts = {};
    for (const [storageKey, commandName] of Object.entries(SHORTCUT_KEY_MAP)) {
      if (shortcuts[storageKey]) {
        parsedShortcuts[commandName] = parseShortcut(shortcuts[storageKey]);
      }
    }
  }

  function onKeyDown(e) {
    // Don't intercept when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    for (const [command, parsed] of Object.entries(parsedShortcuts)) {
      if (matchesShortcut(e, parsed) && ACTIONS[command]) {
        e.preventDefault();
        e.stopPropagation();
        ACTIONS[command]();
        return;
      }
    }
  }

  // --------------- Init ---------------
  GA.initShortcuts = function () {
    loadShortcuts();
    document.addEventListener('keydown', onKeyDown, true);

    // Reload if shortcuts change
    GA.on('shortcutsChanged', loadShortcuts);
  };

})(window.GeminiArchitect);
