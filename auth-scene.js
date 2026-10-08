/* V6.7 · Decoración y transición; la autenticación se gestiona en app.js. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id),loader=$('authLoading');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const still=()=>reduced?.matches||document.body.classList.contains('motion-off');
  let exitTimer=0,slowTimer=0,arrivalTimer=0,lastFocus=null;
  const locked=new Map();
  const outline='M5 2H115V77L105 84 95 82 85 90 75 87 60 95 45 87 35 90 25 82 15 84 5 77Z';
  document.querySelectorAll('.auth-bunting').forEach((el,row)=>{
    el.innerHTML=Array.from({length:12},(_,i)=>{
      const id=`authPaper-${row}-${i}`,color=i%2?'#ae5424':'#754080';
      const motif=i%3===0?'<path d="M60 24c-14 0-22 9-22 23 0 8 4 14 9 17v10h26V64c5-3 9-9 9-17 0-14-8-23-22-23Z"/><circle cx="51" cy="46" r="6" fill="white"/><circle cx="69" cy="46" r="6" fill="white"/><path d="m60 53-4 7h8Z" fill="white"/><path d="M53 65v7m7-7v7m7-7v7" stroke="white" stroke-width="2"/>':Array.from({length:8},(_,k)=>`<ellipse cx="60" cy="33" rx="5" ry="14" transform="rotate(${k*45} 60 49)"/>`).join('')+'<circle cx="60" cy="49" r="6" fill="white"/>';
      const holes=Array.from({length:8},(_,k)=>`<circle cx="15" cy="${13+k*8}" r="2"/><circle cx="105" cy="${13+k*8}" r="2"/>`).join('');
      return `<span class="auth-flag" style="--flag-drop:${i%3*5}px;--flag-rotation:${i%2?2:-2}deg;--flag-duration:${3.7+i%4*.6}s;--flag-delay:-${i*.43}s"><svg viewBox="0 0 120 96" focusable="false"><defs><mask id="${id}"><path d="${outline}" fill="white"/><g fill="black">${holes}${motif}</g></mask></defs><path d="${outline}" fill="${color}" mask="url(#${id})"/></svg></span>`;
    }).join('');
  });
  const scenes=[...document.querySelectorAll('.auth-scene')];
  for(const scene of scenes){
    scene.innerHTML=Array.from({length:8},(_,i)=>`<i class="auth-petal" style="--petal-x:${7+i*12}%;--petal-drift:${i%2?35:-45}px;--petal-duration:${12+i%3*3}s;--petal-delay:-${i*2.6}s"></i>`).join('')+Array.from({length:3},(_,i)=>`<i class="auth-flame" style="--flame-delay:-${i*.7}s"></i>`).join('');
  }
  // Match flame positions to the candle wicks as the cover image scales/crops.
  const art=new Image();art.src='assets/auth-altar.png';
  function placeFlames(){
    if(!art.naturalWidth)return;
    const points=[[.108,.527],[.160,.597],[.114,.738]];
    for(const scene of scenes){
      const {width:w,height:h}=scene.getBoundingClientRect();if(!w||!h)continue;
      const scale=Math.max(w/art.naturalWidth,h/art.naturalHeight),iw=art.naturalWidth*scale,ih=art.naturalHeight*scale;
      scene.querySelectorAll('.auth-flame').forEach((flame,i)=>{
        const [x,y]=points[i];flame.style.left=(x*iw+(w-iw)/2)+'px';flame.style.top=(y*ih+(h-ih)/2)+'px';
      });
    }
  }
  art.addEventListener('load',placeFlames);
  if(window.ResizeObserver){const resize=new ResizeObserver(placeFlames);scenes.forEach(el=>resize.observe(el))}
  window.addEventListener('resize',placeFlames,{passive:true});
  $('authLoading')?.querySelector('.auth-flower-orbit')?.insertAdjacentHTML('beforeend',Array.from({length:16},(_,i)=>`<i class="auth-orbit-flower" style="--flower-angle:${i*22.5}deg"></i>`).join(''));
  const toggle=$('toggleLoginPassword'),password=$('loginPassword');
  toggle?.addEventListener('click',()=>{
    const visible=password.type==='password';password.type=visible?'text':'password';
    toggle.setAttribute('aria-pressed',String(visible));toggle.setAttribute('aria-label',visible?'Ocultar contraseña':'Mostrar contraseña');
  });
  function release(){for(const [el,previous] of locked)el.inert=previous;locked.clear()}
  function hide(){
    clearTimeout(exitTimer);clearTimeout(slowTimer);exitTimer=slowTimer=0;
    loader?.classList.add('hidden');loader?.classList.remove('is-leaving');
    document.body.classList.remove('auth-is-loading');release();
  }
  window.BurgerAuthUI={
    loading(message){
      if(!loader)return;
      clearTimeout(exitTimer);exitTimer=0;
      if(loader.classList.contains('hidden')){
        lastFocus=document.activeElement;
        for(const id of ['authScreen','cloudSetup','app']){const el=$(id);if(el){locked.set(el,el.inert);el.inert=true}}
        clearTimeout(slowTimer);$('authSlowNotice').classList.add('hidden');
        slowTimer=setTimeout(()=>{if(!loader.classList.contains('hidden'))$('authSlowNotice').classList.remove('hidden')},8000);
      }
      $('authLoadingTitle').textContent='Preparando tu turno…';$('authLoadingMessage').textContent=message;
      loader.classList.remove('hidden','is-leaving');loader.setAttribute('aria-busy','true');document.body.classList.add('auth-is-loading');loader.focus({preventScroll:true});placeFlames();
    },
    complete(name){
      if(!loader)return;
      clearTimeout(slowTimer);slowTimer=0;$('authSlowNotice').classList.add('hidden');
      $('authLoadingTitle').textContent=`Bienvenido, ${String(name||'').trim().split(/\s+/)[0]||'al turno'}`;
      $('authLoadingMessage').textContent='Tu negocio está listo.';loader.setAttribute('aria-busy','false');
      const app=$('app');app?.classList.add('auth-arrived');
      app?.querySelectorAll('#dashboardMetrics .metric').forEach((el,i)=>el.style.setProperty('--auth-metric',String(i)));
      clearTimeout(arrivalTimer);arrivalTimer=setTimeout(()=>app?.classList.remove('auth-arrived'),900);
      const finish=()=>{hide();$('welcomeTitle')?.setAttribute('tabindex','-1');$('welcomeTitle')?.focus({preventScroll:true})};
      if(still())finish();else{loader.classList.add('is-leaving');exitTimer=setTimeout(finish,330)}
      password.type='password';password.value='';toggle?.setAttribute('aria-pressed','false');toggle?.setAttribute('aria-label','Mostrar contraseña');
    },
    reset(){hide();if(lastFocus?.isConnected&&!lastFocus.closest('.hidden'))lastFocus.focus({preventScroll:true});lastFocus=null;placeFlames()}
  };
  function stopTransition(){if(still()&&loader?.classList.contains('is-leaving')){hide();$('welcomeTitle')?.focus({preventScroll:true})}}
  reduced?.addEventListener('change',stopTransition);
  new MutationObserver(stopTransition).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
