import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'comparison', process.argv[2] || 'b3-audit.json');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
// Observe the application's own calls; do not inject or trigger any media playback.
await context.addInitScript(() => {
  window.__b3MediaCalls = [];
  const record = kind => window.__b3MediaCalls.push(kind);
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) { record('HTMLMediaElement.play'); return play.apply(this, args); };
  for (const name of ['Audio', 'AudioContext', 'webkitAudioContext']) {
    if (window[name]) window[name] = new Proxy(window[name], { construct(Target, args) { record(name); return Reflect.construct(Target, args); } });
  }
  if (window.speechSynthesis) {
    const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (...args) => { record('speechSynthesis.speak'); return speak(...args); };
  }
  document.addEventListener('play', () => record('media play event'), true);
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const states = [];
const requests = [];
const pageErrors = [];
page.on('request', request => requests.push(request.url()));
page.on('pageerror', error => pageErrors.push(error.message));
const button = name => page.getByRole('button', { name, exact: true });

function ratio(fg, bg) {
  const luminance = rgb => rgb.slice(0, 3).map(x => x / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
    .reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i], 0);
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

async function inspect(label) {
  for (const img of await page.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el => el.decode());
  }
  const dom = await page.evaluate(() => {
    const css = element => {
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor, opacity: style.opacity };
    };
    return {
      viewport: { width: innerWidth, documentWidth: document.documentElement.scrollWidth },
      images: [...document.images].map(img => {
        const figure = img.closest('figure');
        const rect = img.getBoundingClientRect();
        return { src: img.currentSrc, alt: img.getAttribute('alt'), complete: img.complete, naturalWidth: img.naturalWidth,
          decorative: img.classList.contains('cart-icon'), parentButtonName: img.closest('button')?.textContent.trim() ?? null,
          textBelowImage: figure ? [...figure.querySelectorAll('figcaption')].every(caption => caption.getBoundingClientRect().top >= rect.bottom - 1) : null,
          captionStyle: figure?.querySelector('figcaption') ? css(figure.querySelector('figcaption')) : null };
      }),
      mediaElements: [...document.querySelectorAll('audio,video,iframe,embed,object,[autoplay]')].map(el => el.outerHTML),
      mediaCalls: [...window.__b3MediaCalls],
      cssImageBackgrounds: [...document.querySelectorAll('*')].filter(el => getComputedStyle(el).backgroundImage !== 'none').map(el => ({ tag: el.tagName, image: getComputedStyle(el).backgroundImage })),
      colors: [...document.querySelectorAll('.product-photo figcaption,.badge,.off .sub,.off .btn')].map(el => ({ text: el.textContent.trim(), ...css(el), parent: css(el.parentElement) })),
      statusRegions: [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map(el => ({ role: el.getAttribute('role'), live: el.getAttribute('aria-live'), text: el.textContent.trim() })),
    };
  });
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations;
  for (const color of dom.colors) {
    const fg = color.color.match(/[\d.]+/g).map(Number);
    const bg = color.background.match(/[\d.]+/g).map(Number);
    const inherited = color.parent.background.match(/[\d.]+/g).map(Number);
    // These sampled elements sit on opaque cards; axe independently covers opacity.
    const surface = bg[3] === 0 ? inherited : bg;
    color.contrast = surface[3] === 0 ? null : ratio(fg, surface);
  }
  states.push({ label, ...dom, axeViolations: violations });
  console.log(`${violations.length ? 'FAIL' : 'PASS'} ${label}: ${dom.images.length} images; ${violations.length} axe violations`);
}

