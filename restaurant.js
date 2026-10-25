/* Burger Shot 3D · interfaz del restaurante (RestaurantNavigation, RestaurantInteractionLayer, CounterSalesPanel).
   Reglas:
   - El mostrador solo muestra los valores de calc() de app.js y usa las mismas acciones que la caja auxiliar.
     El cobro abre el checkoutModal existente y se registra con saveSale(): no hay fórmulas aquí.
   - La escena 3D es opcional: si WebGL falla o no está disponible, todo sigue funcionando en 2D.
   - Las autorizaciones siguen en app.js y en Supabase; esta capa solo oculta lo que el rol no debe ver. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const VERSION = '13.0.0';
  const ICONS = {
    store: '<path d="M4 10h16v10H4zM3 10l2-6h14l2 6M9 20v-5h6v5"/>',
    register: '<path d="M5 20h14l-1-9H6zM8 11V7h8v4M10 4h4M9 15h2m2 0h2"/>',
    team: '<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3.5 20c.5-4 2.6-6 5-6s4.6 2 5 6M13 20c.4-3 1.9-4.7 4.2-4.7 2.1 0 3.6 1.5 4 4.7"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    zoomIn: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4M11 8v6M8 11h6"/>', zoomOut: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4M8 11h6"/>',
    left: '<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/>', right: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/>',
    home: '<path d="M3 11 12 4l9 7M6 9.5V20h12V9.5"/>', door: '<path d="M6 21V3h12v18M3 21h18M14 12h.01"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', check: '<path d="m5 12 5 5 9-10"/>', alert: '<path d="M12 3 2 20h20zM12 10v4m0 3h.01"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
  };
  const icon = name => `<svg class="rs-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
  const SECTIONS = [
    ['pos', 'Caja completa', 'Cupones, plantillas y cantidades grandes'], ['companion', 'Caja auxiliar', 'Ventana compacta de cobro'],
    ['mySales', 'Mis ventas', 'Historial, ganancias y pagos'], ['dashboard', 'Resumen', 'Métricas y rendimiento de la semana'],
    ['analytics', 'Estadísticas', 'Gráficas y productos más vendidos'], ['allSales', 'Todas las ventas', 'Registro completo'],
    ['customers', 'Historial de clientes', 'Compras por Cliente / ID'], ['employees', 'Equipo', 'Cuentas, comisiones y ventas'],
    ['payouts', 'Pagos y cortes', 'Cortes de comisiones'], ['loyalty', 'Clientes frecuentes', 'Fichas y beneficios'],
    ['promotions', 'Promociones', 'Campañas y cupones'], ['discounts', 'Convenios', 'Descuentos especiales'],
    ['products', 'Productos', 'Menú y precios'], ['administration', 'Administración', 'Accesos y roles'],
    ['audit', 'Auditoría', 'Historial de cambios'], ['settings', 'Ajustes', 'Preferencias'], ['profile', 'Mi perfil', 'Tu identidad y actividad']
  ];
  const PLACES = {
    exterior: 'Fachada', interior: 'Interior', counter: 'Mostrador', kitchen: 'Cocina', staff: 'Zona de empleados', dining: 'Comedor', entrance: 'Entrada'
  };
  const CAPTIONS = {
    kitchen: 'Cocina · plancha, freidoras y armado de pedidos.',
    staff: 'Zona de empleados · taquillas y descanso. Aquí se sienta quien tiene la pestaña en segundo plano.',
    dining: 'Comedor · reservados, mesas y barra junto al ventanal.',
    entrance: 'Entrada · acceso principal del restaurante.'
  };
  const ZONE_TEXT = { counter: 'En el mostrador', floor: 'En el restaurante', away: 'En pausa · pestaña en segundo plano' };
  const ACTIVITY_TEXT = { order: 'Tomando pedido', deliver: 'Entregando comida' };
  const statusOf = p => (p.activity && ACTIVITY_TEXT[p.activity]) || ZONE_TEXT[p.zone] || '';
  const STATUS_TEXT = { idle: 'Sin conexión', connecting: 'Conectando…', live: 'En vivo', error: 'Reconectando…', closed: 'Desconectado', unavailable: 'Sin tiempo real' };
  const safe = fn => { try { return fn(); } catch { return null; } };
  const sGet = k => safe(() => sessionStorage.getItem(k)), sSet = (k, v) => safe(() => sessionStorage.setItem(k, v)), sDel = k => safe(() => sessionStorage.removeItem(k));
  const lGet = k => safe(() => localStorage.getItem(k)), lSet = (k, v) => safe(() => localStorage.setItem(k, v)), lDel = k => safe(() => localStorage.removeItem(k));

  function webgl() {
    return Boolean(safe(() => { const c = document.createElement('canvas'); return window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')); }));
  }

  window.BurgerRestaurant = { mount(api) {
    const e = api.esc, money = api.money;
    const reducedMQ = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reduced = () => Boolean(reducedMQ?.matches) || document.body.classList.contains('motion-off');

    // ── Página y navegación ──
    const page = document.createElement('section');
    page.id = 'page-restaurant'; page.className = 'page restaurant-page'; page.setAttribute('aria-labelledby', 'rsTitle');
    page.innerHTML = `
      <h1 id="rsTitle" class="sr-only">Restaurante Burger Shot</h1>
      <div class="rs-stage" id="rsStage" data-stage="exterior" data-view="loading">
        <div class="rs-host" id="rsHost"></div>
        <div class="rs-fallback" id="rsFallback" hidden>
          <div class="rs-fallback-art" aria-hidden="true"></div>
          <div class="rs-fallback-copy"><span class="rs-eyebrow">Vista simplificada</span><h2>Burger Shot</h2><p id="rsFallbackReason">La vista 3D no está disponible en este equipo. El mostrador y el equipo funcionan igual.</p><button id="rsRetry3d" class="rs-btn ghost" type="button">Probar la vista 3D</button></div>
        </div>
        <div class="rs-loading" id="rsLoading" role="status"><span class="rs-spinner" aria-hidden="true"></span><span>Preparando el restaurante…</span></div>
        <div class="rs-hotspots" id="rsHotspots" role="group" aria-label="Zonas del restaurante"></div>
        <div class="rs-tags" id="rsTags" role="group" aria-label="Personas en el restaurante"></div>
        <header class="rs-top">
          <div class="rs-place"><span class="rs-place-mark" aria-hidden="true">${icon('store')}</span><div><small id="rsStoreName">Burger Shot</small><strong id="rsPlace" aria-live="polite">Fachada</strong></div></div>
          <button id="rsPresenceBtn" class="rs-presence" type="button" aria-controls="rsTeam" aria-expanded="false" data-status="idle"><span class="rs-presence-dot" aria-hidden="true"></span><span id="rsPresenceText">Conectando…</span></button>
        </header>
        <button id="rsSkipAnim" class="rs-skip" type="button" hidden>Omitir animación</button>
        <p class="rs-caption" id="rsCaption" role="status" hidden></p>
        <nav class="rs-dock" id="rsDock" aria-label="Acciones del restaurante">
          <div class="rs-dock-main">
            <button id="rsCounterBtn" class="rs-dock-btn primary" type="button" aria-pressed="false" aria-controls="rsCounter">${icon('register')}<span>Mostrador</span></button>
            <button id="rsTeamBtn" class="rs-dock-btn" type="button" aria-pressed="false" aria-controls="rsTeam">${icon('team')}<span>Equipo</span><b id="rsTeamCount" aria-label="personas conectadas">0</b></button>
            <div class="rs-sections"><button id="rsSectionsBtn" class="rs-dock-btn" type="button" aria-expanded="false" aria-controls="rsSectionsMenu" aria-haspopup="menu">${icon('grid')}<span>Secciones</span></button><div id="rsSectionsMenu" class="rs-menu" role="menu" aria-label="Secciones" hidden></div></div>
          </div>
          <div class="rs-dock-view" id="rsCamControls" role="group" aria-label="Cámara">
            <button type="button" data-rs-cam="out" aria-label="Alejar" title="Alejar (−)">${icon('zoomOut')}</button>
            <button type="button" data-rs-cam="in" aria-label="Acercar" title="Acercar (+)">${icon('zoomIn')}</button>
            <button type="button" data-rs-cam="left" aria-label="Girar a la izquierda" title="Girar (Q)">${icon('left')}</button>
            <button type="button" data-rs-cam="right" aria-label="Girar a la derecha" title="Girar (E)">${icon('right')}</button>
            <button type="button" data-rs-cam="reset" aria-label="Restablecer la vista" title="Restablecer (0)">${icon('home')}</button>
          </div>
        </nav>
        <div class="rs-hint" id="rsHint" hidden><p><b>Cómo moverte:</b> arrastra para desplazarte, usa la rueda o pellizca para acercar y el clic derecho o Q / E para girar. Pulsa el mostrador o los nombres para interactuar.</p><button id="rsHintClose" type="button" aria-label="Ocultar ayuda">${icon('close')}</button></div>

        <aside id="rsCounter" class="rs-panel rs-counter" role="dialog" aria-modal="false" aria-labelledby="rsCounterTitle" hidden>
          <header class="rs-panel-head">
            <div><span class="rs-eyebrow">Mostrador · <span id="rsCashier">—</span></span><h2 id="rsCounterTitle">Nueva orden</h2><small id="rsShift"></small></div>
            <button class="rs-close" type="button" data-rs-close="counter" aria-label="Cerrar el mostrador">${icon('close')}</button>
          </header>
          <div class="rs-counter-tabs" role="group" aria-label="Vista del mostrador"><button type="button" data-rs-pane="menu" aria-pressed="true">Menú</button><button type="button" data-rs-pane="order" aria-pressed="false">Orden <span id="rsPaneCount">0</span></button></div>
          <div class="rs-counter-body" data-pane="menu">
            <section class="rs-menu-col" aria-label="Menú">
              <div class="rs-cats" id="rsCats" role="group" aria-label="Categorías"></div>
              <label class="rs-search"><span class="sr-only">Buscar producto</span><input id="rsSearch" type="search" placeholder="Buscar producto…" autocomplete="off"></label>
              <div class="rs-products" id="rsProducts"></div>
            </section>
            <section class="rs-order-col" aria-labelledby="rsOrderTitle">
              <div class="rs-order-head"><h3 id="rsOrderTitle">Orden <span id="rsOrderCount">0</span></h3><button id="rsClear" class="rs-link" type="button">Vaciar</button></div>
              <div class="rs-lines" id="rsLines"></div>
              <label for="rsClient">Cliente / ID</label>
              <input id="rsClient" maxlength="120" autocomplete="off" placeholder="Nombre o ID · obligatorio al registrar">
              <div class="rs-options"><div><label for="rsType">Tipo de cliente</label><select id="rsType"></select></div><div><label for="rsDiscount">Convenio</label><select id="rsDiscount"></select></div></div>
              <p class="rs-note" id="rsNote" aria-live="polite"></p>
            </section>
          </div>
          <footer class="rs-counter-foot">
            <dl class="rs-totals"><div><dt>Subtotal</dt><dd id="rsSubtotal">—</dd></div><div><dt>Descuento</dt><dd id="rsDisc">—</dd></div><div class="grand"><dt>Total a cobrar</dt><dd id="rsTotal" aria-live="polite">—</dd></div></dl>
            <p class="rs-earn" id="rsEarn"></p>
            <div class="rs-result" id="rsResult" role="status" hidden></div>
            <div class="rs-counter-actions">
              <button id="rsCheckout" class="rs-btn primary" type="button" disabled><span>Cobrar y registrar</span><strong id="rsCheckoutTotal">$0</strong></button>
              <button id="rsFullPos" class="rs-btn ghost" type="button">Caja completa</button>
              <button id="rsOrders" class="rs-btn ghost" type="button">Pedidos</button>
            </div>
          </footer>
        </aside>

        <aside id="rsTeam" class="rs-panel rs-team" role="dialog" aria-modal="false" aria-labelledby="rsTeamTitle" hidden>
          <header class="rs-panel-head">
            <div><span class="rs-eyebrow">Equipo en turno</span><h2 id="rsTeamTitle">Conectados ahora</h2><small id="rsTeamStatus"></small></div>
            <button class="rs-close" type="button" data-rs-close="team" aria-label="Cerrar el equipo">${icon('close')}</button>
          </header>
          <div class="rs-team-body">
            <ul class="rs-people" id="rsOnline"></ul>
            <p class="rs-fine" id="rsOverflow" hidden></p>
            <div id="rsRoster" hidden><h3>Sin conexión</h3><ul class="rs-people is-offline" id="rsOffline"></ul><p class="rs-fine" id="rsInactive"></p></div>
            <button id="rsPresenceRetry" class="rs-btn ghost" type="button" hidden>Reintentar conexión en tiempo real</button>
            <p class="rs-fine">Solo aparecen las personas con una sesión abierta en este momento. Al cerrar la sesión o la pestaña, su personaje sale del restaurante.</p>
          </div>
        </aside>

        <aside id="rsPerson" class="rs-panel rs-person" role="dialog" aria-modal="false" aria-labelledby="rsPersonName" hidden>
          <header class="rs-panel-head">
            <div class="rs-person-id"><span class="rs-avatar" id="rsPersonPhoto" aria-hidden="true"></span><div><span class="rs-eyebrow" id="rsPersonKicker"></span><h2 id="rsPersonName">—</h2></div></div>
            <button class="rs-close" type="button" data-rs-close="person" aria-label="Cerrar la ficha">${icon('close')}</button>
          </header>
          <dl class="rs-facts"><div><dt>Estado</dt><dd id="rsPersonStatus">—</dd></div><div id="rsPersonRoleRow"><dt>Rol</dt><dd id="rsPersonRole">—</dd></div><div><dt>Conectado desde</dt><dd id="rsPersonSince">—</dd></div></dl>
          <div class="rs-person-actions" id="rsPersonActions"></div>
        </aside>
        <div class="rs-toast" id="rsToast" aria-hidden="true"></div>
        <div class="sr-only" id="rsLive" aria-live="polite" aria-atomic="true"></div>
      </div>`;
    const main = document.querySelector('main.main');
    main.insertBefore(page, $('page-dashboard') || main.querySelector('.page'));
    const nav = document.createElement('button');
    nav.className = 'nav-item'; nav.dataset.page = 'restaurant'; nav.type = 'button';
    nav.innerHTML = `<span class="nav-svg"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.store}</svg></span><b>Restaurante</b>`;
    const dash = document.querySelector('.nav-item[data-page="dashboard"]');
    if (dash) dash.before(nav); else document.getElementById('primaryNav')?.prepend(nav);

    const stageEl = $('rsStage'), host = $('rsHost');
    let controller = null, loading = false, view = 'loading', stage = 'exterior', panel = null, opener = null, personUid = null;
    let presence = null, presenceStatus = 'idle', presenceState = {}, online = [], firstSync = true, firstAuth = true;
    let activeCategory = 'all', productSignature = '', menuSignature = '', peopleSignature = '', mountQuality = null, captionTimer = 0, toastTimer = 0;
    const tagEls = new Map(), spotEls = new Map();

    const st = () => api.state();
    let lastUid = '', freshLogin = false;
    // Un inicio de sesión desde el formulario siempre muestra la entrada; una recarga con sesión guardada, no.
    document.getElementById('loginForm')?.addEventListener('submit', () => { freshLogin = true; }, true);
    const me = () => st().user?.id || '';
    const enteredKey = () => `bs_rs_entered:${me()}`;
    const isActive = () => page.classList.contains('active') && !$('app')?.classList.contains('hidden');
    const employeesById = () => new Map((st().employees || []).map(p => [p.user_id, p]));
    const announce = text => { const live = $('rsLive'); if (!live) return; live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); };
    const hudToast = text => { const t = $('rsToast'); t.textContent = text; t.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600); };
    const fmtTime = ms => new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
    const initials = name => String(name || '').trim().split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase() || 'BS';
    const canSeeRoles = () => api.isAdmin() || api.can('manage_employees');

    function shortNames(list) {
      const map = new Map(), firsts = new Map();
      for (const p of list) { const f = String(p.name || '').trim().split(/\s+/)[0] || 'Empleado'; firsts.set(f, (firsts.get(f) || 0) + 1); }
      for (const p of list) {
        const parts = String(p.name || '').trim().split(/\s+/), f = parts[0] || 'Empleado';
        map.set(p.uid, firsts.get(f) > 1 && parts[1] ? `${f} ${parts[1][0]}.` : f);
      }
      return map;
    }

    // ── Calidad de la escena según la preferencia de efectos y el dispositivo ──
    function quality() {
      const mode = document.body.dataset.effects;
      let q = mode === 'cinematic' ? 'high' : mode === 'performance' ? 'low' : 'medium';
      const small = Math.min(window.innerWidth || 1200, window.innerHeight || 800) < 640 || Boolean(window.matchMedia?.('(pointer: coarse)').matches);
      if (small) q = q === 'high' ? 'medium' : 'low';
      return q;
    }

    function setView(next, reason) {
      view = next; stageEl.dataset.view = next;
      // Sin escena 3D no hay animación que mostrar: se entra directamente al interior (vista 2D).
      if (next === 'fallback' && (stage === 'exterior' || stage === 'entering')) { sSet(enteredKey(), '1'); stage = 'interior'; stageEl.dataset.stage = 'interior'; $('rsDock').hidden = false; $('rsSkipAnim').hidden = true; }
      $('rsLoading').hidden = next !== 'loading';
      $('rsFallback').hidden = next !== 'fallback';
      $('rsCamControls').hidden = next !== 'ready';
      if (next === 'fallback') $('rsFallbackReason').textContent = reason || 'La vista 3D no está disponible en este equipo. El mostrador y el equipo funcionan igual.';
      if (next !== 'ready') { $('rsHotspots').replaceChildren(); $('rsTags').replaceChildren(); tagEls.clear(); spotEls.clear(); }
      updatePlace();
    }

    async function ensureScene() {
      if (controller || loading || !isActive()) return;
      if (lGet('bs_rs_view') === '2d') return setView('fallback', 'Elegiste la vista simplificada. Puedes volver a la vista 3D cuando quieras.');
      if (!webgl()) return setView('fallback', 'Este navegador o equipo no permite WebGL. El mostrador y el equipo funcionan igual.');
      loading = true; setView('loading');
      try {
        const mod = await import(`./restaurant/scene.js?v=${VERSION}`);
        if (!isActive() && !page.isConnected) return;
        mountQuality = quality();
        controller = await mod.mount(host, {
          quality: mountQuality, reduced, season: /muertos|halloween/.test(document.documentElement.dataset.season || ''),
          logoUrl: 'assets/logo/burgershot-3d-512.webp',
          onPick: handlePick, onHover: handleHover, onFrame: placeOverlay, onStage: s => { if (s === 'exterior' || s === 'interior') setStage(s); },
          onLost: () => { disposeScene(); setView('fallback', 'La vista 3D se interrumpió (el equipo liberó la tarjeta gráfica). Puedes reintentarlo.'); },
          counterOpen: () => panel === 'counter', onInteract: () => hideCaption(),
          debug: /[?&]rsdebug=1(&|$)/.test(location.search)
        });
        setView('ready'); setStage(stage);
        controller.setActive(isActive());
        pushMenu(true); pushPeople(true);
        if (stage === 'interior') controller.enter({ skip: true }); else autoEnter();
      } catch (error) {
        console.warn('Restaurante 3D:', error);
        disposeScene();
        setView('fallback', 'No se pudo iniciar la vista 3D. El mostrador y el equipo funcionan igual.');
      } finally { loading = false; }
    }

    function disposeScene() { try { controller?.dispose(); } catch {} controller = null; }

    // ── Etapas: fachada, entrada e interior ──
    function setStage(next) {
      stage = next; stageEl.dataset.stage = next;
      $('rsSkipAnim').hidden = !(next === 'entering' || (next === 'exterior' && view === 'ready'));
      $('rsDock').hidden = next === 'exterior' || next === 'entering';
      if (next !== 'interior') closePanel(false);
      updatePlace(); placeOverlay(null);
    }

    async function enter({ skip = false, then = null } = {}) {
      if (stage === 'interior' || stage === 'entering') { then?.(); return; }
      sSet(enteredKey(), '1');
      setStage('entering');
      if (controller) {
        $('rsSkipAnim').hidden = skip || reduced();
        await controller.enter({ skip: skip || skipRequested || reduced() });
      }
      skipRequested = false;
      setStage('interior');
      announce('Estás dentro del restaurante. Usa Mostrador para atender un pedido.');
      showHintOnce();
      if (then) then();
    }

    /* Tras iniciar sesión: toma breve de la fachada y entrada automática, sin pedir confirmación. */
    let introRun = 0, skipRequested = false;
    async function autoEnter() {
      if (!controller || stage !== 'exterior') return;
      const run = ++introRun;
      if (!reduced() && !skipRequested) await controller.playIntro();
      if (run !== introRun || !controller || stage !== 'exterior') return;
      await enter({ skip: skipRequested });
    }

    function updatePlace() {
      const sub = panel === 'counter' ? 'counter' : stage === 'interior' ? 'interior' : 'exterior';
      $('rsPlace').textContent = PLACES[sub];
      $('rsStoreName').textContent = st().store?.name || 'Burger Shot';
    }

    function showHintOnce() {
      if (view !== 'ready' || lGet('bs_rs_hint') === 'seen') return;
      $('rsHint').hidden = false;
    }
    $('rsHintClose').onclick = () => { $('rsHint').hidden = true; lSet('bs_rs_hint', 'seen'); controller?.focusCanvas(); };

    function caption(text) { const c = $('rsCaption'); c.textContent = text; c.hidden = false; clearTimeout(captionTimer); captionTimer = setTimeout(hideCaption, 5200); }
    function hideCaption() { $('rsCaption').hidden = true; }

    // ── Selección desde la escena ──
    function handlePick(hit) {
      if (!hit) { if (panel === 'person') closePanel(); return; }
      if (hit.kind === 'door') { skipRequested = true; controller?.skip(); return; }
      if (stage !== 'interior') return;
      if (hit.kind === 'counter') { openPanel('counter'); return; }
      if (hit.kind === 'avatar') { openPerson(hit.uid); return; }
      if (CAPTIONS[hit.kind]) { if (panel && panel !== 'person') closePanel(false); controller?.focus(hit.kind); caption(CAPTIONS[hit.kind]); $('rsPlace').textContent = PLACES[hit.kind]; }
    }
    function handleHover(hit) {
      for (const [id, el] of spotEls) el.classList.toggle('is-hover', hit?.kind === id || (hit?.kind === 'entrance' && id === 'entrance'));
      for (const [uid, el] of tagEls) el.classList.toggle('is-hover', hit?.kind === 'avatar' && hit.uid === uid);
    }

    // ── Etiquetas en el DOM sobre la escena (accesibles con teclado) ──
    const SPOTS = { exterior: [], interior: [['counter', 'Mostrador', 'Abrir el mostrador'], ['kitchen', 'Cocina', 'Ver la cocina'], ['staff', 'Personal', 'Ver la zona de empleados'], ['dining', 'Comedor', 'Ver el comedor'], ['entrance', 'Entrada', 'Ver la entrada']] };
    function placeOverlay(frame) {
      if (view !== 'ready') return;
      const wanted = frame ? (SPOTS[frame.stage === 'interior' ? 'interior' : frame.stage === 'exterior' ? 'exterior' : ''] || []) : [];
      const spots = $('rsHotspots');
      for (const [id, el] of spotEls) if (!wanted.some(w => w[0] === id)) { el.remove(); spotEls.delete(id); }
      for (const [id, label, aria] of wanted) {
        let el = spotEls.get(id);
        if (!el) {
          el = document.createElement('button'); el.type = 'button'; el.className = `rs-hotspot rs-hotspot-${id}`; el.dataset.rsSpot = id;
          el.setAttribute('aria-label', aria); el.innerHTML = `<span class="rs-hotspot-dot" aria-hidden="true"></span><span class="rs-hotspot-label">${e(label)}</span>`;
          spots.append(el); spotEls.set(id, el);
        }
        const a = frame.anchors[id === 'door' ? 'door' : id];
        el.hidden = !a?.visible || (id !== 'counter' && panel === 'counter');
        if (a) el.style.transform = `translate3d(${Math.round(a.x)}px,${Math.round(a.y)}px,0) translate(-50%,-100%)`;
      }
      if (!frame) return;
      const labels = frame.labels || [], names = shortNames(peopleList()), idx = new Map(peopleList().map(p => [p.uid, p]));
      const tags = $('rsTags');
      for (const [uid, el] of tagEls) if (!labels.some(l => l.uid === uid) || !idx.has(uid)) { el.remove(); tagEls.delete(uid); }
      for (const l of labels) {
        const p = idx.get(l.uid); if (!p) continue;
        let el = tagEls.get(l.uid);
        const label = names.get(l.uid) || 'Empleado';
        if (!el) { el = document.createElement('button'); el.type = 'button'; el.className = 'rs-tag'; el.dataset.rsPerson = l.uid; tags.append(el); tagEls.set(l.uid, el); }
        const html = `<span>${e(label)}</span>${p.self ? '<em>Tú</em>' : ''}${p.activity && ACTIVITY_TEXT[p.activity] ? `<i class="rs-activity rs-activity-${e(p.activity)}">${e(ACTIVITY_TEXT[p.activity])}</i>` : ''}`;
        if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
        el.setAttribute('aria-label', `${p.name}${p.self ? ' (tú)' : ''}. ${statusOf(p)}`);
        el.classList.toggle('is-self', p.self); el.classList.toggle('is-away', p.zone === 'away'); el.classList.toggle('is-selected', personUid === l.uid && panel === 'person');
        el.hidden = !l.visible || stage !== 'interior';
        el.style.transform = `translate3d(${Math.round(l.x)}px,${Math.round(l.y)}px,0) translate(-50%,-100%)`;
      }
    }
    $('rsHotspots').addEventListener('click', ev => { const b = ev.target.closest('[data-rs-spot]'); if (!b) return; opener = b; handlePick({ kind: b.dataset.rsSpot }); });
    $('rsTags').addEventListener('click', ev => { const b = ev.target.closest('[data-rs-person]'); if (!b) return; opener = b; openPerson(b.dataset.rsPerson); });

    // ── Personas: presencia + perfiles (los nombres nunca salen del canal de presencia) ──
    // Actividad propia: «tomando pedido» mientras hay productos en la orden; «entregando comida» tras registrar una venta.
    let deliverUntil = 0, deliverTimer = 0;
    function localActivity() {
      if (Date.now() < deliverUntil) return 'deliver';
      return (st().calc?.lines?.length || 0) > 0 ? 'order' : '';
    }
    function localZone() {
      const posActive = ['page-pos', 'page-companion'].some(id => $(id)?.classList.contains('active'));
      return (panel === 'counter' && isActive()) || posActive || localActivity() === 'order' ? 'counter' : 'floor';
    }
    function peopleList() {
      const people = st().employees || [], byId = new Map(people.map(p => [p.user_id, p])), uid = me();
      const list = presenceStatus === 'live' ? window.BurgerRestaurantPresence?.normalize(presenceState, people) || [] : [];
      const selfRow = { uid, tabs: 1, since: presenceStarted, zone: document.hidden ? 'away' : localZone(), away: document.hidden, activity: document.hidden ? '' : localActivity(), local: presenceStatus !== 'live' };
      const merged = list.some(p => p.uid === uid) ? list.map(p => p.uid === uid ? { ...p, zone: selfRow.zone, activity: selfRow.activity } : p) : (uid && byId.get(uid)?.active !== false ? [selfRow, ...list] : list);
      return merged.filter(p => byId.has(p.uid)).map(p => ({ ...p, self: p.uid === uid, name: byId.get(p.uid).name, profile: byId.get(p.uid) }));
    }
    let presenceStarted = Date.now();

    function pushPeople(force = false) {
      const list = peopleList(), sig = JSON.stringify(list.map(p => [p.uid, p.zone, p.name, p.activity || '']));
      if (!force && sig === peopleSignature) return;
      peopleSignature = sig;
      const result = controller?.setPeople(list.map(p => ({ uid: p.uid, self: p.self, zone: p.zone, activity: p.activity || '' }))) || { shown: list.length, overflow: 0 };
      $('rsTeamCount').textContent = String(list.length);
      $('rsOverflow').hidden = !result.overflow;
      $('rsOverflow').textContent = result.overflow ? `${result.overflow} persona${result.overflow === 1 ? '' : 's'} más en turno (no caben en la escena).` : '';
      renderPresenceChip(list.length);
      if (panel === 'team') renderTeam();
      if (panel === 'person') renderPerson();
    }

    function renderPresenceChip(count) {
      const b = $('rsPresenceBtn'); b.dataset.status = presenceStatus;
      const n = count ?? peopleList().length;
      $('rsPresenceText').textContent = presenceStatus === 'live' ? `${n} en turno · En vivo` : `${STATUS_TEXT[presenceStatus] || 'Sin conexión'}${presenceStatus === 'connecting' ? '' : ' · solo tu sesión'}`;
      b.setAttribute('aria-label', `${$('rsPresenceText').textContent}. Ver equipo conectado`);
    }

    function onPresenceChange(state) {
      presenceState = state || {};
      const next = window.BurgerRestaurantPresence?.normalize(presenceState, st().employees || []) || [];
      if (!firstSync) {
        const d = window.BurgerRestaurantPresence.diff(online, next), byId = employeesById();
        const name = uid => byId.get(uid)?.name || 'Una persona';
        for (const uid of d.joined) if (uid !== me()) { hudToast(`${name(uid)} entró al restaurante`); announce(`${name(uid)} se conectó.`); }
        for (const uid of d.left) if (uid !== me()) { hudToast(`${name(uid)} salió del restaurante`); announce(`${name(uid)} se desconectó.`); }
      }
      firstSync = false; online = next;
      pushPeople();
    }

    function startPresence() {
      const s = st(); if (!s.sb || !s.user || !s.profile || presence) return;
      const P = window.BurgerRestaurantPresence; if (!P) { presenceStatus = 'unavailable'; renderPresenceChip(); return; }
      presenceStarted = Date.now(); firstSync = true; online = []; presenceState = {};
      presence = P.create({
        sb: s.sb, storeId: s.profile.store_id, userId: s.user.id, privateChannel: window.BURGERSHOT_CLOUD?.presencePrivate === true,
        onChange: onPresenceChange,
        onStatus: status => { presenceStatus = status; if (status !== 'live') { firstSync = true; } renderPresenceChip(); pushPeople(true); $('rsPresenceRetry').hidden = !['error', 'closed', 'unavailable'].includes(status); if (panel === 'team') renderTeam(); }
      });
      presence.update({ zone: localZone(), away: document.hidden, activity: localActivity() });
      presence.start();
    }
    function stopPresence() { const p = presence; presence = null; presenceStatus = 'idle'; presenceState = {}; online = []; p?.stop(); }
    function syncPresenceZone() { presence?.update({ zone: localZone(), away: document.hidden, activity: localActivity() }); pushPeople(); }
    document.addEventListener('visibilitychange', syncPresenceZone);
    window.addEventListener('pagehide', () => { stopPresence(); });
    window.addEventListener('pageshow', ev => { if (ev.persisted && st().user && st().profile) startPresence(); });
    $('rsPresenceRetry').onclick = () => { presence?.restart(); };

    // ── Paneles ──
    function openPanel(name, { focus = true } = {}) {
      if (name === 'counter' && stage !== 'interior' && view === 'ready') { enter({ skip: true, then: () => openPanel('counter', { focus }) }); return; }
      if (panel === name) { if (focus) focusPanel(name); return; }
      if (panel) closePanel(false, false);
      opener = document.activeElement instanceof HTMLElement && !$(panelId(name))?.contains(document.activeElement) ? document.activeElement : opener;
      panel = name;
      const el = $(panelId(name)); el.hidden = false;
      stageEl.dataset.panel = name;
      $('rsCounterBtn').setAttribute('aria-pressed', String(name === 'counter'));
      $('rsTeamBtn').setAttribute('aria-pressed', String(name === 'team'));
      $('rsPresenceBtn').setAttribute('aria-expanded', String(name === 'team'));
      hideCaption(); closeSections();
      if (name === 'counter') { renderCounter(true); controller?.focus('counter'); syncPresenceZone(); }
      if (name === 'team') renderTeam();
      updatePlace(); controller?.invalidate();
      if (focus) focusPanel(name);
    }
    const panelId = name => ({ counter: 'rsCounter', team: 'rsTeam', person: 'rsPerson' }[name]);
    function focusPanel(name) {
      const el = $(panelId(name));
      const target = name === 'counter' ? $('rsSearch') : el.querySelector('button:not([disabled]),input,select');
      setTimeout(() => target?.focus({ preventScroll: true }), 30);
    }
    function closePanel(restoreFocus = true, resetCamera = true) {
      if (!panel) return;
      const was = panel; panel = null;
      $(panelId(was)).hidden = true;
      delete stageEl.dataset.panel;
      $('rsCounterBtn').setAttribute('aria-pressed', 'false'); $('rsTeamBtn').setAttribute('aria-pressed', 'false'); $('rsPresenceBtn').setAttribute('aria-expanded', 'false');
      if (was === 'person') { personUid = null; controller?.select(null); }
      if (was === 'counter') { syncPresenceZone(); if (resetCamera && stage === 'interior') controller?.focus('overview'); }
      updatePlace(); controller?.invalidate();
      if (restoreFocus && opener?.isConnected && !opener.closest('[hidden]')) opener.focus({ preventScroll: true });
    }
    page.addEventListener('click', ev => { const c = ev.target.closest('[data-rs-close]'); if (c) closePanel(); });
    $('rsCounterBtn').onclick = () => (panel === 'counter' ? closePanel() : openPanel('counter'));
    $('rsTeamBtn').onclick = () => (panel === 'team' ? closePanel() : openPanel('team'));
    $('rsPresenceBtn').onclick = () => (panel === 'team' ? closePanel() : openPanel('team'));
    $('rsSkipAnim').onclick = () => { skipRequested = true; controller?.skip(); };
    $('rsRetry3d').onclick = () => { lDel('bs_rs_view'); setView('loading'); ensureScene(); };
    $('rsCamControls').addEventListener('click', ev => {
      const b = ev.target.closest('[data-rs-cam]'); if (!b || !controller) return;
      const a = b.dataset.rsCam;
      if (a === 'in') controller.zoom(1); else if (a === 'out') controller.zoom(-1);
      else if (a === 'left') controller.rotate(1); else if (a === 'right') controller.rotate(-1);
      else if (a === 'reset') { closePanel(false, false); controller.reset(); }
      hideCaption();
    });

    // ── Secciones (navegación secundaria con los permisos de app.js) ──
    function renderSections() {
      const items = SECTIONS.filter(([pageId]) => $(`page-${pageId}`) && api.pageAllowed(pageId));
      const extra = view === 'ready' ? `<button type="button" role="menuitem" data-rs-mode="2d"><strong>Vista simplificada</strong><small>Desactiva la escena 3D en este navegador</small></button>` : view === 'fallback' && lGet('bs_rs_view') === '2d' ? `<button type="button" role="menuitem" data-rs-mode="3d"><strong>Vista 3D</strong><small>Vuelve a mostrar el restaurante en 3D</small></button>` : '';
      $('rsSectionsMenu').innerHTML = items.map(([id, label, note]) => `<button type="button" role="menuitem" data-rs-go="${e(id)}"><strong>${e(label)}</strong><small>${e(note)}</small></button>`).join('') + extra;
    }
    function closeSections() { $('rsSectionsMenu').hidden = true; $('rsSectionsBtn').setAttribute('aria-expanded', 'false'); }
    $('rsSectionsBtn').onclick = () => {
      const open = $('rsSectionsMenu').hidden; if (!open) return closeSections();
      renderSections(); $('rsSectionsMenu').hidden = false; $('rsSectionsBtn').setAttribute('aria-expanded', 'true');
      $('rsSectionsMenu').querySelector('button')?.focus();
    };
    $('rsSectionsMenu').addEventListener('click', ev => {
      const go = ev.target.closest('[data-rs-go]'), mode = ev.target.closest('[data-rs-mode]');
      if (go) { closeSections(); api.navigate(go.dataset.rsGo); }
      if (mode?.dataset.rsMode === '2d') { closeSections(); lSet('bs_rs_view', '2d'); disposeScene(); setView('fallback', 'Elegiste la vista simplificada. Puedes volver a la vista 3D desde Secciones.'); }
      if (mode?.dataset.rsMode === '3d') { closeSections(); lDel('bs_rs_view'); setView('loading'); ensureScene(); }
    });
    $('rsSectionsMenu').addEventListener('keydown', ev => {
      const items = [...$('rsSectionsMenu').querySelectorAll('button')], i = items.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); items[(i + 1) % items.length]?.focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
      if (ev.key === 'Escape') { ev.stopPropagation(); closeSections(); $('rsSectionsBtn').focus(); }
    });
    document.addEventListener('pointerdown', ev => { if (!ev.target.closest?.('.rs-sections')) closeSections(); });

    // ── Mostrador: vista sobre el carrito real de app.js ──
    function renderCategories() {
      const cats = { all: 'Todos', ...(api.categories || {}) };
      $('rsCats').innerHTML = Object.entries(cats).map(([k, v]) => `<button type="button" data-rs-cat="${e(k)}" aria-pressed="${k === activeCategory}">${e(v)}</button>`).join('');
    }
    function renderProducts(force = false) {
      const { products = [] } = st(), q = String($('rsSearch').value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
      const rows = products.filter(p => p.active && (activeCategory === 'all' || p.category === activeCategory) && (!q || String(p.name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)));
      const sig = JSON.stringify([activeCategory, q, rows.map(p => [p.id, p.name, p.price, p.restriction])]);
      if (!force && sig === productSignature) return markInCart();
      productSignature = sig;
      $('rsProducts').innerHTML = rows.length ? rows.map(p => `<button type="button" class="rs-product" data-rs-add="${e(p.id)}" aria-label="Agregar ${e(p.name)}, ${e(money(p.price))}"><span class="rs-product-art">${api.art(p, true)}</span><span class="rs-product-name">${e(p.name)}</span><span class="rs-product-price">${e(money(p.price))}</span>${p.restriction ? `<span class="rs-badge">${e({ police: 'Policía', sheriff: 'Sheriff', ems: 'EMS' }[p.restriction] || p.restriction)}</span>` : ''}<span class="rs-product-qty" hidden></span></button>`).join('') : '<p class="rs-empty">No hay productos con ese nombre en esta categoría.</p>';
      markInCart();
    }
    function markInCart() {
      const lines = st().calc?.lines || [], qty = new Map(lines.map(l => [l.id, l.qty]));
      $('rsProducts').querySelectorAll('[data-rs-add]').forEach(b => { const n = qty.get(b.dataset.rsAdd) || 0, badge = b.querySelector('.rs-product-qty'); b.classList.toggle('in-cart', n > 0); badge.hidden = !n; badge.textContent = n ? `${n}` : ''; });
    }
    function mirrorSelect(source, target) {
      if (!source || !target) return;
      const html = [...source.options].map(o => `<option value="${e(o.value)}">${e(o.textContent)}</option>`).join('');
      if (target.dataset.html !== html) { target.innerHTML = html; target.dataset.html = html; }
      target.value = source.value; target.disabled = source.disabled;
    }
    function renderCounter(force = false) {
      if (panel !== 'counter' && !force) return;
      const s = st(), c = s.calc || { lines: [], subtotal: 0, disc: 0, total: 0, pct: 0, earning: 0 }, saving = Boolean(s.saving);
      $('rsCashier').textContent = s.profile?.name || '—';
      if (force || !$('rsCats').children.length) renderCategories();
      renderProducts(force);
      const count = c.lines.reduce((n, x) => n + x.qty, 0);
      $('rsOrderCount').textContent = String(count); $('rsPaneCount').textContent = String(count);
      $('rsLines').innerHTML = c.lines.length ? c.lines.map(x => `<div class="rs-line"><div class="rs-line-info"><strong>${e(x.name)}</strong><small>${e(money(x.price))} c/u</small></div><div class="rs-qty" role="group" aria-label="Cantidad de ${e(x.name)}"><button type="button" data-rs-q="${e(x.id)}" data-d="-1" aria-label="Restar uno a ${e(x.name)}" ${saving ? 'disabled' : ''}>${icon('minus')}</button><input type="number" min="0" max="9999" step="1" inputmode="numeric" value="${x.qty}" data-rs-qi="${e(x.id)}" aria-label="Cantidad de ${e(x.name)}" ${saving ? 'disabled' : ''}><button type="button" data-rs-q="${e(x.id)}" data-d="1" aria-label="Sumar uno a ${e(x.name)}" ${saving ? 'disabled' : ''}>${icon('plus')}</button></div><strong class="rs-line-total">${e(money(x.lineTotal))}</strong><button type="button" class="rs-remove" data-rs-rm="${e(x.id)}" aria-label="Quitar ${e(x.name)}" ${saving ? 'disabled' : ''}>${icon('trash')}</button></div>`).join('') : '<p class="rs-empty">Elige productos del menú para empezar la orden.</p>';
      $('rsClear').disabled = !c.lines.length || saving;
      mirrorSelect($('clientType'), $('rsType')); mirrorSelect($('discountSelect'), $('rsDiscount'));
      const client = $('orderClient'); if (client && document.activeElement !== $('rsClient')) $('rsClient').value = client.value;
      $('rsSubtotal').textContent = money(c.subtotal);
      $('rsDisc').textContent = c.disc ? `−${money(c.disc)}` : money(0);
      $('rsTotal').textContent = money(c.total); $('rsCheckoutTotal').textContent = money(c.total);
      $('rsEarn').textContent = `Tu ganancia estimada: ${money(c.earning)} (${c.pct}% de comisión)`;
      const note = $('discountNote'), promo = c.promotion ? `Promoción aplicada: ${c.promotion.name}. Cupones y promociones se gestionan en Caja completa. ` : '';
      $('rsNote').textContent = promo + (note?.textContent || '');
      $('rsNote').classList.toggle('is-warning', Boolean(note?.classList.contains('is-warning')));
      $('rsCheckout').disabled = !c.lines.length || saving;
      $('rsCheckout').querySelector('span').textContent = saving ? 'Registrando…' : 'Cobrar y registrar';
      // Resumen propio del día, con las mismas sumas del panel (sums de app.js).
      if (api.sums) {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const today = (s.sales || []).filter(x => x.created_by === s.user?.id && new Date(x.created_at) >= start), m = api.sums(today);
        $('rsShift').textContent = `Hoy llevas ${m.count} venta${m.count === 1 ? '' : 's'} · ${money(m.generated)}`;
      }
    }
    $('rsCats').addEventListener('click', ev => { const b = ev.target.closest('[data-rs-cat]'); if (!b) return; activeCategory = b.dataset.rsCat; renderCategories(); renderProducts(true); });
    $('rsSearch').addEventListener('input', () => renderProducts());
    $('rsProducts').addEventListener('click', ev => {
      const b = ev.target.closest('[data-rs-add]'); if (!b) return;
      if (api.add(b.dataset.rsAdd, 1)) { b.classList.remove('rs-pop'); void b.offsetWidth; b.classList.add('rs-pop'); hideResult(); }
    });
    $('rsLines').addEventListener('click', ev => {
      const q = ev.target.closest('[data-rs-q]'), rm = ev.target.closest('[data-rs-rm]');
      if (q) { api.quantity(q.dataset.rsQ, Number(q.dataset.d)); const again = [...$('rsLines').querySelectorAll('[data-rs-q]')].find(x => x.dataset.rsQ === q.dataset.rsQ && x.dataset.d === q.dataset.d); again?.focus({ preventScroll: true }); }
      if (rm) { const line = (st().calc?.lines || []).find(x => x.id === rm.dataset.rsRm); if (line) api.quantity(line.id, -line.qty); $('rsSearch').focus({ preventScroll: true }); }
    });
    const setQty = input => {
      const id = input.dataset.rsQi, line = (st().calc?.lines || []).find(x => x.id === id), value = Number(input.value);
      if (!line) return;
      if (input.value.trim() === '0') { api.quantity(id, -line.qty); return; }
      if (!Number.isInteger(value) || value < 1 || value > 9999) { input.value = String(line.qty); api.toast('La cantidad debe ser un entero entre 0 y 9,999'); return; }
      api.setQuantity(id, value);
    };
    $('rsLines').addEventListener('change', ev => { if (ev.target.matches('[data-rs-qi]')) setQty(ev.target); });
    $('rsLines').addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches('[data-rs-qi]')) { ev.preventDefault(); setQty(ev.target); } });
    $('rsClear').onclick = () => { api.clear(); hideResult(); };
    $('rsType').onchange = () => api.options($('rsType').value, $('discountSelect').value);
    $('rsDiscount').onchange = () => api.options($('clientType').value, $('rsDiscount').value);
    $('rsClient').addEventListener('input', () => { const c = $('orderClient'); if (c) c.value = $('rsClient').value; });
    $('rsCheckout').onclick = () => { hideResult(); api.checkout(); };
    $('rsFullPos').onclick = () => api.navigate('pos');
    $('rsOrders').onclick = () => api.navigate(api.pageAllowed('allSales') ? 'allSales' : 'mySales');
    page.querySelector('.rs-counter-tabs').addEventListener('click', ev => {
      const b = ev.target.closest('[data-rs-pane]'); if (!b) return;
      page.querySelector('.rs-counter-body').dataset.pane = b.dataset.rsPane;
      page.querySelectorAll('[data-rs-pane]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
    function showResult(kind, text) { const r = $('rsResult'); r.hidden = false; r.dataset.kind = kind; r.innerHTML = `${icon(kind === 'ok' ? 'check' : 'alert')}<span>${e(text)}</span>`; }
    function hideResult() { $('rsResult').hidden = true; }
    document.addEventListener('bs:sale-registered', ev => {
      const d = ev.detail || {};
      deliverUntil = Date.now() + 12000; clearTimeout(deliverTimer); deliverTimer = setTimeout(syncPresenceZone, 12100); syncPresenceZone();
      if (isActive()) { showResult('ok', `Venta registrada · ${money(d.total)}${d.client ? ` · ${d.client}` : ''}`); announce(`Venta registrada por ${money(d.total)}. Tu personaje lleva el pedido a una mesa.`); }
    });
    document.addEventListener('bs:sale-failed', ev => { if (isActive()) showResult('error', `No se registró la venta. Tu orden sigue disponible. ${ev.detail?.message || ''}`.trim()); });

    // ── Equipo y ficha de persona ──
    function personRow(p, online = true) {
      const role = canSeeRoles() || p.self ? api.roleName(p.profile) : '';
      const status = online ? statusOf(p) : 'Sin conexión';
      return `<li><button type="button" class="rs-person-row" data-rs-open="${e(p.uid)}" ${online ? '' : 'disabled'}><span class="rs-avatar" data-profile-avatar="${e(p.uid)}" data-profile-name="${e(p.name)}" aria-hidden="true">${e(initials(p.name))}</span><span class="rs-person-copy"><strong>${e(p.name)}${p.self ? ' <em>Tú</em>' : ''}</strong><small>${e(status)}${role ? ` · ${e(role)}` : ''}</small></span>${online ? `<i class="rs-dot rs-dot-${e(p.zone)}" aria-hidden="true"></i>` : ''}</button></li>`;
    }
    function renderTeam() {
      const list = peopleList();
      $('rsTeamStatus').textContent = presenceStatus === 'live' ? `${list.length} conectado${list.length === 1 ? '' : 's'} · en tiempo real` : presenceStatus === 'connecting' ? 'Conectando con el equipo…' : 'Sin conexión en tiempo real: solo se muestra tu sesión.';
      $('rsOnline').innerHTML = list.map(p => personRow(p)).join('') || '<li class="rs-empty">No hay nadie conectado.</li>';
      const roster = canSeeRoles();
      $('rsRoster').hidden = !roster;
      if (roster) {
        const ids = new Set(list.map(p => p.uid)), all = st().employees || [];
        const offline = all.filter(p => p.active && !ids.has(p.user_id)).map(p => ({ uid: p.user_id, name: p.name, profile: p, self: false }));
        $('rsOffline').innerHTML = offline.map(p => personRow(p, false)).join('') || '<li class="rs-empty">Todo el equipo activo está conectado.</li>';
        const inactive = all.filter(p => !p.active).length;
        $('rsInactive').textContent = inactive ? `${inactive} cuenta${inactive === 1 ? '' : 's'} dada${inactive === 1 ? '' : 's'} de baja no se muestra${inactive === 1 ? '' : 'n'}.` : '';
      }
      $('rsPresenceRetry').hidden = !['error', 'closed', 'unavailable'].includes(presenceStatus);
      api.avatars?.();
    }
    $('rsTeam').addEventListener('click', ev => { const b = ev.target.closest('[data-rs-open]'); if (b) { opener = $('rsTeamBtn'); openPerson(b.dataset.rsOpen); } });

    function openPerson(uid) {
      const p = peopleList().find(x => x.uid === uid); if (!p) return;
      personUid = uid; controller?.select(uid); controller?.focusAvatar(uid);
      openPanel('person', { focus: false }); renderPerson();
      setTimeout(() => $('rsPerson').querySelector('.rs-close')?.focus({ preventScroll: true }), 30);
    }
    function renderPerson() {
      const p = peopleList().find(x => x.uid === personUid);
      if (!p) { if (panel === 'person') { closePanel(false); hudToast('Esa persona ya no está conectada'); } return; }
      const photo = $('rsPersonPhoto'); photo.dataset.profileAvatar = p.uid; photo.dataset.profileName = p.name; if (!photo.querySelector('img')) photo.textContent = initials(p.name);
      $('rsPersonKicker').textContent = p.self ? 'Tu personaje' : 'Compañero en turno';
      $('rsPersonName').textContent = p.name;
      $('rsPersonStatus').textContent = (p.local ? 'Tu sesión · ' : '') + statusOf(p);
      const showRole = canSeeRoles() || p.self;
      $('rsPersonRoleRow').hidden = !showRole; $('rsPersonRole').textContent = showRole ? api.roleName(p.profile) : '';
      $('rsPersonSince').textContent = fmtTime(p.since || Date.now());
      const actions = [];
      if (p.self) actions.push(`<button type="button" class="rs-btn ghost" data-rs-nav="profile">Mi perfil</button>`);
      else {
        actions.push(`<button type="button" class="rs-btn ghost" data-view-profile="${e(p.uid)}">Ver perfil</button>`);
        if (api.pageAllowed('employees')) actions.push(`<button type="button" class="rs-btn ghost" data-rs-nav="employees">Ver en Equipo</button>`);
      }
      $('rsPersonActions').innerHTML = actions.join('');
      api.avatars?.();
    }
    $('rsPersonActions').addEventListener('click', ev => { const b = ev.target.closest('[data-rs-nav]'); if (b) api.navigate(b.dataset.rsNav); });

    // ── Menú con precios reales en los tableros de la escena ──
    function pushMenu(force = false) {
      if (!controller) return;
      const products = (st().products || []).filter(p => p.active);
      const sig = JSON.stringify(products.map(p => [p.id, p.name, p.price, p.category]));
      if (!force && sig === menuSignature) return;
      menuSignature = sig;
      controller.setMenu(products, money, api.photo);
    }

    // ── Activación de la página ──
    function measure() {
      if (!isActive()) return;
      const top = Math.max(0, Math.round(page.getBoundingClientRect().top + (document.scrollingElement?.scrollTop || 0)));
      stageEl.style.setProperty('--rs-top', `${top}px`);
    }
    window.addEventListener('resize', measure);
    function onPageChange() {
      const active = isActive();
      if (active) measure();
      document.body.classList.toggle('rs-active', active);
      if (active) {
        updatePlace();
        if (!controller) ensureScene(); else controller.setActive(true);
        if (!controller && view === 'fallback') { /* la vista 2D ya está lista */ }
      } else { controller?.setActive(false); closeSections(); }
      syncPresenceZone();
    }
    const pageObserver = new MutationObserver(onPageChange);
    document.querySelectorAll('main .page').forEach(p => pageObserver.observe(p, { attributes: true, attributeFilter: ['class'] }));
    if ($('app')) pageObserver.observe($('app'), { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(() => {
      if (!controller || quality() === mountQuality) return;
      const wasInside = stage === 'interior'; disposeScene(); setView('loading'); if (wasInside) stage = 'interior'; ensureScene();
    }).observe(document.body, { attributes: true, attributeFilter: ['data-effects'] });
    reducedMQ?.addEventListener?.('change', () => controller?.invalidate());

    document.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape' || !isActive() || document.querySelector('.modal-backdrop:not(.hidden)')) return;
      if (!$('rsSectionsMenu').hidden) { closeSections(); $('rsSectionsBtn').focus(); return; }
      if (panel) { ev.preventDefault(); closePanel(); return; }
      if (!$('rsHint').hidden) $('rsHint').hidden = true;
    });

    setStage('exterior');
    setView('loading');
    renderPresenceChip();

    return {
      afterAuth() {
        lastUid = me();
        if (freshLogin) { sDel(enteredKey()); freshLogin = false; }
        startPresence();
        stage = sGet(enteredKey()) === '1' ? 'interior' : 'exterior';
        setStage(stage);
        if (firstAuth) {
          firstAuth = false;
          if (!document.body.classList.contains('bs-focused')) api.navigate('restaurant');
        }
        if (controller) { if (stage === 'interior') controller.enter({ skip: true }); else autoEnter(); }
        onPageChange();
      },
      reset() {
        const uid = me() || lastUid; if (uid) sDel(`bs_rs_entered:${uid}`); lastUid = '';
        stopPresence(); closePanel(false, false); disposeScene(); deliverUntil = 0; clearTimeout(deliverTimer);
        firstAuth = true; personUid = null; peopleSignature = ''; menuSignature = ''; productSignature = '';
        setStage('exterior'); setView('loading'); renderPresenceChip();
        document.body.classList.remove('rs-active');
      },
      render() {
        if (!st().profile) return;
        updatePlace(); pushMenu(); pushPeople();
        if (panel === 'counter') renderCounter(); if (panel === 'team') renderTeam();
      },
      refresh() { if (panel === 'counter') renderCounter(); else if (st().calc) markInCart(); if (st().profile) syncPresenceZone(); },
      get stage() { return stage; }, get view() { return view; }, get panel() { return panel; }
    };
  } };
})();
