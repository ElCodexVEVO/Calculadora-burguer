/* Exercise the real seasonal screens against the same offline example data as the preview. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const groups={pos:['pos','companion'],sales:['dashboard','mySales','allSales','analytics','customers'],team:['employees','payouts'],announcements:['announcements'],settings:['products','discounts','coupons','audit']};
(async()=>{
 const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error('path');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff':'font/woff','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BURGERSHOT_CHROMIUM||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:1536,height:1080},timezoneId:'America/Mexico_City'}),errors=[],missing=[];
  await ctx.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const page=await ctx.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});page.on('dialog',d=>d.accept(d.type()==='prompt'?'Pedido de prueba':undefined));
  await page.goto(origin+'/VISTA_PREVIA.html');await page.waitForSelector('#app:not(.hidden)');await page.evaluate(()=>document.fonts.ready);
  await fs.mkdir(path.join(root,'test-results'),{recursive:true});
  const shot=async(name)=>page.screenshot({path:path.join(root,'test-results/seasonal-'+name+'.png'),fullPage:true,animations:'disabled',style:'#toastHost{visibility:hidden!important}'});
  const nav=async(area,name)=>{if(await page.locator('#mobileMenu').isVisible())await page.click('#mobileMenu');await page.click('[data-area="'+area+'"]');if(!await page.locator('#page-'+name).evaluate(el=>el.classList.contains('active')))await page.click('.nav-item[data-page="'+name+'"]');};
  const overflow=async(label)=>{const info=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));if(info.scroll>info.width+1){console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&!el.closest('#sidebar,.table-wrap,#weeklyChart')}).slice(-18).map(el=>({tag:el.tagName,id:el.id,cls:el.className,width:el.getBoundingClientRect().width}))));}assert.ok(info.scroll<=info.width+1,label+' overflow '+JSON.stringify(info));};
  assert.equal(await page.textContent('#grandTotal'),'$300');
  assert.equal(await page.inputValue('#posClient'),'128');
  await shot('pos');
  await page.click('#checkoutBtn');assert.equal(await page.inputValue('#saleClient'),'128');
  assert.equal(await page.locator('#confirmSaleBtn').isDisabled(),false);
  await page.click('#confirmSaleBtn');await page.waitForSelector('#checkoutModal.hidden',{state:'attached'});
  assert.equal(await page.evaluate(()=>window.__mock.db.sales.at(-1).total),300);
  assert.equal(await page.inputValue('#posClient'),'');assert.equal(await page.textContent('#grandTotal'),'$0');
  // Bulk quantities and templates are reachable in the compact product/ticket UI.
  const product=page.locator('.product-card').first();await product.locator('.bulk-options summary').click();await product.locator('[data-add-preset][data-quantity="10"]').click();assert.equal(await page.textContent('#grandTotal'),'$2,000');
  await page.click('#saveTemplateBtn');await page.locator('.seasonal-order-extras>summary').click();
  const template=await page.locator('#templateSelect option').last().getAttribute('value');await page.click('#clearCartBtn');await page.selectOption('#templateSelect',template);await page.click('#loadTemplateBtn');assert.equal(await page.textContent('#grandTotal'),'$2,000');
  await page.click('#clearCartBtn');await page.locator('[data-add]').first().click();await page.locator('[data-add]').last().click();await page.locator('.seasonal-order-extras>summary').click();
  for(const [area,pages]of Object.entries(groups)){for(const name of pages){await nav(area,name);await overflow(name);}}
  await nav('team','employees');await shot('employees');await page.locator('[data-employee]').nth(1).click();assert.equal(await page.locator('#employeeDetailModal').isVisible(),true);await page.click('[data-close="employeeDetailModal"]');
  await nav('announcements','announcements');await shot('announcements');
  await nav('sales','allSales');await shot('sales');
  for(const width of [1024,768,390,320]){
   await page.setViewportSize({width,height:1000});
   for(const [area,pages]of Object.entries(groups)){for(const name of pages){await nav(area,name);await overflow(width+' '+name);}}
   await nav('pos','pos');if(width===390)await shot('mobile');
   if(width===320){await page.keyboard.press('Control+k');assert.equal(await page.locator('#productSearch').evaluate(el=>el===document.activeElement),true);}
  }
  await page.setViewportSize({width:1536,height:1080});await nav('pos','pos');await page.fill('#posClient','128');await shot('pos');
  const touchContext=await browser.newContext({viewport:{width:320,height:800},hasTouch:true,timezoneId:'America/Mexico_City'});
  await touchContext.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const touchPage=await touchContext.newPage();await touchPage.goto(origin+'/VISTA_PREVIA.html');await touchPage.waitForSelector('#app:not(.hidden)');
  assert.ok(await touchPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Touch layout overflow');
  await touchPage.locator('[data-add]').first().click();assert.equal(await touchPage.textContent('#grandTotal'),'$500');await touchContext.close();
  // Ordinary employees cannot reach administrative areas.
  await page.evaluate(()=>{window.__mock.profile.role='cashier'});await page.click('#refreshBtn');await page.waitForSelector('[data-area="team"][hidden]',{state:'attached'});assert.equal(await page.locator('[data-area="settings"]').isVisible(),false);
  await page.click('#topAccountBtn');await page.click('#logoutBtn');await page.waitForSelector('#authScreen:not(.hidden)');await shot('login');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS seasonal checkout, prefilled client, cart reset, bulk quantities, templates, 14 screens at 1536/1024/768/390/320px, employee detail, role navigation, logout, assets and browser errors.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
