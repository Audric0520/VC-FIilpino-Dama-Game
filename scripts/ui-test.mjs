// End-to-end browser test (development tool): solves all 30 puzzle levels by clicking the
// verified solution lines exported by scripts/verify-puzzles.ts.
//   node ui-test.mjs <projectRoot> <outDir> <lines.json>
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const [root, out, linesFile] = process.argv.slice(2);
const url = 'file://' + path.join(root, 'dist/index.html');
const lines = JSON.parse(fs.readFileSync(linesFile, 'utf8'));
const errors = [];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const sleep = (ms) => page.waitForTimeout(ms);
const sq = (name) => page.locator(`button[aria-label^="${name}"]`).first();
const header = () => page.locator('header').innerText();
const moveCount = () => page.locator('[role=log] .font-mono').count();

await page.goto(url);
await sleep(700);
await page.screenshot({ path: `${out}/1-menu.png` });

// Difficulty chip on the menu opens the first unsolved level of that tier.
await page.locator('button[title^="Medium levels"]').click();
await sleep(500);
log('Medium chip ->', (await header()).split('\n').find((l) => l.includes('Level')));
await page.screenshot({ path: `${out}/2-medium-tab.png` });
await page.getByRole('button', { name: 'Main menu', exact: true }).click();
await sleep(300);
await page.getByRole('button', { name: /Solve Puzzles/ }).click();
await sleep(400);

let solvedOk = 0;
for (const pz of lines) {
  const n = pz.index + 1;
  await page.getByRole('tab', { name: new RegExp(pz.difficulty) }).click();
  await page.locator(`button[title^="Level ${n}:"]`).click();
  await sleep(250);
  let plies = 0;
  try {
    for (const mv of pz.moves) {
      if (mv.side === 1) for (const s of mv.squares) await sq(s).click();
      plies++;
      await page.waitForFunction((k) => document.querySelectorAll('[role=log] .font-mono').length >= k, plies, {
        timeout: 9000,
      });
    }
    await page.waitForFunction(() => document.querySelector('header')?.innerText.includes('Puzzle solved!'), null, {
      timeout: 6000,
    });
    solvedOk++;
    log(`Level ${n} (${pz.difficulty}) solved in ${plies} plies`);
  } catch (e) {
    errors.push(`Level ${n} failed after ${plies} plies (${await moveCount()} logged): ${String(e).slice(0, 120)}`);
    await page.screenshot({ path: `${out}/fail-${n}.png` });
  }
  if (n === 10) {
    await sleep(250);
    log('Toast after level 10:', await page.locator('.toast').allInnerTexts());
    await page.screenshot({ path: `${out}/3-easy-complete.png` });
  }
  await sleep(150);
}
await sleep(300);
log('Final toast:', await page.locator('.toast').allInnerTexts());
await page.screenshot({ path: `${out}/4-all-solved.png` });
log('Header:', (await header()).replace(/\n/g, ' | '));

// Solution playback on a hard level.
await page.getByRole('tab', { name: /Hard/ }).click();
await page.locator('button[title^="Level 27:"]').click();
await sleep(300);
await page.getByRole('button', { name: /Solution/ }).click();
await sleep(6500);
log('Level 27 solution log:', (await page.locator('[role=log]').innerText()).replace(/\n/g, ' '));

await page.getByRole('button', { name: 'Main menu', exact: true }).click();
await sleep(400);
await page.screenshot({ path: `${out}/5-menu-progress.png` });
log('Menu puzzle card:', (await page.locator('section', { hasText: 'Dama Puzzles' }).last().innerText()).replace(/\n/g, ' '));

const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
m.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message));
await m.goto(url);
await m.waitForTimeout(500);
await m.getByRole('button', { name: /Solve Puzzles/ }).click();
await m.waitForTimeout(600);
await m.screenshot({ path: `${out}/6-mobile-puzzle.png`, fullPage: true });

log(`SOLVED ${solvedOk}/${lines.length}`);
log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
