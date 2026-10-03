/* Real browser regression flow against a local in-memory Supabase fixture. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const burger = '44444444-4444-4444-8444-444444444444';

(async () => {
  const fixture = await fs.readFile(path.join(__dirname, 'fixtures/marketing-backend.js'), 'utf8');
  const server = http.createServer(async (req, res) => {
    try {
      const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!filename.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
      const ext = path.extname(filename), types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream'); res.end(await fs.readFile(filename));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.BURGERSHOT_CHROMIUM || undefined, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('/npm/@supabase/supabase-js')) return route.fulfill({ contentType: 'text/javascript', body: fixture });
      if (url.startsWith(origin + '/config.js')) return route.fulfill({ contentType: 'text/javascript', body: 'window.BURGERSHOT_CLOUD={supabaseUrl:"https://example.invalid",supabaseAnonKey:"test-only"};' });
      if (url.startsWith(origin + '/')) return route.continue();
      return route.abort();
    });
    await context.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__copied = text; } } }); });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    page.setDefaultTimeout(10000);
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    await page.goto(origin + '/index.html');
    await page.waitForSelector('#app:not(.hidden)');
    const nav = async name => { if (await page.locator('#mobileMenu').isVisible()) await page.click('#mobileMenu'); await page.click(`.nav-item[data-page="${name}"]`); };

    await nav('announcements');
    await page.fill('#mktVar-ubicacion', 'Vespucci, junto a la playa'); await page.fill('#mktVar-horario', 'Hoy desde las 20:00'); await page.fill('#mktPrefix', '/anuncio');
    await page.click('#mktCopy');
    assert.match(await page.evaluate(() => window.__copied), /^\/anuncio ¡BurgerShot está abierto!/);
    await page.fill('#mktTemplateName', 'Apertura de noche'); await page.click('#mktSaveTemplate');
    await page.waitForFunction(() => document.querySelector('#mktTemplate').value.length === 36);
    assert.equal(await page.locator('#mktUpdateTemplate').isVisible(), true);
    await page.screenshot({ path: path.join(root, 'test-results/announcements-desktop.png'), fullPage: true, animations: 'disabled', style: '#toastHost{visibility:hidden!important}' });
    console.log('PASS announcement editing, copying and shared saving');

    await nav('coupons'); await page.click('[data-coupon-announce]');
    assert.match(await page.inputValue('#mktOutput'), /BIENVENIDA15/); assert.match(await page.inputValue('#mktOutput'), /No acumulable/);
    await nav('coupons'); await page.click('#mktNewCoupon');
    await page.fill('#mktCouponName', 'Diez para probar'); await page.fill('#mktCouponCode', 'nuevo10'); await page.fill('#mktCouponAmount', '10'); await page.click('#mktSaveCoupon');
    await page.waitForSelector('#mktCouponModal.hidden', { state: 'attached' });
    await page.waitForFunction(() => document.querySelectorAll('.mkt-coupon').length === 2);
    await page.screenshot({ path: path.join(root, 'test-results/coupons-desktop.png'), fullPage: true, animations: 'disabled', style: '#toastHost{visibility:hidden!important}' });
    console.log('PASS coupon creation and announcement from coupon');

    await nav('pos'); await page.click(`[data-add="${burger}"]`); await page.selectOption('#discountSelect', 'vip');
    assert.equal(await page.textContent('#grandTotal'), '$150');
    await page.fill('#pos-coupon-code', 'bienvenida15'); await page.click('#mktCouponEntry [data-apply]');
    await page.waitForFunction(() => document.querySelector('#grandTotal').textContent === '$170');
    assert.equal(await page.locator('#discountSelect').isDisabled(), true);
    await page.click(`[data-q="${burger}"][data-d="1"]`);
    assert.equal(await page.locator('#checkoutBtn').isDisabled(), true);
    await page.click('#mktCouponEntry [data-apply]'); await page.waitForFunction(() => document.querySelector('#grandTotal').textContent === '$340');
    await page.fill('#pos-coupon-code', 'INVALID');
    assert.equal(await page.locator('#discountSelect').isDisabled(), false); assert.equal(await page.textContent('#grandTotal'), '$300');
    await page.fill('#pos-coupon-code', 'BIENVENIDA15'); await page.click('#mktCouponEntry [data-apply]'); await page.waitForFunction(() => document.querySelector('#grandTotal').textContent === '$340');
    await page.screenshot({ path: path.join(root, 'test-results/pos-coupon.png'), fullPage: true, animations: 'disabled', style: '#toastHost{visibility:hidden!important}' });
    console.log('PASS coupon replaces convenio, cart changes invalidate it, editing code clears it');

    await page.click('#checkoutBtn'); await page.fill('#saleClient', 'Cliente 10');
    if (await page.locator('#bsReceived').isVisible()) { await page.fill('#bsReceived', '340'); await page.check('#bsPaid'); }
    await page.evaluate(() => { window.__failRedemption = true; });
    await page.click('#confirmSaleBtn');
    await page.waitForFunction(() => window.__mock.calls.filter(c => c.name === 'redeem_burgershot_coupon').length === 1 && !document.querySelector('#confirmSaleBtn').disabled);
    await page.click('#confirmSaleBtn'); await page.waitForSelector('#checkoutModal.hidden', { state: 'attached' });
    const result = await page.evaluate(() => ({ calls: window.__mock.calls.filter(c => c.name === 'redeem_burgershot_coupon'), sales: window.__mock.db.sales }));
    assert.equal(result.calls.length, 2); assert.equal(result.calls[0].p.p_request_id, result.calls[1].p.p_request_id); assert.equal(result.sales.length, 1); assert.equal(result.sales[0].total, 340);
    assert.equal(await page.locator('#pos-coupon-code').isDisabled(), false);
    await nav('allSales'); await page.click('#allSalesBody [data-sale]'); assert.equal(await page.locator('#editSaleBtn').count(), 0);
    await page.click('[data-close="saleDetailModal"]');
    console.log('PASS lost-response retry uses the same request ID and protects the saved financial snapshot');

    await nav('companion'); await page.click('[data-bs-tab="all"]'); await page.click(`[data-bs-add="${burger}"]`);
    await page.click('.bs-options summary'); await page.fill('#aux-coupon-code', 'BIENVENIDA15'); await page.click('.bs-options [data-apply]');
    await page.waitForFunction(() => document.querySelector('#bsTotal').textContent === '$170');
    assert.equal(await page.locator('#bsDiscount').isDisabled(), true);
    await page.click('.bs-options [data-remove]'); assert.equal(await page.locator('#bsDiscount').isDisabled(), false);
    console.log('PASS coupon works in the auxiliary register');

    await page.setViewportSize({ width: 390, height: 844 }); await nav('announcements');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(root, 'test-results/announcements-mobile.png'), fullPage: true, animations: 'disabled', style: '#toastHost{visibility:hidden!important}' });
    await nav('coupons'); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(root, 'test-results/coupons-mobile.png'), fullPage: true, animations: 'disabled', style: '#toastHost{visibility:hidden!important}' });
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.evaluate(() => { window.__mock.profile.role = 'cashier'; }); await page.click('#refreshBtn');
    await page.waitForFunction(() => document.querySelector('[data-page="coupons"]').classList.contains('hidden'));
    await nav('announcements'); assert.equal(await page.locator('#mktSharedEditor').isVisible(), false);
    console.log('PASS mobile layout and employee/admin visibility');

    await page.evaluate(() => { window.__missingMarketing = true; }); await nav('announcements');
    await page.waitForFunction(() => document.querySelector('#mktTemplatesStatus').textContent.includes('no están disponibles'));
    await page.selectOption('#mktTemplate', 'closing'); assert.equal(await page.locator('#mktCopy').isDisabled(), false);
    await nav('pos'); assert.equal(await page.locator('#checkoutBtn').isDisabled(), false);
    assert.deepEqual(errors, []);
    console.log('PASS base templates and ordinary checkout work if the migration is missing; no browser exceptions');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
