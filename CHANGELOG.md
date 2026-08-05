# Changelog

All notable changes to PikPak Rename Pro will be documented in this file.

## [7.2] - 2025-06-01

### Infrastructure
- `apiFetch(method, path, opts)` — unified API caller replacing raw `gmRequest` in all write operations
- `deleteFiles(fileIds)` — batch DELETE via `POST /files:batchDelete`, 10 per batch, inter-batch delay
- `normalizeEntries()` now captures `size` field for duplicate detection

### Added (🔍 Duplicates tab)
- `detectDuplicates(files)` — groups files by `name|size` fingerprint, sorted by group size desc
- `renderDuplicates()` — grouped UI with first-file auto-preserved, duplicates pre-checked
- `executeDupDelete()` — confirmation dialog warns "cannot be undone", then batch deletes via `deleteFiles()`

### Added (⚡ Tasks tab)
- `fetchTasks()` — GET `/task?type=offline` with pagination, returns split by status (running/failed/done)
- `retryTask(taskId)` — POST single-task retry, not batchable
- `startTaskPolling(intervalMs)` / `stopTaskPolling()` — auto-refresh with `setInterval`, pauses on tab switch
- `renderTasks()` — shows progress bars for running, error messages for failed, Retry button per failed task

### Added (🎬 Media tab — Subtitle Match)
- `editDistance(a, b)` — Levenshtein distance for fuzzy subtitle-video matching
- `matchSubtitleToVideo(subName, videoFiles)` — exact match first, then fuzzy (threshold <= 3)
- `buildSubtitlePairs(files)` — returns `{ pairs, unmatched }` with confidence labels
- `renderMediaSubs()` / `executeSubRename(includeFuzzy)` — exact auto-checked, fuzzy unchecked

### Added (🎬 Media tab — Episode Norm)
- `parseEpisode(filename)` — regex-based extraction supporting 5 patterns (S01E01, Title - 01, 01of12, 第X話, etc.)
- `formatEpisode(parsed)` — configurable output via `pk-episode-format` localStorage key
- `renderMediaEpisode()` / `executeEpisodeNorm()` — preview + apply with checkboxes

### Added (🔗 Share tab — Batch Create)
- `createShare(fileId, opts)` — POST `/share` with expireDays & passcode options
- `batchCreateShares(fileIds, opts)` — max 20 per batch, per-file delay, returns results array
- `renderShareBatch()` / `executeShareBatch()` — file selection + link generation with Copy All

### Added (🔗 Share tab — Manager)
- `fetchMyShares()` — GET `/share`, returns array
- `deleteShare(shareId)` — DELETE `/share/{id}`, per-item delay
- `renderShareManager()` / `executeShareDelete()` — filterable list (All/Active/Expired), batch delete
- Support for filtering expired shares (red highlight), copying individual links

### Changed
- Tab order: Rename | Preview | History | Presets | 📁Classify | 🔍Duplicates | ⚡Tasks | 🎬Media | 🔗Share
- Media tab has two sub-tabs: Subtitle Match / Episode Norm via internal tab switcher
- All UI labels in English for international audience

## [7.1] - 2025-06-01

### Added (API layer)
- `moveFile(id, parentId)` — PATCH endpoint to move files between folders
- `findOrCreateFolder(name, parentId)` — scan existing subfolders first, create only if missing

### Added (Classify module)
- File auto-classifier with rule-based file organization
- Rule matching by: extension list, filename regex, file/folder kind
- Rule editor modal with live validation
- Classification preview, execution with configurable delay, independent history and rollback

### Added (Cleanup module)
- Duplicate file detection by name+size
- Empty folder scanning (1 level deep)
- `trashFile()` soft-delete to PikPak trash

### Changed
- Tab order introduced for international audience
- Classify tab gets its own Scan Folder button

## [7.0] - 2025-01-15

### Added
- Multi-step rename pipeline with regex find-and-replace
- Filter by file type, extension, and name pattern
- Case conversion, auto-numbering, prefix/suffix
- Preview, pause/cancel, history rollback, preset management
- Credential auto-capture via fetch/XHR hooking
- Initial public release
