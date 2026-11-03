# 审核报告 · Agawa-HP UX 优化（阶段 A/B）

日期：2026-11-03
执行依据：`docs/ux-optimization-execution-plan.zh.md`（2026-11-03）
状态：**阶段 A 完成，阶段 B 完成，停在原型审核点；阶段 C–F 未开始。**

> 说明：本文件取代 10:53 由交接方补写的临时状态记录。当时最后一轮检查因额度中断；本报告记录的是之后实际补齐的检查与结果。

## 1. 结论

1. 阶段 A 产出了页面清单、字段盘点、文章/作者/主题/项目映射，以及 9 项待确认内容（见 `01-content-inventory.zh.md`、`02-content-mapping.zh.md`）。
2. 阶段 B 产出了可本地 HTTP 浏览的原型：首页、项目、博客、鱼的文字（长文/札记）、长文章、关于、联系，共 8 个页面；桌面与手机布局均可操作，另有 2 个审核工具页。
3. **没有改动任何生产文件**：33 个 HTML/CSS/JS/JSON 文件在任务开始与结束时 SHA-256 完全一致；没有 commit / push / merge，也没有触发 Pages。
4. 本阶段所有“通过”都指**原型在本地浏览器中的行为**，不代表生产三语页面已经修改，也不代表真实访客效果已经改善（未做真实访客测试）。

## 2. 新增文件

全部位于 `_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/`，不进入 Pages 产物：

| 路径 | 作用 |
| --- | --- |
| `README.zh.md` | 运行说明与预览地址 |
| `01-content-inventory.zh.md` | 阶段 A 页面与字段清单 |
| `02-content-mapping.zh.md` | 阶段 A 内容映射与待确认项 |
| `03-review-report.zh.md` | 本报告 |
| `prototype/index.html` | 首页原型（双主入口、精选项目、技术文章、其他近期文章） |
| `prototype/works.html` | 项目页原型（页首索引、锚点、打开应用/访问网站） |
| `prototype/blog.html` | 博客页原型（文章优先、鱼的文字入口、主题筛选、空状态） |
| `prototype/fish-blog.html` | 鱼的文字 · 长文 |
| `prototype/notes.html` | 鱼的文字 · 札记 |
| `prototype/article.html` | 长文章（目录、继续阅读、返回） |
| `prototype/about.html` | 关于页（入口提前；简化原型） |
| `prototype/contact.html` | 联系页（联系方式优先；简化原型） |
| `prototype/review.html` | 审核检查页（页面清单、状态样例、私密边界样例、已知限制） |
| `prototype/review-viewports.html` | 尺寸检查页（320–1440 iframe 并排） |
| `prototype/assets/proto.css`、`proto.js` | 原型样式与交互（独立于生产 `styles.css`/`main.js`） |
| `prototype/data/proto-data.json` | 从生产三语 JSON 与文章 HTML 只读派生的原型数据 |
| `prototype/data/proto-ui.json` | 原型新增界面文案（三语） |
| `tools/build-prototype-data.mjs` | 数据生成脚本（只读生产文件） |
| `tools/verify-prototype.mjs` | 静态自检脚本 |
| `tools/browser-checks/` | 浏览器检查脚本（宽度矩阵、功能断言、键盘/控制台、三语完整性），供 DSH 浏览器执行 |
| `checks/2026-11-03-browser-results.json` | 本次浏览器检查的机器可读结果 |
| `baseline/` | 基线副本、SHA-256 清单、git 不可用说明 |
| `screenshots/` | 实际浏览器截图（52 张） |

生产文件变更：**0 个**。

## 3. 实际执行的命令与结果

