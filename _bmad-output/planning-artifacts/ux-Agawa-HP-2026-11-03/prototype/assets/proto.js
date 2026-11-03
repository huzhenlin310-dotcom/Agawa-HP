/* ==========================================================================
   Agawa-HP · UX 原型脚本（仅原型目录，不进入生产站点）
   职责：读取原型数据、按语言渲染、菜单与语言入口、主题筛选与 URL 恢复、
        文章目录与继续阅读、数据加载失败状态。
   ========================================================================== */

const LANGS = ["zh", "en", "ja"];

/** 作者显示名：作者归属见审核报告 §内容映射；鱼只沿用已公开署名，不添加身份说明。 */
const AUTHORS = {
  agawa: { zh: "阿川", en: "Agawa", ja: "阿川" },
  fish: { zh: "鱼", en: "Fish", ja: "魚" },
};

const PAGE_TITLES = {
  home: { zh: "首页", en: "Home", ja: "ホーム" },
  works: { zh: "项目", en: "Projects", ja: "プロジェクト" },
  blog: { zh: "博客", en: "Blog", ja: "ブログ" },
  about: { zh: "关于我", en: "About", ja: "私について" },
  contact: { zh: "联系", en: "Contact", ja: "お問い合わせ" },
  "fish-long": { zh: "鱼的文字 · 长文", en: "Fish's Writing · Long pieces", ja: "魚の文字 · 長文" },
  "fish-notes": { zh: "鱼的文字 · 札记", en: "Fish's Writing · Notes", ja: "魚の文字 · ノート" },
  article: { zh: "文章", en: "Article", ja: "記事" },
  review: { zh: "原型检查页", en: "Prototype review", ja: "プロトタイプ確認" },
};

const state = {
  lang: "zh",
  page: "home",
  data: null,
  ui: null,
  params: new URLSearchParams(location.search),
};

