(() => {
"use strict";
const CATS={combos:"Combos",individuales:"Individuales",extras:"Extras",cajas:"Cajas felices",mayoreo:"Mayoreo"};
const CONFIG_KEY="bs_v3_cloud";
const PENDING_BOOTSTRAP_KEY="bs_v3_pending_admin";
const TEMPLATE_KEY="bs_order_templates_v1";
let saleSaving=false,checkoutSnapshot=null,loadVersion=0,saleEditId=null,saleEditDraft=null;
let employeeWeekSaving=false,employeeWeekPreviewUrl=null;
let sb,user=null,profile=null,store=null,products=[],discounts=[],sales=[],employees=[],payouts=[],cart={},employeeWeek=null,activeCategory="all",realtime=null,resetTarget=null;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

const PHOTO_LABELS={burger:"Hamburguesa",burrito:"Burrito",wings:"Alitas",nuggets:"Nuggets","combo-burger":"Combo Hamburguesa","combo-burrito":"Combo Burrito","combo-wings":"Combo Alitas","combo-nuggets":"Combo Nuggets",drink:"Bebida",fries:"Papitas",icecream:"Helado",happybox:"Caja Feliz"};
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const uiIcon=(name)=>`<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${{plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'}[name]||""}</svg>`;
function productPhotoKey(p){
  const selected=String(p?.emoji||"").replace(/^photo:/,"");
  if(String(p?.emoji||"").startsWith("photo:")&&PHOTO_LABELS[selected])return selected;
  const n=normalize(p?.name),category=p?.category;
  if(category==="cajas"||/caj[ai].*feliz/.test(n))return "happybox";
  let key=/burrito/.test(n)?"burrito":/alita|wing/.test(n)?"wings":/nugget/.test(n)?"nuggets":/cola|refresco|bebida/.test(n)?"drink":/helado|sundae/.test(n)?"icecream":/papas|papitas|fritas/.test(n)?"fries":"burger";
  if((category==="combos"||/combo/.test(n))&&["burger","burrito","wings","nuggets"].includes(key))key="combo-"+key;
  return key;
}
function productArt(p,thumb=false){
  const key=productPhotoKey(p);
  return `<img class="food-photo" src="assets/food/${key}${thumb?"-thumb":""}.webp" alt="" loading="${thumb?"eager":"lazy"}" decoding="async" width="${thumb?160:720}" height="${thumb?160:720}">`;
}
function productBadge(p){
  if(p.restriction)return {police:"Policía",ems:"EMS",sheriff:"Sheriff"}[p.restriction]||p.restriction;
  if(p.category==="mayoreo")return String(p.name).match(/\d+\s*[×x]\s*\d+/i)?.[0]||"Mayoreo";
  return "";
}
function productSubtitle(p){
  return p.category==="mayoreo"?"Paquete de mayoreo":p.restriction?"Exclusivo · "+productBadge(p):CATS[p.category]||"Producto";
}
function productContents(p){
  if(p.category!=="mayoreo"&&p.category!=="combos")return "";
  const name=normalize(p.name),pack=name.match(/\b(5|25|50|100)\s*[×x]\s*(5|25|50|100)\b/);
  if(!pack)return "";
  const food=/hamburguesa/.test(name)?"hamburguesas":/nugget/.test(name)?"nuggets":/alita/.test(name)?"cubos de alitas":/burrito/.test(name)?"burritos":"";
  return food?`Incluye: ${pack[1]} ${food} + ${pack[2]} bebidas.`:"";
}
function templateScope(){return profile?.store_id&&user?.id?`${TEMPLATE_KEY}:${profile.store_id}:${user.id}`:""}
function readOrderTemplates(){
  const scope=templateScope();if(!scope)return [];
  try{const rows=JSON.parse(localStorage.getItem(scope)||"[]");return Array.isArray(rows)?rows.filter(x=>x&&typeof x.name==="string"&&Array.isArray(x.lines)):[]}catch{return []}
}
function writeOrderTemplates(rows){const scope=templateScope();if(!scope)return false;try{localStorage.setItem(scope,JSON.stringify(rows.slice(0,30)));return true}catch{return false}}
function renderOrderTemplates(){
  const select=$("templateSelect"),load=$("loadTemplateBtn"),del=$("deleteTemplateBtn"),save=$("saveTemplateBtn");if(!select)return;
  const selected=select.value,rows=readOrderTemplates();
  select.innerHTML=rows.length?`<option value="">Selecciona una plantilla</option>`+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join(""):"<option value=\"\">Sin plantillas guardadas</option>";
  if(rows.some(x=>x.id===selected))select.value=selected;
  const has=Boolean(select.value);if(load)load.disabled=!has;if(del)del.disabled=!has;if(save)save.disabled=!Object.keys(cart).length;
}
function saveOrderTemplate(nameArg){
  if(!Object.keys(cart).length)return toast("Agrega productos antes de guardar una plantilla");
  const name=String(nameArg??window.prompt?.("Nombre de la plantilla:","Pedido frecuente")??"").trim();if(!name)return;
  const lines=Object.entries(cart).map(([id,qty])=>({id,qty})),rows=readOrderTemplates(),existing=rows.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(existing&&!window.confirm?.("Ya existe una plantilla con ese nombre. ¿Reemplazarla?"))return;
  const item={id:existing?.id||`tpl-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:name.slice(0,50),lines,clientType:$("clientType").value,discountId:$("discountSelect").value,updatedAt:new Date().toISOString()};
  const next=existing?rows.map(x=>x.id===existing.id?item:x):[item,...rows];if(!writeOrderTemplates(next))return toast("No se pudo guardar la plantilla en este navegador");renderOrderTemplates();$("templateSelect").value=item.id;renderOrderTemplates();toast(`Plantilla «${item.name}» guardada`);
}
function loadOrderTemplate(templateId){
  const id=templateId||$("templateSelect")?.value,row=readOrderTemplates().find(x=>x.id===id);if(!row)return;
  const next={};let skipped=0;
  for(const line of row.lines){const p=products.find(x=>x.id===line.id&&x.active),qty=Number(line.qty);if(!p||!Number.isInteger(qty)||qty<1){skipped++;continue}next[p.id]=Math.min(9999,(next[p.id]||0)+qty)}
  if(!Object.keys(next).length)return toast("Los productos de esta plantilla ya no están disponibles");
  cart=next;if(discounts.some(x=>x.id===row.discountId&&x.active))$("discountSelect").value=row.discountId;$("clientType").value=row.clientType||"general";renderCart();toast(skipped?`Plantilla cargada; ${skipped} producto${skipped===1?"":"s"} no disponible${skipped===1?"":"s"}.`:`Plantilla «${row.name}» cargada`);
}
function deleteOrderTemplate(templateId){
  const id=templateId||$("templateSelect")?.value,row=readOrderTemplates().find(x=>x.id===id);if(!row)return;if(!window.confirm?.(`¿Eliminar la plantilla «${row.name}»?`))return;writeOrderTemplates(readOrderTemplates().filter(x=>x.id!==id));renderOrderTemplates();toast("Plantilla eliminada");
}
function confirmBulkQuantity(id,quantity){
  if(quantity<100)return true;const p=products.find(x=>x.id===id);return typeof window.confirm!=="function"||window.confirm(`Vas a agregar ${quantity} unidades de ${p?.name||"este producto"} (${money(Number(p?.price||0)*quantity)}). ¿Continuar?`);
}
function addToCart(id,requested=1){
  if(saleSaving)return false;
  if(!products.some(p=>p.id===id&&p.active))return false;
  const quantity=window.BurgerCompanionCore?.quantity(requested) ?? (Number.isInteger(Number(requested))&&Number(requested)>=1&&Number(requested)<=9999?Number(requested):null);
  if(!quantity){toast("La cantidad debe ser un entero positivo");return false}
  if(!confirmBulkQuantity(id,quantity))return false;
  const next=(cart[id]||0)+quantity;
  if(next>9999){toast("La cantidad máxima por producto es 9,999");return false}
  cart[id]=next;renderCart();return true;
}
function updateProductSelection(){
  document.querySelectorAll(".product-card[data-product]").forEach(el=>{
    const count=cart[el.dataset.product]||0;
    el.classList.toggle("in-cart",count>0);
    const label=el.querySelector(".in-cart-count");label.textContent=count?`${count} en orden`:"";label.hidden=!count;
  });
}
function initials(name){
  return String(name||"").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"BS";
}

const isAdmin=()=>profile?.role==="admin";
const can=permission=>isAdmin()||profile?.[`can_${permission}`]===true;
async function notifyDiscord(event,payload={}){try{if(!sb||!profile)return;const {error}=await sb.functions.invoke("discord-notify",{body:{event,...payload}});if(error)console.warn("Discord webhook:",error.message||error)}catch(error){console.warn("Discord webhook:",error?.message||error)}}
const folio=s=>`BS-${String(s.sale_number||0).padStart(5,"0")}`;
const uname=v=>String(v||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,28);
const synthEmail=u=>`${uname(u)}.${crypto.randomUUID().slice(0,8)}@burgershot.app`;

function toast(msg){const d=document.createElement("div");d.className="toast";d.textContent=msg;$("toastHost").appendChild(d);setTimeout(()=>d.remove(),3200)}
async function edgeErrorMessage(error,data,fallback="No se pudo completar la operación"){
  if(data?.error)return String(data.error);
  try{
    const response=error?.context;
    if(response?.json){
      const body=await (response.clone?response.clone():response).json();
      if(body?.error)return String(body.error);
    }
  }catch{}
  return error?.message&&error.message!=="Edge Function returned a non-2xx status code"?error.message:fallback;
}
function cfg(){const x=window.BURGERSHOT_CLOUD||{};if(x.supabaseUrl&&x.supabaseAnonKey)return{url:x.supabaseUrl,key:x.supabaseAnonKey};try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||"null")}catch{return null}}
function hasFixedCloudConfig(){const c=window.BURGERSHOT_CLOUD||{};return Boolean(c.supabaseUrl&&c.supabaseAnonKey)}
function initialSetupAllowed(){const flag=window.BURGERSHOT_CLOUD?.allowInitialSetup;return flag===true||(flag!==false&&!hasFixedCloudConfig())}
function renderSetupActions(){
  $("initialSetupActions").classList.toggle("hidden",!initialSetupAllowed());
  $("changeCloudBtn").classList.toggle("hidden",hasFixedCloudConfig());
}
function showOnly(id){["cloudSetup","authScreen","app"].forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden")}
function setSync(state,text){const e=$("sync");if(!e)return;e.classList.remove("online","error");if(state)e.classList.add(state);$("syncText").textContent=text}
function metricHTML(list){return list.map(x=>`<div class="metric ${x[3]||""}"><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong><small>${esc(x[2]||"")}</small></div>`).join("")}
function sums(list){const a=list.filter(s=>s.status==="active"),generated=a.reduce((x,s)=>x+Number(s.total),0),earnings=a.reduce((x,s)=>x+Number(s.employee_earnings||0),0),net=a.reduce((x,s)=>x+Number(s.business_net||0),0);return{a,generated,earnings,net,count:a.length}}
function pendingFor(employeeId){return sales.filter(s=>s.created_by===employeeId&&s.status==="active"&&!s.payout_id).reduce((a,s)=>a+Number(s.employee_earnings||0),0)}
function paidFor(employeeId){return payouts.filter(p=>p.employee_id===employeeId).reduce((a,p)=>a+Number(p.amount||0),0)}

async function init(){
  bind();initReports();renderSetupActions();renderCategories();tick();setInterval(tick,1000);
  const c=cfg();if(!c?.url||!c?.key){showOnly("cloudSetup");return}
  try{
    sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true}});
    const {data:{session}}=await sb.auth.getSession();user=session?.user||null;
    sb.auth.onAuthStateChange(async(_event,s)=>{user=s?.user||null;if(user)await afterAuth();else{profile=null;employeeWeek=null;cart={};checkoutSnapshot=null;companion?.reset();loadVersion++;auditRequest++;payoutRequest++;auditRows=[];document.querySelectorAll(".modal-backdrop").forEach(x=>x.classList.add("hidden"));showOnly("authScreen")}});
    if(user)await afterAuth();else showOnly("authScreen");
  }catch(e){console.error(e);showOnly("cloudSetup");toast("No se pudo conectar a Supabase")}
}
function bind(){
  $("saveConfigBtn").onclick=()=>{const url=$("configUrl").value.trim(),key=$("configKey").value.trim();if(!url||!key)return toast("Completa URL y Publishable key");localStorage.setItem(CONFIG_KEY,JSON.stringify({url,key}));location.reload()};
  $("changeCloudBtn").onclick=()=>{if(hasFixedCloudConfig())return;localStorage.removeItem(CONFIG_KEY);location.reload()};
  $("openAdminSetupBtn").onclick=()=>{if(initialSetupAllowed())$("adminSetupModal").classList.remove("hidden")};
  $("createAdminBtn").onclick=createInitialAdmin;$("loginBtn").onclick=login;$("loginPassword").onkeydown=e=>{if(e.key==="Enter")login()};
  $("logoutBtn").onclick=()=>sb.auth.signOut();$("mobileMenu").onclick=()=>$("sidebar").classList.toggle("open");$("refreshBtn").onclick=loadData;$("accountBtn").onclick=openAccount;
  document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>switchPage(b.dataset.go));document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add("hidden"));
  $("editEmployeeWeekBtn").onclick=openEmployeeWeekEditor;
  $("saveEmployeeWeekBtn").onclick=saveEmployeeWeek;
  $("employeeWeekPhoto").onchange=()=>{const file=$("employeeWeekPhoto").files?.[0];if(file)$("employeeWeekPhotoUrl").value="";updateEmployeeWeekPreview(file)};
  $("employeeWeekPhotoUrl").oninput=()=>{if(!$("employeeWeekPhoto").files?.length)updateEmployeeWeekPreview()};
  $("employeeWeekEmployee").onchange=()=>{
    const currentWeek=localDay(employeeWeekBounds().start);
    if($("employeeWeekEmployee").value!==employeeWeek?.employee_id||employeeWeek?.week_start!==currentWeek){
      $("employeeWeekPhotoUrl").value="";
      $("employeeWeekPhoto").value="";
    }
    updateEmployeeWeekPreview();
  };
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("globalSearch").focus()}});
  document.addEventListener("click",e=>{if(!saleEditId||!e.target.closest("#saleDetail"))return;setTimeout(()=>{const s=sales.find(x=>x.id===saleEditId);if(s)renderPermissionSaleActions(s)},0)});
  document.addEventListener("change",e=>{if(!saleEditId||!e.target.closest("#saleDetail"))return;setTimeout(()=>{const s=sales.find(x=>x.id===saleEditId);if(s)renderPermissionSaleActions(s)},0)});
  document.addEventListener("input",e=>{if(!saleEditId||!e.target.matches("[data-edit-qty]"))return;const item=saleEditDraft?.items.find(i=>i.id===e.target.dataset.editQty),p=products.find(x=>x.id===e.target.dataset.editQty);if(item){const line=e.target.closest('.edit-order-line');if(line)line.querySelector('.edit-line-total').textContent=money(Number(p?.price??item.price??0)*(Number(e.target.value)||0));const s=sales.find(x=>x.id===saleEditId);if(s)updateSaleEditTotals(s)}});
  $("globalSearch").onkeydown=e=>{if(e.key==="Enter"){switchPage("pos");$("productSearch").value=e.target.value;renderProducts()}};
  $("productSearch").oninput=renderProducts;$("clearCartBtn").onclick=()=>{cart={};renderCart()};$("clientType").onchange=renderCart;$("discountSelect").onchange=renderCart;
  $("saveTemplateBtn").onclick=()=>saveOrderTemplate();$("loadTemplateBtn").onclick=()=>loadOrderTemplate();$("deleteTemplateBtn").onclick=()=>deleteOrderTemplate();$("templateSelect").onchange=renderOrderTemplates;
  $("checkoutBtn").onclick=openCheckout;$("confirmSaleBtn").onclick=saveSale;$("saleClient").oninput=updateCheckoutClientState;$("mySalesSearch").oninput=renderMySales;$("allSalesSearch").oninput=renderAllSales;$("customerSearch").oninput=()=>{customerPage=0;renderCustomers()};$("csvBtn").onclick=exportCSV;
  $("addProductBtn").onclick=()=>can("manage_catalog")?openProduct():toast("No tienes permiso para gestionar el catálogo");$("saveProductBtn").onclick=()=>can("manage_catalog")&&saveProduct();$("deleteProductBtn").onclick=()=>can("manage_catalog")&&deleteProduct();
  $("addDiscountBtn").onclick=()=>can("manage_catalog")?openDiscount():toast("No tienes permiso para gestionar convenios");$("saveDiscountBtn").onclick=()=>can("manage_catalog")&&saveDiscount();$("deleteDiscountBtn").onclick=()=>can("manage_catalog")&&deleteDiscount();
  $("addEmployeeBtn").onclick=()=>{$("employeeName").value="";$("employeeUsername").value="";$("employeePassword").value="";$("employeeRole").value="cashier";$("employeeCommission").value="0";$("employeeError").textContent="";$("employeeModal").classList.remove("hidden")};
  $("createEmployeeBtn").onclick=createEmployee;$("saveEmployeeBtn").onclick=saveEmployee;$("deactivateEmployeeBtn").onclick=toggleEmployeeActive;$("resetPasswordBtn").onclick=openPasswordReset;$("confirmPasswordBtn").onclick=resetPassword;$("payEmployeeBtn").onclick=payEmployee;$("deleteEmployeeBtn").onclick=deleteEmployee;
}
function tick(){const n=new Date();if($("todayDate"))$("todayDate").textContent=new Intl.DateTimeFormat("es-MX",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}).format(n);if($("todayTime"))$("todayTime").textContent=new Intl.DateTimeFormat("es-MX",{hour:"2-digit",minute:"2-digit"}).format(n)}
async function login(){
  $("loginError").textContent="";
  const raw=$("loginUsername").value.trim(),p=$("loginPassword").value;
  if(!raw||!p)return $("loginError").textContent="Escribe usuario/correo y contraseña";
  let email=raw;
  if(!raw.includes("@")){
    const u=uname(raw);
    const {data,error:rerr}=await sb.rpc("resolve_login_email",{p_username:u});
    if(rerr||!data)return $("loginError").textContent="Usuario o contraseña incorrectos";
    email=data;
  }
  const {error}=await sb.auth.signInWithPassword({email,password:p});
  if(error)$("loginError").textContent="Usuario o contraseña incorrectos";
}
async function createInitialAdmin(){
  if(!initialSetupAllowed())return;
  $("adminSetupError").textContent="";
  const name=$("adminName").value.trim(),
        email=$("adminEmail").value.trim().toLowerCase(),
        u=uname($("adminUsername").value),
        p=$("adminPassword").value,
        storeName=$("adminStoreName").value.trim()||"BurgerShot";
  if(!name||!email.includes("@")||u.length<3||p.length<6)
    return $("adminSetupError").textContent="Nombre, correo real, usuario (mín. 3) y contraseña (mín. 6) son obligatorios";

  localStorage.setItem(PENDING_BOOTSTRAP_KEY,JSON.stringify({name,email,username:u,storeName}));
  const redirectTo=location.origin+location.pathname;
  const {data,error}=await sb.auth.signUp({
    email,
    password:p,
    options:{emailRedirectTo:redirectTo,data:{name,username:u}}
  });
  if(error){
    localStorage.removeItem(PENDING_BOOTSTRAP_KEY);
    return $("adminSetupError").textContent=error.message;
  }

  if(data.session){
    user=data.user;
    await finishPendingBootstrap();
    $("adminSetupModal").classList.add("hidden");
    await afterAuth();
    toast("Administrador creado");
  }else{
    $("adminSetupError").style.color="#7fd7a9";
    $("adminSetupError").textContent="Cuenta creada. Revisa tu correo, confirma el registro y vuelve a esta página. Después podrás entrar con tu correo una vez; al terminar la configuración usarás tu usuario.";
  }
}
async function finishPendingBootstrap(){
  let pending=null;
  try{pending=JSON.parse(localStorage.getItem(PENDING_BOOTSTRAP_KEY)||"null")}catch{}
  if(!pending||!user)return false;
  if(String(user.email||"").toLowerCase()!==String(pending.email||"").toLowerCase())return false;

  const {error}=await sb.rpc("bootstrap_store",{
    p_store_name:pending.storeName||"BurgerShot",
    p_display_name:pending.name||"Administrador",
    p_username:pending.username,
    p_login_email:user.email
  });
  if(error){
    // If already bootstrapped, treat as complete.
    if(!/ya tiene perfil|already/i.test(error.message||"")){
      console.error(error);
      toast(error.message);
      return false;
    }
  }
  localStorage.removeItem(PENDING_BOOTSTRAP_KEY);
  return true;
}
async function afterAuth(){
  let {data,error}=await sb.from("profiles").select("*").eq("user_id",user.id).maybeSingle();
  if(error){await sb.auth.signOut();toast(error.message);return}

  if(!data){
    const completed=await finishPendingBootstrap();
    if(completed){
      const retry=await sb.from("profiles").select("*").eq("user_id",user.id).maybeSingle();
      data=retry.data; error=retry.error;
    }
  }

  if(error||!data){
    await sb.auth.signOut();
    toast("La cuenta existe pero aún no tiene perfil BurgerShot. Si acabas de confirmar el correo, vuelve a iniciar sesión con ese correo.");
    return;
  }
  if(!data.active){await sb.auth.signOut();toast("Cuenta desactivada");return}
  profile=data;await loadData();if(!user||!profile)return;showOnly("app");refreshUser();setupRealtime();companion?.afterAuth();
}
async function loadData(){
  if(!profile)return;const version=++loadVersion,sid=profile.store_id;setSync("","Sincronizando");
  try{
    const result=await Promise.all([
      sb.from("stores").select("*").eq("id",sid).single(),
      readAll(()=>sb.from("products").select("*").eq("store_id",sid).order("sort_order").order("id")),
      readAll(()=>sb.from("discounts").select("*").eq("store_id",sid).order("sort_order").order("id")),
      readAll(()=>sb.from("sales").select("*").eq("store_id",sid).order("created_at",{ascending:false}).order("id",{ascending:false})),
      readAll(()=>sb.from("profiles").select("*").eq("store_id",sid).order("name").order("user_id")),
      readAll(()=>sb.from("employee_payouts").select("id,store_id,employee_id,employee_name,generated_total,amount,business_net,sales_count,created_by,created_by_name,created_at").eq("store_id",sid).order("created_at",{ascending:false}).order("id",{ascending:false}))
    ]);
    const error=result.find(r=>r.error)?.error;if(error)throw error;
    if(version!==loadVersion||!user||profile?.store_id!==sid)return;
    const employeeWeekResult=await sb.from("employee_of_week").select("*").eq("store_id",sid).maybeSingle();
    if(version!==loadVersion||!user||profile?.store_id!==sid)return;
    [store,products,discounts,sales,employees,payouts]=result.map(r=>r.data);
    employeeWeek=employeeWeekResult.error?null:employeeWeekResult.data;
    const current=employees.find(e=>e.user_id===user.id);
    if(!current?.active){await sb.auth.signOut();return}
    profile=current;refreshUser();
    const guarded=['allSales','employees','payouts','discounts','products','audit','customers'];
    if(guarded.some(x=>$('page-'+x)?.classList.contains('active'))){const activePage=guarded.find(x=>$('page-'+x)?.classList.contains('active'));if(!pageAllowed(activePage))switchPage('dashboard')}
    setSync("online","Sincronizado");renderAll();
    if($('page-audit').classList.contains('active'))loadAudit(auditPage);
  }catch(error){if(version===loadVersion){setSync("error","Error");toast(error.message||"No se pudieron cargar los datos")}}
}
function setupRealtime(){
  if(realtime)sb.removeChannel(realtime);
  realtime=sb.channel("bs-v3-"+profile.store_id)
    .on("postgres_changes",{event:"*",schema:"public",table:"sales",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"products",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"discounts",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"profiles",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"employee_payouts",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"employee_of_week",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"audit_events",filter:`store_id=eq.${profile.store_id}`},()=>{if($("page-audit").classList.contains("active"))loadAudit(0)}).subscribe();
}
function refreshUser(){
  $("storeName").textContent=store?.name||"BurgerShot";$("accountName").textContent=profile.name;$("posCashier").textContent=profile.name;$("topName").textContent=profile.name;const role=isAdmin()?"Administrador":"Empleado";$("accountRole").textContent=role;$("topRole").textContent=role;
  const ini=profile.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();$("avatar").textContent=ini;$("topAvatar").textContent=ini;$("welcomeTitle").textContent=`¡Buenas, ${profile.name.split(" ")[0]}!`;
  $("welcomeSubtitle").textContent=isAdmin()?"Resumen general del BurgerShot.":`Tu comisión actual es ${Number(profile.commission_percent||0)}%.`;
  document.querySelectorAll(".admin-only").forEach(x=>{const permission=x.dataset.permission;x.classList.toggle("hidden",permission?!can(permission):!isAdmin())});
}
const pagePermissions={allSales:"view_reports",employees:"manage_employees",payouts:"manage_payouts",discounts:"manage_catalog",products:"manage_catalog",audit:"view_audit",customers:"view_reports"};
function pageAllowed(page){return !pagePermissions[page]||can(pagePermissions[page])}
function switchPage(page){if(!pageAllowed(page))return toast("No tienes permiso para abrir esta sección");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));$(`page-${page}`).classList.add("active");document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add("active");$("sidebar").classList.remove("open");renderAll();if(page==="audit")loadAudit(0)}
function renderAll(){refreshReportEmployees();renderDashboard();renderProducts();renderCart();renderMySales();renderAnalytics();renderAllSales();renderEmployees();renderPayouts();renderDiscounts();renderProductsAdmin();renderCustomers()}
function employeeWeekBounds(date=new Date()){
  const start=new Date(date);start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);const end=new Date(start);end.setDate(end.getDate()+7);return{start,end};
}
function employeeWeekStats(){
  const {start,end}=employeeWeekBounds(),ranking=new Map();
  const dayNames=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  for(const sale of sales){const date=new Date(sale.created_at);if(sale.status!=="active"||date<start||date>=end)continue;const id=sale.created_by,employee=employees.find(x=>x.user_id===id),row=ranking.get(id)||{id,name:sale.employee_name||employee?.name||'Empleado',count:0,generated:0,commission:0,daily:Array(7).fill(0)};const day=(date.getDay()+6)%7;row.count++;row.generated+=Number(sale.total||0);row.commission+=Number(sale.employee_earnings||0);row.daily[day]+=Number(sale.total||0);ranking.set(id,row)}
  const configured=employeeWeek?.week_start===localDay(start)?employeeWeek?.employee_id:null;
  const rows=[...ranking.values()].sort((a,b)=>b.generated-a.generated||b.count-a.count||a.name.localeCompare(b.name,'es')),selectedId=configured||rows[0]?.id||null,selected=rows.find(x=>x.id===selectedId)||(()=>{const p=employees.find(x=>x.user_id===selectedId);return p?{id:p.user_id,name:p.name,count:0,generated:0,commission:0,daily:Array(7).fill(0)}:null})();
  return{start,end,rows,selected,selectedId,configured,dayNames};
}
function renderEmployeeWeek(){
  const host=$("employeeWeekContent");if(!host)return;const s=employeeWeekStats(),fmt=d=>new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short'}).format(d),week=`${fmt(s.start)} – ${fmt(new Date(s.end.getTime()-86400000))}`,selected=s.selected;
  if(!selected){host.innerHTML='<div class="employee-week-empty"><strong>Aún no hay ventas esta semana</strong><span>Cuando se registre una venta aparecerá aquí el líder automático. Un administrador también puede elegirlo manualmente.</span></div>';return}
  const configured=s.configured===selected.id,photo=configured?String(employeeWeek?.photo_url||'').trim():'';const initials=selected.name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'BS',max=Math.max(...selected.daily,1),rank=s.rows.findIndex(x=>x.id===selected.id)+1;
  host.innerHTML=`<div class="employee-week-layout"><div class="employee-week-person"><div class="employee-week-avatar">${photo?`<img src="${esc(photo)}" alt="Foto de ${esc(selected.name)}">`:`<span>${esc(initials)}</span>`}</div><div><span class="employee-week-kicker">${configured?'ELEGIDO POR ADMINISTRACIÓN':'LÍDER AUTOMÁTICO'}</span><h3>${esc(selected.name)}</h3><p>Semana ${week}</p><small>${rank>0?`Puesto #${rank} de ${s.rows.length}`:'Sin ventas registradas'}</small></div></div><div class="employee-week-kpis"><div><span>Ventas</span><strong>${selected.count}</strong><small>activas</small></div><div><span>Generado</span><strong>${money(selected.generated)}</strong><small>esta semana</small></div><div><span>Comisión</span><strong>${money(selected.commission)}</strong><small>acumulada</small></div><div><span>Ticket promedio</span><strong>${money(selected.count?selected.generated/selected.count:0)}</strong><small>por venta</small></div></div><div class="employee-week-chart-wrap"><div class="employee-week-subhead"><div><span class="employee-week-kicker">ACTIVIDAD SEMANAL</span><strong>Generado por día</strong></div><small>${money(selected.generated)} total</small></div><div class="employee-week-chart">${selected.daily.map((value,i)=>`<div class="employee-week-bar"><span>${value?money(value):'—'}</span><div><i style="height:${value?Math.max(8,Math.round(value/max*100)):2}%"></i></div><small>${s.dayNames[i]}</small></div>`).join('')}</div></div><div class="employee-week-ranking"><div class="employee-week-subhead"><div><span class="employee-week-kicker">RANKING</span><strong>Rendimiento de la sucursal</strong></div><small>Por generado</small></div>${s.rows.slice(0,5).map((row,i)=>`<div class="employee-week-rank-row ${row.id===selected.id?'selected':''}"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${esc(row.name)}</strong><small>${row.count} venta${row.count===1?'':'s'}</small></div><strong>${money(row.generated)}</strong></div>`).join('')||'<p class="employee-week-empty">Sin ventas activas esta semana.</p>'}</div></div>`;
}
function openEmployeeWeekEditor(){
  if(!isAdmin())return toast('Solo un administrador puede configurar el empleado de la semana');const s=employeeWeekStats(),select=$("employeeWeekEmployee"),current=s.selectedId||employees.find(x=>x.active&&x.role!=='admin')?.user_id;select.innerHTML=employees.filter(x=>x.active).sort((a,b)=>a.name.localeCompare(b.name,'es')).map(x=>`<option value="${esc(x.user_id)}">${esc(x.name)}${x.role==='admin'?' · Admin':''}</option>`).join('');select.value=current||'';$("employeeWeekPhotoUrl").value=s.configured===current?employeeWeek?.photo_url||'' : '';$("employeeWeekPhoto").value='';$("employeeWeekPhotoStatus").textContent='';$("employeeWeekPreview").hidden=true;$("employeeWeekPreview").removeAttribute('src');$("employeeWeekModal").classList.remove('hidden');updateEmployeeWeekPreview();$("employeeWeekEmployee").focus();
}
function updateEmployeeWeekPreview(file){
  if(employeeWeekPreviewUrl){URL.revokeObjectURL(employeeWeekPreviewUrl);employeeWeekPreviewUrl=null}
  const img=$("employeeWeekPreview"),raw=$("employeeWeekPhotoUrl").value.trim();
  const validFile=file&&/^image\/(png|jpeg|webp)$/i.test(file.type)&&file.size<=8*1024*1024;
  if(file&&!validFile){img.hidden=true;img.removeAttribute('src');$("employeeWeekPhotoStatus").textContent='Elige una imagen PNG, JPG o WebP de hasta 8 MB.';return}
  const url=file?(employeeWeekPreviewUrl=URL.createObjectURL(file)):(/^https?:\/\//i.test(raw)?raw:'');
  img.onerror=()=>{img.hidden=true;$("employeeWeekPhotoStatus").textContent='No se pudo cargar la vista previa. Revisa la imagen o su URL.'};
  if(!url){img.hidden=true;img.removeAttribute('src');return}img.src=url;img.hidden=false;
}
function optimizeEmployeeWeekPhoto(file){
  return new Promise((resolve,reject)=>{if(!file||!/^image\/(png|jpe?g|webp)$/i.test(file.type)||file.size>8*1024*1024)return reject(new Error('Elige una imagen PNG, JPG o WebP de hasta 8 MB.'));const src=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(src);const scale=Math.min(1,900/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const context=canvas.getContext('2d');if(!context||!canvas.toBlob)return reject(new Error('Tu navegador no puede preparar esta foto.'));context.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo preparar la foto.')),'image/webp',.86)};img.onerror=()=>{URL.revokeObjectURL(src);reject(new Error('No se pudo abrir la foto.'))};img.src=src});
}
async function uploadEmployeeWeekPhoto(file,employeeId){
  const sid=profile.store_id,uid=user.id,blob=await optimizeEmployeeWeekPhoto(file);
  if(user?.id!==uid||profile?.store_id!==sid||!isAdmin())throw new Error('La sesión cambió. Vuelve a iniciar sesión.');
  const path=`${sid}/${employeeId}.webp`,result=await sb.storage.from('employee-week').upload(path,blob,{upsert:true,contentType:blob.type||'image/webp',cacheControl:'0'});
  if(result.error)throw result.error;return sb.storage.from('employee-week').getPublicUrl(path).data.publicUrl+'?v='+Date.now();
}
async function saveEmployeeWeek(){
  if(employeeWeekSaving)return;
  if(!isAdmin())return toast('Solo un administrador puede configurar el empleado de la semana');
  const employeeId=$("employeeWeekEmployee").value,url=$("employeeWeekPhotoUrl").value.trim(),file=$("employeeWeekPhoto").files?.[0];
  if(!employees.some(e=>e.user_id===employeeId&&e.active))return toast('Selecciona un empleado activo');
  if(!file&&url){try{const parsed=new URL(url);if(!/^https?:$/.test(parsed.protocol))throw Error()}catch{return toast('La URL de la foto no es válida')}}
  const button=$("saveEmployeeWeekBtn"),label=button.textContent,sid=profile.store_id,uid=user.id;
  employeeWeekSaving=true;button.disabled=true;button.textContent='Guardando…';$("employeeWeekPhotoStatus").textContent='';
  try{
    const photoUrl=file?await uploadEmployeeWeekPhoto(file,employeeId):url;
    if(user?.id!==uid||profile?.store_id!==sid||!isAdmin())throw new Error('La sesión cambió. Vuelve a iniciar sesión.');
    const payload={store_id:sid,employee_id:employeeId,photo_url:photoUrl,week_start:localDay(employeeWeekBounds().start),updated_by:uid,updated_at:new Date().toISOString()};
    const {data,error}=await sb.from('employee_of_week').upsert(payload,{onConflict:'store_id'}).select('*').single();
    if(error)throw error;
    if(user?.id!==uid||profile?.store_id!==sid)return;
    employeeWeek=data||payload;$("employeeWeekModal").classList.add('hidden');renderEmployeeWeek();toast('Empleado de la semana actualizado');
  }catch(error){
    $("employeeWeekPhotoStatus").textContent=['PGRST205','42P01'].includes(error.code)?'Falta activar esta función: ejecuta el contenido de supabase_patch_v5_5_employee_week.sql en Supabase.':error.message||'No se pudo guardar. Revisa el parche SQL y el bucket de fotos.';
    $("employeeWeekPhotoStatus").classList.add('is-warning');
  }finally{employeeWeekSaving=false;button.disabled=false;button.textContent=label}
}
function renderDashboard(){
  if(!profile)return;
  const mine=sales.filter(s=>s.created_by===user.id),m=sums(mine),all=sums(sales),pending=pendingFor(user.id);
  $("dashboardMetrics").innerHTML=isAdmin()
    ?metricHTML([["Ventas",all.count,"activas"],["Generado",money(all.generated),"ventas brutas","accent"],["Ganancias empleados",money(all.earnings),"comisiones"],["Neto negocio",money(all.net),"después de comisiones","green"]])
    :metricHTML([["Mis ventas",m.count,"activas"],["Generado",money(m.generated),"total vendido","accent"],["Mi ganancia",money(m.earnings),`${Number(profile.commission_percent||0)}% comisión`,"green"],["Pendiente",money(pending),"por pagar"]]);
  $("quickProducts").innerHTML=products.filter(x=>x.active).slice(0,8).map(p=>`<button class="quick-card" data-quick-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)} y abrir punto de venta"><div class="quick-photo">${productArt(p)}</div><h3>${esc(p.name)}</h3><strong>${money(p.price)}</strong></button>`).join("");
  $("quickProducts").onclick=e=>{const b=e.target.closest("[data-quick-add]");if(b){addToCart(b.dataset.quickAdd);switchPage("pos")}};
  const shown=isAdmin()?sales:sales.filter(s=>s.created_by===user.id);$("miniSales").innerHTML=shown.slice(0,8).map(s=>`<button class="mini-sale" data-mini-sale="${s.id}"><span>${folio(s)}</span><strong>${esc(s.employee_name)}</strong><b>${money(s.total)}</b><em>Ver →</em></button>`).join("")||`<div class="empty-cart"><strong>Sin ventas todavía</strong></div>`;document.querySelectorAll("[data-mini-sale]").forEach(b=>b.onclick=()=>openSale(b.dataset.miniSale));
  renderEmployeeWeek();
}
function updateBulkPreview(input){
  const card=input?.closest(".product-card"),id=card?.dataset.product,p=products.find(x=>x.id===id),preview=card?.querySelector("[data-bulk-preview]");if(!p||!preview)return;
  const q=window.BurgerCompanionCore?.quantity(input.value)||1;preview.textContent=`${q} × ${money(p.price)} = ${money(q*Number(p.price||0))}`;
}
function renderCategories(){
  $("categoryTabs").innerHTML=Object.entries({all:"Todos",...CATS}).map(([k,v])=>`<button class="category-tab ${k===activeCategory?"active":""}" data-cat="${k}" aria-pressed="${k===activeCategory}">${v}</button>`).join("");
  $("categoryTabs").onclick=e=>{const b=e.target.closest("[data-cat]");if(!b)return;activeCategory=b.dataset.cat;renderCategories();renderProducts();$("productGrid").scrollTop=0;document.querySelector(`[data-cat="${activeCategory}"]`)?.focus({preventScroll:true})};
}
function renderProducts(){
  const q=normalize($("productSearch").value.trim()),arr=products.filter(p=>p.active).filter(p=>activeCategory==="all"||p.category===activeCategory).filter(p=>!q||normalize(p.name).includes(q));
  $("productCount").textContent=`${arr.length} producto${arr.length===1?"":"s"}`;
  $("productGrid").innerHTML=arr.length?arr.map(p=>`<article class="product-card" data-product="${esc(p.id)}"><div class="product-photo">${productArt(p)}${productBadge(p)?`<span class="product-badge">${esc(productBadge(p))}</span>`:""}<span class="in-cart-count" hidden></span></div><div class="product-copy"><span class="product-category">${esc(productSubtitle(p))}</span><h3>${esc(p.name)}</h3>${productContents(p)?`<p class="product-contents">${esc(productContents(p))}</p>`:""}<div class="product-bottom"><strong>${money(p.price)}</strong><div class="bulk-add"><label class="bulk-qty-label" for="bulkQty-${esc(p.id)}">Cantidad</label><input id="bulkQty-${esc(p.id)}" class="bulk-qty" data-bulk-qty="${esc(p.id)}" type="number" min="1" max="9999" step="1" value="1" inputmode="numeric" aria-label="Cantidad de ${esc(p.name)}"><button class="add-product" data-add="${esc(p.id)}" aria-label="Agregar la cantidad indicada de ${esc(p.name)}" title="Agregar cantidad indicada">${uiIcon("plus")}</button><div class="bulk-presets" role="group" aria-label="Cantidades rápidas de ${esc(p.name)}"><button type="button" data-add-preset="${esc(p.id)}" data-quantity="10">+10</button><button type="button" data-add-preset="${esc(p.id)}" data-quantity="25">+25</button><button type="button" data-add-preset="${esc(p.id)}" data-quantity="50">+50</button><button type="button" data-add-preset="${esc(p.id)}" data-quantity="100">+100</button></div><small class="bulk-preview" data-bulk-preview="${esc(p.id)}">1 × ${money(p.price)} = ${money(p.price)}</small></div></div></div></article>`).join(""):`<div class="catalog-empty"><strong>No encontramos ese producto</strong><span>Prueba otro nombre o cambia de categoría.</span></div>`;
  $("productGrid").onclick=e=>{const preset=e.target.closest("[data-add-preset]");if(preset){addToCart(preset.dataset.addPreset,Number(preset.dataset.quantity));return}const b=e.target.closest("[data-add]");if(!b)return;const input=b.closest(".bulk-add")?.querySelector("[data-bulk-qty]"),requested=input?.value||1;if(addToCart(b.dataset.add,requested)&&input){input.value="1";updateBulkPreview(input)}};
  $("productGrid").oninput=e=>{if(e.target.matches("[data-bulk-qty]"))updateBulkPreview(e.target)};
  $("productGrid").onkeydown=e=>{if(e.key==="Enter"&&e.target.matches("[data-bulk-qty]")){e.preventDefault();const input=e.target;if(addToCart(input.dataset.bulkQty,input.value)){input.value="1";updateBulkPreview(input)}}};
  updateProductSelection();
}
function calc(){
  const lines=Object.entries(cart).map(([id,qty])=>{const p=products.find(x=>x.id===id);return p?{...p,qty,lineTotal:Number(p.price)*qty}:null}).filter(Boolean),subtotal=lines.reduce((s,x)=>s+x.lineTotal,0);
  const d=discounts.find(x=>x.id===$("discountSelect").value&&x.active)||discounts.find(x=>Number(x.percent)===0)||{id:null,name:"Sin convenio",percent:0,scope:"all",exclude_public:false};
  const client=$("clientType").value,blocked=d.exclude_public&&["police","sheriff","ems"].includes(client),eligible=blocked?[]:lines.filter(x=>d.scope==="all"?x.tag!=="none":x.tag===d.scope),base=eligible.reduce((s,x)=>s+x.lineTotal,0),disc=Math.round(base*Number(d.percent||0)/100),total=subtotal-disc,pct=Number(profile?.commission_percent||0),earning=total*pct/100;
  return{lines,subtotal,d,client,blocked,disc,total,pct,earning};
}
function renderCart(){
  const prev=$("discountSelect").value;
  $("discountSelect").innerHTML=discounts.filter(x=>x.active).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${Number(x.percent)?` · ${Number(x.percent)}%`:""}</option>`).join("");
  if(discounts.some(x=>x.id===prev&&x.active))$("discountSelect").value=prev;
  const c=calc();
  $("cartEmpty").classList.toggle("hidden",c.lines.length>0);
  $("orderCount").textContent=c.lines.reduce((sum,x)=>sum+x.qty,0);
  $("clearCartBtn").disabled=!c.lines.length;
  $("cartList").innerHTML=c.lines.map(x=>`<article class="cart-item"><div class="cart-photo">${productArt(x,true)}</div><div class="cart-copy"><h4>${esc(x.name)}</h4><small>${money(x.price)} c/u</small><button class="remove-line" data-remove="${esc(x.id)}" aria-label="Quitar ${esc(x.name)}" title="Quitar producto">${uiIcon("trash")}</button></div><div class="cart-numbers"><div class="qty" role="group" aria-label="Cantidad de ${esc(x.name)}"><button data-q="${esc(x.id)}" data-d="-1" aria-label="Restar uno a ${esc(x.name)}">${uiIcon("minus")}</button><input class="qty-input" data-q-input="${esc(x.id)}" type="number" min="1" max="9999" step="1" value="${x.qty}" inputmode="numeric" aria-label="Cantidad de ${esc(x.name)}"><button data-q="${esc(x.id)}" data-d="1" aria-label="Sumar uno a ${esc(x.name)}">${uiIcon("plus")}</button></div><div class="line-total"><span>${x.qty} × ${money(x.price)}</span><strong>${money(x.lineTotal)}</strong></div></div></article>`).join("");
  $("cartList").onclick=e=>{
    const remove=e.target.closest("[data-remove]"),b=e.target.closest("[data-q]");
    if(remove){delete cart[remove.dataset.remove];renderCart();return}
    if(!b)return;
    const id=b.dataset.q,delta=b.dataset.d,scroll=$("cartList").parentElement.scrollTop;
    const next=(cart[id]||0)+Number(delta);if(next>9999)return toast("La cantidad máxima por producto es 9,999");cart[id]=next;if(cart[id]<=0)delete cart[id];renderCart();
    $("cartList").parentElement.scrollTop=scroll;
    Array.from($("cartList").querySelectorAll("[data-q]")).find(el=>el.dataset.q===id&&el.dataset.d===delta)?.focus({preventScroll:true});
  };
  const setCartQuantity=e=>{
    const input=e.target.closest("[data-q-input]");if(!input)return;
    const id=input.dataset.qInput,current=cart[id]||0,requested=window.BurgerCompanionCore?.quantity(input.value,true) ?? (Number.isInteger(Number(input.value))&&Number(input.value)>=0&&Number(input.value)<=9999?Number(input.value):null);
    if(requested===null){input.value=String(current);return toast("La cantidad debe ser un entero entre 0 y 9,999")}
    if(requested===0)delete cart[id];else cart[id]=requested;renderCart();
  };
  $("cartList").onchange=setCartQuantity;
  $("cartList").onkeydown=e=>{if(e.key==="Enter"&&e.target.matches("[data-q-input]")){e.preventDefault();setCartQuantity(e)}};
  $("subtotal").textContent=money(c.subtotal);$("discountAmount").textContent=c.disc?`−${money(c.disc)}`:money(0);$("grandTotal").textContent=money(c.total);$("checkoutTotal").textContent=money(c.total);$("commissionPreview").textContent=money(c.earning);$("commissionPercentText").textContent=`${c.pct}% comisión`;
  $("discountNote").textContent=c.blocked?"Este convenio no aplica a este tipo de cliente.":(c.d.description||"");$("discountNote").classList.toggle("is-warning",c.blocked);$("checkoutBtn").disabled=!c.lines.length;
  updateProductSelection();renderOrderTemplates();
  companion?.refresh();
}
function updateCheckoutClientState(){
  const field=$("saleClient"),button=$("confirmSaleBtn");if(!field||!button)return;
  const valid=Boolean(field.value.trim());
  if(!saleSaving){button.disabled=!valid;button.setAttribute("aria-disabled",String(!valid));button.title=valid?"Registrar venta":"Escribe Cliente / ID para continuar"}
  companion?.syncReview();
}
function openCheckout(){const c=calc();if(!c.lines.length)return;const bad=c.lines.find(x=>x.restriction&&x.restriction!==c.client);if(bad)return toast(`${bad.name} no corresponde al tipo de cliente seleccionado`);$("checkoutSummary").innerHTML=c.lines.map(x=>`<div><span>${x.qty}× ${esc(x.name)}</span><strong>${money(x.lineTotal)}</strong></div>`).join("")+`<div><span>Descuento · ${esc(c.d.name)}</span><strong>-${money(c.disc)}</strong></div><div><span>Tu ganancia estimada (${c.pct}%)</span><strong>${money(c.earning)}</strong></div><div class="sum-total"><span>Total</span><strong>${money(c.total)}</strong></div>`;$("saleClient").value="";$("saleClient").setCustomValidity("");$("saleNote").value="";checkoutSnapshot=JSON.stringify({lines:c.lines.map(x=>[x.id,x.qty,x.price,x.restriction,x.active]),discount:c.d,total:c.total,client:c.client,pct:c.pct});$("checkoutModal").classList.remove("hidden");companion?.onCheckout();updateCheckoutClientState();$("saleClient").focus()}
async function saveSale(){
  if(saleSaving)return;
  if(!user||!profile?.active)return toast("Inicia sesión con una cuenta activa para registrar.");
  if(companion?.validateCheckout()===false)return;
  const c=calc();if(!c.lines.length)return;
  const bad=c.lines.find(x=>!x.active||(x.restriction&&x.restriction!==c.client));
  if(bad)return toast(`Revisa el producto ${bad.name} y el tipo de cliente`);
  const saleClient=$("saleClient").value.trim();
  if(!saleClient){
    $("saleClient").setCustomValidity("Escribe el nombre o ID del cliente");
    $("saleClient").reportValidity?.();
    $("saleClient").focus();
    updateCheckoutClientState();
    return toast("El cliente o ID es obligatorio para registrar la venta");
  }
  $("saleClient").setCustomValidity("");
  const current=JSON.stringify({lines:c.lines.map(x=>[x.id,x.qty,x.price,x.restriction,x.active]),discount:c.d,total:c.total,client:c.client,pct:c.pct});
  if(checkoutSnapshot!==current){openCheckout();toast("La orden cambió. Revisa el resumen antes de confirmar.");return}
  saleSaving=true;const button=$("confirmSaleBtn"),label=button.textContent;button.disabled=true;button.textContent="Registrando…";
  try{
    const payload={store_id:profile.store_id,created_by:user.id,employee_name:profile.name,client:saleClient,client_type:c.client,payment:$("salePayment").value,note:$("saleNote").value.trim(),items:c.lines.map(x=>({id:x.id,name:x.name,price:Number(x.price),qty:x.qty,lineTotal:x.lineTotal})),subtotal:c.subtotal,discount_id:c.d.id||null,discount_name:c.blocked?"Sin convenio":c.d.name,discount_percent:c.blocked?0:Number(c.d.percent||0),discount_amount:c.disc,total:c.total,status:"active"};
    const {data:createdSale,error}=await sb.from("sales").insert(payload).select("id").single();if(error)throw error;
    if(createdSale?.id)notifyDiscord("sale_created",{sale_id:createdSale.id});
    cart={};checkoutSnapshot=null;$("checkoutModal").classList.add("hidden");companion?.saved();renderCart();await loadData();toast("Venta registrada");
  }catch(error){toast(error.message||"No se pudo registrar. Tu orden sigue disponible.")}
  finally{saleSaving=false;button.disabled=false;button.textContent=label;updateCheckoutClientState();companion?.refresh()}
}
function renderMySales(){
  if(!profile)return;const mine=filteredRows('mySales'),m=sums(mine),pending=mine.filter(s=>s.status==='active'&&!s.payout_id).reduce((a,s)=>a+Number(s.employee_earnings),0),paid=mine.filter(s=>s.payout_id).reduce((a,s)=>a+Number(s.employee_earnings),0);
  $("myMetrics").innerHTML=metricHTML([["Ventas",m.count,"activas en el filtro"],["Generado",reportMoney(m.generated),"en el filtro","accent"],["Mi ganancia",reportMoney(m.earnings),"comisiones originales","green"],["Pendiente",reportMoney(pending),"ventas filtradas"],["Pagado",reportMoney(paid),"ventas filtradas"]]);
  const arr=reportPage('mySales',mine);$("mySalesBody").innerHTML=arr.length?arr.map(s=>`<tr><td><strong>${folio(s)}</strong></td><td>${fmtDate(s.created_at)}</td><td>${esc(s.client)}</td><td><strong>${reportMoney(s.total)}</strong></td><td><strong>${reportMoney(s.employee_earnings)}</strong></td><td>${reportMoney(s.business_net)}</td><td>${s.payout_id?`<span class="badge green">Pagado</span>`:`<span class="badge gold">Pendiente</span>`}</td><td>${statusBadge(s)}</td><td><button class="row-btn" data-sale="${s.id}">Ver</button></td></tr>`).join(""):`<tr><td colspan="9">No hay ventas.</td></tr>`;bindSaleButtons();
}
function renderAnalytics(){
  if(!profile)return;const base=filteredRows('analytics'),m=sums(base);reportSummary('analytics',base.length);
  $("analyticsMetrics").innerHTML=metricHTML([["Ventas",m.count,"activas en el filtro"],["Generado",reportMoney(m.generated),"en el filtro","accent"],["Ganancias",reportMoney(m.earnings),"comisiones"],["Neto",reportMoney(m.net),"negocio","green"]]);
  const active=m.a,bounds=dateBounds('analytics');
  let start=bounds.start||new Date(active.length?Math.min(...active.map(s=>+new Date(s.created_at))):Date.now());start=new Date(start);start.setHours(0,0,0,0);
  let end=bounds.end;if(!end){end=new Date(active.length?Math.max(...active.map(s=>+new Date(s.created_at))):Date.now());end.setHours(0,0,0,0);end.setDate(end.getDate()+1)}
  const calendar=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()),span=Math.max(1,Math.round((calendar(end)-calendar(start))/86400000)),step=Math.max(1,Math.ceil(span/12)),days=[];
  const label=d=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(d);
  for(let offset=0;offset<span;offset+=step){const d=new Date(start);d.setDate(d.getDate()+offset);const n=new Date(d);n.setDate(n.getDate()+step);days.push({label:label(d),total:active.filter(s=>new Date(s.created_at)>=d&&new Date(s.created_at)<n).reduce((a,s)=>a+Number(s.total),0)})}
  const max=Math.max(...days.map(x=>x.total),1);$("weeklyChart").innerHTML=active.length&&!bounds.error?days.map(x=>`<div class="bar-col"><div class="bar-value">${reportMoney(x.total)}</div><div class="bar" title="${esc(x.label)}: ${reportMoney(x.total)}" style="height:${Math.max(3,x.total/max*85)}%"></div><div class="bar-label">${esc(x.label)}</div></div>`).join(''):'<div class="report-empty">No hay ventas activas en este período.</div>';
  $('chartTitle').textContent='Ventas del período';$('chartSubtitle').textContent=step>1?`Agrupadas cada ${step} días · Primer día de cada grupo`:'Generado por día';
  const count={};active.forEach(s=>(s.items||[]).forEach(i=>count[i.name]=(count[i.name]||0)+Number(i.qty)));const rank=Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,8);$("productRanking").innerHTML=rank.length?rank.map(([n,q],i)=>`<div class="rank-item"><div class="rank-num">${i+1}</div><div><strong>${esc(n)}</strong><small>Unidades en el filtro</small></div><div class="rank-qty">${q}</div></div>`).join(''):'<div class="report-empty">Sin ventas en el filtro.</div>';
}
function renderAllSales(){
  if(!can("view_reports"))return;const rows=filteredRows('allSales'),m=sums(rows);$("allMetrics").innerHTML=metricHTML([["Ventas",m.count,"activas en el filtro"],["Generado",reportMoney(m.generated),"en el filtro","accent"],["Ganancias empleados",reportMoney(m.earnings),"comisiones originales"],["Neto negocio",reportMoney(m.net),"después de comisiones","green"]]);
  const arr=reportPage('allSales',rows);$("allSalesBody").innerHTML=arr.length?arr.map(s=>`<tr><td><strong>${folio(s)}</strong></td><td>${fmtDate(s.created_at)}</td><td>${esc(s.employee_name)}</td><td>${esc(s.client)}</td><td><strong>${reportMoney(s.total)}</strong></td><td>${reportMoney(s.employee_earnings)}</td><td><strong>${reportMoney(s.business_net)}</strong></td><td>${s.payout_id?`<span class="badge green">Pagado</span>`:`<span class="badge gold">Pendiente</span>`}</td><td>${statusBadge(s)}</td><td><button class="row-btn" data-sale="${s.id}">Ver</button></td></tr>`).join(""):`<tr><td colspan="10">No hay ventas.</td></tr>`;bindSaleButtons();
}
function statusBadge(s){return s.status==="active"?`<span class="badge green">Activa</span>`:`<span class="badge red">Anulada</span>`}
function fmtDate(x){return new Intl.DateTimeFormat("es-MX",{dateStyle:"short",timeStyle:"short"}).format(new Date(x))}
function bindSaleButtons(){document.querySelectorAll("[data-sale]").forEach(b=>b.onclick=()=>openSale(b.dataset.sale))}
function salePaymentOptions(value){return ["Efectivo","Transferencia","Tarjeta","Otro"].map(x=>`<option ${x===value?"selected":""}>${x}</option>`).join("")}
function saleClientOptions(value){return [["general","Cliente general"],["police","Policía"],["sheriff","Sheriff"],["ems","EMS"]].map(([id,label])=>`<option value="${id}" ${id===value?"selected":""}>${label}</option>`).join("")}
function renderSaleDetail(s){
  const editing=saleEditId===s.id,locked=Boolean(s.payout_id)||s.status!=="active";
  $("detailFolio").textContent=folio(s);
  const items=(s.items||[]).map(i=>`<div class="detail-item"><span>${i.qty}× ${esc(i.name)}</span><strong>${money(i.lineTotal)}</strong></div>`).join("");
  $("saleDetail").innerHTML=`<div class="detail-grid"><div class="detail-box"><span>Empleado</span><strong>${esc(s.employee_name)}</strong></div><div class="detail-box"><span>Generado</span><strong>${money(s.total)}</strong></div><div class="detail-box"><span>Ganancia empleado</span><strong>${money(s.employee_earnings)}</strong></div><div class="detail-box"><span>Neto negocio</span><strong>${money(s.business_net)}</strong></div><div class="detail-box"><span>Comisión</span><strong>${Number(s.commission_percent||0)}%</strong></div><div class="detail-box"><span>Pago comisión</span><strong>${s.payout_id?"Pagado":"Pendiente"}</strong></div></div>${editing?`<div class="sale-edit-grid"><div><label for="editSaleClient">Cliente / ID</label><input id="editSaleClient" value="${esc(s.client||"")}" maxlength="120"></div><div><label for="editSaleClientType">Tipo de cliente</label><select id="editSaleClientType">${saleClientOptions(s.client_type||"general")}</select></div><div><label for="editSalePayment">Método de pago</label><select id="editSalePayment">${salePaymentOptions(s.payment||"Efectivo")}</select></div><div class="full"><label for="editSaleNote">Nota</label><textarea id="editSaleNote" maxlength="500" rows="3">${esc(s.note||"")}</textarea></div><p class="sale-edit-help">Puedes corregir los datos de la orden. El total y la comisión se conservan porque los importes financieros pertenecen al registro original.</p></div>`:`<div class="sale-meta"><div><span>Cliente</span><strong>${esc(s.client||"Cliente general")}</strong></div><div><span>Tipo</span><strong>${esc({general:"Cliente general",police:"Policía",sheriff:"Sheriff",ems:"EMS"}[s.client_type]||s.client_type||"—")}</strong></div><div><span>Método</span><strong>${esc(s.payment||"—")}</strong></div>${s.note?`<div class="full"><span>Nota</span><strong>${esc(s.note)}</strong></div>`:""}</div>`}<div class="detail-items"><div class="detail-items-head"><span>Productos</span><small>Importes registrados</small></div>${items||`<div class="report-empty">No hay productos en esta orden.</div>`}</div>`;
  const actions=[];
  if(isAdmin()){
    if(editing){actions.push(`<button id="cancelSaleEditBtn" class="btn secondary">Cancelar</button><button id="saveSaleEditBtn" class="btn primary">Guardar cambios</button>`)}
    else if(!locked&&can("edit_orders"))actions.push(`<button id="editSaleBtn" class="btn secondary">Editar orden</button>`);
    if(s.status==="active")actions.push(`<button id="voidBtn" class="btn danger">Anular venta</button>`);
    if(!s.payout_id)actions.push(`<button id="deleteSaleBtn" class="btn secondary">Eliminar orden</button>`);
  }
  $("saleDetailActions").innerHTML=actions.length?actions.join(""):statusBadge(s);
  $("editSaleBtn")&&($("editSaleBtn").onclick=()=>{saleEditId=s.id;renderSaleDetail(s);$("editSaleClient").focus()});
  $("cancelSaleEditBtn")&&($("cancelSaleEditBtn").onclick=()=>{saleEditId=null;renderSaleDetail(s)});
  $("saveSaleEditBtn")&&($("saveSaleEditBtn").onclick=()=>saveSaleEdit(s.id));
  $("voidBtn")&&($("voidBtn").onclick=()=>voidSale(s.id));$("deleteSaleBtn")&&($("deleteSaleBtn").onclick=()=>deleteSale(s.id));
}
function openSale(id){const s=sales.find(x=>x.id===id);if(!s)return;saleEditId=null;renderSaleDetail(s);$("saleDetailModal").classList.remove("hidden")}
async function saveSaleEdit(id){
  const s=sales.find(x=>x.id===id);if(!can("edit_orders")||!s||s.payout_id||s.status!=="active")return toast("Esta orden ya está cerrada y no se puede editar");
  const client=$("editSaleClient").value.trim()||"Cliente general",client_type=$("editSaleClientType").value,payment=$("editSalePayment").value,note=$("editSaleNote").value.trim();
  if(client.length>120||note.length>500)return toast("Revisa la longitud de los datos");
  if((s.items||[]).some(i=>{const p=products.find(x=>x.id===i.id);return p?.restriction&&p.restriction!==client_type}))return toast("El tipo de cliente ya no corresponde a un producto restringido");
  const {error}=await sb.from("sales").update({client,client_type,payment,note}).eq("id",id).eq("store_id",profile.store_id).is("payout_id",null);
  if(error)return toast(error.message||"No se pudo guardar la orden");saleEditId=null;await loadData();$("saleDetailModal").classList.add("hidden");toast("Orden actualizada")
}
async function voidSale(id){if(!isAdmin()||!confirm("¿Anular esta venta?"))return;const {error}=await sb.from("sales").update({status:"void",voided_at:new Date().toISOString(),voided_by:user.id}).eq("id",id);if(error)return toast(error.message);notifyDiscord("sale_voided",{sale_id:id,event_id:crypto.randomUUID?.()||String(Date.now())});$("saleDetailModal").classList.add("hidden");await loadData();toast("Venta anulada")}
async function deleteSale(id){const s=sales.find(x=>x.id===id);if(!isAdmin()||!s)return;if(s.payout_id)return toast("No puedes eliminar una orden que ya fue incluida en un pago. Puedes anularla si lo necesitas.");if(!confirm(`¿Eliminar permanentemente la orden ${folio(s)}? Esta acción no se puede deshacer.`))return;const {error}=await sb.from("sales").delete().eq("id",id);if(error)return toast(error.message);$("saleDetailModal").classList.add("hidden");await loadData();toast("Orden eliminada")}
function employeeStats(e){const list=sales.filter(s=>s.created_by===e.user_id),m=sums(list);return{...m,pending:pendingFor(e.user_id),paid:paidFor(e.user_id)}}
function renderEmployees(){
  if(!can("manage_employees"))return;
  const active=employees.filter(e=>e.active),m=sums(sales),pending=employees.reduce((a,e)=>a+pendingFor(e.user_id),0);
  $("employeeMetrics").innerHTML=metricHTML([["Empleados activos",active.length,"cuentas"],["Generado total",money(m.generated),"ventas","accent"],["Ganancias acumuladas",money(m.earnings),"comisiones"],["Pendiente por pagar",money(pending),"empleados"]]);
  $("employeesBody").innerHTML=employees.length?employees.map(e=>{
    const s=employeeStats(e);
    return `<article class="employee-card" data-employee="${e.user_id}">
      <div class="employee-card-head">
        <div class="employee-avatar">${initials(e.name)}</div>
        <div class="employee-main"><strong>${esc(e.name)}</strong><span>${e.role==="admin"?"Administrador":"Empleado"}</span></div>
        ${e.active?`<span class="status-dot active">Activo</span>`:`<span class="status-dot">Inactivo</span>`}
      </div>
      <div class="employee-card-stats">
        <div><span>Ventas</span><strong>${s.count}</strong></div>
        <div><span>Comisión</span><strong>${Number(e.commission_percent||0)}%</strong></div>
        <div><span>Generado</span><strong>${money(s.generated)}</strong></div>
        <div><span>Ganancia</span><strong class="green">${money(s.earnings)}</strong></div>
      </div>
      <div class="employee-card-foot">
        <div><span>Pendiente</span><strong>${money(s.pending)}</strong></div>
        <button class="employee-open" type="button">Ver registro →</button>
      </div>
    </article>`;
  }).join(""):`<div class="empty-state-panel"><strong>No hay empleados registrados.</strong></div>`;
  document.querySelectorAll("[data-employee]").forEach(b=>b.onclick=()=>openEmployee(b.dataset.employee));
}
function openEmployee(id){
  const e=employees.find(x=>x.user_id===id);if(!e)return;const st=employeeStats(e),list=sales.filter(s=>s.created_by===id);$("editEmployeeId").value=id;$("employeeDetailName").textContent=e.name;$("editEmployeeRole").value=e.role;$("editEmployeeCommission").value=Number(e.commission_percent||0);$("editEmployeeActive").checked=e.active;$("deactivateEmployeeBtn").textContent=e.active?"Dar de baja":"Reactivar cuenta";$("deactivateEmployeeBtn").disabled=id===user.id;$("deleteEmployeeBtn").disabled=id===user.id;$("employeeDetailMetrics").innerHTML=metricHTML([["Ventas",st.count,"activas"],["Generado",money(st.generated),"total","accent"],["Ganancia",money(st.earnings),"acumulada","green"],["Pendiente",money(st.pending),"por pagar"],["Pagado",money(st.paid),"histórico"]]);$("employeeSalesCount").textContent=`${list.length} ventas`;$("employeeSalesBody").innerHTML=list.slice(0,100).map(s=>`<tr><td>${folio(s)}</td><td>${fmtDate(s.created_at)}</td><td>${money(s.total)}</td><td>${money(s.employee_earnings)}</td><td>${s.payout_id?`<span class="badge green">Pagado</span>`:`<span class="badge gold">Pendiente</span>`}</td></tr>`).join("")||`<tr><td colspan="5">Sin ventas.</td></tr>`;$("payEmployeeBtn").disabled=st.pending<=0;$("employeeDetailModal").classList.remove("hidden");
}
async function createEmployee(){
  if(!can("manage_employees"))return toast("No tienes permiso para gestionar empleados");
  $("employeeError").textContent="";const name=$("employeeName").value.trim(),username=uname($("employeeUsername").value),password=$("employeePassword").value,role=$("employeeRole").value,commission=Number($("employeeCommission").value||0);
  if(!name||username.length<3||password.length<6)return $("employeeError").textContent="Nombre, usuario (mín. 3) y contraseña (mín. 6) son obligatorios";
  const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"create",name,username,password,role,commission_percent:commission}});if(error)return $("employeeError").textContent=await edgeErrorMessage(error,data,"No se pudo crear el empleado");if(data?.error)return $("employeeError").textContent=data.error;$("employeeModal").classList.add("hidden");await loadData();toast(`Empleado ${name} creado`);
}
async function saveEmployee(){if(!isAdmin())return toast("Solo un administrador puede cambiar rol, comisión y permisos");const id=$("editEmployeeId").value;if(id===user.id&&!$("editEmployeeActive").checked)return toast("No puedes desactivar tu propia cuenta");const payload={role:$("editEmployeeRole").value,active:$("editEmployeeActive").checked,commission_percent:Number($("editEmployeeCommission").value||0),can_edit_orders:$("permEditOrders").checked,can_manage_catalog:$("permManageCatalog").checked,can_manage_employees:$("permManageEmployees").checked,can_view_reports:$("permViewReports").checked,can_manage_payouts:$("permManagePayouts").checked,can_view_audit:$("permViewAudit").checked};const {error}=await sb.from("profiles").update(payload).eq("user_id",id);if(error)return toast(error.message);await loadData();openEmployee(id);toast("Empleado actualizado")}
async function toggleEmployeeActive(){
  if(!can("manage_employees"))return toast("No tienes permiso para gestionar empleados");
  const id=$("editEmployeeId").value,e=employees.find(x=>x.user_id===id);if(!e||id===user.id)return toast("No puedes dar de baja tu propia cuenta");
  const next=!e.active,verb=next?"reactivar":"dar de baja";
  if(!confirm(`¿Quieres ${verb} a ${e.name}? ${next?"Volverá a poder iniciar sesión.":"Se cerrará su acceso, pero se conservarán sus ventas."}`))return;
  const {error}=await sb.from("profiles").update({active:next}).eq("user_id",id).eq("store_id",profile.store_id);
  if(error)return toast(error.message);await loadData();openEmployee(id);toast(next?"Cuenta reactivada":"Usuario dado de baja");
}
async function deleteEmployee(){
  if(!can("manage_employees"))return toast("No tienes permiso para gestionar empleados");
  const id=$("editEmployeeId").value,e=employees.find(x=>x.user_id===id);if(!e||id===user.id)return toast("No puedes borrar tu propia cuenta");
  if(!confirm(`¿Borrar permanentemente el perfil de ${e.name}? Esta acción elimina su acceso y solo está disponible si no tiene ventas ni cortes asociados.`))return;
  const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"delete",user_id:id}});
  if(error)return toast(await edgeErrorMessage(error,data,"No se pudo borrar el perfil"));if(data?.error)return toast(data.error);
  $("employeeDetailModal").classList.add("hidden");await loadData();toast("Perfil eliminado");
}
function openPasswordReset(){resetTarget=$("editEmployeeId").value;$("newEmployeePassword").value="";$("passwordError").textContent="";$("passwordModal").classList.remove("hidden")}
async function resetPassword(){if(!can("manage_employees"))return $("passwordError").textContent="No tienes permiso";const p=$("newEmployeePassword").value;if(p.length<6)return $("passwordError").textContent="Mínimo 6 caracteres";const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"reset_password",user_id:resetTarget,password:p}});if(error)return $("passwordError").textContent=await edgeErrorMessage(error,data,"No se pudo actualizar la contraseña");if(data?.error)return $("passwordError").textContent=data.error;$("passwordModal").classList.add("hidden");toast("Contraseña actualizada")}
async function payEmployee(){if(!can("manage_payouts"))return toast("No tienes permiso para registrar pagos");const id=$("editEmployeeId").value,st=employeeStats(employees.find(e=>e.user_id===id));if(st.pending<=0)return toast("No hay ganancias pendientes");if(!confirm(`Registrar pago de ${money(st.pending)} a este empleado?`))return;const {data,error}=await sb.rpc("create_employee_payout",{p_employee:id});if(error)return toast(error.message);if(data)notifyDiscord("payout_created",{payout_id:data});$("employeeDetailModal").classList.add("hidden");await loadData();toast("Pago registrado")}
function renderPayouts(){
  if(!can("manage_payouts"))return;const rows=filteredRows('payouts'),total=rows.reduce((a,p)=>a+Number(p.amount),0),gen=rows.reduce((a,p)=>a+Number(p.generated_total),0),net=rows.reduce((a,p)=>a+Number(p.business_net),0);
  $("payoutMetrics").innerHTML=metricHTML([["Cortes",rows.length,"en el filtro"],["Generado incluido",reportMoney(gen),"ventas registradas"],["Pagado empleados",reportMoney(total),"comisiones","accent"],["Neto negocio",reportMoney(net),"en cortes","green"]]);
  const page=reportPage('payouts',rows);
  $("payoutsBody").innerHTML=page.length?page.map(p=>`<tr><td>${fmtDate(p.created_at)}</td><td><strong>${esc(p.employee_name)}</strong></td><td>${p.sales_count}</td><td>${reportMoney(p.generated_total)}</td><td><strong>${reportMoney(p.amount)}</strong></td><td>${reportMoney(p.business_net)}</td><td>${esc(p.created_by_name||"—")}</td><td><button class="row-btn cut-open" data-payout="${esc(p.id)}">Ver corte</button></td></tr>`).join(''):'<tr><td colspan="8">No hay cortes en este filtro.</td></tr>';
  $('payoutsBody').querySelectorAll('[data-payout]').forEach(b=>b.onclick=()=>openPayout(b.dataset.payout));
}
function renderProductsAdmin(){if(!can("manage_catalog"))return;$("editProductCategory").innerHTML=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");$("productsBody").innerHTML=products.map(p=>`<tr><td><div class="admin-product-photo">${productArt(p,true)}<strong>${esc(p.name)}</strong></div></td><td>${esc(CATS[p.category]||p.category)}</td><td><strong>${money(p.price)}</strong></td><td><span class="badge dark">${esc(p.tag)}</span></td><td>${p.active?`<span class="badge green">Activo</span>`:`<span class="badge red">Inactivo</span>`}</td><td><button class="row-btn" data-edit-product="${p.id}">Editar</button></td></tr>`).join("");document.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=()=>openProduct(b.dataset.editProduct))}
function openProduct(id=null){const p=id?products.find(x=>x.id===id):null;$("productModalTitle").textContent=p?"Editar producto":"Nuevo producto";$("editProductId").value=p?.id||"";$("editProductName").value=p?.name||"";$("editProductPrice").value=p?.price||0;$("editProductCategory").value=p?.category||"individuales";$("editProductEmoji").innerHTML=`<option value="">Automática según el nombre</option>`+Object.entries(PHOTO_LABELS).map(([k,v])=>`<option value="photo:${k}">${v}</option>`).join("");$("editProductEmoji").value=String(p?.emoji||"").startsWith("photo:")?p.emoji:"";$("editProductEmoji").dataset.legacy=String(p?.emoji||"").startsWith("photo:")?"🍔":p?.emoji||"🍔";$("editProductTag").value=p?.tag||"all";$("editProductRestriction").value=p?.restriction||"";$("editProductActive").checked=p?p.active:true;$("deleteProductBtn").classList.toggle("hidden",!p);$("productModal").classList.remove("hidden")}
async function saveProduct(){const id=$("editProductId").value,name=$("editProductName").value.trim();if(!name)return toast("Escribe un nombre");const payload={store_id:profile.store_id,name,price:Number($("editProductPrice").value)||0,category:$("editProductCategory").value,emoji:$("editProductEmoji").value||$("editProductEmoji").dataset.legacy||"🍔",tag:$("editProductTag").value,restriction:$("editProductRestriction").value||null,active:$("editProductActive").checked};const r=id?await sb.from("products").update(payload).eq("id",id):await sb.from("products").insert(payload);if(r.error)return toast(r.error.message);$("productModal").classList.add("hidden");await loadData()}
async function deleteProduct(){const id=$("editProductId").value;if(!confirm("¿Eliminar producto?"))return;const {error}=await sb.from("products").delete().eq("id",id);if(error)return toast(error.message);$("productModal").classList.add("hidden");await loadData()}
function renderDiscounts(){$("discountCards").innerHTML=discounts.map(d=>`<article class="discount-card"><div class="discount-top"><div class="discount-pct">${Number(d.percent)}%</div>${d.active?`<span class="badge green">Activo</span>`:`<span class="badge red">Inactivo</span>`}</div><h3>${esc(d.name)}</h3><p>${esc(d.description||"")}</p><div class="discount-foot"><span class="badge dark">${d.scope==="all"?"Todo el menú":esc(d.scope)}</span><button class="row-btn" data-edit-discount="${d.id}" ${d.system?"disabled":""}>${d.system?"Sistema":"Editar"}</button></div></article>`).join("");document.querySelectorAll("[data-edit-discount]:not([disabled])").forEach(b=>b.onclick=()=>openDiscount(b.dataset.editDiscount))}
function openDiscount(id=null){const d=id?discounts.find(x=>x.id===id):null;$("discountModalTitle").textContent=d?"Editar convenio":"Nuevo convenio";$("editDiscountId").value=d?.id||"";$("editDiscountName").value=d?.name||"";$("editDiscountPercent").value=d?.percent??25;$("editDiscountScope").value=d?.scope||"all";$("editDiscountDescription").value=d?.description||"";$("editDiscountExcludePublic").checked=!!d?.exclude_public;$("editDiscountActive").checked=d?d.active:true;$("deleteDiscountBtn").classList.toggle("hidden",!d);$("discountModal").classList.remove("hidden")}
async function saveDiscount(){const id=$("editDiscountId").value,name=$("editDiscountName").value.trim();if(!name)return toast("Escribe un nombre");const p={store_id:profile.store_id,name,percent:Number($("editDiscountPercent").value)||0,scope:$("editDiscountScope").value,description:$("editDiscountDescription").value.trim(),exclude_public:$("editDiscountExcludePublic").checked,active:$("editDiscountActive").checked,system:false};const r=id?await sb.from("discounts").update(p).eq("id",id):await sb.from("discounts").insert(p);if(r.error)return toast(r.error.message);$("discountModal").classList.add("hidden");await loadData()}
async function deleteDiscount(){const id=$("editDiscountId").value;if(!confirm("¿Eliminar convenio?"))return;const {error}=await sb.from("discounts").delete().eq("id",id);if(error)return toast(error.message);$("discountModal").classList.add("hidden");await loadData()}
function openAccount(){$("accountModalName").textContent=profile.name;const mine=sums(sales.filter(s=>s.created_by===user.id));$("accountDetail").innerHTML=`Usuario: <strong>${esc(profile.username||"—")}</strong><br>Rol: ${isAdmin()?"Administrador":"Empleado"}<br>Comisión actual: ${Number(profile.commission_percent||0)}%<br>Generado: ${money(mine.generated)}<br>Ganancia: ${money(mine.earnings)}`;$("accountModal").classList.remove("hidden")}
// Reports use the same filtered rows for tables, metrics and exports.
const REPORT_PAGE_SIZE=25;
const reportState=Object.fromEntries(['mySales','allSales','analytics','payouts','audit'].map(k=>[k,{period:'all',start:'',end:'',employee:'',status:'',entity:'',page:0}]));
let auditRows=[],auditPage=0,auditHasNext=false,auditRequest=0,payoutRequest=0,detailPayout=null,detailPayoutSales=[];
const reportMoney=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(Number(n)||0);
const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const AUDIT_ENTITIES={sales:'Venta',profiles:'Empleado',products:'Producto',discounts:'Convenio',employee_payouts:'Corte'};
const AUDIT_ACTIONS={insert:'Creación',update:'Actualización',delete:'Eliminación',void:'Anulación',paid:'Comisión pagada',deactivate:'Baja de usuario',reactivate:'Reactivación'};
function dateBounds(scope){
  const f=reportState[scope];let start=null,end=null;
  if(f.period==='custom'){
    if(!f.start||!f.end)return {error:'Selecciona la fecha inicial y final.'};
    start=new Date(f.start+'T00:00:00');end=new Date(f.end+'T00:00:00');
    if(!Number.isFinite(+start)||!Number.isFinite(+end)||localDay(start)!==f.start||localDay(end)!==f.end||start>end)return {error:'La fecha inicial debe ser anterior o igual a la final.'};
    end.setDate(end.getDate()+1);
  }else if(f.period!=='all'){
    start=new Date();start.setHours(0,0,0,0);end=new Date(start);
    if(f.period==='today')end.setDate(end.getDate()+1);
    if(f.period==='week'){start.setDate(start.getDate()-(start.getDay()+6)%7);end=new Date(start);end.setDate(end.getDate()+7)}
    if(f.period==='month'){start.setDate(1);end=new Date(start);end.setMonth(end.getMonth()+1)}
  }
  return {start,end};
}
function initReports(){
  Object.keys(reportState).forEach(scope=>{
    const host=$(scope+'Filters'),isSales=['mySales','allSales'].includes(scope);
    host.innerHTML=`<div class="filter-fields"><label>Período<select data-filter="period"><option value="all">Todo el historial</option><option value="today">Hoy</option><option value="week">Esta semana</option><option value="month">Este mes</option><option value="custom">Personalizado</option></select></label><label class="date-field hidden">Desde<input type="date" data-filter="start"></label><label class="date-field hidden">Hasta<input type="date" data-filter="end"></label>${scope!=='mySales'?`<label class="employee-filter">${scope==='audit'?'Responsable':'Empleado'}<select data-filter="employee"><option value="">Todos</option></select></label>`:''}${isSales?'<label>Estado<select data-filter="status"><option value="">Todos los estados</option><option value="active">Activas</option><option value="void">Anuladas</option></select></label>':''}${scope==='audit'?`<label>Registro<select data-filter="entity"><option value="">Todos los registros</option>${Object.entries(AUDIT_ENTITIES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Acción<select data-filter="status"><option value="">Todas las acciones</option>${Object.entries(AUDIT_ACTIONS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>`:''}<button type="button" class="filter-reset">Limpiar filtros</button></div><div class="filter-summary" aria-live="polite"></div>`;
    host.onchange=e=>{const key=e.target.dataset.filter;if(!key)return;reportState[scope][key]=e.target.value;reportState[scope].page=0;host.querySelectorAll('.date-field').forEach(x=>x.classList.toggle('hidden',reportState[scope].period!=='custom'));updateReport(scope)};
    host.querySelector('.filter-reset').onclick=()=>{Object.assign(reportState[scope],{period:'all',start:'',end:'',employee:'',status:'',entity:'',page:0});host.querySelectorAll('[data-filter]').forEach(x=>x.value=reportState[scope][x.dataset.filter]);host.querySelectorAll('.date-field').forEach(x=>x.classList.add('hidden'));const search=$(scope+'Search');if(search)search.value='';updateReport(scope)};
  });
  $('myCsvBtn').onclick=()=>exportCSV('mySales');$('payoutCsvBtn').onclick=exportPayoutCSV;
  $('payoutDetailCsvBtn').onclick=()=>{if(detailPayout)downloadSalesCSV(detailPayoutSales,`burgershot-corte-${detailPayout.id.slice(0,8)}.csv`)};
  $('auditRefreshBtn').onclick=()=>loadAudit(0);
  for(const scope of ['mySales','allSales'])$(scope+'Search').oninput=()=>{reportState[scope].page=0;updateReport(scope)};
  // Accessible focus return and Escape behavior for the new dialogs.
  for(const id of ['payoutDetailModal','auditDetailModal']){
    const modal=$(id);modal.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>modal._opener?.focus()));
    modal.addEventListener('keydown',e=>{if(e.key==='Escape'){modal.classList.add('hidden');modal._opener?.focus();return}if(e.key!=='Tab')return;const focusable=[...modal.querySelectorAll('button:not([disabled]),summary,[tabindex="0"]')];const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}});
  }
}
function updateReport(scope){
  if(scope==='audit')return loadAudit(0);
  ({mySales:renderMySales,allSales:renderAllSales,analytics:renderAnalytics,payouts:renderPayouts})[scope]();
}
function refreshReportEmployees(){
  const names=new Map();employees.forEach(e=>names.set(e.user_id,`${e.name}${e.active?'':' · Inactivo'}`));
  sales.forEach(s=>{if(!names.has(s.created_by))names.set(s.created_by,s.employee_name)});
  payouts.forEach(p=>{if(!names.has(p.employee_id))names.set(p.employee_id,p.employee_name)});
  for(const scope of ['allSales','analytics','payouts','audit']){
    const select=$(scope+'Filters').querySelector('[data-filter="employee"]');
    select.closest('label').classList.toggle('hidden',!isAdmin());
    const options=new Map(names);if(scope==='audit')auditRows.forEach(a=>{if(a.actor_id&&!options.has(a.actor_id))options.set(a.actor_id,a.actor_name)});
    // Keep a selected deleted actor available when moving to another page.
    if(reportState[scope].employee&&reportState[scope].employee!=='system'&&!options.has(reportState[scope].employee))options.set(reportState[scope].employee,select.selectedOptions[0]?.textContent||'Cuenta anterior');
    select.innerHTML='<option value="">Todos</option>'+[...options].sort((a,b)=>a[1].localeCompare(b[1],'es')).map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join('')+(scope==='audit'?'<option value="system">Servicio / SQL</option>':'');select.value=reportState[scope].employee;
  }
}
function filteredRows(scope){
  const f=reportState[scope],bounds=dateBounds(scope),q=normalize($(scope+'Search')?.value.trim()||'');
  if(bounds.error)return [];
  const source=scope==='payouts'?payouts:sales;
  return source.filter(row=>{
    const employee=scope==='payouts'?row.employee_id:row.created_by;
    if((scope==='mySales'||!isAdmin())&&employee!==user.id)return false;
    if(isAdmin()&&f.employee&&employee!==f.employee)return false;
    if(f.status&&row.status!==f.status)return false;
    const date=new Date(row.created_at);
    if(bounds.start&&date<bounds.start||bounds.end&&date>=bounds.end)return false;
    return !q||normalize([folio(row),row.client,row.employee_name].join(' ')).includes(q);
  });
}
function reportSummary(scope,count){
  const bounds=dateBounds(scope),host=$(scope+'Filters').querySelector('.filter-summary');
  host.textContent=bounds.error||`${count} registro${count===1?'':'s'} en el filtro · Totales de ventas activas${scope==='payouts'?' al registrar cada corte':''} · Hora local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
  host.classList.toggle('is-error',Boolean(bounds.error));
  const button=$({allSales:'csvBtn',mySales:'myCsvBtn',payouts:'payoutCsvBtn'}[scope]);if(button)button.disabled=Boolean(bounds.error)||!count;
}
function reportPage(scope,rows){
  const f=reportState[scope],pages=Math.max(1,Math.ceil(rows.length/REPORT_PAGE_SIZE));f.page=Math.min(f.page,pages-1);
  const start=f.page*REPORT_PAGE_SIZE,host=$(scope+'Pager');
  host.innerHTML=`<span>${rows.length?`${start+1}–${Math.min(start+REPORT_PAGE_SIZE,rows.length)} de ${rows.length}`:'Sin resultados'}</span><div><button class="row-btn" data-prev ${f.page===0?'disabled':''}>Anterior</button><span>${f.page+1} / ${pages}</span><button class="row-btn" data-next ${f.page>=pages-1?'disabled':''}>Siguiente</button></div>`;
  host.querySelector('[data-prev]').onclick=()=>{f.page--;updateReport(scope)};host.querySelector('[data-next]').onclick=()=>{f.page++;updateReport(scope)};
  reportSummary(scope,rows.length);return rows.slice(start,start+REPORT_PAGE_SIZE);
}
async function readAll(makeQuery){
  const rows=[];let offset=0;
  // Advance by the actual page length, including projects with a lower API cap.
  for(;;){const {data,error}=await makeQuery().range(offset,offset+499);if(error)return {data:null,error};if(!data?.length)break;rows.push(...data);offset+=data.length}
  return {data:[...new Map(rows.map(r=>[r.id||r.user_id,r])).values()],error:null};
}
function openReportModal(id){const modal=$(id);modal._opener=document.activeElement;modal.classList.remove('hidden');modal.querySelector('[data-close]')?.focus()}
async function openPayout(id){
  if(!can("manage_payouts"))return;const request=++payoutRequest;
  detailPayout=null;detailPayoutSales=[];$('payoutDetailCsvBtn').disabled=true;$('payoutDetailTitle').textContent='Detalle del corte';$('payoutDetailMeta').textContent='';$('payoutDetailContent').textContent='Cargando ventas del corte…';openReportModal('payoutDetailModal');
  try{
    const {data:p,error}=await sb.from('employee_payouts').select('*').eq('id',id).eq('store_id',profile.store_id).single();
    if(error)throw error;if(!p)throw new Error('No se encontró este corte.');
    const captured=Array.isArray(p.sales_snapshot);
    const result=captured?{data:p.sales_snapshot,error:null}:await readAll(()=>sb.from('sales').select('*').eq('store_id',profile.store_id).eq('payout_id',id).order('created_at').order('id'));
    if(result.error)throw result.error;if(request!==payoutRequest||!can("manage_payouts"))return;
    detailPayout=p;detailPayoutSales=result.data.map(s=>({...s,payout_id:id}));
    $('payoutDetailTitle').textContent=`Corte · ${p.employee_name}`;
    $('payoutDetailMeta').textContent=`${fmtDate(p.created_at)} · Registrado por ${p.created_by_name||'—'} · ${id.slice(0,8)}`;
    const rows=detailPayoutSales,generated=rows.reduce((a,s)=>a+Number(s.total),0),earnings=rows.reduce((a,s)=>a+Number(s.employee_earnings),0),net=rows.reduce((a,s)=>a+Number(s.business_net),0);
    const mismatch=rows.length!==Number(p.sales_count)||Math.abs(generated-Number(p.generated_total))>.009||Math.abs(earnings-Number(p.amount))>.009||Math.abs(net-Number(p.business_net))>.009;
    $('payoutDetailContent').innerHTML=`<div class="metrics cut-metrics">${metricHTML([['Ventas incluidas',p.sales_count,'en este corte'],['Generado',reportMoney(p.generated_total),'importe registrado'],['Pago al empleado',reportMoney(p.amount),'comisión liquidada','accent'],['Neto negocio',reportMoney(p.business_net),'importe registrado','green']])}</div><p class="report-notice">${captured?'Este detalle conserva las ventas tal como estaban al registrar el corte.':'Corte anterior a V5.1: se muestran las ventas vinculadas en su estado actual. Los totales superiores son los importes originales del corte.'}${mismatch?' Los registros disponibles no coinciden con los importes del corte; revisa las diferencias antes de usar la exportación.':''}</p><div class="cut-sales">${rows.map(s=>`<details class="cut-sale"><summary><span><strong>${folio(s)}</strong><small>${fmtDate(s.created_at)} · ${esc(s.client||'Cliente general')}</small></span><span class="cut-sale-amount"><small>Venta / comisión</small><strong>${reportMoney(s.total)} / <em>${reportMoney(s.employee_earnings)}</em></strong><small>${Number(s.commission_percent)}%${s.status!=='active'?' · Anulada actualmente':''}</small></span></summary><div class="cut-sale-items">${(s.items||[]).map(i=>`<div><span>${Number(i.qty)} × ${esc(i.name)}</span><strong>${reportMoney(i.lineTotal)}</strong></div>`).join('')}<div><span>Descuento · ${esc(s.discount_name||'Sin convenio')}</span><strong>−${reportMoney(s.discount_amount)}</strong></div><div><span>Neto del negocio</span><strong>${reportMoney(s.business_net)}</strong></div><p>Método: ${esc(s.payment||'—')}${s.note?` · Nota: ${esc(s.note)}`:''}</p></div></details>`).join('')||'<div class="report-empty">No hay ventas vinculadas disponibles. Se conservan los totales del corte.</div>'}</div>`;
    $('payoutDetailCsvBtn').disabled=!rows.length;
  }catch(e){if(request===payoutRequest){$('payoutDetailContent').textContent=`No se pudo cargar el corte. ${e.message||'Intenta abrirlo de nuevo.'}`}}
}
async function loadAudit(page=0){
  if(!can("view_audit"))return;const request=++auditRequest,bounds=dateBounds('audit'),f=reportState.audit;
  $('auditStatus').classList.add('hidden');$('auditPager').innerHTML='';$('auditBody').innerHTML='<tr><td colspan="5">Cargando historial…</td></tr>';
  const summary=$('auditFilters').querySelector('.filter-summary');summary.textContent=bounds.error||`Hora local (${Intl.DateTimeFormat().resolvedOptions().timeZone}) · Solo administradores`;summary.classList.toggle('is-error',!!bounds.error);
  if(bounds.error){auditRows=[];$('auditBody').innerHTML='<tr><td colspan="5">Completa un período válido.</td></tr>';return}
  try{
    let query=sb.from('audit_events').select('*').eq('store_id',profile.store_id).order('created_at',{ascending:false}).order('id',{ascending:false});
    if(bounds.start)query=query.gte('created_at',bounds.start.toISOString());if(bounds.end)query=query.lt('created_at',bounds.end.toISOString());
    if(f.employee)query=f.employee==='system'?query.is('actor_id',null):query.eq('actor_id',f.employee);
    if(f.entity)query=query.eq('entity',f.entity);if(f.status)query=query.eq('action',f.status);
    const {data,error}=await query.range(page*REPORT_PAGE_SIZE,page*REPORT_PAGE_SIZE+REPORT_PAGE_SIZE);
    if(error)throw error;if(request!==auditRequest||!can("view_audit"))return;
    auditRows=(data||[]).slice(0,REPORT_PAGE_SIZE);auditHasNext=(data||[]).length>REPORT_PAGE_SIZE;auditPage=page;
    $('auditBody').innerHTML=auditRows.length?auditRows.map(a=>`<tr><td>${fmtDate(a.created_at)}</td><td><strong>${esc(a.actor_name)}</strong></td><td><span class="badge ${['delete','void','deactivate'].includes(a.action)?'red':'dark'}">${esc(AUDIT_ACTIONS[a.action]||a.action)}</span></td><td><strong>${esc(a.entity_name)}</strong><small class="audit-entity">${esc(AUDIT_ENTITIES[a.entity]||a.entity)}</small></td><td><button class="row-btn" data-audit="${esc(a.id)}">Ver cambios</button></td></tr>`).join(''):'<tr><td colspan="5">No hay cambios en este filtro. Los eventos aparecerán después de realizar operaciones.</td></tr>';
    $('auditBody').querySelectorAll('[data-audit]').forEach(b=>b.onclick=()=>openAuditDetail(b.dataset.audit));
    $('auditPager').innerHTML=`<span>Página ${page+1} · ${auditRows.length} cambios</span><div><button class="row-btn" data-prev ${page===0?'disabled':''}>Anterior</button><button class="row-btn" data-next ${!auditHasNext?'disabled':''}>Siguiente</button></div>`;
    $('auditPager').querySelector('[data-prev]').onclick=()=>loadAudit(auditPage-1);$('auditPager').querySelector('[data-next]').onclick=()=>loadAudit(auditPage+1);refreshReportEmployees();
  }catch(e){if(request!==auditRequest)return;auditRows=[];$('auditBody').innerHTML='';$('auditStatus').classList.remove('hidden');$('auditStatus').textContent=['42P01','PGRST205'].includes(e.code)?'Falta activar el historial. Ejecuta supabase_patch_v5_1.sql en el SQL Editor de tu proyecto y pulsa Actualizar historial.':`No se pudo cargar el historial. ${e.message||'Revisa tu conexión e inténtalo de nuevo.'}`}
}
const AUDIT_FIELDS={name:'Nombre',username:'Usuario',role:'Rol',active:'Activo',commission_percent:'Comisión',price:'Precio',category:'Categoría',emoji:'Imagen',tag:'Etiqueta',restriction:'Restricción',percent:'Descuento',scope:'Alcance',description:'Descripción',exclude_public:'Excluir servicios públicos',sale_number:'Folio',employee_name:'Empleado',client:'Cliente / ID',client_type:'Tipo de cliente',payment:'Método de pago',note:'Nota',items:'Productos y cantidades',subtotal:'Subtotal',discount_name:'Convenio',discount_percent:'Descuento aplicado',discount_amount:'Importe de descuento',total:'Total',employee_earnings:'Comisión del empleado',business_net:'Neto negocio',status:'Estado',payout_id:'Corte',generated_total:'Generado',amount:'Pago',sales_count:'Ventas incluidas'};
function auditValue(key,value){
  if(value===undefined||value===null||value==='')return '—';if(typeof value==='boolean')return value?'Sí':'No';
  if(key==='items'){try{const rows=Array.isArray(value)?value:JSON.parse(value);return rows.map(x=>`${Number(x.qty)||0} × ${x.name||x.id||'Producto'}`).join(', ')||'—';}catch{return '—'}}
  if(['price','total','employee_earnings','business_net','generated_total','amount'].includes(key))return reportMoney(value);
  if(['commission_percent','percent'].includes(key))return `${Number(value)}%`;
  if(key==='sale_number')return folio({sale_number:value});
  if(key==='role')return value==='admin'?'Administrador':'Empleado';
  if(key==='status')return value==='active'?'Activa':'Anulada';
  if(key==='category')return CATS[value]||value;
  return String(value);
}
function openAuditDetail(id){
  if(!can("view_audit"))return;const event=auditRows.find(a=>a.id===id);if(!event)return;
  $('auditDetailTitle').textContent=`${AUDIT_ACTIONS[event.action]||event.action} · ${event.entity_name}`;
  $('auditDetailMeta').textContent=`${event.actor_name} · ${fmtDate(event.created_at)}`;
  const before=event.before_data||{},after=event.after_data||{},keys=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));
  $('auditDetailContent').innerHTML=`<div class="table-wrap"><table class="audit-diff"><thead><tr><th>Campo</th><th>Antes</th><th>Después</th></tr></thead><tbody>${keys.map(k=>`<tr><td>${esc(AUDIT_FIELDS[k]||k)}</td><td>${esc(auditValue(k,before[k]))}</td><td><strong>${esc(auditValue(k,after[k]))}</strong></td></tr>`).join('')}</tbody></table></div>`;openReportModal('auditDetailModal');
}
function downloadCSV(rows,filename){
  // Quoting alone does not stop spreadsheet formulas in user-entered names.
  const cell=v=>{let s=String(v??'');if(typeof v==='string'&&/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const csv='\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function downloadSalesCSV(rows,name){downloadCSV([['Folio','Fecha UTC','Empleado','Cliente','Generado','Comisión %','Ganancia empleado','Neto negocio','Pago comisión','Estado'],...rows.map(s=>[folio(s),s.created_at,s.employee_name,s.client,Number(s.total),Number(s.commission_percent),Number(s.employee_earnings),Number(s.business_net),s.payout_id?'Pagado':'Pendiente',s.status])],name)}
function exportCSV(scope='allSales'){
  if(typeof scope!=='string')scope='allSales';if(scope==='allSales'&&!can("view_reports"))return;
  if(dateBounds(scope).error)return toast(dateBounds(scope).error);downloadSalesCSV(filteredRows(scope),'burgershot-ventas-filtradas.csv');
}
function exportPayoutCSV(){
  if(!can("manage_payouts")||dateBounds('payouts').error)return;
  downloadCSV([['ID corte','Fecha UTC','Empleado','Ventas incluidas','Generado','Pago empleado','Neto negocio','Registró'],...filteredRows('payouts').map(p=>[p.id,p.created_at,p.employee_name,Number(p.sales_count),Number(p.generated_total),Number(p.amount),Number(p.business_net),p.created_by_name])],'burgershot-cortes-filtrados.csv');
}

// V5.2: complete editing of active, unpaid orders.
function saleDraftLines(draft){return (draft?.items||[]).map(i=>{const p=products.find(x=>x.id===i.id);return {...i,name:p?.name||i.name,price:Number(p?.price??i.price)||0,tag:p?.tag??i.tag??"all",restriction:p?.restriction??i.restriction??null,active:p?.active!==false,qty:Math.max(0,Math.min(99,Number(i.qty)||0))}}).filter(i=>i.qty>0)}
function calcSaleDraft(s,draft){const lines=saleDraftLines(draft),subtotal=lines.reduce((sum,i)=>sum+i.price*i.qty,0),client=draft.client_type||"general",d=discounts.find(x=>x.id===draft.discount_id&&x.active)||((s.discount_id&&s.discount_name)?{id:s.discount_id,name:s.discount_name,percent:Number(s.discount_percent||0),scope:"all",exclude_public:false}:discounts.find(x=>Number(x.percent)===0)||{id:null,name:"Sin convenio",percent:0,scope:"all",exclude_public:false}),blocked=Boolean(d.exclude_public&&["police","sheriff","ems"].includes(client)),eligible=blocked?[]:lines.filter(x=>d.scope==="all"?x.tag!=="none":x.tag===d.scope),base=eligible.reduce((sum,i)=>sum+i.price*i.qty,0),disc=Math.round(base*Number(d.percent||0)/100),total=Math.max(0,subtotal-disc),employee=employees.find(e=>e.user_id===s.created_by),pct=Number(employee?.commission_percent??s.commission_percent??0);return{lines,subtotal,d,client,blocked,disc,total,pct,earning:total*pct/100}}
function updateSaleEditTotals(s){const d=saleEditDraft;if(!d)return;const c=calcSaleDraft(s,d);$("editSaleSubtotal")?.replaceChildren(document.createTextNode(money(c.subtotal)));$("editSaleDiscount")?.replaceChildren(document.createTextNode(c.disc?`−${money(c.disc)}`:money(0)));$("editSaleTotal")?.replaceChildren(document.createTextNode(money(c.total)));$("editSaleCommission")?.replaceChildren(document.createTextNode(money(c.earning)));$("editSaleDiscountNote")?.replaceChildren(document.createTextNode(c.blocked?"El convenio no aplica a este tipo de cliente.":(c.d.description||"")))}
function renderSaleDetail(s){
  const editing=saleEditId===s.id,locked=Boolean(s.payout_id)||s.status!=="active";$("detailFolio").textContent=folio(s);
  const draft=editing?(saleEditDraft||(saleEditDraft={client:s.client||"",client_type:s.client_type||"general",payment:s.payment||"Efectivo",note:s.note||"",discount_id:s.discount_id||null,items:(s.items||[]).map(i=>({...i}))})):null,c=editing?calcSaleDraft(s,draft):null,items=(s.items||[]).map(i=>`<div class="detail-item"><span>${i.qty}× ${esc(i.name)}</span><strong>${money(i.lineTotal)}</strong></div>`).join("");
  const editItems=editing?c.lines.map(i=>`<div class="edit-order-line"><div><strong>${esc(i.name)}</strong><small>${money(i.price)} c/u</small></div><input type="number" min="0" max="99" value="${i.qty}" data-edit-qty="${esc(i.id)}" aria-label="Cantidad de ${esc(i.name)}"><button type="button" class="row-btn" data-edit-remove="${esc(i.id)}">Quitar</button><strong class="edit-line-total">${money(i.price*i.qty)}</strong></div>`).join(""):"";
  $("saleDetail").innerHTML=`<div class="detail-grid"><div class="detail-box"><span>Empleado</span><strong>${esc(s.employee_name)}</strong></div><div class="detail-box"><span>Generado</span><strong>${money(editing?c.total:s.total)}</strong></div><div class="detail-box"><span>Ganancia empleado</span><strong>${money(editing?c.earning:s.employee_earnings)}</strong></div><div class="detail-box"><span>Neto negocio</span><strong>${money(editing?c.total-c.earning:s.business_net)}</strong></div><div class="detail-box"><span>Comisión</span><strong>${Number(editing?c.pct:s.commission_percent||0)}%</strong></div><div class="detail-box"><span>Pago comisión</span><strong>${s.payout_id?"Pagado":"Pendiente"}</strong></div></div>${editing?`<div class="sale-edit-grid"><div><label for="editSaleClient">Cliente / ID</label><input id="editSaleClient" value="${esc(draft.client||"")}" maxlength="120" required></div><div><label for="editSaleClientType">Tipo de cliente</label><select id="editSaleClientType">${saleClientOptions(draft.client_type||"general")}</select></div><div><label for="editSalePayment">Método de pago</label><select id="editSalePayment">${salePaymentOptions(draft.payment||"Efectivo")}</select></div><div class="full"><label for="editSaleNote">Nota</label><textarea id="editSaleNote" maxlength="500" rows="3">${esc(draft.note||"")}</textarea></div><div class="full edit-order-items"><div class="detail-items-head"><span>Productos de la orden</span><small>Agrega, quita o cambia cantidades</small></div>${editItems||'<div class="report-empty">Agrega al menos un producto.</div>'}<div class="edit-order-add"><select id="editSaleProduct"><option value="">Agregar producto…</option>${products.filter(p=>p.active).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${money(p.price)}</option>`).join("")}</select><button type="button" id="addSaleProductBtn" class="btn secondary">+ Agregar</button></div><div class="edit-order-totals"><span>Subtotal <strong id="editSaleSubtotal">${money(c.subtotal)}</strong></span><span>Descuento <strong id="editSaleDiscount">${c.disc?`−${money(c.disc)}`:money(0)}</strong></span><span class="grand">Total <strong id="editSaleTotal">${money(c.total)}</strong></span><span>Comisión estimada <strong id="editSaleCommission">${money(c.earning)}</strong></span></div><small id="editSaleDiscountNote" class="field-note">${esc(c.blocked?"El convenio no aplica a este tipo de cliente.":(c.d.description||""))}</small></div><p class="sale-edit-help">La orden debe conservar al menos un producto. Al guardar, Supabase recalcula la comisión y el neto con el nuevo total.</p></div>`:`<div class="sale-meta"><div><span>Cliente</span><strong>${esc(s.client||"Cliente general")}</strong></div><div><span>Tipo</span><strong>${esc({general:"Cliente general",police:"Policía",sheriff:"Sheriff",ems:"EMS"}[s.client_type]||s.client_type||"—")}</strong></div><div><span>Método</span><strong>${esc(s.payment||"—")}</strong></div>${s.note?`<div class="full"><span>Nota</span><strong>${esc(s.note)}</strong></div>`:""}</div>`}<div class="detail-items"><div class="detail-items-head"><span>Productos</span><small>${editing?"Vista previa":"Importes registrados"}</small></div>${editing?editItems||`<div class="report-empty">No hay productos en esta orden.</div>`:items||`<div class="report-empty">No hay productos en esta orden.</div>`}</div>`;
  const actions=[];if(isAdmin()){if(editing){actions.push(`<button id="cancelSaleEditBtn" class="btn secondary">Cancelar</button><button id="saveSaleEditBtn" class="btn primary">Guardar cambios</button>`)}else if(!locked&&can("edit_orders"))actions.push(`<button id="editSaleBtn" class="btn secondary">Editar orden</button>`);if(s.status==="active")actions.push(`<button id="voidBtn" class="btn danger">Anular venta</button>`);if(!s.payout_id)actions.push(`<button id="deleteSaleBtn" class="btn secondary">Eliminar orden</button>`)}$("saleDetailActions").innerHTML=actions.length?actions.join(""):statusBadge(s);
  $("editSaleBtn")&&($("editSaleBtn").onclick=()=>{saleEditId=s.id;saleEditDraft={client:s.client||"",client_type:s.client_type||"general",payment:s.payment||"Efectivo",note:s.note||"",discount_id:s.discount_id||null,items:(s.items||[]).map(i=>({...i}))};renderSaleDetail(s);$("editSaleClient").focus()});$("cancelSaleEditBtn")&&($("cancelSaleEditBtn").onclick=()=>{saleEditId=null;saleEditDraft=null;renderSaleDetail(s)});$("saveSaleEditBtn")&&($("saveSaleEditBtn").onclick=()=>saveSaleEdit(s.id));$("voidBtn")&&($("voidBtn").onclick=()=>voidSale(s.id));$("deleteSaleBtn")&&($("deleteSaleBtn").onclick=()=>deleteSale(s.id));
  if(editing){$("editSaleClient").oninput=e=>draft.client=e.target.value;$("editSaleClientType").onchange=e=>{draft.client_type=e.target.value;renderSaleDetail(s)};$("editSalePayment").onchange=e=>draft.payment=e.target.value;$("editSaleNote").oninput=e=>draft.note=e.target.value;document.querySelectorAll("[data-edit-qty]").forEach(input=>input.oninput=e=>{const item=draft.items.find(i=>i.id===e.target.dataset.editQty);if(item){item.qty=Number(e.target.value)||0;const line=e.target.closest('.edit-order-line');if(line)line.querySelector('.edit-line-total').textContent=money((Number(item.price)||0)*item.qty);updateSaleEditTotals(s)}});document.querySelectorAll("[data-edit-remove]").forEach(btn=>btn.onclick=()=>{draft.items=draft.items.filter(i=>i.id!==btn.dataset.editRemove);renderSaleDetail(s)});$("addSaleProductBtn").onclick=()=>{const id=$("editSaleProduct").value;if(!id)return;const item=draft.items.find(i=>i.id===id);if(item)item.qty=(Number(item.qty)||0)+1;else{const p=products.find(x=>x.id===id);if(p)draft.items.push({id:p.id,name:p.name,price:Number(p.price),qty:1,lineTotal:Number(p.price)})}renderSaleDetail(s)}}
}
function openSale(id){const s=sales.find(x=>x.id===id);if(!s)return;saleEditId=null;saleEditDraft=null;renderSaleDetail(s);renderPermissionSaleActions(s);$("saleDetailModal").classList.remove("hidden")}
async function saveSaleEdit(id){const s=sales.find(x=>x.id===id),draft=saleEditDraft;if(!can("edit_orders")||!s||!draft||s.payout_id||s.status!=="active")return toast("Esta orden ya está cerrada y no se puede editar");const client=String(draft.client||"").trim(),client_type=draft.client_type,payment=draft.payment,note=String(draft.note||"").trim(),c=calcSaleDraft(s,draft);if(!client)return toast("Cliente / ID es obligatorio");if(client.length>120||note.length>500)return toast("Revisa la longitud de los datos");if(!c.lines.length)return toast("Agrega al menos un producto");const bad=c.lines.find(i=>!i.active||(i.restriction&&i.restriction!==client_type));if(bad)return toast(`El tipo de cliente no corresponde a ${bad.name}`);const {error}=await sb.from("sales").update({client,client_type,payment,note,items:c.lines.map(x=>({id:x.id,name:x.name,price:Number(x.price),qty:x.qty,lineTotal:x.price*x.qty})),subtotal:c.subtotal,discount_id:c.d.id||null,discount_name:c.blocked?"Sin convenio":c.d.name,discount_percent:c.blocked?0:Number(c.d.percent||0),discount_amount:c.disc,total:c.total}).eq("id",id).eq("store_id",profile.store_id).is("payout_id",null);if(error)return toast(error.message||"No se pudo guardar la orden");saleEditId=null;saleEditDraft=null;await loadData();$("saleDetailModal").classList.add("hidden");toast("Orden actualizada")}
function renderPermissionSaleActions(s){if(isAdmin()||!can("edit_orders"))return;const locked=Boolean(s.payout_id)||s.status!=="active",editing=saleEditId===s.id;if(locked)return;$("saleDetailActions").innerHTML=editing?'<button id="cancelSaleEditBtn" class="btn secondary">Cancelar</button><button id="saveSaleEditBtn" class="btn primary">Guardar cambios</button>':'<button id="editSaleBtn" class="btn secondary">Editar orden</button>';$('editSaleBtn')?.addEventListener('click',()=>{saleEditId=s.id;saleEditDraft={client:s.client||"",client_type:s.client_type||"general",payment:s.payment||"Efectivo",note:s.note||"",discount_id:s.discount_id||null,items:(s.items||[]).map(i=>({...i}))};renderSaleDetail(s);renderPermissionSaleActions(s);$('editSaleClient')?.focus()});$('cancelSaleEditBtn')?.addEventListener('click',()=>{saleEditId=null;saleEditDraft=null;renderSaleDetail(s)});$('saveSaleEditBtn')?.addEventListener('click',()=>saveSaleEdit(s.id))}
let customerPage=0,customerRows=[];
function customerHistory(){const source=can("view_reports")?(isAdmin()?sales:sales.filter(s=>s.created_by===user.id)):[];const map=new Map();source.forEach(s=>{const label=String(s.client||"").trim()||"Cliente general",key=normalize(label);if(!map.has(key))map.set(key,{key,label,rows:[],generated:0,active:0,last:s.created_at,discounts:new Set});const c=map.get(key);c.rows.push(s);if(s.status==="active"){c.generated+=Number(s.total||0);c.active++}if(s.discount_name&&s.discount_name!=="Sin convenio")c.discounts.add(s.discount_name);if(new Date(s.created_at)>new Date(c.last))c.last=s.created_at});return [...map.values()].sort((a,b)=>new Date(b.last)-new Date(a.last))}
function renderCustomers(){if(!can("view_reports"))return;customerRows=customerHistory();const q=normalize($("customerSearch")?.value.trim()||""),rows=customerRows.filter(c=>!q||normalize([c.label,...c.rows.map(s=>s.employee_name)].join(" ")).includes(q)),active=rows.reduce((n,c)=>n+c.active,0),generated=rows.reduce((n,c)=>n+c.generated,0),convenios=new Set(rows.flatMap(c=>[...c.discounts]));$("customerMetrics").innerHTML=metricHTML([["Clientes",rows.length,"en el filtro"],["Compras activas",active,"registradas","accent"],["Generado",reportMoney(generated),"acumulado"],["Convenios usados",convenios.size,"distintos","green"]]);const pages=Math.max(1,Math.ceil(rows.length/REPORT_PAGE_SIZE));customerPage=Math.min(customerPage,pages-1);const start=customerPage*REPORT_PAGE_SIZE,page=rows.slice(start,start+REPORT_PAGE_SIZE);$("customersBody").innerHTML=page.length?page.map(c=>`<tr><td><strong>${esc(c.label)}</strong><small class="audit-entity">${c.rows.length} registro${c.rows.length===1?"":"s"}</small></td><td>${c.active}</td><td>${fmtDate(c.last)}</td><td><strong>${reportMoney(c.generated)}</strong></td><td>${c.discounts.size?esc([...c.discounts].join(", ")):"—"}</td><td><button class="row-btn" data-customer="${esc(c.key)}">Ver historial</button></td></tr>`).join(""): '<tr><td colspan="6">No hay clientes en este filtro.</td></tr>';$("customersPager").innerHTML=`<span>${rows.length?`${start+1}–${Math.min(start+REPORT_PAGE_SIZE,rows.length)} de ${rows.length}`:"Sin resultados"}</span><div><button class="row-btn" data-prev ${customerPage===0?"disabled":""}>Anterior</button><span>${customerPage+1} / ${pages}</span><button class="row-btn" data-next ${customerPage>=pages-1?"disabled":""}>Siguiente</button></div>`;$('customersPager').querySelector('[data-prev]').onclick=()=>{customerPage--;renderCustomers()};$('customersPager').querySelector('[data-next]').onclick=()=>{customerPage++;renderCustomers()};document.querySelectorAll('[data-customer]').forEach(b=>b.onclick=()=>openCustomer(b.dataset.customer))}
function openCustomer(key){const c=customerRows.find(x=>x.key===key);if(!c)return;$('customerDetailTitle').textContent=c.label;$('customerDetailMeta').textContent=`${c.active} compra${c.active===1?'':'s'} activa${c.active===1?'':'s'} · ${reportMoney(c.generated)} acumulado`;$('customerDetailContent').innerHTML=`<div class="customer-detail-list">${c.rows.map(s=>`<div class="customer-sale-row"><div><strong>${folio(s)}</strong><small>${fmtDate(s.created_at)} · ${esc(s.employee_name)}</small></div><div><strong>${reportMoney(s.total)}</strong><small>${esc(s.discount_name||'Sin convenio')} · ${statusBadge(s)}</small></div><button class="row-btn" data-customer-sale="${esc(s.id)}">Ver orden</button></div>`).join('')}</div>`;document.querySelectorAll('[data-customer-sale]').forEach(b=>b.onclick=()=>{closeCustomerDetail();openSale(b.dataset.customerSale)});$('customerDetailModal').classList.remove('hidden')}
function closeCustomerDetail(){$('customerDetailModal').classList.add('hidden')}
async function saveSaleEdit(id){
  const s=sales.find(x=>x.id===id),draft=saleEditDraft;
  if(!can("edit_orders")||!s||!draft||s.payout_id||s.status!=="active")return toast("Esta orden ya está cerrada y no se puede editar");
  if($("editSaleClient"))draft.client=$("editSaleClient").value;
  if($("editSaleClientType"))draft.client_type=$("editSaleClientType").value;
  if($("editSalePayment"))draft.payment=$("editSalePayment").value;
  if($("editSaleNote"))draft.note=$("editSaleNote").value;
  const client=String(draft.client||"").trim(),client_type=draft.client_type,payment=draft.payment,note=String(draft.note||"").trim(),c=calcSaleDraft(s,draft);
  if(!client)return toast("Cliente / ID es obligatorio");
  if(client.length>120||note.length>500)return toast("Revisa la longitud de los datos");
  if(!c.lines.length)return toast("Agrega al menos un producto");
  const bad=c.lines.find(i=>!i.active||(i.restriction&&i.restriction!==client_type));
  if(bad)return toast(`El tipo de cliente no corresponde a ${bad.name}`);
  const {error}=await sb.from("sales").update({client,client_type,payment,note,items:c.lines.map(x=>({id:x.id,name:x.name,price:Number(x.price),qty:x.qty,lineTotal:x.price*x.qty})),subtotal:c.subtotal,discount_id:c.d.id||null,discount_name:c.blocked?"Sin convenio":c.d.name,discount_percent:c.blocked?0:Number(c.d.percent||0),discount_amount:c.disc,total:c.total}).eq("id",id).eq("store_id",profile.store_id).is("payout_id",null);
  if(error)return toast(error.message||"No se pudo guardar la orden");
  notifyDiscord("sale_updated",{sale_id:id,event_id:crypto.randomUUID?.()||String(Date.now())});saleEditId=null;saleEditDraft=null;await loadData();$("saleDetailModal").classList.add("hidden");toast("Orden actualizada");
}
async function toggleEmployeeActive(){
  if(!can("manage_employees"))return toast("No tienes permiso para gestionar empleados");
  const id=$("editEmployeeId").value,e=employees.find(x=>x.user_id===id);if(!e||id===user.id)return toast("No puedes dar de baja tu propia cuenta");
  const next=!e.active,verb=next?"reactivar":"dar de baja";
  if(!confirm(`¿Quieres ${verb} a ${e.name}? ${next?"Volverá a poder iniciar sesión.":"Se cerrará su acceso, pero se conservarán sus ventas."}`))return;
  const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"set_active",user_id:id,active:next}});
  if(error)return toast(await edgeErrorMessage(error,data,"No se pudo cambiar el estado"));if(data?.error)return toast(data.error);
  await loadData();openEmployee(id);toast(next?"Cuenta reactivada":"Usuario dado de baja");
}
function openEmployee(id){const e=employees.find(x=>x.user_id===id);if(!e)return;const st=employeeStats(e),list=sales.filter(s=>s.created_by===id);$("editEmployeeId").value=id;$("employeeDetailName").textContent=e.name;$("editEmployeeRole").value=e.role;$("editEmployeeCommission").value=Number(e.commission_percent||0);$("editEmployeeActive").checked=e.active;$("deactivateEmployeeBtn").textContent=e.active?"Dar de baja":"Reactivar cuenta";$("deactivateEmployeeBtn").disabled=id===user.id;$("deleteEmployeeBtn").disabled=id===user.id;$("payEmployeeBtn").disabled=st.pending<=0;[["permEditOrders","can_edit_orders"],["permManageCatalog","can_manage_catalog"],["permManageEmployees","can_manage_employees"],["permViewReports","can_view_reports"],["permManagePayouts","can_manage_payouts"],["permViewAudit","can_view_audit"]].forEach(([id,key])=>{$(id).checked=e[key]===true;$(id).disabled=!isAdmin()});$("employeePermissions").classList.toggle("hidden",!isAdmin());$("employeeDetailMetrics").innerHTML=metricHTML([["Ventas",st.count,"activas"],["Generado",money(st.generated),"total","accent"],["Ganancia",money(st.earnings),"acumulada","green"],["Pendiente",money(st.pending),"por pagar"],["Pagado",money(st.paid),"histórico"]]);$("employeeSalesCount").textContent=`${list.length} ventas`;$("employeeSalesBody").innerHTML=list.slice(0,100).map(s=>`<tr><td>${folio(s)}</td><td>${fmtDate(s.created_at)}</td><td>${money(s.total)}</td><td>${money(s.employee_earnings)}</td><td>${s.payout_id?`<span class="badge green">Pagado</span>`:`<span class="badge gold">Pendiente</span>`}</td></tr>`).join("")||`<tr><td colspan="5">Sin ventas.</td></tr>`;$("employeeDetailModal").classList.remove("hidden")}

const companion=window.BurgerCompanion?.mount({
  escape:esc,money,art:productArt,photo:productPhotoKey,toast,
  state:()=>({profile,user,products,discounts,calc:calc(),saving:saleSaving,sales:profile?(isAdmin()?sales:sales.filter(s=>s.created_by===user?.id)):[]}),
  add:addToCart,
  templates:readOrderTemplates,saveTemplate:saveOrderTemplate,loadTemplate:loadOrderTemplate,deleteTemplate:deleteOrderTemplate,
  quantity:(id,delta)=>{if(saleSaving)return;const p=products.find(x=>x.id===id&&x.active);if(!p)return;const next=Math.min(9999,(cart[id]||0)+delta);if(next>0)cart[id]=next;else delete cart[id];renderCart()},
  setQuantity:(id,value)=>{if(saleSaving)return;const p=products.find(x=>x.id===id&&x.active);if(!p)return;if(!Number.isInteger(value)||value<1||value>9999)return toast("La cantidad debe ser un entero entre 1 y 9,999");cart[id]=value;renderCart()},
  options:(type,discount)=>{if(saleSaving)return;$("clientType").value=type;$("discountSelect").value=discount;renderCart()},
  clear:()=>{if(saleSaving)return;cart={};renderCart()},
  replace:result=>{if(saleSaving)return;cart=result.cart;$("clientType").value=result.clientType;$("discountSelect").value=discounts.some(d=>d.id===result.discountId&&d.active)?result.discountId:(discounts.find(d=>d.active&&Number(d.percent)===0)?.id||"");renderCart()},
  checkout:()=>openCheckout(),navigate:switchPage,logout:()=>sb.auth.signOut()
});
init();
})();