| # | 命令 | 结果 |
| --- | --- | --- |
| 1 | `git status --short` | PATH 中没有 `git`，但 GitHub Desktop 自带 git 可用（`…\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe`，2.53.0）。用完整路径执行：`M site.en.json / M site.ja.json / M site.zh.json / ?? _bmad-output/planning-artifacts/ / ?? docs/ux-optimization-execution-plan.zh.md`，无暂存、无新提交 |
| 2 | `node tools/build-prototype-data.mjs` | 成功：5 篇文章、3 个项目、原型数据约 292 KB；文章目录条数 `6/10/6/10/11` |
| 3 | `node --check prototype/assets/proto.js` | 退出码 0 |
| 4 | `node tools/verify-prototype.mjs` | `PASS`：JSON 解析、10 个 HTML 的本地链接、重复 id、92 个 `data-ui` + 7 个 `data-aria` 三语键（本轮补齐后；初次为 71 + 3）、目录锚点、33 个生产文件哈希一致 |
| 5 | `python server.py --port 8137`（后台） | `HTTP 200`；日志除首次 `GET /favicon.ico` 404 外全部 200；补 favicon 链接后不再出现 404 |
| 6 | 宽度矩阵：中文 8 个页面 × 6 个宽度 | `tools/browser-checks/width-matrix.js`：48 次检查，0 失败 |
| 7 | 宽度矩阵：英/日 12 组页面状态 × 6 个宽度 | 72 次检查，0 失败；合计 120 次 |
| 8 | 功能断言 | `tools/browser-checks/functional.js`：14/14 通过（首页结构、双入口、博客首屏第一篇文章、筛选与 URL、无结果、文章目录/继续阅读、鱼的两栏目、项目索引、关于、联系、数据失败态） |
| 9 | 键盘、菜单、语言入口 | `tools/browser-checks/keyboard-console.js`：9/9 通过（展开/Escape/回焦/隐藏项、语言三选项与保留筛选、Enter 筛选、Enter 目录跳转） |
| 10 | 控制台/异常/资源失败（7 个页面，`Log.enable` + `Runtime.enable` + `Network.enable`） | 0 个错误、0 个异常、0 个网络失败（含在 `keyboard-console.js` 中） |
| 11 | 目标尺寸与对比度测量（博客页） | 见 §3.2 |
| 12 | 私密边界样例（`review.html`） | 锁定：`body.innerText` 中检索不到标题与摘要；解锁：显示并标注“样例” |
| 13 | 数据加载失败模拟（`?simulateDataError=1`） | 显示错误提示 + “重试”按钮，5 个导航入口仍可用 |
| 14 | 键盘：筛选按钮 Enter | 5 篇 → 2 篇，`aria-pressed=true`，URL 带 `topic=technical`，焦点留在按钮 |
| 15 | 键盘：目录第 5 项 Enter | 跳到 `#sec-5`，`scrollY=2010` |
| 15b | 粘性头部与项目锚点 | `position=sticky`、滚动后 `top=0`；`#jaist-shuttle-next` 标题 `top=193` > 头部 73 |
| 16 | 隐藏状态可见性（`getComputedStyle().display`） | 通过：博客空状态、文章“未找到”、鱼空间空态在不适用的页面为 `display:none`；空状态仅在无结果时显示 |

### 3.1 基线差异（git 不可用时的替代）

- 用户报告的改动：`M assets/data/site.{zh,en,ja}.json`、`?? docs/ux-optimization-execution-plan.zh.md`。
- 本机 PATH 中没有 git（GitHub Desktop 自带 git 可用）。为避免依赖单一工具，把上述 4 个文件复制到 `baseline/originals/`，并对 33 个生产文件生成 `baseline/tree-start.sha256` 与 `baseline/tree-end.sha256`；随后用自带 git 复核了 `git status --short`（输出见 §3 第 1 行）与 `git log -1`（`87ff732`，任务前提交）。
- 两次清单 `Compare-Object` 结果：**完全一致**。
- 由此确认：三份语言 JSON 的现有未提交修改被原样保留，没有回退或覆盖；本次也没有混入其他项目改动。

### 3.2 尺寸与对比度实测

| 项目 | 实测 | 结论 |
| --- | --- | --- |
| 导航/按钮最小高度 | 44px（`min-height: 2.75rem`） | 达到 44 建议值 |
| 页脚文字链接 | 34 × 44px（高度够，宽度由文字长度决定） | 未达 44 宽；不阻断使用，记入阶段 C 待改 |
| 原型横幅内“原型检查页”链接 | 65 × 19px | 属于审核用界面，不属于产品导航 |
| 正文对比度 | 16.7:1（#000 / #e5e5e5） | 通过 |
| 次要文字对比度 | 7.0:1（#4a4a4a / #e5e5e5） | 通过 |
| 强调色 #ff4428 | 仅用于边框、色块、`✓` 等装饰；**不承担小字正文** | 已避免约 2.75:1 的低对比文字 |

