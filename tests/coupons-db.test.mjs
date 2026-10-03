import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const admin = '11111111-1111-4111-8111-111111111111', cashier = '22222222-2222-4222-8222-222222222222', other = '33333333-3333-4333-8333-333333333333';
const store = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', foreign = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const burger = '44444444-4444-4444-8444-444444444444', box = '55555555-5555-4555-8555-555555555555', drink = '66666666-6666-4666-8666-666666666666', foreignProduct = '77777777-7777-4777-8777-777777777777';
const items = [{ id: burger, qty: 2 }];
const sql = (text, params = []) => db.query(text, params);
async function runAs(uid, fn, role = 'authenticated') {
  await sql("select set_config('request.jwt.claim.sub',$1,false)", [uid || '']);
  await db.exec(`set role ${role}`);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function coupon(code, changes = {}) {
  const c = { store_id: store, code, name: code, type: 'percent', amount: 10, min_subtotal: 0, scope: 'all', active: true, ...changes };
  const columns = Object.keys(c);
  return (await sql(`insert into public.marketing_coupons(${columns.join(',')}) values(${columns.map((_, i) => '$' + (i + 1)).join(',')}) returning *`, Object.values(c))).rows[0];
}
async function quote(code, lines = items, type = 'general') {
  return (await sql('select public.quote_burgershot_coupon($1,$2::jsonb,$3) as q', [code, JSON.stringify(lines), type])).rows[0].q;
}
async function redeem(code, options = {}) {
  const o = { id: randomUUID(), items, type: 'general', client: 'Cliente de prueba', payment: 'Efectivo', note: '', total: 360, ...options };
  return (await sql('select public.redeem_burgershot_coupon($1,$2,$3::jsonb,$4,$5,$6,$7,$8) as q', [o.id, code, JSON.stringify(o.items), o.type, o.client, o.payment, o.note, o.total])).rows[0].q;
}
async function uses(c) { return Number((await sql('select count(*) as n from public.marketing_coupon_uses where coupon_id=$1', [c.id])).rows[0].n); }

before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
    create publication supabase_realtime;`);
  await db.exec((await readFile(new URL('../supabase_schema_v3.sql', import.meta.url), 'utf8')).replace('create extension if not exists pgcrypto;', ''));
  await db.exec(await readFile(new URL('../supabase_patch_v4_2.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20261003060000_announcements_coupons.sql', import.meta.url), 'utf8'));
  await sql('insert into auth.users values($1),($2),($3)', [admin, cashier, other]);
  await sql('insert into public.stores(id,owner_id) values($1,$2),($3,$4)', [store, admin, foreign, other]);
  await sql("insert into public.profiles(user_id,store_id,name,role,commission_percent) values($1,$2,'Admin','admin',10),($3,$2,'Cajera','cashier',20),($4,$5,'Otro','admin',0)", [admin, store, cashier, other, foreign]);
  await sql("insert into public.products(id,store_id,name,category,price,tag,restriction) values($1,$2,'Burger','individuales',200,'burger',null),($3,$2,'EMS','cajas',250,'none','ems'),($4,$2,'Cola','extras',100,'all',null),($5,$6,'Ajeno','extras',100,'all',null)", [burger, store, box, drink, foreignProduct, foreign]);
  await db.exec('grant select,insert,update,delete on public.sales to authenticated; grant usage on all sequences in schema public to authenticated;');
});
after(async () => { await db.close(); });

test('ordinary sales retain the existing commission behavior', async () => {
  const result = await runAs(cashier, () => sql("insert into public.sales(store_id,created_by,employee_name,total) values($1,$2,'Cajera',400) returning *", [store, cashier]));
  assert.equal(Number(result.rows[0].employee_earnings), 80); assert.equal(result.rows[0].coupon_code, null);
});
test('preview uses canonical prices and does not consume a use', async () => {
  const c = await coupon('PREVIEW');
  const q = await runAs(cashier, () => quote(c.code, [{ id: burger, qty: 2, price: 1 }]));
  assert.equal(q.subtotal, 400); assert.equal(q.total, 360); assert.equal(await uses(c), 0);
});
test('redemption snapshots discount and computes commission on the discounted total', async () => {
  const c = await coupon('SNAPSHOT'), r = await runAs(cashier, () => redeem(c.code));
  const s = (await sql('select * from public.sales where id=$1', [r.id])).rows[0];
  assert.equal(Number(s.subtotal), 400); assert.equal(Number(s.discount_amount), 40);
  assert.equal(Number(s.employee_earnings), 72); assert.equal(Number(s.business_net), 288);
  assert.equal(s.discount_id, null); assert.equal(s.items[0].price, 200); assert.equal(await uses(c), 1);
});
test('a retry returns the original sale, even when exhausted, and rejects changed payloads', async () => {
  const c = await coupon('RETRY', { max_uses: 1 }), id = randomUUID();
  const first = await runAs(cashier, () => redeem(c.code, { id }));
  const second = await runAs(cashier, () => redeem(c.code, { id }));
  assert.equal(second.id, first.id); assert.equal(second.already_saved, true); assert.equal(await uses(c), 1);
  await assert.rejects(runAs(cashier, () => redeem(c.code, { id, client: 'Otro cliente' })), /otra orden/);
});
test('the final use is unavailable to a second cashier', async () => {
  const c = await coupon('LAST', { max_uses: 1 });
  await runAs(cashier, () => redeem(c.code));
  await assert.rejects(runAs(admin, () => redeem(c.code)), /agotó/); assert.equal(await uses(c), 1);
});
test('forged totals roll back both the sale and the coupon use', async () => {
  const c = await coupon('FORGED');
  await assert.rejects(runAs(cashier, () => redeem(c.code, { total: 1 })), /precio cambió/);
  assert.equal(await uses(c), 0);
  assert.equal(Number((await sql('select count(*) as n from public.sales where coupon_code=$1', [c.code])).rows[0].n), 0);
});
test('paused, future, expired, minimum and excluded-client rules are enforced', async () => {
  for (const [code, changes, type, pattern] of [
    ['PAUSE', { active: false }, 'general', /pausado/],
    ['FUTURE', { starts_at: '2099-01-01' }, 'general', /vigente/],
    ['EXPIRED', { ends_at: '2020-01-01' }, 'general', /venció/],
    ['MINIMUM', { min_subtotal: 500 }, 'general', /mínima/],
    ['EXCLUDED', { exclude_public: true }, 'ems', /tipo de cliente/]
  ]) {
    const c = await coupon(code, changes);
    await assert.rejects(runAs(cashier, () => quote(c.code, items, type)), pattern);
    await assert.rejects(runAs(cashier, () => redeem(c.code, { type })), pattern);
    assert.equal(await uses(c), 0);
  }
});
test('fixed amounts are capped to eligible products and never discount special boxes', async () => {
  const c = await coupon('FIXED', { type: 'fixed', amount: 999, scope: 'burger' });
  const q = await runAs(cashier, () => quote(c.code, [{ id: burger, qty: 1 }, { id: drink, qty: 1 }, { id: box, qty: 1 }], 'ems'));
  assert.equal(q.subtotal, 550); assert.equal(q.discount_amount, 200); assert.equal(q.total, 350);
  await assert.rejects(runAs(cashier, () => quote(c.code, [{ id: box, qty: 1 }], 'ems')), /elegibles/);
});
test('invalid quantities, restricted/foreign products and foreign coupons are rejected', async () => {
  const c = await coupon('ITEMS'), f = await coupon('FOREIGN', { store_id: foreign });
  for (const lines of [[{ id: burger, qty: 0 }], [{ id: burger, qty: 1.5 }], [...items, ...items], [{ id: box, qty: 1 }], [{ id: foreignProduct, qty: 1 }]]) {
    await assert.rejects(runAs(cashier, () => quote(c.code, lines)));
  }
  await assert.rejects(runAs(cashier, () => quote(f.code)), /no existe/);
});
test('only own-store administrators can create/list coupons', async () => {
  await runAs(admin, () => coupon('ADMIN'));
  await assert.rejects(runAs(cashier, () => coupon('STAFF')), /row-level security/);
  await assert.rejects(runAs(other, () => coupon('OTHER')), /row-level security/);
  await assert.rejects(runAs(cashier, () => sql('select public.list_burgershot_coupons()')), /administradores/);
  const listed = await runAs(admin, () => sql('select public.list_burgershot_coupons() as c'));
  assert.ok(listed.rows.every(r => r.c.store_id === store));
});
test('anonymous and inactive actors are denied; null code cannot bypass redemption', async () => {
  await assert.rejects(runAs(null, () => quote('ADMIN'), 'anon'), /permission denied/);
  await sql('update public.profiles set active=false where user_id=$1', [cashier]);
  try { await assert.rejects(runAs(cashier, () => redeem('ADMIN')), /activa/); }
  finally { await sql('update public.profiles set active=true where user_id=$1', [cashier]); }
  await assert.rejects(runAs(cashier, () => redeem(null, { total: 0 })), /inválida/);
});
test('coupon financial snapshots cannot be changed; void/delete retain their consumed use', async () => {
  const c = await coupon('HISTORY'), r = await runAs(cashier, () => redeem(c.code));
  await assert.rejects(runAs(admin, () => sql('update public.sales set total=1 where id=$1', [r.id])), /importes originales/);
  await runAs(admin, () => sql("update public.sales set status='void' where id=$1", [r.id]));
  await runAs(admin, () => sql('delete from public.sales where id=$1', [r.id]));
  assert.equal(await uses(c), 1);
  assert.equal((await sql('select sale_id from public.marketing_coupon_uses where coupon_id=$1', [c.id])).rows[0].sale_id, null);
});
test('a coupon cannot be attached retroactively to an ordinary sale', async () => {
  const sale = (await sql('select id from public.sales where coupon_code is null limit 1')).rows[0];
  await assert.rejects(runAs(admin, () => sql("update public.sales set coupon_code='ADMIN' where id=$1", [sale.id])), /importes originales/);
});
test('shared announcements allow own-store employee reads and administrator writes', async () => {
  await runAs(admin, () => sql("insert into public.marketing_announcements(store_id,name,body) values($1,'Apertura','Abre {negocio}')", [store]));
  const rows = await runAs(cashier, () => sql('select * from public.marketing_announcements'));
  assert.equal(rows.rows.length, 1);
  assert.equal((await runAs(other, () => sql('select * from public.marketing_announcements'))).rows.length, 0);
  await assert.rejects(runAs(cashier, () => sql("insert into public.marketing_announcements(store_id,name,body) values($1,'X','X')", [store])), /row-level security/);
});
test('direct REST-style inserts also validate and overwrite coupon financial fields', async () => {
  const c = await coupon('DIRECT'), id = randomUUID();
  const r = await runAs(cashier, () => sql("insert into public.sales(store_id,created_by,employee_name,items,total,discount_amount,discount_percent,coupon_code,coupon_request_id) values($1,$2,'Fake',$3::jsonb,360,999,100,$4,$5) returning *", [store, cashier, JSON.stringify([{ id: burger, qty: 2, price: 1 }]), c.code, id]));
  assert.equal(r.rows[0].employee_name, 'Cajera'); assert.equal(Number(r.rows[0].discount_amount), 40); assert.equal(Number(r.rows[0].discount_percent), 10); assert.equal(await uses(c), 1);
});
