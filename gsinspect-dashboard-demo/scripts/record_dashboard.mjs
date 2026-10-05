// Records a scripted walkthrough of the GSInspect public dashboard.
// Frames come from CDP screencast (JPEG q95) with wall-clock timestamps;
// assemble_recording.sh turns them into a constant-60fps H.264 file.
// Run from /tmp/gsrec (where playwright is installed):
//   node <project>/scripts/record_dashboard.mjs <outDir>
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2] || '/tmp/gsrec/frames';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

// Visible cursor + click ripple (headless Chromium draws no pointer).
await ctx.addInitScript(() => {
  const install = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.2 20.3 L11.1 13.7 L17.2 13.7 Z" fill="#0f172a" stroke="white" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    Object.assign(c.style, { position: 'fixed', left: '0px', top: '0px', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-3px,-2px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))' });
    document.body.appendChild(c);
    window.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    window.addEventListener('mousedown', e => {
      const r = document.createElement('div');
      Object.assign(r.style, { position: 'fixed', left: e.clientX - 22 + 'px', top: e.clientY - 22 + 'px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(37,99,235,.28)', border: '2px solid rgba(37,99,235,.7)', zIndex: 2147483646, pointerEvents: 'none', transform: 'scale(.3)', opacity: '1' });
      document.body.appendChild(r);
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 450); r.style.transform = `scale(${0.3 + 0.9 * k})`; r.style.opacity = String(1 - k); k < 1 ? requestAnimationFrame(step) : r.remove(); };
      requestAnimationFrame(step);
    }, true);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', install) : install();
});

const page = await ctx.newPage();
await page.goto('http://localhost:5173/dashboard');
await page.waitForTimeout(2500);

// ---- screencast ----
const cdp = await ctx.newCDPSession(page);
const frames = [];
let n = 0;
cdp.on('Page.screencastFrame', async (f) => {
  const file = path.join(OUT, `f${String(n++).padStart(6, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
  frames.push({ file, t: f.metadata.timestamp });
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});

const markers = [];
const mark = (label) => { markers.push({ label, t: Date.now() / 1000 }); console.log('MARK', label); };
const wait = (ms) => page.waitForTimeout(ms);

// ---- helpers ----
let mx = 1500, my = 620;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
async function moveTo(x, y, ms = 700) {
  const sx = mx, sy = my, steps = Math.max(10, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    await page.mouse.move(sx + (x - sx) * k, sy + (y - sy) * k);
    await page.waitForTimeout(16);
  }
  mx = x; my = y;
}
async function box(loc) { await loc.waitFor({ state: 'visible' }); const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; }
async function clickOn(loc, ms = 700, pause = 250) {
  const { x, y } = await box(loc);
  await moveTo(x, y, ms);
  await wait(pause);
  await page.mouse.down(); await wait(70); await page.mouse.up();
}
const SCROLLER = 'div.overflow-y-auto.h-full';
// smooth-scroll the dashboard's own scroll container so `selector` sits `offset` px from the top
async function scrollToEl(locator, offset = 90, ms = 1400) {
  const handle = await locator.elementHandle();
  await page.evaluate(async ({ el, sel, offset, ms }) => {
    const sc = document.querySelector(sel);
    const start = sc.scrollTop;
    const target = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, start + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - offset));
    const t0 = performance.now();
    await new Promise(res => {
      const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2, 3)/2; sc.scrollTop = start + (target - start) * e; k < 1 ? requestAnimationFrame(step) : res(); };
      requestAnimationFrame(step);
    });
  }, { el: handle, sel: SCROLLER, offset, ms });
}
async function scrollTop(ms = 1600) {
  await page.evaluate(async ({ sel, ms }) => {
    const sc = document.querySelector(sel); const start = sc.scrollTop; const t0 = performance.now();
    await new Promise(res => { const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2, 3)/2; sc.scrollTop = start * (1 - e); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  }, { sel: SCROLLER, ms });
}
const chip = (name) => page.locator('section button', { hasText: name }).filter({ hasText: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first();
const heading = (t) => page.locator('h2,h3', { hasText: t }).first();

await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
await page.mouse.move(mx, my);
await wait(400);

// ---------- 1. Landing + Apply ----------
mark('start');
await wait(1800);
await moveTo(160, 260, 900);           // glide over the filter sidebar
await wait(300);
await moveTo(160, 437, 600);
await wait(400);
mark('apply');
await clickOn(page.getByRole('button', { name: 'Apply' }), 700);
await wait(2200);

// ---------- 2. Search + select products ----------
mark('search');
const search = page.getByPlaceholder('Search by product name');
await clickOn(search, 800);
await wait(200);
await page.keyboard.type('Hybrid', { delay: 120 });
await wait(1400);
mark('select');
await clickOn(chip('Hybrid Bolt D39 x 2.4 m'), 800);
await wait(700);
await clickOn(chip('Hybrid Bolt B D46 x 2.4 m'), 700);
await wait(900);
// clear search, add a resin bolt for contrast
const clearX = page.locator('section').first().locator('button').first();
await clickOn(clearX, 700);
await wait(900);
await clickOn(chip('Resin Bolt A D22 mm x 2.4 m'), 800);
await wait(1800);

// ---------- 3. Selected summary -> chart ----------
mark('summary');
await moveTo(900, 560, 900);
await wait(1500);
mark('chart');
await scrollToEl(heading('Force-Displacement Chart'), 40, 1600);
await wait(600);
// hover across the chart to show tooltip
await moveTo(700, 520, 800);
await wait(300);
await moveTo(1200, 560, 1400);
await wait(900);
mark('average');
const avgBtn = page.locator('button', { hasText: /Show Average|Average On/ }).first();
await clickOn(avgBtn, 800);
await wait(2400);
await clickOn(avgBtn, 500);   // average off again
await wait(700);
mark('facility');
await clickOn(page.getByRole('button', { name: 'By Facility' }).first(), 800);
await wait(2400);
await clickOn(page.getByRole('button', { name: 'By Product' }).first(), 600);
await wait(900);

// ---------- 4. Methodology toggle ----------
mark('methodology');
await scrollToEl(heading('Test Filters'), 40, 1000);
await wait(400);
await clickOn(page.getByRole('button', { name: 'Static', exact: true }), 800);
await wait(1200);
await scrollToEl(heading('Force-Displacement Chart'), 40, 1000);
await wait(1800);
await scrollToEl(heading('Test Filters'), 40, 900);
await clickOn(page.getByRole('button', { name: 'Dynamic', exact: true }), 700);
await wait(1000);

// ---------- 5. Tables + stats + histogram ----------
mark('table');
await scrollToEl(heading('Plotted Tests Data'), 40, 1600);
await wait(600);
const row = page.locator('table tbody tr').nth(2);
await clickOn(row, 900);
await wait(1600);
await clickOn(row, 500);   // deselect
await wait(600);
mark('stats');
await scrollToEl(heading('Summary Statistics'), 40, 1500);
await wait(800);
const sel = page.locator('select').first();
await clickOn(sel, 800);
await sel.selectOption('energy_absorption');
await wait(1800);
mark('histogram');
await scrollToEl(heading('Distribution Analysis'), 40, 1500);
await moveTo(1100, 600, 1000);
await wait(2500);

// ---------- 6. Back to top ----------
mark('outro');
await scrollTop(1800);
await moveTo(1300, 500, 900);
await wait(2000);
mark('end');

await cdp.send('Page.stopScreencast');
await wait(300);
fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ frames, markers }, null, 1));
console.log('FRAMES', frames.length, 'span', (frames.at(-1).t - frames[0].t).toFixed(2));
await browser.close();
