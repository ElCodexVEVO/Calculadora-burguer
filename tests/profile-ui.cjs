const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const settle=()=>new Promise(r=>setTimeout(r,50));let count=0;const ok=s=>{count++;console.log('PASS '+s)};
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(read('index.html'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;
 w.eval(read('demo/mock-supabase.js'));w.eval(read('profile-core.js'));w.eval(read('profile.js'));w.eval(read('app.js'));await settle();
 const $=id=>w.document.getElementById(id);$('topProfileBtn').click();assert.equal($('page-profile').classList.contains('active'),true);assert.equal($('profileName').textContent,'Alex Rivera');assert.match($('profileStats').textContent,/\$0/);ok('Mi perfil usa identidad y ventas propias; nunca toma las de otro empleado');
 const modes=[...w.document.querySelectorAll('#page-profile [data-effects-mode]')];modes[2].click();await settle();assert.equal(w.document.body.dataset.effects,'performance');assert.equal(w.fixture.db.employee_appearance[0].effects_mode,'performance');assert.ok(w.document.body.classList.contains('motion-off'));ok('Modo Rendimiento se persiste por cuenta y desactiva el movimiento');
 // Simula nueva sesión/dispositivo: la fuente es la fila remota, sin preferencia local.
 w.localStorage.clear();w.fixture.db.employee_appearance[0].effects_mode='cinematic';$('refreshBtn').click();await settle();assert.equal(w.document.body.dataset.effects,'cinematic');ok('Preferencia remota restaura efectos sin depender de localStorage');
 w.fixture.db.employee_appearance[0].photo_path='mine.jpg';const client=w.supabase.createClient();client.storage.from=()=>({createSignedUrls:async paths=>({data:paths.map(path=>({path,signedUrl:'https://example.invalid/avatar.jpg'})),error:null})});$('refreshBtn').click();await settle();for(const id of ['avatar','topAvatar','profilePortrait'])assert.ok($(id).querySelector('img'));$('refreshBtn').click();await settle();assert.ok($('topAvatar').querySelector('img'));ok('Foto se propaga a sidebar, encabezado y perfil; permanece tras refrescar datos');
 w.fixture.failTable='employee_appearance';$('refreshBtn').click();await settle();assert.equal($('profileStatus').classList.contains('hidden'),false);assert.equal($('editPhotoBtn').disabled,true);assert.equal($('app').classList.contains('hidden'),false);ok('Migración ausente explica la limitación sin bloquear las operaciones');
 await client.auth.signOut();await settle();assert.equal($('photoEditor').classList.contains('hidden'),true);assert.equal($('topAvatar').querySelector('img'),null);ok('Cerrar sesión limpia fotografías privadas y el editor');
 assert.deepEqual(errors,[]);ok('Sin errores de ejecución del módulo de perfiles');dom.window.close();console.log(`${count} pruebas UI de perfiles superadas.`);
})().catch(e=>{console.error(e);process.exit(1)});