/* --------------------------------------------------------------------------
   基础工具
   -------------------------------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function resolvePath(object, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function normalizeLang(value) {
  return LANGS.includes(value) ? value : "zh";
}

function currentFile() {
  const file = location.pathname.split("/").pop();
  return file || "index.html";
}

/** 生成保留当前内容（语言、主题、文章）的站内链接。 */
function hrefFor(file, overrides = {}) {
  const params = new URLSearchParams();
  // 主题筛选要在站内跳转时保留；文章 id 只在进入文章页时保留，避免带到其他页面。
  const topic = state.params.get("topic");
  if (topic) params.set("topic", topic);
  const post = state.params.get("post");
  if (post && (file === "article.html" || overrides.post)) params.set("post", post);
  params.set("lang", overrides.lang || state.lang);
  for (const [key, value] of Object.entries(overrides)) {
    if (key === "lang") continue;
    if (value == null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${file}?${query}` : file;
}

/** 遍历站内链接，补上语言参数；外部链接不动。 */
function decorateLinks() {
  $$("a[data-link]").forEach((link) => {
    const target = link.getAttribute("href");
    if (!target || /^(https?:|mailto:)/.test(target)) return;
    const [file, query = ""] = target.split("?");
    const extra = Object.fromEntries(new URLSearchParams(query));
    if (link.hasAttribute("data-clear-topic")) extra.topic = null;
    link.setAttribute("href", hrefFor(file, extra));
  });
}

function applyStaticText() {
  $$("[data-ui]").forEach((node) => {
    const value = resolvePath(state.ui[state.lang], node.dataset.ui);
    if (typeof value === "string" && value) node.textContent = value;
  });
  $$("[data-aria]").forEach((node) => {
    const value = resolvePath(state.ui[state.lang], node.dataset.aria);
    if (typeof value === "string" && value) node.setAttribute("aria-label", value);
  });
  $$("[data-alt]").forEach((node) => {
    const value = resolvePath(state.ui[state.lang], node.dataset.alt);
    if (typeof value === "string" && value) node.setAttribute("alt", value);
  });
}

function applyDocumentChrome() {
  document.documentElement.lang = state.lang;
  const navKey = state.page === "fish-long" || state.page === "fish-notes" ? "blog" : state.page;
  const currentLabel = { zh: "· 当前", en: "· current", ja: "· 現在" }[state.lang];
  $$("[data-nav]").forEach((link) => {
    const key = link.dataset.nav;
    link.textContent = state.ui[state.lang].nav[key];
    if (key === navKey) {
      link.setAttribute("aria-current", "page");
      link.dataset.currentLabel = currentLabel;
    } else {
      link.removeAttribute("aria-current");
      delete link.dataset.currentLabel;
    }
  });
  const pageTitle = PAGE_TITLES[state.page]?.[state.lang] || "";
  const suffix = state.ui[state.lang]?.proto?.titleSuffix || "";
  document.title = suffix ? `${pageTitle} · ${state.ui[state.lang].siteName} · ${suffix}` : `${pageTitle} · ${state.ui[state.lang].siteName}`;
}

/* --------------------------------------------------------------------------
   导航交互：手机菜单 + 桌面语言下拉
   -------------------------------------------------------------------------- */

function setupMenu() {
  const button = $("#menu-toggle");
  const panel = $("#menu-panel");
  if (!button || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    const label = open ? state.ui[state.lang].a11y.closeMenu : state.ui[state.lang].a11y.menu;
    button.setAttribute("aria-label", label);
    $(".menu-toggle__text", button).textContent = label;
    if (open) {
      $("#menu-panel a")?.focus();
    }
  };

  button.addEventListener("click", () => setOpen(panel.hidden));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener("mousedown", (event) => {
    if (panel.hidden) return;
    if (!panel.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
  setOpen(false);
}

function setupLangMenu() {
  const button = $("#lang-button");
  const panel = $("#lang-panel");
  if (!button || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) $("a", panel)?.focus();
  };

  button.addEventListener("click", () => setOpen(panel.hidden));
  panel.addEventListener("keydown", (event) => {
    const items = $$("a", panel);
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      setOpen(false);
      button.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Tab" && index === items.length - 1 && !event.shiftKey) {
      setOpen(false);
    }
  });
  document.addEventListener("mousedown", (event) => {
    if (panel.hidden) return;
    if (!panel.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      button.focus();
    }
  });
  setOpen(false);
}

function renderLanguageEntries() {
  const names = state.ui[state.lang].langNames;
  const file = currentFile();
  const targets = [
    ["#lang-panel", "a[data-lang-option]"],
    ["#menu-lang", "a[data-lang-option]"],
  ];
  for (const [scope, selector] of targets) {
    const root = $(scope);
    if (!root) continue;
    $$(selector, root).forEach((link) => {
      const lang = link.dataset.langOption;
      link.textContent = names[lang];
      link.setAttribute("href", hrefFor(file, { lang }));
      if (lang === state.lang) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }
  const button = $("#lang-button");
  if (button) {
    $("#lang-current").textContent = names[state.lang];
    button.setAttribute("aria-label", `${state.ui[state.lang].a11y.language}: ${names[state.lang]}`);
  }
}

/* --------------------------------------------------------------------------
   数据
   -------------------------------------------------------------------------- */

function visiblePosts() {
  // 与生产一致：未解锁时不展示私密文章；当前基线数据中没有 private:true 的文章。
  const unlocked = sessionStorage.getItem("agawa-proto-unlock") === "true";
  return state.data.posts.filter((post) => !post.private || unlocked);
}

function byDateDesc(a, b) {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

function authorName(post) {
  return AUTHORS[post.author]?.[state.lang] || "";
}

function topicLabel(topic) {
  const map = state.ui[state.lang].blog;
  if (topic === "technical") return map.technical;
  if (topic === "other") return map.other;
  return map.all;
}

function postUrl(post, extra = {}) {
  return hrefFor("article.html", { post: post.id, ...extra });
}

/* --------------------------------------------------------------------------
   渲染：文章行
   -------------------------------------------------------------------------- */

function postRow(post, index, extra = {}) {
  const link = el("a", "post-row");
  link.href = postUrl(post, extra);
  link.dataset.link = "";

  const no = el("span", "post-row__no", String(index + 1).padStart(2, "0"));

  const body = el("div", "post-row__body");
  const title = el("h3", "post-row__title", post.titles[state.lang]);
  const excerpt = el("p", "post-row__excerpt", post.excerpts[state.lang]);
  body.append(title, excerpt);

  const side = el("div", "post-row__side");
  side.append(el("span", "post-row__date", post.date));
  const author = el("span", "post-row__author", `${state.ui[state.lang].blog.authorLabel}: ${authorName(post)}`);
  const chip = el("span", "chip", topicLabel(post.topic));
  side.append(author, chip);

  link.append(no, body, side);
  return link;
}

/* --------------------------------------------------------------------------
   渲染：首页
   -------------------------------------------------------------------------- */

function renderHome() {
  const ui = state.ui[state.lang];
  const posts = visiblePosts().slice().sort(byDateDesc);

  const projects = $("#home-projects");
  if (projects) {
    projects.replaceChildren(
      ...state.data.works.map((work, index) => {
        const card = el("a", "work-card");
        card.href = hrefFor("works.html", {}) + `#${work.id}`;
        card.dataset.link = "";
        const figure = el("figure", "work-card__figure");
        const img = el("img");
        img.src = `../../../../${work.languages.zh.image}`;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        figure.append(img);
        card.append(figure);
        card.append(el("span", "work-card__no", `No. ${String(index + 1).padStart(2, "0")} / ${work.languages[state.lang].year}`));
        card.append(el("h3", "work-card__title", work.languages[state.lang].title));
        card.append(el("p", "work-card__summary", work.languages[state.lang].summary));
        card.append(el("span", "work-card__cta", `${ui.nav.works} →`));
        return card;
      })
    );
  }

  const technical = posts.filter((post) => post.topic === "technical").slice(0, 2);
  const techList = $("#home-technical");
  if (techList) {
    techList.replaceChildren(...technical.map((post, index) => postRow(post, index)));
  }

  const techIds = new Set(technical.map((post) => post.id));
  const more = posts.filter((post) => !techIds.has(post.id)).slice(0, 2);
  const moreSection = $("#home-more-section");
  if (moreSection) {
    if (more.length === 0) {
      moreSection.remove();
    } else {
      $("#home-more").replaceChildren(...more.map((post, index) => postRow(post, index)));
    }
  }
}

