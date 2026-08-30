# Hand-drawn knowledge infographic prompt

Use this reference whenever `agawa-blog-publisher` generates a blog header image. It is a reusable design baseline, not permission to copy all article text into the image. Replace every placeholder with distilled, localized content before calling the image model.

## Required editorial preparation

Extract only the information that lets a reader understand the article quickly:

1. One concise core title.
2. One thought-provoking question.
3. Three to six essential knowledge modules.
4. The real causal, progressive, classificatory, comparative, or cyclical relationship between those modules.
5. One short example or visual metaphor only when it materially improves understanding.
6. One takeaway that advances the article’s thesis rather than repeating its title.

Discard repeated background, secondary examples, long qualifications, and details that do not affect the central explanation. Each region must communicate one idea. Prefer fewer modules over illegible density.

Choose the structure that fits the source:

- Causal: problem → cause → mechanism → paths → result → takeaway.
- Classification: concept → classification rule → types → traits or examples → comparison.
- Theory: real problem → theoretical explanation → core concepts → variable relationships → case → significance.
- Process: starting state → stages or decisions → validation → outcome.

Do not invent causality merely to fit a template.

## Reusable generation prompt

```text
Use case: infographic-diagram
Asset type: 4:3 landscape hero knowledge infographic for an Agawa-HP blog article

Source topic:
{ARTICLE_TOPIC}

Primary request:
Create a hand-drawn educational infographic that explains the article’s central knowledge structure rather than decorating its topic. Show a clear visual path through:
{DISTILLED_LOGIC_CHAIN}

The reader should understand the main argument by scanning only the title, module names, arrows, figures, and highlighted keywords. Do not summarize the entire article or fill the canvas with paragraphs.

Required content, rendered verbatim with no extra text:
Core title: “{CORE_TITLE}”
Entry question: “{CORE_QUESTION}”
Modules:
{THREE_TO_SIX_MODULES_WITH_SHORT_LABELS}
Takeaway label: “{LOCALIZED_TAKEAWAY_LABEL}”
Takeaway: “{CORE_TAKEAWAY}”

Scene/backdrop:
Warm ivory or pale cream sketchbook paper. Add subtle clean paper grain, faint pencil marks, small eraser traces, and very light fold texture. The background must feel tactile but never dirty.

Style/medium:
Hand-drawn knowledge infographic + classroom notes + vintage educational poster + sketchbook illustration + editorial doodle illustration. Slightly irregular human ink lines. Rational, approachable, knowledgeable, mildly humorous, and professionally edited. It should look like a gifted teacher has turned a complex theory into one excellent page of classroom notes.

Composition/framing:
Exact 4:3 landscape composition. Put the core title at the top with the question directly below it. Use the middle as the main knowledge area with a strong left-to-right or upper-left-to-lower-right reading path. When the logic branches, branch from a clear center and visibly converge again. Put the takeaway in a prominent strip at the bottom.

Use thick hand-drawn arrows, branch arrows, dashed frames, circles or rounded cards, comparison columns, labels, speech or thought bubbles, simple icons, and small expressive characters only when they clarify relationships. Elements must not float randomly. Leave visible space between modules.

Visual metaphors:
Translate abstract ideas into simple metaphors where useful: pressure as a cloud, weight, or tense spring; conflict as colliding arrows; choice as a forked road; control as a steering wheel or limited keys; cognition as a brain, bulb, or puzzle; relationships as connecting lines; power as a crown, chess pieces, or height; goals as a target or flag; growth as a plant or stairs; cycles as circular arrows; AI as a small robot, chat window, or node network. Keep people cute, simple, expressive, and slightly comic, but not childish or photorealistic.

Typography:
Use three levels: large hand-lettered display title, bold module names, and clean short labels. Keep each label as short as the language allows. Circle, underline, or highlight only the most important terms. Render every supplied character exactly. Do not create placeholder writing, pseudo-text, fake filenames, stray letters, or meaningless glyphs.

Color palette:
Deep navy or charcoal for text and structure, warm ivory background, mustard yellow for emphasis, and only small muted orange or gray-blue accents. Low saturation. No gradients, neon, rainbow palette, or blue-purple technology background.

Constraints:
High-resolution educational infographic; knowledge relationships must be accurate; readable at blog width and approximate mobile width; information-rich but not crowded; no long paragraphs; no random decoration; no logo, trademark, watermark, fake interface, official endorsement, glossy corporate vector style, dashboard, ordinary PowerPoint, simple mind map, children’s-book look, photorealism, or meaningless text.
```

## Localization and quality gate

If the design contains text, prepare one exact-text block for each of Chinese, English, and Japanese. Keep the same modules, arrows, examples, emphasis, and takeaway across the three images. Translate naturally and shorten labels without changing meaning.

Inspect each generated image before publication:

- Confirm the canvas is 4:3 and the reading order is unambiguous.
- Confirm the image focuses on the article’s most important ideas rather than coverage for its own sake.
- Verify every required label character by character.
- Check that the title, modules, arrows, figures, and takeaway remain understandable at mobile display size.
- If a required label is malformed, edit only that label or module while preserving the rest of the composition. Repeat critical invariants during the edit.
- Do not publish until required text is readable and there is no pseudo-text in meaningful content areas.
