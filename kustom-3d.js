/* Burger Shot · escena 3D "noche de crucero" (three.js).
   Lowrider candy Burger Shot frente al local, con luces reales, reflejos en la calle mojada,
   llegada del coche, saltos hidráulicos y cámara con paralaje.
   - Un solo renderer que se mueve al anfitrión visible (carga > acceso > banner del inicio).
   - Sin WebGL, en modo Rendimiento o con movimiento desactivado se queda la ilustración vectorial.
   - Con movimiento reducido se dibuja una sola pose quieta.
   - Se pausa con la pestaña oculta o cuando el anfitrión no está a la vista. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const body = document.body;
const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
const calm = () => reducedMQ.matches;
const perfOff = () => body.classList.contains('motion-off') || body.dataset.effects === 'performance';

/* ───────────────────────── Texturas pintadas en canvas ───────────────────────── */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const glowTex = canvasTex(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
const skyTex = canvasTex(4, 512, (g, w, h) => {
  const l = g.createLinearGradient(0, 0, 0, h);
  l.addColorStop(0, '#070202'); l.addColorStop(.5, '#1d0605'); l.addColorStop(.78, '#3d0f0a'); l.addColorStop(1, '#5a170d');
  g.fillStyle = l; g.fillRect(0, 0, w, h);
});
// Microdestellos metalizados de la pintura candy (mapa de normales con ruido).
const flakeTex = canvasTex(256, 256, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 128 + (Math.random() - .5) * 120; img.data[i + 1] = 128 + (Math.random() - .5) * 120; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}, false);
flakeTex.wrapS = flakeTex.wrapT = THREE.RepeatWrapping; flakeTex.repeat.set(14, 6);
// Interior iluminado del local visto por la vitrina.
const interiorTex = canvasTex(1024, 420, (g, w, h) => {
  const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, '#ffe2a4'); l.addColorStop(.45, '#f7a64c'); l.addColorStop(1, '#8a3412');
  g.fillStyle = l; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { // lámparas colgantes
    const x = 90 + i * 170, r = g.createRadialGradient(x, 40, 0, x, 40, 120);
    r.addColorStop(0, 'rgba(255,255,230,.9)'); r.addColorStop(1, 'rgba(255,255,230,0)'); g.fillStyle = r; g.fillRect(x - 120, 0, 240, 200);
    g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(x, 36, 9, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 4; i++) { // menús iluminados
    const x = 70 + i * 240; g.fillStyle = '#2a0806'; g.fillRect(x, 70, 190, 70);
    ['#e8592a', '#ffb347', '#e8592a'].forEach((c, k) => { g.fillStyle = c; g.fillRect(x + 10 + k * 60, 80, 50, 50); });
  }
  g.fillStyle = 'rgba(90,24,10,.45)'; g.fillRect(0, h * .62, w, h * .38); // mostrador
  for (let i = 0; i < 5; i++) { // gabinetes rojos y mesas
    const x = 40 + i * 205; g.fillStyle = '#b3110f';
    g.beginPath(); g.roundRect(x, 250, 36, 170, 10); g.fill(); g.beginPath(); g.roundRect(x + 130, 250, 36, 170, 10); g.fill();
    g.fillStyle = '#3a1408'; g.fillRect(x + 46, 300, 76, 10); g.fillRect(x + 80, 310, 8, 110);
  }
  g.fillStyle = 'rgba(40,10,4,.85)'; // clientes
  [[150, 250], [560, 245], [770, 255]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 20, 0, Math.PI * 2); g.fill(); g.beginPath(); g.roundRect(x - 26, y + 20, 52, 110, 18); g.fill(); });
});
const plateTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#f4ead8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a1c1d'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#b3110f'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('SAN ANDREAS', w / 2, 34);
  g.fillStyle = '#1d1a1a'; g.font = 'bold 58px sans-serif'; g.fillText('BRGR SHT', w / 2, 100);
});
const leafTex = canvasTex(64, 256, (g, w, h) => {
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w / 2, 0);
  for (let y = 0; y <= h; y += 8) { const half = Math.sin(Math.PI * y / h) * (w / 2) * (y % 16 ? 1 : .55); g.lineTo(w / 2 + half, y); }
  for (let y = h; y >= 0; y -= 8) { const half = Math.sin(Math.PI * y / h) * (w / 2) * (y % 16 ? .55 : 1); g.lineTo(w / 2 - half, y); }
  g.fill();
}, false);

