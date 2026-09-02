# Agawa-HP 项目概览

## 项目定位

Agawa-HP 是阿川的个人表达网站。它用于介绍阿川本人、展示使用 AI 制作的应用及其他项目，并根据个人兴趣持续发布博客文章。

阿川目前在日本留学，因此网站同时服务中文、英文和日文读者。

## 主要内容

- 个人介绍与经历
- 使用 AI 制作的应用和其他项目
- 根据个人兴趣创作的博客
- 联系方式与外部链接

## 语言政策

网站支持中文、英文和日文。

新增或修改博客时，三个语言版本必须同时完成。不同语言版本应保持核心含义、发布日期、引用来源和链接一致，同时允许根据语言习惯进行自然表达，而不是逐字翻译。

## 发布

网站托管在 GitHub，并通过 GitHub Pages 发布。

正式网站地址是：

https://www.agawa5642.com/

Pages 部署产物只应包含访客访问网站所需的 HTML、`assets/`、`CNAME`、`sitemap.xml` 和 `robots.txt`。项目文档、BMAD 文件、开发工具、日志和视觉检查产物不属于公开网站文件。

## SEO 与语言 URL

- 普通页面继续使用一个 HTML URL，通过三份语言 JSON 切换内容；这些页面使用一个 canonical，不创建虚假的 hreflang。
- 博客文章使用中文、英文、日文三个独立 URL，必须配置 self-canonical 和互惠的 `zh`、`en`、`ja`、`x-default` hreflang。
- canonical、社交分享信息与 JSON-LD 必须直接写入 HTML；`sitemap.xml` 与 `robots.txt` 随 Pages 产物部署。
- 新博客只有在三语页面、索引、图片、SEO、站点地图与本地验证全部通过后才能发布。

## 私密博客约定

网站支持面向非技术访客的轻量前端门禁。它用于避免身边的人偶然看到隐私内容，不是服务端访问控制；文章正文仍存在于公开的静态文件和仓库中。

- 私密博客必须在三份 `assets/data/site.{lang}.json` 的对应 post 中同时设置 `"private": true`，并在三个文章页面的 `<body>` 上设置 `data-private="true"`。
- 私密博客不加入 `sitemap.xml`，并在每个语言版本的 HTML 中设置 `<meta name="robots" content="noindex, nofollow, noarchive">`。
- 私密文章不配置会泄露标题或摘要的公开 Open Graph、Twitter Card、`BlogPosting` JSON-LD 或 hreflang 关系；公开博客原有 SEO 规则不变。
- 访客在博客页连续按三次 `B` 可打开密码框。解锁只对当前标签页有效，关闭标签页后自动失效。

## 文档维护

`docs/` 用于保存稳定的项目背景、产品决策和设计说明。快速变化且可以直接从代码判断的实现细节不在这里重复记录。
