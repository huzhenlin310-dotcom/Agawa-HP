#!/usr/bin/env node
/**
 * 把已审核原型落地为正式站页面：统一头部/页脚、重写 7 个普通页面的主体、
 * 给 15 个文章页加面包屑/静态目录/继续阅读，并更新资源缓存版本。
 *
 * 不修改文章正文：只给正文 h2 加 id、移除旧的单行返回链接。
 * 运行：node _bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/tools/build-production.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..", "..", "..", "..");
const LANGS = ["zh", "en", "ja"];
const VERSION = "ux-20261103";
const read = (rel) => fs.readFileSync(path.join(SITE, rel), "utf8");
const PRE = path.join(HERE, "..", "baseline", "production-pre-ux");
const readSource = (rel) => fs.readFileSync(path.join(PRE, rel), "utf8");
const write = (rel, text) => fs.writeFileSync(path.join(SITE, rel), text, "utf8");

const site = Object.fromEntries(LANGS.map((lang) => [lang, JSON.parse(read(`assets/data/site.${lang}.json`))]));
const ui = (lang) => site[lang].ui;

const TOC_EXCLUDE = [/^资料说明$/, /^数据来源$/, /^参考文献$/, /^Source Note$/, /^Data source$/, /^References$/, /^資料について$/, /^データの出典$/];
const strip = (html) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function header(articleTargets = null) {
  const langButtons = LANGS.map((lang, index) => {
    const label = { zh: "中文", en: "English", ja: "日本語" }[lang];
    const target = articleTargets ? ` data-lang-target="${articleTargets[lang]}"` : "";
    return `<button type="button" data-lang="${lang}" aria-pressed="${lang === "zh" ? "true" : "false"}"${target}>${label}</button>`;
  }).join("\n          ");

  return `    <a class="skip-link" href="#content" data-ui="a11y.skip">跳到正文</a>
    <div class="reading-progress" aria-hidden="true"><span></span></div>
    <header class="masthead">
      <div class="masthead__inner">
        <a class="masthead__brand" href="index.html" aria-label="Home">+1<span>Lab</span></a>

        <nav class="nav-main" aria-label="主要导航" data-aria="a11y.primaryNav">
          <a href="index.html" data-nav="home">首页</a>
          <a href="works.html" data-nav="works">项目</a>
          <a href="blog.html" data-nav="blog">博客</a>
          <a href="about.html" data-nav="about">关于我</a>
          <a href="contact.html" data-nav="contact">联系</a>
        </nav>

        <div class="lang-menu">
          <button class="lang-menu__button" id="lang-button" type="button" aria-expanded="false" aria-controls="lang-panel">
            <span data-lang-current>中文</span>
            <span class="lang-menu__caret" aria-hidden="true">▾</span>
          </button>
          <div class="lang-menu__panel" id="lang-panel" hidden>
          ${langButtons}
          </div>
        </div>

        <div class="mobile-nav">
          <a href="works.html" data-nav="works">项目</a>
          <a href="blog.html" data-nav="blog">博客</a>
          <button id="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-panel" aria-label="菜单">
            <span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="menu-toggle__text">菜单</span>
          </button>
        </div>
      </div>

      <div class="menu-panel" id="menu-panel" hidden>
        <div class="menu-panel__inner">
          <p class="menu-panel__title" data-ui="menu.title">网站导航</p>
          <a href="index.html" data-nav="home">首页</a>
          <a href="about.html" data-nav="about">关于我</a>
          <a href="contact.html" data-nav="contact">联系</a>
          <p class="menu-panel__title" data-ui="menu.language">语言</p>
          <div class="menu-lang">
          ${langButtons}
          </div>
        </div>
      </div>
    </header>`;
}

function footer() {
  return `    <footer class="colophon">
      <div class="colophon__inner">
        <div>
          <p class="colophon__title" data-ui="footer.title">主要页面</p>
          <nav class="colophon__nav" aria-label="页脚主要页面" data-aria="a11y.footerNav">
            <a href="index.html" data-nav="home">首页</a>
            <a href="works.html" data-nav="works">项目</a>
            <a href="blog.html" data-nav="blog">博客</a>
            <a href="about.html" data-nav="about">关于我</a>
            <a href="contact.html" data-nav="contact">联系</a>
          </nav>
        </div>
        <div>
          <p class="colophon__copy" data-footer-text></p>
          <p class="colophon__copy" data-footer-copyright></p>
        </div>
      </div>
    </footer>`;
}

const heroPicture = (() => {
  const source = readSource("index.html");
  const match = source.match(/<figure class="lab-portrait">[\s\S]*?<\/figure>/);
  if (match) return match[0].replace('class="lab-portrait"', 'class="hero__figure"').replace('alt="Black and white techwear editorial portrait"', 'alt="" data-alt="home.portraitAlt"');
  return `<figure class="hero__figure"><img src="assets/images/hero-techwear-lab-1024.webp" alt="" width="1024" height="1536"></figure>`;
})();

const mainHome = `    <main id="content" class="shell home-page">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero__copy">
          <p class="kicker">Issue 01 / Notes from Agawa</p>
          <h1 class="hero__title" id="home-title">lab.</h1>
          <p class="hero__sub" data-home-subtitle></p>
          <p class="hero__lead" data-home-intro></p>
          <div class="hero__cta">
            <a class="btn btn--solid" href="works.html"><span data-ui="home.ctaWorks">查看项目</span><span aria-hidden="true">→</span></a>
            <a class="btn" href="blog.html"><span data-ui="home.ctaBlog">阅读博客</span><span aria-hidden="true">→</span></a>
          </div>
        </div>
        ${heroPicture}
      </section>

      <section class="section" aria-labelledby="home-projects-title">
        <div class="section__head">
          <div>
            <p class="kicker">Selected works</p>
            <h2 class="section__title" id="home-projects-title" data-home-featured-title>精选作品</h2>
          </div>
          <a class="section__more" href="works.html" data-ui="home.projectsAll">查看全部项目</a>
        </div>
        <div class="card-grid" data-home-projects></div>
      </section>

      <section class="section" aria-labelledby="home-tech-title">
        <div class="section__head">
          <div>
            <p class="kicker">Technical writing</p>
            <h2 class="section__title" id="home-tech-title" data-ui="home.techTitle">技术文章</h2>
            <p class="section__lead" data-ui="home.techLead"></p>
          </div>
          <a class="section__more" href="blog.html" data-ui="home.techAll">查看全部博客</a>
        </div>
        <div class="post-list" data-home-technical></div>
      </section>

      <section class="section" aria-labelledby="home-more-title">
        <div class="section__head">
          <div>
            <p class="kicker">Recent</p>
            <h2 class="section__title" id="home-more-title" data-ui="home.moreTitle">近期文章</h2>
          </div>
        </div>
        <div class="post-list" data-home-more></div>
      </section>

      <section class="section home-about" aria-labelledby="home-about-title">
        <div>
          <p class="kicker">Profile</p>
          <h2 class="section__title" id="home-about-title" data-ui="home.aboutTitle">关于我</h2>
          <p class="home-about__body" data-about-lead></p>
        </div>
        <div class="home-about__links">
          <a class="btn" href="about.html" data-ui="home.aboutCta">关于我</a>
          <a class="btn" href="contact.html" data-ui="home.contactCta">联系我</a>
        </div>
      </section>
    </main>`;

const mainWorks = `    <main id="content" class="shell works-page">
      <section class="page-head">
        <p class="kicker" data-ui="works.kicker">Portfolio notes</p>
        <h1 class="page-title" data-works-title>项目</h1>
        <p class="page-lead" data-ui="works.lead"></p>
      </section>

      <section class="index-card" aria-labelledby="work-index-title">
        <p class="index-card__title" id="work-index-title" data-ui="works.indexTitle">项目索引</p>
        <p class="index-card__hint" data-ui="works.indexHint"></p>
        <ol data-work-index></ol>
      </section>

      <section data-works-list aria-label="项目介绍"></section>
    </main>`;

const mainBlog = `    <main id="content" class="shell blog-page">
      <section class="page-head">
        <p class="kicker" data-ui="blog.kicker">Web Journal</p>
        <h1 class="page-title" data-blog-title>博客</h1>
        <p class="page-lead" data-blog-lead></p>
      </section>

      <aside class="fish-entry" aria-labelledby="fish-entry-title">
        <p class="kicker" data-ui="blog.fishSub">长文与日常札记</p>
        <h2 class="fish-entry__title" id="fish-entry-title" data-ui="blog.fishTitle">鱼的文字</h2>
        <p class="fish-entry__lead" data-ui="blog.fishLead"></p>
        <div class="fish-entry__actions">
          <a class="btn btn--solid" href="fish-blog.html"><span data-ui="blog.fishCta">进入鱼的文字</span><span aria-hidden="true">→</span></a>
          <span class="fish-entry__count" data-fish-count></span>
        </div>
      </aside>

      <section class="section" aria-labelledby="blog-list-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="blog-list-title" data-ui="blog.listTitle">全部公开文章</h2>
            <p class="section__lead" data-blog-count></p>
          </div>
        </div>
        <div class="filter" data-blog-filter role="group" aria-label="按主题筛选" data-aria="blog.filterTitle"></div>
        <p class="filter__hint" data-ui="blog.filterHint"></p>
        <div class="post-list" data-blog-list></div>
        <div class="empty-state" data-blog-empty hidden>
          <h3 data-ui="blog.emptyTitle">没有符合条件的文章</h3>
          <p data-ui="blog.emptyBody"></p>
          <a class="btn" href="blog.html" data-clear-topic><span data-ui="blog.emptyCta">查看全部文章</span></a>
        </div>
      </section>
    </main>`;

function crumbs(lang, currentKey, articleMode = false) {
  const f = ui(lang).fish;
  if (articleMode) {
    return `      <nav class="crumbs" aria-label="${ui(lang).a11y.primaryNav}">
        <ol>
          <li><a href="blog.html">${ui(lang).nav.blog}</a></li>
          <li><span aria-current="page">${site[lang].ui.article.crumb}</span></li>
        </ol>
      </nav>`;
  }
  const current = currentKey === "long" ? f.crumbLong : f.crumbNotes;
  return `      <nav class="crumbs" aria-label="${site[lang].nav.blog}">
        <ol>
          <li><a href="blog.html">${f.crumbBlog}</a></li>
          <li><a href="fish-blog.html">${f.crumbSpace}</a></li>
          <li><span aria-current="page" data-crumb-current>${current}</span></li>
        </ol>
      </nav>`;
}

function fishMain(lang, kind) {
  const f = ui(lang).fish;
  const isLong = kind === "long";
  return `    <main id="content" class="shell fish-page">
${crumbs(lang, kind)}
      <section class="space-head">
        <p class="kicker" data-ui="fish.spaceSub">${f.spaceSub}</p>
        <h1 class="space-head__title" data-ui="fish.spaceTitle">${f.spaceTitle}</h1>
        <p class="space-head__lead" data-fish-lead></p>
      </section>

      <nav class="tabs" aria-label="${f.spaceTitle}">
        <a id="tab-long" href="fish-blog.html">
          <span class="tabs__label" data-ui="fish.tabLong">${f.tabLong}</span>
          <span class="tabs__sub" data-ui="fish.tabLongSub">${f.tabLongSub}</span>
        </a>
        <a id="tab-notes" href="notes.html">
          <span class="tabs__label" data-ui="fish.tabNotes">${f.tabNotes}</span>
          <span class="tabs__sub" data-ui="fish.tabNotesSub">${f.tabNotesSub}</span>
        </a>
      </nav>

      <section class="section" aria-labelledby="fish-section-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="fish-section-title" data-ui="${isLong ? "fish.longSection" : "fish.notesSection"}">${isLong ? f.longSection : f.notesSection}</h2>
            <p class="section__lead" data-ui="${isLong ? "fish.longHint" : "fish.notesHint"}">${isLong ? f.longHint : f.notesHint}</p>
          </div>
          <a class="section__more" href="blog.html" data-ui="fish.backBlog">${f.backBlog}</a>
        </div>
        ${
          isLong
            ? '<div class="post-list" data-fish-list></div>\n        <div class="empty-state" data-fish-empty hidden><p></p></div>'
            : '<div class="note-list" data-notes-list></div>\n        <p class="note-signature" data-notes-signature></p>\n        <div class="empty-state" data-notes-empty hidden><p></p></div>'
        }
      </section>

      <section class="space-next">
        <a class="btn" href="${isLong ? "notes.html" : "fish-blog.html"}"><span data-ui="${isLong ? "fish.nextNotes" : "fish.nextLong"}">${isLong ? f.nextNotes : f.nextLong}</span><span aria-hidden="true">→</span></a>
        <a class="link-more" href="blog.html" data-ui="fish.backBlog">${f.backBlog}</a>
      </section>
    </main>`;
}

const mainAbout = `    <main id="content" class="shell about-page">
      <section class="page-head">
        <p class="kicker" data-ui="about.kicker">简介</p>
        <h1 class="page-title" data-about-title>关于我</h1>
        <p class="page-lead" data-about-lead></p>
      </section>

      <section class="section" aria-labelledby="about-entries-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="about-entries-title" data-ui="about.entriesTitle">先看这些</h2>
            <p class="section__lead" data-ui="about.entriesLead"></p>
          </div>
        </div>
        <div class="hero__cta" data-about-entries></div>
      </section>

      <section class="section" aria-labelledby="about-body-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="about-body-title" data-ui="about.bodyTitle">介绍</h2>
          </div>
        </div>
        <article class="prose" data-about-body></article>
        <blockquote class="quote-band" data-about-quote></blockquote>
      </section>

      <section class="section" aria-labelledby="about-timeline-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="about-timeline-title" data-ui="about.timelineTitle">时间线</h2>
            <p class="section__lead" data-ui="about.timelineLead"></p>
          </div>
        </div>
        <ol class="timeline" data-about-timeline></ol>
        <ul class="plain-list" data-about-notes></ul>
      </section>
    </main>`;

const mainContact = `    <main id="content" class="shell contact-page">
      <section class="page-head">
        <p class="kicker" data-ui="contact.kicker">尾页</p>
        <h1 class="page-title" data-contact-title>联系我</h1>
        <p class="page-lead" data-contact-intro></p>
      </section>

      <section class="section" aria-labelledby="contact-facts-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="contact-facts-title" data-ui="contact.directTitle">直接联系</h2>
            <p class="section__lead" data-ui="contact.directLead"></p>
          </div>
        </div>
        <div class="contact-facts">
          <div>
            <p class="kicker" data-ui="contact.emailLabel">邮箱</p>
            <a class="btn btn--solid" data-contact-email href="mailto:huzhenlin@jaist.ac.jp">huzhenlin@jaist.ac.jp</a>
          </div>
          <div>
            <p class="kicker" data-ui="contact.locationLabel">所在地</p>
            <p data-contact-location></p>
          </div>
          <div>
            <p class="kicker" data-ui="contact.socialLabel">社交</p>
            <ul class="plain-list" data-contact-socials></ul>
          </div>
          <div>
            <p class="kicker" data-ui="contact.collaborationLabel">合作方向</p>
            <ul class="plain-list" data-contact-collaboration></ul>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="contact-next-title">
        <div class="section__head">
          <div>
            <h2 class="section__title" id="contact-next-title" data-ui="contact.nextTitle">也可以先看这些</h2>
            <p class="section__lead" data-ui="contact.nextLead"></p>
          </div>
        </div>
        <div class="hero__cta" data-contact-entries></div>
      </section>
    </main>`;

const PAGES = [
  ["index.html", mainHome],
  ["works.html", mainWorks],
  ["blog.html", mainBlog],
  ["fish-blog.html", fishMain("zh", "long")],
  ["notes.html", fishMain("zh", "notes")],
  ["about.html", mainAbout],
  ["contact.html", mainContact],
];

function replaceDocument(rel, mainHtml) {
  let html = readSource(rel);
  html = html.replace(/\?v=[^"]+/g, `?v=${VERSION}`);
  html = html.replace(/<body([^>]*)>[\s\S]*<\/body>/i, (match, attrs) => {
    const bodyAttrs = attrs.includes("data-page") ? attrs : `${attrs} data-page="home"`;
    return `<body${bodyAttrs}>
${header()}

${mainHtml}

${footer()}
  </body>`;
  });
  write(rel, html);
}

for (const [rel, main] of PAGES) {
  replaceDocument(rel, main);
}

/* --------------------------------------------------------------------------
   文章页：统一头部/页脚、面包屑、静态目录、继续阅读
   -------------------------------------------------------------------------- */

