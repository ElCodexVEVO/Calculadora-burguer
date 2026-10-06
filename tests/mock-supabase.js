// Local regression fixture ONLY. Never shipped or loaded by the production app.
window.BURGERSHOT_CLOUD={supabaseUrl:'https://fixture.invalid',supabaseAnonKey:'test-only'};
const now=new Date().toISOString();
const seedProducts=[
 ['Combo Hamburguesa','combos',280,'burger'],['Combo Nuggets','combos',280,'all'],['Combo Alitas','combos',280,'all'],['Combo Burrito','combos',280,'all'],
 ['Hamburguesa','individuales',200,'burger'],['Cubo de alitas','individuales',200,'all'],['Burrito','individuales',200,'all'],['Nuggets','individuales',200,'all'],
 ['Cola-Shot','extras',100,'all'],['Helado','extras',100,'all'],['Papitas','extras',100,'all'],['Caja Feliz','cajas',400,'happybox'],['Cajita Feliz EMS','cajas',250,'none','ems'],['Cajita Feliz Policía','cajas',250,'none','police'],
 ...['Hamburguesa','Nuggets','Alitas','Burrito'].flatMap(n=>[5,25,50,100].map(q=>[`Mayoreo ${n} ${q}×${q}`,'mayoreo',q*240,n==='Hamburguesa'?'burger':'all']))
];
window.fixture={
 calls:[],failNextSale:false,delaySale:0,role:'admin',
 db:{stores:[{id:'store-1',name:'BurgerShot'}],profiles:[{user_id:'admin-1',store_id:'store-1',name:'Alex Rivera',username:'alex',role:'admin',active:true,commission_percent:20},{user_id:'cashier-1',store_id:'store-1',name:'María López',username:'maria',role:'cashier',active:true,commission_percent:15}],employee_of_week:[],
 products:seedProducts.map(([name,category,price,tag,restriction],i)=>({id:'p'+i,store_id:'store-1',name,category,price,emoji:'',tag,restriction:restriction||null,active:true,sort_order:i})),
 discounts:[{id:'d0',name:'Sin convenio',percent:0,scope:'all',description:'Precio normal.',active:true,system:true},{id:'d1',name:'Redline Mechanics',percent:25,scope:'all',description:'Convenio autorizado del 25%.',active:true},{id:'d2',name:'Solo hamburguesas',percent:25,scope:'burger',description:'Aplica a hamburguesas.',active:true},{id:'d3',name:'Exclusivo civil',percent:25,scope:'all',exclude_public:true,active:true},{id:'d4',name:'Inactivo',percent:90,scope:'all',active:false}].map(d=>({...d,store_id:'store-1'})),
 sales:[{id:'sale-seed',sale_number:1,store_id:'store-1',created_by:'cashier-1',employee_name:'María López',client:'Cliente general',client_type:'general',payment:'cash',total:280,subtotal:280,commission_percent:15,employee_earnings:42,business_net:238,status:'active',items:[{id:'p0',name:'Combo Hamburguesa',price:280,qty:1,lineTotal:280}],created_at:now,payout_id:null}],employee_payouts:[],audit_events:[]}
};
function query(table){
 const q={table,op:'select',payload:null,filters:[],one:false,limitCount:Infinity,offset:0,orders:[]};
 const api={select(){return api},eq(k,v){q.filters.push([k,v,'eq']);return api},gte(k,v){q.filters.push([k,v,'gte']);return api},lt(k,v){q.filters.push([k,v,'lt']);return api},is(k,v){q.filters.push([k,v,'eq']);return api},order(k,o={}){q.orders.push([k,o.ascending!==false]);return api},range(a,b){q.offset=a;q.limitCount=b-a+1;return api},limit(n){q.limitCount=n;return api},single(){q.one=true;return api},maybeSingle(){q.one=true;return api},insert(v){q.op='insert';q.payload=v;return api},upsert(v,o={}){q.op='upsert';q.payload=v;q.conflict=o.onConflict||'';return api},update(v){q.op='update';q.payload=v;return api},delete(){q.op='delete';return api},
 async then(resolve,reject){try{
   const f=window.fixture;f.calls.push(JSON.parse(JSON.stringify(q)));let rows=f.db[table]||[];const match=r=>q.filters.every(([k,v,op])=>op==='gte'?r[k]>=v:op==='lt'?r[k]<v:r[k]===v);
   if(q.op==='insert'||q.op==='upsert'){
     if(table==='sales'){
       if(f.delaySale)await new Promise(r=>setTimeout(r,f.delaySale));
       if(f.failNextSale){f.failNextSale=false;return resolve({data:null,error:{message:'Error de prueba: no se registró la venta'}})}
     }
     const row={...q.payload,id:table+'-'+Date.now(),created_at:now};
     if(table==='sales'){const p=f.db.profiles.find(p=>p.user_id===row.created_by);Object.assign(row,{sale_number:rows.length+1,commission_percent:p.commission_percent,employee_earnings:row.total*p.commission_percent/100,business_net:row.total*(1-p.commission_percent/100),payout_id:null})}
     if(table==='products')row.sort_order=999;
     if(q.op==='upsert'&&q.conflict){const keys=q.conflict.split(',').map(x=>x.trim()).filter(Boolean);const existing=rows.find(item=>keys.every(k=>item[k]===row[k]));if(existing)Object.assign(existing,row);else rows.unshift(row)}else rows.unshift(row);
   }else if(q.op==='update')rows.filter(match).forEach(row=>Object.assign(row,q.payload));
   else if(q.op==='delete')f.db[table]=rows=rows.filter(row=>!match(row));
   if(f.failTable===table)return resolve({data:null,error:{code:'PGRST205',message:'Missing test table'}});let data=rows.filter(match).sort((a,b)=>{for(const [k,asc] of q.orders){if(a[k]===b[k])continue;return (a[k]<b[k]?-1:1)*(asc?1:-1)}return 0}).slice(q.offset,q.offset+q.limitCount);if(q.one)data=data[0]||null;
   resolve({data:JSON.parse(JSON.stringify(data)),error:null});
 }catch(e){reject(e)}}};return api;
}
const client={
 auth:{getSession:async()=>({data:{session:{user:{id:'admin-1',email:'test@example.invalid'}}}}),onAuthStateChange(fn){window.fixture.authCallback=fn;return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>window.fixture.authCallback?.('SIGNED_OUT',null)},
 from:query,storage:{from(){return{upload:async(path)=>{window.fixture.calls.push({storage:'upload',path});return{data:{path},error:null}},getPublicUrl(path){return{data:{publicUrl:'https://fixture.invalid/employee-week/'+path}}}}}},channel(){return{on(){return this},subscribe(){return this}}},removeChannel(){},
 async rpc(name,args){const f=window.fixture;f.calls.push({rpc:name,args});if(name==='create_employee_payout'){const rows=f.db.sales.filter(s=>s.created_by===args.p_employee&&s.status==='active'&&!s.payout_id);const employee=f.db.profiles.find(p=>p.user_id===args.p_employee);const id='payout-'+Date.now();f.db.employee_payouts.push({id,store_id:'store-1',sales_snapshot:JSON.parse(JSON.stringify(rows)),employee_id:args.p_employee,employee_name:employee.name,amount:rows.reduce((a,s)=>a+s.employee_earnings,0),generated_total:rows.reduce((a,s)=>a+s.total,0),business_net:rows.reduce((a,s)=>a+s.business_net,0),sales_count:rows.length,created_at:now,created_by_name:'Alex Rivera'});rows.forEach(s=>s.payout_id=id);return{data:id,error:null}}return{data:null,error:null}},
 functions:{async invoke(name,{body}){const f=window.fixture;f.calls.push({fn:name,body});if(body.action==='create'){f.db.profiles.push({user_id:'employee-new',store_id:'store-1',name:body.name,username:body.username,role:body.role,commission_percent:body.commission_percent,active:true});return{data:{ok:true},error:null}}if(body.action==='set_active'){const target=f.db.profiles.find(p=>p.user_id===body.user_id);if(target)target.active=body.active;return{data:{ok:true},error:null}}if(body.action==='delete'){const id=body.user_id;const hasSales=f.db.sales.some(s=>s.created_by===id||s.voided_by===id);const hasPayouts=f.db.employee_payouts.some(p=>p.employee_id===id||p.created_by===id);if(hasSales||hasPayouts)return{data:{error:'Este perfil tiene ventas o cortes asociados. Déjalo inactivo para conservar el historial.'},error:null};f.db.profiles=f.db.profiles.filter(p=>p.user_id!==id);return{data:{ok:true,user_id:id},error:null}}return{data:{ok:true},error:null}}}
};
window.supabase={createClient:()=>client};
