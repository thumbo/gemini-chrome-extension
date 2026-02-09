# Gemini Architect

**Organize your Google Gemini chats with folders, drag-and-drop, bulk delete, wide mode, and more.**

## The Problem

Google Gemini has no built-in way to organize conversations. As your chat history grows, finding past conversations becomes a chore. There are no folders, no search, no way to group related chats together.

Gemini Architect fixes this by injecting a full organizational layer directly into the Gemini sidebar.

## Features

| Feature | Description |
|---|---|
| **Folders** | Create named folders in the sidebar to group related conversations |
| **Drag & Drop** | Drag any chat from the sidebar and drop it into a folder |
| **Emoji Icons** | Assign emoji icons to folders for quick visual identification (searchable picker included) |
| **Collapse / Expand** | Click a folder to collapse or expand its contents |
| **Folder Search** | Filter folders and their chats by name with the search bar above the folder list |
| **Chat Search** | Filter the native Gemini chat list by title with a dedicated search bar |
| **Bulk Delete** | Toggle selection mode, check multiple chats, and delete them all at once |
| **Wide Mode** | Expand the main content area for more reading and writing space |
| **Copy Conversation** | Copy the full conversation or just the last Gemini response to your clipboard |
| **New Chat Button** | Quickly start a new conversation from the header bar |
| **Keyboard Shortcuts** | Configurable shortcuts for copy, wide mode, and new chat actions |
| **Backup / Restore** | Export all folders and settings to a JSON file; restore from a previous backup |
| **Hide Location** | Toggle the location prompt display off via settings |

## Installation

Gemini Architect is loaded as an unpacked Chrome extension. Follow these steps:

1. Download or clone this repository to your computer.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. In the file picker, select the `gemini-architect` folder (the one containing `manifest.json`).
6. The extension icon should now appear in your Chrome toolbar.
7. Navigate to [gemini.google.com](https://gemini.google.com) -- you should see a "Folders" section in the sidebar.

If the Folders section does not appear, try refreshing the Gemini page. If the extension icon is not visible in the toolbar, click the puzzle-piece icon in Chrome and pin Gemini Architect.

## Usage

### Organizing with Folders

- Click the **+** button in the Folders header to create a new folder.
- Type a name and press Enter.
- Drag any chat from the Gemini sidebar into a folder.
- Click the folder emoji to change its icon.
- Click a folder row to collapse or expand it.
- Hover over a folder to reveal rename and delete buttons.

### Searching

- Use the **Search folders** bar to filter folders and their chats.
- Use the **Search chats** bar (above the native chat list) to filter conversations by title.

### Bulk Delete

- Click **Select** in the Folders header to enter bulk-delete mode.
- Checkboxes appear next to each chat in the native list.
- Select the chats you want to remove, then click **Delete Selected**.

### Wide Mode

- Click the **Wide** button in the header bar, or press `Alt+Shift+W`.
- The main content area expands to use the full viewport width.

### Copy Conversation

- Click **Copy Chat** in the header bar to copy the entire conversation.
- Use `Alt+Shift+C` to copy just the last Gemini response.
- Use `Alt+Shift+A` to copy the full conversation.

### Backup and Restore

- Click the extension icon in the toolbar to open the popup.
- Click **Download Data** to export a JSON backup.
- Click **Restore from File** and select a previous backup to restore.

### Keyboard Shortcuts

Default shortcuts (configurable in the popup):

| Action | Shortcut |
|---|---|
| Copy Last Response | `Alt+Shift+C` |
| Copy Conversation | `Alt+Shift+A` |
| Toggle Wide Mode | `Alt+Shift+W` |
| New Chat | `Alt+Shift+N` |

## Project Structure

```
gemini-architect/
  manifest.json              Chrome extension manifest (Manifest V3)
  content.js                 Orchestrator -- initializes all modules on Gemini pages
  content.css                All injected styles (scoped with ga- prefix)
  background.js              Service worker -- relays keyboard commands to content script
  lib/
    storage.js               Storage wrapper, event bus, folder/settings CRUD
    dom-observer.js          MutationObserver utilities, SPA URL change detection
    folder-manager.js        Folder UI rendering, emoji picker, create/rename/delete
    drag-drop.js             HTML5 drag-and-drop for chats into folders
    search.js                Search bars for folders and native chat list
    bulk-delete.js           Checkbox injection, bulk selection, batch deletion
    wide-mode.js             Wide mode toggle and persistence
    copy-conversation.js     Extract and copy conversation text to clipboard
    shortcuts.js             Keyboard shortcut dispatcher and key matching
  popup/
    popup.html               Extension popup UI
    popup.js                 Popup logic -- backup/restore, shortcut configuration
    popup.css                Popup styles
  icons/
    icon16.png               Toolbar icon (16x16)
    icon48.png               Extension icon (48x48)
    icon128.png              Store icon (128x128)
  assets/
    emoji-data.json          Emoji dataset for the folder icon picker
```

## Documentation

- [Quick Start Guide](docs/QUICK_START.md) -- Get up and running in under 2 minutes
- [User Guide](docs/USER_GUIDE.md) -- Detailed walkthrough of every feature
- [Architecture](docs/ARCHITECTURE.md) -- System design, module interactions, data flow
- [Developer Guide](docs/DEVELOPER_GUIDE.md) -- How to extend, modify, and debug the extension
- [AI Context](CLAUDE.md) -- Project context file for AI coding assistants

## Technology

- **Chrome Extension Manifest V3** -- service worker background, content scripts, popup action
- **Vanilla JavaScript** -- no frameworks, no build step, no dependencies
- **chrome.storage.local API** -- persistent folder and settings data
- **HTML5 Drag and Drop API** -- native browser drag-and-drop for organizing chats
- **MutationObserver** -- detects sidebar changes and theme switches in Gemini's SPA
- **History API interception** -- catches pushState/replaceState for SPA navigation

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

- This project was inspired by the YouTube video ["I Added Folders To Google Gemini!"](https://www.youtube.com/watch?v=xNGDhH4HnTE&t=12s) by Paul J Lipsky, who created the original Gemini Architect Chrome extension.
- All code and documentation were generated by [Claude Code](https://claude.ai/claude-code) powered by Claude Opus 4.6 (Anthropic).
