/* ============================================================
   Gemini Architect — Content Script Orchestrator
   ============================================================ */
(async function () {
  const GA = window.GeminiArchitect;
  if (!GA) return console.error('[GA] GeminiArchitect not found');

  // Prevent double-init
  if (window.__gaInitialized) return;
  window.__gaInitialized = true;

  console.log('[GA] Gemini Architect initializing...');

  // --------------- Init storage defaults ---------------
  await GA.initDefaults();

  // --------------- Theme detection ---------------
  function detectTheme() {
    const bg = getComputedStyle(document.body).backgroundColor;
    const match = bg.match(/\d+/g);
    if (match) {
      const luminance = (parseInt(match[0]) * 299 + parseInt(match[1]) * 587 + parseInt(match[2]) * 114) / 1000;
      if (luminance > 128) {
        document.documentElement.classList.add('ga-light-theme');
      } else {
        document.documentElement.classList.remove('ga-light-theme');
      }
    }
  }

  // --------------- Apply persisted settings ---------------
  async function applySettings() {
    const settings = await GA.getSettings();
    if (settings.wideMode) document.body.classList.add('ga-wide-mode');
    if (settings.hideLocation) document.body.classList.add('ga-hide-location');
  }

  // --------------- Selectors for Gemini sidebar ---------------
  // Layered: try data attributes first, fall back to structural
  const SIDEBAR_SELECTORS = [
    'nav[aria-label]',
    '[role="navigation"]',
    'aside',
    '.sidebar'
  ];

  const CHAT_LIST_SELECTORS = [
    // Structural: scrollable container with anchors to /app/
    'nav a[href*="/app/"]'
  ];

  function findSidebar() {
    for (const sel of SIDEBAR_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function findChatListParent() {
    // Find the scrollable parent that holds chat links
    const firstChat = document.querySelector('a[href*="/app/"]');
    if (!firstChat) return null;
    // Walk up to find the scrollable container
    let parent = firstChat.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return parent;
      parent = parent.parentElement;
    }
    return firstChat.parentElement;
  }

  // --------------- Inject header buttons ---------------
  function injectHeaderButtons() {
    if (document.getElementById('ga-header-buttons')) return;
    const container = document.createElement('div');
    container.id = 'ga-header-buttons';
    container.className = 'ga-header-buttons';
    document.body.appendChild(container);

    // Wide mode toggle
    if (GA.initWideMode) GA.initWideMode(container);

    // New chat button
    const newChatBtn = document.createElement('button');
    newChatBtn.className = 'ga-new-chat-btn';
    newChatBtn.innerHTML = '+ New Chat';
    newChatBtn.title = 'Start a new chat';
    newChatBtn.addEventListener('click', () => {
      // Click Gemini's native new chat button
      const nativeBtn = document.querySelector('a[href="/app"] button, a[href="/app"], button[aria-label*="New chat"], [data-test-id="new-chat"]');
      if (nativeBtn) {
        nativeBtn.click();
      } else {
        window.location.href = '/app';
      }
    });
    container.appendChild(newChatBtn);

    // Copy conversation button
    if (GA.initCopyConversation) GA.initCopyConversation(container);
  }

  // --------------- Main injection ---------------
  async function injectAll() {
    detectTheme();
    await applySettings();

    // Wait for sidebar to appear
    const sidebar = findSidebar();
    if (!sidebar) {
      console.log('[GA] Sidebar not found yet, waiting...');
      try {
        await GA.waitForElement(SIDEBAR_SELECTORS.join(', '), 20000);
      } catch (e) {
        console.warn('[GA] Could not find sidebar after timeout');
        return;
      }
    }

    // Inject folders if not already present
    if (!document.getElementById('ga-folders-container')) {
      if (GA.initFolderManager) await GA.initFolderManager();
    }

    // Inject drag-drop handlers
    if (GA.initDragDrop) GA.initDragDrop();

    // Inject search bars
    if (GA.initSearch) GA.initSearch();

    // Inject bulk delete toggle
    if (GA.initBulkDelete) GA.initBulkDelete();

    // Inject header buttons (wide mode, new chat, copy conversation)
    injectHeaderButtons();

    // Init shortcuts
    if (GA.initShortcuts) GA.initShortcuts();

    console.log('[GA] Gemini Architect loaded.');
  }

  // --------------- SPA Navigation handling ---------------
  GA.onUrlChange(async () => {
    console.log('[GA] URL changed, re-checking injection...');
    // Small delay for Gemini to update DOM
    await new Promise(r => setTimeout(r, 500));
    await injectAll();
  });

  // --------------- Sidebar mutation re-injection ---------------
  GA.onSidebarChange(() => {
    // Re-inject drag handlers when sidebar content changes
    if (GA.initDragDrop) GA.initDragDrop();
    // Re-apply bulk delete checkboxes if mode is active
    if (GA.refreshBulkDelete) GA.refreshBulkDelete();
  });

  // --------------- Listen for settings changes ---------------
  GA.on('settingsChanged', (settings) => {
    if (settings.wideMode) {
      document.body.classList.add('ga-wide-mode');
    } else {
      document.body.classList.remove('ga-wide-mode');
    }
    if (settings.hideLocation) {
      document.body.classList.add('ga-hide-location');
    } else {
      document.body.classList.remove('ga-hide-location');
    }
  });

  // --------------- Kick off ---------------
  // Wait a moment for Gemini's SPA to settle
  await new Promise(r => setTimeout(r, 1000));
  await injectAll();

  // Theme observer — re-detect if body background changes
  const themeObserver = new MutationObserver(detectTheme);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

})();
