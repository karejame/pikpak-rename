# PikPak Rename Pro

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-✔-informational)](https://www.tampermonkey.net/)
[![Version](https://img.shields.io/badge/version-6.0-blue)](https://github.com/karejame/pikpak-rename)

**PikPak Rename Pro** is a Tampermonkey userscript that adds a batch file renaming panel to the [PikPak](https://mypikpak.com/) cloud storage web interface. Rename files with regex find-and-replace and optional index appending — all without leaving your browser.

---

## Features

- **Regex find-and-replace** — search filenames using regular expressions and replace matches
- **Auto-numbering** — append a sequential index (`_01`, `_02`, …) to filenames
- **Keep extension** — optionally preserve file extensions during rename
- **Auto credential capture** — automatically extracts authentication credentials from PikPak's network requests (no manual token input)
- **Configurable delay** — set a base delay between rename requests with random jitter to avoid rate limiting
- **Draggable panel** — move the floating panel anywhere on screen
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
4. Set rename rules — enter a regex pattern in **Search** and replacement text in **Replace**.
5. (Optional) Check **Append index** to add sequential numbers, or uncheck **Keep extension** to strip extensions.
6. Click **Rename** to apply the batch rename.

### Rename Options

| Setting | Description |
|---------|-------------|
| **Search** | Regular expression pattern to search for in filenames (without extension) |
| **Replace** | Text to replace matches with (leave empty to delete matches) |
| **Append index** | Append `_01`, `_02`, … to each filename |
| **Keep extension** | Preserve the original file extension (checked by default) |
| **Delay** | Base delay in milliseconds between rename requests (random 0–600ms added) |

---

## Script Details

`pikpak-rename.user.js` is a single, self-contained JavaScript file (no dependencies, no build step). It works by:

1. **Hooking** into `fetch()` and `XMLHttpRequest` to capture PikPak's authentication credentials (Bearer token, device ID, captcha token, client ID, client version).
2. **Listing** files via the official PikPak Drive REST API (`api-drive.mypikpak.com`) with automatic pagination.
3. **Applying** the user-configured rename rules locally to compute new filenames.
4. **Executing** rename API calls with a configurable delay between requests to avoid rate limiting.

### Key Functions

| Function | Purpose |
|----------|---------|
| `hookFetch()` / `hookXHR()` | Intercept PikPak network requests to extract credentials |
| `fetchAllFiles()` | Paginate through all files in the current folder |
| `processName()` | Apply rename rules (regex replace, index appending, extension handling) |
| `renameFile()` | Call the PikPak API to rename a single file |
| `createUI()` | Build the entire floating panel UI dynamically |

### Credential Status

The panel displays a credential status badge:

- **Ready** — all credentials captured, script is ready to use
- **Missing: Token / DeviceId / CaptchaToken** — shows which credentials are still needed; click around in PikPak to trigger authenticated requests

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

**Q: Credentials show "Missing" forever.**
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
