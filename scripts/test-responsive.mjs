import assert from 'node:assert/strict';
import { createServer } from 'node:https';
import { readFile, readdir, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { extname, resolve, sep } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

// Test the built site with the same security headers used in production.
const root = resolve('dist');
await readFile(resolve(root, 'index.html'));
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const certificates = await mkdtemp(resolve(tmpdir(), 'portfolio-test-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost', '-keyout', resolve(certificates, 'key.pem'), '-out', resolve(certificates, 'cert.pem')], { stdio: 'ignore' });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer({ key: await readFile(resolve(certificates, 'key.pem')), cert: await readFile(resolve(certificates, 'cert.pem')) }, async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname}${extname(pathname) ? '' : '/index.html'}`);
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    for (const group of config.headers) {
      if (group.source === '/(.*)' || pathname.startsWith(group.source.replace('(.*)', ''))) {
        for (const header of group.headers) response.setHeader(header.key, header.value);
      }
    }
    const contentType = mime[extname(file)] ?? 'application/octet-stream';
    response.setHeader('Content-Type', contentType);
    const body = await readFile(file);
    if (request.headers['accept-encoding']?.includes('gzip') && /text\/|application\/(json|xml)/.test(contentType)) {
      response.setHeader('Content-Encoding', 'gzip');
      response.setHeader('Vary', 'Accept-Encoding');
      response.end(gzipSync(body));
    } else response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html' }).end(await readFile(resolve(root, '404.html')));
  }
});
await new Promise(resolve => server.listen(process.argv.includes('--serve') ? 4323 : 0, '127.0.0.1', resolve));
const origin = `https://127.0.0.1:${server.address().port}`;
console.log(`Production test server: ${origin}`);
if (process.argv.includes('--serve')) await new Promise(() => {});

const paths = ['/', '/about', '/projects', '/blogs', '/404.html', ...(await readdir(resolve(root, 'blog'))).map(slug => `/blog/${slug}`)];
const widths = [320, 360, 375, 390, 430, 768, 820, 1023, 1024, 1280, 1440, 1920];
const artifacts = resolve('test-results');
await mkdir(artifacts, { recursive: true });
let cases = 0;
try {
  for (const [engine, type] of Object.entries({ chromium, firefox, webkit }).filter(([name]) => !process.env.TEST_BROWSER || name === process.env.TEST_BROWSER)) {
    const browser = await type.launch();
    try {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      // Isolate first-party functionality from third-party availability.
      await context.route('**/*', route => {
        const url = route.request().url();
        return url.startsWith(origin) && !url.includes('/_vercel/')
          ? route.continue()
          : route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
      });
      const page = await context.newPage();
      const errors = [];
      const missing = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && /Content Security Policy|content.security.policy/i.test(message.text())) errors.push(message.text());
      });
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) missing.push(response.url()); });
      for (const path of paths) {
        await page.goto(origin + path, { waitUntil: 'load' });
        await page.locator('#site-navigation[data-menu-open]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('h1').count(), 1, `${engine} ${path}: one main heading`);
        assert.equal(await page.locator('main').count(), 1, `${engine} ${path}: one main landmark`);
        for (const width of widths) {
          await page.setViewportSize({ width, height: 844 });
          // WebKit applies media-query layout changes on the next rendering frame.
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const layout = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
          assert.ok(layout.content <= layout.viewport + 1, `${engine} ${path} ${width}px: horizontal overflow ${JSON.stringify(layout)}`);
          const toggle = page.locator('#navigation-toggle');
          const menu = page.locator('#primary-navigation');
          // Safari excludes the scrollbar from the media-query viewport.
          const desktop = await page.evaluate(() => matchMedia('(min-width: 1024px)').matches);
          if (!desktop) {
            await toggle.waitFor({ state: 'visible' });
            assert.equal(await menu.isVisible(), false, `${engine} ${path}: mobile menu starts closed`);
            await toggle.click();
            assert.equal(await menu.isVisible(), true, `${engine} ${path}: mobile menu opens`);
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
            await page.keyboard.press('Escape');
            assert.equal(await menu.isVisible(), false, `${engine} ${path} ${width}px: Escape closes menu`);
            assert.equal(await toggle.evaluate(button => document.activeElement === button), true);
          } else {
            await toggle.waitFor({ state: 'hidden' });
            assert.equal(await toggle.isVisible(), false);
            assert.equal(await menu.isVisible(), true, `${engine} ${path}: desktop links stay visible`);
          }
          cases++;
        }
        const socialImage = new URL(await page.locator('meta[property="og:image"]').getAttribute('content'));
        assert.equal((await context.request.get(origin + socialImage.pathname)).status(), 200, `${path}: social image exists`);
      }

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(origin + '/');
      const toggle = page.locator('#navigation-toggle');
      const menu = page.locator('#primary-navigation');
      await toggle.focus();
      await page.keyboard.press('Enter');
      assert.equal(await menu.isVisible(), true, 'Keyboard opens mobile menu');
      await page.keyboard.press('Space');
      assert.equal(await menu.isVisible(), false, 'Keyboard closes mobile menu');
      await toggle.click();
      await page.locator('h1').click();
      assert.equal(await menu.isVisible(), false, 'Outside click closes menu');
      await toggle.click();
      await page.setViewportSize({ width: 1280, height: 844 });
      await toggle.waitFor({ state: 'hidden' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Desktop resize clears expanded state');
      assert.equal(await menu.isVisible(), true);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(() => document.getElementById('navigation-toggle').getAttribute('aria-expanded') === 'false');
      assert.equal(await menu.isVisible(), false, 'Resize resets mobile menu');
      await toggle.click();
      await page.getByRole('link', { name: 'Projects', exact: true }).click();
      await page.waitForURL(origin + '/projects');
      assert.equal(await page.locator('#primary-navigation a[aria-current="page"]').getAttribute('href'), '/projects');
      await page.screenshot({ path: resolve(artifacts, `${engine}-projects-mobile.png`) });

      await page.goto(origin + '/blogs');
      const filters = page.locator('[data-blog-filter]');
      for (const button of await filters.all()) {
        const tag = await button.getAttribute('data-blog-filter');
        await button.click();
        const cards = await page.locator('[data-blog-card]').evaluateAll(cards => cards.map(card => ({ hidden: card.hidden, visible: card.getBoundingClientRect().height > 0, tags: card.dataset.tags.split(',') })));
        assert.ok(cards.every(card => card.hidden === (tag !== 'all' && !card.tags.includes(tag)) && card.visible !== card.hidden), `${engine}: blog filter ${tag}`);
      }

      await page.goto(origin + '/blog/cara-install-composer');
      assert.ok(await page.locator('.article-body').innerText(), 'Article renders after content migration');
      const copy = page.getByRole('button', { name: 'Copy code to clipboard' }).first();
      await copy.focus();
      assert.equal(await copy.isVisible(), true, 'Code copy is reachable by keyboard');
      await copy.click();
      await page.waitForFunction(() => document.querySelector('.code-copy-btn').classList.contains('copied'));
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForFunction(() => document.getElementById('back-to-top').tabIndex === 0);
      await page.getByRole('button', { name: 'Kembali ke atas' }).click();
      await page.waitForFunction(() => window.scrollY === 0);
      await page.waitForFunction(() => document.getElementById('back-to-top').tabIndex === -1);

      await page.goto(origin + '/');
      await page.screenshot({ path: resolve(artifacts, `${engine}-home-mobile.png`), fullPage: true });
      assert.ok(parseFloat(await page.locator('.animate-marquee2').evaluate(element => getComputedStyle(element).animationDuration)) < 0.001, 'Reduced motion disables banner animation');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('.animate-marquee2').evaluate(element => getComputedStyle(element).animationDuration), '25s');
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.evaluate(() => Promise.all([...document.images].filter(image => image.loading !== 'lazy').map(image => image.decode())));
      await page.screenshot({ path: resolve(artifacts, `${engine}-home-desktop.png`), fullPage: true });

      const touch = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: engine !== 'firefox', reducedMotion: 'reduce' });
      await touch.route('**/*', route => route.request().url().startsWith(origin) && !route.request().url().includes('/_vercel/') ? route.continue() : route.fulfill({ contentType: 'text/javascript', body: '' }));
      const touchPage = await touch.newPage();
      for (const path of paths) {
        await touchPage.goto(origin + path);
        const mobileToggle = touchPage.locator('#navigation-toggle');
        await mobileToggle.tap();
        assert.equal(await touchPage.locator('#primary-navigation').isVisible(), true, `${engine} ${path}: touch opens menu`);
        await mobileToggle.tap();
        assert.equal(await touchPage.locator('#primary-navigation').isVisible(), false, `${engine} ${path}: touch closes menu`);
      }
      await touchPage.setViewportSize({ width: 844, height: 390 });
      await touchPage.locator('#navigation-toggle').tap();
      assert.equal(await touchPage.locator('#primary-navigation').isVisible(), true, 'Landscape menu opens');
      const landscape = await touchPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      assert.equal(landscape, true, 'Landscape does not overflow');
      await touch.close();

      // No installed voices must not delay playback indefinitely.
      await page.addInitScript(() => {
        window.audioCalls = [];
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class { constructor(text) { this.text = text; } } });
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
          paused: false, getVoices: () => [], addEventListener() {},
          speak(utterance) { window.audioCalls.push(utterance.text); }, cancel() {},
          pause() { this.paused = true; }, resume() { this.paused = false; },
        } });
      });
      await page.goto(origin + '/blog/cara-install-composer');
      await page.setViewportSize({ width: 320, height: 640 });
      await page.locator('#listen-btn').click();
      await page.locator('#player').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#back-to-top').evaluate(button => button.hidden), true, 'Audio panel does not overlap back-to-top');
      for (const viewport of [{ width: 320, height: 640 }, { width: 844, height: 240 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.locator('#player').evaluate(player => {
          const box = player.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
        }), true, 'Audio panel fits narrow screens and short landscape viewports');
      }
      assert.ok(await page.evaluate(() => window.audioCalls[0]?.length > 0), 'Audio starts without waiting for voices');
      await page.locator('#btn-play').click();
      assert.equal(await page.locator('#btn-play').getAttribute('aria-label'), 'Lanjutkan pembacaan');
      await page.locator('#btn-play').click();
      assert.equal(await page.locator('#btn-play').getAttribute('aria-label'), 'Jeda pembacaan');
      await page.locator('#audio-progress').fill('100');
      await page.locator('#audio-progress').dispatchEvent('change');
      assert.equal(await page.locator('#btn-play').getAttribute('aria-label'), 'Lanjutkan pembacaan');
      await page.locator('#btn-play').click();
      assert.equal(await page.evaluate(() => window.audioCalls.length), 2, 'Finished audio replays from beginning');
      await page.locator('#player-close').click();
      await page.locator('#listen-btn').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#back-to-top').evaluate(button => button.hidden), false);

      const unsupported = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
      await unsupported.addInitScript(() => {
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: undefined });
      });
      const unsupportedPage = await unsupported.newPage();
      await unsupportedPage.goto(origin + '/blog/cara-install-composer');
      await unsupportedPage.locator('#site-navigation[data-menu-open]').waitFor();
      assert.equal(await unsupportedPage.locator('#listen-btn').count(), 0, 'Unsupported browsers omit unavailable audio control');
      await unsupported.close();

      const noJS = await browser.newContext({ ignoreHTTPSErrors: true, javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
      const fallback = await noJS.newPage();
      await fallback.goto(origin + '/');
      assert.equal(await fallback.locator('#primary-navigation').isVisible(), true, 'Navigation works without JavaScript');
      assert.equal(await fallback.locator('#navigation-toggle').isVisible(), false);
      await noJS.close();
      assert.deepEqual(errors, [], `${engine}: browser errors`);
      assert.deepEqual(missing, [], `${engine}: missing first-party assets`);
      console.log(`${engine}: ${paths.length} pages × ${widths.length} widths + interactions passed`);
      await context.close();
    } finally { await browser.close(); }
  }
  console.log(`Passed ${cases} responsive page cases.`);
} finally { server.close(); await rm(certificates, { recursive: true }); }
