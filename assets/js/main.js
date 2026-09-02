const SUPPORTED_LANGS = ["zh", "en", "ja"];
const DATA_VERSION = "works-sakura-20260831";
const PAGE = document.body.dataset.page || "home";
const ARTICLE_LANG = document.body.dataset.articleLang;
const PRIVATE_BLOG_PASSWORD_HASH = "8e0c19142ee61342e1f8b09a6fccbcf5867db1542444474ed37ad11bd08eb062";
const PRIVATE_BLOG_SESSION_KEY = "agawa-private-blog-unlocked";
const PRIVATE_BLOG_TRIGGER_WINDOW = 1000;

const UI = {
  zh: {
    issue: "Issue 01 / Notes from Agawa",
    folio: "Vol. 01",
    season: "20260509",
    format: "自我介绍",
    contentsKicker: "Contents",
    contentsTitle: "目录",
    selectedKicker: "Selected works",
    profileKicker: "Profile",
    portraitCaption: "我问了一下AI，我是怎样一个人？",
    marginalia: "边注",
    chronologyKicker: "Chronology",
    chronologyTitle: "时间线",
    portfolioKicker: "Portfolio notes",
    portfolioLead: "天马行空 + AI能力 = 无限可能",
    blogKicker: "Web Journal",
    blogTopics: "Topics",
    blogIndex: "Web articles",
    backPage: "Back page",
    deskCaption: "信件、札记与开放的沟通方式。",
    emailLabel: "邮箱",
    locationLabel: "所在地",
    socialLabel: "社交链接",
    collaborationLabel: "可合作方向",
    tocDescriptions: {
      home: "",
      about: "",
      works: "",
      blog: "",
      contact: ""
    }
  },
  en: {
    issue: "Issue 01 / Notes from Agawa",
    folio: "Vol. 01",
    season: "20260509",
    format: "self-introduction",
    contentsKicker: "Contents",
    contentsTitle: "Table of Contents",
    selectedKicker: "Selected works",
    profileKicker: "Profile",
    portraitCaption: "I asked AI what kind of person I am.",
    marginalia: "Marginalia",
    chronologyKicker: "Chronology",
    chronologyTitle: "Chronology",
    portfolioKicker: "Portfolio notes",
    portfolioLead: "Imagination + AI power = infinite possibilities.",
    blogKicker: "Web Journal",
    blogTopics: "Topics",
    blogIndex: "Web articles",
    backPage: "Back page",
    deskCaption: "Letters, notes, and open channels.",
    emailLabel: "Email",
    locationLabel: "Location",
    socialLabel: "Social",
    collaborationLabel: "Collaboration",
    tocDescriptions: {
      home: "",
      about: "",
      works: "",
      blog: "",
      contact: ""
    }
  },
  ja: {
    issue: "Issue 01 / Notes from Agawa",
    folio: "Vol. 01",
    season: "20260509",
    format: "自己紹介",
    contentsKicker: "Contents",
    contentsTitle: "目次",
    selectedKicker: "Selected works",
    profileKicker: "Profile",
    portraitCaption: "自分がどんな人かAIに聞いてみると",
    marginalia: "欄外メモ",
    chronologyKicker: "Chronology",
    chronologyTitle: "年譜",
    portfolioKicker: "Portfolio notes",
    portfolioLead: "発想力 + AIの力 = 無限の可能性",
    blogKicker: "Web Journal",
    blogTopics: "Topics",
    blogIndex: "Web articles",
    backPage: "Back page",
    deskCaption: "手紙、ノート、開かれた連絡先。",
    emailLabel: "メール",
    locationLabel: "所在地",
    socialLabel: "ソーシャル",
    collaborationLabel: "協働領域",
    tocDescriptions: {
      home: "",
      about: "",
      works: "",
      blog: "",
      contact: ""
    }
  }
};

const LINK_LABELS = {
  zh: "查看项目",
  en: "View project",
  ja: "プロジェクトを見る"
};

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
  if (target) target.textContent = value || "";
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
  if (text) element.textContent = text;
  return element;
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
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
      if (PAGE === "blog" && !ARTICLE_LANG && currentPageData) renderBlog(currentPageData);
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

