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

  /* ── Barra de progreso de lectura (la anima el scroll desde CSS) ── */
  const bar=document.createElement('div');bar.className='m-progress';bar.setAttribute('aria-hidden','true');body.append(bar);

  // Cambiar de categoría en Caja vuelve a abrir las tarjetas en cascada.
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.category-tab'))setTimeout(()=>enter(document.getElementById('page-pos')),0);
  });
})();