/* ───────────────────────── Materiales ───────────────────────── */
const M = {
  candy: new THREE.MeshPhysicalMaterial({ color: 0xa30b0e, metalness: .55, roughness: .3, clearcoat: 1, clearcoatRoughness: .05, normalMap: flakeTex, normalScale: new THREE.Vector2(.18, .18), envMapIntensity: 1.5 }),
  vinyl: new THREE.MeshStandardMaterial({ color: 0xefe4d2, roughness: .62, metalness: 0 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x140505, metalness: .3, roughness: .04, clearcoat: 1, envMapIntensity: 2.2 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .1, envMapIntensity: 2 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffc04a, metalness: 1, roughness: .22, envMapIntensity: 1.8 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x141011, roughness: .88 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf1ebe0, roughness: .5 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x120606, roughness: .7 }),
  head: new THREE.MeshBasicMaterial({ color: 0xfff4d6, toneMapped: false }),
  tail: new THREE.MeshBasicMaterial({ color: 0xff2a22, toneMapped: false }),
  plate: new THREE.MeshStandardMaterial({ map: plateTex, roughness: .5 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x3a1310, roughness: .85 }),
  fascia: new THREE.MeshPhysicalMaterial({ color: 0xc8130f, roughness: .35, clearcoat: .6 }),
  neon: new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false }),
  neonWarm: new THREE.MeshBasicMaterial({ color: 0xffd9c0, toneMapped: false }),
  interior: new THREE.MeshBasicMaterial({ map: interiorTex, toneMapped: false }),
  awnRed: new THREE.MeshStandardMaterial({ color: 0xd8201b, roughness: .55 }),
  awnWhite: new THREE.MeshStandardMaterial({ color: 0xf5ece2, roughness: .55 }),
  walk: new THREE.MeshStandardMaterial({ color: 0x160705, roughness: .85 }),
  silhouette: new THREE.MeshBasicMaterial({ color: 0x0b0303 }),
};
const glow = (color, size, opacity = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  s.scale.set(size, size, 1); s.userData.noMirror = false; return s;
};
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
function roundedBox(w, h, d, r = .04, seg = 3) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r * .9, bevelSegments: seg, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * r) / 2); return g;
}

