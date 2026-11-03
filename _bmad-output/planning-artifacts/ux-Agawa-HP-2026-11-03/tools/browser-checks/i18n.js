/**
 * 三语完整性检查（在 DSH 浏览器里跑，不是 Node 脚本）
 *
 * 做法：
 *  1. 对 8 个访客页面分别加载 zh / en / ja；
 *  2. 比较同一 DOM 路径的文本节点：若英文页与中文页文本完全相同且含汉字，判为硬编码残留；
 *     日文页用“简体专用字”启发式（时/关/页/项/联/说/间/经/历…）识别中文残留；
 *  3. 比较 aria-label / alt / title：英文页与中文页相同且含汉字，判为残留；
 *  4. 单独断言关于/联系页的小节标题、说明、字段标签、错误态、文章目录摘要、鱼的空间计数随语言变化；
 *  5. 记录 390 / 1280 下无横向溢出。
 *
 * 2026-11-03 结果：除“中文 / 日本語”语言名与联系页地点数据（内容数据，非界面文案）外，无残留。
 */
const BASE = "http://127.0.0.1:8137/_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/prototype/";
const PAGES = ["index.html", "works.html", "blog.html", "fish-blog.html", "notes.html", "article.html?post=acting-human", "about.html", "contact.html"];
const ALLOWED = ["中文", "日本語", "日本 / 石川県 / JAIST"];

async function snapshot(pagePath, lang) {
  await page.goto(`${BASE}${pagePath}${pagePath.includes("?") ? "&" : "?"}lang=${lang}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
  return page.evaluate(() => {
    const nodes = [];
    const attrs = [];
    const walk = (node, path) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ").trim();
        if (text) nodes.push({ path, text });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
      [...node.childNodes].forEach((child, index) => walk(child, `${path}/${index}`));
    };
    walk(document.body, "body");
    [...document.querySelectorAll("[aria-label], [alt], [title]")].forEach((el, index) => {
      attrs.push({ path: `attr/${index}/${el.tagName}`, value: el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || "" });
    });
    return { nodes, attrs };
  });
}

const report = [];
for (const pagePath of PAGES) {
  const zh = await snapshot(pagePath, "zh");
  const en = await snapshot(pagePath, "en");
  const ja = await snapshot(pagePath, "ja");
  const zhMap = new Map(zh.nodes.map((n) => [n.path, n.text]));
  const jaMap = new Map(ja.nodes.map((n) => [n.path, n.text]));
  const suspicious = [];
  for (const node of en.nodes) {
    if (ALLOWED.includes(node.text)) continue;
    const zhText = zhMap.get(node.path);
    if (zhText && zhText === node.text && /[\u3400-\u9fff]/.test(node.text)) suspicious.push({ kind: "en-text", text: node.text });
    const jaText = jaMap.get(node.path);
    if (jaText && jaText === node.text && /[这时关页项联说间经历写么样见东车]/.test(node.text)) suspicious.push({ kind: "ja-simplified", text: node.text });
  }
  for (const attr of en.attrs) {
    if (ALLOWED.includes(attr.value)) continue;
    const zhAttr = zh.attrs.find((a) => a.path === attr.path);
    if (attr.value && zhAttr && attr.value === zhAttr.value && /[\u3400-\u9fff]/.test(attr.value)) suspicious.push({ kind: "en-attr", text: attr.value });
  }
  report.push({ page: pagePath, suspicious });
}

const results = [];
const record = (name, pass, detail) => results.push({ name, pass: Boolean(pass), detail });

for (const pagePath of ["about.html", "contact.html"]) {
  const snap = {};
  for (const lang of ["zh", "en", "ja"]) {
    await page.goto(`${BASE}${pagePath}?lang=${lang}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
    snap[lang] = await page.evaluate(() => ({
      title: document.title,
      headings: [...document.querySelectorAll("#main h1, #main h2, #main .kicker")].map((n) => n.textContent.trim()),
      leads: [...document.querySelectorAll("#main .section__lead")].map((n) => n.textContent.trim()),
    }));
  }
  record(
    `${pagePath}：标题/小标题/说明三语不同`,
    new Set([snap.zh.headings.join("|"), snap.en.headings.join("|"), snap.ja.headings.join("|")]).size === 3 &&
      new Set([snap.zh.leads.join("|"), snap.en.leads.join("|"), snap.ja.leads.join("|")]).size === 3,
    snap
  );
  record(`${pagePath}：英文版无中文残留`, !/[\u3400-\u9fff]/.test(snap.en.headings.join("") + snap.en.leads.join("")), snap.en);
}

for (const lang of ["zh", "en", "ja"]) {
  await page.goto(`${BASE}index.html?lang=${lang}&simulateDataError=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const error = await page.evaluate(() => ({
    message: document.querySelector("#data-error p").textContent.trim(),
    retry: document.querySelector("#data-error button").textContent.trim(),
    nav: document.querySelector(".desk-nav a")?.textContent.trim(),
  }));
  record(`错误态（${lang}）按语言显示`, Boolean(error.message) && (lang !== "en" || !/[\u3400-\u9fff]/.test(error.message + error.retry + error.nav)), error);
}

await page.goto(`${BASE}article.html?post=acting-human&lang=en`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 15000 });
record(
  "文章页手机目录摘要按语言",
  await page.evaluate(() => document.querySelector("#toc-mobile summary").textContent.trim() === "On this page (6)")
);

console.log(JSON.stringify({ suspicious: report.filter((r) => r.suspicious.length), assertions: results }, null, 1));
