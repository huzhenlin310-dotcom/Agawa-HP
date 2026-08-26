---
title: '全站技术 SEO 基础与可持续博客发布'
type: 'feature'
created: '2026-08-26'
status: 'draft'
review_loop_iteration: 0
context:
  - '{project-root}/docs/project-overview.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 11 个公开页面缺少 canonical、社交元数据、结构化数据和抓取入口；三语博客未声明语言关系，未来发布也可能遗漏。

**Approach:** 建立静态 SEO 基线与博客 hreflang，用 sitemap、部署规则和 Blog Skill 形成持续门禁，并在 `docs/` 记录结果。

## Boundaries & Constraints

**Always:** 使用生产域名与现有 URL；首页 canonical 为 `/`；SEO 直接存在 HTML；博客三语页 self-canonical 且互列 zh/en/ja/x-default；JSON-LD 与可见内容一致。

**Ask First:** 新增普通页独立语言 URL、提交 Search Console、改变公开 URL、作者身份或正式品牌名称。

**Never:** 不伪造普通页 hreflang，不用 JS 注入关键 SEO，不伪造 lastmod，不部署开发文件，不承诺排名。

## I/O & Edge-Case Matrix

| 场景 | 状态 | 预期行为 | 错误处理 |
|---|---|---|---|
| 普通页 | 单 URL 三语 | 默认中文静态 SEO，无 hreflang | 报告说明限制 |
| 三语博客 | 三个 URL | 互惠 hreflang、localized BlogPosting | 不一致即失败 |
| 抓取入口 | 11 个 HTML | sitemap 覆盖 canonical；robots 指向它 | 缺页/非法 XML 即失败 |
| 新博客 | Skill 发布 | 三页 SEO 与 sitemap 通过才发布 | 失败则停止 |

</frozen-after-approval>

## Code Map

- `index.html:3-10`、`about.html:3-10`、`works.html:3-10`、`blog.html:3-10`、`contact.html:3-10` -- 普通页 head；不新增语言 URL。
- `blog-forward-deployed-engineer*.html:3-10`、`blog-sensitive-to-perceptive*.html:3-10` -- 三语文章 SEO/hreflang。
- `assets/js/main.js:139-162,398-466` -- 只读语言架构证据。
- `.github/workflows/static.yml:36-40` -- 显式发布 sitemap/robots，不扩大根文件范围。
- `.agents/skills/agawa-blog-publisher/` -- 纳入未提交契约并强化 SEO 门禁。
- `docs/project-overview.md:22-30`、新报告 -- 更新边界并记录证据。

## Tasks & Acceptance

**Execution:**
- [ ] `assets/images/og-default.jpg` -- 生成 1200×630 默认分享图。
- [ ] 根目录 `*.html` -- 11 页写 canonical、description、OG/Twitter、JSON-LD；博客补 hreflang。
- [ ] `sitemap.xml`、`robots.txt`、`.github/workflows/static.yml` -- 建立并发布抓取入口。
- [ ] `.agents/skills/agawa-blog-publisher/` -- 完成发布契约与全站/文章/XML/部署门禁。
- [ ] `docs/project-overview.md`、`docs/technical-seo-baseline.md` -- 更新发布边界并记录决策、验证、效果与限制。
- [ ] 本地 HTTP -- 检查公开资源 200、源码 SEO、三语切换和控制台。

**Acceptance Criteria:**
- Given 11 页，when 静态解析，then canonical 唯一，title/description 非空且 OG URL 一致。
- Given 博客语言组，when 校验，then 四组 hreflang 互惠且 BlogPosting 与页面一致。
- Given 部署产物，when 解析请求，then 11 个 canonical 无重复且 200，开发文件不在 `_site`。
- Given 现有博客 stem，when 运行门禁，then SEO、三语、抓取入口、JS 与 diff 全通过。

## Spec Change Log

## Design Notes

普通页保持“单 HTML + 三份 JSON”，只提供一个 canonical；博客使用完整 hreflang。作者为 `Agawa`、alternateName 为 `阿川`，站点名为 `Agawa / 阿川`。

## Verification

**Commands:**
- 两个现有 blog stem 分别运行 `validate_blog.ps1` -- SEO 门禁通过。
- `node --check assets/js/main.js`、`git diff --check` -- 语法与补丁通过。
- 本地服务器和临时 `_site` 检查 -- 公开 URL 均 200，清单正确。

**Manual checks (if no CLI):**
- 桌面/移动端无回归；查看源代码确认 SEO 静态存在；外部测试未执行则写入报告。