/* --------------------------------------------------------------------------
   渲染：项目页
   -------------------------------------------------------------------------- */

function renderWorks() {
  const ui = state.ui[state.lang];
  const index = $("#work-index-list");
  if (index) {
    index.replaceChildren(
      ...state.data.works.map((work, i) => {
        const li = el("li");
        const link = el("a");
        link.href = `#${work.id}`;
        link.append(el("span", "work-index__no", String(i + 1).padStart(2, "0")));
        link.append(el("span", "", work.languages[state.lang].title));
        link.append(el("span", "work-index__type", work.actionLabel[state.lang]));
        li.append(link);
        return li;
      })
    );
  }

  const list = $("#work-entries");
  if (!list) return;
  list.replaceChildren(
    ...state.data.works.map((work, i) => {
      const copy = work.languages[state.lang];
      const article = el("article", "work-entry");
      article.id = work.id;

      const figure = el("figure", "work-entry__figure");
      const img = el("img");
      img.src = `../../../../${copy.image}`;
      img.alt = "";
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      const caption = el("figcaption", "", copy.caption);
      figure.append(img, caption);

      const body = el("div", "work-entry__copy");
      body.append(el("span", "work-entry__no", `No. ${String(i + 1).padStart(2, "0")} / ${copy.year}`));
      const title = el("h2", "work-entry__title", copy.title);
      body.append(title);
      body.append(el("p", "work-entry__summary", copy.summary));
      body.append(el("p", "work-entry__body", copy.body));
      if (copy.quote) body.append(el("blockquote", "", copy.quote));
      if (copy.credits) body.append(el("p", "work-entry__credits", copy.credits));

      const actions = el("div", "work-entry__actions");
      const action = el("a", "btn btn--solid");
      action.href = work.url;
      action.target = "_blank";
      action.rel = "noreferrer";
      action.append(el("span", "", ui.works[work.action === "app" ? "openApp" : "openSite"]));
      action.append(el("span", "btn__arrow", "↗"));
      action.setAttribute("aria-label", `${work.actionLabel[state.lang]} · ${copy.title}（${ui.a11y.opensExternal}）`);
      actions.append(action);
      body.append(actions);
      body.append(el("p", "work-entry__note", ui.works.external));

      article.append(figure, body);
      return article;
    })
  );
}

