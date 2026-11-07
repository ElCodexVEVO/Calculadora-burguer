/* Burger Shot · interfaz general, navegación y confirmaciones del pedido. */
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
    a.finished.then(()=>true,()=>false).then(completed=>{effects.delete(record);el.remove();done?.(completed)});
    return a;
  };
  // Con movimiento reducido o «Animaciones suaves» desactivado, todo efecto en curso se retira al instante.
  const stopEffects=(force=false)=>{
    if(force!==true&&!still()&&!document.hidden&&!app.classList.contains('hidden'))return;
    for(const {el,a} of effects){a.cancel();el.remove()}
    effects.clear();
    document.querySelectorAll('.bs-receipt,.bs-burst,.bs-fly').forEach(el=>el.remove());
  };
  reduced.addEventListener('change',stopEffects);
  new MutationObserver(stopEffects).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(stopEffects).observe(app,{attributes:true,attributeFilter:['class']});
  const syncVisibility=()=>{document.documentElement.toggleAttribute('data-page-hidden',document.hidden);stopEffects()};
  document.addEventListener('visibilitychange',syncVisibility);syncVisibility();

  // Fondo neutro y cabecera compacta, sin decoración de temporada.
  const backdrop=document.createElement('div');backdrop.className='brand-backdrop';backdrop.setAttribute('aria-hidden','true');
  for(const tone of ['red','amber','ribbon']){const light=document.createElement('span');light.className='room-light room-light-'+tone;backdrop.append(light)}
  app.prepend(backdrop);
  const onScroll=()=>topbar.classList.toggle('is-scrolled',window.scrollY>12);
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* ── Menú lateral en móvil ── */
  const menuBtn=$('mobileMenu'),scrim=document.querySelector('.sidebar-scrim');
  const syncMenu=()=>{const open=sidebar.classList.contains('open');menuBtn?.setAttribute('aria-expanded',String(open));menuBtn?.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');document.body.classList.toggle('menu-open',open&&!wide.matches)};
  new MutationObserver(syncMenu).observe(sidebar,{attributes:true,attributeFilter:['class']});
  scrim?.addEventListener('click',()=>{sidebar.classList.remove('open');menuBtn?.focus()});
  menuBtn?.addEventListener('click',()=>{if(sidebar.classList.contains('open'))requestAnimationFrame(()=>sidebar.querySelector('.nav-item.active,.nav-item')?.focus({preventScroll:true}))});
  syncMenu();
  // Si la sección activa vive en «Más herramientas», el grupo se abre para que se vea dónde estás.
  const tools=document.querySelector('.nav-tools');
  if(tools)new MutationObserver(()=>{if(tools.querySelector('.nav-item.active')&&!document.body.classList.contains('sidebar-collapsed'))tools.open=true}).observe(sidebar.querySelector('nav'),{attributes:true,subtree:true,attributeFilter:['class']});

  // Las guías siguen la selección real, incluso si el menú se desplaza o sus filas cambian de tamaño.
  const followSelection=(container,selector,vertical=false)=>{
    if(!container)return;
    let frame=0,ready=false;
    const update=()=>{
      frame=0;
      const selected=container.querySelector(selector),r=selected?.getBoundingClientRect(),box=container.getBoundingClientRect();
      const visible=Boolean(r?.width&&r?.height&&box.width&&box.height);
      container.toggleAttribute('data-guide',visible);
      if(!visible){ready=false;container.removeAttribute('data-guide-ready');return}
      const inset=vertical?8:14;
      const position=(vertical?r.top-box.top+container.scrollTop:r.left-box.left+container.scrollLeft)+inset;
      container.style.setProperty('--guide-position',position+'px');
      container.style.setProperty('--guide-size',Math.max(0,(vertical?r.height:r.width)-inset*2)+'px');
      if(!vertical)container.style.setProperty('--guide-row',(r.bottom-box.top+container.scrollTop+3)+'px');
      if(!ready){ready=true;requestAnimationFrame(()=>{if(container.hasAttribute('data-guide'))container.setAttribute('data-guide-ready','')})}
    };
    const queue=()=>{if(!frame)frame=requestAnimationFrame(update)};
    new MutationObserver(queue).observe(container,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','open','aria-pressed']});
    new ResizeObserver(queue).observe(container);
    container.addEventListener('toggle',queue,true);
    window.addEventListener('resize',queue,{passive:true});
    document.fonts?.ready.then(queue);queue();
  };
  followSelection(sidebar.querySelector('nav'),'.nav-item.active',true);

  /* ── Escape cierra la ventana superior y el foco vuelve a quien la abrió ── */
  const handled=new Set(['v6Modal','payoutDetailModal','auditDetailModal']);
  const visibleModals=()=>[...document.querySelectorAll('.modal-backdrop:not(.hidden)')];
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||e.defaultPrevented)return;
    const top=visibleModals().at(-1);
    if(top){
      if(handled.has(top.id))return;
      const close=top.querySelector('[data-close]');
      if(close){e.preventDefault();e.stopPropagation();close.click()}
      return;
    }
    if(sidebar.classList.contains('open')&&!wide.matches){e.preventDefault();e.stopPropagation();sidebar.classList.remove('open');menuBtn?.focus()}
  },true);
  // La app enfoca un campo de la ventana al abrirla, así que se recuerda el último foco fuera de las ventanas.
  const openers=new WeakMap();let lastOutside=null;
  document.addEventListener('focusin',e=>{if(!e.target.closest('.modal-backdrop'))lastOutside=e.target});
  document.querySelectorAll('.modal-backdrop').forEach(modal=>{
    new MutationObserver(()=>{
      const open=!modal.classList.contains('hidden');
      if(modal.id==='accountModal')$('accountBtn')?.setAttribute('aria-expanded',String(open));
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
  followSelection(tabs,'.category-tab.active');

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
  if(page)new MutationObserver(()=>{if(!page.classList.contains('active'))stopEffects(true)}).observe(page,{attributes:true,attributeFilter:['class']});
  const fly=(img,quantity)=>{
    const to=target();if(still()||document.hidden||!img||!to||flying>=3)return false;
    const from=img.getBoundingClientRect(),end=to.getBoundingClientRect();
    // La barra móvil acaba de aparecer al añadir la primera unidad: apuntar a su posición final.
    const dockShift=to===dockCount?Math.max(0,dock.getBoundingClientRect().bottom-(innerHeight-parseFloat(getComputedStyle(dock).bottom))):0;
    const endY=end.top-dockShift;
    if(!from.width||from.bottom<0||from.top>innerHeight||!end.width||endY+end.height<0||endY>innerHeight)return false;
    const ghost=document.createElement('div'),photo=img.cloneNode(false);
    ghost.className='bs-fly';ghost.setAttribute('aria-hidden','true');photo.removeAttribute('loading');photo.alt='';ghost.append(photo);
    if(quantity>1){const badge=document.createElement('span');badge.className='bs-fly-quantity';badge.textContent=`×${quantity.toLocaleString('es-MX')}`;ghost.append(badge)}
    const size=48,startX=from.left+from.width/2-size/2,startY=from.top+from.height/2-size/2;
    Object.assign(ghost.style,{left:startX+'px',top:startY+'px',width:size+'px',height:size+'px'});
    document.body.append(ghost);
    const dx=end.left+end.width/2-(startX+size/2),dy=endY+end.height/2-(startY+size/2);
    const arc=Math.min(64,Math.max(24,Math.abs(dx)*.12)),turn=dx<0?-6:6;
    const frames=Array.from({length:9},(_,i)=>{
      const t=i/8,lift=Math.sin(Math.PI*t);
      return {offset:t,transform:`translate(${dx*t}px,${dy*t-arc*lift}px) rotate(${turn*lift}deg) scale(${1-.7*t})`,opacity:t<.65?.92:Math.max(0,.92*(1-t)/.35)};
    });
    flying++;
    animate(ghost,frames,{duration:Math.min(480,Math.max(380,300+Math.hypot(dx,dy)*.3)),easing:'cubic-bezier(.3,.65,.35,1)'},completed=>{
      flying--;if(completed&&page?.classList.contains('active'))replay(to,'bs-count-arrive');
    });
    return true;
  };
  // Vista previa del importe visible mientras la cantidad no es 1; confirmación breve sobre la foto.
  grid?.addEventListener('input',e=>{const input=e.target.closest('[data-bulk-qty]');if(input)input.closest('.product-card')?.classList.toggle('has-qty',input.value.trim()!==''&&input.value.trim()!=='1')});
  const feedbackTimers=new WeakMap();
  document.addEventListener('bs:cart-added',e=>{
    const {id,quantity=1}=e.detail||{};
    syncDock();
    const card=id&&[...(grid?.querySelectorAll('.product-card')||[])].find(el=>el.dataset.product===id);
    if(card){card.classList.remove('has-qty');card.classList.add('feedback-on');clearTimeout(feedbackTimers.get(card));feedbackTimers.set(card,setTimeout(()=>card.classList.remove('feedback-on'),1400))}
    if(card&&card.getBoundingClientRect().width){
      replay(card,'is-added');replay(card.querySelector('[data-add]'),'bs-add-confirm');replay(card.querySelector('.in-cart-count'),'bs-count-arrive');
      if(fly(card.querySelector('.food-photo'),Number(quantity)||1))return;
    }
    replay(target(),'bs-count-arrive');
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
