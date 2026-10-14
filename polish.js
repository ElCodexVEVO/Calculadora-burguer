/* Burger Shot V9 · Pulido de movimiento.
   Solo observa y decora: no toca el carrito, los importes ni los manejadores de app.js.
   - Luz de vela que sigue al cursor y parallax del banner (variables --px/--py).
   - Marca .m-enter al abrir una sección para que polish.css encienda su entrada una sola vez.
   - Transición de vista entre módulos, revelado de paneles bajo el pliegue y barra de progreso de lectura.
   Todo se desactiva con movimiento reducido, modo Rendimiento (body.motion-off), táctil o pestaña oculta. */
(()=>{
  'use strict';
  const root=document.documentElement,body=document.body;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const calm=()=>reduced.matches||body.classList.contains('motion-off');

  /* ── Luz de vela y parallax ── */
  let glow=null,frame=0,x=0,y=0;
  const ensureGlow=()=>{
    if(glow)return glow;
    glow=document.createElement('div');glow.className='m-candle';glow.setAttribute('aria-hidden','true');
    body.append(glow);return glow;
  };
  const paint=()=>{
    frame=0;
    if(calm()||document.hidden||!fine.matches)return;
    const g=ensureGlow();
    g.style.transform=`translate3d(${x}px,${y}px,0)`;
    g.classList.add('on');
    root.style.setProperty('--px',(x/innerWidth*2-1).toFixed(3));
    root.style.setProperty('--py',(y/innerHeight*2-1).toFixed(3));
  };
  addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||calm())return;
    x=e.clientX;y=e.clientY;
    if(!frame)frame=requestAnimationFrame(paint);
  },{passive:true});
  const hide=()=>{glow?.classList.remove('on');root.style.removeProperty('--px');root.style.removeProperty('--py')};
  document.documentElement.addEventListener('mouseleave',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide()});
  new MutationObserver(()=>{if(calm())hide()}).observe(body,{attributes:true,attributeFilter:['class']});

  /* ── Entrada de secciones ── */
  const timers=new WeakMap();
  const enter=page=>{
    if(!page||calm())return;
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
  // Al terminar el acceso, la app deja de estar oculta y la sección activa se enciende.
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

  /* ── Revelado al bajar ──
     Solo lo que está bajo el pliegue recibe .m-reveal; si el script falla, todo queda visible. */
  const REVEAL='.panel,#weeklyActivity,.product-card,.dashboard-grid>.panel,.metric';
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

  /* ── Barra de progreso de lectura (la anima el scroll desde CSS) ── */
  const bar=document.createElement('div');bar.className='m-progress';bar.setAttribute('aria-hidden','true');body.append(bar);

  /* ── Primer plano: vela, cempasúchil y calabaza por delante de los paneles ──
     Recortes con transparencia (assets/season/fg-ofrenda.webp) fijos en las esquinas del inicio, como en la referencia.
     No interceptan clics; al bajar por la página se retiran para no tapar contenido. */
  const host=document.getElementById('app')||body;
  const fg=document.createElement('div');fg.className='fg-decor';fg.setAttribute('aria-hidden','true');
  fg.innerHTML=['left','right'].map(side=>`<div class="fg-prop fg-${side}"><span class="fg-light"></span><img src="assets/season/fg-ofrenda.webp" alt="" width="640" height="544" decoding="async"><span class="fg-flame"></span></div>`).join('');
  host.append(fg);
  const away=()=>fg.classList.toggle('fg-away',window.scrollY>60);
  addEventListener('scroll',away,{passive:true});away();

  /* ── Luces de fondo: velas y destellos que parpadean detrás de los paneles del inicio ──
     Un contenedor por panel con resplandores grandes (velas) y orbes pequeños (luces lejanas) de duraciones distintas.
     Solo corre mientras el panel está a la vista y la pestaña visible. */
  const rand=(()=>{let t=7;return()=>{t=(t*16807)%2147483647;return(t-1)/2147483646}})();
  const lightsFor=(panel,opts)=>{
    if(!panel||panel.querySelector(':scope>.m-lights'))return;
    const box=document.createElement('div');box.className='m-lights'+(opts.soft?' is-soft':'');box.setAttribute('aria-hidden','true');
    let html='';
    for(let i=0;i<opts.glows;i++){
      const x=opts.glows===1?50:6+i*(88/(opts.glows-1));
      html+=`<i class="m-glow" style="--x:${x.toFixed(1)}%;--y:${(78+rand()*18).toFixed(0)}%;--s:${(46+rand()*26).toFixed(0)}%;--d:${(2.4+rand()*2.6).toFixed(2)}s;--o:-${(rand()*4).toFixed(2)}s"></i>`;
    }
    for(let i=0;i<opts.orbs;i++){
      const hue=rand()<.22?'255,198,92':rand()<.35?'255,92,50':'255,150,48';
      html+=`<i class="m-orb" style="--x:${(rand()*100).toFixed(1)}%;--y:${(8+rand()*88).toFixed(1)}%;--r:${(4+rand()*15).toFixed(1)}px;--c:${hue};--d:${(3+rand()*6).toFixed(2)}s;--o:-${(rand()*8).toFixed(2)}s;--rise:${(14+rand()*34).toFixed(0)}px"></i>`;
    }
    box.innerHTML=html;panel.prepend(box);
    if('IntersectionObserver' in window){
      new IntersectionObserver(es=>es.forEach(e=>box.classList.toggle('is-live',e.isIntersecting)),{threshold:.05}).observe(panel);
    }else box.classList.add('is-live');
  };
  const mountLights=()=>{
    lightsFor(document.getElementById('weeklyActivity'),{glows:3,orbs:18});
    lightsFor(document.getElementById('teamPerformance'),{glows:2,orbs:8,soft:true});
    lightsFor(document.querySelector('#page-dashboard .employee-week'),{glows:2,orbs:8,soft:true});
  };
  mountLights();
  document.getElementById('page-dashboard')&&new MutationObserver(mountLights).observe(document.getElementById('page-dashboard'),{childList:true,subtree:true});

  // Cambiar de categoría en Caja vuelve a abrir las tarjetas en cascada.
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.category-tab'))setTimeout(()=>enter(document.getElementById('page-pos')),0);
  });
})();
