---
title: '网站首屏与图片加载性能优化'
type: 'refactor'
created: '2026-08-25'
status: 'done'
baseline_commit: 'fde1ab72fbed5d6c0cd396c5e5531619aadeaca6'
review_loop_iteration: 1
context:
  - '{project-root}/docs/project-overview.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 全站在语言 JSON 返回前隐藏 `body`，直接推迟 FCP/LCP；首页、About 与 FDE 文章在移动端仍下载 2–3.2 MB PNG，长文章滚动还会频繁写入布局属性。

**Approach:** 让静态 HTML 立即可见，语言数据仅做渐进增强；为三张关键图片提供响应式 WebP 与 PNG 回退；降低非首屏图片优先级，并用 rAF 与 transform 更新阅读进度。

## Boundaries & Constraints

**Always:** 保持现有裁切、三语内容、URL、语言切换、导航和配色；WebP 有 PNG 回退并使用真实宽高；JSON 失败时 HTML 仍可读；动画尊重 `prefers-reduced-motion`。

**Ask First:** 删除源图、改变字体或公开文案、重构页面、引入运行时依赖前先询问。

**Never:** 不处理已延期的 SEO、可访问性或视觉重设计；不删未引用素材；不改 URL/数据结构；不新增框架、打包器或第三方性能脚本。

## I/O & Edge-Case Matrix

| 场景 | 输入 / 状态 | 预期输出 / 行为 | 错误处理 |
|----------|--------------|---------------------------|----------------|
| 正常加载 | JSON、WebP 可用 | 内容立即出现；选择匹配视口的 WebP | 无 |
| 资源失败 | JSON 或 WebP 不可用 | HTML 可见，PNG 回退且布局不变 | 记录 JSON 错误，不隐藏页面 |
| 连续滚动 | 快速滚动/缩放 | 每帧至多更新一次 transform | 限制在 0–100% |

</frozen-after-approval>

## Code Map

- `assets/css/styles.css:27-46,75-89,1355-1364` -- 全局显隐、进度条和 reveal；不改字体。
- `assets/js/main.js:139-145,209-215,395-455` -- JSON、图片优先级、错误路径与滚动更新。
- `index.html:40`、`about.html:39` -- 2.05/2.37 MB 主视觉，需响应式资源和真实尺寸。
- `blog-forward-deployed-engineer*.html:44` -- 共用 3.22 MB 文章图；移动端首屏可见，必须保持高优先级。
- `assets/images/` -- 保留源 PNG，新增每张 480/768/最大宽度 WebP。
- `AGENTS.md`、`docs/project-overview.md` -- 只读项目约束。

## Tasks & Acceptance

**Execution:**
- [x] `assets/images/` -- 用 Pillow 为三张关键 PNG 生成 480/768/最大宽度 WebP，保持比例并控制预算。
- [x] `index.html`、`about.html`、三个 FDE HTML -- 添加 `<picture>`/srcset/sizes、PNG 回退和真实尺寸；首页、About 与移动端首屏可见的 FDE 文章图保持 eager/high/async。
- [x] `assets/css/styles.css` -- 取消全页透明门控；进度条改用左侧原点 `scaleX()`。
- [x] `assets/js/main.js` -- JSON 失败仍显示 reveal；仅真正位于首屏外的精选图 lazy/low/async；用 rAF 合并进度更新。
- [x] 本地 HTTP -- 验证三语文章、首页与 About 的资源、切换和断点，并确认 FDE 首屏图不被延迟加载。

**Acceptance Criteria:**
- Given 冷启动或 JSON 被阻断，when 打开页面，then 正文立即可见且 reveal 不会永久隐藏。
- Given 390/768/1280 视口，when 加载关键页，then 可选择匹配宽度 WebP，PNG 回退有效且无溢出或裁切回归。
- Given 390px 的 FDE 文章首屏，when 页面加载，then 文章图使用 eager/high/async，不因懒加载延迟 LCP 候选。
- Given 生成资源，when 检查大小，then 均小于源 PNG，480 宽不超过 250 KB，最大变体不超过 650 KB。
- Given 连续滚动长文章，when 更新进度，then rAF 合帧且只修改 transform。
- Given 修改完成，when 运行语法、Git diff、HTTP 和三语验证，then 全部通过且无新增控制台错误。