const articleFiles = fs
  .readdirSync(SITE)
  .filter((file) => /^blog-.*\.html$/.test(file))
  .sort();

function langOfFile(file) {
  if (file.endsWith("-ja.html")) return "ja";
  if (file.endsWith("-en.html")) return "en";
  return "zh";
}
function langFiles(file) {
  const base = file.replace(/-(en|ja)\.html$/, ".html");
  return { zh: base, en: base.replace(/\.html$/, "-en.html"), ja: base.replace(/\.html$/, "-ja.html") };
}

for (const file of articleFiles) {
  const lang = langOfFile(file);
  const targets = langFiles(file);
  const data = site[lang];
  const u = data.ui;
  let html = fs.readFileSync(path.join(PRE, "articles", file), "utf8");

  html = html.replace(/\?v=[^"]+/g, `?v=${VERSION}`);

  const bodyMatch = html.match(/<body([^>]*)>/i);
  if (!bodyMatch) throw new Error(`no body: ${file}`);
  const bodyAttrs = bodyMatch[1];

  const mainIndex = html.indexOf("<main");
  const mainEnd = html.indexOf("</main>");
  if (mainIndex < 0 || mainEnd < 0) throw new Error(`no main: ${file}`);
  let main = html.slice(mainIndex, mainEnd + "</main>".length);

  // 移除旧的单行返回链接，改由面包屑与文末返回承担
  main = main.replace(/\s*<a class="article-back"[\s\S]*?<\/a>/, "");

  // 正文 h2 生成 id，并构建目录
  const bodyStart = main.indexOf('<div class="article-body">');
  const bodyEnd = main.indexOf("</article>", bodyStart);
  if (bodyStart < 0 || bodyEnd < 0) throw new Error(`no article body: ${file}`);
  let body = main.slice(bodyStart, bodyEnd);
  const headings = [];
  let index = 0;
  body = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (match, attrs, inner) => {
    index += 1;
    const text = strip(inner);
    if (TOC_EXCLUDE.some((rule) => rule.test(text))) return match;
    const id = `sec-${headings.length + 1}`;
    headings.push({ id, text });
    return `<h2${attrs.replace(/\sid="[^"]*"/, "")} id="${id}">${inner}</h2>`;
  });
  main = main.slice(0, bodyStart) + body + main.slice(bodyEnd);

  const post = data.blog.posts.find((item) => item.url === file);
  const topicLabel = post?.topic === "technical" ? u.blog.technical : post?.topic === "other" ? u.blog.other : "";
  const related = post
    ? data.blog.posts
        .filter((item) => !item.private && item.url !== file)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .sort((a, b) => (a.topic === post.topic ? 0 : 1) - (b.topic === post.topic ? 0 : 1))
        .slice(0, 2)
    : [];

  const crumbsHtml = `      <nav class="crumbs" aria-label="${u.a11y.primaryNav}">
        <ol>
          <li><a href="blog.html">${data.nav.blog}</a></li>
          <li><span aria-current="page">${u.article.crumb}</span></li>
        </ol>
      </nav>`;

  const tocHtml = headings.length >= 5
    ? `      <details class="article-toc" open>
        <summary>${u.article.toc}（${headings.length}）</summary>
        <ol>
${headings.map((h) => `          <li><a href="#${h.id}">${h.text}</a></li>`).join("\n")}
        </ol>
      </details>`
    : "";

  const relatedHtml = `      <section class="article-end" aria-labelledby="continue-title">
        <div class="article-end__head">
          <h2 class="article-end__title" id="continue-title">${u.article.continueTitle}</h2>
          <p class="article-end__lead">${u.article.continueLead}</p>
        </div>
        ${
          related.length
            ? `<div class="related">
${related
  .map(
    (item) =>
      `          <a href="${item.url}"><strong>${item.title}</strong><span>${item.date}${item.topic ? ` · ${item.topic === "technical" ? u.blog.technical : u.blog.other}` : ""}</span></a>`
  )
  .join("\n")}
        </div>`
            : `<p>${u.article.noRelated}</p>`
        }
        <a class="btn" href="blog.html" data-clear-topic><span>${u.article.back}</span><span aria-hidden="true">←</span></a>
      </section>`;

  // 把 main 内容替换为 面包屑 + 目录 + 原文章 + 继续阅读
  main = main.replace(
    /(<main[^>]*>)([\s\S]*)(<\/main>)/,
    (match, open, inner, close) => `${open}\n${crumbsHtml}\n${tocHtml}\n${inner}\n${relatedHtml}\n${close}`
  );

  html = html.slice(0, mainIndex) + main + html.slice(mainEnd + "</main>".length);

  // 替换 body 内的 header/footer/skip
  const newBody = `<body${bodyAttrs}>
${header(targets)}

${main}

${footer()}
  </body>`;
  html = html.replace(/<body([^>]*)>[\s\S]*<\/body>/i, () => newBody);

  write(file, html);
  console.log(`${file}: headings=${headings.length} related=${related.length}`);
}
