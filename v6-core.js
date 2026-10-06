/* Shared deterministic promotion rules; SQL independently validates at checkout. */
(function(root){
'use strict';
const status=(p,now=Date.now())=>!p.active?'Pausada':p.ends_at&&Date.parse(p.ends_at)<=now?'Expirada':p.starts_at&&Date.parse(p.starts_at)>now?'Programada':'Activa';
const discount=(p,lines)=>{
 const eligible=lines.filter(x=>x.tag!=='none'&&(!p.product_id||x.id===p.product_id));
 const base=eligible.reduce((a,x)=>a+Number(x.price)*x.qty,0);let amount=0;
 if(p.kind==='percent')amount=Math.round(base*Number(p.value)/100);
 if(p.kind==='fixed')amount=Number(p.value);
 if(p.kind==='two_for_one')amount=eligible.reduce((a,x)=>a+Math.floor(x.qty/2)*Number(x.price),0);
 if(p.kind==='combo')amount=eligible.reduce((a,x)=>a+Math.max(0,Number(x.price)-Number(p.value))*x.qty,0);
 return Math.round(Math.max(0,Math.min(base,amount))*100)/100;
};
const api={status,discount};if(typeof module==='object')module.exports=api;else root.BurgerV6Core=api;
})(typeof window==='object'?window:globalThis);
