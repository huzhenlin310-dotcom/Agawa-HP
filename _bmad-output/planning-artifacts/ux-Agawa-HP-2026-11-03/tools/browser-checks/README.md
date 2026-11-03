# 浏览器检查脚本（可复现）

这三个文件是 **DSH 浏览器（ego-browser）** 的运行脚本，不是 Node 脚本：它们使用页面里的 `page`、`page.keyboard`、`cdp()`、`page.drainEvents()`，需要由 DSH 的浏览器工具执行。

运行前提：

1. 仓库根目录启动本地服务器：`python server.py --port 8137`
2. 浏览器能打开 `http://127.0.0.1:8137/_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/prototype/review.html`

运行方式（任选其一）：

- 在 DSH 会话里把某个脚本文件的内容作为 `bcdp_script` 的 `script` 参数提交；
- 或者按文件里的步骤手工执行同样的 `page.goto` / `page.evaluate` 检查。

| 文件 | 内容 | 2026-11-03 结果 |
| --- | --- | --- |
| `width-matrix.js` | 8 个中文页面 + 12 组英/日页面状态 × 六个宽度（320/360/390/768/1280/1440），读取 `review-viewports.html` 的溢出与首屏判定 | 120 次检查，0 失败 |
| `functional.js` | 首页结构、博客筛选/URL/空状态、文章目录与继续阅读、鱼的长文/札记、项目索引、关于/联系、数据失败态 | 14/14 通过 |
| `keyboard-console.js` | 手机菜单展开/Escape/焦点回按钮/隐藏项、语言入口、真实 Enter 键筛选与目录、7 个页面的控制台与网络 | 9/9 通过；控制台 0 错误 |
| `i18n.js` | 8 个访客页 × 三语的 DOM 文本/属性 diff，定位“英文页仍是中文”的硬编码；并断言关于/联系、错误态、文章目录摘要、鱼计数随语言变化 | 除语言名与联系页地点数据外无残留；11 项断言通过 |

机器可读的汇总结果在 `../../checks/2026-11-03-browser-results.json`。

注意：

- 这些脚本使用顶层 `await` 与浏览器页面 API，**不要**用 `node --check` 或 `node` 直接运行；`node --check` 只用于 `prototype/assets/proto.js`。


- `functional.js` 里的“博客：首屏可见第一篇文章”依赖浏览器窗口高度 ≥ 800；在更矮的窗口里这个断言会失败，需要按实际视口调整或只做记录。
- `width-matrix.js` 的 1280/1440 卡片在小于 1280px 的浏览器窗口里会按比例缩小显示（卡片头部标注“缩放 xx%”），因为检查用的是固定宽度 iframe，布局本身仍按 1280/1440 渲染。
- 这些脚本不写入任何文件，也不修改原型或生产代码。
