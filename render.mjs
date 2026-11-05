#!/usr/bin/env node
// Render a videos/*.html file to out/<name>.mp4 (or 3 stills) at 30 fps.
//
//   node render.mjs videos/hello.html            -> out/hello.mp4
//   node render.mjs videos/hello.html --stills 3 -> out/hello-still-1.png ... -3.png
//   node render.mjs videos/hello.html --at 1,2.5   -> stills at exact seconds
//
// Each video sets window.DURATION, window.SIZE and window.render(t).

import { spawn, execSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Load Playwright from a local install first, then the global one.
const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require('playwright'); } catch {}
  const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return require(path.join(globalRoot, 'playwright'));
}
const { chromium } = loadPlaywright();

const FPS = 30;

function parseArgs(argv) {
  const args = { file: null, stills: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--stills') args.stills = Number(argv[++i] ?? 3) || 3;
    else if (a === '--at') args.at = String(argv[++i] ?? '').split(',').map(Number).filter((n) => !Number.isNaN(n));
    else if (!args.file) args.file = a;
  }
  if (!args.file) {
    console.error('usage: node render.mjs videos/<name>.html [--stills N]');
    process.exit(1);
  }
  return args;
}

async function main() {
  const { file, stills, at } = parseArgs(process.argv.slice(2));
  const abs = path.resolve(file);
  const name = path.basename(abs, '.html');
  const outDir = path.resolve('out');
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => { console.error('page error:', e.message); });
  await page.goto(pathToFileURL(abs).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const { DURATION, SIZE } = await page.evaluate(() => ({
    DURATION: window.DURATION, SIZE: window.SIZE,
  }));
  if (!DURATION || !Array.isArray(SIZE) || typeof await page.evaluate(() => typeof window.render) !== 'string') {
    throw new Error('video must set window.DURATION, window.SIZE and window.render(t)');
  }
  const [width, height] = SIZE;
  await page.setViewportSize({ width, height });
  const totalFrames = Math.round(DURATION * FPS);
  console.log(`${name}: ${width}x${height}, ${DURATION}s, ${totalFrames} frames @ ${FPS}fps`);

  const renderAt = async (t) => {
    await page.evaluate((t) => window.render(t), t);
    return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  };

  if (stills > 0 || (at && at.length)) {
    // --at 1.5,5,9 picks exact times; --stills N spaces them evenly, avoiding the end frame.
    const { writeFile } = await import('node:fs/promises');
    const times = at && at.length ? at : Array.from({ length: stills }, (_, i) => (DURATION * (i + 0.5)) / stills);
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const png = await renderAt(t);
      const outPath = path.join(outDir, `${name}-still-${i + 1}.png`);
      await writeFile(outPath, png);
      console.log(`wrote ${path.relative(process.cwd(), outPath)}  (t=${t.toFixed(2)}s)`);
    }
    await browser.close();
    return;
  }

  // Full render: pipe PNG frames into ffmpeg's stdin.
  const outPath = path.join(outDir, `${name}.mp4`);
  await rm(outPath, { force: true });
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium',
    '-movflags', '+faststart',
    outPath,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => {
    ff.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`))));
  });

  for (let i = 0; i < totalFrames; i++) {
    const png = await renderAt(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) process.stdout.write(`\r  frame ${i + 1}/${totalFrames}`);
  }
  process.stdout.write(`\r  frame ${totalFrames}/${totalFrames}\n`);
  ff.stdin.end();
  await ffDone;
  await browser.close();
  console.log(`wrote ${path.relative(process.cwd(), outPath)}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
