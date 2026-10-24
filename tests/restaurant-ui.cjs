// Integración del restaurante con app.js en jsdom (sin WebGL: se valida también la vista 2D de respaldo).
// Los importes esperados son los mismos de regression.cjs: el mostrador no tiene fórmulas propias.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(base, f), 'utf8');
const html = read('index.html');
const fixture = fs.readFileSync(path.join(__dirname, 'mock-supabase.js'), 'utf8');
const scripts = ['companion-core.js', 'companion.js', 'v6-core.js', 'v6-modules.js', 'restaurant-presence.js', 'restaurant.js', 'app.js'];
let passed = 0;
const ok = name => { passed++; console.log('PASS ' + name); };
const settle = (ms = 40) => new Promise(r => setTimeout(r, ms));

function presenceChannelFactory(w) {
  const channels = [];
  return {
    channels,
    make(name, opts) {
      const ch = {
        name, opts, tracked: [], untracked: 0, listeners: [], status: null, state: {},
        on(type, filter, cb) { this.listeners.push({ type, filter, cb }); return this; },
        subscribe(cb) { this.status = cb; setTimeout(() => cb('SUBSCRIBED'), 0); return this; },
        async track(payload) { this.tracked.push(JSON.parse(JSON.stringify(payload))); return 'ok'; },
        async untrack() { this.untracked++; return 'ok'; },
        presenceState() { return this.state; },
        sync(state) { this.state = state; this.listeners.filter(l => l.type === 'presence').forEach(l => l.cb()); }
      };
      channels.push(ch);
      return ch;
    }
  };
}

async function setup(role = 'admin') {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/CSS|getContext|Not implemented/.test(e.message)) errors.push(e); });
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.confirm = () => true;
  w.eval(fixture);
  w.fixture.db.profiles[0].role = role;
  const client = w.supabase.createClient(), presence = presenceChannelFactory(w), plain = client.channel, removed = [];
  client.channel = (name, opts) => String(name).startsWith('bs-presence-') ? presence.make(name, opts) : plain.call(client, name, opts);
  client.removeChannel = ch => { removed.push(ch); return Promise.resolve('ok'); };
  for (const f of scripts) w.eval(read(f));
  await settle(80);
  const $ = s => w.document.querySelector(s);
  const click = s => { const el = $(s); assert.ok(el, s + ' existe'); el.click(); };
  const change = (s, v) => { $(s).value = v; $(s).dispatchEvent(new w.Event('change', { bubbles: true })); };
  const fill = (s, v) => { $(s).value = v; $(s).dispatchEvent(new w.Event('input', { bubbles: true })); };
  return { dom, w, $, click, change, fill, errors, presence, removed };
}

