---
name: agawa-blog-publisher
description: Publish a user-provided blog post to the Agawa-HP website when the user asks to add, publish, or put that post on the site. First confirm whether it is public or private, then produce illustrated Chinese, English, and Japanese editions, apply the matching SEO or privacy contract, validate locally, and push the isolated change to GitHub. Do not use for copyediting, translation-only requests, or unrelated websites.
---

# Agawa Blog Publisher

Turn one supplied article into a complete illustrated, trilingual Agawa-HP blog release. Preserve the author’s argument and voice while following the repository’s existing static-site patterns.

## Scope and authorization

- Apply only inside the Agawa-HP repository when the user supplies blog content and asks to add or publish it on the website.
- Treat a request to add or publish the post on this website as authorization to create the local files, run local checks, commit the isolated blog change, and push that commit after validation.
- If the user asks only for a draft, preview, translation, review, or local-only change, stop before commit and push.
- Publishing permission does not authorize unrelated cleanup, deployment-setting changes, force-pushes, rebases, or inclusion of pre-existing user changes.

## Privacy classification gate

Before generating an image or modifying repository files, obtain an explicit answer to: “这篇博客是否作为隐私博客发布？” Do this for every new-blog publishing task; do not infer privacy from the subject matter, tone, or prior posts. If the current request already explicitly says public or private, treat that as the answer and briefly confirm the selected mode rather than asking the user to repeat it.

Do not proceed until the mode is explicit. Record exactly one mode for the release:

- **Public:** follow the public SEO publication contract and include all three article URLs in the sitemap.
- **Private:** follow the private publication contract, activate the frontend password gate, and keep all three article URLs out of the sitemap.

## Site contract

Inspect the current repository before editing because newer posts may refine these conventions. Preserve the existing navigation, footer, typography, color tokens, article layout, analytics-sensitive labels, and URL structure.

For a new article stem such as `blog-forward-deployed-engineer`, create:

- Chinese: `<stem>.html`
- English: `<stem>-en.html`
- Japanese: `<stem>-ja.html`
- One original header-image concept under `assets/images/`; when the design contains language-specific text, create matching Chinese, English, and Japanese variants from the same composition
- One newest-first post entry in each of:
  - `assets/data/site.zh.json`
  - `assets/data/site.en.json`
  - `assets/data/site.ja.json`

Use a short, stable, lowercase ASCII stem with hyphens. Do not rename existing article URLs.

Each page must:

- Set `<html lang>` and `data-article-lang` consistently to `zh`, `en`, or `ja`.
- Use `data-page="blog"`, the shared stylesheet, shared script, existing header, and existing footer.
- Provide a localized `<title>`, meta description, H1, subtitle, metadata, image alt text, caption, headings, tables, quotations, and source note.
- Link its two language buttons to the other two article files with `data-lang-target`; the current language button has `aria-pressed="true"`.
- Reuse the same image in all languages unless the image contains language-specific text.
- Preserve semantic HTML and keep wide tables inside the existing horizontal-scroll wrapper.

## Public SEO publication contract

Apply this section only when the user selected **Public**. Treat search metadata as part of the article, not as optional cleanup. Follow the current site-wide SEO pattern when it exists; otherwise establish the minimum static baseline below as part of the scoped blog release.

Each language page must include directly in `<head>`:

- A self-referencing absolute canonical URL on `https://www.agawa5642.com/`.
- Reciprocal `rel="alternate"` links for `hreflang="zh"`, `en`, `ja`, and `x-default`; every edition lists all four, with the Chinese edition as `x-default`.
- Localized Open Graph fields for `og:type=article`, title, description, canonical URL, site name, locale, and an absolute image URL. Include the two alternate locales.
- A localized large-image Twitter Card with title, description, and the same absolute image URL.
- Valid JSON-LD `BlogPosting` data whose visible title, description, image, language, publication date, modification date, author, and canonical URL match the page. Do not claim credentials or properties that the visible article does not support.

Update the root `sitemap.xml` so all three canonical article URLs are present. Preserve existing URLs and significant `lastmod` values. When the sitemap does not yet exist, generate it from every public root HTML page rather than creating a blog-only sitemap. Ensure root `robots.txt` points to the production sitemap and allows public pages to be crawled.

Check `.github/workflows/static.yml` when creating the SEO baseline. `sitemap.xml` and `robots.txt` must be copied into the GitHub Pages artifact. Do not repeatedly edit the workflow once it already deploys both files.

Do not rely on `assets/js/main.js` to inject canonical, hreflang, social metadata, or JSON-LD. These signals must exist in the delivered HTML source. Do not add article URLs to the sitemap until all three pages exist and validate.

## Private publication contract

Apply this section only when the user selected **Private**. This is a lightweight frontend gate for non-technical visitors, not server-side access control; the article still exists in public static files and the repository. State that boundary in the completion report.

- Add `"private": true` to the matching post in each of `assets/data/site.zh.json`, `site.en.json`, and `site.ja.json`.
- Add `data-private="true"` to the `<body>` of all three article pages so direct visits remain hidden until the current tab is unlocked.
- Add `<meta name="robots" content="noindex, nofollow, noarchive">` to each edition.
- Do not add private article URLs to `sitemap.xml`. Confirm none of the three URLs is present before publishing.
- Do not add canonical, hreflang, Open Graph, Twitter Card, or `BlogPosting` JSON-LD metadata for a private article; these public discovery and preview signals can expose its subject.
- Keep the visible article and its three language editions complete. Preserve the same semantic, image, translation, and language-switch requirements as a public article.
- Treat the header image as a publicly accessible asset. Avoid unnecessary sensitive names or identifying text in the image itself unless the user explicitly approves them.

## Content and translation

