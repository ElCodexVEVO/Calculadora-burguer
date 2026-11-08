'use strict';
// Ilustraciones de comida Burger Shot · Candy Kustom.
// Genera assets/kustom/food/<clave>.svg (20 piezas) con un mismo trazo. Las fotos de menú
// (assets/menu-fotos) tienen prioridad; estas ilustraciones cubren los productos sin foto
// y los estados vacíos, con el mismo trazo:
// tinta gruesa, color candy plano, sombra de un tono y brillos cromados.
// Uso: node design/kustom/build-food.cjs
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../../assets/kustom/food');
fs.mkdirSync(out, { recursive: true });

const C = {
  ink: '#1d0b0e', red: '#d61a1f', redD: '#98101d', gold: '#ffb526', goldD: '#e0950f',
  bun: '#f0a43c', bunD: '#c8771d', patty: '#6e3018', pattyD: '#4a1c0d', lettuce: '#78d24d', lettuceD: '#3f9a2a',
  tomato: '#ef3b2d', cheese: '#ffc82e', cream: '#fff3e0', creamD: '#e6cdab', chrome: '#e3eaec', chromeD: '#9eafb5',
  blue: '#2f5fe0', blueD: '#1d3d9e', navy: '#1f2d5f', navyD: '#121b3d', kraft: '#c98a4b', kraftD: '#965f2c',
  wing: '#cf6420', wingD: '#93380f', nug: '#eaa64c', nugD: '#b8732a', tort: '#f2d39b', tortD: '#cba061', choc: '#7a3b1e',
};
const o = (d, fill, extra = '') => `<path class="o" d="${d}" fill="${fill}"${extra}/>`;
const f = (d, fill, op = 1) => `<path d="${d}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
const hl = d => `<path class="h" d="${d}"/>`;
const g = (x, y, s, body, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})"${extra}>${body}</g>`;
const spark = (x, y, s = 1) => g(x, y, s, '<path d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2Z" fill="#fff"/>');
const shadow = (w = 70, y = 0) => `<ellipse cx="0" cy="${y}" rx="${w}" ry="${w * 0.12}" fill="#000" opacity=".28"/>`;