## Spec Change Log

- 2026-08-26 / review loop 1：审查发现 FDE 文章图在 390px 首屏实际可见，而原任务误写为 lazy/low；已将三个 FDE 版本改为 eager/high/async，并增加首屏优先级验收。避免继续保留“首屏 LCP 候选被懒加载”的已知坏状态。KEEP：保留已生成且通过预算的 WebP、PNG 回退、真实尺寸、静态 HTML 立即可见、JSON 失败降级、rAF + transform 进度条及已验证的三语/断点行为。

## Verification

**Commands:**
- `powershell -ExecutionPolicy Bypass -File ".agents/skills/agawa-blog-publisher/scripts/validate_blog.ps1" -Stem "blog-forward-deployed-engineer"` -- 三语、资源、JSON、JS 与 diff 通过。
- `node --check assets/js/main.js` -- JavaScript 语法通过。
- `git diff --check` -- 无空白或补丁错误。
- `python server.py --port 8765` 后通过本地浏览器检查 390/768/1280 断点 -- 首页、About、三语 FDE 均无横向溢出，按视口选择 480/768/最大 WebP，正常加载无控制台错误。
- JSON 阻断服务器 `http://127.0.0.1:8766/` -- `body` 保持可见、静态中文首屏可读、首屏 reveal 无隐藏、`is-switching` 正常清除并记录预期错误。
- 本地语言切换 `zh -> en` -- `html[lang]`、按钮状态、首页副标题与精选作品标题同步更新。
- 长文章滚动检查 -- 进度条只写入 `transform: scaleX(...)`，未写入行内 `width`。
- WebP 资源预算 -- 480px 变体最大 39,622 B，最大宽度变体最大 255,030 B，均小于源 PNG 与预算上限。
- 修正版 FDE 首屏检查 -- 390px 下图片顶部为 595px，实际属性为 `loading=eager`、`fetchPriority=high`、`decoding=async`，选择 480px WebP 且无横向溢出。
- JSON 永久挂起检查 -- 360ms 后静态正文仍可读、首屏 reveal 无隐藏且 `is-switching=false`，不会无限保持淡化状态。
- 快速语言切换检查 -- 连续触发英文与日文后最终保持日文内容、日文按钮状态与 `html[lang=ja]`，旧请求不会覆盖最新选择。

**Manual checks (if no CLI):**
- 桌面与 390px 检查首页、About、三语 FDE；阻断 JSON 后仍可见，裁切与语言切换正常。

## Suggested Review Order

**渐进增强与失败恢复**

- 最新请求令牌与有界清理避免页面长期淡化或旧语言回写。
  [`main.js:398`](../../assets/js/main.js#L398)

- 静态内容先显示，再异步增强语言与滚动状态。
  [`main.js:458`](../../assets/js/main.js#L458)

- 移除全页透明门控，让首屏不再等待 JSON。
  [`styles.css:27`](../../assets/css/styles.css#L27)

**滚动性能**

- rAF 合并滚动更新并只写入 transform。
  [`main.js:441`](../../assets/js/main.js#L441)

- 全宽进度条以左侧 scaleX 呈现比例。
  [`styles.css:83`](../../assets/css/styles.css#L83)

**响应式图片与加载优先级**

- 首页主视觉使用真实尺寸与分档 WebP。
  [`index.html:40`](../../index.html#L40)

- About 首屏肖像使用响应式候选并保持高优先级。
  [`about.html:39`](../../about.html#L39)

- FDE 首屏图保留 eager/high，同时大幅降低传输体积。
  [`blog-forward-deployed-engineer.html:44`](../../blog-forward-deployed-engineer.html#L44)

- 统一 picture 包装尺寸，维持原有裁切规则。
  [`styles.css:317`](../../assets/css/styles.css#L317)

**后续边界**

- 自动化回归与既有语言交互问题留作独立任务。
  [`deferred-work.md:11`](deferred-work.md#L11)
