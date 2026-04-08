// ==UserScript==
// @name         PikPak Rename Pro v6.0
// @namespace    pikpak-pro
// @version      6.0
// @description  Batch rename files on PikPak with reliable credential capture and CORS-safe API requests.
// @match        https://mypikpak.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api-drive.mypikpak.com
// ==/UserScript==

(function () {
    'use strict';

    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const API = 'https://api-drive.mypikpak.com/drive/v1';
    const CREDS = {
        token: '',
        deviceId: '',
        captchaToken: '',
        clientId: '',
        clientVersion: '',
    };

    function extractHeaders(headers) {
        if (!headers) return;

        const pairs = [];

        if (headers instanceof pageWindow.Headers || headers instanceof Headers) {
            headers.forEach((value, key) => pairs.push([String(key).toLowerCase(), value]));
        } else if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => pairs.push([String(key).toLowerCase(), value]));
        } else if (typeof headers === 'object') {
            Object.keys(headers).forEach(key => pairs.push([key.toLowerCase(), headers[key]]));
        }

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
            try {
                extractHeaders({ [key]: value });
            } catch (_) {}
            return originalSetRequestHeader.apply(this, arguments);
        };
    }

    function buildHeaders(includeJsonBody = false) {
        const headers = {
            Accept: 'application/json',
        };

        if (includeJsonBody) headers['Content-Type'] = 'application/json';
        if (CREDS.token) headers.Authorization = `Bearer ${CREDS.token}`;
        if (CREDS.deviceId) headers['X-Device-Id'] = CREDS.deviceId;
        if (CREDS.captchaToken) headers['X-Captcha-Token'] = CREDS.captchaToken;
        if (CREDS.clientId) headers['X-Client-Id'] = CREDS.clientId;
        if (CREDS.clientVersion) headers['X-Client-Version'] = CREDS.clientVersion;

        return headers;
    }

    function credsReady() {
        return Boolean(CREDS.token && CREDS.deviceId && CREDS.captchaToken);
    }

    function credsStatus() {
        if (credsReady()) return 'Ready';

        const missing = [];
        if (!CREDS.token) missing.push('Token');
        if (!CREDS.deviceId) missing.push('DeviceId');
        if (!CREDS.captchaToken) missing.push('CaptchaToken');
        return `Missing: ${missing.join(' / ')}`;
    }

    function gmRequest(method, url, { headers = {}, body } = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                data: body,
                responseType: 'text',
                timeout: 30000,
                onload: response => resolve(response),
                onerror: error => reject(new Error(`Network error: ${error?.error || 'unknown'}`)),
                ontimeout: () => reject(new Error('Request timed out')),
            });
        });
    }

    function parseJsonResponse(response) {
        const text = response.responseText || '';
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch (_) {
            throw new Error(`Invalid JSON response (HTTP ${response.status})`);
        }
    }

    function getParentId() {
        const href = String(pageWindow.location.href || '');
        const pathname = String(pageWindow.location.pathname || '');
        const hash = String(pageWindow.location.hash || '');
        const patterns = [
            /folder\/([A-Za-z0-9_-]+)/,
            /\/drive\/all\/([A-Za-z0-9_-]+)/,
            /parent_id=([A-Za-z0-9_-]+)/,
        ];

        for (const source of [href, pathname, hash]) {
            for (const pattern of patterns) {
                const match = source.match(pattern);
                if (match) return match[1];
            }
        }

        return '';
    }

    function normalizeEntries(data) {
        const rawEntries = Array.isArray(data?.files) ? data.files : [];
        return rawEntries
            .filter(entry => entry && entry.id && entry.name)
            .map(entry => ({
                id: entry.id,
                name: entry.name,
                kind: entry.kind || entry.type || 'unknown',
            }));
    }

    async function fetchAllFiles(parentId) {
        if (!credsReady()) {
            throw new Error('Credentials are not ready yet. Click around in PikPak first to let the page issue authenticated requests.');
        }

        const files = [];
        let pageToken = '';

        do {
            const params = new URLSearchParams({ page_size: '100' });
            if (parentId) params.set('parent_id', parentId);
            if (pageToken) params.set('page_token', pageToken);

            const response = await gmRequest('GET', `${API}/files?${params.toString()}`, {
                headers: buildHeaders(false),
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(`HTTP ${response.status}: ${response.responseText || 'Request failed'}`);
            }

            const data = parseJsonResponse(response);
            normalizeEntries(data).forEach(file => files.push(file));

            pageToken = data.next_page_token || '';
        } while (pageToken);

        return files;
    }

    async function renameFile(id, newName) {
        const response = await gmRequest('PATCH', `${API}/files/${id}`, {
            headers: buildHeaders(true),
            body: JSON.stringify({ name: newName }),
        });

        if (response.status >= 200 && response.status < 300) return true;
        throw new Error(`HTTP ${response.status}: ${response.responseText || 'Rename failed'}`);
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    function processName(filename, index, config) {
        const dot = filename.lastIndexOf('.');
        let name = dot === -1 ? filename : filename.slice(0, dot);
        const ext = dot === -1 ? '' : filename.slice(dot);

        if (config.search) {
            try {
                name = name.replace(new RegExp(config.search, 'g'), config.replace);
            } catch (error) {
                throw new Error(`Invalid RegExp: ${error.message}`);
            }
        }

        if (config.useIndex) name += '_' + String(index + 1).padStart(2, '0');
        return config.keepExt ? name + ext : name;
    }

    let panel;
    let cachedFiles = [];

    function log(message) {
        const box = panel.querySelector('#pklog');
        box.innerText += `${message}\n`;
        box.scrollTop = box.scrollHeight;
    }

    function makeDraggable(element) {
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        element.querySelector('#pkhandle').onmousedown = event => {
            dragging = true;
            offsetX = event.clientX - element.offsetLeft;
            offsetY = event.clientY - element.offsetTop;
            event.preventDefault();
        };

        document.addEventListener('mousemove', event => {
            if (!dragging) return;
            element.style.left = `${event.clientX - offsetX}px`;
            element.style.top = `${event.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });
    }

    const INPUT_STYLE = 'width:100%;background:#1a1a1a;color:#0fc;border:1px solid #2a2a2a;border-radius:4px;padding:4px 6px;box-sizing:border-box;margin-top:2px;font-family:monospace';
    const BUTTON_STYLE = background => `background:${background};color:#fff;border:none;border-radius:6px;padding:7px 8px;cursor:pointer;font-size:12px;flex:1`;

    function createUI() {
        if (document.querySelector('#pk-rename-pro-panel')) return;

        panel = document.createElement('div');
        panel.id = 'pk-rename-pro-panel';

        Object.assign(panel.style, {
            position: 'fixed',
            top: '80px',
            left: '20px',
            width: '300px',
            background: 'rgba(12,12,12,0.97)',
            color: '#00ffcc',
            padding: '13px',
            borderRadius: '13px',
            zIndex: '99999',
            fontFamily: 'monospace',
            fontSize: '13px',
            boxShadow: '0 4px 28px rgba(0,255,180,0.15)',
            userSelect: 'none',
        });

        panel.innerHTML = `
<div id="pkhandle" style="cursor:move;font-weight:bold;padding-bottom:7px;margin-bottom:9px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center">
  PikPak Rename Pro v6.0
  <span id="pkst" style="font-size:11px;color:#ffaa33">Missing</span>
</div>
<div style="margin-bottom:5px"><div style="font-size:11px;color:#555">Search (RegExp)</div><input id="pksearch" placeholder="Example: S01E(\\d+)" style="${INPUT_STYLE}"></div>
<div style="margin-bottom:9px"><div style="font-size:11px;color:#555">Replace</div><input id="pkreplace" placeholder="Empty means remove" style="${INPUT_STYLE}"></div>
<div style="display:flex;gap:14px;margin-bottom:9px;font-size:12px">
  <label><input type="checkbox" id="pkindex"> Append index</label>
  <label><input type="checkbox" id="pkext" checked> Keep extension</label>
</div>
<div style="margin-bottom:10px;font-size:12px">
  Delay <input id="pkdelay" value="1500" style="width:52px;background:#1a1a1a;color:#0fc;border:1px solid #2a2a2a;border-radius:4px;padding:2px 5px"> ms (+ random 0~600ms)
</div>
<div style="display:flex;gap:6px;margin-bottom:8px">
  <button id="pkscan" style="${BUTTON_STYLE('#005533')}">Scan</button>
  <button id="pkrun" style="${BUTTON_STYLE('#003366')}">Rename</button>
  <button id="pkclear" style="${BUTTON_STYLE('#1a1a1a')}">Clear</button>
</div>
<div id="pkcount" style="font-size:11px;color:#888;margin-bottom:3px;min-height:14px"></div>
<pre id="pklog" style="height:150px;overflow:auto;background:#080808;border:1px solid #1c1c1c;border-radius:7px;padding:7px;margin:0;font-size:11px;line-height:1.6;color:#a0ffd0;white-space:pre-wrap;word-break:break-all"></pre>
`;

        document.body.appendChild(panel);
        makeDraggable(panel);

        setInterval(() => {
            const statusEl = panel.querySelector('#pkst');
            const status = credsStatus();
            statusEl.textContent = status;
            statusEl.style.color = status === 'Ready' ? '#00ffcc' : '#ffaa33';
        }, 800);

        panel.querySelector('#pkscan').onclick = async () => {
            const parentId = getParentId();
            log(`Scanning current folder... parentId=${parentId || '(root)'}`);
            try {
                cachedFiles = await fetchAllFiles(parentId);
                panel.querySelector('#pkcount').textContent = `Loaded ${cachedFiles.length} entries`;
                log(`Loaded ${cachedFiles.length} entries.`);
                cachedFiles.slice(0, 8).forEach(file => log(` - [${file.kind}] ${file.name}`));
                if (cachedFiles.length > 8) log(` - ...and ${cachedFiles.length - 8} more`);
            } catch (error) {
                log(`Error: ${error.message}`);
            }
        };

        panel.querySelector('#pkrun').onclick = async () => {
            if (!cachedFiles.length) {
                log('Scan the current folder first.');
                return;
            }

            const config = getConfig();
            const delay = Number(panel.querySelector('#pkdelay').value) || 1500;
            log(`Starting batch rename with base delay ${delay}ms.`);

            for (let i = 0; i < cachedFiles.length; i += 1) {
                const file = cachedFiles[i];
                let newName = '';

                try {
                    newName = processName(file.name, i, config);
                } catch (error) {
                    log(`Error: ${error.message}`);
                    return;
                }

                if (newName === file.name) {
                    log(`Skip: ${file.name}`);
                    continue;
                }

                try {
                    await renameFile(file.id, newName);
                    log(`OK: ${file.name} -> ${newName}`);
                } catch (error) {
                    log(`Fail: ${file.name} -> ${error.message}`);
                }

                await sleep(delay + Math.random() * 600);
            }

            log('Done.');
        };

        panel.querySelector('#pkclear').onclick = () => {
            panel.querySelector('#pklog').innerText = '';
        };
    }

    function getConfig() {
        return {
            search: panel.querySelector('#pksearch').value,
            replace: panel.querySelector('#pkreplace').value,
            useIndex: panel.querySelector('#pkindex').checked,
            keepExt: panel.querySelector('#pkext').checked,
        };
    }

    hookFetch();
    hookXHR();
    window.addEventListener('load', () => setTimeout(createUI, 2500));
})();
