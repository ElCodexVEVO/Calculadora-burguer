/* Burger Shot V9 · Pulido de movimiento.
   Solo observa y decora: no toca el carrito, los importes ni los manejadores de app.js.
   - Entrada de secciones (.m-enter), revelado al bajar, transición de vista entre módulos y progreso de lectura.
   - Modelos 3D de primer plano (assets/season/props), con la luz de cada llama en su sitio.
   - Luces tenues en la gráfica semanal.
   Rendimiento: todo lo que se repite anima solo opacidad o transformación (compositor, sin recalcular estilos), nada sigue
   al cursor y no hay partículas. Se desactiva con movimiento reducido, modo Rendimiento (body.motion-off) o pestaña oculta. */
(()=>{
  'use strict';
  const root=document.documentElement,body=document.body;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const calm=()=>reduced.matches||body.classList.contains('motion-off');
  const activePageId=()=>document.querySelector('.page.active')?.id.replace(/^page-/,'')||'';

  /* ── Modelos de primer plano ──
     flames = [x, y, diámetro] normalizados al ancho/alto del recorte; salen de design/props-source/build_props.py. */
  const PROPS={
    velas:{ar:1236/1194,w:[520,860],flames:[[.5555,.1172,.2],[.3337,.3964,.13]]},
    esquina:{ar:1228/1216,w:[420,760],flames:[[.1536,.1353,.17],[.2474,.0546,.08],[.2206,.4354,.08],[.2187,.6913,.11]]},
    guirnalda:{ar:1661/526,w:[760,1400],flames:[[.1714,.1656,.06],[.262,.2624,.06],[.7394,.2515,.06],[.8279,.1618,.06]]}
  };
  const prop=(name,sizes)=>{
    const p=PROPS[name],[a,b]=p.w,src=n=>`assets/season/props/${name}-${n}.webp`;
    const flames=p.flames.map((f,i)=>`<i class="pf" style="--x:${(f[0]*100).toFixed(2)}%;--y:${(f[1]*100).toFixed(2)}%;--d:${(f[2]*100).toFixed(1)}%;--t:${(1.8+i*.43).toFixed(2)}s;--o:-${(i*.67).toFixed(2)}s"></i>`).join('');
    return `<div class="prop prop-${name}" style="--ar:${p.ar.toFixed(4)}"><img src="${src(a)}" srcset="${src(a)} ${a}w, ${src(b)} ${b}w" sizes="${sizes}" width="${b}" height="${Math.round(b/p.ar)}" alt="" decoding="async" draggable="false">${flames}</div>`;
  };

  /* Primer plano fijo en las esquinas inferiores: un modelo distinto en cada sitio (velas con calavera aquí; guirnalda y esquinas en otros lugares). */
  const host=document.getElementById('app')||body;
  const fg=document.createElement('div');fg.className='fg-decor';fg.setAttribute('aria-hidden','true');host.append(fg);
  const LEFT={};
  let fgPage='';
  const setProps=page=>{
    if(page===fgPage)return;fgPage=page;
    const left=LEFT[page]||'velas';
    fg.dataset.page=page;
    fg.innerHTML=`<div class="fg-prop fg-left">${prop(left,'(min-width:1600px) 210px, 160px')}</div>`;
  };
  const away=()=>fg.classList.toggle('fg-away',window.scrollY>60);
  addEventListener('scroll',away,{passive:true});away();

  /* Guirnalda al final de Inicio y esquinas de flores en la tarjeta del acceso. */
  const home=document.getElementById('page-dashboard');
  if(home&&!home.querySelector('.page-garland'))home.insertAdjacentHTML('beforeend',`<div class="page-garland" aria-hidden="true">${prop('guirnalda','(min-width:900px) 880px, 92vw')}</div>`);
  const card=document.querySelector('#authScreen .auth-composition');
  if(card&&!card.querySelector('.auth-corner'))card.insertAdjacentHTML('beforeend',`<div class="auth-corner auth-corner-l" aria-hidden="true">${prop('esquina','150px')}</div><div class="auth-corner auth-corner-r" aria-hidden="true">${prop('esquina','150px')}</div>`);

  /* ── Luces tenues en la gráfica semanal: tres haces de vela y unas chispas. Solo opacidad. ── */
  const chartPanel=document.getElementById('weeklyActivity');
  if(chartPanel&&!chartPanel.querySelector(':scope>.m-lights')){
    const beams=[[16,13,3.1,-.4],[49,11,4.4,-1.9],[82,13,3.6,-2.6]].map(([x,w,t,o])=>`<i class="m-beam" style="--x:${x}%;--w:${w}%;--t:${t}s;--o:${o}s"></i>`).join('');
    const sparks=[[8,22,5,3.4,-.6],[27,12,4,4.8,-2.1],[39,30,3,3.9,-1.4],[58,18,5,5.2,-3.3],[71,36,3,4.1,-.9],[90,16,4,4.6,-2.7]].map(([x,y,s,t,o])=>`<i class="m-spark" style="--x:${x}%;--y:${y}%;--s:${s}px;--t:${t}s;--o:${o}s"></i>`).join('');
    chartPanel.insertAdjacentHTML('afterbegin',`<div class="m-lights" aria-hidden="true">${beams}${sparks}</div>`);
    const box=chartPanel.querySelector('.m-lights');
    if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>box.classList.toggle('is-live',e.isIntersecting)),{threshold:.05}).observe(chartPanel);
    else box.classList.add('is-live');
  }

  /* ── Entrada de secciones ── */
  const timers=new WeakMap();
  const enter=page=>{
    if(!page)return;
    setProps(page.id.replace(/^page-/,''));
    if(calm())return;
    clearTimeout(timers.get(page));
    page.classList.remove('m-enter');void page.offsetWidth;page.classList.add('m-enter');
    timers.set(page,setTimeout(()=>page.classList.remove('m-enter'),1900));
    requestAnimationFrame(()=>arm(page));
  };
  const watch=new MutationObserver(list=>{
    for(const m of list){
      const el=m.target;
      if(el.classList.contains('active')&&!(m.oldValue||'').split(/\s+/).includes('active'))enter(el);
    }
  });
  document.querySelectorAll('.page').forEach(p=>watch.observe(p,{attributes:true,attributeFilter:['class'],attributeOldValue:true}));
  const app=document.getElementById('app');
  if(app){
    new MutationObserver(list=>{
      for(const m of list){
        if(!(m.oldValue||'').split(/\s+/).includes('hidden'))continue;
        if(!app.classList.contains('hidden'))enter(document.querySelector('.page.active'));
      }
    }).observe(app,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
    if(!app.classList.contains('hidden'))enter(document.querySelector('.page.active'));
  }
  setProps(activePageId()||'dashboard');

  /* ── Revelado al bajar ──
     Solo lo que está bajo el pliegue recibe .m-reveal; si el script falla, todo queda visible. */
  const REVEAL='.panel,#weeklyActivity,.product-card,.dashboard-grid>.panel,.metric,.page-garland';
  const io='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    const shown=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left);
    shown.forEach((e,i)=>{
      e.target.style.setProperty('--d',Math.min(i,6)*55+'ms');
      e.target.classList.add('m-in');io.unobserve(e.target);
    });
  },{rootMargin:'0px 0px -6% 0px',threshold:.06}):null;
  function arm(page){
    if(!io||calm()||!page.isConnected)return;
    const fold=innerHeight*.92;
    page.querySelectorAll(REVEAL).forEach(el=>{
      if(el.dataset.mr||el.closest('.modal,.m-reveal'))return;
      if(el.getBoundingClientRect().top<fold)return;
      el.dataset.mr='1';el.classList.add('m-reveal');io.observe(el);
    });
  }

  /* ── Cambio de módulo con View Transitions ──
     app.js no expone switchPage, así que se intercepta el clic de navegación, se ejecuta dentro de la transición
     y se cancela si la sección no cambió (por ejemplo, sin permiso). La dirección sigue el orden del menú. */
  let replaying=false;
  if(typeof document.startViewTransition==='function'){
    const items=()=>[...document.querySelectorAll('.nav-item[data-page]')].map(i=>i.dataset.page);
    document.addEventListener('click',e=>{
      if(replaying||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||calm()||document.hidden)return;
      // Con la página desplazada, la captura de la sección saliente queda desfasada: entra la animación propia de la sección.
      if(window.scrollY>24)return;
      const trigger=e.target.closest?.('.nav-item[data-page],[data-go]');
      if(!trigger||trigger.disabled)return;
      const target=trigger.dataset.page||trigger.dataset.go;
      const prev=document.querySelector('.page.active'),next=document.getElementById('page-'+target);
      if(!prev||!next||prev===next)return;
      e.stopImmediatePropagation();
      const order=items(),from=order.indexOf(prev.id.slice(5)),to=order.indexOf(target);
      root.style.setProperty('--vt-y',((from>-1&&to>-1&&to<from)?-14:14)+'px');
      root.classList.add('vt-on');
      prev.style.viewTransitionName='page';
      const transition=document.startViewTransition(()=>{
        replaying=true;
        try{trigger.click()}finally{replaying=false}
        prev.style.viewTransitionName='';
        const now=document.querySelector('.page.active');
        if(now===prev){transition.skipTransition();return}
        now.style.viewTransitionName='page';
      });
      const clean=()=>{root.classList.remove('vt-on');document.querySelectorAll('.page').forEach(p=>p.style.viewTransitionName='')};
      transition.finished.then(clean,clean);
    },true);
  }

  /* ── Saludo según la hora ──
     app.js escribe «¡Buenas, Nombre!» en cada render; aquí se cambia por el saludo del momento. El patrón deja de coincidir
     al reemplazarlo, así que no hay bucle. */
  const title=document.getElementById('welcomeTitle');
  if(title){
    const greeting=()=>{const h=new Date().getHours();return h>=5&&h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches'};
    const fix=()=>{const m=/^¡Buenas, (.+)!$/.exec(title.textContent.trim());if(m)title.textContent=`¡${greeting()}, ${m[1]}!`};
    new MutationObserver(fix).observe(title,{childList:true,characterData:true,subtree:true});fix();
  }

  /* ── Tablas: importes y cantidades alineados a la derecha ──
     Una columna es numérica si todas sus celdas son importes, enteros o porcentajes (o «—»). Las cifras ya son tabulares, así
     que alineadas a la derecha los dígitos quedan en columna. */
  const NUM=/^[-−]?\$?\s?\d[\d,]*(?:\.\d+)?%?$/;
  const alignTables=()=>{
    document.querySelectorAll('.page.active table').forEach(table=>{
      const body=table.tBodies[0];if(!body||!body.rows.length)return;
      const cols=[];
      for(const row of body.rows){
        if(row.cells.length===1&&row.cells[0].colSpan>1)continue;
        [...row.cells].forEach((cell,i)=>{
          const t=cell.textContent.trim();
          if(!t||t==='—'){cols[i]=cols[i]??null;return}
          cols[i]=(cols[i]!==false)&&NUM.test(t);
        });
      }
      const heads=table.tHead?.rows[0]?.cells||[];
      cols.forEach((numeric,i)=>{
        const on=numeric===true;
        for(const row of body.rows){const c=row.cells[i];if(c&&row.cells.length>1)c.classList.toggle('num',on)}
        heads[i]?.classList.toggle('num',on);
      });
    });
  };
  let alignFrame=0;
  const queueAlign=()=>{if(!alignFrame)alignFrame=requestAnimationFrame(()=>{alignFrame=0;alignTables();enhanceEmpty()})};
  const main=document.getElementById('main');

  /* ── Estados vacíos: más aire y, si hay filtros aplicados, una salida directa ── */
  const filtersActive=page=>[...page.querySelectorAll('.filter-fields select')].some(s=>s.selectedIndex>0)||[...page.querySelectorAll('.filter-fields input')].some(i=>i.value&&!i.closest('.hidden'));
  function enhanceEmpty(){
    const page=document.querySelector('.page.active');if(!page)return;
    page.querySelectorAll('.report-empty, td[colspan]').forEach(el=>{
      const text=el.textContent.trim();
      if(!/^(No hay|Sin |Aún no)/.test(text)||el.children.length>1)return;
      el.classList.add('m-empty');
      const reset=page.querySelector('.filter-reset');
      const has=el.querySelector('.m-empty-action');
      if(reset&&filtersActive(page)){
        if(!has){const b=document.createElement('button');b.type='button';b.className='m-empty-action';b.textContent='Limpiar filtros';b.addEventListener('click',()=>reset.click());el.append(b)}
      }else has?.remove();
    });
  }
  if(main){new MutationObserver(queueAlign).observe(main,{childList:true,subtree:true,characterData:true});queueAlign()}

  /* ── Copiar el total para el chat del juego ──
     Lee el total que ya muestra la caja (no recalcula nada) y copia el mismo mensaje que la caja auxiliar. */
  const grand=document.getElementById('grandTotal');
  if(grand&&!document.getElementById('copyTotalBtn')){
    const btn=document.createElement('button');
    btn.id='copyTotalBtn';btn.type='button';btn.className='copy-total';btn.setAttribute('aria-label','Copiar el total para pegarlo en el chat del juego');btn.title='Copiar el total para el chat';
    btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg><span>Copiar</span>';
    grand.parentElement.querySelector('span')?.after(btn);
    const sync=()=>{const empty=/^\$0(\.0+)?$/.test(grand.textContent.trim());btn.disabled=empty};
    new MutationObserver(sync).observe(grand,{childList:true,characterData:true,subtree:true});sync();
    const say=(msg)=>{const host=document.getElementById('toastHost');if(!host)return;const d=document.createElement('div');d.className='toast toast-success';d.textContent=msg;host.appendChild(d);setTimeout(()=>d.classList.add('is-leaving'),3000);setTimeout(()=>d.remove(),3200)};
    let timer=0;
    btn.addEventListener('click',async()=>{
      const text=`Tu pedido son ${grand.textContent.trim()}.`;
      try{if(window.burgerDesktop)await window.burgerDesktop.copyText(text);else await navigator.clipboard.writeText(text);
        btn.classList.add('is-done');btn.querySelector('span').textContent='Copiado';clearTimeout(timer);timer=setTimeout(()=>{btn.classList.remove('is-done');btn.querySelector('span').textContent='Copiar'},1600);
        say('Total copiado. Pégalo en el chat del juego.');
      }catch{prompt('Copia este mensaje:',text)}
    });
  }

  /* ── Paneles de Inicio de una misma familia ──
     «Acceso rápido» y «Últimas ventas» no tenían ni marco de filigrana ni la ficha de icono de las cabeceras de arriba. */
  const ICONS={
    quick:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 5 14h6l-1 7 8-11h-6Z"/></svg>',
    sales:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Zm3 5h6m-6 4h6"/></svg>'
  };
  document.querySelectorAll('#page-dashboard .dashboard-grid>.panel').forEach((panel,i)=>{
    panel.classList.add('ornate-frame');
    const head=panel.querySelector(':scope>.panel-head');
    if(head&&!head.classList.contains('dashboard-panel-head')){
      head.classList.add('dashboard-panel-head');
      head.insertAdjacentHTML('afterbegin',i===0?ICONS.quick:ICONS.sales);
    }
  });

  /* ── Últimas ventas: ficha con las iniciales de quien vendió (decorativa; el nombre sigue en el texto) ── */
  const initials=name=>name.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'BS';
  const decorateSales=()=>{
    document.querySelectorAll('#miniSales .mini-sale:not([data-av])').forEach(row=>{
      const name=row.querySelector('strong')?.textContent||'';
      let hue=0;for(const ch of name)hue=(hue*31+ch.charCodeAt(0))%360;
      row.dataset.av='1';row.style.setProperty('--av',String(hue));
      row.insertAdjacentHTML('afterbegin',`<i class="mini-avatar" aria-hidden="true">${initials(name)}</i>`);
    });
  };
  const sales=document.getElementById('miniSales');
  if(sales){new MutationObserver(decorateSales).observe(sales,{childList:true});decorateSales()}

  /* ── Menú lateral: el borde inferior se difumina cuando hay más opciones por ver ── */
  const nav=document.getElementById('primaryNav');
  if(nav){
    const check=()=>nav.toggleAttribute('data-more',nav.scrollHeight-nav.clientHeight-nav.scrollTop>6);
    nav.addEventListener('scroll',check,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(check).observe(nav);
    new MutationObserver(check).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden']});
    check();
  }

  /* ── Indicador deslizante en selectores y pestañas ──
     El relleno de la opción activa se desliza a la nueva en vez de saltar. Solo para controles que se usan de vez en cuando
     (periodo del perfil, periodo de la gráfica, pestañas de Administración); las categorías de Caja se quedan como están. */
  const SLIDERS=[
    ['.profile-period-picker',b=>b.getAttribute('aria-pressed')==='true'],
    ['.chart-mode',b=>b.getAttribute('aria-pressed')==='true'],
    ['.v6-tabs',b=>b.classList.contains('active')]
  ];
  const mountSlider=(root,isOn)=>{
    if(!root||root.dataset.slider)return;root.dataset.slider='1';root.classList.add('has-slider');
    const pill=document.createElement('span');pill.className='m-slider no-anim';pill.setAttribute('aria-hidden','true');root.prepend(pill);
    const place=()=>{
      const on=[...root.querySelectorAll('button')].find(isOn);
      if(!on||!on.offsetWidth){pill.style.opacity='0';return}
      pill.style.opacity='1';
      pill.style.width=on.offsetWidth+'px';pill.style.height=on.offsetHeight+'px';
      pill.style.transform=`translate(${on.offsetLeft}px,${on.offsetTop}px)`;
      if(pill.classList.contains('no-anim'))requestAnimationFrame(()=>requestAnimationFrame(()=>pill.classList.remove('no-anim')));
    };
    new MutationObserver(place).observe(root,{subtree:true,attributes:true,attributeFilter:['class','aria-pressed','aria-selected']});
    if('ResizeObserver' in window)new ResizeObserver(()=>{pill.classList.add('no-anim');place()}).observe(root);
    document.fonts?.ready.then(()=>{pill.classList.add('no-anim');place()});
    place();
  };
  SLIDERS.forEach(([sel,isOn])=>document.querySelectorAll(sel).forEach(el=>mountSlider(el,isOn)));

  /* ── Del acceso a la app: el logo viaja al emblema del menú ──
     Una vez por sesión. Cuando el cargador empieza a desvanecerse (la app ya está debajo), una copia del logo del cargador se
     desplaza y encoge hasta el emblema del menú, que aparece al llegar. En móvil el menú está cerrado y no se hace. */
  const loader=document.getElementById('authLoading');
  const flight=()=>{
    if(calm()||document.hidden)return;
    try{if(sessionStorage.getItem('bs_logo_flight')==='1')return}catch{}
    const src=loader.querySelector('.auth-loading-emblem img'),from=src?.getBoundingClientRect();
    const stage=document.querySelector('.emblem-stage'),to=stage?.getBoundingClientRect();
    if(!src||!from?.width||!to?.width||to.height<20)return;
    try{sessionStorage.setItem('bs_logo_flight','1')}catch{}
    const emblem=stage.closest('.emblem');emblem.classList.add('emblem-arriving');
    const ghost=src.cloneNode();ghost.className='m-flight';ghost.alt='';ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');
    Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
    document.body.append(ghost);
    const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2),k=to.width/from.width;
    const anim=ghost.animate([
      {transform:'translate(0,0) scale(1)',opacity:1},
      {transform:`translate(${dx}px,${dy}px) scale(${k})`,opacity:1,offset:.78},
      {transform:`translate(${dx}px,${dy}px) scale(${k})`,opacity:0}
    ],{duration:1000,easing:'cubic-bezier(.77,0,.175,1)',fill:'forwards'});
    const arrive=setTimeout(()=>emblem.classList.remove('emblem-arriving'),620);
    const done=()=>{clearTimeout(arrive);ghost.remove();emblem.classList.remove('emblem-arriving')};
    anim.finished.then(done,done);
  };
  if(loader)new MutationObserver(list=>{
    for(const m of list)if(loader.classList.contains('is-leaving')&&!(m.oldValue||'').includes('is-leaving'))flight();
  }).observe(loader,{attributes:true,attributeFilter:['class'],attributeOldValue:true});

  /* ── Barra de progreso de lectura (la anima el scroll desde CSS) ── */
  const bar=document.createElement('div');bar.className='m-progress';bar.setAttribute('aria-hidden','true');body.append(bar);

  // Cambiar de categoría en Caja vuelve a abrir las tarjetas en cascada.
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.category-tab'))setTimeout(()=>enter(document.getElementById('page-pos')),0);
  });
})();