/* ───────────────────────── Lowrider ───────────────────────── */
// Medidas en metros. El frente mira a -x. Eje trasero en x=+1.72, ruedas de 13" (radio .31).
const WHEEL_X = 1.72, WHEEL_R = .31, HALF_W = 1.0;
function carBody() {
  const s = new THREE.Shape();
  s.moveTo(-2.72, .3); s.lineTo(-2.75, .62); s.quadraticCurveTo(-2.73, .84, -2.55, .86);
  s.lineTo(-1.1, .87); s.lineTo(2.5, .89); s.quadraticCurveTo(2.75, .89, 2.77, .7); s.lineTo(2.76, .3);
  s.quadraticCurveTo(2.74, .21, 2.62, .21); s.lineTo(WHEEL_X + .43, .21); s.lineTo(WHEEL_X + .43, .31);
  s.absarc(WHEEL_X, .31, .43, 0, Math.PI, false); s.lineTo(WHEEL_X - .43, .21); s.lineTo(-WHEEL_X + .43, .21); s.lineTo(-WHEEL_X + .43, .31);
  s.absarc(-WHEEL_X, .31, .43, 0, Math.PI, false); s.lineTo(-WHEEL_X - .43, .21); s.lineTo(-2.62, .21); s.quadraticCurveTo(-2.72, .21, -2.72, .3);
  const depth = 2 * HALF_W - .28;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .14, bevelSize: .1, bevelSegments: 6, curveSegments: 28 });
  g.translate(0, 0, -depth / 2); return g;
}
function greenhouse(inset = 0) {
  const s = new THREE.Shape();
  s.moveTo(-1.12 + inset, .86); s.lineTo(-.55 + inset * .5, 1.33 - inset); s.quadraticCurveTo(-.47, 1.4 - inset, -.33, 1.4 - inset);
  s.lineTo(.98, 1.4 - inset); s.quadraticCurveTo(1.1, 1.4 - inset, 1.18 - inset * .5, 1.34 - inset); s.lineTo(2.0 - inset, .87); s.lineTo(-1.12 + inset, .86);
  return s;
}
function extrude(shape, depth, bevel = .06) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 4, curveSegments: 18 });
  g.translate(0, 0, -depth / 2); return g;
}
function wheel() {
  const g = new THREE.Group();
  const tire = mesh(new THREE.TorusGeometry(.24, .072, 20, 56), M.tire); g.add(tire);
  const ww = mesh(new THREE.RingGeometry(.205, .27, 56), M.white); ww.position.z = .062; g.add(ww);
  const dish = mesh(new THREE.CylinderGeometry(.2, .2, .1, 48, 1, true), M.chrome); dish.rotation.x = Math.PI / 2; g.add(dish);
  const lip = mesh(new THREE.TorusGeometry(.2, .012, 8, 56), M.chrome); lip.position.z = .05; g.add(lip);
  const spokes = [];
  for (let i = 0; i < 48; i++) { // rayos cruzados
    const a = i / 48 * Math.PI * 2, off = i % 2 ? .48 : -.48, zIn = i % 3 ? .03 : -.01;
    const p1 = new THREE.Vector3(Math.cos(a) * .045, Math.sin(a) * .045, .045), p2 = new THREE.Vector3(Math.cos(a + off) * .19, Math.sin(a + off) * .19, zIn);
    const dir = p2.clone().sub(p1), len = dir.length(), cg = new THREE.CylinderGeometry(.0045, .0045, len, 4);
    cg.translate(0, len / 2, 0);
    cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    cg.translate(p1.x, p1.y, p1.z); spokes.push(cg);
  }
  g.add(mesh(mergeGeometries(spokes), M.chrome));
  const hub = mesh(new THREE.CylinderGeometry(.05, .06, .06, 24), M.gold); hub.rotation.x = Math.PI / 2; hub.position.z = .06; g.add(hub);
  const ear = new THREE.Shape(); ear.moveTo(0, -.022); ear.quadraticCurveTo(.07, -.035, .1, 0); ear.quadraticCurveTo(.07, .035, 0, .022);
  [0, Math.PI].forEach(r => { const e = mesh(extrude(ear, .012, .006), M.gold); e.rotation.z = r; e.position.z = .1; g.add(e); });
  return g;
}
function pinstripe(points, z) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, z)));
  return mesh(new THREE.TubeGeometry(curve, 60, .006, 5, false), M.gold);
}
function buildCar() {
  const root = new THREE.Group(); root.name = 'car';
  const pivot = new THREE.Group(); pivot.name = 'pivot'; pivot.position.set(WHEEL_X, WHEEL_R, 0); root.add(pivot);
  const b = new THREE.Group(); b.position.set(-WHEEL_X, -WHEEL_R, 0); pivot.add(b);
  b.add(mesh(carBody(), M.candy));
  b.add(mesh(extrude(greenhouse(), 1.5, .08), M.glass));
  const roof = new THREE.Shape(); roof.moveTo(-.55, 1.36); roof.lineTo(1.18, 1.36); roof.quadraticCurveTo(1.12, 1.44, .98, 1.445); roof.lineTo(-.33, 1.445); roof.quadraticCurveTo(-.5, 1.44, -.55, 1.36);
  b.add(mesh(extrude(roof, 1.6, .05), M.vinyl));
  for (const side of [1, -1]) {
    const z = side * HALF_W;
    b.add(mesh(roundedBox(5.2, .035, .03, .012), M.chrome, 0, .64, z));                 // moldura lateral
    b.add(mesh(roundedBox(2.42, .05, .03, .015), M.chrome, 0, .28, z * 1.0));            // estribo
    b.add(mesh(roundedBox(.06, .5, .03, .012), M.chrome, .32, 1.15, side * .84));       // poste B
    const frame = new THREE.CatmullRomCurve3([[-1.16, .94], [-.57, 1.39], [-.33, 1.46], [.98, 1.46], [1.21, 1.39], [2.04, .95]].map(([x, y]) => new THREE.Vector3(x, y, side * .845)));
    b.add(mesh(new THREE.TubeGeometry(frame, 80, .016, 6, false), M.chrome));           // marco de ventanas
    b.add(mesh(roundedBox(.12, .03, .03, .01), M.chrome, .42, .79, z + .01 * side));    // manija
    b.add(mesh(roundedBox(.14, .08, .1, .03), M.chrome, -.72, 1.02, z + .04 * side));
    b.add(pinstripe([[-2.5, .74], [-2.2, .79], [-1.85, .77], [-1.95, .72], [-2.25, .7], [-2.5, .74]], z + .012 * side));
    b.add(pinstripe([[2.0, .74], [2.25, .79], [2.55, .76], [2.45, .71], [2.2, .7], [2.0, .74]], z + .012 * side));
    b.add(pinstripe([[-.5, .5], [-.2, .56], [.1, .5], [.35, .56], [.6, .5]], z + .012 * side));
    // Faros dobles y calaveras redondas.
    for (const dz of [.52, .76]) {
      const hl = mesh(new THREE.CylinderGeometry(.075, .075, .05, 24), M.head, -2.86, .64, side * dz); hl.rotation.z = Math.PI / 2; b.add(hl);
      const bz = mesh(new THREE.TorusGeometry(.08, .012, 8, 24), M.chrome, -2.875, .64, side * dz); bz.rotation.y = Math.PI / 2; b.add(bz);
    }
    for (const dz of [.42, .6, .78]) {
      const tl = mesh(new THREE.CylinderGeometry(.06, .06, .05, 20), M.tail, 2.87, .66, side * dz); tl.rotation.z = Math.PI / 2; b.add(tl);
      const tb = mesh(new THREE.TorusGeometry(.064, .01, 8, 20), M.chrome, 2.885, .66, side * dz); tb.rotation.y = Math.PI / 2; b.add(tb);
    }
  }
  // Parrilla, defensas, placas y adorno del cofre.
  b.add(mesh(roundedBox(.05, .22, .76, .02), M.dark, -2.87, .64, 0));
  for (let i = 0; i < 6; i++) b.add(mesh(roundedBox(.02, .012, .74, .005), M.chrome, -2.895, .55 + i * .036, 0));
  b.add(mesh(new THREE.CapsuleGeometry(.07, 1.95, 6, 16).rotateX(Math.PI / 2), M.chrome, -2.93, .3, 0));
  b.add(mesh(new THREE.CapsuleGeometry(.07, 1.95, 6, 16).rotateX(Math.PI / 2), M.chrome, 2.95, .32, 0));
  const plate = mesh(new THREE.PlaneGeometry(.42, .21), M.plate, 2.875, .5, 0); plate.rotation.y = Math.PI / 2; b.add(plate);
  b.add(mesh(new THREE.ConeGeometry(.03, .14, 12).rotateZ(Math.PI / 2), M.chrome, -2.4, 1.0, 0));
  // Interior: asientos y volante, visibles tras el cristal.
  b.add(mesh(roundedBox(.5, .5, 1.3, .08), M.dark, .55, .95, 0));
  b.add(mesh(roundedBox(.45, .45, 1.3, .08), M.dark, -.25, .95, 0));
  const steering = mesh(new THREE.TorusGeometry(.17, .018, 8, 24), M.chrome, -.62, 1.04, .38); steering.rotation.y = Math.PI / 2 - .4; b.add(steering);
  // Luces reales y halos.
  for (const dz of [.6, -.6]) {
    const spot = new THREE.SpotLight(0xfff1c8, 28, 16, .34, .7, 1.8); spot.position.set(-2.9, .64, dz); spot.target.position.set(-9, 0, dz);
    b.add(spot, spot.target);
  }
  const tailLight = new THREE.PointLight(0xff2a1a, 3, 3.2, 2); tailLight.position.set(3.2, .66, 0); b.add(tailLight);
  for (const dz of [.64, -.64]) { const h = glow(0xfff0c8, 1.15, .9); h.position.set(-3.0, .64, dz); b.add(h); }
  for (const dz of [.6, -.6]) { const t = glow(0xff3020, .7, .8); t.position.set(3.0, .66, dz); b.add(t); }
  // Haz de los faros (volumen aditivo).
  const beamGeo = new THREE.ConeGeometry(.9, 4.2, 32, 1, true); beamGeo.translate(0, -2.1, 0); beamGeo.rotateZ(-Math.PI / 2 + .07);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: .022, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  void beamGeo; void beamMat;
  // Ruedas (fuera del pivote: se quedan en el piso cuando salta la carrocería).
  [[-WHEEL_X, HALF_W - .2, false], [WHEEL_X, HALF_W - .2, false], [-WHEEL_X, -HALF_W + .2, true], [WHEEL_X, -HALF_W + .2, true]].forEach(([x, z, flip], i) => {
    const holder = new THREE.Group(); holder.position.set(x, WHEEL_R, z); if (flip) holder.rotation.y = Math.PI;
    const w = wheel(); w.name = 'spin' + i; holder.add(w); root.add(holder);
  });
  return root;
}

