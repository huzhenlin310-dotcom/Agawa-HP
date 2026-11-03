/**
 * 宽度矩阵检查（在 DSH 浏览器里跑，不是 Node 脚本）
 *
 * 运行方式：把本文件内容作为 bcdp_script 的 script 参数执行；服务器需先启动：
 *   python server.py --port 8137
 *
 * 依赖页面：prototype/review-viewports.html（固定宽度 iframe + 溢出/首屏判定）
 * 结果：120 次检查（zh 8 页 × 6 宽度 + en/ja 12 组 × 6 宽度），2026-11-03 运行 0 失败。
 */
const BASE = "http://127.0.0.1:8137/_bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/prototype/";

const zhCases = [
  ["index.html", "none"],
  ["blog.html", "filter"],
  ["article.html?post=acting-human", "article-toc"],
  ["fish-blog.html", "none"],
  ["works.html", "none"],
  ["notes.html", "none"],
  ["about.html", "none"],
  ["contact.html", "none"],
];

const bilingualCases = [
  ["index.html", "none", "en"], ["index.html", "none", "ja"],
  ["fish-blog.html", "none", "en"], ["fish-blog.html", "none", "ja"],
  ["notes.html", "none", "en"], ["notes.html", "none", "ja"],
  ["article.html?post=acting-human", "none", "en"], ["article.html?post=acting-human", "none", "ja"],
  ["works.html", "none", "en"], ["works.html", "none", "ja"],
  ["blog.html", "empty", "en"], ["blog.html", "empty", "ja"],
];

async function run(cases, lang) {
  const rows = [];
  for (const [pageFile, state, caseLang] of cases) {
    const targetLang = caseLang || lang;
    await page.goto(
      `${BASE}review-viewports.html?page=${encodeURIComponent(pageFile)}&lang=${targetLang}&state=${state}`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForFunction(
      () => [...document.querySelectorAll(".card .card__status")].every((s) => s.textContent !== "加载中…"),
      null,
      { timeout: 25000 }
    );
    const statuses = await page.evaluate(() =>
      [...document.querySelectorAll(".card")].map((card) => ({
        width: card.dataset.width,
        bad: card.querySelector(".card__status").classList.contains("bad"),
        text: card.querySelector(".card__status").textContent,
      }))
    );
    rows.push({ pageFile, lang: targetLang, checks: statuses.length, failures: statuses.filter((s) => s.bad) });
  }
  return rows;
}

const zhRows = await run(zhCases, "zh");
const bilingualRows = await run(bilingualCases, "en");
const all = [...zhRows, ...bilingualRows];
const failures = all.flatMap((row) => row.failures.map((f) => `${row.lang}/${row.pageFile}@${f.width}: ${f.text}`));

console.log(JSON.stringify({ total: all.reduce((n, row) => n + row.checks, 0), pageLanguageCombos: all.length, failures }, null, 1));
