/* Generate a clearly labeled demo from the production HTML; no live Supabase client. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<title>BurgerShot · Punto de venta</title>','<title>BurgerShot · Vista previa de temporada</title>');
html=html.replace(/<script[^>]+src="[^\"]*supabase[^\"]*"[^>]*><\/script>/,'<script src="tests/fixtures/marketing-backend.js"></script>');
html=html.replace(/<script[^>]+src="config\.js[^\"]*"[^>]*><\/script>/,'<script src="assets/seasonal/preview-data.js"></script>');
if(html.includes('cdn.jsdelivr.net/npm/@supabase')||!html.includes('preview-data.js'))throw new Error('Preview script substitution failed');
html=html.replace('<body>','<body>\n<div class="seasonal-preview-note" role="status">Vista previa · Datos de ejemplo. Los cambios no afectan tu negocio. <a href="index.html">Abrir la aplicación →</a></div>');
html=html.replace('</body>',`<script>
(() => {
 const start=()=>{
  const app=document.getElementById('app');
  if(app.classList.contains('hidden'))return;
  observer.disconnect();
  document.querySelector('[data-add="44444444-4444-4444-8444-444444444444"]')?.click();
  document.querySelector('[data-add="66666666-6666-4666-8666-666666666666"]')?.click();
  document.getElementById('posClient').value='128';
 };
 const observer=new MutationObserver(start);observer.observe(document.getElementById('app'),{attributes:true,attributeFilter:['class']});start();
})();
</script>\n</body>`);
fs.writeFileSync(path.join(root,'VISTA_PREVIA.html'),html);
console.log('VISTA_PREVIA.html generated with isolated example data.');