/* ───────────────────────── Local, letrero y entorno ───────────────────────── */
function buildShop(logo) {
  const g = new THREE.Group(); g.name = 'shop';
  g.add(mesh(new THREE.BoxGeometry(6.8, 3.3, 4), M.wall, 3.4, 1.65, -2));
  g.add(mesh(roundedBox(7.1, .95, .5, .06), M.fascia, 3.4, 2.92, .05));
  g.add(mesh(roundedBox(7.2, .07, .56, .03), M.chrome, 3.4, 3.42, .05));
  for (const [y, h] of [[2.46, .045], [3.36, .03]]) g.add(mesh(new THREE.BoxGeometry(7.0, h, .03), M.neon, 3.4, y, .32));
  const win = mesh(new THREE.PlaneGeometry(4.5, 1.9), M.interior, 2.55, 1.25, .02); win.castShadow = false; g.add(win);
  for (const x of [.3, 1.8, 3.3, 4.8]) g.add(mesh(new THREE.BoxGeometry(.08, 1.95, .1), M.dark, x, 1.25, .05));
  g.add(mesh(new THREE.BoxGeometry(4.6, .1, .14), M.dark, 2.55, .27, .06));
  const door = mesh(new THREE.PlaneGeometry(1.1, 2.1), M.interior, 5.75, 1.08, .02); g.add(door);
  g.add(mesh(new THREE.BoxGeometry(.05, 2.15, .08), M.dark, 5.75, 1.08, .05));
  for (const x of [5.62, 5.88]) g.add(mesh(new THREE.CapsuleGeometry(.018, .45, 4, 8), M.chrome, x, 1.1, .12));
  // Toldo a rayas con orilla festoneada.
  for (let i = 0; i < 12; i++) {
    const x = .35 + i * .39, mat = i % 2 ? M.awnWhite : M.awnRed;
    const strip = mesh(new THREE.BoxGeometry(.39, .04, .9), mat, x, 2.3, .45); strip.rotation.x = .28; g.add(strip);
    g.add(mesh(new THREE.BoxGeometry(.39, .2, .03), mat, x, 2.08, .89));
  }
  // Letrero tipo pilón con el emblema.
  const sign = new THREE.Group(); sign.position.set(-1.0, 0, 1.2); g.add(sign);
  for (const x of [-.18, .18]) sign.add(mesh(roundedBox(.12, 2.8, .12, .03), M.dark, x, 1.4, 0));
  const cab = mesh(new THREE.CylinderGeometry(.92, .92, .3, 64), M.dark, 0, 3.55, 0); cab.rotation.x = Math.PI / 2; sign.add(cab);
  const ring = mesh(new THREE.TorusGeometry(.92, .045, 12, 64), M.neon, 0, 3.55, .16); sign.add(ring);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.84, 64), new THREE.MeshBasicMaterial({ map: logo, transparent: true, toneMapped: false })); face.position.set(0, 3.55, .16); face.scale.set(.92, .92, 1); sign.add(face);
  const signGlow = glow(0xff3a2a, 4.2, .55); signGlow.position.set(0, 3.55, .1); sign.add(signGlow);
  const fasciaGlow = glow(0xff3a2a, 3, .35); fasciaGlow.scale.set(9, 1.4, 1); fasciaGlow.position.set(3.4, 2.46, .4); g.add(fasciaGlow);
  // Luz del local.
  const warm = new THREE.PointLight(0xffa24a, 26, 12, 1.8); warm.position.set(2.6, 1.6, 1.4); g.add(warm);
  const warm2 = new THREE.PointLight(0xffb565, 14, 9, 1.8); warm2.position.set(5.6, 1.4, 1.2); g.add(warm2);
  const neonLight = new THREE.PointLight(0xff2a1a, 22, 9, 1.8); neonLight.position.set(-.6, 3.4, 1.4); g.add(neonLight);
  ring.name = 'neonRing'; signGlow.name = 'signGlow'; neonLight.name = 'neonLight';
  return g;
}
function palm(x, z, h, lean) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * .3, h * .55, 0), new THREE.Vector3(lean, h, 0));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .13, 8), M.silhouette));
  const leafMat = new THREE.MeshBasicMaterial({ color: 0x0b0303, alphaMap: leafTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 9; i++) {
    const geo = new THREE.PlaneGeometry(.55, 3.4, 1, 10); geo.translate(0, 1.7, 0);
    const pos = geo.attributes.position; for (let k = 0; k < pos.count; k++) { const y = pos.getY(k); pos.setZ(k, -Math.pow(y / 3.4, 2) * 1.6); }
    const leaf = new THREE.Mesh(geo, leafMat); leaf.position.set(lean, h, 0);
    leaf.rotation.set(-1.2, i / 9 * Math.PI * 2, 0, 'YXZ'); g.add(leaf);
  }
  return g;
}

