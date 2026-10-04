const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../marketing-core.js');

test('coupon codes normalize without altering internal characters', () => {
  assert.equal(core.code(' bienvenida_15 '), 'BIENVENIDA_15');
});
test('quotes invalidate on product, quantity, price, restriction or client changes', () => {
  const c = { client: 'general', lines: [{ id: 'a', qty: 2, price: 200, active: true, tag: 'burger', restriction: null }] };
  for (const change of [{ qty: 3 }, { price: 210 }, { active: false }, { restriction: 'ems' }, { tag: 'none' }]) {
    assert.notEqual(core.stamp(c), core.stamp({ ...c, lines: [{ ...c.lines[0], ...change }] }));
  }
  assert.notEqual(core.stamp(c), core.stamp({ ...c, client: 'ems' }));
  assert.ok(core.quoteMatches(c.lines, [{ id: 'a', qty: 2, price: '200.00' }]));
  assert.equal(core.quoteMatches(c.lines, [{ id: 'a', qty: 2, price: 1 }]), false);
  assert.equal(core.quoteMatches(c.lines, []), false);
});
test('coupon state reflects pause, validity and exhaustion', () => {
  const c = { active: true, uses: 0, max_uses: 1 };
  assert.equal(core.couponState(c), 'Activo');
  assert.equal(core.couponState({ ...c, active: false }), 'Pausado');
  assert.equal(core.couponState({ ...c, starts_at: '2099-01-01' }), 'Programado');
  assert.equal(core.couponState({ ...c, ends_at: '2020-01-01' }), 'Vencido');
  assert.equal(core.couponState({ ...c, uses: 1 }), 'Agotado');
});
