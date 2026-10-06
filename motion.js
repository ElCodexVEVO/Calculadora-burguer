/* V6.5 · Animaciones de temporada: logo, papel picado, pétalos y respuesta del pedido.
   Solo decora: no cambia el carrito, los importes ni los manejadores originales. */
(()=>{
  'use strict';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const still=()=>Boolean(reduced?.matches)||document.body.classList.contains('motion-off');
  const effects=new Set();
  const animateEffect=(el,frames,options,done)=>{
    const animation=el.animate(frames,options),record={el,animation};effects.add(record);
    animation.finished.catch(()=>{}).then(()=>{effects.delete(record);el.remove();done?.()});
  };
  const stopEffects=()=>{
    if(!still())return;
    for(const {el,animation} of effects){animation.cancel();el.remove()}
    document.querySelectorAll('.bs-receipt').forEach(el=>el.remove());
    for(const cls of ['atelier-added','bs-pop','bs-tick','bs-line-in','bs-enter','is-jelly','is-poked'])document.querySelectorAll('.'+cls).forEach(el=>el.classList.remove(cls));
  };
  reduced?.addEventListener('change',stopEffects);
  new MutationObserver(stopEffects).observe(document.body,{attributes:true,attributeFilter:['class']});
  const replay=(el,cls)=>{
    if(!el||still())return;
    el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
    const done=e=>{if(e.target!==el)return;el.classList.remove(cls);el.removeEventListener('animationend',done)};
    el.addEventListener('animationend',done);
  };

  // A burst of marigold petals from the logo when it is clicked.
  const burst=host=>{
    if(still())return;
    const r=host.getBoundingClientRect(),cx=r.left+r.width/2-4,cy=r.top+r.height*.45-3;
    for(let k=0;k<14;k++){
      const petal=document.createElement('i'),angle=k/14*Math.PI*2+Math.random()*.4,reach=38+Math.random()*34,x=Math.cos(angle)*reach,y=Math.sin(angle)*reach;
      petal.className='bs-burst';petal.style.left=cx+'px';petal.style.top=cy+'px';
      document.body.append(petal);
      animateEffect(petal,[
        {transform:'translate(0,0) scale(.4) rotate(0deg)',opacity:1},
        {transform:`translate(${x}px,${y}px) scale(1) rotate(${200+Math.random()*200}deg)`,opacity:1,offset:.45},
        {transform:`translate(${x*1.25}px,${y*1.25+46}px) scale(.8) rotate(${420+Math.random()*240}deg)`,opacity:0}
      ],{duration:1100+Math.random()*400,easing:'cubic-bezier(.2,.7,.3,1)'});
    }
  };

  const logo=document.querySelector('.header-brand>img');
  if(logo){
    const wrap=document.createElement('span'),art=document.createElement('span'),shine=logo.cloneNode(false);
    wrap.className='bs-logo';art.className='bs-logo-art';
    shine.className='bs-logo-shine';shine.alt='';shine.setAttribute('aria-hidden','true');
    logo.replaceWith(wrap);
    art.append(logo,shine);
    wrap.innerHTML='<i class="bs-logo-halo" aria-hidden="true"></i>';
    wrap.append(art);
    wrap.insertAdjacentHTML('beforeend','<i class="bs-drip d1" aria-hidden="true"></i><i class="bs-drip d2" aria-hidden="true"></i><i class="bs-drip d3" aria-hidden="true"></i><i class="bs-spark s1" aria-hidden="true"></i><i class="bs-spark s2" aria-hidden="true"></i><i class="bs-spark s3" aria-hidden="true"></i>');
    wrap.addEventListener('pointerenter',()=>{if(!still())replay(art,'is-jelly')});
    wrap.addEventListener('click',()=>{if(still())return;replay(art,'is-jelly');burst(wrap)});
  }

  // Papel picado: a passing hand makes a flag swing.
  document.querySelectorAll('.festival-bunting .bs-flag').forEach(flag=>flag.addEventListener('pointerenter',()=>{if(!still())replay(flag.querySelector('.bs-flag-swing'),'is-poked')}));

  const headerArt=document.querySelector('.festival-header-art');
  if(headerArt){
    const petals=document.createElement('div');
    petals.className='bs-petals';
    petals.innerHTML=Array.from({length:10},(_,i)=>`<i style="--x:${(6+i*9.7+i%3*2.5).toFixed(1)}%;--s:${(6+i%4*1.7).toFixed(1)}px;--d:${(7.5+i%5*1.4).toFixed(1)}s;--delay:-${(i*1.9).toFixed(1)}s;--drift:${i%2?'':'-'}${16+i%4*10}px;--spin:${i%2?520:-460}deg"></i>`).join('');
    headerArt.append(petals);
  }

  document.querySelectorAll('.sidebar nav .nav-item').forEach((item,i)=>item.style.setProperty('--i',Math.min(i,12)));

  // Catalog cards rise in only when the visible list changes (category or search).
  const grid=document.getElementById('productGrid');
  let shownList='';
  if(grid)new MutationObserver(()=>{
    const cards=[...grid.querySelectorAll('.product-card')],list=cards.map(card=>card.dataset.product).join('|');
    if(list===shownList)return;
    shownList=list;
    if(still())return;
    cards.forEach((card,i)=>{
      card.style.setProperty('--i',Math.min(i,10));card.classList.add('bs-enter');
      card.addEventListener('animationend',e=>{if(e.target===card&&e.animationName==='bsRise')card.classList.remove('bs-enter')});
    });
  }).observe(grid,{childList:true});

  // Added products fly from their photo to the order counter.
  const orderCount=document.getElementById('orderCount');
  let flying=0;
  const fly=(img,from,quantity)=>{
    if(still()||!img||!from?.width||!orderCount||flying>=3||from.bottom<0||from.top>innerHeight)return false;
    const to=orderCount.getBoundingClientRect();
    if(!to.width||to.bottom<0||to.top>innerHeight)return false;
    const ghost=document.createElement('div'),photo=img.cloneNode(false);
    ghost.className='bs-fly';ghost.setAttribute('aria-hidden','true');
    photo.removeAttribute('loading');photo.alt='';ghost.append(photo);
    if(quantity>1){const badge=document.createElement('span');badge.className='bs-fly-quantity';badge.textContent=`×${quantity.toLocaleString('es-MX')}`;ghost.append(badge)}
    Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
    document.body.append(ghost);
    const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2),end=Math.max(.05,30/from.width),mid=Math.max(end*2.5,.32);
    flying++;
    animateEffect(ghost,[
      {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1,borderRadius:'12px'},
      {transform:`translate(${dx*.5}px,${dy*.5-90}px) scale(${mid}) rotate(-10deg)`,opacity:1,borderRadius:'28px',offset:.5},
      {transform:`translate(${dx}px,${dy}px) scale(${end}) rotate(14deg)`,opacity:.25,borderRadius:'50%'}
    ],{duration:650,easing:'cubic-bezier(.5,0,.3,1)'},()=>{flying--;replay(orderCount,'bs-pop')});
    return true;
  };
  document.addEventListener('bs:cart-added',e=>{
    const {id,quantity=1}=e.detail||{};
    const card=id&&Array.from(grid?.querySelectorAll('.product-card')||[]).find(el=>el.dataset.product===id);
    if(!card||!card.getBoundingClientRect().width)return;
    replay(card,'atelier-added');
    replay(card.querySelector('[data-add]'),'bs-pop');
    replay(card?.querySelector('.in-cart-count'),'bs-pop');
    const img=card.querySelector('.food-photo');
    if(!fly(img,img?.getBoundingClientRect(),quantity))replay(orderCount,'bs-pop');
  });

  // A registered sale prints a receipt above the checkout button and releases petals.
  const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0);
  document.addEventListener('bs:sale-registered',e=>{
    if(still())return;
    const {total=0,client='',items=0}=e.detail||{},button=document.getElementById('checkoutBtn'),r=button?.getBoundingClientRect();
    const visible=Boolean(r?.width)&&r.top>160&&r.bottom<innerHeight,width=Math.min(250,Math.max(210,r?.width||230));
    const slip=document.createElement('div');
    slip.className='bs-receipt'+(document.querySelector('.order-panel')?.classList.contains('ticket-dark')?' dark':'');
    slip.setAttribute('aria-hidden','true');
    Object.assign(slip.style,{width:width+'px',left:(visible?r.left+r.width/2:innerWidth/2)-width/2+'px',bottom:(visible?innerHeight-r.top+8:innerHeight/2-100)+'px'});
    slip.innerHTML='<div class="bs-receipt-paper"><span class="bs-receipt-brand">BURGER SHOT</span><strong>Venta registrada</strong><div><span>Cliente</span><b></b></div><div><span>Productos</span><b></b></div><div class="bs-receipt-total"><span>Total</span><b></b></div><i class="bs-receipt-stamp">PAGADO</i><small>Gracias por compartir la mesa.</small></div>';
    const [clientValue,itemsValue,totalValue]=slip.querySelectorAll('b');
    clientValue.textContent=client||'Cliente general';itemsValue.textContent=String(Number(items)||0);totalValue.textContent=money(total);
    document.body.append(slip);
    slip.addEventListener('animationend',ev=>{if(ev.target===slip)slip.remove()});
    setTimeout(()=>slip.remove(),4000);
    if(visible)burst(button);
  });

  // New order lines slide in; changed quantities and totals give a small tick.
  const cartList=document.getElementById('cartList');
  let known=new Map();
  if(cartList)new MutationObserver(()=>{
    const next=new Map();let fresh=0;
    cartList.querySelectorAll('.cart-item').forEach(item=>{
      const id=item.querySelector('[data-remove]')?.dataset.remove,qty=item.querySelector('[data-q-input]')?.value;
      if(!id)return;
      next.set(id,qty);
      if(!known.has(id)){item.style.setProperty('--i',Math.min(fresh++,8));replay(item,'bs-line-in')}
      else if(known.get(id)!==qty)replay(item.querySelector('.line-total strong'),'bs-tick');
    });
    known=next;
  }).observe(cartList,{childList:true});
  for(const id of ['grandTotal','checkoutTotal','commissionPreview','orderCount']){
    const el=document.getElementById(id);if(!el)continue;
    let last=el.textContent;
    new MutationObserver(()=>{
      if(el.textContent===last)return;
      last=el.textContent;
      if(id!=='orderCount')replay(el,'bs-tick');
      else if(!flying)replay(el,'bs-pop');
    }).observe(el,{childList:true,characterData:true,subtree:true});
  }
})();
