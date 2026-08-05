# 去重功能安全增强实施计划

## Context

当前去重功能存在严重安全隐患：`normalizeEntries` 丢弃了 hash 字段导致去重不准，`fetchAllFiles` 零延迟分页请求有封号风险，删除操作仅一个 `confirm()` 对话框即批量永久删除，无导出、无撤销、无回收站。用户文件重要，需要"只看不删、导出为安"的交互模式。

**用户决策**：
- 删除策略：回收站优先（永久删除需额外确认）
- 扫描参数：用户自选（提供深度和请求上限输入框）

---

## 修改文件

唯一修改文件：[pikpak-rename.user.js](file:///d:/code/code/program/1-Pikpak-Rename/pikpak-rename.user.js)

---

## 实施步骤

### Step 1: gmRequest 增加 429 自动退避重试

**位置**：L379-388 `gmRequest()` 函数

**改造**：在 `GM_xmlhttpRequest` 外层包一个重试循环，429 时指数退避（2s → 4s → 8s），最多重试 3 次。不改变函数签名，所有上游调用零改动。

**新增 L10N 词条**：`rateLimited: 'Rate limited, backing off'` / `'请求频率受限，正在退避'`

---

### Step 2: normalizeEntries 扩展字段

**位置**：L409-415 `normalizeEntries()` 函数

**改造**：保留原有 4 字段，新增 `hash`/`md5`/`mimeType`/`parentId`/`createdTime`/`modifiedTime`/`starred`。向后兼容——现有代码只读 id/name/kind/size。

---

### Step 3: fetchAllFiles 增加分页延迟

**位置**：L417-433 `fetchAllFiles()` 函数

**改造**：
- 分页间增加 600-1000ms 随机延迟
- 增加安全上限（MAX_REQUESTS = 500 防死循环）

---

### Step 4: stripPikPakSuffix 增强后缀清理

**位置**：L1167-1169 `stripPikPakSuffix()` 函数

**改造**：从仅处理 `(N)` 扩展到 `_N`/` - N`/` copy`/` 副本`/`[N]` 等常见重复后缀模式。

新增辅助函数 `getBaseName(name)` 和 `getExt(name)`。

---

### Step 5: detectDuplicates 多级检测算法

**位置**：L1171-1180 `detectDuplicates()` 函数

**改造**：三级检测引擎
1. **hash 精确匹配**（置信度 100）— 内容完全相同
2. **cleanName + size 匹配**（置信度 80）— 排除 hash 已归组文件
3. **size-only 匹配**（置信度 40，仅 >1MB 文件）— 疑似重复

返回值从 `File[][]` 变为 `{files: File[], level: string, confidence: number}[]`

---

### Step 6: L10N 词条批量新增

**位置**：翻译对象（i18n 部分）

**新增约 25 个词条**：dupRecursive/dupExport/dupGroupCount/dupConfidence/dupKeepOldest/dupKeepNewest/dupKeep/dupMarkDel/dupMoveTrash/dupSafetyWarn/dupConfirmExport/dupConfirmTrashDetail/dupConfirmDeleteDetail/dupConfirmCode/dupCodeMismatch/dupTrashing/dupDeleting/dupExportDone/dupNoDupes/dupSelectAllGroup/selectAll/dupMaxDepth/dupMaxRequests/dupScanSettings

---

### Step 7: 面板 HTML 模板替换

**位置**：L1866-1876 `#pk-org-duplicates` 区块

**替换为**：
- 工具栏：扫描按钮 + 递归扫描 checkbox + 导出 CSV 按钮
- 扫描设置（递归时显示）：最大深度输入框 + 请求上限输入框
- 摘要栏：组数/可删数 + 筛选下拉（全部/hash/name+size）+ 排序下拉（文件大小/组大小/置信度）
- 列表区：`#pk-dup-list`（max-height 增至 300px）
- 全局操作：全选 checkbox + 延迟输入
- 删除按钮：回收站（主按钮，蓝色）+ 永久删除（次按钮，红色）
- 安全警告文字

---

### Step 8: buildDupGroupCard + renderDuplicates 重写

**位置**：L1191-1217 `renderDuplicates()` 函数

**改造**：分组卡片式 UI，每组包含：
- 组头：文件名（ellipsis）+ 置信度星标（★★★/★★/★）+ 文件大小 + 重复数量
- 操作栏：组全选 + 保留最早 + 保留最新 按钮
- 文件行列表：checkbox + 文件名 + 大小 + 日期(MM-DD) + 保留/删除 标签
- 默认按创建时间排序，最早的标记"保留"，其余标记"删除"
- 可折叠/展开

**新增函数**：
- `buildDupGroupCard(group, groupIndex)` — 构建单个分组卡片 DOM
- `sortDupGroups(groups, sortBy)` — 排序辅助
- `updateDupDeleteCount()` — 更新删除按钮计数

---

### Step 9: exportDuplicatesCSV 导出功能

**新增函数**，无现有代码参考

**功能**：
- UTF-8 BOM 头（确保 Excel 中文正常）
- 列：Group/Level/Confidence/FileName/Size/SizeBytes/Hash/MD5/MimeType/CreatedTime/ModifiedTime/ParentID/FileID/Action
- Action 列默认值：每组最早文件为 KEEP，其余为 DELETE
- 触发浏览器下载，文件名 `pikpak-duplicates-YYYY-MM-DD.csv`

---

### Step 10: executeDupDelete 三级确认 + 回收站优先

**位置**：L1219-1233 `executeDupDelete()` 函数

**改造**：
- 接受 `useTrash` 参数（true=回收站，false=永久删除）
- **第一级**：弹窗提示是否先导出 CSV
- **第二级**：显示待删除文件名清单（最多展示 10 条 + 溢出数量）
- **第三级**：要求输入待操作文件数量作为确认码
- 回收站模式：逐个调用 `trashFile(id)` + 延迟
- 永久删除模式：`deleteFiles(ids)` 批量删除
- 操作后更新缓存并重新渲染

---

### Step 11: fetchAllFilesRecursive 跨文件夹扫描

**新增函数**

**功能**：
- 参数：rootParentId, maxDepth（用户输入，默认 3）, maxRequests（用户输入，默认 200）
- BFS 遍历子文件夹
- 已访问集合防循环
- 达到上限时停止并 log 提示

---

### Step 12: 事件绑定更新

**位置**：L2022-2026 去重按钮事件绑定区

**替换为**：
- `#pk-dup-scan` — 检查递归 checkbox，递归则调用 fetchAllFilesRecursive，否则用 cachedFiles
- `#pk-dup-export` — 调用 exportDuplicatesCSV
- `#pk-dup-trash` — 调用 executeDupDelete(true)
- `#pk-dup-delete` — 调用 executeDupDelete(false)
- `#pk-dup-filter` / `#pk-dup-sort` — onchange 触发 renderDuplicates
- `#pk-dup-select-all` — 全选/取消
- `#pk-dup-recursive` — 切换时显示/隐藏扫描设置区域

---

## 验证方式

1. **基础去重**：在含重复文件的 PikPak 文件夹扫描，确认分组正确、hash 组标记★★★
2. **CSV 导出**：点击导出，用 Excel 打开验证中文显示、字段完整性
3. **三级确认**：尝试删除，验证每一步确认流程，输入错误确认码应取消操作
4. **回收站**：删除文件后到 PikPak 回收站确认可恢复
5. **429 退避**：快速连续操作触发限流时，确认自动重试而非直接报错
6. **跨文件夹扫描**：设置深度 2 / 请求上限 50，验证扫描不超出限制
7. **筛选排序**：切换筛选和排序选项，验证列表正确更新
8. **向后兼容**：重命名/分类/分享等其他功能不受影响
