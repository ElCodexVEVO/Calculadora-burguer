"""Barrido de contraste: texto frente a su fondo sólido real en cada pantalla (WCAG AA: 4,5:1 normal, 3:1 grande).

Uso, con un servidor estático en el puerto 8000:
    py tests/contrast-scan.py
Omite fondos con imagen o degradado (no se pueden resolver a un color). Los botones primarios (degradado naranja con texto
oscuro) salen como falsos positivos conocidos.
"""
from playwright.sync_api import sync_playwright
import json,sys
EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PAGES=["dashboard","pos","mySales","analytics","allSales","customers","employees","payouts","audit","discounts","products","administration","loyalty","promotions","profile","settings"]
JS=r"""()=>{
 const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}};
 const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
 const ratio=(a,b)=>{const la=lum(a),lb=lum(b);return (Math.max(la,lb)+.05)/(Math.min(la,lb)+.05)};
 const out=[];const seen=new Set();
 const active=document.querySelector('.page.active');if(!active)return out;
 const els=[...active.querySelectorAll('*')];
 for(const e of els){
  const own=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim().length>1);if(!own.length)continue;
  const r=e.getBoundingClientRect();if(r.width<4||r.height<4)continue;
  const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<.5)continue;
  const fg=parse(cs.color);if(!fg)continue;
  // fondo: primer ancestro con color opaco; si antes hay imagen de fondo, se omite
  let n=e,bg=null,skip=false;
  while(n&&n!==document.documentElement){const s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none'&&n!==e){skip=true;break}
    const c=parse(s.backgroundColor);if(c&&c.a>=.9){bg=c;break}n=n.parentElement}
  if(skip||!bg)continue;
  const eff={r:fg.r,g:fg.g,b:fg.b};const rt=ratio(eff,bg);
  const size=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;const large=size>=24||(size>=18.66&&bold);
  const need=large?3:4.5;
  if(rt<need){const key=e.tagName+'.'+e.className+'|'+own[0].textContent.trim().slice(0,24);if(!seen.has(key)){seen.add(key);out.push([+rt.toFixed(2),need,key,cs.color,'on rgb('+bg.r+','+bg.g+','+bg.b+')'])}}
 }
 return out.sort((a,b)=>a[0]-b[0]).slice(0,12)}"""
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=EDGE,args=["--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://127.0.0.1:8000/DEMO_V6.html"); pg.wait_for_selector("#app:not(.hidden)"); pg.wait_for_timeout(2500)
    total=0
    for pid in PAGES:
        pg.evaluate("id=>document.querySelector(`.nav-item[data-page=\"${id}\"]`)?.click()",pid); pg.wait_for_timeout(1300)
        if pid=="pos":
            for i in (0,8): pg.evaluate("id=>document.querySelector(`[data-add=\"${id}\"]`)?.click()",f"p{i}"); pg.wait_for_timeout(100)
            pg.wait_for_timeout(500)
        r=pg.evaluate(JS); total+=len(r)
        print(pid,len(r)); [print("   ",x) for x in r[:5]]
    print("total",total); b.close()
