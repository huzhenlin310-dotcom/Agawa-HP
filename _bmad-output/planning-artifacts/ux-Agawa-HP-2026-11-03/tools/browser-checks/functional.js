/**
 * 功能断言（在 DSH 浏览器里跑，不是 Node 脚本）
 *
 * 运行方式：把本文件内容作为 bcdp_script 的 script 参数执行；需先启动本地服务器并打开任意原型页。
 * 结果：14/14 通过（2026-11-03，最终版）。
 */
const BASE = "http://127.0.0.1:8137/_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/prototype/";
const results = [];
const record = (name, pass, detail) => results.push({ name, pass: Boolean(pass), detail });
const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
};

await go("index.html?lang=zh");
record(
  "首页：三项目卡 + 技术 2 + 其他 2，且无札记区",
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 800));
    return (
      document.querySelectorAll("#home-projects .work-card").length === 3 &&
      document.querySelectorAll("#home-technical .post-row").length === 2 &&
      document.querySelectorAll("#home-more .post-row").length === 2 &&
      !document.querySelector("[data-notes]") &&
      [...document.images].every((img) => img.complete && img.naturalWidth > 0)
    );
  })
);
record(
  "首页：双入口同屏",
  await page.evaluate(() =>
    [...document.querySelectorAll(".hero__cta .btn")]
      .map((node) => node.textContent.replace(/\s+/g, " ").trim())
      .join("|") === "查看项目 →|阅读博客 →"
  )
);

await go("blog.html?lang=zh");
const blog = await page.evaluate(async () => {
  const firstRow = document.querySelector("#blog-list .post-row").getBoundingClientRect();
  document.querySelector('.filter__btn[data-topic="technical"]').click();
  await new Promise((r) => setTimeout(r, 150));
  const tech = {
    rows: document.querySelectorAll("#blog-list .post-row").length,
    url: location.search,
    empty: getComputedStyle(document.getElementById("blog-empty")).display,
  };
  document.querySelector('.filter__btn[data-topic="all"]').click();
  await new Promise((r) => setTimeout(r, 150));
  return {
    firstRowTop: Math.round(firstRow.top),
    viewport: innerHeight,
    tech,
    all: document.querySelectorAll("#blog-list .post-row").length,
    authors: [...document.querySelectorAll(".post-row__author")].map((n) => n.textContent.trim()),
  };
});
record("博客：首屏可见第一篇文章（1280×800）", blog.firstRowTop < blog.viewport, { firstRowTop: blog.firstRowTop, viewport: blog.viewport });
record(
  "博客：筛选 2 篇并写 URL；全部恢复 5 篇",
  blog.tech.rows === 2 && blog.tech.url.includes("topic=technical") && blog.tech.empty === "none" && blog.all === 5,
  blog.tech
);
record("博客：作者含鱼且仅一篇", blog.authors.filter((name) => name.includes("鱼")).length === 1, blog.authors);

await go("blog.html?lang=zh&topic=__none__");
record(
  "无结果状态可见且标题正确",
  await page.evaluate(
    () =>
      getComputedStyle(document.getElementById("blog-empty")).display !== "none" &&
      document.getElementById("blog-list").hidden &&
      document.getElementById("blog-empty-title").textContent === "没有符合条件的文章"
  )
);

await go("article.html?post=acting-human&lang=zh");
const article = await page.evaluate(async () => {
  const links = [...document.querySelectorAll("#toc-desktop ol a")];
  links[2].click();
  await new Promise((r) => setTimeout(r, 400));
  return {
    toc: links.length,
    hash: location.hash,
    covered: document.getElementById("sec-3").getBoundingClientRect().top < document.querySelector(".site-head").getBoundingClientRect().height,
    missing: getComputedStyle(document.getElementById("article-missing")).display,
    related: document.querySelectorAll("#article-related a").length,
    author: document.getElementById("article-author").textContent,
    back: document.getElementById("article-back").getAttribute("href"),
  };
});
record("文章：目录 6 条、锚点不被遮挡、无“未找到”区块", article.toc === 6 && article.hash === "#sec-3" && !article.covered && article.missing === "none", article);
record("文章：继续阅读 2 篇、作者鱼、返回博客", article.related === 2 && article.author === "鱼" && article.back.includes("blog.html"), article);

await go("fish-blog.html?lang=zh");
record(
  "鱼的文字：三级位置、长文当前、可切札记、空态隐藏",
  await page.evaluate(
    () =>
      [...document.querySelectorAll(".crumbs li")].map((n) => n.textContent.trim()).join("›") === "博客›鱼的文字›长文" &&
      document.getElementById("fish-tab-long").getAttribute("aria-current") === "page" &&
      document.querySelector(".space-next .btn").getAttribute("href").includes("notes.html") &&
      getComputedStyle(document.getElementById("fish-long-empty")).display === "none"
  )
);

await go("notes.html?lang=zh");
record(
  "札记：3 条、当前札记、署名",
  await page.evaluate(
    () =>
      document.querySelectorAll(".note-item").length === 3 &&
      document.getElementById("fish-tab-notes").getAttribute("aria-current") === "page" &&
      document.getElementById("fish-notes-signature").textContent === "你的鱼"
  )
);

await go("works.html?lang=zh");
const works = await page.evaluate(async () => {
  document.querySelectorAll("#work-index-list a")[1].click();
  await new Promise((r) => setTimeout(r, 400));
  return {
    index: document.querySelectorAll("#work-index-list a").length,
    actions: [...document.querySelectorAll(".work-entry__actions a")].map((a) => a.textContent.replace("↗", "").trim()).join("|"),
    headingTop: Math.round(document.querySelector("#jaist-shuttle-next .work-entry__title").getBoundingClientRect().top),
    headerH: Math.round(document.querySelector(".site-head").getBoundingClientRect().height),
    sticky: getComputedStyle(document.querySelector(".site-head")).position,
  };
});
record(
  "项目：索引 3 项、入口文字区分、锚点不遮挡、头部 sticky",
  works.index === 3 && works.actions === "打开应用|打开应用|访问网站" && works.headingTop > works.headerH && works.sticky === "sticky",
  works
);

await go("about.html?lang=zh");
record("关于：介绍后 3 个去向", await page.evaluate(() => document.querySelectorAll("#about-entries a").length === 3));

await go("contact.html?lang=zh");
record(
  "联系：邮箱 mailto + 2 个去向",
  await page.evaluate(
    () => document.getElementById("contact-email").getAttribute("href").startsWith("mailto:") && document.querySelectorAll("#contact-entries a").length === 2
  )
);

await go("index.html?lang=zh&simulateDataError=1");
record(
  "数据失败：错误可见 + 重试 + 导航可用",
  await page.evaluate(
    () =>
      getComputedStyle(document.getElementById("data-error")).display !== "none" &&
      Boolean(document.querySelector("#data-error button")) &&
      document.querySelectorAll(".desk-nav a").length === 5
  )
);

console.log(JSON.stringify({ total: results.length, failed: results.filter((r) => !r.pass).map((r) => r.name), results }, null, 1));
