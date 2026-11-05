# claude-motion

Motion graphics written as code. One HTML file per video; a headless browser renders every frame deterministically; ffmpeg joins them into an MP4.

## Layout

- `videos/*.html` — one video per file
- `brand.css` — colors and fonts (edit here, every video inherits)
- `fonts/` — Poppins (600/700) and Inter (variable) as WOFF2, bundled so renders work offline; SIL OFL licenses alongside
- `render.mjs` — renderer
- `out/` — rendered MP4s and stills (committed so they can be downloaded from GitHub)

## Video contract

Each video sets three globals:

```js
window.DURATION = 3;          // seconds
window.SIZE = [1920, 1080];   // [width, height]
window.render = function (t) { /* draw the exact frame at time t */ };
```

`render(t)` must be a pure function of `t`. No CSS animations, no transitions, no timers (`brand.css` disables animations as a guard rail).

## Render

```bash
node render.mjs videos/hello.html             # out/hello.mp4 at 30 fps
node render.mjs videos/hello.html --stills 3  # out/hello-still-{1,2,3}.png
```

## Requirements

Node 18+, ffmpeg, and Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`).
