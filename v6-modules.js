/* V6 modules: use the existing session and Supabase client, never a second identity. */
window.BurgerV6={mount(api){
'use strict';
const {$,esc,money,normalize,can,isAdmin,toast,fmtDate,metricHTML,state}=api,core=window.BurgerV6Core;
let roles=[],customers=[],promotions=[],available=false,loadError='',selectedRole='manager',selectedPromotion='',approvedCode='',busy=false,lastModalFocus=null;
const permissions=[['edit_orders','Ventas','Editar órdenes abiertas'],['manage_catalog','Catálogo','Crear, editar y eliminar productos y convenios'],['manage_employees','Equipo','Gestionar cuentas mediante el servicio de empleados'],['view_reports','Reportes','Consultar ventas y exportar reportes'],['manage_payouts','Cortes','Registrar pagos y consultar cortes'],['view_audit','Auditoría','Consultar el historial de movimientos'],['manage_customers','Clientes','Crear y editar fichas de clientes frecuentes'],['manage_promotions','Promociones','Crear, editar, pausar y eliminar promociones'],['apply_promotions','Caja','Aplicar promociones y cupones al pedido']];
const roleNames={admin:'Administrador',manager:'Gerente',supervisor:'Supervisor',cashier:'Cajero'};
const empty=(label)=>`<div class="v6-empty">${esc(label)}</div>`;
const getRole=p=>p.role==='admin'?'Administrador':roles.find(r=>r.id===p.access_role_id)?.name||'Permisos individuales';
const input=(id,label,value='',attrs='')=>`<div><label for="${id}">${label}</label><input id="${id}" value="${esc(value)}" ${attrs}></div>`;
const select=(id,label,options,value)=>`<div><label for="${id}">${label}</label><select id="${id}">${options.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
const run=async(fn,button)=>{if(busy)return;busy=true;if(button)button.disabled=true;try{await fn()}catch(e){if(!$('v6Modal').classList.contains('hidden'))$('v6FormError').textContent=e.message;else toast(e.message||'No se pudo guardar. Intenta de nuevo.')}finally{busy=false;if(button)button.disabled=false}};
const check=result=>{if(result.error)throw new Error(result.error.message);return result.data};
const table=name=>state().sb.from(name);
function modal(title,fields,save){lastModalFocus=document.activeElement;$('v6ModalTitle').textContent=title;$('v6ModalFields').innerHTML=fields;$('v6FormError').textContent='';$('v6Modal').classList.remove('hidden');$('v6Form').onsubmit=e=>{e.preventDefault();if(!$('v6Form').reportValidity())return;run(async()=>{await save();$('v6Modal').classList.add('hidden');await api.loadData();lastModalFocus?.focus();toast('Cambios guardados')},$('v6Submit'))};$('v6ModalFields').querySelector('input,select,textarea')?.focus()}
function needs(){if(available)return true;toast(loadError||'Instala la actualización V6 en Supabase para habilitar esta función.');return false}
async function load(){
 const {profile,sb}=state();if(!profile)return;const sid=profile.store_id;
 try{
  const result=await Promise.all([readAll('pos_roles'),can('manage_customers')?readAll('customers'):Promise.resolve({data:[],error:null}),readAll('promotions')]);
  if(state().profile?.store_id!==sid)return;
  result.forEach(check);[roles,customers,promotions]=result.map(r=>r.data||[]);available=true;loadError='';
 }catch(e){roles=[];customers=[];promotions=[];available=false;loadError='Los módulos V6 todavía no están disponibles. Ejecuta supabase_patch_v6.sql y pulsa Sincronizar. '+(e.message||'');}
 async function readAll(name){let rows=[];for(let start=0;;start+=500){const r=await sb.from(name).select('*').eq('store_id',sid).order('id').range(start,start+499);if(r.error)return r;rows.push(...r.data);if(r.data.length<500)return{data:rows,error:null}}}
}
function render(){
 if(!state().profile)return;
 for(const id of ['v6Status','loyaltyStatus','promoStatus']){$(id).textContent=loadError;$(id).classList.toggle('hidden',available)}
 if(isAdmin()){renderAdmins();renderRoles()}
 if(can('manage_customers'))renderCustomers();if(can('manage_promotions'))renderPromotions();renderOrder();renderHighlights();
}
function renderAdmins(){
 const {employees}=state(),q=normalize($('adminSearch').value),filter=$('adminFilter').value;
 $('adminMetrics').innerHTML=metricHTML([['Cuentas',employees.length,'Con acceso al sistema'],['Administradores',employees.filter(p=>p.role==='admin').length,'Acceso completo','accent'],['Activos',employees.filter(p=>p.active).length,'Cuentas habilitadas','green'],['Roles',roles.length||'—','Perfiles de acceso']]);
 const rows=employees.filter(p=>(!q||normalize([p.name,p.username,p.login_email].join(' ')).includes(q))&&(!filter||(filter==='admin'?p.role==='admin':filter==='active'?p.active:!p.active)));
 $('adminsBody').innerHTML=rows.length?rows.map(p=>`<tr><td><strong>${esc(p.name)}</strong><small>@${esc(p.username||'—')}</small></td><td>${esc(p.login_email||'No disponible')}</td><td><span class="badge ${p.role==='admin'?'gold':'dark'}">${esc(getRole(p))}</span></td><td><span class="badge ${p.active?'green':'red'}">${p.active?'Activo':'Inactivo'}</span></td><td>${p.last_access_at?fmtDate(p.last_access_at):'<small>Sin registro</small>'}</td><td><button class="row-btn" data-person="${esc(p.user_id)}">Gestionar</button> ${p.role!=='admin'?`<button class="row-btn" data-assign="${esc(p.user_id)}" ${!available?'disabled':''}>Asignar rol</button>`:''}</td></tr>`).join(''):'<tr><td colspan="6">No hay usuarios con estos filtros.</td></tr>';
 $('adminsBody').querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>api.openEmployee(b.dataset.person));
 $('adminsBody').querySelectorAll('[data-assign]').forEach(b=>b.onclick=()=>{const p=employees.find(p=>p.user_id===b.dataset.assign);modal('Asignar rol · '+p.name,select('assignRole','Rol',roles.filter(r=>r.key!=='admin').map(r=>[r.id,r.name]),p.access_role_id)+`<p class="full report-note">Se reemplazan los permisos individuales de esta persona por los del rol seleccionado.</p>`,async()=>check(await state().sb.rpc('v6_assign_role',{p_user:p.user_id,p_role:$('assignRole').value})))})
}
function renderRoles(){
 const selected=roles.find(r=>r.key===selectedRole)||roles[0];
 $('roleList').innerHTML=roles.length?roles.map(r=>`<button class="${r.id===selected?.id?'active':''}" data-role="${esc(r.key)}">${esc(r.name)}<small>${state().employees.filter(p=>r.key==='admin'?p.role==='admin':p.access_role_id===r.id).length} personas</small></button>`).join(''):empty('Los roles estarán disponibles al instalar V6.');
 $('roleList').querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{selectedRole=b.dataset.role;renderRoles()});
 $('roleTitle').textContent=selected?.name||'Permisos';$('roleDescription').textContent=selected?.key==='admin'?'Acceso completo protegido.':'Define las acciones permitidas para este rol.';
 $('rolePermissions').innerHTML=selected?permissions.map(([key,mod,desc])=>`<label class="permission-row"><span><strong>${mod}</strong><small>${desc}</small></span><input type="checkbox" data-perm="${key}" aria-label="${esc(desc)}" ${selected.key==='admin'||selected.permissions[key]?'checked':''} ${selected.key==='admin'?'disabled':''}></label>`).join(''):'';
 $('saveRoleBtn').disabled=!selected||selected.key==='admin';
 $('saveRoleBtn').onclick=()=>run(async()=>{const perms=Object.fromEntries([...$('rolePermissions').querySelectorAll('[data-perm]')].map(x=>[x.dataset.perm,x.checked]));check(await state().sb.rpc('v6_save_role',{p_role:selected.id,p_permissions:perms}));await api.loadData();toast('Permisos actualizados para todas las personas de este rol')},$('saveRoleBtn'));
}
function customerStats(c){const rows=state().sales.filter(s=>normalize(s.client).trim()===normalize(c.identifier).trim()&&s.status==='active');return{rows,count:rows.length,total:rows.reduce((a,s)=>a+Number(s.total),0),last:rows.map(s=>s.created_at).sort().at(-1)}}
function renderCustomers(){
 const q=normalize($('loyaltySearch').value),level=$('loyaltyFilter').value;
 $('loyaltyMetrics').innerHTML=metricHTML([['Clientes',customers.length,'Fichas registradas'],['VIP',customers.filter(c=>c.level==='VIP').length,'Atención especial','accent'],['Frecuentes',customers.filter(c=>c.level==='Frecuente').length,'Clientes habituales'],['Compras',customers.reduce((a,c)=>a+customerStats(c).count,0),'Ventas activas','green']]);
 const rows=customers.filter(c=>(!q||normalize([c.name,c.identifier,c.phone].join(' ')).includes(q))&&(!level||c.level===level));
 $('loyaltyBody').innerHTML=rows.length?rows.map(c=>{const st=customerStats(c);return `<tr><td><strong>${esc(c.name)}</strong><small>${esc(c.benefit||'Sin beneficio asignado')}</small></td><td>${esc(c.identifier)}<small>${esc(c.phone||'—')}</small></td><td><span class="badge ${c.level==='VIP'?'gold':'dark'}">${esc(c.level)}</span></td><td>${st.count}</td><td><strong>${money(st.total)}</strong></td><td>${st.last?fmtDate(st.last):'Sin compras'}</td><td><button class="row-btn" data-client="${esc(c.id)}">Ver ficha</button></td></tr>`}).join(''):'<tr><td colspan="7">Sin clientes. Crea la primera ficha usando su Cliente / ID de ventas.</td></tr>';
 $('loyaltyBody').querySelectorAll('[data-client]').forEach(b=>b.onclick=()=>customerEditor(b.dataset.client));
}
function customerEditor(id){if(!needs())return;const c=customers.find(c=>c.id===id)||{},st=customerStats(c);
 modal(c.id?'Ficha del cliente':'Nuevo cliente',input('cName','Nombre',c.name,'required maxlength="100"')+input('cIdentifier','Cliente / ID de ventas',c.identifier,'required maxlength="120"')+input('cPhone','Teléfono (opcional)',c.phone,'maxlength="40"')+select('cLevel','Categoría',['Nuevo','Frecuente','VIP','Convenio'].map(x=>[x,x]),c.level||'Nuevo')+`<div class="full"><label for="cBenefit">Beneficio o convenio asignado</label><input id="cBenefit" value="${esc(c.benefit||'')}" maxlength="200" placeholder="Ej. Cupón VIP10 o convenio Redline"></div><div class="full"><label for="cNotes">Notas</label><textarea id="cNotes" maxlength="1500">${esc(c.notes||'')}</textarea></div>`+(c.id?`<div class="full"><h3>Últimas compras · ${st.count} en total</h3><p class="report-note">${st.rows.slice(0,5).map(s=>`${esc(fmtDate(s.created_at))} · ${money(s.total)} · ${esc(s.discount_name||'Sin convenio')}`).join('<br>')||'Todavía no hay compras para este identificador.'}</p></div>`:''),async()=>{
 const data={store_id:state().profile.store_id,name:$('cName').value.trim(),identifier:$('cIdentifier').value.trim(),phone:$('cPhone').value.trim(),level:$('cLevel').value,benefit:$('cBenefit').value.trim(),notes:$('cNotes').value.trim()};if(!data.name||!data.identifier)throw new Error('El nombre y el identificador son obligatorios.');
 check(c.id?await table('customers').update(data).eq('id',c.id).eq('store_id',data.store_id):await table('customers').insert(data));})
}
function renderPromotions(){
 const q=normalize($('promoSearch').value),filter=$('promoFilter').value;
 $('promoMetrics').innerHTML=metricHTML([['Activas',promotions.filter(p=>core.status(p)==='Activa').length,'Disponibles en caja','green'],['Cupones',promotions.filter(p=>p.code).length,'Con código'],['Programadas',promotions.filter(p=>core.status(p)==='Programada').length,'Próximas campañas'],['Expiradas',promotions.filter(p=>core.status(p)==='Expirada').length,'Fuera de vigencia']]);
 const rows=promotions.filter(p=>(!q||normalize(p.name+' '+p.code).includes(q))&&(!filter||core.status(p)===filter));
 $('promoCards').innerHTML=rows.length?rows.map(p=>`<article class="v6-promo"><div class="v6-promo-top"><span class="v6-promo-amount">${p.kind==='percent'?Number(p.value)+'%':p.kind==='two_for_one'?'2 × 1':p.kind==='combo'?money(p.value):'−'+money(p.value)}</span><span class="badge ${core.status(p)==='Activa'?'green':'dark'}">${core.status(p)}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||'Beneficio en el pedido. No acumulable con convenios.')}<br>${p.product_id?esc(state().products.find(x=>x.id===p.product_id)?.name||'Producto seleccionado'):'Productos elegibles del menú'}</p><code>${esc(p.code||'SIN CÓDIGO')}</code><small>${p.starts_at?fmtDate(p.starts_at):'Desde ahora'} → ${p.ends_at?fmtDate(p.ends_at):'Sin vencimiento'}</small><footer><button class="row-btn" data-promo-edit="${esc(p.id)}">Editar</button><button class="row-btn" data-promo-pause="${esc(p.id)}">${p.active?'Pausar':'Activar'}</button><button class="row-btn" data-promo-delete="${esc(p.id)}" aria-label="Eliminar ${esc(p.name)}">Eliminar</button></footer></article>`).join(''):empty('No hay promociones en este filtro. Crea una campaña para empezar.');
 $('promoCards').querySelectorAll('[data-promo-edit]').forEach(b=>b.onclick=()=>promoEditor(b.dataset.promoEdit));
 $('promoCards').querySelectorAll('[data-promo-pause]').forEach(b=>b.onclick=()=>run(async()=>{const p=promotions.find(p=>p.id===b.dataset.promoPause);check(await table('promotions').update({active:!p.active}).eq('id',p.id).eq('store_id',state().profile.store_id));await api.loadData()},b));
 $('promoCards').querySelectorAll('[data-promo-delete]').forEach(b=>b.onclick=()=>{if(confirm('¿Eliminar esta promoción? Las ventas conservan el descuento registrado.'))run(async()=>{check(await table('promotions').delete().eq('id',b.dataset.promoDelete).eq('store_id',state().profile.store_id));await api.loadData()},b)});
}
const localDate=v=>{if(!v)return'';const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
function promoEditor(id){if(!needs())return;const p=promotions.find(p=>p.id===id)||{};
 modal(p.id?'Editar promoción':'Nueva promoción',input('pName','Nombre',p.name,'required maxlength="100"')+input('pCode','Cupón (opcional)',p.code,'maxlength="32" pattern="[A-Za-z0-9_-]+" placeholder="Ej. NOCHE20"')+select('pKind','Tipo',[['percent','Porcentaje'],['fixed','Monto fijo'],['two_for_one','2 × 1 (mismo producto)'],['combo','Precio especial de combo']],p.kind||'percent')+input('pValue','Porcentaje, descuento o precio especial',p.value??10,'type="number" min="0" max="100000000" step="0.01" required')+select('pProduct','Producto elegible',[['','Todo el menú'],...state().products.filter(p=>p.active).map(p=>[p.id,p.name])],p.product_id||'')+select('pActive','Estado',[['true','Activa'],['false','Pausada']],String(p.active!==false))+input('pStart','Inicio (hora local)',localDate(p.starts_at),'type="datetime-local"')+input('pEnd','Fin (hora local)',localDate(p.ends_at),'type="datetime-local"')+`<div class="full"><label for="pDescription">Descripción</label><textarea id="pDescription" maxlength="500">${esc(p.description||'')}</textarea></div><p class="report-note full">Los cupones no se acumulan con convenios. En 2 × 1 se descuenta una unidad por cada par del mismo producto. Para combo especial, selecciona un producto de la categoría Combos.</p>`,async()=>{
 const data={store_id:state().profile.store_id,name:$('pName').value.trim(),code:$('pCode').value.trim().toUpperCase()||null,kind:$('pKind').value,value:Number($('pValue').value),product_id:$('pProduct').value||null,active:$('pActive').value==='true',starts_at:$('pStart').value?new Date($('pStart').value).toISOString():null,ends_at:$('pEnd').value?new Date($('pEnd').value).toISOString():null,description:$('pDescription').value.trim()};
 if(!data.name)throw new Error('Escribe un nombre.');if(data.kind==='percent'&&(data.value<=0||data.value>100))throw new Error('El porcentaje debe ser mayor a 0 y máximo 100.');if(data.ends_at&&data.starts_at&&data.ends_at<=data.starts_at)throw new Error('El fin debe ser posterior al inicio.');if(data.kind==='combo'&&(!data.product_id||state().products.find(p=>p.id===data.product_id)?.category!=='combos'))throw new Error('Selecciona un producto de la categoría Combos.');
 check(p.id?await table('promotions').update(data).eq('id',p.id).eq('store_id',data.store_id):await table('promotions').insert(data));})
}
function calculate(c){
 const p=promotions.find(p=>p.id===selectedPromotion&&core.status(p)==='Activa'&&(!p.code||p.code===approvedCode));
 if(!p||!available||!can('apply_promotions'))return c;
 const disc=core.discount(p,c.lines),total=c.subtotal-disc;
 return {...c,disc,total,earning:total*c.pct/100,blocked:false,promotion:p,d:{id:null,name:p.name,percent:p.kind==='percent'?p.value:0,description:'Promoción aplicada. No acumulable con convenios.'}};
}
function renderOrder(){
 if(!$('orderPromotion'))return;
 const allowed=available&&can('apply_promotions');
 $('orderPromotion').innerHTML='<option value="">Sin promoción</option>'+promotions.filter(p=>core.status(p)==='Activa'&&(!p.code||p.code===approvedCode)).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
 $('orderPromotion').value=selectedPromotion;if($('orderPromotion').value!==selectedPromotion)selectedPromotion='';
 $('orderPromotion').disabled=!allowed;$('applyCouponBtn').disabled=!allowed;$('couponCode').disabled=!allowed;
 $('discountSelect').disabled=allowed&&!!selectedPromotion;
 $('promotionHint').textContent=!available?'Promociones disponibles al activar V6.':!can('apply_promotions')?'Tu rol no tiene permiso para aplicar promociones.':selectedPromotion?'Promoción activa · sustituye al convenio.':'';
 $('customerSuggestions').innerHTML=customers.map(c=>`<option value="${esc(c.identifier)}">${esc(c.name)}</option>`).join('');
}
function renderHighlights(){
 let host=$('customerWeek');if(!host){host=document.createElement('section');host.id='customerWeek';host.className='panel';$('dashboardMetrics').after(host)}
 const now=new Date(),start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
 const rows=state().sales.filter(s=>s.status==='active'&&new Date(s.created_at)>=start&&new Date(s.created_at)<=now),groups=new Map();
 rows.forEach(s=>{const key=normalize(s.client).trim();if(!key||key==='cliente general')return;const r=groups.get(key)||{name:s.client,total:0,count:0};r.total+=Number(s.total);r.count++;groups.set(key,r)});
 const best=[...groups.values()].sort((a,b)=>b.total-a.total)[0];host.hidden=!can('view_reports');
 host.innerHTML=`<div class="panel-head"><div><span class="eyebrow">CLIENTE DE LA SEMANA</span><h2>${esc(best?.name||'Tu próximo cliente destacado')}</h2><span>${best?`${best.count} compras · ${money(best.total)} esta semana`:'Se calcula con las ventas activas de lunes a domingo.'}</span></div><button class="row-btn" id="weekCustomers">Ver clientes →</button></div>`;$('weekCustomers').onclick=()=>api.switchPage('customers');host.style.marginBottom='24px';
}
$('newAdminBtn').onclick=()=>{$('addEmployeeBtn').click();$('employeeRole').value='admin'};
$('newCustomerBtn').onclick=()=>customerEditor();$('newPromoBtn').onclick=()=>promoEditor();
for(const id of ['adminSearch','adminFilter'])$(id).addEventListener(id.endsWith('Search')?'input':'change',renderAdmins);
for(const id of ['loyaltySearch','loyaltyFilter'])$(id).addEventListener(id.endsWith('Search')?'input':'change',renderCustomers);
for(const id of ['promoSearch','promoFilter'])$(id).addEventListener(id.endsWith('Search')?'input':'change',renderPromotions);
document.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-admin-tab]').forEach(x=>{x.classList.toggle('active',b===x);x.setAttribute('aria-selected',String(b===x))});$('adminPeople').classList.toggle('hidden',b.dataset.adminTab!=='people');$('adminRoles').classList.toggle('hidden',b.dataset.adminTab!=='roles');renderRoles()});
$('orderPromotion').onchange=()=>{selectedPromotion=$('orderPromotion').value;api.renderCart()};
$('applyCouponBtn').onclick=()=>{const code=$('couponCode').value.trim().toUpperCase(),p=promotions.find(p=>p.code===code&&core.status(p)==='Activa');if(!p)return toast('Cupón inválido, pausado o fuera de vigencia.');approvedCode=code;selectedPromotion=p.id;api.renderCart();toast('Cupón aplicado')};
$('couponCode').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('applyCouponBtn').click()}};
$('notificationsBtn').onclick=()=>{const rows=state().sales.slice(0,5);$('notificationContent').innerHTML=rows.length?rows.map(s=>`<article><strong>${esc(s.client)} · ${money(s.total)}</strong><small>${esc(s.employee_name)} · ${fmtDate(s.created_at)}</small></article>`).join(''):empty('Todavía no hay ventas.');$('notificationsPanel').classList.toggle('hidden')};
for(const [id,key,cls,invert] of [['motionToggle','bs_v6_motion','motion-off',true],['compactToggle','bs_v6_compact','compact-menu',false]]){let saved=null;try{saved=localStorage.getItem(key)}catch{}$(id).checked=saved===null?invert:saved==='true';const apply=()=>document.body.classList.toggle(cls,invert?!$(id).checked:$(id).checked);apply();$(id).onchange=()=>{apply();try{localStorage.setItem(key,String($(id).checked))}catch{}}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('v6Modal').classList.add('hidden');$('notificationsPanel').classList.add('hidden');lastModalFocus?.focus()}if(e.key==='Tab'&&!$('v6Modal').classList.contains('hidden')){const elements=[...$('v6Modal').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')],first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
return{load,render,renderOrder,calculate,roleName:getRole,resetOrder(){selectedPromotion='';approvedCode='';$('couponCode').value='';$('orderClient').value=''}};
}};
