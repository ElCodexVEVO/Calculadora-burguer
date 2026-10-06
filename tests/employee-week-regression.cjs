const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),pause=()=>new Promise(r=>setTimeout(r,40));
(async()=>{
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window,$=id=>w.document.getElementById(id);
  try{
    w.confirm=()=>true;w.eval(fs.readFileSync(path.join(__dirname,'mock-supabase.js'),'utf8'));
    const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
    const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const seed=w.fixture.db.sales[0],previous=new Date(start);previous.setDate(previous.getDate()-1);
    w.fixture.db.sales.push({...seed,id:'void',total:50000,status:'void'}, {...seed,id:'previous',total:50000,created_at:previous.toISOString()});
    w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));await pause();
    let count=0;const ok=s=>{count++;console.log('PASS '+s)};
    assert.equal(w.document.querySelector('.employee-week-kpis strong').textContent,'1');ok('Cuenta solo ventas activas de la semana actual');
    $('editEmployeeWeekBtn').click();$('employeeWeekPhotoUrl').value='javascript:alert(1)';$('saveEmployeeWeekBtn').click();await pause();
    assert.equal(w.fixture.calls.filter(c=>c.op==='upsert').length,0);ok('URL no segura rechazada antes de guardar');
    $('employeeWeekEmployee').value='admin-1';$('employeeWeekPhotoUrl').value='https://example.invalid/foto.webp';
    $('saveEmployeeWeekBtn').click();$('saveEmployeeWeekBtn').click();await pause();
    assert.equal(w.fixture.calls.filter(c=>c.op==='upsert').length,1);assert.equal(w.fixture.db.employee_of_week[0].week_start,day(start));
    assert.equal(w.document.querySelector('.employee-week-person h3').textContent,'Alex Rivera');ok('Admin elige a empleado sin ventas; doble clic guarda una vez');
    $('refreshBtn').click();await pause();assert.equal(w.document.querySelector('.employee-week-person h3').textContent,'Alex Rivera');ok('Elección y foto persisten al recargar los datos');
    $('editEmployeeWeekBtn').click();$('employeeWeekPhotoUrl').value='';$('saveEmployeeWeekBtn').click();await pause();
    assert.equal(w.fixture.db.employee_of_week[0].photo_url,'');assert.equal(w.document.querySelector('.employee-week-avatar img'),null);ok('Quitar foto conserva reconocimiento con iniciales');
    w.fixture.db.employee_of_week[0].week_start=day(previous);$('refreshBtn').click();await pause();
    assert.equal(w.document.querySelector('.employee-week-person h3').textContent,'María López');ok('Elección antigua cede al líder de la semana actual');
    w.fixture.db.profiles[0].role='cashier';w.fixture.db.profiles[0].can_manage_employees=true;$('refreshBtn').click();await pause();
    assert.equal($('editEmployeeWeekBtn').classList.contains('hidden'),true);$('editEmployeeWeekBtn').click();assert.equal($('employeeWeekModal').classList.contains('hidden'),true);ok('Empleado con otros permisos no abre configuración');
    w.fixture.db.sales=[];w.fixture.db.employee_of_week=[];$('refreshBtn').click();await pause();
    assert.ok($('employeeWeekContent').textContent.includes('Aún no hay ventas'));ok('Semana sin ventas muestra estado vacío');
    console.log(`${count} pruebas V5.5 frontend superadas; Supabase simulado.`);
  }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exit(1)});
