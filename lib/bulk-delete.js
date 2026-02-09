/* Gemini Architect — Bulk Delete with checkboxes */
(function (GA) {

  let bulkMode = false;
  const selectedChats = new Set();

  // --------------- Helpers ---------------
  function getChatItems() {
    // All native Gemini chat items (not inside our folders)
    const items = [];
    const links = document.querySelectorAll('a[href*="/app/"]');
    for (const link of links) {
      if (link.closest('#ga-folders-container')) continue;
      const item = link.closest('li') || link.closest('[role="listitem"]') || link.parentElement;
      if (item && !items.includes(item)) {
        items.push({ element: item, link });
      }
    }
    return items;
  }

  function extractChatId(link) {
    const match = link.getAttribute('href').match(/\/app\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // --------------- Checkbox injection ---------------
  function injectCheckboxes() {
    const chatItems = getChatItems();
    for (const { element, link } of chatItems) {
      if (element.querySelector('.ga-bulk-checkbox')) continue;

      const chatId = extractChatId(link);
      if (!chatId) continue;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'ga-bulk-checkbox';
      cb.dataset.chatId = chatId;
      cb.checked = selectedChats.has(chatId);

      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        if (cb.checked) {
          selectedChats.add(chatId);
        } else {
          selectedChats.delete(chatId);
        }
        updateBulkBar();
      });

      cb.addEventListener('click', (e) => e.stopPropagation());

      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.insertBefore(cb, element.firstChild);
    }
  }

  function removeCheckboxes() {
    document.querySelectorAll('.ga-bulk-checkbox').forEach(cb => {
      const parent = cb.parentElement;
      cb.remove();
      // Reset inline styles we set
      if (parent) {
        parent.style.display = '';
        parent.style.alignItems = '';
      }
    });
    selectedChats.clear();
  }

  // --------------- Bulk action bar ---------------
  function createBulkBar() {
    if (document.getElementById('ga-bulk-bar')) return;

    const sidebar = document.querySelector('nav, [role="navigation"], aside');
    if (!sidebar) return;

    const bar = document.createElement('div');
    bar.id = 'ga-bulk-bar';
    bar.className = 'ga-bulk-bar';
    bar.style.display = 'none';

    const count = document.createElement('span');
    count.className = 'ga-bulk-count';
    count.textContent = '0 selected';
    bar.appendChild(count);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ga-bulk-delete-btn';
    deleteBtn.textContent = 'Delete Selected';
    deleteBtn.addEventListener('click', handleBulkDelete);
    bar.appendChild(deleteBtn);

    sidebar.appendChild(bar);
  }

  function updateBulkBar() {
    const bar = document.getElementById('ga-bulk-bar');
    if (!bar) return;

    const count = selectedChats.size;
    bar.querySelector('.ga-bulk-count').textContent = `${count} selected`;
    bar.querySelector('.ga-bulk-delete-btn').textContent = `Delete Selected (${count})`;
    bar.style.display = count > 0 ? 'flex' : 'none';
  }

  function removeBulkBar() {
    const bar = document.getElementById('ga-bulk-bar');
    if (bar) bar.remove();
  }

  // --------------- Deletion via native UI ---------------
  async function deleteChat(chatLink) {
    // Try to find and click the 3-dot menu for this chat
    const item = chatLink.closest('li') || chatLink.closest('[role="listitem"]') || chatLink.parentElement;
    if (!item) return false;

    // Hover to reveal the menu button
    item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await sleep(200);

    // Find the 3-dot/more button
    const moreBtn = item.querySelector('button[aria-label*="more"], button[aria-label*="More"], button[aria-label*="options"], button[aria-label*="Options"], [data-test-id*="menu"]');
    if (!moreBtn) {
      // Try any button that isn't the pin button
      const buttons = item.querySelectorAll('button');
      const menuBtn = Array.from(buttons).find(b => {
        const label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
        return label.includes('more') || label.includes('option') || label.includes('menu') || b.querySelector('svg');
      });
      if (menuBtn) {
        menuBtn.click();
      } else {
        console.warn('[GA] Could not find menu button for chat');
        return false;
      }
    } else {
      moreBtn.click();
    }

    await sleep(300);

    // Find "Delete" in the dropdown menu
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], button, [class*="menu"] button, [class*="dropdown"] button');
    let deleteItem = null;
    for (const mi of menuItems) {
      const text = mi.textContent.trim().toLowerCase();
      if (text === 'delete' || text.includes('delete')) {
        deleteItem = mi;
        break;
      }
    }

    if (!deleteItem) {
      console.warn('[GA] Could not find Delete menu item');
      // Close menu by clicking elsewhere
      document.body.click();
      return false;
    }

    deleteItem.click();
    await sleep(300);

    // Confirm deletion if a dialog appears
    const confirmBtns = document.querySelectorAll('button');
    for (const btn of confirmBtns) {
      const text = btn.textContent.trim().toLowerCase();
      if (text === 'delete' || text === 'confirm') {
        btn.click();
        break;
      }
    }

    await sleep(200);
    return true;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // --------------- Handle bulk delete ---------------
  async function handleBulkDelete() {
    if (selectedChats.size === 0) return;

    const count = selectedChats.size;
    const ok = await GA.showConfirm(
      'Bulk Delete',
      `Delete ${count} chat${count > 1 ? 's' : ''}? This cannot be undone.`
    );
    if (!ok) return;

    const deleteBtn = document.querySelector('.ga-bulk-delete-btn');
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
    }

    let deleted = 0;
    const chatIds = [...selectedChats];

    for (const chatId of chatIds) {
      // Find the link for this chat
      const links = document.querySelectorAll(`a[href*="/app/${chatId}"]`);
      let targetLink = null;
      for (const link of links) {
        if (!link.closest('#ga-folders-container')) {
          targetLink = link;
          break;
        }
      }

      if (targetLink) {
        const success = await deleteChat(targetLink);
        if (success) {
          deleted++;
          selectedChats.delete(chatId);
          // Also remove from any folders
          const folders = await GA.getFolders();
          for (const folder of Object.values(folders)) {
            folder.chats = folder.chats.filter(c => c.chatId !== chatId);
          }
          await GA.saveFolders(folders);
        }
      }

      if (deleteBtn) {
        deleteBtn.textContent = `Deleting... (${deleted}/${count})`;
      }

      // Delay between deletions
      await sleep(500);
    }

    GA.showToast(`Deleted ${deleted} of ${count} chats`);

    // Reset
    if (deleteBtn) {
      deleteBtn.disabled = false;
    }
    updateBulkBar();
    if (GA.renderFolders) GA.renderFolders();
  }

  // --------------- Toggle bulk mode ---------------
  function toggleBulkMode() {
    bulkMode = !bulkMode;

    const btn = document.getElementById('ga-bulk-toggle');
    if (btn) btn.classList.toggle('active', bulkMode);

    if (bulkMode) {
      injectCheckboxes();
      createBulkBar();
      updateBulkBar();
    } else {
      removeCheckboxes();
      removeBulkBar();
    }
  }

  // --------------- Init ---------------
  GA.initBulkDelete = function () {
    if (document.getElementById('ga-bulk-toggle')) return;

    const container = document.getElementById('ga-folders-container');
    if (!container) return;

    const header = container.querySelector('.ga-folders-header');
    if (!header) return;

    const btn = document.createElement('button');
    btn.id = 'ga-bulk-toggle';
    btn.className = 'ga-bulk-toggle-btn';
    btn.textContent = 'Select';
    btn.title = 'Toggle bulk delete mode';
    btn.addEventListener('click', toggleBulkMode);

    // Insert before the + button
    const addBtn = header.querySelector('.ga-add-folder-btn');
    if (addBtn) {
      header.insertBefore(btn, addBtn);
    } else {
      header.appendChild(btn);
    }
  };

  // Refresh checkboxes when sidebar updates (if bulk mode is on)
  GA.refreshBulkDelete = function () {
    if (bulkMode) {
      injectCheckboxes();
    }
  };

})(window.GeminiArchitect);
