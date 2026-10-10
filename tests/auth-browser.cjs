'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),preview=path.join(base,'preview');
const passed=[],errors=[];
const pass=name=>{passed.push(name);console.log('PASS '+name)};
const mock=fs.readFileSync(path.join(base,'demo/mock-supabase.js'),'utf8')+'\n'+fs.readFileSync(path.join(base,'demo/data.js'),'utf8')+`\n(()=>{
 const original=window.supabase.createClient,options=window.authTestOptions||{};
 window.supabase.createClient=(...args)=>{
  const c=original(...args),f=window.fixture,wait=ms=>new Promise(r=>setTimeout(r,ms));
  f.authCalls=0;f.callbackAsync=false;window.authTestClient=c;
  if(options.holdAuth)f.authGate=new Promise(r=>f.releaseAuth=r);
  if(options.holdData)f.dataGate=new Promise(r=>f.releaseData=r);
  c.auth.getSession=async()=>{if(options.sessionError)throw new Error('Network unavailable');return{data:{session:options.restore?{user:{id:'admin-1',email:'demo@ejemplo.invalid'}}:null},error:null}};
  c.auth.signInWithPassword=async({email,password})=>{
   f.authCalls++;if(f.authGate)await f.authGate;await wait(60);
   if(f.networkError)throw new Error('Network unavailable');
   if(password!=='demo')return{data:null,error:{message:'Invalid credentials'}};
   const user={id:'admin-1',email},session={user};
   f.callbackAsync=Boolean(f.authCallback?.('SIGNED_IN',session)?.then);
   return{data:{user,session},error:null};
  };
  const rpc=c.rpc.bind(c);c.rpc=async(name,args)=>name==='resolve_login_email'?{data:args.p_username==='demo'?'demo@ejemplo.invalid':null,error:null}:rpc(name,args);
  const from=c.from;c.from=table=>{const q=from(table),then=q.then;q.then=async(resolve,reject)=>{if(f.dataGate)await f.dataGate;return then(resolve,reject)};return q};
  if(options.inactive)f.db.profiles[0].active=false;
  if(options.missingProfile)f.db.profiles=f.db.profiles.filter(p=>p.user_id!=='admin-1');
  if(options.failTable)f.failTable=options.failTable;
  return c;
 };
})();`;

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
 try{
  async function open(options={},viewport={width:1440,height:1000},entry='index.html'){
   const page=await browser.newPage({viewport});
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(opts=>window.authTestOptions=opts,options);
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'text/javascript',body:mock});
    if(u.hostname!=='burgershot.test')return route.abort();
    if(u.pathname==='/config.js')return route.fulfill({contentType:'text/javascript',body:"window.BURGERSHOT_CLOUD={supabaseUrl:'https://fixture.invalid',supabaseAnonKey:'test-only'}"});
    const file=path.resolve(base,'.'+decodeURIComponent(u.pathname));
    if(!file.startsWith(base+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
    const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
    return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
   });
   await page.goto('http://burgershot.test/'+entry,{waitUntil:'domcontentloaded'});
   if(!options.restore)await page.locator('#authLoading').waitFor({state:'hidden'});
   return page;
  }
  async function credentials(page,password='demo'){
   await page.locator('#loginUsername').fill('demo');await page.locator('#loginPassword').fill(password);
  }
  async function login(page,password='demo'){
   await credentials(page,password);await page.locator('#loginBtn').click();
  }
  let page=await open();
  assert.equal(await page.locator('#authScreen').isVisible(),true);
  // V7: copias redimensionadas del mismo logo original (assets/burgershot-muertos.webp).
  assert.equal(await page.locator('#authScreen .logo img').getAttribute('src'),'assets/logo/burgershot-muertos-320.webp');
  assert.equal(await page.locator('#authLoading img').getAttribute('src'),'assets/logo/burgershot-muertos-320.webp');
  assert.ok(await page.locator('#authScreen .logo img').evaluate(img=>img.complete&&img.naturalWidth===320));
  await page.waitForTimeout(650);await page.screenshot({path:path.join(preview,'acceso-v6-7-escritorio.png')});
  pass('Acceso temático usa el archivo del logo original en ambas pantallas');
  await page.locator('#loginBtn').click();assert.match(await page.locator('#loginError').innerText(),/Escribe usuario/);
  assert.equal(await page.evaluate(()=>fixture.authCalls),0);pass('Campos vacíos no inician peticiones ni muestran carga');
  await credentials(page);await page.locator('#toggleLoginPassword').click();
  assert.equal(await page.locator('#loginPassword').getAttribute('type'),'text');
  assert.equal(await page.locator('#toggleLoginPassword').getAttribute('aria-pressed'),'true');
  await page.locator('#toggleLoginPassword').click();assert.equal(await page.locator('#loginPassword').getAttribute('type'),'password');
  pass('Mostrar y ocultar contraseña mantiene etiquetas accesibles');
  await login(page,'incorrecta');await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.match(await page.locator('#loginError').innerText(),/incorrectos/);assert.equal(await page.locator('#loginBtn').isEnabled(),true);
  assert.equal(await page.evaluate(()=>document.getElementById('authScreen').inert),false);
  pass('Contraseña incorrecta devuelve el formulario, libera los controles y permite reintentar');
  await credentials(page);await page.locator('#loginPassword').press('Enter');
  await page.locator('#app').waitFor({state:'visible'});await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.match(await page.locator('#welcomeTitle').innerText(),/Alex/);
  assert.equal(await page.locator('#loginPassword').inputValue(),'');
  assert.equal(await page.evaluate(()=>fixture.callbackAsync),false);
  pass('Enter inicia sesión, muestra bienvenida y elimina la contraseña del formulario');
  const before=await page.evaluate(()=>fixture.calls.filter(c=>c.table==='products').length);
  await page.evaluate(()=>{fixture.authCallback('TOKEN_REFRESHED',{user:{id:'admin-1'}});fixture.authCallback('SIGNED_IN',{user:{id:'admin-1'}})});
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>fixture.calls.filter(c=>c.table==='products').length),before);
  assert.equal(await page.locator('#authLoading').isVisible(),false);
  pass('Renovar el token o repetir el evento de acceso conserva el panel sin duplicar carga');
  await page.evaluate(()=>authTestClient.auth.signOut());await page.locator('#authScreen').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.getElementById('app').inert),false);
  pass('Cerrar sesión vuelve al acceso y limpia el estado de carga');await page.close();

  page=await open({holdAuth:true,holdData:true});await login(page);
  assert.equal(await page.locator('#authLoadingMessage').innerText(),'Verificando acceso…');
  await page.evaluate(()=>{document.getElementById('loginForm').dispatchEvent(new Event('submit',{cancelable:true}));document.getElementById('loginForm').dispatchEvent(new Event('submit',{cancelable:true}))});
  assert.equal(await page.evaluate(()=>fixture.authCalls),1);
  assert.equal(await page.evaluate(()=>document.getElementById('authScreen').inert),true);
  await page.screenshot({path:path.join(preview,'carga-v6-7-escritorio.png')});
  pass('Carga real bloquea envíos repetidos y aísla el formulario del teclado');
  await page.evaluate(()=>fixture.releaseAuth());await page.waitForFunction(()=>document.getElementById('authLoadingMessage').textContent==='Comprobando tu cuenta…');
  await page.evaluate(()=>fixture.releaseData());await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.equal(await page.locator('#app').isVisible(),true);assert.equal(await page.evaluate(()=>fixture.calls.filter(c=>c.table==='products'&&c.offset===0).length),1);
  pass('La sesión y sus eventos concurrentes cargan el catálogo una sola vez');await page.close();

  for(const [options,message,name] of [
   [{inactive:true},/desactivada/,'Cuenta desactivada'],
   [{missingProfile:true},/perfil/,'Cuenta sin perfil'],
   [{failTable:'products'},/cargar tu negocio/,'Error al cargar catálogo']
  ]){
   page=await open(options);await login(page);await page.locator('#authLoading').waitFor({state:'hidden'});
   await page.waitForFunction(()=>document.getElementById('loginError').textContent.length>0);
   assert.match(await page.locator('#loginError').innerText(),message);assert.equal(await page.locator('#app').isVisible(),false);
   assert.equal(await page.locator('#loginBtn').isEnabled(),true);pass(name+' recupera el acceso sin dejar la carga bloqueada');await page.close();
  }
  page=await open();await page.evaluate(()=>fixture.networkError=true);await login(page);await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.match(await page.locator('#loginError').innerText(),/conexión/);
  await page.evaluate(()=>fixture.networkError=false);await login(page);await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.equal(await page.locator('#app').isVisible(),true);pass('Error de red recupera controles y el siguiente intento puede completar la sesión');await page.close();

  page=await open({restore:true});await page.locator('#app').waitFor({state:'visible'});await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>fixture.authCalls),0);pass('Sesión guardada carga el negocio sin pedir credenciales');await page.close();
  page=await open({sessionError:true});assert.match(await page.locator('#loginError').innerText(),/comprobar tu sesión/);
  assert.equal(await page.locator('#loginBtn').isEnabled(),true);pass('Fallo al restaurar sesión deja un acceso utilizable');await page.close();

  page=await open({holdData:true});await login(page);await page.waitForFunction(()=>document.getElementById('authLoadingMessage').textContent==='Comprobando tu cuenta…');
  await page.evaluate(()=>authTestClient.auth.signOut());await page.evaluate(()=>fixture.releaseData());await page.waitForTimeout(100);
  assert.equal(await page.locator('#app').isVisible(),false);assert.equal(await page.locator('#authLoading').isVisible(),false);
  pass('Cerrar sesión durante una petición impide que el resultado tardío abra el panel');await page.close();

  page=await open({holdAuth:true});await page.emulateMedia({reducedMotion:'reduce'});await login(page);
  const animations=await page.evaluate(()=>[...document.querySelectorAll('#authLoading *,#authScreen .auth-card')].some(el=>getComputedStyle(el).animationName!=='none'));
  assert.equal(animations,false);await page.evaluate(()=>fixture.releaseAuth());await page.locator('#authLoading').waitFor({state:'hidden'});
  pass('Movimiento reducido mantiene la carga visible sin animaciones');await page.close();
  page=await open({holdAuth:true});await page.evaluate(()=>document.body.classList.add('motion-off'));await login(page);
  // V7.1: el cargador es el propio emblema (burgershot-logo variant=loader); sin animación debe verse completo.
  assert.equal(await page.locator('#authLoading .bs-mark-fill').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await page.locator('#authLoading .bs-mark-fill').evaluate(el=>getComputedStyle(el).clipPath),'none');
  await page.evaluate(()=>fixture.releaseAuth());await page.locator('#authLoading').waitFor({state:'hidden'});
  pass('El ajuste de animaciones también desactiva el acceso y la bienvenida');await page.close();

  page=await open();
  for(const width of [320,360,390,768,900,1120,1440,1600]){
   await page.setViewportSize({width,height:width<=900?844:1000});await page.waitForTimeout(80);
   assert.equal(await page.evaluate(()=>document.getElementById('authScreen').scrollWidth>innerWidth+1),false,'Overflow '+width);
   const bounds=await page.locator('#loginForm').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1,'Form '+width);
   if(width<=900)assert.match(await page.locator('#authScreen h1').innerText(),/Bienvenido al turno/);
   if(width===390){await page.waitForTimeout(600);await page.screenshot({path:path.join(preview,'acceso-v6-7-movil.png')})}
  }
  await page.setViewportSize({width:390,height:480});await page.locator('#loginBtn').scrollIntoViewIfNeeded();assert.equal(await page.locator('#loginBtn').isVisible(),true);
  pass('Formulario sin desbordamiento en ocho anchos y accesible con poca altura');await page.close();
  page=await open({}, {width:1440,height:1000}, 'DEMO_ACCESO.html');
  assert.equal(await page.locator('#loginUsername').inputValue(),'demo');
  await page.locator('#loginBtn').click();await page.locator('#app').waitFor({state:'visible'});await page.locator('#authLoading').waitFor({state:'hidden'});
  assert.match(await page.locator('#welcomeTitle').innerText(),/Alex/);
  assert.equal(await page.locator('#loginError').innerText(),'');
  pass('La demo de acceso permite probar demo / demo con sus propios datos locales');await page.close();
  assert.deepEqual(errors,[]);pass('Sin errores JavaScript en los escenarios de acceso');
  fs.writeFileSync(path.join(__dirname,'auth-browser-results.json'),JSON.stringify({passed:passed.length,scenarios:passed,environment:'Chromium aislado; Supabase y red simulados; sin cuentas reales'},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
