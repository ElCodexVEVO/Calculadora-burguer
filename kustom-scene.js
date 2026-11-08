/* Burger Shot · Candy Kustom — escena ilustrada "noche de crucero".
   Un lowrider candy Burger Shot estacionado frente al local, con el emblema aprobado en el letrero.
   Se dibuja en vectores dentro del banner del inicio, el acceso y la pantalla de carga.
   Estilo: ilustración nocturna con volumen (degradados, reflejos y luz), sin contornos de caricatura. */
(() => {
  'use strict';
  const INK = '#0b0303';
  // Generador determinista para estrellas y luces de ciudad.
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const defs = id => `<defs>
    <linearGradient id="${id}Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0303"/><stop offset=".55" stop-color="#230806"/><stop offset="1" stop-color="#4d120c"/></linearGradient>
    <radialGradient id="${id}Warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}Lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c4" stop-opacity=".95"/><stop offset=".35" stop-color="#ffe3a0" stop-opacity=".35"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}Tail" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff3045" stop-opacity=".9"/><stop offset="1" stop-color="#ff3045" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}Moon" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#ffe8d6" stop-opacity=".22"/><stop offset="1" stop-color="#ffe8d6" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}Street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0807"/><stop offset="1" stop-color="#080202"/></linearGradient>
    <!-- Pintura candy: hombro brillante, cuerpo rojo, bajo profundo. -->
    <linearGradient id="${id}Candy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a5c"/><stop offset=".16" stop-color="#f02a22"/><stop offset=".45" stop-color="#c81412"/><stop offset=".78" stop-color="#7c0909"/><stop offset="1" stop-color="#3a0404"/></linearGradient>
    <linearGradient id="${id}CandySheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset=".82" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}Vinyl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf5ec"/><stop offset="1" stop-color="#d6c7b6"/></linearGradient>
    <linearGradient id="${id}Glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a2a24"/><stop offset=".55" stop-color="#1e0a09"/><stop offset="1" stop-color="#0c0404"/></linearGradient>
    <linearGradient id="${id}Chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#d9e2e5"/><stop offset=".55" stop-color="#6f7f85"/><stop offset=".75" stop-color="#c4cfd3"/><stop offset="1" stop-color="#f4f7f8"/></linearGradient>
    <radialGradient id="${id}Rim" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9d4d8"/><stop offset="1" stop-color="#6d7c82"/></radialGradient>
    <radialGradient id="${id}Tire" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#2b2324"/><stop offset=".9" stop-color="#120d0d"/><stop offset="1" stop-color="#050303"/></radialGradient>
    <!-- Local: fachada, rótulo rojo y luz cálida del interior. -->
    <linearGradient id="${id}Facade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1411"/><stop offset="1" stop-color="#1c0806"/></linearGradient>
    <linearGradient id="${id}Fascia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3221e"/><stop offset=".6" stop-color="#b3110f"/><stop offset="1" stop-color="#7d0a09"/></linearGradient>
    <linearGradient id="${id}Interior" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd890"/><stop offset=".45" stop-color="#f4a24a"/><stop offset="1" stop-color="#9a3a16"/></linearGradient>
    <linearGradient id="${id}Awning" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2302a"/><stop offset="1" stop-color="#9c0e0c"/></linearGradient>
    <linearGradient id="${id}Cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd38a" stop-opacity=".28"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}Post" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a1714"/><stop offset=".5" stop-color="#6b2b23"/><stop offset="1" stop-color="#220a08"/></linearGradient>
    <!-- Reflejos del asfalto mojado. -->
    <linearGradient id="${id}ReflectRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff3a2a" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}ReflectGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347" stop-opacity=".5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></linearGradient>
    <filter id="${id}Soft1" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.1"/></filter>
    <filter id="${id}Soft2" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="${id}Soft6" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="${id}Haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1d12" stop-opacity="0"/><stop offset="1" stop-color="#9a2a16" stop-opacity=".38"/></linearGradient>
    <linearGradient id="${id}Beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff1c2" stop-opacity=".32"/><stop offset="1" stop-color="#fff1c2" stop-opacity="0"/></linearGradient>
    <filter id="${id}Soft12" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="${id}Neon" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
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
  // Palmera de silueta con hojas curvas y tronco anillado.
  function palm(x, ground, h, lean, scale = 1) {
    const top = ground - h, tx = x + lean;
    const fronds = [-165, -140, -112, -86, -60, -32, -8, 18].map((a, i) => {
      const len = (78 + (i % 3) * 16) * scale, rad = a * Math.PI / 180;
      const ex = tx + Math.cos(rad) * len, ey = top + Math.sin(rad) * len * 0.5 + len * 0.5;
      const mx = tx + Math.cos(rad) * len * 0.55, my = top + Math.sin(rad) * len * 0.55 - 14 * scale;
      return `<path d="M${tx} ${top} Q${mx} ${my - 6 * scale} ${ex} ${ey} Q${mx + 4} ${my + 9 * scale} ${tx} ${top + 5 * scale}Z"/>`;
    }).join('');
    let rings = '';
    for (let k = 1; k < 9; k++) {
      const t = k / 9, cx = x + lean * 0.3 * t * 2 * (1 - t) + lean * t * t, cy = ground - h * t;
      rings += `<path d="M${(cx - 5 * scale).toFixed(1)} ${cy.toFixed(1)} q${5 * scale} ${3 * scale} ${10 * scale} 0" stroke="#2a0b08" stroke-width="${1.4 * scale}" fill="none"/>`;
    }
    return `<g fill="${INK}"><path d="M${x - 7 * scale} ${ground} Q${x + lean * 0.3} ${ground - h * 0.5} ${tx - 3 * scale} ${top} H${tx + 3 * scale} Q${x + lean * 0.3 + 9 * scale} ${ground - h * 0.5} ${x + 7 * scale} ${ground}Z"/>${rings}${fronds}</g>`;
  }

  // Rin de rayos cruzados con cara blanca y tuerca de mariposa dorada.
  function wheel(cx, cy, id) {
    let spokes = '';
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2, off = i % 2 ? 0.42 : -0.42;
      spokes += `<line x1="${(cx + Math.cos(a) * 4.5).toFixed(1)}" y1="${(cy + Math.sin(a) * 4.5).toFixed(1)}" x2="${(cx + Math.cos(a + off) * 16.5).toFixed(1)}" y2="${(cy + Math.sin(a + off) * 16.5).toFixed(1)}"/>`;
    }
    // Rines chicos de lowrider (13") con cara blanca delgada.
    spokes = '';
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2, off = i % 2 ? 0.45 : -0.45;
      spokes += `<line x1="${(cx + Math.cos(a) * 3.6).toFixed(1)}" y1="${(cy + Math.sin(a) * 3.6).toFixed(1)}" x2="${(cx + Math.cos(a + off) * 13).toFixed(1)}" y2="${(cy + Math.sin(a + off) * 13).toFixed(1)}"/>`;
    }
    return `<g class="ks-wheel">
      <circle cx="${cx}" cy="${cy}" r="24" fill="url(#${id}Tire)"/>
      <circle cx="${cx}" cy="${cy}" r="17.6" fill="none" stroke="#f3ede3" stroke-width="3.6"/>
      <circle cx="${cx}" cy="${cy}" r="19.8" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>
      <circle cx="${cx}" cy="${cy}" r="14.6" fill="url(#${id}Rim)"/>
      <g stroke="#5f6e74" stroke-width=".7" opacity=".95">${spokes}</g>
      <circle cx="${cx}" cy="${cy}" r="14.6" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="4.3" fill="#ffc451" stroke="#8a5a00" stroke-width=".8"/>
      <path d="M${cx - 9.5} ${cy - 1.8} Q${cx - 5.5} ${cy - 2.9} ${cx - 3.6} ${cy - 1.2} V${cy + 1.2} Q${cx - 5.5} ${cy + 2.9} ${cx - 9.5} ${cy + 1.8}Z M${cx + 9.5} ${cy - 1.8} Q${cx + 5.5} ${cy - 2.9} ${cx + 3.6} ${cy - 1.2} V${cy + 1.2} Q${cx + 5.5} ${cy + 2.9} ${cx + 9.5} ${cy + 1.8}Z" fill="#ffc451" stroke="#8a5a00" stroke-width=".6"/>
      <path d="M${cx - 10} ${cy - 10} A14 14 0 0 1 ${cx + 5} ${cy - 13.5}" stroke="#fff" stroke-opacity=".85" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${cy + 23}" rx="18" ry="2.4" fill="#000" opacity=".7"/>
    </g>`;
  }

  // Lowrider (estilo hardtop de los 60) de perfil mirando a la izquierda; suelo local en y=162.
  function car(id) {
    const flake = [[70, 114], [150, 104], [236, 120], [318, 108], [402, 118], [470, 106], [268, 72]]
      .map(([x, y], i) => `<path class="ks-flake" style="--d:${(i * 0.7).toFixed(1)}s" d="M${x} ${y - 5} L${x + 1.3} ${y - 1.3} L${x + 5} ${y} L${x + 1.3} ${y + 1.3} L${x} ${y + 5} L${x - 1.3} ${y + 1.3} L${x - 5} ${y} L${x - 1.3} ${y - 1.3}Z" fill="#fff"/>`).join('');
    // Carrocería baja (lowrider "acostado"): el bajo queda por debajo del eje de las ruedas.
    const body = 'M6 122 Q5 106 18 103 L170 96 L502 97 Q524 98 530 106 L534 124 Q534 144 520 147 L454 147 L454 138 A30 30 0 0 0 394 138 L394 149 L160 149 L160 138 A30 30 0 0 0 100 138 L100 147 L20 147 Q6 145 6 122Z';
    return `<g class="ks-car">
      <clipPath id="${id}BodyClip"><path d="${body}"/></clipPath>
      <linearGradient id="${id}AO" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
      <circle cx="4" cy="110" r="58" fill="url(#${id}Lamp)" class="ks-headlight"/>
      <circle cx="534" cy="110" r="30" fill="url(#${id}Tail)"/>
      <circle cx="130" cy="138" r="29" fill="#0b0303"/><circle cx="424" cy="138" r="29" fill="#0b0303"/>
      <!-- Techo de vinilo y cristales con interior -->
      <path d="M176 96 L230 63 Q236 59 246 59 L352 58 Q366 58 376 66 L434 96Z" fill="url(#${id}Vinyl)"/>
      <path d="M190 95 L234 66 Q238 63 246 63 L299 63 L299 95Z" fill="url(#${id}Glass)"/>
      <path d="M307 63 L348 63 Q360 63 368 70 L412 95 L307 95Z" fill="url(#${id}Glass)"/>
      <rect x="252" y="74" width="16" height="21" rx="6" fill="#120505"/><rect x="330" y="74" width="16" height="21" rx="6" fill="#120505"/>
      <path d="M244 66 L228 92 H240 L258 66Z M324 66 L306 92 H314 L334 66Z" fill="#fff" opacity=".16"/>
      <path d="M190 95 L234 66 Q238 63 246 63 L348 63 Q360 63 368 70 L412 95" fill="none" stroke="url(#${id}Chrome)" stroke-width="2"/>
      <path d="M299 63 V95 M307 63 V95" stroke="#d9e2e5" stroke-width="1.6"/>
      <!-- Carrocería candy con volumen -->
      <path d="${body}" fill="url(#${id}Candy)"/>
      <g clip-path="url(#${id}BodyClip)">
        <!-- Reflejo de horizonte en la pintura: cielo oscuro arriba, calle iluminada abajo -->
        <path d="M0 114 Q270 108 540 114 L540 124 Q270 118 0 124Z" fill="#2a0303" opacity=".55"/>
        <path d="M0 124 Q270 118 540 124 L540 131 Q270 125 0 131Z" fill="#ff8a5a" opacity=".22"/>
        <rect x="0" y="96" width="540" height="56" fill="url(#${id}AO)"/>
        <ellipse cx="500" cy="118" rx="70" ry="30" fill="#ffb347" opacity=".18"/>
      </g>
      <path d="M22 103.5 L170 97.5 L500 98.5 Q518 99 526 104 L526 106 Q500 103 300 103 Q120 104 22 108Z" fill="url(#${id}CandySheen)"/>
      <path d="M18 103 L170 96 L502 97 Q524 98 530 106" fill="none" stroke="#ffd2c0" stroke-opacity=".55" stroke-width="1"/>
      <path d="M170 98 V146 M300 98 V146" stroke="#3a0404" stroke-width="1.2" opacity=".75"/>
      <path d="M171 98 V146 M301 98 V146" stroke="#ff8a7a" stroke-width=".6" opacity=".35"/>
      <rect x="281" y="105" width="12" height="2.6" rx="1.3" fill="url(#${id}Chrome)"/>
      <path d="M192 92 q-6 0 -7 5 h9z" fill="url(#${id}Chrome)"/>
      <!-- Cromos -->
      <path d="M28 111 Q270 106 522 111" fill="none" stroke="#2a0303" stroke-width="4" stroke-linecap="round" opacity=".45"/>
      <path d="M28 109.5 Q270 104.5 522 109.5" fill="none" stroke="url(#${id}Chrome)" stroke-width="3" stroke-linecap="round"/>
      <path d="M162 146 H392" stroke="url(#${id}Chrome)" stroke-width="3" stroke-linecap="round"/>
      <path d="M100 140 A30 30 0 0 1 160 140 M394 140 A30 30 0 0 1 454 140" fill="none" stroke="#ff8a7a" stroke-opacity=".4" stroke-width="1.4"/>
      <!-- Frente: parrilla, faros dobles y defensa -->
      <rect x="4" y="106" width="16" height="12" rx="3" fill="#160505"/>
      <path d="M8 107 V117 M11 107 V117 M14 107 V117 M17 107 V117" stroke="#c9d4d8" stroke-width=".9"/>
      <circle cx="12" cy="104" r="3.6" fill="#fff6d8"/><circle cx="21" cy="103.4" r="3.2" fill="#fff6d8"/>
      <path d="M2 120 Q1 130 8 133 H30 Q34 132 34 128 L33 122 Q18 123 2 120Z" fill="url(#${id}Chrome)"/>
      <!-- Cola: calavera roja y defensa -->
      <path d="M522 103 H532 Q535 103 535 107 V113 H522Z" fill="#ff2a2a"/>
      <path d="M508 124 Q520 124 537 123 Q539 132 533 135 H510 Q506 132 508 124Z" fill="url(#${id}Chrome)"/>
      <!-- Filete dorado -->
      <g fill="none" stroke="#ffc451" stroke-width="1.2" stroke-linecap="round" class="ks-pinstripe">
        <path d="M44 118 C58 111 76 111 90 117 C76 121 60 122 44 118Z"/><path d="M466 118 C480 111 498 111 512 117 C498 121 482 122 466 118Z"/>
        <path d="M230 124 C238 116 256 115 264 123 C258 129 246 129 244 123 C243 120 246 118 249 119"/><path d="M196 124 C206 119 220 119 226 124"/>
      </g>
      ${flake}
      ${wheel(130, 138, id)}${wheel(424, 138, id)}
    </g>`;
  }

  // Local Burger Shot: origen en la esquina inferior izquierda, 400 de ancho.
  function shop(id) {
    const lights = [56, 150, 244].map(x => `<circle cx="${x}" cy="-118" r="3" fill="#fff4d0"/><circle cx="${x}" cy="-114" r="22" fill="url(#${id}Lamp)" opacity=".7"/>`).join('');
    const boards = [34, 118, 202].map(x => `<rect x="${x}" y="-110" width="64" height="18" rx="2" fill="#2a0806"/>${[0, 1, 2].map(k => `<rect x="${x + 5 + k * 20}" y="-106" width="15" height="10" rx="1" fill="${k === 1 ? '#ffb347' : '#e8592a'}" opacity=".85"/>`).join('')}`).join('');
    const booths = [24, 112, 200].map(x => `<path d="M${x} -16 V-44 Q${x} -50 ${x + 6} -50 H${x + 10} V-28 H${x + 58} V-50 H${x + 62} Q${x + 68} -50 ${x + 68} -44 V-16Z" fill="#a10f0d"/><path d="M${x} -44 Q${x} -50 ${x + 6} -50 H${x + 10} V-46 H${x + 4}Z" fill="#ff5a4a" opacity=".5"/><rect x="${x + 16}" y="-34" width="36" height="4" rx="2" fill="#3a1408"/><rect x="${x + 32}" y="-30" width="4" height="12" fill="#3a1408"/>`).join('');
    const people = `<g fill="#3a1206" opacity=".85"><circle cx="146" cy="-60" r="7"/><path d="M136 -28 Q136 -52 146 -52 Q156 -52 156 -28Z"/><circle cx="242" cy="-58" r="6.5"/><path d="M233 -28 Q233 -50 242 -50 Q251 -50 251 -28Z"/></g>`;
    return `<g>
      <ellipse cx="200" cy="10" rx="270" ry="26" fill="url(#${id}Warm)"/>
      <!-- Conos de luz del toldo sobre la banqueta -->
      <path d="M30 -10 L4 24 H140 L118 -10Z M150 -10 L126 24 H262 L240 -10Z" fill="url(#${id}Cone)"/>
      <!-- Fachada -->
      <rect x="0" y="-150" width="400" height="150" fill="url(#${id}Facade)"/>
      <path d="M0 -150 V0 M400 -150 V0" stroke="#5a2a22" stroke-width="2"/>
      <!-- Rótulo rojo con neón -->
      <rect x="-10" y="-198" width="420" height="48" rx="3" fill="url(#${id}Fascia)"/>
      <path d="M-10 -186 H410 M-10 -174 H410 M-10 -162 H410" stroke="#000" stroke-opacity=".08" stroke-width="1"/>
      <rect x="-12" y="-201" width="424" height="5" rx="2" fill="url(#${id}Chrome)"/>
      <path d="M-4 -153 H404" stroke="#ff4a3a" stroke-width="3" stroke-linecap="round" filter="url(#${id}Neon)"/>
      <path d="M0 -192 H400" stroke="#ffd9c0" stroke-width="1.4" stroke-linecap="round" opacity=".9" filter="url(#${id}Neon)"/>
      <!-- Vitrinas con interior iluminado -->
      <rect x="16" y="-132" width="284" height="118" fill="url(#${id}Interior)"/>
      ${lights}${boards}
      <rect x="16" y="-56" width="284" height="42" fill="#5a1c0c" opacity=".35"/>
      ${booths}${people}
      <path d="M40 -132 L10 -14 H44 L74 -132Z M170 -132 L140 -14 H156 L186 -132Z" fill="#fff" opacity=".07"/>
      <path d="M110 -132 V-14 M204 -132 V-14" stroke="#160505" stroke-width="5"/>
      <rect x="16" y="-132" width="284" height="118" fill="none" stroke="#160505" stroke-width="6"/>
      <!-- Toldo -->
      <path d="M10 -148 H306 L296 -130 H20Z" fill="url(#${id}Awning)"/>
      <path d="M20 -130 H296" stroke="#fff4ec" stroke-width="2.4"/>
      <path d="M14 -142 H302" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/>
      <!-- Puerta de vidrio -->
      <rect x="314" y="-124" width="72" height="124" fill="#1a0806"/>
      <rect x="318" y="-120" width="31" height="116" fill="url(#${id}Interior)" opacity=".85"/><rect x="351" y="-120" width="31" height="116" fill="url(#${id}Interior)" opacity=".85"/>
      <path d="M342 -74 V-50 M356 -74 V-50" stroke="url(#${id}Chrome)" stroke-width="3" stroke-linecap="round"/>
      <path d="M322 -118 L318 -60 H326 L332 -118Z" fill="#fff" opacity=".1"/>
      <rect x="314" y="-136" width="72" height="12" rx="2" fill="#7d0a09"/><circle cx="350" cy="-130" r="2.4" fill="#fff4d0"/>
      <!-- Zócalo y banqueta -->
      <rect x="0" y="-14" width="400" height="14" fill="#2a0b08"/>
      <path d="M0 -14 H400" stroke="#6b2b23" stroke-width="1.2"/>
      <rect x="-14" y="0" width="428" height="6" fill="#3a1712"/>
    </g>`;
  }
  // Letrero tipo pilón: dos postes y gabinete iluminado con el emblema aprobado.
  function sign(id, h) {
    return `<g>
      <rect x="-22" y="${-h}" width="10" height="${h}" fill="url(#${id}Post)"/><rect x="12" y="${-h}" width="10" height="${h}" fill="url(#${id}Post)"/>
      <circle cx="0" cy="${-h - 58}" r="110" fill="url(#${id}Warm)" class="ks-sign-glow"/>
      <circle cx="0" cy="${-h - 58}" r="70" fill="#1a0605" stroke="#7d0a09" stroke-width="6"/>
      <circle cx="0" cy="${-h - 58}" r="66" fill="none" stroke="#ff4a3a" stroke-width="2.5" filter="url(#${id}Neon)"/>
      <image href="assets/burgershot-logo.webp" x="-60" y="${-h - 112}" width="120" height="108" preserveAspectRatio="xMidYMid meet"/>
    </g>`;
  }

  // variant: 'hero' (banner ancho) o 'auth' (pantalla completa).
  function scene(variant = 'hero') {
    const id = 'ks' + variant;
    const auth = variant === 'auth';
    const W = 1600, H = auth ? 900 : 340, ground = auth ? 760 : 292;
    const carX = auth ? 40 : 690, carS = auth ? 0.92 : 0.94;
    const shopX = auth ? 1030 : 1190, shopS = auth ? 1.32 : 0.98;
    const hills = `M0 ${ground - 70} Q120 ${ground - 120} 260 ${ground - 92} T560 ${ground - 110} T880 ${ground - 86} T1200 ${ground - 124} T1600 ${ground - 96} V${ground} H0Z`;
    const r = rng(auth ? 77 : 41);
    let city = '';
    for (let i = 0; i < 70; i++) city += `<rect x="${(r() * W).toFixed(0)}" y="${(ground - 24 - r() * 70).toFixed(0)}" width="2" height="2" fill="${r() > .7 ? '#ffb347' : '#e8f1ef'}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
    const sw = 284 * shopS, sx = shopX + 16 * shopS, depth = H - ground;
    return `<svg class="ks-scene ks-scene-${variant}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      ${defs(id)}
      <rect width="${W}" height="${H}" fill="url(#${id}Sky)"/>
      <g class="ks-far">
        <g>${stars(W, ground - 120, auth ? 140 : 60, auth ? 9 : 3)}</g>
        <g class="ks-shooting"><path d="M300 ${auth ? 120 : 40} l120 40" stroke="#fff6e0" stroke-width="2" stroke-linecap="round"/></g>
        <g transform="translate(${auth ? 1330 : 960} ${auth ? 150 : 58})"><circle r="${auth ? 46 : 26}" fill="#f6efe0"/><circle cx="${auth ? -12 : -7}" cy="${auth ? -8 : -5}" r="${auth ? 8 : 4.5}" fill="#e2d8c4"/><circle cx="${auth ? 14 : 8}" cy="${auth ? 12 : 7}" r="${auth ? 6 : 3.5}" fill="#e2d8c4"/><circle r="${auth ? 140 : 80}" fill="url(#${id}Moon)"/></g>
        <ellipse cx="${shopX + 200 * shopS}" cy="${ground - 40}" rx="${520 * shopS}" ry="${auth ? 260 : 140}" fill="url(#${id}Warm)" opacity=".55"/>
        <g filter="url(#${id}Soft2)"><path d="${hills}" fill="#1d0705"/>${city}</g>
      </g>
      <rect y="${ground - (auth ? 260 : 150)}" width="${W}" height="${auth ? 260 : 150}" fill="url(#${id}Haze)"/>
      <g class="ks-mid" filter="url(#${id}Soft1)">${palm(auth ? 960 : 520, ground, auth ? 320 : 210, 26, auth ? 1.3 : 1)}${palm(auth ? 1560 : 1590, ground, auth ? 360 : 230, -30, auth ? 1.3 : 1)}${palm(auth ? 70 : 880, ground, auth ? 260 : 150, 18, auth ? 1.1 : .75)}</g>
      <rect y="${ground}" width="${W}" height="${depth}" fill="url(#${id}Street)"/>
      <path d="M0 ${ground + 2} H${W}" stroke="#4a1c15" stroke-width="2"/>
      <g stroke="#ffb526" stroke-width="4" stroke-dasharray="44 40" opacity=".5"><path d="M0 ${ground + depth * 0.62} H${W}"/></g>
      <!-- Reflejos mojados: vitrinas, neón y coche, difuminados -->
      <g filter="url(#${id}Soft12)" opacity=".85">
        <rect x="${sx}" y="${ground + 6}" width="${sw}" height="${depth * 0.75}" fill="url(#${id}ReflectGold)"/>
        <rect x="${shopX - 10 * shopS}" y="${ground + 4}" width="${420 * shopS}" height="6" fill="#ff3a2a" opacity=".55"/>
      </g>
      <g transform="translate(${shopX} ${ground}) scale(${shopS})">${shop(id)}</g>
      ${auth
        ? `<g transform="translate(${shopX + 200 * shopS} ${ground - 201 * shopS}) scale(1.05)">${sign(id, 40)}</g>`
        : `<g transform="translate(${shopX - 46} ${ground})">${sign(id, 140)}</g>`}
      <g class="ks-near">
        <g filter="url(#${id}Soft12)"><rect x="${carX + 30 * carS}" y="${ground + 6}" width="${500 * carS}" height="${depth * 0.7}" fill="url(#${id}ReflectRed)" opacity=".75"/></g>
        <path d="M${carX + 8 * carS} ${ground - 52 * carS} L${carX - 260 * carS} ${ground - 70 * carS} L${carX - 300 * carS} ${ground + 6} L${carX + 20 * carS} ${ground - 18 * carS}Z" fill="url(#${id}Beam)" filter="url(#${id}Soft6)" class="ks-headlight"/>
        <ellipse cx="${carX + 270 * carS}" cy="${ground + 2}" rx="${265 * carS}" ry="${9 * carS}" fill="#000" opacity=".65" filter="url(#${id}Soft6)"/>
        <g transform="translate(${carX} ${ground - 162 * carS}) scale(${carS})">${car(id)}</g>
        <ellipse cx="${carX + 470 * carS}" cy="${ground - 48 * carS}" rx="${120 * carS}" ry="${50 * carS}" fill="url(#${id}Warm)" opacity=".5" style="mix-blend-mode:screen"/>
      </g>
      <!-- Luces desenfocadas en primer plano: profundidad de cámara -->
      <g filter="url(#${id}Soft12)" opacity=".45">
        <circle cx="${auth ? 220 : 560}" cy="${H - 6}" r="${auth ? 34 : 18}" fill="#ff7a2a"/><circle cx="${auth ? 760 : 1040}" cy="${H - 2}" r="${auth ? 26 : 14}" fill="#ff3a2a"/><circle cx="${auth ? 1380 : 1480}" cy="${H - 4}" r="${auth ? 40 : 20}" fill="#ffb347"/>
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
