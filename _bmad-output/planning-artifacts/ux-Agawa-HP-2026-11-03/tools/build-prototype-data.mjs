#!/usr/bin/env node
/**
 * 从 Agawa-HP 生产数据只读生成原型数据。
 * 输入（只读）：assets/data/site.{zh,en,ja}.json、blog-*.html
 * 输出：prototype/data/proto-data.json
 *
 * 运行：node _bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/tools/build-prototype-data.mjs
 * 依赖：Node 18+（内置 fs/crypto/path）
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TASK_DIR = path.resolve(HERE, "..");
const SITE_ROOT = path.resolve(TASK_DIR, "..", "..", "..");
const OUT_DIR = path.join(TASK_DIR, "prototype", "data");
const LANGS = ["zh", "en", "ja"];

const read = (rel) => fs.readFileSync(path.join(SITE_ROOT, rel), "utf8");
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");

const site = Object.fromEntries(LANGS.map((lang) => [lang, JSON.parse(read(`assets/data/site.${lang}.json`))]));

/** 文章元数据：slug 与三语文件名的既有对应关系（不改 URL）。 */
const ARTICLES = [
  {
    id: "october-2026",
    date: "2026/11/03",
    topic: "technical",
    author: "agawa",
    files: { zh: "blog-october-2026.html", en: "blog-october-2026-en.html", ja: "blog-october-2026-ja.html" },
  },
  {
    id: "acting-human",
    date: "2026/11/02",
    topic: "other",
    author: "fish",
    files: { zh: "blog-acting-human.html", en: "blog-acting-human-en.html", ja: "blog-acting-human-ja.html" },
    fishLong: true,
  },
  {
    id: "prose-agent-framework",
    date: "2026/08/27",
    topic: "technical",
    author: "agawa",
    files: {
      zh: "blog-prose-agent-framework.html",
      en: "blog-prose-agent-framework-en.html",
      ja: "blog-prose-agent-framework-ja.html",
    },
  },
  {
    id: "forward-deployed-engineer",
    date: "2026/08/25",
    topic: "other",
    author: "agawa",
    files: {
      zh: "blog-forward-deployed-engineer.html",
      en: "blog-forward-deployed-engineer-en.html",
      ja: "blog-forward-deployed-engineer-ja.html",
    },
  },
  {
    id: "sensitive-to-perceptive",
    date: "2026/07/07",
    topic: "other",
    author: "agawa",
    files: {
      zh: "blog-sensitive-to-perceptive.html",
      en: "blog-sensitive-to-perceptive-en.html",
      ja: "blog-sensitive-to-perceptive-ja.html",
    },
  },
];

/** 非正文小节：目录不收录（方案 4.6 允许排除资料说明等部分）。 */
const TOC_EXCLUDE = [
  /^资料说明$/,
  /^数据来源$/,
  /^参考文献$/,
  /^Source Note$/,
  /^Data source$/,
  /^References$/,
  /^資料について$/,
  /^データの出典$/,
];

