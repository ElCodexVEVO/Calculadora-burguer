'use strict';
// Genera DEMO_V6.html y DEMO_ACCESO.html a partir de index.html para que nunca se desincronicen.
// Uso: node demo/build-demos.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const live = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script src="config.js?v=5.0.6"></script>';
if (!html.includes(live)) throw new Error('index.html ya no carga Supabase y config.js como se esperaba');
// La demo usa datos simulados en memoria: nunca carga Supabase ni config.js.
const demo = html.replace(live, '<script src="demo/mock-supabase.js"></script><script src="demo/data.js"></script>');
const withTitle = (page, title) => page.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
fs.writeFileSync(path.join(root, 'DEMO_V6.html'), withTitle(demo, 'Burger Shot · Vista previa'));
const access = demo.replace('<script src="auth-scene.js', '<script src="demo/auth-preview.js?v=7.0.0"></script>\n<script src="auth-scene.js');
if (access === demo) throw new Error('No se encontró auth-scene.js en index.html');
fs.writeFileSync(path.join(root, 'DEMO_ACCESO.html'), withTitle(access, 'Burger Shot · Acceso de prueba'));
console.log('DEMO_V6.html y DEMO_ACCESO.html generados desde index.html');