### 3.3 未执行的检查（不要当成已通过）

- Lighthouse / axe 等自动化可访问性审计未跑。
- 屏幕阅读器（NVDA/VoiceOver）未实测。
- 浏览器 200% 缩放与系统大字体未实测（“文本放大”一项未验证）。
- 真实键盘人工走查未做；键盘结论来自自动化按键事件。
- 生产页面的三语切换、文章 URL、canonical/hreflang/JSON-LD 本阶段未改，因此也没有重新验证。

## 4. 验收清单（方案 §7）逐项状态

状态说明：**✅ 已验证**＝本阶段在原型上实际执行并留证；**◻ 后续验证**＝本阶段不做或缺乏条件，留到正式实现；**⛔ 未做 / 阻塞**＝本阶段无法完成。

### 导航与发现

| 验收项 | 状态 | 证据 / 说明 |
| --- | --- | --- |
| 首页首屏“查看项目/阅读博客”桌面与手机可见，含英日长文案 | ✅ | 72 次宽度检查（zh/en/ja × 320–1440）；`screenshots/home-360.png`、`home-768.png`、`home-1280.png`、`home-1440.png`、`home-en-1280.png`、`home-ja-1280.png` |
| 所有页面一致的项目/博客入口；手机端无需展开菜单 | ✅ | 8 个站点页面共用同一头部；手机端 `项目/博客/菜单` 常驻（`menu-open-390.png`、`blog-390.png`） |
| 博客开头可发现鱼的空间；长文与札记互相切换各一次操作 | ✅ | `blog-390.png`（鱼的文字卡）、`fish-long-390.png`、`notes-390.png`；断言记录 `next=notes.html`、`back=blog.html` |
| 链接/卡片/按钮文字可预测，不靠颜色/悬停/箭头唯一提示 | ✅ | 选中态同时有 `✓`、下划线、粗体、`aria-current`、“· 当前”文字；未做屏幕阅读器实测 |
| 文末可返回列表或继续阅读 | ✅ | `article-1280.png`、`article-390.png`；断言：继续阅读 2 篇且不含自身、返回链接保留筛选 |

### 布局与交互

| 验收项 | 状态 | 证据 / 说明 |
| --- | --- | --- |
| 360/390/768/1280/1440 与约 320 宽度检查 | ✅ | 8 页 × 6 宽度 = 48 次；`review-viewports.html` 可复跑 |
| 无横向溢出 | ✅ | 120 次宽度检查（中文 48 + 英/日 72）均无溢出 |
| 需要横向阅读的表格在独立容器内滚动 | ◻ | 原型 CSS 已写 `table{display:block;overflow-x:auto}`，但演示文章（《把「人」演得很像》）没有表格，未实测 |
| 导航/菜单/主入口 ≥44×44，可见焦点 | ✅（部分） | 44px 高度全部满足；页脚文字链接宽 34px 未达 44；焦点环 3px 已实现 |
| 仅键盘完成导航、菜单、筛选、目录、语言切换 | ✅（自动化）/◻（人工走查） | 筛选 Enter 生效（5→2 篇、`aria-pressed=true`）；目录 Enter 跳到 `#sec-5`；菜单/语言 Escape 关闭并回焦 |
| 固定导航不遮挡锚点标题与聚焦元素；提供跳到正文 | ✅ | 文章锚点后标题 `top=119px` > 头部 `73px`；项目页 `#jaist-shuttle-next` 跳转后标题 `top=193px`，头部 `position=sticky` 且 `top=0`；`#main` 跳过链接可聚焦 |
| 普通文字 ≥4.5:1、大字 ≥3:1；当前/选中不只靠颜色 | ✅ | 16.7:1、7.0:1；强调色不再用作小字；选中态有文字标记 |
| 尊重减少动画偏好；内容不依赖入场动画 | ✅ | `prefers-reduced-motion` 块；原型无 `opacity:0` 类入场依赖 |
| 语言数据失败保留导航 + 简要错误 + 重试 | ✅ | `screenshots/error-state.png`；`?simulateDataError=1` 仅原型使用，正式实现改为真实 fetch 失败分支 |

