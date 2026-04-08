# PikPak Rename Pro — Code Wiki

> **版本**: v4.0  
> **类型**: Tampermonkey UserScript  
> **运行环境**: `https://mypikpak.com/*`  
> **更新日期**: 2025-07

---

## 目录

1. [项目概述](#1-项目概述)
2. [可行性评估](#2-可行性评估)
3. [架构总览](#3-架构总览)
4. [模块详解](#4-模块详解)
   - [§1 Token 捕获](#§1-token-捕获)
   - [§2 通用工具函数](#§2-通用工具函数)
   - [§3 API 层](#§3-api-层)
   - [§4 文件缓存](#§4-文件缓存)
   - [§5 队列执行引擎](#§5-队列执行引擎)
   - [§6 UI 模块](#§6-ui-模块)
5. [原版 Bug 清单与修复记录](#5-原版-bug-清单与修复记录)
6. [API 接口参考](#6-api-接口参考)
7. [安全性与反封建议](#7-安全性与反封建议)
8. [扩展开发指南](#8-扩展开发指南)
9. [FAQ](#9-faq)

---

## 1. 项目概述

PikPak Rename Pro 是一个运行在浏览器中的 Tampermonkey 脚本，通过**拦截页面内的网络请求**来捕获认证 Token，进而调用 PikPak 官方 REST API 实现：

- 当前目录文件的**全量分页加载**
- 基于**正则表达式**的批量重命名
- 可配置**延迟 + 抖动**的请求节流
- 操作失败**自动重试**（含 429 限速处理）
- 支持**中止**正在运行的队列

**核心思路**：PikPak Web 端本身会调用其 API，脚本只是"搭便车"，复用已登录的 Bearer Token，无需用户手动输入账号密码。

---

## 2. 可行性评估

| 维度 | v3.0（原版）| v4.0（优化版）| 说明 |
|---|---|---|---|
| Token 捕获 | ⚠️ 仅 fetch | ✅ fetch + XHR | PikPak 某些操作走 XHR |
| Headers 解析 | ❌ 只处理普通对象 | ✅ 兼容 Headers 实例 | `new Headers()` 类型无法用 `.Authorization` 直接访问 |
| 分页加载 | ❌ 只取第一页 | ✅ 循环 next_page_token | 文件夹超过 100 个文件时原版会丢失数据 |
| 缓存策略 | ❌ 不绑定目录 | ✅ 按 parentId 缓存 + TTL | 切换目录后原版返回旧数据 |
| 延迟配置 | ❌ 硬编码随机 | ✅ 读取 UI 配置 + jitter | 原版 delay 输入框完全未生效 |
| 失败重试 | ❌ 无 | ✅ 最多 2 次，429 额外等待 | |
| 中止机制 | ❌ 无法停止 | ✅ abort 标志位 | |
| 跳过无变化文件 | ❌ 每次都请求 | ✅ 名称未变自动跳过 | 节省 Token 消耗 |
| 正则校验 | ❌ 静默失败 | ✅ 预校验 + 错误提示 | |
| 拖拽冲突 | ⚠️ 整个面板触发 | ✅ 仅 header 区域触发 | |

---

## 3. 架构总览

```
pikpak-rename-pro.user.js
│
├── § 1  Token 捕获层
│         ├── 拦截 window.fetch
│         └── 拦截 XMLHttpRequest.setRequestHeader
│
├── § 2  通用工具
│         ├── sleep(ms)
│         ├── jitter(base)       ← 随机抖动
│         ├── splitName()        ← 分离文件名/后缀
│         └── processName()      ← 应用重命名规则
│
├── § 3  API 层
│         ├── fetchAllFiles()    ← 分页拉取，返回全量列表
│         └── renameFile()       ← PATCH 单文件 + 重试
│
├── § 4  文件缓存
│         └── getFiles()         ← Map<parentId, {ts, files}>
│
├── § 5  队列执行引擎
│         └── runQueue()         ← 顺序执行 + 中止 + 进度回调
│
└── § 6  UI 模块
          ├── createUI()
          ├── makeDraggable()    ← 仅 header 可拖
          ├── log()
          ├── setProgress()
          └── setTokenStatus()
```

---

## 4. 模块详解

### §1 Token 捕获

**目标**：在不需要用户手动登录的前提下，从页面的网络请求中提取 Bearer Token。

#### fetch 拦截

```javascript
const _origFetch = window.fetch;
window.fetch = async (...args) => {
    try {
        const init = args[1];
        if (init?.headers) _extractToken(init.headers);
    } catch (_) {}
    return _origFetch(...args);  // 必须调用原始 fetch，不影响页面正常功能
};
```

#### XHR 拦截

```javascript
XMLHttpRequest.prototype.setRequestHeader = function (key, val) {
    if (key.toLowerCase() === 'authorization' && val.startsWith('Bearer ')) {
        GLOBAL_TOKEN = val.slice(7);
    }
    // 调用原始方法，不破坏 XHR 行为
    return XMLHttpRequest.prototype.setRequestHeader.__original.apply(this, arguments);
};
```

#### _extractToken 的 Headers 兼容处理

```javascript
function _extractToken(headers) {
    let auth = '';
    if (headers instanceof Headers) {
        // fetch API 的 Headers 对象，必须用 .get() 访问
        auth = headers.get('Authorization') || '';
    } else if (typeof headers === 'object') {
        // 普通键值对，直接访问属性
        auth = headers['Authorization'] || headers['authorization'] || '';
    }
    if (auth.startsWith('Bearer ')) {
        GLOBAL_TOKEN = auth.slice(7);
        TOKEN_EXPIRY  = Date.now();
    }
}
```

> ⚠️ **原版 Bug**：`headers.Authorization` 在 headers 为 `Headers` 实例时永远是 `undefined`，导致 token 偶发性捕获失败。

---

### §2 通用工具函数

#### jitter(base) — 请求抖动

```javascript
function jitter(base) {
    return Math.floor(base * (0.7 + Math.random() * 0.6));
}
```

在 base 基础上产生 ±30% 的随机偏移。固定间隔的批量请求更容易触发速率限制检测，引入抖动可降低被识别为自动化工具的风险。

#### processName(filename, index, config) — 重命名规则

```javascript
function processName(filename, index, config) {
    let { name, ext } = splitName(filename);

    // 1. 正则替换（仅在 name 部分，不触碰扩展名）
    if (config.search) {
        let re;
        try { re = new RegExp(config.search, 'g'); }
        catch (e) { return null; }   // null 表示正则非法，调用方需中止
        name = name.replace(re, config.replace);
    }

    // 2. 追加序号
    if (config.useIndex) {
        const num = String(index + 1).padStart(config.indexPad, '0');
        name = `${name}${config.indexSep}${num}`;
    }

    // 3. 拼接后缀
    return config.keepExt ? name + ext : name;
}
```

**返回值**：
- `string` — 正常新文件名
- `null`   — 正则编译失败，上层应停止队列

---

### §3 API 层

#### PikPak REST API

| 端点 | 方法 | 用途 |
|---|---|---|
| `/drive/v1/files?parent_id=&page_size=&page_token=` | GET | 获取目录文件列表 |
| `/drive/v1/files/{fileId}` | PATCH | 修改文件属性（重命名） |

> **Base URL**: `https://api-drive.mypikpak.com`  
> 注意：原版 Python 示例中使用的 `api.pikpak.com` 是错误地址。

#### fetchAllFiles — 分页加载

```javascript
async function fetchAllFiles(parentId, token) {
    const files = [];
    let pageToken = '';

    do {
        const params = new URLSearchParams({
            parent_id: parentId,
            page_size: 100,
            ...(pageToken ? { page_token: pageToken } : {})
        });

        const res  = await _origFetch(`${API_BASE}/files?${params}`, { ... });
        const data = await res.json();

        (data.files || [])
            .filter(f => f.kind === 'drive#file')   // 仅文件，排除子文件夹
            .forEach(f => files.push({ id: f.id, name: f.name }));

        pageToken = data.next_page_token || '';     // 空字符串时循环结束
    } while (pageToken);

    return files;
}
```

> ⚠️ **原版 Bug**：无 `page_token` 翻页逻辑，超出 100 条的文件会被静默丢弃。

#### renameFile — 带重试

```javascript
async function renameFile(fileId, newName, token, maxRetry = 2) {
    for (let attempt = 1; attempt <= maxRetry; attempt++) {
        const res = await _origFetch(`${API_BASE}/files/${fileId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });

        if (res.ok) return { ok: true };

        // 429 = 请求过频，额外等待后重试
        if (res.status === 429 && attempt < maxRetry) {
            await sleep(jitter(5000));
            continue;
        }

        const body = await res.json().catch(() => ({}));
        return { ok: false, status: res.status, msg: body.error?.message || '' };
    }
}
```

---

### §4 文件缓存

```javascript
const _fileCache = new Map(); // Map<parentId, { ts: number, files: Array }>
const CACHE_TTL  = 30_000;   // 30 秒

async function getFiles(forceRefresh = false) {
    const parentId = getParentId();
    const cached   = _fileCache.get(parentId);

    if (!forceRefresh && cached && (Date.now() - cached.ts < CACHE_TTL)) {
        return cached.files;  // 命中缓存，直接返回
    }

    const files = await fetchAllFiles(parentId, token);
    _fileCache.set(parentId, { ts: Date.now(), files });
    return files;
}
```

**缓存策略说明**：

| 场景 | 行为 |
|---|---|
| 点击「读取目录」 | `forceRefresh=true`，强制重新拉取 |
| 点击「开始改名」时未扫描 | 复用缓存（30s内）|
| 改名完成后 | 主动删除该目录缓存，下次读取最新数据 |
| 切换到其他文件夹 | parentId 变化，自动读取对应目录的缓存 |

> ⚠️ **原版 Bug**：`cachedFiles` 是模块级变量，不区分目录，切换文件夹后返回上一个目录的数据。

---

### §5 队列执行引擎

```
runQueue(files, config, onProgress)
    │
    ├── 预校验正则（失败立即抛出，不进入循环）
    │
    └── for each file:
            ├── 检查 _abortFlag → 若 true 发送 abort 事件并 break
            ├── 调用 processName → 若返回 null 则终止
            ├── 名称未变 → 跳过，发送 skip 事件
            ├── 调用 renameFile（含重试）
            │       ├── ok → 发送 ok 事件
            │       └── fail → 记录 errors 数组，发送 fail 事件
            └── sleep(jitter(config.delay))   ← 使用 UI 配置的延迟
```

**进度回调事件类型**：

| type | 触发时机 | 含字段 |
|---|---|---|
| `ok` | 成功改名 | `from`, `to`, `i`, `total` |
| `fail` | 请求失败 | `file`, `reason`, `i`, `total` |
| `skip` | 名称未变 | `file`, `i`, `total` |
| `abort` | 用户点击中止 | `i`, `total` |
| `error` | 正则非法等 | `msg` |
| `done` | 队列结束 | `success`, `failure`, `skipped`, `errors[]` |

---

### §6 UI 模块

**面板结构**：

```
┌─────────────────────────────────┐
│ 🧠 PikPak Rename Pro v4    [—] │  ← header（唯一可拖区域）
├─────────────────────────────────┤
│ Token ✓ (3s前)                 │
│ 查找（正则）: [____________]    │
│ 替换为:      [____________]    │
│ [✓] 自动编号  [✓] 保留后缀     │
│ 延迟(ms):   [1500]             │
│ [📂读取目录] [▶开始改名] [⏹]   │
│ ████████░░░░░░ 60%  6/10       │
│ ┌──────────────────────────┐   │
│ │ ✅ a.mp4 → a_01.mp4     │   │
│ │ ✅ b.mp4 → b_02.mp4     │   │
│ └──────────────────────────┘   │
└─────────────────────────────────┘
```

**拖拽实现**：仅 `#ppk-header` 绑定 `mousedown`，避免与输入框选文字操作冲突。

```javascript
function makeDraggable(el, handle) {
    let dragging = false, ox, oy;
    handle.addEventListener('mousedown', e => {
        dragging = true;
        ox = e.clientX - el.offsetLeft;
        oy = e.clientY - el.offsetTop;
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        el.style.left = e.clientX - ox + 'px';
        el.style.top  = e.clientY - oy + 'px';
    });
    document.addEventListener('mouseup', () => dragging = false);
}
```

---

## 5. 原版 Bug 清单与修复记录

| # | 严重度 | 原版问题 | v4.0 修复方式 |
|---|---|---|---|
| 1 | 🔴 高 | 未处理 `Headers` 实例类型，token 偶发捕获失败 | `instanceof Headers` 分支，使用 `.get()` |
| 2 | 🔴 高 | 无分页，超100文件时数据丢失 | `next_page_token` 循环直到为空 |
| 3 | 🔴 高 | 缓存不绑定目录，切换目录返回旧数据 | `Map<parentId, ...>` + TTL |
| 4 | 🟡 中 | UI delay 配置从未生效，始终使用硬编码 1-3s | `runQueue` 读取 `config.delay` + jitter |
| 5 | 🟡 中 | 无中止机制，任务启动后无法停止 | `_abortFlag` 标志位 + 中止按钮 |
| 6 | 🟡 中 | 无重试机制，失败直接跳过 | `renameFile` 最多重试 2 次，429 额外等待 |
| 7 | 🟡 中 | 正则错误被 `catch {}` 静默吞掉，用户无提示 | 预校验并向 UI 报错，返回 `null` 中止队列 |
| 8 | 🟡 中 | 整个面板触发拖拽，与输入框冲突 | 仅 header 区绑定 mousedown |
| 9 | 🟢 低 | 名称未变时仍发请求，浪费配额 | 改名前对比，相同则跳过 |
| 10 | 🟢 低 | Python 示例 API 地址错误 | 文档标注正确地址 |
| 11 | 🟢 低 | XHR 请求未拦截 | 劫持 `setRequestHeader` |

---

## 6. API 接口参考

### 获取文件列表

```
GET https://api-drive.mypikpak.com/drive/v1/files
    ?parent_id={folderId}
    &page_size=100
    &page_token={nextPageToken}   （首页省略）

Authorization: Bearer {token}
```

**响应结构**（关键字段）：

```json
{
  "files": [
    {
      "id": "VNpR...",
      "kind": "drive#file",
      "name": "movie.mp4",
      "size": "1073741824",
      "mime_type": "video/mp4"
    }
  ],
  "next_page_token": "eyJ...",   // 最后一页时为空字符串或缺失
  "folder_type": "NORMAL"
}
```

### 重命名文件

```
PATCH https://api-drive.mypikpak.com/drive/v1/files/{fileId}
Authorization: Bearer {token}
Content-Type: application/json

{ "name": "new_filename.mp4" }
```

**成功响应**：HTTP 200，返回更新后的文件对象。  
**常见错误码**：

| 状态码 | 含义 | 处理方式 |
|---|---|---|
| 401 | Token 过期 | 提示用户刷新页面重新捕获 |
| 429 | 请求过频 | 等待 5s 后重试 |
| 403 | 权限不足 | 检查文件所有权 |
| 404 | 文件不存在 | 跳过，记录日志 |

---

## 7. 安全性与反封建议

### 延迟策略

脚本使用 **基准延迟 + ±30% 随机抖动**，推荐配置：

| 文件数量 | 建议延迟(ms) | 预计耗时 |
|---|---|---|
| < 20 | 1000–1500 | ~20s |
| 20–100 | 1500–2000 | ~2–3min |
| 100–500 | 2000–3000 | ~8–25min |
| > 500 | 3000+ | 分批执行 |

### 其他建议

- **不要在高峰时段**（UTC 12:00–16:00）进行大批量操作
- **每次会话**不建议重命名超过 500 个文件
- **发现 429 错误增多**时，立即中止并等待 10 分钟
- Token 有效期通常在 **1–2 小时**，长时间任务前建议刷新页面重新捕获
- 脚本使用 `_origFetch`（原始 fetch 引用）发出 API 请求，**不会被自身的 fetch 拦截器二次处理**

---

## 8. 扩展开发指南

### 添加新的文件操作（以「批量移动」为例）

在 §3 API 层添加：

```javascript
async function moveFile(fileId, destFolderId, token) {
    const res = await _origFetch(`${API_BASE}/files:batchMove`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ids: [fileId],
            to: { parent_id: destFolderId }
        })
    });
    return res.ok ? { ok: true } : { ok: false, status: res.status };
}
```

### 添加新的重命名规则（以「日期前缀」为例）

在 `processName` 中追加：

```javascript
if (config.addDatePrefix) {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    name = `${ymd}_${name}`;
}
```

同时在 `getConfig` 中读取对应 checkbox：

```javascript
addDatePrefix: panel.querySelector('#ppk-date-prefix').checked,
```

### 添加配置持久化

使用 `@grant GM_setValue` / `GM_getValue`（需在 `@grant` 声明中添加）：

```javascript
// 保存
GM_setValue('ppk-config', JSON.stringify(getConfig()));

// 加载
const saved = GM_getValue('ppk-config');
if (saved) applyConfig(JSON.parse(saved));
```

---

## 9. FAQ

**Q: 脚本安装后浮窗没有出现？**  
A: 脚本在 `window.load` 后 2.5 秒创建 UI。若页面加载较慢，请等待 5 秒。可在 Tampermonkey 控制台检查是否有报错。

**Q: 显示「Token ✗」，如何获取 Token？**  
A: 在 PikPak 页面点击任意文件夹进入，或点击任意文件触发预览/下载。脚本会自动从这些请求中捕获 Token。Token 状态每 2 秒刷新。

**Q: 正则表达式怎么写？**  
A: 查找框支持标准 JS 正则语法（无需加 `/`）。例如：
- 删除方括号内容：`\[.*?\]`
- 删除多余空格：`\s+`（替换为单个空格）
- 删除第一个下划线前的内容：`^[^_]+_`

**Q: 改名后页面没有刷新怎么办？**  
A: 脚本仅调用 API，不刷新 PikPak 页面 DOM。需要手动按 F5 或重新进入文件夹查看最新名称。

**Q: 可以处理子文件夹内的文件吗？**  
A: 当前版本仅处理当前目录下的文件（`kind === 'drive#file'`，子文件夹被过滤）。如需递归处理，可参考[扩展开发指南](#8-扩展开发指南)。

**Q: Python CLI 脚本如何使用？**  
A: Python 版本为概念演示，需先通过浏览器获取 Token（参考 XHR 拦截部分）。Token 有效期通常不超过 2 小时，不适合长时间无人值守任务。
