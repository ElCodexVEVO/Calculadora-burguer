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
  function periods(now=new Date()){const week=new Date(now);week.setHours(0,0,0,0);week.setDate(week.getDate()-(week.getDay()+6)%7);const weekEnd=new Date(week);weekEnd.setDate(weekEnd.getDate()+7);return{week,weekEnd,month:new Date(now.getFullYear(),now.getMonth(),1)}}
  const SOCIALS={instagram:{label:'Instagram',host:'www.instagram.com',max:30},discord:{label:'Discord',max:37},tiktok:{label:'TikTok',host:'www.tiktok.com',max:24,prefix:'@'},twitch:{label:'Twitch',host:'www.twitch.tv',max:25}};
  function socialLinks(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Las redes sociales no son válidas.');
    const out={};
    for(const [key,value] of Object.entries(input)){
      const platform=SOCIALS[key];if(!platform)throw Error('Esa red social no está disponible.');if(typeof value!=='string')throw Error('Escribe un usuario válido de '+platform.label+'.');
      let handle=value.trim();if(!handle)continue;
      if(/^https?:\/\//i.test(handle)){
        let url;try{url=new URL(handle)}catch{throw Error('El enlace de '+platform.label+' no es válido.')}
        const host=platform.host?.replace(/^www\./,'');if(url.protocol!=='https:'||!host||![host,'www.'+host].includes(url.hostname.toLowerCase())||url.search||url.hash||url.username||url.password||url.port)throw Error('Usa el usuario o un enlace HTTPS de '+platform.label+'.');
        handle=url.pathname.replace(/^\/|\/$/g,'');
      }
      handle=handle.replace(/^@/,'');
      const valid=key==='discord'?/^[a-zA-Z0-9_.]{2,32}(#[0-9]{4})?$/.test(handle):/^[a-zA-Z0-9_.]+$/.test(handle);
      if(!valid||handle.length>platform.max)throw Error('Revisa el usuario de '+platform.label+'.');out[key]=handle;
    }
    return out;
  }
  function socialURL(key,handle){const platform=SOCIALS[key];return platform?.host?'https://'+platform.host+'/'+(platform.prefix||'')+encodeURIComponent(handle)+'/':null}
  const api={MODES,SOCIALS,initials,validateFile,crop,stats,periods,socialLinks,socialURL};
  root.BurgerProfileCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
