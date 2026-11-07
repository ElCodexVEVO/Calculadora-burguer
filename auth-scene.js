/* V6.7 · Decoración y transición; la autenticación se gestiona en app.js. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id),loader=$('authLoading');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const still=()=>reduced?.matches||document.body.classList.contains('motion-off');
  let exitTimer=0,slowTimer=0,arrivalTimer=0,lastFocus=null;
  const locked=new Map();
  // La frase mantiene su nombre accesible completo; solo se animan sus letras visuales.
  let letterIndex=0;
  document.querySelectorAll('.auth-welcome-word').forEach(word=>{
    const letters=[...word.textContent].map(character=>{
      const letter=document.createElement('span');letter.className='auth-letter';
      letter.textContent=character;letter.style.setProperty('--letter-index',letterIndex++);
      return letter;
    });
    word.replaceChildren(...letters);
  });
  const copy=document.querySelector('#authScreen .gate-copy');
  if(copy&&window.IntersectionObserver){
    const observer=new IntersectionObserver(entries=>copy.classList.toggle('auth-copy-visible',entries.some(entry=>entry.isIntersecting)));
    observer.observe(copy);
  }else copy?.classList.add('auth-copy-visible');
  const pauseMotion=()=>document.documentElement.classList.toggle('auth-motion-paused',document.hidden);
  document.addEventListener('visibilitychange',pauseMotion);pauseMotion();
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
      loader.classList.remove('hidden','is-leaving');loader.setAttribute('aria-busy','true');document.body.classList.add('auth-is-loading');loader.focus({preventScroll:true});
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
    reset(){hide();if(lastFocus?.isConnected&&!lastFocus.closest('.hidden'))lastFocus.focus({preventScroll:true});lastFocus=null}
  };
  function stopTransition(){if(still()&&loader?.classList.contains('is-leaving')){hide();$('welcomeTitle')?.focus({preventScroll:true})}}
  reduced?.addEventListener('change',stopTransition);
  new MutationObserver(stopTransition).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
