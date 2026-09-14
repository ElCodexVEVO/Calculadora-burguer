/* BurgerShot companion: local screenshot OCR, shared POS checkout, no game hooks. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const core = window.BurgerCompanionCore;
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${{
    plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10"/>',
    pin:'<path d="m9 3 9 3-3 5 1 5-5-1-5 3 3-9ZM8 16l-5 5"/>',
    window:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M14 9v11"/>',
    repeat:'<path d="M20 6v5h-5M4 18v-5h5M6 8a7 7 0 0 1 13 2M5 14a7 7 0 0 0 13 2"/>',
    exit:'<path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4"/>'
  }[name] || ''}</svg>`;
  window.BurgerCompanion = { mount(api) {
    let tab = 'favorites', lastScope = '', favorites = [], customerGroups = [];
    let reviewActive = false, reviewStamp = '', stale = false, busy = false, epoch = 0;
    let source = null, crop = null, drag = null, worker = null, imageURL = null;
    let firstAuth = true, scriptLoading = null, currentWorkerTask = null;
    const e = api.escape, m = api.money;
    const focused = new URLSearchParams(location.search).get('auxiliar') === '1';
    if (focused) document.body.classList.add('bs-focused');
    const panel = document.createElement('section');
    panel.id = 'page-companion'; panel.className = 'page';
    panel.innerHTML = `
      <div class="bs-shell">
        <header class="bs-header"><div class="bs-brand"><img src="assets/burgershot-logo.webp" alt=""><div><strong>Burger<span>Shot</span></strong><small>CAJA AUXILIAR</small></div></div><div class="bs-tools">
          <button id="bsPin" class="bs-icon" title="Mantener encima" aria-label="Mantener encima" hidden>${icon('pin')}</button>
          <button id="bsWindow" class="bs-icon" title="Abrir ventana compacta" aria-label="Abrir ventana compacta">${icon('window')}</button>
          <button id="bsExit" class="bs-icon" title="Volver al panel" aria-label="Volver al panel">${icon('exit')}</button></div></header>
        <div class="bs-scroll"><div class="bs-heading"><div><span class="bs-eyebrow">TU TURNO, A TU RITMO</span><h1>Pedidos rápidos</h1></div><span id="bsSync" class="bs-sync">Cargando</span></div>
          <div class="bs-tabs" role="group" aria-label="Catálogo"><button data-bs-tab="favorites" aria-pressed="true">Favoritos</button><button data-bs-tab="all" aria-pressed="false">Menú</button><button data-bs-tab="combos" aria-pressed="false">Combos</button></div>
          <label class="bs-search"><span class="sr-only">Buscar producto</span><input id="bsSearch" placeholder="Buscar producto o combo" autocomplete="off"></label>
          <div id="bsProducts" class="bs-products"></div>
          <section class="bs-order"><div class="bs-section-head"><h2>Orden actual <span id="bsCount">0</span></h2><button id="bsClear" class="bs-text">Vaciar</button></div>
            <label for="bsClient">Cliente / ID <span class="bs-required">*</span></label><input id="bsClient" list="bsCustomers" maxlength="120" required placeholder="Nombre o ID del cliente" autocomplete="off"><datalist id="bsCustomers"></datalist>
            <div class="bs-customer-info"><small id="bsClientHint">Obligatorio para continuar</small><button id="bsRepeat" class="bs-text" hidden>${icon('repeat')} Repetir compra</button></div>
            <div id="bsLines" class="bs-lines"></div>
            <details class="bs-options"><summary>Tipo de cliente y convenio <span id="bsDiscountName"></span></summary><div class="bs-form-row"><div><label for="bsType">Tipo de cliente</label><select id="bsType"><option value="general">Cliente general</option><option value="police">Policía</option><option value="sheriff">Sheriff</option><option value="ems">EMS</option></select></div><div><label for="bsDiscount">Convenio</label><select id="bsDiscount"></select></div></div><p id="bsDiscountNote" class="bs-help"></p></details>
          </section>
        </div>
        <footer class="bs-footer"><div id="bsSuccess" class="bs-success" role="status" hidden></div><div class="bs-total"><div><span>Total a cobrar</span><small id="bsEarning"></small></div><strong id="bsTotal">$0</strong></div><div class="bs-actions"><button id="bsCopy" class="bs-secondary">${icon('copy')} Copiar total</button><button id="bsReview" class="bs-primary">${icon('scan')} Revisar cobro</button></div><div class="bs-footnote"><span id="bsCashier"></span><button id="bsLogout" class="bs-text">Salir</button></div></footer>
      </div>`;
    document.querySelector('main.main').append(panel);
    const nav = document.createElement('button');
    nav.className = 'nav-item'; nav.dataset.page = 'companion';
    nav.innerHTML = `<span class="nav-svg">${icon('window')}</span><b>Caja auxiliar</b>`;
    document.querySelector('.nav-item[data-page="pos"]').after(nav);

    const checkout = $('checkoutModal').querySelector('.modal');
    const capture = document.createElement('section'); capture.id = 'bsCapture'; capture.className = 'bs-capture'; capture.hidden = true;
    capture.innerHTML = `<div class="bs-section-head"><h3>Lectura de pantalla</h3><span class="bs-review-badge">Por revisar</span></div><p class="bs-help">Recorta el aviso con <kbd>Win + Shift + S</kbd> y pégalo aquí con <kbd>Ctrl + V</kbd>.</p><div class="bs-capture-actions"><button id="bsPaste" class="bs-secondary">Pegar captura</button><label class="bs-secondary bs-file">Elegir imagen<input id="bsFile" type="file" accept="image/png,image/jpeg,image/webp"></label></div><div id="bsCanvasWrap" class="bs-canvas-wrap" hidden><canvas id="bsCanvas" aria-label="Captura del pago. Arrastra para seleccionar solo el aviso."></canvas></div><p id="bsCropHint" class="bs-help" hidden>Arrastra sobre la imagen para marcar solo el aviso.</p><div class="bs-capture-actions"><button id="bsRead" class="bs-primary" disabled>Leer captura</button><button id="bsResetCrop" class="bs-text" hidden>Usar imagen completa</button><button id="bsRemoveImage" class="bs-text" hidden>Quitar</button></div><p id="bsOcrStatus" class="bs-help" role="status">La captura se procesa en este dispositivo. También puedes escribir los datos.</p><details id="bsRawDetails" hidden><summary>Texto leído</summary><pre id="bsRawText"></pre></details>`;
    $('checkoutSummary').before(capture);
    const confirmation = document.createElement('section'); confirmation.id = 'bsConfirmation'; confirmation.className = 'bs-confirmation'; confirmation.hidden = true;
    confirmation.innerHTML = `<label for="bsReceived">Importe recibido</label><input id="bsReceived" inputmode="decimal" placeholder="Ej. 2,000.00" autocomplete="off"><p id="bsReviewStatus" class="bs-review-status" role="status"></p><label class="bs-check"><input id="bsPaid" type="checkbox"><span>Confirmo que recibí el pago en el juego</span></label>`;
    checkout.querySelector('.modal-actions').before(confirmation);

    function scope() { const s = api.state(); return s.profile ? `bs_aux_favorites:${s.profile.store_id}:${s.profile.user_id}` : ''; }
    function stamp() { const s = api.state(); return JSON.stringify([s.profile?.user_id, s.calc.lines.map(p => [p.id,p.qty,p.price,p.active,p.restriction]),s.calc.total,s.calc.client,s.calc.d,s.calc.pct]); }
    function saveFavorites() { try { localStorage.setItem(lastScope, JSON.stringify(favorites)); } catch { api.toast('No se pudieron guardar los favoritos en este navegador.'); } }
    function renderProducts() {
      const s = api.state(), q = core.key($('bsSearch').value);
      const rows = s.products.filter(p => p.active && (tab === 'all' || (tab === 'combos' ? p.category === 'combos' : favorites.includes(p.id))) && (!q || core.key(p.name).includes(q)));
      $('bsProducts').innerHTML = rows.map(p => `<article class="bs-product"><button class="bs-favorite ${favorites.includes(p.id)?'selected':''}" data-bs-fav="${e(p.id)}" aria-label="${favorites.includes(p.id)?'Quitar de':'Agregar a'} favoritos: ${e(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('star')}</button><button class="bs-pick" data-bs-add="${e(p.id)}" aria-label="Agregar una unidad de ${e(p.name)}">${api.art(p,true)}<strong>${e(p.name)}</strong><div><b>${m(p.price)}</b><span class="bs-plus">${icon('plus')}</span></div>${p.restriction?`<small>${e(p.restriction.toUpperCase())}</small>`:''}</button><div class="bs-bulk-add"><label for="bsBulk-${e(p.id)}">Cantidad</label><div><input id="bsBulk-${e(p.id)}" data-bs-bulk-qty="${e(p.id)}" type="number" min="1" max="9999" step="1" value="1" inputmode="numeric" aria-label="Cantidad de ${e(p.name)}"><button data-bs-add-qty="${e(p.id)}" aria-label="Agregar cantidad indicada de ${e(p.name)}">Añadir</button></div></div></article>`).join('') || '<p class="bs-empty">No hay productos aquí. Abre Menú y marca tus favoritos con la estrella.</p>';
    }
    function clientInfo() {
      const q = core.key($('bsClient').value), found = customerGroups.find(c => c.key === q);
      $('bsCustomers').innerHTML = customerGroups.filter(c => !q || c.key.includes(q)).slice(0,12).map(c => `<option value="${e(c.label)}">${c.count} compra${c.count === 1?'':'s'}</option>`).join('');
      $('bsClientHint').textContent = found ? `${found.count} compra${found.count===1?'':'s'} registrada${found.count===1?'':'s'}${found.count>1?' · Cliente frecuente':''}` : q ? 'Nuevo cliente' : 'Obligatorio para continuar';
      $('bsRepeat').hidden = !found;
      $('bsReview').disabled = !q || !api.state().calc.lines.length || busy || api.state().saving;
    }
    function refresh() {
      const s = api.state(); if (!s.profile) return;
      const nextScope = scope();
      if (lastScope !== nextScope) {
        lastScope = nextScope;
        try { const saved = JSON.parse(localStorage.getItem(lastScope)||'null'); favorites = Array.isArray(saved) ? saved.filter(x => typeof x === 'string') : s.products.filter(p=>p.active&&p.category==='combos').slice(0,4).map(p=>p.id); }
        catch { favorites = []; }
        $('bsClient').value = '';
      }
      customerGroups = core.customers(s.sales);
      renderProducts(); clientInfo();
      $('bsCount').textContent = s.calc.lines.reduce((sum,p)=>sum+p.qty,0);
      $('bsLines').innerHTML = s.calc.lines.map(p => `<div class="bs-line"><img src="assets/food/${api.photo(p)}-thumb.webp" alt=""><div><strong>${e(p.name)}</strong><small>${m(p.price)} c/u</small></div><div class="bs-qty"><button data-bs-qty="${e(p.id)}" data-delta="-1" aria-label="Restar ${e(p.name)}">${icon('minus')}</button><input class="bs-qty-input" data-bs-line-qty="${e(p.id)}" type="number" min="1" max="9999" step="1" value="${p.qty}" inputmode="numeric" aria-label="Cantidad de ${e(p.name)}"><button data-bs-qty="${e(p.id)}" data-delta="1" aria-label="Sumar ${e(p.name)}">${icon('plus')}</button></div><strong>${m(p.lineTotal)}</strong></div>`).join('') || '<div class="bs-empty-order"><img src="assets/burgershot-logo.webp" alt=""><strong>Tu próxima orden</strong><span>Elige algo del menú para empezar.</span></div>';
      $('bsDiscount').innerHTML = $('discountSelect').innerHTML;
      $('bsDiscount').value = $('discountSelect').value; $('bsType').value = s.calc.client;
      $('bsDiscountName').textContent = s.calc.blocked ? 'Sin convenio' : s.calc.d.name;
      $('bsDiscountNote').textContent = $('discountNote').textContent;
      $('bsTotal').textContent = m(s.calc.total); $('bsEarning').textContent = `${m(s.calc.earning)} de comisión · ${s.calc.pct}%`;
      $('bsCashier').textContent = `${s.profile.name} · Registro manual`;
      $('bsSync').textContent = $('syncText').textContent;
      $('bsSync').classList.toggle('is-error', $('sync').classList.contains('error'));
      $('bsCopy').disabled = !s.calc.lines.length;
      $('bsClear').disabled = !s.calc.lines.length;
      if (reviewActive && reviewStamp !== stamp()) { stale = true; $('bsPaid').checked = false; }
      syncReview();
    }
    function openWindow() {
      const url = new URL(location.href); url.searchParams.set('auxiliar','1');
      const win = window.open(url.href, 'BurgerShotAuxiliar', 'popup,width=490,height=850,resizable=yes,scrollbars=yes');
      if (!win) api.toast('Permite ventanas emergentes para abrir la caja auxiliar.');
      else { win.focus(); api.toast('La nueva ventana empieza con su propia orden.'); }
    }
    panel.addEventListener('click', ev => {
      const t = ev.target.closest('button'); if (!t) return;
      if (t.dataset.bsTab) { tab=t.dataset.bsTab; panel.querySelectorAll('[data-bs-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===t))); renderProducts(); }
      if (t.dataset.bsAdd) { $('bsSuccess').hidden=true; api.add(t.dataset.bsAdd); }
      if (t.dataset.bsAddQty) { const input=t.closest('.bs-bulk-add')?.querySelector('[data-bs-bulk-qty]'); $('bsSuccess').hidden=true; api.add(t.dataset.bsAddQty,input?.value||1); if(input)input.value='1'; }
      if (t.dataset.bsFav) { const id=t.dataset.bsFav; favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];saveFavorites();renderProducts(); }
      if (t.dataset.bsQty) api.quantity(t.dataset.bsQty, Number(t.dataset.delta));
    });
    const setAuxLineQuantity=e=>{
      const input=e.target.closest('[data-bs-line-qty]');if(!input)return;
      const value=core.quantity(input.value,true);
      if(value===null||value===0){input.value=String(api.state().calc.lines.find(p=>p.id===input.dataset.bsLineQty)?.qty||1);return api.toast('La cantidad debe ser un entero entre 1 y 9,999. Usa Quitar para eliminar el producto.');}
      const current=api.state().calc.lines.find(p=>p.id===input.dataset.bsLineQty)?.qty;
      if(current===value)return;
      api.setQuantity(input.dataset.bsLineQty,value);
    };
    $('bsLines').addEventListener('change',setAuxLineQuantity);
    $('bsLines').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.matches('[data-bs-line-qty]')){ev.preventDefault();setAuxLineQuantity(ev);ev.target.blur();}});
    $('bsSearch').oninput=renderProducts;
    $('bsClient').oninput=clientInfo;
    $('bsType').onchange=()=>api.options($('bsType').value,$('bsDiscount').value);
    $('bsDiscount').onchange=()=>api.options($('bsType').value,$('bsDiscount').value);
    $('bsClear').onclick=()=>{if(confirm('¿Vaciar esta orden?'))api.clear();};
    $('bsWindow').onclick=openWindow;
    $('bsExit').onclick=()=>{document.body.classList.remove('bs-focused');api.navigate('pos');};
    $('bsLogout').onclick=()=>{if(confirm('¿Cerrar tu sesión? La orden sin registrar se descartará.'))api.logout();};
    if(window.burgerDesktop){
      $('bsPin').hidden=false; $('bsWindow').hidden=true;
      window.burgerDesktop.isPinned().then(on=>$('bsPin').setAttribute('aria-pressed',String(on)));
      $('bsPin').onclick=async()=>{try{const on=await window.burgerDesktop.togglePin();$('bsPin').setAttribute('aria-pressed',String(on));api.toast(on?'Ventana fijada encima':'Ventana sin fijar');}catch{api.toast('No se pudo cambiar la posición de la ventana.');}};
    }
    $('bsCopy').onclick=async()=>{const text=`Tu pedido son ${m(api.state().calc.total)}.`;try{if(window.burgerDesktop)await window.burgerDesktop.copyText(text);else await navigator.clipboard.writeText(text);api.toast('Total copiado. Pégalo en el chat del juego.');}catch{prompt('Copia este mensaje:',text);}};
    $('bsRepeat').onclick=()=>{
      const s=api.state(), customer=customerGroups.find(c=>c.key===core.key($('bsClient').value));
      const result=core.repeat(customer?.last,s.products);
      if(result.error)return api.toast(result.error);
      if(s.calc.lines.length&&!confirm('¿Reemplazar la orden actual por la última compra de este cliente?'))return;
      api.replace(result);api.toast('Compra repetida con los precios y convenios vigentes. Revisa el total.');
    };
    $('bsReview').onclick=()=>{if(!$('bsClient').value.trim())return api.toast('Escribe el nombre o ID del cliente.');api.checkout();};

    function isOpen(){return reviewActive&&!$('checkoutModal').classList.contains('hidden');}
    function syncReview(){
      if(!reviewActive)return;
      const s=api.state();
      const message=core.review({client:$('saleClient').value,received:$('bsReceived').value,total:s.calc.total,hasItems:s.calc.lines.length>0,confirmed:$('bsPaid').checked,busy,stale});
      $('bsReviewStatus').textContent=message||'Importe y cliente revisados. Listo para registrar.';
      $('bsReviewStatus').classList.toggle('is-ok',!message);
      $('confirmSaleBtn').disabled=!!message||s.saving;
      $('confirmSaleBtn').setAttribute('aria-disabled',String($('confirmSaleBtn').disabled));
      $('confirmSaleBtn').title=message;
    }
    function stopWorker(){if(worker){void worker.terminate();worker=null;} }
    function removeImage(){
      epoch++;stopWorker();busy=false;source=null;crop=null;drag=null;
      $('bsCanvas').width=1;$('bsCanvas').height=1;
      if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}
      $('bsCanvasWrap').hidden=true;$('bsCropHint').hidden=true;$('bsRead').disabled=true;
      $('bsResetCrop').hidden=true;$('bsRemoveImage').hidden=true;$('bsRawDetails').hidden=true;
      $('bsRawText').textContent='';$('bsFile').value='';$('bsPaid').checked=false;
      $('bsOcrStatus').textContent='La captura se procesa en este dispositivo. También puedes escribir los datos.';
      syncReview();
    }
    function onCheckout(){
      removeImage();
      reviewActive=panel.classList.contains('active');stale=false;reviewStamp=stamp();
      $('bsCapture').hidden=!reviewActive;$('bsConfirmation').hidden=!reviewActive;
      $('checkoutModal').classList.toggle('bs-review-modal',reviewActive);
      $('bsReceived').value='';$('bsPaid').checked=false;
      $('confirmSaleBtn').textContent=reviewActive?'Confirmar y registrar':'Registrar venta';
      if(reviewActive){$('saleClient').value=$('bsClient').value.trim();$('checkoutModal').querySelector('h2').textContent='Revisar cobro';}
      else $('checkoutModal').querySelector('h2').textContent='Cobrar orden';
      syncReview();
    }
    for(const id of ['saleClient','bsReceived'])$(id).addEventListener('input',()=>{$('bsPaid').checked=false;if(id==='saleClient')$('saleClient').setCustomValidity('');syncReview();});
    $('bsPaid').onchange=syncReview;
    document.querySelectorAll('[data-close="checkoutModal"]').forEach(b=>b.addEventListener('click',()=>{removeImage();reviewActive=false;}));
    function draw(){
      if(!source)return;const canvas=$('bsCanvas'),ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
      if(crop){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,crop.x*source.width/canvas.width,crop.y*source.height/canvas.height,crop.w*source.width/canvas.width,crop.h*source.height/canvas.height,crop.x,crop.y,crop.w,crop.h);ctx.strokeStyle='#efb649';ctx.lineWidth=3;ctx.strokeRect(crop.x,crop.y,crop.w,crop.h);}
    }
    async function loadImage(blob){
      if(!isOpen()||busy)return;
      if(!['image/png','image/jpeg','image/webp'].includes(blob.type)||blob.size>12*1024*1024)return api.toast('Elige una imagen PNG, JPG o WebP de hasta 12 MB.');
      removeImage();const token=epoch;imageURL=URL.createObjectURL(blob);const img=new Image();
      try{img.src=imageURL;await img.decode();if(token!==epoch||!isOpen())return;
        if(img.naturalWidth*img.naturalHeight>24000000)throw Error('La imagen es demasiado grande. Recorta solo el aviso del pago.');
        source=img;const canvas=$('bsCanvas'),scale=Math.min(1,1400/img.width);canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);draw();
        $('bsCanvasWrap').hidden=false;$('bsCropHint').hidden=false;$('bsRead').disabled=false;$('bsResetCrop').hidden=false;$('bsRemoveImage').hidden=false;
        $('bsOcrStatus').textContent='Marca el aviso si es necesario y pulsa Leer captura.';
      }catch(err){if(token===epoch){removeImage();api.toast(err.message||'No se pudo abrir la imagen.');}}
    }
    $('bsFile').onchange=()=>{const f=$('bsFile').files[0];if(f)void loadImage(f);};
    document.addEventListener('paste',ev=>{if(!isOpen()||busy)return;const item=[...(ev.clipboardData?.items||[])].find(x=>x.kind==='file'&&x.type.startsWith('image/'));if(item){ev.preventDefault();const f=item.getAsFile();if(f)void loadImage(f);}});
    $('bsPaste').onclick=async()=>{
      try{
        if(window.burgerDesktop){const data=await window.burgerDesktop.pasteImage();if(!data)return api.toast('El portapapeles no contiene una imagen. Usa Win + Shift + S.');return loadImage(await(await fetch(data)).blob());}
        const items=await navigator.clipboard.read();
        for(const item of items){const type=item.types.find(x=>['image/png','image/jpeg','image/webp'].includes(x));if(type)return loadImage(await item.getType(type));}
        api.toast('Copia una captura con Win + Shift + S.');
      }catch{api.toast('Pega con Ctrl + V o usa Elegir imagen.');}
    };
    function point(ev){const canvas=$('bsCanvas'),r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(ev.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(ev.clientY-r.top)*canvas.height/r.height))};}
    $('bsCanvas').onpointerdown=ev=>{if(!source||busy)return;drag=point(ev);crop=null;$('bsCanvas').setPointerCapture(ev.pointerId);};
    $('bsCanvas').onpointermove=ev=>{if(!drag)return;const end=point(ev);crop={x:Math.min(drag.x,end.x),y:Math.min(drag.y,end.y),w:Math.abs(end.x-drag.x),h:Math.abs(end.y-drag.y)};draw();};
    $('bsCanvas').onpointerup=()=>{if(crop&&(crop.w<10||crop.h<10))crop=null;drag=null;draw();};
    $('bsCanvas').onpointercancel=()=>{drag=null;crop=null;draw();};
    $('bsResetCrop').onclick=()=>{if(busy)return;crop=null;draw();};
    $('bsRemoveImage').onclick=removeImage;
    function library(){
      if(window.Tesseract)return Promise.resolve(window.Tesseract);
      if(!scriptLoading)scriptLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/ocr/tesseract.min.js';script.onload=()=>resolve(window.Tesseract);script.onerror=()=>{scriptLoading=null;script.remove();reject(Error('No se cargó el lector. Actualiza también la carpeta assets/ocr.'));};document.head.append(script);});
      return scriptLoading;
    }
    async function recognize(){
      if(!source||busy||!isOpen())return;
      busy=true;$('bsPaid').checked=false;$('bsRead').disabled=true;syncReview();const token=++epoch;
      let timeoutId;
      try{
        const canvas=$('bsCanvas'),region=crop||{x:0,y:0,w:canvas.width,h:canvas.height};
        const output=document.createElement('canvas');const ratio=source.width/canvas.width;
        const scale=Math.min(2,2400/(region.w*ratio),1800/(region.h*ratio));
        output.width=Math.max(1,Math.round(region.w*ratio*scale));output.height=Math.max(1,Math.round(region.h*ratio*scale));
        output.getContext('2d').drawImage(source,region.x*ratio,region.y*ratio,region.w*ratio,region.h*ratio,0,0,output.width,output.height);
        $('bsOcrStatus').textContent='Preparando lector… La primera lectura puede tardar.';
        currentWorkerTask=(async()=>{
          const T=await library();if(token!==epoch)return null;
          const w=await T.createWorker('spa+eng',1,{workerPath:new URL('assets/ocr/worker.min.js',location.href).href,corePath:new URL('assets/ocr/tesseract-core-lstm.wasm.js',location.href).href,langPath:new URL('assets/ocr',location.href).href,logger:info=>{if(token===epoch&&info.status==='recognizing text')$('bsOcrStatus').textContent=`Leyendo captura… ${Math.round(info.progress*100)}%`;}});
          if(token!==epoch){await w.terminate();return null;}worker=w;await worker.setParameters({tessedit_pageseg_mode:'11'});
          return (await worker.recognize(output)).data.text;
        })();
        const text=await Promise.race([currentWorkerTask,new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(Error('La lectura tardó demasiado. Recorta el aviso o escribe los datos.')),60000);})]);
        if(token!==epoch||!isOpen()||text===null)return;
        const result=core.readPayment(text);$('bsRawText').textContent=text.trim()||'No se detectó texto.';$('bsRawDetails').hidden=false;
        if(result.client)$('saleClient').value=result.client;
        $('bsReceived').value=result.amount===null?'':result.amount.toFixed(2);
        $('bsOcrStatus').textContent=result.ambiguous?'Se detectaron varios importes. Recorta solo el aviso o escribe el correcto.':result.amount===null?'No se reconoció un importe único. Escribe el recibido.':'Lectura terminada. Revisa el nombre y el importe antes de confirmar.';
      }catch(err){if(token===epoch)$('bsOcrStatus').textContent=err.message||'No se pudo leer. Puedes escribir los datos.';}
      finally{clearTimeout(timeoutId);if(token===epoch){epoch++;stopWorker();busy=false;$('bsRead').disabled=!source;syncReview();}}
    }
    $('bsRead').onclick=recognize;
    window.addEventListener('beforeunload',stopWorker);
    return {
      refresh,onCheckout,syncReview,
      afterAuth(){if(firstAuth){firstAuth=false;if(focused)api.navigate('companion');}},
      validateCheckout(){if(!reviewActive)return true;syncReview();if($('confirmSaleBtn').disabled){api.toast($('bsReviewStatus').textContent||'Revisa el cobro.');return false;}return true;},
      saved(){if(reviewActive){$('bsClient').value='';$('bsSuccess').textContent='Venta registrada. Lista para la siguiente orden.';$('bsSuccess').hidden=false;}removeImage();reviewActive=false;},
      reset(){removeImage();reviewActive=false;lastScope='';favorites=[];customerGroups=[];firstAuth=true;$('bsClient').value='';$('bsCustomers').innerHTML='';$('bsSuccess').hidden=true;},
      isReview(){return reviewActive;}
    };
  }};
})();
