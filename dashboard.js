/* V6.8 · Controles y movimiento del inicio, sin modificar importes. */
(()=>{
  'use strict';
  const dashboard=document.getElementById('page-dashboard');if(!dashboard)return;
  // V7: el botón «Ir a caja» forma parte del banner estático del inicio.
  document.getElementById('dashboardPosBtn')?.addEventListener('click',()=>document.querySelector('.nav-item[data-page="pos"]')?.click());
  const chart=document.getElementById('weeklyActivityContent');
  chart?.addEventListener('click',e=>{
    const button=e.target.closest('.employee-week-bar');if(!button)return;
    chart.querySelectorAll('.employee-week-bar').forEach(el=>{const selected=el===button;el.classList.toggle('is-selected',selected);el.setAttribute('aria-pressed',String(selected))});
  });
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const still=()=>reduced.matches||document.body.classList.contains('motion-off');
  const visible=()=>dashboard.classList.contains('active')&&!document.getElementById('app').classList.contains('hidden')&&!document.hidden;
  const running=new Set();let frame=0,chartSignature='',wasVisible=false;
  const amounts=new Map();
  function stop(){for(const a of running)a.cancel();running.clear()}
  function animate(el,frames,options){
    if(!el?.animate||still())return;
    const a=el.animate(frames,options);running.add(a);
    a.finished.catch(()=>{}).then(()=>running.delete(a));
  }
  function refresh(){
    frame=0;const shown=visible();if(!shown||still())stop();
    dashboard.querySelectorAll('#dashboardMetrics .metric').forEach(el=>{
      const value=el.querySelector('strong'),key=el.dataset.metric,next=value?.textContent;
      if(shown&&!still()&&amounts.has(key)&&amounts.get(key)!==next)animate(value,[{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
      amounts.set(key,next);
    });
    const bars=[...dashboard.querySelectorAll('.employee-week-bar')];
    const signature=bars.map(el=>el.dataset.value).join('|')+'|'+document.getElementById('weeklyActivityName')?.textContent;
    if(shown&&!still()&&(!wasVisible||signature!==chartSignature)){
      for(const [i,el] of bars.entries())if(el.classList.contains('has-sales'))animate(el.querySelector('i'),[{transform:'scaleY(.03)'},{transform:'scaleY(1)'}],{duration:550,delay:i*45,easing:'cubic-bezier(.2,.8,.2,1)'});
      chartSignature=signature;
    }
    wasVisible=shown;
  }
  function queue(){if(!frame)frame=requestAnimationFrame(refresh)}
  // Attribute mutations from selecting a day do not restart the bar animation.
  for(const id of ['dashboardMetrics','employeeWeekContent','teamPerformanceContent','weeklyActivityContent']){
    const host=document.getElementById(id);if(host)new MutationObserver(queue).observe(host,{childList:true,subtree:true,characterData:true});
  }
  new MutationObserver(queue).observe(dashboard,{attributes:true,attributeFilter:['class']});
  new MutationObserver(queue).observe(document.getElementById('app'),{attributes:true,attributeFilter:['class']});
  new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',queue);
  document.addEventListener('visibilitychange',queue);
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);stop()});
  queue();
})();
