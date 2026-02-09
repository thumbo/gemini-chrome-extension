/* Gemini Architect — Search bars for folders + chats */
(function (GA) {

  let folderSearchTimer = null;
  let chatSearchTimer = null;
  const DEBOUNCE = 150;

  // --------------- Folder search ---------------
  function filterFolders(query) {
    const q = query.toLowerCase().trim();
    const folders = document.querySelectorAll('#ga-folders-container .ga-folder');

    for (const folder of folders) {
      const name = (folder.querySelector('.ga-folder-name')?.textContent || '').toLowerCase();
      const chats = folder.querySelectorAll('.ga-folder-chat-title');
      let chatMatch = false;

      for (const chat of chats) {
        const title = chat.textContent.toLowerCase();
        if (q && !title.includes(q)) {
          chat.closest('.ga-folder-chat').style.display = 'none';
        } else {
          chat.closest('.ga-folder-chat').style.display = '';
          if (q) chatMatch = true;
        }
      }

      // Show folder if name matches or any chat inside matches
      if (!q || name.includes(q) || chatMatch) {
        folder.style.display = '';
        // Auto-expand folder if search matches chats inside
        if (q && chatMatch && folder.classList.contains('collapsed')) {
          folder.querySelector('.ga-folder-chats').style.display = '';
        }
      } else {
        folder.style.display = 'none';
      }
    }

    // Also show/hide the empty states
    const empties = document.querySelectorAll('#ga-folders-container .ga-folder-empty');
    for (const empty of empties) {
      empty.style.display = q ? 'none' : '';
    }
  }

  function injectFolderSearch() {
    const container = document.getElementById('ga-folders-container');
    if (!container || container.querySelector('.ga-search-container')) return;

    const header = container.querySelector('.ga-folders-header');
    if (!header) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'ga-search-container';

    const input = document.createElement('input');
    input.className = 'ga-search-input';
    input.placeholder = 'Search folders...';
    input.addEventListener('input', () => {
      clearTimeout(folderSearchTimer);
      folderSearchTimer = setTimeout(() => filterFolders(input.value), DEBOUNCE);
    });

    wrapper.appendChild(input);
    header.after(wrapper);
  }

  // --------------- Chat list search ---------------
  function filterChats(query) {
    const q = query.toLowerCase().trim();
    // Find all native Gemini chat links (not inside our folder container)
    const chatLinks = document.querySelectorAll('a[href*="/app/"]');

    for (const link of chatLinks) {
      if (link.closest('#ga-folders-container')) continue;
      const item = link.closest('li') || link.closest('[role="listitem"]') || link.parentElement;
      if (!item) continue;

      const title = link.textContent.toLowerCase();
      if (!q || title.includes(q)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    }
  }

  function injectChatSearch() {
    if (document.getElementById('ga-chat-search')) return;

    // Find the chat list area — look for the first chat link's scrollable parent
    const firstChat = document.querySelector('a[href*="/app/"]');
    if (!firstChat) return;

    // Find insertion point: before the scrollable list or after "Chats" heading
    let insertBefore = null;
    const headings = document.querySelectorAll('h2, h3, [role="heading"]');
    for (const h of headings) {
      if (h.textContent.trim().toLowerCase() === 'chats') {
        insertBefore = h.nextElementSibling || h;
        break;
      }
    }

    // Walk up to find a good parent
    if (!insertBefore) {
      let parent = firstChat.parentElement;
      while (parent && parent.parentElement && parent.parentElement !== document.body) {
        if (parent.previousElementSibling) {
          insertBefore = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    if (!insertBefore) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'ga-search-container';
    wrapper.id = 'ga-chat-search';

    const input = document.createElement('input');
    input.className = 'ga-search-input';
    input.placeholder = 'Search chats...';
    input.addEventListener('input', () => {
      clearTimeout(chatSearchTimer);
      chatSearchTimer = setTimeout(() => filterChats(input.value), DEBOUNCE);
    });

    wrapper.appendChild(input);
    insertBefore.parentElement.insertBefore(wrapper, insertBefore);
  }

  // --------------- Init ---------------
  GA.initSearch = function () {
    injectFolderSearch();
    injectChatSearch();
  };

})(window.GeminiArchitect);
