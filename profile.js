(function(){
  'use strict';
  const core=window.BurgerProfileCore;
  window.BurgerProfiles={mount(api){
    const {$,esc,money,toast,state,roleName,switchPage}=api;
    let rows=[],urls=new Map(),signedExpiry=new Map(),owner='',loadVersion=0,editVersion=0,available=false,busy=false,effectsBusy=false,image=null,imageURL='',drag=null,refreshTimer;
    let performancePeriod='week',socialDirty=false,socialBusy=false,socialRequest=0;
    const status=$('profileStatus'),modal=$('photoEditor'),canvas=$('photoCrop');
    const own=()=>rows.find(r=>r.user_id===state().user?.id);
    const modeKey=()=>`bs_effects_${state().user?.id||'guest'}`;
    function setMode(mode){if(!core.MODES.includes(mode))mode='balanced';document.body.dataset.effects=mode;document.body.classList.toggle('motion-off',mode==='performance');if($('motionToggle'))$('motionToggle').checked=mode!=='performance';document.querySelectorAll('[data-effects-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.effectsMode===mode))});try{localStorage.setItem(modeKey(),mode)}catch{}}
    function localMode(){try{return localStorage.getItem(modeKey())||'balanced'}catch{return 'balanced'}}
    async function load(){
      const {sb,user,profile}=state();if(!sb||!user||!profile)return;
      const key=user.id+':'+profile.store_id,version=++loadVersion;if(owner!==key){owner=key;rows=[];urls.clear();signedExpiry.clear();socialDirty=false;performancePeriod='week';setMode(localMode())}
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
      const p=core.periods(),weekly=performancePeriod==='week',summary=core.stats(sales,user.id,weekly?p.week:null,weekly?p.weekEnd:null),fmt=d=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(d),lastDay=new Date(p.weekEnd.getTime()-1);
      $('profilePerformancePeriod').textContent=weekly?`Rendimiento de la semana · ${fmt(p.week)} – ${fmt(lastDay)}`:'Rendimiento total · todo tu historial';
      document.querySelectorAll('[data-profile-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.profilePeriod===performancePeriod)));
      $('profileStats').innerHTML=[['Ventas activas',summary.count,weekly?'Esta semana':'Historial completo'],['Total vendido',money(summary.generated),'Ventas activas'],['Mis comisiones',money(summary.earnings),'Ganancias registradas'],['Ticket promedio',money(summary.count?summary.generated/summary.count:0),'Por venta activa']].map(([label,value,note])=>`<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
      let links={};try{links=core.socialLinks(own()?.social_links||{})}catch{}
      const icons={instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',discord:'<path d="m6 5 4-1 1 2h2l1-2 4 1 3 13-5 2-1-3H9l-1 3-5-2Z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>',tiktok:'<path d="M14 3v12a4 4 0 1 1-4-4m4-8c1 4 3 5 6 5"/>',twitch:'<path d="M4 3h17v12l-5 5h-5l-4 3v-3H4Zm6 4v6m5-6v6"/>'};
      $('profileSocialLinks').innerHTML=Object.entries(links).map(([key,handle])=>{const url=core.socialURL(key,handle),body=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]}</svg><span>${esc(key==='discord'?handle:'@'+handle)}</span>`;return url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(core.SOCIALS[key].label+' de '+profile.name)}">${body}</a>`:`<button type="button" data-copy-discord="${esc(handle)}" aria-label="Copiar usuario de Discord">${body}</button>`}).join('')||'<span class="profile-social-empty">Tus redes, en un solo lugar.</span>';
      if(!socialDirty&&!socialBusy)for(const key of Object.keys(core.SOCIALS))$('social-'+key).value=links[key]||'';
      $('saveSocialBtn').disabled=!available||socialBusy;
      const weekKey=[p.week.getFullYear(),String(p.week.getMonth()+1).padStart(2,'0'),String(p.week.getDate()).padStart(2,'0')].join('-');
      const recognized=employeeWeek?.employee_id===user.id&&employeeWeek.week_start===weekKey;
      $('profileRecognition').textContent=recognized?'Empleado de la semana · reconocimiento de administración':'No hay reconocimientos vigentes registrados para tu cuenta.';
      $('profileHistoryTitle').textContent=weekly?'Actividad de esta semana':'Actividad reciente';
      const history=sales.filter(s=>s.created_by===user.id&&(!weekly||(new Date(s.created_at)>=p.week&&new Date(s.created_at)<p.weekEnd))).slice(0,5);
      $('profileHistory').innerHTML=history.length?history.map(s=>`<div class="profile-history-row"><div><strong>Venta ${esc(s.sale_number||'')}</strong><small>${esc(new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s.created_at)))}</small></div><span>${s.status==='active'?'Activa':'Anulada'}</span><strong>${money(s.total)}</strong></div>`).join(''):'<p class="muted">Tu historial aparecerá cuando registres tu primera venta.</p>';
      $('editPhotoBtn').disabled=!available;avatars();
    }
    document.querySelectorAll('[data-profile-period]').forEach(button=>button.onclick=()=>{performancePeriod=button.dataset.profilePeriod==='all'?'all':'week';render()});
    for(const key of Object.keys(core.SOCIALS))$('social-'+key).addEventListener('input',()=>{socialDirty=true;$('socialStatus').textContent=''});
    $('profileSocialForm').onsubmit=async event=>{
      event.preventDefault();if(socialBusy||!available)return;const userId=state().user?.id;if(!userId)return;
      let links;try{links=core.socialLinks(Object.fromEntries(Object.keys(core.SOCIALS).map(key=>[key,$('social-'+key).value])))}catch(error){$('socialStatus').textContent=error.message;return}
      const request=++socialRequest;socialBusy=true;$('profileSocialForm').setAttribute('aria-busy','true');$('profileSocialForm').querySelectorAll('input,button').forEach(el=>el.disabled=true);$('socialStatus').textContent='Guardando tus redes…';
      try{const {data,error}=await state().sb.rpc('set_my_social_links',{p_user_id:userId,p_links:links});if(request!==socialRequest||state().user?.id!==userId)return;if(error||!data)throw Error('No se pudieron guardar tus redes. Inténtalo de nuevo.');const index=rows.findIndex(row=>row.user_id===userId);if(index<0)rows.push(data);else rows[index]=data;socialDirty=false;$('socialStatus').textContent='Redes guardadas en tu cuenta.';socialBusy=false;render();toast('Redes sociales actualizadas')}
      catch(error){if(request===socialRequest&&state().user?.id===userId)$('socialStatus').textContent=error.message}
      finally{if(request===socialRequest){socialBusy=false;$('profileSocialForm').removeAttribute('aria-busy');$('profileSocialForm').querySelectorAll('input,button').forEach(el=>el.disabled=false);$('saveSocialBtn').disabled=!available}}
    };
    $('profileSocialLinks').onclick=async event=>{const handle=event.target.closest('[data-copy-discord]')?.dataset.copyDiscord;if(!handle)return;try{await navigator.clipboard.writeText(handle);toast('Usuario de Discord copiado')}catch{toast('Discord: '+handle)}};
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
    function clear(){++loadVersion;++socialRequest;owner='';available=false;rows=[];urls.clear();signedExpiry.clear();clearTimeout(refreshTimer);busy=false;socialDirty=false;socialBusy=false;performancePeriod='week';$('profileSocialForm').reset();$('profileSocialForm').removeAttribute('aria-busy');$('profileSocialForm').querySelectorAll('input,button').forEach(el=>el.disabled=false);$('socialStatus').textContent='';$('profileSocialLinks').replaceChildren();modal.classList.add('hidden');$('app').inert=false;release();document.querySelectorAll('[data-profile-avatar]').forEach(el=>{el.textContent='BS';delete el.dataset.avatarSignature});setMode('balanced')}
    return{load,render,avatars,avatarHTML,clear};
  }};
})();
