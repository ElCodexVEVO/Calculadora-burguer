(function(){
  'use strict';
  const pause=()=>document.body.classList.toggle('visual-paused',document.hidden);document.addEventListener('visibilitychange',pause);pause();
  function clock(){if(document.hidden)return;const now=new Date(),node=document.getElementById('headerTime');node.dateTime=now.toISOString();node.innerHTML=`<span>${new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(now)}</span><strong>${new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(now)}</strong>`}
  clock();setInterval(clock,30000);document.addEventListener('visibilitychange',clock);
  // Anima exclusivamente la representación; conserva las cifras reales del DOM.
  const observer=new MutationObserver(()=>{const page=document.querySelector('.page.active');if(!page||document.body.dataset.effects==='performance'||matchMedia('(prefers-reduced-motion:reduce)').matches)return;page.querySelectorAll('.metric').forEach(el=>{if(el.dataset.cinemaSeen)return;el.dataset.cinemaSeen='true';el.animate([{transform:'translateY(8px)',opacity:.65},{transform:'translateY(0)',opacity:1}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'})})});
  observer.observe(document.getElementById('main'),{subtree:true,childList:true});
})();
