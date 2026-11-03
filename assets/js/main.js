const SUPPORTED_LANGS = ["zh", "en", "ja"];
const DATA_VERSION = "ux-20261103";
const PAGE = document.body.dataset.page || "home";
const ARTICLE_LANG = document.body.dataset.articleLang;
const PRIVATE_BLOG_PASSWORD_HASH = "8e0c19142ee61342e1f8b09a6fccbcf5867db1542444474ed37ad11bd08eb062";
const PRIVATE_BLOG_SESSION_KEY = "agawa-private-blog-unlocked";
const PRIVATE_BLOG_TRIGGER_WINDOW = 1000;
const LANG_NAMES = { zh: "中文", en: "English", ja: "日本語" };
const FISH_NAME = { zh: "鱼", en: "Fish", ja: "魚" };

const PRIVATE_BLOG_UI = {
  zh: {
    title: "隐藏文章",
    description: "请输入密码以显示当前标签页中的隐藏博客。",
    passwordLabel: "密码",
    submit: "解锁",
    cancel: "取消",
    incorrect: "密码不正确，请重试。",
    unavailable: "当前浏览器无法完成密码验证。"
  },
  en: {
    title: "Hidden articles",
    description: "Enter the password to show hidden blog posts in this tab.",
    passwordLabel: "Password",
    submit: "Unlock",
    cancel: "Cancel",
    incorrect: "Incorrect password. Please try again.",
    unavailable: "This browser cannot verify the password."
  },
  ja: {
    title: "非公開記事",
    description: "このタブで非公開ブログを表示するには、パスワードを入力してください。",
    passwordLabel: "パスワード",
    submit: "ロック解除",
    cancel: "キャンセル",
    incorrect: "パスワードが正しくありません。もう一度お試しください。",
    unavailable: "このブラウザではパスワードを確認できません。"
  }
};

const dataCache = new Map();
let currentPageData = null;
let currentPageLang = "zh";
let currentTopic = "all";
let privateBlogDialog = null;
let privateBlogDialogReturnFocus = null;

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function setText(selector, value, root = document) {
  const target = $(selector, root);
  if (target) target.textContent = value == null ? "" : String(value);
}

