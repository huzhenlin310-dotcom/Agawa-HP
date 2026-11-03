#!/usr/bin/env node
/**
 * 原型静态自检（不替代浏览器验证）：
 *  1. JSON 解析
 *  2. HTML 中本地 href/src 是否存在
 *  3. 重复 id、data-ui / data-aria 文案键是否三语齐全
 *  4. 站内链接是否都带 data-link（否则语言参数不会保留）
 *  5. 生产文件是否与基线哈希一致（确认没有改动生产页面）
 *
 * 运行：node _bmad-output/planning-artifacts/ux-Agawa-HP-2026-11-03/tools/verify-prototype.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TASK_DIR = path.resolve(HERE, "..");
const SITE_ROOT = path.resolve(TASK_DIR, "..", "..", "..");
const PROTOTYPE = path.join(TASK_DIR, "prototype");
const LANGS = ["zh", "en", "ja"];

const problems = [];
const notes = [];
const fail = (message) => problems.push(message);

function resolvePath(object, dotted) {
  return dotted.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);
}

const ui = JSON.parse(fs.readFileSync(path.join(PROTOTYPE, "data", "proto-ui.json"), "utf8"));
const data = JSON.parse(fs.readFileSync(path.join(PROTOTYPE, "data", "proto-data.json"), "utf8"));
notes.push(`proto-data.json 解析通过（${data.posts.length} 篇文章 / ${data.works.length} 个项目）`);
notes.push(`proto-ui.json 解析通过（${LANGS.map((lang) => Object.keys(ui[lang]).length).join(" / ")} 个顶层键）`);

for (const lang of LANGS) {
  if (!ui[lang]) fail(`proto-ui.json 缺少语言：${lang}`);
}

const htmlFiles = fs.readdirSync(PROTOTYPE).filter((file) => file.endsWith(".html")).sort();
// review-viewports.html 是 iframe 尺寸检查工具，不是站点页面，只做链接检查
const pageFiles = htmlFiles.filter((file) => !file.startsWith("review-viewports"));
notes.push(`HTML 页面：${pageFiles.length} 个 → ${pageFiles.join(", ")}`);
notes.push(`审核工具页：review-viewports.html（iframe 尺寸检查，不参与站点结构检查）`);

const uiKeys = new Set();
const ariaKeys = new Set();

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(PROTOTYPE, file), "utf8");

  // 1. 结构
  if (!pageFiles.includes(file)) {
    for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|#|\?)/.test(target)) continue;
      const absolute = path.resolve(PROTOTYPE, target.split(/[?#]/)[0]);
      if (target.split(/[?#]/)[0] && !fs.existsSync(absolute)) fail(`${file}: 目标不存在 → ${target}`);
    }
    continue;
  }
  if (!/<html lang="[a-z]{2}">/.test(source)) fail(`${file}: 缺少 <html lang>`);
  if (!/<main id="main"/.test(source)) fail(`${file}: 缺少 <main id="main">`);
  if (!/data-proto-page="[a-z-]+"/.test(source)) fail(`${file}: 缺少 data-proto-page`);
  if (!source.includes('href="assets/proto.css"')) fail(`${file}: 未引用 proto.css`);
  if (!source.includes('src="assets/proto.js"')) fail(`${file}: 未引用 proto.js`);

  // 2. 重复 id
  const ids = [...source.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) fail(`${file}: id 重复 → ${id}`);
    seen.add(id);
  }

  // 3. data-ui / data-aria 键
  for (const match of source.matchAll(/data-ui="([^"]+)"/g)) uiKeys.add(match[1]);
  for (const match of source.matchAll(/data-aria="([^"]+)"/g)) ariaKeys.add(match[1]);

  // 4. 本地链接与资源
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#|\?)/.test(target)) continue;
    const [filePart] = target.split(/[?#]/);
    if (!filePart) continue;
    const absolute = path.resolve(PROTOTYPE, filePart);
    if (!fs.existsSync(absolute)) fail(`${file}: 目标不存在 → ${target}`);
  }

  // 5. 站内链接是否带 data-link
  for (const tag of source.matchAll(/<a\b[^>]*>/g)) {
    const markup = tag[0];
    const href = markup.match(/href="([^"]+)"/)?.[1] || "";
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (!markup.includes("data-link")) fail(`${file}: 站内链接缺少 data-link → ${markup.slice(0, 90)}`);
    if (!markup.includes("data-lang-option") && href.startsWith("?")) {
      fail(`${file}: 语言链接格式异常 → ${href}`);
    }
  }
}

for (const key of uiKeys) {
  for (const lang of LANGS) {
    const value = resolvePath(ui[lang], key);
    if (typeof value !== "string") fail(`文案键在三语中缺失：${lang}/${key}`);
  }
}
for (const key of ariaKeys) {
  for (const lang of LANGS) {
    const value = resolvePath(ui[lang], key);
    if (typeof value !== "string") fail(`aria 文案键在三语中缺失：${lang}/${key}`);
  }
}
notes.push(`data-ui 键 ${uiKeys.size} 个、data-aria 键 ${ariaKeys.size} 个，三语齐全`);

// 6. 文章正文：三语均有正文与目录，且目录阈值规则一致
for (const post of data.posts) {
  for (const lang of LANGS) {
    const article = data.articles[post.id]?.[lang];
    if (!article) {
      fail(`缺少文章正文：${post.id}/${lang}`);
      continue;
    }
    if (!article.body || article.body.length < 200) fail(`文章正文过短：${post.id}/${lang}`);
    if (article.tocHeadings.length < 5) fail(`目录阈值异常（应 ≥5）：${post.id}/${lang} → ${article.tocHeadings.length}`);
    const ids = new Set(article.tocHeadings.map((heading) => heading.id));
    for (const heading of article.tocHeadings) {
      if (!article.body.includes(`id="${heading.id}"`)) fail(`目录锚点在正文缺失：${post.id}/${lang}/${heading.id}`);
    }
    if (ids.size !== article.tocHeadings.length) fail(`目录锚点重复：${post.id}/${lang}`);
  }
}
notes.push(`文章目录：${data.posts.map((post) => `${post.id}=${data.articles[post.id].zh.tocHeadings.length}`).join(", ")}（已排除资料/来源/参考小节）`);

// 7. 可见性边界：基线数据没有私密文章，样例不得混入 posts
if (data.posts.some((post) => post.private)) fail("基线数据出现了 private 文章，需重新核对可见性规则");
if (!data.samplePrivate?.isSample) fail("缺少私密边界样例标记");
if (data.posts.some((post) => post.id === data.samplePrivate.id)) fail("私密样例混入 posts 列表");

// 8. 生产文件哈希对比
const manifestPath = path.join(TASK_DIR, "baseline", "tree-start.sha256");
if (fs.existsSync(manifestPath)) {
  const lines = fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).filter(Boolean);
  let checked = 0;
  for (const line of lines) {
    const [hash, rel] = line.trim().split(/\s{2,}/);
    const absolute = path.join(SITE_ROOT, rel);
    if (!fs.existsSync(absolute)) {
      fail(`基线文件消失：${rel}`);
      continue;
    }
    const current = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex").toUpperCase();
    if (current !== hash.toUpperCase()) fail(`生产文件被改动：${rel}`);
    checked += 1;
  }
  notes.push(`生产文件哈希对比：${checked} 个文件与基线一致（未改动生产页面与三语数据）`);
} else {
  fail("缺少 baseline/tree-start.sha256，无法证明未改动生产文件");
}

console.log("=== 说明 ===");
for (const note of notes) console.log(`· ${note}`);
console.log(`\n=== 结果 ===`);
if (problems.length === 0) {
  console.log("PASS：静态检查全部通过");
  process.exit(0);
}
for (const problem of problems) console.log(`FAIL ${problem}`);
console.log(`\n共 ${problems.length} 项问题`);
process.exit(1);
