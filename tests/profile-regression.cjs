const assert=require('node:assert/strict');
const core=require('../profile-core.js');
let count=0;const test=(name,fn)=>{fn();console.log('PASS '+name);count++};
test('JPG, PNG y WebP válidos; formatos activos y archivos mayores de 5 MB rechazados',()=>{
  for(const type of ['image/jpeg','image/png','image/webp'])assert.equal(core.validateFile({type,size:1024}),true);
  for(const file of [{type:'image/svg+xml',size:100},{type:'image/png',size:5242881},{type:'image/jpeg',size:0}])assert.throws(()=>core.validateFile(file));
});
test('Recorte cubre el marco, limita zoom y nunca sale de la imagen',()=>{
  for(const [w,h] of [[1200,800],[800,1200],[512,512]])for(const zoom of [0,1,2,3,99])for(const x of [-5,-1,0,1,5])for(const y of [-5,0,5]){const c=core.crop(w,h,zoom,x,y);assert.ok(c.sx>=0&&c.sy>=0&&c.sx+c.size<=w+.00001&&c.sy+c.size<=h+.00001)}
});
test('Perfil suma solo las ventas activas propias dentro del periodo',()=>{
  const sales=[{created_by:'me',status:'active',total:100,employee_earnings:15,created_at:'2026-10-12T12:00:00'},{created_by:'other',status:'active',total:500,employee_earnings:100,created_at:'2026-10-12T12:00:00'},{created_by:'me',status:'void',total:1000,employee_earnings:200,created_at:'2026-10-12T12:00:00'},{created_by:'me',status:'active',total:50,employee_earnings:8,created_at:'2026-09-01T12:00:00'}];
  assert.deepEqual(core.stats(sales,'me',new Date('2026-10-01')), {count:1,generated:100,earnings:15});assert.deepEqual(core.stats(sales,'me'),{count:2,generated:150,earnings:23});assert.deepEqual(core.stats(sales,'empty'),{count:0,generated:0,earnings:0});
});
test('Semana local inicia en lunes y el mes en día 1',()=>{const p=core.periods(new Date(2026,9,18,22));assert.equal(p.week.getDay(),1);assert.equal(p.week.getDate(),12);assert.equal(p.month.getDate(),1)});
test('Avatar predeterminado maneja nombres vacíos y los tres modos son finitos',()=>{assert.equal(core.initials('María López'),'ML');assert.equal(core.initials(''),'BS');assert.deepEqual(core.MODES,['cinematic','balanced','performance'])});
console.log(`${count} pruebas de perfiles superadas.`);
