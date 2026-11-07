/* Controles del resumen; conservan las cifras y permisos de app.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), dashboard = $('page-dashboard');
  if (!dashboard || dashboard.dataset.enhanced) return;
  dashboard.dataset.enhanced = 'true';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const calm = () => reduced?.matches || document.body.classList.contains('motion-off');
  const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
  const nav = page => [...document.querySelectorAll('.nav-item[data-page]')].find(b => b.dataset.page === page && !b.closest('.hidden') && !b.disabled);
  const go = page => nav(page)?.click();
  let frame = 0, chartView = 'bars', chartSignature = '';
  const detail = document.createElement('div'); detail.id = 'dashboardDayDetail'; detail.className = 'dashboard-day-detail'; detail.setAttribute('role', 'status'); detail.setAttribute('aria-live', 'polite');
  $('weeklyActivityContent')?.after(detail);
  function dayDetail(button) {
    detail.hidden = !button;
    if (!button) return;
    const label = button.getAttribute('aria-label') || '', split = label.indexOf(': '), day = split < 0 ? label : label.slice(0, split);
    const current = money(button.dataset.value);
    const compare = label.match(/\(([^)]+)\)$/)?.[1] || '';
    const value = `${day}|${current}|${compare}`;
    if (detail.dataset.value === value) return;
    detail.dataset.value = value;
    const title = document.createElement('span'); title.textContent = day;
    const amount = document.createElement('strong'); amount.textContent = current;
    const previous = document.createElement('small'); previous.textContent = compare;
    detail.replaceChildren(title, amount, previous);
  }
  function pickDay(button, focus = false) {
    for (const b of $('weeklyActivityContent').querySelectorAll('.employee-week-bar')) {
      b.classList.toggle('is-selected', b === button); b.setAttribute('aria-pressed', String(b === button));
    }
    if (focus) button.focus();
    dayDetail(button);
    updateLineSelection(button);
  }
  $('weeklyActivityContent')?.addEventListener('click', event => { const b = event.target.closest('.employee-week-bar'); if (b) pickDay(b); });
  $('weeklyActivityContent')?.addEventListener('keydown', event => {
    const current = event.target.closest('.employee-week-bar'); if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const days = [...$('weeklyActivityContent').querySelectorAll('.employee-week-bar')], i = days.indexOf(current);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : Math.max(0, Math.min(days.length - 1, i + (event.key === 'ArrowRight' ? 1 : -1)));
    event.preventDefault(); pickDay(days[next], true);
  });
  const viewTools = document.createElement('div'); viewTools.className = 'desk-chart-tools';
  viewTools.innerHTML = '<span>Evolución del periodo</span><div role="group" aria-label="Tipo de gráfica"><button type="button" data-chart-view="line" aria-pressed="true">Línea</button><button type="button" data-chart-view="bars" aria-pressed="false">Barras</button></div>';
  $('weeklyActivity')?.querySelector('.dashboard-panel-head')?.after(viewTools);
  viewTools.addEventListener('click', event => {
    const button = event.target.closest('[data-chart-view]'); if (!button) return;
    chartView = button.dataset.chartView; syncChart();
  });
  function updateLineSelection(button) {
    const line = $('weeklyActivityContent')?.querySelector('.desk-line'); if (!line || !button) return;
    const i = Number(button.dataset.day), circle = line.querySelector(`[data-line-day="${i}"]`); if (!circle) return;
    line.querySelectorAll('[data-line-day]').forEach(point => point.classList.toggle('is-active', Number(point.dataset.lineDay) === i));
    const x = Number(circle.getAttribute('cx')), y = Number(circle.getAttribute('cy')), guide = line.querySelector('.desk-line-guide');
    guide.setAttribute('x1', String(x)); guide.setAttribute('x2', String(x));
    const text = (button.getAttribute('aria-label') || '').split(' (')[0], readout = line.querySelector('.desk-line-readout');
    if (readout.textContent !== text) readout.textContent = text;
    readout.style.left = `${Math.max(14, Math.min(83, x / 640 * 100))}%`;
    readout.style.top = `${Math.max(15, y / 185 * 100 - 9)}%`;
  }
  function syncChart() {
    const host = $('weeklyActivityContent'), plot = host?.querySelector('.dashboard-chart-plot');
    const bars = [...(host?.querySelectorAll('.employee-week-bar') || [])];
    host?.classList.toggle('is-line-view', chartView === 'line');
    host?.style.setProperty('--day-count', String(bars.length || 7));
    for (const b of viewTools.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.chartView === chartView));
    viewTools.hidden = !bars.length;
    if (!plot || !bars.length) return;
    const next = bars.map(b => `${b.dataset.value}:${b.getAttribute('aria-label')}`).join('|');
    let line = host.querySelector('.desk-line');
    if (!line || chartSignature !== next) {
      line?.remove(); chartSignature = next;
      const values = bars.map(b => Math.max(0, Number(b.dataset.value) || 0));
      const previous = bars.map(b => Number((b.getAttribute('aria-label')?.match(/\([^:]+:\s*([^)]*)\)/)?.[1] || '').replace(/[^\d.-]/g, '')) || 0);
      const raw = Math.max(...values, ...previous, 1) / 4, power = 10 ** Math.floor(Math.log10(raw));
      const ceiling = 4 * ([1, 2, 2.5, 5, 10].find(n => n * power >= raw) || 10) * power;
      const points = data => data.map((value, i) => [40 + (i + .5) * 584 / data.length, 164 - value / ceiling * 145]);
      const current = points(values), before = points(previous), coordinates = data => data.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      const path = 'M' + current.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L');
      const length = current.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - current[i][0], p[1] - current[i][1]), 1);
      line = document.createElement('div'); line.className = 'desk-line'; line.dataset.still = String(calm());
      // Numeric coordinates only; accessible day/value controls remain the native buttons below.
      line.innerHTML = `<svg viewBox="0 0 640 185" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="deskLineShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--chart-accent)" stop-opacity=".23"/><stop offset="1" stop-color="var(--chart-accent)" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3,4].map(i => `<line class="desk-line-grid" x1="40" x2="624" y1="${19 + i * 36.25}" y2="${19 + i * 36.25}"/>`).join('')}<path class="desk-line-area" d="${path} L${current.at(-1)[0].toFixed(2)} 164 L${current[0][0].toFixed(2)} 164 Z" fill="url(#deskLineShade)"/>${previous.some(Boolean) ? `<polyline class="desk-line-previous" points="${coordinates(before)}"/>` : ''}<path class="desk-line-path" d="${path}" pathLength="1"/><line class="desk-line-guide" x1="40" x2="40" y1="12" y2="164"/>${current.map(([x, y], i) => `<circle data-line-day="${i}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.5"/>`).join('')}</svg><div class="desk-line-axis" aria-hidden="true"></div><div class="desk-line-readout" aria-hidden="true"></div>`;
      const trace = line.querySelector('.desk-line-path'); trace.removeAttribute('pathLength'); trace.style.setProperty('--line-length', String(length));
      const axis = line.querySelector('.desk-line-axis');
      [4,3,2,1,0].forEach(n => { const label = document.createElement('span'); label.textContent = money(n * ceiling / 4); axis.append(label); });
      const inspect = event => {
        const rect = line.getBoundingClientRect(); if (!rect.width) return;
        const x = (event.clientX - rect.left) / rect.width * 640, index = Math.max(0, Math.min(bars.length - 1, Math.floor((x - 40) / 584 * bars.length)));
        if (bars[index].getAttribute('aria-pressed') !== 'true') pickDay(bars[index]);
      };
      line.addEventListener('pointermove', inspect); line.addEventListener('pointerdown', inspect);
      plot.before(line);
    }
    line.hidden = chartView !== 'line';
    line.dataset.still = String(calm());
    updateLineSelection(bars.find(b => b.getAttribute('aria-pressed') === 'true') || bars[0]);
  }

  function refresh() {
    frame = 0;
    for (const metric of $('dashboardMetrics')?.querySelectorAll('.metric') || []) {
      if (metric.querySelector('.metric-open')) continue;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'metric-open'; b.innerHTML = arrow;
      const label = metric.querySelector('.dashboard-metric-copy>span')?.textContent || 'métrica';
      b.setAttribute('aria-label', `Ver detalle de ${label}`);
      b.addEventListener('click', () => go(metric.dataset.metric === '0' ? (nav('allSales') ? 'allSales' : 'mySales') : 'analytics'));
      metric.append(b);
      const edge = document.createElement('i'); edge.className = 'metric-hover-edge'; edge.setAttribute('aria-hidden', 'true'); metric.append(edge);
      metric.addEventListener('click', event => { if (!event.target.closest('button')) b.click(); });
    }
    dayDetail($('weeklyActivityContent')?.querySelector('.employee-week-bar[aria-pressed="true"]'));
    syncChart();
    const top = $('rsStage')?.querySelector('.rs-top');
    if (top && !$('rsSummaryBtn')) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'rsSummaryBtn'; b.className = 'rs-summary-btn'; b.textContent = 'Ver resumen'; b.addEventListener('click', () => go('dashboard')); top.insertBefore(b, $('rsPresenceBtn'));
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(refresh); }
  for (const id of ['dashboardMetrics', 'weeklyActivityContent']) if ($(id)) new MutationObserver(queue).observe($(id), { childList: true, subtree: true });
  if ($('app')) new MutationObserver(queue).observe($('app'), { attributes: true, attributeFilter: ['class'] });
  if ($('primaryNav')) new MutationObserver(queue).observe($('primaryNav'), { attributes: true, subtree: true, attributeFilter: ['class'] });
  new MutationObserver(queue).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-effects'] });
  reduced?.addEventListener('change', queue);
  window.addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); });
  queue();
})();
