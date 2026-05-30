# PikPak Rename Pro 

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-✔-informational)](https://www.tampermonkey.net/)
[![Version](https://img.shields.io/badge/version-7.0-blue)](https://github.com/karejame/pikpak-rename)

**PikPak Rename Pro** is a Tampermonkey userscript that adds a powerful batch file renaming panel to the [PikPak](https://mypikpak.com/) cloud storage web interface. Rename hundreds of files in seconds with regex find-and-replace, case conversion, auto-numbering, and more — all without leaving your browser.

---

## Features

- **Multi-step rename pipeline** — chain multiple find-and-replace rules using regular expressions
- **Filter by type** — target only files or only folders, or filter by file extension and name pattern
- **Case conversion** — transform filenames to UPPER, lower, or Title Case
- **Auto-numbering** — add sequential numbers with configurable format (01, 001, A, B, C, a, b, c), separator, start value, and step
- **Prefix / Suffix** — prepend or append text to filenames
- **Preview before executing** — see the full list of changes before they take effect
- **Pause / Cancel** — control the rename process mid-execution
- **Rename history** — view past rename operations and roll back (undo) any of them
- **Preset management** — save and load rename configurations; export/import presets as JSON
- **Copy logs** — copy the operation log to clipboard for record-keeping

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
2. Click the **Scan** button in the rename panel to load all files in the current folder.
3. (Optional) Set filters to target specific files.
4. Add rename rules — for example, replace spaces with underscores.
5. Click **Preview** to verify the changes.
6. Click **Execute** to apply the renaming.

### Rename Pipeline

Each rename step is a find-and-replace operation:

| Setting | Description |
|---------|-------------|
| **Find** | Text or regex pattern to search for |
| **Replace** | Text to replace matches with |
| **Enable** | Checkbox to toggle this step on/off |

Steps are executed in order from top to bottom.

### Auto-numbering Options

| Option | Values |
|--------|--------|
| Format | `01` / `001` / `A` / `B` / `C` / `a` / `b` / `c` / None |
| Position | Before name / After name |
| Separator | e.g. `_`, `-`, space |
| Start at | Custom starting number |
| Step | Increment between numbers |

### Filters

- **Extension** — e.g. `.jpg`, `.mp4` (leave empty for all)
- **Kind** — All / File / Folder
- **Name contains** — substring filter

---

## Script Details

`pikpak-rename.user.js` is a single, self-contained JavaScript file (no dependencies, no build step). It works by:

1. **Hooking** into `fetch()` and `XMLHttpRequest` to capture PikPak's authentication credentials (Bearer token, device ID, captcha token).
2. **Listing** files via the official PikPak Drive REST API (`api-drive.mypikpak.com`) with automatic pagination.
3. **Applying** the user-configured rename pipeline locally to compute new filenames.
4. **Executing** rename API calls with a configurable delay between requests to avoid rate limiting.
5. **Storing** operation history in `localStorage` for later rollback.

### Key Functions

| Function | Purpose |
|----------|---------|
| `hookFetch()` / `hookXHR()` | Intercept PikPak network requests to extract credentials |
| `fetchAllFiles()` | Paginate through all files in the current folder |
| `processName()` | Apply the rename pipeline (regex, case, prefix/suffix, numbering) |
| `renameFile()` | Call the PikPak API to rename a single file |
| `handleRollback()` | Reverse a previous rename operation using stored history |
| `createUI()` | Build the entire floating panel UI dynamically |

### Credential Status

The panel displays a credential status badge:

- ✅ **Ready** — all credentials captured, script is ready to use
- ⏳ **Waiting** — still capturing credentials; refresh the page if it persists

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

**Q: Credentials show "Waiting" forever.**  
A: Reload the PikPak page. The script hooks into network requests made by the PikPak app.

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