/* ───────────────────────── Mundo ───────────────────────── */
function buildWorld(renderer) {
  const scene = new THREE.Scene();
  scene.background = skyTex; scene.fog = new THREE.FogExp2(0x1a0606, .028);
  // Mapa de entorno: estudio oscuro con paneles cálidos y rojos (reflejos en cromo y pintura).
  const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x0a0303);
  [[0xffd7a0, 6, [0, 8, 0], [16, .2, 6]], [0xff3020, 4, [-9, 3, -4], [.2, 3, 10]], [0xffb060, 4, [9, 2, 4], [.2, 3, 8]], [0xfff1dc, 3, [0, 4, 10], [10, 2, .2]]]
    .forEach(([c, i, p, s]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...s), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i) })); m.position.set(...p); envScene.add(m); });
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(envScene, .04).texture; pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0x5a1a12, 0x0a0303, .9));
  const moon = new THREE.DirectionalLight(0xffd9c4, .55); moon.position.set(-6, 12, 8); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -8, right: 8, top: 6, bottom: -4, near: 1, far: 40 }); moon.shadow.bias = -.0006; moon.shadow.camera.updateProjectionMatrix();
  scene.add(moon, moon.target);

  const logo = new THREE.TextureLoader().load('assets/burgershot-logo.webp'); logo.colorSpace = THREE.SRGBColorSpace;
  const above = new THREE.Group(); scene.add(above);
  const car = buildCar(); above.add(car);
  const shop = buildShop(logo); shop.position.set(4.2, 0, -4.6); above.add(shop);
  [[-6, -11, 5.4, .9], [13.5, -10, 5.8, -1.1], [9, -16, 5.0, .6], [-14, -15, 5.6, -.8], [20, -13, 5.2, .7], [-22, -18, 5.0, .5]].forEach(p => above.add(palm(...p)));
  // Banqueta y bordillo.
  const walk = mesh(new THREE.BoxGeometry(80, .14, 3.6), M.walk, 0, .07, -4.2); above.add(walk);
  above.add(mesh(new THREE.BoxGeometry(80, .16, .12), new THREE.MeshStandardMaterial({ color: 0x5a2a22, roughness: .6 }), 0, .08, -2.4));

  // Reflejo: copia en espejo bajo la calle (sin luces ni halos de faro).
  const mirror = above.clone(true); mirror.scale.y = -1;
  const drop = []; mirror.traverse(o => { if (o.isLight || o.userData.noMirror) drop.push(o); if (o.isMesh) o.castShadow = false; });
  drop.forEach(o => o.parent?.remove(o)); scene.add(mirror);
  const mcar = mirror.getObjectByName('car');
  const refs = c => ({ root: c, pivot: c.getObjectByName('pivot'), wheels: [0, 1, 2, 3].map(i => c.getObjectByName('spin' + i)) });

  // Calle mojada: semitransparente sobre el reflejo, con charcos de luz.
  const road = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshStandardMaterial({ color: 0x0e0404, roughness: .25, metalness: .3, transparent: true, opacity: .88 }));
  road.rotation.x = -Math.PI / 2; road.position.y = .001; road.receiveShadow = true; scene.add(road);
  const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4, .14), new THREE.MeshBasicMaterial({ color: 0xb87d17, toneMapped: false }), 40);
  for (let i = 0; i < 40; i++) dash.setMatrixAt(i, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(-60 + i * 3, .004, 3.1));
  scene.add(dash);
  for (const [x, z, c, sx, sz, o] of [[6.8, -1.6, 0xffa24a, 9, 4, .3], [3.5, -2, 0xff3020, 4, 3, .25], [-5, .2, 0xfff0c8, 7, 2.6, .22]]) {
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, .006, z); pool.scale.set(sx, sz, 1); pool.userData.carPool = c === 0xfff0c8; scene.add(pool);
  }

  // Cielo: luna, estrellas y colinas.
  const moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,240,224,.35)'); r.addColorStop(.32, 'rgba(255,240,224,.12)'); r.addColorStop(1, 'rgba(255,240,224,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w); g.fillStyle = '#f6efe0'; g.beginPath(); g.arc(w / 2, w / 2, w * .16, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e2d6c0'; [[.45, .45, .03], [.56, .55, .022], [.5, .6, .015]].forEach(([x, y, r2]) => { g.beginPath(); g.arc(w * x, w * y, w * r2, 0, Math.PI * 2); g.fill(); });
  }), fog: false, depthWrite: false })); moonDisc.position.set(16, 12.5, -70); moonDisc.scale.set(15, 15, 1); scene.add(moonDisc);
  const starGeo = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 500; i++) sp.push((Math.random() - .5) * 220, 8 + Math.random() * 60, -80 - Math.random() * 10);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xf6efe0, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .8 })); scene.add(stars);
  const hills = new THREE.Shape(); hills.moveTo(-120, 0);
  for (let x = -120; x <= 120; x += 10) hills.lineTo(x, 4 + Math.sin(x * .07) * 2.6 + Math.sin(x * .19) * 1.2);
  hills.lineTo(120, 0); hills.lineTo(-120, 0);
  const hill = new THREE.Mesh(new THREE.ShapeGeometry(hills), new THREE.MeshBasicMaterial({ color: 0x1d0705 })); hill.position.z = -60; scene.add(hill);
  return { scene, car: refs(car), mcar: refs(mcar), shop, neon: { ring: shop.getObjectByName('neonRing'), glow: shop.getObjectByName('signGlow'), light: shop.getObjectByName('neonLight') } };
}