const decodeEntities = (text) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
const stripTags = (html) => decodeEntities(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const rewriteAssets = (html) => html.replace(/(src|srcset)="assets\//g, '$1="../../../../assets/');

function extractArticle(slug, lang, file) {
  const source = read(file);
  const sourceHash = sha256(source);
  const h1 = stripTags(source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const subtitle = stripTags(source.match(/class="article-subtitle"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
  const meta = stripTags(source.match(/class="meta-line"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
  const kicker = stripTags(source.match(/class="issue-label"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
  const signature = stripTags(source.match(/class="article-signature"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");

  const heroMatch = source.match(/<figure class="article-hero-figure">[\s\S]*?<\/figure>/i);
  const heroFigure = heroMatch ? rewriteAssets(heroMatch[0]) : "";

  const start = source.indexOf('<div class="article-body">');
  const articleEnd = source.lastIndexOf("</article>");
  if (start < 0 || articleEnd < 0) throw new Error(`article-body not found in ${file}`);
  let body = source.slice(start + '<div class="article-body">'.length, articleEnd);
  body = body.replace(/\s*<\/article>\s*$/, "");
  body = body.replace(/\s*<\/div>\s*$/, ""); // 去掉 article-body 自身的闭合
  if (heroFigure) body = body.replace(heroFigure, "");

  const headings = [];
  let index = 0;
  body = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (match, attrs, inner) => {
    index += 1;
    const text = stripTags(inner);
    const excluded = TOC_EXCLUDE.some((rule) => rule.test(text));
    const id = `sec-${index}`;
    headings.push({ id, text, excluded });
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/, "");
    return `<h2${cleanAttrs} id="${id}">${inner}</h2>`;
  });

  const tocHeadings = headings.filter((heading) => !heading.excluded);

  return {
    title: h1,
    subtitle,
    meta,
    kicker,
    signature,
    heroFigure,
    headings,
    tocHeadings,
    hasToc: tocHeadings.length >= 5,
    body,
    sourceFile: file,
    sourceSha256: sourceHash,
  };
}

const posts = ARTICLES.map((article) => {
  const titles = {};
  const excerpts = {};
  const categories = {};
  const urls = {};
  for (const lang of LANGS) {
    const jsonPost = site[lang].blog.posts.find((post) => post.url === article.files[lang]);
    if (!jsonPost) throw new Error(`post missing in site.${lang}.json: ${article.files[lang]}`);
    titles[lang] = jsonPost.title;
    excerpts[lang] = jsonPost.excerpt;
    categories[lang] = jsonPost.category;
    urls[lang] = article.files[lang];
  }
  return {
    id: article.id,
    date: article.date,
    topic: article.topic,
    author: article.author,
    private: false, // 基线三语 JSON 中当前没有 private:true 的文章
    fishLong: Boolean(article.fishLong),
    titles,
    excerpts,
    categories,
    urls,
  };
});

const articles = {};
for (const article of ARTICLES) {
  articles[article.id] = {};
  for (const lang of LANGS) {
    articles[article.id][lang] = extractArticle(article.id, lang, article.files[lang]);
  }
}

const works = site.zh.works.map((work) => {
  const overrides = {
    "heart-haven": { action: "app", actionUrls: { zh: "打开应用", en: "Open the app", ja: "アプリを開く" } },
    "jaist-shuttle-next": { action: "app", actionUrls: { zh: "打开应用", en: "Open the app", ja: "アプリを開く" } },
    "sakura-festival-website": { action: "site", actionUrls: { zh: "访问网站", en: "Visit the site", ja: "サイトを見る" } },
  }[work.id];
  if (!overrides) throw new Error(`unknown work id: ${work.id}`);
  const languages = {};
  for (const lang of LANGS) {
    const item = site[lang].works.find((entry) => entry.id === work.id);
    languages[lang] = {
      title: item.title,
      year: item.year,
      medium: item.medium,
      summary: item.summary,
      image: item.image,
      caption: item.caption,
      body: item.body,
      quote: item.quote || "",
      credits: item.credits || "",
      linkLabel: item.links?.[0]?.label || "",
    };
  }
  return {
    id: work.id,
    url: site.zh.works.find((entry) => entry.id === work.id).links[0].url,
    action: overrides.action,
    actionLabel: overrides.actionUrls,
    languages,
  };
});

const notes = {};
for (const lang of LANGS) {
  notes[lang] = {
    title: site[lang].notes.title,
    lead: site[lang].notes.lead,
    signature: site[lang].notes.signature,
    emptyText: site[lang].notes.emptyText,
    entries: site[lang].notes.entries.map((entry) => ({
      date: entry.date,
      bv: entry.bv,
      source: entry.source,
      note: entry.note,
      url: `https://www.bilibili.com/video/${entry.bv}/`,
    })),
  };
}

const blog = {};
for (const lang of LANGS) {
  const data = site[lang];
  blog[lang] = {
    lead: data.blog.lead,
    emptyTitle: data.blog.emptyTitle,
    emptyText: data.blog.emptyText,
  };
}

const fish = {};
for (const lang of LANGS) {
  const data = site[lang];
  fish[lang] = {
    lead: data.fishBlog.lead,
    title: data.fishBlog.title,
    signature: data.fishBlog.signature,
    emptyText: data.fishBlog.emptyText,
  };
}

const home = {};
const about = {};
const contact = {};
for (const lang of LANGS) {
  const data = site[lang];
  home[lang] = {
    intro: data.home.intro,
    subtitle: data.home.subtitle,
    featuredWorksTitle: data.home.featuredWorksTitle,
  };
  about[lang] = {
    title: data.about.title,
    lead: data.about.lead,
    body: data.about.body.split(/\n+/).map((line) => line.trim()).filter(Boolean),
    quote: data.about.quote,
    timeline: data.about.timeline,
    notes: data.about.notes,
  };
  contact[lang] = {
    title: data.contact.title,
    intro: data.contact.intro,
    email: data.contact.email,
    socials: data.contact.socials,
    location: data.contact.location,
    collaboration: data.contact.collaboration,
  };
}

const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    note: "原型数据：从 2026-11-03 工作区三语 JSON 与既有文章 HTML 只读派生，不修改生产文件。",
    sources: Object.fromEntries(
      LANGS.map((lang) => [`assets/data/site.${lang}.json`, sha256(read(`assets/data/site.${lang}.json`))])
    ),
    articleSources: ARTICLES.flatMap((article) =>
      LANGS.map((lang) => ({ slug: article.id, lang, file: article.files[lang], sha256: articles[article.id][lang].sourceSha256 }))
    ),
  },
  home,
  about,
  contact,
  notes,
  blog,
  fish,
  works,
  posts,
  articles,
  fishPosts: posts.filter((post) => post.fishLong).map((post) => post.id),
  // 唯一一份私密边界样例：虚构内容，仅用于演示“未解锁不得展示标题/摘要”。
  samplePrivate: {
    id: "sample-private",
    isSample: true,
    titles: {
      zh: "（样例）未解锁的私密文章标题",
      en: "(sample) Locked private article title",
      ja: "（サンプル）未解除の非公開記事タイトル",
    },
    excerpts: {
      zh: "（样例）这段摘要用于演示：未解锁时不得出现在首页、筛选列表、作者空间或继续阅读中。",
      en: "(sample) This summary shows that a locked post must not appear on the home page, filters, author space, or related lists.",
      ja: "（サンプル）ロック中は、ホーム・絞り込み・作者ページ・関連記事に表示してはいけないことを示す要約です。",
    },
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, "proto-data.json");
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
const size = fs.statSync(outFile).size;
console.log(JSON.stringify({ outFile, bytes: size, posts: posts.length, works: works.length }, null, 2));
console.log(
  posts.map((post) => `${post.id}: toc=${articles[post.id].zh.tocHeadings.length} totalH2=${articles[post.id].zh.headings.length}`).join("\n")
);
