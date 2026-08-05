// ==UserScript==
// @name         PikPak Rename Pro
// @namespace    pikpak-pro
// @version      8.3
// @description  Batch rename & organize files on PikPak. Multi-step pipeline, preview, rollback, classify, dedup.
// @match        https://mypikpak.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api-drive.mypikpak.com
// ==/UserScript==

(function () {
    'use strict';

    // ===== CONSTANTS =====
    const VERSION = 'v8.3';
    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const API = 'https://api-drive.mypikpak.com/drive/v1';
    const CREDS = { token: '', deviceId: '', captchaToken: '', clientId: '', clientVersion: '' };

    // ===== L10N =====
    const T = {
        tabRename: '重命名', tabOrganize: '整理', tabHelp: '帮助',
        steps: '查找替换', preview: '预览', fileList: '文件列表', history: '历史', presets: '预设',
        naming: '命名选项', prefix: '前缀', suffix: '后缀', insertMid: '中间插入',
        insertMidPos: '插入位置', insertMidPosIdx: '第几个字符后',
        caseType: '大小写', caseNone: '不变', caseUpper: '全大写', caseLower: '全小写', caseTitle: '首字母大写',
        useIndex: '编号', indexStart: '起始', indexPad: '补齐',
        indexPos: '位置', indexPosPrefix: '名称前', indexPosSuffix: '名称后',
        indexSep: '分隔符', indexSepNone: '无',
        keepExt: '保留扩展名', filter: '筛选', nameContains: '文件名包含',
        typeFilter: '类型', allTypes: '全部',
        scan: '扫描', stop: '停止', execute: '执行', pause: '暂停', resume: '继续',
        cancel: '取消', undo: '撤销', clear: '清空', copy: '复制', save: '保存', load: '加载',
        delete: '删除', add: '添加', resetFields: '清空字段',
        search_: '查找', replace_: '替换为', enabled: '启用',
        delay: '延迟', ms: '毫秒',
        ready: '就绪', scanning: '扫描中\u2026', processing: '处理中\u2026',
        done: '完成', error: '错误', ok: '成功', fail: '失败', skip: '跳过',
        loaded: '已加载', file: '个文件', total: '共',
        scanFirst: '请先扫描文件夹', noFilesToRename: '没有可重命名的文件', noFiles: '没有文件', noRules: '没有规则',
        userCancelled: '已取消', forceStop: '正在强制停止扫描\u2026',
        progress: '进度', elapsed: '耗时',
        paused_: '已暂停', resumed_: '继续',
        confirmClear: '确认清空所有重命名历史？', historyCleared: '历史已清空',
        noHistory: '暂无重命名历史', noPresets: '暂无保存的预设',
        presetName: '预设名称',
        savedPreset: '预设已保存', exportDone: '预设已复制到剪贴板',
        importPrompt: '请粘贴预设 JSON：', importSuccess: '预设已导入', importFail: '导入失败',
        confirmRollback: '确认撤销 %n 个文件的重命名？', rollingBack: '正在撤销 %n 个文件的重命名\u2026',
        rollbackDone: '已撤销，恢复了', noRollbackTarget: '没有可撤销的重命名',
        folderSwitched: '文件夹已切换，缓存已清空',
        statusMissingClick: '缺少凭证，请在 PikPak 中点击任意文件夹',
        rateLimited: '请求频率受限，正在退避', rootFolder: '根目录', viewNoId: '视图，无文件夹 ID',
        helpTitle: '使用说明',
        helpScan: '扫描文件',
        helpScanDesc: '在 PikPak 中进入目标文件夹，点击「扫描」按钮。脚本会自动从 URL 或 PikPak API 请求中提取文件夹 ID。',
        helpSteps: '查找替换（多步骤管道）',
        helpStepsDesc: '每个步骤对文件名（不含扩展名）执行一次正则查找替换。从上到下依次执行。勾选复选框启用/禁用。查找框留空则跳过该步骤。',
        helpStepsEx: '文件 "1海绵宝宝.mp4" \u2192 查找 "^[0-9]+" 替换 "" \u2192 结果 "海绵宝宝.mp4"',
        helpNaming: '命名选项',
        helpNamingDesc: '前缀/后缀在文件名前后添加。中间插入在指定字符位置后插入文本。大小写转换字母大小写。编号添加自动序号，可自定义位置、起始值、补齐位数和分隔符。保留扩展名保持文件类型不变。',
        helpPreview: '预览与执行',
        helpPreviewDesc: '配置好规则后，点击扫描然后查看预览。蓝色行 = 将被重命名，灰色行 = 无变化（跳过），红色行 = 错误。只有变化的文件才会实际重命名。',
        helpRollback: '回滚',
        helpRollbackDesc: '每次成功重命名都会记录在历史中。点击撤销按钮可恢复。回滚通过调用重命名 API 恢复原始名称。',
        helpRegex: '正则速查',
        helpRegexDesc: '查找框支持 JavaScript 正则表达式：',
        helpRegexDigit: '匹配一个或多个数字（如集数编号）',
        helpRegexSpace: '匹配空白字符（空格、制表符）',
        helpRegexStartNum: '匹配开头的数字',
        helpRegexBracket: '匹配方括号内的内容如 [1080p]',
        helpFilter: '文件筛选',
        helpFilterDesc: '使用「文件名包含」筛选含特定关键词的文件。使用类型下拉按类型筛选。',
        helpTrouble: '故障排查',
        helpTroubleDesc: '所有文件被跳过：没有配置查找替换步骤（查找框为空）。扫描到 0 个文件：先在 PikPak 中点击任意文件夹加载凭证，再在控制台执行 window.PK_DEBUG() 查看。改名失败报 401：凭证过期，在 PikPak 页面点击几下刷新。',
        classify: '分类', duplicates: '去重',
        classifyRule: '分类规则', ruleName: '规则名称', rulePattern: '匹配模式',
        ruleFolder: '目标文件夹', addRule: '添加规则',
        classifyRun: '执行分类', classifyPreview: '预览分类',
        dupScan: '扫描重复', dupExport: '导出 CSV', dupDelete: '删除选中',
        dupTrash: '移至回收站', dupRecursive: '递归扫描子文件夹',
        dupMaxDepth: '最大深度', dupMaxRequests: '最大请求数',
        dupNoDupes: '未发现重复文件', confirmDeleteDup: '确认删除选中的重复文件？此操作不可撤销。',
        exportDoneCSV: 'CSV 已导出',
    };
    function t(key) { return T[key] || key; }

    // ===== CREDENTIAL CAPTURE (from v6.0 — proven working) =====
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
            if (typeof value !== 'string' || !value) continue;
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
                let urlHint = '';
                if (typeof input === 'string') urlHint = input;
                else if (input && typeof input === 'object' && input.url) urlHint = input.url;
                captureParentIdFromUrl(urlHint);
            } catch (_) {}
            return originalFetch.apply(this, args);
        };
    }

    function hookXHR() {
        const proto = pageWindow.XMLHttpRequest && pageWindow.XMLHttpRequest.prototype;
        if (!proto || typeof proto.setRequestHeader !== 'function') return;
        const origSetHeader = proto.setRequestHeader;
        const origOpen = proto.open;
        proto.open = function (method, url) {
            try { this._pkUrl = String(url || ''); captureParentIdFromUrl(this._pkUrl); } catch (_) {}
            return origOpen.apply(this, arguments);
        };
        proto.setRequestHeader = function (key, value) {
            try { extractHeaders({ [key]: value }); } catch (_) {}
            return origSetHeader.apply(this, arguments);
        };
    }

    // ===== FOLDER ID =====
    let LAST_SEEN_PARENT_ID = '', LAST_SEEN_PARENT_TS = 0;
    const PARENT_ID_TTL = 5 * 60 * 1000;

    function captureParentIdFromUrl(url) {
        if (!url) return;
        try {
            const u = new URL(url, pageWindow.location.origin);
            const pid = u.searchParams.get('parent_id');
            if (pid) { LAST_SEEN_PARENT_ID = pid; LAST_SEEN_PARENT_TS = Date.now(); }
        } catch (_) {}
    }

    function getParentId() {
        const href = String(pageWindow.location.href || '');
        const pathname = String(pageWindow.location.pathname || '');
        const hash = String(pageWindow.location.hash || '');
        const patterns = [
            /folder\/([A-Za-z0-9_.~-]+)/,
            /\/drive\/all\/([A-Za-z0-9_.~-]+)/,
            /parent_id=([A-Za-z0-9_.~-]+)/,
            /\/drive\/(?:home|star|recent)\/([A-Za-z0-9_.~-]+)/,
        ];
        for (const source of [href, pathname, hash]) {
            for (const p of patterns) {
                const m = source.match(p);
                if (m && m[1]) return m[1];
            }
        }
        if (LAST_SEEN_PARENT_ID && (Date.now() - LAST_SEEN_PARENT_TS) < PARENT_ID_TTL)
            return LAST_SEEN_PARENT_ID;
        return '';
    }

    // ===== API LAYER (from v6.0 — proven working) =====
    function buildHeaders(includeJsonBody) {
        const h = { Accept: 'application/json' };
        if (includeJsonBody) h['Content-Type'] = 'application/json';
        if (CREDS.token) h.Authorization = 'Bearer ' + CREDS.token;
        if (CREDS.deviceId) h['X-Device-Id'] = CREDS.deviceId;
        if (CREDS.captchaToken) h['X-Captcha-Token'] = CREDS.captchaToken;
        if (CREDS.clientId) h['X-Client-Id'] = CREDS.clientId;
        if (CREDS.clientVersion) h['X-Client-Version'] = CREDS.clientVersion;
        return h;
    }

    function credsReady() { return Boolean(CREDS.token && CREDS.deviceId && CREDS.captchaToken); }

    function credsStatus() {
        if (credsReady()) return 'Ready';
        const m = [];
        if (!CREDS.token) m.push('Token');
        if (!CREDS.deviceId) m.push('DeviceId');
        if (!CREDS.captchaToken) m.push('Captcha');
        return t('statusMissingClick') + ': ' + m.join('/');
    }

    let cancelScan = false;

    function gmRequest(method, url, opts, _retry) {
        const { headers = {}, body, timeout = 30000 } = opts || {};
        const maxRetries = _retry?.maxRetries ?? 3;
        const attempt = _retry?.attempt ?? 0;
        return new Promise((resolve, reject) => {
            let settled = false, watchdog = null, handle = null;
            const fail = (err) => {
                if (settled) return;
                settled = true;
                if (watchdog) clearTimeout(watchdog);
                if (handle && typeof handle.abort === 'function') { try { handle.abort(); } catch (_) {} }
                reject(err);
            };
            const ok = (val) => {
                if (settled) return;
                settled = true;
                if (watchdog) clearTimeout(watchdog);
                resolve(val);
            };
            const scheduleRetry = (ms) => {
                if (watchdog) { clearTimeout(watchdog); watchdog = null; }
                setTimeout(() => gmRequest(method, url, opts, { maxRetries, attempt: attempt + 1 }).then(ok).catch(fail), ms);
            };
            watchdog = setTimeout(() => fail(new Error('Watchdog timeout after ' + (timeout + 5000) + 'ms')), timeout + 5000);
            try {
                handle = GM_xmlhttpRequest({
                    method, url, headers, data: body, responseType: 'text', timeout,
                    onload: r => {
                        if (r.status === 429 && attempt < maxRetries) {
                            scheduleRetry(2000 * Math.pow(2, attempt) + Math.floor(Math.random() * 1000));
                            return;
                        }
                        if (r.status >= 500 && attempt < maxRetries) {
                            scheduleRetry(1500 * (attempt + 1) + Math.floor(Math.random() * 500));
                            return;
                        }
                        ok(r);
                    },
                    onerror: e => fail(new Error(e?.error || 'Network error')),
                    ontimeout: () => fail(new Error('Request timed out')),
                });
            } catch (e) { fail(new Error('GM_xmlhttpRequest threw: ' + e.message)); }
        });
    }

    function parseJsonResponse(r) {
        const t = r.responseText || '';
        if (!t) return {};
        try { return JSON.parse(t); } catch (_) { throw new Error('Invalid JSON (HTTP ' + r.status + ')'); }
    }

    async function apiFetch(method, path, opts) {
        if (!credsReady()) throw new Error('Credentials not ready');
        const { body, params } = opts || {};
        let url = API + path;
        if (params) url += '?' + new URLSearchParams(params).toString();
        const r = await gmRequest(method, url, { headers: buildHeaders(!!body), body: body ? JSON.stringify(body) : undefined });
        if (r.status >= 200 && r.status < 300) return parseJsonResponse(r);
        throw new Error('HTTP ' + r.status + ': ' + (r.responseText || 'Request failed'));
    }

    // ===== FILE OPERATIONS (from v6.0 — proven working) =====
    function normalizeEntries(data) {
        const raw = Array.isArray(data?.files) ? data.files : [];
        return raw.filter(e => e && e.id && e.name).map(e => ({
            id: e.id, name: e.name,
            kind: e.kind || e.type || 'unknown',
            size: e.size ? Number(e.size) : 0,
            hash: e.hash || '', md5: e.md5_checksum || '',
            mimeType: e.mime_type || '', parentId: e.parent_id || '',
            createdTime: e.created_time || '', modifiedTime: e.modified_time || '',
            starred: !!e.starred,
        }));
    }

    async function fetchAllFiles(parentId) {
        if (!credsReady()) throw new Error('Credentials not ready');
        const files = [];
        let pageToken = '', pageCount = 0, emptyStreak = 0;
        const seenTokens = new Set();
        const MAX_PAGES = 200, MAX_EMPTY = 3;
        cancelScan = false;
        do {
            if (cancelScan) break;
            if (++pageCount > MAX_PAGES) { log('Safety limit: ' + MAX_PAGES + ' pages', 'fail'); break; }
            const params = new URLSearchParams({ page_size: '100' });
            if (parentId) params.set('parent_id', parentId);
            if (pageToken) params.set('page_token', pageToken);
            const r = await gmRequest('GET', API + '/files?' + params.toString(), { headers: buildHeaders() });
            if (r.status < 200 || r.status >= 300) throw new Error('HTTP ' + r.status + ': ' + (r.responseText || 'Request failed'));
            const data = parseJsonResponse(r);
            const pageFiles = normalizeEntries(data);
            pageFiles.forEach(f => files.push(f));
            const nt = data.next_page_token || '';
            if (nt) {
                if (seenTokens.has(nt)) { log('Detected duplicate next_page_token, stopping', 'fail'); break; }
                seenTokens.add(nt);
                if (pageFiles.length === 0) {
                    if (++emptyStreak >= MAX_EMPTY) { log(MAX_EMPTY + ' consecutive empty pages, stopping', 'fail'); break; }
                } else { emptyStreak = 0; }
            }
            pageToken = nt;
            if (pageToken) await sleep(400 + Math.random() * 300);
        } while (pageToken);
        return files;
    }

    async function renameFile(id, newName) {
        await apiFetch('PATCH', '/files/' + id, { body: { name: newName } });
    }

    async function moveFile(id, parentId) {
        await apiFetch('PATCH', '/files/' + id, { body: { parent_id: parentId } });
    }

    async function trashFile(id) {
        await apiFetch('PATCH', '/files/' + id, { body: { trashed: true } });
    }

    async function deleteFiles(ids) {
        const BATCH = 10, delay = 1000;
        for (let i = 0; i < ids.length; i += BATCH) {
            await apiFetch('POST', '/files:batchDelete', { body: { ids: ids.slice(i, i + BATCH) } });
            if (i + BATCH < ids.length) await sleep(delay + Math.random() * 300);
        }
    }

    async function findOrCreateFolder(name, parentId) {
        if (!name) throw new Error('Folder name required');
        const all = await fetchAllFiles(parentId);
        const existing = all.find(f => f.kind === 'drive#folder' && f.name === name);
        if (existing) return existing.id;
        const data = await apiFetch('POST', '/files', { body: { kind: 'drive#folder', name: name, parent_id: parentId } });
        return data.file?.id || data.id;
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // ===== RENAME PIPELINE =====
    function processName(filename, index, steps, naming) {
        const dot = filename.lastIndexOf('.');
        let name = dot === -1 ? filename : filename.slice(0, dot);
        const ext = dot === -1 ? '' : filename.slice(dot);
        for (const s of steps) {
            if (!s.enabled || !s.search) continue;
            try { name = name.replace(new RegExp(s.search, 'g'), s.replace); }
            catch (e) { throw new Error('Invalid regex "' + s.search + '": ' + e.message); }
        }
        if (naming.prefix) name = naming.prefix + name;
        if (naming.insertMid) {
            const pos = Math.min(Math.max(0, Number(naming.insertMidPos) || 0), name.length);
            name = name.slice(0, pos) + naming.insertMid + name.slice(pos);
        }
        if (naming.suffix) name = name + naming.suffix;
        switch (naming.caseType) {
            case 'upper': name = name.toUpperCase(); break;
            case 'lower': name = name.toLowerCase(); break;
            case 'title': name = name.replace(/\b\w/g, c => c.toUpperCase()); break;
        }
        if (naming.useIndex) {
            const start = Number(naming.indexStart) || 1;
            const pad = Math.max(1, Number(naming.indexPad) || 2);
            const sep = naming.indexSep || '_';
            const idxStr = String(start + index).padStart(pad, '0');
            if (naming.indexPos === 'prefix') name = idxStr + sep + name;
            else name = name + sep + idxStr;
        }
        return naming.keepExt !== false ? name + ext : name;
    }

    // ===== STATE =====
    let panel, trayIcon, currentTab = 'rename', renameSub = 'steps';
    let cachedFiles = [], isScanning = false, isRenaming = false, cancelRenaming = false;
    let paused = false, resolvePause = null;
    let currentFolderId = '', lastFolderId = '';
    let steps = [{ search: '', replace: '', enabled: true }];
    let renameHistory = JSON.parse(localStorage.getItem('pk-rename-history') || '[]');
    let presets = JSON.parse(localStorage.getItem('pk-presets') || '[]');
    let classifyRules = JSON.parse(localStorage.getItem('pk-classify-rules') || '[]');
    let isClassifying = false, cancelClassifying = false;

    // ===== LOG =====
    function log(msg, type) {
        const box = panel.querySelector('#pklog');
        if (!box) return;
        const colors = { ok: '#059669', fail: '#dc2626', skip: '#9ca3af', error: '#d97706', highlight: '#2563eb', info: '#6b7280' };
        const div = document.createElement('div');
        div.style.cssText = 'color:' + (colors[type] || '#374151') + ';line-height:1.6;font-size:11px';
        div.textContent = msg;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    // ===== FILTER =====
    function getFilteredFiles() {
        const nameFilter = (panel.querySelector('#pk-name-filter')?.value || '').toLowerCase();
        const typeFilter = panel.querySelector('#pk-type-filter')?.value || '';
        return cachedFiles.filter(f => {
            if (nameFilter && !f.name.toLowerCase().includes(nameFilter)) return false;
            if (typeFilter) {
                if (typeFilter === 'folder') return f.kind === 'drive#folder';
                if (typeFilter === 'video') return /\.(mp4|mkv|avi|mov|flv|wmv|webm|m4v)$/i.test(f.name);
                if (typeFilter === 'audio') return /\.(mp3|flac|wav|aac|ogg|wma|m4a)$/i.test(f.name);
                if (typeFilter === 'image') return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name);
                if (typeFilter === 'archive') return /\.(zip|rar|7z|tar|gz)$/i.test(f.name);
                if (typeFilter === 'subtitle') return /\.(srt|ass|ssa|vtt|sub)$/i.test(f.name);
            }
            return true;
        });
    }

    function getNamingConfig() {
        return {
            prefix: panel.querySelector('#pk-prefix')?.value || '',
            suffix: panel.querySelector('#pk-suffix')?.value || '',
            insertMid: panel.querySelector('#pk-insert-mid')?.value || '',
            insertMidPos: panel.querySelector('#pk-insert-mid-pos')?.value || '0',
            caseType: panel.querySelector('#pk-case')?.value || 'none',
            useIndex: panel.querySelector('#pk-use-index')?.checked || false,
            indexStart: panel.querySelector('#pk-index-start')?.value || '1',
            indexPad: panel.querySelector('#pk-index-pad')?.value || '2',
            indexPos: panel.querySelector('#pk-index-pos')?.value || 'suffix',
            indexSep: panel.querySelector('#pk-index-sep')?.value || '_',
            keepExt: panel.querySelector('#pk-keep-ext')?.checked !== false,
        };
    }

    // ===== PREVIEW =====
    function renderPreview() {
        const container = panel.querySelector('#pk-preview-list');
        if (!container) return;
        const filtered = getFilteredFiles();
        const naming = getNamingConfig();
        const enabledSteps = steps.filter(s => s.enabled && s.search);
        if (!filtered.length) { container.innerHTML = '<div class="pk-empty">' + t('scanFirst') + '</div>'; return; }
        if (!enabledSteps.length && !naming.prefix && !naming.suffix && !naming.insertMid && naming.caseType === 'none' && !naming.useIndex) {
            container.innerHTML = '<div class="pk-empty">' + t('noFilesToRename') + '</div>';
            return;
        }
        let html = '';
        filtered.forEach((f, i) => {
            let newName = '';
            try { newName = processName(f.name, i, steps, naming); } catch (e) { newName = 'ERROR: ' + e.message; }
            const changed = newName !== f.name && !newName.startsWith('ERROR');
            const cls = newName.startsWith('ERROR') ? 'pk-preview-row pk-preview-error' : (changed ? 'pk-preview-row pk-preview-changed' : 'pk-preview-row pk-preview-skip');
            html += '<div class="' + cls + '"><span class="pk-preview-old">' + escHtml(f.name) + '</span>';
            if (changed) html += ' <span class="pk-preview-arrow">&rarr;</span> <span class="pk-preview-new">' + escHtml(newName) + '</span>';
            else if (newName.startsWith('ERROR')) html += ' <span class="pk-preview-new">' + escHtml(newName) + '</span>';
            html += '</div>';
        });
        container.innerHTML = html;
        const stats = panel.querySelector('#pk-stats');
        if (stats) {
            const changed = filtered.filter((f, i) => {
                try { return processName(f.name, i, steps, naming) !== f.name; } catch (_) { return false; }
            }).length;
            stats.textContent = t('total') + ' ' + filtered.length + ' ' + t('file') + ' \u00b7 ' + changed + ' ' + t('ok');
        }
    }

    function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function escHtmlAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // ===== FILE LIST =====
    function renderFileList() {
        const container = panel.querySelector('#pk-file-list');
        if (!container) return;
        if (!cachedFiles.length) { container.innerHTML = '<div class="pk-empty">' + t('scanFirst') + '</div>'; return; }
        const filtered = getFilteredFiles();
        let html = '<div class="pk-filelist-header">' + t('loaded') + ': ' + cachedFiles.length + ' ' + t('file');
        if (filtered.length !== cachedFiles.length) html += ' (' + t('filter') + ': ' + filtered.length + ')';
        html += '</div>';
        filtered.forEach((f, i) => {
            const icon = f.kind === 'drive#folder' ? '\u{1F4C1}' : '\u{1F4C4}';
            html += '<div class="pk-filelist-item"><span class="pk-filelist-num">' + (i + 1) + '.</span> <span class="pk-filelist-icon">' + icon + '</span> <span class="pk-filelist-name">' + escHtml(f.name) + '</span></div>';
        });
        container.innerHTML = html;
    }

    // ===== HISTORY =====
    function saveHistory() { localStorage.setItem('pk-rename-history', JSON.stringify(renameHistory.slice(-200))); }

    function renderHistory() {
        const container = panel.querySelector('#pk-history-list');
        if (!container) return;
        if (!renameHistory.length) { container.innerHTML = '<div class="pk-empty">' + t('noHistory') + '</div>'; return; }
        let html = '';
        renameHistory.slice().reverse().forEach(h => {
            html += '<div class="pk-history-item"><span class="pk-history-old">' + escHtml(h.oldName) + '</span> <span class="pk-history-arrow">&rarr;</span> <span class="pk-history-new">' + escHtml(h.newName) + '</span><span class="pk-history-time">' + new Date(h.time).toLocaleString('zh-CN') + '</span><button class="pk-btn-sm pk-btn-ghost pk-undo-one" data-id="' + escHtml(h.id) + '" data-name="' + escHtmlAttr(h.oldName) + '">' + t('undo') + '</button></div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.pk-undo-one').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id, oldName = btn.dataset.name;
                try { await renameFile(id, oldName); renameHistory = renameHistory.filter(h => h.id !== id); saveHistory(); renderHistory(); }
                catch (e) { log(t('error') + ': ' + e.message, 'fail'); }
            };
        });
    }

    // ===== PRESETS =====
    function savePresets() { localStorage.setItem('pk-presets', JSON.stringify(presets)); }

    function renderPresets() {
        const container = panel.querySelector('#pk-presets-list');
        if (!container) return;
        if (!presets.length) { container.innerHTML = '<div class="pk-empty">' + t('noPresets') + '</div>'; return; }
        let html = '';
        presets.forEach((p, i) => {
            html += '<div class="pk-preset-item"><span>' + escHtml(p.name) + '</span><div><button class="pk-btn-sm pk-btn-ghost pk-preset-load" data-idx="' + i + '">' + t('load') + '</button><button class="pk-btn-sm pk-btn-danger-text pk-preset-del" data-idx="' + i + '">' + t('delete') + '</button></div></div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.pk-preset-load').forEach(btn => {
            btn.onclick = () => {
                const p = presets[Number(btn.dataset.idx)];
                steps = JSON.parse(JSON.stringify(p.steps));
                renderSteps();
                log(t('savedPreset') + ': ' + p.name, 'ok');
            };
        });
        container.querySelectorAll('.pk-preset-del').forEach(btn => {
            btn.onclick = () => { presets.splice(Number(btn.dataset.idx), 1); savePresets(); renderPresets(); };
        });
    }

    // ===== STEPS UI =====
    function renderSteps() {
        const container = panel.querySelector('#pk-steps-container');
        if (!container) return;
        let html = '';
        steps.forEach((s, i) => {
            html += '<div class="pk-step-row"><label class="pk-step-toggle"><input type="checkbox" class="pk-step-enabled" data-idx="' + i + '"' + (s.enabled ? ' checked' : '') + '> ' + t('enabled') + '</label><input class="pk-step-search pk-input" value="' + escHtmlAttr(s.search) + '" placeholder="' + t('search_') + '" data-idx="' + i + '"><input class="pk-step-replace pk-input" value="' + escHtmlAttr(s.replace) + '" placeholder="' + t('replace_') + '" data-idx="' + i + '"><button class="pk-btn-sm pk-btn-danger-text pk-step-del" data-idx="' + i + '">&times;</button></div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.pk-step-enabled').forEach(cb => {
            cb.onchange = () => { steps[Number(cb.dataset.idx)].enabled = cb.checked; renderPreview(); };
        });
        container.querySelectorAll('.pk-step-search, .pk-step-replace').forEach(inp => {
            inp.oninput = () => {
                const idx = Number(inp.dataset.idx);
                if (inp.classList.contains('pk-step-search')) steps[idx].search = inp.value;
                else steps[idx].replace = inp.value;
                renderPreview();
            };
        });
        container.querySelectorAll('.pk-step-del').forEach(btn => {
            btn.onclick = () => { if (steps.length > 1) { steps.splice(Number(btn.dataset.idx), 1); renderSteps(); } };
        });
    }

    // ===== CLASSIFY =====
    function saveClassifyRules() { localStorage.setItem('pk-classify-rules', JSON.stringify(classifyRules)); }

    function renderClassifyRules() {
        const container = panel.querySelector('#pk-classify-rules');
        if (!container) return;
        let html = '';
        classifyRules.forEach((r, i) => {
            html += '<div class="pk-classify-rule"><input class="pk-input pk-cr-name" value="' + escHtmlAttr(r.name) + '" placeholder="' + t('ruleName') + '" data-idx="' + i + '"><input class="pk-input pk-cr-pattern" value="' + escHtmlAttr(r.pattern) + '" placeholder="' + t('rulePattern') + '" data-idx="' + i + '"><input class="pk-input pk-cr-folder" value="' + escHtmlAttr(r.folder) + '" placeholder="' + t('ruleFolder') + '" data-idx="' + i + '"><button class="pk-btn-sm pk-btn-danger-text pk-cr-del" data-idx="' + i + '">&times;</button></div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.pk-cr-name').forEach(inp => { inp.oninput = () => { classifyRules[Number(inp.dataset.idx)].name = inp.value; saveClassifyRules(); }; });
        container.querySelectorAll('.pk-cr-pattern').forEach(inp => { inp.oninput = () => { classifyRules[Number(inp.dataset.idx)].pattern = inp.value; saveClassifyRules(); }; });
        container.querySelectorAll('.pk-cr-folder').forEach(inp => { inp.oninput = () => { classifyRules[Number(inp.dataset.idx)].folder = inp.value; saveClassifyRules(); }; });
        container.querySelectorAll('.pk-cr-del').forEach(btn => { btn.onclick = () => { classifyRules.splice(Number(btn.dataset.idx), 1); saveClassifyRules(); renderClassifyRules(); }; });
    }

    function renderClassifyPreview() {
        const container = panel.querySelector('#pk-classify-preview');
        if (!container) return;
        if (!classifyRules.length) { container.innerHTML = '<div class="pk-empty">' + t('noRules') + '</div>'; return; }
        if (!cachedFiles.length) { container.innerHTML = '<div class="pk-empty">' + t('scanFirst') + '</div>'; return; }
        let html = '';
        cachedFiles.forEach(f => {
            let matched = '';
            for (const r of classifyRules) {
                try { if (new RegExp(r.pattern, 'i').test(f.name)) { matched = r.folder; break; } } catch (_) {}
            }
            html += '<div class="pk-preview-row ' + (matched ? 'pk-preview-changed' : 'pk-preview-skip') + '"><span>' + escHtml(f.name) + '</span>' + (matched ? ' <span class="pk-preview-arrow">&rarr;</span> <span>' + escHtml(matched) + '</span>' : '') + '</div>';
        });
        container.innerHTML = html || '<div class="pk-empty">' + t('noFiles') + '</div>';
    }

    async function executeClassify() {
        if (isClassifying) return;
        if (!cachedFiles.length) { log(t('scanFirst'), 'skip'); return; }
        if (!classifyRules.length) { log(t('noRules'), 'skip'); return; }
        isClassifying = true; cancelClassifying = false;
        const parentId = getParentId();
        const delay = Number(panel.querySelector('#pk-delay')?.value) || 1500;
        let okCount = 0, skipCount = 0, failCount = 0;
        const folderCache = {};
        log('Classify: ' + cachedFiles.length + ' ' + t('file'), 'highlight');
        for (const f of cachedFiles) {
            if (cancelClassifying) { log(t('userCancelled'), 'error'); break; }
            let matched = null;
            for (const r of classifyRules) {
                try { if (new RegExp(r.pattern, 'i').test(f.name)) { matched = r; break; } } catch (_) {}
            }
            if (!matched) { skipCount++; continue; }
            try {
                if (!folderCache[matched.folder]) folderCache[matched.folder] = await findOrCreateFolder(matched.folder, parentId);
                await moveFile(f.id, folderCache[matched.folder]);
                okCount++;
                log('OK: ' + f.name + ' \u2192 ' + matched.folder, 'ok');
            } catch (e) {
                failCount++;
                log('Fail: ' + f.name + ' \u2192 ' + e.message, 'fail');
            }
            await sleep(delay + Math.random() * 300);
        }
        log(t('done') + ': ' + okCount + ' / ' + skipCount + ' / ' + failCount, 'highlight');
        isClassifying = false;
    }

    // ===== DUPLICATES =====
    function detectDuplicates(files) {
        const map = {};
        files.forEach(f => { const key = f.name + '|' + f.size; if (!map[key]) map[key] = []; map[key].push(f); });
        return Object.values(map).filter(g => g.length > 1);
    }

    function renderDuplicates() {
        const container = panel.querySelector('#pk-dup-list');
        if (!container) return;
        const groups = detectDuplicates(cachedFiles);
        if (!groups.length) { container.innerHTML = '<div class="pk-empty">' + t('dupNoDupes') + '</div>'; return; }
        let html = '';
        groups.forEach((g, gi) => {
            html += '<div class="pk-dup-group"><div class="pk-dup-group-header">' + escHtml(g[0].name) + ' (' + g.length + ')</div>';
            g.forEach(f => {
                html += '<div class="pk-dup-item"><label><input type="checkbox" class="pk-dup-cb" data-id="' + escHtml(f.id) + '" data-gid="' + gi + '"> ' + escHtml(f.id) + ' | ' + formatSize(f.size) + '</label></div>';
            });
            html += '</div>';
        });
        container.innerHTML = html;
    }

    function formatSize(bytes) {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0, s = bytes;
        while (s >= 1024 && i < units.length - 1) { s /= 1024; i++; }
        return s.toFixed(1) + ' ' + units[i];
    }

    // ===== TRAY =====
    function createTray() {
        if (document.querySelector('#pk-tray')) return;
        trayIcon = document.createElement('div');
        trayIcon.id = 'pk-tray';
        Object.assign(trayIcon.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#f3f4f6', color: '#2563eb',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: '99998', fontSize: '12px', fontWeight: '700',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'transform 0.15s, box-shadow 0.15s',
        });
        trayIcon.textContent = 'PR';
        trayIcon.title = 'PikPak Rename Pro';
        trayIcon.onmouseenter = () => { trayIcon.style.transform = 'scale(1.1)'; trayIcon.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; };
        trayIcon.onmouseleave = () => { trayIcon.style.transform = 'scale(1)'; trayIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; };
        trayIcon.onclick = () => { panel.style.display = 'flex'; trayIcon.style.display = 'none'; };
        document.body.appendChild(trayIcon);
    }

    function minimizeToTray() {
        panel.style.display = 'none';
        if (trayIcon) trayIcon.style.display = 'flex';
    }

    // ===== DRAG =====
    function makeDraggable(el) {
        let dragging = false, ox = 0, oy = 0;
        const handle = el.querySelector('#pkhandle');
        if (!handle) return;
        handle.onmousedown = e => { dragging = true; ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop; e.preventDefault(); };
        document.addEventListener('mousemove', e => { if (!dragging) return; el.style.left = (e.clientX - ox) + 'px'; el.style.top = (e.clientY - oy) + 'px'; });
        document.addEventListener('mouseup', () => { dragging = false; });
    }

    // ===== UI =====
    function createUI() {
        if (document.querySelector('#pk-rename-pro-panel')) return;
        createTray();

        panel = document.createElement('div');
        panel.id = 'pk-rename-pro-panel';
        Object.assign(panel.style, {
            position: 'fixed', top: '80px', left: '20px',
            width: '460px', maxHeight: '88vh',
            background: '#ffffff', color: '#1f2937',
            border: '1px solid #e5e7eb', borderRadius: '12px',
            zIndex: '99999',
            fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
            fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        });

        panel.innerHTML = `
<div id="pkhandle" style="cursor:move;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #f3f4f6;flex-shrink:0;user-select:none;background:#fafbfc">
  <div style="display:flex;align-items:center;gap:10px">
    <span style="font-weight:600;font-size:14px;color:#111827;letter-spacing:-0.2px">PikPak Rename Pro</span>
    <span style="font-size:10px;color:#9ca3af;font-weight:500;background:#f3f4f6;padding:1px 6px;border-radius:4px">${VERSION}</span>
  </div>
  <div style="display:flex;align-items:center;gap:8px">
    <span id="pkst" style="font-size:10px;padding:2px 8px;border-radius:10px;background:#fef3c7;color:#92400e;font-weight:500">\u2026</span>
    <button id="pk-minimize" title="\u6700\u5c0f\u5316\u5230\u6258\u76d8" style="color:#9ca3af;background:none;border:none;cursor:pointer;font-size:16px;padding:0 4px;line-height:1;border-radius:4px">&minus;</button>
  </div>
</div>

<div style="display:flex;border-bottom:1px solid #f3f4f6;flex-shrink:0;padding:0 6px;background:#fafbfc">
  <button class="pk-tab active" data-tab="rename">${t('tabRename')}</button>
  <button class="pk-tab" data-tab="organize">${t('tabOrganize')}</button>
  <button class="pk-tab" data-tab="help">${t('tabHelp')}</button>
</div>

<!-- === RENAME TAB === -->
<div id="pk-tab-rename" class="pk-tab-content" style="flex:1;overflow-y:auto;display:flex;flex-direction:column">
  <div style="display:flex;border-bottom:1px solid #f3f4f6;flex-shrink:0;padding:0 6px">
    <button class="pk-sub-tab active" data-sub="steps">${t('steps')}</button>
    <button class="pk-sub-tab" data-sub="preview">${t('preview')}</button>
    <button class="pk-sub-tab" data-sub="fileList">${t('fileList')}</button>
    <button class="pk-sub-tab" data-sub="history">${t('history')}</button>
    <button class="pk-sub-tab" data-sub="presets">${t('presets')}</button>
  </div>

  <div id="pk-rename-steps" class="pk-sub-content" style="flex:1;overflow-y:auto;padding:12px 14px">
    <div id="pk-steps-container"></div>
    <button id="pk-add-step" class="pk-btn pk-btn-ghost" style="margin-top:4px;width:100%">+ ${t('add')} ${t('steps')}</button>

    <div class="pk-section">
      <div class="pk-section-title">${t('naming')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div>
          <div class="pk-field-label">${t('prefix')}</div>
          <input id="pk-prefix" class="pk-input" placeholder="\u4f8b: [ABC]">
        </div>
        <div>
          <div class="pk-field-label">${t('suffix')}</div>
          <input id="pk-suffix" class="pk-input" placeholder="\u4f8b: _v2">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 100px;gap:8px;margin-bottom:8px">
        <div>
          <div class="pk-field-label">${t('insertMid')}</div>
          <input id="pk-insert-mid" class="pk-input" placeholder="\u63d2\u5165\u7684\u6587\u672c">
        </div>
        <div>
          <div class="pk-field-label">${t('insertMidPosIdx')}</div>
          <input id="pk-insert-mid-pos" class="pk-input" value="0" type="number" min="0" placeholder="0">
        </div>
      </div>
      <div style="margin-bottom:8px">
        <div class="pk-field-label">${t('caseType')}</div>
        <select id="pk-case" class="pk-input" style="width:100%">
          <option value="none">${t('caseNone')}</option>
          <option value="upper">${t('caseUpper')}</option>
          <option value="lower">${t('caseLower')}</option>
          <option value="title">${t('caseTitle')}</option>
        </select>
      </div>
      <div>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;margin-bottom:6px;color:#374151">
          <input type="checkbox" id="pk-use-index"> ${t('useIndex')}
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
          <div>
            <div class="pk-field-label">${t('indexPos')}</div>
            <select id="pk-index-pos" class="pk-input" style="width:100%">
              <option value="suffix">${t('indexPosSuffix')}</option>
              <option value="prefix">${t('indexPosPrefix')}</option>
            </select>
          </div>
          <div>
            <div class="pk-field-label">${t('indexStart')}</div>
            <input id="pk-index-start" class="pk-input" value="1" type="number" min="0" style="width:100%">
          </div>
          <div>
            <div class="pk-field-label">${t('indexPad')}</div>
            <input id="pk-index-pad" class="pk-input" value="2" type="number" min="1" max="6" style="width:100%">
          </div>
          <div>
            <div class="pk-field-label">${t('indexSep')}</div>
            <select id="pk-index-sep" class="pk-input" style="width:100%">
              <option value="_">_</option>
              <option value="-">-</option>
              <option value=".">.</option>
              <option value=" ">\u7a7a\u683c</option>
              <option value="">${t('indexSepNone')}</option>
            </select>
          </div>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;margin-top:6px;color:#374151">
        <input type="checkbox" id="pk-keep-ext" checked> ${t('keepExt')}
      </label>
    </div>

    <div class="pk-section">
      <div class="pk-section-title">${t('filter')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <div class="pk-field-label">${t('nameContains')}</div>
          <input id="pk-name-filter" class="pk-input" placeholder="\u5173\u952e\u8bcd\u2026">
        </div>
        <div>
          <div class="pk-field-label">${t('typeFilter')}</div>
          <select id="pk-type-filter" class="pk-input" style="width:100%">
            <option value="">${t('allTypes')}</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="image">Image</option>
            <option value="archive">Archive</option>
            <option value="subtitle">Subtitle</option>
            <option value="folder">Folder</option>
          </select>
        </div>
      </div>
    </div>

    <div class="pk-section" style="display:flex;align-items:center;gap:8px;font-size:12px">
      <span style="color:#6b7280">${t('delay')}</span>
      <input id="pk-delay" class="pk-input" value="1500" style="width:72px" type="number" min="100">
      <span style="color:#9ca3af">${t('ms')}</span>
      <button id="pk-reset-rename" class="pk-btn pk-btn-ghost pk-btn-sm" style="margin-left:auto" title="\u6e05\u7a7a\u6240\u6709\u547d\u540d\u9009\u9879\u548c\u6b65\u9aa4">${t('resetFields')}</button>
    </div>

    <div style="margin-top:12px;display:flex;gap:8px">
      <button id="pkscan" class="pk-btn pk-btn-secondary" style="flex:1">${t('scan')}</button>
      <button id="pkrun" class="pk-btn pk-btn-primary" style="flex:1">${t('execute')}</button>
      <button id="pkcancel" class="pk-btn pk-btn-danger" style="display:none;flex:1">${t('stop')}</button>
      <button id="pkpause" class="pk-btn pk-btn-ghost" style="display:none">${t('pause')}</button>
    </div>
    <div id="pkprogress" style="font-size:11px;color:#6b7280;margin-top:4px;min-height:16px"></div>
    <div id="pkcount" style="font-size:11px;color:#6b7280;min-height:16px"></div>
    <div id="pk-stats" style="font-size:11px;color:#6b7280;min-height:16px"></div>
  </div>

  <div id="pk-rename-preview" class="pk-sub-content" style="display:none;flex:1;overflow-y:auto;padding:12px 14px">
    <div id="pk-preview-list"></div>
  </div>

  <div id="pk-rename-fileList" class="pk-sub-content" style="display:none;flex:1;overflow-y:auto;padding:12px 14px">
    <div id="pk-file-list"></div>
  </div>

  <div id="pk-rename-history" class="pk-sub-content" style="display:none;flex:1;overflow-y:auto;padding:12px 14px">
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <button id="pk-clear-history" class="pk-btn pk-btn-ghost pk-btn-sm">${t('clear')}</button>
    </div>
    <div id="pk-history-list"></div>
  </div>

  <div id="pk-rename-presets" class="pk-sub-content" style="display:none;flex:1;overflow-y:auto;padding:12px 14px">
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <button id="pk-save-preset" class="pk-btn pk-btn-ghost pk-btn-sm">${t('save')}</button>
      <button id="pk-export-presets" class="pk-btn pk-btn-ghost pk-btn-sm">${t('copy')}</button>
      <button id="pk-import-presets" class="pk-btn pk-btn-ghost pk-btn-sm">${t('load')}</button>
    </div>
    <div id="pk-presets-list"></div>
  </div>
</div>

<!-- === ORGANIZE TAB === -->
<div id="pk-tab-organize" class="pk-tab-content" style="display:none;flex:1;overflow:hidden;flex-direction:column">
  <div style="display:flex;border-bottom:1px solid #f3f4f6;flex-shrink:0;padding:0 6px">
    <button class="pk-sub-tab active" data-osub="classify">${t('classify')}</button>
    <button class="pk-sub-tab" data-osub="duplicates">${t('duplicates')}</button>
  </div>

  <div id="pk-org-classify" style="flex:1;overflow-y:auto;padding:12px 14px">
    <div id="pk-classify-rules" style="max-height:160px;overflow-y:auto"></div>
    <button id="pk-classify-add-rule" class="pk-btn pk-btn-ghost" style="margin-top:4px;width:100%">+ ${t('addRule')}</button>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="pk-classify-scan-folder" class="pk-btn pk-btn-secondary" style="flex:1">${t('scan')}</button>
      <button id="pk-classify-preview-btn" class="pk-btn pk-btn-secondary" style="flex:1">${t('classifyPreview')}</button>
      <button id="pk-classify-run" class="pk-btn pk-btn-primary" style="flex:1">${t('classifyRun')}</button>
      <button id="pk-reset-classify" class="pk-btn pk-btn-ghost pk-btn-sm" title="\u6e05\u7a7a\u6240\u6709\u5206\u7c7b\u89c4\u5219">${t('resetFields')}</button>
    </div>
    <div id="pk-classify-preview" style="margin-top:10px;max-height:180px;overflow-y:auto"></div>
  </div>

  <div id="pk-org-duplicates" style="display:none;flex:1;overflow-y:auto;padding:12px 14px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12px;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:4px;white-space:nowrap"><input type="checkbox" id="pk-dup-recursive"> ${t('dupRecursive')}</label>
      <span style="color:#6b7280;white-space:nowrap">${t('dupMaxDepth')} <input id="pk-dup-max-depth" class="pk-input" value="3" style="width:44px" type="number" min="1" max="10"></span>
      <span style="color:#6b7280;white-space:nowrap">${t('dupMaxRequests')} <input id="pk-dup-max-requests" class="pk-input" value="200" style="width:54px" type="number" min="10"></span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button id="pk-dup-scan" class="pk-btn pk-btn-secondary" style="flex:1">${t('dupScan')}</button>
      <button id="pk-dup-export" class="pk-btn pk-btn-secondary" style="flex:1">${t('dupExport')}</button>
      <button id="pk-dup-trash" class="pk-btn pk-btn-danger" style="flex:1">${t('dupTrash')}</button>
      <button id="pk-dup-delete" class="pk-btn pk-btn-danger" style="flex:1">${t('dupDelete')}</button>
    </div>
    <div id="pk-dup-list" style="max-height:260px;overflow-y:auto"></div>
  </div>
</div>

<!-- === HELP TAB === -->
<div id="pk-tab-help" class="pk-tab-content" style="display:none;flex:1;overflow:hidden;flex-direction:column">
  <div style="flex:1;overflow-y:auto;padding:12px 14px;line-height:1.7;color:#374151;word-break:break-word">
  <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827">${t('helpTitle')}</h3>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpScan')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpScanDesc')}</span></div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpSteps')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpStepsDesc')}</span><br><code style="font-size:11px;color:#2563eb;background:#f3f4f6;padding:2px 6px;border-radius:4px;word-break:break-all">${t('helpStepsEx')}</code></div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpNaming')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpNamingDesc')}</span></div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpPreview')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpPreviewDesc')}</span></div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpRollback')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpRollbackDesc')}</span></div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpRegex')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpRegexDesc')}</span>
    <ul style="color:#6b7280;padding-left:20px;margin:4px 0;font-size:12px">
      <li><code style="color:#2563eb;background:#f3f4f6;padding:1px 4px;border-radius:3px">\\d+</code> \u2014 ${t('helpRegexDigit')}</li>
      <li><code style="color:#2563eb;background:#f3f4f6;padding:1px 4px;border-radius:3px">\\s+</code> \u2014 ${t('helpRegexSpace')}</li>
      <li><code style="color:#2563eb;background:#f3f4f6;padding:1px 4px;border-radius:3px">^\\d+</code> \u2014 ${t('helpRegexStartNum')}</li>
      <li><code style="color:#2563eb;background:#f3f4f6;padding:1px 4px;border-radius:3px">\\[.*?\\]</code> \u2014 ${t('helpRegexBracket')}</li>
    </ul>
  </div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpFilter')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpFilterDesc')}</span></div>
  <div style="margin-bottom:12px"><b style="color:#111827">${t('helpTrouble')}</b><br><span style="color:#6b7280;font-size:12px">${t('helpTroubleDesc')}</span></div>
  </div>
</div>

<!-- === LOG === -->
<div style="border-top:1px solid #f3f4f6;flex-shrink:0">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 14px;background:#fafbfc">
    <span style="font-size:10px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">Log</span>
    <button id="pk-clear-log" style="color:#9ca3af;background:none;border:none;cursor:pointer;font-size:11px">${t('clear')}</button>
  </div>
  <pre id="pklog" style="height:120px;overflow:auto;background:#f9fafb;margin:0;padding:8px 14px;font-size:11px;line-height:1.6;color:#374151;white-space:pre-wrap;word-break:break-all;border-top:1px solid #f3f4f6"></pre>
</div>
`;

        document.body.appendChild(panel);
        makeDraggable(panel);

        // ===== STYLES =====
        const style = document.createElement('style');
        style.textContent = `
.pk-tab,.pk-sub-tab{background:none;color:#9ca3af;border:none;padding:7px 12px;cursor:pointer;font-size:12px;font-weight:500;border-bottom:2px solid transparent;transition:color 0.15s,border-color 0.15s}
.pk-tab.active,.pk-sub-tab.active{color:#2563eb;border-bottom-color:#2563eb}
.pk-tab:hover,.pk-sub-tab:hover{color:#374151}
.pk-tab-content{overflow:hidden}
.pk-sub-content{overflow-y:auto}
.pk-section{margin-top:12px;padding-top:10px;border-top:1px solid #f3f4f6}
.pk-section-title{font-weight:600;margin-bottom:8px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px}
.pk-field-label{font-size:11px;color:#9ca3af;margin-bottom:2px}
.pk-btn{padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;border:1px solid transparent;transition:background 0.15s,color 0.15s,border-color 0.15s,opacity 0.15s}
.pk-btn:active{opacity:0.8}
.pk-btn-primary{background:#2563eb;color:#fff;border-color:#2563eb}
.pk-btn-primary:hover{background:#1d4ed8}
.pk-btn-secondary{background:#f3f4f6;color:#374151;border-color:#e5e7eb}
.pk-btn-secondary:hover{background:#e5e7eb}
.pk-btn-danger{background:#fef2f2;color:#dc2626;border-color:#fecaca}
.pk-btn-danger:hover{background:#fee2e2}
.pk-btn-ghost{background:transparent;color:#6b7280;border-color:transparent}
.pk-btn-ghost:hover{background:#f3f4f6;color:#374151}
.pk-btn-danger-text{background:transparent;color:#dc2626;border:none}
.pk-btn-danger-text:hover{background:#fef2f2}
.pk-btn-sm{padding:4px 10px;font-size:11px;border-radius:5px}
.pk-input{width:100%;background:#fff;color:#1f2937;border:1px solid #e5e7eb;border-radius:6px;padding:6px 10px;box-sizing:border-box;font-size:12px;font-family:inherit;outline:none;transition:border-color 0.15s,box-shadow 0.15s}
.pk-input:focus{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,0.1)}
.pk-input::placeholder{color:#d1d5db}
.pk-step-row{display:flex;gap:6px;margin-bottom:6px;align-items:center}
.pk-step-search,.pk-step-replace{flex:1}
.pk-step-toggle{font-size:11px;color:#6b7280;white-space:nowrap;min-width:48px;display:flex;align-items:center;gap:3px}
.pk-preview-row{padding:4px 8px;border-radius:5px;margin-bottom:2px;font-size:11px;line-height:1.5}
.pk-preview-changed{background:#eff6ff;color:#1d4ed8}
.pk-preview-skip{color:#9ca3af}
.pk-preview-error{background:#fef2f2;color:#dc2626}
.pk-preview-arrow{color:#2563eb;margin:0 6px;font-weight:600}
.pk-preview-new{color:#2563eb;font-weight:500}
.pk-preview-old{color:#6b7280}
.pk-empty{color:#d1d5db;font-size:12px;padding:24px;text-align:center}
.pk-filelist-header{font-size:11px;color:#6b7280;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f3f4f6}
.pk-filelist-item{display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:4px;font-size:12px;color:#374151;line-height:1.5}
.pk-filelist-item:nth-child(even){background:#f9fafb}
.pk-filelist-num{color:#d1d5db;font-size:10px;min-width:24px;text-align:right;font-variant-numeric:tabular-nums}
.pk-filelist-icon{font-size:12px}
.pk-filelist-name{flex:1;word-break:break-all}
.pk-history-item{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f9fafb;font-size:11px;flex-wrap:wrap}
.pk-history-old{color:#9ca3af;text-decoration:line-through}
.pk-history-new{color:#2563eb;font-weight:500}
.pk-history-arrow{color:#d1d5db}
.pk-history-time{color:#d1d5db;font-size:10px;margin-left:auto}
.pk-preset-item{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f9fafb;font-size:12px}
.pk-classify-rule{display:flex;gap:6px;margin-bottom:6px;align-items:center}
.pk-cr-name{flex:1.5}
.pk-cr-pattern{flex:1.5}
.pk-cr-folder{flex:1}
.pk-dup-group{border:1px solid #f3f4f6;border-radius:8px;padding:8px 12px;margin-bottom:8px}
.pk-dup-group-header{font-weight:600;font-size:12px;margin-bottom:6px;color:#1f2937}
.pk-dup-item{font-size:11px;color:#6b7280;padding:3px 0}
#pk-tray{transition:transform 0.15s,box-shadow 0.15s}
`;
        document.head.appendChild(style);

        // ===== STATUS POLLING =====
        setInterval(() => {
            const st = panel.querySelector('#pkst');
            if (!st) return;
            const status = credsStatus();
            const isReady = status === 'Ready';
            st.textContent = isReady ? t('ready') : status;
            st.style.background = isReady ? '#dcfce7' : '#fef3c7';
            st.style.color = isReady ? '#166534' : '#92400e';
            currentFolderId = getParentId();
            if (currentFolderId !== lastFolderId && cachedFiles.length && !isScanning) {
                lastFolderId = currentFolderId;
                cachedFiles = [];
                panel.querySelector('#pkcount').textContent = '';
                panel.querySelector('#pk-stats').textContent = '';
                log(t('folderSwitched'), 'skip');
            }
            lastFolderId = currentFolderId;
        }, 800);

        // ===== TAB SWITCHING =====
        panel.querySelectorAll('.pk-tab').forEach(btn => {
            btn.onclick = () => {
                currentTab = btn.dataset.tab;
                panel.querySelectorAll('.pk-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
                panel.querySelectorAll('.pk-tab-content').forEach(c => c.style.display = c.id === 'pk-tab-' + currentTab ? 'flex' : 'none');
            };
        });

        panel.querySelectorAll('.pk-sub-tab[data-sub]').forEach(btn => {
            btn.onclick = () => {
                renameSub = btn.dataset.sub;
                panel.querySelectorAll('.pk-sub-tab[data-sub]').forEach(b => b.classList.toggle('active', b.dataset.sub === renameSub));
                ['steps', 'preview', 'fileList', 'history', 'presets'].forEach(s => {
                    const el = panel.querySelector('#pk-rename-' + s);
                    if (el) el.style.display = s === renameSub ? 'block' : 'none';
                });
                if (renameSub === 'preview') renderPreview();
                if (renameSub === 'fileList') renderFileList();
                if (renameSub === 'history') renderHistory();
                if (renameSub === 'presets') renderPresets();
            };
        });

        panel.querySelectorAll('.pk-sub-tab[data-osub]').forEach(btn => {
            btn.onclick = () => {
                panel.querySelectorAll('.pk-sub-tab[data-osub]').forEach(b => b.classList.toggle('active', b.dataset.osub === btn.dataset.osub));
                const c = panel.querySelector('#pk-org-classify');
                const d = panel.querySelector('#pk-org-duplicates');
                if (c) c.style.display = btn.dataset.osub === 'classify' ? 'block' : 'none';
                if (d) d.style.display = btn.dataset.osub === 'duplicates' ? 'block' : 'none';
            };
        });

        // ===== CLOSE -> TRAY =====
        panel.querySelector('#pk-minimize').onclick = minimizeToTray;

        // ===== STEPS =====
        renderSteps();
        panel.querySelector('#pk-add-step').onclick = () => { steps.push({ search: '', replace: '', enabled: true }); renderSteps(); };

        // ===== NAMING / FILTER =====
        ['#pk-prefix', '#pk-suffix', '#pk-insert-mid', '#pk-insert-mid-pos', '#pk-case', '#pk-use-index', '#pk-index-start', '#pk-index-pad', '#pk-index-pos', '#pk-index-sep', '#pk-keep-ext', '#pk-name-filter', '#pk-type-filter'].forEach(sel => {
            const el = panel.querySelector(sel);
            if (el) el.onchange = el.oninput = () => renderPreview();
        });

        // ===== RESET RENAME =====
        panel.querySelector('#pk-reset-rename').onclick = () => {
            steps = [{ search: '', replace: '', enabled: true }];
            renderSteps();
            const resetFields = {
                '#pk-prefix': '', '#pk-suffix': '', '#pk-insert-mid': '', '#pk-insert-mid-pos': '0',
                '#pk-case': 'none', '#pk-use-index': false, '#pk-index-start': '1', '#pk-index-pad': '2',
                '#pk-index-pos': 'suffix', '#pk-index-sep': '_', '#pk-keep-ext': true,
                '#pk-name-filter': '', '#pk-type-filter': '', '#pk-delay': '1500',
            };
            for (const [sel, val] of Object.entries(resetFields)) {
                const el = panel.querySelector(sel);
                if (!el) continue;
                if (el.type === 'checkbox') el.checked = val;
                else el.value = val;
            }
            renderPreview();
            log(t('resetFields') + ' \u2014 ' + t('steps') + ' & ' + t('naming') + ' & ' + t('filter'), 'info');
        };

        // ===== SCAN =====
        panel.querySelector('#pkscan').onclick = async () => {
            if (isScanning) { cancelScan = true; log(t('forceStop'), 'highlight'); return; }
            isScanning = true; cancelScan = false;
            const btn = panel.querySelector('#pkscan');
            const origText = btn.textContent;
            btn.classList.add('pk-btn-danger'); btn.classList.remove('pk-btn-secondary');
            btn.textContent = '\u23F9 ' + t('stop');
            const scanFolderId = getParentId();
            lastFolderId = scanFolderId;
            try {
                cachedFiles = await fetchAllFiles(scanFolderId);
                panel.querySelector('#pkcount').textContent = t('loaded') + ' ' + cachedFiles.length + ' ' + t('file');
                log(t('loaded') + ': ' + cachedFiles.length + ' ' + t('file'), 'highlight');
                cachedFiles.forEach(f => log('  [' + f.kind + '] ' + f.name, 'info'));
            } catch (e) {
                log(t('error') + ': ' + e.message, 'fail');
            } finally {
                isScanning = false;
                btn.classList.remove('pk-btn-danger'); btn.classList.add('pk-btn-secondary');
                btn.textContent = origText;
            }
            renderPreview();
            renderFileList();
        };

        // ===== EXECUTE =====
        panel.querySelector('#pkrun').onclick = async () => {
            if (isRenaming) return;
            if (!credsReady()) { log(t('error') + ': ' + credsStatus(), 'fail'); return; }
            const filtered = getFilteredFiles();
            if (!filtered.length) { log(t('noFilesToRename'), 'skip'); return; }
            const naming = getNamingConfig();
            const enabledSteps = steps.filter(s => s.enabled && s.search);
            if (!enabledSteps.length && !naming.prefix && !naming.suffix && !naming.insertMid && naming.caseType === 'none' && !naming.useIndex) {
                log(t('noFilesToRename'), 'skip'); return;
            }
            isRenaming = true; cancelRenaming = false; paused = false;
            const runBtn = panel.querySelector('#pkrun'), cancelBtn = panel.querySelector('#pkcancel'), pauseBtn = panel.querySelector('#pkpause');
            const progressEl = panel.querySelector('#pkprogress');
            runBtn.style.display = 'none'; cancelBtn.style.display = ''; pauseBtn.style.display = '';
            pauseBtn.textContent = '\u23F8 ' + t('pause');
            const delay = Number(panel.querySelector('#pk-delay')?.value) || 1500;
            let okCount = 0, skipCount = 0, failCount = 0;
            const opFiles = [];
            const startTime = Date.now();
            log(t('execute') + ': ' + filtered.length + ' ' + t('file') + ', ' + t('delay') + ' ' + delay + 'ms', 'highlight');
            for (let i = 0; i < filtered.length; i++) {
                if (cancelRenaming) { log(t('userCancelled'), 'error'); break; }
                if (paused) { log(t('paused_'), 'skip'); await new Promise(r => { resolvePause = r; }); log(t('resumed_'), 'highlight'); }
                const f = filtered[i];
                progressEl.textContent = t('progress') + ': ' + (i + 1) + ' / ' + filtered.length;
                let newName = '';
                try { newName = processName(f.name, i, steps, naming); }
                catch (e) { log(t('error') + ': ' + f.name + ' \u2192 ' + e.message, 'fail'); failCount++; continue; }
                if (newName === f.name) { skipCount++; continue; }
                try {
                    await renameFile(f.id, newName);
                    okCount++;
                    log(t('ok') + ': ' + f.name + ' \u2192 ' + newName, 'ok');
                    renameHistory.push({ id: f.id, oldName: f.name, newName: newName, time: Date.now() });
                    saveHistory();
                    opFiles.push({ id: f.id, newName: newName, oldName: f.name });
                } catch (e) {
                    failCount++;
                    log(t('fail') + ': ' + f.name + ' \u2192 ' + e.message, 'fail');
                }
                await sleep(delay + Math.random() * 600);
            }
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            log(t('done') + ': ' + okCount + ' / ' + skipCount + ' / ' + failCount + ' (' + elapsed + 's)', 'highlight');
            runBtn.style.display = ''; cancelBtn.style.display = 'none'; pauseBtn.style.display = 'none';
            progressEl.textContent = '';
            isRenaming = false;
            opFiles.forEach(f => { const cf = cachedFiles.find(c => c.id === f.id); if (cf) cf.name = f.newName; });
            renderPreview();
            renderFileList();
        };

        panel.querySelector('#pkcancel').onclick = () => { cancelRenaming = true; if (paused) { paused = false; if (resolvePause) { resolvePause(); resolvePause = null; } } };
        panel.querySelector('#pkpause').onclick = function () {
            if (paused) { paused = false; if (resolvePause) { resolvePause(); resolvePause = null; } this.textContent = '\u23F8 ' + t('pause'); }
            else { paused = true; this.textContent = '\u25B6 ' + t('resume'); }
        };

        // ===== HISTORY =====
        panel.querySelector('#pk-clear-history').onclick = () => { if (confirm(t('confirmClear'))) { renameHistory = []; saveHistory(); renderHistory(); } };
        renderHistory();

        // ===== PRESETS =====
        panel.querySelector('#pk-save-preset').onclick = () => {
            const name = prompt(t('presetName'));
            if (!name) return;
            presets.push({ name, steps: JSON.parse(JSON.stringify(steps)) });
            savePresets(); renderPresets();
            log(t('savedPreset') + ': ' + name, 'ok');
        };
        panel.querySelector('#pk-export-presets').onclick = () => { navigator.clipboard.writeText(JSON.stringify(presets, null, 2)).then(() => log(t('exportDone'), 'ok')).catch(() => {}); };
        panel.querySelector('#pk-import-presets').onclick = () => {
            const json = prompt(t('importPrompt'));
            if (!json) return;
            try { presets = JSON.parse(json); savePresets(); renderPresets(); log(t('importSuccess'), 'ok'); }
            catch (_) { log(t('importFail'), 'fail'); }
        };
        renderPresets();

        // ===== LOG =====
        panel.querySelector('#pk-clear-log').onclick = () => { panel.querySelector('#pklog').innerHTML = ''; };

        // ===== CLASSIFY =====
        renderClassifyRules();
        panel.querySelector('#pk-classify-add-rule').onclick = () => { classifyRules.push({ name: '', pattern: '', folder: '' }); saveClassifyRules(); renderClassifyRules(); };
        panel.querySelector('#pk-classify-scan-folder').onclick = async () => {
            if (isScanning) { log('\u5df2\u5728\u626b\u63cf\u4e2d', 'skip'); return; }
            isScanning = true;
            const pid = getParentId();
            try {
                cachedFiles = await fetchAllFiles(pid);
                panel.querySelector('#pkcount').textContent = t('loaded') + ' ' + cachedFiles.length + ' ' + t('file');
                log(t('loaded') + ': ' + cachedFiles.length + ' ' + t('file'), 'highlight');
                cachedFiles.forEach(f => log('  [' + f.kind + '] ' + f.name, 'info'));
                renderClassifyPreview();
            } catch (e) { log(t('error') + ': ' + e.message, 'fail'); }
            finally { isScanning = false; }
        };
        panel.querySelector('#pk-classify-preview-btn').onclick = () => { if (!cachedFiles.length) { log(t('scanFirst'), 'skip'); return; } renderClassifyPreview(); };
        panel.querySelector('#pk-classify-run').onclick = executeClassify;
        panel.querySelector('#pk-reset-classify').onclick = () => {
            classifyRules = [];
            saveClassifyRules();
            renderClassifyRules();
            const previewEl = panel.querySelector('#pk-classify-preview');
            if (previewEl) previewEl.innerHTML = '<div class="pk-empty">' + t('noRules') + '</div>';
            log(t('resetFields') + ' \u2014 ' + t('classifyRule'), 'info');
        };

        // ===== DUPLICATES =====
        panel.querySelector('#pk-dup-scan').onclick = async () => {
            if (!cachedFiles.length) { log(t('scanFirst'), 'skip'); return; }
            const recursive = panel.querySelector('#pk-dup-recursive')?.checked;
            if (recursive) {
                const pid = getParentId(), maxDepth = Number(panel.querySelector('#pk-dup-max-depth')?.value) || 3;
                const maxRequests = Number(panel.querySelector('#pk-dup-max-requests')?.value) || 200;
                log('Recursive: depth=' + maxDepth + ', max=' + maxRequests, 'highlight');
                const allFiles = []; const visited = new Set(); let dirCount = 0;
                async function crawl(id, depth) {
                    if (depth > maxDepth || dirCount >= maxRequests || visited.has(id)) return;
                    visited.add(id);
                    const fs = await fetchAllFiles(id); dirCount++;
                    allFiles.push(...fs);
                    for (const f of fs.filter(f => f.kind === 'drive#folder')) {
                        if (dirCount >= maxRequests) break;
                        await crawl(f.id, depth + 1);
                    }
                }
                try { await crawl(pid, 0); cachedFiles = allFiles; log('Done: ' + allFiles.length + ' ' + t('file'), 'ok'); }
                catch (e) { log(t('error') + ': ' + e.message, 'fail'); return; }
            }
            renderDuplicates();
        };
        panel.querySelector('#pk-dup-export').onclick = () => {
            const groups = detectDuplicates(cachedFiles);
            if (!groups.length) { log(t('dupNoDupes'), 'skip'); return; }
            let csv = 'Group,Name,ID,Size\n';
            groups.forEach((g, i) => g.forEach(f => { csv += (i + 1) + ',"' + f.name + '","' + f.id + '",' + f.size + '\n'; }));
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pikpak-duplicates.csv'; a.click();
            log(t('exportDoneCSV'), 'ok');
        };
        panel.querySelector('#pk-dup-trash').onclick = async () => {
            const ids = []; panel.querySelectorAll('.pk-dup-cb:checked').forEach(cb => ids.push(cb.dataset.id));
            if (!ids.length || !confirm(t('confirmDeleteDup'))) return;
            for (const id of ids) { try { await trashFile(id); } catch (e) { log('Trash fail: ' + e.message, 'fail'); } }
            renderDuplicates();
        };
        panel.querySelector('#pk-dup-delete').onclick = async () => {
            const ids = []; panel.querySelectorAll('.pk-dup-cb:checked').forEach(cb => ids.push(cb.dataset.id));
            if (!ids.length || !confirm(t('confirmDeleteDup'))) return;
            try { await deleteFiles(ids); } catch (e) { log('Delete fail: ' + e.message, 'fail'); }
            renderDuplicates();
        };
    }

    // ===== DEBUG =====
    function dumpDebugInfo() {
        const info = {
            version: VERSION,
            url: pageWindow.location.href,
            folderId: getParentId() || '(root)',
            creds: { ready: credsReady(), hasToken: !!CREDS.token, hasDeviceId: !!CREDS.deviceId, hasCaptchaToken: !!CREDS.captchaToken },
            isScanning, cancelScan, cachedFiles: cachedFiles.length,
        };
        console.log('[PikPak Rename Pro] Debug:', info);
        return info;
    }
    try { pageWindow.PK_DEBUG = dumpDebugInfo; } catch (_) {}

    // ===== INIT =====
    hookFetch();
    hookXHR();
    window.addEventListener('load', () => setTimeout(createUI, 2000));
})();