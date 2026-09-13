(() => {
"use strict";
const CATS={combos:"Combos",individuales:"Individuales",extras:"Extras",cajas:"Cajas felices",mayoreo:"Mayoreo"};
const CONFIG_KEY="bs_v3_cloud";
const PENDING_BOOTSTRAP_KEY="bs_v3_pending_admin";
let saleSaving=false,checkoutSnapshot=null;
let sb,user=null,profile=null,store=null,products=[],discounts=[],sales=[],employees=[],payouts=[],cart={},activeCategory="all",realtime=null,resetTarget=null;
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
function addToCart(id){
  if(!products.some(p=>p.id===id&&p.active))return;
  cart[id]=(cart[id]||0)+1;renderCart();
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
  bind();renderSetupActions();renderCategories();tick();setInterval(tick,1000);
  const c=cfg();if(!c?.url||!c?.key){showOnly("cloudSetup");return}
  try{
    sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true}});
    const {data:{session}}=await sb.auth.getSession();user=session?.user||null;
    sb.auth.onAuthStateChange(async(_event,s)=>{user=s?.user||null;if(user)await afterAuth();else showOnly("authScreen")});
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
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("globalSearch").focus()}});
  $("globalSearch").onkeydown=e=>{if(e.key==="Enter"){switchPage("pos");$("productSearch").value=e.target.value;renderProducts()}};
  $("productSearch").oninput=renderProducts;$("clearCartBtn").onclick=()=>{cart={};renderCart()};$("clientType").onchange=renderCart;$("discountSelect").onchange=renderCart;
  $("checkoutBtn").onclick=openCheckout;$("confirmSaleBtn").onclick=saveSale;$("mySalesSearch").oninput=renderMySales;$("allSalesSearch").oninput=renderAllSales;$("csvBtn").onclick=exportCSV;
  $("addProductBtn").onclick=()=>openProduct();$("saveProductBtn").onclick=saveProduct;$("deleteProductBtn").onclick=deleteProduct;
  $("addDiscountBtn").onclick=()=>openDiscount();$("saveDiscountBtn").onclick=saveDiscount;$("deleteDiscountBtn").onclick=deleteDiscount;
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
  profile=data;await loadData();showOnly("app");refreshUser();setupRealtime();
}
async function loadData(){
  if(!profile)return;setSync("","Sincronizando");const sid=profile.store_id;
  const [a,b,c,d,e,f]=await Promise.all([
    sb.from("stores").select("*").eq("id",sid).single(),
    sb.from("products").select("*").eq("store_id",sid).order("sort_order").order("name"),
    sb.from("discounts").select("*").eq("store_id",sid).order("sort_order").order("name"),
    sb.from("sales").select("*").eq("store_id",sid).order("created_at",{ascending:false}).limit(3000),
    sb.from("profiles").select("*").eq("store_id",sid).order("name"),
    sb.from("employee_payouts").select("*").eq("store_id",sid).order("created_at",{ascending:false}).limit(1000)
  ]);
  const err=a.error||b.error||c.error||d.error||e.error||f.error;if(err){console.error(err);setSync("error","Error");toast(err.message);return}
  store=a.data;products=b.data||[];discounts=c.data||[];sales=d.data||[];employees=e.data||[];payouts=f.data||[];setSync("online","Sincronizado");renderAll();
}
function setupRealtime(){
  if(realtime)sb.removeChannel(realtime);
  realtime=sb.channel("bs-v3-"+profile.store_id)
    .on("postgres_changes",{event:"*",schema:"public",table:"sales",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"products",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"discounts",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"profiles",filter:`store_id=eq.${profile.store_id}`},loadData)
    .on("postgres_changes",{event:"*",schema:"public",table:"employee_payouts",filter:`store_id=eq.${profile.store_id}`},loadData).subscribe();
}
function refreshUser(){
  $("storeName").textContent=store?.name||"BurgerShot";$("accountName").textContent=profile.name;$("posCashier").textContent=profile.name;$("topName").textContent=profile.name;const role=isAdmin()?"Administrador":"Empleado";$("accountRole").textContent=role;$("topRole").textContent=role;
  const ini=profile.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();$("avatar").textContent=ini;$("topAvatar").textContent=ini;$("welcomeTitle").textContent=`¡Buenas, ${profile.name.split(" ")[0]}!`;
  $("welcomeSubtitle").textContent=isAdmin()?"Resumen general del BurgerShot.":`Tu comisión actual es ${Number(profile.commission_percent||0)}%.`;
  document.querySelectorAll(".admin-only").forEach(x=>x.classList.toggle("hidden",!isAdmin()));
}
function switchPage(page){if(["allSales","employees","payouts","discounts","products"].includes(page)&&!isAdmin())return;document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));$(`page-${page}`).classList.add("active");document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add("active");$("sidebar").classList.remove("open");renderAll()}
function renderAll(){renderDashboard();renderProducts();renderCart();renderMySales();renderAnalytics();renderAllSales();renderEmployees();renderPayouts();renderDiscounts();renderProductsAdmin()}
function renderDashboard(){
  if(!profile)return;
  const mine=sales.filter(s=>s.created_by===user.id),m=sums(mine),all=sums(sales),pending=pendingFor(user.id);
  $("dashboardMetrics").innerHTML=isAdmin()
    ?metricHTML([["Ventas",all.count,"activas"],["Generado",money(all.generated),"ventas brutas","accent"],["Ganancias empleados",money(all.earnings),"comisiones"],["Neto negocio",money(all.net),"después de comisiones","green"]])
    :metricHTML([["Mis ventas",m.count,"activas"],["Generado",money(m.generated),"total vendido","accent"],["Mi ganancia",money(m.earnings),`${Number(profile.commission_percent||0)}% comisión`,"green"],["Pendiente",money(pending),"por pagar"]]);
  $("quickProducts").innerHTML=products.filter(x=>x.active).slice(0,8).map(p=>`<button class="quick-card" data-quick-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)} y abrir punto de venta"><div class="quick-photo">${productArt(p)}</div><h3>${esc(p.name)}</h3><strong>${money(p.price)}</strong></button>`).join("");
  $("quickProducts").onclick=e=>{const b=e.target.closest("[data-quick-add]");if(b){addToCart(b.dataset.quickAdd);switchPage("pos")}};
  const shown=isAdmin()?sales:sales.filter(s=>s.created_by===user.id);$("miniSales").innerHTML=shown.slice(0,8).map(s=>`<button class="mini-sale" data-mini-sale="${s.id}"><span>${folio(s)}</span><strong>${esc(s.employee_name)}</strong><b>${money(s.total)}</b><em>Ver →</em></button>`).join("")||`<div class="empty-cart"><strong>Sin ventas todavía</strong></div>`;document.querySelectorAll("[data-mini-sale]").forEach(b=>b.onclick=()=>openSale(b.dataset.miniSale));
}
function renderCategories(){
  $("categoryTabs").innerHTML=Object.entries({all:"Todos",...CATS}).map(([k,v])=>`<button class="category-tab ${k===activeCategory?"active":""}" data-cat="${k}" aria-pressed="${k===activeCategory}">${v}</button>`).join("");
  $("categoryTabs").onclick=e=>{const b=e.target.closest("[data-cat]");if(!b)return;activeCategory=b.dataset.cat;renderCategories();renderProducts();$("productGrid").scrollTop=0;document.querySelector(`[data-cat="${activeCategory}"]`)?.focus({preventScroll:true})};
}
function renderProducts(){
  const q=normalize($("productSearch").value.trim()),arr=products.filter(p=>p.active).filter(p=>activeCategory==="all"||p.category===activeCategory).filter(p=>!q||normalize(p.name).includes(q));
  $("productCount").textContent=`${arr.length} producto${arr.length===1?"":"s"}`;
  $("productGrid").innerHTML=arr.length?arr.map(p=>`<article class="product-card" data-product="${esc(p.id)}"><div class="product-photo">${productArt(p)}${productBadge(p)?`<span class="product-badge">${esc(productBadge(p))}</span>`:""}<span class="in-cart-count" hidden></span></div><div class="product-copy"><span class="product-category">${esc(productSubtitle(p))}</span><h3>${esc(p.name)}</h3><div class="product-bottom"><strong>${money(p.price)}</strong><button class="add-product" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)}" title="Agregar a la orden">${uiIcon("plus")}</button></div></div></article>`).join(""):`<div class="catalog-empty"><strong>No encontramos ese producto</strong><span>Prueba otro nombre o cambia de categoría.</span></div>`;
  $("productGrid").onclick=e=>{const b=e.target.closest("[data-add]");if(b)addToCart(b.dataset.add)};
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
  $("cartList").innerHTML=c.lines.map(x=>`<article class="cart-item"><div class="cart-photo">${productArt(x,true)}</div><div class="cart-copy"><h4>${esc(x.name)}</h4><small>${money(x.price)} c/u</small><button class="remove-line" data-remove="${esc(x.id)}" aria-label="Quitar ${esc(x.name)}" title="Quitar producto">${uiIcon("trash")}</button></div><div class="cart-numbers"><div class="qty" role="group" aria-label="Cantidad de ${esc(x.name)}"><button data-q="${esc(x.id)}" data-d="-1" aria-label="Restar uno a ${esc(x.name)}">${uiIcon("minus")}</button><b aria-live="polite">${x.qty}</b><button data-q="${esc(x.id)}" data-d="1" aria-label="Sumar uno a ${esc(x.name)}">${uiIcon("plus")}</button></div><div class="line-total"><span>${x.qty} × ${money(x.price)}</span><strong>${money(x.lineTotal)}</strong></div></div></article>`).join("");
  $("cartList").onclick=e=>{
    const remove=e.target.closest("[data-remove]"),b=e.target.closest("[data-q]");
    if(remove){delete cart[remove.dataset.remove];renderCart();return}
    if(!b)return;
    const id=b.dataset.q,delta=b.dataset.d,scroll=$("cartList").parentElement.scrollTop;
    cart[id]=(cart[id]||0)+Number(delta);if(cart[id]<=0)delete cart[id];renderCart();
    $("cartList").parentElement.scrollTop=scroll;
    Array.from($("cartList").querySelectorAll("[data-q]")).find(el=>el.dataset.q===id&&el.dataset.d===delta)?.focus({preventScroll:true});
  };
  $("subtotal").textContent=money(c.subtotal);$("discountAmount").textContent=c.disc?`−${money(c.disc)}`:money(0);$("grandTotal").textContent=money(c.total);$("checkoutTotal").textContent=money(c.total);$("commissionPreview").textContent=money(c.earning);$("commissionPercentText").textContent=`${c.pct}% comisión`;
  $("discountNote").textContent=c.blocked?"Este convenio no aplica a este tipo de cliente.":(c.d.description||"");$("discountNote").classList.toggle("is-warning",c.blocked);$("checkoutBtn").disabled=!c.lines.length;
  updateProductSelection();
}
function openCheckout(){const c=calc();if(!c.lines.length)return;const bad=c.lines.find(x=>x.restriction&&x.restriction!==c.client);if(bad)return toast(`${bad.name} no corresponde al tipo de cliente seleccionado`);$("checkoutSummary").innerHTML=c.lines.map(x=>`<div><span>${x.qty}× ${esc(x.name)}</span><strong>${money(x.lineTotal)}</strong></div>`).join("")+`<div><span>Descuento · ${esc(c.d.name)}</span><strong>-${money(c.disc)}</strong></div><div><span>Tu ganancia estimada (${c.pct}%)</span><strong>${money(c.earning)}</strong></div><div class="sum-total"><span>Total</span><strong>${money(c.total)}</strong></div>`;$("saleClient").value="";$("saleNote").value="";checkoutSnapshot=JSON.stringify({lines:c.lines.map(x=>[x.id,x.qty,x.price,x.restriction,x.active]),discount:c.d,total:c.total,client:c.client,pct:c.pct});$("checkoutModal").classList.remove("hidden")}
async function saveSale(){
  if(saleSaving)return;
  const c=calc();if(!c.lines.length)return;
  const bad=c.lines.find(x=>!x.active||(x.restriction&&x.restriction!==c.client));
  if(bad)return toast(`Revisa el producto ${bad.name} y el tipo de cliente`);
  const current=JSON.stringify({lines:c.lines.map(x=>[x.id,x.qty,x.price,x.restriction,x.active]),discount:c.d,total:c.total,client:c.client,pct:c.pct});
  if(checkoutSnapshot!==current){openCheckout();toast("La orden cambió. Revisa el resumen antes de confirmar.");return}
  saleSaving=true;const button=$("confirmSaleBtn"),label=button.textContent;button.disabled=true;button.textContent="Registrando…";
  try{
    const payload={store_id:profile.store_id,created_by:user.id,employee_name:profile.name,client:$("saleClient").value.trim()||"Cliente general",client_type:c.client,payment:$("salePayment").value,note:$("saleNote").value.trim(),items:c.lines.map(x=>({id:x.id,name:x.name,price:Number(x.price),qty:x.qty,lineTotal:x.lineTotal})),subtotal:c.subtotal,discount_id:c.d.id||null,discount_name:c.blocked?"Sin convenio":c.d.name,discount_percent:c.blocked?0:Number(c.d.percent||0),discount_amount:c.disc,total:c.total,status:"active"};
    const {error}=await sb.from("sales").insert(payload);if(error)throw error;
    cart={};checkoutSnapshot=null;$("checkoutModal").classList.add("hidden");renderCart();await loadData();toast("Venta registrada");
  }catch(error){toast(error.message||"No se pudo registrar. Tu orden sigue disponible.")}
  finally{saleSaving=false;button.disabled=false;button.textContent=label}
}
function renderMySales(){
  if(!profile)return;const q=$("mySalesSearch").value.trim().toLowerCase(),mine=sales.filter(s=>s.created_by===user.id),m=sums(mine),pending=pendingFor(user.id),paid=paidFor(user.id);
  $("myMetrics").innerHTML=metricHTML([["Ventas",m.count,"activas"],["Generado",money(m.generated),"total vendido","accent"],["Mi ganancia",money(m.earnings),`${Number(profile.commission_percent||0)}% actual`,"green"],["Pendiente",money(pending),"por pagar"],["Pagado",money(paid),"cortes registrados"]]);
  const arr=mine.filter(s=>!q||[folio(s),s.client,s.employee_name].join(" ").toLowerCase().includes(q));$("mySalesBody").innerHTML=arr.length?arr.map(s=>`<tr><td><strong>${folio(s)}</strong></td><td>${fmtDate(s.created_at)}</td><td>${esc(s.client)}</td><td><strong>${money(s.total)}</strong></td><td><strong>${money(s.employee_earnings)}</strong></td><td>${money(s.business_net)}</td><td>${s.payout_id?`<span class="badge green">Pagado</span>`:`<span class="badge gold">Pendiente</span>`}</td><td>${statusBadge(s)}</td><td><button class="row-btn" data-sale="${s.id}">Ver</button></td></tr>`).join(""):`<tr><td colspan="9">No hay ventas.</td></tr>`;bindSaleButtons();
}
function renderAnalytics(){
  if(!profile)return;const base=isAdmin()?sales:sales.filter(s=>s.created_by===user.id),m=sums(base);$("analyticsMetrics").innerHTML=metricHTML([["Ventas",m.count,"activas"],["Generado",money(m.generated),"bruto","accent"],["Ganancias",money(m.earnings),"empleados"],["Neto",money(m.net),"negocio","green"]]);
  const active=base.filter(x=>x.status==="active"),days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const n=new Date(d);n.setDate(n.getDate()+1);days.push({label:new Intl.DateTimeFormat("es-MX",{weekday:"short"}).format(d),total:active.filter(s=>new Date(s.created_at)>=d&&new Date(s.created_at)<n).reduce((a,b)=>a+Number(b.total),0)})}
  const max=Math.max(...days.map(x=>x.total),1);$("weeklyChart").innerHTML=days.map(x=>`<div class="bar-col"><div class="bar-value">${money(x.total)}</div><div class="bar" style="height:${Math.max(3,x.total/max*85)}%"></div><div class="bar-label">${x.label}</div></div>`).join("");
  const count={};active.forEach(s=>(s.items||[]).forEach(i=>count[i.name]=(count[i.name]||0)+Number(i.qty)));const rank=Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,8);$("productRanking").innerHTML=rank.length?rank.map(([n,q],i)=>`<div class="rank-item"><div class="rank-num">${i+1}</div><div><strong>${esc(n)}</strong><small>Unidades</small></div><div class="rank-qty">${q}</div></div>`).join(""):`<div class="empty-cart"><strong>Sin datos</strong></div>`;
}
function renderAllSales(){
  if(!isAdmin())return;const q=$("allSalesSearch").value.trim().toLowerCase(),m=sums(sales);$("allMetrics").innerHTML=metricHTML([["Ventas",m.count,"activas"],["Generado",money(m.generated),"bruto","accent"],["Ganancias empleados",money(m.earnings),"comisiones"],["Neto negocio",money(m.net),"después de comisiones","green"]]);
  const arr=sales.filter(s=>!q||[folio(s),s.client,s.employee_name].join(" ").toLowerCase().includes(q));$("allSalesBody").innerHTML=arr.length?arr.map(s=>`<tr><td><strong>${folio(s)}</strong></td><td>${fmtDate(s.created_at)}</td><td>${esc(s.employee_name)}</td><td>${esc(s.client)}</td><td><strong>${money(s.total)}</strong></td><td>${money(s.employee_earnings)}</td><td><strong>${money(s.business_net)}</strong></td><td>${s.payout_id?`<span class="badge green">Pagado</span>`:`<span class="badge gold">Pendiente</span>`}</td><td>${statusBadge(s)}</td><td><button class="row-btn" data-sale="${s.id}">Ver</button></td></tr>`).join(""):`<tr><td colspan="10">No hay ventas.</td></tr>`;bindSaleButtons();
}
function statusBadge(s){return s.status==="active"?`<span class="badge green">Activa</span>`:`<span class="badge red">Anulada</span>`}
function fmtDate(x){return new Intl.DateTimeFormat("es-MX",{dateStyle:"short",timeStyle:"short"}).format(new Date(x))}
function bindSaleButtons(){document.querySelectorAll("[data-sale]").forEach(b=>b.onclick=()=>openSale(b.dataset.sale))}
function openSale(id){const s=sales.find(x=>x.id===id);if(!s)return;$("detailFolio").textContent=folio(s);$("saleDetail").innerHTML=`<div class="detail-grid"><div class="detail-box"><span>Empleado</span><strong>${esc(s.employee_name)}</strong></div><div class="detail-box"><span>Generado</span><strong>${money(s.total)}</strong></div><div class="detail-box"><span>Ganancia empleado</span><strong>${money(s.employee_earnings)}</strong></div><div class="detail-box"><span>Neto negocio</span><strong>${money(s.business_net)}</strong></div><div class="detail-box"><span>Comisión</span><strong>${Number(s.commission_percent||0)}%</strong></div><div class="detail-box"><span>Pago comisión</span><strong>${s.payout_id?"Pagado":"Pendiente"}</strong></div></div><div class="detail-items">${(s.items||[]).map(i=>`<div class="detail-item"><span>${i.qty}× ${esc(i.name)}</span><strong>${money(i.lineTotal)}</strong></div>`).join("")}</div>`;const actions=[];if(isAdmin()){if(s.status==="active")actions.push(`<button id="voidBtn" class="btn danger">Anular venta</button>`);if(!s.payout_id)actions.push(`<button id="deleteSaleBtn" class="btn secondary">Eliminar orden</button>`);}$("saleDetailActions").innerHTML=actions.length?actions.join(""):statusBadge(s);$("saleDetailModal").classList.remove("hidden");$("voidBtn")&&($("voidBtn").onclick=()=>voidSale(id));$("deleteSaleBtn")&&($("deleteSaleBtn").onclick=()=>deleteSale(id))}
async function voidSale(id){if(!isAdmin()||!confirm("¿Anular esta venta?"))return;const {error}=await sb.from("sales").update({status:"void",voided_at:new Date().toISOString(),voided_by:user.id}).eq("id",id);if(error)return toast(error.message);$("saleDetailModal").classList.add("hidden");await loadData();toast("Venta anulada")}
async function deleteSale(id){const s=sales.find(x=>x.id===id);if(!isAdmin()||!s)return;if(s.payout_id)return toast("No puedes eliminar una orden que ya fue incluida en un pago. Puedes anularla si lo necesitas.");if(!confirm(`¿Eliminar permanentemente la orden ${folio(s)}? Esta acción no se puede deshacer.`))return;const {error}=await sb.from("sales").delete().eq("id",id);if(error)return toast(error.message);$("saleDetailModal").classList.add("hidden");await loadData();toast("Orden eliminada")}
function employeeStats(e){const list=sales.filter(s=>s.created_by===e.user_id),m=sums(list);return{...m,pending:pendingFor(e.user_id),paid:paidFor(e.user_id)}}
function renderEmployees(){
  if(!isAdmin())return;
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
  $("employeeError").textContent="";const name=$("employeeName").value.trim(),username=uname($("employeeUsername").value),password=$("employeePassword").value,role=$("employeeRole").value,commission=Number($("employeeCommission").value||0);
  if(!name||username.length<3||password.length<6)return $("employeeError").textContent="Nombre, usuario (mín. 3) y contraseña (mín. 6) son obligatorios";
  const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"create",name,username,password,role,commission_percent:commission}});if(error)return $("employeeError").textContent=await edgeErrorMessage(error,data,"No se pudo crear el empleado");if(data?.error)return $("employeeError").textContent=data.error;$("employeeModal").classList.add("hidden");await loadData();toast(`Empleado ${name} creado`);
}
async function saveEmployee(){const id=$("editEmployeeId").value;if(id===user.id&&!$("editEmployeeActive").checked)return toast("No puedes desactivar tu propia cuenta");const payload={role:$("editEmployeeRole").value,active:$("editEmployeeActive").checked,commission_percent:Number($("editEmployeeCommission").value||0)};const {error}=await sb.from("profiles").update(payload).eq("user_id",id);if(error)return toast(error.message);await loadData();openEmployee(id);toast("Empleado actualizado")}
async function toggleEmployeeActive(){
  const id=$("editEmployeeId").value,e=employees.find(x=>x.user_id===id);if(!e||id===user.id)return toast("No puedes dar de baja tu propia cuenta");
  const next=!e.active,verb=next?"reactivar":"dar de baja";
  if(!confirm(`¿Quieres ${verb} a ${e.name}? ${next?"Volverá a poder iniciar sesión.":"Se cerrará su acceso, pero se conservarán sus ventas."}`))return;
  const {error}=await sb.from("profiles").update({active:next}).eq("user_id",id).eq("store_id",profile.store_id);
  if(error)return toast(error.message);await loadData();openEmployee(id);toast(next?"Cuenta reactivada":"Usuario dado de baja");
}
async function deleteEmployee(){
  const id=$("editEmployeeId").value,e=employees.find(x=>x.user_id===id);if(!e||id===user.id)return toast("No puedes borrar tu propia cuenta");
  if(!confirm(`¿Borrar permanentemente el perfil de ${e.name}? Esta acción elimina su acceso y solo está disponible si no tiene ventas ni cortes asociados.`))return;
  const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"delete",user_id:id}});
  if(error)return toast(await edgeErrorMessage(error,data,"No se pudo borrar el perfil"));if(data?.error)return toast(data.error);
  $("employeeDetailModal").classList.add("hidden");await loadData();toast("Perfil eliminado");
}
function openPasswordReset(){resetTarget=$("editEmployeeId").value;$("newEmployeePassword").value="";$("passwordError").textContent="";$("passwordModal").classList.remove("hidden")}
async function resetPassword(){const p=$("newEmployeePassword").value;if(p.length<6)return $("passwordError").textContent="Mínimo 6 caracteres";const {data,error}=await sb.functions.invoke("employee-admin",{body:{action:"reset_password",user_id:resetTarget,password:p}});if(error)return $("passwordError").textContent=await edgeErrorMessage(error,data,"No se pudo actualizar la contraseña");if(data?.error)return $("passwordError").textContent=data.error;$("passwordModal").classList.add("hidden");toast("Contraseña actualizada")}
async function payEmployee(){const id=$("editEmployeeId").value,st=employeeStats(employees.find(e=>e.user_id===id));if(st.pending<=0)return toast("No hay ganancias pendientes");if(!confirm(`Registrar pago de ${money(st.pending)} a este empleado?`))return;const {error}=await sb.rpc("create_employee_payout",{p_employee:id});if(error)return toast(error.message);$("employeeDetailModal").classList.add("hidden");await loadData();toast("Pago registrado")}
function renderPayouts(){
  if(!isAdmin())return;const total=payouts.reduce((a,p)=>a+Number(p.amount),0),gen=payouts.reduce((a,p)=>a+Number(p.generated_total),0),net=payouts.reduce((a,p)=>a+Number(p.business_net),0);$("payoutMetrics").innerHTML=metricHTML([["Cortes",payouts.length,"registros"],["Generado incluido",money(gen),"ventas"],["Pagado empleados",money(total),"comisiones","accent"],["Neto negocio",money(net),"en cortes","green"]]);
  $("payoutsBody").innerHTML=payouts.length?payouts.map(p=>`<tr><td>${fmtDate(p.created_at)}</td><td><strong>${esc(p.employee_name)}</strong></td><td>${p.sales_count}</td><td>${money(p.generated_total)}</td><td><strong>${money(p.amount)}</strong></td><td>${money(p.business_net)}</td><td>${esc(p.created_by_name||"—")}</td></tr>`).join(""):`<tr><td colspan="7">Aún no hay pagos registrados.</td></tr>`;
}
function renderProductsAdmin(){$("editProductCategory").innerHTML=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");$("productsBody").innerHTML=products.map(p=>`<tr><td><div class="admin-product-photo">${productArt(p,true)}<strong>${esc(p.name)}</strong></div></td><td>${esc(CATS[p.category]||p.category)}</td><td><strong>${money(p.price)}</strong></td><td><span class="badge dark">${esc(p.tag)}</span></td><td>${p.active?`<span class="badge green">Activo</span>`:`<span class="badge red">Inactivo</span>`}</td><td><button class="row-btn" data-edit-product="${p.id}">Editar</button></td></tr>`).join("");document.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=()=>openProduct(b.dataset.editProduct))}
function openProduct(id=null){const p=id?products.find(x=>x.id===id):null;$("productModalTitle").textContent=p?"Editar producto":"Nuevo producto";$("editProductId").value=p?.id||"";$("editProductName").value=p?.name||"";$("editProductPrice").value=p?.price||0;$("editProductCategory").value=p?.category||"individuales";$("editProductEmoji").innerHTML=`<option value="">Automática según el nombre</option>`+Object.entries(PHOTO_LABELS).map(([k,v])=>`<option value="photo:${k}">${v}</option>`).join("");$("editProductEmoji").value=String(p?.emoji||"").startsWith("photo:")?p.emoji:"";$("editProductEmoji").dataset.legacy=String(p?.emoji||"").startsWith("photo:")?"🍔":p?.emoji||"🍔";$("editProductTag").value=p?.tag||"all";$("editProductRestriction").value=p?.restriction||"";$("editProductActive").checked=p?p.active:true;$("deleteProductBtn").classList.toggle("hidden",!p);$("productModal").classList.remove("hidden")}
async function saveProduct(){const id=$("editProductId").value,name=$("editProductName").value.trim();if(!name)return toast("Escribe un nombre");const payload={store_id:profile.store_id,name,price:Number($("editProductPrice").value)||0,category:$("editProductCategory").value,emoji:$("editProductEmoji").value||$("editProductEmoji").dataset.legacy||"🍔",tag:$("editProductTag").value,restriction:$("editProductRestriction").value||null,active:$("editProductActive").checked};const r=id?await sb.from("products").update(payload).eq("id",id):await sb.from("products").insert(payload);if(r.error)return toast(r.error.message);$("productModal").classList.add("hidden");await loadData()}
async function deleteProduct(){const id=$("editProductId").value;if(!confirm("¿Eliminar producto?"))return;const {error}=await sb.from("products").delete().eq("id",id);if(error)return toast(error.message);$("productModal").classList.add("hidden");await loadData()}
function renderDiscounts(){$("discountCards").innerHTML=discounts.map(d=>`<article class="discount-card"><div class="discount-top"><div class="discount-pct">${Number(d.percent)}%</div>${d.active?`<span class="badge green">Activo</span>`:`<span class="badge red">Inactivo</span>`}</div><h3>${esc(d.name)}</h3><p>${esc(d.description||"")}</p><div class="discount-foot"><span class="badge dark">${d.scope==="all"?"Todo el menú":esc(d.scope)}</span><button class="row-btn" data-edit-discount="${d.id}" ${d.system?"disabled":""}>${d.system?"Sistema":"Editar"}</button></div></article>`).join("");document.querySelectorAll("[data-edit-discount]:not([disabled])").forEach(b=>b.onclick=()=>openDiscount(b.dataset.editDiscount))}
function openDiscount(id=null){const d=id?discounts.find(x=>x.id===id):null;$("discountModalTitle").textContent=d?"Editar convenio":"Nuevo convenio";$("editDiscountId").value=d?.id||"";$("editDiscountName").value=d?.name||"";$("editDiscountPercent").value=d?.percent??25;$("editDiscountScope").value=d?.scope||"all";$("editDiscountDescription").value=d?.description||"";$("editDiscountExcludePublic").checked=!!d?.exclude_public;$("editDiscountActive").checked=d?d.active:true;$("deleteDiscountBtn").classList.toggle("hidden",!d);$("discountModal").classList.remove("hidden")}
async function saveDiscount(){const id=$("editDiscountId").value,name=$("editDiscountName").value.trim();if(!name)return toast("Escribe un nombre");const p={store_id:profile.store_id,name,percent:Number($("editDiscountPercent").value)||0,scope:$("editDiscountScope").value,description:$("editDiscountDescription").value.trim(),exclude_public:$("editDiscountExcludePublic").checked,active:$("editDiscountActive").checked,system:false};const r=id?await sb.from("discounts").update(p).eq("id",id):await sb.from("discounts").insert(p);if(r.error)return toast(r.error.message);$("discountModal").classList.add("hidden");await loadData()}
async function deleteDiscount(){const id=$("editDiscountId").value;if(!confirm("¿Eliminar convenio?"))return;const {error}=await sb.from("discounts").delete().eq("id",id);if(error)return toast(error.message);$("discountModal").classList.add("hidden");await loadData()}
function openAccount(){$("accountModalName").textContent=profile.name;const mine=sums(sales.filter(s=>s.created_by===user.id));$("accountDetail").innerHTML=`Usuario: <strong>${esc(profile.username||"—")}</strong><br>Rol: ${isAdmin()?"Administrador":"Empleado"}<br>Comisión actual: ${Number(profile.commission_percent||0)}%<br>Generado: ${money(mine.generated)}<br>Ganancia: ${money(mine.earnings)}`;$("accountModal").classList.remove("hidden")}
function exportCSV(){const rows=[["Folio","Fecha","Empleado","Cliente","Generado","Comision %","Ganancia empleado","Neto negocio","Pago comision","Estado"]];sales.forEach(s=>rows.push([folio(s),s.created_at,s.employee_name,s.client,s.total,s.commission_percent,s.employee_earnings,s.business_net,s.payout_id?"Pagado":"Pendiente",s.status]));const csv="\ufeff"+rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="burgershot-registro-ventas.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
init();
})();
