/* Burger Shot V7 · Ofrenda nocturna.
   Decoración de temporada, accesibilidad de la cáscara y movimiento ligado a eventos reales.
   No cambia el carrito, los importes ni los manejadores de app.js: solo observa y acompaña. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const app=$('app'),topbar=document.querySelector('#app .topbar'),sidebar=$('sidebar');
  if(!app||!topbar)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide=window.matchMedia('(min-width: 1101px)');
  const still=()=>reduced.matches||document.body.classList.contains('motion-off');
  const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0);
  const effects=new Set();

  // Repite una animación CSS de forma segura: la clase se retira al terminar o al cancelarse.
  const replay=(el,cls)=>{
    if(!el||still())return;
    el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
    const done=e=>{if(e.target!==el)return;el.classList.remove(cls);el.removeEventListener('animationend',done);el.removeEventListener('animationcancel',done)};
    el.addEventListener('animationend',done);el.addEventListener('animationcancel',done);
  };
  const animate=(el,frames,options,done)=>{
    const a=el.animate(frames,options),record={el,a};effects.add(record);
    a.finished.catch(()=>{}).then(()=>{effects.delete(record);el.remove();done?.()});
    return a;
  };
  // Con movimiento reducido o «Animaciones suaves» desactivado, todo efecto en curso se retira al instante.
  const stopEffects=()=>{
    if(!still())return;
    for(const {el,a} of effects){a.cancel();el.remove()}
    effects.clear();
    document.querySelectorAll('.bs-receipt,.bs-burst,.bs-fly').forEach(el=>el.remove());
  };
  reduced.addEventListener('change',stopEffects);
  new MutationObserver(stopEffects).observe(document.body,{attributes:true,attributeFilter:['class']});

  /* ── Papel picado ── */
  const PAPER='M4 1h112v74l-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-5-2-5 4-4-4Z';
  const holes=Array.from({length:8},(_,k)=>`<circle cx="12" cy="${12+k*8}" r="1.9"/><circle cx="108" cy="${12+k*8}" r="1.9"/>`).join('')+Array.from({length:11},(_,k)=>`<circle cx="${20+k*8}" cy="9" r="1.7"/>`).join('');
  const skull='M60 26c-14 0-22 8-22 21 0 7 3 12 8 15v9h28v-9c5-3 8-8 8-15 0-13-8-21-22-21Z';
  const motifs={
    calavera:`<path d="${skull}" fill="#000"/><g fill="#fff"><ellipse cx="51" cy="46" rx="5.5" ry="6.5"/><ellipse cx="69" cy="46" rx="5.5" ry="6.5"/><path d="m60 52-3.5 6h7Z"/><path d="M52 63h3v6h-3zm6 0h3v6h-3zm6 0h3v6h-3z"/></g>`,
    flor:'<g fill="#000">'+[0,45,90,135,180,225,270,315].map(a=>`<ellipse cx="60" cy="30" rx="5.5" ry="13" transform="rotate(${a} 60 46)"/>`).join('')+'</g><circle cx="60" cy="46" r="6.5" fill="#fff"/><circle cx="60" cy="46" r="2.6" fill="#000"/>',
    calabaza:'<g fill="#000"><ellipse cx="48" cy="50" rx="14" ry="16"/><ellipse cx="72" cy="50" rx="14" ry="16"/><ellipse cx="60" cy="49" rx="15" ry="18"/><rect x="56" y="25" width="8" height="10" rx="2"/></g><g fill="#fff"><path d="m45 47 5-8 5 8Zm20 0 5-8 5 8Zm-7.5 5.5 2.5-4 2.5 4ZM44 56q16 14 32 0l-4 1-2 3-3-2-3 4-4-3-4 3-3-4-3 2-2-3Z"/></g>'
  };
  const defs=document.createElement('div');defs.className='papel-defs';defs.setAttribute('aria-hidden','true');
  defs.innerHTML=`<svg width="0" height="0" focusable="false"><defs>${Object.entries(motifs).map(([name,art])=>`<mask id="papelCut-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="84"><path d="${PAPER}" fill="#fff"/><g fill="#000">${holes}</g>${art}</mask>`).join('')}<linearGradient id="papelShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".2" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs></svg>`;
  document.body.prepend(defs);
  const colors=['#f28c1b','#8e2846','#6a3270','#e7d6bd','#c96a0a','#7a1e3a'];
  const order=['flor','calavera','calabaza'];
  const garland=document.createElement('div');garland.className='papel-picado';garland.setAttribute('aria-hidden','true');
  garland.innerHTML='<span class="cord"></span><div class="flags">'+Array.from({length:22},(_,i)=>{
    const motif=order[i%3],color=colors[i%colors.length];
    return `<span class="flag" style="--tilt:${(i%2?1.2:-1.2)}deg;--dur:${(4.4+i%5*.55).toFixed(2)}s;--delay:-${(i*.37).toFixed(2)}s"><svg viewBox="0 0 120 84" preserveAspectRatio="none" focusable="false"><rect width="120" height="84" fill="${color}" mask="url(#papelCut-${motif})"/><rect width="120" height="84" fill="url(#papelShade)" mask="url(#papelCut-${motif})"/></svg></span>`;
  }).join('')+'</div>';
  topbar.append(garland);
  // Cuántas banderas caben y cuánto cae cada una según su posición en el cordel.
  const fitFlags=()=>{
    const width=garland.clientWidth||topbar.clientWidth,count=Math.max(5,Math.min(22,Math.floor(width/(width<760?54:70)))),sag=width<760?5:8;
    garland.querySelectorAll('.flag').forEach((flag,i)=>{
      flag.hidden=i>=count;
      const x=count>1?(i/(count-1))*2-1:0;flag.style.setProperty('--drop',`${(sag*(1-x*x)).toFixed(1)}px`);
    });
  };
  new ResizeObserver(fitFlags).observe(topbar);
  let scrolled=false;
  const onScroll=()=>{const next=window.scrollY>12;if(next!==scrolled){scrolled=next;topbar.classList.toggle('is-scrolled',next)}};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* ── Altar de fondo y cempasúchil en dos planos ── */
  const backdrop=document.createElement('div');backdrop.className='season-backdrop';backdrop.setAttribute('aria-hidden','true');
  const petals=document.createElement('div');petals.className='ambient-petals';petals.setAttribute('aria-hidden','true');
  petals.innerHTML=Array.from({length:24},(_,i)=>`<i style="--x:${((i+.5)*100/24).toFixed(2)}%;--x-tablet:${((i%18+.5)*100/18).toFixed(2)}%;--x-mobile:${((i%12+.5)*100/12).toFixed(2)}%;--s:${16+i%5*3}px;--dur:${12+i*7%9}s;--delay:-${(i*5.7%22).toFixed(1)}s;--drift:${i%2?'-':''}${50+i%5*20}px;--spin:${(i%2?1:-1)*(360+i%4*90)}deg;--alpha:${(i%3===2?.3:.52+i%4*.06).toFixed(2)}"></i>`).join('');
  app.prepend(backdrop,petals);
  // Solo en el inicio: la caja y la caja auxiliar quedan libres de movimiento ambiental.
  const home=$('page-dashboard');
  const syncPetals=()=>{petals.hidden=document.hidden||app.classList.contains('hidden')||still()||document.body.classList.contains('season-petals-off')||!home?.classList.contains('active')};
  reduced.addEventListener('change',syncPetals);document.addEventListener('visibilitychange',syncPetals);
  new MutationObserver(syncPetals).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncPetals).observe(app,{attributes:true,attributeFilter:['class']});
  if(home)new MutationObserver(syncPetals).observe(home,{attributes:true,attributeFilter:['class']});
  syncPetals();
  // Preferencia de pétalos en Ajustes (se conserva la clave de V6.5).
  const settings=document.querySelector('.v6-settings');
  if(settings&&!$('seasonPetalToggle')){
    const label=document.createElement('label');label.className='permission-row';
    label.innerHTML='<span><strong>Pétalos en el ambiente</strong><small>Cempasúchil y luz cálida detrás de los paneles de Inicio.</small></span><input id="seasonPetalToggle" type="checkbox" checked>';
    settings.querySelector('h2').after(label);
    const toggle=label.querySelector('input');
    try{toggle.checked=localStorage.getItem('bs_season_petals')!=='false'}catch{}
    const apply=()=>document.body.classList.toggle('season-petals-off',!toggle.checked);apply();
    toggle.onchange=()=>{apply();try{localStorage.setItem('bs_season_petals',String(toggle.checked))}catch{}};
  }

  /* ── Insignia de temporada: la escena 3D se carga solo cuando se ve y con movimiento; si no, queda la imagen de respaldo ── */
  const seasonArt=document.querySelector('.season-card-art');
  if(seasonArt&&'IntersectionObserver' in window){
    let seasonStarted=false;
    const startScene=()=>{
      if(seasonStarted||still()||navigator.connection?.saveData||navigator.deviceMemory<=2)return;
      seasonStarted=true;
      import('./season-scene.js').then(m=>m.mount(seasonArt,{still})).then(scene=>{window.BurgerShotSeasonScene=scene;seasonArt.dataset.scene='3d'})
        .catch(()=>{seasonArt.classList.remove('is-3d');seasonArt.querySelector('canvas')?.remove();seasonArt.dataset.scene='respaldo'});
    };
    const seasonIO=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){startScene();if(seasonStarted)seasonIO.disconnect()}});
    seasonIO.observe(seasonArt);
  }

  /* ── Menú lateral en móvil ── */
  const menuBtn=$('mobileMenu'),scrim=document.querySelector('.sidebar-scrim');
  const syncMenu=()=>{const open=sidebar.classList.contains('open');menuBtn?.setAttribute('aria-expanded',String(open));menuBtn?.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');document.body.classList.toggle('menu-open',open&&!wide.matches)};
  new MutationObserver(syncMenu).observe(sidebar,{attributes:true,attributeFilter:['class']});
  scrim?.addEventListener('click',()=>{sidebar.classList.remove('open');menuBtn?.focus()});
  menuBtn?.addEventListener('click',()=>{if(sidebar.classList.contains('open'))requestAnimationFrame(()=>sidebar.querySelector('.nav-item.active,.nav-item')?.focus({preventScroll:true}))});
  syncMenu();
  // Si la sección activa vive en «Más herramientas», el grupo se abre para que se vea dónde estás.
  const tools=document.querySelector('.nav-tools');
  if(tools)new MutationObserver(()=>{if(tools.querySelector('.nav-item.active'))tools.open=true}).observe(sidebar.querySelector('nav'),{attributes:true,subtree:true,attributeFilter:['class']});

  /* ── Escape cierra la ventana superior y el foco vuelve a quien la abrió ── */
  const handled=new Set(['v6Modal','payoutDetailModal','auditDetailModal']);
  const visibleModals=()=>[...document.querySelectorAll('.modal-backdrop:not(.hidden)')];
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||e.defaultPrevented)return;
    if(sidebar.classList.contains('open')&&!wide.matches){sidebar.classList.remove('open');menuBtn?.focus();return}
    const top=visibleModals().at(-1);if(!top||handled.has(top.id))return;
    top.querySelector('[data-close]')?.click();
  });
  // La app enfoca un campo de la ventana al abrirla, así que se recuerda el último foco fuera de las ventanas.
  const openers=new WeakMap();let lastOutside=null;
  document.addEventListener('focusin',e=>{if(!e.target.closest('.modal-backdrop'))lastOutside=e.target});
  document.querySelectorAll('.modal-backdrop').forEach(modal=>{
    new MutationObserver(()=>{
      const open=!modal.classList.contains('hidden');
      if(open){if(!openers.has(modal)&&lastOutside)openers.set(modal,lastOutside)}
      else{
        const opener=openers.get(modal);openers.delete(modal);
        const lost=!document.activeElement||document.activeElement===document.body||modal.contains(document.activeElement);
        if(lost&&opener?.isConnected&&!opener.closest('.hidden'))opener.focus({preventScroll:true});
      }
    }).observe(modal,{attributes:true,attributeFilter:['class']});
  });

  /* ── Ticket oscuro o claro (preferencia local) ── */
  const orderPanel=$('orderPanel'),themeBtn=$('ticketThemeBtn');
  if(orderPanel&&themeBtn){
    const setTicket=light=>{
      orderPanel.classList.toggle('ticket-light',light);themeBtn.setAttribute('aria-pressed',String(light));
      themeBtn.setAttribute('aria-label',light?'Ticket oscuro':'Ticket claro');themeBtn.title=light?'Cambiar a ticket oscuro':'Cambiar a ticket claro';
    };
    let saved=null;try{saved=localStorage.getItem('bs_ticket_theme')}catch{}
    setTicket(saved!=='dark');
    themeBtn.addEventListener('click',()=>{
      const light=!orderPanel.classList.contains('ticket-light');
      orderPanel.classList.add('ticket-switching');setTicket(light);
      try{localStorage.setItem('bs_ticket_theme',light?'light':'dark')}catch{}
      setTimeout(()=>orderPanel.classList.remove('ticket-switching'),500);
    });
  }

  /* ── Iconos de categorías ── */
  const tabIcons={
    all:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    combos:'<path d="M4 10c1.5-5 14.5-5 16 0ZM3.5 13h17M5 16h14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"/>',
    individuales:'<path d="M6 8h12l-1.2 12H7.2ZM9 8V4m3 4V3m3 5V4"/>',
    extras:'<path d="M8 3h8l-1 6h-6ZM9 9l1 12h4l1-12M7 9h10"/>',
    cajas:'<path d="m3.5 8 8.5-4 8.5 4v11.5h-17ZM3.5 8l8.5 4 8.5-4M12 12v7.5"/>',
    mayoreo:'<path d="M3 10h8v10H3zM13 10h8v10h-8zM8 3h8v7H8z"/>'
  };
  const tabs=$('categoryTabs');
  const decorateTabs=()=>tabs?.querySelectorAll('.category-tab').forEach(b=>{if(!b.querySelector('svg'))b.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" aria-hidden="true">${tabIcons[b.dataset.cat]||tabIcons.cajas}</svg>`)});
  if(tabs){decorateTabs();new MutationObserver(decorateTabs).observe(tabs,{childList:true})}

  /* ── Barra de pedido en móvil y tableta ── */
  const page=$('page-pos'),count=$('orderCount'),grand=$('grandTotal');
  // En Caja, la decoración queda quieta y las confirmaciones son breves.
  const syncOperation=()=>document.body.classList.toggle('pos-active',Boolean(page?.classList.contains('active')&&!app.classList.contains('hidden')));
  if(page)new MutationObserver(syncOperation).observe(page,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncOperation).observe(app,{attributes:true,attributeFilter:['class']});
  syncOperation();
  const dock=document.createElement('div');dock.className='order-dock';dock.id='orderDock';
  dock.innerHTML='<button type="button" aria-controls="orderPanel"><span class="dock-count" id="orderDockCount">0</span><span class="dock-label"><b>Ver pedido</b><small>Total a cobrar</small></span><strong id="orderDockTotal">$0</strong></button>';
  app.append(dock);
  const dockCount=$('orderDockCount'),dockTotal=$('orderDockTotal');
  let panelInView=false;
  const syncDock=()=>{
    dockCount.textContent=count?.textContent||'0';dockTotal.textContent=grand?.textContent||'$0';
    const items=Number(String(count?.textContent||'0').replace(/\D/g,''))||0;
    const show=!wide.matches&&page?.classList.contains('active')&&!app.classList.contains('hidden')&&items>0&&!panelInView;
    dock.classList.toggle('is-visible',Boolean(show));dock.toggleAttribute('inert',!show);
    document.body.classList.toggle('pos-docked',Boolean(show));
    dock.querySelector('button').setAttribute('aria-label',`Ver pedido: ${items} ${items===1?'producto':'productos'}, total ${grand?.textContent||'$0'}`);
  };
  if(orderPanel&&'IntersectionObserver' in window){
    new IntersectionObserver(entries=>{panelInView=entries.some(e=>e.isIntersecting);syncDock()},{threshold:.12}).observe(orderPanel);
  }
  for(const el of [count,grand])if(el)new MutationObserver(syncDock).observe(el,{childList:true,characterData:true,subtree:true});
  if(page)new MutationObserver(syncDock).observe(page,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncDock).observe(app,{attributes:true,attributeFilter:['class']});
  wide.addEventListener('change',syncDock);
  dock.querySelector('button').addEventListener('click',()=>{
    // Distancias largas: salto inmediato y un destello breve del ticket para orientar.
    const far=Math.abs(orderPanel.getBoundingClientRect().top)>1400;
    orderPanel.scrollIntoView({behavior:still()||far?'instant':'smooth',block:'start'});
    replay(orderPanel,'is-arrived');
    const title=$('orderTitle');title.setAttribute('tabindex','-1');title.focus({preventScroll:true});
  });
  syncDock();

  /* ── Ticket en escritorio: su altura se ajusta al hueco visible para que «Cobrar» nunca quede bajo el pliegue ── */
  let ticketFrame=0;
  const fitTicket=()=>{
    ticketFrame=0;if(!orderPanel)return;
    if(!wide.matches||!page?.classList.contains('active')){orderPanel.style.removeProperty('--ticket-max');return}
    const sticky=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--o-topbar'))+16||80;
    const top=Math.max(orderPanel.getBoundingClientRect().top,sticky);
    orderPanel.style.setProperty('--ticket-max',Math.max(360,innerHeight-top-16)+'px');
  };
  const queueTicket=()=>{if(!ticketFrame)ticketFrame=requestAnimationFrame(fitTicket)};
  window.addEventListener('scroll',queueTicket,{passive:true});window.addEventListener('resize',queueTicket,{passive:true});
  if(page)new MutationObserver(queueTicket).observe(page,{attributes:true,attributeFilter:['class']});
  queueTicket();

  /* ── Catálogo: las tarjetas entran solo cuando cambia la lista ── */
  const grid=$('productGrid');let shown='';
  if(grid)new MutationObserver(()=>{
    const cards=[...grid.querySelectorAll('.product-card')],list=cards.map(c=>c.dataset.product).join('|');
    if(list===shown)return;shown=list;if(still())return;
    cards.forEach((card,i)=>{card.style.setProperty('--i',Math.min(i,10));replay(card,'bs-enter')});
  }).observe(grid,{childList:true});

  /* ── Añadir al pedido: confirmación breve y una miniatura hacia el contador ── */
  let flying=0;
  const target=()=>dock.classList.contains('is-visible')?dockCount:count;
  const fly=(img,quantity)=>{
    const to=target();if(still()||!img||!to||flying>=3)return false;
    const from=img.getBoundingClientRect(),end=to.getBoundingClientRect();
    if(!from.width||from.bottom<0||from.top>innerHeight||!end.width||end.bottom<0||end.top>innerHeight)return false;
    const ghost=document.createElement('div'),photo=img.cloneNode(false);
    ghost.className='bs-fly';ghost.setAttribute('aria-hidden','true');photo.removeAttribute('loading');photo.alt='';ghost.append(photo);
    if(quantity>1){const badge=document.createElement('span');badge.className='bs-fly-quantity';badge.textContent=`×${quantity.toLocaleString('es-MX')}`;ghost.append(badge)}
    const size=48,startX=from.left+from.width/2-size/2,startY=from.top+from.height/2-size/2;
    Object.assign(ghost.style,{left:startX+'px',top:startY+'px',width:size+'px',height:size+'px'});
    document.body.append(ghost);
    const dx=end.left+end.width/2-(startX+size/2),dy=end.top+end.height/2-(startY+size/2);
    flying++;
    animate(ghost,[
      {transform:'translate(0,0) scale(1)',opacity:.85,borderRadius:'10px'},
      {transform:`translate(${dx}px,${dy}px) scale(.45)`,opacity:0,borderRadius:'10px'}
    ],{duration:280,easing:'cubic-bezier(.2,.65,.3,1)'},()=>{flying--;replay(to,'bs-pop')});
    return true;
  };
  // Vista previa del importe visible mientras la cantidad no es 1; confirmación breve sobre la foto.
  grid?.addEventListener('input',e=>{const input=e.target.closest('[data-bulk-qty]');if(input)input.closest('.product-card')?.classList.toggle('has-qty',input.value.trim()!==''&&input.value.trim()!=='1')});
  const feedbackTimers=new WeakMap();
  document.addEventListener('bs:cart-added',e=>{
    const {id,quantity=1}=e.detail||{};
    const card=id&&[...(grid?.querySelectorAll('.product-card')||[])].find(el=>el.dataset.product===id);
    if(card){card.classList.remove('has-qty');card.classList.add('feedback-on');clearTimeout(feedbackTimers.get(card));feedbackTimers.set(card,setTimeout(()=>card.classList.remove('feedback-on'),1400))}
    if(card&&card.getBoundingClientRect().width){
      replay(card,'is-added');replay(card.querySelector('[data-add]'),'bs-pop');replay(card.querySelector('.in-cart-count'),'bs-pop');
      if(fly(card.querySelector('.food-photo'),Number(quantity)||1))return;
    }
    replay(target(),'bs-pop');
  });

  /* ── Pedido: líneas nuevas entran; cantidades e importes cambiados hacen un «tic» ── */
  const cartList=$('cartList');let known=new Map();
  if(cartList)new MutationObserver(()=>{
    const next=new Map();let fresh=0;
    cartList.querySelectorAll('.cart-item').forEach(item=>{
      const id=item.querySelector('[data-remove]')?.dataset.remove,qty=item.querySelector('[data-q-input]')?.value;if(!id)return;
      next.set(id,qty);
      if(!known.has(id)){item.style.setProperty('--i',Math.min(fresh++,6));replay(item,'bs-line-in')}
      else if(known.get(id)!==qty)replay(item.querySelector('.line-total strong'),'bs-tick');
    });
    known=next;
  }).observe(cartList,{childList:true});
  for(const id of ['grandTotal','checkoutTotal','commissionPreview','orderDockTotal']){
    const el=$(id);if(!el)continue;let last=el.textContent;
    new MutationObserver(()=>{if(el.textContent===last)return;last=el.textContent;replay(el,'bs-tick')}).observe(el,{childList:true,characterData:true,subtree:true});
  }

  /* ── Resultado real de cada acción ── */
  document.addEventListener('bs:sale-registered',e=>{
    if(still())return;
    const {total=0,client='',items=0}=e.detail||{},button=$('checkoutBtn'),r=button?.getBoundingClientRect();
    const visible=Boolean(r?.width)&&r.top>120&&r.bottom<innerHeight,width=Math.min(260,Math.max(220,r?.width||240));
    const slip=document.createElement('div');slip.className='bs-receipt';slip.setAttribute('aria-hidden','true');
    Object.assign(slip.style,{width:width+'px',left:Math.max(12,(visible?r.left+r.width/2:innerWidth/2)-width/2)+'px',bottom:(visible?innerHeight-r.top+10:innerHeight/2-90)+'px'});
    slip.innerHTML='<div class="bs-receipt-paper"><span class="bs-receipt-brand">BURGER SHOT</span><strong>Venta registrada</strong><div><span>Cliente</span><b></b></div><div><span>Productos</span><b></b></div><div class="bs-receipt-total"><span>Total</span><b></b></div><i class="bs-receipt-stamp">PAGADO</i><small>Gracias por compartir la mesa.</small></div>';
    const [c,i,t]=slip.querySelectorAll('b');c.textContent=client||'Cliente general';i.textContent=String(Number(items)||0);t.textContent=money(total);
    document.body.append(slip);
    slip.addEventListener('animationend',ev=>{if(ev.target===slip)slip.remove()});setTimeout(()=>slip.remove(),3200);
    if(visible)replay(button,'is-success');
  });
  document.addEventListener('bs:sale-failed',()=>replay(document.querySelector('#checkoutModal .modal'),'is-shaking'));
  const loginError=$('loginError');
  if(loginError)new MutationObserver(()=>{if(loginError.textContent.trim())replay(document.querySelector('#loginForm'),'is-shaking')}).observe(loginError,{childList:true,characterData:true,subtree:true});

})();
