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

  /* ── Barra de progreso de lectura (la anima el scroll desde CSS) ── */
  const bar=document.createElement('div');bar.className='m-progress';bar.setAttribute('aria-hidden','true');body.append(bar);

  // Cambiar de categoría en Caja vuelve a abrir las tarjetas en cascada.
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.category-tab'))setTimeout(()=>enter(document.getElementById('page-pos')),0);
  });
})();
