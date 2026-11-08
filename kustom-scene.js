/* Burger Shot · Candy Kustom — escena ilustrada "noche de crucero".
   Un lowrider candy Burger Shot frente al local, con el emblema aprobado en el poste.
   Se dibuja en vectores dentro del banner del inicio, el acceso y la pantalla de carga. */
(() => {
  'use strict';
  const INK = '#0b0303';
  // Generador determinista para estrellas y luces de ciudad.
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const defs = id => `<defs>
    <linearGradient id="${id}Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0303"/><stop offset=".55" stop-color="#230806"/><stop offset="1" stop-color="#4d120c"/></linearGradient>
    <radialGradient id="${id}Warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}Lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}Tail" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff3045" stop-opacity=".9"/><stop offset="1" stop-color="#ff3045" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}Candy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a5c"/><stop offset=".35" stop-color="#e01f1f"/><stop offset="1" stop-color="#6a0611"/></linearGradient>
    <linearGradient id="${id}Chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c7d3d7"/><stop offset=".55" stop-color="#7d8f95"/><stop offset="1" stop-color="#e8eef0"/></linearGradient>
    <linearGradient id="${id}Glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a2420"/><stop offset="1" stop-color="#140606"/></linearGradient>
    <linearGradient id="${id}Window" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#ff9a3c"/></linearGradient>
    <linearGradient id="${id}Street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#170707"/><stop offset="1" stop-color="#090202"/></linearGradient>
    <linearGradient id="${id}Reflect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e01f1f" stop-opacity=".45"/><stop offset="1" stop-color="#e01f1f" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}FadeX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff"/><stop offset=".75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}Soft" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}FadeX)"/></mask>
    <radialGradient id="${id}Moon" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#ffe8d6" stop-opacity=".22"/><stop offset="1" stop-color="#ffe8d6" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}ReflectGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347" stop-opacity=".4"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></linearGradient>
  </defs>`;

  function stars(w, h, n, seed) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = (r() * w).toFixed(1), y = (r() * h).toFixed(1), size = (0.6 + r() * 1.5).toFixed(2);
      const tw = i % 7 === 0 ? ` class="ks-twinkle" style="--d:${(r() * 4).toFixed(2)}s"` : '';
      s += `<circle cx="${x}" cy="${y}" r="${size}" fill="#f6efe0" opacity="${(0.35 + r() * 0.55).toFixed(2)}"${tw}/>`;
    }
    return s;
  }
  function palm(x, ground, h, lean, scale = 1) {
    const top = ground - h, tx = x + lean;
    const fronds = [-150, -120, -85, -55, -25, 10, 35].map((a, i) => {
      const len = (70 + (i % 3) * 14) * scale, rad = a * Math.PI / 180;
      const ex = tx + Math.cos(rad) * len, ey = top + Math.sin(rad) * len * 0.55 + len * 0.42;
      const mx = tx + Math.cos(rad) * len * 0.5, my = top + Math.sin(rad) * len * 0.5 - 10 * scale;
      return `<path d="M${tx} ${top} Q${mx} ${my - 8 * scale} ${ex} ${ey} Q${mx} ${my + 8 * scale} ${tx} ${top + 4 * scale}Z"/>`;
    }).join('');
    return `<g fill="${INK}"><path d="M${x - 6 * scale} ${ground} Q${x + lean * 0.3} ${ground - h * 0.5} ${tx - 3 * scale} ${top} H${tx + 3 * scale} Q${x + lean * 0.3 + 8 * scale} ${ground - h * 0.5} ${x + 6 * scale} ${ground}Z"/>${fronds}</g>`;
  }
  function wheel(cx, cy, id) {
    let spokes = '';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      spokes += `<line x1="${(cx + Math.cos(a) * 4).toFixed(1)}" y1="${(cy + Math.sin(a) * 4).toFixed(1)}" x2="${(cx + Math.cos(a + 0.5) * 18).toFixed(1)}" y2="${(cy + Math.sin(a + 0.5) * 18).toFixed(1)}"/>`;
    }
    return `<g class="ks-wheel"><circle cx="${cx}" cy="${cy}" r="33" fill="#0d0b0c" stroke="#000" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="25" fill="none" stroke="#efe8dc" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="20" fill="url(#${id}Chrome)"/><g stroke="#6f8086" stroke-width="1.1">${spokes}</g><circle cx="${cx}" cy="${cy}" r="6.5" fill="#ffb526" stroke="#8a5a00" stroke-width="1.4"/><path d="M${cx - 13} ${cy - 2} L${cx - 5} ${cy - 3} V${cy + 3} L${cx - 13} ${cy + 2}Z M${cx + 13} ${cy - 2} L${cx + 5} ${cy - 3} V${cy + 3} L${cx + 13} ${cy + 2}Z" fill="#ffb526" stroke="#8a5a00" stroke-width="1"/></g>`;
  }
  // Lowrider de perfil mirando a la izquierda; el suelo local está en y=162.
  function car(id) {
    const flake = [[70, 112], [150, 96], [236, 116], [318, 100], [402, 114], [470, 100], [268, 66]]
      .map(([x, y], i) => `<path class="ks-flake" style="--d:${(i * 0.7).toFixed(1)}s" d="M${x} ${y - 5} L${x + 1.3} ${y - 1.3} L${x + 5} ${y} L${x + 1.3} ${y + 1.3} L${x} ${y + 5} L${x - 1.3} ${y + 1.3} L${x - 5} ${y} L${x - 1.3} ${y - 1.3}Z" fill="#fff"/>`).join('');
    return `<g class="ks-car">
      <ellipse cx="270" cy="164" rx="262" ry="11" fill="#000" opacity=".55"/>
      <circle cx="10" cy="96" r="46" fill="url(#${id}Lamp)" class="ks-headlight"/>
      <circle cx="522" cy="98" r="30" fill="url(#${id}Tail)"/>
      <path d="M178 84 L224 50 Q231 44 245 44 H338 Q354 44 366 53 L408 84Z" fill="#f2ece2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M194 82 L232 55 Q237 51 246 51 H292 V82Z M300 51 H336 Q348 51 358 59 L392 82 H300Z" fill="url(#${id}Glass)"/>
      <path d="M238 58 L224 80 H236 L250 58Z M318 54 L300 80 H308 L326 54Z" fill="#fff" opacity=".22"/>
      <path d="M18 112 Q14 92 40 87 L172 82 H408 L494 87 Q516 90 516 110 L514 121 Q512 128 502 128 H468 A37 37 0 0 0 394 128 H170 A37 37 0 0 0 96 128 H30 Q19 128 18 112Z" fill="url(#${id}Candy)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M40 89 Q270 84 500 90 L500 95 Q270 89 40 95Z" fill="#fff" opacity=".42"/>
      <path d="M60 106 Q270 99 500 106" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".5"/>
      <path d="M60 104 Q270 97 500 104" fill="none" stroke="url(#${id}Chrome)" stroke-width="3.4" stroke-linecap="round"/>
      <g fill="none" stroke="#ffb526" stroke-width="1.6" stroke-linecap="round" class="ks-pinstripe">
        <path d="M46 99 C60 90 78 90 92 97 C78 101 62 102 46 99Z"/><path d="M440 98 C456 90 474 90 488 97 C474 101 458 102 440 98Z"/>
        <path d="M252 116 C258 106 276 104 284 114 C278 122 264 122 262 115 C261 111 265 108 269 110"/><path d="M290 116 C300 108 318 108 324 116"/>
      </g>
      ${flake}
      <path d="M8 106 Q6 97 17 97 H34 V121 H17 Q8 121 8 113Z" fill="url(#${id}Chrome)" stroke="${INK}" stroke-width="2.4"/>
      <path d="M500 97 H515 Q524 97 524 106 V113 Q524 121 515 121 H500Z" fill="url(#${id}Chrome)" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="22" cy="93" r="4.6" fill="#fff6d2" stroke="${INK}" stroke-width="1.6"/><circle cx="33" cy="91.5" r="4" fill="#fff6d2" stroke="${INK}" stroke-width="1.6"/>
      <rect x="508" y="90" width="9" height="7" rx="2" fill="#ff2a3a" stroke="${INK}" stroke-width="1.6"/>
      ${wheel(133, 128, id)}${wheel(431, 128, id)}
    </g>`;
  }
  // Local Burger Shot con autoservicio: origen en la esquina inferior izquierda.
  function shop(id) {
    const scallops = Array.from({ length: 10 }, (_, i) => {
      const x = 16 + i * 37;
      return `<path d="M${x} -132 h37 v14 q-9.25 10 -18.5 0 q-9.25 10 -18.5 0Z" fill="${i % 2 ? '#f2ece2' : '#e01f1f'}"/>`;
    }).join('');
    return `<g>
      <ellipse cx="200" cy="6" rx="250" ry="22" fill="url(#${id}Warm)"/>
      <rect x="0" y="-156" width="400" height="156" fill="#2b0e0b" stroke="${INK}" stroke-width="3"/>
      <rect x="-8" y="-184" width="416" height="32" rx="4" fill="#e01f1f" stroke="${INK}" stroke-width="3"/>
      <rect x="-8" y="-184" width="416" height="6" rx="3" fill="url(#${id}Chrome)"/>
      <path d="M8 -164 H392" stroke="#ffb526" stroke-width="1.6" stroke-dasharray="1 0"/>
      ${scallops}
      <g class="ks-windows">
        <rect x="22" y="-112" width="84" height="88" fill="url(#${id}Window)"/><rect x="114" y="-112" width="84" height="88" fill="url(#${id}Window)"/>
        <rect x="206" y="-112" width="84" height="88" fill="url(#${id}Window)"/><rect x="298" y="-112" width="80" height="100" fill="url(#${id}Window)" opacity=".85"/>
      </g>
      <path d="M22 -100 H290 M22 -52 H290" stroke="#8a3a12" stroke-width="2" opacity=".55"/>
      <rect x="34" y="-108" width="60" height="20" rx="2" fill="#3a1408" opacity=".6"/><rect x="126" y="-108" width="60" height="20" rx="2" fill="#3a1408" opacity=".6"/><rect x="218" y="-108" width="60" height="20" rx="2" fill="#3a1408" opacity=".6"/>
      <path d="M22 -40 H290" stroke="#5a2410" stroke-width="7"/>
      <g fill="#2a0e06" opacity=".75"><circle cx="70" cy="-60" r="8"/><path d="M58 -40 Q58 -54 70 -54 Q82 -54 82 -40Z"/><circle cx="246" cy="-64" r="8"/><path d="M234 -40 Q234 -58 246 -58 Q258 -58 258 -40Z"/></g>
      <path d="M106 -112 V-24 M198 -112 V-24 M290 -112 V-24" stroke="${INK}" stroke-width="5"/>
      <rect x="296" y="-114" width="84" height="104" fill="none" stroke="${INK}" stroke-width="5"/>
      <rect x="0" y="-12" width="400" height="12" fill="#1a0806"/>
    </g>`;
  }
  function sign(id, h) {
    return `<g><rect x="-7" y="${-h}" width="14" height="${h}" fill="#2d100c" stroke="${INK}" stroke-width="3"/>
      <circle cx="0" cy="${-h - 50}" r="96" fill="url(#${id}Warm)" class="ks-sign-glow"/>
      <image href="assets/burgershot-logo.webp" x="-70" y="${-h - 112}" width="140" height="118" preserveAspectRatio="xMidYMid meet"/></g>`;
  }

  // variant: 'hero' (banner ancho) o 'auth' (pantalla completa).
  function scene(variant = 'hero') {
    const id = 'ks' + variant;
    const auth = variant === 'auth';
    const W = 1600, H = auth ? 900 : 340, ground = auth ? 760 : 292;
    const carX = auth ? 40 : 720, carS = auth ? 0.92 : 0.94;
    const shopX = auth ? 1030 : 1200, shopS = auth ? 1.32 : 1;
    const hills = `M0 ${ground - 70} Q120 ${ground - 120} 260 ${ground - 92} T560 ${ground - 110} T880 ${ground - 86} T1200 ${ground - 124} T1600 ${ground - 96} V${ground} H0Z`;
    const r = rng(auth ? 77 : 41);
    let city = '';
    for (let i = 0; i < 70; i++) city += `<rect x="${(r() * W).toFixed(0)}" y="${(ground - 24 - r() * 70).toFixed(0)}" width="2" height="2" fill="${r() > .7 ? '#ffb347' : '#e8f1ef'}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
    return `<svg class="ks-scene ks-scene-${variant}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      ${defs(id)}
      <rect width="${W}" height="${H}" fill="url(#${id}Sky)"/>
      <g class="ks-far">
        <g>${stars(W, ground - 120, auth ? 140 : 60, auth ? 9 : 3)}</g>
        <g class="ks-shooting"><path d="M${auth ? 300 : 300} ${auth ? 120 : 40} l120 40" stroke="#fff6e0" stroke-width="2" stroke-linecap="round"/></g>
        <g transform="translate(${auth ? 1330 : 960} ${auth ? 150 : 58})"><circle r="${auth ? 46 : 26}" fill="#f6efe0"/><circle cx="${auth ? -12 : -7}" cy="${auth ? -8 : -5}" r="${auth ? 8 : 4.5}" fill="#e2d8c4"/><circle cx="${auth ? 14 : 8}" cy="${auth ? 12 : 7}" r="${auth ? 6 : 3.5}" fill="#e2d8c4"/><circle r="${auth ? 140 : 80}" fill="url(#${id}Moon)"/></g>
        <path d="${hills}" fill="#1d0705"/>${city}
      </g>
      <g class="ks-mid">${palm(auth ? 960 : 520, ground, auth ? 320 : 210, 26, auth ? 1.3 : 1)}${palm(auth ? 1560 : 1590, ground, auth ? 360 : 230, -30, auth ? 1.3 : 1)}${palm(auth ? 70 : 880, ground, auth ? 260 : 150, 18, auth ? 1.1 : .75)}</g>
      <rect y="${ground}" width="${W}" height="${H - ground}" fill="url(#${id}Street)"/>
      <path d="M0 ${ground + 2} H${W}" stroke="#3f1a14" stroke-width="3"/>
      <g stroke="#ffb526" stroke-width="4" stroke-dasharray="44 40" opacity=".55"><path d="M0 ${ground + (H - ground) * 0.62} H${W}"/></g>
      <g transform="translate(${shopX} ${ground}) scale(${shopS})">${shop(id)}</g>
      <g mask="url(#${id}Soft)" opacity=".9">${[0,.16,.34,.5,.68,.84].map((o,i)=>`<rect x="${(shopX + 20+360 * shopS*o).toFixed(0)}" y="${ground + 4}" width="${(360 * shopS*(i%2?.07:.11)).toFixed(0)}" height="${((H - ground) * 0.9*(i%3?.7:1)).toFixed(0)}" rx="3" fill="url(#${id}ReflectGold)"/>`).join("")}</g>
      ${auth
        ? `<g transform="translate(${shopX + 200 * shopS} ${ground - 184 * shopS}) scale(1.25)">${sign(id, 70)}</g>`
        : `<g transform="translate(${shopX - 50} ${ground})">${sign(id, 150)}</g>`}
      <g class="ks-near">
        <g mask="url(#${id}Soft)">${[0,.16,.34,.5,.68,.84].map((o,i)=>`<rect x="${(carX + 40 * carS+460 * carS*o).toFixed(0)}" y="${ground + 4}" width="${(460 * carS*(i%2?.07:.11)).toFixed(0)}" height="${((H - ground) * 0.85*(i%3?.7:1)).toFixed(0)}" rx="3" fill="url(#${id}Reflect)"/>`).join("")}</g>
        <g transform="translate(${carX} ${ground - 162 * carS}) scale(${carS})">${car(id)}</g>
      </g>
    </svg>`;
  }

  function mount() {
    document.querySelectorAll('#page-dashboard .dash-hero-photo').forEach(el => { if (!el.querySelector('.ks-scene')) el.innerHTML = scene('hero'); });
    document.querySelectorAll('.auth-scene').forEach(el => { if (!el.querySelector('.ks-scene')) el.innerHTML = scene('auth'); });
  }
  window.KustomScene = { scene, mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