### 内容、语言与链接

| 验收项 | 状态 | 证据 / 说明 |
| --- | --- | --- |
| 中英日逐页检查导航、栏目、卡片、空状态与语言切换 | ✅（页面级）/◻（未逐张截图） | 120 次宽度检查覆盖 zh 8 页与 en/ja 12 组；截图覆盖 zh 全部页面 + 英/日首页与博客。鱼空间与空状态的英日未逐张截图 |
| 作者、主题、首页精选有内容依据；不自行编写鱼身份与项目贡献 | ✅ | `02-content-mapping.zh.md` §1–§4；9 项待确认单列 |
| 同文跨栏目不生成重复文章、不重复出现在同一推荐列表 | ✅ | 总列表与鱼的长文指向同一三语 URL；继续阅读排除自身且去重 |
| 私密文章未解锁不进新增公开发现区 | ✅ | 可见性函数与生产规则一致；当前数据 0 篇 `private`；样例锁定态检索不到标题/摘要 |
| 旧 URL、锚点、外链、canonical、语言对应仍有效 | ✅（未改动）/◻（原型内未复验 SEO） | 生产哈希一致，URL 与锚点未被触碰；原型不含 canonical/hreflang/JSON-LD |
| JS 语法、三份 JSON 解析、差异空白、链接检查；浏览器控制台与资源 | ✅（git 空白差异不可用，改用哈希） | 见 §3 第 2–5、10 行 |
| 所有预览走本地 HTTP | ✅ | `python server.py --port 8137`；未使用 `file://` |

### 访客走查与证据

| 验收项 | 状态 | 证据 / 说明 |
| --- | --- | --- |
| 按 §3 情景逐项走查 | ✅（原型内自走查） | 见 §5；只记录实际点击路径，不代表真实用户 |
| 邀请接近合作方/朋友情景的人完成任务 | ⛔ 未做 | 没有可邀请的真实访客；本报告不宣称任务成功率或找寻时间改善 |

## 5. 路径走查记录（原型内自测）

| 情景 | 实际路径 | 结果 | 发现 |
| --- | --- | --- | --- |
| 合作方想体验班车应用 | 首页 → “查看项目” → 项目页 → 索引 02 JAIST Shuttle Next → “打开应用” | 2 次点击到达外部应用入口 | 索引项已标“打开应用”，点击前可预期结果 |
| 合作方想了解技术思考 | 首页“技术文章” → 十月回顾 → 文末“返回博客” → 技术实践筛选（2 篇） | 无需滚过整屏展示区即可读到技术文章，也可筛到 2 篇 | 首页顺序符合“项目在前、技术文章紧随” |
| 朋友想看最近更新 | 首页 → “阅读博客” → 列表首条 2026/11/03 十月回顾 | 1 次点击即到最新公开文章 | 无中间选择页 |
| 朋友想继续看鱼的短观察 | 博客 → “进入鱼的文字” → “鱼的札记” → 3 条 → “回到长文” | 长文与札记各一次操作互达 | 位置提示“博客 › 鱼的文字 › 札记”可逐级回退 |
| 直接打开文章的访客想看项目 | 文章页顶部导航“项目”（桌面）；手机端头部常驻“项目” | 1 次导航 | 文章页无需先回首页 |

## 6. 截图证据

`_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/screenshots/`

