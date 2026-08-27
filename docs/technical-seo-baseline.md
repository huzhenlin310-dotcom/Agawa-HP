# Agawa-HP 技术 SEO 基线

## 实施范围

本基线于 2026-08-27 随 PROSE Agent 开发框架三语博客一并实施，覆盖 5 个普通页面、3 组三语博客文章、默认分享图、站点地图、robots 与 GitHub Pages 部署清单。

## URL 与语言架构

- 生产域名：`https://www.agawa5642.com/`。
- 首页 canonical 使用 `/`；其他公开页面使用现有 `.html` URL，不改变任何公开地址。
- 普通页面采用“单 HTML + 三份语言 JSON”结构，因此只设置 self-canonical，不声明并不存在的语言 URL 或 hreflang。
- 每篇博客有中文无后缀、英文 `-en.html`、日文 `-ja.html` 三个地址。每个版本都设置 self-canonical，并互列 `zh`、`en`、`ja` 与指向中文的 `x-default`。

## 页面信号

- 所有公开 HTML 都直接包含 canonical、description、Open Graph、Twitter Card 与 JSON-LD，不依赖 JavaScript 注入。
- 普通页面使用与页面用途相符的 `WebSite`、`ProfilePage`、`CollectionPage` 或 `ContactPage` 数据。
- 博客使用 localized `BlogPosting`，标题、描述、图片、语言、发布日期、修改日期、作者与 canonical 和可见文章一致。
- 默认社交图为 `assets/images/og-default.jpg`；文章使用自己的头图。

## 抓取与部署

- 根目录 `sitemap.xml` 使用完整生产 URL，列出全部 14 个公开 HTML canonical；只为有可信发布日期的博客写入 `lastmod`。
- `robots.txt` 允许抓取公开页面并指向生产 sitemap。
- `.github/workflows/static.yml` 明确把 sitemap 与 robots 复制到 Pages 的 `_site` 产物，开发文档与 BMAD 文件仍不部署。

## 验证证据

2026-08-27 发布前检查结果：

- `blog-prose-agent-framework`、`blog-forward-deployed-engineer`、`blog-sensitive-to-perceptive` 三个 stem 的 `validate_blog.ps1` 全部通过。
- `node --check assets/js/main.js` 与 `git diff --check` 通过；三份语言 JSON、全部 JSON-LD 与 `sitemap.xml` 可解析。
- 14 个公开 HTML 拥有 14 个唯一 canonical，全部出现在 sitemap；默认分享图尺寸为 1200×630。
- 本地 HTTP 共检查 23 个 HTML、图片、CSS、JavaScript、语言 JSON、sitemap 与 robots 资源，全部返回 200。
- 桌面 1280×900 与移动 390×844 视口检查通过；移动端文档宽度等于页面宽度，无页面级横向溢出，头图成功加载，浏览器控制台无 warning/error。
- 中文、英文、日文按钮实际跳转到三个独立文章 URL，页面 `lang`、`data-article-lang` 与当前按钮状态一致。共享脚本引用加入 `v=seo-20260827`，避免旧缓存破坏文章语言跳转。

## 预期效果与限制

该基线帮助搜索引擎识别首选 URL、三语博客关系、文章实体与抓取入口，也改善链接分享预览的一致性。canonical 与结构化数据是提示，不保证排名、收录速度或富结果展示。普通页面若未来需要语言级搜索入口，必须先建立真实、可独立访问的语言 URL，再配置互惠 hreflang。
