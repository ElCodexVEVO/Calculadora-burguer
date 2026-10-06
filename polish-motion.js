/* V6.6 · Efectos decorativos. El carrito y el cobro conservan sus manejadores. */
(()=>{
  'use strict';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover:hover) and (pointer:fine)');
  const still=()=>reduced.matches||document.body.classList.contains('motion-off');
  const grid=document.getElementById('productGrid');
  const waves=new Set(),signals=new Map();
  let hovered=null,pointerFrame=0,pointerX=0,pointerY=0;

  function clearHover(){
    if(pointerFrame){cancelAnimationFrame(pointerFrame);pointerFrame=0}
    if(!hovered)return;
    hovered.classList.remove('bs-card-hover');
    for(const name of ['--bs-light-x','--bs-light-y','--bs-tilt-x','--bs-tilt-y'])hovered.style.removeProperty(name);
    hovered=null;
  }
  function paintHover(){
    pointerFrame=0;
    if(!hovered?.isConnected||still()||!fine.matches){clearHover();return}
    const r=hovered.getBoundingClientRect();if(!r.width||!r.height)return;
    const x=Math.max(0,Math.min(1,(pointerX-r.left)/r.width));
    const y=Math.max(0,Math.min(1,(pointerY-r.top)/r.height));
    const photo=hovered.querySelector('.product-photo')?.getBoundingClientRect();
    const lightY=photo?.height?Math.max(0,Math.min(1,(pointerY-photo.top)/photo.height)):y;
    hovered.style.setProperty('--bs-light-x',`${(x*100).toFixed(1)}%`);
    hovered.style.setProperty('--bs-light-y',`${(lightY*100).toFixed(1)}%`);
    hovered.style.setProperty('--bs-tilt-x',`${((.5-y)*2).toFixed(2)}deg`);
    hovered.style.setProperty('--bs-tilt-y',`${((x-.5)*2.6).toFixed(2)}deg`);
  }
  grid?.addEventListener('pointermove',e=>{
    if(still()||!fine.matches||e.pointerType==='touch')return;
    const card=e.target.closest('.product-card');if(!card)return;
    if(card!==hovered){clearHover();hovered=card;card.classList.add('bs-card-hover')}
    pointerX=e.clientX;pointerY=e.clientY;
    if(!pointerFrame)pointerFrame=requestAnimationFrame(paintHover);
  },{passive:true});
  grid?.addEventListener('pointerleave',clearHover,{passive:true});
  grid?.addEventListener('pointerout',e=>{if(hovered&&!hovered.contains(e.relatedTarget))clearHover()},{passive:true});
  fine.addEventListener('change',clearHover);

  // One sliding line follows the selected category, including wrapped rows.
  const tabs=document.getElementById('categoryTabs');
  const light=document.createElement('span');light.className='bs-category-light';light.setAttribute('aria-hidden','true');
  function moveCategoryLight(){
    const active=tabs?.querySelector('.category-tab.active');if(!active)return;
    if(light.parentElement!==tabs)tabs.append(light);
    light.style.left=active.offsetLeft+'px';
    light.style.top=(active.offsetTop+active.offsetHeight+4)+'px';
    light.style.width=active.offsetWidth+'px';
  }
  if(tabs){
    new MutationObserver(moveCategoryLight).observe(tabs,{childList:true});
    new ResizeObserver(moveCategoryLight).observe(tabs);
    moveCategoryLight();
  }

  // Warm waves originate at a tap or at the button centre for keyboard clicks.
  const buttons='.add-product,.bulk-presets button,.category-tab,.checkout,.btn,.quick-card,.nav-item,.icon-btn,.row-btn,.template-action';
  document.addEventListener('click',e=>{
    const button=e.target.closest?.(buttons);
    if(!button||button.disabled||still()||waves.size>=8||!button.animate)return;
    const r=button.getBoundingClientRect();if(!r.width)return;
    const x=e.detail?e.clientX-r.left:r.width/2,y=e.detail?e.clientY-r.top:r.height/2;
    const diameter=Math.hypot(r.width,r.height)*2;
    const wave=document.createElement('span');wave.className='bs-touch-wave';wave.setAttribute('aria-hidden','true');
    Object.assign(wave.style,{left:(x-diameter/2)+'px',top:(y-diameter/2)+'px',width:diameter+'px',height:diameter+'px'});
    button.classList.add('bs-press-target');button.append(wave);
    const animation=wave.animate([{transform:'scale(0)',opacity:.28},{transform:'scale(1)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.7,.2,1)'});
    const record={wave,animation};waves.add(record);
    animation.finished.catch(()=>{}).then(()=>{waves.delete(record);wave.remove()});
  },true);

  function signal(el,cls){
    if(!el||still())return;
    const previous=signals.get(el);if(previous){clearTimeout(previous.timer);el.classList.remove(previous.cls)}
    el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
    const timer=setTimeout(()=>{el.classList.remove(cls);signals.delete(el)},750);
    signals.set(el,{cls,timer});
  }
  document.addEventListener('bs:cart-added',e=>{
    signal(document.querySelector('.order-panel'),'bs-order-glow');
    signal(document.querySelector('.order-panel .totals .grand'),'bs-total-glow');
    const card=Array.from(grid?.querySelectorAll('[data-product]')||[]).find(el=>el.dataset.product===e.detail?.id);
    signal(card?.querySelector('[data-add-feedback]'),'bs-feedback-spark');
  });

  function stop(){
    if(!still())return;
    clearHover();
    for(const {wave,animation} of waves){animation.cancel();wave.remove()}
    waves.clear();
    for(const [el,{cls,timer}] of signals){clearTimeout(timer);el.classList.remove(cls)}
    signals.clear();
  }
  reduced.addEventListener('change',stop);
  new MutationObserver(stop).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
