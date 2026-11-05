# Explainer brief (template)

Fill every [bracket]. Paste the whole thing into a new chat.

CONTEXT: I run [BUSINESS/PROJECT] for [AUDIENCE]. This video plays on [INSTAGRAM / YOUTUBE / MY WEBSITE].

RESULT: A [DURATION]-second animated explainer, 1920x1080, using brand.css. Title: "[TITLE]". Optional small line under the title: "[TITLE SUBLINE]". Then these steps appear one at a time, each with a big number, a short headline, one small line, and optional tag chips:
1. [STEP 1 HEADLINE] / [STEP 1 LINE] / chips: [A · B · C]
2. [STEP 2 HEADLINE] / [STEP 2 LINE] / chips: [A · B · C]
3. [STEP 3 HEADLINE] / [STEP 3 LINE] / chips: [A · B · C]
End on "[CLOSING TITLE]" with "[CALL TO ACTION]" and optional footer "[FOOTER ITEMS]". Smooth easing, no hard cuts.

OFF-LIMITS: No stock footage, no people, no words I didn't write (unless I say "add related content from my profile"), no colors outside brand.css. If anything is unclear, ask me before you build.

SHOW YOUR WORK: Before you write code, give me a scene-by-scene storyboard with timings and wait for my OK. After you build it, run stills at mid-scene times (--at) and show me the stills before the full render.

NEVER TWICE: When I approve the video, save this brief as a template in the templates folder with [brackets] for the parts that change.

## Timing that worked (18s, 3 steps)
title 0–3 · step 1 3–7 · step 2 7–11 · step 3 11–15 · closing 15–18
Each step: number scales in, headline wipes, bar grows, line fades up, chips stagger. Scenes slide ±80px with 0.4s crossfade.

## Starting point
Copy videos/strange-tastes.html and replace the text; the timing table `S` and `stepRender()` carry over unchanged.