Detect whether the supplied source is Chinese, English, or Japanese, then create natural editions in the other two languages. The three pages must carry the same substantive content and section structure.

- Translate for fluent readers rather than word for word.
- Preserve names, figures, dates, quoted questions, model names, citations, and technical terms.
- Keep established abbreviations such as FDE, ROI, RAG, API, PoC, and Agent where appropriate.
- Correct obvious formatting artifacts and minor grammar errors without changing the author’s claims.
- Do not invent sources, links, credentials, statistics, or first-person experience.
- Do not silently fact-check or rewrite the thesis unless the user asks. If the draft contains an obvious high-risk contradiction, flag it before publishing.
- Localize category names and excerpts in each JSON index. Use the publication date requested by the user, or the current local date when none is supplied.

## Image generation

Use the available `imagegen` skill and its built-in generation workflow to create the publication-quality blog header.

Before prompting the image model, read [references/hand-drawn-knowledge-infographic-prompt.md](references/hand-drawn-knowledge-infographic-prompt.md) completely and use it as the required visual and prompt-design baseline. Do not paste the article into the image prompt unchanged: first distill its central question, 3–6 essential modules, their real relationship, and one takeaway. The image must communicate the article’s knowledge structure at a glance.

- Default to a 4:3 landscape hand-drawn educational infographic with a clear reading path, warm paper texture, restrained navy/charcoal linework, mustard-yellow emphasis, and only minimal muted orange or gray-blue accents.
- Preserve the reference’s knowledge-first composition, editorial doodle character, visual hierarchy, and anti-clutter constraints even when the user requests a related stylistic variation. Follow an explicitly conflicting user direction, but do not silently fall back to a generic decorative illustration.
- Keep in-image copy short and intentional. Provide every required label verbatim to the image model; reject pseudo-text, garbled characters, invented labels, logos, trademarks, watermarks, fake interfaces, or imagery that implies official endorsement.
- When the infographic contains language-specific text, generate localized Chinese, English, and Japanese variants with the same structure and meaning, and reference the matching image from each article edition. A text-free image may be shared across all three editions.
- Inspect the result at full size and at the approximate mobile-rendered width. If important text is malformed, iterate with one targeted correction at a time; do not publish a version with unreadable required labels.
- Save every final selected image inside `assets/images/` before referencing it from HTML. Use web-appropriate compression while preserving readability.
- Report the final image path(s), dimensions, and prompt summary in the handoff.

## Implementation sequence

1. Obtain the explicit Public or Private answer at the privacy classification gate.
2. Inspect `blog.html`, the newest comparable article pages, `assets/js/main.js`, the blog sections of all three site JSON files, relevant article CSS, and `git status --short`.
3. Choose the stable article stem, localized titles, categories, excerpts, and image concept.
4. Generate and save the image.
5. Build the three complete HTML pages and reciprocal language switching.
6. Apply exactly one metadata path: public SEO plus sitemap entries, or private gate/noindex with no public discovery metadata and no sitemap entries.
7. Add newest-first entries to all three blog indexes, including `private: true` only for Private mode.
8. Add only narrowly scoped CSS when the existing article styles cannot handle the content. Long English titles may receive a page-specific responsive rule.
9. Run the matching validation and local preview gates below.
10. If publishing is authorized, stage only the files belonging to this article, review the staged diff, commit, and push.

## Validation gates

Run the bundled validator from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File ".agents/skills/agawa-blog-publisher/scripts/validate_blog.ps1" -Stem "<stem>" -Mode "<Public|Private>"
```

Then start the repository’s local server on an available loopback port and check all three article URLs, their shared image, CSS, JavaScript, and language JSON files return HTTP 200. Stop the server after testing.

Also request `robots.txt` and `sitemap.xml` over that server. For Public mode, verify all three production article URLs are present and confirm canonical, reciprocal hreflang, social image, and `BlogPosting` data. For Private mode, verify all three URLs are absent and confirm `data-private`, `private: true`, `noindex`, and the absence of public discovery metadata.

Visually inspect at least one desktop viewport and one narrow mobile viewport when a title is unusually long, the article adds a new content pattern, or CSS changed. Confirm:

- no horizontal page overflow;
- the header remains usable;
- H1, subtitle, image, tables, and language controls fit;
- all three language switches navigate to the matching article;
- no browser console errors or missing assets.

Do not publish if any gate fails.

## GitHub publication

Before staging, inspect `git status --short`, the current branch, its upstream, and configured remotes. Preserve all unrelated changes.

- Never use `git add .` or `git add -A`.
- Stage the three article files, generated image, three JSON index files, and only the CSS or JavaScript hunks required by this article.
- Stage the article’s sitemap change and, only when newly established or required, `robots.txt`, the deployment-workflow change, and any dedicated social-card asset.
- For a Private article, do not stage a sitemap change unless it removes an accidentally added URL belonging to that same new article.
- Review `git diff --cached --check` and `git diff --cached` before committing.
- Use a concise commit message such as `Add trilingual FDE blog post`.
- Push the current commit to its normal upstream. Never force-push.
- If no upstream exists, push the current branch with `git push -u <remote> <branch>` only when the remote and branch are unambiguous.
- If unrelated edits overlap a shared file and cannot be isolated safely, stop and ask the user instead of committing them.
- If authentication, branch protection, or network access blocks the push, report the exact blocker and leave the validated commit intact. Do not change GitHub settings or retry indefinitely.

## Completion report

Provide clickable paths to the three local article files and the generated image. Report the selected Public or Private mode, the matching SEO/privacy validation, sitemap/robots HTTP checks, the local checks, commit hash, pushed remote and branch, or the precise reason a push did not occur. For Private mode, reiterate that the frontend gate is intended for casual privacy rather than strong access control.