| 文件 | 内容 |
| --- | --- |
| `home-320/360/390/768/1280/1440.png` | 首页六个宽度；双入口均在首屏 |
| `home-en-1280.png`、`home-ja-1280.png` | 英语/日语首页（较长主入口文案） |
| `menu-open-390.png` | 手机菜单展开：首页·当前 / 关于我 / 联系 / 三种语言 |
| `blog-320/390/768/1280.png` | 博客页；鱼的文字入口在首批文章前 |
| `blog-filter-390.png` | 技术实践筛选选中（计数 2） |
| `blog-empty-390.png`、`blog-empty-en-390.png`、`blog-empty-ja-390.png`、`blog-empty-state.png` | 筛选无结果状态与“查看全部文章”（中/英/日） |
| `blog-1280-lang-menu.png` | 语言入口展开（中文 ✓ / English / 日本語） |
| `fish-long-390.png`、`fish-long-1280.png`、`fish-long-en-390.png`、`fish-long-ja-390.png` | 鱼的文字 · 长文（中/英/日）；栏目当前标记“· 当前 / · current / · 現在” |
| `notes-390.png`、`notes-en-390.png`、`notes-ja-390.png` | 鱼的文字 · 札记（中/英/日）；来源文字 + BV |
| `article-320/390/1280.png` | 长文章；桌面侧边目录 |
| `article-toc-390.png` | 手机“本文目录（6）”折叠区展开 |
| `works-390.png`、`works-1280.png` | 项目索引与“打开应用/访问网站” |
| `about-390.png`、`contact-390.png` | 关于/联系入口顺序（第一轮） |
| `about-zh|en|ja-390.png`、`about-zh|en|ja-1280.png` | 关于页六种三语状态：小标题、小节标题与说明随语言变化 |
| `contact-zh|en|ja-390.png`、`contact-zh|en|ja-1280.png` | 联系页六种三语状态：直接联系/也可以先看这些/字段标签随语言变化 |
| `error-state.png` | 数据加载失败：错误 + 重试 + 导航仍可用 |
| `review-page.png`、`review-private-boundary.png`、`review-private-unlocked.png` | 审核页；私密边界锁定/解锁样例 |

截图中的“DeepSeek · …”气泡是浏览器端的元素提示浮层，不属于页面；1280/1440 的个别截图在 1264 宽的浏览器窗口里按 93%/82% 缩放显示，卡片头部标注了缩放比例。

## 7. 限制、风险与遗留项

1. **原型不是生产页面。** 原型样式与脚本独立于 `assets/css/styles.css` 与 `assets/js/main.js`；正式实施需把交互移植到共享文件，并覆盖 15 个文章语言页。
2. **数据快照。** 原型数据由 2026-11-03 的三语 JSON 生成；若之后修改 JSON，需要重跑 `build-prototype-data.mjs`。
3. **没有真实访客测试。** 不提供任务耗时、成功率或“更容易找到”的量化结论。
4. **未做无障碍工具审计**（Lighthouse/axe/屏幕阅读器），也未测试 200% 文本缩放。
5. **三语覆盖不完整**：宽度矩阵与空状态主要用中文；英日首页已测，鱼空间/空状态的英日未逐张截图。
6. **`fish-blog.html` 的 SEO 元数据**只声明 zh 的 canonical/hreflang（`fish-blog.html:8-10`），与页面实际三语切换不一致；本阶段未改，属正式实施的遗留项。
7. **`october-2026` 额外引用 `assets/css/blog-october-2026.css`**，改版文章页时要处理这条附加样式。
8. **git 不可用**：无法提供 `git diff`，基线以文件副本 + SHA-256 表达。
9. **原型专用开关**：`?simulateDataError=1` 与 `review.html` 的私密样例只用于演示状态，正式实现必须移除或替换为真实失败分支。

> 本轮发现并已修复的问题：`.empty-state { display: grid }` 会覆盖 `[hidden]`，导致“无结果/文章不存在”区块在正常页面也显示。已加全局 `[hidden] { display: none !important; }`，并用计算样式逐页复核（博客正常/筛选/空结果、文章、鱼长文、札记、私密样例）。正式实现沿用 `hidden` 控制状态时必须保留这条规则。
10. **页脚链接宽度 34px**：高度 44px 达标，宽度未达建议 44px，阶段 C 统一处理。
11. **320×640 的博客首屏**：鱼的文字入口与文章区标题可见，但第一篇文章在首屏下方约 106px；360×740 及以上已能同时看到入口与第一篇文章。
12. **原型文章 URL 是原型内部地址**：`article.html?post=<id>&lang=<lang>` 只用于演示版式，不含 `data-article-lang`、canonical、hreflang；生产的三语文章 URL 未改动，映射数据里保留在 `posts[].urls`。阶段 C–F 仍使用原有 URL。
13. **目录的“<5 个二级标题不显示”分支没有样本**：现有 5 篇文章都 ≥5 个标题，代码分支存在但未被真实数据触发，只能在正式实现时补一个低标题数样本或单元检查。

