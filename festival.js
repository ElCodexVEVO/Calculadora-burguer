(()=>{
  'use strict';
  const topbar=document.querySelector('#app .topbar');
  const panel=document.querySelector('.product-panel');
  const title=document.querySelector('.pos-title');
  const hero=document.querySelector('.atelier-hero');
  const dashboard=document.querySelector('#page-dashboard .hero-row');
  // Keep the photographic cover on the home page, freeing the catalog for larger photos.
  dashboard.after(hero);
  title.querySelector('h1').textContent='Arma el pedido';
  title.querySelector('.eyebrow').textContent='CAJA · EDICIÓN DÍA DE MUERTOS';
  title.querySelector('p').textContent='El sabor de nuestras tradiciones.';
  const subtitle=document.createElement('div');
  subtitle.className='festival-title-sub';
  title.querySelector('p').before(subtitle);
  subtitle.append(title.querySelector('p'),document.getElementById('productCount'));
  title.querySelector('.pos-session').hidden=true;
  title.append(panel.querySelector('.search'));
  panel.prepend(title);

  const decor=document.createElement('div');
  decor.className='festival-header-art';
  decor.setAttribute('aria-hidden','true');
  decor.innerHTML='<i class="festival-corner left"></i><i class="festival-corner right"></i><i class="festival-candlelight light-a"></i><i class="festival-candlelight light-b"></i><i class="festival-candlelight light-c"></i>';
  topbar.prepend(decor);
  // Papel picado drawn inline so each flag can flutter and glow through its cut-outs.
  const flags=document.createElement('div');
  flags.className='festival-bunting';
  flags.setAttribute('aria-hidden','true');
  const holes='<g fill="#000">'+Array.from({length:9},(_,k)=>`<circle cx="13" cy="${12+k*8}" r="1.7"/><circle cx="107" cy="${12+k*8}" r="1.7"/>`).join('')+Array.from({length:11},(_,k)=>`<circle cx="${21+k*8}" cy="12" r="1.7"/>`).join('')+Array.from({length:12},(_,k)=>`<circle cx="${16+k*8}" cy="${k%2?87:85}" r="2.3"/>`).join('')+'<path d="m26 24 4 6-4 6-4-6Zm68 0 4 6-4 6-4-6ZM26 62l4 6-4 6-4-6Zm68 0 4 6-4 6-4-6Z"/></g>';
  const skull='M60 29c-14 0-22 8-22 20 0 7 3 12 8 15v9h28v-9c5-3 8-8 8-15 0-12-8-20-22-20Z';
  const motifs={
    calabaza:'<g fill="#000"><ellipse cx="49" cy="52" rx="14.5" ry="16.5"/><ellipse cx="71" cy="52" rx="14.5" ry="16.5"/><ellipse cx="60" cy="51" rx="15.5" ry="18.5"/><rect x="56" y="27" width="8" height="11" rx="2"/></g><g fill="#fff"><ellipse cx="49" cy="52" rx="12" ry="14"/><ellipse cx="71" cy="52" rx="12" ry="14"/><ellipse cx="60" cy="51" rx="13" ry="16"/><rect x="58.2" y="29.5" width="3.6" height="7" rx="1"/></g><path fill="#000" d="m46 49 5-8 5 8Zm18 0 5-8 5 8Zm-6.5 5.5 2.5-4 2.5 4ZM44 57q16 15 32 0l-4 1-2 3-3-2-3 4-4-3-4 3-3-4-3 2-2-3Z"/>',
    calavera:`<path d="${skull}" fill="#000" stroke="#000" stroke-width="5" stroke-linejoin="round"/><path d="${skull}" fill="#fff"/><g fill="#000"><ellipse cx="51" cy="49" rx="5.5" ry="6.5"/><ellipse cx="69" cy="49" rx="5.5" ry="6.5"/><path d="m60 55-3.5 5.5h7Z"/><circle cx="60" cy="36.5" r="2.4"/><circle cx="54.5" cy="38.5" r="1.3"/><circle cx="65.5" cy="38.5" r="1.3"/></g><path d="M53.5 65v6m4.5-6v6m4.5-6v6m4.5-6v6" stroke="#000" stroke-width="1.6"/>`,
    flor:'<g fill="#000">'+[0,45,90,135,180,225,270,315].map(a=>`<ellipse cx="60" cy="33" rx="5" ry="13" transform="rotate(${a} 60 49)"/><circle cx="60" cy="24" r="1.5" transform="rotate(${a+22.5} 60 49)"/>`).join('')+'</g><circle cx="60" cy="49" r="7" fill="#fff"/><circle cx="60" cy="49" r="3" fill="#000"/>'
  };
  const outline='<path d="M5 2h110v77l-4 4-4-1-4 5-4-1-4 4-4-1-4 4-4-2-5 3-5-2-5 3-5-2-5 3-5-3-5 2-5-3-5 2-4-3-4 1-4-4-4 1-4-4-4 1-4-5-4 1-4-4Z" fill="#fff"/>';
  const defs='<svg class="festival-paper-defs" width="0" height="0" focusable="false"><defs><linearGradient id="bsPaperShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".13" stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>'+Object.entries(motifs).map(([name,art])=>`<mask id="bsCut-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="96">${outline}${holes}${art}</mask>`).join('')+'</defs></svg>';
  const paper={rosa:'#e0368c',naranja:'#f5891f',morado:'#8b43c4'};
  const pattern=['rosa-flor','naranja-calabaza','morado-flor','rosa-calavera','naranja-flor','morado-calavera'];
  flags.innerHTML='<i class="festival-cord"></i>'+defs+Array.from({length:15},(_,i)=>{
    const [color,motif]=pattern[i%pattern.length].split('-');
    return `<span class="bs-flag" style="--i:${i};--drop:${i%3*3}px;--flutter:${(3.3+i%4*.45).toFixed(2)}s"><span class="bs-flag-swing"><span class="bs-flag-paper"><i class="bs-flag-glow ${motif}" style="--flicker:${(2.4+i%3*.55).toFixed(2)}s;--glow-delay:-${(i*.41).toFixed(2)}s"></i><svg viewBox="0 0 120 96" preserveAspectRatio="none" focusable="false"><rect width="120" height="96" fill="${paper[color]}" mask="url(#bsCut-${motif})"/><rect width="120" height="96" fill="url(#bsPaperShade)" mask="url(#bsCut-${motif})"/></svg></span></span></span>`;
  }).join('');
  topbar.prepend(flags);
  const sidebarArt=document.createElement('div');
  sidebarArt.className='festival-sidebar-art';
  sidebarArt.setAttribute('aria-hidden','true');
  document.querySelector('.sidebar').prepend(sidebarArt);

  // Original inputs and handlers remain attached when controls are reorganized.
  const details=document.querySelector('.atelier-templates');
  details.classList.add('festival-benefits');
  details.querySelector('summary').innerHTML='<span class="festival-percent">%</span> Cupones y pedidos guardados <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  const templates=details.querySelector('.order-templates');
  details.append(document.querySelector('.coupon-row'),document.getElementById('orderPromotion'),document.getElementById('promotionHint'),templates);
  document.querySelector('.order-options').before(details);

  // Ticket de cobro claro (crema) u oscuro; la preferencia queda en este navegador.
  const orderPanel=document.querySelector('.order-panel');
  const themeBtn=document.createElement('button');
  themeBtn.type='button';themeBtn.id='ticketThemeBtn';themeBtn.className='icon-btn soft ticket-theme-btn';
  themeBtn.setAttribute('aria-label','Ticket oscuro');
  themeBtn.innerHTML='<svg class="ui-icon icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg><svg class="ui-icon icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const setTicketTheme=dark=>{orderPanel.classList.toggle('ticket-dark',dark);themeBtn.setAttribute('aria-pressed',String(dark));themeBtn.title=dark?'Cambiar a ticket claro':'Cambiar a ticket oscuro'};
  let savedTheme=null;try{savedTheme=localStorage.getItem('bs_ticket_theme')}catch{}
  setTicketTheme(savedTheme==='dark');
  themeBtn.onclick=()=>{
    const dark=!orderPanel.classList.contains('ticket-dark');
    orderPanel.classList.add('ticket-switching');setTicketTheme(dark);
    try{localStorage.setItem('bs_ticket_theme',dark?'dark':'light')}catch{}
    setTimeout(()=>orderPanel.classList.remove('ticket-switching'),450);
  };
  document.querySelector('.order-head-actions').prepend(themeBtn);

  const tabIcons={
    all:'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
    combos:'<path d="M3 9h18M4 12h16M5 16h14M5 6c2-4 12-4 14 0M4 19h16"/>',
    individuales:'<path d="M5 7h14l-1 14H6zM8 7V3m4 4V2m4 5V3"/>',
    extras:'<path d="M12 4v16M4 12h16"/>',
    cajas:'<path d="m3 7 9-4 9 4v13H3zM3 7l9 4 9-4M12 11v9"/>',
    mayoreo:'<path d="m3 7 9-4 9 4v13H3zM3 7l9 4 9-4M12 11v9"/>'
  };
  const tabs=document.getElementById('categoryTabs');
  const decorateTabs=()=>tabs.querySelectorAll('.category-tab').forEach(button=>{
    if(button.querySelector('svg'))return;
    const path=tabIcons[button.dataset.cat]||tabIcons.cajas;
    button.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`);
  });
  decorateTabs();
  new MutationObserver(decorateTabs).observe(tabs,{childList:true});
})();