/* --------------------------------------------------------------------------
   渲染：博客页（筛选 + URL 恢复 + 空状态）
   -------------------------------------------------------------------------- */

function renderBlog() {
  const ui = state.ui[state.lang];
  const posts = visiblePosts().slice().sort(byDateDesc);
  const counts = {
    all: posts.length,
    technical: posts.filter((post) => post.topic === "technical").length,
    other: posts.filter((post) => post.topic === "other").length,
  };

  const lead = $("#blog-lead");
  if (lead) lead.textContent = state.data.blog[state.lang].lead;
  // 没有任何文章时用站点原有的“文章准备中”；筛选无命中时用“没有符合条件的文章”。
  $("#blog-empty-title").textContent =
    posts.length === 0 ? state.data.blog[state.lang].emptyTitle : ui.blog.emptyTitle;

  const fishCount = $("#fish-entry-count");
  if (fishCount) {
    const longs = state.data.fishPosts.length;
    const notes = state.data.notes[state.lang].entries.length;
    const template = ui.fish.count || "{longs} · {notes}";
    fishCount.textContent = template.replace("{longs}", String(longs)).replace("{notes}", String(notes));
  }

  const filterRoot = $("#blog-filter");
  if (filterRoot) {
    const current = state.params.get("topic") || "all";
    const buttons = ["all", "technical", "other"].map((topic) => {
      const button = el("button", "filter__btn");
      button.type = "button";
      button.dataset.topic = topic;
      button.setAttribute("aria-pressed", String(topic === current));
      button.append(el("span", "", topicLabel(topic)));
      button.append(el("span", "filter__count", `(${counts[topic]})`));
      button.addEventListener("click", () => setTopic(topic));
      return button;
    });
    filterRoot.replaceChildren(el("span", "filter__label", ui.blog.filterTitle), ...buttons);
  }

  const list = $("#blog-list");
  const empty = $("#blog-empty");
  if (!list || !empty) return;

  const current = state.params.get("topic") || "all";
  const filtered = current === "all" ? posts : posts.filter((post) => post.topic === current);

  $("#blog-count").textContent = `${filtered.length} ${ui.blog.countLabel}`;

  if (filtered.length === 0) {
    list.replaceChildren();
    list.hidden = true;
    empty.hidden = false;
    return;
  }

  list.hidden = false;
  empty.hidden = true;
  list.replaceChildren(
    ...filtered.map((post, index) => postRow(post, index, { topic: current === "all" ? null : current }))
  );
}

function setTopic(topic) {
  const params = new URLSearchParams(location.search);
  if (topic === "all") params.delete("topic");
  else params.set("topic", topic);
  params.set("lang", state.lang);
  const next = `${location.pathname}?${params.toString()}`;
  history.pushState({ topic }, "", next);
  state.params = new URLSearchParams(location.search);
  renderBlog();
  // 筛选变化后把焦点留在筛选组，键盘用户不用重新找位置
  $(`#blog-filter .filter__btn[data-topic="${topic}"]`)?.focus();
}

/* --------------------------------------------------------------------------
   渲染：鱼的文字
   -------------------------------------------------------------------------- */

