// Pruebas de RestaurantPresenceManager (restaurant-presence.js) sin red: canal de Realtime simulado.
const assert = require('node:assert/strict');
const P = require('../restaurant-presence.js');
let passed = 0;
const ok = name => { passed++; console.log('PASS ' + name); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const employees = [
  { user_id: 'admin-1', name: 'Alex Rivera', active: true },
  { user_id: 'cashier-1', name: 'María López', active: true },
  { user_id: 'old-1', name: 'Cuenta de baja', active: false }
];
const meta = (uid, extra = {}) => ({ uid, tab: 'tab-' + Math.random().toString(36).slice(2), at: '2026-10-24T20:00:00.000Z', zone: 'floor', away: false, ...extra });

function fakeClient() {
  const calls = { channels: [], removed: 0 };
  const client = {
    channel(name, opts) {
      const ch = {
        name, opts, tracked: [], untracked: 0, listeners: [], status: null, state: {},
        on(type, filter, cb) { this.listeners.push({ type, filter, cb }); return this; },
        subscribe(cb) { this.status = cb; return this; },
        async track(payload) { this.tracked.push(payload); return 'ok'; },
        async untrack() { this.untracked++; return 'ok'; },
        presenceState() { return this.state; },
        sync(state) { this.state = state; for (const l of this.listeners) if (l.type === 'presence' && l.filter.event === 'sync') l.cb(); }
      };
      calls.channels.push(ch);
      return ch;
    },
    async removeChannel() { calls.removed++; return 'ok'; }
  };
  return { client, calls };
}

(async () => {
  // ── normalize ──
  const two = P.normalize({ 'cashier-1': [meta('cashier-1'), meta('cashier-1', { zone: 'counter', at: '2026-10-24T19:00:00.000Z' })], 'admin-1': [meta('admin-1')] }, employees);
  assert.equal(two.length, 2);
  const maria = two.find(p => p.uid === 'cashier-1');
  assert.equal(maria.tabs, 2); assert.equal(maria.zone, 'counter'); assert.equal(maria.since, Date.parse('2026-10-24T19:00:00.000Z'));
  ok('Dos pestañas del mismo usuario producen un solo personaje');

  const spoof = P.normalize({ 'admin-1': [meta('cashier-1')], ghost: [meta('ghost')], 'old-1': [meta('old-1')], 'cashier-1': [null, 'x', { uid: 5 }] }, employees);
  assert.deepEqual(spoof, []);
  ok('Se ignoran identidades suplantadas, desconocidas, dadas de baja y metadatos mal formados');

  const mixed = P.normalize({ 'cashier-1': [meta('cashier-1', { away: true }), meta('cashier-1', { activity: 'order' }), meta('cashier-1', { activity: 'deliver' })], 'admin-1': [meta('admin-1', { away: true, activity: 'deliver' })] }, employees);
  assert.equal(mixed.find(p => p.uid === 'cashier-1').away, false);
  assert.equal(mixed.find(p => p.uid === 'cashier-1').activity, 'deliver');
  const away = mixed.find(p => p.uid === 'admin-1');
  assert.equal(away.zone, 'away'); assert.equal(away.activity, '');
  ok('Una pestaña activa basta; «entregando» prevalece sobre «pedido»; en pausa no hay actividad');

  const clean = P.sanitize({ uid: 'admin-1', tab: 't', at: 'no-es-fecha', zone: 'cocina', away: 'sí', activity: 'robar', name: 'X', token: 'secreto', role: 'admin' }, 'admin-1');
  assert.deepEqual(Object.keys(clean).sort(), ['activity', 'at', 'away', 'tab', 'uid', 'zone']);
  assert.equal(clean.zone, 'floor'); assert.equal(clean.away, false); assert.equal(clean.activity, '');
  ok('Los metadatos solo conservan campos permitidos con valores válidos');

  const d = P.diff([{ uid: 'a' }, { uid: 'b' }], [{ uid: 'b' }, { uid: 'c' }]);
  assert.deepEqual(d, { joined: ['c'], left: ['a'] });
  ok('Altas y bajas entre sincronizaciones');

  // ── ciclo de vida del canal ──
  const { client, calls } = fakeClient();
  const statuses = [], changes = [];
  const pm = P.create({ sb: client, storeId: 'store-1', userId: 'admin-1', debounce: 10, onStatus: s => statuses.push(s), onChange: s => changes.push(s) });
  pm.update({ zone: 'counter', activity: 'order' });
  pm.start();
  const ch = calls.channels[0];
  assert.equal(ch.name, 'bs-presence-store-1');
  assert.equal(ch.opts.config.presence.key, 'admin-1');
  assert.equal(ch.opts.config.private, false);
  assert.equal(statuses.at(-1), 'connecting');
  ch.status('SUBSCRIBED'); await wait(5);
  assert.equal(statuses.at(-1), 'live');
  assert.equal(ch.tracked.length, 1);
  assert.deepEqual(Object.keys(ch.tracked[0]).sort(), ['activity', 'at', 'away', 'tab', 'uid', 'zone']);
  assert.equal(ch.tracked[0].uid, 'admin-1'); assert.equal(ch.tracked[0].zone, 'counter'); assert.equal(ch.tracked[0].activity, 'order');
  ok('Al suscribirse publica solo identificador, pestaña, hora, zona, pausa y actividad');

  ch.sync({ 'admin-1': [ch.tracked[0]], 'cashier-1': [meta('cashier-1')] });
  assert.equal(changes.length, 1);
  assert.equal(P.normalize(changes[0], employees).length, 2);
  ok('Cada sincronización de presencia actualiza la escena');

  pm.update({ zone: 'counter', activity: 'order' }); await wait(25);
  assert.equal(ch.tracked.length, 1);
  pm.update({ zone: 'floor', away: true, activity: 'deliver' }); pm.update({ zone: 'floor', away: true, activity: 'deliver' }); await wait(25);
  assert.equal(ch.tracked.length, 2); assert.equal(ch.tracked[1].away, true); assert.equal(ch.tracked[1].activity, 'deliver');
  ok('Los cambios de estado se agrupan y no se repiten si no cambian');

  ch.status('CHANNEL_ERROR'); assert.equal(statuses.at(-1), 'error');
  ch.status('SUBSCRIBED'); await wait(5);
  assert.equal(statuses.at(-1), 'live'); assert.equal(ch.tracked.length, 3);
  ok('Tras una reconexión vuelve a publicar la presencia propia');

  await pm.stop();
  assert.equal(ch.untracked, 1); assert.equal(calls.removed, 1); assert.equal(statuses.at(-1), 'idle');
  ch.sync({}); assert.equal(changes.length, 1);
  ch.status('SUBSCRIBED'); await wait(5); assert.equal(ch.tracked.length, 3);
  ok('Al salir retira la presencia, elimina el canal e ignora eventos tardíos');

  const statuses2 = [];
  P.create({ sb: { channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel() {} }, storeId: 's', userId: 'u', onStatus: s => statuses2.push(s) }).start();
  P.create({ sb: null, storeId: 's', userId: 'u', onStatus: s => statuses2.push(s) }).start();
  assert.deepEqual(statuses2, ['unavailable', 'unavailable']);
  ok('Sin Presence disponible se informa el estado sin romper la página');

  const priv = fakeClient();
  P.create({ sb: priv.client, storeId: 'store-1', userId: 'admin-1', privateChannel: true }).start();
  assert.equal(priv.calls.channels[0].opts.config.private, true);
  ok('El canal privado se puede activar por configuración');

  console.log(`${passed} pruebas de presencia del restaurante superadas.`);
})().catch(e => { console.error(e); process.exit(1); });
