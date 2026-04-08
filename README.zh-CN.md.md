# PikPak Rename Pro

> A reliable batch renamer for PikPak with zero manual auth.

Batch rename files on PikPak via browser script.

------------------------------------------------------------------------

## Features

-   Batch rename
-   RegExp replace
-   Auto auth (no manual token)
-   Optional index suffix
-   Adjustable delay (anti-rate-limit)

------------------------------------------------------------------------

## Install

1.  Install Tampermonkey\
2.  Add this script\
3.  Open https://mypikpak.com/

------------------------------------------------------------------------

## Usage

1.  Open target folder\
2.  Click around page → wait until status = `Ready`\
3.  Click `Scan`\
4.  Configure:
    -   `Search`: RegExp
    -   `Replace`: replacement (empty = remove)
5.  Click `Rename`

------------------------------------------------------------------------

## Example

    Search:  S01E(\d+)
    Replace: Episode_$1

------------------------------------------------------------------------

## Notes

-   Must reach `Ready` before use\
-   Recommended delay: `1000–2000 ms`\
-   Invalid RegExp will throw error\
-   Large batches run sequentially (by design)

------------------------------------------------------------------------

## Dev Hint

Hooks `fetch` / `XMLHttpRequest` to extract auth headers and uses
`GM_xmlhttpRequest` for API calls.

------------------------------------------------------------------------

## License

For personal use only.