(async () => {
  const t = await setup('admin');
  const { w, $, click, change, fill, errors, presence } = t;

  // ── Página principal y navegación ──
  assert.equal($('#page-restaurant').classList.contains('active'), true);
  assert.equal($('.nav-item[data-page="restaurant"]').classList.contains('active'), true);
  assert.equal($('.nav-item[data-page="dashboard"] b').textContent, 'Resumen');
  ok('Tras iniciar sesión, el restaurante es la página principal y el resumen sigue en el menú');

  assert.equal($('#rsStage').dataset.view, 'fallback');
  assert.equal($('#rsStage').dataset.stage, 'interior');
  assert.equal($('#rsDock').hidden, false);
  assert.equal(w.sessionStorage.getItem('bs_rs_entered:admin-1'), '1');
  ok('Sin WebGL se entra directamente a la vista 2D con mostrador y equipo disponibles');

  click('.nav-item[data-page="dashboard"]');
  assert.equal($('#page-dashboard').classList.contains('active'), true);
  click('.nav-item[data-page="restaurant"]');
  assert.equal($('#page-restaurant').classList.contains('active'), true);
  ok('El resumen y el restaurante se alternan sin perder el estado');

  // ── Mostrador contra los escenarios de regression.cjs ──
  click('#rsCounterBtn');
  assert.equal($('#rsCounter').hidden, false);
  assert.equal($('#rsProducts').querySelectorAll('[data-rs-add]').length, 30);
  click('[data-rs-add="p3"]'); click('[data-rs-add="p3"]');
  assert.equal($('#rsTotal').textContent, '$560'); assert.equal($('#grandTotal').textContent, '$560');
  assert.equal($('#rsOrderCount').textContent, '2'); assert.equal($('#orderCount').textContent, '2');
  ok('Agregar desde el mostrador usa el mismo carrito y total que la caja');

  const qty = $('[data-rs-qi="p3"]'); qty.value = '125'; qty.dispatchEvent(new w.Event('change', { bubbles: true }));
  assert.equal($('#rsTotal').textContent, '$35,000'); assert.equal($('#grandTotal').textContent, '$35,000');
  click('[data-rs-q="p3"][data-d="-1"]');
  assert.equal($('#orderCount').textContent, '124');
  click('#rsClear');
  assert.equal($('#rsOrderCount').textContent, '0'); assert.equal($('#rsCheckout').disabled, true);
  ok('Cantidades, restar y vaciar operan sobre la orden real');

  click('[data-rs-add="p0"]'); click('[data-rs-add="p8"]');
  change('#rsDiscount', 'd1');
  assert.equal($('#discountSelect').value, 'd1');
  assert.equal($('#rsTotal').textContent, '$285'); assert.equal($('#grandTotal').textContent, '$285');
  assert.equal($('#rsDisc').textContent, '−$95');
  assert.ok($('#rsEarn').textContent.includes('$57')); assert.equal($('#commissionPreview').textContent, '$57');
  ok('Convenio del 25 % y comisión del 20 % idénticos a la caja');

  change('#rsDiscount', 'd2');
  assert.equal($('#rsTotal').textContent, '$310');
  change('#rsDiscount', 'd3'); change('#rsType', 'police');
  assert.equal($('#clientType').value, 'police');
  assert.equal($('#rsTotal').textContent, '$380'); assert.equal($('#rsNote').classList.contains('is-warning'), true);
  assert.equal($('#rsDiscount option[value="d4"]'), null);
  ok('Alcance por hamburguesas, exclusiones de servicios públicos y convenios inactivos se respetan');

  click('#rsClear'); change('#rsType', 'general'); change('#rsDiscount', 'd0');
  click('[data-rs-add="p12"]'); click('#rsCheckout');
  assert.equal($('#checkoutModal').classList.contains('hidden'), true);
  change('#rsType', 'ems'); click('#rsCheckout');
  assert.equal($('#checkoutModal').classList.contains('hidden'), false);
  assert.equal($('#rsTotal').textContent, '$250');
  click('[data-close="checkoutModal"]'); click('#rsClear'); change('#rsType', 'general');
  ok('Un producto restringido no se cobra con otro tipo de cliente');

  // ── Cobro con el flujo existente ──
  click('[data-rs-add="p0"]'); change('#rsDiscount', 'd1'); fill('#rsClient', 'Cliente 3D');
  assert.equal($('#orderClient').value, 'Cliente 3D');
  click('#rsCheckout');
  assert.equal($('#checkoutModal').classList.contains('hidden'), false);
  assert.equal($('#saleClient').value, 'Cliente 3D');
  w.fixture.failNextSale = true; click('#confirmSaleBtn'); await settle();
  assert.equal($('#checkoutModal').classList.contains('hidden'), false);
  assert.equal($('#rsOrderCount').textContent, '1');
  assert.equal($('#rsResult').dataset.kind, 'error');
  ok('Si la venta falla se informa en el mostrador y la orden se conserva');

  const before = w.fixture.calls.filter(c => c.table === 'sales' && c.op === 'insert').length;
  click('#confirmSaleBtn'); await settle(80);
  const inserts = w.fixture.calls.filter(c => c.table === 'sales' && c.op === 'insert');
  assert.equal(inserts.length - before, 1);
  const sale = w.fixture.db.sales[0];
  assert.equal(sale.total, 210); assert.equal(sale.subtotal, 280); assert.equal(sale.discount_amount, 70);
  assert.equal(sale.discount_name, 'Redline Mechanics'); assert.equal(sale.client, 'Cliente 3D'); assert.equal(sale.employee_earnings, 42);
  assert.ok(w.fixture.calls.some(c => c.fn === 'discord-notify' && c.body.event === 'sale_created' && c.body.sale_id === sale.id));
  assert.equal($('#rsResult').dataset.kind, 'ok'); assert.equal($('#rsOrderCount').textContent, '0');
  assert.equal($('#rsCheckout span').textContent, 'Cobrar y registrar');
  ok('El cobro abre el modal existente, registra una sola venta con los mismos importes y avisa a Discord');

  // ── Presencia y actividad ──
  await settle(450);
  const ch = presence.channels[0];
  assert.ok(ch, 'canal de presencia creado'); assert.equal(ch.name, 'bs-presence-store-1');
  const last = ch.tracked.at(-1);
  assert.deepEqual(Object.keys(last).sort(), ['activity', 'at', 'away', 'tab', 'uid', 'zone']);
  assert.equal(last.uid, 'admin-1'); assert.equal(last.activity, 'deliver');
  ok('La presencia publica solo datos mínimos y la actividad «entregando comida» tras cobrar');

  ch.sync({ 'admin-1': [last], 'cashier-1': [{ uid: 'cashier-1', tab: 'a', at: new Date().toISOString(), zone: 'counter', away: false, activity: 'order' }, { uid: 'cashier-1', tab: 'b', at: new Date().toISOString(), zone: 'floor', away: false }], intruder: [{ uid: 'intruder', tab: 'x', at: new Date().toISOString(), zone: 'floor' }] });
  await settle();
  click('#rsTeamBtn');
  const rows = [...$('#rsOnline').querySelectorAll('.rs-person-row')].map(r => r.textContent);
  assert.equal(rows.length, 2);
  assert.ok(rows.some(r => r.includes('María López') && r.includes('Tomando pedido') && r.includes('Permisos individuales')));
  assert.equal($('#rsTeamCount').textContent, '2');
  assert.equal($('#rsRoster').hidden, false);
  ok('Equipo conectado sin duplicados ni identidades ajenas; el administrador ve roles y actividad');

  ch.sync({ 'admin-1': [last] }); await settle();
  assert.equal($('#rsOnline').querySelectorAll('.rs-person-row').length, 1);
  assert.equal($('#rsTeamCount').textContent, '1');
  ok('Quien se desconecta sale del restaurante');

  // ── Secciones con permisos de app.js ──
  click('#rsSectionsBtn');
  const sectionsAdmin = [...$('#rsSectionsMenu').querySelectorAll('[data-rs-go]')].map(b => b.dataset.rsGo);
  assert.ok(sectionsAdmin.includes('administration') && sectionsAdmin.includes('dashboard') && sectionsAdmin.includes('analytics'));
  $('#rsSectionsMenu [data-rs-go="analytics"]').click();
  assert.equal($('#page-analytics').classList.contains('active'), true);
  ok('Las secciones existentes siguen accesibles desde el restaurante');

  // ── Cierre de sesión ──
  await w.supabase.createClient().auth.signOut(); await settle();
  assert.equal(ch.untracked, 1); assert.ok(t.removed.includes(ch));
  assert.equal(w.sessionStorage.getItem('bs_rs_entered:admin-1'), null);
  assert.equal($('#rsCounter').hidden, true);
  ok('Al cerrar sesión se retira la presencia y la próxima entrada vuelve a mostrar la animación');
  assert.deepEqual(errors.map(e => e.message), []);
  ok('Sin errores de ejecución');
  t.dom.window.close();

  // ── Cajero: sin datos administrativos ──
  const c = await setup('cashier');
  c.presence.channels[0].sync({ 'cashier-1': [{ uid: 'cashier-1', tab: 'c', at: new Date().toISOString(), zone: 'floor', away: false }], 'admin-1': [{ uid: 'admin-1', tab: 'z', at: new Date().toISOString(), zone: 'floor', away: false }] });
  await settle();
  c.click('#rsTeamBtn');
  assert.equal(c.$('#rsRoster').hidden, true);
  const adminRow = [...c.$('#rsOnline').querySelectorAll('.rs-person-row')].find(r => r.textContent.includes('Alex Rivera'));
  assert.ok(adminRow); assert.equal(adminRow.textContent.includes('Administrador'), false);
  c.click('#rsSectionsBtn');
  const sectionsCashier = [...c.$('#rsSectionsMenu').querySelectorAll('[data-rs-go]')].map(b => b.dataset.rsGo);
  for (const hidden of ['administration', 'audit', 'products', 'discounts', 'payouts', 'allSales', 'settings']) assert.equal(sectionsCashier.includes(hidden), false, hidden);
  assert.ok(sectionsCashier.includes('pos') && sectionsCashier.includes('mySales'));
  ok('Un cajero no ve roles ajenos, cuentas desconectadas ni secciones sin permiso');
  assert.deepEqual(c.errors.map(e => e.message), []);
  c.dom.window.close();

  console.log(`${passed} pruebas del restaurante superadas.`);
})().catch(e => { console.error(e); process.exit(1); });