/* ───────────────────────── Encuadres ───────────────────────── */
const FRAMES = {
  hero: { car: 0, shop: 4.2, pos: [-9.2, 1.7, 10.2], look: [-4.6, 1.55, -1.2], fov: 23 },
  heroNarrow: { car: 0, shop: 4.2, pos: [-8.4, 1.6, 9.6], look: [-1.0, 1.3, -1.2], fov: 26 },
  auth: { car: -7.7, shop: 4.4, pos: [-4.2, 3.4, 19.5], look: [-.6, 1.7, -2.5], fov: 34 },
  authNarrow: { car: .4, shop: 4.6, pos: [-5, 1.3, 33], look: [.8, 9.4, -2.5], fov: 34, raw: true },
};

/* ───────────────────────── Motor ───────────────────────── */
let prevHost = null, lastSeen = 0, renderer, world, camera, active = null, raf = 0, last = 0, t0 = 0, arriveAt = -1, hopClock = 0, flickerAt = 0;
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const hosts = [];

function visibleHost() {
  for (const h of hosts) {
    if (!h.el.isConnected || !h.el.getClientRects().length) continue;
    const r = h.el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40 || r.bottom < 0 || r.top > innerHeight) continue;
    if (h.el.closest('.hidden')) continue;
    return h;
  }
  return null;
}
function attach(h) {
  active = h; h.el.appendChild(renderer.domElement); h.el.classList.add('k3d-host');
  const f = FRAMES[h.variant];
  h.frame = h.variant;
  world.car.root.position.x = f.car; world.mcar.root.position.x = f.car; world.shop.position.x = f.shop;
  const now = performance.now();
  if (h !== prevHost || now - lastSeen > 4000) startArrival();
  prevHost = h; resize();
}
function resize() {
  if (!active) return;
  const r = active.el.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, active.variant === 'hero' ? 1.6 : 1.4));
  renderer.setSize(w, h, false);
  const aspect = w / h;
  active.frame = active.variant === 'hero' ? (aspect < 3 ? 'heroNarrow' : 'hero') : (aspect < 1 ? 'authNarrow' : 'auth');
  const f = FRAMES[active.frame];
  camera.aspect = aspect;
  // En pantallas angostas se abre el campo para que el coche y el letrero sigan dentro.
  camera.fov = f.raw ? f.fov : f.fov * (aspect < 1.4 ? 1.35 : aspect < 2.6 ? 1.15 : 1);
  camera.updateProjectionMatrix();
  if (!raf) renderFrame(performance.now());
}
function startArrival() { arriveAt = calm() ? -1 : performance.now(); hopClock = 0; }
const easeOut = x => 1 - Math.pow(1 - x, 3);

