/* Carril de navegación flotante (escritorio ≥ 1101 px).
   Solo reorganiza la presentación: los botones son los mismos de index.html, con sus manejadores
   y permisos de app.js. En móvil el menú deslizable se mantiene igual. */
(function () {
  'use strict';
  const side = document.getElementById('sidebar');
  if (!side) return;
  const nav = side.querySelector('nav'), tools = side.querySelector('.nav-tools'), wide = matchMedia('(min-width:1101px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('rail-ui');

  // «Más herramientas»: los mismos botones, agrupados en un panel que se abre junto al carril.
  let panel = null;
  if (tools) {
    panel = document.createElement('div');
    panel.className = 'nav-tools-panel'; panel.id = 'navToolsPanel';
    panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Más herramientas');
    panel.innerHTML = '<p class="nav-tools-title" aria-hidden="true">Más herramientas</p>';
    for (const item of [...tools.querySelectorAll(':scope > .nav-item')]) panel.append(item);
    tools.append(panel);
    const summary = tools.querySelector('summary');
    summary.classList.add('rail-more');
    summary.setAttribute('aria-controls', panel.id);
    summary.insertAdjacentHTML('afterbegin', '<span class="nav-svg" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/></svg></span>');
    const place = () => {
      if (!tools.open || !wide.matches) { panel.style.removeProperty('top'); panel.style.removeProperty('left'); return; }
      const s = summary.getBoundingClientRect(), r = side.getBoundingClientRect(), h = panel.offsetHeight;
      const top = Math.round(Math.max(12, Math.min(innerHeight - h - 12, s.top + s.height / 2 - h / 2)));
      panel.style.left = `${Math.round(r.right + 14)}px`;
      panel.style.top = `${top}px`;
      panel.style.setProperty('--panel-arrow', `${Math.round(s.top + s.height / 2 - top)}px`);
    };
    tools.addEventListener('toggle', () => { summary.setAttribute('aria-expanded', String(tools.open)); requestAnimationFrame(place); if (tools.open && wide.matches) panel.querySelector('.nav-item:not(.hidden)')?.focus({ preventScroll: true }); });
    panel.addEventListener('click', e => { if (e.target.closest('.nav-item') && wide.matches) tools.open = false; });
    document.addEventListener('pointerdown', e => { if (tools.open && wide.matches && !tools.contains(e.target)) tools.open = false; });
    tools.addEventListener('keydown', e => {
      if (!wide.matches) return;
      if (e.key === 'Escape' && tools.open) { e.stopPropagation(); tools.open = false; summary.focus(); }
      if (!tools.open || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const items = [...panel.querySelectorAll('.nav-item')].filter(b => !b.classList.contains('hidden') && b.getClientRects().length);
      const i = items.indexOf(document.activeElement); e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    });
    addEventListener('resize', place, { passive: true });
    summary.setAttribute('aria-expanded', 'false');
  }

  // Cerrar sesión al pie del carril (usa el mismo botón de la ventana de cuenta).
  const bottom = side.querySelector('.sidebar-bottom');
  if (bottom && !document.getElementById('railLogout')) {
    const logout = document.createElement('button');
    logout.type = 'button'; logout.id = 'railLogout'; logout.className = 'rail-logout rail-tip';
    logout.setAttribute('aria-label', 'Cerrar sesión');
    logout.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H5v16h4M10 12h10m-4-4 4 4-4 4"/></svg>';
    logout.onclick = () => { if (typeof confirm !== 'function' || confirm('¿Cerrar sesión?')) document.getElementById('logoutBtn')?.click(); };
    bottom.append(logout);
    const sync = document.getElementById('sync');
    if (sync) { const label = () => sync.setAttribute('aria-label', `Nube: ${document.getElementById('syncText')?.textContent || 'estado'}`); label(); new MutationObserver(label).observe(sync, { subtree: true, childList: true, characterData: true }); }
  }

  // Muesca del elemento activo, como en el diseño de referencia.
  const bump = document.createElement('span');
  bump.className = 'rail-bump'; bump.setAttribute('aria-hidden', 'true');
  side.append(bump);
  let frame = 0;
  const update = () => {
    frame = 0;
    if (!wide.matches) { bump.hidden = true; return; }
    let target = nav.querySelector(':scope > .nav-item.active, :scope > .rail-profile-shortcut.active');
    if (!target && tools?.querySelector('.nav-item.active')) target = tools.querySelector('summary');
    const r = target?.getBoundingClientRect(), s = side.getBoundingClientRect(), n = nav.getBoundingClientRect();
    if (!r?.height || r.bottom < n.top + 6 || r.top > n.bottom - 6) { bump.hidden = true; return; }
    bump.hidden = false;
    bump.style.transform = `translateY(${Math.round(r.top - s.top + r.height / 2)}px)`;
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  new MutationObserver(queue).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class', 'open'] });
  nav.addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  wide.addEventListener('change', () => { if (tools) tools.open = false; queue(); });
  document.fonts?.ready.then(queue);
  setTimeout(() => { if (!reduced.matches) bump.classList.add('is-ready'); queue(); }, 60);
  queue();
})();
