/* Gemini Architect — Storage wrapper + Event bus */
window.GeminiArchitect = window.GeminiArchitect || {};

(function (GA) {
  // --------------- Event Bus ---------------
  const _listeners = {};

  GA.on = function (event, fn) {
    (_listeners[event] = _listeners[event] || []).push(fn);
  };

  GA.off = function (event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(f => f !== fn);
  };

  GA.emit = function (event, data) {
    (_listeners[event] || []).forEach(fn => {
      try { fn(data); } catch (e) { console.error('[GA] event error', event, e); }
    });
  };

  // --------------- Defaults ---------------
  const DEFAULTS = {
    ga_folders: {},
    ga_settings: { wideMode: false, hideLocation: true },
    ga_shortcuts: {
      copyLastResponse: 'Alt+Shift+C',
      copyConversation: 'Alt+Shift+A',
      toggleWide: 'Alt+Shift+W',
      newChat: 'Alt+Shift+N'
    },
    ga_version: '1.0.0'
  };

  // --------------- Helpers ---------------
  function get(key) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, result => {
        resolve(result[key] !== undefined ? result[key] : DEFAULTS[key]);
      });
    });
  }

  function set(obj) {
    return new Promise(resolve => {
      chrome.storage.local.set(obj, resolve);
    });
  }

  // --------------- Folders ---------------
  GA.getFolders = () => get('ga_folders');

  GA.saveFolders = async (folders) => {
    await set({ ga_folders: folders });
    GA.emit('foldersChanged', folders);
  };

  GA.createFolder = async (name, icon) => {
    const folders = await GA.getFolders();
    const id = 'folder_' + Date.now();
    const orderMax = Object.values(folders).reduce((m, f) => Math.max(m, f.order || 0), -1);
    folders[id] = {
      id,
      name: name || 'New Folder',
      icon: icon || '\uD83D\uDCC1',
      collapsed: false,
      order: orderMax + 1,
      chats: [],
      createdAt: Date.now()
    };
    await GA.saveFolders(folders);
    return folders[id];
  };

  GA.deleteFolder = async (folderId) => {
    const folders = await GA.getFolders();
    delete folders[folderId];
    await GA.saveFolders(folders);
  };

  GA.renameFolder = async (folderId, newName) => {
    const folders = await GA.getFolders();
    if (folders[folderId]) {
      folders[folderId].name = newName;
      await GA.saveFolders(folders);
    }
  };

  GA.setFolderIcon = async (folderId, icon) => {
    const folders = await GA.getFolders();
    if (folders[folderId]) {
      folders[folderId].icon = icon;
      await GA.saveFolders(folders);
    }
  };

  GA.toggleFolderCollapse = async (folderId) => {
    const folders = await GA.getFolders();
    if (folders[folderId]) {
      folders[folderId].collapsed = !folders[folderId].collapsed;
      await GA.saveFolders(folders);
    }
  };

  GA.addChatToFolder = async (folderId, chatId, title) => {
    const folders = await GA.getFolders();
    if (!folders[folderId]) return;
    // Remove from any other folder first
    for (const f of Object.values(folders)) {
      f.chats = f.chats.filter(c => c.chatId !== chatId);
    }
    folders[folderId].chats.push({ chatId, title, addedAt: Date.now() });
    await GA.saveFolders(folders);
  };

  GA.removeChatFromFolder = async (folderId, chatId) => {
    const folders = await GA.getFolders();
    if (!folders[folderId]) return;
    folders[folderId].chats = folders[folderId].chats.filter(c => c.chatId !== chatId);
    await GA.saveFolders(folders);
  };

  // --------------- Settings ---------------
  GA.getSettings = () => get('ga_settings');

  GA.saveSettings = async (settings) => {
    await set({ ga_settings: settings });
    GA.emit('settingsChanged', settings);
  };

  GA.updateSetting = async (key, value) => {
    const settings = await GA.getSettings();
    settings[key] = value;
    await GA.saveSettings(settings);
  };

  // --------------- Shortcuts ---------------
  GA.getShortcuts = () => get('ga_shortcuts');

  GA.saveShortcuts = async (shortcuts) => {
    await set({ ga_shortcuts: shortcuts });
    GA.emit('shortcutsChanged', shortcuts);
  };

  // --------------- Backup / Restore ---------------
  GA.exportAll = async () => {
    const [folders, settings, shortcuts] = await Promise.all([
      GA.getFolders(),
      GA.getSettings(),
      GA.getShortcuts()
    ]);
    return { ga_folders: folders, ga_settings: settings, ga_shortcuts: shortcuts, ga_version: '1.0.0' };
  };

  GA.importAll = async (data) => {
    if (!data || typeof data !== 'object') throw new Error('Invalid data');
    if (data.ga_folders) await set({ ga_folders: data.ga_folders });
    if (data.ga_settings) await set({ ga_settings: data.ga_settings });
    if (data.ga_shortcuts) await set({ ga_shortcuts: data.ga_shortcuts });
    GA.emit('foldersChanged', data.ga_folders || {});
    GA.emit('settingsChanged', data.ga_settings || DEFAULTS.ga_settings);
  };

  // --------------- Init defaults ---------------
  GA.initDefaults = async () => {
    const result = await new Promise(resolve => chrome.storage.local.get(null, resolve));
    const toSet = {};
    for (const [key, val] of Object.entries(DEFAULTS)) {
      if (result[key] === undefined) toSet[key] = val;
    }
    if (Object.keys(toSet).length) await set(toSet);
  };

})(window.GeminiArchitect);
