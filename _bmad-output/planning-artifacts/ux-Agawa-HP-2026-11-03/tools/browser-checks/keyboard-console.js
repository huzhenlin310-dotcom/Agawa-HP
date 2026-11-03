/**
 * 键盘 / 菜单 / 语言入口 / 控制台检查（在 DSH 浏览器里跑，不是 Node 脚本）
 *
 * 运行方式：把本文件内容作为 bcdp_script 的 script 参数执行；需先启动本地服务器。
 * 结果：键盘与菜单 9/9 通过；控制台 7 页 0 错误（2026-11-03，最终版）。
 */
const BASE = "http://127.0.0.1:8137/_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/prototype/";
const results = [];
const record = (name, pass, detail) => results.push({ name, pass: Boolean(pass), detail });

// 1. 手机菜单（390 iframe）
await page.goto(`${BASE}review-viewports.html?page=index.html&lang=zh&state=none`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => [...document.querySelectorAll(".card .card__status")].every((s) => s.textContent !== "加载中…"), null, { timeout: 25000 });
await page.waitForTimeout(700);
const menu = await page.evaluate(() => {
  const frame = document.querySelector('.card[data-width="390"] iframe');
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  const button = doc.getElementById("menu-toggle");
  const panel = doc.getElementById("menu-panel");
  button.click();
  const opened = { hidden: panel.hidden, expanded: button.getAttribute("aria-expanded"), focus: doc.activeElement?.textContent?.trim() };
  doc.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  const closed = { hidden: panel.hidden, expanded: button.getAttribute("aria-expanded"), focusIsButton: doc.activeElement === button };
  return {
    opened,
    closed,
    notFocusable: [...panel.querySelectorAll("a")].every((link) => link.offsetParent === null),
    mobileNav: [...doc.querySelectorAll(".mobile-bar a")].map((link) => link.textContent.trim()),
  };
});
record("手机菜单：展开并聚焦第一项", menu.opened.hidden === false && menu.opened.expanded === "true", menu.opened);
record("手机菜单：Escape 关闭且焦点回按钮", menu.closed.hidden === true && menu.closed.focusIsButton, menu.closed);
record("手机菜单：关闭后不入 Tab 顺序", menu.notFocusable);
record("手机头部直接可见项目/博客", menu.mobileNav.join("/") === "项目/博客", menu.mobileNav);

// 2. 桌面语言入口
await page.goto(`${BASE}blog.html?lang=zh&topic=technical`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
const lang = await page.evaluate(() => {
  const button = document.getElementById("lang-button");
  const panel = document.getElementById("lang-panel");
  button.click();
  const opened = {
    labels: [...panel.querySelectorAll("a")].map((link) => link.textContent),
    hrefs: [...panel.querySelectorAll("a")].map((link) => link.getAttribute("href")),
    current: document.getElementById("lang-current").textContent,
  };
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return { opened, closedFocus: document.activeElement === button };
});
record("语言入口：显示当前语言与三语选项", lang.opened.current === "中文" && lang.opened.labels.join("/") === "中文/English/日本語", lang.opened.labels);
record("语言入口：保留当前筛选", lang.opened.hrefs.every((href) => href.includes("topic=technical") && href.includes("lang=")), lang.opened.hrefs);
record("语言入口：Escape 关闭并回焦", lang.closedFocus);

// 3. 真实 Enter 键
await page.goto(`${BASE}blog.html?lang=zh`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
await page.evaluate(() => document.querySelector('.filter__btn[data-topic="technical"]').focus());
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
record(
  "键盘：Enter 激活筛选",
  await page.evaluate(
    () =>
      document.querySelectorAll("#blog-list .post-row").length === 2 &&
      document.querySelector('.filter__btn[data-topic="technical"]').getAttribute("aria-pressed") === "true"
  )
);

await page.goto(`${BASE}article.html?post=acting-human&lang=zh`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
await page.evaluate(() => document.querySelectorAll("#toc-desktop ol a")[4].focus());
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
record("键盘：Enter 跳转目录锚点", await page.evaluate(() => location.hash === "#sec-5"));

// 4. 控制台 / 异常 / 网络
const pages = ["index.html?lang=zh", "blog.html?lang=zh", "fish-blog.html?lang=zh", "notes.html?lang=zh", "works.html?lang=zh", "article.html?post=acting-human&lang=zh", "review.html?lang=zh"];
const consoleReport = [];
for (const path of pages) {
  await cdp("Log.enable");
  await cdp("Runtime.enable");
  await cdp("Network.enable");
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
  const events = await page.drainEvents();
  const errors = [];
  for (const event of events) {
    if (event.method === "Log.entryAdded" && ["error", "warning"].includes(event.params.entry.level)) errors.push(event.params.entry.text);
    if (event.method === "Runtime.exceptionThrown") errors.push(event.params.exceptionDetails.text);
    if (event.method === "Network.loadingFailed" && !event.params.blockedReason) errors.push(event.params.errorText);
  }
  consoleReport.push({ path, events: events.length, errors });
}
record("控制台：7 个页面 0 错误", consoleReport.every((item) => item.errors.length === 0), consoleReport);

console.log(JSON.stringify({ total: results.length, failed: results.filter((r) => !r.pass).map((r) => r.name), results, consoleReport }, null, 1));
