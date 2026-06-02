# PikPak Rename Pro

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-✔-informational)](https://www.tampermonkey.net/)
[![Version](https://img.shields.io/badge/version-7.1-blue)](https://github.com/karejame/pikpak-rename)

**PikPak Rename Pro** is a Tampermonkey userscript that adds a powerful batch file management panel to the [PikPak](https://mypikpak.com/) cloud storage web interface. Rename, classify, deduplicate, match subtitles, normalize episodes, and manage shares — all without leaving your browser.

---

## Features

### Rename
- **Multi-step pipeline** — chain multiple find-and-replace rules using regular expressions
- **Filter by type** — target only files or only folders, or filter by file extension and name pattern
- **Case conversion** — transform filenames to UPPER, lower, or Title Case
- **Auto-numbering** — add sequential numbers with configurable format (01, 001, A, a), position (before/after name), separator, start value, and step
- **Prefix / Suffix** — prepend or append text to filenames
- **Preview before executing** — see the full list of changes before they take effect
- **Pause / Cancel** — control the rename process mid-execution
- **Rename history** — view past rename operations and roll back (undo) any of them
- **Preset management** — save and load rename configurations; export/import presets as JSON
- **Copy logs** — copy the operation log to clipboard for record-keeping

### Organize
- **Auto-classify** — define rules to move files into subfolders by extension, name pattern, or file type
- **Duplicate detection** — find and delete duplicate files (detects PikPak's `(1)` suffix pattern)
- **Subtitle matcher** — automatically match subtitle files to video files (exact + fuzzy matching via edit distance)
- **Episode normalizer** — parse episode info from filenames and standardize to S01E01 format

### Tasks
- **Offline task monitor** — view offline download tasks with status (running / failed / done)
- **Auto-refresh** — configurable polling interval
- **Retry failed** — one-click retry for failed tasks

### Share
- **Batch share** — generate share links for multiple files at once
- **Share manager** — view, filter (active / expired), and delete existing shares
- **Configurable expiry** — 1 / 7 / 30 days, optional passcode

### General
- **Bilingual UI** — English / Chinese toggle, saved preference
- **Auto credential capture** — automatically extracts authentication credentials from PikPak's network requests
- **Draggable panel** — move the floating panel anywhere; position is remembered
- **Collapsible sections** — toggle filter and naming option panels
- **Credential status** — real-time display of authentication readiness

---

## Installation

### Prerequisites

Install a userscript manager for your browser:

- [Tampermonkey](https://www.tampermonkey.net/) (recommended, Chrome / Firefox / Edge / Safari)
- [Violentmonkey](https://violentmonkey.github.io/) (Chrome / Firefox / Edge)
- [Greasemonkey](https://www.greasespot.net/) (Firefox)

### Install the Script

1. Install a userscript manager from the links above.
2. Click the install link: **[pikpak-rename.user.js](./pikpak-rename.user.js)**
3. Tampermonkey will open an installation page — click **Install**.
4. Navigate to [https://mypikpak.com/](https://mypikpak.com/) and log in.
5. A floating **PikPak Rename Pro** panel will appear after the page loads.

---

## Usage

### Quick Start

1. Open any folder in PikPak web interface.
2. Wait for the credential status to show **Ready**.
3. Click **Scan** to load all files in the current folder.
4. Configure rename rules, filters, and naming options.
5. Click **Preview** to verify the changes.
6. Click **Execute** to apply the renaming.

### Rename Options

| Setting | Description |
|---------|-------------|
| **Find & Replace steps** | Multiple regex find-and-replace rules, each can be toggled on/off |
| **Filter** | File extension, kind (file/folder), name contains |
| **Prefix / Suffix** | Text to prepend or append |
| **Case** | None / UPPER / lower / Title |
| **Numbering** | Format (01/001/A/a), position (before/after), separator, start, step |
| **Keep extension** | Preserve the original file extension (checked by default) |
| **Delay** | Base delay in milliseconds between rename requests (random 0–600ms added) |

---

## Script Details

`pikpak-rename.user.js` is a single, self-contained JavaScript file (no dependencies, no build step). It works by:

1. **Hooking** into `fetch()` and `XMLHttpRequest` to capture PikPak's authentication credentials (Bearer token, device ID, captcha token, client ID, client version).
2. **Listing** files via the official PikPak Drive REST API (`api-drive.mypikpak.com`) with automatic pagination.
3. **Applying** the user-configured rename pipeline locally to compute new filenames.
4. **Executing** rename/move/delete API calls with a configurable delay between requests to avoid rate limiting.
5. **Storing** operation history in `localStorage` for later rollback.

### Key Functions

| Function | Purpose |
|----------|---------|
| `hookFetch()` / `hookXHR()` | Intercept PikPak network requests to extract credentials |
| `fetchAllFiles()` | Paginate through all files in the current folder |
| `processName()` | Apply the rename pipeline (multi-step regex, case, prefix/suffix, numbering) |
| `renameFile()` | Call the PikPak API to rename a single file |
| `moveFile()` | Call the PikPak API to move a file to a different folder |
| `handleRollback()` | Reverse a previous rename operation using stored history |
| `createUI()` | Build the entire floating panel UI dynamically |

### Credential Status

The panel displays a credential status badge:

- **Ready** — all credentials captured, script is ready to use
- **Click PikPak page to activate** — credentials not yet captured; click around in PikPak to trigger authenticated requests

---

## Development

This is a vanilla JavaScript project with no build tools. To modify:

1. Edit `pikpak-rename.user.js` directly.
2. The userscript manager will pick up changes automatically if tampermonkey is in dev mode, or re-install the updated script.

### Adding a New Feature

1. Add any new UI elements in the `createUI()` function.
2. Implement the corresponding logic in a new function.
3. Wire the event handlers inside `createUI()`.

---

## FAQ

**Q: The panel doesn't appear on mypikpak.com.**
A: Make sure Tampermonkey is enabled for the site. Try refreshing the page and waiting a few seconds.

**Q: Credentials show "Click PikPak page to activate" forever.**
A: Reload the PikPak page and click around (navigate to a folder, etc.). The script hooks into network requests made by the PikPak app to capture credentials.

**Q: Rename fails with an error.**
A: Check the log panel for details. Common issues include rate limiting (increase the delay between requests) or insufficient permissions on the file.

**Q: Can I run this in a mobile browser?**
A: This script is designed for desktop browsers with userscript support. Mobile support is limited.

---

## License

This project is provided for personal and educational use. Use at your own risk.

---

## Repository

- **GitHub**: [https://github.com/karejame/pikpak-rename](https://github.com/karejame/pikpak-rename)