function renderFish() {
  const ui = state.ui[state.lang];
  const isLong = state.page === "fish-long";
  const currentLabel = { zh: " · 当前", en: " · current", ja: " · 現在" }[state.lang];

  const longTab = $("#fish-tab-long");
  const notesTab = $("#fish-tab-notes");
  const active = isLong ? longTab : notesTab;
  const inactive = isLong ? notesTab : longTab;
  active.setAttribute("aria-current", "page");
  inactive.removeAttribute("aria-current");
  const activeLabel = active.querySelector(".tabs__label");
  if (activeLabel) activeLabel.dataset.currentLabel = currentLabel;
  const inactiveLabel = inactive.querySelector(".tabs__label");
  if (inactiveLabel) delete inactiveLabel.dataset.currentLabel;

  const crumb = $("#fish-crumb-current");
  if (crumb) crumb.textContent = isLong ? ui.fish.crumbLong : ui.fish.crumbNotes;

  const spaceLead = $("#fish-space-lead");
  if (spaceLead) spaceLead.textContent = state.data.fish[state.lang].lead;

  if (isLong) {
    const posts = state.data.posts.filter((post) => state.data.fishPosts.includes(post.id));
    const list = $("#fish-long-list");
    const empty = $("#fish-long-empty");
    // 空状态文案先按当前语言写好：即使当前有长文、区块隐藏，也不能留下中文兜底
    $("#fish-long-empty p").textContent = state.data.fish[state.lang].emptyText;
    if (posts.length === 0) {
      list.hidden = true;
      empty.hidden = false;
    } else {
      list.replaceChildren(...posts.map((post, index) => postRow(post, index, { from: "fish" })));
    }
    return;
  }

  const entries = state.data.notes[state.lang].entries;
  const list = $("#fish-notes-list");
  const empty = $("#fish-notes-empty");
  $("#fish-notes-empty p").textContent = state.data.notes[state.lang].emptyText;
  $("#fish-notes-signature").textContent = state.data.notes[state.lang].signature;
  if (entries.length === 0) {
    list.hidden = true;
    empty.hidden = false;
    return;
  }
  list.replaceChildren(
    ...entries.map((entry) => {
      const item = el("article", "note-item");
      const meta = el("div", "note-item__meta");
      meta.append(el("time", "", entry.date));
      const source = el("a", "note-item__source", `${ui.fish.sourcePrefix}${entry.source}`);
      source.href = entry.url;
      source.target = "_blank";
      source.rel = "noreferrer";
      meta.append(source);
      meta.append(el("span", "chip", entry.bv));
      item.append(meta);
      item.append(el("p", "note-item__text", entry.note));
      return item;
    })
  );
}

/* --------------------------------------------------------------------------
   渲染：关于页、联系页（简化原型：验证入口顺序，不重做正文版式）
   -------------------------------------------------------------------------- */

function renderAbout() {
  const ui = state.ui[state.lang];
  const data = state.data.about[state.lang];
  $("#about-title").textContent = data.title;
  $("#about-lead").textContent = data.lead;
  $("#about-entries").replaceChildren(
    buttonLink("works.html", `${ui.nav.works} →`),
    buttonLink("blog.html", `${ui.nav.blog} →`),
    buttonLink("contact.html", `${ui.nav.contact} →`)
  );
  $("#about-body").replaceChildren(...data.body.map((text) => el("p", "", text)));
  $("#about-quote").textContent = data.quote;
  $("#about-timeline").replaceChildren(
    ...data.timeline.map((item) => {
      const li = el("li");
      li.append(el("time", "", item.year));
      li.append(el("p", "", item.text));
      return li;
    })
  );
  $("#about-notes").replaceChildren(...data.notes.map((text) => el("li", "", text)));
}

function renderContact() {
  const ui = state.ui[state.lang];
  const data = state.data.contact[state.lang];
  $("#contact-title").textContent = data.title;
  $("#contact-intro").textContent = data.intro;
  const email = $("#contact-email");
  email.textContent = data.email;
  email.href = `mailto:${data.email}`;
  $("#contact-location").textContent = data.location;
  $("#contact-socials").replaceChildren(
    ...data.socials.map((item) => {
      const li = el("li");
      const link = el("a", "", item.label);
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      li.append(link);
      return li;
    })
  );
  $("#contact-collaboration").replaceChildren(...data.collaboration.map((text) => el("li", "", text)));
  $("#contact-entries").replaceChildren(
    buttonLink("works.html", `${ui.nav.works} →`),
    buttonLink("blog.html", `${ui.nav.blog} →`)
  );
}

