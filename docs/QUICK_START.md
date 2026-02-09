# Quick Start Guide

Welcome to **Gemini Architect** -- the Chrome extension that brings folders, search, bulk actions, wide mode, conversation copying, and keyboard shortcuts to Google Gemini. This guide walks you through 13 hands-on exercises. Each one takes 1-3 minutes and leaves you with a concrete result. By the end, you will have a fully organized Gemini workspace in about 20 minutes.

**Tip:** Work through these in order. Each exercise builds on the one before it.

## Prerequisites

Before you begin, make sure you have:

- **Google Chrome** (version 116 or later)
- **A Google Gemini account** at [gemini.google.com](https://gemini.google.com) with at least a few existing conversations
- **Gemini Architect installed** -- see the [User Guide](USER_GUIDE.md) for step-by-step installation instructions

Once the extension is installed, open [gemini.google.com](https://gemini.google.com) in Chrome and you are ready to start.

---

## 1. Install and Verify

**Goal:** Confirm that Gemini Architect is loaded and running in your browser.

1. Open Google Gemini in Chrome at `gemini.google.com`.
2. Wait a few seconds for the page to finish loading.
3. Look at the left sidebar. You should see a new **"Folders"** section with a **+** button, appearing above your existing Chats list.
4. Look at the top-right area of the page. You should see a floating header bar containing **Wide**, **+ New Chat**, and **Copy Chat** buttons.
5. Click the puzzle piece icon in the Chrome toolbar and confirm that "Gemini Architect" appears in your extensions list with its toggle enabled.

If you see the Folders header in the sidebar and the floating buttons at the top of the page, the extension is working correctly.

**What you learned:** How to verify that Gemini Architect is active. The extension injects its UI directly into the Gemini sidebar and page header without requiring any configuration.

---

## 2. Create Your First Folder

**Goal:** Create a folder named "Work Projects" to organize work-related chats.

1. In the sidebar, find the **Folders** section header.
2. Click the **+** button to the right of the "Folders" title.
3. A new folder appears with the name "New Folder" already highlighted and ready for editing.
4. Type **Work Projects** and press **Enter**.
5. Your folder now appears in the sidebar with a default folder icon and an empty "Drag chats here" placeholder.

**What you learned:** Folders are created with a single click. The name is immediately editable so you can give it a meaningful label right away. You can create as many folders as you need by clicking **+** again.

---

## 3. Give Your Folder a Personality

**Goal:** Change the folder icon to a custom emoji using the built-in emoji picker.

1. Find the **Work Projects** folder you just created.
2. Click the **folder icon** on the left side of the folder name (the default folder emoji).
3. An emoji picker panel appears with a grid of emojis and a search bar at the top.
4. Type **brief** in the search bar. The grid filters to show briefcase-related emojis.
5. Click the briefcase emoji (or any emoji you like).
6. The folder icon updates immediately to your selection.
7. Try it again -- click the new icon, search for **star**, and pick a star emoji to see how fast you can change icons.

**What you learned:** Every folder can have a custom emoji icon. The emoji picker includes a search feature that filters from hundreds of emojis, making it fast to find the perfect visual identity for each folder.

---

## 4. Organize a Chat into Your Folder

**Goal:** Drag an existing Gemini conversation into your Work Projects folder.

1. Find a conversation in the **Chats** list below your folders.
2. Click and hold on the conversation item. The cursor changes to indicate it is draggable.
3. While holding, drag it upward and hover over the **Work Projects** folder.
4. The folder highlights with a visual indicator to show it is ready to accept the drop.
5. Release the mouse button to drop the chat into the folder.
6. A toast notification appears at the bottom of the screen confirming "Added to folder."
7. If the folder is collapsed, click the folder row to expand it and see your chat listed inside.

**What you learned:** Drag and drop is the primary way to organize chats into folders. The chat also remains in the main Chats list -- folders act as organized bookmarks, not as a way to move or hide conversations.

---

## 5. Tidy Up with Collapsible Folders

**Goal:** Create a few folders, add chats to them, then use collapse and expand to keep the sidebar clean.

1. Create two more folders using the **+** button. Name them something like **Personal** and **Research**.
2. Drag one or two chats into each folder using the technique from exercise 4.
3. Click on the **Work Projects** folder row (the name or icon area, not a chat inside it). The folder collapses -- the chats disappear and the chevron arrow rotates to point sideways.
4. Click the folder row again to expand it. The chats reappear and the chevron points downward.
5. Collapse all three folders so only the folder names and icons are visible.
6. Reload the page by pressing **F5** or **Ctrl+R**.
7. After the page reloads, notice that your folders are **still collapsed**. The collapse state is saved automatically.

**What you learned:** Folders can be collapsed to save sidebar space. The collapse state persists across page reloads and browser sessions, so your sidebar stays exactly how you left it.

---

## 6. Find a Chat in Seconds

**Goal:** Use the chat search bar to quickly filter through your conversation list.

1. Look for the **"Search chats..."** text input that appears above the native Chats list (below the Folders section).
2. Click into the search bar and type the first few letters of a conversation title you know exists.
3. Watch the chat list filter in real time -- only conversations whose titles match your text remain visible.
4. Click on a matching result to open that conversation.
5. Clear the search bar (select all text and delete it) to restore the full chat list.

**What you learned:** The chat search bar provides real-time filtering of the native Gemini conversation list. This is especially useful when you have dozens or hundreds of conversations and need to find one quickly.

---

## 7. Search Inside Folders Too

**Goal:** Use the folder search bar to find chats organized within your folders.

1. Look for the **"Search folders..."** text input directly below the Folders header.
2. Type a keyword that matches a chat you dragged into one of your folders earlier.
3. Notice that matching folders automatically expand to reveal the matching chats, even if they were collapsed.
4. Folders that contain no matching content are hidden from view during the search.
5. Clear the search bar to restore the normal folder view with all folders visible.
6. Now try searching by folder name. Type **Work** and see that the Work Projects folder appears while others without "Work" in their name are hidden.

**What you learned:** The folder search filters both folder names and the chat titles inside them. Matching folders auto-expand so you never miss a result hidden inside a collapsed folder. Searches are instant and case-insensitive.

---

## 8. Remove a Chat Without Deleting It

**Goal:** Remove a chat from a folder while keeping the conversation safe in your Gemini account.

1. Expand a folder that has at least one chat inside it.
2. Hover your mouse over a chat title within the folder.
3. A small **X** button appears to the right of the chat title.
4. Click the **X** button.
5. The chat disappears from the folder immediately.
6. Scroll down to the main Chats list -- the conversation is still there, completely intact.
7. If you want, drag it into a different folder to re-organize it.

**What you learned:** Removing a chat from a folder only removes the organizational link. The actual Gemini conversation is never deleted by this action. You can safely reorganize without any risk of losing data.

---

## 9. Read in Comfort with Wide Mode

**Goal:** Toggle wide mode to expand the conversation area for easier reading.

1. Open any Gemini conversation by clicking on it in the sidebar or chat list.
2. Look at the top-right area of the page for the floating header buttons.
3. Click the **Wide** button (it has a left-right arrow icon and the label "Wide").
4. The main conversation area expands to use more of your screen width. Code blocks, tables, and long paragraphs become much easier to read.
5. Navigate to a different conversation or start a new chat. Wide mode stays active because the setting is saved automatically.
6. Click the **Wide** button again to return to the default, narrower layout.
7. Toggle it on one more time, then reload the page. Notice that wide mode is still active after the reload.

**What you learned:** Wide mode gives you more reading space by expanding the content area. The setting persists across conversations, page navigations, and browser sessions -- you only need to set it once.

---

## 10. Save a Conversation for Later

**Goal:** Copy an entire conversation to your clipboard, formatted with speaker labels.

1. Open a Gemini conversation that has at least a few back-and-forth exchanges.
2. Click the **Copy Chat** button in the floating header bar (top-right area, clipboard icon).
3. A toast notification appears at the bottom of the screen confirming "Conversation copied!"
4. Open any text editor, document, email draft, or note-taking app.
5. Paste with **Ctrl+V** (or **Cmd+V** on Mac).
6. Notice the conversation is formatted with **You:** and **Gemini:** labels before each message, separated by `---` dividers.

This is useful for archiving important conversations, sharing Gemini's answers with colleagues, or compiling research notes.

**What you learned:** Copy Chat captures the entire conversation with clear speaker labels and formatting. The output is ready to paste into any application without additional editing.

---

## 11. Spring Cleaning with Bulk Delete

**Goal:** Select and delete multiple conversations at once instead of removing them one by one.

> **Warning:** Bulk delete permanently removes conversations from your Gemini account. This cannot be undone. Only use this with chats you truly no longer need.

1. In the sidebar, find the **Select** button in the Folders header area (next to the **+** button).
2. Click **Select** to enter bulk delete mode. The button highlights to show the mode is active.
3. Checkboxes appear next to each conversation in the main Chats list.
4. Click the checkbox next to two or three conversations you want to delete.
5. A bar appears at the bottom of the sidebar showing the count (for example, "3 selected") and a **Delete Selected (3)** button.
6. Click **Delete Selected (3)**.
7. A confirmation dialog appears asking if you are sure. Click **Delete** to proceed, or **Cancel** to go back.
8. The extension deletes each selected chat one by one, showing progress (for example, "Deleting... (2/3)").
9. A toast notification confirms how many chats were deleted (for example, "Deleted 3 of 3 chats").
10. Click the **Select** button again to exit bulk delete mode. The checkboxes disappear.

**What you learned:** Bulk delete mode lets you clean up many conversations in one action instead of deleting them individually through Gemini's menus. Always double-check your selections before confirming.

---

## 12. Protect Your Organization with Backups

**Goal:** Export your folders, settings, and shortcuts to a JSON backup file, and understand how to restore from one.

### Backing Up

1. Click the **Gemini Architect** extension icon in the Chrome toolbar (top-right of the browser, near the address bar). If you do not see it, click the puzzle piece icon and find Gemini Architect in the list.
2. A small popup window appears with **Data** and **Keyboard Shortcuts** sections.
3. In the **Data** section, click **Download Data**.
4. A JSON file is saved to your Downloads folder with a name like `gemini-architect-backup-2026-02-08.json`.
5. A status message in the popup confirms "Data downloaded!"
6. Store this file somewhere safe -- a cloud drive, a local backup folder, or anywhere you keep important files.

### Restoring (for when you need it)

7. Open the Gemini Architect popup again.
8. Click **Restore from File**.
9. A file selection dialog opens. Navigate to and select a previously downloaded backup JSON file.
10. A status message confirms how many settings were restored (for example, "Restored 3 setting(s). Reload Gemini tab to apply.").
11. Go to the Gemini tab and press **Ctrl+R** to reload. Your folders, settings, and shortcuts are now restored.

**What you learned:** Your folder structure, settings, and keyboard shortcuts can be backed up to a JSON file and restored at any time. This protects your organizational work if you switch computers, reinstall Chrome, or want to share your setup with someone else.

---

## 13. Become a Power User with Shortcuts

**Goal:** Try all four keyboard shortcuts, then customize them to fit your personal workflow.

### Try the Default Shortcuts

1. Open any Gemini conversation.
2. Click somewhere on the page background (not in the chat input box) to make sure you are not focused on a text field.
3. Press **Alt+Shift+C** -- the last Gemini response is copied to your clipboard. A toast confirms "Last response copied!"
4. Press **Alt+Shift+A** -- the entire conversation is copied to your clipboard. A toast confirms "Conversation copied!"
5. Press **Alt+Shift+W** -- wide mode toggles on or off.
6. Press **Alt+Shift+N** -- a new, empty chat opens immediately.

### Customize Your Shortcuts

7. Click the **Gemini Architect** extension icon in the Chrome toolbar to open the popup.
8. Scroll to the **Keyboard Shortcuts** section. You see four fields:
   - **Copy Last Response** (default: Alt+Shift+C)
   - **Copy Conversation** (default: Alt+Shift+A)
   - **Toggle Wide Mode** (default: Alt+Shift+W)
   - **New Chat** (default: Alt+Shift+N)
9. Click on any shortcut field. It shows "Press keys..." to indicate it is recording.
10. Press your desired key combination (for example, **Ctrl+Shift+K**). The field updates to show the new shortcut.
11. Repeat for any other shortcuts you want to change.
12. Click **Save Shortcuts**. A status message confirms "Shortcuts saved! Active on next page load."
13. Reload the Gemini tab and test your new shortcut.

**What you learned:** Gemini Architect provides four keyboard shortcuts that you can fully customize. Shortcuts do not activate when you are typing in a text field, so they never interfere with writing messages to Gemini.

---

## What's Next?

Congratulations -- you have explored every feature of Gemini Architect in 13 hands-on exercises.

### Recommended Reading

- **[User Guide](USER_GUIDE.md)** -- Complete reference for all features with detailed explanations, tips, and troubleshooting.
- **[Developer Guide](DEVELOPER_GUIDE.md)** -- For contributors who want to understand the codebase, add new features, or fix bugs.

### Organizational Strategies

Now that you know all the tools, here are some proven approaches to structuring your folders:

- **By project:** Create a folder for each active project (e.g., "Q1 Report", "Website Redesign", "API Integration"). Archive completed projects by renaming the folder with a checkmark emoji.
- **By topic:** Group conversations by subject area (e.g., "Coding Help", "Writing", "Research", "Brainstorming"). This works well when your Gemini usage spans many areas.
- **By priority:** Use folders like "Active", "Reference", and "Archive" to track conversation lifecycle. Move chats between folders as their importance changes.
- **By team or context:** If you use Gemini for multiple roles, create folders per team, client, or department to keep contexts separate.

Combine custom emoji icons with clear naming to make folders instantly recognizable at a glance. Use the folder search when your collection grows large, and back up your data regularly to protect your organizational work.
