/* Gemini Architect — Drag & Drop for chats → folders */
(function (GA) {

  const CHAT_LINK_PATTERN = /\/app\/([a-zA-Z0-9_-]+)/;

  function extractChatId(el) {
    const anchor = el.tagName === 'A' ? el : el.querySelector('a[href*="/app/"]');
    if (!anchor) return null;
    const match = anchor.getAttribute('href').match(CHAT_LINK_PATTERN);
    return match ? match[1] : null;
  }

  function extractChatTitle(el) {
    // Try innerText of the link itself, or its text-content children
    const anchor = el.tagName === 'A' ? el : el.querySelector('a[href*="/app/"]');
    if (anchor) {
      return anchor.textContent.trim() || anchor.getAttribute('aria-label') || '';
    }
    return el.textContent.trim().substring(0, 80);
  }

  function makeDraggable(el) {
    if (el.dataset.gaDraggable) return;
    el.dataset.gaDraggable = 'true';
    el.setAttribute('draggable', 'true');

    el.addEventListener('dragstart', (e) => {
      const chatId = extractChatId(el);
      const title = extractChatTitle(el);
      if (!chatId) return;

      e.dataTransfer.setData('text/plain', JSON.stringify({ chatId, title }));
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('ga-chat-dragging');
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('ga-chat-dragging');
      // Remove all drag-over highlights
      document.querySelectorAll('.ga-folder-drag-over').forEach(f => f.classList.remove('ga-folder-drag-over'));
    });
  }

  function setupFolderDropTargets() {
    const folders = document.querySelectorAll('.ga-folder');
    for (const folder of folders) {
      if (folder.dataset.gaDropTarget) continue;
      folder.dataset.gaDropTarget = 'true';

      folder.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        folder.classList.add('ga-folder-drag-over');
      });

      folder.addEventListener('dragleave', (e) => {
        // Only remove if actually leaving the folder element
        if (!folder.contains(e.relatedTarget)) {
          folder.classList.remove('ga-folder-drag-over');
        }
      });

      folder.addEventListener('drop', async (e) => {
        e.preventDefault();
        folder.classList.remove('ga-folder-drag-over');

        let data;
        try {
          data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch { return; }

        if (!data.chatId) return;

        const folderId = folder.dataset.folderId;
        if (!folderId) return;

        await GA.addChatToFolder(folderId, data.chatId, data.title);
        GA.showToast(`Added to folder`);
        if (GA.renderFolders) GA.renderFolders();
      });
    }
  }

  GA.initDragDrop = function () {
    // Make all Gemini chat links draggable
    const chatLinks = document.querySelectorAll('a[href*="/app/"]');
    for (const link of chatLinks) {
      // Skip links inside our own folders container
      if (link.closest('#ga-folders-container')) continue;
      // Make the parent list item draggable if it exists, otherwise the link
      const item = link.closest('li') || link.closest('[role="listitem"]') || link.parentElement;
      makeDraggable(item || link);
    }

    // Set up drop targets on our folder elements
    setupFolderDropTargets();
  };

})(window.GeminiArchitect);