function burger(double = false) {
  const lift = double ? 24 : 0;
  const seeds = [[-30, -92], [-12, -99], [8, -100], [27, -94], [-22, -80], [1, -85], [21, -80], [42, -80], [-42, -78]]
    .map(([x, y], i) => `<ellipse class="o" cx="${x}" cy="${y - lift}" rx="4.6" ry="2.6" fill="${C.cream}" stroke-width="2.2" transform="rotate(${(i % 3 - 1) * 24} ${x} ${y - lift})"/>`).join('');
  const patty = dy => o(`M-62 ${-40 + dy} Q-65 ${-31 + dy} -60 ${-23 + dy} H60 Q65 ${-31 + dy} 62 ${-40 + dy} Q60 ${-45 + dy} 54 ${-45 + dy} H-54 Q-60 ${-45 + dy} -62 ${-40 + dy}Z`, C.patty)
    + f(`M-60 ${-30 + dy} Q-10 ${-24 + dy} 60 ${-30 + dy} L60 ${-24 + dy} H-60Z`, C.pattyD, .8)
    + [-40, -16, 10, 34].map(x => `<circle cx="${x}" cy="${-36 + dy}" r="2.2" fill="${C.pattyD}"/>`).join('');
  const cheese = dy => o(`M-64 ${-47 + dy} H64 L58 ${-40 + dy} Q52 ${-40 + dy} 49 ${-33 + dy} Q46 ${-26 + dy} 42 ${-34 + dy} Q38 ${-40 + dy} 22 ${-40 + dy} L15 ${-31 + dy} Q11 ${-25 + dy} 7 ${-31 + dy} L1 ${-40 + dy} H-24 Q-30 ${-40 + dy} -32 ${-30 + dy} Q-35 ${-23 + dy} -38 ${-31 + dy} L-42 ${-40 + dy} H-58Z`, C.cheese);
  let b = shadow(72);
  b += o('M-58 -22 H58 Q63 -22 61 -14 Q57 0 40 0 H-40 Q-57 0 -61 -14 Q-63 -22 -58 -22Z', C.bun);
  b += f('M-60 -12 Q-50 -2 -40 -2 H40 Q50 -2 60 -12 Q58 0 40 0 H-40 Q-58 0 -60 -12Z', C.bunD, .9);
  b += patty(0) + cheese(0);
  if (double) b += patty(-24) + cheese(-24);
  b += o(`M-66 ${-50 - lift} Q-58 ${-59 - lift} -50 ${-50 - lift} Q-42 ${-59 - lift} -34 ${-50 - lift} Q-26 ${-59 - lift} -18 ${-50 - lift} Q-10 ${-59 - lift} -2 ${-50 - lift} Q6 ${-59 - lift} 14 ${-50 - lift} Q22 ${-59 - lift} 30 ${-50 - lift} Q38 ${-59 - lift} 46 ${-50 - lift} Q54 ${-59 - lift} 62 ${-50 - lift} Q70 ${-51 - lift} 66 ${-45 - lift} H-66 Q-71 ${-47 - lift} -66 ${-50 - lift}Z`, C.lettuce);
  b += o(`M-56 ${-62 - lift} H56 Q62 ${-62 - lift} 62 ${-57 - lift} Q62 ${-52 - lift} 56 ${-52 - lift} H-56 Q-62 ${-52 - lift} -62 ${-57 - lift} Q-62 ${-62 - lift} -56 ${-62 - lift}Z`, C.tomato);
  b += o(`M-64 ${-60 - lift} Q-67 ${-66 - lift} -60 ${-71 - lift} Q-48 ${-109 - lift} 0 ${-111 - lift} Q48 ${-109 - lift} 60 ${-71 - lift} Q67 ${-66 - lift} 64 ${-60 - lift} Q62 ${-56 - lift} 56 ${-56 - lift} H-56 Q-62 ${-56 - lift} -64 ${-60 - lift}Z`, C.bun);
  b += f(`M20 ${-107 - lift} Q52 ${-100 - lift} 60 ${-71 - lift} Q66 ${-66 - lift} 63 ${-60 - lift} Q40 ${-62 - lift} 30 ${-76 - lift} Q22 ${-90 - lift} 20 ${-107 - lift}Z`, C.bunD, .75);
  b += seeds + hl(`M-40 ${-88 - lift} Q-27 ${-101 - lift} -8 ${-104 - lift}`) + hl(`M-48 ${-76 - lift} Q-47 ${-80 - lift} -45 ${-83 - lift}`);
  return b;
}
function fries() {
  const sticks = [[-30, -6, 74], [-18, 4, 92], [-6, -3, 100], [6, 5, 96], [18, -4, 90], [30, 8, 76], [-24, 12, 66], [24, -10, 70], [0, 0, 84]]
    .map(([x, r, h]) => `<g transform="translate(${x} -54) rotate(${r})">${o(`M-5 ${-h + 54} H5 V12 H-5Z`, C.cheese)}${f(`M1 ${-h + 56} H5 V12 H1Z`, C.goldD, .55)}</g>`).join('');
  return shadow(46) + sticks
    + o('M-44 -66 Q-22 -56 0 -66 Q22 -56 44 -66 L35 0 H-35Z', C.red)
    + f('M14 -60 Q30 -58 44 -66 L35 0 H16Z', C.redD, .6)
    + `<circle class="o" cx="0" cy="-30" r="14" fill="${C.gold}"/>`
    + f('M0 -39 L2.6 -32.6 L9 -32 L4 -27.6 L5.6 -21 L0 -24.6 L-5.6 -21 L-4 -27.6 L-9 -32 L-2.6 -32.6Z', C.red)
    + hl('M-34 -54 L-29 -12');
}
function drink() {
  return shadow(38)
    + o('M-31 -100 H31 L25 0 H-25Z', C.cream)
    + f('M-29.4 -72 H29.4 L27.6 -40 H-27.6Z', C.red)
    + f('M10 -100 H31 L25 0 H8Z', C.creamD, .7)
    + o('M-29.4 -72 H29.4 L27.6 -40 H-27.6Z', 'none', ' stroke-width="3"')
    + o('M-28 -110 Q0 -126 28 -110Z', C.chrome)
    + o('M-36 -101 Q-36 -110 -30 -110 H30 Q36 -110 36 -101Z', C.chrome)
    + o('M5 -119 L15 -152 L23 -149 L13 -117Z', C.gold)
    + `<circle class="o" cx="0" cy="-56" r="9" fill="${C.gold}" stroke-width="3"/>`
    + hl('M-21 -92 L-17 -12') + `<ellipse cx="18" cy="-24" rx="2.4" ry="3.4" fill="#fff" opacity=".85"/><ellipse cx="14" cy="-84" rx="2" ry="3" fill="#fff" opacity=".85"/>`;
}
function wingShape(x, y, r, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${o('M-18 -6 Q-26 -20 -10 -26 Q4 -30 14 -18 Q22 -8 14 2 Q6 10 -6 6 Q-14 4 -18 -6Z', C.wing)}${f('M2 -4 Q10 -10 14 -2 Q8 8 -4 6Z', C.wingD, .8)}${hl('M-12 -18 Q-6 -22 2 -21')}</g>`;
}
function bucket() {
  return shadow(54)
    + wingShape(-26, -86, -20) + wingShape(8, -92, 15) + wingShape(30, -82, 40) + wingShape(-6, -78, -60)
    + o('M-48 -80 H48 L38 0 H-38Z', C.cream)
    + f('M-30 -80 H-18 L-14 0 H-24Z', C.red) + f('M-6 -80 H6 V0 H-6Z', C.red) + f('M18 -80 H30 L24 0 H14Z', C.red)
    + f('M20 -80 H48 L38 0 H16Z', C.creamD, .45)
    + o('M-48 -80 H48 L38 0 H-38Z', 'none')
    + o('M-53 -88 Q-53 -92 -49 -92 H49 Q53 -92 53 -88 V-80 Q53 -76 49 -76 H-49 Q-53 -76 -53 -80Z', C.red)
    + `<circle class="o" cx="0" cy="-40" r="15" fill="${C.gold}"/>` + f('M0 -50 L2.8 -43 L10 -42.4 L4.4 -37.6 L6.2 -30.4 L0 -34.4 L-6.2 -30.4 L-4.4 -37.6 L-10 -42.4 L-2.8 -43Z', C.red)
    + hl('M-40 -70 L-33 -10');
}
function nugget(x, y, r) {
  return `<g transform="translate(${x} ${y}) rotate(${r})">${o('M-14 -4 Q-16 -14 -6 -15 Q4 -18 12 -11 Q18 -4 12 4 Q4 10 -6 8 Q-15 6 -14 -4Z', C.nug)}${f('M2 2 Q10 0 12 -6 Q16 2 8 6 Q0 9 -4 7Z', C.nugD, .7)}<circle cx="-5" cy="-6" r="1.6" fill="${C.nugD}"/><circle cx="4" cy="-2" r="1.4" fill="${C.nugD}"/></g>`;
}
function nuggetsBox() {
  return shadow(60)
    + o('M-46 -66 L-58 -96 H58 L46 -66Z', C.goldD)
    + nugget(-28, -72, -10) + nugget(-6, -80, 12) + nugget(18, -74, -24) + nugget(36, -70, 18) + nugget(4, -68, 0)
    + o('M-50 -68 H50 L44 0 H-44Z', C.gold)
    + f('M-48 -44 H48 L47 -32 H-47Z', C.red) + f('M18 -68 H50 L44 0 H16Z', C.goldD, .45)
    + o('M-50 -68 H50 L44 0 H-44Z', 'none')
    + g(52, -2, 1, o('M-16 -18 H16 L12 0 H-12Z', C.cream) + o('M-17 -18 Q0 -26 17 -18Z', C.tomato))
    + hl('M-42 -60 L-37 -8');
}
function burrito() {
  return shadow(70)
    + o('M-64 -22 Q-74 -54 -42 -66 L38 -92 Q72 -98 70 -64 Q68 -42 40 -32 L-32 -6 Q-58 2 -64 -22Z', C.tort)
    + f('M-30 -8 L40 -32 Q66 -42 70 -64 Q72 -40 44 -26 L-26 -2Z', C.tortD, .8)
    + `<path d="M-6 -58 Q2 -40 -6 -22 M18 -68 Q26 -50 18 -32" fill="none" stroke="${C.tortD}" stroke-width="3" stroke-linecap="round"/>`
    + `<g transform="rotate(-20 56 -66)">${o('M56 -90 Q70 -90 70 -66 Q70 -42 56 -42 Q46 -50 46 -66 Q46 -82 56 -90Z', C.patty)}<circle cx="60" cy="-76" r="4" fill="${C.lettuce}"/><circle cx="62" cy="-60" r="3.6" fill="${C.tomato}"/><circle cx="55" cy="-66" r="3.4" fill="${C.cheese}"/><circle cx="58" cy="-50" r="3" fill="${C.lettuce}"/></g>`
    + o('M-64 -22 Q-74 -54 -42 -66 L-8 -78 L4 -18 L-32 -6 Q-58 2 -64 -22Z', C.chrome)
    + `<path d="M-50 -58 L-44 -40 L-52 -26 M-30 -66 L-24 -48 L-30 -30 M-14 -72 L-10 -54 L-16 -36" fill="none" stroke="${C.chromeD}" stroke-width="2.6" stroke-linejoin="round"/>`
    + hl('M-58 -40 Q-60 -54 -46 -60') + hl('M10 -80 L36 -88');
}
function iceCream() {
  return shadow(38)
    + o('M-36 -52 Q-42 -66 -28 -72 H28 Q42 -66 36 -52Z', C.cream)
    + o('M-28 -72 Q-32 -86 -18 -92 H18 Q32 -86 28 -72Z', C.cream)
    + o('M-18 -92 Q-20 -106 0 -114 Q20 -106 18 -92Z', C.cream)
    + f('M8 -112 Q20 -106 18 -92 Q30 -86 28 -72 Q42 -66 36 -52 H14 Q26 -62 20 -72 Q14 -84 8 -112Z', C.creamD, .8)
    + o('M-30 -72 Q-24 -64 -16 -72 Q-10 -80 -2 -72 Q6 -62 12 -72 Q18 -80 26 -72 Q30 -76 28 -80 Q16 -88 0 -88 Q-18 -88 -30 -80Z', C.choc, ' stroke-width="3"')
    + `<path class="o" d="M2 -118 Q10 -132 18 -136" fill="none" stroke-width="3.4"/><circle class="o" cx="2" cy="-121" r="9" fill="${C.red}"/>`
    + o('M-34 -52 H34 L22 0 H-22Z', C.red)
    + `<path d="M-30 -32 Q-20 -40 -10 -32 Q0 -24 10 -32 Q20 -40 30 -32" fill="none" stroke="${C.cream}" stroke-width="5" stroke-linecap="round"/>`
    + f('M12 -52 H34 L22 0 H8Z', C.redD, .55) + o('M-34 -52 H34 L22 0 H-22Z', 'none')
    + hl('M-10 -108 Q-6 -112 0 -112') + `<circle cx="-1" cy="-124" r="2.4" fill="#fff"/>`;
}
function happyBox(kind = 'happy') {
  const body = kind === 'ems' ? C.cream : kind === 'police' ? C.navy : C.gold;
  const bodyD = kind === 'ems' ? C.creamD : kind === 'police' ? C.navyD : C.goldD;
  const handle = kind === 'ems' ? C.blue : kind === 'police' ? C.chrome : C.red;
  const band = kind === 'ems' ? C.red : kind === 'police' ? C.gold : C.red;
  let badge;
  if (kind === 'ems') badge = o('M-9 -54 H9 V-42 H21 V-26 H9 V-14 H-9 V-26 H-21 V-42 H-9Z', C.blue) + `<circle cx="0" cy="-34" r="3.2" fill="#fff"/>`;
  else if (kind === 'police') badge = o('M0 -56 L6 -42 L21 -41 L9.6 -31 L13.4 -16 L0 -24.4 L-13.4 -16 L-9.6 -31 L-21 -41 L-6 -42Z', C.gold) + `<circle cx="0" cy="-34" r="4" fill="${C.navy}"/>`;
  else badge = `<circle class="o" cx="-14" cy="-40" r="4" fill="${C.ink}" stroke-width="2"/><circle class="o" cx="14" cy="-40" r="4" fill="${C.ink}" stroke-width="2"/><path class="o" d="M-18 -28 Q0 -12 18 -28" fill="none"/><circle cx="-24" cy="-28" r="4" fill="${C.red}" opacity=".45"/><circle cx="24" cy="-28" r="4" fill="${C.red}" opacity=".45"/>`;
  return shadow(58)
    + o('M-28 -70 Q-28 -106 0 -106 Q28 -106 28 -70 H16 Q16 -94 0 -94 Q-16 -94 -16 -70Z', handle)
    + o('M-52 -66 Q-52 -72 -46 -72 H46 Q52 -72 52 -66 V-6 Q52 0 46 0 H-46 Q-52 0 -52 -6Z', body)
    + f('M22 -72 H46 Q52 -72 52 -66 V-6 Q52 0 46 0 H22Z', bodyD, .55)
    + f('M-52 -66 Q-52 -72 -46 -72 H46 Q52 -72 52 -66 V-60 H-52Z', band)
    + o('M-52 -66 Q-52 -72 -46 -72 H46 Q52 -72 52 -66 V-6 Q52 0 46 0 H-46 Q-52 0 -52 -6Z', 'none')
    + badge + hl('M-44 -52 V-12');
}
function crate(items) {
  return shadow(86) + items
    + o('M-74 -44 H74 L67 0 H-67Z', C.kraft)
    + f('M-73 -30 H73 L72 -26 H-72Z', C.kraftD, .7) + f('M-71 -14 H71 L70 -10 H-70Z', C.kraftD, .7)
    + f('M30 -44 H74 L67 0 H26Z', C.kraftD, .4) + o('M-74 -44 H74 L67 0 H-67Z', 'none')
    + o('M-28 -36 H28 Q32 -36 32 -32 V-14 Q32 -10 28 -10 H-28 Q-32 -10 -32 -14 V-32 Q-32 -36 -28 -36Z', C.cream, ' stroke-width="3"')
    + `<path d="M-14 -31 L-11.6 -25.6 L-6 -25 L-10.2 -21.2 L-9 -15.6 L-14 -18.6 L-19 -15.6 L-17.8 -21.2 L-22 -25 L-16.4 -25.6Z" fill="${C.red}"/><path d="M-2 -27 H20 M-2 -19 H14" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`
    + hl('M-66 -36 L-62 -6');
}
function wingsTray() {
  return shadow(74)
    + wingShape(-38, -30, -30, 1.05) + wingShape(-10, -40, 10, 1.1) + wingShape(18, -32, 35, 1.05) + wingShape(42, -26, -12, 1)
    + `<g transform="translate(-50 -36) rotate(-28)">${o('M-4 -26 H4 V8 H-4Z', C.red)}${o('M-4 -26 Q0 -34 4 -26Z', C.lettuce, ' stroke-width="3"')}</g>`
    + o('M-66 -24 H66 L56 0 H-56Z', C.red)
    + `<path d="M-66 -24 Q-58 -30 -50 -24 Q-42 -30 -34 -24 Q-26 -30 -18 -24 Q-10 -30 -2 -24 Q6 -30 14 -24 Q22 -30 30 -24 Q38 -30 46 -24 Q54 -30 62 -24" fill="${C.cream}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`
    + f('M24 -24 H66 L56 0 H20Z', C.redD, .5) + o('M-66 -24 H66 L56 0 H-56Z', 'none')
    + hl('M-58 -16 L-52 -4');
}

