# 阶段 A · 内容与页面核对清单

日期：2026-11-03
依据：`docs/ux-optimization-execution-plan.zh.md` §2、§6（阶段 A）
方法：只读检查仓库内 HTML 与 `assets/data/site.{zh,en,ja}.json`；未运行任何写入生产文件的命令。**本轮没有做真实访客研究，也没有可用的浏览器历史数据**，以下全部是源码事实。

## 1. 页面清单（实际存在的公开页面）

| # | 页面 | 文件 | 语言方式 | 数据来源 | 当前内容量 |
| --- | --- | --- | --- | --- | --- |
| 1 | 首页 | `index.html` | 单 URL + 三语 JSON | `home`、`works[0..2]`、`nav` | 1 个展示区 + 6 项目录 + 3 张精选作品卡 |
| 2 | 关于我 | `about.html` | 单 URL + 三语 JSON | `about` | 5 段正文 + 引语 + 4 条时间线 + 4 条边注 |
| 3 | 项目 | `works.html` | 单 URL + 三语 JSON | `works` | 3 个项目，逐个完整展开 |
| 4 | 博客 | `blog.html` | 单 URL + 三语 JSON | `blog` | 5 条公开文章 + 5 条“写作方向”（不可点击） |
| 5 | 鱼的 blog | `fish-blog.html` | 单 URL + 三语 JSON | `fishBlog` | 1 篇长文（与博客总列表重复收录） |
| 6 | 鱼的札记 | `notes.html` | 单 URL + 三语 JSON | `notes` | 3 条札记（日期 + 来源 + 笔记） |
| 7 | 联系 | `contact.html` | 单 URL + 三语 JSON | `contact` | 邮箱 / 所在地 / 1 个社交链接 / 4 个合作方向 |
| 8–22 | 5 篇文章 × 3 语言 | `blog-*.html`（15 个文件） | 独立 URL + `data-article-lang` | 文章正文硬编码在 HTML | 见下节 |

文章语言文件对应关系（既有 URL，本轮不改）：

| 文章 slug（原型内 ID） | 中文 | English | 日本語 |
| --- | --- | --- | --- |
| `october-2026` | `blog-october-2026.html` | `blog-october-2026-en.html` | `blog-october-2026-ja.html` |
| `acting-human` | `blog-acting-human.html` | `blog-acting-human-en.html` | `blog-acting-human-ja.html` |
| `prose-agent-framework` | `blog-prose-agent-framework.html` | `blog-prose-agent-framework-en.html` | `blog-prose-agent-framework-ja.html` |
| `forward-deployed-engineer` | `blog-forward-deployed-engineer.html` | `blog-forward-deployed-engineer-en.html` | `blog-forward-deployed-engineer-ja.html` |
| `sensitive-to-perceptive` | `blog-sensitive-to-perceptive.html` | `blog-sensitive-to-perceptive-en.html` | `blog-sensitive-to-perceptive-ja.html` |

另有辅助文件：`server.py` 仅用于本地预览（不发布）；`sitemap.xml` 与 `robots.txt` 随 Pages 发布，但本阶段未改动。

## 2. 三语 JSON 的字段盘点

三份 `assets/data/site.{lang}.json` 结构一致，当前包含：

| 段 | 关键字段 | 缺失/需要注意 |
| --- | --- | --- |
| `nav` | home / about / works / blog / contact / notes | 三语都写成英文大写（HOME / WORKS…），`notes` 有键但导航里没有对应入口 |
| `home` | title、subtitle、intro、featuredWorksTitle | 没有“查看项目/阅读博客”这类入口文案 |
| `about` | title、lead、body、quote、timeline、notes | 没有项目/博客/联系入口字段 |
| `works[3]` | id、title、year、medium、summary、image、caption、body、quote、links、credits（仅樱花祭） | 无作者/贡献/状态字段；三个 `links[0].label` 都是“查看项目/View project/プロジェクトを見る”；`id` 稳定，可直接做锚点 |
| `blog` | title、lead、indexTitle、emptyTitle、emptyText、topics[5]、posts[5] | **posts 无 id、无 author、无稳定主题键、无 private 字段**；`category` 是自由文本；`topics` 是写作方向，不对应任何 post |
| `fishBlog` | title、lead、signature、emptyText、posts[1] | 收录的正是 `blog.posts` 里的同一篇《把「人」演得很像》 |
| `notes` | title、lead、signature、emptyText、entries[3] | 条目含 `date`、`bv`、`source`、`note`；无独立详情页 |
| `contact` | title、intro、email、socials[1]、location、collaboration[4] | 无项目/博客入口字段 |
| `footer` | text、copyright | 无页脚导航链接 |

