# Gemini Architect -- Architecture Guide

This document describes the internal architecture of the Gemini Architect Chrome
extension. It is aimed at contributors and reviewers who need to understand how
the pieces fit together.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Module Dependency Graph](#2-module-dependency-graph)
3. [File Reference](#3-file-reference)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Storage Schema](#5-storage-schema)
6. [CSS Architecture](#6-css-architecture)
7. [DOM Integration Strategy](#7-dom-integration-strategy)
8. [Error Handling](#8-error-handling)
9. [Performance Considerations](#9-performance-considerations)
10. [Security Considerations](#10-security-considerations)

---

## 1. System Overview

```
+-----------------------------------------------------------------------+
|  Chrome Browser                                                       |
|                                                                       |
|  +--------------------+       +------------------------------------+  |
|  |   Popup (action)   | <---> |       chrome.storage.local         |  |
|  | popup.html/js/css  |       |   (ga_folders, ga_settings,        |  |
|  +--------------------+       |    ga_shortcuts, ga_version)        |  |
|           |                   +------------------------------------+  |
|           |                        ^            ^                     |
|           v                        |            |                     |
|  +--------------------+       +----+------------+------------------+  |
|  |   Background SW    |       |  Content Scripts (injected into    |  |
|  |  background.js     |------>|  gemini.google.com/*)              |  |
|  |                    | msg   |                                    |  |
|  | Relays keyboard    |       |  lib/storage.js      (GA core)    |  |
|  | shortcut commands  |       |  lib/dom-observer.js (observers)  |  |
|  | to content script  |       |  lib/folder-manager.js (folders)  |  |
|  +--------------------+       |  lib/drag-drop.js    (DnD)        |  |
|                               |  lib/search.js       (search)     |  |
|                               |  lib/bulk-delete.js  (bulk ops)   |  |
|                               |  lib/wide-mode.js    (layout)     |  |
|                               |  lib/copy-conversation.js (copy)  |  |
|                               |  lib/shortcuts.js    (shortcuts)  |  |
|                               |  content.js          (orchestrator)|  |
|                               +------------------------------------+  |
|                                        |                              |
|                                        v                              |
|                               +------------------------------------+  |
|                               |  Gemini Web App DOM                |  |
|                               |  (gemini.google.com)               |  |
|                               |                                    |  |
|                               |  Sidebar: nav, chat links          |  |
|                               |  Main: conversation area           |  |
|                               +------------------------------------+  |
+-----------------------------------------------------------------------+
```

The extension operates entirely within the browser. Content scripts are injected
into `gemini.google.com/*` pages at `document_idle`. The background service
worker only relays keyboard shortcut commands. The popup provides settings
management and backup/restore. All persistent state lives in
`chrome.storage.local`.

---

## 2. Module Dependency Graph

### Load Order (defined in manifest.json)

Scripts are loaded sequentially in this exact order. Each library IIFE attaches
functions to the shared `window.GeminiArchitect` (GA) namespace before the next
script runs.

```
1. lib/storage.js           Creates window.GeminiArchitect, event bus, storage API
2. lib/dom-observer.js      Adds waitForElement, onSidebarChange, onUrlChange
3. lib/folder-manager.js    Adds initFolderManager, renderFolders, showToast, showConfirm
4. lib/drag-drop.js         Adds initDragDrop
5. lib/search.js            Adds initSearch
6. lib/bulk-delete.js       Adds initBulkDelete, refreshBulkDelete
7. lib/wide-mode.js         Adds initWideMode, toggleWideMode
8. lib/copy-conversation.js Adds initCopyConversation, copyConversation, copyLastResponse
9. lib/shortcuts.js         Adds initShortcuts, listens for chrome.runtime messages
10. content.js              Orchestrator -- calls all init functions in sequence
```

### Dependency Graph

```
content.js (orchestrator)
  |
  +---> lib/storage.js          (GA namespace, event bus, chrome.storage)
  |       ^    ^    ^    ^    ^
  |       |    |    |    |    |
  +---> lib/dom-observer.js     (MutationObserver, URL change detection)
  |       ^
  |       |
  +---> lib/folder-manager.js   (folder UI, emoji picker, toast, confirm)
  |       ^         ^
  |       |         |
  +---> lib/drag-drop.js        (HTML5 drag and drop)
  |       |
  |       +--- uses GA.addChatToFolder (storage.js)
  |       +--- uses GA.showToast, GA.renderFolders (folder-manager.js)
  |
  +---> lib/search.js           (search bars for folders + native chats)
  |
  +---> lib/bulk-delete.js      (checkbox injection, native deletion)
  |       |
  |       +--- uses GA.showConfirm, GA.showToast (folder-manager.js)
  |       +--- uses GA.getFolders, GA.saveFolders (storage.js)
  |       +--- uses GA.renderFolders (folder-manager.js)
  |
  +---> lib/wide-mode.js        (wide layout toggle)
  |       |
  |       +--- uses GA.getSettings, GA.updateSetting (storage.js)
  |       +--- uses GA.on (storage.js event bus)
  |
  +---> lib/copy-conversation.js (clipboard operations)
  |       |
  |       +--- uses GA.showToast (folder-manager.js)
  |
  +---> lib/shortcuts.js        (keyboard dispatch)
          |
          +--- uses GA.copyLastResponse, GA.copyConversation (copy-conversation.js)
          +--- uses GA.toggleWideMode (wide-mode.js)
          +--- uses GA.getShortcuts, GA.on (storage.js)
```

### Namespace Pattern

Every library module follows this IIFE pattern:

```javascript
(function (GA) {
  GA.someFunction = function () { /* ... */ };
})(window.GeminiArchitect);
```

`storage.js` initializes the namespace with `window.GeminiArchitect = window.GeminiArchitect || {}`.
All subsequent modules receive the same object reference via the IIFE parameter.

---

## 3. File Reference

### manifest.json

| Field | Value |
|---|---|
| **Purpose** | Chrome extension manifest (Manifest V3) |
| **Permissions** | `storage`, `activeTab` |
| **Content script match** | `https://gemini.google.com/*` |
| **Run at** | `document_idle` |
| **Commands** | `copy-last-response` (Alt+Shift+C), `copy-conversation` (Alt+Shift+A), `toggle-wide-mode` (Alt+Shift+W), `new-chat` (Alt+Shift+N) |

Key design decisions:
- CSS is injected alongside JS as a content script (not programmatically)
- Lib modules load before `content.js` to ensure the GA namespace is populated
- Commands are registered for Chrome's global shortcut system

---

### lib/storage.js

| Field | Detail |
|---|---|
| **Purpose** | Creates the `window.GeminiArchitect` namespace, provides event bus and chrome.storage wrapper |
| **Exports to GA** | `on`, `off`, `emit`, `getFolders`, `saveFolders`, `createFolder`, `deleteFolder`, `renameFolder`, `setFolderIcon`, `toggleFolderCollapse`, `addChatToFolder`, `removeChatFromFolder`, `getSettings`, `saveSettings`, `updateSetting`, `getShortcuts`, `saveShortcuts`, `exportAll`, `importAll`, `initDefaults` |
| **Internal functions** | `get(key)`, `set(obj)` -- Promise wrappers around `chrome.storage.local` |
| **Dependencies** | None (first to load) |

Key details:
- **Event bus**: Simple pub/sub with `on`/`off`/`emit`. Errors in listeners are caught and logged.
- **DEFAULTS**: Defines initial values for `ga_folders` (empty object), `ga_settings` (`{ wideMode: false, hideLocation: true }`), `ga_shortcuts` (4 default combos), `ga_version` (`"1.0.0"`).
- **initDefaults**: Reads all storage keys; only writes keys that are `undefined` (first-run seeding).
- **Folder IDs**: Generated as `"folder_" + Date.now()`.
- **addChatToFolder**: Removes the chat from any other folder before adding (enforces single-folder membership).
- **saveFolders / saveSettings**: Emits `foldersChanged` / `settingsChanged` events after writing.

---

### lib/dom-observer.js

| Field | Detail |
|---|---|
| **Purpose** | DOM observation utilities for detecting sidebar changes and SPA navigation |
| **Exports to GA** | `waitForElement`, `onSidebarChange`, `onUrlChange` |
| **Internal functions** | None |
| **Dependencies** | `storage.js` (GA namespace) |

Key details:
- **waitForElement(selector, timeout)**: Returns a Promise that resolves when a matching element appears. Uses a MutationObserver on `document.body` with `childList: true, subtree: true`. Default timeout is 15 seconds.
- **onSidebarChange(callback)**: Observes the sidebar element for child-list mutations. Debounces callbacks to at most once per **250 ms**. Falls back to observing `document.body` if sidebar is not found.
- **onUrlChange(callback)**: Detects SPA navigation through three mechanisms:
  1. `popstate` event listener
  2. Monkey-patching `history.pushState` and `history.replaceState`
  3. **1-second polling** as a fallback for edge cases

---

### lib/folder-manager.js

| Field | Detail |
|---|---|
| **Purpose** | Folder UI rendering, creation, deletion, renaming, emoji picker |
| **Exports to GA** | `showToast`, `showConfirm`, `initFolderManager`, `renderFolders` |
| **Internal functions** | `showToast(msg)`, `showConfirm(title, message)`, `loadEmojiData()`, `showEmojiPicker(anchorEl, onPick)`, `handlePickerOutsideClick(e)`, `closeEmojiPicker()`, `findChatsHeader()`, `renderFolders()`, `startRename(folderEl, folder)`, `createNewFolder()` |
| **Dependencies** | `storage.js` (getFolders, saveFolders, createFolder, deleteFolder, renameFolder, setFolderIcon, toggleFolderCollapse, removeChatFromFolder, on), `assets/emoji-data.json` (lazy-loaded via fetch) |

Key details:
- **Toast notifications**: Animated with CSS keyframes, auto-remove after 2400 ms. Only one toast visible at a time.
- **Confirm dialog**: Modal overlay with Cancel/Delete buttons. Resolves a Promise with `true`/`false`. Clicking the overlay backdrop cancels.
- **Emoji picker**: Lazy-loads `emoji-data.json` via `chrome.runtime.getURL`. Falls back to a hardcoded 30-emoji list on failure. Has a search input that filters by substring. Positioned absolutely near the anchor element.
- **findChatsHeader()**: Looks for the "Chats" heading in the sidebar using headings, role attributes, and a TreeWalker fallback.
- **renderFolders()**: Reads folders from storage, sorts by `order`, and rebuilds the entire folder list DOM. Chat links use `pushState` + `popstate` dispatch for SPA-friendly navigation.
- **Inline rename**: Replaces the name `<span>` with an `<input>`, commits on blur or Enter, cancels on Escape.
- **Injection point**: Inserts `#ga-folders-container` above the "Chats" header. Falls back to inserting after navigation links.
- Listens to `foldersChanged` event to auto-re-render.

---

### lib/drag-drop.js

| Field | Detail |
|---|---|
| **Purpose** | HTML5 drag-and-drop for moving Gemini chat items into folders |
| **Exports to GA** | `initDragDrop` |
| **Internal functions** | `extractChatId(el)`, `extractChatTitle(el)`, `makeDraggable(el)`, `setupFolderDropTargets()` |
| **Dependencies** | `storage.js` (addChatToFolder), `folder-manager.js` (showToast, renderFolders) |

Key details:
- **Chat ID extraction**: Parses the `/app/{id}` pattern from anchor `href` attributes.
- **makeDraggable**: Sets `draggable="true"` on chat list items. Stores `{ chatId, title }` as JSON in `text/plain` dataTransfer. Marks elements with `data-ga-draggable` to avoid re-binding.
- **Drop targets**: Each `.ga-folder` element becomes a drop target. On drop, calls `GA.addChatToFolder` and shows a toast.
- **Dragging scope**: Makes the parent `<li>`, `[role="listitem"]`, or `parentElement` of each chat link draggable (not the link itself).
- **Re-injection**: `initDragDrop` is called again on sidebar mutations to handle newly-added chat items.

---

### lib/search.js

| Field | Detail |
|---|---|
| **Purpose** | Search bars for filtering folders and native Gemini chat list |
| **Exports to GA** | `initSearch` |
| **Internal functions** | `filterFolders(query)`, `injectFolderSearch()`, `filterChats(query)`, `injectChatSearch()` |
| **Dependencies** | `storage.js` (GA namespace) |

Key details:
- **Two separate search bars**: One for folders (injected after the folders header), one for native chats (injected before the chat list).
- **Folder search**: Filters both folder names and chat titles within folders. Auto-expands collapsed folders when a match is found inside. Hides empty-state messages during search.
- **Chat search**: Filters native Gemini chat items by hiding/showing their parent `<li>` or equivalent container.
- **Debounce**: Both searches use **150 ms** debounce via `setTimeout`.
- **Guard**: Checks for existing search elements before injecting.

---

### lib/bulk-delete.js

| Field | Detail |
|---|---|
| **Purpose** | Bulk selection and deletion of Gemini chats via simulated native UI interaction |
| **Exports to GA** | `initBulkDelete`, `refreshBulkDelete` |
| **Internal functions** | `getChatItems()`, `extractChatId(link)`, `injectCheckboxes()`, `removeCheckboxes()`, `createBulkBar()`, `updateBulkBar()`, `removeBulkBar()`, `deleteChat(chatLink)`, `sleep(ms)`, `handleBulkDelete()`, `toggleBulkMode()` |
| **Dependencies** | `storage.js` (getFolders, saveFolders), `folder-manager.js` (showConfirm, showToast, renderFolders) |

Key details:
- **Toggle mode**: A "Select" button in the folders header toggles bulk mode on/off.
- **Checkbox injection**: Prepends a checkbox to each native chat list item. Tracks selections in a `Set`.
- **Bulk action bar**: Sticky bar at the bottom of the sidebar showing count and "Delete Selected" button.
- **Native deletion simulation**: For each selected chat, the extension:
  1. Dispatches `mouseenter` to reveal the more-options button (200 ms wait)
  2. Clicks the three-dot/more menu button (300 ms wait)
  3. Finds and clicks the "Delete" menu item (300 ms wait)
  4. Clicks the confirmation "Delete" button if a dialog appears (200 ms wait)
- **Sequential processing**: Deletes one chat at a time with **500 ms** delays between deletions.
- **Folder cleanup**: After each successful deletion, removes the chat from any folders in storage.
- **refreshBulkDelete**: Re-injects checkboxes on sidebar mutations if bulk mode is active.

---

### lib/wide-mode.js

| Field | Detail |
|---|---|
| **Purpose** | Toggle for removing max-width constraints on the conversation area |
| **Exports to GA** | `initWideMode`, `toggleWideMode` |
| **Internal functions** | `updateState()` (closure inside initWideMode) |
| **Dependencies** | `storage.js` (getSettings, updateSetting, on) |

Key details:
- **CSS mechanism**: Toggles `ga-wide-mode` class on `document.body`. The CSS rule sets `max-width: 100% !important` and `width: 100% !important` on conversation containers.
- **Persistence**: Wide mode state is stored in `ga_settings.wideMode`.
- **Reactivity**: Listens to `settingsChanged` events to sync button state when toggled via shortcut.
- **initWideMode**: Creates a toggle button in the header buttons container.
- **toggleWideMode**: Exposed for use by the shortcuts module.

---

### lib/copy-conversation.js

| Field | Detail |
|---|---|
| **Purpose** | Copy full conversation or last response to clipboard |
| **Exports to GA** | `initCopyConversation`, `copyConversation`, `copyLastResponse` |
| **Internal functions** | `getConversationText()`, `getLastResponse()`, `copyToClipboard(text)` |
| **Dependencies** | `folder-manager.js` (showToast) |

Key details:
- **Conversation extraction** uses a 3-strategy approach:
  1. Look for `[data-turn-role]`, `.conversation-turn`, `[class*="turn"]` containers
  2. Fall back to `[class*="query"]`/`[class*="response"]` patterns in `<main>`
  3. Last resort: grab all `innerText` from `<main>`
- **Last response**: Finds `[data-turn-role="model"]` or similar, returns the last one. Falls back to the last `<div>`/`<p>`/`<pre>` with 50+ characters.
- **Clipboard**: Uses `navigator.clipboard.writeText` with a fallback to a hidden `<textarea>` + `document.execCommand('copy')`.
- **Format**: Messages are separated by `\n\n---\n\n` with `You:` / `Gemini:` labels.

---

### lib/shortcuts.js

| Field | Detail |
|---|---|
| **Purpose** | Keyboard shortcut dispatcher -- handles both Chrome command messages and custom key combos |
| **Exports to GA** | `initShortcuts` |
| **Internal functions** | `parseShortcut(str)`, `matchesShortcut(e, parsed)`, `loadShortcuts()`, `onKeyDown(e)` |
| **Dependencies** | `storage.js` (getShortcuts, on), `copy-conversation.js` (copyLastResponse, copyConversation), `wide-mode.js` (toggleWideMode) |

Key details:
- **Dual dispatch**:
  1. **Chrome commands**: `chrome.runtime.onMessage` listener receives `GA_COMMAND` messages from the background service worker.
  2. **Custom combos**: `keydown` listener on `document` (capture phase) matches against user-configured shortcuts.
- **ACTIONS map**: Maps command names to functions: `copy-last-response`, `copy-conversation`, `toggle-wide-mode`, `new-chat`.
- **Input guard**: Ignores keydown events when focus is in `<input>`, `<textarea>`, or `contentEditable` elements.
- **parseShortcut**: Splits a string like `"Alt+Shift+C"` into an object with boolean modifier flags and a key name.
- **Reload**: Listens to `shortcutsChanged` event to reload shortcut definitions without page refresh.

---

### content.js

| Field | Detail |
|---|---|
| **Purpose** | Orchestrator -- initializes all modules in sequence, handles SPA re-injection |
| **Exports to GA** | None (consumer only) |
| **Internal functions** | `detectTheme()`, `applySettings()`, `findSidebar()`, `findChatListParent()`, `injectHeaderButtons()`, `injectAll()` |
| **Dependencies** | All lib modules |

Key details:
- **Double-init guard**: Sets `window.__gaInitialized = true` to prevent re-running.
- **Theme detection**: Reads `document.body` background color, computes luminance using `(R*299 + G*587 + B*114) / 1000`. Adds `ga-light-theme` class if luminance > 128.
- **Sidebar selectors**: Tries in order: `nav[aria-label]`, `[role="navigation"]`, `aside`, `.sidebar`.
- **Initialization sequence**:
  1. `GA.initDefaults()` -- seed storage
  2. `detectTheme()` -- detect light/dark
  3. `applySettings()` -- apply wideMode, hideLocation
  4. Wait for sidebar (up to 20 seconds)
  5. `GA.initFolderManager()` -- inject folder UI
  6. `GA.initDragDrop()` -- bind drag handlers
  7. `GA.initSearch()` -- inject search bars
  8. `GA.initBulkDelete()` -- inject bulk toggle
  9. `injectHeaderButtons()` -- wide mode, new chat, copy conversation
  10. `GA.initShortcuts()` -- bind keyboard handlers
- **SPA navigation**: On URL change, waits 500 ms then re-runs `injectAll()`.
- **Sidebar mutations**: Re-runs `initDragDrop` and `refreshBulkDelete` on sidebar changes.
- **Settings listener**: Reacts to `settingsChanged` events to toggle `ga-wide-mode` and `ga-hide-location` classes.
- **Theme observer**: MutationObserver on `document.body` for `style` and `class` attribute changes to re-detect theme.

---

### background.js

| Field | Detail |
|---|---|
| **Purpose** | Relays Chrome keyboard shortcut commands to the active content script |
| **Exports** | None |
| **Internal functions** | None |
| **Dependencies** | None |

Key details:
- Listens to `chrome.commands.onCommand`.
- Queries for the active tab; if its URL contains `gemini.google.com`, sends a `{ type: 'GA_COMMAND', command }` message via `chrome.tabs.sendMessage`.
- Error handling wraps the entire operation in try/catch.

---

### popup/popup.html

| Field | Detail |
|---|---|
| **Purpose** | Extension popup UI for backup/restore and shortcut configuration |
| **Sections** | Data management (download/restore), Keyboard shortcuts (4 configurable combos), Links (support, tip jar) |

---

### popup/popup.js

| Field | Detail |
|---|---|
| **Purpose** | Popup logic -- backup/restore and shortcut editing |
| **Exports** | None (standalone popup script) |
| **Internal functions** | `showStatus(elId, msg, type)`, `loadShortcuts()` |
| **Dependencies** | `chrome.storage.local` (direct access, not via GA namespace) |

Key details:
- **Download**: Reads all `STORAGE_KEYS` from storage, creates a JSON Blob, triggers download via a temporary `<a>` element. Filename includes ISO date.
- **Restore**: Reads a `.json` file, validates schema (checks for object type, valid keys, folders structure), writes to storage. Only restores keys that match the known `STORAGE_KEYS` set.
- **Shortcut editing**: Inputs are `readonly` with click-to-record behavior. On focus, shows "Press keys...". On keydown, captures modifier + key combo. Ignores lone modifier presses. Saves to `ga_shortcuts` in storage.
- **Status messages**: Temporary success/error messages that auto-clear after 3 seconds.

---

### popup/popup.css

| Field | Detail |
|---|---|
| **Purpose** | Popup styling -- dark theme matching the main extension |
| **Fixed width** | 340px |
| **Color scheme** | Hardcoded dark values matching the content script's dark theme defaults |

---

### assets/emoji-data.json

| Field | Detail |
|---|---|
| **Purpose** | Flat JSON array of emoji characters for the folder icon picker |
| **Structure** | `["emoji1", "emoji2", ...]` -- simple string array |
| **Size** | ~190 entries |
| **Loading** | Lazy-loaded by `folder-manager.js` via `chrome.runtime.getURL` + `fetch` |

---

## 4. Data Flow Diagrams

### Folder Creation Flow

```
User clicks "+" button
        |
        v
createNewFolder()
        |
        v
GA.createFolder("New Folder", folder_icon)
        |
        +---> Generates ID: "folder_" + Date.now()
        +---> Calculates order: max(existing orders) + 1
        +---> Writes to chrome.storage.local
        +---> GA.emit("foldersChanged", folders)
        |
        v
renderFolders()  <--- triggered by foldersChanged listener
        |
        +---> Reads all folders from storage
        +---> Sorts by order
        +---> Rebuilds #ga-folders-container DOM
        |
        v
startRename(folderEl, folder)
        |
        +---> Replaces name <span> with <input>
        +---> On Enter/blur: GA.renameFolder() ---> storage ---> renderFolders()
        +---> On Escape: renderFolders() (cancel)
```

### Drag and Drop Flow

```
User drags a Gemini chat item
        |
        v
dragstart event on chat list item
        |
        +---> extractChatId(el)  -- parses /app/{id} from href
        +---> extractChatTitle(el) -- reads link text or aria-label
        +---> e.dataTransfer.setData("text/plain", JSON.stringify({chatId, title}))
        +---> el.classList.add("ga-chat-dragging")
        |
        v
User hovers over a .ga-folder
        |
        v
dragover event
        +---> e.preventDefault()  (allow drop)
        +---> folder.classList.add("ga-folder-drag-over")  (visual highlight)
        |
        v
User drops onto the folder
        |
        v
drop event
        +---> Parse JSON from dataTransfer
        +---> Read folder ID from dataset
        +---> GA.addChatToFolder(folderId, chatId, title)
        |       |
        |       +---> Removes chat from any other folder
        |       +---> Adds to target folder's chats array
        |       +---> Writes to chrome.storage.local
        |       +---> GA.emit("foldersChanged")
        |
        +---> GA.showToast("Added to folder")
        +---> GA.renderFolders()
        |
        v
dragend event
        +---> Remove "ga-chat-dragging" class
        +---> Remove all "ga-folder-drag-over" highlights
```

### Bulk Delete Flow

```
User clicks "Select" toggle button
        |
        v
toggleBulkMode()  -->  bulkMode = true
        |
        +---> injectCheckboxes()
        |       +---> For each native chat item (not in #ga-folders-container):
        |       +---> Prepend <input type="checkbox"> with chatId in dataset
        |
        +---> createBulkBar()
                +---> Sticky bar at bottom of sidebar: count + "Delete Selected"
        |
        v
User checks multiple chats  -->  selectedChats.add(chatId)  -->  updateBulkBar()
        |
        v
User clicks "Delete Selected"
        |
        v
handleBulkDelete()
        |
        +---> GA.showConfirm("Bulk Delete", "Delete N chats?")
        +---> User confirms
        |
        v
For each chatId (sequentially):
        |
        +---> Find the <a> link for this chat
        +---> deleteChat(chatLink):
        |       +---> mouseenter on item (200ms wait)
        |       +---> Click 3-dot menu button (300ms wait)
        |       +---> Click "Delete" menu item (300ms wait)
        |       +---> Click confirmation "Delete" (200ms wait)
        |
        +---> Remove chatId from all folders in storage
        +---> Update progress: "Deleting... (N/total)"
        +---> 500ms delay before next chat
        |
        v
GA.showToast("Deleted N of M chats")
GA.renderFolders()
```

### SPA Navigation Handling

```
Gemini SPA navigates to a new URL
        |
        +---> history.pushState() or history.replaceState() called
        |       |
        |       v
        |   Monkey-patched wrapper fires check()
        |       |
        +---> popstate event fires  ----+
        |                               |
        +---> 1s polling detects href   |
              change                    |
                                        |
                      +-----------------+
                      v
              GA.onUrlChange callback fires
                      |
                      v
              content.js handler:
                      |
                      +---> await 500ms (let Gemini update DOM)
                      +---> injectAll():
                              +---> detectTheme()
                              +---> applySettings()
                              +---> Wait for sidebar (up to 20s)
                              +---> initFolderManager() [guarded: skip if already present]
                              +---> initDragDrop() [re-binds new chat items]
                              +---> initSearch() [guarded: skip if already present]
                              +---> initBulkDelete() [guarded: skip if already present]
                              +---> injectHeaderButtons() [guarded: skip if already present]
                              +---> initShortcuts() [guarded: skip if already present]
```

### Shortcut Flow

```
User presses Alt+Shift+C
        |
        +---> Chrome catches registered command "copy-last-response"
        |       |
        |       v
        |   background.js: chrome.commands.onCommand
        |       |
        |       +---> Query active tab
        |       +---> Check URL includes "gemini.google.com"
        |       +---> chrome.tabs.sendMessage(tab.id, {type: "GA_COMMAND", command: "copy-last-response"})
        |       |
        |       v
        |   shortcuts.js: chrome.runtime.onMessage listener
        |       |
        |       +---> ACTIONS["copy-last-response"]()
        |       +---> GA.copyLastResponse()
        |               |
        |               +---> getLastResponse()
        |               +---> copyToClipboard(text)
        |               +---> GA.showToast("Last response copied!")
        |
        +---> (Alternative) keydown event on document (capture phase)
                |
                +---> shortcuts.js: onKeyDown(e)
                +---> Skip if target is INPUT/TEXTAREA/contentEditable
                +---> Match against parsedShortcuts
                +---> If match found: e.preventDefault(), ACTIONS[command]()
```

### Backup / Restore Flow

```
BACKUP (Download):
    User clicks "Download Data" in popup
        |
        v
    popup.js:
        +---> chrome.storage.local.get(STORAGE_KEYS)
        +---> JSON.stringify(data, null, 2)
        +---> new Blob([json], {type: "application/json"})
        +---> URL.createObjectURL(blob)
        +---> Create <a> with download="gemini-architect-backup-YYYY-MM-DD.json"
        +---> a.click()
        +---> URL.revokeObjectURL(url)
        +---> showStatus("Data downloaded!", "success")

RESTORE (from file):
    User clicks "Restore from File" --> file picker opens
        |
        v
    popup.js (file input change):
        +---> file.text()  -->  JSON.parse(text)
        +---> Validate: must be an object
        +---> Filter: only keep keys in STORAGE_KEYS set
        +---> Validate: ga_folders must be an object if present
        +---> chrome.storage.local.set(toRestore)
        +---> showStatus("Restored N setting(s). Reload Gemini tab to apply.")
```

---

## 5. Storage Schema

All data is stored in `chrome.storage.local` under the following keys:

### `ga_folders`

```javascript
{
  "folder_1700000000000": {
    "id": "folder_1700000000000",   // string, "folder_" + timestamp
    "name": "Work Projects",        // string, user-editable
    "icon": "briefcase_emoji",      // string, single emoji character
    "collapsed": false,             // boolean, UI collapse state
    "order": 0,                     // number, sort position
    "chats": [                      // array of chat references
      {
        "chatId": "abc123def456",   // string, extracted from /app/{id}
        "title": "Chat about X",   // string, from link text
        "addedAt": 1700000000000   // number, timestamp
      }
    ],
    "createdAt": 1700000000000     // number, timestamp
  }
}
```

**Default**: `{}` (empty object)

### `ga_settings`

```javascript
{
  "wideMode": false,      // boolean, remove max-width on conversation
  "hideLocation": true    // boolean, hide location indicators
}
```

**Default**: `{ wideMode: false, hideLocation: true }`

### `ga_shortcuts`

```javascript
{
  "copyLastResponse": "Alt+Shift+C",  // string, key combo
  "copyConversation": "Alt+Shift+A",  // string, key combo
  "toggleWide": "Alt+Shift+W",        // string, key combo
  "newChat": "Alt+Shift+N"            // string, key combo
}
```

**Default**: All four shortcuts as shown above.

### `ga_version`

```javascript
"1.0.0"   // string, extension version for future migration
```

**Default**: `"1.0.0"`

### Initialization

`GA.initDefaults()` (called at startup by `content.js`):
1. Reads all keys from `chrome.storage.local.get(null)`
2. For each key in `DEFAULTS`, if the stored value is `undefined`, queues it for writing
3. Writes all missing defaults in a single `chrome.storage.local.set()` call

### Storage Event Propagation

```
GA.saveFolders(folders)
    --> chrome.storage.local.set({ga_folders: folders})
    --> GA.emit("foldersChanged", folders)
        --> folder-manager.js: renderFolders()

GA.saveSettings(settings)
    --> chrome.storage.local.set({ga_settings: settings})
    --> GA.emit("settingsChanged", settings)
        --> content.js: toggle ga-wide-mode / ga-hide-location classes
        --> wide-mode.js: updateState() syncs button

GA.saveShortcuts(shortcuts)
    --> chrome.storage.local.set({ga_shortcuts: shortcuts})
    --> GA.emit("shortcutsChanged", shortcuts)
        --> shortcuts.js: loadShortcuts() re-parses all combos
```

---

## 6. CSS Architecture

### CSS Custom Properties

All custom properties use the `--ga-` prefix and are defined on `:root`:

| Variable | Dark Theme | Light Theme | Purpose |
|---|---|---|---|
| `--ga-bg` | `#1e1f20` | `#ffffff` | Primary background |
| `--ga-bg-hover` | `#2a2b2d` | `#f1f3f4` | Hover state background |
| `--ga-bg-active` | `#333537` | `#e8eaed` | Active/pressed state |
| `--ga-bg-surface` | `#282a2c` | `#f8f9fa` | Elevated surface (inputs, bars) |
| `--ga-bg-overlay` | `#2d2e30` | `#ffffff` | Dialogs, pickers |
| `--ga-border` | `#3c3e41` | `#dadce0` | Borders and dividers |
| `--ga-text` | `#e3e3e3` | `#202124` | Primary text |
| `--ga-text-secondary` | `#9aa0a6` | `#5f6368` | Secondary text |
| `--ga-text-muted` | `#6e7479` | `#9aa0a6` | Muted/disabled text |
| `--ga-accent` | `#8ab4f8` | `#1a73e8` | Accent color (links, highlights) |
| `--ga-accent-hover` | `#aecbfa` | `#1967d2` | Accent hover state |
| `--ga-danger` | `#f28b82` | `#d93025` | Destructive action color |
| `--ga-danger-hover` | `#ee675c` | `#c5221f` | Danger hover state |
| `--ga-success` | `#81c995` | `#188038` | Success color |
| `--ga-font` | `'Google Sans', 'Segoe UI', Roboto, sans-serif` | (same) | Font stack |
| `--ga-radius` | `8px` | (same) | Standard border radius |
| `--ga-radius-sm` | `4px` | (same) | Small border radius |
| `--ga-transition` | `150ms ease` | (same) | Standard transition timing |

### Theme Detection

- **Dark theme** is the default (`:root` variables).
- **Light theme** is activated by adding the `.ga-light-theme` class to `<html>`.
- Detection method (in `content.js`):
  1. Read `getComputedStyle(document.body).backgroundColor`
  2. Extract RGB values via regex
  3. Calculate perceived luminance: `(R*299 + G*587 + B*114) / 1000`
  4. If luminance > 128, apply `.ga-light-theme`
- A MutationObserver on `document.body` (`style` and `class` attributes) re-runs detection when Gemini's theme changes.

### Scoping Strategy

All extension CSS uses these scoping techniques to avoid conflicts with Gemini's styles:

1. **`ga-` prefix**: Every class name starts with `ga-` (e.g., `.ga-folder`, `.ga-search-input`).
2. **ID prefix**: Container elements use `#ga-` IDs (e.g., `#ga-folders-container`, `#ga-bulk-bar`).
3. **Ancestor scoping**: Folder-related styles are scoped under `#ga-folders-container`.
4. **Body class toggles**: Feature classes applied to `<body>` (e.g., `body.ga-wide-mode`, `body.ga-hide-location`).
5. **Custom properties**: All CSS variables use `--ga-` prefix.

### Key Class Naming Conventions

```
ga-folder              Folder wrapper
ga-folder-row          Clickable folder header row
ga-folder-icon         Emoji icon
ga-folder-name         Folder name text
ga-folder-name-input   Inline rename input
ga-folder-chevron      Collapse/expand arrow
ga-folder-actions      Action buttons container (hover-revealed)
ga-folder-action-btn   Individual action button (rename, delete)
ga-folder-chats        Chat list inside folder
ga-folder-chat         Individual chat item in folder
ga-folder-chat-title   Chat link
ga-folder-chat-remove  Remove-from-folder button
ga-folder-drag-over    Drop target highlight state
ga-folder-empty        Empty folder placeholder
ga-chat-dragging       Drag source opacity state
ga-search-*            Search bar elements
ga-bulk-*              Bulk delete elements
ga-wide-*              Wide mode elements
ga-header-buttons      Fixed header button container
ga-toast               Toast notification
ga-dialog-*            Confirmation dialog elements
ga-emoji-*             Emoji picker elements
```

### Animation and Transition Patterns

- **Standard transitions**: `var(--ga-transition)` = `150ms ease` applied to `background`, `color`, `border-color`, and `transform`.
- **Toast animation**: Two-phase keyframe animation:
  - `ga-toast-in` (200ms): slide up + fade in
  - `ga-toast-out` (200ms, delayed 2s): fade out
- **Chevron rotation**: `transform: rotate(-90deg)` on `.ga-folder.collapsed .ga-folder-chevron`.
- **Hover reveals**: `.ga-folder-actions` and `.ga-folder-chat-remove` use `display: none` / `display: flex|block` toggled by parent `:hover`.

---

## 7. DOM Integration Strategy

### Injection into Gemini's Page

The extension does not use Shadow DOM. All elements are injected directly into
Gemini's DOM tree, relying on the `ga-` prefix scoping to avoid conflicts.

**Injection points**:
1. **Folders container** (`#ga-folders-container`): Inserted into the sidebar, above the "Chats" heading.
2. **Search bars**: Folder search after the folders header; chat search before the native chat list.
3. **Bulk delete toggle**: Inside the folders header, before the "+" button.
4. **Header buttons**: Fixed-position container at `top: 12px; right: 80px` on `document.body`.
5. **Bulk action bar**: Appended to the sidebar element.
6. **Toast notifications**: Appended to `document.body`.
7. **Confirm dialogs**: Appended to `document.body` as a fixed overlay.
8. **Emoji picker**: Appended to `document.body`, absolutely positioned near the anchor.

### Selector Strategy

The extension uses a layered selector approach to handle Gemini's evolving DOM:

**Sidebar detection** (tried in order):
1. `nav[aria-label]` -- semantic navigation landmark
2. `[role="navigation"]` -- ARIA role
3. `aside` -- HTML5 aside element
4. `.sidebar` -- class-based fallback

**Chat link detection**:
- `a[href*="/app/"]` -- links containing the Gemini chat URL pattern

**Chat ID extraction**:
- Regex: `/\/app\/([a-zA-Z0-9_-]+)/` on `href` attribute

**"Chats" header detection**:
1. `h2, h3, [class*="header"], [role="heading"]` with text content "Chats"
2. TreeWalker fallback scanning text nodes in the sidebar

**Message containers** (for copy-conversation):
1. `[data-turn-role]`, `.conversation-turn`, `[class*="turn"]`
2. `[class*="query"]`, `[class*="response"]`, `.markdown-body`
3. `main` or `[role="main"]` inner text (last resort)

### MutationObserver Usage

| Observer | Target | Config | Debounce | Purpose |
|---|---|---|---|---|
| `waitForElement` | `document.body` | `childList: true, subtree: true` | None (resolves once) | Wait for specific elements to appear |
| `onSidebarChange` | sidebar or `document.body` | `childList: true, subtree: true` | **250 ms** | Detect chat list additions/removals |
| Theme observer | `document.body` | `attributes: true, attributeFilter: ['style', 'class']` | None | Re-detect light/dark theme |

### SPA Handling

Gemini is a single-page application. The extension detects navigation through:

1. **pushState interception**: Wraps `history.pushState` to call `check()` after the original.
2. **replaceState interception**: Wraps `history.replaceState` similarly.
3. **popstate listener**: Standard browser back/forward navigation.
4. **Polling**: `setInterval(check, 1000)` as a safety net.

On URL change, `injectAll()` re-runs after a 500 ms delay, but each module
guards against double-injection by checking for existing elements.

---

## 8. Error Handling

### Graceful Degradation

- **Sidebar not found**: `injectAll()` waits up to 20 seconds for the sidebar via `waitForElement`. If timeout expires, logs a warning and returns without crashing.
- **Module not available**: Content.js checks `if (GA.initFolderManager)` before calling each init function, so missing modules do not break the extension.
- **Emoji data load failure**: Falls back to a hardcoded 30-emoji array.
- **"Chats" header not found**: Folder container falls back to inserting after navigation links, or prepends to the sidebar.

### Fallback Selectors

All selector-based lookups use multiple strategies (see Section 7). If the primary selector fails, subsequent selectors are tried.

### Storage Error Handling

- `get(key)` returns the value from `DEFAULTS` if the stored value is `undefined`.
- Event bus `emit` wraps each listener call in try/catch to prevent one failing listener from breaking others.

### Clipboard API Fallback

`copyToClipboard()` in `copy-conversation.js`:
1. Tries `navigator.clipboard.writeText()` (modern API)
2. On failure, creates a hidden `<textarea>`, uses `document.execCommand('copy')` (legacy API)

### Bulk Delete Error Recovery

- If the 3-dot menu button cannot be found for a chat, that deletion is skipped (returns `false`).
- If the "Delete" menu item cannot be found, clicks `document.body` to close the menu and skips.
- The deletion counter tracks actual successes vs. attempts.

---

## 9. Performance Considerations

### Debouncing

| Operation | Delay | Location |
|---|---|---|
| Sidebar mutation callback | **250 ms** | `dom-observer.js` `onSidebarChange` |
| Folder search filter | **150 ms** | `search.js` `folderSearchTimer` |
| Chat search filter | **150 ms** | `search.js` `chatSearchTimer` |
| URL change re-injection | **500 ms** | `content.js` SPA handler |
| Initial injection delay | **1000 ms** | `content.js` (wait for SPA to settle) |

### Lazy Loading

- **Emoji data**: `emoji-data.json` is loaded on first emoji picker open, not at startup. Cached in the `emojiData` module variable for subsequent opens.

### Sequential Bulk Delete

Bulk deletion processes chats one at a time with deliberate delays:
- 200 ms after mouseenter (reveal menu)
- 300 ms after menu click (wait for dropdown)
- 300 ms after "Delete" click (wait for dialog)
- 200 ms after confirmation click
- **500 ms between each chat deletion**

This sequential approach prevents overwhelming Gemini's UI and ensures each deletion completes before the next begins.

### Re-injection Guards

Every `init*` function checks for existing injected elements before creating new ones:
- `if (document.getElementById('ga-folders-container')) return`
- `if (document.getElementById('ga-bulk-toggle')) return`
- `if (document.getElementById('ga-header-buttons')) return`
- `if (el.dataset.gaDraggable) return` (per-element guard for drag handlers)

This prevents duplicate UI elements and event listener accumulation during SPA re-injections.

### DOM Manipulation

- `renderFolders()` rebuilds the entire folder list by clearing and re-creating elements. This is a trade-off favoring simplicity over incremental DOM updates, acceptable given the typically small number of folders.
- Search filters use `style.display` toggling rather than removing/re-adding elements.

---

## 10. Security Considerations

### Content Script Isolation

- Content scripts run in an isolated world with access to the page DOM but a separate JavaScript context.
- The `window.GeminiArchitect` namespace is on the content script's world, not accessible to the page's scripts.

### No External Network Requests

The extension makes zero external network requests:
- Emoji data is loaded from the extension's own bundled assets via `chrome.runtime.getURL`.
- All storage uses `chrome.storage.local` (on-device only).
- The popup links (GitHub, tip jar) are static `<a>` tags that open in new tabs; they do not send data.

### Storage-Only Data Persistence

- All data persists exclusively in `chrome.storage.local`.
- No cookies, no IndexedDB, no external APIs.
- Backup files are generated client-side as JSON blobs.
- Restore validates the file structure before writing to storage (checks for object type, valid key names, valid folder structure).

### XSS Prevention

- **No `innerHTML` with user data**: Folder names and chat titles are set via `textContent`, not `innerHTML`. The only `innerHTML` usage is for static UI chrome (dialog buttons, button labels with emoji).
- **Confirm dialog**: The `title` and `message` parameters of `showConfirm` are inserted via `innerHTML`, but these are always developer-controlled strings, never raw user input.
- **JSON parsing**: Drag-and-drop data is parsed with `JSON.parse` inside a try/catch; malformed data is silently ignored.

### Permissions

The extension requests minimal permissions:
- **`storage`**: For `chrome.storage.local` access.
- **`activeTab`**: For sending messages to the active tab (keyboard shortcuts).
- No `tabs`, `webRequest`, `cookies`, or other broad permissions.

### Input Validation

- Restore validates that imported data is an object and that `ga_folders` (if present) is an object.
- Only keys matching the known `STORAGE_KEYS` set are restored; unexpected keys are silently dropped.
- Chat IDs are extracted via regex with a strict alphanumeric + hyphen + underscore pattern.
