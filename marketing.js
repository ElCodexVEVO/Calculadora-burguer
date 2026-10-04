/* Announcements and coupon checkout. Supabase remains authoritative for redemption. */
(function () {
  'use strict';
  const core = window.BurgerMarketingCore;
  if (!core) return;
  window.BurgerMarketing = { mount };

  function mount(api) {
    const $ = id => document.getElementById(id), e = api.escape, money = api.money;
    let coupons = [], scope = '', version = 0, loading = null, announcementCategory = 'all';
    let couponsError = '', editingCoupon = null;
    let selected = null, requestedCode = '', couponError = '', quoteBusy = false, quoteVersion = 0, request = null;
    const entries = new Map();
    const admin = () => api.state().profile?.role === 'admin';
    const currentScope = () => { const s = api.state(); return s.profile ? `${s.profile.store_id}:${s.user?.id}:${s.profile.role}` : ''; };
    const dateLabel = value => value ? new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const localDate = value => { if (!value) return ''; const d = new Date(value); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
    const errorText = error => error?.message || 'No se pudo completar la operación. Intenta de nuevo.';

    $('page-announcements').innerHTML = `
      <div class="page-title-row"><div><span class="eyebrow">EL ANTOJO TAMBIÉN SE ANUNCIA</span><h1>Anuncios RP</h1><p>Elige uno, copia y pégalo en el chat.</p></div><span class="mkt-ready-count">${core.templates.length} mensajes listos</span></div>
      <section id="mktCouponAnnouncement" class="panel mkt-promo-announcement" hidden aria-labelledby="mktPromoTitle"><div><span class="eyebrow">TU PROMOCIÓN</span><h2 id="mktPromoTitle">Anuncio del cupón</h2></div><p id="mktPromoText"></p><button id="mktCopyPromo" class="btn primary" type="button">Copiar promoción</button></section>
      <div id="mktAnnouncementFilters" class="mkt-announcement-filters" role="group" aria-label="Tipo de anuncio"><button type="button" data-announcement-category="all" aria-pressed="true">Todos</button>${core.announcementCategories.map(c => `<button type="button" data-announcement-category="${c.id}" aria-pressed="false">${e(c.name)}</button>`).join('')}</div>
      <p id="mktAnnouncementCount" class="mkt-help" role="status"></p>
      <div id="mktAnnouncementCards" class="mkt-announcement-grid"></div>
      <section id="mktCopyFallback" class="panel mkt-copy-fallback" hidden><label for="mktCopyText">Copia el texto seleccionado con Ctrl+C o mantén pulsado en el celular.</label><textarea id="mktCopyText" rows="4" readonly></textarea></section>`;

    $('page-coupons').innerHTML = `
      <div class="page-title-row"><div><span class="eyebrow">PROMOCIONES CON CÓDIGO</span><h1>Cupones</h1><p>Una promoción, un código y sus condiciones.</p></div><div class="mkt-actions"><button id="mktRefreshCoupons" class="btn secondary">Actualizar</button><button id="mktNewCoupon" class="btn primary">+ Nuevo cupón</button></div></div>
      <div id="mktCouponMetrics" class="metrics"></div><p id="mktCouponsStatus" class="mkt-help" role="status"></p><div id="mktCouponCards" class="mkt-coupon-grid"></div>
      <p class="mkt-help">Un cupón por venta. Reemplaza el convenio. Las ventas anuladas o eliminadas conservan su uso del cupón.</p>`;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="mktCouponModal" class="modal-backdrop hidden"><section class="modal mkt-modal" role="dialog" aria-modal="true" aria-labelledby="mktCouponTitle"><form id="mktCouponForm">
        <div class="mkt-modal-head"><div><span class="eyebrow">PROMOCIÓN</span><h2 id="mktCouponTitle">Nuevo cupón</h2></div><button type="button" id="mktCloseCoupon" class="icon-btn" aria-label="Cerrar">×</button></div>
        <div class="mkt-fields"><label>Nombre interno<input id="mktCouponName" required maxlength="80" placeholder="Bienvenida al barrio"></label><label>Código<input id="mktCouponCode" required minlength="3" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" placeholder="BIENVENIDA15" autocomplete="off"></label>
          <label>Descuento<select id="mktCouponType"><option value="percent">Porcentaje (%)</option><option value="fixed">Importe fijo ($)</option></select></label><label>Valor<input id="mktCouponAmount" type="number" required min="0.01" max="100" step="0.01" value="15"></label>
          <label>Compra mínima ($)<input id="mktCouponMinimum" type="number" required min="0" max="9999999999" step="0.01" value="0"></label><label>Productos<select id="mktCouponScope"><option value="all">Todos los elegibles</option><option value="burger">Hamburguesas, combos y mayoreos</option></select></label>
          <label>Disponible desde<input id="mktCouponStart" type="datetime-local"></label><label>Vence el<input id="mktCouponEnd" type="datetime-local"></label><label>Máximo de usos totales<input id="mktCouponMax" type="number" min="1" max="2147483647" step="1" placeholder="Sin límite"></label>
        </div><p class="mkt-help">Las fechas usan la zona horaria de este dispositivo. Los productos marcados sin descuento quedan excluidos.</p>
        <label class="mkt-check"><input id="mktCouponExclude" type="checkbox">Excluir clientes Policía, Sheriff y EMS</label><label class="mkt-check"><input id="mktCouponActive" type="checkbox" checked>Cupón activo</label>
        <p id="mktCouponFormStatus" class="mkt-help" role="status"></p><div class="mkt-actions"><button type="button" id="mktCancelCoupon" class="btn secondary">Cancelar</button><button id="mktSaveCoupon" type="submit" class="btn primary">Guardar cupón</button></div>
      </form></section></div>`);

    function announcementText(template) {
      return template.body.replaceAll('BurgerShot', api.state().store?.name || 'BurgerShot');
    }
    function renderAnnouncements() {
      const rows = core.templates.filter(t => announcementCategory === 'all' || t.category === announcementCategory);
      $('mktAnnouncementCount').textContent = `${rows.length} anuncios para elegir`;
      $('mktAnnouncementFilters').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.announcementCategory === announcementCategory)));
      $('mktAnnouncementCards').innerHTML = rows.map(t => {
        const category = core.announcementCategories.find(c => c.id === t.category);
        return `<article class="panel mkt-announcement"><span class="mkt-announcement-kind">${e(category.name)}</span><h2>${e(t.name)}</h2><p>${e(announcementText(t))}</p><button type="button" class="btn secondary" data-copy-announcement="${t.id}" aria-label="Copiar anuncio: ${e(t.name)}">Copiar anuncio</button></article>`;
      }).join('');
    }
    async function copyAnnouncement(text, button) {
      const token = version;
      button.disabled = true;
      try {
        await navigator.clipboard.writeText(text);
        if (token !== version) return;
        $('mktCopyFallback').hidden = true;
        $('mktAnnouncementCards').querySelectorAll('button').forEach(b => { b.textContent = 'Copiar anuncio'; });
        $('mktCopyPromo').textContent = 'Copiar promoción';
        button.textContent = 'Copiado ✓'; api.toast('Anuncio copiado.');
      } catch {
        if (token !== version) return;
        $('mktCopyFallback').hidden = false; $('mktCopyText').value = text;
        $('mktCopyFallback').scrollIntoView({ block: 'center' }); $('mktCopyText').focus(); $('mktCopyText').select();
        api.toast('Seleccionamos el anuncio para que puedas copiarlo.');
      } finally { button.disabled = false; }
    }
    function couponOffer(c) { return c.type === 'percent' ? `${Number(c.amount)}% de descuento` : `${money(c.amount)} de descuento`; }
    function renderCoupons() {
      const visible = admin() ? coupons : [];
      $('mktCouponMetrics').innerHTML = api.metrics([['Cupones', visible.length, 'creados'], ['Activos', visible.filter(c => core.couponState(c) === 'Activo').length, 'disponibles ahora', 'green'], ['Canjes', visible.reduce((n, c) => n + Number(c.uses || 0), 0), 'ventas con cupón', 'accent']]);
      $('mktCouponsStatus').textContent = couponsError ? 'No se pudieron cargar los cupones. Revisa la conexión y aplica la actualización de la base de datos si aún está pendiente.' : '';
      $('mktNewCoupon').disabled = !!couponsError || !admin();
      $('mktCouponCards').innerHTML = visible.map(c => {
        const status = core.couponState(c);
        return `<article class="panel mkt-coupon"><div class="mkt-coupon-top"><span class="badge ${status === 'Activo' ? 'green' : 'gold'}">${status}</span><span>${Number(c.uses || 0)} / ${c.max_uses == null ? '∞' : Number(c.max_uses)} usos</span></div><code class="mkt-code">${e(c.code)}</code><h2>${e(c.name)}</h2><strong class="mkt-offer">${e(couponOffer(c))}</strong><p>${c.scope === 'burger' ? 'Hamburguesas, combos y mayoreos' : 'Todos los productos elegibles'} · Mínimo ${money(c.min_subtotal)}</p><p>${c.starts_at ? 'Desde ' + e(dateLabel(c.starts_at)) : 'Sin fecha de inicio'}<br>${c.ends_at ? 'Hasta ' + e(dateLabel(c.ends_at)) : 'Sin vencimiento'}${c.exclude_public ? '<br>Excluye Policía, Sheriff y EMS' : ''}</p><div class="mkt-actions"><button class="btn secondary" data-coupon-edit="${e(c.id)}">Editar</button><button class="btn secondary" data-coupon-toggle="${e(c.id)}">${c.active ? 'Pausar' : 'Activar'}</button><button class="btn secondary" data-coupon-announce="${e(c.id)}">Crear anuncio</button></div></article>`;
      }).join('') || `<div class="panel mkt-empty"><h2>${couponsError ? 'Cupones no disponibles' : 'Tu primera promoción empieza aquí'}</h2><p>${couponsError ? 'Cuando la conexión esté lista, pulsa Actualizar.' : 'Crea un código para que tu equipo lo aplique al cobrar.'}</p></div>`;
    }
    function openCoupon(c = null) {
      if (!admin()) return;
      editingCoupon = c?.id || null;
      $('mktCouponForm').reset(); $('mktCouponFormStatus').textContent = '';
      $('mktCouponTitle').textContent = c ? 'Editar cupón' : 'Nuevo cupón';
      $('mktCouponName').value = c?.name || ''; $('mktCouponCode').value = c?.code || '';
      $('mktCouponCode').disabled = Number(c?.uses || 0) > 0;
      $('mktCouponType').value = c?.type || 'percent'; $('mktCouponAmount').value = c?.amount ?? 15;
      $('mktCouponAmount').max = c?.type === 'fixed' ? '999999' : '100';
      $('mktCouponMinimum').value = c?.min_subtotal ?? 0; $('mktCouponScope').value = c?.scope || 'all';
      $('mktCouponStart').value = localDate(c?.starts_at); $('mktCouponEnd').value = localDate(c?.ends_at);
      $('mktCouponMax').value = c?.max_uses ?? ''; $('mktCouponExclude').checked = !!c?.exclude_public;
      $('mktCouponActive').checked = c?.active ?? true;
      $('mktCouponModal').classList.remove('hidden'); $('mktCouponName').focus();
    }
    function closeCoupon() { if (!$('mktSaveCoupon').disabled) $('mktCouponModal').classList.add('hidden'); }
    async function saveCoupon(ev) {
      ev.preventDefault(); if (!admin() || $('mktSaveCoupon').disabled) return;
      const s = api.state(), token = version;
      const value = { name: $('mktCouponName').value.trim(), code: core.code($('mktCouponCode').value), type: $('mktCouponType').value, amount: Number($('mktCouponAmount').value), min_subtotal: Number($('mktCouponMinimum').value), scope: $('mktCouponScope').value, exclude_public: $('mktCouponExclude').checked, starts_at: $('mktCouponStart').value ? new Date($('mktCouponStart').value).toISOString() : null, ends_at: $('mktCouponEnd').value ? new Date($('mktCouponEnd').value).toISOString() : null, max_uses: $('mktCouponMax').value ? Number($('mktCouponMax').value) : null, active: $('mktCouponActive').checked };
      if (!value.name) return api.toast('Escribe un nombre para el cupón.');
      if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(value.code)) return api.toast('Usa entre 3 y 32 letras, números, guiones o guiones bajos.');
      if (value.starts_at && value.ends_at && value.ends_at <= value.starts_at) return api.toast('El vencimiento debe ser posterior al inicio.');
      $('mktSaveCoupon').disabled = true; $('mktCouponFormStatus').textContent = 'Guardando…';
      try {
        const query = editingCoupon ? s.sb.from('marketing_coupons').update(value).eq('id', editingCoupon).eq('store_id', s.profile.store_id) : s.sb.from('marketing_coupons').insert({ ...value, store_id: s.profile.store_id });
        const { error } = await query.select('id').single();
        if (token !== version || scope !== currentScope()) return;
        if (error) throw error;
        $('mktCouponModal').classList.add('hidden'); await load(); if (token === version) api.toast('Cupón guardado.');
      } catch (error) { if (token === version) $('mktCouponFormStatus').textContent = error.code === '23505' ? 'Ese código ya existe. Elige otro.' : errorText(error); }
      finally { if (token === version) $('mktSaveCoupon').disabled = false; }
    }
    async function toggleCoupon(c, button) {
      if (!admin()) return;
      const s = api.state(), token = version; button.disabled = true;
      try {
        const { error } = await s.sb.from('marketing_coupons').update({ active: !c.active }).eq('id', c.id).eq('store_id', s.profile.store_id).select('id').single();
        if (token !== version || scope !== currentScope()) return;
        if (error) throw error; await load();
      } catch (error) { if (token === version) api.toast(errorText(error)); }
      finally { if (button.isConnected) button.disabled = false; }
    }
    function announceCoupon(c) {
      api.navigate('announcements');
      const conditions = [c.scope === 'burger' ? 'Aplica a hamburguesas y sus combos o mayoreos.' : 'Aplica a productos elegibles; excluye los marcados sin descuento.', 'No acumulable con convenios.', c.min_subtotal > 0 ? `Compra mínima: ${money(c.min_subtotal)}.` : '', c.starts_at ? `Desde ${dateLabel(c.starts_at)}.` : '', c.ends_at ? `Hasta ${dateLabel(c.ends_at)}.` : '', c.max_uses != null ? `Hasta agotar ${c.max_uses} usos totales.` : '', c.exclude_public ? 'No aplica a Policía, Sheriff ni EMS.' : ''];
      $('mktPromoText').textContent = `🍔 ¡El antojo trae premio en ${api.state().store?.name || 'BurgerShot'}! ${couponOffer(c)} con el código ${c.code}. 🔥 ${conditions.filter(Boolean).join(' ')}`;
      $('mktPromoTitle').textContent = `Cupón ${c.code}`; $('mktCopyPromo').textContent = 'Copiar promoción';
      $('mktCouponAnnouncement').hidden = false; $('mktCouponAnnouncement').scrollIntoView({ block: 'start' });
    }
    async function load() {
      const next = currentScope(); if (!next) { reset(); return; }
      if (next !== scope) { reset(); scope = next; }
      renderAnnouncements();
      if (loading) return loading;
      const s = api.state(), token = version;
      loading = (async () => {
        try {
          const result = admin() ? await s.sb.rpc('list_burgershot_coupons') : { data: [], error: null };
          if (token !== version || scope !== currentScope()) return;
          if (result.error) throw result.error;
          couponsError = ''; coupons = result.data || [];
        } catch (error) {
          if (token !== version || scope !== currentScope()) return;
          couponsError = errorText(error); coupons = [];
        }
        renderCoupons();
      })().finally(() => { if (token === version) loading = null; });
      return loading;
    }

    function mountEntry(host, key) {
      if (!host || entries.has(key)) return;
      const node = document.createElement('div'); node.className = 'mkt-coupon-entry';
      node.innerHTML = `<label for="${key}-coupon-code">Código promocional</label><div class="mkt-entry-row"><input id="${key}-coupon-code" maxlength="32" placeholder="Ej. BIENVENIDA15" autocomplete="off" autocapitalize="characters"><button type="button" data-apply class="btn secondary">Aplicar</button><button type="button" data-remove class="btn secondary" aria-label="Quitar cupón" hidden>×</button></div><small role="status">Un cupón reemplaza el convenio.</small>`;
      host.append(node); entries.set(key, node);
      node.querySelector('[data-apply]').onclick = () => apply(node.querySelector('input').value);
      node.querySelector('[data-remove]').onclick = clear;
      node.querySelector('input').onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); void apply(ev.target.value); } };
      node.querySelector('input').oninput = ev => {
        if (requestedCode && !quoteBusy && !api.state().saving) { const value = ev.target.value; clear(); ev.target.value = value; }
      };
    }
    async function apply(value) {
      if (quoteBusy || api.state().saving) return;
      const code = core.code(value), c = api.calc(), s = api.state();
      if (!s.profile || !c.lines.length) return api.toast('Agrega productos antes de aplicar un cupón.');
      if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) return api.toast('Escribe un código válido de 3 a 32 caracteres.');
      const signature = core.stamp(c), token = ++quoteVersion, session = currentScope();
      requestedCode = code; selected = null; couponError = ''; quoteBusy = true; api.renderCart();
      try {
        const { data, error } = await s.sb.rpc('quote_burgershot_coupon', { p_code: code, p_items: c.lines.map(p => ({ id: p.id, qty: p.qty })), p_client_type: c.client });
        if (token !== quoteVersion || session !== currentScope()) return;
        if (error) throw error;
        if (signature !== core.stamp(api.calc())) throw new Error('La orden cambió. Vuelve a aplicar el cupón.');
        if (!core.quoteMatches(c.lines, data?.items)) { await api.reload(); throw new Error('Los precios cambiaron. Vuelve a aplicar el cupón.'); }
        selected = { quote: data, signature }; api.toast('Cupón aplicado. Reemplaza el convenio.');
      } catch (error) { if (token === quoteVersion && session === currentScope()) couponError = errorText(error); }
      finally { if (token === quoteVersion && session === currentScope()) { quoteBusy = false; api.renderCart(); } }
    }
    function adjust(c) {
      if (!requestedCode) return c;
      const valid = selected && selected.signature === core.stamp(c);
      const q = valid ? selected.quote : null;
      const error = quoteBusy ? 'Validando cupón…' : couponError || (!valid ? 'La orden cambió. Vuelve a aplicar el cupón o quítalo.' : '');
      const disc = q ? Number(q.discount_amount) : 0, total = q ? Number(q.total) : c.subtotal;
      return { ...c, d: { id: null, name: `Cupón ${requestedCode}`, percent: q?.type === 'percent' ? Number(q.amount) : 0, description: 'Cupón aplicado. No acumulable con convenios.' }, blocked: false, disc, total, earning: Math.round(total * c.pct) / 100, couponCode: requestedCode, couponError: error };
    }
    function refresh(c) {
      mountEntry($('mktCouponEntry'), 'pos');
      const aux = $('bsDiscount')?.closest('.bs-options');
      if (aux && !entries.has('aux')) aux.querySelector('summary').firstChild.textContent = 'Cliente, convenio y cupón ';
      mountEntry(aux, 'aux');
      for (const node of entries.values()) {
        const input = node.querySelector('input'); if (requestedCode) input.value = requestedCode;
        const busy = quoteBusy || api.state().saving;
        input.disabled = busy; node.querySelector('[data-apply]').disabled = busy || !c.lines.length;
        node.querySelector('[data-remove]').hidden = !requestedCode; node.querySelector('[data-remove]').disabled = busy;
        node.querySelector('small').textContent = c.couponError || (requestedCode ? `Descuento: ${money(c.disc)} · Reemplaza el convenio.` : 'Un cupón reemplaza el convenio.');
        node.classList.toggle('mkt-warning', !!c.couponError);
      }
      for (const id of ['discountSelect', 'bsDiscount']) if ($(id)) $(id).disabled = !!requestedCode || api.state().saving;
      if (c.couponError) { $('checkoutBtn').disabled = true; if ($('bsReview')) $('bsReview').disabled = true; }
    }
    function clear() { if (api.state().saving) return; saved(); api.renderCart(); }
    function saved() {
      quoteVersion++; selected = null; requestedCode = ''; couponError = ''; quoteBusy = false; request = null;
      for (const node of entries.values()) node.querySelector('input').value = '';
    }
    function redeem(payload, c) {
      const items = payload.items.map(p => ({ id: p.id, qty: p.qty })).sort((a, b) => a.id.localeCompare(b.id));
      const signature = JSON.stringify([items, c.couponCode, payload.client_type, payload.client, payload.payment, payload.note, c.total]);
      if (request?.signature !== signature) request = { signature, id: crypto.randomUUID() };
      return api.state().sb.rpc('redeem_burgershot_coupon', { p_request_id: request.id, p_code: c.couponCode, p_items: items, p_client_type: payload.client_type, p_client: payload.client, p_payment: payload.payment, p_note: payload.note, p_expected_total: c.total });
    }
    function reset() {
      version++; scope = ''; loading = null; coupons = []; couponsError = ''; editingCoupon = null; announcementCategory = 'all'; saved();
      $('mktCouponModal').classList.add('hidden'); $('mktCouponForm').reset(); $('mktSaveCoupon').disabled = false;
      $('mktCouponAnnouncement').hidden = true; $('mktPromoText').textContent = '';
      $('mktCopyFallback').hidden = true; $('mktCopyText').value = '';
      renderAnnouncements(); renderCoupons();
    }

    $('mktAnnouncementFilters').onclick = ev => {
      const button = ev.target.closest('[data-announcement-category]'); if (!button) return;
      announcementCategory = button.dataset.announcementCategory; renderAnnouncements();
    };
    $('mktAnnouncementCards').onclick = ev => {
      const button = ev.target.closest('[data-copy-announcement]'); if (!button) return;
      const template = core.templates.find(t => t.id === button.dataset.copyAnnouncement);
      if (template) void copyAnnouncement(announcementText(template), button);
    };
    $('mktCopyPromo').onclick = () => copyAnnouncement($('mktPromoText').textContent, $('mktCopyPromo'));
    $('mktNewCoupon').onclick = () => openCoupon(); $('mktRefreshCoupons').onclick = () => load();
    $('mktCloseCoupon').onclick = closeCoupon; $('mktCancelCoupon').onclick = closeCoupon;
    $('mktCouponType').onchange = () => { $('mktCouponAmount').max = $('mktCouponType').value === 'percent' ? '100' : '999999'; };
    $('mktCouponCode').onblur = () => { $('mktCouponCode').value = core.code($('mktCouponCode').value); };
    $('mktCouponForm').onsubmit = saveCoupon;
    $('mktCouponCards').onclick = ev => {
      const b = ev.target.closest('button'); if (!b) return;
      const c = coupons.find(c => c.id === (b.dataset.couponEdit || b.dataset.couponToggle || b.dataset.couponAnnounce)); if (!c) return;
      if (b.dataset.couponEdit) openCoupon(c); else if (b.dataset.couponToggle) void toggleCoupon(c, b); else announceCoupon(c);
    };
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeCoupon(); });
    renderAnnouncements(); renderCoupons();
    return { load, adjust, refresh, redeem, saved, reset };
  }
})();
