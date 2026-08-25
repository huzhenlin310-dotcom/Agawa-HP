<!-- bmad:context -->
<!-- Verified 2026-08-25 against b630d93426fc3ceeacb5295cbae7c84013c0703e. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Agawa-HP

Agawa-HP 是阿川的个人表达、作品展示与博客网站，介绍个人经历以及使用 AI 制作的应用和其他项目。网站采用静态 HTML、CSS、JavaScript 和 JSON，并通过 GitHub Pages 发布到 https://www.agawa5642.com/。网站面向中文、英文和日文读者；长期项目背景与决策记录在 `docs/`。

## Policy

- 所有新增或修改的公开博客内容必须同时提供中文、英文和日文版本，并保持含义、日期、引用和链接一致。

## Where things are

- 公共页面入口和博客文章位于根目录的 `*.html`。
- 普通页面的三语内容位于 `assets/data/site.zh.json`、`site.en.json` 和 `site.ja.json`。
- 共享交互与语言切换逻辑位于 `assets/js/main.js`，共享视觉样式位于 `assets/css/styles.css`。
- 项目定位、语言政策和发布边界记录在 `docs/project-overview.md`。

## Running and verifying

- 必须通过本地 HTTP 服务器预览网站；不要直接使用 `file://` 打开 HTML，否则语言 JSON 无法正常加载。
- 修改内容、导航或布局后，检查中文、英文和日文页面，并验证语言切换、文章链接与响应式布局。

## Conventions that differ from defaults

- 修改普通页面文案和列表时更新三份 `assets/data/site.{lang}.json`，不要为普通页面复制三套 HTML。
- 博客文章采用独立语言文件：中文使用无语言后缀的文件，英文使用 `-en.html`，日文使用 `-ja.html`；同时更新三份语言 JSON 中的博客索引。
- 文章页面必须设置正确的 `data-article-lang` 和 `data-lang-target`，并保留该语言版本自己的 `<title>` 与描述信息。

<!-- /bmad:context -->