## 7.1 复核后修正的三处问题

1. **状态区块误显示（已修复）。** `.empty-state{display:grid}` 覆盖了 `[hidden]`，导致“无结果/文章不存在”区块在正常页面也出现。已加 `[hidden]{display:none!important}`，并逐页用计算样式复核（博客正常/筛选/空结果、文章、鱼长文、札记、私密样例）。
2. **博客首屏看不到文章（已修复）。** 原来“鱼的文字”大卡把第一篇文章推到首屏之外，与方案 §4.4“页首说明后直接进入阅读区域”不符。现在宽屏把入口改成横向条、窄屏压紧卡片；实测第一篇文章顶部：360→718（视口 740）、390→690（844）、768→755（1024）、1280/1440→765（800/900）均可见；320×640 视口下仍在首屏下方约 106px（已知限制，见 §7）。
3. **论文式卡片小字过小（已调整）。** 鱼空间小字原为 11px 且逐字拉开，改为 12px、收紧字距；强调色不再用于小字正文。

## 7.2 关于“可复现”的说明

早先的浏览器数字（48/19/6）没有留下脚本，复核方无法独立重现，这是有效批评。现在已补：

- `tools/browser-checks/width-matrix.js`、`functional.js`、`keyboard-console.js`、`i18n.js`：DSH 浏览器可执行的实际检查脚本；
- `checks/2026-11-03-browser-results.json`：最终版的机器可读结果（120 次宽度、14 项功能、9 项键盘/菜单、7 页控制台）。

这些脚本依赖 DSH 的 `page` / `cdp()` API，不是 Node 脚本，不能直接 `node` 运行；运行方式见 `tools/browser-checks/README.md`。

## 7.3 工作区痕迹说明

复核时发现 `.git/objects` 里有 62 个 blob 与 14 个 tree 的写入时间为 2026-11-03 10:53:17，内容与交付目录吻合。这来自收尾中断时交接方执行的 git 操作（其记录提到跑过 `git diff --check`），但：

- `git log -1` 仍是任务前的 `87ff732`；
- 没有新 ref、没有新 commit；
- `git status --short` 无暂存项，只显示用户原有的三份 JSON 修改与两个未跟踪路径。

也就是说，提交/推送边界没有被突破；但“本机完全没有 git 痕迹”的说法不准确，已在 §3 更正。

## 8. 请阿川审核的具体页面与取舍

### 建议按顺序看

1. **首页**（`prototype/index.html`）：双入口是否同等突出、项目是否排在技术文章前。
2. **博客**（`prototype/blog.html`）：鱼的空间入口位置、只保留“全部/技术实践/其他主题”三个筛选是否够。
3. **鱼的文字**（`fish-blog.html` 与 `notes.html`）：空间名“鱼的文字”、栏目名“鱼的博客/鱼的札记”、位置提示。
4. **项目**（`works.html`）：“打开应用/访问网站”的措辞、页首索引、没有相关文章区块是否可接受。
5. **长文章**（`article.html`）：侧边目录/手机折叠目录、文末继续阅读的取数规则。

### 需要一句话拍板的取舍

| # | 取舍 | 现在的做法 | 备选 |
| --- | --- | --- | --- |
| 1 | 作者显示 | 阿川为推定默认署名（JSON 无 author 字段）；鱼按文章署名显示 | 增加 `authorId` 字段后再上线 |
| 2 | FDE 文章归类 | 归“其他主题”（技术实践 = 2 篇） | 归技术实践（技术实践 = 3 篇） |
| 3 | 导航改名 | WORKS→项目 / Projects / プロジェクト；BLOG→博客 | 保留 WORKS/Blog 原文案 |
| 4 | 鱼的文字英文/日文名 | Fish's Writing / 魚の文字 | 保留 fish.blog / 魚のblog 作空间名 |
| 5 | 首页“其他近期文章” | 包含《把「人」演得很像》 | 首页避开鱼的文章，只在鱼的文字出现 |
| 6 | 文章↔项目关联 | 全部省略 | 人工指定后显示“相关技术文章/相关项目” |
| 7 | 目录排除规则 | 排除“资料说明/数据来源/参考文献” | 全部二级标题都进目录 |
| 8 | 博客页鱼的文字入口形态 | 宽屏为横向条、窄屏为紧凑卡，保证第一篇文章进首屏 | 恢复大卡片（会把文章推到首屏之外） |

