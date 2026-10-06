const {PGlite}=require('@electric-sql/pglite');const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{const db=new PGlite();await db.waitReady;
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,last_sign_in_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to public;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;create publication supabase_realtime;`);
const files=['supabase_schema_v3.sql','supabase_patch_v4_2.sql','supabase_patch_v5_1.sql','supabase_patch_v5_2.sql','supabase_patch_v5_3_discord.sql','supabase_patch_v5_4_quantities.sql','supabase_patch_v6.sql'];
for(const file of files)await db.exec(fs.readFileSync(__dirname+'/../'+file,'utf8').replace('create extension if not exists pgcrypto;',''));
const patch=fs.readFileSync(__dirname+'/../supabase_patch_v6_5_convenios.sql','utf8');
let passed=0;const ok=s=>{passed++;console.log('PASS '+s)};
const admin='00000000-0000-4000-8000-000000000001',cashier='00000000-0000-4000-8000-000000000002',later='00000000-0000-4000-8000-000000000003';
for(const id of [admin,cashier,later])await db.query('insert into auth.users(id,email) values($1,$2)',[id,id+'@test.invalid']);
const as=async(id,fn)=>{await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await fn()}finally{await db.exec('reset role');await db.exec("select set_config('request.jwt.claim.sub','',false)")}};
const one=async(s,p=[])=>(await db.query(s,p)).rows[0];
const convenio=(store,name)=>one('select * from discounts where store_id=$1 and name=$2',[store,name]);
const store=(await as(admin,()=>one("select public.bootstrap_store('BurgerShot','Admin','admin','admin@test.invalid') id"))).id;
await db.query("insert into profiles(user_id,store_id,name,role,commission_percent) values($1,$2,'Cajero','cashier',15)",[cashier,store]);
await as(admin,()=>db.query("insert into discounts(store_id,name,percent,scope,description) values($1,'Convenio viejo',30,'all','Ya no vigente')",[store]));
const sales=(await one('select count(*)::int n from sales')).n;

await db.exec(patch);
assert.equal((await one('select count(*)::int n from sales')).n,sales);
const active=(await db.query('select name from discounts where store_id=$1 and active order by sort_order',[store])).rows.map(r=>r.name);
assert.deepEqual(active,['Sin convenio','Talleres','Stop Car','Auto Exotic','Overspeed',"Benny's",'East Customs','Bandas','Cerberus','506','SecuroServ','Bahamas Club','Redline Mechanics','EVO Motors','Top Speed','Empresa de Eventos','503','Kraken','YKZ','Precio Sheriff']);
assert.equal((await convenio(store,'Convenio viejo')).active,false);ok('Lista vigente aplicada; convenio fuera de la lista solo se desactiva');
let row=await convenio(store,'Redline Mechanics');assert.equal(Number(row.percent),10);assert.equal(row.scope,'burger');assert.equal(row.kind,'percent');
row=await convenio(store,'EVO Motors');assert.equal(Number(row.percent),5);
row=await convenio(store,'YKZ');assert.equal(Number(row.percent),10);assert.equal(row.scope,'all');ok('Aliados existentes actualizados por nombre sin duplicarse');
row=await convenio(store,'SecuroServ');assert.equal(row.kind,'unit_price');assert.equal(Number(row.unit_price),200);assert.equal(row.scope,'happybox');
row=await convenio(store,'Bahamas Club');assert.equal(Number(row.unit_price),250);
row=await convenio(store,'Precio Sheriff');assert.equal(row.scope,'combos');assert.deepEqual(row.client_types,['police','sheriff']);ok('Precio especial por caja y precio Sheriff guardados');
const audit=await one("select * from audit_events where entity='discounts' and entity_name='SecuroServ' order by created_at desc limit 1");
assert.equal(audit.actor_name,'Servicio / SQL de administración');assert.equal(Number(audit.after_data.unit_price),200);assert.equal(audit.after_data.kind,'unit_price');ok('Historial registra tipo y precio especial');

await assert.rejects(()=>db.query("insert into discounts(store_id,name,kind,percent) values($1,'Sin precio','unit_price',0)",[store]),/discounts_kind_valid/);
await assert.rejects(()=>db.query("insert into discounts(store_id,name,client_types) values($1,'Cliente raro',array['vip'])",[store]),/discounts_client_types_valid/);ok('Restricciones rechazan precio vacío y tipos de cliente desconocidos');

const id=(await convenio(store,'Bahamas Club')).id;
await as(admin,()=>db.query("update discounts set unit_price=260,client_types=array['general'] where id=$1",[id]));
assert.equal(Number((await convenio(store,'Bahamas Club')).unit_price),260);
await assert.rejects(()=>as(cashier,()=>db.query('update discounts set unit_price=1 where id=$1 returning id',[id]).then(r=>{if(!r.rows.length)throw new Error('row-level security')})),/row-level security/);ok('Administrador edita el precio especial; cajero no');

const caja=await one("select * from products where store_id=$1 and name='Caja Feliz'",[store]),securo=(await convenio(store,'SecuroServ')).id;
const sale=await as(cashier,()=>one("insert into sales(store_id,created_by,employee_name,client,client_type,items,subtotal,discount_id,discount_name,discount_percent,discount_amount,total) values($1,$2,'Cajero','SEC-1','general',$3,800,$4,'SecuroServ',0,400,400) returning *",[store,cashier,JSON.stringify([{id:caja.id,name:caja.name,price:400,qty:2,lineTotal:800}]),securo]));
assert.equal(Number(sale.total),400);assert.equal(Number(sale.employee_earnings),60);ok('Venta con precio especial se registra y calcula comisión');

const newStore=(await as(later,()=>one("select public.bootstrap_store('Sucursal','Otro','otro','otro@test.invalid') id"))).id;
assert.equal((await one('select count(*)::int n from discounts where store_id=$1 and active',[newStore])).n,20);
assert.equal((await convenio(newStore,'Kraken')).scope,'burger');ok('Negocio nuevo recibe la lista vigente');

await db.exec(patch);
assert.equal((await one("select count(*)::int n from discounts where store_id=$1 and name='SecuroServ'",[store])).n,1);
assert.equal(Number((await convenio(store,'Bahamas Club')).unit_price),250);assert.equal((await one('select count(*)::int n from sales')).n,sales+1);ok('Parche repetible: sin duplicados y restablece la lista oficial');

await db.close();fs.writeFileSync(__dirname+'/v6-5-convenios-results.json',JSON.stringify({passed,environment:'PostgreSQL local PGlite, Auth simulado; sin conexión remota'},null,2));console.log(passed+' verificaciones de convenios V6.5 superadas');
})().catch(e=>{console.error(e);process.exit(1)});
