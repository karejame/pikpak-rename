# Contributing to PikPak Rename Pro

Thank you for your interest! Here's how you can help.

## Reporting Issues

- **Bug report** — open an issue with the bug report template
- **Feature request** — open an issue with the feature request template
- Include your browser version, userscript manager, and any error messages from the panel's log

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Edit `pikpak-rename.user.js` — this is a single-file project
4. Test your changes on PikPak web interface
5. Submit a pull request

## Code Style

- Vanilla JavaScript (no build tools, no dependencies)
- Use `const` / `let` (no `var`)
- 4-space indentation
- Descriptive function and variable names
- Keep UI additions in the `createUI()` function
- Add new logic in dedicated functions

## Development Setup

1. Install Tampermonkey or Violentmonkey
2. Install the script from your local file (or use Tampermonkey's dev mode)
3. Make changes to `pikpak-rename.user.js`
4. Reload `mypikpak.com` to see changes

## Before Submitting

- Test with both small and large file lists
- Verify the preview shows correct results
- Check that rollback (undo) works correctly
- Ensure no console errors
