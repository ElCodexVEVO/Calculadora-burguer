'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),passed=[],errors=[];
const pass=name=>{passed.push(name);console.log('PASS '+name)};
const seed=`(()=>{
 const f=window.fixture,start=new Date();start.setHours(12,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
 const original=f.db.sales[0];f.db.sales=[45240,309000].map((total,i)=>{const day=new Date(start);day.setDate(day.getDate()+i*2);return{...original,id:'weekly-'+i,created_by:'cashier-1',employee_name:'María López',total,employee_earnings:total*.15,business_net:total*.85,created_at:day.toISOString()}});
 if(window.dashboardTest==='empty'){f.db.sales=[];f.db.employee_of_week=[]}
 if(window.dashboardTest==='cashier'){f.db.profiles[0].role='cashier';f.db.profiles[0].commission_percent=15;f.db.profiles[0].can_view_reports=false}
})();`;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
 try{
  async function open(mode,entry='DEMO_V6.html'){
   const page=await browser.newPage({viewport:{width:1720,height:1160},timezoneId:'America/Mexico_City'});
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(value=>window.dashboardTest=value,mode);
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.hostname!=='burgershot.test')return route.abort();
    const file=path.resolve(base,'.'+decodeURIComponent(u.pathname));
    if(!file.startsWith(base+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
    const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
    const body=u.pathname==='/demo/data.js'?fs.readFileSync(file,'utf8')+seed:fs.readFileSync(file);
    return route.fulfill({body,contentType:types[path.extname(file)]||'application/octet-stream'});
   });
   await page.goto('http://burgershot.test/'+entry,{waitUntil:'domcontentloaded'});
   await page.locator('#app').waitFor({state:'visible'});await page.locator('#authLoading').waitFor({state:'hidden'});
   await page.locator('.employee-week-person h3').waitFor({state:mode==='empty'?'hidden':'visible'});
   return page;
  }
  let page=await open();await page.waitForTimeout(950);
  assert.equal(await page.locator('#customerWeek').count(),0);
  assert.equal(await page.locator('#page-dashboard').getByText('Cliente de la semana',{exact:false}).count(),0);
  assert.equal(await page.locator('.employee-week-ranking').count(),1);
  const ranking=await page.locator('#teamPerformance').boundingBox(),employee=await page.locator('.employee-week').boundingBox(),chart=await page.locator('#weeklyActivity').boundingBox();
  assert.ok(Math.abs(ranking.y-employee.y)<2&&ranking.x+ranking.width<employee.x+1);
  assert.ok(chart.y>=employee.y+employee.height&&Math.abs(chart.width-(employee.x+employee.width-ranking.x))<2);
  pass('Ranking reemplaza al cliente destacado junto al empleado; gráfico ocupa todo el ancho');
  const hero=await page.locator('#page-dashboard>.atelier-hero').boundingBox(),entry=await page.locator('#dashboardPosBtn').boundingBox();
  assert.ok(entry.y+entry.height<hero.y+hero.height-5,'Botón del banner completamente visible con espacio inferior');
  assert.deepEqual(await page.locator('#dashboardMetrics .metric strong').allTextContents(),['2','$354,240','$53,136','$301,104']);
  assert.equal(await page.locator('.employee-week-person h3').innerText(),'María López');
  assert.equal(await page.locator('#weeklyActivityTotal').innerText(),'$354,240');
  assert.equal(await page.locator('.employee-week-kpis strong').first().innerText(),'2');
  assert.match(await page.locator('.employee-week-average').innerText(),/\$177,120/);
  pass('Totales, comisión, neto, reconocimiento y ticket promedio conservan los datos reales de la fixture');
  assert.deepEqual(await page.locator('.employee-week-bar').evaluateAll(els=>els.map(el=>Number(el.dataset.value))),[45240,0,309000,0,0,0,0]);
  assert.equal(await page.locator('.employee-week-bar.has-sales').count(),2);
  assert.match(await page.locator('#weeklyActivityName').innerText(),/María López/);
  const heights=await page.locator('.employee-week-bar.has-sales i').evaluateAll(els=>els.map(el=>parseFloat(el.style.height)));
  assert.ok(Math.abs(heights[1]/heights[0]-309000/45240)<.001);
  pass('Gráfico usa importes proporcionales, identifica al empleado y no dibuja ventas en días con cero');
  const monday=page.locator('[data-day="0"]');await monday.focus();await page.keyboard.press('Enter');
  assert.equal(await monday.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.employee-week-bar[aria-pressed="true"]').count(),1);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-day="0"] .dashboard-bar-tooltip')).opacity==='1');
  assert.equal(await monday.locator('.dashboard-bar-tooltip').evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.match(await monday.getAttribute('aria-label'),/\$45,240/);
  await page.locator('[data-day="1"]').click();assert.equal(await page.locator('[data-day="1"] .dashboard-bar-tooltip').innerText(),'$0');
  pass('Consulta por clic y teclado muestra el importe, incluido cero, sin modificar totales');
  await page.locator('[data-day="2"]').click();await page.mouse.move(0,0);await page.waitForTimeout(220);
  await page.screenshot({path:path.join(base,'preview/panel-v6-8-escritorio.png')});
  await page.locator('#dashboardPosBtn').click();assert.equal(await page.locator('#page-pos').isVisible(),true);
  await page.locator('[data-page="dashboard"]').click();
  assert.equal(await page.locator('#customerWeek').count(),0);assert.equal(await page.locator('.employee-week-ranking').count(),1);
  pass('Ir a caja abre el POS y volver o renderizar no duplica el ranking ni recrea Cliente de la semana');
  await page.locator('#editEmployeeWeekBtn').click();await page.locator('#employeeWeekEmployee').selectOption('admin-1');await page.locator('#saveEmployeeWeekBtn').click();await page.locator('#employeeWeekModal').waitFor({state:'hidden'});
  assert.equal(await page.locator('.employee-week-person h3').innerText(),'Alex Rivera');
  assert.equal(await page.locator('#weeklyActivityTotal').innerText(),'$0');
  assert.match(await page.locator('#weeklyActivityName').innerText(),/Alex Rivera/);
  assert.equal(await page.locator('#teamPerformanceContent').getByText('María López',{exact:true}).count(),1);
  pass('Elección manual del empleado actualiza el gráfico y mantiene el ranking independiente');
  await page.evaluate(()=>{fixture.db.employee_of_week=[]});await page.locator('#refreshBtn').click();
  await page.locator('.employee-week-person h3').filter({hasText:'María López'}).waitFor();
  for(const width of [320,360,390,560,768,980,1120,1440,1720]){
   await page.setViewportSize({width,height:width<1000?844:1160});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Desbordamiento '+width);
   for(const selector of ['#dashboardMetrics','#teamPerformance','.employee-week','#weeklyActivity','#dashboardPosBtn']){
    const r=await page.locator(selector).boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+1,selector+' '+width);
   }
   if(width===390){
    await page.locator('#quickProducts .quick-card').last().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll('#quickProducts img')].every(img=>img.complete&&img.naturalWidth>0));
    await page.evaluate(()=>window.scrollTo(0,0));await page.mouse.move(0,0);await page.waitForTimeout(3300);
    await page.screenshot({path:path.join(base,'preview/panel-v6-8-movil.png'),fullPage:true});
   }
  }
  pass('Nueve anchos de 320 a 1720 px conservan contenido y controles dentro de la pantalla');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-page="pos"]').click();await page.locator('[data-page="dashboard"]').click();await page.waitForTimeout(50);
  assert.equal(await page.locator('#page-dashboard').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  pass('Movimiento reducido desactiva las animaciones del panel');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.body.classList.add('motion-off'));await page.locator('[data-page="pos"]').click();await page.locator('[data-page="dashboard"]').click();await page.waitForTimeout(50);
  assert.equal(await page.locator('#page-dashboard').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  pass('El ajuste de animaciones de la app también cancela los efectos nuevos');await page.close();
  page=await open('empty');
  assert.match(await page.locator('#teamPerformanceContent').innerText(),/Sin ventas/);
  assert.match(await page.locator('#employeeWeekContent').innerText(),/Aún no hay ventas/);
  assert.match(await page.locator('#weeklyActivityContent').innerText(),/Tu semana empieza/);
  assert.equal(await page.locator('.employee-week-bar').count(),0);assert.equal(await page.locator('#weeklyActivityTotal').innerText(),'$0');
  pass('Semana vacía tiene estados coherentes y no inventa un líder ni ventas');await page.close();
  page=await open('cashier');
  assert.equal(await page.locator('#editEmployeeWeekBtn').isVisible(),false);
  assert.equal(await page.locator('#dashboardMetrics .metric strong').first().innerText(),'0');
  assert.equal(await page.locator('#dashboardMetrics .metric span').first().textContent(),'Mis ventas');
  pass('Vista de cajero conserva métricas personales y permisos del reconocimiento');await page.close();
  assert.deepEqual(errors,[]);pass('Sin errores de JavaScript en las vistas revisadas');
  fs.writeFileSync(path.join(__dirname,'dashboard-browser-results.json'),JSON.stringify({passed:passed.length,scenarios:passed,errors,liveSupabase:false},null,2));
  console.log(passed.length+' comprobaciones del panel superadas con datos simulados.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