## 9. 下一步（未执行，等审核）

阶段 C：共用导航、手机菜单、语言入口、页脚与焦点状态（覆盖全部页面与 15 个文章语言页）。
阶段 D：首页、项目、博客、鱼的两栏目。阶段 E：文章目录与继续阅读、关于/联系。阶段 F：三语、链接、窄屏、键盘、可见性检查 + 走查。

按方案 §6，先审原型再批量改文章页，以减少返工。发布仍是审核通过后的独立动作（`main` push 会自动部署）。

## 10. 三语补齐记录（第二轮，2026-11-03）

### 10.1 触发

阿川在审核原型时截图指出：切到英文后，关于页的“先看这些”、说明、“介绍”、“时间线”仍是中文；联系页的“直接联系”、说明、“也可以先看这些”、说明仍是中文，而按钮与正文已经是英文，造成中英混杂；日文同样需要补齐。

### 10.2 先说明技能运行结果

按 `bmad-build` 技能要求执行了一次渲染命令：

```
uv run --no-cache ".../_bmad/scripts/render_skill.py" --project-root ".../Agawa-HP" --skill ".../.agents/skills/bmad-build"
```

输出与 Codex 报告的失败一致：

```
HALT: corrupt existing generation .../_bmad/render/bmad-build/agawa-hp-804a8e58fc29/4f602dd7b9abcc7c164e:
[Errno 13] Permission denied: '.../manifest.json'
```

没有删除生成目录、没有修改 ACL、没有把这次运行当成技能已通过。

目录状态用只读方式核实：`Test-Path` 返回 True（目录仍在），但枚举内容被拒绝：`Get-ChildItem` → `UnauthorizedAccessException` / `Permission denied`。因此“目录还在”有证据，“内部文件未变”无法读取确认；本轮没有对它做任何写操作。

本轮修复是在该工作流不可用的情况下，按阿川在本轮的明确授权直接改原型文件完成的；这属于对技能失败的报告，不是把 HALT 伪装成成功。

### 10.3 实际修了什么

**界面文案（原来硬编码在 HTML / JS 里）**

| 位置 | 原文案 | 现在 |
| --- | --- | --- |
| 关于页小标题 | `Profile` | `data-ui="about.kicker"`（简介 / Profile / プロフィール） |
| 关于页 | 先看这些 / 说明 | `about.entriesTitle`、`about.entriesLead` |
| 关于页 | 介绍 / 时间线 / 说明 | `about.bodyTitle`、`about.timelineTitle`、`about.timelineLead` |
| 联系页小标题 | `Back page` | `data-ui="contact.kicker"`（联系 / Back page / 巻末） |
| 联系页 | 直接联系 / 说明 | `contact.directTitle`、`contact.directLead` |
| 联系页 | 也可以先看这些 / 说明 | `contact.nextTitle`、`contact.nextLead` |
| 联系页字段标签 | Email / Location / Social / Collaboration | `contact.emailLabel` 等四项 |
| 首页隐藏标题 | 关于 | `common.aboutRegion` |
| 文章页缺失文章 | 标题 / 说明 / 按钮 | `article.missingTitle / missingBody / missingBack` |
| 文章页手机目录 | `本文目录（6）` | `ui.article.tocCount` 模板（On this page (6)） |
| 数据失败态 | 提示 / 重试 | `proto.loadError`、`proto.retry` |
| 浏览器标题后缀 | `· 原型` | `proto.titleSuffix`（prototype / プロトタイプ） |
| 鱼的文字计数 | 中文写死 | `fish.count` 模板（1 long-form · 3 notes / 長文 1 本 ・ ノート 3 件） |
| 鱼的长文空态 | 中文兜底 | 改为始终按当前语言写入 `fish.emptyText`（原来有长文时不会更新隐藏区块） |
| 区域 aria-label | 位置 / 继续浏览 / 项目介绍 / 鱼的文字栏目 | `data-aria` 接入 `common.position`、`common.continueNav`、`common.worksRegion`、`fish.tabsRegion`（札记区块已有可见标题，用 `aria-labelledby`，无需重复） |
| 首页人像 alt | 阿川的黑白人像 | `data-alt="home.portraitAlt"` |

