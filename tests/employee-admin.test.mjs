import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

// Exercise the real functions without connecting to Supabase or creating accounts.
const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const errorSource = appSource.slice(appSource.indexOf('async function edgeErrorMessage('), appSource.indexOf('\nfunction cfg()'));
const edgeErrorMessage = vm.runInNewContext(`${errorSource}\nedgeErrorMessage`);
const functionSource = readFileSync(new URL('../supabase/functions/employee-admin/index.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace('export default', 'const endpoint =');
const handler = vm.runInNewContext(`${functionSource}\nendpoint.fetch`, {
  withSupabase: (_options, fn) => fn,
  Response,
  crypto: webcrypto,
});

function httpError(status, body) {
  return { message: 'Edge Function returned a non-2xx status code', context: Response.json(body, { status }) };
}

test('shows the message and code returned by @supabase/server', async () => {
  const error = httpError(401, {
    source: '@supabase/server', code: 'UNUSABLE_CREDENTIAL',
    message: 'The request carried a credential this endpoint cannot use.',
  });
  const message = await edgeErrorMessage(error, null, 'No se pudo crear el empleado');
  assert.match(message, /HTTP 401/);
  assert.match(message, /UNUSABLE_CREDENTIAL/);
  assert.match(message, /credential this endpoint cannot use/);
  assert.match(message, /Cierra sesión/);
  assert.equal(error.context.bodyUsed, false);
});

test('preserves application errors, including a duplicate username', async () => {
  assert.equal(await edgeErrorMessage(httpError(409, { error: 'Ese usuario ya existe' }), null), 'HTTP 409: Ese usuario ya existe');
  assert.equal(await edgeErrorMessage(null, { error: 'Error de validación' }), 'Error de validación');
});

test('reads nested errors without rendering [object Object]', async () => {
  assert.equal(await edgeErrorMessage(httpError(400, { error: { message: 'Contraseña débil' } }), null), 'HTTP 400: Contraseña débil');
});

test('retains HTTP status when the response is not JSON', async () => {
  const error = { message: 'Edge Function returned a non-2xx status code', context: new Response('<html>Bad gateway</html>', { status: 502 }) };
  assert.equal(await edgeErrorMessage(error, null, 'No se pudo crear el empleado'), 'HTTP 502: No se pudo crear el empleado');
});

test('explains a missing deployment and a failed network request', async () => {
  assert.match(await edgeErrorMessage(httpError(404, {}), null), /No se encontró employee-admin/);
  assert.match(await edgeErrorMessage({ name: 'FunctionsFetchError' }, null), /No se pudo conectar/);
});

function fakeContext(options = {}) {
  const mutations = [];
  const caller = { user_id: 'admin-1', store_id: 'store-1', role: 'admin', active: true, ...options.caller };
  return {
    mutations,
    supabase: { auth: { getUser: async () => ({ data: { user: options.noSession ? null : { id: caller.user_id } }, error: null }) } },
    supabaseAdmin: {
      from(table) {
        assert.equal(table, 'profiles');
        const predicates = [];
        const query = {
          select() { return query; },
          eq(field, value) { predicates.push(row => row[field] === value); return query; },
          ilike(field, value) {
            const pattern = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/_/g, '.').replace(/%/g, '.*');
            predicates.push(row => new RegExp(`^${pattern}$`, 'i').test(row[field]));
            return query;
          },
          async single() { return { data: options.profileError ? null : caller, error: options.profileError || null }; },
          async maybeSingle() {
            const data = (options.existingUsers || []).find(row => predicates.every(check => check(row))) || null;
            return { data, error: options.lookupError || null };
          },
          async insert(row) { mutations.push({ type: 'profile', row }); return { error: options.insertError || null }; },
        };
        return query;
      },
      auth: { admin: {
        async createUser(payload) {
          mutations.push({ type: 'auth', payload });
          return { data: { user: options.createError ? null : { id: 'created-1' } }, error: options.createError || null };
        },
        async deleteUser(id) { mutations.push({ type: 'rollback', id }); return { error: null }; },
      } },
    },
  };
}

async function create(ctx, overrides = {}) {
  return handler(new Request('https://example.invalid/employee-admin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', name: 'Empleado de prueba', username: 'maria_1', password: 'test-only-password', commission_percent: 15, ...overrides }),
  }), ctx);
}

test('a database profile error is reported separately from missing permissions', async () => {
  const ctx = fakeContext({ profileError: { message: 'column profiles.can_manage_employees does not exist' } });
  const response = await create(ctx);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, 'PROFILE_LOOKUP_FAILED');
  assert.match(body.error, /can_manage_employees/);
  assert.equal(ctx.mutations.length, 0);
});

test('username lookup failure stops before creating an Auth account', async () => {
  const ctx = fakeContext({ lookupError: { message: 'Database unavailable' } });
  const response = await create(ctx);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'USERNAME_LOOKUP_FAILED');
  assert.equal(ctx.mutations.length, 0);
});

test('an underscore is a literal username character, not a wildcard', async () => {
  const ctx = fakeContext({ existingUsers: [{ user_id: 'other-1', username: 'mariax1' }] });
  const response = await create(ctx, { username: '  MARIA_1  ' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).username, 'maria_1');
  assert.equal(ctx.mutations[0].type, 'auth');
  assert.equal(ctx.mutations[1].row.store_id, 'store-1');
  assert.equal(ctx.mutations[1].row.user_id, 'created-1');
  assert.equal(ctx.mutations[1].row.commission_percent, 15);
  assert.equal(ctx.mutations[1].row.can_manage_employees, false);
});

test('a duplicate username is rejected without creating an account', async () => {
  const ctx = fakeContext({ existingUsers: [{ user_id: 'other-1', username: 'maria_1' }] });
  assert.equal((await create(ctx)).status, 409);
  assert.equal(ctx.mutations.length, 0);
});

test('authentication and permission checks still reject unauthorized callers', async () => {
  for (const [options, status] of [
    [{ noSession: true }, 401],
    [{ caller: { active: false } }, 403],
    [{ caller: { role: 'cashier', can_manage_employees: false } }, 403],
  ]) {
    const ctx = fakeContext(options);
    assert.equal((await create(ctx)).status, status);
    assert.equal(ctx.mutations.length, 0);
  }
});

test('an Auth error preserves its reason without inserting a profile', async () => {
  const ctx = fakeContext({ createError: { message: 'Password does not meet requirements' } });
  const response = await create(ctx);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Password does not meet requirements');
  assert.equal(ctx.mutations.length, 1);
});

test('a failed profile insert rolls back the newly created Auth account', async () => {
  const ctx = fakeContext({ insertError: { message: 'duplicate key value violates unique constraint' } });
  assert.equal((await create(ctx)).status, 400);
  assert.equal(ctx.mutations.at(-1).type, 'rollback');
  assert.equal(ctx.mutations.at(-1).id, 'created-1');
});