function getInitialLang() {
  if (SUPPORTED_LANGS.includes(ARTICLE_LANG)) return ARTICLE_LANG;
  const stored = localStorage.getItem("magazine-lang");
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return normalizeLang(browserLang);
}

function updateChrome(data, lang) {
  document.documentElement.lang = lang;
  if (!ARTICLE_LANG) document.title = `${data.nav[PAGE]} · Achuan`;
  $all("[data-nav]").forEach((item) => {
    const key = item.dataset.nav;
    item.textContent = data.nav[key];
    if (key === PAGE) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  $all("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  });
  $all("[data-ui]").forEach((node) => {
    const key = node.dataset.ui;
    if (UI[lang][key]) node.textContent = UI[lang][key];
  });
  setText("[data-footer-text]", data.footer.text);
  setText("[data-footer-copyright]", data.footer.copyright);
}

function renderHome(data, lang) {
  setText("[data-home-title]", data.home.title);
  setText("[data-home-subtitle]", data.home.subtitle);
  setText("[data-home-intro]", data.home.intro);
  setText("[data-home-featured-title]", data.home.featuredWorksTitle);
  setText("[data-home-caption]", data.works[0]?.caption || "");

  const toc = $("[data-toc]");
  if (toc) {
    toc.replaceChildren();
    ["home", "about", "works", "blog", "contact"].forEach((key, index) => {
      const item = document.createElement("a");
      item.className = "toc-item";
      item.href = key === "home" ? "index.html" : `${key}.html`;
      item.innerHTML = `
        <span class="toc-number">${String(index + 1).padStart(2, "0")}</span>
        <strong>${data.nav[key]}</strong>
        <span>${UI[lang].tocDescriptions[key]}</span>
      `;
      toc.append(item);
    });
  }

  const featured = $("[data-featured-works]");
  if (featured) {
    featured.replaceChildren();
    data.works.slice(0, 3).forEach((work, index) => {
      const item = document.createElement("a");
      item.className = "featured-item";
      item.href = `works.html#${work.id}`;
      item.innerHTML = `
        <img src="${work.image}" alt="" width="1200" height="1500" loading="lazy" fetchpriority="low" decoding="async">
        <div>
          <p class="meta-line">No. ${String(index + 1).padStart(2, "0")} / ${work.year} / ${work.medium}</p>
          <h3>${work.title}</h3>
          <p>${work.summary}</p>
        </div>
      `;
      featured.append(item);
    });
  }
}

function renderAbout(data) {
  setText("[data-about-title]", data.about.title);
  setText("[data-about-lead]", data.about.lead);
  setText("[data-about-quote]", data.about.quote);

  const body = $("[data-about-body]");
  if (body) {
    body.replaceChildren(...splitParagraphs(data.about.body).map((text) => createEl("p", "", text)));
  }

  const notes = $("[data-about-notes]");
  if (notes) {
    notes.replaceChildren(...data.about.notes.map((text) => createEl("li", "", text)));
  }

  const timeline = $("[data-about-timeline]");
  if (timeline) {
    timeline.replaceChildren(
      ...data.about.timeline.map((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<time>${item.year}</time><p>${item.text}</p>`;
        return li;
      })
    );
  }
}

function renderWorks(data) {
  setText("[data-works-title]", data.nav.works);
  const list = $("[data-works-list]");
  if (!list) return;
  list.replaceChildren();

  data.works.forEach((work, index) => {
    const article = document.createElement("article");
    article.className = "work-entry reveal";
    article.id = work.id;

    const links = Array.isArray(work.links) && work.links.length
      ? `<div class="work-links">${work.links.map((link) => {
          const normalized = typeof link === "string"
            ? { url: link, label: LINK_LABELS[document.documentElement.lang] || LINK_LABELS.zh }
            : link;
          return `<a href="${normalized.url}" target="_blank" rel="noreferrer">${normalized.label}</a>`;
        }).join("")}</div>`
      : "";

    article.innerHTML = `
      <span class="work-number">No. ${String(index + 1).padStart(2, "0")}</span>
      <figure>
        <img src="${work.image}" alt="" width="1500" height="1200" loading="lazy">
        <figcaption>${work.caption}</figcaption>
      </figure>
      <div class="work-copy">
        <div>
          <h2>${work.title}</h2>
          <p class="summary">${work.summary}</p>
          <p class="body-copy">${work.body}</p>
          ${work.quote ? `<blockquote>${work.quote}</blockquote>` : ""}
          ${links}
        </div>
        <aside class="work-meta">
          <p>${work.year}</p>
          <p>${work.medium}</p>
          ${work.credits ? `<p>${work.credits}</p>` : ""}
          <p>${work.id}</p>
        </aside>
      </div>
    `;
    list.append(article);
  });
  observeReveals();
}

function renderBlog(data) {
  setText("[data-blog-title]", data.blog.title);
  setText("[data-blog-lead]", data.blog.lead);
  setText("[data-blog-index-title]", data.blog.indexTitle);

  const topics = $("[data-blog-topics]");
  if (topics) {
    topics.replaceChildren(
      ...data.blog.topics.map((topic, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="toc-number">${String(index + 1).padStart(2, "0")}</span>
          <strong>${topic}</strong>
        `;
        return li;
      })
    );
  }

  const list = $("[data-blog-list]");
  if (!list) return;
  list.replaceChildren();

  const posts = Array.isArray(data.blog.posts)
    ? data.blog.posts.filter((post) => !post.private || isPrivateBlogUnlocked())
    : [];

  if (posts.length === 0) {
    const empty = document.createElement("article");
    empty.className = "blog-empty";
    empty.innerHTML = `
      <span class="blog-number">00</span>
      <div>
        <h3>${data.blog.emptyTitle}</h3>
        <p>${data.blog.emptyText}</p>
      </div>
    `;
    list.append(empty);
    return;
  }

  posts.forEach((post, index) => {
    const item = document.createElement(post.url ? "a" : "article");
    item.className = "blog-entry reveal";
    if (post.url) item.href = post.url;
    item.innerHTML = `
      <span class="blog-number">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <p class="meta-line">${post.date} / ${post.category}</p>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
      </div>
    `;
    list.append(item);
  });
  observeReveals();
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
    socials.replaceChildren(
      ...data.contact.socials.map((item) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = item.url;
        link.textContent = item.label;
        link.rel = "noreferrer";
        link.target = item.url.startsWith("mailto:") ? "_self" : "_blank";
        li.append(link);
        return li;
      })
    );
  }

  const collaboration = $("[data-contact-collaboration]");
  if (collaboration) {
    collaboration.replaceChildren(...data.contact.collaboration.map((text) => createEl("li", "", text)));
  }
}

function renderPage(data, lang) {
  updateChrome(data, lang);
  if (PAGE === "home") renderHome(data, lang);
  if (PAGE === "about") renderAbout(data);
  if (PAGE === "works") renderWorks(data);
  if (PAGE === "blog") renderBlog(data);
  if (PAGE === "contact") renderContact(data);
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
    updatePrivateBlogDialog(nextLang);
    renderPage(data, nextLang);
    localStorage.setItem("magazine-lang", nextLang);
  } finally {
    if (requestId === languageSwitchId) {
      window.clearTimeout(switchingTimer);
      switchingTimer = window.setTimeout(() => {
        if (requestId === languageSwitchId) document.body.classList.remove("is-switching");
      }, 120);
    }
  }
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
  const ratio = Math.min(100, Math.max(0, value)) / 100;
  progress.style.transform = `scaleX(${ratio})`;
}

function scheduleProgressUpdate() {
  if (progressFrame) return;
  progressFrame = window.requestAnimationFrame(updateProgress);
}

async function init() {
  if (PAGE === "blog") initPrivateBlogAccess(getInitialLang());
  $all("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.langTarget) {
        localStorage.setItem("magazine-lang", normalizeLang(button.dataset.lang));
        window.location.href = button.dataset.langTarget;
        return;
      }
      switchLanguage(button.dataset.lang);
    });
  });
  window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
  window.addEventListener("resize", scheduleProgressUpdate);

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
