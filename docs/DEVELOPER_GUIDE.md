# Gemini Architect -- Developer Guide

## Table of Contents

1. [Welcome and Prerequisites](#1-welcome-and-prerequisites)
2. [Chrome Extensions 101 (for C/Java Developers)](#2-chrome-extensions-101-for-cjava-developers)
3. [JavaScript for C/Java Developers](#3-javascript-for-cjava-developers)
4. [Project Setup -- Step by Step](#4-project-setup----step-by-step)
5. [File-by-File Walkthrough](#5-file-by-file-walkthrough)
6. [How Modules Communicate](#6-how-modules-communicate)
7. [Adding a New Feature -- Step by Step](#7-adding-a-new-feature----step-by-step)
8. [Debugging Guide](#8-debugging-guide)
9. [Testing Checklist](#9-testing-checklist)
10. [Common Pitfalls](#10-common-pitfalls)
11. [Glossary](#11-glossary)

---

## 1. Welcome and Prerequisites

### What You Will Learn

This guide walks you through the entire Gemini Architect codebase. By the end you will understand:

- How Chrome extensions work (their architecture, lifecycle, and permissions model)
- How JavaScript differs from C, C++, and Java
- What every file in this project does, line by line
- How the modules communicate with each other
- How to add a new feature, debug problems, and test your changes

### What You Need

| Requirement | Details |
|---|---|
| **Google Chrome** | Version 88 or later (Manifest V3 support). Any desktop OS works. |
| **A text editor** | VS Code is recommended but any editor works (Notepad++, Sublime Text, Vim). |
| **Basic programming knowledge** | You know variables, functions, loops, and if-statements in any language. |
| **A Google account** | Needed to open gemini.google.com and see the sidebar with chats. |

You do **not** need Node.js, npm, a build step, or any compilation. Chrome extensions written in plain JavaScript run directly in the browser without a compiler.

---

## 2. Chrome Extensions 101 (for C/Java Developers)

### What Is a Chrome Extension?

A Chrome extension is a small program that modifies or enhances the Chrome browser. Think of it like:

- **C/C++ analogy**: A shared library (`.dll` on Windows, `.so` on Linux) that a host application loads at runtime. The browser is the host. Your extension is the library.
- **Java analogy**: A plugin JAR that an application loads through a service provider interface. The browser defines the API; your extension implements hooks.

The key difference: Chrome extensions are written in HTML, CSS, and JavaScript -- the same languages web pages use. There is no compilation step. Chrome reads your source files directly.

### The manifest.json File (Your Makefile / pom.xml)

Every Chrome extension has exactly one file called `manifest.json` at its root. This is a configuration file that tells Chrome everything about your extension. It is analogous to:

- **C/C++ analogy**: A `Makefile` that declares source files, build targets, and dependencies.
- **Java analogy**: A `pom.xml` (Maven) or `build.gradle` that lists dependencies, entry points, and metadata.

Chrome reads `manifest.json` and from it learns:

1. **What your extension is called** and its version
2. **What permissions it needs** (like accessing browser storage or the active tab)
3. **Which files to load** and when to load them
4. **What pages your code should run on** (URL patterns)

Here is the Gemini Architect manifest, annotated:

```json
{
  "manifest_version": 3,          // Required. Must be 3 for modern extensions.
  "name": "Gemini Architect",     // Displayed in Chrome's extension manager.
  "version": "1.0.0",             // Your version string.
  "description": "Organize your Google Gemini chats with folders...",

  "permissions": [
    "storage",                    // Access to chrome.storage API (persistent data).
    "activeTab"                   // Access to the currently focused tab.
  ],

  "background": {
    "service_worker": "background.js"  // The daemon process (see below).
  },

  "action": {
    "default_popup": "popup/popup.html",  // The small GUI that opens on icon click.
    "default_icon": { ... }                // Icon files at different sizes.
  },

  "content_scripts": [
    {
      "matches": ["https://gemini.google.com/*"],  // Only run on Gemini pages.
      "css": ["content.css"],                       // Injected stylesheet.
      "js": [
        "lib/storage.js",         // Loaded first (order matters).
        "lib/dom-observer.js",
        "lib/folder-manager.js",
        "lib/drag-drop.js",
        "lib/search.js",
        "lib/bulk-delete.js",
        "lib/wide-mode.js",
        "lib/copy-conversation.js",
        "lib/shortcuts.js",
        "content.js"              // Loaded last -- orchestrates everything.
      ],
      "run_at": "document_idle"   // Wait until the page finishes loading.
    }
  ],

  "commands": {                   // Global keyboard shortcuts.
    "copy-last-response": { "suggested_key": { "default": "Alt+Shift+C" } },
    "copy-conversation":  { "suggested_key": { "default": "Alt+Shift+A" } },
    "toggle-wide-mode":   { "suggested_key": { "default": "Alt+Shift+W" } },
    "new-chat":           { "suggested_key": { "default": "Alt+Shift+N" } }
  }
}
```

### Content Scripts (Code Injected into Web Pages)

Content scripts are JavaScript files that Chrome injects directly into a web page. When you visit `https://gemini.google.com/*`, Chrome takes every file listed under `content_scripts.js` and runs it inside that page -- as if Gemini's own developers had added those `<script>` tags.

- **C analogy**: This is like using `LD_PRELOAD` to inject a shared library into a running process. Your code runs in the process's address space and can call its functions, read its memory, and modify its behavior.
- **Java analogy**: This is like bytecode instrumentation (e.g., Java agents using `premain`). Your code runs inside the target application's JVM and can modify objects at runtime.

**Important detail**: Content scripts share the page's DOM (the HTML tree) but have an **isolated JavaScript context**. This means:
- You CAN read and modify any HTML element on the page.
- You CANNOT call JavaScript functions that Gemini's own code defined (they live in a separate scope).
- Your global variables do not collide with the page's global variables.

### Background Service Worker (The Daemon)

The background service worker is a JavaScript file that runs independently of any web page. Think of it as:

- **C analogy**: A daemon process (like `httpd` or `sshd`). It runs in the background, listens for events, and responds. It has no GUI.
- **Java analogy**: A background service (like an Android `Service`). It runs even when no activity (page) is visible.

In Gemini Architect, `background.js` is very small. Its only job is to relay keyboard shortcut commands from Chrome to the content script running in the active tab.

**Key constraint**: Service workers are **ephemeral**. Chrome can shut them down when idle and restart them when needed. Do not store state in global variables in `background.js` -- use `chrome.storage` instead.

### Popup (The Small GUI Dialog)

When you click the extension's icon in Chrome's toolbar, a small HTML page appears. This is the popup.

- **C analogy**: A small dialog window (like a `MessageBox` or a GTK dialog) that appears on demand.
- **Java analogy**: A small Swing `JDialog` or JavaFX popup.

The popup is defined by three files: `popup.html` (structure), `popup.css` (styling), and `popup.js` (behavior). It has its own JavaScript context -- separate from both the content script and the background worker.

### Permissions Model

Chrome extensions declare what they need in `manifest.json`. This is similar to:

- **Unix analogy**: File permissions (`rwx`). An extension that declares `"permissions": ["storage"]` gets access to the storage API but nothing else.
- **Android analogy**: The `<uses-permission>` tags in `AndroidManifest.xml`.

Gemini Architect requests two permissions:

| Permission | What It Grants |
|---|---|
| `storage` | Read/write to `chrome.storage.local` -- a persistent key-value store. |
| `activeTab` | Access to the tab the user is currently looking at (only when they interact with the extension). |

### How the Pieces Communicate (Message Passing)

The three execution contexts (content script, background worker, popup) run in separate processes. They cannot call each other's functions directly. Instead, they communicate through **message passing**, which is analogous to:

- **C analogy**: Inter-process communication (IPC) using pipes or sockets. You send a message; the other side has a listener that receives it.
- **Java analogy**: A message queue or `Observable`/`Observer` pattern across threads.

In Gemini Architect:

```
Background Worker                Content Script (on Gemini page)
      |                                      |
      |  chrome.tabs.sendMessage(tabId, msg) |
      | -----------------------------------> |
      |                                      |
      |  chrome.runtime.onMessage.addListener|
      |  (receives msg and acts on it)       |
```

The background worker listens for keyboard shortcut commands from Chrome, then forwards them to the content script. The content script has a listener that performs the requested action (copy conversation, toggle wide mode, etc.).

---

## 3. JavaScript for C/Java Developers

### Dynamic Typing

In C or Java, every variable has a declared type. In JavaScript, variables have no type declarations. A variable can hold a number, then a string, then an object.

```c
// C
int count = 5;
char* name = "hello";
```

```java
// Java
int count = 5;
String name = "hello";
```

```javascript
// JavaScript
let count = 5;       // number
let name = "hello";  // string
count = "now a string";  // perfectly valid -- no compiler error
```

JavaScript has three ways to declare variables:

| Keyword | Scope | Re-assignable | Analogy |
|---|---|---|---|
| `const` | Block | No | `final` in Java, `const` in C |
| `let` | Block | Yes | Normal variable in C/Java |
| `var` | Function | Yes | Avoid using this (legacy) |

### Functions Are Values

In C, functions are pointers. In Java, you need functional interfaces or lambdas (since Java 8). In JavaScript, functions are first-class values -- you can assign them to variables, pass them as arguments, and return them from other functions:

```javascript
// Named function
function add(a, b) {
  return a + b;
}

// Arrow function (like a Java lambda)
const add = (a, b) => a + b;

// Passing a function as an argument (like a callback pointer in C)
button.addEventListener('click', () => {
  console.log('Button was clicked');
});
```

### Async/Await (Promises Instead of Threads)

In C, you create threads with `pthread_create`. In Java, you use `Thread` or `ExecutorService` with `Future`. JavaScript is **single-threaded** -- there are no threads. Instead, it uses **Promises** and `async`/`await` to handle operations that take time (like reading from storage).

```java
// Java -- blocking call in a thread
Future<String> future = executor.submit(() -> readFromDatabase());
String result = future.get();  // blocks until ready
```

```javascript
// JavaScript -- non-blocking with async/await
async function loadData() {
  const result = await chrome.storage.local.get('key');  // suspends, resumes when ready
  console.log(result);
}
```

**How it works**: When JavaScript encounters `await`, it pauses that function and lets other code run (event handlers, timers, etc.). When the awaited operation completes, the function resumes from where it paused. This is cooperative multitasking, not preemptive threading.

- **C analogy**: `select()` or `poll()` on file descriptors. You register interest in an event, then go back to the event loop. When data arrives, your callback fires.
- **Java analogy**: `CompletableFuture.thenApply()` chaining, but with cleaner syntax.

### Closures

A closure is a function that "remembers" variables from the scope where it was created, even after that scope has finished executing:

```javascript
function createCounter() {
  let count = 0;                    // This variable lives on the heap
  return function () {              // This inner function "closes over" count
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter());  // 1
console.log(counter());  // 2
console.log(counter());  // 3
```

- **C analogy**: Imagine if a function could return a nested function, and that nested function retained access to the outer function's local variables even after the outer function returned. C cannot do this natively (stack frames are destroyed), but JavaScript can because closures are heap-allocated.
- **Java analogy**: An anonymous inner class that captures a `final` local variable. In JavaScript, the captured variable does not need to be final -- it can be mutated.

### The DOM (Document Object Model)

The DOM is the browser's in-memory representation of an HTML page. It is a tree data structure.

- **C analogy**: An XML parse tree. Each node is a struct with pointers to parent, children, and siblings.
- **Java analogy**: `org.w3c.dom.Document` from the Java XML DOM API. You call `document.getElementById()`, `element.appendChild()`, `element.setAttribute()` -- the same method names.

```javascript
// Find an element by its ID (like getElementById in Java DOM)
const container = document.getElementById('ga-folders-container');

// Create a new element (like document.createElement in Java DOM)
const button = document.createElement('button');
button.textContent = 'Click me';
button.className = 'my-button';

// Append it to the tree
container.appendChild(button);

// Listen for clicks (like addActionListener in Java Swing)
button.addEventListener('click', () => {
  console.log('clicked!');
});
```

### Event-Driven Programming

JavaScript in the browser is entirely event-driven. You register callback functions that fire when events occur:

```javascript
// Mouse events (like signal handlers in C, or ActionListeners in Java)
element.addEventListener('click', handleClick);
element.addEventListener('mouseenter', handleHover);

// Keyboard events
document.addEventListener('keydown', handleKeyPress);

// Storage change events
chrome.storage.onChanged.addListener(handleStorageChange);

// Timer events (like alarm() in C or ScheduledExecutorService in Java)
setTimeout(doSomething, 1000);       // once after 1 second
setInterval(checkStatus, 5000);      // every 5 seconds
```

- **C analogy**: `signal()` handlers. You register a function for `SIGINT`; when the signal arrives, your function runs.
- **Java analogy**: `ActionListener`, `MouseListener`, `KeyListener` interfaces in Swing/AWT.

### The Event Loop

JavaScript runs on a single thread with an event loop. This loop:

1. Picks the next event from a queue
2. Runs the callback function for that event to completion
3. Goes back to step 1

There is no preemptive multitasking. If your callback takes a long time (heavy computation), the entire browser tab freezes until it finishes.

- **C analogy**: The `select()`/`poll()`/`epoll()` pattern in network servers. A single thread processes events one at a time, never blocking on I/O because all I/O is asynchronous.
- **Java analogy**: A single-threaded `ExecutorService` that processes a queue of `Runnable` tasks one by one.

### Chrome APIs

Chrome provides special APIs available only to extensions. These are all under the `chrome` namespace:

| API | Purpose | Analogy |
|---|---|---|
| `chrome.storage.local` | Persistent key-value store | `localStorage` but better; like SQLite or `Preferences` in Java |
| `chrome.runtime.sendMessage` | Send a message to the background worker | IPC / message queue |
| `chrome.runtime.onMessage` | Listen for incoming messages | Event listener / signal handler |
| `chrome.tabs.query` | Find browser tabs | Querying a window manager |
| `chrome.tabs.sendMessage` | Send a message to a specific tab's content script | Sending a signal to a specific process |
| `chrome.commands.onCommand` | Listen for keyboard shortcuts | Global hotkey registration |

### The IIFE Pattern Used in This Project

Every `lib/*.js` file in Gemini Architect uses a pattern called an **IIFE** (Immediately-Invoked Function Expression):

```javascript
(function (GA) {
  // All code lives inside this function.
  // GA is a reference to window.GeminiArchitect.
  // Variables declared here (with let/const/var) are NOT visible outside.

  GA.somePublicFunction = function () {
    // This IS accessible from other modules because it is attached to GA.
  };

  let privateVariable = 42;
  // This is NOT accessible from other modules.

})(window.GeminiArchitect);
```

**Why use this pattern?**

- **Encapsulation**: Variables inside the IIFE cannot be accessed or overwritten by other scripts or by the web page. This is like `static` (file-scope) variables in C, or `private` fields in Java.
- **Shared namespace**: By attaching functions to the `GA` object, modules can call each other's public functions. The `GA` object acts like a shared `struct` in C or a `public` interface in Java.
- **No build step required**: Modern JavaScript projects often use `import`/`export` with a bundler (like Webpack). Chrome content scripts do not support `import`/`export` natively, so this project uses IIFEs instead. It achieves the same goal -- modularity -- without needing a compilation step.

---

## 4. Project Setup -- Step by Step

### Step 1: Get the Code

Download or clone the project so that you have a folder named `gemini-architect` containing `manifest.json` at its root.

Verify the structure:

```
gemini-architect/
  manifest.json
  content.js
  content.css
  background.js
  lib/
    storage.js
    dom-observer.js
    folder-manager.js
    drag-drop.js
    search.js
    bulk-delete.js
    wide-mode.js
    copy-conversation.js
    shortcuts.js
  popup/
    popup.html
    popup.css
    popup.js
  assets/
    emoji-data.json
  icons/
    icon16.png
    icon48.png
    icon128.png
```

### Step 2: Open Chrome Extensions Page

1. Open Google Chrome
2. In the address bar, type `chrome://extensions` and press Enter
3. You will see a page titled "Extensions"

### Step 3: Enable Developer Mode

1. In the top-right corner of the extensions page, find the toggle labeled **"Developer mode"**
2. Click it so it turns **ON** (the toggle slides to the right and turns blue)
3. Three new buttons appear at the top-left: "Load unpacked", "Pack extension", and "Update"

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button
2. A folder picker dialog appears
3. Navigate to and select the `gemini-architect` folder (the one containing `manifest.json`)
4. Click "Select Folder"

Chrome reads `manifest.json` and loads the extension. You should see a new card appear on the extensions page showing "Gemini Architect" with version "1.0.0".

### Step 5: Verify the Icon

1. Look at Chrome's toolbar (the area to the right of the address bar)
2. You should see the Gemini Architect icon (a small colored square)
3. If you do not see it, click the puzzle-piece icon (Extensions menu) and pin Gemini Architect

### Step 6: Test on Gemini

1. Open a new tab
2. Navigate to `https://gemini.google.com`
3. Sign in with your Google account if needed
4. Wait a few seconds for the page to load fully
5. Look at the left sidebar -- you should see a **"Folders"** section with a "+" button and a "Search folders..." input

If you see the Folders section, the extension is working.

### Step 7: Reloading After Code Changes

Every time you edit a source file:

1. Go back to `chrome://extensions`
2. Find the Gemini Architect card
3. Click the **circular arrow** icon (reload button) on the card
4. Go back to the Gemini tab and **refresh the page** (Ctrl+R or F5)

You must do both steps -- reload the extension AND refresh the Gemini page. The extension reload re-reads your manifest and script files. The page refresh re-injects the content scripts.

---

## 5. File-by-File Walkthrough

### manifest.json -- The Extension Configuration

**What it does**: Declares the extension's name, version, permissions, and all the files that Chrome should load. Chrome reads this file first. Nothing else works without it.

**Key sections**:

- `"permissions": ["storage", "activeTab"]` -- Requests access to persistent storage and the active tab.
- `"content_scripts"` -- Lists the CSS and JS files to inject into Gemini pages. **Order matters**: `storage.js` is first because other modules depend on the `window.GeminiArchitect` object it creates. `content.js` is last because it orchestrates initialization of all the modules.
- `"commands"` -- Registers global keyboard shortcuts with Chrome. These work even when the page does not have focus, because Chrome itself captures them and dispatches events to the background worker.
- `"background.service_worker"` -- Points to `background.js`.
- `"action.default_popup"` -- Points to the popup HTML file.

**How it connects**: Chrome uses this file to know which files to load and when. It is the single source of truth for the extension's structure.

---

### lib/storage.js -- Storage Wrapper and Event Bus

**What it does**: Creates the `window.GeminiArchitect` global object (abbreviated `GA`), implements an event bus for inter-module communication, and wraps Chrome's storage API with convenient helper functions.

**This is the foundation of the entire extension.** It is loaded first and every other module depends on it.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.on(event, fn)` | Subscribe to a named event. When that event fires, `fn` is called. |
| `GA.off(event, fn)` | Unsubscribe from an event. |
| `GA.emit(event, data)` | Fire a named event. All subscribed functions are called with `data`. |
| `GA.getFolders()` | Read the folder data from Chrome storage. Returns a Promise. |
| `GA.saveFolders(folders)` | Write folder data to Chrome storage and emit `'foldersChanged'`. |
| `GA.createFolder(name, icon)` | Create a new folder with a unique ID, name, and emoji icon. |
| `GA.deleteFolder(folderId)` | Delete a folder by ID. |
| `GA.renameFolder(folderId, newName)` | Change a folder's display name. |
| `GA.setFolderIcon(folderId, icon)` | Change a folder's emoji icon. |
| `GA.toggleFolderCollapse(folderId)` | Toggle whether a folder is expanded or collapsed. |
| `GA.addChatToFolder(folderId, chatId, title)` | Add a chat to a folder. Removes it from any other folder first. |
| `GA.removeChatFromFolder(folderId, chatId)` | Remove a chat from a folder. |
| `GA.getSettings()` | Read settings (wide mode, hide location). |
| `GA.saveSettings(settings)` | Write settings and emit `'settingsChanged'`. |
| `GA.updateSetting(key, value)` | Update a single setting. |
| `GA.getShortcuts()` | Read keyboard shortcut mappings. |
| `GA.saveShortcuts(shortcuts)` | Write shortcuts and emit `'shortcutsChanged'`. |
| `GA.exportAll()` | Export all data (folders, settings, shortcuts) as a JSON object. |
| `GA.importAll(data)` | Import previously exported data, overwriting current data. |
| `GA.initDefaults()` | Write default values to storage for any keys that do not yet exist. |

**Code patterns used**:

- **IIFE**: The entire file is wrapped in `(function (GA) { ... })(window.GeminiArchitect);`.
- **Promise wrapping**: Chrome's `chrome.storage.local.get()` uses callbacks. The `get()` helper wraps it in a `Promise` so callers can use `await`.
- **Event bus**: The `_listeners` object maps event names to arrays of callback functions. This is the Observer pattern.

**Defaults**: When the extension runs for the first time, `initDefaults()` populates Chrome storage with:

```javascript
{
  ga_folders: {},
  ga_settings: { wideMode: false, hideLocation: true },
  ga_shortcuts: {
    copyLastResponse: 'Alt+Shift+C',
    copyConversation: 'Alt+Shift+A',
    toggleWide: 'Alt+Shift+W',
    newChat: 'Alt+Shift+N'
  },
  ga_version: '1.0.0'
}
```

---

### lib/dom-observer.js -- DOM Observer Utilities

**What it does**: Provides utility functions for watching the DOM (the page's HTML tree) for changes. Gemini is a Single Page Application (SPA) -- it never fully reloads the page when you navigate between chats. Instead, it dynamically adds and removes HTML elements. This module detects those changes.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.waitForElement(selector, timeout)` | Returns a Promise that resolves when a matching element appears in the DOM. Times out after `timeout` ms (default 15000). |
| `GA.onSidebarChange(callback)` | Watches the sidebar for changes (chats added/removed). Calls `callback` at most once every 250ms (debounced). |
| `GA.onUrlChange(callback)` | Detects when the URL changes (SPA navigation). Hooks into `history.pushState`, `history.replaceState`, `popstate`, and polls every second as a fallback. |

**Code patterns used**:

- **MutationObserver**: A browser API that fires a callback whenever the DOM changes. This is how the extension detects when Gemini updates its sidebar.
- **Monkey-patching**: `onUrlChange` replaces `history.pushState` and `history.replaceState` with wrapper functions that call the original and then check if the URL changed. This is like function hooking in C (detour patching) or method interception in Java (AOP).
- **Debouncing**: `onSidebarChange` uses `setTimeout`/`clearTimeout` to ensure the callback fires at most once per 250ms, even if the DOM changes rapidly. This prevents expensive re-rendering from happening hundreds of times per second.

---

### lib/folder-manager.js -- Folder UI and Logic

**What it does**: This is the largest module. It creates and manages the folder UI in the sidebar: rendering folders, handling create/rename/delete actions, the emoji picker for folder icons, toast notifications, and confirmation dialogs.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initFolderManager()` | Called once during initialization. Finds the sidebar, creates the folders container, and renders existing folders from storage. |
| `GA.renderFolders()` | Re-reads folders from storage and rebuilds the entire folder UI. Called whenever folder data changes. |
| `GA.showToast(msg)` | Shows a temporary notification at the bottom of the screen (auto-dismisses after 2.4 seconds). |
| `GA.showConfirm(title, message)` | Shows a modal confirmation dialog with Cancel and Delete buttons. Returns a Promise that resolves to `true` (confirmed) or `false` (cancelled). |
| `showEmojiPicker(anchorEl, onPick)` | (Internal) Shows an emoji picker grid near `anchorEl`. Calls `onPick(emoji)` when the user selects an emoji. |
| `findChatsHeader()` | (Internal) Searches the sidebar for the "Chats" heading so the folder container can be inserted above it. |
| `startRename(folderEl, folder)` | (Internal) Replaces the folder name text with an editable input field for inline renaming. |
| `createNewFolder()` | (Internal) Creates a new folder with a default name and immediately starts inline renaming so the user can type a custom name. |

**How the folder UI works**: The `renderFolders()` function:

1. Reads all folders from `chrome.storage.local` via `GA.getFolders()`
2. Sorts them by their `order` field
3. For each folder, creates DOM elements: a clickable row with icon, name, action buttons (rename, delete), and a chevron
4. For each chat inside the folder, creates a clickable link
5. Attaches event listeners for user interactions
6. Replaces the previous folder list with the new one

**How it connects**: Other modules call `GA.renderFolders()` to refresh the folder display after changes (e.g., after a chat is dragged into a folder). The event bus subscription `GA.on('foldersChanged', renderFolders)` ensures automatic re-rendering whenever any module modifies folder data.

---

### lib/drag-drop.js -- Drag and Drop

**What it does**: Makes Gemini's native chat items draggable and makes the folder elements act as drop targets. This allows users to organize chats into folders by dragging.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initDragDrop()` | Finds all chat links in Gemini's sidebar and makes them draggable. Also sets up folder elements as drop targets. |
| `makeDraggable(el)` | (Internal) Attaches `dragstart` and `dragend` event handlers to a DOM element. |
| `setupFolderDropTargets()` | (Internal) Attaches `dragover`, `dragleave`, and `drop` handlers to each `.ga-folder` element. |
| `extractChatId(el)` | (Internal) Parses a chat ID from the `href` attribute of a link (e.g., `/app/abc123` yields `abc123`). |
| `extractChatTitle(el)` | (Internal) Gets the display text of a chat link to use as the folder entry title. |

**How drag-and-drop works in the browser**: The HTML5 Drag and Drop API uses a sequence of events:

1. `dragstart` fires on the element being dragged. The handler packs data (chat ID and title) into `e.dataTransfer`.
2. `dragover` fires repeatedly on elements the mouse passes over. The handler calls `e.preventDefault()` to indicate this element accepts drops.
3. `dragleave` fires when the mouse leaves a drop target.
4. `drop` fires when the user releases the mouse over a drop target. The handler unpacks the data and calls `GA.addChatToFolder()`.
5. `dragend` fires on the original element after the drag operation ends (regardless of whether a drop occurred).

**How it connects**: Called by `content.js` during initialization and again by the sidebar mutation observer whenever the sidebar changes (new chats appear, chats are removed). After a successful drop, it calls `GA.addChatToFolder()` (from `storage.js`) and `GA.renderFolders()` (from `folder-manager.js`).

---

### lib/search.js -- Search Bars

**What it does**: Adds two search bars -- one for filtering folders and one for filtering Gemini's native chat list.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initSearch()` | Injects both search bars into the DOM. |
| `injectFolderSearch()` | (Internal) Creates a search input inside the folders container, below the "Folders" header. |
| `injectChatSearch()` | (Internal) Creates a search input above Gemini's native chat list. |
| `filterFolders(query)` | (Internal) Hides/shows folders and their chats based on the search query. Auto-expands collapsed folders if a match is found inside them. |
| `filterChats(query)` | (Internal) Hides/shows Gemini's native chat links based on the search query. |

**Code patterns used**:

- **Debouncing**: Both search inputs use `setTimeout`/`clearTimeout` with a 150ms delay. This means the filter function only runs 150ms after the user stops typing, rather than on every keystroke.
- **CSS display toggling**: Rather than removing elements from the DOM, the search functions set `element.style.display = 'none'` to hide non-matching items and `element.style.display = ''` to show matching items. This is faster and preserves the elements' state.

---

### lib/bulk-delete.js -- Bulk Delete

**What it does**: Adds a "Select" toggle that puts the chat list into bulk-delete mode. In this mode, checkboxes appear next to each chat. The user selects chats and clicks "Delete Selected" to delete them in batch.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initBulkDelete()` | Creates the "Select" toggle button in the folders header. |
| `GA.refreshBulkDelete()` | Re-injects checkboxes when the sidebar updates (if bulk mode is active). |
| `toggleBulkMode()` | (Internal) Turns bulk-delete mode on or off. |
| `injectCheckboxes()` | (Internal) Adds a checkbox to each chat item in Gemini's sidebar. |
| `removeCheckboxes()` | (Internal) Removes all checkboxes and clears the selection. |
| `createBulkBar()` | (Internal) Creates a sticky bar at the bottom of the sidebar showing "N selected" and a "Delete Selected" button. |
| `deleteChat(chatLink)` | (Internal) Deletes a single chat by simulating user interactions with Gemini's native UI (hover to reveal menu, click 3-dot button, click "Delete", confirm). |
| `handleBulkDelete()` | (Internal) Shows a confirmation dialog, then iterates through selected chats and calls `deleteChat` for each one with delays between deletions. |

**Important note**: `deleteChat` works by **simulating mouse events** on Gemini's native UI elements. It hovers over the chat item (to reveal the menu button), clicks the menu, finds the "Delete" option, clicks it, and confirms the deletion dialog. This approach is fragile -- if Google changes Gemini's UI structure, these selectors may break.

---

### lib/wide-mode.js -- Wide Mode Toggle

**What it does**: Adds a "Wide" button to the header bar that toggles wide mode. In wide mode, the conversation area expands to use the full width of the page instead of being constrained to a narrow column.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initWideMode(headerContainer)` | Creates the wide mode toggle button and inserts it into the header button container. |
| `GA.toggleWideMode()` | Toggles the wide mode setting in storage (used by keyboard shortcuts). |

**How it works**: When wide mode is activated, the function adds the CSS class `ga-wide-mode` to the `<body>` element. In `content.css`, this class triggers rules that override Gemini's `max-width` constraints with `100% !important`. When deactivated, the class is removed and Gemini's default styling takes over.

---

### lib/copy-conversation.js -- Copy Conversation

**What it does**: Provides functions to copy the current conversation (or just the last response) to the clipboard. Adds a "Copy Chat" button to the header bar.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initCopyConversation(headerContainer)` | Creates the "Copy Chat" button in the header. |
| `GA.copyConversation()` | Extracts the full conversation text and copies it to the clipboard. |
| `GA.copyLastResponse()` | Extracts only the last Gemini response and copies it. |
| `getConversationText()` | (Internal) Uses three strategies to find conversation messages in the DOM, with increasingly broad selectors as fallbacks. |
| `getLastResponse()` | (Internal) Finds the last model response in the DOM. |
| `copyToClipboard(text)` | (Internal) Copies text using `navigator.clipboard.writeText()`, with a fallback using a hidden `<textarea>` and `document.execCommand('copy')`. |

**The three extraction strategies** (in order of preference):

1. Look for elements with `data-turn-role` attributes or specific class names like `conversation-turn`.
2. Look for elements with class names containing `query`/`prompt`/`response`.
3. Last resort: grab all inner text from the `<main>` element.

This multi-strategy approach exists because Gemini's DOM structure can change between updates.

---

### lib/shortcuts.js -- Keyboard Shortcut Dispatcher

**What it does**: Listens for keyboard events and dispatches the appropriate actions. Handles both Chrome's native command system (messages from the background worker) and custom shortcut combos defined by the user.

**Key functions**:

| Function | Purpose |
|---|---|
| `GA.initShortcuts()` | Loads shortcut definitions from storage, starts listening for keydown events. |
| `loadShortcuts()` | (Internal) Reads shortcut strings from storage and parses them into structured objects. |
| `parseShortcut(str)` | (Internal) Converts a string like `"Alt+Shift+C"` into an object `{ alt: true, ctrl: false, shift: true, meta: false, key: 'c' }`. |
| `matchesShortcut(e, parsed)` | (Internal) Checks if a keyboard event matches a parsed shortcut definition. |
| `onKeyDown(e)` | (Internal) The global keydown handler. Ignores events when the user is typing in an input/textarea. |

**Two shortcut systems**:

1. **Chrome commands** (declared in `manifest.json`): Chrome captures these globally and sends a message to the background worker, which relays it to the content script via `chrome.tabs.sendMessage`. The content script's `chrome.runtime.onMessage` listener (in this file) receives the command name and calls the corresponding action function.

2. **Custom shortcuts** (stored in `chrome.storage.local`): These are parsed from strings and matched against keydown events directly in the content script. This system allows users to customize their shortcut keys through the popup UI.

---

### background.js -- Background Service Worker

**What it does**: Listens for Chrome keyboard shortcut commands and relays them to the active Gemini tab's content script.

This file is very small (13 lines). Its single responsibility:

1. Listen for `chrome.commands.onCommand` events (fired when the user presses a registered keyboard shortcut).
2. Find the active tab using `chrome.tabs.query`.
3. If the active tab is a Gemini page, send the command to it using `chrome.tabs.sendMessage`.

**Why is this needed?** Chrome's `commands` API fires events in the background worker context, not in content scripts. The background worker acts as a relay, forwarding the command to the content script that can actually perform the action (copy text, toggle wide mode, etc.).

---

### content.js -- The Orchestrator

**What it does**: This is the main entry point that initializes all other modules in the correct order. It is loaded last (after all `lib/*.js` files).

**What it does step by step**:

1. Gets a reference to `window.GeminiArchitect` (created by `storage.js`).
2. Checks for double-initialization (prevents the extension from initializing twice).
3. Calls `GA.initDefaults()` to ensure storage has default values.
4. Defines `detectTheme()` -- reads the page's background color and adds/removes a `ga-light-theme` CSS class. This allows the extension's CSS variables to switch between dark and light themes.
5. Defines `applySettings()` -- reads persisted settings and applies CSS classes (wide mode, hide location).
6. Defines sidebar detection functions with layered CSS selectors (tries multiple strategies to find Gemini's sidebar).
7. Defines `injectHeaderButtons()` -- creates the floating header bar with Wide Mode, New Chat, and Copy Chat buttons.
8. Defines `injectAll()` -- the main initialization sequence:
   - Detects theme
   - Applies persisted settings
   - Waits for the sidebar to appear (up to 20 seconds)
   - Initializes folders, drag-drop, search, bulk delete, header buttons, and shortcuts
9. Sets up SPA navigation handling -- when the URL changes, waits 500ms for Gemini to update the DOM, then calls `injectAll()` again.
10. Sets up sidebar mutation handling -- when sidebar content changes, re-initializes drag-drop and refreshes bulk delete checkboxes.
11. Listens for `settingsChanged` events to apply/remove CSS classes.
12. Waits 1 second for Gemini's SPA to settle, then calls `injectAll()` to kick everything off.
13. Sets up a `MutationObserver` on the `<body>` element to re-detect the theme when the body's style or class changes.

**The IIFE wrapper**: The entire file is wrapped in `(async function () { ... })();`. This is an async IIFE -- it allows the use of `await` at the top level while keeping all variables scoped to the function.

---

### content.css -- Styles

**What it does**: Defines all CSS styles for the extension's UI elements. It is injected into Gemini pages alongside the JavaScript files.

**Key sections**:

| Section | What It Styles |
|---|---|
| CSS Variables (`:root`) | Color palette, font, border radius, transition speed for dark theme |
| `.ga-light-theme` | Overrides CSS variables for light theme |
| Folders Container | The folder list area in the sidebar |
| Individual Folder | Each folder row (icon, name, actions, chevron) |
| Drag & Drop | Visual feedback during drag operations |
| Search Bars | The folder and chat search inputs |
| Emoji Picker | The grid of emojis for choosing folder icons |
| Bulk Delete | Checkboxes, action bar, delete button |
| Wide Mode | Overrides Gemini's `max-width` constraints |
| Header Buttons | The fixed-position button bar in the top-right |
| Copy Conversation Button | Style for the copy chat button |
| Toast Notification | Temporary message that slides up and fades out |
| Confirmation Dialog | Modal overlay with title, message, and buttons |
| Hide Location | Hides location-related elements when the setting is active |

**The theming system**: Colors are defined as CSS custom properties (variables) in `:root`. The `.ga-light-theme` class overrides these variables. When `content.js` detects a light background, it adds `ga-light-theme` to `<html>`, and all colors automatically switch. This is the same pattern used by large design systems.

---

### popup/popup.html -- Popup Structure

**What it does**: Defines the HTML structure for the popup that appears when you click the extension icon. Contains three sections:

1. **Data Management**: "Download Data" button (exports all extension data as JSON) and "Restore from File" button (imports a JSON backup).
2. **Keyboard Shortcuts**: Four input fields for customizing shortcut key combinations, plus a "Save Shortcuts" button.
3. **Links**: Support/feedback link and a tip jar link.

---

### popup/popup.css -- Popup Styles

**What it does**: Styles the popup with a dark theme matching Gemini's dark mode. Sets the popup width to 340 pixels. Styles buttons, inputs, status messages, and the shortcut configuration grid.

---

### popup/popup.js -- Popup Logic

**What it does**: Handles all user interactions in the popup.

**Key functionality**:

1. **Download Data**: When clicked, reads all extension data from `chrome.storage.local`, converts it to a JSON string, creates a `Blob` and a temporary download URL, and triggers a file download.

2. **Restore from File**: When a file is selected, reads it as text, parses the JSON, validates that it contains recognized keys (`ga_folders`, `ga_settings`, `ga_shortcuts`, `ga_version`), validates the folders structure, and writes the data to `chrome.storage.local`.

3. **Shortcut Key Capture**: When a shortcut input gains focus, it shows "Press keys..." and waits for a key combination. When keys are pressed, it constructs a string like `"Ctrl+Alt+C"` from the modifier keys and the pressed key. When "Save Shortcuts" is clicked, it writes all shortcut definitions to `chrome.storage.local`.

**Important**: The popup runs in its own JavaScript context. It cannot call functions on `window.GeminiArchitect` directly. It communicates with the content script indirectly through `chrome.storage.local` -- when the popup writes new shortcut values, the content script picks them up on the next page load or when it checks storage.

---

### assets/emoji-data.json

**What it does**: Contains an array of emoji characters used by the emoji picker when choosing a folder icon. Loaded by `folder-manager.js` via `fetch()` from the extension's own files using `chrome.runtime.getURL()`.

---

## 6. How Modules Communicate

### The window.GeminiArchitect Shared Object Pattern

All content script modules share a single global object: `window.GeminiArchitect` (abbreviated `GA`). This object is created by `storage.js` (the first file loaded) and used by every other module.

```
storage.js creates:    window.GeminiArchitect = {}

Every other module:    (function (GA) { ... })(window.GeminiArchitect);
                       // GA is a local alias for window.GeminiArchitect
```

Modules attach their public functions to this object:

```javascript
// In storage.js
GA.getFolders = () => get('ga_folders');

// In folder-manager.js
GA.initFolderManager = async function () { ... };
GA.renderFolders = renderFolders;
GA.showToast = showToast;

// In drag-drop.js
GA.initDragDrop = function () { ... };

// In content.js (the orchestrator)
const GA = window.GeminiArchitect;
await GA.initFolderManager();  // Call a function from folder-manager.js
GA.initDragDrop();             // Call a function from drag-drop.js
```

This is similar to:
- **C**: A shared `struct` that each `.c` file populates with function pointers. Other files call functions through the struct.
- **Java**: A singleton service registry where each module registers its services.

### Event Bus (GA.on / GA.emit) -- The Observer Pattern

The event bus in `storage.js` implements the Observer pattern (also known as publish-subscribe):

```javascript
// Module A subscribes to an event
GA.on('foldersChanged', (folders) => {
  renderFolders();  // Re-render when folder data changes
});

// Module B fires the event (this happens inside GA.saveFolders)
GA.emit('foldersChanged', folders);
```

Named events used in the project:

| Event Name | Emitted By | Consumed By |
|---|---|---|
| `'foldersChanged'` | `storage.js` (inside `saveFolders`, `importAll`) | `folder-manager.js` (re-renders folder UI) |
| `'settingsChanged'` | `storage.js` (inside `saveSettings`, `importAll`) | `content.js` (applies/removes CSS classes), `wide-mode.js` (updates button state) |
| `'shortcutsChanged'` | `storage.js` (inside `saveShortcuts`) | `shortcuts.js` (reloads shortcut definitions) |

- **Java analogy**: `java.beans.PropertyChangeListener` or Guava's `EventBus`.
- **C analogy**: A table of function pointers indexed by event name. Emitting an event iterates the table and calls each registered function.

### Chrome Message Passing (Background <-> Content Script)

The background worker and content script communicate through Chrome's messaging API:

```
User presses Alt+Shift+C
        |
        v
Chrome captures the key combo (registered in manifest.json "commands")
        |
        v
chrome.commands.onCommand fires in background.js
        |
        v
background.js calls:
  chrome.tabs.sendMessage(tab.id, { type: 'GA_COMMAND', command: 'copy-last-response' })
        |
        v
shortcuts.js has:
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'GA_COMMAND') ACTIONS[msg.command]();
  })
        |
        v
ACTIONS['copy-last-response']() calls GA.copyLastResponse()
```

### Storage Change Propagation

When the popup writes to `chrome.storage.local`, the content script does not receive an instant notification in this codebase. Instead:

1. The popup writes new shortcut values to storage.
2. The content script picks up the new values the next time it reads from storage (e.g., on page reload, or when `loadShortcuts()` is called).
3. If an event bus event is emitted after a storage write (like `GA.saveShortcuts` does), listeners respond immediately.

---

## 7. Adding a New Feature -- Step by Step

This section walks through adding a hypothetical "Pin Chat" feature that adds a star icon next to pinned chats.

### Step 1: Create a New File in lib/

Create `lib/pin-chat.js`:

```javascript
/* Gemini Architect -- Pin Chat */
(function (GA) {

  // Internal state
  const pinnedChats = new Set();

  // Initialize: load pinned chats from storage
  async function loadPinned() {
    const data = await new Promise(resolve => {
      chrome.storage.local.get('ga_pinned', resolve);
    });
    if (data.ga_pinned && Array.isArray(data.ga_pinned)) {
      data.ga_pinned.forEach(id => pinnedChats.add(id));
    }
  }

  // Save pinned chats to storage
  async function savePinned() {
    await new Promise(resolve => {
      chrome.storage.local.set({ ga_pinned: [...pinnedChats] }, resolve);
    });
  }

  // Public init function
  GA.initPinChat = async function () {
    await loadPinned();
    // ... add pin buttons to chat items ...
  };

})(window.GeminiArchitect);
```

### Step 2: Register It in manifest.json

Add your new file to the `content_scripts.js` array, **before** `content.js` (which must always be last):

```json
"js": [
  "lib/storage.js",
  "lib/dom-observer.js",
  "lib/folder-manager.js",
  "lib/drag-drop.js",
  "lib/search.js",
  "lib/bulk-delete.js",
  "lib/wide-mode.js",
  "lib/copy-conversation.js",
  "lib/shortcuts.js",
  "lib/pin-chat.js",        // <-- your new file
  "content.js"
]
```

### Step 3: Wire It Up in content.js

Inside the `injectAll()` function in `content.js`, add your initialization call:

```javascript
// Inject pin chat feature
if (GA.initPinChat) await GA.initPinChat();
```

The `if (GA.initPinChat)` guard ensures the extension does not crash if your file fails to load for some reason.

### Step 4: Add CSS in content.css

Add styles for your new feature at the bottom of `content.css`:

```css
/* --------------- Pin Chat --------------- */
.ga-pin-icon {
  cursor: pointer;
  font-size: 14px;
  color: var(--ga-text-muted);
  transition: color var(--ga-transition);
}

.ga-pin-icon.pinned {
  color: var(--ga-accent);
}
```

Use the existing CSS variables (`--ga-text-muted`, `--ga-accent`, etc.) so your feature automatically supports both dark and light themes.

### Step 5: Add Storage Keys If Needed

If your feature needs persistent storage, add a default value in `storage.js`:

```javascript
const DEFAULTS = {
  ga_folders: {},
  ga_settings: { wideMode: false, hideLocation: true },
  ga_shortcuts: { ... },
  ga_pinned: [],          // <-- new default
  ga_version: '1.0.0'
};
```

### Step 6: Reload and Test

1. Go to `chrome://extensions`
2. Click the reload button on the Gemini Architect card
3. Go to `https://gemini.google.com` and refresh the page
4. Open DevTools (F12) and check the Console for errors
5. Test your feature manually

---

## 8. Debugging Guide

### Opening DevTools for Content Scripts

Content scripts run inside the web page, so you debug them in the page's DevTools:

1. Go to the Gemini tab (`https://gemini.google.com`)
2. Right-click anywhere on the page
3. Click **"Inspect"** (or press F12)
4. The DevTools panel opens
5. Click the **"Console"** tab

You will see log messages from the extension prefixed with `[GA]`:

```
[GA] Gemini Architect initializing...
[GA] Gemini Architect loaded.
```

### Inspecting the Background Worker

The background service worker has its own DevTools:

1. Go to `chrome://extensions`
2. Find the Gemini Architect card
3. Look for **"Inspect views: service worker"** (it is a clickable link)
4. Click it to open a separate DevTools window for the background worker

This is where you debug `background.js`.

### Inspecting the Popup

1. Click the Gemini Architect icon in the toolbar to open the popup
2. Right-click inside the popup
3. Click **"Inspect"**
4. A DevTools window opens for the popup

### Using console.log Effectively

Add log statements to trace execution:

```javascript
console.log('[GA] initFolderManager called');
console.log('[GA] folders loaded:', folders);
console.log('[GA] sidebar element:', sidebar);
```

Use `console.log` for general messages, `console.warn` for warnings, and `console.error` for errors. They appear in different colors in the Console tab.

You can log objects and they will be interactive (expandable) in the console:

```javascript
console.log('[GA] folder data:', await GA.getFolders());
// You can click the logged object to explore its properties
```

### Setting Breakpoints

1. In DevTools, click the **"Sources"** tab
2. In the left sidebar, expand **"Content scripts"**
3. Find the Gemini Architect files (they appear under the extension's ID)
4. Click on a file to open it
5. Click on a line number to set a breakpoint (a blue marker appears)
6. Trigger the code (e.g., click a button) and execution will pause at the breakpoint
7. Use the controls at the top to step through the code:
   - **Step over** (F10): Execute the current line and move to the next
   - **Step into** (F11): Enter a function call
   - **Step out** (Shift+F11): Finish the current function and return to the caller
   - **Resume** (F8): Continue running until the next breakpoint

### Storage Inspector

To view what is stored in `chrome.storage.local`:

1. Open DevTools on the Gemini page (F12)
2. Go to the **"Console"** tab
3. Type this and press Enter:

```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

This prints all stored data. You can also inspect specific keys:

```javascript
chrome.storage.local.get('ga_folders', (data) => console.log(data));
```

### Common Errors and What They Mean

| Error Message | Cause | Fix |
|---|---|---|
| `[GA] GeminiArchitect not found` | `storage.js` did not load before `content.js` | Check the file order in `manifest.json` |
| `Uncaught TypeError: Cannot read property 'X' of undefined` | Trying to access a property on `null` or `undefined` | Add a null check before the line |
| `Unchecked runtime.lastError: Could not establish connection` | Trying to send a message to a tab where the content script is not loaded | Make sure the tab URL matches `content_scripts.matches` |
| `[GA] Could not find sidebar after timeout` | Gemini's DOM structure changed or the page is slow | Increase the timeout in `waitForElement` or update the selectors |
| `[GA] waitForElement timeout: ...` | The CSS selector does not match any element on the page | Inspect the page to find the correct selector |

---

## 9. Testing Checklist

### Manual Testing Checklist

After making any change, test these core features:

**Folder Management**:
- [ ] Create a new folder (click "+")
- [ ] Rename a folder (click pencil icon, type new name, press Enter)
- [ ] Delete a folder (click trash icon, confirm dialog)
- [ ] Change a folder's emoji icon (click the emoji, pick a new one from the grid)
- [ ] Collapse and expand a folder (click the folder row)
- [ ] Search folders (type in "Search folders..." input)

**Drag and Drop**:
- [ ] Drag a chat from Gemini's native list onto a folder
- [ ] Verify the toast notification appears ("Added to folder")
- [ ] Verify the chat appears inside the folder
- [ ] Click the chat inside the folder to navigate to it
- [ ] Remove a chat from a folder (hover over it, click the X)

**Search**:
- [ ] Search folders by name
- [ ] Search chats within folders (collapsed folders auto-expand on match)
- [ ] Search Gemini's native chat list
- [ ] Clear search and verify all items reappear

**Bulk Delete**:
- [ ] Click "Select" to enter bulk mode
- [ ] Verify checkboxes appear next to each chat
- [ ] Select multiple chats
- [ ] Verify the count updates in the action bar
- [ ] Click "Delete Selected" and confirm
- [ ] Click "Select" again to exit bulk mode
- [ ] Verify checkboxes disappear

**Wide Mode**:
- [ ] Click the "Wide" button in the header
- [ ] Verify the conversation area expands to full width
- [ ] Click again to disable
- [ ] Refresh the page and verify the setting persists

**Copy Features**:
- [ ] Open a conversation with at least one response
- [ ] Click "Copy Chat" button
- [ ] Paste somewhere and verify the conversation text was copied
- [ ] Press Alt+Shift+C to copy the last response
- [ ] Press Alt+Shift+A to copy the entire conversation

**Popup**:
- [ ] Click the extension icon to open the popup
- [ ] Click "Download Data" and verify a JSON file downloads
- [ ] Open the downloaded file in a text editor and verify it contains folder data
- [ ] Customize a keyboard shortcut (click the input, press a key combo)
- [ ] Click "Save Shortcuts"
- [ ] Reload the extension and verify the shortcut works

### How to Test SPA Navigation

Gemini is a Single Page Application -- clicking on a chat in the sidebar does not reload the page. To test SPA navigation handling:

1. Open Gemini and verify the extension loaded (folders visible)
2. Click on a different chat in the sidebar
3. Verify the folders container is still visible (not disappeared)
4. Click "New Chat" or navigate to a different section
5. Come back to the chat list
6. Verify folders and drag-drop still work

### How to Test with Multiple Tabs

1. Open Gemini in Tab A
2. Open Gemini in Tab B
3. Create a folder in Tab A
4. Refresh Tab B
5. Verify the folder appears in Tab B (data is shared through `chrome.storage.local`)

### How to Test Storage Persistence

1. Create folders and add chats to them
2. Close Chrome completely
3. Re-open Chrome and navigate to Gemini
4. Verify your folders and chats are still there

---

## 10. Common Pitfalls

### Forgetting to Reload the Extension

**Symptom**: You edited a file but nothing changed.

**Cause**: Chrome caches extension files. Saving a file on disk does not automatically update the running extension.

**Fix**: Go to `chrome://extensions`, click the reload button on the Gemini Architect card, then refresh the Gemini tab.

### Content Script Not Re-Injecting on SPA Navigation

**Symptom**: Folders disappear when you navigate to a different chat.

**Cause**: Gemini updates the DOM without a full page reload. If the extension's UI elements are inside a DOM subtree that Gemini replaces, they vanish.

**Fix**: The `GA.onUrlChange()` handler in `content.js` re-runs `injectAll()` whenever the URL changes. If your new feature creates DOM elements, make sure `injectAll()` re-creates them. Use guard checks like `if (document.getElementById('my-element')) return;` to prevent duplicate injection.

### CSS Selector Fragility

**Symptom**: The extension stops working after a Gemini update, even though you did not change any code.

**Cause**: The extension locates Gemini's UI elements using CSS selectors like `'nav a[href*="/app/"]'`. When Google updates Gemini's HTML structure or CSS class names, these selectors break.

**Fix**: Use multiple fallback selectors (as the project already does). Prefer structural selectors (`nav`, `[role="navigation"]`, `a[href*="/app/"]`) over class names (which Google can rename at any time). When a selector breaks, use DevTools to inspect the page and find the new element structure.

### Storage Race Conditions

**Symptom**: Data is unexpectedly overwritten or lost.

**Cause**: Two operations read storage at the same time, both modify the data, and both write it back. The second write overwrites the first write's changes.

**Example scenario**:
1. Tab A reads folders: `{ folderA: { chats: [1] } }`
2. Tab B reads folders: `{ folderA: { chats: [1] } }` (same data)
3. Tab A adds chat 2: writes `{ folderA: { chats: [1, 2] } }`
4. Tab B adds chat 3: writes `{ folderA: { chats: [1, 3] } }` -- **chat 2 is lost!**

**Fix**: Keep storage operations fast and avoid long delays between read and write. The current code reads, modifies, and writes in quick succession, which minimizes the race window. For a more robust solution, consider using `chrome.storage.session` or implementing a simple lock mechanism.

### IIFE Scope -- Variables Not Leaking to Global

**Symptom**: You defined a variable in one file but cannot access it in another.

**Cause**: Variables declared with `let`, `const`, or `var` inside an IIFE are scoped to that function. They are intentionally invisible outside.

**Fix**: If you need to share a value between modules, attach it to the `GA` object:

```javascript
// Wrong -- not accessible outside this IIFE
(function (GA) {
  const myHelper = () => { ... };
})(window.GeminiArchitect);

// Right -- accessible from any module as GA.myHelper
(function (GA) {
  GA.myHelper = () => { ... };
})(window.GeminiArchitect);
```

---

## 11. Glossary

| Term | Definition |
|---|---|
| **API** | Application Programming Interface. A set of functions and protocols for building software. In this project, "Chrome API" refers to functions like `chrome.storage.local.get()` provided by Chrome for extensions. |
| **Arrow function** | A shorthand for writing functions in JavaScript: `(x) => x * 2`. Equivalent to `function(x) { return x * 2; }`. |
| **async/await** | JavaScript keywords for writing asynchronous code. `async` marks a function as asynchronous. `await` pauses execution until a Promise resolves. |
| **Background service worker** | A JavaScript file that runs independently of any web page, in the extension's own process. Used for handling events like keyboard shortcuts. |
| **Callback** | A function passed as an argument to another function, to be called later when an event occurs or an operation completes. |
| **Chrome storage** | A key-value store provided by Chrome (`chrome.storage.local`). Persists data across browser sessions. Similar to a simple database. |
| **Closure** | A function that retains access to variables from its enclosing scope, even after that scope has finished executing. |
| **Content script** | JavaScript (and CSS) that Chrome injects into a web page. It runs in the page's context and can read/modify the page's DOM. |
| **CSS custom property** | Also called a CSS variable. Defined with `--name: value` and used with `var(--name)`. Allows centralized theming. |
| **CSS selector** | A pattern used to select HTML elements. Examples: `#id` (by ID), `.class` (by class), `a[href*="/app/"]` (links whose href contains "/app/"). |
| **Debouncing** | A technique that delays execution of a function until a pause in events. Used to prevent running expensive operations on every keystroke. |
| **DevTools** | Chrome's built-in developer tools. Opened with F12 or right-click then "Inspect". Includes Console, Sources, Elements, Network tabs, and more. |
| **DOM** | Document Object Model. The browser's tree representation of an HTML page. JavaScript can read and modify this tree to change what the user sees. |
| **Event bus** | A communication pattern where modules publish and subscribe to named events. Decouples the sender from the receiver. |
| **Event loop** | The mechanism by which JavaScript processes events one at a time on a single thread. Callbacks are queued and executed sequentially. |
| **IIFE** | Immediately-Invoked Function Expression. A function that is defined and called in one step: `(function() { ... })()`. Used for encapsulation. |
| **Manifest V3** | The current version of Chrome's extension platform specification. Defines how extensions declare their capabilities, permissions, and files. |
| **Message passing** | Communication between different extension contexts (content script, background worker, popup) using `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`. |
| **MutationObserver** | A browser API that watches the DOM for changes (elements added, removed, or modified) and calls a callback when changes occur. |
| **Popup** | The small HTML page that appears when you click an extension's icon in the toolbar. |
| **Promise** | A JavaScript object representing a value that may not be available yet. It can be in one of three states: pending, fulfilled (resolved), or rejected. |
| **SPA** | Single Page Application. A web application that dynamically rewrites the current page rather than loading entire new pages from the server. Gemini is an SPA. |
| **Service worker** | A script that runs in the background, separate from web pages. In Chrome extensions, the background script is a service worker. |
| **Toast** | A brief notification message that appears temporarily and then disappears. Named after the way toast pops up from a toaster. |
