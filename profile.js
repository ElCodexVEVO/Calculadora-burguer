(function(){
  'use strict';
  const core=window.BurgerProfileCore;
  window.BurgerProfiles={mount(api){
    const {$,esc,money,toast,state,roleName,switchPage}=api;
    let rows=[],urls=new Map(),signedExpiry=new Map(),owner='',loadVersion=0,editVersion=0,available=false,busy=false,effectsBusy=false,image=null,imageURL='',drag=null,refreshTimer;
    const status=$('profileStatus'),modal=$('photoEditor'),canvas=$('photoCrop');
    const own=()=>rows.find(r=>r.user_id===state().user?.id);
    const modeKey=()=>`bs_effects_${state().user?.id||'guest'}`;
    function setMode(mode){if(!core.MODES.includes(mode))mode='balanced';document.body.dataset.effects=mode;document.body.classList.toggle('motion-off',mode==='performance');if($('motionToggle'))$('motionToggle').checked=mode!=='performance';document.querySelectorAll('[data-effects-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.effectsMode===mode))});try{localStorage.setItem(modeKey(),mode)}catch{}}
    function localMode(){try{return localStorage.getItem(modeKey())||'balanced'}catch{return 'balanced'}}
    async function load(){
      const {sb,user,profile}=state();if(!sb||!user||!profile)return;
      const key=user.id+':'+profile.store_id,version=++loadVersion;if(owner!==key){owner=key;rows=[];urls.clear();signedExpiry.clear();setMode(localMode())}
      const {data,error}=await sb.from('employee_appearance').select('*').eq('store_id',profile.store_id);
      if(version!==loadVersion||state().user?.id!==user.id)return;
      available=!error;if(error){status.textContent='Las fotografías y la sincronización de efectos requieren activar la actualización de Supabase. Tus ventas siguen disponibles.';status.classList.remove('hidden');render();return}
      status.textContent='';status.classList.add('hidden');rows=data||[];
      const paths=[...new Set(rows.map(r=>r.photo_path).filter(Boolean))];const next=new Map();
      const missing=paths.filter(path=>{if(urls.has(path)&&(signedExpiry.get(path)||0)>Date.now()+60000){next.set(path,urls.get(path));return false}return true});
      if(missing.length){const result=await sb.storage.from('employee-avatars').createSignedUrls(missing,900);if(version!==loadVersion)return;if(!result.error)for(const item of result.data||[])if(item.signedUrl){next.set(item.path,item.signedUrl);signedExpiry.set(item.path,Date.now()+900000)}}
      for(const path of signedExpiry.keys())if(!paths.includes(path))signedExpiry.delete(path);
      urls=next;setMode(own()?.effects_mode||localMode());render();clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(state().user)load()},12*60*1000);
    }
    function avatarHTML(id,name,fallback=''){const row=rows.find(r=>r.user_id===id),url=urls.get(row?.photo_path)||(/^https:\/\//.test(fallback)?fallback:'');return url?`<img src="${esc(url)}" alt="" loading="lazy" decoding="async">`:`<span>${esc(core.initials(name))}</span>`}
    function avatars(){
      const {profile}=state();if(!profile)return;
      for(const id of ['avatar','topAvatar']){$(id).dataset.profileAvatar=profile.user_id;$(id).dataset.profileName=profile.name}
      document.querySelectorAll('[data-profile-avatar]').forEach(el=>{const html=avatarHTML(el.dataset.profileAvatar,el.dataset.profileName,el.dataset.profileFallback);if(el.dataset.avatarSignature!==html){el.innerHTML=html;el.dataset.avatarSignature=html;el.classList.add('profile-avatar');el.querySelector('img')?.addEventListener('error',()=>{el.textContent=core.initials(el.dataset.profileName);delete el.dataset.avatarSignature},{once:true})}});
    }
    function render(){
      const {profile,user,sales,employeeWeek}=state();if(!profile||!user)return;avatars();
      if(!$('page-profile').classList.contains('active'))return;
      $('profileName').textContent=profile.name;$('profileRole').textContent=roleName(profile);$('profileUsername').textContent=profile.username?'@'+profile.username:'Sin identificador público';
      $('profileJoined').textContent=profile.created_at?new Intl.DateTimeFormat('es-MX',{dateStyle:'long'}).format(new Date(profile.created_at)):'Fecha no registrada';
      $('profileActive').textContent=profile.active?'Cuenta activa':'Cuenta inactiva';
      $('profilePortrait').dataset.profileAvatar=user.id;$('profilePortrait').dataset.profileName=profile.name;
      const p=core.periods(),week=core.stats(sales,user.id,p.week),month=core.stats(sales,user.id,p.month),all=core.stats(sales,user.id);
      $('profileStats').innerHTML=[['Ventas activas',all.count,'Historial disponible'],['Vendido este mes',money(month.generated),'Desde el día 1'],['Comisiones del mes',money(month.earnings),'Ventas activas'],['Ventas esta semana',week.count,money(week.generated)+' generado']].map(([label,value,note])=>`<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
      const weekKey=[p.week.getFullYear(),String(p.week.getMonth()+1).padStart(2,'0'),String(p.week.getDate()).padStart(2,'0')].join('-');
      const recognized=employeeWeek?.employee_id===user.id&&employeeWeek.week_start===weekKey;
      $('profileRecognition').textContent=recognized?'Empleado de la semana · reconocimiento de administración':'No hay reconocimientos vigentes registrados para tu cuenta.';
      const history=sales.filter(s=>s.created_by===user.id).slice(0,5);
      $('profileHistory').innerHTML=history.length?history.map(s=>`<div class="profile-history-row"><div><strong>Venta ${esc(s.sale_number||'')}</strong><small>${esc(new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s.created_at)))}</small></div><span>${s.status==='active'?'Activa':'Anulada'}</span><strong>${money(s.total)}</strong></div>`).join(''):'<p class="muted">Tu historial aparecerá cuando registres tu primera venta.</p>';
      $('editPhotoBtn').disabled=!available;avatars();
    }
    function reset(){ $('photoZoom').value='1';$('photoX').value='0';$('photoY').value='0';draw() }
    function draw(){
      const ctx=canvas.getContext('2d'),preview=$('photoPreview').getContext('2d');
      if(!image){ctx.clearRect(0,0,300,300);preview.clearRect(0,0,100,100);return}
      const c=core.crop(image.naturalWidth,image.naturalHeight,$('photoZoom').value,Number($('photoX').value),Number($('photoY').value));
      ctx.fillStyle='#fff0df';ctx.fillRect(0,0,300,300);ctx.drawImage(image,c.sx,c.sy,c.size,c.size,0,0,300,300);
      preview.clearRect(0,0,100,100);preview.drawImage(canvas,0,0,100,100);
    }
    function release(){editVersion++;if(imageURL)URL.revokeObjectURL(imageURL);imageURL='';image=null;drag=null}
    function close(){if(busy)return;modal.classList.add('hidden');$('app').inert=false;release();$('editPhotoBtn').focus()}
    function open(){if(!available)return toast('Activa primero la actualización de Supabase.');release();$('photoFile').value='';$('photoError').textContent='';$('photoProgress').textContent='Elige una imagen para comenzar.';$('savePhotoBtn').disabled=true;$('deletePhotoBtn').disabled=!own()?.photo_path;reset();modal.classList.remove('hidden');$('app').inert=true;$('photoFile').focus()}
    $('editPhotoBtn').onclick=open;$('cancelPhotoBtn').onclick=close;$('closePhotoBtn').onclick=close;$('resetPhotoBtn').onclick=reset;
    $('photoFile').onchange=async()=>{
      const file=$('photoFile').files?.[0];if(!file)return;
      try{core.validateFile(file);release();const version=editVersion;imageURL=URL.createObjectURL(file);const next=new Image();next.src=imageURL;await next.decode();if(version!==editVersion)return;if(next.naturalWidth*next.naturalHeight>32e6)throw Error('La resolución es demasiado grande. Elige una imagen de hasta 32 megapíxeles.');image=next;reset();$('savePhotoBtn').disabled=false;$('photoError').textContent='';$('photoProgress').textContent='Arrastra la imagen o ajusta los controles.'}catch(e){release();$('savePhotoBtn').disabled=true;$('photoError').textContent=e.message}
    };
    for(const id of ['photoZoom','photoX','photoY'])$(id).oninput=draw;
    canvas.onpointerdown=e=>{if(!image||busy)return;drag={x:e.clientX,y:e.clientY,px:Number($('photoX').value),py:Number($('photoY').value)};canvas.setPointerCapture(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag)return;const c=core.crop(image.naturalWidth,image.naturalHeight,$('photoZoom').value),scale=canvas.getBoundingClientRect().width/c.size;const dx=(image.naturalWidth-c.size)*scale/2,dy=(image.naturalHeight-c.size)*scale/2;$('photoX').value=dx?Math.max(-1,Math.min(1,drag.px-(e.clientX-drag.x)/dx)):0;$('photoY').value=dy?Math.max(-1,Math.min(1,drag.py-(e.clientY-drag.y)/dy)):0;draw()};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null};
    async function save(remove=false){
      if(busy||!available||(!remove&&!image))return;
      const {sb,user}=state(),userId=user?.id,expected=own()?.photo_version||0;busy=true;modal.setAttribute('aria-busy','true');modal.querySelectorAll('button,input').forEach(el=>el.disabled=true);$('photoError').textContent='';$('photoProgress').textContent=remove?'Eliminando fotografía…':'Optimizando fotografía…';
      try{
        const {data:authData,error:authError}=await sb.auth.getSession();
        if(authError||authData?.session?.user?.id!==userId||!authData.session.access_token)throw Error('Tu sesión terminó. Inicia sesión y vuelve a intentarlo.');
        const accessToken=authData.session.access_token;
        let blob;
        if(!remove){const output=document.createElement('canvas');output.width=output.height=512;const out=output.getContext('2d'),c=core.crop(image.naturalWidth,image.naturalHeight,$('photoZoom').value,Number($('photoX').value),Number($('photoY').value));out.fillStyle='#fff0df';out.fillRect(0,0,512,512);out.drawImage(image,c.sx,c.sy,c.size,c.size,0,0,512,512);blob=await new Promise(r=>output.toBlob(r,'image/jpeg',.86));if(!blob||blob.size>524288)throw Error('No se pudo optimizar la foto. Prueba otra imagen.')}
        if(state().user?.id!==userId)throw Error('La sesión cambió. Vuelve a elegir tu fotografía.');
        $('photoProgress').textContent='Guardando en tu cuenta…';
        const result=await sb.functions.invoke('profile-photo',{method:remove?'DELETE':'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':remove?'application/json':'image/jpeg','x-photo-version':String(expected)},body:remove?undefined:blob});
        if(result.error){let message='No se pudo guardar. Inténtalo de nuevo.';try{message=(await result.error.context.json()).error||message}catch{}throw Error(message)}
        if(result.data?.error)throw Error(result.data.error);if(!result.data?.appearance)throw Error('El servidor no confirmó la fotografía.');
        if(state().user?.id!==userId)return;
        await load();busy=false;close();toast(remove?'Avatar predeterminado restaurado':'Fotografía actualizada');
      }catch(e){$('photoError').textContent=e.message;$('photoProgress').textContent='Tu foto anterior se conserva. Puedes volver a intentarlo.'}
      finally{busy=false;modal.removeAttribute('aria-busy');modal.querySelectorAll('button,input').forEach(el=>el.disabled=false);$('savePhotoBtn').disabled=!image;$('deletePhotoBtn').disabled=!own()?.photo_path}
    }
    $('savePhotoBtn').onclick=()=>save();$('deletePhotoBtn').onclick=()=>save(true);
    modal.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const targets=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled)')],first=targets[0],last=targets.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}});
    document.querySelectorAll('[data-effects-mode]').forEach(button=>button.onclick=async()=>{
      if(effectsBusy)return;const mode=button.dataset.effectsMode,userId=state().user?.id;setMode(mode);if(!available)return toast('Efectos guardados en este navegador. La sincronización requiere activar Supabase.');
      effectsBusy=true;document.querySelectorAll('[data-effects-mode]').forEach(b=>b.disabled=true);
      try{const {error,data}=await state().sb.rpc('set_my_effects',{p_mode:mode});if(state().user?.id!==userId)return;if(error||!data)return toast('Preferencia local aplicada; no se pudo sincronizar. Inténtalo de nuevo.');const index=rows.findIndex(r=>r.user_id===data.user_id);if(index<0)rows.push(data);else rows[index]=data;toast('Preferencia guardada en tu cuenta')}finally{effectsBusy=false;document.querySelectorAll('[data-effects-mode]').forEach(b=>b.disabled=false)}
    });
    document.addEventListener('bs-motion-toggle',e=>document.querySelector(`[data-effects-mode="${e.detail?'balanced':'performance'}"]`)?.click());
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden')){if(busy){e.preventDefault();e.stopImmediatePropagation()}else close()}},true);
    function clear(){++loadVersion;owner='';available=false;rows=[];urls.clear();signedExpiry.clear();clearTimeout(refreshTimer);busy=false;modal.classList.add('hidden');$('app').inert=false;release();document.querySelectorAll('[data-profile-avatar]').forEach(el=>{el.textContent='BS';delete el.dataset.avatarSignature});setMode('balanced')}
    return{load,render,avatars,avatarHTML,clear};
  }};
})();