function sourceFiles(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(path.join(folder, entry.name)) : [path.join(folder, entry.name)]);
}
const scanned = [...sourceFiles(path.join(root, 'web/src')), path.join(root, 'web/index.html'), ...sourceFiles(path.join(root, 'web/public')).filter(file => /\.(?:html|svg)$/.test(file))];
const playbackPattern = /<\s*(?:audio|video|track|iframe|embed|object)\b|\bautoplay\b|\bnew\s+Audio\s*\(|\b(?:webkit)?AudioContext\b|speechSynthesis|\.play\s*\(/gi;
const playbackMatches = scanned.flatMap(file => readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line, index) => {
  playbackPattern.lastIndex = 0;
  return playbackPattern.test(line) ? [{ file: path.relative(root, file).replaceAll('\\', '/'), line: index + 1, text: line }] : [];
}));
try {
  await page.goto('http://127.0.0.1:4174');
  await button('Add Cheeseburger to cart').waitFor();
  for (const category of ['Burgers', 'Drinks', 'Desserts']) { await button(category).click(); await inspect(`360 px menu: ${category}`); }
  await page.getByRole('searchbox').fill('no-such-product');
  await inspect('360 px menu: empty search');
  await button('Cart').click();
  await inspect('360 px empty cart');
  await button('My orders').click();
  await inspect('360 px empty customer orders');
  await button('Orders (staff)').click();
  await inspect('360 px staff login');
  await page.getByLabel('Username', { exact: true }).fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('wrong-test-password');
  await button('Sign in').click();
  await page.getByRole('alert').waitFor();
  await inspect('360 px login error');
  await page.getByLabel('Password', { exact: true }).fill('admin123');
  await button('Sign in').click();
  await button('Manage menu').click();
  await button('Add product').click();
  await inspect('360 px new product form');
  await button('Save product').click();
  await page.getByRole('alert').waitFor();
  await inspect('360 px product validation error');
  await button('Cancel').click();
  const cheeseburger = page.locator('.card').filter({ has: page.getByText('Cheeseburger', { exact: true }) });
  await cheeseburger.getByRole('button', { name: 'Edit', exact: true }).click();
  await inspect('360 px edit product form');
  await button('Cancel').click();
  await cheeseburger.getByRole('button', { name: 'Disable', exact: true }).click();
  await cheeseburger.getByText('Burgers · Disabled — hidden from customers', { exact: true }).waitFor();
  await inspect('360 px inactive product: Edit and Enable remain active');
  await page.screenshot({ path: path.join(root, 'comparison/b3-inactive-product-360.png'), fullPage: true });
  await cheeseburger.getByRole('button', { name: 'Enable', exact: true }).click();
  await button('Menu').click();
  await button('Burgers').click();
  await button('Add Cheeseburger to cart').click();
  await page.getByRole('status').filter({ hasText: 'Cheeseburger added to cart.' }).waitFor();
  await inspect('360 px cart feedback and decorative SVG');
  await button('Cart (1)').click();
  await inspect('360 px populated cart');
  await button('PLACE ORDER').click();
  await page.getByText('Order #152', { exact: true }).waitFor();
  // Add visual-status fixtures only inside this disposable browser context.
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('cafe-mock-v1'));
    const source = db.orders.find(order => order.id === 152);
    for (const [i, status] of ['Preparing', 'Ready', 'Completed', 'Cancelled'].entries()) {
      db.orders.push({ ...source, id: 900 + i, status });
    }
    localStorage.setItem('cafe-mock-v1', JSON.stringify(db));
    localStorage.setItem('cafe-my-orders', JSON.stringify([152, 900, 901, 902, 903]));
  });
  await button('Menu').click();
  await button('My orders').click();
  await page.getByText('Order #903', { exact: true }).waitFor();
  await inspect('360 px customer orders: all five status labels');
  await button('Orders (staff)').click();
  for (const filter of ['All', 'New', 'Preparing', 'Ready', 'Completed']) { await button(filter).click(); await inspect(`360 px staff orders: ${filter}`); }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const view of ['Menu', 'Cart', 'My orders', 'Orders (staff)', 'Manage menu']) {
    await button(view).click(); await inspect(`1280 px ${view}`);
  }
  await page.goto('http://127.0.0.1:4174/media/credits.html');
  await inspect('1280 px image credits');
  await page.setViewportSize({ width: 360, height: 800 });
  await inspect('360 px image credits');
  const decorative = states.flatMap(state => state.images).filter(img => img.decorative);
  const meaningful = states.flatMap(state => state.images).filter(img => !img.decorative);
  const imageErrors = [...meaningful.filter(img => !img.alt?.trim()), ...decorative.filter(img => img.alt !== '' || img.parentButtonName !== 'View Cart')];
  const overlaps = meaningful.filter(img => img.textBelowImage !== true);
  const mediaRequests = requests.filter(url => /\.(?:mp3|wav|mp4|webm|ogg|m4a)(?:\?|$)/i.test(url));
  const report = { browser: browser.version(), environment: 'Production demo on port 4174; isolated temporary context; viewport 360×800 and 1280×900',
    sourceFilesScanned: scanned.map(file => path.relative(root, file).replaceAll('\\', '/')), playbackMatches, mediaRequests, pageErrors,
    summary: { states: states.length, meaningfulPhotoSources: [...new Set(meaningful.map(img => img.src))], imageErrors, overlaps,
      decorativeAppearances: decorative.length, audioVideoElements: states.flatMap(state => state.mediaElements),
      playbackCalls: states.flatMap(state => state.mediaCalls), cssImageBackgrounds: states.flatMap(state => state.cssImageBackgrounds),
      violations: states.flatMap(state => state.axeViolations.map(violation => ({ state: state.label, id: violation.id, nodes: violation.nodes }))) }, states };
  writeFileSync(output, JSON.stringify(report, null, 2));
  assert.deepEqual(imageErrors, []);
  assert.deepEqual(overlaps, []);
  assert.deepEqual(playbackMatches, []);
  assert.deepEqual(mediaRequests, []);
  assert.deepEqual(report.summary.audioVideoElements, []);
  assert.deepEqual(report.summary.playbackCalls, []);
  assert.deepEqual(report.summary.cssImageBackgrounds, []);
  assert.deepEqual(pageErrors, []);
  assert.ok(states.every(state => state.viewport.documentWidth <= state.viewport.width));
  assert.deepEqual(report.summary.violations, [], 'See the saved JSON for actual violations');
} finally {
  await context.close();
  await browser.close();
}
