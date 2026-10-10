/* Burger Shot · Sistema de logo.
   Componente sin dependencias <burgershot-logo> sobre el emblema ilustrado original
   (assets/burgershot-muertos.webp). El <img> interior es siempre el respaldo: si el script
   no carga, el logo se ve igual, solo que quieto.

   Variantes (atributo variant):
     full     emblema + BURGER SHOT + subtítulo (acceso, configuración)
     compact  emblema + BURGER SHOT en línea (cabecera, menú lateral)
     icon     solo emblema (pedido vacío)
     loader   emblema que se construye por capas (pantalla de carga)
     mobile   compacto reducido, sin interacción
   Atributos: animated (entrada), motion="header" o "float" (movimiento en reposo), interactive (brillo al pasar y pulsación),
   parallax (inclinación de 2,5° cerca del cursor, solo escritorio), intro-key
   (la entrada completa se ve una vez por sesión y clave), decorative (sin texto alternativo).
   Temporada: <html data-season="dia-de-muertos halloween">. Sin el atributo, la marca base. */
(()=>{
  'use strict';
  if(customElements.get('burgershot-logo'))return;
  const SOURCES={full:'assets/logo/burgershot-muertos-320.webp',compact:'assets/logo/burgershot-muertos-160.webp',icon:'assets/logo/burgershot-muertos-160.webp',loader:'assets/logo/burgershot-muertos-320.webp',mobile:'assets/logo/burgershot-muertos-96.webp'};
  const FALLBACKS=['assets/burgershot-muertos.webp','assets/burgershot-spooky.png'];
  const EASE='cubic-bezier(.22,1,.36,1)';
  // Decoración estacional registrada aparte de la marca. Añadir una temporada = una entrada aquí y su bloque en logo.css.
  // accents:true añadiría pétalos junto al emblema; se descartó en el pulido (la marca debe mandar).
  const SEASONS={'dia-de-muertos':{accents:false},halloween:{accents:false}};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const small=matchMedia('(max-width: 760px)');
  const still=()=>reduced.matches||document.body?.classList.contains('motion-off');
  const seasons=()=>(document.documentElement.dataset.season||'').split(/\s+/).filter(s=>SEASONS[s]);
  const seen=key=>{try{return sessionStorage.getItem('bs_logo_intro:'+key)==='1'}catch{return false}};
  const remember=key=>{try{sessionStorage.setItem('bs_logo_intro:'+key,'1')}catch{}};
  const layer=cls=>{const el=document.createElement('i');el.className=cls;el.setAttribute('aria-hidden','true');return el};

  class BurgerShotLogoElement extends HTMLElement{
    get variant(){return SOURCES[this.getAttribute('variant')]?this.getAttribute('variant'):'full'}
    connectedCallback(){
      if(this._built){this.observe();return}
      this._built=true;this.build();this.bindInteraction();this.observe();
    }
    disconnectedCallback(){this._io?.disconnect();this.stopParallax();}

    build(){
      const variant=this.variant;
      this.classList.add('bs-logo','bs-logo--'+variant);
      let mark=this.querySelector('.bs-mark');
      if(!mark){mark=document.createElement('span');mark.className='bs-mark';this.prepend(mark)}
      let img=mark.querySelector('img');
      if(!img){
        img=document.createElement('img');img.src=SOURCES[variant];
        const size=variant==='mobile'?96:variant==='full'||variant==='loader'?320:160;img.width=img.height=size;
        img.alt=this.hasAttribute('decorative')?'':'Burger Shot';mark.append(img);
      }
      img.decoding='async';img.draggable=false;
      this.mark=mark;this.img=img;
      // Capas 2.5D: luz de temporada, sombra de contacto, emblema, relleno del cargador y brillo recortado al logo.
      this.glow=layer('bs-mark-glow');this.shadow=layer('bs-mark-shadow');this.sheen=layer('bs-mark-sheen');
      mark.prepend(this.shadow);mark.prepend(this.glow);
      if(variant==='loader'){this.fill=layer('bs-mark-fill');mark.append(this.fill)}
      mark.append(this.sheen);
      // Emblema y reflejo se mueven juntos; la marca escrita y las medidas quedan fijas.
      if(['header','float'].includes(this.getAttribute('motion'))){
        this.face=document.createElement('span');this.face.className='bs-mark-face';
        this.face.append(img,this.sheen);mark.append(this.face);
      }
      if(variant==='full'||variant==='loader')this.addSeasonAccents();
      this.splitWordmark();
      this.applySource(img.currentSrc||img.src);
      // Respaldo: si el emblema no carga, se prueban los originales y, al final, un monograma. Nunca un hueco.
      const loaded=()=>{this.classList.add('is-loaded');this.applySource(img.currentSrc||img.src)};
      if(img.complete&&img.naturalWidth)loaded();
      img.addEventListener('load',loaded);
      let attempt=0;
      img.addEventListener('error',()=>{
        if(attempt<FALLBACKS.length){img.src=FALLBACKS[attempt++];return}
        this.classList.add('is-fallback');mark.setAttribute('data-monogram','BS');
      });
      if(img.complete&&!img.naturalWidth&&img.getAttribute('src'))img.dispatchEvent(new Event('error'));
      this.querySelectorAll('[data-season-only]').forEach(el=>{el.hidden=!seasons().length});
    }
    applySource(src){
      const url=`url("${String(src).replace(/"/g,'%22')}")`;
      this.mark.style.setProperty('--bs-logo-src',url);
    }
    addSeasonAccents(){
      if(!seasons().some(s=>SEASONS[s].accents)||this.querySelector('.bs-accents'))return;
      const accents=document.createElement('span');accents.className='bs-accents';accents.setAttribute('aria-hidden','true');
      accents.innerHTML='<i></i><i></i><i></i>';this.mark.append(accents);
    }
    // Las letras se separan para entrar una a una; los lectores de pantalla leen la palabra completa.
    splitWordmark(){
      const strong=this.querySelector('.bs-type strong');
      if(!strong||strong.querySelector('.bs-ch'))return;
      const text=strong.textContent.replace(/\s+/g,' ').trim();
      const visual=strong.cloneNode(true);
      visual.querySelectorAll('span').forEach(span=>span.classList.add('bs-accent'));
      const walk=node=>{
        for(const child of [...node.childNodes]){
          if(child.nodeType===3){
            const frag=document.createDocumentFragment();
            for(const ch of child.textContent){
              if(ch===' '){frag.append(' ');continue}
              const span=document.createElement('span');span.className='bs-ch';span.textContent=ch;frag.append(span);
            }
            child.replaceWith(frag);
          }else if(child.nodeType===1)walk(child);
        }
      };
      walk(visual);
      strong.textContent='';
      const label=document.createElement('span');label.className='sr-only';label.textContent=text;
      const shown=document.createElement('span');shown.className='bs-type-visual';shown.setAttribute('aria-hidden','true');
      shown.append(...visual.childNodes);
      strong.append(label,shown);
      this.letters=[...shown.querySelectorAll('.bs-ch')];
    }

    observe(){
      if(this._io||!this.hasAttribute('animated'))return;
      this._io=new IntersectionObserver(entries=>{
        const visible=entries.some(e=>e.isIntersecting);
        if(visible&&!this._played){this._played=true;this.intro()}
        else if(visible&&this._hidden){this.intro({quick:true})}
        this._hidden=!visible;
        this.toggleAttribute('data-visible',visible);
        if(!visible)this.stopParallax();
      });
      this._io.observe(this);
    }
    // Vuelve a reproducir la entrada (por ejemplo, al volver a mostrarse el acceso tras cerrar sesión).
    replay(){this._played=true;return this.intro({quick:true})}

    intro({quick=false}={}){
      const variant=this.variant,key=this.getAttribute('intro-key');
      const full=variant==='full'&&!quick&&!(key&&seen(key));
      if(key&&variant==='full')remember(key);
      const run=[];
      const go=(el,frames,options)=>{if(el?.animate)run.push(el.animate(frames,{easing:EASE,fill:'backwards',...options}))};
      if(still()){
        go(this,[{opacity:0},{opacity:1}],{duration:200});
        return Promise.allSettled(run.map(a=>a.finished));
      }
      if(this.getAttribute('motion')==='header'){
        go(this.face||this.mark,[
          {opacity:0,transform:'translateY(5px) rotate(-8deg) scale(.9)'},
          {opacity:1,transform:'translateY(-1px) rotate(2deg) scale(1.025)',offset:.65},
          {opacity:1,transform:'none'}
        ],{duration:620});
        this.sweep(400,700);
      }else if(this.getAttribute('motion')==='float'){
        go(this.face||this.mark,[
          {opacity:0,transform:'translateY(7px) rotate(-5deg) scale(.94)'},
          {opacity:1,transform:'translateY(-3px) rotate(2deg) scale(1.02)',offset:.65},
          {opacity:1,transform:'none'}
        ],{duration:720});
        this.sweep(460,760);
      }else if(variant==='compact'||variant==='mobile'){
        // Cabecera: discreta, 360 ms.
        go(this,[{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:360});
      }else if(variant==='icon'||!full){
        go(this.mark,[{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:320});
        go(this.querySelector('.bs-type'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:320,delay:60});
      }else{
        this.introFull(go);
      }
      this.classList.add('is-intro');
      const done=Promise.allSettled(run.map(a=>a.finished)).then(()=>this.classList.remove('is-intro'));
      return done;
    }
    // Entrada completa (≈1,2 s): silueta → color → letras → reflejo → profundidad → quieto.
    introFull(go){
      const compact=small.matches,stage=this.closest('.gate');
      stage?.classList.add('is-logo-intro');
      setTimeout(()=>stage?.classList.remove('is-logo-intro'),1000);
      go(this.mark,compact
        ?[{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'none'}]
        :[{opacity:0,transform:'perspective(600px) rotateX(14deg) rotateY(-10deg) scale(.9)'},{opacity:1,transform:'perspective(600px) rotateX(5deg) rotateY(-4deg) scale(.98)',offset:.45},{opacity:1,transform:'perspective(600px) rotateX(0) rotateY(0) scale(1)'}],
        {duration:1150});
      go(this.img,[{filter:'brightness(.08) saturate(0)'},{filter:'brightness(.25) saturate(.2)',offset:.3},{filter:'brightness(1) saturate(1)'}],{duration:760,delay:120});
      go(this.shadow,[{opacity:0,transform:'translateX(-50%) scale(.55)'},{opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:620,delay:420});
      go(this.glow,[{opacity:0},{opacity:1}],{duration:700,delay:300});
      (this.letters||[]).forEach((ch,i)=>go(ch,[{opacity:0,transform:'translateY(.55em)'},{opacity:1,transform:'none'}],{duration:420,delay:300+i*34}));
      go(this.querySelector('.bs-type small'),[{opacity:0},{opacity:1}],{duration:360,delay:780});
      go(this.querySelector('.bs-accents'),[{opacity:0},{opacity:1}],{duration:500,delay:820});
      this.sweep(620,560);
    }
    // Reflejo de luz recortado a la silueta del emblema (máscara con el propio logo).
    sweep(delay=0,duration=640){
      if(still()||!this.sheen.animate)return;
      this._sweep?.cancel();
      this._sweep=this.sheen.animate([{opacity:0,backgroundPosition:'-120% 0'},{opacity:1,offset:.25},{opacity:1,offset:.75},{opacity:0,backgroundPosition:'220% 0'}],{duration,delay,easing:'cubic-bezier(.45,0,.25,1)',fill:'backwards'});
    }

    bindInteraction(){
      if(this.hasAttribute('interactive')&&this.variant!=='mobile'){
        this.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!this.classList.contains('is-intro'))this.sweep(0,620)});
      }
      if(this.hasAttribute('parallax'))this.startParallaxListener();
    }
    // Inclinación por proximidad: máx. 2,5°, con amortiguación; el bucle solo corre mientras hay movimiento.
    startParallaxListener(){
      let tx=0,ty=0,cx=0,cy=0;
      const set=()=>{this.mark.style.setProperty('--tilt-x',cy.toFixed(3)+'deg');this.mark.style.setProperty('--tilt-y',cx.toFixed(3)+'deg');this.mark.style.setProperty('--light',(50+cx*12).toFixed(1)+'%')};
      const step=()=>{
        cx+=(tx-cx)*.11;cy+=(ty-cy)*.11;set();
        if(Math.abs(tx-cx)<.01&&Math.abs(ty-cy)<.01){cx=tx;cy=ty;set();this._raf=0;return}
        this._raf=requestAnimationFrame(step);
      };
      this._onMove=e=>{
        if(still()||!fine.matches||small.matches||!this.hasAttribute('data-visible')||this.classList.contains('is-intro'))return;
        const r=this.mark.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),radius=Math.max(240,r.width*2);
        const near=Math.max(0,1-Math.hypot(dx,dy)/radius);
        tx=Math.max(-1,Math.min(1,dx/radius))*2.5*near;ty=-Math.max(-1,Math.min(1,dy/radius))*2.5*near;
        this.classList.toggle('is-near',near>0);
        if(!this._raf)this._raf=requestAnimationFrame(step);
      };
      this._onLeave=()=>{tx=0;ty=0;this.classList.remove('is-near');if(!this._raf)this._raf=requestAnimationFrame(step)};
      addEventListener('pointermove',this._onMove,{passive:true});
      document.addEventListener('pointerleave',this._onLeave);
    }
    stopParallax(){
      if(this._raf){cancelAnimationFrame(this._raf);this._raf=0}
      this.mark?.style.removeProperty('--tilt-x');this.mark?.style.removeProperty('--tilt-y');this.classList.remove('is-near');
    }
  }
  customElements.define('burgershot-logo',BurgerShotLogoElement);

  // API de fábrica para crear el logo desde código: BurgerShotLogo.create({variant:'full',animated:true,interactive:true}).
  const create=(options={})=>{
    const el=document.createElement('burgershot-logo');
    el.setAttribute('variant',options.variant||'full');
    for(const flag of ['animated','interactive','parallax','decorative'])if(options[flag])el.setAttribute(flag,'');
    if(['header','float'].includes(options.motion))el.setAttribute('motion',options.motion);
    if(options.introKey)el.setAttribute('intro-key',options.introKey);
    if(options.variant!=='icon'&&options.variant!=='loader'&&options.wordmark!==false){
      const type=document.createElement('span');type.className='bs-type';
      type.innerHTML='<strong>BURGER <span>SHOT</span></strong>'+(options.tagline?'<small></small>':'');
      if(options.tagline)type.querySelector('small').textContent=options.tagline;
      el.append(type);
    }
    return el;
  };
  window.BurgerShotLogo=Object.freeze({
    create,
    Animated:o=>create({variant:'full',animated:true,interactive:true,parallax:true,...o}),
    Compact:o=>create({variant:'compact',...o}),
    Icon:o=>create({variant:'icon',wordmark:false,...o}),
    Loader:o=>create({variant:'loader',wordmark:false,...o}),
    Mobile:o=>create({variant:'mobile',...o}),
    seasons:()=>seasons()
  });
  window.BurgerShotLoader=o=>create({variant:'loader',wordmark:false,...o});
})();
