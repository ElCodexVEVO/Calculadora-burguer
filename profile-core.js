(function(root){
  'use strict';
  const MODES=['cinematic','balanced','performance'];
  function initials(name){return String(name||'').trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase()||'BS'}
  function validateFile(file){if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Elige una fotografía JPG, PNG o WebP.');if(file.size>5*1024*1024)throw Error('La fotografía debe pesar como máximo 5 MB.');if(!file.size)throw Error('La fotografía está vacía.');return true}
  function crop(width,height,zoom=1,x=0,y=0){
    if(!(width>0&&height>0))throw Error('Dimensiones inválidas');
    const size=Math.min(width,height)/Math.max(1,Math.min(3,Number(zoom)||1));
    return {sx:(width-size)/2*(1+Math.max(-1,Math.min(1,x))),sy:(height-size)/2*(1+Math.max(-1,Math.min(1,y))),size};
  }
  function stats(sales,userId,start=null,end=null){
    const rows=sales.filter(s=>s.created_by===userId&&s.status==='active'&&(!start||new Date(s.created_at)>=start)&&(!end||new Date(s.created_at)<end));
    return {count:rows.length,generated:rows.reduce((n,s)=>n+Number(s.total||0),0),earnings:rows.reduce((n,s)=>n+Number(s.employee_earnings||0),0)};
  }
  function periods(now=new Date()){const week=new Date(now);week.setHours(0,0,0,0);week.setDate(week.getDate()-(week.getDay()+6)%7);return{week,month:new Date(now.getFullYear(),now.getMonth(),1)}}
  const api={MODES,initials,validateFile,crop,stats,periods};
  root.BurgerProfileCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
