/* Burger Shot · Candy Kustom — movimiento firma.
   - Salto hidráulico de la placa del total y de la tarjeta agregada (la cifra ya es la real).
   - Llegada del lowrider al banner del inicio; después salta de vez en cuando.
   - Brillo candy que sigue al puntero en las acciones doradas.
   - Ranking que se reordena en su sitio (FLIP) en lugar de reaparecer.
   - Cargador con rin cromado de rayos.
   Se detiene con movimiento reducido, modo Rendimiento (body.motion-off) y pestaña oculta. */
(() => {
  'use strict';
  const root = document.documentElement, body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduced.matches || body.classList.contains('motion-off');
  const $ = id => document.getElementById(id);
  root.classList.add('kustom');

  // Las acciones de teclado no se animan: se repiten demasiado.
  let lastInput = 'pointer';
  addEventListener('keydown', () => { lastInput = 'key'; }, true);
  addEventListener('pointerdown', () => { lastInput = 'pointer'; }, true);

  const replay = (el, cls, ms) => {
    if (!el || calm() || document.hidden) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el._kTimer); el._kTimer = setTimeout(() => el.classList.remove(cls), ms);
  };

  /* ── Placa del total: salto y chispas doradas (la cifra ya es la real) ── */
  const grand = $('grandTotal');
  const sparks = plaque => {
    if (!plaque || calm() || document.hidden || body.dataset.effects === 'performance') return;
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('i');
      const a = (-160 + i * 24 + Math.random() * 10) * Math.PI / 180, d = 46 + Math.random() * 34;
      s.className = 'k-spark'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--sx', (Math.cos(a) * d).toFixed(1) + 'px');
      s.style.setProperty('--sy', (Math.sin(a) * d * .8).toFixed(1) + 'px');
      s.style.setProperty('--sr', (Math.random() * 180).toFixed(0) + 'deg');
      s.style.animationDelay = (i * 18) + 'ms';
      plaque.append(s); setTimeout(() => s.remove(), 900);
    }
  };
  if (grand) {
    let previous = grand.textContent;
    new MutationObserver(() => {
      const now = grand.textContent;
      if (now !== previous && lastInput === 'pointer') {
        const plaque = grand.closest('.grand');
        replay(plaque, 'is-hopping', 460);
        if (parseFloat(now.replace(/[^\d.]/g, '')) > parseFloat(previous.replace(/[^\d.]/g, '') || '0')) sparks(plaque);
      }
      previous = now;
    }).observe(grand, { childList: true, characterData: true, subtree: true });
  }

  /* ── Ticket: la línea cuya cantidad cambia destella en oro ── */
  const cart = $('cartList');
  if (cart) {
    let qty = new Map();
    const read = () => new Map([...cart.querySelectorAll('.cart-item')].map(line => [line.querySelector('[data-q-input]')?.dataset.qInput, line.querySelector('[data-q-input]')?.value]));
    new MutationObserver(() => {
      const next = read();
      if (!calm()) cart.querySelectorAll('.cart-item').forEach(line => {
        const id = line.querySelector('[data-q-input]')?.dataset.qInput;
        if (qty.has(id) && qty.get(id) !== next.get(id)) replay(line, 'k-line-bump', 700);
      });
      qty = next;
    }).observe(cart, { childList: true });
  }

  /* ── Tarjetas del menú: se inclinan hacia el cursor ── */
  const grid = $('productGrid');
  if (grid) {
    let tiltRaf = 0, tiltCard = null, tx = 0, ty = 0;
    const reset = card => { if (card) { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); } };
    grid.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || calm() || body.dataset.effects === 'performance') return;
      const card = e.target.closest('.product-card');
      if (card !== tiltCard) { reset(tiltCard); tiltCard = card; }
      if (!card) return;
      tx = e.clientX; ty = e.clientY;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0; if (!tiltCard) return;
        const r = tiltCard.getBoundingClientRect(), x = (tx - r.left) / r.width - .5, y = (ty - r.top) / r.height - .5;
        tiltCard.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
        tiltCard.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
    });
    grid.addEventListener('pointerleave', () => { reset(tiltCard); tiltCard = null; });
  }

  /* ── Paralaje de la escena: cielo, palmeras y coche a distinta profundidad ── */
  const parallax = host => {
    if (!host) return;
    let raf = 0, px = 0, py = 0;
    host.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || calm() || body.dataset.effects === 'performance') return;
      const r = host.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width * 2 - 1; py = (e.clientY - r.top) / r.height * 2 - 1;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0; const scene = host.querySelector('.ks-scene'); if (!scene) return;
        scene.style.setProperty('--px', px.toFixed(3)); scene.style.setProperty('--py', py.toFixed(3));
      });
    });
    host.addEventListener('pointerleave', () => { const scene = host.querySelector('.ks-scene'); scene?.style.setProperty('--px', 0); scene?.style.setProperty('--py', 0); });
  };
  parallax(document.querySelector('#page-dashboard .dash-hero'));
  parallax($('authScreen'));

  /* ── Entradas de módulo: índice de cascada para lo que la coreografía base no cubre ── */
  const STAGGER = '.page-title-row,.report-filters,.v6-toolbar,.metrics>*,.employee-grid>*,.discount-grid>*,.v6-promo-grid>*,.analytics-grid>*,.profile-layout>*,.profile-content>*,.role-layout>*,.customer-week,.table-panel,.table-panel tbody tr:nth-child(-n+10),.bs-products>*';
  const stagger = page => {
    if (!page || page.id === 'page-dashboard' || page.id === 'page-pos' || calm()) return;
    let n = 0;
    page.querySelectorAll(STAGGER).forEach(el => {
      if (!el.getClientRects().length) return;
      el.classList.add('k-stagger'); el.style.setProperty('--n', Math.min(n++, 14));
    });
  };
  document.querySelectorAll('.page').forEach(page => new MutationObserver(list => {
    for (const m of list) if (page.classList.contains('m-enter') && !(m.oldValue || '').split(/\s+/).includes('m-enter')) stagger(page);
  }).observe(page, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));

  /* ── Escena del banner: llegada y salto ── */
  function arrive(scene) {
    if (!scene) return;
    if (calm()) { scene.classList.remove('is-arriving'); scene.classList.add('is-live'); return; }
    scene.classList.remove('is-live'); scene.classList.add('is-arriving');
    clearTimeout(scene._kTimer);
    scene._kTimer = setTimeout(() => { scene.classList.remove('is-arriving'); scene.classList.add('is-live'); }, 1450);
  }
  function scenes() {
    window.KustomScene?.mount();
    // El acceso recibe al cajero con el lowrider llegando al local.
    document.querySelectorAll('#authScreen .auth-scene .ks-scene').forEach(s => { if (!s.classList.contains('is-live') && !s.classList.contains('is-arriving')) arrive(s); });
    document.querySelectorAll('#authLoading .auth-scene .ks-scene').forEach(s => s.classList.add('is-live'));
    const hero = document.querySelector('#page-dashboard .ks-scene');
    if (hero && !hero.classList.contains('is-live') && !hero.classList.contains('is-arriving')) {
      if (document.querySelector('#page-dashboard.active')) arrive(hero); else hero.classList.add('is-live');
    }
  }
  scenes();
  const dash = $('page-dashboard');
  if (dash) new MutationObserver(list => {
    for (const m of list) {
      const was = (m.oldValue || '').split(/\s+/);
      if (dash.classList.contains('m-enter') && !was.includes('m-enter')) arrive(dash.querySelector('.ks-scene'));
    }
  }).observe(dash, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });


  /* ── Ticket: cambio claro/noche con una lente de vidrio líquido ── */
  const themeBtn = $('ticketThemeBtn'), orderPanel = $('orderPanel');
  if (themeBtn && orderPanel) themeBtn.addEventListener('click', e => {
    if (themeBtn._kPass || calm() || document.hidden) return;
    e.stopImmediatePropagation(); e.preventDefault();
    replay(themeBtn, 'is-morphing', 620);
    const pr = orderPanel.getBoundingClientRect(), br = themeBtn.getBoundingClientRect();
    const x = br.left + br.width / 2 - pr.left + orderPanel.scrollLeft, y = br.top + br.height / 2 - pr.top + orderPanel.scrollTop;
    const r = Math.hypot(Math.max(x, pr.width - x), Math.max(y, pr.height - y));
    const lens = document.createElement('div');
    lens.className = 'k-liquid'; lens.setAttribute('aria-hidden', 'true');
    Object.assign(lens.style, { left: (x - r) + 'px', top: (y - r) + 'px', width: (r * 2) + 'px', height: (r * 2) + 'px' });
    orderPanel.append(lens);
    const run = lens.animate([
      { transform: 'scale(.03)', borderRadius: '50%', opacity: 1 },
      { transform: 'scale(.5)', borderRadius: '44% 56% 53% 47%', opacity: 1, offset: .42 },
      { transform: 'scale(1)', borderRadius: '50%', opacity: 1, offset: .7 },
      { transform: 'scale(1.06)', borderRadius: '50%', opacity: 0 }
    ], { duration: 900, easing: 'cubic-bezier(.23,1,.32,1)' });
    // El tema cambia debajo de la lente, cuando ya cubre el ticket.
    setTimeout(() => { themeBtn._kPass = true; themeBtn.click(); themeBtn._kPass = false; }, 330);
    run.onfinish = run.oncancel = () => lens.remove();
    setTimeout(() => lens.remove(), 1400); // por si la pestaña oculta congela la animación
  }, true);

  /* ── Contador del pedido: pequeño salto cuando cambia ── */
  const count = $('orderCount');
  if (count) { let last = count.textContent; new MutationObserver(() => { if (count.textContent !== last) { last = count.textContent; replay(count, 'k-pop', 480); } }).observe(count, { childList: true, characterData: true, subtree: true }); }

  /* ── Brillo candy bajo el puntero ── */
  const shiny = '.btn.primary,#dashboardPosBtn,.checkout,#loginBtn';
  let raf = 0, pending = null;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.(shiny);
    if (!el) return;
    pending = { el, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const { el: target, x, y } = pending, r = target.getBoundingClientRect();
      target.style.setProperty('--mx', ((x - r.left) / r.width * 100).toFixed(1) + '%');
      target.style.setProperty('--my', ((y - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }, { passive: true });

  /* ── Ranking: reordenar en su sitio ── */
  const ranking = $('teamPerformanceContent');
  if (ranking) {
    let last = new Map();
    const keyOf = row => row.querySelector('[data-view-profile]')?.dataset.viewProfile || row.querySelector('.profile-link')?.textContent.trim();
    const snapshot = () => {
      const map = new Map();
      ranking.querySelectorAll('.employee-week-rank-row').forEach(row => { const k = keyOf(row); if (k) map.set(k, row.offsetTop); });
      return map;
    };
    new MutationObserver(() => {
      const next = snapshot();
      if (!calm() && last.size) {
        ranking.querySelectorAll('.employee-week-rank-row').forEach(row => {
          const k = keyOf(row), before = last.get(k), after = next.get(k);
          if (before == null || after == null || before === after) return;
          row.animate([{ transform: `translateY(${before - after}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.77,0,.175,1)' });
          row.animate([{ backgroundColor: 'rgba(255,197,49,.14)' }, { backgroundColor: 'transparent' }], { duration: 1600, easing: 'ease-out' });
        });
      }
      last = next;
    }).observe(ranking, { childList: true });
  }

  /* ── Barras de la semana: índice para escalonar ── */
  const chart = document.querySelector('#weeklyActivityContent');
  const indexBars = () => chart?.querySelectorAll('.employee-week-bar').forEach((bar, i) => bar.style.setProperty('--k-b', i));
  if (chart) { indexBars(); new MutationObserver(indexBars).observe(chart, { childList: true, subtree: true }); }

  /* ── Riel plegado: el punto de la placa toma el color candy de la sección ── */
  const side = $('sidebar');
  const tint = () => {
    const active = side?.querySelector('.nav-item.active');
    const bump = side?.querySelector('.rail-bump');
    if (active && bump) bump.style.setProperty('--rail-sec', getComputedStyle(active).getPropertyValue('--sec').trim() || '#ffb526');
  };
  if (side) { tint(); new MutationObserver(tint).observe(side, { attributes: true, subtree: true, attributeFilter: ['class'] }); }

  /* ── Cargador: rin cromado de rayos ── */
  const loading = document.querySelector('#authLoading .auth-loading-content');
  if (loading && !loading.querySelector('.k-wheel-loader')) {
    let spokes = '';
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * Math.PI * 2;
      spokes += `<line x1="${(32 + Math.cos(a) * 4).toFixed(1)}" y1="${(32 + Math.sin(a) * 4).toFixed(1)}" x2="${(32 + Math.cos(a + .55) * 18).toFixed(1)}" y2="${(32 + Math.sin(a + .55) * 18).toFixed(1)}"/>`;
    }
    const wheel = document.createElement('div');
    wheel.innerHTML = `<svg class="k-wheel-loader" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#0d0b0c"/><circle cx="32" cy="32" r="23" fill="none" stroke="#efe8dc" stroke-width="5"/><circle cx="32" cy="32" r="19" fill="#c9d4d8"/><g stroke="#6f8086" stroke-width="1.2">${spokes}<circle cx="32" cy="32" r="6" fill="#ffb526" stroke="#8a5a00"/><path d="M19 30 L27 29 V35 L19 34Z M45 30 L37 29 V35 L45 34Z" fill="#ffb526" stroke="#8a5a00" stroke-width="1"/></g></svg>`;
    // El rin rueda sobre una calle con rayas que avanzan: progreso sin cifras falsas.
    const road = document.createElement('div');
    road.className = 'k-road'; road.setAttribute('aria-hidden', 'true');
    road.append(wheel.firstElementChild);
    const title = loading.querySelector('h2');
    loading.insertBefore(road, title || null);
  }
})();