与可见性规则相关的既有实现（未改动）：

- `assets/js/main.js:193-217` 私密博客解锁状态与密码哈希；
- `assets/js/main.js:519-521` 列表按 `post.private && !unlocked` 过滤；
- `assets/data/site.*.json` 中**当前没有任何 `"private": true` 的文章**（grep 结果为空）；
- `assets/js/main.js:308-344` 连续三次 `B` 打开密码框，与 `docs/project-overview.md:43-46` 一致。

## 3. 与方案 §2 的逐条对照（源码核对结果）

| 方案中的现状描述 | 源码核对 | 结论 |
| --- | --- | --- |
| 首页展示区最小高度接近一屏 | `assets/css/styles.css` 中 `.lab-hero` 使用 `min-height: calc(100dvh - 120px)`（980px 断点段同样如此） | 属实 |
| 主导航字号 11px | `styles.css:158-169` `.primary-nav { font-size: 11px; }` | 属实 |
| 手机端导航非固定定位 | `styles.css:1728-1731` `@media (max-width:700px){ .site-header{ position: static; } }` | 属实，滚动后项目/博客入口不可达 |
| 博客先显示不可点击的“写作方向” | `blog.html:53-58` 的 `topics` 列表无链接；`main.js:501-512` 只渲染成 `<li>` | 属实 |
| 鱼的博客入口只有一行链接，札记入口只在首页目录 | `blog.html:64` 为单行 `<a>鱼的blog →</a>`；`index.html` 目录由 `main.js:386-400` 生成，含 notes | 属实 |
| 同一篇文章被总列表和鱼的博客重复收录 | `site.zh.json:112-118` 与 `site.zh.json:143-149` 指向同一 `blog-acting-human.html` | 属实（三语一致） |
| 项目以完整介绍依次展开，无页首索引 | `works.html:52` 之后直接是 `data-works-list`；`main.js:449-494` 逐条渲染 | 属实 |
| 当前三语数据含 3 个项目、5 篇总索引文章、1 篇鱼的长文、3 条札记 | 与 JSON 计数一致 | 属实 |

方案 §2 里“数量不能相加”的提醒成立：5 篇总列表文章中已有 1 篇同时属于鱼的长文，独立文章数是 5，不是 6。

## 4. 阶段 A 发现的、方案未写明的事实

1. **没有作者字段。** 三语 JSON 的 `blog.posts`、`fishBlog.posts` 都没有 `author`；文章页也没有作者区块，只有正文末尾的自称署名（仅 `acting-human` 有“你的鱼 / your fish / あなたの魚”）。
2. **没有稳定文章 ID。** 只能依赖 `url`（或文件名）作为跨语言唯一键；三语 `url` 后缀规律固定（`-en` / `-ja`）。
3. **主题无法从现有字段机械得出。** `category` 是自由文本（如“AI / 职业发展”“心理 学 / 人际观察”），`topics[5]` 与文章没有关联字段。
4. **没有文章 ↔ 项目关联。** 项目与文章之间没有外键，正文中也未出现项目名与技术文章的对应叙述，因此无法核实“相关技术文章”。
5. **私密文章当前为 0 篇。** 可见性代码存在，但没有可演示的真实私密条目。
6. **`fish-blog.html` 的 canonical/hreflang 只声明了 zh 一条**（`fish-blog.html:8-10`），与本页实际支持三语切换的现状不完全一致；本轮不改 SEO，已记入遗留项。
7. **`october-2026` 文章额外引用 `assets/css/blog-october-2026.css`**（仅该文三语版本），改版时需一并处理。

以上第 1–5 项直接决定了映射表里哪些内容可以写、哪些必须标“待确认”；见 `02-content-mapping.zh.md`。
