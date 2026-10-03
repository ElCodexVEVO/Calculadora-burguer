/* Browser-only fixture. All writes remain in memory; no remote requests are made. */
(function () {
  const uid = '11111111-1111-4111-8111-111111111111', store = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const burger = '44444444-4444-4444-8444-444444444444';
  const profile = { user_id: uid, store_id: store, name: 'Alex', username: 'alex', role: 'admin', active: true, commission_percent: 20 };
  const db = {
    stores: [{ id: store, name: 'BurgerShot', owner_id: uid }], profiles: [profile],
    products: [{ id: burger, store_id: store, name: 'Hamburguesa', category: 'individuales', price: 200, tag: 'burger', active: true, restriction: null, sort_order: 1, emoji: '🍔' }, { id: '66666666-6666-4666-8666-666666666666', store_id: store, name: 'Cola-Shot', category: 'extras', price: 100, tag: 'all', active: true, restriction: null, sort_order: 2 }],
    discounts: [{ id: 'none', store_id: store, name: 'Sin convenio', percent: 0, scope: 'all', active: true }, { id: 'vip', store_id: store, name: 'VIP', percent: 25, scope: 'all', active: true }],
    sales: [], employee_payouts: [], employee_of_week: [], audit_events: [], marketing_announcements: [],
    marketing_coupons: [{ id: '88888888-8888-4888-8888-888888888888', store_id: store, code: 'BIENVENIDA15', name: 'Bienvenida al barrio', type: 'percent', amount: 15, min_subtotal: 0, scope: 'all', exclude_public: false, active: true, max_uses: 50, uses: 3, starts_at: null, ends_at: null }]
  };
  const calls = [], redemptions = new Map();
  function query(table) {
    let mode = 'select', values, single = false, filters = [], start = 0, end = Infinity;
    const q = {
      select() { return q; }, eq(k, v) { filters.push(r => r[k] === v); return q; }, is(k, v) { return q.eq(k, v); },
      order() { return q; }, range(a, b) { start = a; end = b; return q; }, limit(n) { end = n - 1; return q; },
      maybeSingle() { single = true; return q; }, single() { single = true; return q; },
      insert(v) { mode = 'insert'; values = v; return q; }, update(v) { mode = 'update'; values = v; return q; }, delete() { mode = 'delete'; return q; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          if (window.__missingMarketing && table.startsWith('marketing_')) return { data: null, error: { message: 'relation missing' } };
          const rows = db[table] || []; let result = rows.filter(r => filters.every(f => f(r)));
          if (mode === 'insert') { result = (Array.isArray(values) ? values : [values]).map(v => ({ id: crypto.randomUUID(), uses: 0, created_at: new Date().toISOString(), ...v })); rows.push(...result); }
          if (mode === 'update') result.forEach(r => Object.assign(r, values));
          if (mode === 'delete') db[table] = rows.filter(r => !result.includes(r));
          result = result.slice(start, end + 1);
          return { data: structuredClone(single ? result[0] || null : result), error: null };
        }).then(resolve, reject);
      }
    };
    return q;
  }
  function quote(p) {
    const c = db.marketing_coupons.find(c => c.code === p.p_code);
    if (!c?.active) return { data: null, error: { message: 'El cupón no existe o está pausado' } };
    const items = p.p_items.map(i => { const product = db.products.find(x => x.id === i.id); return { id: i.id, name: product.name, price: product.price, qty: i.qty, lineTotal: i.qty * product.price }; });
    const subtotal = items.reduce((a, i) => a + i.lineTotal, 0), discount_amount = Math.round(subtotal * Number(c.amount)) / 100;
    return { data: { code: c.code, type: c.type, amount: c.amount, coupon_id: c.id, subtotal, discount_amount, total: subtotal - discount_amount, items }, error: null };
  }
  const client = {
    from: query,
    auth: {
      getSession: async () => ({ data: { session: { user: { id: uid } } } }),
      onAuthStateChange(fn) { window.__auth = fn; },
      signOut: async () => { await window.__auth('SIGNED_OUT', null); }
    },
    channel() { return { on() { return this; }, subscribe() { return this; } }; }, removeChannel() {},
    functions: { async invoke(name, payload) { calls.push({ name, payload }); return { data: {}, error: null }; } },
    async rpc(name, p) {
      calls.push({ name, p: structuredClone(p) });
      if (window.__missingMarketing && /coupon/.test(name)) return { data: null, error: { message: 'function missing' } };
      if (name === 'list_burgershot_coupons') return { data: structuredClone(db.marketing_coupons), error: null };
      if (name === 'quote_burgershot_coupon') {
        if (window.__deferQuote) await new Promise(resolve => { window.__releaseQuote = resolve; });
        return quote(p);
      }
      if (name === 'redeem_burgershot_coupon') {
        const prior = redemptions.get(p.p_request_id);
        if (prior) return { data: { ...prior, already_saved: true }, error: null };
        const q = quote(p).data, id = crypto.randomUUID();
        db.sales.push({ ...q, id, store_id: store, created_by: uid, employee_name: profile.name, client: p.p_client, client_type: p.p_client_type, payment: p.p_payment, note: p.p_note, coupon_code: p.p_code, coupon_request_id: p.p_request_id, discount_name: 'Cupón ' + p.p_code, discount_percent: q.amount, discount_id: null, commission_percent: 20, employee_earnings: q.total * .2, business_net: q.total * .8, status: 'active', sale_number: db.sales.length + 1, created_at: new Date().toISOString() });
        const result = { id, total: q.total, already_saved: false }; redemptions.set(p.p_request_id, result);
        // Simulate a committed transaction with a lost HTTP response.
        if (window.__failRedemption) { window.__failRedemption = false; return { data: null, error: { message: 'Error de red simulado; vuelve a intentar' } }; }
        return { data: result, error: null };
      }
      return { data: null, error: null };
    }
  };
  window.__mock = { db, calls, profile };
  window.supabase = { createClient: () => client };
})();
