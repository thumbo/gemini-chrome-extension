# Gemini Architect -- AI Context

Gemini Architect is a Chrome extension (Manifest V3) that adds folder organization, search, bulk delete, wide mode, conversation copying, and keyboard shortcuts to the Google Gemini web interface at gemini.google.com. It uses vanilla JavaScript with no build step or external dependencies.

## File Structure

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest -- declares permissions (storage, activeTab), content scripts, service worker, and chrome.commands |
| `content.js` | Orchestrator -- loaded last, initializes all modules in sequence, handles SPA re-injection |
| `content.css` | All injected CSS -- folders, search bars, bulk delete, wide mode, dialogs, toasts |
| `background.js` | Service worker -- relays chrome.commands keyboard shortcuts to the active content script via message passing |
| `lib/storage.js` | Storage wrapper around chrome.storage.local, event bus (on/emit/off), CRUD for folders/settings/shortcuts, backup/restore |
| `lib/dom-observer.js` | `waitForElement()` using MutationObserver, `onSidebarChange()` throttled observer, `onUrlChange()` via History API interception + polling |
| `lib/folder-manager.js` | Folder UI: rendering, create/rename/delete, emoji picker, inline rename, confirmation dialogs, toast notifications |
| `lib/drag-drop.js` | Makes native Gemini chat items draggable, sets up folder elements as drop targets, extracts chat ID and title from href |
| `lib/search.js` | Two search bars: one filters folders + their chats, another filters the native Gemini chat list. Both use debounced input |
| `lib/bulk-delete.js` | Toggleable selection mode with checkboxes on native chats, batch deletion by automating Gemini's native delete flow (hover, menu, delete, confirm) |
| `lib/wide-mode.js` | Toggles `ga-wide-mode` class on body, persists state in settings |
| `lib/copy-conversation.js` | Extracts conversation text using layered selectors (data attributes, class patterns, fallback to main area), copies to clipboard |
| `lib/shortcuts.js` | Parses shortcut strings (e.g. "Alt+Shift+C"), listens for keydown events, dispatches to action handlers. Also receives commands from background.js |
| `popup/popup.html` | Extension popup with data backup/restore and shortcut configuration |
| `popup/popup.js` | Popup logic -- download/restore JSON, key capture for shortcut inputs |
| `popup/popup.css` | Popup styles |
| `assets/emoji-data.json` | Emoji array for the folder icon picker |

## Architecture

### Global Namespace

All modules attach to `window.GeminiArchitect` (aliased as `GA`). The first loaded module (`lib/storage.js`) creates the object:

```js
window.GeminiArchitect = window.GeminiArchitect || {};
```

Every other module wraps itself in an IIFE that receives `GA`:

```js
(function (GA) {
  GA.someFunction = function () { ... };
})(window.GeminiArchitect);
```

### Load Order

Defined in `manifest.json` content_scripts.js array -- order matters:

1. `lib/storage.js` -- creates GA object, event bus, storage API
2. `lib/dom-observer.js` -- adds waitForElement, onSidebarChange, onUrlChange
3. `lib/folder-manager.js` -- folder rendering and emoji picker
4. `lib/drag-drop.js` -- drag-and-drop handlers
5. `lib/search.js` -- search bar injection
6. `lib/bulk-delete.js` -- bulk delete mode
7. `lib/wide-mode.js` -- wide mode toggle
8. `lib/copy-conversation.js` -- copy conversation/response
9. `lib/shortcuts.js` -- keyboard shortcut dispatcher
10. `content.js` -- **orchestrator, loaded last** -- calls init functions in order

### Event Bus

`GA.on(event, fn)` / `GA.emit(event, data)` / `GA.off(event, fn)`

Key events:
- `foldersChanged` -- emitted after any folder CRUD operation; triggers folder re-render
- `settingsChanged` -- emitted after settings save; updates wide mode and hide-location classes
- `shortcutsChanged` -- emitted after shortcut save; reloads parsed shortcuts

### Message Passing

Background service worker receives `chrome.commands.onCommand` events and forwards them as `{ type: 'GA_COMMAND', command: '...' }` messages to the active Gemini tab. The shortcuts module in the content script listens for these messages.

## Storage Schema

