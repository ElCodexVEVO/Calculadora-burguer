/* Navegación adaptable. No interviene en autorizaciones ni operaciones. */
(function(){
  'use strict';
  const side=document.getElementById('sidebar'),toggle=document.getElementById('sidebarToggle'),wide=matchMedia('(min-width:1101px)'),menu=document.getElementById('mobileMenu'),main=document.getElementById('main');
  const tip=document.createElement('div');tip.id='navTooltip';tip.className='nav-tooltip';tip.role='tooltip';tip.hidden=true;document.body.append(tip);
  let compact=false,described=null,wasOpen=false;
  try{compact=localStorage.getItem('bs_sidebar_collapsed')==='true'}catch{}
  function hideTip(){tip.hidden=true;described?.removeAttribute('aria-describedby');described=null}
  function sync(){
    document.body.classList.toggle('sidebar-collapsed',compact&&wide.matches);const open=side.classList.contains('open');
    toggle.setAttribute('aria-expanded',String(wide.matches?!compact:open));toggle.setAttribute('aria-label',wide.matches?(compact?'Expandir navegación':'Contraer navegación'):'Cerrar navegación');
    side.inert=!wide.matches&&!open;menu.setAttribute('aria-expanded',String(open&&!wide.matches));
    if(!wide.matches&&wasOpen&&!open&&side.contains(document.activeElement))menu.focus();
    wasOpen=open;hideTip();
  }
  toggle.onclick=()=>{if(wide.matches){compact=!compact;try{localStorage.setItem('bs_sidebar_collapsed',String(compact))}catch{}}else side.classList.remove('open');sync()};
  function annotate(){side.querySelectorAll('.nav-item').forEach(button=>{button.setAttribute('aria-label',button.querySelector('b')?.textContent.trim()||button.textContent.trim());button.setAttribute('aria-current',button.classList.contains('active')?'page':'false')});const current=side.querySelector('.nav-item.active');document.getElementById('currentSection').textContent=current?.getAttribute('aria-label')||'Mi perfil'}
  function showTip(target){if(!wide.matches||!compact||!target)return;const name=target.getAttribute('aria-label')||target.textContent.trim(),r=target.getBoundingClientRect();tip.textContent=name;tip.hidden=false;tip.style.left=(r.right+12)+'px';tip.style.top=Math.min(innerHeight-44,Math.max(8,r.top+(r.height-36)/2))+'px';described=target;target.setAttribute('aria-describedby',tip.id)}
  side.addEventListener('pointerover',e=>showTip(e.target.closest('.nav-item,.account-card,.nav-tools summary')));side.addEventListener('pointerout',hideTip);side.addEventListener('focusin',e=>showTip(e.target.closest('.nav-item,.account-card,.nav-tools summary')));side.addEventListener('focusout',hideTip);side.querySelector('nav').addEventListener('scroll',hideTip);
  side.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();if(e.key!=='Tab'||wide.matches||!side.classList.contains('open'))return;const targets=[...side.querySelectorAll('button,summary')].filter(el=>!el.disabled&&el.getClientRects().length&&!el.closest('.hidden'));const first=targets[0],last=targets.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
  new MutationObserver(sync).observe(side,{attributes:true,attributeFilter:['class']});
  new MutationObserver(annotate).observe(side.querySelector('nav'),{subtree:true,childList:true,attributes:true,attributeFilter:['class']});wide.addEventListener('change',sync);window.addEventListener('resize',hideTip);annotate();sync();
  const search=document.getElementById('globalSearch'),results=document.getElementById('globalSearchResults');
  const searchToggle=document.getElementById('mobileSearchBtn'),topbar=document.querySelector('.topbar');
  searchToggle.onclick=()=>{const open=topbar.classList.toggle('search-open');searchToggle.setAttribute('aria-expanded',String(open));if(open)search.focus();else results.hidden=true};
  search.addEventListener('input',()=>{const value=search.value.trim().toLocaleLowerCase('es');results.replaceChildren();results.hidden=!value;if(!value)return;const product=document.createElement('button');product.textContent='Buscar productos: '+search.value;product.onclick=()=>{search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));results.hidden=true};results.append(product);const buttons=[...side.querySelectorAll('[data-page]')].filter(b=>!b.classList.contains('hidden')&&!b.closest('.hidden')&&b.getAttribute('aria-label')?.toLocaleLowerCase('es').includes(value));for(const original of buttons){const b=document.createElement('button');b.type='button';b.textContent=original.getAttribute('aria-label');b.onclick=()=>{original.click();search.value='';results.hidden=true;main.focus()};results.append(b)}if(!buttons.length){const p=document.createElement('p');p.textContent='No hay secciones disponibles con ese nombre.';results.append(p)}});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.global-search'))results.hidden=true});search.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;search.value=''}if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('button')?.focus()}});
  search.addEventListener('keydown',e=>{if(e.key==='Escape'&&topbar.classList.contains('search-open')){topbar.classList.remove('search-open');searchToggle.setAttribute('aria-expanded','false');searchToggle.focus()}});
})();