function buttonLink(file, label) {
  const link = el("a", "btn");
  link.href = hrefFor(file, {});
  link.append(el("span", "", label));
  return link;
}

/* --------------------------------------------------------------------------
   渲染：文章页
   -------------------------------------------------------------------------- */

function pickRelated(post) {
  const pool = visiblePosts()
    .filter((item) => item.id !== post.id)
    .sort(byDateDesc);
  const same = pool.filter((item) => item.topic === post.topic);
  const others = pool.filter((item) => item.topic !== post.topic);
  const picked = [...same, ...others].slice(0, 2);
  return picked;
}

function renderArticle() {
  const ui = state.ui[state.lang];
  const id = state.params.get("post") || "acting-human";
  const article = state.data.articles[id]?.[state.lang];
  const post = state.data.posts.find((item) => item.id === id);

  if (!article || !post) {
    $("#article-root").hidden = true;
    const missing = $("#article-missing");
    missing.hidden = false;
    $("#article-missing-back").href = hrefFor("blog.html", {});
    return;
  }

  document.title = `${article.title} · ${state.ui[state.lang].siteName}`;
  $("#article-kicker").textContent = article.kicker;
  $("#article-title").textContent = article.title;
  $("#article-subtitle").textContent = article.subtitle;
  $("#article-date").textContent = post.date;
  $("#article-topic").textContent = topicLabel(post.topic);
  $("#article-author").textContent = authorName(post);

  // 少于 5 个正文二级标题时不显示目录（与方案 4.6 的初始规则一致）
  $("#toc-desktop").hidden = !article.hasToc;
  $("#toc-mobile").hidden = !article.hasToc;

  const tocItems = article.tocHeadings.map((heading) => {
    const li = el("li");
    const link = el("a", "", heading.text);
    link.href = `#${heading.id}`;
    li.append(link);
    return li;
  });
  $("#toc-desktop ol").replaceChildren(...tocItems.map((li) => li.cloneNode(true)));
  $("#toc-mobile ol").replaceChildren(...tocItems);
  $("#toc-mobile summary").textContent = (ui.article.tocCount || "{n}").replace("{n}", String(article.tocHeadings.length));

  const body = $("#article-body");
  body.innerHTML = article.body;
  if (article.heroFigure) {
    const figure = $("#article-hero");
    figure.innerHTML = article.heroFigure;
    figure.hidden = false;
  }
  if (article.signature) {
    const signature = el("p", "article-signature", article.signature);
    body.append(signature);
  }

  const back = $("#article-back");
  const fromTopic = state.params.get("topic");
  back.href = hrefFor("blog.html", fromTopic ? { topic: fromTopic } : { topic: null });

  const related = pickRelated(post);
  const relatedRoot = $("#article-related");
  if (related.length === 0) {
    relatedRoot.hidden = true;
    $("#article-related-empty").hidden = false;
  } else {
    relatedRoot.replaceChildren(
      ...related.map((item) => {
        const link = el("a");
        link.href = postUrl(item);
        link.append(el("strong", "", item.titles[state.lang]));
        link.append(el("span", "", `${item.date} · ${topicLabel(item.topic)} · ${authorName(item)}`));
        return link;
      })
    );
  }

  // 项目入口：只在有已核实关联时展示；当前没有可核实的关联，故不渲染。
  const projectRoot = $("#article-project");
  if (projectRoot) projectRoot.remove();
}

/* --------------------------------------------------------------------------
   渲染：原型检查页（仅审核使用）
   -------------------------------------------------------------------------- */