All data stored via `chrome.storage.local` under these keys:

### `ga_folders` (object)

Map of folder ID to folder object:

```js
{
  "folder_1700000000000": {
    "id": "folder_1700000000000",
    "name": "Work Projects",
    "icon": "briefcase-emoji",    // single emoji character
    "collapsed": false,
    "order": 0,                   // sort position
    "chats": [
      { "chatId": "abc123", "title": "Budget Planning", "addedAt": 1700000000000 }
    ],
    "createdAt": 1700000000000
  }
}
```

### `ga_settings` (object)

```js
{
  "wideMode": false,       // boolean -- expand main content area
  "hideLocation": true     // boolean -- hide location indicator
}
```

### `ga_shortcuts` (object)

```js
{
  "copyLastResponse": "Alt+Shift+C",
  "copyConversation": "Alt+Shift+A",
  "toggleWide": "Alt+Shift+W",
  "newChat": "Alt+Shift+N"
}
```

### `ga_version` (string)

Currently `"1.0.0"`. Reserved for future migration logic.

## Key Patterns

### Selector Strategy

Gemini's DOM has no stable public API. The extension uses a layered selector approach:

1. **Data attributes first**: `[data-turn-role]`, `a[href*="/app/"]`
2. **ARIA roles/labels**: `[role="navigation"]`, `[aria-label]`
3. **Structural fallback**: `nav`, `aside`, walking up to find scrollable parents
4. **Text content matching**: TreeWalker to find elements with specific text (e.g. "Chats" heading)

When adding new features that interact with Gemini's DOM, always provide multiple selector fallbacks.

### SPA Handling

Gemini is a single-page application. The extension handles navigation by:

1. Intercepting `history.pushState` and `history.replaceState`
2. Listening for `popstate` events
3. Polling `location.href` every 1 second as a fallback
4. On URL change: waiting 500ms for DOM to settle, then re-running `injectAll()`

### Re-injection Safety

Every init function checks for its own sentinel element before injecting:

```js
if (document.getElementById('ga-folders-container')) return;
```

This prevents duplicate UI when re-injection runs after SPA navigation.

### Sidebar Mutation Handling

`GA.onSidebarChange()` observes the sidebar with a throttled (250ms) MutationObserver. When Gemini adds/removes chat items, drag-drop handlers and bulk-delete checkboxes are re-applied.

### CSS Conventions

- All class names prefixed with `ga-` to avoid collisions with Gemini's styles
- CSS custom properties used for theming (light/dark detection via body background luminance)
- Theme class `ga-light-theme` added to `<html>` when light mode is detected
- Feature classes on `<body>`: `ga-wide-mode`, `ga-hide-location`

### Adding a New Feature

1. Create `lib/my-feature.js` as an IIFE receiving `window.GeminiArchitect`
2. Attach an `initMyFeature` function to `GA`
3. Add the file to `manifest.json` content_scripts.js array **before** `content.js`
4. Call `GA.initMyFeature()` from `content.js` inside `injectAll()`
5. Add a sentinel element check at the top of `initMyFeature` to prevent double-injection
6. Use `ga-` prefixed class names for all injected elements
7. If the feature needs persistence, add a new key to the storage defaults in `lib/storage.js`

## Common Pitfalls

- **Double injection**: Always check for sentinel elements before injecting UI. SPA navigation and sidebar mutations can trigger re-injection multiple times.
- **Selector breakage**: Gemini updates may change class names or DOM structure. Use multiple fallback selectors and test after Gemini updates.
- **Timing**: The extension waits 1 second before first injection and 500ms after URL changes. Removing or shortening these delays may cause failures on slow connections.
- **Content script isolation**: Content scripts share the page's DOM but run in an isolated JavaScript world. `window.GeminiArchitect` is accessible because all scripts run in the same content script context (not the page context).
- **Storage is async**: All chrome.storage.local operations return Promises. Always `await` storage calls before using results.
- **Bulk delete uses UI automation**: The bulk delete feature simulates user clicks on Gemini's native delete flow. This is inherently fragile and will break if Gemini changes its menu structure.
- **No build step**: There is no bundler or transpiler. All code must be valid ES2020+ that runs directly in Chrome.