function splitParagraphs(value) {
  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEl(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function resolvePath(object, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function uiValue(path, lang = currentPageLang) {
  const value = resolvePath(currentPageData?.ui || {}, path);
  return typeof value === "string" ? value : undefined;
}

function format(template, values) {
  return String(template || "").replace(/\{(\w+)\}/g, (match, key) => (values[key] == null ? match : String(values[key])));
}

function isPrivateBlogUnlocked() {
  try {
    return sessionStorage.getItem(PRIVATE_BLOG_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function storePrivateBlogUnlock() {
  try {
    sessionStorage.setItem(PRIVATE_BLOG_SESSION_KEY, "true");
    return true;
  } catch {
    return false;
  }
}

async function hashPrivateBlogPassword(value) {
  if (!window.crypto?.subtle) throw new Error("Web Crypto unavailable");
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function updatePrivateBlogDialog(lang) {
  if (!privateBlogDialog) return;
  const copy = PRIVATE_BLOG_UI[normalizeLang(lang)];
  setText("[data-private-dialog-title]", copy.title, privateBlogDialog);
  setText("[data-private-dialog-description]", copy.description, privateBlogDialog);
  setText("[data-private-dialog-label]", copy.passwordLabel, privateBlogDialog);
  setText("[data-private-dialog-submit]", copy.submit, privateBlogDialog);
  setText("[data-private-dialog-cancel]", copy.cancel, privateBlogDialog);
  privateBlogDialog.querySelector("input").setAttribute("aria-label", copy.passwordLabel);
}

function closePrivateBlogDialog() {
  if (privateBlogDialog?.open) privateBlogDialog.close();
}

function openPrivateBlogDialog() {
  if (!privateBlogDialog || isPrivateBlogUnlocked()) return;
  updatePrivateBlogDialog(currentPageLang);
  privateBlogDialogReturnFocus = document.activeElement;
  if (!privateBlogDialog.open) privateBlogDialog.showModal();
  window.requestAnimationFrame(() => privateBlogDialog.querySelector("input")?.focus());
}

function createPrivateBlogDialog() {
  if (privateBlogDialog) return;
  const dialog = document.createElement("dialog");
  dialog.className = "private-blog-dialog";
  dialog.setAttribute("aria-labelledby", "private-blog-dialog-title");
  dialog.setAttribute("aria-describedby", "private-blog-dialog-description");
  dialog.innerHTML = `
    <form class="private-blog-form">
      <p class="section-kicker">Private access</p>
      <h2 id="private-blog-dialog-title" data-private-dialog-title></h2>
      <p id="private-blog-dialog-description" class="private-blog-description" data-private-dialog-description></p>
      <label for="private-blog-password" data-private-dialog-label></label>
      <input id="private-blog-password" name="password" type="password" autocomplete="off" required>
      <p class="private-blog-error" data-private-dialog-error role="alert" aria-live="polite"></p>
      <div class="private-blog-actions">
        <button type="button" data-private-dialog-cancel></button>
        <button type="submit" data-private-dialog-submit></button>
      </div>
    </form>
  `;

  const form = dialog.querySelector("form");
  const input = dialog.querySelector("input");
  const error = dialog.querySelector("[data-private-dialog-error]");
  const submit = dialog.querySelector("[data-private-dialog-submit]");

  dialog.querySelector("[data-private-dialog-cancel]").addEventListener("click", closePrivateBlogDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closePrivateBlogDialog();
  });
  dialog.addEventListener("close", () => {
    form.reset();
    error.textContent = "";
    submit.disabled = false;
    if (privateBlogDialogReturnFocus instanceof HTMLElement) privateBlogDialogReturnFocus.focus();
    privateBlogDialogReturnFocus = null;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    submit.disabled = true;
    const copy = PRIVATE_BLOG_UI[currentPageLang];

    try {
      const digest = await hashPrivateBlogPassword(input.value);
      if (digest !== PRIVATE_BLOG_PASSWORD_HASH) {
        error.textContent = copy.incorrect;
        input.select();
        return;
      }

      storePrivateBlogUnlock();
      document.body.classList.add("is-private-unlocked");
      closePrivateBlogDialog();
      if (!ARTICLE_LANG) renderPage(currentPageData, currentPageLang);
    } catch {
      error.textContent = copy.unavailable;
    } finally {
      submit.disabled = false;
    }
  });

  document.body.append(dialog);
  privateBlogDialog = dialog;
  updatePrivateBlogDialog(currentPageLang);
}

function initPrivateBlogAccess(lang) {
  currentPageLang = normalizeLang(lang);
  createPrivateBlogDialog();

  if (isPrivateBlogUnlocked()) {
    document.body.classList.add("is-private-unlocked");
  } else if (document.body.dataset.private === "true") {
    openPrivateBlogDialog();
  }

  let triggerTimes = [];
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditable = target instanceof Element && Boolean(
      target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
    );
    const isPlainB = event.key.toLowerCase() === "b"
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
      && !event.shiftKey;

    if (isEditable || !isPlainB) {
      triggerTimes = [];
      return;
    }

    const now = performance.now();
    triggerTimes = triggerTimes.filter((time) => now - time <= PRIVATE_BLOG_TRIGGER_WINDOW);
    triggerTimes.push(now);
    if (triggerTimes.length < 3) return;

    triggerTimes = [];
    event.preventDefault();
    openPrivateBlogDialog();
  });
}

async function getData(lang) {
  if (dataCache.has(lang)) return dataCache.get(lang);
  const response = await fetch(`assets/data/site.${lang}.json?v=${DATA_VERSION}`);
  if (!response.ok) throw new Error(`Could not load language data: ${lang}`);
  const data = await response.json();
  dataCache.set(lang, data);
  return data;
}

function normalizeLang(value) {
  return SUPPORTED_LANGS.includes(value) ? value : "zh";
}

function getInitialLang() {
  if (SUPPORTED_LANGS.includes(ARTICLE_LANG)) return ARTICLE_LANG;
  const paramLang = new URLSearchParams(location.search).get("lang");
  if (SUPPORTED_LANGS.includes(paramLang)) return paramLang;
  const stored = localStorage.getItem("magazine-lang");
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return normalizeLang(browserLang);
}

function visiblePosts(data) {
  const unlocked = isPrivateBlogUnlocked();
  return Array.isArray(data.blog.posts)
    ? data.blog.posts.filter((post) => !post.private || unlocked)
    : [];
}

function byDateDesc(a, b) {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

function topicLabel(topic, data = currentPageData) {
  const blog = data?.ui?.blog || {};
  if (topic === "technical") return blog.technical || "Technical practice";
  if (topic === "other") return blog.other || "Other topics";
  return blog.all || "All";
}

function findPostByUrl(data, url) {
  return (data.blog.posts || []).find((post) => post.url === url) || null;
}

function applyStaticText(data, lang) {
  $all("[data-ui]").forEach((node) => {
    const value = uiValue(node.dataset.ui, lang);
    if (typeof value === "string" && value) node.textContent = value;
  });
  $all("[data-aria]").forEach((node) => {
    const value = uiValue(node.dataset.aria, lang);
    if (typeof value === "string" && value) node.setAttribute("aria-label", value);
  });
  $all("[data-alt]").forEach((node) => {
    const value = uiValue(node.dataset.alt, lang);
    if (typeof value === "string" && value) node.setAttribute("alt", value);
  });
  setText("[data-home-subtitle]", data.home.subtitle);
  setText("[data-home-intro]", data.home.intro);
  setText("[data-home-featured-title]", data.home.featuredWorksTitle);
  setText("[data-about-lead]", data.about.lead);
  setText("[data-blog-lead]", data.blog.lead);
  setText("[data-fish-lead]", data.fishBlog.lead);
  setText("[data-fish-count]", format(uiValue("fish.count", lang) || "", {
    longs: data.fishBlog.posts.filter((post) => {
      const source = findPostByUrl(data, post.url);
      return !(post.private || source?.private) || isPrivateBlogUnlocked();
    }).length,
    notes: data.notes.entries.length
  }));
}

function updateChrome(data, lang) {
  document.documentElement.lang = lang;
  const fishSpaceTitle = data.ui?.fish?.spaceTitle || data.fishBlog.title;
  const pageLabel = data.nav[PAGE] ?? (PAGE === "fish-blog" || PAGE === "notes" ? fishSpaceTitle : "");
  if (!ARTICLE_LANG && pageLabel) document.title = `${pageLabel} · Achuan`;

  const navKey = PAGE === "fish-blog" || PAGE === "notes" ? "blog" : PAGE;
  $all("[data-nav]").forEach((item) => {
    const key = item.dataset.nav;
    item.textContent = data.nav[key] || "";
    if (key === navKey) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });

  $all("[data-lang]").forEach((buttonEl) => {
    buttonEl.setAttribute("aria-pressed", String(buttonEl.dataset.lang === lang));
  });

  const current = $("[data-lang-current]");
  if (current) current.textContent = LANG_NAMES[lang] || LANG_NAMES.zh;

  applyStaticText(data, lang);
  setText("[data-footer-text]", data.footer.text);
  setText("[data-footer-copyright]", data.footer.copyright);

  const langButton = $("#lang-button");
  if (langButton) langButton.setAttribute("aria-label", `${uiValue("a11y.language", lang) || "Language"}: ${LANG_NAMES[lang]}`);
  const menuButton = $("#menu-toggle");
  if (menuButton) {
    const label = menuButton.getAttribute("aria-expanded") === "true"
      ? uiValue("a11y.closeMenu", lang) || "Close menu"
      : uiValue("a11y.menu", lang) || "Menu";
    menuButton.setAttribute("aria-label", label);
    const text = $(".menu-toggle__text", menuButton);
    if (text) text.textContent = label;
  }

  const tabs = { "fish-blog": "#tab-long", notes: "#tab-notes" }[PAGE];
  if (tabs) {
    $all(".tabs a").forEach((tab) => tab.removeAttribute("aria-current"));
    const currentTab = $(tabs);
    if (currentTab) currentTab.setAttribute("aria-current", "page");
    setText("[data-crumb-current]", PAGE === "fish-blog" ? data.ui.fish.crumbLong : data.ui.fish.crumbNotes);
  }

  if (ARTICLE_LANG) {
    const toc = $(".article-toc");
    if (toc && window.matchMedia("(max-width: 1080px)").matches) toc.removeAttribute("open");
  }
}

function postRow(post, index, data) {
  const lang = currentPageLang;
  const row = createEl("a", "post-row");
  row.href = post.url;

  const no = createEl("span", "post-row__no", String(index + 1).padStart(2, "0"));
  const body = createEl("div");
  body.append(createEl("h3", "post-row__title", post.title));
  body.append(createEl("p", "post-row__excerpt", post.excerpt || ""));

  const side = createEl("div", "post-row__side");
  side.append(createEl("span", "", post.date));
  if (post.author === "fish") {
    side.append(createEl("span", "post-row__author", `${data.ui.blog.authorLabel}: ${FISH_NAME[lang]}`));
  }
  side.append(createEl("span", "", topicLabel(post.topic, data)));

  row.append(no, body, side);
  return row;
}

function renderHome(data) {
  const works = $("[data-home-projects]");
  if (works) {
    works.replaceChildren(...data.works.slice(0, 3).map((work, index) => {
      const card = createEl("a", "work-card");
      card.href = `works.html#${work.id}`;
      const figure = createEl("figure", "work-card__figure");
      const img = createEl("img");
      img.src = work.image;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      figure.append(img);
      card.append(figure);
      card.append(createEl("span", "work-card__no", `No. ${String(index + 1).padStart(2, "0")} / ${work.year}`));
      card.append(createEl("h3", "work-card__title", work.title));
      card.append(createEl("p", "work-card__summary", work.summary));
      card.append(createEl("span", "work-card__cta", `${data.nav.works} →`));
      return card;
    }));
  }

  const posts = visiblePosts(data).slice().sort(byDateDesc);
  const technical = posts.filter((post) => post.topic === "technical").slice(0, 2);
  const techList = $("[data-home-technical]");
  if (techList) techList.replaceChildren(...technical.map((post, index) => postRow(post, index, data)));

  const techIds = new Set(technical.map((post) => post.id));
  const more = posts.filter((post) => !techIds.has(post.id)).slice(0, 2);
  const moreList = $("[data-home-more]");
  if (moreList) moreList.replaceChildren(...more.map((post, index) => postRow(post, index, data)));
}

function renderWorks(data) {
  setText("[data-works-title]", data.nav.works);

  const index = $("[data-work-index]");
  if (index) {
    index.replaceChildren(...data.works.map((work, i) => {
      const li = createEl("li");
      const link = createEl("a");
      link.href = `#${work.id}`;
      link.append(createEl("span", "index-card__no", String(i + 1).padStart(2, "0")));
      link.append(createEl("span", "", work.title));
      const action = work.action === "site" ? data.ui.works.openSite : data.ui.works.openApp;
      link.append(createEl("span", "index-card__type", action));
      li.append(link);
      return li;
    }));
  }

  const list = $("[data-works-list]");
  if (!list) return;
  list.replaceChildren(...data.works.map((work, i) => {
    const article = createEl("article", "work-row");
    article.id = work.id;

    const figure = createEl("figure", "work-row__figure");
    const img = createEl("img");
    img.src = work.image;
    img.alt = "";
    img.loading = i === 0 ? "eager" : "lazy";
    img.decoding = "async";
    figure.append(img);
    figure.append(createEl("figcaption", "", work.caption));

    const copy = createEl("div", "work-row__copy");
    copy.append(createEl("span", "work-row__no", `No. ${String(i + 1).padStart(2, "0")} / ${work.year}`));
    copy.append(createEl("h2", "work-row__title", work.title));
    copy.append(createEl("p", "work-row__summary", work.summary));
    copy.append(createEl("p", "work-row__body", work.body));
    if (work.quote) copy.append(createEl("blockquote", "", work.quote));
    if (work.credits) copy.append(createEl("p", "work-row__credits", work.credits));

    const actions = createEl("div", "work-row__actions");
    const link = work.links?.[0];
    if (link) {
      const action = createEl("a", "btn btn--solid");
      action.href = link.url;
      action.target = "_blank";
      action.rel = "noreferrer";
      action.append(createEl("span", "", work.action === "site" ? data.ui.works.openSite : data.ui.works.openApp));
      action.append(createEl("span", "", "↗"));
      action.setAttribute("aria-label", `${action.textContent.replace("↗", "").trim()} · ${work.title}（${data.ui.a11y.opensExternal}）`);
      actions.append(action);
    }
    copy.append(actions);
    copy.append(createEl("p", "work-row__note", data.ui.works.externalNote));

    article.append(figure, copy);
    return article;
  }));
}

function renderBlog(data, lang) {
  setText("[data-blog-title]", data.nav.blog);

  const posts = visiblePosts(data).slice().sort(byDateDesc);
  const counts = {
    all: posts.length,
    technical: posts.filter((post) => post.topic === "technical").length,
    other: posts.filter((post) => post.topic === "other").length
  };

  setText("[data-blog-count]", format(uiValue("blog.count", lang) || "{n}", { n: posts.length }));

  const filterRoot = $("[data-blog-filter]");
  if (filterRoot) {
    const buttons = ["all", "technical", "other"].map((topic) => {
      const buttonEl = createEl("button", "filter__btn");
      buttonEl.type = "button";
      buttonEl.dataset.topic = topic;
      buttonEl.setAttribute("aria-pressed", String(topic === currentTopic));
      buttonEl.append(createEl("span", "", topicLabel(topic, data)));
      buttonEl.append(createEl("span", "filter__count", `(${counts[topic]})`));
      buttonEl.addEventListener("click", () => setTopic(topic));
      return buttonEl;
    });
    filterRoot.replaceChildren(createEl("span", "filter__label", data.ui.blog.filterTitle), ...buttons);
  }

  const list = $("[data-blog-list]");
  const empty = $("[data-blog-empty]");
  if (!list || !empty) return;

  const filtered = currentTopic === "all" ? posts : posts.filter((post) => post.topic === currentTopic);

  if (filtered.length === 0) {
    list.replaceChildren();
    list.hidden = true;
    empty.hidden = false;
    return;
  }

  list.hidden = false;
  empty.hidden = true;
  list.replaceChildren(...filtered.map((post, index) => postRow(post, index, data)));
}

function setTopic(topic) {
  currentTopic = topic;
  const params = new URLSearchParams(location.search);
  if (topic === "all") params.delete("topic");
  else params.set("topic", topic);
  const query = params.toString();
  history.pushState({ topic }, "", `${location.pathname}${query ? `?${query}` : ""}`);
  renderBlog(currentPageData, currentPageLang);
  $(`[data-blog-filter] .filter__btn[data-topic="${topic}"]`)?.focus();
}

function readTopicFromUrl() {
  const topic = new URLSearchParams(location.search).get("topic");
  return ["technical", "other"].includes(topic) ? topic : "all";
}

function renderFish(data) {
  const isLong = PAGE === "fish-blog";
  setText("[data-crumb-current]", isLong ? data.ui.fish.crumbLong : data.ui.fish.crumbNotes);
  setText("[data-fish-lead]", isLong ? data.fishBlog.lead : data.notes.lead);

  if (isLong) {
    const posts = [];
    for (const post of data.fishBlog.posts || []) {
      const source = findPostByUrl(data, post.url);
      if ((post.private || source?.private) && !isPrivateBlogUnlocked()) continue;
      posts.push({ ...source, ...post });
    }
    const list = $("[data-fish-list]");
    const empty = $("[data-fish-empty]");
    if (empty) {
      const p = empty.querySelector("p");
      if (p) p.textContent = data.fishBlog.emptyText;
    }
    if (!list) return;
    if (posts.length === 0) {
      list.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    list.replaceChildren(...posts.map((post, index) => postRow(post, index, data)));
    return;
  }

  const entries = data.notes.entries || [];
  const list = $("[data-notes-list]");
  const empty = $("[data-notes-empty]");
  setText("[data-notes-signature]", data.notes.signature);
  if (empty) {
    const p = empty.querySelector("p");
    if (p) p.textContent = data.notes.emptyText;
  }
  if (!list) return;

  if (entries.length === 0) {
    list.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  list.replaceChildren(...entries.map((entry) => {
    const item = createEl("article", "note-item");
    const meta = createEl("div", "note-item__meta");
    meta.append(createEl("time", "", entry.date));
    const source = createEl("a", "note-item__source", `${data.ui.fish.sourcePrefix}${entry.source}`);
    source.href = `https://www.bilibili.com/video/${entry.bv}/`;
    source.target = "_blank";
    source.rel = "noreferrer";
    meta.append(source);
    meta.append(createEl("span", "", entry.bv));
    item.append(meta);
    item.append(createEl("p", "note-item__text", entry.note));
    return item;
  }));
}

function renderAbout(data) {
  setText("[data-about-title]", data.about.title);
  setText("[data-about-lead]", data.about.lead);

  const entries = $("[data-about-entries]");
  if (entries) {
    entries.replaceChildren(
      button("works.html", data.nav.works),
      button("blog.html", data.nav.blog),
      button("contact.html", data.nav.contact)
    );
  }

  const body = $("[data-about-body]");
  if (body) body.replaceChildren(...splitParagraphs(data.about.body).map((text) => createEl("p", "", text)));
  setText("[data-about-quote]", data.about.quote);

  const timeline = $("[data-about-timeline]");
  if (timeline) {
    timeline.replaceChildren(...data.about.timeline.map((item) => {
      const li = createEl("li");
      li.append(createEl("time", "", item.year));
      li.append(createEl("p", "", item.text));
      return li;
    }));
  }

  const notes = $("[data-about-notes]");
  if (notes) notes.replaceChildren(...data.about.notes.map((text) => createEl("li", "", text)));
}

function renderContact(data) {
  setText("[data-contact-title]", data.contact.title);
  setText("[data-contact-intro]", data.contact.intro);
  setText("[data-contact-location]", data.contact.location);

  const email = $("[data-contact-email]");
  if (email) {
    email.textContent = data.contact.email;
    email.href = `mailto:${data.contact.email}`;
  }

  const socials = $("[data-contact-socials]");
  if (socials) {
    socials.replaceChildren(...data.contact.socials.map((item) => {
      const li = createEl("li");
      const link = createEl("a", "", item.label);
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      li.append(link);
      return li;
    }));
  }

  const collaboration = $("[data-contact-collaboration]");
  if (collaboration) collaboration.replaceChildren(...data.contact.collaboration.map((text) => createEl("li", "", text)));

  const entries = $("[data-contact-entries]");
  if (entries) entries.replaceChildren(button("works.html", data.nav.works), button("blog.html", data.nav.blog));
}

function button(href, label) {
  const link = createEl("a", "btn");
  link.href = href;
  link.append(createEl("span", "", `${label} →`));
  return link;
}

function renderPage(data, lang) {
  updateChrome(data, lang);
  if (ARTICLE_LANG) return;
  if (PAGE === "home") renderHome(data);
  if (PAGE === "works") renderWorks(data);
  if (PAGE === "blog") renderBlog(data, lang);
  if (PAGE === "about") renderAbout(data);
  if (PAGE === "contact") renderContact(data);
  if (PAGE === "fish-blog" || PAGE === "notes") renderFish(data);
}

let languageSwitchId = 0;
let switchingTimer = 0;

async function switchLanguage(lang) {
  const requestId = ++languageSwitchId;
  const nextLang = normalizeLang(lang);
  document.body.classList.add("is-switching");
  window.clearTimeout(switchingTimer);
  switchingTimer = window.setTimeout(() => {
    if (requestId === languageSwitchId) document.body.classList.remove("is-switching");
  }, 240);
  try {
    const data = await getData(nextLang);
    if (requestId !== languageSwitchId) return;
    currentPageData = data;
    currentPageLang = nextLang;
    currentTopic = readTopicFromUrl();
    updatePrivateBlogDialog(nextLang);
    renderPage(data, nextLang);
    localStorage.setItem("magazine-lang", nextLang);
    if (!ARTICLE_LANG) {
      const params = new URLSearchParams(location.search);
      params.set("lang", nextLang);
      history.replaceState(history.state, "", `${location.pathname}?${params.toString()}`);
    }
  } finally {
    if (requestId === languageSwitchId) {
      window.clearTimeout(switchingTimer);
      switchingTimer = window.setTimeout(() => {
        if (requestId === languageSwitchId) document.body.classList.remove("is-switching");
      }, 120);
    }
  }
}

function applyLanguage(lang) {
  const next = normalizeLang(lang);
  if (ARTICLE_LANG) {
    localStorage.setItem("magazine-lang", next);
    const target = $(`[data-lang="${next}"]`)?.dataset.langTarget;
    if (target) window.location.href = target;
    return;
  }
  switchLanguage(next);
}

function setupMenu() {
  const buttonEl = $("#menu-toggle");
  const panel = $("#menu-panel");
  if (!buttonEl || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    buttonEl.setAttribute("aria-expanded", String(open));
    const label = open ? uiValue("a11y.closeMenu") || "Close menu" : uiValue("a11y.menu") || "Menu";
    buttonEl.setAttribute("aria-label", label);
    const text = $(".menu-toggle__text", buttonEl);
    if (text) text.textContent = label;
    if (open) $("#menu-panel a")?.focus();
  };

  buttonEl.addEventListener("click", () => setOpen(panel.hidden));
  panel.addEventListener("click", (event) => {
    if (event.target.closest("[data-lang]")) {
      setOpen(false);
      buttonEl.focus();
    }
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      buttonEl.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      buttonEl.focus();
    }
  });
  document.addEventListener("mousedown", (event) => {
    if (panel.hidden) return;
    if (!panel.contains(event.target) && !buttonEl.contains(event.target)) setOpen(false);
  });
  setOpen(false);
}

function setupLangMenu() {
  const buttonEl = $("#lang-button");
  const panel = $("#lang-panel");
  if (!buttonEl || !panel) return;

  const setOpen = (open) => {
    panel.hidden = !open;
    buttonEl.setAttribute("aria-expanded", String(open));
    if (open) $("button", panel)?.focus();
  };

  buttonEl.addEventListener("click", () => setOpen(panel.hidden));
  panel.addEventListener("click", (event) => {
    if (event.target.closest("[data-lang]")) {
      setOpen(false);
      buttonEl.focus();
    }
  });
  panel.addEventListener("keydown", (event) => {
    const items = $all("button", panel);
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      setOpen(false);
      buttonEl.focus();
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
    if (!panel.contains(event.target) && !buttonEl.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      buttonEl.focus();
    }
  });
  setOpen(false);
}

function observeReveals() {
  const items = $all(".reveal:not(.is-observed)");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => {
    item.classList.add("is-observed");
    observer.observe(item);
  });
}

let progressFrame = 0;

function updateProgress() {
  progressFrame = 0;
  const progress = $(".reading-progress span");
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max <= 0 ? 0 : (window.scrollY / max) * 100;
  progress.style.transform = `scaleX(${Math.min(100, Math.max(0, value)) / 100})`;
}

function scheduleProgressUpdate() {
  if (progressFrame) return;
  progressFrame = window.requestAnimationFrame(updateProgress);
}

async function init() {
  currentTopic = readTopicFromUrl();
  if (PAGE === "blog" && !ARTICLE_LANG) initPrivateBlogAccess(getInitialLang());
  else currentPageLang = getInitialLang();

  $all("[data-lang]").forEach((buttonEl) => {
    buttonEl.addEventListener("click", () => applyLanguage(buttonEl.dataset.lang));
  });
  setupMenu();
  setupLangMenu();

  window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
  window.addEventListener("resize", scheduleProgressUpdate);
  window.addEventListener("popstate", () => {
    if (PAGE === "blog" && !ARTICLE_LANG) {
      currentTopic = readTopicFromUrl();
      renderBlog(currentPageData, currentPageLang);
    }
  });

  observeReveals();
  document.body.classList.add("is-ready");
  await switchLanguage(getInitialLang());
  scheduleProgressUpdate();
}

init().catch((error) => {
  console.error(error);
  document.body.classList.add("is-ready");
  observeReveals();
  scheduleProgressUpdate();
});
