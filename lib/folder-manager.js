/* Gemini Architect — Folder Manager */
(function (GA) {

  let emojiData = null;

  // --------------- Helpers ---------------
  function showToast(msg) {
    const existing = document.querySelector('.ga-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'ga-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  function showConfirm(title, message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'ga-dialog-overlay';
      overlay.innerHTML = `
        <div class="ga-dialog">
          <div class="ga-dialog-title">${title}</div>
          <div class="ga-dialog-message">${message}</div>
          <div class="ga-dialog-buttons">
            <button class="ga-dialog-btn cancel">Cancel</button>
            <button class="ga-dialog-btn danger">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      overlay.querySelector('.cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });
      overlay.querySelector('.danger').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { overlay.remove(); resolve(false); }
      });
    });
  }

  // Make showToast and showConfirm available to other modules
  GA.showToast = showToast;
  GA.showConfirm = showConfirm;

  // --------------- Emoji Picker ---------------
  async function loadEmojiData() {
    if (emojiData) return emojiData;
    try {
      const url = chrome.runtime.getURL('assets/emoji-data.json');
      const resp = await fetch(url);
      emojiData = await resp.json();
    } catch (e) {
      console.warn('[GA] Could not load emoji data, using fallback');
      emojiData = ['📁','📂','📌','⭐','❤️','🔥','💡','🎯','📚','🏠','💼','🎮','🎵','🔧','✅',
        '📊','🚀','🌍','🎨','💬','🛠️','📝','🔬','🎓','🏆','📷','🎪','🧩','💎','🔑'];
    }
    return emojiData;
  }

  function showEmojiPicker(anchorEl, onPick) {
    closeEmojiPicker();
    const picker = document.createElement('div');
    picker.className = 'ga-emoji-picker';
    picker.id = 'ga-emoji-picker';

    const search = document.createElement('input');
    search.className = 'ga-emoji-search';
    search.placeholder = 'Search emojis...';
    picker.appendChild(search);

    const grid = document.createElement('div');
    grid.className = 'ga-emoji-grid';
    picker.appendChild(grid);

    function renderEmojis(filter) {
      grid.innerHTML = '';
      const list = filter
        ? emojiData.filter(e => e.includes(filter))
        : emojiData;
      for (const emoji of list) {
        const cell = document.createElement('button');
        cell.className = 'ga-emoji-cell';
        cell.textContent = emoji;
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          onPick(emoji);
          closeEmojiPicker();
        });
        grid.appendChild(cell);
      }
    }

    search.addEventListener('input', () => renderEmojis(search.value));

    loadEmojiData().then(() => renderEmojis());

    // Position near anchor
    const rect = anchorEl.getBoundingClientRect();
    picker.style.top = (rect.bottom + 4) + 'px';
    picker.style.left = Math.max(4, rect.left) + 'px';
    document.body.appendChild(picker);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', handlePickerOutsideClick);
    }, 50);
  }

  function handlePickerOutsideClick(e) {
    const picker = document.getElementById('ga-emoji-picker');
    if (picker && !picker.contains(e.target)) {
      closeEmojiPicker();
    }
  }

  function closeEmojiPicker() {
    const picker = document.getElementById('ga-emoji-picker');
    if (picker) picker.remove();
    document.removeEventListener('click', handlePickerOutsideClick);
  }

  // --------------- Find insertion point ---------------
  function findChatsHeader() {
    // Look for the "Chats" text in the sidebar
    const candidates = document.querySelectorAll('h2, h3, [class*="header"], [role="heading"]');
    for (const el of candidates) {
      if (el.textContent.trim().toLowerCase() === 'chats') return el;
    }
    // Fallback: find text node containing "Chats"
    const walker = document.createTreeWalker(
      document.querySelector('nav, [role="navigation"], aside') || document.body,
      NodeFilter.SHOW_ELEMENT
    );
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (text === 'Chats' && node.children.length === 0) return node;
    }
    return null;
  }

  // --------------- Render ---------------
  async function renderFolders() {
    const container = document.getElementById('ga-folders-container');
    if (!container) return;

    const folders = await GA.getFolders();
    const sorted = Object.values(folders).sort((a, b) => a.order - b.order);

    // Keep the header, clear folders list
    let list = container.querySelector('.ga-folders-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'ga-folders-list';
      container.appendChild(list);
    }
    list.innerHTML = '';

    for (const folder of sorted) {
      const folderEl = document.createElement('div');
      folderEl.className = 'ga-folder' + (folder.collapsed ? ' collapsed' : '');
      folderEl.dataset.folderId = folder.id;

      // Folder row
      const row = document.createElement('div');
      row.className = 'ga-folder-row';

      // Icon (clickable to change)
      const icon = document.createElement('span');
      icon.className = 'ga-folder-icon';
      icon.textContent = folder.icon || '\uD83D\uDCC1';
      icon.title = 'Change icon';
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        showEmojiPicker(icon, async (emoji) => {
          await GA.setFolderIcon(folder.id, emoji);
          renderFolders();
        });
      });
      row.appendChild(icon);

      // Name
      const name = document.createElement('span');
      name.className = 'ga-folder-name';
      name.textContent = folder.name;
      row.appendChild(name);

      // Actions (rename, delete) — shown on hover
      const actions = document.createElement('div');
      actions.className = 'ga-folder-actions';

      const renameBtn = document.createElement('button');
      renameBtn.className = 'ga-folder-action-btn';
      renameBtn.textContent = '\u270F\uFE0F';
      renameBtn.title = 'Rename folder';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startRename(folderEl, folder);
      });
      actions.appendChild(renameBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'ga-folder-action-btn danger';
      deleteBtn.textContent = '\uD83D\uDDD1\uFE0F';
      deleteBtn.title = 'Delete folder';
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await showConfirm(
          'Delete Folder',
          `Delete "${folder.name}"? Chats inside will not be deleted.`
        );
        if (ok) {
          await GA.deleteFolder(folder.id);
          renderFolders();
        }
      });
      actions.appendChild(deleteBtn);

      row.appendChild(actions);

      // Chevron
      const chevron = document.createElement('span');
      chevron.className = 'ga-folder-chevron';
      chevron.textContent = '\u25BC';
      row.appendChild(chevron);

      // Click to toggle collapse
      row.addEventListener('click', async () => {
        await GA.toggleFolderCollapse(folder.id);
        folderEl.classList.toggle('collapsed');
      });

      folderEl.appendChild(row);

      // Chat list inside folder
      const chatsDiv = document.createElement('div');
      chatsDiv.className = 'ga-folder-chats';

      if (folder.chats.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'ga-folder-empty';
        empty.textContent = 'Drag chats here';
        chatsDiv.appendChild(empty);
      } else {
        for (const chat of folder.chats) {
          const chatEl = document.createElement('div');
          chatEl.className = 'ga-folder-chat';

          const link = document.createElement('a');
          link.className = 'ga-folder-chat-title';
          link.textContent = chat.title || chat.chatId;
          link.href = '/app/' + chat.chatId;
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/app/' + chat.chatId);
            window.dispatchEvent(new PopStateEvent('popstate'));
          });
          chatEl.appendChild(link);

          const removeBtn = document.createElement('button');
          removeBtn.className = 'ga-folder-chat-remove';
          removeBtn.textContent = '\u2715';
          removeBtn.title = 'Remove from folder';
          removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await GA.removeChatFromFolder(folder.id, chat.chatId);
            renderFolders();
          });
          chatEl.appendChild(removeBtn);

          chatsDiv.appendChild(chatEl);
        }
      }

      folderEl.appendChild(chatsDiv);
      list.appendChild(folderEl);
    }
  }

  // --------------- Rename inline ---------------
  function startRename(folderEl, folder) {
    const nameSpan = folderEl.querySelector('.ga-folder-name');
    const input = document.createElement('input');
    input.className = 'ga-folder-name-input';
    input.value = folder.name;
    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    const finish = async () => {
      const newName = input.value.trim() || folder.name;
      await GA.renameFolder(folder.id, newName);
      renderFolders();
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(); }
      if (e.key === 'Escape') renderFolders();
    });
  }

  // --------------- Create new folder ---------------
  async function createNewFolder() {
    const folder = await GA.createFolder('New Folder', '\uD83D\uDCC1');
    await renderFolders();
    // Start rename on the new folder
    const folderEl = document.querySelector(`[data-folder-id="${folder.id}"]`);
    if (folderEl) startRename(folderEl, folder);
  }

  // --------------- Init ---------------
  GA.initFolderManager = async function () {
    // Don't double-inject
    if (document.getElementById('ga-folders-container')) return;

    // Find where to inject (above "Chats" header)
    const chatsHeader = findChatsHeader();
    const sidebar = document.querySelector('nav, [role="navigation"], aside');
    if (!sidebar) {
      console.warn('[GA] Cannot find sidebar for folder injection');
      return;
    }

    // Create main container
    const container = document.createElement('div');
    container.id = 'ga-folders-container';

    // Header row
    const header = document.createElement('div');
    header.className = 'ga-folders-header';

    const title = document.createElement('span');
    title.className = 'ga-header-title';
    title.textContent = 'Folders';
    header.appendChild(title);

    const addBtn = document.createElement('button');
    addBtn.className = 'ga-add-folder-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Create new folder';
    addBtn.addEventListener('click', createNewFolder);
    header.appendChild(addBtn);

    container.appendChild(header);

    // Insert before Chats header or at start of sidebar
    if (chatsHeader && chatsHeader.parentElement) {
      chatsHeader.parentElement.insertBefore(container, chatsHeader);
    } else {
      // Fallback: insert after first few items (New chat, My stuff, Gems)
      const links = sidebar.querySelectorAll('a[href*="/app"], a[href*="/my-stuff"], a[href*="/gems"]');
      const lastLink = links.length > 0 ? links[links.length - 1] : null;
      if (lastLink && lastLink.parentElement) {
        const parent = lastLink.closest('div') || lastLink.parentElement;
        parent.parentElement.insertBefore(container, parent.nextSibling);
      } else {
        sidebar.prepend(container);
      }
    }

    await renderFolders();

    // Listen for storage changes
    GA.on('foldersChanged', renderFolders);
  };

  // Expose renderFolders for other modules
  GA.renderFolders = renderFolders;

})(window.GeminiArchitect);
