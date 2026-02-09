# Gemini Architect User Guide

---

## Table of Contents

1. [What is Gemini Architect?](#1-what-is-gemini-architect)
2. [Installing Gemini Architect](#2-installing-gemini-architect)
3. [Creating and Managing Folders](#3-creating-and-managing-folders)
4. [Customizing Folder Icons](#4-customizing-folder-icons)
5. [Organizing Chats with Drag and Drop](#5-organizing-chats-with-drag-and-drop)
6. [Removing a Chat from a Folder](#6-removing-a-chat-from-a-folder)
7. [Collapsing and Expanding Folders](#7-collapsing-and-expanding-folders)
8. [Searching](#8-searching)
9. [Bulk Deleting Chats](#9-bulk-deleting-chats)
10. [Wide Mode](#10-wide-mode)
11. [Copying Conversations](#11-copying-conversations)
12. [Starting a New Chat](#12-starting-a-new-chat)
13. [Keyboard Shortcuts](#13-keyboard-shortcuts)
14. [Backing Up Your Data](#14-backing-up-your-data)
15. [Restoring Your Data](#15-restoring-your-data)
16. [Troubleshooting](#16-troubleshooting)
17. [Frequently Asked Questions](#17-frequently-asked-questions)

---

## 1. What is Gemini Architect?

Gemini Architect is a free browser extension for Google Chrome that adds organizational tools to Google Gemini (gemini.google.com). If you use Gemini regularly, you have probably noticed that your list of chats grows quickly, and there is no built-in way to group them or keep them organized. Gemini Architect solves that problem.

With Gemini Architect, you can create folders in the Gemini sidebar and drag your chats into them, making it easy to keep related conversations together. Beyond folders, the extension also lets you search through your chats, delete multiple chats at once, expand the chat area to fill your screen, copy entire conversations to your clipboard, and use keyboard shortcuts to work faster. All of your data stays on your computer -- nothing is sent to any external server.

### Features at a Glance

- **Folders** -- Create named folders to group your Gemini chats.
- **Custom folder icons** -- Pick an emoji to represent each folder.
- **Drag and drop** -- Drag chats from the sidebar into your folders.
- **Folder search** -- Search your folders and the chats inside them.
- **Chat search** -- Search the main Gemini chat list by title.
- **Bulk delete** -- Select and delete multiple chats at once.
- **Wide mode** -- Expand the chat area to fill the full width of your browser window.
- **Copy conversation** -- Copy an entire conversation (or just the last reply) to your clipboard.
- **New chat button** -- Start a new chat from a convenient button in the top-right corner.
- **Keyboard shortcuts** -- Four customizable shortcuts for common actions.
- **Backup and restore** -- Download your folders and settings as a file, and restore them later.

---

## 2. Installing Gemini Architect

Gemini Architect is installed manually as an "unpacked" Chrome extension. Follow these steps carefully.

### Step 1: Get the Extension Files

Download or obtain the Gemini Architect extension folder. This is the folder named `gemini-architect` that contains files such as `manifest.json`, `content.js`, and others. Save it somewhere easy to find on your computer, such as your Desktop or Downloads folder.

### Step 2: Open Google Chrome

Open the Google Chrome browser. Gemini Architect is designed for Chrome and may not work in other browsers.

### Step 3: Go to the Extensions Page

Click on the address bar at the top of Chrome (where you type website addresses). Type the following and press **Enter**:

```
chrome://extensions
```

This opens the Extensions management page.

### Step 4: Turn On Developer Mode

Look at the top-right corner of the Extensions page. You will see a toggle switch labeled **Developer mode**. Click it to turn it **ON**. The switch should slide to the right and turn blue.

### Step 5: Click "Load unpacked"

After turning on Developer mode, three new buttons appear at the top-left of the page. Click the button labeled **Load unpacked**.

### Step 6: Select the Extension Folder

A file browser window will appear. Navigate to the `gemini-architect` folder that you saved in Step 1. Click on the folder to select it (do not open it -- just select it), then click the **Select Folder** button.

### Step 7: Confirm the Extension Appeared

You should now see **Gemini Architect** listed on the Extensions page. It will show the name, version (v1.0.0), and a short description. Make sure the toggle switch next to it is turned **ON** (blue).

### Step 8: Find the Extension Icon

Look at the Chrome toolbar (the area to the right of the address bar). You may see the Gemini Architect icon there. If you do not see it, click the **puzzle piece icon** in the toolbar, find Gemini Architect in the list, and click the **pin icon** next to it. This will keep it visible in your toolbar.

### Step 9: Verify It Works

Open a new tab and go to **gemini.google.com**. Once the page loads, look at the left sidebar. You should see a new **Folders** section appear above your chat list. If you see it, the extension is working correctly.

---

## 3. Creating and Managing Folders

Folders let you group related chats together. For example, you might create folders for "Work Projects," "Personal," "Research," and "Recipes."

### Creating a New Folder

1. Go to **gemini.google.com** in Chrome.
2. Look at the left sidebar. Near the top, you will see a section labeled **Folders**.
3. Click the **+** button to the right of the "Folders" heading.
4. A new folder appears with the name "New Folder" already highlighted.
5. Type the name you want for your folder (for example, "Work Projects").
6. Press **Enter** on your keyboard to save the name.

### Renaming a Folder

1. Hover your mouse over the folder you want to rename.
2. Small action buttons appear to the right of the folder name.
3. Click the **pencil icon** to start editing the name.
4. The folder name turns into a text field. Type the new name.
5. Press **Enter** to save, or press **Escape** to cancel.

### Deleting a Folder

1. Hover your mouse over the folder you want to delete.
2. Click the **trash icon** that appears to the right of the folder name.
3. A confirmation dialog appears asking if you are sure.
4. Click **Delete** to confirm, or click **Cancel** to keep the folder.

**Important:** Deleting a folder does **not** delete the chats that were inside it. Your chats remain in Gemini's main chat list. Only the folder grouping is removed.

---

## 4. Customizing Folder Icons

Each folder has an emoji icon next to its name. By default, new folders use a folder emoji. You can change this to any emoji you like.

### How to Change a Folder Icon

1. Look at the emoji icon to the left of the folder name (the default is a folder emoji).
2. Click on that emoji icon.
3. An **emoji picker** panel appears below the icon.
4. Browse through the available emojis, or type in the search bar at the top of the picker to find a specific one (for example, type "star" to find star emojis).
5. Click on the emoji you want to use.
6. The folder icon updates immediately.

### Suggested Icon Ideas

- **Work or business:** briefcase, office building, or chart emoji
- **Personal:** house, heart, or star emoji
- **Study or research:** books, magnifying glass, or graduation cap emoji
- **Creative projects:** art palette, light bulb, or rocket emoji
- **Games and fun:** game controller, puzzle piece, or dice emoji
- **Important items:** pin, fire, or trophy emoji

To close the emoji picker without selecting anything, click anywhere outside the picker panel.

---

## 5. Organizing Chats with Drag and Drop

The main way to put chats into folders is by dragging and dropping them.

### How to Drag a Chat into a Folder

1. Find the chat you want to organize in the **Gemini sidebar** (the main chat list, below the Folders section).
2. **Click and hold** the mouse button on the chat name. Do not let go of the mouse button.
3. While still holding the mouse button, **move your mouse** up to one of your folders.
4. As you drag over a folder, the folder will **highlight in blue** to show that you can drop the chat there.
5. **Release the mouse button** (let go) while the folder is highlighted.
6. A small notification will appear at the bottom of the screen saying "Added to folder."
7. The chat now appears inside the folder. You can expand the folder to see it.

### Tips

- You can add the same chat to more than one folder if you want.
- If a folder is collapsed (closed), you can still drop a chat on it.
- Only chats from the Gemini sidebar can be dragged. You cannot drag chats that are already inside a folder to another folder.

---

## 6. Removing a Chat from a Folder

Removing a chat from a folder takes it out of the folder grouping, but does **not** delete the chat from Gemini. The chat will still be available in the main chat list.

### How to Remove a Chat

1. Click on the folder to expand it and show the chats inside.
2. Find the chat you want to remove.
3. Hover your mouse over the chat name.
4. A small **X** button appears on the right side of the chat name.
5. Click the **X** button.
6. The chat is immediately removed from the folder.

No confirmation is needed because this action does not delete anything. The chat remains safely in your Gemini account.

---

## 7. Collapsing and Expanding Folders

You can collapse (hide) or expand (show) the chats inside a folder to keep your sidebar tidy.

### How to Collapse and Expand

1. Click on the **folder row** (the area with the folder icon and name).
2. If the folder is expanded (chats visible), clicking it will **collapse** the folder, hiding the chats inside.
3. If the folder is collapsed (chats hidden), clicking it will **expand** the folder, showing the chats inside.

### How to Tell If a Folder Is Collapsed or Expanded

- Look at the small **arrow icon** on the right side of the folder row.
- When the arrow points **down**, the folder is expanded (chats are visible).
- When the arrow points **to the right**, the folder is collapsed (chats are hidden).

### Remembered State

Your collapsed or expanded choices are **saved automatically**. If you reload the page or close and reopen your browser, each folder will stay in the same collapsed or expanded state you left it in.

---

## 8. Searching

Gemini Architect adds two search bars to help you quickly find what you are looking for.

### Searching Folders

1. Look for the search bar that appears directly below the **Folders** heading in the sidebar. It says "Search folders..." in light gray text.
2. Click on it and start typing.
3. As you type, the folders are filtered in real time:
   - Folders whose **name** matches your search text will remain visible.
   - Folders that contain **chats** matching your search text will also remain visible, and matching chats will be shown even if the folder is collapsed.
   - Folders that do not match are hidden.
4. To see all folders again, delete all text from the search bar (clear it).

### Searching Chats

1. Look for the search bar that appears above the **main chat list** in the sidebar (below the Folders section). It says "Search chats..." in light gray text.
2. Click on it and start typing.
3. As you type, chats in the main list that do **not** match your search text are hidden.
4. Only chats whose title includes the text you typed will remain visible.
5. To see all chats again, delete all text from the search bar.

### Tips

- Searches are **not case-sensitive** -- typing "work" will find "Work Project" and "homework."
- The search filters update instantly as you type, so there is no need to press Enter.

---

## 9. Bulk Deleting Chats

If you want to delete many chats at once, the bulk delete feature lets you select multiple chats and delete them all in one action.

> **WARNING:** Bulk delete **permanently removes chats from your Gemini account**. This action cannot be undone. Make sure you select only the chats you truly want to delete.

### How to Use Bulk Delete

1. Look at the Folders section header in the sidebar. Next to the "Folders" label, you will see a **Select** button.
2. Click the **Select** button. It will turn blue to show that bulk delete mode is active.
3. **Checkboxes** appear next to every chat in the main chat list (below the Folders section).
4. Click the checkbox next to each chat you want to delete. A checkmark appears in the box.
5. As you select chats, a **bar appears at the bottom** of the sidebar showing how many chats you have selected (for example, "3 selected").
6. When you are ready, click the **Delete Selected** button in the bottom bar.
7. A confirmation dialog appears asking if you are sure. It reminds you that this cannot be undone.
8. Click **Delete** to confirm and permanently delete the selected chats, or click **Cancel** to go back without deleting anything.
9. The extension will delete each chat one by one. You will see a progress indicator (for example, "Deleting... (2/5)").
10. When finished, a notification will tell you how many chats were deleted.

### Exiting Bulk Delete Mode

To leave bulk delete mode without deleting anything, click the **Select** button again. The checkboxes will disappear and everything returns to normal.

---

## 10. Wide Mode

Wide mode expands the Gemini chat area to use the full width of your browser window. This is helpful for reading long responses or working with code.

### How to Use Wide Mode

1. Look at the **top-right corner** of the Gemini page. You will see a group of buttons added by Gemini Architect.
2. Click the button labeled **Wide**. It has a left-right arrow icon.
3. The chat area immediately expands to fill the full width of the window.
4. Click the **Wide** button again to return to the normal, narrower layout.

### How to Tell If Wide Mode Is On

- When wide mode is **active**, the Wide button has a blue border and blue text.
- When wide mode is **off**, the button has a gray border.

### Saved Preference

Your wide mode preference is **saved automatically**. If you turn wide mode on and then reload the page or come back later, it will still be on. You do not need to turn it on every time.

You can also toggle wide mode with the keyboard shortcut **Alt+Shift+W** (see the [Keyboard Shortcuts](#13-keyboard-shortcuts) section).

---

## 11. Copying Conversations

Gemini Architect lets you copy the text of your conversations so you can paste them into other applications like a word processor, email, or note-taking app.

### Copying an Entire Conversation

1. Open the chat conversation you want to copy (click on it in the sidebar).
2. Look at the **top-right corner** of the page. Click the button labeled **Copy Chat** (it has a clipboard icon).
3. The entire conversation is copied to your clipboard.
4. Open any other application (Word, Google Docs, email, Notepad, etc.) and press **Ctrl+V** to paste.
5. A brief notification appears at the bottom of the screen confirming "Conversation copied!"

Each message in the copied text is labeled with who said it:
- Messages you sent are labeled **"You:"**
- Gemini's responses are labeled **"Gemini:"**

Messages are separated by horizontal lines for easy reading.

### Copying Just the Last Response

If you only want Gemini's most recent reply (not the whole conversation), use the keyboard shortcut **Alt+Shift+C**. This copies only the last response from Gemini to your clipboard.

---

## 12. Starting a New Chat

Gemini Architect adds a convenient "New Chat" button in the top-right corner of the page.

### How to Start a New Chat

1. Click the **+ New Chat** button in the top-right corner of the Gemini page.
2. A fresh, empty chat opens immediately.

This works the same way as Gemini's own new-chat button, but is placed in a more convenient location. You can also start a new chat with the keyboard shortcut **Alt+Shift+N**.

---

## 13. Keyboard Shortcuts

Gemini Architect includes four keyboard shortcuts for quick access to common actions. Press the key combination and the action happens immediately.

### Default Shortcuts

| Shortcut | Action |
|---|---|
| **Alt+Shift+C** | Copy the last Gemini response to your clipboard |
| **Alt+Shift+A** | Copy the entire conversation to your clipboard |
| **Alt+Shift+W** | Toggle wide mode on or off |
| **Alt+Shift+N** | Start a new chat |

### How to Customize Shortcuts

You can change any shortcut to a different key combination:

1. Click the **Gemini Architect icon** in the Chrome toolbar (top-right of the browser).
2. A small popup window appears.
3. Scroll down to the **Keyboard Shortcuts** section.
4. Click on the input field next to the shortcut you want to change (for example, next to "Copy Last Response").
5. The field will say "Press keys..." -- now **press the new key combination** you want to use (for example, Ctrl+Shift+R).
6. The field updates to show your new key combination.
7. Repeat for any other shortcuts you want to change.
8. Click the **Save Shortcuts** button.
9. A message confirms "Shortcuts saved!" Your new shortcuts will be active the next time you load a Gemini page.

### Important Notes About Shortcuts

- Shortcuts do **not** work when you are typing in a text field or chat input. They only work when you are not actively typing.
- If a shortcut does not seem to work, it may conflict with a shortcut from another Chrome extension or from Chrome itself. Try a different key combination.

---

## 14. Backing Up Your Data

You can download a backup file containing all of your folders, settings, and shortcut configurations. This is useful if you want to save your setup before making changes, or if you want to transfer your folders to another computer.

### How to Back Up

1. Click the **Gemini Architect icon** in the Chrome toolbar (top-right of the browser window).
2. A popup window appears.
3. In the **Data** section, click the **Download Data** button.
4. A file is automatically saved to your Downloads folder. The file name includes the current date, for example: `gemini-architect-backup-2026-02-08.json`.
5. A message confirms "Data downloaded!"

Keep this file somewhere safe. You can use it to restore your folders and settings at any time.

---

## 15. Restoring Your Data

If you need to restore your folders and settings from a backup file (for example, after reinstalling Chrome or setting up a new computer), follow these steps.

### How to Restore

1. Click the **Gemini Architect icon** in the Chrome toolbar.
2. In the popup window, find the **Data** section.
3. Click the **Restore from File** button.
4. A file selection window appears. Navigate to the backup file you previously downloaded (it will be a `.json` file with a name like `gemini-architect-backup-2026-02-08.json`).
5. Select the file and click **Open**.
6. A message confirms how many settings were restored (for example, "Restored 3 setting(s).").
7. **Reload the Gemini tab** by pressing **Ctrl+R** or clicking the reload button in Chrome. This is required for the restored data to take effect.

After reloading, your folders, folder icons, chat assignments, settings, and shortcut configurations will be exactly as they were when you created the backup.

---

## 16. Troubleshooting

If something is not working as expected, try the solutions below.

### "I don't see the Folders section in the sidebar"

- **Reload the page:** Press **Ctrl+R** or click the reload button in Chrome.
- **Check the extension is enabled:** Go to `chrome://extensions`, find Gemini Architect, and make sure its toggle switch is turned **ON** (blue).
- **Wait a moment:** The Folders section may take a few seconds to appear after the page loads, especially on slow connections.

### "Drag and drop isn't working"

- Make sure you are dragging a chat from the **main Gemini chat list** (below the Folders section), not from inside a folder.
- Click and **hold** the mouse button for a moment before starting to drag.
- Make sure you are dragging the chat **over a folder** -- the folder should highlight in blue before you release.

### "My folders disappeared"

- Go to `chrome://extensions` and confirm Gemini Architect is still enabled.
- Try reloading the Gemini page.
- If your folders are still missing, restore from a backup file (see [Restoring Your Data](#15-restoring-your-data)).

### "Wide mode doesn't seem to work"

- Google occasionally updates the Gemini interface, which may temporarily affect wide mode. Try disabling and re-enabling wide mode.
- Reload the page after toggling wide mode.

### "Keyboard shortcuts aren't responding"

- Make sure you are **not** typing in a text field when pressing the shortcut. Click somewhere on the page background first.
- Check for conflicts with other extensions. Go to `chrome://extensions/shortcuts` to see all extension shortcuts.
- Try setting a different key combination in the Gemini Architect popup (see [Keyboard Shortcuts](#13-keyboard-shortcuts)).

### "Copy Chat didn't copy anything"

- Make sure you have a conversation open (not the Gemini home page). You need to be viewing a chat with at least one message.
- Try the keyboard shortcut **Alt+Shift+A** as an alternative.

### General Fix

If none of the above solutions work, try this:

1. Go to `chrome://extensions`.
2. Find Gemini Architect and click the toggle switch to turn it **OFF**.
3. Wait a few seconds, then click the toggle switch to turn it **ON** again.
4. Go to **gemini.google.com** and reload the page.

---

## 17. Frequently Asked Questions

### Does this extension access my Gemini conversations?

No. Gemini Architect only reads **chat titles** (the names shown in the sidebar) and **chat IDs** (the unique identifiers in the URL). It does not read, store, or transmit the content of your conversations.

### Is my data sent anywhere?

No. All of your data (folders, settings, shortcuts) is stored **locally in your browser** using Chrome's built-in storage. Nothing is sent to any external server. Gemini Architect does not connect to the internet for any reason.

### Will my folders survive a Chrome update?

Yes. Chrome's extension storage persists across browser updates. Your folders and settings will remain intact unless you uninstall the extension or clear your browser data.

### Can I use this on multiple computers?

Gemini Architect does not automatically sync between computers. However, you can use the **backup and restore** feature to transfer your data:

1. On your first computer, click the Gemini Architect icon and click **Download Data**.
2. Transfer the downloaded `.json` file to your other computer (via email, USB drive, cloud storage, etc.).
3. Install Gemini Architect on the second computer.
4. Click the Gemini Architect icon and click **Restore from File**, then select the `.json` file.
5. Reload the Gemini tab.

### Does this work with other Gemini extensions?

Generally, yes. Gemini Architect is designed to work alongside other extensions. However, if another extension also modifies the Gemini sidebar or chat interface, there is a small chance of visual conflicts. If you experience issues, try disabling other Gemini-related extensions one at a time to identify the conflict.

### What happens to my chats if I uninstall Gemini Architect?

Your Gemini chats are **not affected**. They remain in your Gemini account. Only the folder groupings created by Gemini Architect will be lost (unless you have a backup file).

### Does Gemini Architect work in incognito mode?

By default, Chrome extensions are disabled in incognito mode. If you want to use Gemini Architect in incognito mode, go to `chrome://extensions`, click **Details** under Gemini Architect, and enable **Allow in incognito**. Note that any folders or settings created in incognito mode will not carry over to regular browsing sessions.

### Does this extension slow down Gemini?

No. Gemini Architect is lightweight and only adds a small amount of code to the Gemini page. It does not perform any background processing or network requests that would affect performance.