function renderReview() {
  const ui = state.ui[state.lang];
  const toggle = $("#private-toggle");
  const locked = $("#private-locked");
  const unlocked = $("#private-unlocked");
  if (!toggle) return;

  const sample = state.data.samplePrivate;
  const isUnlocked = sessionStorage.getItem("agawa-proto-unlock") === "true";

  const paint = (open) => {
    toggle.setAttribute("aria-pressed", String(open));
    toggle.textContent = open
      ? { zh: "重新锁定样例", en: "Lock the sample again", ja: "サンプルを再ロック" }[state.lang]
      : { zh: "模拟解锁（样例）", en: "Simulate unlock (sample)", ja: "解除をシミュレート（サンプル）" }[state.lang];
    locked.hidden = open;
    unlocked.hidden = !open;
    if (open) {
      $("#sample-title").textContent = sample.titles[state.lang];
      $("#sample-excerpt").textContent = sample.excerpts[state.lang];
    }
  };

  toggle.addEventListener("click", () => {
    const next = sessionStorage.getItem("agawa-proto-unlock") !== "true";
    sessionStorage.setItem("agawa-proto-unlock", String(next));
    paint(next);
  });

  paint(isUnlocked);

  $("#review-empty-link").href = hrefFor("blog.html", { topic: "__none__" });
  $("#review-blog-link").href = hrefFor("blog.html", {});
  $("#review-home-link").href = hrefFor("index.html", {});
  $("#review-works-link").href = hrefFor("works.html", {});
  $("#review-fish-link").href = hrefFor("fish-blog.html", {});
  $("#review-notes-link").href = hrefFor("notes.html", {});
  $("#review-article-link").href = hrefFor("article.html", { post: "acting-human" });
}

/* --------------------------------------------------------------------------
   启动
   -------------------------------------------------------------------------- */

function showError(message) {
  const root = $("#data-error");
  if (!root) return;
  root.hidden = false;
  root.querySelector("p").textContent = message;
  const retry = root.querySelector("button");
  retry.addEventListener("click", () => location.reload());
}

async function boot() {
  state.lang = normalizeLang(state.params.get("lang") || localStorage.getItem("agawa-proto-lang") || "zh");
  state.page = document.body.dataset.protoPage || "home";
  localStorage.setItem("agawa-proto-lang", state.lang);

  // 先加载界面文案：即使内容数据失败，导航、错误提示与重试按钮也能按当前语言显示。
  try {
    const uiResponse = await fetch("data/proto-ui.json", { cache: "no-store" });
    if (!uiResponse.ok) throw new Error(`HTTP ${uiResponse.status}`);
    state.ui = await uiResponse.json();
  } catch (error) {
    console.error(error);
    showError("原型数据加载失败。导航仍可点击，请检查本地服务器后重试。");
    document.body.classList.add("is-ready");
    return;
  }

  applyStaticText();
  applyDocumentChrome();
  decorateLinks();
  renderLanguageEntries();
  setupMenu();
  setupLangMenu();

  // 原型专用开关：?simulateDataError=1 演示“内容数据加载失败”时导航仍可用。
  if (state.params.get("simulateDataError") === "1") {
    showError(state.ui[state.lang].proto.loadError);
    document.body.classList.add("is-ready");
    return;
  }

  try {
    const dataResponse = await fetch("data/proto-data.json", { cache: "no-store" });
    if (!dataResponse.ok) throw new Error(`HTTP ${dataResponse.status}`);
    state.data = await dataResponse.json();
  } catch (error) {
    console.error(error);
    showError(state.ui[state.lang].proto.loadError);
    document.body.classList.add("is-ready");
    return;
  }

  if (state.page === "home") renderHome();
  if (state.page === "works") renderWorks();
  if (state.page === "about") renderAbout();
  if (state.page === "contact") renderContact();
  if (state.page === "blog") {
    renderBlog();
    window.addEventListener("popstate", () => {
      state.params = new URLSearchParams(location.search);
      renderBlog();
    });
  }
  if (state.page === "fish-long" || state.page === "fish-notes") renderFish();
  if (state.page === "article") renderArticle();
  if (state.page === "review") renderReview();

  document.body.classList.add("is-ready");
}

boot();
