(function(){
  'use strict';
  const core=window.BurgerProfileCore;
  window.BurgerProfiles={mount(api){
    const {$,esc,money,toast,state,roleName,switchPage}=api,can=api.can||(()=>false);
    let rows=[],urls=new Map(),signedExpiry=new Map(),owner='',loadVersion=0,editVersion=0,available=false,busy=false,effectsBusy=false,image=null,imageURL='',drag=null,refreshTimer;
    /* Glifos de marca (Simple Icons, CC0). Cada red lleva su insignia de color; el fondo lo define polish.css. */
    const GLYPHS={"instagram":"M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077","discord":"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z","tiktok":"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z","twitch":"M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"};
    const badge=key=>GLYPHS[key]?`<span class="soc-badge" data-social="${key}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="${GLYPHS[key]}"/></svg></span>`:'';
    const EXTERNAL='<svg class="soc-hint" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',COPY='<svg class="soc-hint" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>';
    const decorateLabels=()=>document.querySelectorAll('.profile-social-fields label').forEach(l=>{if(l.querySelector('.soc-badge'))return;const key=(l.querySelector('input')?.id||'').replace('social-','');const html=badge(key);if(html)l.insertAdjacentHTML('afterbegin',html)});
    let performancePeriod='week',socialDirty=false,socialBusy=false,socialRequest=0,viewing=null,pendingView=null;
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
    // Perfil que se muestra: el propio o, en modo lectura, el de un compañero del mismo negocio.
    function shown(){const {profile,user,employees=[]}=state();return (viewing&&viewing!==user?.id&&employees.find(e=>e.user_id===viewing&&e.store_id===profile?.store_id))||profile}
    // Abre el perfil de otra persona (o el propio con null). La lectura sigue las reglas de acceso de la app.
    function view(id){pendingView=id&&id!==state().user?.id?String(id):null;switchPage('profile');requestAnimationFrame(()=>$('profileTitle')?.focus({preventScroll:true}))}
    // switchPage lo llama al entrar en Perfil: cualquier otra vía (menú, avatar, atajos) abre el perfil propio.
    function beforeShow(){if(pendingView!==viewing)performancePeriod='week';viewing=pendingView;pendingView=null}
    function renderTeam(current,me){
      const {employees=[]}=state(),manager=can('manage_employees');
      const team=employees.filter(e=>e.active||e.user_id===current).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es'));
      $('profileTeam').innerHTML=team.length>1?team.map(e=>{const mine=e.user_id===me,open=e.user_id===current;return `<li><button type="button" class="profile-team-person" data-view-profile="${esc(e.user_id)}"${open?' aria-current="true"':''}><span class="profile-team-avatar" data-profile-avatar="${esc(e.user_id)}" data-profile-name="${esc(e.name)}" aria-hidden="true">${esc(core.initials(e.name))}</span><span class="profile-team-copy"><strong>${esc(e.name)}${mine?' <small>(tú)</small>':''}</strong>${manager?`<small>${esc(roleName(e))}</small>`:''}</span></button></li>`}).join(''):'<li class="profile-team-empty">Todavía no hay compañeros registrados en este negocio.</li>';
    }
    function render(){
      const {profile,user,sales,employeeWeek,employees=[]}=state();if(!profile||!user)return;avatars();
      if(!$('page-profile').classList.contains('active'))return;
      if(viewing&&viewing!==user.id&&!employees.some(e=>e.user_id===viewing)){viewing=null;toast('Ese perfil ya no está disponible')}
      const person=shown(),id=person.user_id,self=id===user.id,first=String(person.name||'').trim().split(/\s+/)[0]||'esta persona';
      // De otra persona: rol, estado y comisiones solo para quien gestiona el equipo; historial de ventas y periodo total solo con permiso de reportes.
      const manager=can('manage_employees'),showRole=self||manager,showMoney=self||manager,showHistory=self||can('view_reports'),allPeriods=self||manager||can('view_reports');
      if(!allPeriods)performancePeriod='week';
      $('page-profile').classList.toggle('is-other',!self);
      $('profileTitle').textContent=self?'Mi perfil':'Perfil de '+person.name;
      $('profileSubtitle').textContent=self?'Tu identidad y tu actividad en Burger Shot.':'Compañero de Burger Shot. Solo lectura.';
      $('profileMySalesBtn').hidden=!self;$('profileBackBtn').hidden=self;
      $('profileName').textContent=person.name;
      $('profileRole').hidden=!showRole;$('profileRole').textContent=showRole?roleName(person):'';
      $('profileUsername').textContent=person.username?'@'+person.username:'Sin identificador público';
      $('profileJoined').textContent=person.created_at?new Intl.DateTimeFormat('es-MX',{dateStyle:'long'}).format(new Date(person.created_at)):'Fecha no registrada';
      $('profileActive').hidden=!showRole;$('profileActive').textContent=person.active?'Cuenta activa':'Cuenta inactiva';
      $('profilePortrait').dataset.profileAvatar=id;$('profilePortrait').dataset.profileName=person.name;
      const p=core.periods(),weekly=performancePeriod==='week',summary=core.stats(sales,id,weekly?p.week:null,weekly?p.weekEnd:null),fmt=d=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(d),lastDay=new Date(p.weekEnd.getTime()-1);
      $('profilePerformanceTitle').textContent=self?'Mi rendimiento':'Rendimiento';
      $('profilePerformancePeriod').textContent=weekly?`Rendimiento de la semana · ${fmt(p.week)} – ${fmt(lastDay)}`:(self?'Rendimiento total · todo tu historial':'Rendimiento total · todo su historial');
      $('profilePeriodPicker').hidden=!allPeriods;
      document.querySelectorAll('[data-profile-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.profilePeriod===performancePeriod)));
      const stats=[['Ventas activas',summary.count,weekly?'Esta semana':'Historial completo'],['Total vendido',money(summary.generated),'Ventas activas']];
      if(showMoney)stats.push([self?'Mis comisiones':'Comisiones',money(summary.earnings),'Ganancias registradas']);
      stats.push(['Ticket promedio',money(summary.count?summary.generated/summary.count:0),'Por venta activa']);
      $('profileStats').dataset.count=String(stats.length);
      $('profileStats').innerHTML=stats.map(([label,value,note])=>`<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
      $('profilePerformanceNote').textContent=self?'Solo tus ventas activas. Las ventas anuladas no se suman.':'Solo ventas activas de '+first+'. Las ventas anuladas no se suman.';
      let links={};try{links=core.socialLinks(rows.find(r=>r.user_id===id)?.social_links||{})}catch{}
      decorateLabels();
      $('profileSocialLinks').innerHTML=Object.entries(links).map(([key,handle])=>{const url=core.socialURL(key,handle),body=`${badge(key)}<span>${esc(key==='discord'?handle:'@'+handle)}</span>`;return url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-social="${key}" aria-label="${esc(core.SOCIALS[key].label+' de '+person.name)}">${body}${EXTERNAL}</a>`:`<button type="button" data-copy-discord="${esc(handle)}" data-social="${key}" aria-label="Copiar usuario de Discord de ${esc(person.name)}">${body}${COPY}</button>`}).join('')||(self?'<span class="profile-social-empty">Tus redes, en un solo lugar.</span>':'<span class="profile-social-empty">Sin redes sociales agregadas.</span>');
      if(self&&!socialDirty&&!socialBusy)for(const key of Object.keys(core.SOCIALS))$('social-'+key).value=links[key]||'';
      $('saveSocialBtn').disabled=!available||socialBusy;
      const weekKey=[p.week.getFullYear(),String(p.week.getMonth()+1).padStart(2,'0'),String(p.week.getDate()).padStart(2,'0')].join('-');
      const recognized=employeeWeek?.employee_id===id&&employeeWeek.week_start===weekKey;
      $('profileRecognition').textContent=recognized?'Empleado de la semana · reconocimiento de administración':(self?'No hay reconocimientos vigentes registrados para tu cuenta.':'Sin reconocimientos vigentes.');
      $('profileHistory').closest('section').hidden=!showHistory;
      $('profileHistoryTitle').textContent=weekly?'Actividad de esta semana':'Actividad reciente';
      const history=showHistory?sales.filter(s=>s.created_by===id&&(!weekly||(new Date(s.created_at)>=p.week&&new Date(s.created_at)<p.weekEnd))).slice(0,5):[];
      $('profileHistory').innerHTML=history.length?history.map(s=>`<div class="profile-history-row"><div><strong>Venta ${esc(s.sale_number||'')}</strong><small>${esc(new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s.created_at)))}</small></div><span>${s.status==='active'?'Activa':'Anulada'}</span><strong>${money(s.total)}</strong></div>`).join(''):(self?'<p class="muted">Tu historial aparecerá cuando registres tu primera venta.</p>':'<p class="muted">Sin ventas en este periodo.</p>');
      $('profileSocialEditorPanel').hidden=!self;$('profileEffectsPanel').hidden=!self;$('editPhotoBtn').hidden=!self;
      renderTeam(id,user.id);
      $('editPhotoBtn').disabled=!available;avatars();
    }
    document.querySelectorAll('[data-profile-period]').forEach(button=>button.onclick=()=>{performancePeriod=button.dataset.profilePeriod==='all'?'all':'week';render()});
    // Cualquier [data-view-profile] (inicio, restaurante, equipo, lista de compañeros) abre ese perfil; dentro de una ventana, la cierra antes.
    document.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-view-profile]');if(!trigger||trigger.disabled||!state().user)return;event.preventDefault();event.stopPropagation();trigger.closest('.modal-backdrop')?.querySelector('[data-close]')?.click();view(trigger.dataset.viewProfile)});
    $('profileBackBtn').onclick=()=>view(null);
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
    function clear(){++loadVersion;++socialRequest;owner='';viewing=null;pendingView=null;available=false;rows=[];urls.clear();signedExpiry.clear();clearTimeout(refreshTimer);busy=false;socialDirty=false;socialBusy=false;performancePeriod='week';$('profileSocialForm').reset();$('profileSocialForm').removeAttribute('aria-busy');$('profileSocialForm').querySelectorAll('input,button').forEach(el=>el.disabled=false);$('socialStatus').textContent='';$('profileSocialLinks').replaceChildren();modal.classList.add('hidden');$('app').inert=false;release();document.querySelectorAll('[data-profile-avatar]').forEach(el=>{el.textContent='BS';delete el.dataset.avatarSignature});setMode('balanced')}
    return{load,render,avatars,avatarHTML,clear,view,beforeShow,viewing:()=>viewing};
  }};
})();