const W = 300, H = 200, GROUND = 182;
// width/height dan un tamaño intrínseco amplio para lienzos y texturas 3D; en la página manda el CSS.
function svg(key, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="600" height="400" role="img" aria-label="${label}"><title>${label}</title><style>.o{stroke:${C.ink};stroke-width:4.5;stroke-linejoin:round;stroke-linecap:round}.h{fill:none;stroke:#fff;stroke-opacity:.82;stroke-width:4;stroke-linecap:round}</style>${body}</svg>\n`;
}
const place = (part, x, s) => g(x, GROUND, s, part);
const combo = main => place(fries(), 76, 1.02) + place(drink(), 228, 1.02) + place(main, 150, 1.02) + spark(40, 40, .9) + spark(272, 36, .7);
const pieces = {
  'burger': ['Hamburguesa', place(burger(), 150, 1.32) + spark(60, 48) + spark(242, 70, .7)],
  'burger-alt': ['Hamburguesa doble', place(burger(true), 150, 1.18) + spark(62, 46) + spark(240, 64, .7)],
  'fries': ['Papitas', place(fries(), 150, 1.34) + spark(86, 44) + spark(220, 70, .7)],
  'drink': ['Cola-Shot', place(drink(), 150, 1.12) + spark(98, 50) + spark(206, 80, .7)],
  'nuggets': ['Nuggets', place(nuggetsBox(), 144, 1.3) + spark(62, 52) + spark(232, 46, .7)],
  'wings': ['Cubo de alitas', place(bucket(), 150, 1.32) + spark(72, 50) + spark(230, 44, .7)],
  'wings-alt': ['Alitas en charola', place(wingsTray(), 150, 1.45) + spark(58, 60) + spark(244, 58, .7)],
  'burrito': ['Burrito', place(burrito(), 146, 1.4) + spark(62, 44) + spark(246, 120, .7)],
  'icecream': ['Helado', place(iceCream(), 150, 1.22) + spark(96, 56) + spark(206, 46, .7)],
  'happybox': ['Caja Feliz', place(happyBox(), 150, 1.4) + spark(72, 44) + spark(230, 50, .7)],
  'happybox-ems': ['Cajita Feliz EMS', place(happyBox('ems'), 150, 1.4) + spark(72, 44) + spark(230, 50, .7)],
  'happybox-police': ['Cajita Feliz Policía', place(happyBox('police'), 150, 1.4) + spark(72, 44) + spark(230, 50, .7)],
  'combo-burger': ['Combo Hamburguesa', combo(g(0, 0, .98, burger()))],
  'combo-burrito': ['Combo Burrito', combo(g(0, 0, 1, burrito()))],
  'combo-wings': ['Combo Alitas', combo(g(0, 0, 1, bucket()))],
  'combo-nuggets': ['Combo Nuggets', combo(g(0, 0, 1.04, nuggetsBox()))],
  'bulk-burger': ['Hamburguesas por mayoreo', place(crate(g(-40, -34, .62, burger()) + g(40, -34, .62, burger()) + g(0, -52, .66, burger())), 150, 1.18) + spark(48, 50) + spark(254, 54, .7)],
  'bulk-burrito': ['Burritos por mayoreo', place(crate(g(-24, -40, .6, burrito()) + g(26, -30, .6, burrito()) + g(0, -52, .58, burrito())), 150, 1.18) + spark(48, 50) + spark(254, 54, .7)],
  'bulk-wings': ['Alitas por mayoreo', place(crate(g(-36, -30, .52, bucket()) + g(36, -30, .52, bucket()) + g(0, -36, .56, bucket())), 150, 1.18) + spark(48, 46) + spark(254, 54, .7)],
  'bulk-nuggets': ['Nuggets por mayoreo', place(crate(g(-36, -32, .52, nuggetsBox()) + g(36, -32, .52, nuggetsBox()) + g(0, -40, .56, nuggetsBox())), 150, 1.18) + spark(48, 46) + spark(254, 54, .7)],
};
for (const [key, [label, body]] of Object.entries(pieces)) fs.writeFileSync(path.join(out, key + '.svg'), svg(key, label, body));
console.log(`${Object.keys(pieces).length} ilustraciones en ${path.relative(process.cwd(), out)}`);