// Pose de la carrocería: llegada, frenado y rutina hidráulica cada ~9 s.
function pose(now) {
  const { car, mcar } = world, f = FRAMES[active.frame || active.variant];
  let dx = 0, pitch = 0, roll = 0, lift = 0;
  if (arriveAt > 0) {
    const a = (now - arriveAt) / 2600;
    if (a < 1) { dx = (1 - easeOut(a)) * 15; pitch = -Math.sin(a * Math.PI) * .012; }
    else if (a < 1.5) { const b = (a - 1) / .5; pitch = .035 * Math.exp(-6 * b) * Math.cos(b * 14); } // cabeceo al frenar
    else { arriveAt = 0; hopClock = now; }
  }
  if (!arriveAt && !calm()) {
    const h = ((now - hopClock) / 1000) % 9;
    if (h < 2.6) { pitch = -.16 * Math.exp(-1.15 * h) * Math.abs(Math.sin(Math.PI * h / .75)); lift = .05 * Math.abs(Math.sin(Math.PI * h / .75)) * Math.exp(-h); }
    else if (h < 4.6) { const k = h - 2.6; roll = .07 * Math.sin(k * Math.PI * 2 / 1.0) * Math.exp(-.9 * k); }
    else lift = Math.sin(now / 700) * .006;
  }
  for (const c of [car, mcar]) {
    c.root.position.x = f.car + dx;
    c.pivot.rotation.z = pitch; c.pivot.rotation.x = roll; c.pivot.position.y = WHEEL_R + lift;
    c.wheels.forEach((w, i) => { w.rotation.z = (i < 2 ? -1 : 1) * dx / WHEEL_R; });
  }
}
function renderFrame(now) {
  if (!active) return;
  const f = FRAMES[active.frame || active.variant];
  world.shop.position.x = f.shop;
  pose(now);
  // Cámara: deriva lenta y paralaje suave con el cursor.
  pointer.x += (pointer.tx - pointer.x) * .05; pointer.y += (pointer.ty - pointer.y) * .05;
  const drift = calm() ? 0 : Math.sin(now / 9000) * .35;
  camera.position.set(f.pos[0] + drift + pointer.x * .6, f.pos[1] - pointer.y * .25, f.pos[2]);
  camera.lookAt(f.look[0] + pointer.x * .25, f.look[1], f.look[2]);
  // Neón que parpadea de vez en cuando.
  const { ring, glow: signGlow, light: neonLight } = world.neon;
  const flick = !calm() && now - flickerAt < 260 && Math.floor((now - flickerAt) / 60) % 2 === 0;
  if (!calm() && now - flickerAt > 11000) flickerAt = now;
  ring.material.color.setHex(flick ? 0x5a1008 : 0xff3a2a); signGlow.material.opacity = flick ? .15 : .55; neonLight.intensity = flick ? 4 : 22;
  renderer.render(world.scene, camera); lastSeen = now;
}
function loop(now) {
  raf = 0;
  if (document.hidden || perfOff()) return;
  const h = visibleHost();
  if (h !== active) { if (!h) { active = null; return; } attach(h); }
  if (now - last > 32) { last = now; renderFrame(now); }
  if (!calm()) raf = requestAnimationFrame(loop);
}
function kick() { if (!raf && renderer && !perfOff()) raf = requestAnimationFrame(loop); }

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch { return; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'k3d-canvas'; renderer.domElement.setAttribute('aria-hidden', 'true');
  world = buildWorld(renderer);
  camera = new THREE.PerspectiveCamera(30, 2, .1, 400);
  const add = (el, variant) => { if (el && !hosts.some(h => h.el === el)) hosts.push({ el, variant }); };
  add(document.querySelector('#authLoading .auth-scene'), 'auth');
  add(document.querySelector('#authScreen .auth-scene'), 'auth');
  add(document.querySelector('#page-dashboard .dash-hero-photo'), 'hero');
  document.querySelectorAll('[data-k3d]').forEach(el => add(el, el.dataset.k3d));
  // Muestra el lienzo cuando ya pintó, para no tapar la ilustración con un cuadro vacío.
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('k3d-ready')));
  addEventListener('resize', () => { resize(); kick(); }, { passive: true });
  addEventListener('scroll', kick, { passive: true });
  document.addEventListener('visibilitychange', kick);
  reducedMQ.addEventListener?.('change', () => { startArrival(); kick(); });
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; pointer.tx = e.clientX / innerWidth * 2 - 1; pointer.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  // Cambios de pantalla (acceso, carga, módulos): vuelve a buscar dónde dibujar y repite la llegada.
  new MutationObserver(kick).observe(body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => kick()).observe(body, { attributes: true, attributeFilter: ['data-effects'] });
  window.Kustom3D = { replay: () => { startArrival(); kick(); }, hosts, get state() { return world && { x: +world.car.root.position.x.toFixed(2), pitch: +world.car.pivot.rotation.z.toFixed(3), roll: +world.car.pivot.rotation.x.toFixed(3), arriving: arriveAt > 0 }; } };
  kick();
}
init();
