const SUPPORTED_LANGS = ["zh", "en", "ja"];
const PAGE = document.body.dataset.page || "home";

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

const dataCache = new Map();

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
  const response = await fetch(`assets/data/site.${lang}.json`);
  if (!response.ok) throw new Error(`Could not load language data: ${lang}`);
  const data = await response.json();
  dataCache.set(lang, data);
  return data;
}

function normalizeLang(value) {
  return SUPPORTED_LANGS.includes(value) ? value : "zh";
}

function getInitialLang() {
  const stored = localStorage.getItem("magazine-lang");
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  const browserLang = navigator.language.slice(0, 2);
  return normalizeLang(browserLang);
}

function updateChrome(data, lang) {
  document.documentElement.lang = lang;
  document.title = `${data.nav[PAGE]} · Achuan`;
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
        <img src="${work.image}" alt="" width="1200" height="1500" loading="${index === 0 ? "eager" : "lazy"}">
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

  if (!Array.isArray(data.blog.posts) || data.blog.posts.length === 0) {
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

  data.blog.posts.forEach((post, index) => {
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

async function switchLanguage(lang) {
  const nextLang = normalizeLang(lang);
  document.body.classList.add("is-switching");
  const data = await getData(nextLang);
  renderPage(data, nextLang);
  localStorage.setItem("magazine-lang", nextLang);
  window.setTimeout(() => document.body.classList.remove("is-switching"), 120);
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

function updateProgress() {
  const progress = $(".reading-progress span");
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max <= 0 ? 0 : (window.scrollY / max) * 100;
  progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
}

async function init() {
  $all("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => switchLanguage(button.dataset.lang));
  });
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  await switchLanguage(getInitialLang());
  observeReveals();
  updateProgress();
  document.body.classList.add("is-ready");
}

init().catch((error) => {
  console.error(error);
  document.body.classList.add("is-ready");
});
