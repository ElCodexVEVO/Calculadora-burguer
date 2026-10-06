'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const preview = path.resolve(__dirname, '../preview');
const base = path.resolve(__dirname, '..');
const results = [];
const pass = name => { results.push(name); console.log('PASS ' + name); };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Serve the demo from disk through intercepted HTTP requests. No external services.
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if(url.hostname !== 'burgershot.test')return route.abort();
      const file = path.resolve(base, '.' + decodeURIComponent(url.pathname));
      if(!file.startsWith(base + path.sep) || !fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
      await route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
    });
    let acceptDialog = true;
    page.on('dialog', d => acceptDialog ? d.accept() : d.dismiss());
    await page.goto('http://burgershot.test/DEMO_V6.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#app').waitFor({ state: 'visible' });
    await page.locator('[data-page="pos"]').click();
    await page.evaluate(() => {
      window.addEvents = [];
      document.addEventListener('bs:cart-added', e => window.addEvents.push(e.detail));
    });
    const card = page.locator('[data-product="p0"]');
    const quantity = page.locator('#bulkQty-p0');
    const add = page.locator('[data-add="p0"]');
    const count = () => page.locator('#orderCount').textContent();
    const clear = () => page.locator('#clearCartBtn').click();
    await quantity.fill('10');
    assert.equal(await add.innerText(), 'Agregar 10');
    assert.equal(await card.locator('[data-bulk-preview]').innerText(), '10 × $280 = $2,800');
    await add.click();
    assert.equal(await count(), '10');
    assert.equal(await page.locator('#grandTotal').textContent(), '$2,800');
    assert.equal(await quantity.inputValue(), '1');
    assert.match(await card.locator('[data-add-feedback]').innerText(), /10 unidades añadidas/);
    assert.match(await page.locator('#posAddStatus').textContent(), /10 × Combo Hamburguesa/);
    pass('Cantidad escrita agrega diez unidades en un solo clic, con total y confirmación correctos');

    await card.locator('[data-add-preset][data-quantity="5"]').click();
    assert.equal(await count(), '15');
    for (const n of [10, 25, 50]) await card.locator(`[data-add-preset][data-quantity="${n}"]`).click();
    assert.equal(await count(), '100');
    assert.equal(await page.locator('#grandTotal').textContent(), '$28,000');
    pass('Accesos +5, +10, +25 y +50 suman la cantidad exacta al pedido existente');

    await clear();
    await page.waitForTimeout(700);
    await quantity.fill('7');
    await quantity.press('Enter');
    assert.equal(await count(), '7');
    assert.equal(await page.evaluate(() => window.addEvents.at(-1).quantity), 7);
    assert.equal(await page.locator('.bs-fly-quantity').innerText(), '×7');
    pass('Enter agrega la cantidad una sola vez y emite el evento de animación');
    await clear();
    const eventsBefore = await page.evaluate(() => window.addEvents.length);
    for (const invalid of ['', '0', '-1', '1.5', '10000']) {
      await quantity.fill(invalid);
      assert.equal(await add.isDisabled(), true, invalid);
      assert.equal(await quantity.getAttribute('aria-invalid'), 'true');
      await quantity.press('Enter');
      assert.equal(await count(), '0');
      assert.equal(await page.evaluate(() => window.addEvents.length), eventsBefore);
    }
    pass('Vacío, cero, negativos, decimales y cantidades fuera del límite no se agregan ni animan');

    acceptDialog = false;
    await quantity.fill('100');
    await add.click();
    assert.equal(await count(), '0');
    assert.equal(await page.evaluate(() => window.addEvents.length), eventsBefore);
    acceptDialog = true;
    await add.click();
    assert.equal(await count(), '100');
    pass('Cancelar una cantidad grande conserva el pedido; confirmar agrega las cien unidades');

    await clear();
    await quantity.fill('9999');
    await add.click();
    assert.equal(await count(), '9999');
    const eventsAtLimit = await page.evaluate(() => window.addEvents.length);
    await card.locator('[data-add-preset][data-quantity="5"]').click();
    assert.equal(await count(), '9999');
    assert.equal(await page.evaluate(() => window.addEvents.length), eventsAtLimit);
    pass('El límite de 9,999 se respeta también al sumar accesos rápidos');

    await clear();
    await quantity.fill('10'); await add.click();
    await page.locator('#bulkQty-p8').fill('3');
    await page.locator('[data-add="p8"]').click();
    assert.equal(await count(), '13');
    assert.equal(await page.locator('#grandTotal').textContent(), '$3,100');
    const generalDiscount = await page.evaluate(() => window.fixture.db.discounts.find(d => d.name === 'YKZ').id);
    await page.locator('#discountSelect').selectOption(generalDiscount);
    assert.equal(await page.locator('#grandTotal').textContent(), '$2,790');
    await page.locator('#orderClient').fill('Prueba de cantidades');
    await page.locator('#checkoutBtn').click();
    await page.locator('#confirmSaleBtn').click();
    await page.waitForFunction(() => document.getElementById('orderCount').textContent === '0');
    const saved = await page.evaluate(() => window.fixture.db.sales.find(s => s.client === 'Prueba de cantidades'));
    assert.equal(saved.total, 2790);
    assert.deepEqual(saved.items.map(i => i.qty), [10, 3]);
    pass('Cobro de dos productos con cantidades distintas conserva descuento y unidades en la venta demo');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await quantity.fill('10'); await quantity.press('Enter');
    assert.equal(await count(), '10');
    assert.equal(await page.locator('.bs-fly').count(), 0);
    assert.equal(await card.evaluate(el => getComputedStyle(el).animationName), 'none');
    pass('Movimiento reducido mantiene las cantidades y suprime la animación');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => document.body.classList.add('motion-off'));
    await quantity.fill('2'); await quantity.press('Enter');
    assert.equal(await count(), '12');
    assert.equal(await page.locator('.bs-fly').count(), 0);
    await page.evaluate(() => document.body.classList.remove('motion-off'));
    pass('El ajuste de animaciones apagadas también respeta el teclado');

    await clear();
    await page.locator('#discountSelect').selectOption('d0');
    await quantity.fill('10'); await add.click();
    await page.locator('#bulkQty-p8').fill('3'); await page.locator('[data-add="p8"]').click();
    await quantity.fill('10');
    fs.mkdirSync(preview, { recursive: true });
    await page.locator('#toastHost').evaluate(el => el.replaceChildren());
    await page.evaluate(() => { document.getElementById('productGrid').scrollTop=0; window.scrollTo(0,0); });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(preview, 'caja-rapida-escritorio.png'), fullPage: true });
    await card.screenshot({ path: path.join(preview, 'tarjeta-cantidad.png') });

    for (const width of [320, 360, 390, 768, 1120, 1440, 1600]) {
      await page.setViewportSize({ width, height: 1000 });
      await quantity.fill('9999');
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page overflow at ' + width);
      const overflow = await card.evaluate(el => [...el.querySelectorAll('.bulk-quantity-row,.bulk-presets,.bulk-preview')].some(x => x.scrollWidth > x.clientWidth + 1));
      assert.equal(overflow, false, 'Quantity controls overflow at ' + width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await quantity.fill('10');
    await page.evaluate(() => { document.getElementById('productGrid').scrollTop=0; window.scrollTo(0,0); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(preview, 'caja-rapida-movil.png'), fullPage: true });
    pass('Página y controles sin desbordamiento en siete anchos entre 320 y 1600 px');
    assert.deepEqual(errors, []);
    pass('Sin errores de JavaScript en el navegador');
    fs.writeFileSync(path.join(__dirname, 'caja-rapida-results.json'), JSON.stringify({ scenarios: results, count: results.length, errors, environment: 'Chromium headless; DEMO_V6 con Supabase simulado y archivos locales, sin ventas reales' }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