**实现方式**：新增 27 个三语键（`data-ui` 从 71 增至 92，`data-aria` 从 3 增至 7；其余由 JS 直接读取，如鱼的空间计数、浏览器标题后缀、手机目录摘要）。HTML 只加 `data-ui` / `data-aria` / `data-alt`，由现有 `applyStaticText()` 统一填充；错误态改为先加载界面文案再加载内容数据，因此导航、错误提示与重试按钮在失败时也按当前语言显示。没有改布局、正文、作者身份或公开内容归属。

### 10.4 验证（实际浏览器 + 静态检查分开记）

**实际浏览器**（本地 HTTP，`python server.py --port 8137`）：

- 关于页 / 联系页：zh、en、ja 六种状态的小节标题、说明、字段标签全部随语言变化；英文版无中文残留（截图：`about-zh|en|ja-390/1280.png`、`contact-zh|en|ja-390/1280.png`，共 12 张）。
- 语言切换点击走查：`about.html?lang=zh → en → ja → zh`，页面保持在 about.html，`document.title`、标题与小标题同步变化。
- 错误态：`?simulateDataError=1` 在 zh/en/ja 下分别显示对应语言的提示与“重试 / Retry / 再試行”，导航保持当前语言。
- 文章页：英文手机目录摘要为 `On this page (6)`；缺失文章提示为英文。
- 鱼的文字计数：英文 `1 long-form · 3 notes`、日文 `長文 1 本 ・ ノート 3 件`。
- 全页 DOM diff（8 个访客页 × 三语，文本节点 + aria/alt/title）：除语言名“中文 / 日本語”和联系页地点数据 `日本 / 石川県 / JAIST` 外，无“英文页仍是中文”的残留。
- 12 张六态截图逐张目视抽查（about-en-390、about-ja-390、about-zh-1280、contact-en-390、contact-ja-1280 等）：同一区块随语言变化，英文版未见中文界面文案。
- 宽度：8 个页面（含 about/contact 三语）× 320/360/390/768/1280/1440，共 72 次检查，0 失败、无新增横向溢出。

**静态检查**：

- `node --check prototype/assets/proto.js` → 0
- `node tools/verify-prototype.mjs` → PASS（92 个 `data-ui` + 7 个 `data-aria`，三语齐全；33 个生产文件哈希仍与基线一致）
- `git diff --check`（GitHub Desktop 自带 git）→ 0
- `git status --short`：仍只有三份 JSON 修改、`_bmad-output/planning-artifacts/` 与方案文件未跟踪；无暂存、无提交

### 10.5 残留与未做

1. **联系页地点** `日本 / 石川県 / JAIST`：这是三份语言 JSON 里本来就相同的**内容数据**（不是本轮硬编码的界面文案）。按要求没有改写公开内容；如果要按语言区分，需要阿川确认内容层面的写法。
2. **`review.html` 原型检查页**：开发审核工具，正文有意保留中文，不属于访客页面；其导航与标题会随语言变化。
3. **静态 `<title>` 与 meta description**：HTML 里仍是中文兜底，JS 加载后 `document.title` 会按语言替换；meta description 不显示在页面上，原型也未复制生产 SEO 逻辑。
4. **语言名“中文 / 日本語”**：按设计用各自语言显示，便于识别，不算残留。
5. **无 JavaScript / 界面文案加载失败时的静态回退是中文**：HTML 里的默认文本与 `<title>` 用中文写，JS 载入 `proto-ui.json` 后按语言替换；若 `proto-ui.json` 本身加载失败，只能显示中文兜底（导航仍可用）。正式实现需要用生产页面自身的文案机制处理，不沿用这个兜底。
6. **日文关于页的大标题是 `About`**：来自 `site.ja.json` 的 `about.title`（现有内容数据），与导航“私について”不完全一致。这属于内容层面的写法，本轮未改；若要统一，需要阿川确认后再动语言 JSON。
7. 本轮**没有**进入正式页面实施，也没有提交、推送、发布；旧任务整体仍未验收完成。
