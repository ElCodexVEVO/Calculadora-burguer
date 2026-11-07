const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const settle=()=>new Promise(r=>setTimeout(r,70));let passed=0;const ok=s=>{passed++;console.log('PASS '+s)};
async function setup(role='admin'){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS|Not implemented/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(read('index.html'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;w.eval(read('tests/mock-supabase.js'));w.fixture.db.profiles[0].role=role;
 for(const script of ['companion-core.js','companion.js','app.js','dashboard.js','dashboard-plus.js'])w.eval(read(script));await settle();
 const $=s=>w.document.querySelector(s),click=s=>{assert.ok($(s),s);$(s).click()};return{dom,w,$,click,errors};
}
(async()=>{
 const {dom,w,$,click,errors}=await setup();
 assert.equal($('.desk-line').hidden,true);assert.equal(w.document.querySelectorAll('[data-line-day]').length,7);click('[data-chart-view="line"]');assert.equal($('.desk-line').hidden,false);click('[data-chart-view="bars"]');assert.equal($('.desk-line').hidden,true);ok('Línea y barras muestran los siete días del periodo');
 click('.employee-week-bar[data-day="0"]');const days=[...w.document.querySelectorAll('.employee-week-bar')];assert.ok($('#dashboardDayDetail').textContent.includes(days[0].getAttribute('aria-label').split(': ')[0]));days[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(days[1].getAttribute('aria-pressed'),'true');assert.equal(w.document.activeElement,days[1]);days[1].dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(days.at(-1).getAttribute('aria-pressed'),'true');ok('Detalle diario y navegación por flechas y Fin conservan sus valores');
 assert.equal($('#quickProducts'),null);assert.equal($('#miniSales'),null);assert.equal($('.dashboard-actions'),null);assert.equal($('.hero-picker'),null);ok('No se recrean acceso rápido, últimas ventas ni accesos sueltos');
 click('.metric[data-metric="0"] .metric-open');assert.equal($('#page-allSales').classList.contains('active'),true);click('[data-page="dashboard"]');ok('Las métricas mantienen acceso al detalle existente');
 w.fixture.db.sales=[];click('#refreshBtn');await settle();assert.deepEqual(errors,[]);assert.equal($('#dashboardMetrics .metric strong').textContent,'0');ok('Sin ventas el resumen se actualiza a cero sin errores');w.dispatchEvent(new w.Event('pagehide'));await settle();dom.window.close();
 const t=await setup('cashier');t.click('[data-page="dashboard"]');await settle();assert.equal(t.$('#dashboardMetrics').textContent.includes('Neto del negocio'),false);t.click('.metric[data-metric="0"] .metric-open');assert.equal(t.$('#page-mySales').classList.contains('active'),true);assert.equal(t.$('#page-allSales').classList.contains('active'),false);assert.deepEqual(t.errors,[]);t.w.dispatchEvent(new t.w.Event('pagehide'));await settle();t.dom.window.close();ok('El cajero conserva su alcance y no abre ventas ajenas');
 console.log(passed+' pruebas del resumen interactivo superadas.');
})().catch(e=>{console.error(e);process.exit(1)});
