#!/usr/bin/env node
/**
 * 把 UX 优化需要的常规文案与少量结构化字段写进三份正式语言 JSON。
 * 只增补，不改已有公开内容（标题、摘要、正文、日期、链接、札记、私密标记）。
 *
 * 运行：node _bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/tools/prepare-production-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..", "..", "..", "..");
const LANGS = ["zh", "en", "ja"];

const NAV = {
  zh: { home: "首页", about: "关于我", works: "项目", blog: "博客", contact: "联系", notes: "札记" },
  en: { home: "Home", about: "About", works: "Projects", blog: "Blog", contact: "Contact", notes: "Notes" },
  ja: { home: "ホーム", about: "私について", works: "プロジェクト", blog: "ブログ", contact: "お問い合わせ", notes: "ノート" },
};

const UI = {
  zh: {
    a11y: {
      skip: "跳到正文",
      primaryNav: "主要导航",
      footerNav: "页脚主要页面",
      language: "语言",
      menu: "菜单",
      closeMenu: "关闭菜单",
      opensExternal: "在新标签页打开外部网站",
    },
    menu: { title: "网站导航", language: "语言" },
    footer: { title: "主要页面" },
    home: {
      ctaWorks: "查看项目",
      ctaBlog: "阅读博客",
      projectsAll: "查看全部项目",
      techTitle: "技术文章",
      techLead: "关于 AI、Agent 与工具制作的长文。",
      techAll: "查看全部博客",
      moreTitle: "近期文章",
      aboutTitle: "关于我",
      aboutCta: "关于我",
      contactCta: "联系我",
      portraitAlt: "阿川的黑白人像",
    },
    about: {
      kicker: "简介",
      entriesTitle: "先看这些",
      entriesLead: "从这里看项目、读文章，或直接联系我。",
      bodyTitle: "介绍",
      timelineTitle: "时间线",
      timelineLead: "学习与研究经历。",
    },
    contact: {
      kicker: "尾页",
      directTitle: "直接联系",
      directLead: "写信、约时间，或先看看我在做什么。",
      nextTitle: "也可以先看这些",
      nextLead: "还没想好说什么？可以先看项目或博客。",
      emailLabel: "邮箱",
      locationLabel: "所在地",
      socialLabel: "社交",
      collaborationLabel: "合作方向",
    },
    works: {
      kicker: "Portfolio notes",
      lead: "天马行空 + AI能力 = 无限可能",
      indexTitle: "项目索引",
      indexHint: "选择名称直接跳到项目介绍",
      openApp: "打开应用",
      openSite: "访问网站",
      externalNote: "在新标签页打开外部网站",
    },
    blog: {
      kicker: "Web Journal",
      listTitle: "全部公开文章",
      count: "{n} 篇公开文章",
      fishTitle: "鱼的文字",
      fishSub: "长文与日常札记",
      fishLead: "鱼的长文与短札记集中在同一个空间。",
      fishCta: "进入鱼的文字",
      filterTitle: "按主题筛选",
      filterHint: "按主题缩小范围。",
      all: "全部",
      technical: "技术实践",
      other: "其他主题",
      emptyTitle: "没有符合条件的文章",
      emptyBody: "这个主题下暂时没有文章。你可以回到全部文章继续阅读。",
      emptyCta: "查看全部文章",
      authorLabel: "作者",
      read: "阅读文章",
    },
    fish: {
      spaceTitle: "鱼的文字",
      spaceSub: "长文与日常札记",
      tabLong: "鱼的博客",
      tabLongSub: "长文",
      tabNotes: "鱼的札记",
      tabNotesSub: "日常札记",
      backBlog: "返回全部博客",
      crumbBlog: "博客",
      crumbSpace: "鱼的文字",
      crumbLong: "长文",
      crumbNotes: "札记",
      longSection: "长文",
      longHint: "长文写在「鱼的博客」；短的都进札记。",
      notesSection: "札记",
      notesHint: "每条只写：看到的那句话，和我因此改掉的判断。",
      sourcePrefix: "在 B 站看：",
      nextNotes: "接下来：鱼的札记",
      nextLong: "回到长文",
      count: "{longs} 篇长文 · {notes} 条札记",
    },
    article: {
      crumb: "文章",
      toc: "本文目录",
      back: "返回博客",
      continueTitle: "继续阅读",
      continueLead: "继续读几篇相关文章。",
      noRelated: "暂无其他公开文章。",
    },
  },
  en: {
    a11y: {
      skip: "Skip to content",
      primaryNav: "Primary navigation",
      footerNav: "Footer main pages",
      language: "Language",
      menu: "Menu",
      closeMenu: "Close menu",
      opensExternal: "Opens an external site in a new tab",
    },
    menu: { title: "Site navigation", language: "Language" },
    footer: { title: "Main pages" },
    home: {
      ctaWorks: "View projects",
      ctaBlog: "Read the blog",
      projectsAll: "View all projects",
      techTitle: "Technical writing",
      techLead: "Long pieces on AI, agents, and tool-making.",
      techAll: "View all articles",
      moreTitle: "Recent articles",
      aboutTitle: "About me",
      aboutCta: "About me",
      contactCta: "Contact",
      portraitAlt: "Black and white portrait of Agawa",
    },
    about: {
      kicker: "Profile",
      entriesTitle: "Start here",
      entriesLead: "See the projects, read the writing, or get in touch.",
      bodyTitle: "Introduction",
      timelineTitle: "Timeline",
      timelineLead: "Study and research background.",
    },
    contact: {
      kicker: "Back page",
      directTitle: "Direct contact",
      directLead: "Write to me, or start with what I have been making.",
      nextTitle: "Before you write",
      nextLead: "Not sure what to say yet? Start with the projects or the blog.",
      emailLabel: "Email",
      locationLabel: "Location",
      socialLabel: "Social",
      collaborationLabel: "Collaboration",
    },
    works: {
      kicker: "Portfolio notes",
      lead: "Imagination + AI power = infinite possibilities.",
      indexTitle: "Project index",
      indexHint: "Choose a name to jump to its introduction",
      openApp: "Open the app",
      openSite: "Visit the site",
      externalNote: "Opens an external site in a new tab",
    },
    blog: {
      kicker: "Web Journal",
      listTitle: "All public articles",
      count: "{n} public articles",
      fishTitle: "Fish's Writing",
      fishSub: "Long pieces and daily notes",
      fishLead: "The fish's long pieces and short notes live in one space.",
      fishCta: "Enter Fish's Writing",
      filterTitle: "Filter by topic",
      filterHint: "Narrow the list by topic.",
      all: "All",
      technical: "Technical practice",
      other: "Other topics",
      emptyTitle: "No articles match",
      emptyBody: "There are no articles under this topic yet. You can go back to all articles.",
      emptyCta: "View all articles",
      authorLabel: "Author",
      read: "Read article",
    },
    fish: {
      spaceTitle: "Fish's Writing",
      spaceSub: "Long pieces and daily notes",
      tabLong: "fish.blog",
      tabLongSub: "Long pieces",
      tabNotes: "Fish Notes",
      tabNotesSub: "Daily notes",
      backBlog: "Back to all posts",
      crumbBlog: "Blog",
      crumbSpace: "Fish's Writing",
      crumbLong: "Long pieces",
      crumbNotes: "Notes",
      longSection: "Long pieces",
      longHint: "Long pieces live in fish.blog; the short ones become notes.",
      notesSection: "Notes",
      notesHint: "Each note records the line I saw and the judgement it changed.",
      sourcePrefix: "On Bilibili: ",
      nextNotes: "Next: Fish Notes",
      nextLong: "Back to long pieces",
      count: "{longs} long-form · {notes} notes",
    },
    article: {
      crumb: "Article",
      toc: "On this page",
      back: "Back to blog",
      continueTitle: "Continue reading",
      continueLead: "A few more articles to read next.",
      noRelated: "No other public articles yet.",
    },
  },
  ja: {
    a11y: {
      skip: "本文へスキップ",
      primaryNav: "メインナビゲーション",
      footerNav: "フッターの主要ページ",
      language: "言語",
      menu: "メニュー",
      closeMenu: "メニューを閉じる",
      opensExternal: "外部サイトを新しいタブで開きます",
    },
    menu: { title: "サイト内ナビゲーション", language: "言語" },
    footer: { title: "主なページ" },
    home: {
      ctaWorks: "プロジェクトを見る",
      ctaBlog: "ブログを読む",
      projectsAll: "すべてのプロジェクトを見る",
      techTitle: "技術記事",
      techLead: "AI、Agent、ツール制作についての長文。",
      techAll: "すべての記事を見る",
      moreTitle: "最近の記事",
      aboutTitle: "私について",
      aboutCta: "私について",
      contactCta: "お問い合わせ",
      portraitAlt: "阿川のモノクロ肖像",
    },
    about: {
      kicker: "プロフィール",
      entriesTitle: "まずはこちら",
      entriesLead: "プロジェクトを見る、記事を読む、連絡する。",
      bodyTitle: "紹介",
      timelineTitle: "年譜",
      timelineLead: "学びと研究の経歴。",
    },
    contact: {
      kicker: "巻末",
      directTitle: "直接の連絡先",
      directLead: "メールで連絡するか、制作物からどうぞ。",
      nextTitle: "先に見るなら",
      nextLead: "まだ決めていなければ、プロジェクトかブログから。",
      emailLabel: "メール",
      locationLabel: "所在地",
      socialLabel: "ソーシャル",
      collaborationLabel: "協働領域",
    },
    works: {
      kicker: "Portfolio notes",
      lead: "発想力 + AIの力 = 無限の可能性",
      indexTitle: "プロジェクト索引",
      indexHint: "名前を選ぶと紹介へ移動します",
      openApp: "アプリを開く",
      openSite: "サイトを見る",
      externalNote: "外部サイトを新しいタブで開きます",
    },
    blog: {
      kicker: "Web Journal",
      listTitle: "公開記事一覧",
      count: "{n} 件の公開記事",
      fishTitle: "魚の文字",
      fishSub: "長文と日々のノート",
      fishLead: "魚の長文と短いノートは同じ場所にまとまっています。",
      fishCta: "魚の文字へ",
      filterTitle: "テーマで絞り込む",
      filterHint: "テーマで絞り込めます。",
      all: "すべて",
      technical: "技術実践",
      other: "その他のテーマ",
      emptyTitle: "条件に合う記事がありません",
      emptyBody: "このテーマの記事はまだありません。すべての記事に戻って読み続けられます。",
      emptyCta: "すべての記事を見る",
      authorLabel: "作者",
      read: "記事を読む",
    },
    fish: {
      spaceTitle: "魚の文字",
      spaceSub: "長文と日々のノート",
      tabLong: "魚のblog",
      tabLongSub: "長文",
      tabNotes: "魚のノート",
      tabNotesSub: "日々のノート",
      backBlog: "すべての記事に戻る",
      crumbBlog: "ブログ",
      crumbSpace: "魚の文字",
      crumbLong: "長文",
      crumbNotes: "ノート",
      longSection: "長文",
      longHint: "長文は「魚のblog」に、短いものはノートに入ります。",
      notesSection: "ノート",
      notesHint: "一つずつ「見た言葉」と「それで変わった判断」だけを書きます。",
      sourcePrefix: "Bilibili で見た：",
      nextNotes: "次へ：魚のノート",
      nextLong: "長文に戻る",
      count: "長文 {longs} 本 ・ ノート {notes} 件",
    },
    article: {
      crumb: "記事",
      toc: "この記事の目次",
      back: "ブログに戻る",
      continueTitle: "続けて読む",
      continueLead: "続けて読みたい記事。",
      noRelated: "ほかに公開記事はありません。",
    },
  },
};

const TOPIC = {
  "blog-october-2026": "technical",
  "blog-acting-human": "other",
  "blog-prose-agent-framework": "technical",
  "blog-forward-deployed-engineer": "other",
  "blog-sensitive-to-perceptive": "other",
};

const ID = {
  "blog-october-2026": "october-2026",
  "blog-acting-human": "acting-human",
  "blog-prose-agent-framework": "prose-agent-framework",
  "blog-forward-deployed-engineer": "forward-deployed-engineer",
  "blog-sensitive-to-perceptive": "sensitive-to-perceptive",
};

const ACTIONS = {
  "heart-haven": "app",
  "jaist-shuttle-next": "app",
  "sakura-festival-website": "site",
};

for (const lang of LANGS) {
  const file = path.join(SITE, "assets/data", `site.${lang}.json`);
  const before = JSON.parse(fs.readFileSync(file, "utf8"));
  const counts = {
    works: before.works.length,
    posts: before.blog.posts.length,
    fishBlogPosts: before.fishBlog.posts.length,
    notes: before.notes.entries.length,
    timeline: before.about.timeline.length,
  };

  before.nav = { ...before.nav, ...NAV[lang] };
  before.ui = { ...(before.ui || {}), ...UI[lang] };

  for (const work of before.works) {
    work.action = ACTIONS[work.id];
  }

  for (const post of before.blog.posts) {
    const base = post.url.replace(/\.html$/, "").replace(/-(en|ja)$/, "");
    post.id = ID[base] || base;
    post.topic = TOPIC[base] || "other";
    if (base === "blog-acting-human") post.author = "fish";
  }

  for (const post of before.fishBlog.posts) {
    const base = post.url.replace(/\.html$/, "").replace(/-(en|ja)$/, "");
    post.id = ID[base] || base;
    if (base === "blog-acting-human") post.author = "fish";
  }

  const after = before;
  if (
    after.works.length !== counts.works ||
    after.blog.posts.length !== counts.posts ||
    after.fishBlog.posts.length !== counts.fishBlogPosts ||
    after.notes.entries.length !== counts.notes ||
    after.about.timeline.length !== counts.timeline
  ) {
    throw new Error(`content counts changed for ${lang}`);
  }

  fs.writeFileSync(file, JSON.stringify(after, null, 2) + "\n", "utf8");
  console.log(`${lang}: works=${counts.works} posts=${counts.posts} fish=${counts.fishBlogPosts} notes=${counts.notes}`);
}
