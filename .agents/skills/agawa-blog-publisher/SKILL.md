---
name: agawa-blog-publisher
description: Publish a user-provided blog post to the Agawa-HP website when the user asks to add, publish, or put that post on the site. Generate a relevant original header image, produce Chinese, English, and Japanese editions, update all three blog indexes, validate locally, and push the isolated blog change to GitHub. Do not use for copyediting, translation-only requests, or unrelated websites.
---

# Agawa Blog Publisher

Turn one supplied article into a complete illustrated, trilingual Agawa-HP blog release. Preserve the author’s argument and voice while following the repository’s existing static-site patterns.

## Scope and authorization

- Apply only inside the Agawa-HP repository when the user supplies blog content and asks to add or publish it on the website.
- Treat a request to add or publish the post on this website as authorization to create the local files, run local checks, commit the isolated blog change, and push that commit after validation.
- If the user asks only for a draft, preview, translation, review, or local-only change, stop before commit and push.
- Publishing permission does not authorize unrelated cleanup, deployment-setting changes, force-pushes, rebases, or inclusion of pre-existing user changes.

## Site contract

Inspect the current repository before editing because newer posts may refine these conventions. Preserve the existing navigation, footer, typography, color tokens, article layout, analytics-sensitive labels, and URL structure.

For a new article stem such as `blog-forward-deployed-engineer`, create:

- Chinese: `<stem>.html`
- English: `<stem>-en.html`
- Japanese: `<stem>-ja.html`
- One descriptive original image under `assets/images/`
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

Use the available `imagegen` skill and its built-in generation workflow to make one publication-quality blog header related to the article’s central idea.

- Match the site’s restrained editorial palette: off-white, charcoal, cool gray, and the existing orange accent unless the current design has changed.
- Prefer a wide editorial illustration or natural editorial photograph that survives desktop and mobile cropping.
- Do not include text, logos, trademarks, watermarks, fake interfaces, or imagery that implies official endorsement.
- Save the final selected image inside `assets/images/` before referencing it from HTML.
- Report the final image path and prompt summary in the handoff.

## Implementation sequence

1. Inspect `blog.html`, the newest comparable article pages, `assets/js/main.js`, the blog sections of all three site JSON files, relevant article CSS, and `git status --short`.
2. Choose the stable article stem, localized titles, categories, excerpts, and image concept.
3. Generate and save the image.
4. Build the three complete HTML pages and reciprocal language switching.
5. Add newest-first entries to all three blog indexes.
6. Add only narrowly scoped CSS when the existing article styles cannot handle the content. Long English titles may receive a page-specific responsive rule.
7. Run the validation and local preview gates below.
8. If publishing is authorized, stage only the files belonging to this article, review the staged diff, commit, and push.

## Validation gates

Run the bundled validator from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File ".agents/skills/agawa-blog-publisher/scripts/validate_blog.ps1" -Stem "<stem>"
```

Then start the repository’s local server on an available loopback port and check all three article URLs, their shared image, CSS, JavaScript, and language JSON files return HTTP 200. Stop the server after testing.

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
- Review `git diff --cached --check` and `git diff --cached` before committing.
- Use a concise commit message such as `Add trilingual FDE blog post`.
- Push the current commit to its normal upstream. Never force-push.
- If no upstream exists, push the current branch with `git push -u <remote> <branch>` only when the remote and branch are unambiguous.
- If unrelated edits overlap a shared file and cannot be isolated safely, stop and ask the user instead of committing them.
- If authentication, branch protection, or network access blocks the push, report the exact blocker and leave the validated commit intact. Do not change GitHub settings or retry indefinitely.

## Completion report

Provide clickable paths to the three local article files and the generated image. Report the local checks, commit hash, pushed remote and branch, or the precise reason a push did not occur.
