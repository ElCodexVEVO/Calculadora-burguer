/* Used only by VISTA_PREVIA.html and the isolated UI tests. Never loaded by index.html. */
(() => {
  'use strict';
  window.BURGERSHOT_CLOUD={supabaseUrl:'https://example.invalid',supabaseAnonKey:'preview-only'};
  const {db,profile}=window.__mock;
  const store=profile.store_id;
  const camila={...profile,user_id:'22222222-2222-4222-8222-222222222222',name:'Camila Torres',username:'camila',role:'cashier'};
  const diego={...profile,user_id:'33333333-3333-4333-8333-333333333333',name:'Diego Ríos',username:'diego',role:'cashier'};
  db.profiles.push(camila,diego);
  const burger=db.products[0],drink=db.products[1];
  const combo={...burger,id:'77777777-7777-4777-8777-777777777777',name:'Combo hamburguesa',category:'combos',price:280,sort_order:2,emoji:'photo:combo-burger'};
  const fries={...burger,id:'55555555-5555-4555-8555-555555555555',name:'Papitas fritas',category:'extras',price:100,tag:'all',sort_order:3,emoji:'photo:fries'};
  drink.sort_order=4;
  db.products=[burger,combo,fries,drink];
  db.discounts.push({id:'police',store_id:store,name:'Policía',percent:10,scope:'all',active:true,description:'10% para personal de Policía.'});
  const amounts=[300,560,700,400,280,600,300,840,400,700,560,300];
  db.sales=amounts.map((amount,index)=>{
    const employee=db.profiles[index%3];
    const product=amount%280===0?combo:amount%200===0?burger:drink;
    const when=new Date();when.setDate(when.getDate()-Math.floor((11-index)/2));when.setHours(14,index*4,0,0);
    return {id:'sale-demo-'+index,store_id:store,created_by:employee.user_id,employee_name:employee.name,client:String([128,312,420,603][index%4]),client_type:'general',payment:'Efectivo',note:'Venta de ejemplo',items:[{id:product.id,name:product.name,price:product.price,qty:amount/product.price,lineTotal:amount}],subtotal:amount,discount_amount:0,discount_percent:0,discount_name:'Sin convenio',total:amount,status:'active',commission_percent:20,employee_earnings:amount*.2,business_net:amount*.8,sale_number:1041+index,created_at:when.toISOString(),payout_id:null};
  });
  db.audit_events=[];
})();
