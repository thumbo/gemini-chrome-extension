/* Gemini Architect — Popup Script */

const STORAGE_KEYS = ['ga_folders', 'ga_settings', 'ga_shortcuts', 'ga_version'];

// --------------- Helpers ---------------
function showStatus(elId, msg, type) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'status-msg'; }, 3000);
}

// --------------- Download Data ---------------
document.getElementById('download-data').addEventListener('click', async () => {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEYS);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-architect-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showStatus('data-status', 'Data downloaded!', 'success');
  } catch (e) {
    showStatus('data-status', 'Download failed: ' + e.message, 'error');
  }
});

// --------------- Restore from File ---------------
document.getElementById('restore-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate schema
    if (typeof data !== 'object') throw new Error('Invalid file format');

    const validKeys = new Set(STORAGE_KEYS);
    const toRestore = {};
    for (const [key, val] of Object.entries(data)) {
      if (validKeys.has(key)) {
        toRestore[key] = val;
      }
    }

    if (Object.keys(toRestore).length === 0) {
      throw new Error('No valid Gemini Architect data found in file');
    }

    // Validate folders structure
    if (toRestore.ga_folders && typeof toRestore.ga_folders !== 'object') {
      throw new Error('Invalid folders data');
    }

    await chrome.storage.local.set(toRestore);

    const count = Object.keys(toRestore).length;
    showStatus('data-status', `Restored ${count} setting(s). Reload Gemini tab to apply.`, 'success');
  } catch (err) {
    showStatus('data-status', 'Restore failed: ' + err.message, 'error');
  }

  // Reset file input
  e.target.value = '';
});

// --------------- Keyboard Shortcuts ---------------
const shortcutInputs = document.querySelectorAll('.shortcut-input');

// Load current shortcuts
async function loadShortcuts() {
  const result = await chrome.storage.local.get('ga_shortcuts');
  const shortcuts = result.ga_shortcuts || {};

  for (const input of shortcutInputs) {
    const action = input.dataset.action;
    if (shortcuts[action]) {
      input.value = shortcuts[action];
    }
  }
}

// Key capture on shortcut inputs
for (const input of shortcutInputs) {
  input.addEventListener('focus', () => {
    input.classList.add('recording');
    input.value = 'Press keys...';
  });

  input.addEventListener('blur', () => {
    input.classList.remove('recording');
    if (input.value === 'Press keys...') {
      input.value = '';
    }
  });

  input.addEventListener('keydown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Ignore lone modifier keys
    if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');

    // Normalize key name
    let key = e.key;
    if (key.length === 1) key = key.toUpperCase();

    parts.push(key);
    input.value = parts.join('+');
    input.classList.remove('recording');
    input.blur();
  });
}

// Save shortcuts
document.getElementById('save-shortcuts').addEventListener('click', async () => {
  const shortcuts = {};
  for (const input of shortcutInputs) {
    const action = input.dataset.action;
    const value = input.value.trim();
    if (value && value !== 'Press keys...') {
      shortcuts[action] = value;
    }
  }

  try {
    await chrome.storage.local.set({ ga_shortcuts: shortcuts });
    showStatus('shortcut-status', 'Shortcuts saved! Active on next page load.', 'success');
  } catch (e) {
    showStatus('shortcut-status', 'Save failed: ' + e.message, 'error');
  }
});

// --------------- Init ---------------
loadShortcuts();
