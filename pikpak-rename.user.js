// ==UserScript==
// @name         PikPak Rename Pro
// @namespace    pikpak-pro
// @version      7.1
// @description  Batch rename & auto-classify files on PikPak with multi-step pipeline, preview, presets, history rollback, and advanced naming options.
// @match        https://mypikpak.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api-drive.mypikpak.com
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = 'v7.1';
    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const API = 'https://api-drive.mypikpak.com/drive/v1';
    const CREDS = { token: '', deviceId: '', captchaToken: '', clientId: '', clientVersion: '' };

    // ===== Language =====
    let lang = localStorage.getItem('pk-lang') || 'en';
    const L10N = {
        en: {
            tabRename: 'Rename', tabOrganize: 'Organize', tabTasks: 'Tasks', tabShare: 'Share',
            subRename: 'Rename', subPreview: 'Preview', subHistory: 'History', subPresets: 'Presets',
            subClassify: 'Classify', subDup: 'Duplicates', subMedia: 'Media',
            scan: 'Scan', preview: 'Preview', execute: 'Execute', stop: 'Stop', pause: 'Pause', resume: 'Resume',
            delete: 'Delete', cancel: 'Cancel', save: 'Save', apply: 'Apply', retry: 'Retry', copy: 'Copy',
            edit: 'Edit',
            delay: 'Delay', file: 'File', folder: 'Folder', allTypes: 'All',
            danger: 'Destructive — cannot be undone',
            warning: 'Irreversible',
            noFiles: 'No files loaded. Click Scan to start.',
            noRules: 'No rules yet. Click +Add to create one.',
            langToggle: '中文',
            ready: 'Ready',
            scanning: 'Scanning...',
            processing: 'Working...',
            done: 'Done',
            error: 'Error',
            ok: 'OK',
            fail: 'Failed',
            skip: 'Skipped',
            highlight: 'Info',
            rename: 'Rename',
            filter: 'Filter',
            naming: 'Name options',
            search_: 'Find what',
            replace_: 'Replace with',
            noHistory: 'No rename history yet',
            noPresets: 'No saved presets yet',
            presetName: 'Name your preset',
            load: 'Load',
            savedPreset: 'Preset saved',
            logCopied: 'Log copied to clipboard',
            folderSwitched: 'Folder changed, cache cleared',
            scanFirst: 'Please scan a folder first',
            noFilesToRename: 'No files to rename. Scan or adjust filters.',
            progress: 'Progress',
            elapsed: 'Time',
            userCancelled: 'Cancelled',
            paused_: 'Paused',
            resumed_: 'Resumed',
            noChange: 'Same name, skipped',
            confirmClear: 'Clear all rename history?',
            historyCleared: 'History cleared',
            loaded: 'Loaded',
            confirmRollback: 'Undo rename for %n file(s)?',
            rollingBack: 'Undoing %n file rename(s)...',
            rollbackDone: 'Undone. Restored',
            exportDone: 'Presets copied to clipboard',
            importPrompt: 'Paste preset JSON here:',
            importSuccess: 'Presets imported',
            importFail: 'Import failed',
            undo: 'Undo',
            confirmDeleteDup: 'Delete selected duplicate(s)? This cannot be undone.',
            noDupSelected: 'No duplicates selected',
            batchShareWarn: 'Batch sharing uses your daily quota',
            statusRenaming: 'Renaming...',
            statusPaused: 'Paused',
            statusDone: 'Done — %ok% OK, %fail% failed',
            classifying: 'Classifying...',
            classifyDone: 'Done — %ok% moved, %fail% failed',
            steps: 'Find & Replace steps',
            addStep: 'Add step',
            extFilter: 'File type (e.g. .mp4,.mkv)',
            nameFilter: 'Name contains',
            prefix: 'Prefix',
            suffix: 'Suffix',
            caseOpt: 'Change case',
            indexOpt: 'Add number',
            indexAfter: 'After name',
            indexBefore: 'Before name',
            keepExt: 'Keep extension',
            delayMs: 'Delay between operations (ms)',
            confirmClearAll: 'Clear all logs?',
            logCleared: 'Logs cleared',
            loadPreset: 'Load preset',
            deletePreset: 'Delete preset',
            autoRefresh: 'Auto-refresh',
            intervalSec: 'Interval (s)',
            classifyRules: 'Classification rules',
            classifyScan: 'Scan current folder',
            classifyPreview: 'Test rules',
            classifyRun: 'Run classification',
            dupScan: 'Find duplicates',
            dupDelete: 'Delete selected',
            mediaSubs: 'Subtitle matcher',
            mediaEpisode: 'Episode normalizer',
            subMatch: 'Match subtitles',
            epMatch: 'Normalize episodes',
            applyExact: 'Apply (exact match)',
            applyFuzzy: 'Apply (incl. fuzzy)',
            shareBatch: 'Batch share files',
            shareManage: 'My shares',
            expireIn: 'Expires in',
            passcode: 'Password',
            genLinks: 'Generate links',
            filterAll: 'All',
            filterActive: 'Active',
            filterExpired: 'Expired',
            statusReady: 'Ready',
            copyLog: 'Copy log',
            clearLog: 'Clear log',
            exportPresets: 'Export presets',
            importPresets: 'Import presets',
            importPrompt: 'Paste preset JSON:',
            classifyRule: 'Rule name',
            classifyExts: 'Extensions (e.g. .mp4,.mkv)',
            classifyRegex: 'Filename regex (optional)',
            classifyKind: 'Type',
            classifyFolder: 'Target folder',
            subNoPairs: 'No subtitle-video pairs found',
            subUnmatched: 'Unmatched subs',
            subExactFuzzy: 'Exact',
            subConfirmRename: 'Rename selected subtitles?',
            classifyNoRules: 'No rules enabled',
            classifyNoMatch: 'No files matched any rule',
            classifyFolderErr: 'Could not create target folders',
            classifyProgress: 'Classifying',
            filteredCount: 'Filtered',
            daysShort: 'days',
            presetRemoveSpaces: 'Remove spaces',
            presetAddNumber: 'Add number prefix',
            presetUpperCase: 'To UPPER CASE',
            alreadyScanning: 'Already scanning',
            scanError: 'Scan error',
            noFilesSelected: 'No files selected',
            batchDeleteSent: 'Batch delete sent',
            failedToLoadTasks: 'Failed to load tasks',
            retrySubmitted: 'Retry submitted for task',
            noSharesSelected: 'No shares selected',
            max20Shares: 'Maximum 20 shares per batch',
            confirmDeleteNShares: 'Delete {n} share link(s)?',
            deletingNShares: 'Deleting {n} share link(s)...',
            shareDeleted: 'Deleted',
            undoClassify: 'Undoing classification ({n} files)...',
            failedLoadShares: 'Failed to load shares',
            linkCopied: 'Link copied',
            statusMissingClick: 'Click PikPak page to activate',
            movingFiles: 'Moving files...',
        },
        zh: {
            tabRename: '重命名', tabOrganize: '整理', tabTasks: '任务', tabShare: '分享',
            subRename: '重命名', subPreview: '预览', subHistory: '历史', subPresets: '预设',
            subClassify: '分类', subDup: '去重', subMedia: '媒体',
            scan: '扫描', preview: '预览', execute: '执行', stop: '停止', pause: '暂停', resume: '继续',
            delete: '删除', cancel: '取消', save: '保存', apply: '应用', retry: '重试', copy: '复制',
            edit: '编辑',
            delay: '延迟', file: '文件', folder: '文件夹', allTypes: '全部',
            danger: '危险操作 — 不可撤销',
            warning: '不可逆',
            noFiles: '暂无文件，请先点击扫描',
            noRules: '暂无规则，点击 +添加 创建',
            langToggle: 'English',
            ready: '就绪',
            scanning: '扫描中...',
            processing: '处理中...',
            done: '完成',
            error: '出错',
            ok: '成功',
            fail: '失败',
            skip: '跳过',
            highlight: '信息',
            rename: '重命名',
            filter: '筛选',
            naming: '命名选项',
            search_: '查找内容',
            replace_: '替换为',
            noHistory: '暂无重命名历史记录',
            noPresets: '暂无保存的预设',
            presetName: '输入预设名称',
            load: '加载',
            savedPreset: '预设已保存',
            logCopied: '日志已复制到剪贴板',
            folderSwitched: '文件夹已切换，缓存已清空',
            scanFirst: '请先扫描文件夹',
            noFilesToRename: '没有可重命名的文件，请先扫描或调整筛选',
            progress: '进度',
            elapsed: '耗时',
            userCancelled: '已取消',
            paused_: '已暂停',
            resumed_: '继续',
            noChange: '原名相同，已跳过',
            confirmClear: '确认清空所有重命名历史？',
            historyCleared: '历史已清空',
            loaded: '已加载',
            confirmRollback: '确认撤销 %n 个文件的改名？',
            rollingBack: '正在撤销 %n 个文件的改名...',
            rollbackDone: '撤销完成，已恢复',
            exportDone: '预设已复制到剪贴板',
            importPrompt: '请粘贴预设 JSON：',
            importSuccess: '预设导入成功',
            importFail: '导入失败',
            undo: '撤销',
            confirmDeleteDup: '确认删除选中的重复文件？此操作不可撤销。',
            noDupSelected: '未选中任何重复文件',
            batchShareWarn: '批量分享可能消耗当日配额',
            statusRenaming: '重命名中...',
            statusPaused: '已暂停',
            statusDone: '完成 — %ok% 成功，%fail% 失败',
            classifying: '分类中...',
            classifyDone: '完成 — %ok% 移动成功，%fail% 失败',
            steps: '查找替换步骤',
            addStep: '添加步骤',
            extFilter: '文件类型，如 .mp4,.mkv',
            nameFilter: '文件名包含',
            prefix: '前缀',
            suffix: '后缀',
            caseOpt: '大小写转换',
            indexOpt: '添加编号',
            indexAfter: '名后',
            indexBefore: '名前',
            keepExt: '保留扩展名',
            delayMs: '每次操作间隔（毫秒）',
            confirmClearAll: '确认清空所有日志？',
            logCleared: '日志已清空',
            loadPreset: '加载预设',
            deletePreset: '删除预设',
            autoRefresh: '自动刷新',
            intervalSec: '间隔（秒）',
            classifyRules: '分类规则',
            classifyScan: '扫描当前文件夹',
            classifyPreview: '测试规则',
            classifyRun: '执行分类',
            dupScan: '查找重复',
            dupDelete: '删除选中',
            mediaSubs: '字幕匹配',
            mediaEpisode: '剧集标准化',
            subMatch: '匹配字幕',
            epMatch: '标准化剧集',
            applyExact: '应用（精确匹配）',
            applyFuzzy: '应用（含模糊匹配）',
            shareBatch: '批量分享文件',
            shareManage: '我的分享',
            expireIn: '有效期',
            passcode: '提取码',
            genLinks: '生成链接',
            filterAll: '全部',
            filterActive: '有效',
            filterExpired: '已过期',
            statusReady: '就绪',
            copyLog: '复制日志',
            clearLog: '清空日志',
            exportPresets: '导出预设',
            importPresets: '导入预设',
            importPrompt: '请粘贴预设 JSON：',
            classifyRule: '规则名称',
            classifyExts: '扩展名（如 .mp4,.mkv）',
            classifyRegex: '文件名正则（可选）',
            classifyKind: '匹配类型',
            classifyFolder: '目标文件夹',
            subNoPairs: '未找到字幕-视频匹配对',
            subUnmatched: '未匹配字幕',
            subExactFuzzy: '精确',
            subConfirmRename: '确认重命名选中的字幕？',
            classifyNoRules: '没有启用的规则',
            classifyNoMatch: '没有文件匹配任何规则',
            classifyFolderErr: '无法创建目标文件夹',
            classifyProgress: '分类中',
            filteredCount: '已筛选',
            daysShort: '天',
            presetRemoveSpaces: '去掉空格',
            presetAddNumber: '添加编号前缀',
            presetUpperCase: '转大写字母',
            alreadyScanning: '正在扫描中，请稍候',
            scanError: '扫描出错',
            noFilesSelected: '未选择任何文件',
            batchDeleteSent: '批量删除已发送',
            failedToLoadTasks: '加载任务失败',
            retrySubmitted: '重试任务已提交',
            noSharesSelected: '未选择任何分享',
            max20Shares: '每批最多 20 个分享',
            confirmDeleteNShares: '删除 {n} 个分享链接？',
            deletingNShares: '删除 {n} 个分享链接中...',
            shareDeleted: '已删除',
            undoClassify: '撤销分类中（{n} 个文件）...',
            failedLoadShares: '加载分享列表失败',
            linkCopied: '链接已复制',
            statusMissingClick: '点击 PikPak 页面激活',
            movingFiles: '正在移动文件...',
        },
    };
    function t(key) { return (L10N[lang] || L10N.en)[key] || key; }
    function toggleLang() { lang = lang === 'en' ? 'zh' : 'en'; localStorage.setItem('pk-lang', lang); }

    function extractHeaders(headers) {
        if (!headers) return;
        const pairs = [];
        if (headers instanceof pageWindow.Headers || headers instanceof Headers)
            headers.forEach((value, key) => pairs.push([String(key).toLowerCase(), value]));
        else if (Array.isArray(headers))
            headers.forEach(([key, value]) => pairs.push([String(key).toLowerCase(), value]));
        else if (typeof headers === 'object')
            Object.keys(headers).forEach(key => pairs.push([key.toLowerCase(), headers[key]]));
        for (const [key, value] of pairs) {
            if (typeof value !== 'string') continue;
            if (key === 'authorization' && value.startsWith('Bearer ')) CREDS.token = value.slice(7);
            else if (key === 'x-device-id') CREDS.deviceId = value;
            else if (key === 'x-captcha-token') CREDS.captchaToken = value;
            else if (key === 'x-client-id') CREDS.clientId = value;
            else if (key === 'x-client-version') CREDS.clientVersion = value;
        }
    }

    function hookFetch() {
        const originalFetch = pageWindow.fetch;
        if (typeof originalFetch !== 'function') return;
        pageWindow.fetch = async function (...args) {
            try {
                const [input, init] = args;
                if (input && typeof input === 'object' && 'headers' in input) extractHeaders(input.headers);
                if (init && init.headers) extractHeaders(init.headers);
            } catch (_) {}
            return originalFetch.apply(this, args);
        };
    }

    function hookXHR() {
        const proto = pageWindow.XMLHttpRequest && pageWindow.XMLHttpRequest.prototype;
        if (!proto || typeof proto.setRequestHeader !== 'function') return;
        const originalSetRequestHeader = proto.setRequestHeader;
        proto.setRequestHeader = function (key, value) {
            try { extractHeaders({ [key]: value }); } catch (_) {}
            return originalSetRequestHeader.apply(this, arguments);
        };
    }

    async function apiFetch(method, path, { body, params } = {}) {
        if (!credsReady()) throw new Error('Credentials not ready. Click around PikPak first.');
        let url = `${API}${path}`;
        if (params) url += '?' + new URLSearchParams(params).toString();
        const response = await gmRequest(method, url, {
            headers: buildHeaders(!!body),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (response.status >= 200 && response.status < 300) return parseJsonResponse(response);
        throw new Error(`HTTP ${response.status}: ${response.responseText || 'Request failed'}`);
    }

    function buildHeaders(includeJsonBody = false) {
        const headers = { Accept: 'application/json' };
        if (includeJsonBody) headers['Content-Type'] = 'application/json';
        if (CREDS.token) headers.Authorization = `Bearer ${CREDS.token}`;
        if (CREDS.deviceId) headers['X-Device-Id'] = CREDS.deviceId;
        if (CREDS.captchaToken) headers['X-Captcha-Token'] = CREDS.captchaToken;
        if (CREDS.clientId) headers['X-Client-Id'] = CREDS.clientId;
        if (CREDS.clientVersion) headers['X-Client-Version'] = CREDS.clientVersion;
        return headers;
    }

    function credsReady() { return Boolean(CREDS.token && CREDS.deviceId && CREDS.captchaToken); }

    function credsStatus() {
        if (credsReady()) return 'Ready';
        return t('statusMissingClick');
    }

    function gmRequest(method, url, { headers = {}, body } = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method, url, headers, data: body, responseType: 'text', timeout: 30000,
                onload: response => resolve(response),
                onerror: error => reject(new Error(`Network error: ${error?.error || 'unknown'}`)),
                ontimeout: () => reject(new Error('Request timed out')),
            });
        });
    }

    function parseJsonResponse(response) {
        const text = response.responseText || '';
        if (!text) return {};
        try { return JSON.parse(text); } catch (_) { throw new Error(`Invalid JSON response (HTTP ${response.status})`); }
    }

    function getParentId() {
        const href = String(pageWindow.location.href || '');
        const pathname = String(pageWindow.location.pathname || '');
        const hash = String(pageWindow.location.hash || '');
        const patterns = [/folder\/([A-Za-z0-9_-]+)/, /\/drive\/all\/([A-Za-z0-9_-]+)/, /parent_id=([A-Za-z0-9_-]+)/];
        for (const source of [href, pathname, hash])
            for (const pattern of patterns) {
                const match = source.match(pattern);
                if (match) return match[1];
            }
        return '';
    }

    function normalizeEntries(data) {
        const rawEntries = Array.isArray(data?.files) ? data.files : [];
        return rawEntries.filter(entry => entry && entry.id && entry.name).map(entry => ({
            id: entry.id, name: entry.name, kind: entry.kind || entry.type || 'unknown',
            size: entry.size ? Number(entry.size) : 0,
        }));
    }

    async function fetchAllFiles(parentId) {
        if (!credsReady()) throw new Error('Credentials not ready. Click around PikPak first.');
        const files = [];
        let pageToken = '';
        do {
            const params = new URLSearchParams({ page_size: '100' });
            if (parentId) params.set('parent_id', parentId);
            if (pageToken) params.set('page_token', pageToken);
            const response = await gmRequest('GET', `${API}/files?${params.toString()}`, { headers: buildHeaders() });
            if (response.status < 200 || response.status >= 300)
                throw new Error(`HTTP ${response.status}: ${response.responseText || 'Request failed'}`);
            const data = parseJsonResponse(response);
            normalizeEntries(data).forEach(file => files.push(file));
            pageToken = data.next_page_token || '';
        } while (pageToken);
        return files;
    }

    async function renameFile(id, newName) {
        await apiFetch('PATCH', `/files/${id}`, { body: { name: newName } });
    }

    async function moveFile(id, parentId) {
        await apiFetch('PATCH', `/files/${id}`, { body: { parent_id: parentId } });
    }

    async function findOrCreateFolder(folderName, parentId) {
        if (!folderName) throw new Error('Folder name is required');
        const allFiles = await fetchAllFiles(parentId);
        const existing = allFiles.find(f => f.kind === 'folder' && f.name === folderName);
        if (existing) return existing.id;
        const data = await apiFetch('POST', '/files', { body: { kind: 'drive#folder', name: folderName, parent_id: parentId } });
        return data.file?.id || data.id;
    }

    async function trashFile(id) {
        await apiFetch('PATCH', `/files/${id}`, { body: { trashed: true } });
    }

    async function deleteFiles(fileIds) {
        const BATCH_SIZE = 10;
        const delay = Number(panel?.querySelector('#pk-dup-delay')?.value) || 1000;
        for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
            await apiFetch('POST', '/files:batchDelete', { body: { ids: fileIds.slice(i, i + BATCH_SIZE) } });
            if (i + BATCH_SIZE < fileIds.length) await sleep(delay + Math.random() * 300);
        }
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    function processName(filename, index, config) {
        const dot = filename.lastIndexOf('.');
        let name = dot === -1 ? filename : filename.slice(0, dot);
        const ext = dot === -1 ? '' : filename.slice(dot);

        for (const step of config.steps) {
            if (!step.enabled || !step.search) continue;
            try { name = name.replace(new RegExp(step.search, 'g'), step.replace); }
            catch (error) { throw new Error(`Invalid regex in step "${step.search}": ${error.message}`); }
        }

        if (config.prefix) name = config.prefix + name;
        if (config.suffix) name = name + config.suffix;

        switch (config.caseType) {
            case 'upper': name = name.toUpperCase(); break;
            case 'lower': name = name.toLowerCase(); break;
            case 'title': name = name.replace(/\b\w/g, c => c.toUpperCase()); break;
        }

        if (config.useIndex) {
            let idx = String(config.indexStart + index * config.indexStep);
            if (config.indexFormat === '01') idx = idx.padStart(2, '0');
            else if (config.indexFormat === '001') idx = idx.padStart(3, '0');
            else if (config.indexFormat === 'A') idx = String.fromCharCode(65 + (index % 26));
            else if (config.indexFormat === 'a') idx = String.fromCharCode(97 + (index % 26));
            if (config.indexPos === 'before') {
                name = idx + config.indexSep + name;
            } else {
                name = name + config.indexSep + idx;
            }
        }

        return config.keepExt ? name + ext : name;
    }

    let panel, currentTab = 'rename';
    let cachedFiles = [];
    let isScanning = false, isRenaming = false, cancelRenaming = false;
    let paused = false, resolvePause = null;
    let currentFolderId = '', lastFolderId = '';
    let steps = [{ search: '', replace: '', enabled: true }];
    let classifyRules = JSON.parse(localStorage.getItem('pk-classify-rules') || '[]');
    let isClassifying = false, cancelClassifying = false;
    let classifyPaused = false, resolveClassifyPause = null;

    function log(message, type) {
        const box = panel.querySelector('#pklog');
        const colorMap = {
            ok: '#389e0d', fail: '#cf1322', skip: '#8c8c8c',
            error: '#d46b08', highlight: '#1890ff', info: '#595959',
        };
        const div = document.createElement('div');
        div.style.color = colorMap[type] || '#595959';
        div.style.lineHeight = '1.6';
        div.textContent = message;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    function clearLog() {
        const box = panel.querySelector('#pklog');
        box.innerHTML = '';
    }

    function copyLog() {
        const box = panel.querySelector('#pklog');
        const text = Array.from(box.children).map(d => d.textContent).join('\n');
        navigator.clipboard.writeText(text).then(() => log(`${t('done')} — ${t('copy')}`, 'highlight')).catch(() => {});
    }

    function makeDraggable(element) {
        let dragging = false, offsetX = 0, offsetY = 0;
        const handle = element.querySelector('#pkhandle');
        const onMouseMove = (event) => {
            if (!dragging) return;
            element.style.left = `${event.clientX - offsetX}px`;
            element.style.top = `${event.clientY - offsetY}px`;
        };
        const onMouseUp = () => {
            if (!dragging) return;
            dragging = false;
            const left = parseInt(element.style.left, 10) || 0;
            const top = parseInt(element.style.top, 10) || 0;
            localStorage.setItem('pk-panel-pos', JSON.stringify({ left, top }));
        };
        handle.onmousedown = (event) => {
            dragging = true;
            offsetX = event.clientX - element.offsetLeft;
            offsetY = event.clientY - element.offsetTop;
            event.preventDefault();
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        element._pkCleanup = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }

    function getFilter() {
        const extFilter = panel.querySelector('#pk-ext-filter').value.trim();
        const kindFilter = panel.querySelector('#pk-kind-filter').value;
        const nameFilter = panel.querySelector('#pk-name-filter').value.trim().toLowerCase();
        return {
            exts: extFilter ? extFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : null,
            kind: kindFilter === 'all' ? null : kindFilter,
            namePattern: nameFilter || null,
        };
    }

    function matchesFilter(file, filter) {
        if (filter.exts && filter.exts.length) {
            const dot = file.name.lastIndexOf('.');
            const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
            if (!filter.exts.some(e => ext === e || ext === '.' + e)) return false;
        }
        if (filter.kind && file.kind !== filter.kind) return false;
        if (filter.namePattern && !file.name.toLowerCase().includes(filter.namePattern)) return false;
        return true;
    }

    function getFilteredFiles() {
        const filter = getFilter();
        return filter.exts || filter.kind || filter.namePattern ? cachedFiles.filter(f => matchesFilter(f, filter)) : cachedFiles;
    }

    function getConfig() {
        const stepEls = panel.querySelectorAll('.pk-step');
        const configSteps = [];
        stepEls.forEach(el => {
            configSteps.push({
                search: el.querySelector('.pk-step-search').value,
                replace: el.querySelector('.pk-step-replace').value,
                enabled: el.querySelector('.pk-step-enable').checked,
            });
        });
        return {
            steps: configSteps.length ? configSteps : [{ search: '', replace: '', enabled: true }],
            prefix: panel.querySelector('#pk-prefix').value,
            suffix: panel.querySelector('#pk-suffix').value,
            caseType: panel.querySelector('#pk-case').value,
            useIndex: panel.querySelector('#pk-index-enable').checked,
            indexPos: panel.querySelector('#pk-index-pos').value,
            indexFormat: panel.querySelector('#pk-index-format').value,
            indexSep: panel.querySelector('#pk-index-sep').value,
            indexStart: Number(panel.querySelector('#pk-index-start').value) || 1,
            indexStep: Number(panel.querySelector('#pk-index-step').value) || 1,
            keepExt: panel.querySelector('#pk-keep-ext').checked,
            delay: Number(panel.querySelector('#pk-delay').value) || 1500,
        };
    }

    function applyConfig(config) {
        const stepContainer = panel.querySelector('#pk-steps');
        stepContainer.innerHTML = '';
        steps = config.steps.length ? config.steps.map(s => ({ ...s })) : [{ search: '', replace: '', enabled: true }];
        renderSteps();
        panel.querySelector('#pk-prefix').value = config.prefix || '';
        panel.querySelector('#pk-suffix').value = config.suffix || '';
        panel.querySelector('#pk-case').value = config.caseType || 'none';
        panel.querySelector('#pk-index-enable').checked = !!config.useIndex;
        panel.querySelector('#pk-index-pos').value = config.indexPos || 'after';
        panel.querySelector('#pk-index-format').value = config.indexFormat || '01';
        panel.querySelector('#pk-index-sep').value = config.indexSep || '_';
        panel.querySelector('#pk-index-start').value = config.indexStart || 1;
        panel.querySelector('#pk-index-step').value = config.indexStep || 1;
        panel.querySelector('#pk-keep-ext').checked = config.keepExt !== false;
        panel.querySelector('#pk-delay').value = config.delay || 1500;
    }

    function renderSteps() {
        const container = panel.querySelector('#pk-steps');
        container.innerHTML = '';
        steps.forEach((step, i) => {
            const el = document.createElement('div');
            el.className = 'pk-step';
            el.style.cssText = 'display:flex;gap:4px;align-items:center;margin-bottom:4px';
            el.innerHTML = `
                <input type="checkbox" class="pk-step-enable" ${step.enabled ? 'checked' : ''} style="accent-color:#1890ff;margin:0;flex-shrink:0">
                <input class="pk-step-search" value="${step.search.replace(/"/g, '&quot;')}" placeholder="${t('search_')}" style="flex:2;min-width:0;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit">
                <input class="pk-step-replace" value="${step.replace.replace(/"/g, '&quot;')}" placeholder="${t('replace_')}" style="flex:1;min-width:0;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px 6px;font-size:12px;font-family:inherit">
                <button class="pk-step-remove" title="${t('delete')}" style="background:none;border:none;color:#ff4d4f;cursor:pointer;font-size:16px;line-height:1;padding:0 2px;flex-shrink:0">×</button>
            `;
            el.querySelector('.pk-step-enable').onchange = function () { steps[i].enabled = this.checked; };
            el.querySelector('.pk-step-search').oninput = function () { steps[i].search = this.value; };
            el.querySelector('.pk-step-replace').oninput = function () { steps[i].replace = this.value; };
            el.querySelector('.pk-step-remove').onclick = () => {
                steps.splice(i, 1);
                renderSteps();
            };
            container.appendChild(el);
        });
    }

    function getKindStats(files) {
        const stats = {};
        files.forEach(f => { stats[f.kind] = (stats[f.kind] || 0) + 1; });
        return stats;
    }

    function updateFileCount() {
        const filtered = getFilteredFiles();
        const total = cachedFiles.length;
        const el = panel.querySelector('#pkcount');
        if (filtered.length === total) {
            el.textContent = `${total} ${t('file')}(s)`;
        } else {
            el.textContent = `${total} ${t('file')}(s) (${t('filteredCount')}: ${filtered.length})`;
        }
    }

    function showTab(tab) {
        currentTab = tab;
        panel.querySelectorAll('.pk-tab').forEach(b => {
            const active = b.dataset.tab === tab;
            b.style.background = active ? '#e6f7ff' : '#fafafa';
            b.style.color = active ? '#1890ff' : '#8c8c8c';
            b.style.fontWeight = active ? '600' : '400';
            b.style.borderBottom = active ? '2px solid #1890ff' : '2px solid transparent';
        });
        panel.querySelectorAll('.pk-tab-content').forEach(c => c.style.display = c.id === `pk-tab-${tab}` ? 'block' : 'none');
        if (tab === 'rename') { renderPreview(); renderHistory(); renderPresets(); }
        if (tab === 'organize') { renderClassifyRules(); renderClassifyHistory(); renderDuplicates(); renderMediaSubs(); renderMediaEpisode(); }
        if (tab === 'tasks') renderTasks();
        if (tab === 'share') { renderShareBatch(); renderShareManager(); }
    }

    function renderPreview() {
        const container = panel.querySelector('#pk-preview-list');
        const summary = panel.querySelector('#pk-preview-summary');
        const filtered = getFilteredFiles();
        if (!filtered.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noFiles') + '</div>';
            summary.textContent = '';
            return;
        }
        const config = getConfig();
        let changed = 0, skipped = 0, errors = 0;
        const items = [];
        filtered.forEach((file, i) => {
            try {
                const newName = processName(file.name, i, config);
                if (newName === file.name) { skipped += 1; }
                else { changed += 1; items.push({ old: file.name, new: newName }); }
            } catch (e) { errors += 1; }
        });
        summary.textContent = `${t('rename')}: ${changed}  |  ${t('skip')}: ${skipped}${errors ? `  |  ${t('error')}: ${errors}` : ''}`;
        container.innerHTML = '';
        const maxShow = 200;
        items.slice(0, maxShow).forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:3px 6px;font-size:12px;border-bottom:1px solid #f0f0f0';
            div.innerHTML = `<span style="color:#8c8c8c">${item.old}</span> <span style="color:#d9d9d9">→</span> <span style="color:#1890ff;font-weight:500">${item.new}</span>`;
            container.appendChild(div);
        });
        if (items.length > maxShow) {
            const more = document.createElement('div');
            more.style.cssText = 'padding:6px;font-size:12px;color:#8c8c8c;text-align:center';
            more.textContent = `...${items.length - maxShow} ${t('file')}(s), ${changed} ${t('rename')}`;
            container.appendChild(more);
        }
    }

    function renderHistory() {
        const container = panel.querySelector('#pk-history-list');
        const history = JSON.parse(localStorage.getItem('pk-rename-history') || '[]');
        if (!history.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noHistory') + '</div>';
            return;
        }
        container.innerHTML = '';
        history.slice().reverse().forEach((op, ri) => {
            const div = document.createElement('div');
            div.style.cssText = 'border:1px solid #e8e8e8;border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px;background:#fafafa';
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                    <span style="color:#8c8c8c">${new Date(op.timestamp).toLocaleString()}</span>
                    <span style="color:#595959">${t('ok')}: <b style="color:#389e0d">${op.ok}</b>  ${t('skip')}: <b style="color:#8c8c8c">${op.skip}</b>  ${t('fail')}: <b style="color:#cf1322">${op.fail}</b></span>
                </div>
                <div style="color:#8c8c8c;margin-bottom:6px">${op.folderName || t('folder')}</div>
                <button class="pk-rollback" style="background:#fff1f0;color:#cf1322;border:1px solid #ffa39e;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px">↩${t('undo')} (${op.files.length})</button>
            `;
            div.querySelector('.pk-rollback').onclick = () => handleRollback(history.length - 1 - ri);
            container.appendChild(div);
        });
    }

    function renderPresets() {
        const container = panel.querySelector('#pk-preset-list');
        const presets = JSON.parse(localStorage.getItem('pk-rename-presets') || '{}');
        const names = Object.keys(presets);
        if (!names.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noPresets') + '</div>';
            return;
        }
        container.innerHTML = '';
        names.forEach(name => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border:1px solid #e8e8e8;border-radius:8px;padding:8px 10px;margin-bottom:4px;font-size:12px;background:#fafafa';
            div.innerHTML = `
                <span style="color:#333;font-weight:500">${name}</span>
                <span style="display:flex;gap:4px">
                    <button class="pk-preset-load" style="background:#1890ff;color:#fff;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px">${t('load')}</button>
                    <button class="pk-preset-del" style="background:none;border:none;color:#ff4d4f;cursor:pointer;font-size:16px;padding:0 4px">×</button>
                </span>
            `;
            div.querySelector('.pk-preset-load').onclick = () => { applyConfig(presets[name]); showTab('rename'); log(`${t('savedPreset')}: ${name}`, 'highlight'); };
            div.querySelector('.pk-preset-del').onclick = () => {
                delete presets[name];
                localStorage.setItem('pk-rename-presets', JSON.stringify(presets));
                renderPresets();
            };
            container.appendChild(div);
        });
    }

    async function handleRollback(index) {
        const history = JSON.parse(localStorage.getItem('pk-rename-history') || '[]');
        const op = history[index];
        if (!op) return;
        if (!confirm(t('confirmRollback').replace('%n', op.files.length))) return;
        log(t('rollingBack').replace('%n', op.files.length), 'highlight');
        let ok = 0, fail = 0;
        for (const file of op.files) {
            try {
                await renameFile(file.id, file.oldName);
                log(`↩ ${file.newName} → ${file.oldName}`, 'ok');
                ok += 1;
            } catch (e) {
                log(`${t('fail')}: ${file.newName} — ${e.message}`, 'error');
                fail += 1;
            }
            await sleep(1000 + Math.random() * 300);
        }
        log(`${t('rollbackDone')}: ${ok}  |  ${t('fail')}: ${fail}`, 'highlight');
        renderHistory();
    }

    // ===== Classify functions =====

    function saveClassifyRules() {
        localStorage.setItem('pk-classify-rules', JSON.stringify(classifyRules));
    }

    function matchClassifyRule(file, rule) {
        if (!rule.enabled) return false;
        const m = rule.match;
        if (m.kind && m.kind !== 'all' && file.kind !== m.kind) return false;
        if (m.extensions && m.extensions.length) {
            const dot = file.name.lastIndexOf('.');
            const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
            if (!m.extensions.some(e => ext === e)) return false;
        }
        if (m.namePattern) {
            try {
                if (!new RegExp(m.namePattern, 'i').test(file.name)) return false;
            } catch (_) { return false; }
        }
        return true;
    }

    function getClassifyTargets(files, rules) {
        const activeRules = (rules || classifyRules).filter(r => r.enabled);
        const result = { matched: [], unmatched: [] };
        files.forEach(file => {
            for (const rule of activeRules) {
                if (matchClassifyRule(file, rule)) {
                    result.matched.push({ file, rule });
                    return;
                }
            }
            result.unmatched.push(file);
        });
        return result;
    }

    function renderClassifyRules() {
        const container = panel.querySelector('#pk-classify-rules');
        if (!container) return;
        if (!classifyRules.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noRules') + '</div>';
            return;
        }
        container.innerHTML = '';
        classifyRules.forEach((rule, i) => {
            const div = document.createElement('div');
            div.style.cssText = 'border:1px solid #e8e8e8;border-radius:8px;padding:10px;margin-bottom:6px;font-size:12px;background:#fafafa';
            const matchDesc = [];
            if (rule.match.extensions?.length) matchDesc.push(rule.match.extensions.join(', '));
            if (rule.match.namePattern) matchDesc.push(`/${rule.match.namePattern}/`);
            if (rule.match.kind && rule.match.kind !== 'all') matchDesc.push(`[${rule.match.kind}]`);
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                    <span style="display:flex;align-items:center;gap:6px">
                        <span style="color:#bfbfbf;cursor:grab;font-size:13px">☰</span>
                        <input type="checkbox" ${rule.enabled ? 'checked' : ''} style="accent-color:#1890ff;margin:0">
                        <span style="font-weight:500;color:#333">${rule.name}</span>
                    </span>
                    <span style="display:flex;gap:4px">
                        <button class="pk-rule-edit" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">${t('edit')}</button>
                        <button class="pk-rule-del" style="background:none;border:none;color:#ff4d4f;cursor:pointer;font-size:16px;padding:0 4px;line-height:1">×</button>
                    </span>
                </div>
                <div style="color:#8c8c8c;padding-left:24px;line-height:1.5">
                    ${matchDesc.length ? t('filter') + ': ' + matchDesc.join(' · ') : t('filter') + ': ' + t('allTypes')}
                    <span style="color:#d9d9d9"> → </span>
                    <span style="color:#1890ff">${rule.action.targetFolder}</span>
                </div>
            `;
            div.querySelector('input[type="checkbox"]').onchange = function () {
                classifyRules[i].enabled = this.checked;
                saveClassifyRules();
            };
            div.querySelector('.pk-rule-edit').onclick = () => showClassifyRuleEditor(i);
            div.querySelector('.pk-rule-del').onclick = () => {
                classifyRules.splice(i, 1);
                saveClassifyRules();
                renderClassifyRules();
            };
            container.appendChild(div);
        });
    }

    function showClassifyRuleEditor(index) {
        const isNew = index === -1;
        const rule = isNew
            ? { name: '', enabled: true, match: { extensions: [], namePattern: '', kind: 'all' }, action: { type: 'move', targetFolder: '' } }
            : JSON.parse(JSON.stringify(classifyRules[index]));

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:100000;display:flex;align-items:center;justify-content:center';
        overlay.innerHTML = `
            <div style="background:#fff;border-radius:12px;padding:20px;width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.2);font-size:13px;color:#333">
                <div style="font-weight:600;font-size:14px;margin-bottom:12px;color:#1890ff">${isNew ? t('addStep') : t('edit')} ${t('subClassify')}</div>
                <div style="margin-bottom:8px">
                    <label style="display:block;font-size:12px;color:#595959;margin-bottom:3px">${t('classifyRule')}</label>
                    <input id="pkr-name" value="${rule.name}" placeholder="${t('classifyRule')}" style="width:100%;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;box-sizing:border-box">
                </div>
                <div style="margin-bottom:8px">
                    <label style="display:block;font-size:12px;color:#595959;margin-bottom:3px">${t('classifyExts')}</label>
                    <input id="pkr-exts" value="${rule.match.extensions.join(', ')}" placeholder=".mp4, .mkv" style="width:100%;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;box-sizing:border-box">
                </div>
                <div style="margin-bottom:8px">
                    <label style="display:block;font-size:12px;color:#595959;margin-bottom:3px">${t('classifyRegex')}</label>
                    <input id="pkr-pattern" value="${rule.match.namePattern}" placeholder=".*S\\d+E\\d+.*" style="width:100%;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;box-sizing:border-box">
                </div>
                <div style="margin-bottom:8px">
                    <label style="display:block;font-size:12px;color:#595959;margin-bottom:3px">${t('classifyKind')}</label>
                    <select id="pkr-kind" style="width:100%;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:6px 8px;font-size:12px">
                        <option value="all" ${rule.match.kind === 'all' ? 'selected' : ''}>${t('allTypes')}</option>
                        <option value="file" ${rule.match.kind === 'file' ? 'selected' : ''}>${t('file')}</option>
                        <option value="folder" ${rule.match.kind === 'folder' ? 'selected' : ''}>${t('folder')}</option>
                    </select>
                </div>
                <div style="margin-bottom:12px">
                    <label style="display:block;font-size:12px;color:#595959;margin-bottom:3px">${t('classifyFolder')}</label>
                    <input id="pkr-folder" value="${rule.action.targetFolder}" placeholder="${t('classifyFolder')}" style="width:100%;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;box-sizing:border-box">
                </div>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                    <button id="pkr-cancel" style="background:#fafafa;color:#595959;border:1px solid #d9d9d9;border-radius:6px;padding:6px 16px;cursor:pointer;font-size:12px">${t('cancel')}</button>
                    <button id="pkr-save" style="background:#1890ff;color:#fff;border:none;border-radius:6px;padding:6px 16px;cursor:pointer;font-size:12px;font-weight:500">${t('save')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#pkr-cancel').onclick = () => overlay.remove();
        overlay.querySelector('#pkr-save').onclick = () => {
            const name = overlay.querySelector('#pkr-name').value.trim();
            const extsRaw = overlay.querySelector('#pkr-exts').value.trim();
            const pattern = overlay.querySelector('#pkr-pattern').value.trim();
            const kind = overlay.querySelector('#pkr-kind').value;
            const folder = overlay.querySelector('#pkr-folder').value.trim();

            if (!name) { overlay.querySelector('#pkr-name').style.borderColor = '#ff4d4f'; return; }
            if (!folder) { overlay.querySelector('#pkr-folder').style.borderColor = '#ff4d4f'; return; }

            const newRule = {
                name,
                enabled: true,
                match: {
                    extensions: extsRaw ? extsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
                    namePattern: pattern,
                    kind,
                },
                action: { type: 'move', targetFolder: folder },
            };

            if (isNew) classifyRules.push(newRule);
            else classifyRules[index] = newRule;
            saveClassifyRules();
            renderClassifyRules();
            overlay.remove();
        };
    }

    function renderClassifyPreview() {
        const container = panel.querySelector('#pk-classify-preview-list');
        const summary = panel.querySelector('#pk-classify-preview-summary');
        if (!cachedFiles.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noFiles') + '</div>';
            summary.textContent = '';
            return;
        }
        if (!classifyRules.some(r => r.enabled)) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('classifyNoRules') + '</div>';
            summary.textContent = '';
            return;
        }
        const targets = getClassifyTargets(cachedFiles);
        const folderMap = {};
        targets.matched.forEach(t => {
            const folderName = t.rule.action.targetFolder;
            if (!folderMap[folderName]) folderMap[folderName] = [];
            folderMap[folderName].push(t.file);
        });
        summary.textContent = `${t('ok')}: ${targets.matched.length}  |  ${t('skip')}: ${targets.unmatched.length}`;
        container.innerHTML = '';
        Object.entries(folderMap).forEach(([folder, files]) => {
            const group = document.createElement('div');
            group.style.cssText = 'margin-bottom:8px';
            group.innerHTML = `<div style="font-weight:500;font-size:12px;color:#1890ff;padding:4px 0">→ ${folder} (${files.length})</div>`;
            const list = document.createElement('div');
            list.style.cssText = 'background:#fff;border:1px solid #f0f0f0;border-radius:6px;padding:4px;max-height:120px;overflow:auto';
            files.forEach(file => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:2px 6px;font-size:11px;color:#595959;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
                item.textContent = file.name;
                list.appendChild(item);
            });
            group.appendChild(list);
            container.appendChild(group);
        });
    }

    async function ensureFolders(folderNames, parentId) {
        const delay = Number(panel.querySelector('#pk-classify-delay').value) || 1500;
        const folderIds = {};
        log(`${t('classifyProgress')}...`, 'info');
        for (const name of folderNames) {
            if (cancelClassifying) break;
            try {
                folderIds[name] = await findOrCreateFolder(name, parentId);
                log(`  ✓ ${t('classifyFolder')}: ${name}`, 'ok');
            } catch (e) {
                log(`  ✗ ${t('fail')} ${t('classifyFolder')}: ${name} — ${e.message}`, 'error');
            }
            await sleep(delay + Math.random() * 300);
        }
        return folderIds;
    }

    async function moveFiles(targets, folderIds, parentId, progressEl) {
        const delay = Number(panel.querySelector('#pk-classify-delay').value) || 1500;
        let okCount = 0, skipCount = 0, failCount = 0;
        const opFiles = [];
        const startTime = Date.now();
        log(t('movingFiles'), 'highlight');

        for (let i = 0; i < targets.length; i += 1) {
            if (cancelClassifying) { log(t('userCancelled'), 'error'); break; }
            if (classifyPaused) {
                log(t('paused_'), 'skip');
                await new Promise(resolve => { resolveClassifyPause = resolve; });
                log(t('resumed_'), 'highlight');
            }
            const { file, rule } = targets[i];
            const folderName = rule.action.targetFolder;
            const targetId = folderIds[folderName];
            if (!targetId) { log(`${t('skip')}: ${file.name} — ${t('classifyFolderErr')}`, 'skip'); skipCount += 1; continue; }
            progressEl.textContent = `${t('progress')}: ${i + 1} / ${targets.length}`;
            try {
                await moveFile(file.id, targetId);
                log(`${t('ok')}: ${file.name} → ${folderName}`, 'ok');
                okCount += 1;
                opFiles.push({ id: file.id, name: file.name, fromFolder: parentId, toFolder: targetId, toFolderName: folderName });
            } catch (e) {
                log(`${t('fail')}: ${file.name} — ${e.message}`, 'fail');
                failCount += 1;
            }
            await sleep(delay + Math.random() * 600);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        progressEl.textContent = '';
        return { okCount, skipCount, failCount, opFiles, elapsed };
    }

    function saveClassifyHistory(targets, opFiles, parentId) {
        if (!opFiles.length) return;
        const history = JSON.parse(localStorage.getItem('pk-classify-history') || '[]');
        history.push({
            timestamp: Date.now(), parentId, total: targets.length,
            ok: opFiles.length, skip: 0, fail: 0, files: opFiles,
        });
        if (history.length > 50) history.splice(0, history.length - 50);
        localStorage.setItem('pk-classify-history', JSON.stringify(history));
    }

    async function executeClassify() {
        if (isClassifying) return;
        if (!cachedFiles.length) { log(t('scanFirst'), 'skip'); return; }
        if (!classifyRules.some(r => r.enabled)) { log(t('classifyNoRules'), 'skip'); return; }

        const targets = getClassifyTargets(cachedFiles);
        if (!targets.matched.length) { log(t('classifyNoMatch'), 'skip'); return; }

        isClassifying = true;
        cancelClassifying = false;
        classifyPaused = false;
        const progressEl = panel.querySelector('#pk-classify-progress');
        const runBtn = panel.querySelector('#pk-classify-run');
        const cancelBtn = panel.querySelector('#pk-classify-cancel');
        const pauseBtn = panel.querySelector('#pk-classify-pause');
        panel.querySelector('#pk-status-text').textContent = t('classifyProgress');
        runBtn.style.display = 'none';
        cancelBtn.style.display = 'block';
        pauseBtn.style.display = 'block';
        pauseBtn.textContent = `⏸ ${t('pause')}`;

        const parentId = getParentId();
        const folderNames = [...new Set(targets.matched.map(t => t.rule.action.targetFolder))];
        log(`${t('classifyProgress')}: ${targets.matched.length} ${t('file')}(s) → ${folderNames.length} ${t('folder')}(s)`, 'highlight');

        const folderIds = await ensureFolders(folderNames, parentId);

        if (!Object.keys(folderIds).length) {
            log(t('classifyFolderErr'), 'error');
            runBtn.style.display = 'block';
            cancelBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            isClassifying = false;
            panel.querySelector('#pk-status-text').textContent = t('error');
            return;
        }

        const { okCount, skipCount, failCount, opFiles, elapsed } = await moveFiles(targets.matched, folderIds, parentId, progressEl);

        log(`${t('done')} (${elapsed}s). ${t('ok')}: ${okCount}  |  ${t('skip')}: ${skipCount}  |  ${t('fail')}: ${failCount}`, 'highlight');
        panel.querySelector('#pk-status-text').textContent = `${t('done')} — ${okCount} ${t('ok')}, ${failCount} ${t('fail')}`;
        saveClassifyHistory(targets.matched, opFiles, parentId);

        runBtn.style.display = 'block';
        cancelBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        isClassifying = false;
        renderClassifyHistory();
    }

    function renderClassifyHistory() {
        const container = panel.querySelector('#pk-classify-history-list');
        const history = JSON.parse(localStorage.getItem('pk-classify-history') || '[]');
        if (!history.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noHistory') + '</div>';
            return;
        }
        container.innerHTML = '';
        history.slice().reverse().forEach((op, ri) => {
            const folderNames = [...new Set((op.files || []).map(f => f.toFolderName))].join(', ');
            const div = document.createElement('div');
            div.style.cssText = 'border:1px solid #e8e8e8;border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px;background:#fafafa';
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                    <span style="color:#8c8c8c">${new Date(op.timestamp).toLocaleString()}</span>
                    <span style="color:#595959">${t('ok')}: <b style="color:#389e0d">${op.ok}</b>  |  ${t('fail')}: <b style="color:#cf1322">${op.fail}</b></span>
                </div>
                <div style="color:#8c8c8c;margin-bottom:4px">${t('classifyFolder')}: ${folderNames}</div>
                <button class="pk-classify-rollback" style="background:#fff1f0;color:#cf1322;border:1px solid #ffa39e;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px">${t('undo')} (${op.files.length})</button>
            `;
            div.querySelector('.pk-classify-rollback').onclick = () => rollbackClassify(history.length - 1 - ri);
            container.appendChild(div);
        });
    }

    async function rollbackClassify(index) {
        const history = JSON.parse(localStorage.getItem('pk-classify-history') || '[]');
        const op = history[index];
        if (!op) return;
        if (!confirm(`Undo classification? Move ${op.files.length} files back to original location.`)) return;
        const delay = Number(panel.querySelector('#pk-classify-delay').value) || 1500;
        log(`Undoing classification (${op.files.length} files)...`, 'highlight');
        let ok = 0, fail = 0;
        for (const file of op.files) {
            try {
                await moveFile(file.id, file.fromFolder);
                log(`↩ ${file.name} ← ${file.toFolderName}`, 'ok');
                ok += 1;
            } catch (e) {
                log(`Undo failed: ${file.name} — ${e.message}`, 'error');
                fail += 1;
            }
            await sleep(delay + Math.random() * 300);
        }
        log(`Undo complete. Restored: ${ok}  |  Failed: ${fail}`, 'highlight');
        renderClassifyHistory();
    }

    // ===== Module 1: Duplicates =====

    function stripPikPakSuffix(name) {
        return name.replace(/\s*\(\d+\)(?=\.[^.]+$)/, '');
    }

    function detectDuplicates(files) {
        const groups = {};
        files.filter(f => f.kind !== 'folder').forEach(f => {
            const clean = stripPikPakSuffix(f.name);
            const key = `${clean}|${f.size}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(f);
        });
        return Object.values(groups).filter(g => g.length >= 2).sort((a, b) => b.length - a.length);
    }

    function formatSize(bytes) {
        if (!bytes) return '?';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        let size = bytes;
        while (size >= 1024 && i < units.length - 1) { size /= 1024; i += 1; }
        return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }

    function renderDuplicates() {
        const container = panel.querySelector('#pk-dup-list');
        if (!container) return;
        if (!cachedFiles.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('scanFirst') + '</div>'; return; }
        const groups = detectDuplicates(cachedFiles);
        if (!groups.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('ok') + '</div>'; panel.querySelector('#pk-dup-count').textContent = ''; return; }
        container.innerHTML = '';
        groups.forEach(group => {
            const f = group[0];
            const clean = stripPikPakSuffix(f.name);
            const div = document.createElement('div');
            div.style.cssText = 'border:1px solid #e8e8e8;border-radius:8px;padding:8px;margin-bottom:6px;font-size:12px;background:#fafafa';
            div.innerHTML = `
                <div style="font-weight:500;color:#595959;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${clean} (${formatSize(f.size)}) ×${group.length}</div>
                ${group.map((file, fi) => `
                    <label style="display:flex;align-items:center;gap:6px;padding:2px 4px;border-radius:3px;${fi === 0 ? 'background:#f0f5ff' : ''}">
                        <input type="checkbox" class="pk-dup-cb" data-id="${file.id}" ${fi === 0 ? '' : 'checked'} style="accent-color:#ff4d4f;margin:0">
                        <span style="color:#333;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</span>
                        <span style="color:#8c8c8c;font-size:11px">${fi === 0 ? '(' + t('filterActive') + ')' : t('dupDelete')}</span>
                    </label>
                `).join('')}
            `;
            container.appendChild(div);
        });
        const total = groups.reduce((s, g) => s + g.length - 1, 0);
        panel.querySelector('#pk-dup-count').textContent = `${groups.length} ${t('dupScan')}, ${total} ${t('dupDelete')}`;
    }

    async function executeDupDelete() {
        const cbs = panel.querySelectorAll('.pk-dup-cb:checked');
        const ids = Array.from(cbs).map(cb => cb.dataset.id);
        if (!ids.length) { log('No files selected', 'skip'); return; }
        if (!confirm(t('confirmDeleteDup'))) return;
        log(`Deleting ${ids.length} file(s)...`, 'highlight');
        try {
            await deleteFiles(ids);
            log(`  ✓ Batch delete sent`, 'ok');
        } catch (e) {
            log(`  ✗ ${e.message}`, 'fail');
        }
        cachedFiles = cachedFiles.filter(f => !ids.includes(f.id));
        renderDuplicates();
    }

    // ===== Module 2: Tasks =====

    let taskPollTimer = null;

    async function fetchTasks() {
        const data = await apiFetch('GET', '/task', { params: { type: 'offline', limit: '100' } });
        const tasks = data.tasks || [];
        const result = { running: [], failed: [], done: [] };
        tasks.forEach(t => {
            const s = (t.status || '').toLowerCase();
            if (s === 'running' || s === 'downloading') result.running.push(t);
            else if (s === 'failed') result.failed.push(t);
            else if (s === 'done') result.done.push(t);
        });
        return result;
    }

    async function retryTask(taskId) {
        await apiFetch('POST', `/task/${taskId}/retry`);
    }

    function startTaskPolling(intervalMs = 10000) {
        stopTaskPolling();
        taskPollTimer = setInterval(async () => {
            try { await renderTasks(); } catch (_) {}
        }, intervalMs);
    }

    function stopTaskPolling() {
        if (taskPollTimer) { clearInterval(taskPollTimer); taskPollTimer = null; }
    }

    async function renderTasks() {
        const container = panel.querySelector('#pk-task-list');
        if (!container) return;
        try {
            const tasks = await fetchTasks();
            const toggle = panel.querySelector('#pk-task-toggle');
            const toggleOn = toggle && toggle.checked;
            container.innerHTML = '';
            const all = [...tasks.running, ...tasks.failed, ...tasks.done.slice(0, 20)];
            if (!all.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">No tasks found</div>'; return; }
            all.forEach(t => {
                const s = (t.status || '').toLowerCase();
                const icon = s === 'running' || s === 'downloading' ? '🟡' : s === 'failed' ? '🔴' : '🟢';
                const div = document.createElement('div');
                div.style.cssText = 'border-bottom:1px solid #f0f0f0;padding:6px;font-size:12px';
                div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:4px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span>${icon}</span><span>${t.name || t.file_name || 'Unknown'}</span></span>${s === 'failed' ? '<button class="pk-task-retry" data-id="' + (t.id || t.task_id) + '" style="background:#fff1f0;color:#cf1322;border:1px solid #ffa39e;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">Retry</button>' : ''}</div>`;
                if (s === 'running' || s === 'downloading') {
                    const p = t.progress || t.percent || 0;
                    div.innerHTML += `<div style="font-size:11px;color:#8c8c8c;margin-top:2px">Progress: ${typeof p === 'number' ? p.toFixed(0) + '%' : p}</div>`;
                }
                if (s === 'failed' && t.message) div.innerHTML += `<div style="font-size:11px;color:#cf1322;margin-top:2px">${t.message}</div>`;
                container.appendChild(div);
            });
            panel.querySelector('#pk-task-summary').textContent = `Running: ${tasks.running.length}  |  Failed: ${tasks.failed.length}  |  Done: ${tasks.done.length}`;

            if (toggleOn) startTaskPolling();
            else stopTaskPolling();

            container.querySelectorAll('.pk-task-retry').forEach(btn => {
                btn.onclick = async () => {
                    btn.disabled = true;
                    try {
                        await retryTask(btn.dataset.id);
                        log(`Retry submitted for task ${btn.dataset.id}`, 'ok');
                    } catch (e) {
                        log(`Retry failed: ${e.message}`, 'fail');
                    }
                    btn.disabled = false;
                };
            });
        } catch (e) {
            container.innerHTML = '<div style="color:#cf1322;padding:12px;text-align:center">Failed to load tasks</div>';
        }
    }

    // ===== Module 3 & 4: Media (Subtitle Match + Episode Norm) =====

    const VIDEO_EXTS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
    const SUBTITLE_EXTS = ['.srt', '.ass', '.ssa', '.sub', '.vtt', '.idx', '.smi'];

    function editDistance(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[m][n];
    }

    function matchSubtitleToVideo(subName, videoFiles) {
        const sBase = subName.slice(0, subName.lastIndexOf('.')).replace(/\.(eng?|zh|chi|ja|jp|kor|ko|spa|es|fre|fr|ger|de|ita|it|por|pt|rus|ru)\.?$/i, '');
        for (const v of videoFiles) {
            const vBase = v.name.slice(0, v.name.lastIndexOf('.'));
            if (sBase === vBase) return { video: v, confidence: 'exact' };
        }
        let best = null, bestDist = Infinity;
        for (const v of videoFiles) {
            const vBase = v.name.slice(0, v.name.lastIndexOf('.'));
            const dist = editDistance(sBase.toLowerCase(), vBase.toLowerCase());
            if (dist < bestDist) { bestDist = dist; best = v; }
        }
        if (best && bestDist <= 3) return { video: best, confidence: 'fuzzy', distance: bestDist };
        return null;
    }

    function buildSubtitlePairs(files) {
        const videos = files.filter(f => VIDEO_EXTS.includes(f.name.slice(f.name.lastIndexOf('.')).toLowerCase()));
        const subs = files.filter(f => SUBTITLE_EXTS.includes(f.name.slice(f.name.lastIndexOf('.')).toLowerCase()));
        const used = new Set();
        const pairs = [];
        for (const s of subs) {
            const r = matchSubtitleToVideo(s.name, videos);
            if (r && r.confidence === 'exact') {
                const newName = r.video.name.slice(0, r.video.name.lastIndexOf('.')) + s.name.slice(s.name.lastIndexOf('.'));
                pairs.push({ subtitle: s, video: r.video, confidence: 'exact', newName, changed: s.name !== newName });
                used.add(s.id);
            }
        }
        for (const s of subs) {
            if (used.has(s.id)) continue;
            const r = matchSubtitleToVideo(s.name, videos);
            if (r && r.confidence === 'fuzzy') {
                const newName = r.video.name.slice(0, r.video.name.lastIndexOf('.')) + s.name.slice(s.name.lastIndexOf('.'));
                pairs.push({ subtitle: s, video: r.video, confidence: 'fuzzy', newName, changed: s.name !== newName });
                used.add(s.id);
            }
        }
        return { pairs, unmatched: subs.filter(s => !used.has(s.id)) };
    }

    function renderMediaSubs() {
        const container = panel.querySelector('#pk-media-subs-list');
        if (!container) return;
        if (!cachedFiles.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('scanFirst') + '</div>'; return; }
        const { pairs, unmatched } = buildSubtitlePairs(cachedFiles);
        const exactCount = pairs.filter(p => p.confidence === 'exact').length;
        const fuzzyCount = pairs.filter(p => p.confidence === 'fuzzy').length;
        container.innerHTML = '';
        if (!pairs.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('subNoPairs') + '</div>';
            panel.querySelector('#pk-media-subs-summary').textContent = `${t('subUnmatched')}: ${unmatched.length}`;
            return;
        }
        panel.querySelector('#pk-media-subs-summary').textContent = `${t('subExactFuzzy')}: ${exactCount}  |  ${t('applyFuzzy')}: ${fuzzyCount}  |  ${t('subUnmatched')}: ${unmatched.length}`;
        pairs.forEach(p => {
            const div = document.createElement('div');
            div.style.cssText = `border:1px solid #e8e8e8;border-radius:8px;padding:8px;margin-bottom:6px;font-size:12px;background:#fafafa`;
            div.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px">
                    <input type="checkbox" class="pk-sub-cb" data-sid="${p.subtitle.id}" data-newname="${p.newName}" ${p.confidence === 'exact' ? 'checked' : ''} style="accent-color:#1890ff;margin:0">
                    <span style="color:#595959;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.subtitle.name}</span>
                    <span style="font-size:11px;padding:1px 6px;border-radius:3px;background:${p.confidence === 'exact' ? '#f6ffed' : '#fff7e6'};color:${p.confidence === 'exact' ? '#389e0d' : '#d46b08'}">${p.confidence}</span>
                </div>
                <div style="color:#8c8c8c;padding-left:24px;font-size:11px">→ ${p.video.name}  →  ${p.newName}</div>
            `;
            container.appendChild(div);
        });
        if (unmatched.length) {
            const u = document.createElement('div');
            u.style.cssText = 'margin-top:4px;font-size:11px;color:#cf1322';
            u.textContent = `❌ ${t('subUnmatched')}: ${unmatched.map(s => s.name).join(', ')}`;
            container.appendChild(u);
        }
        const applyCount = pairs.filter(p => p.confidence === 'exact').length;
        panel.querySelector('#pk-media-subs-count').textContent = `${t('apply')} (${applyCount})`;
    }

    async function executeSubRename(includeFuzzy = false) {
        const cbs = panel.querySelectorAll('.pk-sub-cb:checked');
        const items = Array.from(cbs).map(cb => ({ id: cb.dataset.sid, newName: cb.dataset.newname }));
        if (!items.length) { log(t('noDupSelected'), 'skip'); return; }
        if (!confirm(t('subConfirmRename'))) return;
        const delay = getConfig().delay || 1500;
        log(`Renaming ${items.length} subtitle(s)...`, 'highlight');
        let ok = 0, fail = 0;
        for (const item of items) {
            try { await renameFile(item.id, item.newName); log(`  ✓ ${item.newName}`, 'ok'); ok += 1; }
            catch (e) { log(`  ✗ ${e.message}`, 'fail'); fail += 1; }
            await sleep(delay + Math.random() * 400);
        }
        log(`Done. Renamed: ${ok}  |  Failed: ${fail}`, 'highlight');
        cachedFiles = cachedFiles.map(f => { const found = items.find(i => i.id === f.id); return found ? { ...f, name: found.newName } : f; });
        renderMediaSubs();
    }

    // ===== Module 4: Episode Norm =====

    const EPISODE_PATTERNS = [
        { re: /\[.*?\]\s*(.+?)\s*-\s*(\d+)\s*[\[\(]/, groups: ['title', 'episode'] },
        { re: /(.+?)[\.\s]S(\d+)E(\d+)/i, groups: ['title', 'season', 'episode'] },
        { re: /(.+?)[\.\s](\d+)[Oo][Ff]\d+/i, groups: ['title', 'episode'] },
        { re: /(.+?)\s*第(\d+)[話话集]/, groups: ['title', 'episode'] },
        { re: /(.+?)[\.\s\-](\d+)[\.\s\[\(]/, groups: ['title', 'episode'] },
    ];

    function parseEpisode(filename) {
        const ext = filename.slice(filename.lastIndexOf('.'));
        const name = filename.slice(0, filename.lastIndexOf('.'));
        for (const { re, groups } of EPISODE_PATTERNS) {
            const m = name.match(re);
            if (m) {
                const result = { title: '', season: 1, episode: 0, ext };
                groups.forEach((g, i) => {
                    if (g === 'title') result.title = m[i + 1].trim().replace(/[\._]/g, ' ');
                    if (g === 'season') result.season = parseInt(m[i + 1]);
                    if (g === 'episode') result.episode = parseInt(m[i + 1]);
                });
                return result;
            }
        }
        return null;
    }

    function formatEpisode(parsed) {
        const fmt = localStorage.getItem('pk-episode-format') || 'S01E01';
        const pad = n => String(n).padStart(2, '0');
        const { title, season, episode, ext } = parsed;
        if (fmt === 'Title - Ep') return `${title} - ${episode}${ext}`;
        if (fmt === 'Title Ep話') return `${title} 第${episode}話${ext}`;
        return `${title} S${pad(season)}E${pad(episode)}${ext}`;
    }

    function renderMediaEpisode() {
        const container = panel.querySelector('#pk-media-ep-list');
        if (!container) return;
        if (!cachedFiles.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('scanFirst') + '</div>'; return; }
        const format = panel.querySelector('#pk-ep-format')?.value || 'S01E01';
        localStorage.setItem('pk-episode-format', format);
        const results = [];
        const errors = [];
        cachedFiles.forEach(f => {
            const p = parseEpisode(f.name);
            if (p) {
                const newName = formatEpisode({ ...p, ext: f.name.slice(f.name.lastIndexOf('.')) });
                results.push({ file: f, parsed: p, newName, changed: newName !== f.name });
            } else {
                errors.push(f);
            }
        });
        container.innerHTML = '';
        const changed = results.filter(r => r.changed);
        if (!changed.length) {
            container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('ok') + '</div>';
            return;
        }
        changed.forEach(r => {
            const div = document.createElement('div');
            div.style.cssText = 'border:1px solid #e8e8e8;border-radius:8px;padding:8px;margin-bottom:6px;font-size:12px;background:#fafafa';
            div.innerHTML = `
                <label style="display:flex;align-items:center;gap:6px">
                    <input type="checkbox" class="pk-ep-cb" data-id="${r.file.id}" data-newname="${r.newName}" checked style="accent-color:#1890ff;margin:0">
                    <span style="color:#595959;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.file.name}</span>
                    <span style="color:#d9d9d9">→</span>
                    <span style="color:#389e0d;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.newName}</span>
                </label>
            `;
            container.appendChild(div);
        });
        if (errors.length) {
            const e = document.createElement('div');
            e.style.cssText = 'margin-top:4px;font-size:11px;color:#cf1322';
            e.textContent = `❌ ${t('error')}: ${errors.map(f => f.name).join(', ')}`;
            container.appendChild(e);
        }
        panel.querySelector('#pk-media-ep-count').textContent = `${t('epMatch')} (${changed.length})`;
    }

    async function executeEpisodeNorm() {
        const cbs = panel.querySelectorAll('.pk-ep-cb:checked');
        const items = Array.from(cbs).map(cb => ({ id: cb.dataset.id, newName: cb.dataset.newname }));
        if (!items.length) { log(t('noDupSelected'), 'skip'); return; }
        if (!confirm(`${t('epMatch')}?`)) return;
        const delay = getConfig().delay || 1500;
        log(`${t('epMatch')}...`, 'highlight');
        let ok = 0, fail = 0;
        for (const item of items) {
            try { await renameFile(item.id, item.newName); log(`  ✓ ${item.newName}`, 'ok'); ok += 1; }
            catch (e) { log(`  ✗ ${e.message}`, 'fail'); fail += 1; }
            await sleep(delay + Math.random() * 400);
        }
        log(`${t('done')}. ${t('ok')}: ${ok}  |  ${t('fail')}: ${fail}`, 'highlight');
        renderMediaEpisode();
    }

    // ===== Module 5: Share Batch =====

    async function createShare(fileId, { expireDays = 7, needPasscode = false } = {}) {
        return await apiFetch('POST', '/share', { body: { file_id: fileId, expire_days: expireDays, need_passcode: needPasscode } });
    }

    async function batchCreateShares(fileIds, options) {
        if (fileIds.length > 20) throw new Error('Maximum 20 files per batch');
        const results = [];
        for (const id of fileIds) {
            try {
                const data = await createShare(id, options);
                results.push({ id, ok: true, url: data.share_url || data.shareUrl || '', shareId: data.share_id || data.id });
            } catch (e) {
                results.push({ id, ok: false, error: e.message });
            }
            await sleep(getConfig().delay + Math.random() * 300);
        }
        return results;
    }

    function renderShareBatch() {
        const container = panel.querySelector('#pk-share-batch-list');
        if (!container) return;
        if (!cachedFiles.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('scanFirst') + '</div>'; return; }
        container.innerHTML = '';
        const maxShow = 50;
        const files = cachedFiles.filter(f => f.kind !== 'folder').slice(0, maxShow);
        files.forEach(f => {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;font-size:12px;border-bottom:1px solid #f0f0f0';
            label.innerHTML = `<input type="checkbox" class="pk-share-cb" data-id="${f.id}" style="accent-color:#1890ff;margin:0"><span style="color:#333;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span>`;
            container.appendChild(label);
        });
        if (cachedFiles.length > maxShow) {
            const more = document.createElement('div');
            more.style.cssText = 'font-size:11px;color:#8c8c8c;padding:4px 6px';
            more.textContent = `...${cachedFiles.length - maxShow} ${t('file')}(s)`;
            container.appendChild(more);
        }
    }

    async function executeShareBatch() {
        const cbs = panel.querySelectorAll('.pk-share-cb:checked');
        const ids = Array.from(cbs).map(cb => cb.dataset.id);
        if (!ids.length) { log(t('noDupSelected'), 'skip'); return; }
        if (ids.length > 20) { log(t('danger'), 'fail'); return; }
        const expireDays = Number(panel.querySelector('#pk-share-expire')?.value) || 7;
        const needPasscode = panel.querySelector('#pk-share-passcode')?.checked || false;
        if (!confirm(`${t('genLinks')} (${ids.length})?`)) return;
        log(`${t('genLinks')}...`, 'highlight');
        const results = await batchCreateShares(ids, { expireDays, needPasscode });
        const resultEl = panel.querySelector('#pk-share-results');
        resultEl.innerHTML = '';
        let html = '';
        results.forEach(r => {
            if (r.ok) {
                html += `<div style="padding:4px 6px;font-size:11px;border-bottom:1px solid #f0f0f0">
                    <div style="color:#389e0d">✅ ${r.url}</div>
                    <button class="pk-share-copy" data-url="${r.url}" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:1px 8px;cursor:pointer;font-size:10px;margin-top:2px">${t('copy')}</button>
                </div>`;
            } else {
                html += `<div style="padding:4px 6px;font-size:11px;color:#cf1322">❌ ${r.error}</div>`;
            }
        });
        html += `<button id="pk-share-copy-all" style="background:#1890ff;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px;margin-top:4px">${t('copyLog')}</button>`;
        resultEl.innerHTML = html;
        resultEl.querySelectorAll('.pk-share-copy').forEach(btn => {
            btn.onclick = () => { navigator.clipboard.writeText(btn.dataset.url); log(t('copyLog'), 'ok'); };
        });
        const copyAll = resultEl.querySelector('#pk-share-copy-all');
        if (copyAll) copyAll.onclick = () => {
            const text = results.filter(r => r.ok).map(r => r.url).join('\n');
            navigator.clipboard.writeText(text);
            log(t('copyLog'), 'ok');
        };
    }

    // ===== Module 6: Share Manager =====

    async function fetchMyShares() {
        const data = await apiFetch('GET', '/share');
        return data.shares || [];
    }

    async function deleteShare(shareId) {
        await apiFetch('DELETE', `/share/${shareId}`);
    }

    async function renderShareManager() {
        const container = panel.querySelector('#pk-shares-list');
        if (!container) return;
        try {
            const shares = await fetchMyShares();
            const filter = panel.querySelector('#pk-shares-filter')?.value || 'all';
            container.innerHTML = '';
            const now = Date.now();
            const filtered = shares.filter(s => {
                if (filter === 'active') return s.expire_time && new Date(s.expire_time).getTime() > now;
                if (filter === 'expired') return s.expire_time && new Date(s.expire_time).getTime() <= now;
                return true;
            });
            if (!filtered.length) { container.innerHTML = '<div style="color:#8c8c8c;padding:12px;text-align:center">' + t('noHistory') + '</div>'; return; }
            filtered.forEach(s => {
                const expired = s.expire_time && new Date(s.expire_time).getTime() <= now;
                const div = document.createElement('div');
                div.style.cssText = `border:1px solid #e8e8e8;border-radius:8px;padding:8px;margin-bottom:6px;font-size:12px;background:#fafafa;${expired ? 'opacity:0.6' : ''}`;
                div.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <label style="display:flex;align-items:center;gap:6px;flex:1;overflow:hidden">
                            <input type="checkbox" class="pk-share-mgr-cb" data-id="${s.share_id || s.id}" style="accent-color:#ff4d4f;margin:0">
                            <span style="color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title || t('file')}</span>
                        </label>
                        <button class="pk-share-mgr-copy" data-url="${s.share_url || ''}" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">${t('copyLog')}</button>
                    </div>
                    <div style="font-size:11px;color:${expired ? '#cf1322' : '#8c8c8c'};padding-left:24px;margin-top:2px">${expired ? '🔴 '+t('filterExpired') : t('filterActive')}: ${s.expire_time ? new Date(s.expire_time).toLocaleDateString() : 'N/A'}  |  ${t('filterAll')}: ${s.view_count || 0}</div>
                `;
                container.appendChild(div);
            });
            panel.querySelector('#pk-shares-total').textContent = `${t('filterAll')}: ${shares.length}`;
            container.querySelectorAll('.pk-share-mgr-copy').forEach(btn => {
                btn.onclick = () => { navigator.clipboard.writeText(btn.dataset.url); log('Link copied', 'ok'); };
            });
        } catch (e) {
            container.innerHTML = '<div style="color:#cf1322;padding:12px;text-align:center">Failed to load shares</div>';
        }
    }

    async function executeShareDelete() {
        const cbs = panel.querySelectorAll('.pk-share-mgr-cb:checked');
        const ids = Array.from(cbs).map(cb => cb.dataset.id);
        if (!ids.length) { log('No shares selected', 'skip'); return; }
        if (ids.length > 20) { log('Maximum 20 shares per batch', 'fail'); return; }
        if (!confirm(`Delete ${ids.length} share link(s)?`)) return;
        const delay = getConfig().delay || 1500;
        log(`Deleting ${ids.length} share(s)...`, 'highlight');
        let ok = 0, fail = 0;
        for (const id of ids) {
            try { await deleteShare(id); log(`  ✓ Deleted`, 'ok'); ok += 1; }
            catch (e) { log(`  ✗ ${e.message}`, 'fail'); fail += 1; }
            await sleep(delay + Math.random() * 300);
        }
        log(`Done. Deleted: ${ok}  |  Failed: ${fail}`, 'highlight');
        renderShareManager();
    }

    function rebuildPanel() {
        const existing = document.querySelector('#pk-rename-pro-panel');
        if (existing) {
            if (typeof existing._pkCleanup === 'function') existing._pkCleanup();
            existing.remove();
        }
        panel = null;
        createUI();
    }

    function createUI() {
        if (document.querySelector('#pk-rename-pro-panel')) return;

        panel = document.createElement('div');
        panel.id = 'pk-rename-pro-panel';
        Object.assign(panel.style, {
            position: 'fixed', top: '80px', left: '20px', width: '360px',
            background: '#fff', color: '#333', padding: '0',
            borderRadius: '12px', zIndex: '99999',
            fontFamily: '-apple-system, "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif', fontSize: '13px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', userSelect: 'none',
            display: 'flex', flexDirection: 'column', minWidth: '320px', minHeight: '260px', resize: 'both', overflow: 'hidden', border: '1px solid #e8e8e8',
        });

        panel.innerHTML = `
<div id="pkhandle" style="cursor:move;padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:#fafafa;border-radius:12px 12px 0 0">
  <span style="font-weight:600;font-size:13px;color:#1890ff">📁 PikPak Rename</span>
  <span style="display:flex;align-items:center;gap:6px">
    <button id="pklang" style="background:#fff;border:1px solid #d9d9d9;border-radius:4px;padding:1px 6px;cursor:pointer;font-size:10px;color:#595959;line-height:1.5">${t('langToggle')}</button>
    <span id="pkst" style="font-size:10px;padding:1px 6px;border-radius:4px;background:#fff7e6;color:#d46b08;font-weight:500">Missing</span>
    <span id="pkclose" title="Toggle panel" style="cursor:pointer;font-size:14px;color:#bfbfbf;line-height:1;padding:0 2px">✕</span>
  </span>
</div>
<div style="display:flex;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa">
  <button class="pk-tab" data-tab="rename" style="flex:1;background:#e6f7ff;color:#1890ff;border:none;padding:8px 4px;cursor:pointer;font-size:12px;font-weight:600;border-bottom:2px solid #1890ff;font-family:inherit">📝 ${t('tabRename')}</button>
  <button class="pk-tab" data-tab="organize" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:8px 4px;cursor:pointer;font-size:12px;font-family:inherit;border-bottom:2px solid transparent">📁 ${t('tabOrganize')}</button>
  <button class="pk-tab" data-tab="tasks" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:8px 4px;cursor:pointer;font-size:12px;font-family:inherit;border-bottom:2px solid transparent">⚡ ${t('tabTasks')}</button>
  <button class="pk-tab" data-tab="share" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:8px 4px;cursor:pointer;font-size:12px;font-family:inherit;border-bottom:2px solid transparent">🔗 ${t('tabShare')}</button>
</div>
<div id="pk-body" style="overflow-y:auto;flex:1;padding:0">

<div id="pk-tab-rename" class="pk-tab-content" style="padding:12px 16px">

  <div class="pk-section" style="margin-bottom:6px">
    <div class="pk-section-hd" data-target="steps" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:6px 0;border-radius:4px">
      <span style="font-size:12px;color:#595959;font-weight:600">${t('steps')}</span>
      <span style="display:flex;align-items:center;gap:6px">
        <button id="pk-add-step" data-stop="1" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:12px">+ ${t('addStep')}</button>
        <span class="pk-toggle-icon" style="font-size:10px;color:#bfbfbf;transition:transform .2s">▾</span>
      </span>
    </div>
    <div class="pk-section-bd" id="pk-coll-steps" style="overflow:hidden;transition:max-height .25s ease;max-height:600px">
      <div id="pk-steps" style="padding:2px 0 6px"></div>
    </div>
  </div>

  <div class="pk-section" style="margin-bottom:6px">
    <div class="pk-section-hd" data-target="filter" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:6px 0;border-radius:4px">
      <span style="font-size:12px;color:#8c8c8c;font-weight:500">${t('filter')}</span>
      <span class="pk-toggle-icon" style="font-size:10px;color:#bfbfbf;transition:transform .2s">▸</span>
    </div>
    <div class="pk-section-bd" id="pk-coll-filter" style="overflow:hidden;transition:max-height .25s ease;max-height:0">
      <div style="display:flex;gap:6px;flex-wrap:wrap;padding:2px 0 6px">
        <input id="pk-ext-filter" placeholder="${t('extFilter')}" style="flex:1;min-width:80px;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit">
        <select id="pk-kind-filter" style="background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:5px 8px;font-size:12px">
          <option value="all">${t('allTypes')}</option>
          <option value="file">${t('file')}</option>
          <option value="folder">${t('folder')}</option>
        </select>
        <input id="pk-name-filter" placeholder="${t('nameFilter')}" style="flex:1;min-width:70px;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit">
      </div>
    </div>
  </div>

  <div class="pk-section" style="margin-bottom:6px">
    <div class="pk-section-hd" data-target="naming" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:6px 0;border-radius:4px">
      <span style="font-size:12px;color:#8c8c8c;font-weight:500">${t('naming')}</span>
      <span class="pk-toggle-icon" style="font-size:10px;color:#bfbfbf;transition:transform .2s">▸</span>
    </div>
    <div class="pk-section-bd" id="pk-coll-naming" style="overflow:hidden;transition:max-height .25s ease;max-height:0">
      <div style="padding:2px 0 6px">
      <div style="display:flex;gap:6px;margin-bottom:4px">
        <input id="pk-prefix" placeholder="${t('prefix')}" style="flex:1;min-width:0;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit">
        <input id="pk-suffix" placeholder="${t('suffix')}" style="flex:1;min-width:0;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit">
        <select id="pk-case" style="width:120px;flex-shrink:0;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:5px 6px;font-size:12px">
          <option value="none">${t('caseOpt')}</option>
          <option value="upper">UPPER</option>
          <option value="lower">lower</option>
          <option value="title">Title</option>
        </select>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;white-space:nowrap"><input type="checkbox" id="pk-index-enable" style="accent-color:#1890ff;margin:0"> ${t('indexOpt')}</label>
        <select id="pk-index-pos" style="background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px 6px;font-size:12px">
          <option value="after">${t('indexAfter')}</option>
          <option value="before">${t('indexBefore')}</option>
        </select>
        <select id="pk-index-format" style="background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px 6px;font-size:12px">
          <option value="01">01</option>
          <option value="001">001</option>
          <option value="A">A</option>
          <option value="a">a</option>
        </select>
        <input id="pk-index-sep" value="_" style="width:30px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px;font-size:12px">
        <input id="pk-index-start" value="1" style="width:36px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px;font-size:12px">
        <input id="pk-index-step" value="1" style="width:36px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px;font-size:12px">
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;white-space:nowrap;margin-left:auto"><input type="checkbox" id="pk-keep-ext" checked style="accent-color:#1890ff;margin:0"> ${t('keepExt')}</label>
      </div>
      </div>
    </div>
  </div>

  <div style="margin-bottom:10px;font-size:12px;display:flex;align-items:center;gap:6px;color:#595959;padding:2px 0">
    ${t('delayMs')} <input id="pk-delay" value="1500" style="width:56px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px 6px;font-size:12px">
  </div>

  <div style="display:flex;gap:6px;margin-bottom:8px">
    <button id="pkscan" style="flex:1;background:#f6ffed;color:#389e0d;border:1px solid #b7eb8f;border-radius:6px;padding:7px 6px;cursor:pointer;font-size:13px;font-weight:500">📂 ${t('scan')}</button>
    <button id="pkpreview" style="flex:1;background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:6px;padding:7px 6px;cursor:pointer;font-size:13px;font-weight:500">👁 ${t('preview')}</button>
    <button id="pkrun" style="flex:1;background:#1890ff;color:#fff;border:none;border-radius:6px;padding:7px 6px;cursor:pointer;font-size:13px;font-weight:600">▶ ${t('execute')}</button>
    <button id="pkcancel" style="display:none;background:#ff4d4f;color:#fff;border:none;border-radius:6px;padding:7px 6px;cursor:pointer;font-size:13px;font-weight:500">■ ${t('stop')}</button>
    <button id="pkpause" style="display:none;background:#faad14;color:#fff;border:none;border-radius:6px;padding:7px 6px;cursor:pointer;font-size:13px;font-weight:500">⏸ ${t('pause')}</button>
  </div>

  <div id="pkcount" style="font-size:12px;color:#8c8c8c;min-height:18px"></div>
  <div id="pkprogress" style="font-size:12px;color:#1890ff;min-height:18px;font-weight:500"></div>
  <div id="pk-stats" style="font-size:12px;color:#8c8c8c;min-height:16px;margin-bottom:2px"></div>

  <div style="display:flex;gap:4px;border-bottom:1px solid #f0f0f0;margin-top:10px">
    <button class="pk-rename-sub" data-rs="preview" style="flex:1;background:#e6f7ff;color:#1890ff;border:none;padding:5px;cursor:pointer;font-size:11px;font-weight:600;border-bottom:2px solid #1890ff;font-family:inherit">👁 ${t('subPreview')}</button>
    <button class="pk-rename-sub" data-rs="history" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:5px;cursor:pointer;font-size:11px;font-family:inherit;border-bottom:2px solid transparent">📋 ${t('subHistory')}</button>
    <button class="pk-rename-sub" data-rs="presets" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:5px;cursor:pointer;font-size:11px;font-family:inherit;border-bottom:2px solid transparent">💾 ${t('subPresets')}</button>
  </div>

  <div id="pk-rename-preview" style="display:block;padding:6px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span id="pk-preview-summary" style="font-size:12px;color:#8c8c8c"></span>
      <button id="pk-refresh-preview" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px">${t('scan')}</button>
    </div>
    <div id="pk-preview-list" style="max-height:180px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:4px"></div>
  </div>
  <div id="pk-rename-history" style="display:none;padding:6px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:12px;color:#595959;font-weight:500">${t('subHistory')}</span>
      <button id="pk-clear-history" style="background:#fff;color:#ff4d4f;border:1px solid #ffccc7;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px">${t('delete')}</button>
    </div>
    <div id="pk-history-list" style="max-height:200px;overflow:auto"></div>
  </div>
  <div id="pk-rename-presets" style="display:none;padding:6px 0">
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <input id="pk-preset-name" placeholder="${t('presetName')}" style="flex:1;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit">
      <button id="pk-preset-save" style="background:#1890ff;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:500">${t('save')}</button>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <button id="pk-preset-export" style="flex:1;background:#fafafa;color:#595959;border:1px solid #d9d9d9;border-radius:6px;padding:5px;cursor:pointer;font-size:12px">📤 ${t('exportPresets')}</button>
      <button id="pk-preset-import" style="flex:1;background:#fafafa;color:#595959;border:1px solid #d9d9d9;border-radius:6px;padding:5px;cursor:pointer;font-size:12px">📥 ${t('importPresets')}</button>
    </div>
    <div id="pk-preset-list" style="max-height:200px;overflow:auto"></div>
  </div>
</div>

<div id="pk-tab-organize" class="pk-tab-content" style="display:none;padding:12px 16px">

  <div style="display:flex;gap:4px;border-bottom:1px solid #f0f0f0;margin-bottom:8px">
    <button class="pk-org-sub" data-os="classify" style="flex:1;background:#e6f7ff;color:#1890ff;border:none;padding:5px;cursor:pointer;font-size:11px;font-weight:600;border-bottom:2px solid #1890ff;font-family:inherit">📁 ${t('subClassify')}</button>
    <button class="pk-org-sub" data-os="duplicates" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:5px;cursor:pointer;font-size:11px;font-family:inherit;border-bottom:2px solid transparent">🔍 ${t('subDup')}</button>
    <button class="pk-org-sub" data-os="media" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:5px;cursor:pointer;font-size:11px;font-family:inherit;border-bottom:2px solid transparent">🎬 ${t('subMedia')}</button>
  </div>

  <div id="pk-org-classify" style="display:block">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:12px;color:#595959;font-weight:600">${t('classifyRules')}</span>
      <button id="pk-classify-add" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:12px">+ ${t('addStep')}</button>
    </div>
    <div id="pk-classify-rules" style="max-height:160px;overflow:auto;margin-bottom:6px"></div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <button id="pk-classify-scan-folder" style="background:#f6ffed;color:#389e0d;border:1px solid #b7eb8f;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">📂 ${t('classifyScan')}</button>
      <button id="pk-classify-scan" style="flex:1;background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">${t('classifyPreview')}</button>
      <span style="font-size:12px;color:#8c8c8c">${t('delay')}</span>
      <input id="pk-classify-delay" value="1500" style="width:52px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px;font-size:12px">
    </div>
    <div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span id="pk-classify-preview-summary" style="font-size:12px;color:#8c8c8c"></span>
      </div>
      <div id="pk-classify-preview-list" style="max-height:130px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:6px;margin-bottom:4px"></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:4px">
      <button id="pk-classify-run" style="flex:1;background:#1890ff;color:#fff;border:none;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:600">▶ ${t('classifyRun')}</button>
      <button id="pk-classify-cancel" style="display:none;background:#ff4d4f;color:#fff;border:none;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">■ ${t('stop')}</button>
      <button id="pk-classify-pause" style="display:none;background:#faad14;color:#fff;border:none;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">⏸ ${t('pause')}</button>
    </div>
    <div id="pk-classify-progress" style="font-size:12px;color:#1890ff;min-height:18px;font-weight:500;margin-bottom:6px"></div>
    <div style="font-size:12px;color:#595959;font-weight:500;margin-bottom:4px;padding-top:6px;border-top:1px solid #f0f0f0">${t('subHistory')}</div>
    <div id="pk-classify-history-list" style="max-height:120px;overflow:auto"></div>
  </div>

  <div id="pk-org-duplicates" style="display:none">
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
      <button id="pk-dup-scan" style="background:#f6ffed;color:#389e0d;border:1px solid #b7eb8f;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">🔍 ${t('dupScan')}</button>
      <span id="pk-dup-count" style="font-size:11px;color:#8c8c8c"></span>
      <span style="font-size:12px;color:#8c8c8c">${t('delay')}</span>
      <input id="pk-dup-delay" value="1000" style="width:52px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px;font-size:12px">
    </div>
    <div id="pk-dup-list" style="max-height:220px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:6px;margin-bottom:6px"></div>
    <span style="color:#cf1322;font-size:11px;display:block;margin-bottom:4px">${t('danger')}</span>
    <button id="pk-dup-delete" style="background:#fff1f0;color:#cf1322;border:1px solid #ffa39e;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:500">🗑 ${t('dupDelete')}</button>
  </div>

  <div id="pk-org-media" style="display:none">
    <div style="display:flex;gap:4px;border-bottom:1px solid #f0f0f0;margin-bottom:8px">
      <button class="pk-media-sub" data-msub="subs" style="flex:1;background:#e6f7ff;color:#1890ff;border:none;padding:5px;cursor:pointer;font-size:11px;font-weight:600;border-bottom:2px solid #1890ff;font-family:inherit">🎬 ${t('subMatch')}</button>
      <button class="pk-media-sub" data-msub="episode" style="flex:1;background:#fafafa;color:#8c8c8c;border:none;padding:5px;cursor:pointer;font-size:11px;font-family:inherit;border-bottom:2px solid transparent">📺 ${t('epMatch')}</button>
    </div>
    <div id="pk-media-subs" style="display:block">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
        <button id="pk-media-subs-scan" style="background:#f6ffed;color:#389e0d;border:1px solid #b7eb8f;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">🎬 ${t('subMatch')}</button>
        <span id="pk-media-subs-summary" style="font-size:11px;color:#8c8c8c"></span>
      </div>
      <div id="pk-media-subs-list" style="max-height:160px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:6px;margin-bottom:4px"></div>
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span id="pk-media-subs-count" style="font-size:11px;color:#8c8c8c;flex:1"></span>
      </div>
      <div style="display:flex;gap:4px">
        <button id="pk-media-subs-apply-exact" style="flex:1;background:#1890ff;color:#fff;border:none;border-radius:6px;padding:5px;cursor:pointer;font-size:11px">${t('applyExact')}</button>
        <button id="pk-media-subs-apply-all" style="flex:1;background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:6px;padding:5px;cursor:pointer;font-size:11px">${t('applyFuzzy')}</button>
      </div>
    </div>
    <div id="pk-media-episode" style="display:none">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
        <button id="pk-media-ep-scan" style="background:#f6ffed;color:#389e0d;border:1px solid #b7eb8f;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-weight:500">📺 ${t('epMatch')}</button>
        <select id="pk-ep-format" style="background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:4px;font-size:11px">
          <option value="S01E01">S01E01</option>
          <option value="Title - Ep">Title - Ep</option>
          <option value="Title Ep">Title Ep</option>
        </select>
      </div>
      <div id="pk-media-ep-list" style="max-height:200px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:6px;margin-bottom:4px"></div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span id="pk-media-ep-count" style="font-size:11px;color:#8c8c8c"></span>
      <button id="pk-media-ep-apply" style="background:#1890ff;color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:500">${t('epMatch')}</button>
    </div>
    </div>
  </div>
</div>

<div id="pk-tab-tasks" class="pk-tab-content" style="display:none;padding:12px 16px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <div style="display:flex;align-items:center;gap:6px">
      <label style="font-size:11px;color:#595959;display:flex;align-items:center;gap:3px">
        <input type="checkbox" id="pk-task-toggle" style="accent-color:#1890ff;margin:0"> ${t('autoRefresh')}
      </label>
      <input id="pk-task-interval" value="10" style="width:30px;text-align:center;background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:2px;font-size:11px">${t('intervalSec')}
    </div>
    <span id="pk-task-summary" style="font-size:11px;color:#8c8c8c"></span>
  </div>
  <div id="pk-task-list" style="max-height:300px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:4px"></div>
</div>

<div id="pk-tab-share" class="pk-tab-content" style="display:none;padding:12px 16px">
  <span style="display:block;margin-bottom:6px;padding:6px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;font-size:11px;color:#389e0d">ℹ️ ${t('genLinks')}</span>
  <div style="font-size:12px;color:#595959;font-weight:600;margin-bottom:4px">${t('shareBatch')}</div>
  <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px;flex-wrap:wrap">
    <span style="font-size:11px;color:#8c8c8c">${t('expireIn')}:</span>
    <select id="pk-share-expire" style="background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:3px;font-size:11px">
      <option value="1">1${t('daysShort')}</option>
      <option value="7" selected>7${t('daysShort')}</option>
      <option value="30">30${t('daysShort')}</option>
    </select>
    <label style="font-size:11px;display:flex;align-items:center;gap:3px"><input type="checkbox" id="pk-share-passcode" style="accent-color:#1890ff;margin:0"> ${t('passcode')}</label>
  </div>
  <div id="pk-share-batch-list" style="max-height:100px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:4px;margin-bottom:4px"></div>
  <button id="pk-share-batch-go" style="background:#1890ff;color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:500">${t('genLinks')}</button>
  <div id="pk-share-results" style="max-height:100px;overflow:auto;margin-top:4px"></div>
  <div style="border-top:1px solid #f0f0f0;padding-top:8px;margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:12px;color:#595959;font-weight:600">${t('shareManage')}</span>
      <span id="pk-shares-total" style="font-size:11px;color:#8c8c8c"></span>
    </div>
    <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
      <button id="pk-shares-refresh" style="background:#f0f5ff;color:#1890ff;border:1px solid #91d5ff;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px">${t('scan')}</button>
      <select id="pk-shares-filter" style="background:#fff;color:#333;border:1px solid #d9d9d9;border-radius:4px;padding:3px;font-size:11px">
        <option value="all">${t('filterAll')}</option>
        <option value="active">${t('filterActive')}</option>
        <option value="expired">${t('filterExpired')}</option>
      </select>
      <span style="color:#cf1322;font-size:11px">${t('danger')}</span>
      <button id="pk-shares-delete" style="background:#fff1f0;color:#cf1322;border:1px solid #ffa39e;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px">🗑 ${t('delete')}</button>
    </div>
    <div id="pk-shares-list" style="max-height:180px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:6px"></div>
  </div>
</div>

</div>
<div id="pk-statusbar" style="border-top:1px solid #f0f0f0;padding:6px 16px;font-size:12px;color:#8c8c8c;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;background:#fafafa">
  <span id="pk-status-text">${t('ready')}</span>
  <span style="display:flex;gap:6px">
    <button id="pk-copy-log" style="background:#fff;border:1px solid #d9d9d9;color:#595959;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">${t('copyLog')}</button>
    <button id="pk-clear-log" style="background:#fff;border:1px solid #d9d9d9;color:#595959;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">${t('clearLog')}</button>
  </span>
</div>
<div style="max-height:200px;overflow-y:auto;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fafafa">
  <div id="pklog" style="padding:8px 16px;font-size:12px;line-height:1.6;min-height:36px;font-family:inherit"></div>
</div>
`;

        document.body.appendChild(panel);
        const savedPos = JSON.parse(localStorage.getItem('pk-panel-pos') || 'null');
        if (savedPos && typeof savedPos.left === 'number') {
            panel.style.left = savedPos.left + 'px';
            panel.style.top = savedPos.top + 'px';
        }
        makeDraggable(panel);

        renderSteps();

        function toggleSection(hd) {
            const target = hd.dataset.target;
            const body = document.getElementById('pk-coll-' + target);
            const icon = hd.querySelector('.pk-toggle-icon');
            if (!body || !icon) return;
            const isOpen = body.style.maxHeight !== '0px' && body.style.maxHeight !== '';
            if (isOpen) {
                body.style.maxHeight = '0px';
                icon.style.transform = 'rotate(0deg)';
                icon.textContent = '▸';
            } else {
                body.style.maxHeight = body.scrollHeight + 40 + 'px';
                icon.style.transform = 'rotate(180deg)';
                icon.textContent = '▾';
            }
        }

        panel.querySelectorAll('.pk-section-hd').forEach(hd => {
            hd.addEventListener('click', e => {
                if (e.target.dataset.stop) return;
                toggleSection(hd);
            });
        });

        panel.querySelectorAll('.pk-tab').forEach(b => b.onclick = () => showTab(b.dataset.tab));
        panel.querySelector('#pk-add-step').onclick = () => {
            steps.push({ search: '', replace: '', enabled: true });
            renderSteps();
        };
        panel.querySelector('#pkclose').onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };

        panel.querySelector('#pk-ext-filter').oninput = () => updateFileCount();
        panel.querySelector('#pk-kind-filter').onchange = () => updateFileCount();
        panel.querySelector('#pk-name-filter').oninput = () => updateFileCount();

        panel.querySelector('#pk-dup-scan').onclick = () => {
            if (!cachedFiles.length) { log('Scan a folder first (use Scan in Rename tab)', 'skip'); return; }
            renderDuplicates();
        };
        panel.querySelector('#pk-dup-delete').onclick = executeDupDelete;

        panel.querySelector('#pk-task-toggle').onchange = function () {
            if (this.checked) startTaskPolling(Number(panel.querySelector('#pk-task-interval').value) * 1000 || 10000);
            else stopTaskPolling();
        };

        panel.querySelectorAll('.pk-media-sub').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.dataset.msub;
                panel.querySelectorAll('.pk-media-sub').forEach(b => {
                    const active = b.dataset.msub === tab;
                    b.style.background = active ? '#e6f7ff' : '#fafafa';
                    b.style.color = active ? '#1890ff' : '#8c8c8c';
                    b.style.fontWeight = active ? '600' : '400';
                    b.style.borderBottom = active ? '2px solid #1890ff' : '2px solid transparent';
                });
                panel.querySelector('#pk-media-subs').style.display = tab === 'subs' ? 'block' : 'none';
                panel.querySelector('#pk-media-episode').style.display = tab === 'episode' ? 'block' : 'none';
            };
        });

        function switchRenameSub(rs) {
            panel.querySelectorAll('.pk-rename-sub').forEach(b => {
                const active = b.dataset.rs === rs;
                b.style.background = active ? '#e6f7ff' : '#fafafa';
                b.style.color = active ? '#1890ff' : '#8c8c8c';
                b.style.fontWeight = active ? '600' : '400';
                b.style.borderBottom = active ? '2px solid #1890ff' : '2px solid transparent';
            });
            ['preview', 'history', 'presets'].forEach(id => {
                panel.querySelector('#pk-rename-' + id).style.display = id === rs ? 'block' : 'none';
            });
        }
        panel.querySelectorAll('.pk-rename-sub').forEach(btn => btn.onclick = () => switchRenameSub(btn.dataset.rs));

        function switchOrgSub(os) {
            panel.querySelectorAll('.pk-org-sub').forEach(b => {
                const active = b.dataset.os === os;
                b.style.background = active ? '#e6f7ff' : '#fafafa';
                b.style.color = active ? '#1890ff' : '#8c8c8c';
                b.style.fontWeight = active ? '600' : '400';
                b.style.borderBottom = active ? '2px solid #1890ff' : '2px solid transparent';
            });
            ['classify', 'duplicates', 'media'].forEach(id => {
                panel.querySelector('#pk-org-' + id).style.display = id === os ? 'block' : 'none';
            });
        }
        panel.querySelectorAll('.pk-org-sub').forEach(btn => btn.onclick = () => switchOrgSub(btn.dataset.os));

        panel.querySelector('#pklang').onclick = () => {
            toggleLang();
            rebuildPanel();
        };
        panel.querySelector('#pk-media-subs-scan').onclick = () => {
            if (!cachedFiles.length) { log('Scan a folder first', 'skip'); return; }
            renderMediaSubs();
        };
        panel.querySelector('#pk-media-subs-apply-exact').onclick = () => executeSubRename(false);
        panel.querySelector('#pk-media-subs-apply-all').onclick = () => executeSubRename(true);
        panel.querySelector('#pk-media-ep-scan').onclick = () => {
            if (!cachedFiles.length) { log('Scan a folder first', 'skip'); return; }
            renderMediaEpisode();
        };
        panel.querySelector('#pk-ep-format').onchange = () => renderMediaEpisode();
        panel.querySelector('#pk-media-ep-apply').onclick = executeEpisodeNorm;

        panel.querySelector('#pk-share-batch-go').onclick = executeShareBatch;
        panel.querySelector('#pk-shares-refresh').onclick = renderShareManager;
        panel.querySelector('#pk-shares-filter').onchange = renderShareManager;
        panel.querySelector('#pk-shares-delete').onclick = executeShareDelete;

        panel.querySelector('#pk-classify-add').onclick = () => showClassifyRuleEditor(-1);
        panel.querySelector('#pk-classify-scan-folder').onclick = async () => {
            if (isScanning) { log('Already scanning', 'skip'); return; }
            isScanning = true;
            const parentId = getParentId();
            log('Scanning folder...', 'info');
            try {
                cachedFiles = await fetchAllFiles(parentId);
                panel.querySelector('#pkcount').textContent = `Loaded ${cachedFiles.length} files`;
                log(`Scan complete: ${cachedFiles.length} files`, 'highlight');
                renderClassifyPreview();
            } catch (e) {
                log(`Scan error: ${e.message}`, 'error');
            } finally {
                isScanning = false;
            }
        };
        panel.querySelector('#pk-classify-scan').onclick = () => {
            if (!cachedFiles.length) { log('Please scan the folder first', 'skip'); return; }
            renderClassifyPreview();
        };
        panel.querySelector('#pk-classify-run').onclick = executeClassify;
        panel.querySelector('#pk-classify-cancel').onclick = () => {
            cancelClassifying = true;
            if (classifyPaused) {
                classifyPaused = false;
                if (resolveClassifyPause) { resolveClassifyPause(); resolveClassifyPause = null; }
                panel.querySelector('#pk-classify-pause').textContent = `⏸ ${t('pause')}`;
            }
        };
        panel.querySelector('#pk-classify-pause').onclick = () => {
            if (classifyPaused) {
                classifyPaused = false;
                if (resolveClassifyPause) { resolveClassifyPause(); resolveClassifyPause = null; }
                panel.querySelector('#pk-classify-pause').textContent = `⏸ ${t('pause')}`;
            } else {
                classifyPaused = true;
                panel.querySelector('#pk-classify-pause').textContent = `▶ ${t('resume')}`;
            }
        };

        setInterval(() => {
            const statusEl = panel.querySelector('#pkst');
            const status = credsStatus();
            statusEl.textContent = status;
            statusEl.style.background = status === 'Ready' ? '#f6ffed' : '#fff7e6';
            statusEl.style.color = status === 'Ready' ? '#389e0d' : '#d46b08';
            currentFolderId = getParentId();
            if (currentFolderId !== lastFolderId && cachedFiles.length) {
                lastFolderId = currentFolderId;
                cachedFiles = [];
                panel.querySelector('#pkcount').textContent = '';
                panel.querySelector('#pk-stats').textContent = '';
                log(t('folderSwitched'), 'skip');
                updateFileCount();
            }
            lastFolderId = currentFolderId;
        }, 800);

        panel.querySelector('#pkscan').onclick = async () => {
            if (isScanning) { log(t('scanning'), 'skip'); return; }
            isScanning = true;
            panel.querySelector('#pk-status-text').textContent = t('scanning');
            try {
                cachedFiles = await fetchAllFiles(getParentId());
                panel.querySelector('#pk-status-text').textContent = `${t('ready')} — ${cachedFiles.length} ${t('file')}(s)`;
            } catch (error) {
                log(`${t('error')}: ${error.message}`, 'fail');
                panel.querySelector('#pk-status-text').textContent = t('error');
            } finally {
                isScanning = false;
            }
            updateFileCount();
        };

        panel.querySelector('#pkpreview').onclick = () => {
            if (!cachedFiles.length) { log(t('scanFirst'), 'skip'); return; }
            showTab('rename');
            switchRenameSub('preview');
        };

        panel.querySelector('#pk-refresh-preview').onclick = () => renderPreview();

        panel.querySelector('#pkrun').onclick = async () => {
            if (isRenaming) return;
            const filtered = getFilteredFiles();
            if (!filtered.length) { log(t('noFilesToRename'), 'skip'); return; }

            isRenaming = true;
            cancelRenaming = false;
            paused = false;
            const runBtn = panel.querySelector('#pkrun');
            const cancelBtn = panel.querySelector('#pkcancel');
            const pauseBtn = panel.querySelector('#pkpause');
            const progressEl = panel.querySelector('#pkprogress');
            runBtn.style.display = 'none';
            cancelBtn.style.display = 'block';
            pauseBtn.style.display = 'block';
            pauseBtn.textContent = `⏸ ${t('pause')}`;
            panel.querySelector('#pk-status-text').textContent = t('processing');

            const config = getConfig();
            let okCount = 0, skipCount = 0, failCount = 0;
            const opFiles = [];
            const startTime = Date.now();

            log(`${t('execute')}: ${filtered.length} ${t('file')}(s), ${t('delay')} ${config.delay}ms`, 'highlight');

            for (let i = 0; i < filtered.length; i += 1) {
                if (cancelRenaming) { log(t('userCancelled'), 'error'); break; }
                if (paused) {
                    log(t('paused_'), 'skip');
                    await new Promise(resolve => { resolvePause = resolve; });
                    log(t('resumed_'), 'highlight');
                }

                const file = filtered[i];
                let newName = '';
                progressEl.textContent = `${t('progress')}: ${i + 1} / ${filtered.length}`;

                try { newName = processName(file.name, i, config); }
                catch (error) { log(`${t('skip')}: ${file.name} — ${error.message}`, 'skip'); skipCount += 1; continue; }

                if (newName === file.name) { log(`${t('skip')}: ${file.name} (${t('noChange')})`, 'skip'); skipCount += 1; continue; }

                try {
                    await renameFile(file.id, newName);
                    log(`${t('ok')}: ${file.name} → ${newName}`, 'ok');
                    okCount += 1;
                    opFiles.push({ id: file.id, oldName: file.name, newName });
                } catch (error) {
                    log(`${t('fail')}: ${file.name} — ${error.message}`, 'fail');
                    failCount += 1;
                }

                await sleep(config.delay + Math.random() * 600);
            }

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            progressEl.textContent = '';
            log(`${t('done')} (${elapsed}s). ${t('ok')}: ${okCount}  |  ${t('skip')}: ${skipCount}  |  ${t('fail')}: ${failCount}`, 'highlight');
            panel.querySelector('#pk-status-text').textContent = `${t('done')} — ${okCount} ${t('ok')}, ${failCount} ${t('fail')}`;

            if (opFiles.length) {
                const history = JSON.parse(localStorage.getItem('pk-rename-history') || '[]');
                history.push({
                    timestamp: Date.now(),
                    folderName: getParentId() || '(root)',
                    total: filtered.length, ok: okCount, skip: skipCount, fail: failCount,
                    files: opFiles,
                });
                if (history.length > 50) history.splice(0, history.length - 50);
                localStorage.setItem('pk-rename-history', JSON.stringify(history));
            }

            runBtn.style.display = 'block';
            cancelBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            isRenaming = false;
        };

        panel.querySelector('#pkcancel').onclick = () => {
            cancelRenaming = true;
            if (paused) {
                paused = false;
                if (resolvePause) { resolvePause(); resolvePause = null; }
                panel.querySelector('#pkpause').textContent = `⏸ ${t('pause')}`;
            }
        };
        panel.querySelector('#pkpause').onclick = () => {
            if (paused) {
                paused = false;
                if (resolvePause) { resolvePause(); resolvePause = null; }
                panel.querySelector('#pkpause').textContent = `⏸ ${t('pause')}`;
            } else {
                paused = true;
                panel.querySelector('#pkpause').textContent = `▶ ${t('resume')}`;
            }
        };

        panel.querySelector('#pk-copy-log').onclick = copyLog;
        panel.querySelector('#pk-clear-log').onclick = clearLog;

        panel.querySelector('#pk-preset-save').onclick = () => {
            const name = panel.querySelector('#pk-preset-name').value.trim();
            if (!name) { log(t('presetName'), 'skip'); return; }
            const presets = JSON.parse(localStorage.getItem('pk-rename-presets') || '{}');
            presets[name] = getConfig();
            localStorage.setItem('pk-rename-presets', JSON.stringify(presets));
            log(`${t('savedPreset')}: ${name}`, 'highlight');
            panel.querySelector('#pk-preset-name').value = '';
            renderPresets();
        };

        panel.querySelector('#pk-preset-export').onclick = () => {
            const presets = localStorage.getItem('pk-rename-presets') || '{}';
            navigator.clipboard.writeText(presets).then(() => {
                log(t('exportDone'), 'highlight');
            }).catch(err => {
                log(`${t('fail')}: ${err.message}`, 'fail');
            });
        };

        panel.querySelector('#pk-preset-import').onclick = () => {
            const raw = prompt(t('importPrompt'));
            if (!raw) return;
            try {
                const data = JSON.parse(raw);
                if (typeof data !== 'object') throw new Error(t('error'));
                const existing = JSON.parse(localStorage.getItem('pk-rename-presets') || '{}');
                Object.assign(existing, data);
                localStorage.setItem('pk-rename-presets', JSON.stringify(existing));
                log(t('importSuccess'), 'highlight');
                renderPresets();
            } catch (e) {
                log(`${t('importFail')}: ${e.message}`, 'error');
            }
        };

        panel.querySelector('#pk-clear-history').onclick = () => {
            if (confirm(t('confirmClear'))) {
                localStorage.setItem('pk-rename-history', '[]');
                renderHistory();
                log(t('historyCleared'), 'skip');
            }
        };

        log(`PikPak Rename Pro ${VERSION} ${t('loaded')}. ${t('scan')} ${t('folder')} ${t('scan')}`, 'highlight');
    }

    hookFetch();
    hookXHR();
    window.addEventListener('load', () => setTimeout(createUI, 2500));
})();
