/* Burger Shot 3D · edificio procedural (RestaurantExterior, RestaurantInterior, RestaurantCounter).
   Unidades en metros. Origen en el centro del local; +z apunta a la calle y +y hacia arriba.
   Cada zona está en su propia función para poder sustituirla por un GLB optimizado sin tocar el resto. */
import * as THREE from 'three';
import { place, rng } from './kit.js?v=13.0.0';

export const LAYOUT = {
  X0: -9, X1: 9, Z0: -6.5, Z1: 6.5, WALL_H: 3.8, CUT_H: 1.05, ROOF_Y: 4.7, T: 0.22,
  door: { x: 4.6, w: 2.4, h: 2.6 },
  counter: { x0: -6.6, x1: 2.6, z: -1.25, depth: 0.74, h: 1.04 },
  registers: [-4.2, -1.6, 1.0]
};

/* Vistas de cámara en coordenadas esféricas: az desde +z hacia +x, pol desde la vertical. */
export const VIEWS = {
  exterior: { target: [-2.6, 2.9, 6.2], az: -0.5, pol: 1.35, dist: 22.5, fov: 32 },
  overview: { target: [-0.4, 0.3, 0.1], az: 0.66, pol: 0.9, dist: 29, fov: 30 },
  counter: { target: [-1.8, 0.95, -1.5], az: 0.36, pol: 0.98, dist: 10.2, fov: 30 },
  kitchen: { target: [-2.2, 1.0, -4.7], az: 0.46, pol: 0.92, dist: 12, fov: 30 },
  dining: { target: [-3.0, 0.5, 3.0], az: 0.74, pol: 0.95, dist: 12.5, fov: 30 },
  staff: { target: [6.7, 0.8, -4.4], az: 0.3, pol: 0.96, dist: 9.6, fov: 30 },
  entrance: { target: [4.6, 0.7, 4.8], az: 0.86, pol: 1.02, dist: 10.5, fov: 30 }
};

/* Puntos de anclaje para etiquetas accesibles en el DOM. */
export const ANCHORS = {
  door: [4.6, 3.05, 7.2],
  counter: [-1.8, 1.2, -0.5],
  kitchen: [-5.6, 2.75, -5.2],
  staff: [6.8, 2.35, -4.4],
  dining: [-3.0, 1.35, 2.7],
  entrance: [4.6, 1.45, 6.0]
};

/* Posiciones válidas para personajes. dir = rotación Y (0 mira a la calle). */
export const SLOTS = {
  counter: LAYOUT.registers.map(x => ({ x, z: -2.12, dir: 0, pose: 'register' })),
  kitchen: [
    { x: -3.7, z: -4.78, dir: Math.PI, pose: 'work' }, { x: -1.4, z: -4.78, dir: Math.PI, pose: 'work' },
    { x: 0.6, z: -4.78, dir: Math.PI, pose: 'work' }, { x: -6.2, z: -4.78, dir: Math.PI, pose: 'work' },
    { x: -5.0, z: -3.86, dir: 0, pose: 'stand' }, { x: -0.2, z: -3.86, dir: 0, pose: 'stand' },
    { x: 4.1, z: -2.0, dir: -0.9, pose: 'stand' }
  ],
  staff: [
    { x: 6.35, z: -4.0, dir: 2.19, pose: 'seated', seatY: 0.62 },
    { x: 7.45, z: -4.0, dir: -2.19, pose: 'seated', seatY: 0.62 },
    { x: 6.9, z: -5.2, dir: 0, pose: 'seated', seatY: 0.62 },
    { x: 5.6, z: -3.3, dir: -0.6, pose: 'stand' }, { x: 8.1, z: -3.3, dir: 0.6, pose: 'stand' }
  ],
  dining: [
    { x: -7.6, z: 1.62, dir: Math.PI, pose: 'seated', seatY: 0.5 }, { x: -7.6, z: 3.77, dir: Math.PI, pose: 'seated', seatY: 0.5 },
    { x: -7.6, z: 0.18, dir: 0, pose: 'seated', seatY: 0.5 }
  ]
};

/* Rutas de servicio para «entregando comida»: pasillo tras el mostrador, paso a la cocina,
   puerta de servicio y mesas de destino. Evitan el mobiliario sin necesidad de navegación compleja. */
export const SERVICE = {
  corridorZ: -2.55, kitchenZ: -4.3, connectorX: 2.3,
  gate: [[3.2, -2.55], [3.2, -1.25], [3.2, -0.25]],
  tables: [
    { via: [[5.6, 0.6]], stand: [7.9, 1.62], dir: 0, top: [7.9, 0.79, 2.3] },
    { via: [[0.6, 0.35]], stand: [-0.22, 0.78], dir: -0.78, top: [-1.0, 0.79, 1.55] },
    { via: [[0.7, 2.4]], stand: [-0.22, 3.08], dir: -0.78, top: [-1.0, 0.79, 3.85] },
    { via: [[5.6, 3.3]], stand: [7.9, 3.62], dir: 0, top: [7.9, 0.79, 4.3] }
  ]
};

/* Ruta de ida desde un puesto hasta una mesa (la vuelta es la misma invertida). */
export function serviceRoute(from, table) {
  const S = SERVICE, pts = [[from.x, from.z]];
  if (from.x > 4.6 && from.z < -2.6) return null; // sala del personal: no reparte
  if (from.z < -3.5) pts.push([from.x, S.kitchenZ], [S.connectorX, S.kitchenZ], [S.connectorX, S.corridorZ]);
  else pts.push([from.x, S.corridorZ]);
  pts.push(...S.gate, ...table.via, table.stand);
  return pts;
}

const C = LAYOUT;

function add(parent, geo, mat, x, y, z, opts = {}) {
  const mesh = place(new THREE.Mesh(geo, mat), x, y, z, opts);
  if (opts.scale) mesh.scale.set(...opts.scale);
  if (opts.name) mesh.name = opts.name;
  parent.add(mesh);
  return mesh;
}

function materials(kit, logoUrl) {
  const glass = kit.std('glass', { color: '#a9c3cf', transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0.25, envMapIntensity: 1.5, depthWrite: false });
  const glow = kit.glow(), strip = kit.stripGlow();
  return {
    terrazzo: kit.std('terrazzo', { map: kit.repeatOf('terrazzo', kit.terrazzo(), 7.5, 3.3), roughness: 0.4, envMapIntensity: 0.55 }),
    quarry: kit.std('quarry', { map: kit.repeatOf('quarry', kit.quarry(), 11, 4.2), roughness: 0.6, envMapIntensity: 0.4 }),
    quarrySmall: kit.std('quarrySmall', { map: kit.repeatOf('quarry', kit.quarry(), 3.4, 1.2), roughness: 0.6, envMapIntensity: 0.4 }),
    staffFloor: kit.std('staffFloor', { map: kit.repeatOf('woodFloor', kit.wood('#5a3a26', 'woodFloor'), 3, 3), roughness: 0.55 }),
    plaster: kit.std('plaster', { map: kit.plaster(), color: '#ead9c4', roughness: 0.92 }),
    wine: kit.std('wineWall', { map: kit.plaster('#5c121b', 'plasterWine'), roughness: 0.82 }),
    subway: kit.std('subway', { map: kit.repeatOf('subway', kit.subway(), 23, 2.25), roughness: 0.22, envMapIntensity: 0.7 }),
    subwayLeft: kit.std('subwayLeft', { map: kit.repeatOf('subway', kit.subway(), 8.8, 2.25), roughness: 0.22, envMapIntensity: 0.7 }),
    subwayRed: kit.std('subwayRed', { map: kit.repeatOf('subwayRed', kit.subway('#b3161f', '#4a0c10', 'subwayRedTex'), 6, 0.8), roughness: 0.25, envMapIntensity: 0.6 }),
    wainscot: kit.std('wainscot', { map: kit.repeatOf('wainscot', kit.wood('#4a2415', 'woodDark'), 4, 1), roughness: 0.5 }),
    tableTop: kit.std('tableTop', { map: kit.wood('#8a5230', 'woodLight'), roughness: 0.42, envMapIntensity: 0.5 }),
    counterRed: kit.std('counterRed', { color: '#c0111c', roughness: 0.3, metalness: 0.05, envMapIntensity: 0.8 }),
    white: kit.std('white', { color: '#f2ece3', roughness: 0.3 }),
    quartz: kit.std('quartz', { color: '#f5f0e8', roughness: 0.16, envMapIntensity: 0.9 }),
    gold: kit.std('gold', { color: '#e2a640', metalness: 0.85, roughness: 0.3 }),
    plinth: kit.std('plinth', { color: '#141012', roughness: 0.6 }),
    steel: kit.std('steel', { color: '#c6cbd1', metalness: 1, roughness: 0.32, envMapIntensity: 1 }),
    steelDark: kit.std('steelDark', { color: '#5f646b', metalness: 0.9, roughness: 0.4 }),
    griddle: kit.std('griddle', { color: '#2b2624', metalness: 0.8, roughness: 0.45 }),
    black: kit.std('blackMetal', { color: '#1b1a1d', metalness: 0.6, roughness: 0.45 }),
    chrome: kit.std('chrome', { color: '#e9ebef', metalness: 1, roughness: 0.12, envMapIntensity: 1.2 }),
    vinyl: kit.std('vinyl', { color: '#a5121d', roughness: 0.36, envMapIntensity: 0.6 }),
    vinylDark: kit.std('vinylDark', { color: '#5e0a12', roughness: 0.5 }),
    seatBlack: kit.std('seatBlack', { color: '#231c1f', roughness: 0.45 }),
    glass,
    mullion: kit.std('mullion', { color: '#1d1a1e', metalness: 0.7, roughness: 0.35 }),
    facade: kit.std('facade', { map: kit.repeatOf('facade', kit.facade(), 7, 1.6), roughness: 0.55, metalness: 0.35 }),
    fascia: kit.std('fascia', { color: '#3b0a11', roughness: 0.45, metalness: 0.25 }),
    roof: kit.std('roof', { color: '#2c2528', roughness: 0.9 }),
    concrete: kit.std('concrete', { map: kit.repeatOf('concrete', kit.concrete(), 21, 2.7), roughness: 0.82 }),
    concreteSide: kit.std('concreteSide', { map: kit.repeatOf('concrete', kit.concrete(), 2.3, 10.6), roughness: 0.82 }),
    asphalt: kit.std('asphalt', { map: kit.repeatOf('asphalt', kit.asphalt(), 14, 3), roughness: 0.38, envMapIntensity: 0.9 }),
    ground: kit.std('ground', { color: '#0f0b0e', roughness: 0.95 }),
    curb: kit.std('curb', { color: '#9b1a20', roughness: 0.6 }),
    lane: kit.std('lane', { color: '#d9d2c4', roughness: 0.6, emissive: '#3a3630' }),
    neon: kit.basic('neon', { color: '#ff5a62', toneMapped: false }),
    neonGlow: kit.basic('neonGlow', { color: '#ff1f2d', map: strip, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    halo: kit.basic('halo', { color: '#ff6a2a', map: glow, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    bulb: kit.basic('bulb', { color: '#ffdcae', toneMapped: false }),
    heat: kit.basic('heat', { color: '#ff8a3a', toneMapped: false }),
    flame: kit.basic('flame', { color: '#ffc46a', toneMapped: false }),
    wax: kit.std('wax', { color: '#f1e4cc', roughness: 0.6, emissive: '#2a1606' }),
    flowers: kit.std('flowers', { color: '#ffffff', roughness: 0.7 }),
    leaves: kit.std('leaves', { color: '#2f4a1c', roughness: 0.85 }),
    soil: kit.std('soil', { color: '#22160f', roughness: 1 }),
    planter: kit.std('planter', { color: '#2a2326', roughness: 0.8 }),
    pumpkin: kit.std('pumpkin', { color: '#d9640f', roughness: 0.55, emissiveMap: kit.pumpkinFace(), emissive: '#ffb347', emissiveIntensity: 1.8 }),
    stem: kit.std('stem', { color: '#4c5a22', roughness: 0.8 }),
    trunk: kit.std('trunk', { color: '#5a4636', roughness: 0.95 }),
    palm: kit.std('palmLeaf', { map: kit.palmLeaf(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 }),
    blob: kit.basic('blob', { map: kit.blob(), transparent: true, depthWrite: false }),
    logo: kit.basic('logo', { map: kit.imageTex(logoUrl), transparent: true, alphaTest: 0.02, toneMapped: false, color: '#f4ece4' }),
    logoDecal: kit.std('logoDecal', { map: kit.imageTex(logoUrl), transparent: true, alphaTest: 0.05, roughness: 0.4 }),
    cardboard: kit.std('cardboard', { color: '#b88c5a', roughness: 0.9 }),
    paperWhite: kit.std('paperWhite', { color: '#f4efe6', roughness: 0.8 }),
    bun: kit.std('bun', { color: '#d4924a', roughness: 0.6 }),
    patty: kit.std('patty', { color: '#4a2412', roughness: 0.7 }),
    cheese: kit.std('cheese', { color: '#f2b632', roughness: 0.5 }),
    fries: kit.std('fries', { color: '#e8b54c', roughness: 0.6 }),
    oil: kit.std('oil', { color: '#4a3210', roughness: 0.12, metalness: 0.2 }),
    cork: kit.std('cork', { color: '#9b6b43', roughness: 0.95 }),
    screenDark: kit.basic('screenDark', { color: '#120c10' })
  };
}

/* Materiales que se desvanecen al pasar de fachada a interior (o al revés). */
function fader(kit) {
  const list = [];
  const make = (stage) => (mat) => kit.mat(`fade:${stage}:${mat.uuid}`, () => {
    const m = mat.clone();
    m.userData.baseOpacity = mat.transparent ? mat.opacity : 1;
    m.userData.baseTransparent = mat.transparent;
    m.userData.baseDepthWrite = mat.depthWrite;
    m.userData.stage = stage;
    m.userData.source = mat;
    m.userData.baseColor = mat.color ? mat.color.clone() : null;
    list.push(m);
    return m;
  });
  return { list, ext: make('exterior'), int: make('interior') };
}

// ───────────────────────── Suelo, muros y fachada ─────────────────────────
function shell(kit, M, F, g) {
  const { X0, X1, Z0, Z1, WALL_H, CUT_H, T, ROOF_Y, door } = C;
  const W = X1 - X0, D = Z1 - Z0;
  // Suelos: comedor (terrazo), cocina (barro rojo), sala de personal (madera).
  add(g.statics, kit.box(W, 0.12, Z1 - (-1.2)), M.terrazzo, 0, -0.06, (Z1 + -1.2) / 2, { cast: false });
  add(g.statics, kit.box(4.7 - X0, 0.12, -1.2 - Z0), M.quarry, (X0 + 4.7) / 2, -0.06, (Z0 + -1.2) / 2, { cast: false });
  add(g.statics, kit.box(X1 - 4.7, 0.12, -2.7 - Z0), M.staffFloor, (4.7 + X1) / 2, -0.055, (Z0 - 2.7) / 2, { cast: false });
  add(g.statics, kit.box(X1 - 4.7, 0.12, 1.5), M.quarrySmall, (4.7 + X1) / 2, -0.06, -1.95, { cast: false });

  // Muro trasero (visible): exterior de fachada y piel interior por zonas.
  add(g.statics, kit.box(W + T * 2, WALL_H, T), M.facade, 0, WALL_H / 2, Z0 - T / 2);
  add(g.statics, kit.box(4.7 - X0, 1.35, 0.02), M.subway, (X0 + 4.7) / 2, 0.675, Z0 + 0.01, { cast: false });
  add(g.statics, kit.box(4.7 - X0, WALL_H - 1.35, 0.02), M.plaster, (X0 + 4.7) / 2, 1.35 + (WALL_H - 1.35) / 2, Z0 + 0.01, { cast: false });
  add(g.statics, kit.box(X1 - 4.7, WALL_H, 0.02), M.plaster, (4.7 + X1) / 2, WALL_H / 2, Z0 + 0.01, { cast: false });

  // Muro izquierdo (visible): cocina con azulejo, comedor con zócalo de madera y acento vino.
  add(g.statics, kit.box(T, WALL_H, D), M.facade, X0 - T / 2, WALL_H / 2, 0);
  add(g.statics, kit.box(0.02, 1.35, -1.2 - Z0), M.subwayLeft, X0 + 0.01, 0.675, (Z0 - 1.2) / 2, { cast: false });
  add(g.statics, kit.box(0.02, WALL_H - 1.35, -1.2 - Z0), M.plaster, X0 + 0.01, 1.35 + (WALL_H - 1.35) / 2, (Z0 - 1.2) / 2, { cast: false });
  add(g.statics, kit.box(0.03, 1.0, Z1 + 1.2), M.wainscot, X0 + 0.015, 0.5, (Z1 - 1.2) / 2, { cast: false });
  add(g.statics, kit.box(0.02, WALL_H - 1.0, Z1 + 1.2), M.wine, X0 + 0.01, 1.0 + (WALL_H - 1.0) / 2, (Z1 - 1.2) / 2, { cast: false });
  add(g.statics, kit.rbox(0.05, 0.05, Z1 + 1.2, 0.015, 1), M.gold, X0 + 0.04, 1.02, (Z1 - 1.2) / 2, { cast: false });

  // Muro derecho (cortado): tramo bajo siempre visible y tramo alto solo en la fachada.
  add(g.statics, kit.box(T, CUT_H, D), M.facade, X1 + T / 2, CUT_H / 2, 0);
  add(g.statics, kit.box(0.02, CUT_H, D), M.plaster, X1 - 0.01, CUT_H / 2, 0, { cast: false });
  add(g.ext, kit.box(T, WALL_H - CUT_H, D), F.ext(M.facade), X1 + T / 2, CUT_H + (WALL_H - CUT_H) / 2, 0, { cast: false });
  add(g.int, kit.rbox(T + 0.04, 0.05, D + T * 2, 0.02, 1), F.int(M.counterRed), X1 + T / 2, CUT_H + 0.02, 0, { cast: false });

  // Fachada acristalada (muro frontal cortado a la altura del tramo bajo).
  const left = door.x - door.w / 2 - 0.08, right = door.x + door.w / 2 + 0.08;
  const bays = [];
  for (const [a, b] of [[X0, left], [right, X1]]) {
    const n = Math.max(1, Math.round((b - a) / 1.5)), step = (b - a) / n;
    for (let i = 0; i < n; i++) bays.push([a + i * step, a + (i + 1) * step]);
  }
  const kick = 0.24, top = 3.25;
  add(g.statics, kit.box(left - X0, kick, T), M.mullion, (X0 + left) / 2, kick / 2, Z1 + T / 2);
  add(g.statics, kit.box(X1 - right, kick, T), M.mullion, (right + X1) / 2, kick / 2, Z1 + T / 2);
  for (const [a, b] of bays) {
    const w = b - a - 0.08, cx = (a + b) / 2;
    add(g.statics, kit.box(w, CUT_H - kick, 0.02), M.glass, cx, kick + (CUT_H - kick) / 2, Z1 + 0.06, { cast: false, receive: false });
    add(g.ext, kit.box(w, top - CUT_H, 0.02), F.ext(M.glass), cx, CUT_H + (top - CUT_H) / 2, Z1 + 0.06, { cast: false, receive: false });
  }
  const posts = [...new Set(bays.flatMap(b => b).map(x => +x.toFixed(3)))];
  for (const x of posts) {
    add(g.statics, kit.box(0.09, CUT_H, 0.12), M.mullion, x, CUT_H / 2, Z1 + 0.06);
    add(g.ext, kit.box(0.09, WALL_H - CUT_H, 0.12), F.ext(M.mullion), x, CUT_H + (WALL_H - CUT_H) / 2, Z1 + 0.06, { cast: false });
  }
  add(g.ext, kit.box(W + T * 2, WALL_H - top, T), F.ext(M.mullion), 0, top + (WALL_H - top) / 2, Z1 + T / 2, { cast: false });
  add(g.int, kit.rbox(left - X0, 0.05, T + 0.06, 0.02, 1), F.int(M.counterRed), (X0 + left) / 2, CUT_H + 0.02, Z1 + T / 2, { cast: false });
  add(g.int, kit.rbox(X1 - right, 0.05, T + 0.06, 0.02, 1), F.int(M.counterRed), (right + X1) / 2, CUT_H + 0.02, Z1 + T / 2, { cast: false });
  // Marco de la puerta: jambas completas (finas) y dintel en la fachada.
  for (const x of [left, right]) {
    add(g.statics, kit.box(0.14, CUT_H, 0.24), M.mullion, x, CUT_H / 2, Z1 + 0.06);
    add(g.ext, kit.box(0.14, door.h + 0.2 - CUT_H, 0.24), F.ext(M.mullion), x, CUT_H + (door.h + 0.2 - CUT_H) / 2, Z1 + 0.06, { cast: false });
  }
  add(g.ext, kit.box(right - left, top - door.h, 0.24), F.ext(M.mullion), door.x, door.h + (top - door.h) / 2, Z1 + 0.06, { cast: false });
  // Felpudos.
  add(g.statics, kit.rbox(2.2, 0.025, 1.0, 0.01, 1), M.black, door.x, 0.012, Z1 - 0.7, { cast: false });
  add(g.statics, kit.rbox(2.6, 0.025, 1.1, 0.01, 1), M.black, door.x, 0.012, Z1 + 0.85, { cast: false });

  // Remate, rótulo y techo (solo fachada).
  const fasciaH = ROOF_Y - WALL_H;
  add(g.ext, kit.box(W + T * 2 + 0.3, fasciaH, 0.32), F.ext(M.fascia), 0, WALL_H + fasciaH / 2, Z1 + 0.16, { cast: false });
  add(g.ext, kit.box(0.32, fasciaH, D + T * 2 + 0.3), F.ext(M.fascia), X0 - 0.16, WALL_H + fasciaH / 2, 0, { cast: false });
  add(g.ext, kit.box(W + T * 2, 0.18, D + T * 2), F.ext(M.roof), 0, ROOF_Y + 0.09, 0, { cast: false });
  add(g.ext, kit.box(W + T * 2 + 0.3, 0.42, 0.18), F.ext(M.fascia), 0, ROOF_Y + 0.21, Z1 + 0.25, { cast: false });
  for (const [x, z, w, d] of [[-5.2, -2.5, 1.6, 1.2], [-2.6, -3.8, 1.2, 1.0], [3.2, -2.8, 2.0, 1.3]]) {
    add(g.ext, kit.rbox(w, 0.8, d, 0.06), F.ext(M.steel), x, ROOF_Y + 0.58, z, { cast: false });
    add(g.ext, kit.cyl(0.32, 0.32, 0.06, 20), F.ext(M.black), x, ROOF_Y + 1.0, z, { cast: false });
  }
  // Marquesina sobre la entrada.
  add(g.ext, kit.rbox(3.4, 0.18, 1.7, 0.04), F.ext(M.fascia), door.x, 3.05, Z1 + 0.85, { cast: false });
  for (const dx of [-1, 0, 1]) add(g.ext, kit.cyl(0.11, 0.11, 0.02, 18), F.ext(M.bulb), door.x + dx * 1.0, 2.955, Z1 + 1.0, { cast: false });
  add(g.ext, kit.cyl(0.03, 0.03, 3.4, 10), F.ext(M.neon), door.x, 3.05, Z1 + 1.72, { cast: false, rz: Math.PI / 2 });
  add(g.ext, kit.plane(3.6, 0.5), F.ext(M.neonGlow), door.x, 3.05, Z1 + 1.75, { cast: false, receive: false });

  // Neón rojo continuo en el remate frontal y lateral, como en la referencia nocturna.
  for (const y of [WALL_H + 0.1, ROOF_Y - 0.1]) {
    add(g.ext, kit.cyl(0.035, 0.035, W + T * 2 + 0.3, 10), F.ext(M.neon), 0, y, Z1 + 0.34, { cast: false, rz: Math.PI / 2 });
    add(g.ext, kit.plane(W + 0.8, 0.55), F.ext(M.neonGlow), 0, y, Z1 + 0.36, { cast: false, receive: false });
    add(g.ext, kit.cyl(0.035, 0.035, D + T * 2 + 0.3, 10), F.ext(M.neon), X0 - 0.34, y, 0, { cast: false, rx: Math.PI / 2 });
    add(g.ext, kit.plane(D + 0.8, 0.55), F.ext(M.neonGlow), X0 - 0.36, y, 0, { cast: false, receive: false, ry: -Math.PI / 2 });
  }

  // Rótulo del techo con el logotipo aprobado (assets/logo/burgershot-3d-512.webp, sin modificar).
  const sx = -2.4, sy = ROOF_Y + 2.05, sz = Z1 - 0.2;
  for (const dx of [-1.1, 1.1]) add(g.ext, kit.box(0.12, 1.2, 0.12), F.ext(M.black), sx + dx, ROOF_Y + 0.6, sz - 0.12, { cast: false });
  add(g.ext, kit.rbox(3.7, 3.1, 0.14, 0.08), F.ext(M.fascia), sx, sy, sz - 0.12, { cast: false });
  add(g.ext, kit.plane(4.6, 3.8), F.ext(M.halo), sx, sy, sz - 0.21, { cast: false, receive: false });
  add(g.ext, kit.plane(3.5, 2.95), F.ext(M.logo), sx, sy, sz - 0.04, { cast: false, receive: false });
}

// ───────────────────────── Puertas automáticas ─────────────────────────
function doors(kit, M, F, g, ext) {
  const { door, Z1, CUT_H } = C, panels = [];
  for (const side of [-1, 1]) {
    const panel = new THREE.Group();
    panel.userData.keep = true;
    panel.position.set(door.x + side * door.w / 4, 0, Z1 + 0.02);
    const pw = door.w / 2 - 0.04;
    add(panel, kit.box(pw, 0.08, 0.06), M.mullion, 0, 0.04, 0);
    add(panel, kit.box(0.06, CUT_H, 0.06), M.mullion, -side * (pw / 2 - 0.03), CUT_H / 2, 0);
    add(panel, kit.box(pw - 0.06, CUT_H - 0.08, 0.02), M.glass, 0, 0.08 + (CUT_H - 0.08) / 2, 0, { cast: false, receive: false });
    const up = [
      add(panel, kit.box(0.06, door.h - CUT_H, 0.06), F.ext(M.mullion), -side * (pw / 2 - 0.03), CUT_H + (door.h - CUT_H) / 2, 0, { cast: false }),
      add(panel, kit.box(pw, 0.08, 0.06), F.ext(M.mullion), 0, door.h - 0.04, 0, { cast: false }),
      add(panel, kit.box(pw - 0.06, door.h - CUT_H - 0.08, 0.02), F.ext(M.glass), 0, CUT_H + (door.h - CUT_H - 0.08) / 2, 0, { cast: false, receive: false }),
      add(panel, kit.plane(0.42, 0.36), F.ext(M.logoDecal), 0, 1.55, 0.016, { cast: false, receive: false }),
      add(panel, kit.plane(0.42, 0.36), F.ext(M.logoDecal), 0, 1.55, -0.016, { cast: false, receive: false, ry: Math.PI })
    ];
    ext.push(...up);
    panel.userData.side = side;
    panels.push(panel);
    g.dynamic.add(panel);
  }
  return {
    set(t) {
      const k = t * t * (3 - 2 * t);
      for (const p of panels) p.position.x = door.x + p.userData.side * (door.w / 4 + k * (door.w / 2 - 0.1));
    }
  };
}

// ───────────────────────── Mostrador ─────────────────────────
function counter(kit, M, g, screens) {
  const { x0, x1, z, depth, h } = C.counter, len = x1 - x0, cx = (x0 + x1) / 2, front = z + depth / 2, back = z - depth / 2;
  const grp = g.statics;
  add(grp, kit.box(len - 0.1, 0.1, depth - 0.12), M.plinth, cx, 0.05, z);
  add(grp, kit.rbox(len, h - 0.16, depth, 0.03), M.counterRed, cx, 0.1 + (h - 0.16) / 2, z);
  add(grp, kit.rbox(len + 0.02, 0.11, 0.03, 0.012, 1), M.white, cx, h - 0.22, front + 0.01, { cast: false });
  add(grp, kit.rbox(len + 0.02, 0.03, 0.03, 0.01, 1), M.gold, cx, 0.16, front + 0.01, { cast: false });
  // Paneles verticales blancos para el ritmo rojo y blanco del frente.
  for (let x = x0 + 0.9; x < x1 - 0.5; x += 1.8) add(grp, kit.rbox(0.09, h - 0.42, 0.025, 0.01, 1), M.white, x, 0.17 + (h - 0.42) / 2, front + 0.01, { cast: false });
  // Encimera de cuarzo con tira de luz cálida bajo el vuelo.
  add(grp, kit.rbox(len + 0.18, 0.06, depth + 0.16, 0.02), M.quartz, cx, h, z + 0.02);
  add(grp, kit.box(len, 0.015, 0.02), M.bulb, cx, h - 0.04, front + 0.06, { cast: false, receive: false });
  // Placa con el logotipo al frente.
  add(grp, kit.cyl(0.42, 0.42, 0.04, 40), M.white, cx, 0.56, front + 0.03, { rx: Math.PI / 2, cast: false });
  add(grp, kit.plane(0.74, 0.62), M.logoDecal, cx, 0.56, front + 0.055, { cast: false, receive: false });

  // Cajas registradoras con pantalla para el personal y visor al cliente.
  for (const rx of C.registers) {
    add(grp, kit.rbox(0.42, 0.09, 0.34, 0.02), M.black, rx, h + 0.075, back + 0.28);
    add(grp, kit.cyl(0.025, 0.025, 0.16, 10), M.steelDark, rx, h + 0.19, back + 0.24);
    const head = new THREE.Group();
    head.position.set(rx, h + 0.36, back + 0.22); head.rotation.set(0.38, Math.PI, 0);
    add(head, kit.rbox(0.42, 0.29, 0.04, 0.015, 1), M.black, 0, 0, 0);
    const screen = add(head, kit.plane(0.38, 0.25), screens.pos, 0, 0, 0.022, { cast: false, receive: false });
    screen.userData.screen = true;
    grp.add(head);
    const cust = new THREE.Group();
    cust.position.set(rx + 0.12, h + 0.2, back + 0.42); cust.rotation.x = -0.2;
    add(cust, kit.rbox(0.2, 0.13, 0.03, 0.01, 1), M.black, 0, 0, 0);
    add(cust, kit.plane(0.17, 0.1), screens.customer, 0, 0, 0.017, { cast: false, receive: false });
    grp.add(cust);
    add(grp, kit.rbox(0.38, 0.1, 0.36, 0.015, 1), M.black, rx, h - 0.12, back - 0.02);
  }
  // Zona de recogida: bandejas y servilletero.
  for (let i = 0; i < 5; i++) add(grp, kit.rbox(0.46, 0.022, 0.34, 0.01, 1), M.counterRed, x1 - 0.55, h + 0.045 + i * 0.024, z + 0.05, { cast: false });
  add(grp, kit.rbox(0.18, 0.2, 0.12, 0.02), M.steel, x1 - 1.1, h + 0.13, z + 0.12);
  // Media puerta de servicio y estación de bebidas detrás del mostrador.
  // Puerta de servicio abierta: deja paso a quien reparte pedidos.
  add(grp, kit.rbox(0.06, 0.95, 0.9, 0.02), M.counterRed, x1 + 1.08, 0.5, z + 0.48);
  add(grp, kit.rbox(0.06, 1.0, 0.06, 0.02, 1), M.chrome, x1 + 0.1, 0.5, z);
  const bx = x0 + 0.6, bz = -2.2;
  add(grp, kit.rbox(1.3, 0.92, 0.7, 0.03), M.steel, bx, 0.46, bz);
  add(grp, kit.rbox(1.05, 0.72, 0.5, 0.04), M.steel, bx, 1.28, bz - 0.06);
  add(grp, kit.plane(0.9, 0.34), M.logoDecal, bx, 1.42, bz + 0.195, { cast: false, receive: false });
  for (let i = 0; i < 6; i++) add(grp, kit.cyl(0.025, 0.02, 0.07, 8), M.chrome, bx - 0.4 + i * 0.16, 0.99, bz + 0.12);
  const labels = ['#d2232a', '#f2b632', '#2f8f4e', '#e0e0e0', '#7d3aa0', '#f06b12'];
  for (let i = 0; i < 6; i++) add(grp, kit.rbox(0.13, 0.05, 0.03, 0.01, 1), kit.std(`label${i}`, { color: labels[i], roughness: 0.4 }), bx - 0.4 + i * 0.16, 1.1, bz + 0.2, { cast: false });
}

// ───────────────────────── Cocina ─────────────────────────
function kitchen(kit, M, g, rand) {
  const s = g.statics, z = C.Z0 + 0.45;
  // Refrigerador de dos puertas.
  add(s, kit.rbox(1.3, 2.15, 0.78, 0.04), M.steel, -7.85, 1.075, z);
  add(s, kit.box(0.012, 2.0, 0.01), M.steelDark, -7.85, 1.1, z + 0.395, { cast: false });
  for (const dx of [-0.08, 0.08]) add(s, kit.rbox(0.03, 0.9, 0.04, 0.012, 1), M.chrome, -7.85 + dx, 1.25, z + 0.42);
  // Mesa de preparación con contenedores de ingredientes.
  table(kit, M, s, -6.2, z, 1.6);
  const fill = [M.leaves, kit.std('tomato', { color: '#d23b2c', roughness: 0.5 }), M.paperWhite, M.cheese, kit.std('pickle', { color: '#6f8a2a', roughness: 0.6 })];
  for (let i = 0; i < 5; i++) {
    add(s, kit.rbox(0.26, 0.1, 0.22, 0.015, 1), M.steelDark, -6.85 + i * 0.32, 0.97, z + 0.05);
    add(s, kit.box(0.22, 0.02, 0.18), fill[i], -6.85 + i * 0.32, 1.015, z + 0.05, { cast: false });
  }
  // Plancha con carne y queso.
  add(s, kit.rbox(2.0, 0.84, 0.82, 0.03), M.steel, -3.7, 0.42, z);
  add(s, kit.rbox(1.9, 0.06, 0.7, 0.015, 1), M.griddle, -3.7, 0.87, z + 0.02);
  for (let i = 0; i < 4; i++) add(s, kit.cyl(0.035, 0.035, 0.05, 12), M.black, -4.45 + i * 0.5, 0.62, z + 0.42, { rx: Math.PI / 2 });
  for (let i = 0; i < 8; i++) {
    const px = -4.45 + (i % 4) * 0.42 + rand() * 0.06, pz = z - 0.1 + Math.floor(i / 4) * 0.28;
    add(s, kit.cyl(0.058, 0.06, 0.022, 18), M.patty, px, 0.912, pz, { cast: false });
    if (i % 3 === 0) add(s, kit.box(0.1, 0.006, 0.1), M.cheese, px, 0.926, pz, { cast: false, ry: 0.6 });
  }
  // Freidoras con canastillas de papas.
  for (const fx of [-1.8, -1.0]) {
    add(s, kit.rbox(0.76, 0.9, 0.82, 0.03), M.steel, fx, 0.45, z);
    add(s, kit.box(0.52, 0.02, 0.5), M.oil, fx, 0.905, z + 0.02, { cast: false });
    add(s, kit.box(0.4, 0.16, 0.3), M.steelDark, fx, 1.0, z + 0.22, { cast: false });
    for (let i = 0; i < 14; i++) add(s, kit.box(0.012, 0.012, 0.1), M.fries, fx - 0.15 + rand() * 0.3, 1.08 + rand() * 0.02, z + 0.2 + (rand() - 0.5) * 0.18, { cast: false, ry: rand() * 3 });
  }
  // Mesa de armado con panes.
  table(kit, M, s, 0.6, z, 1.6);
  for (let i = 0; i < 6; i++) {
    const bxp = 0.05 + (i % 3) * 0.36, bzp = z - 0.12 + Math.floor(i / 3) * 0.26;
    add(s, kit.geo('bunTop', () => new THREE.SphereGeometry(0.075, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2)), M.bun, bxp, 0.94, bzp, { cast: false, scale: [1, 0.62, 1] });
  }
  // Estantería con cajas y vasos.
  add(s, kit.rbox(1.6, 0.03, 0.55, 0.01, 1), M.steel, 2.6, 0.4, z - 0.05);
  add(s, kit.rbox(1.6, 0.03, 0.55, 0.01, 1), M.steel, 2.6, 1.0, z - 0.05);
  add(s, kit.rbox(1.6, 0.03, 0.55, 0.01, 1), M.steel, 2.6, 1.6, z - 0.05);
  for (const dx of [-0.78, 0.78]) for (const dz of [-0.25, 0.17]) add(s, kit.box(0.035, 1.9, 0.035), M.steelDark, 2.6 + dx, 0.95, z - 0.05 + dz);
  for (let i = 0; i < 6; i++) add(s, kit.rbox(0.42, 0.3 + rand() * 0.12, 0.4, 0.01, 1), M.cardboard, 2.05 + (i % 3) * 0.52, (i < 3 ? 0.58 : 1.18), z - 0.05);
  for (let i = 0; i < 4; i++) add(s, kit.cyl(0.05, 0.04, 0.34, 14), M.paperWhite, 2.1 + i * 0.3, 1.79, z - 0.05);
  // Campana extractora con franja roja y luces.
  add(s, kit.rbox(4.6, 0.62, 1.1, 0.04), M.steel, -2.65, 2.55, C.Z0 + 0.55, { cast: false });
  add(s, kit.rbox(4.62, 0.14, 0.02, 0.01, 1), M.counterRed, -2.65, 2.4, C.Z0 + 1.11, { cast: false });
  for (let i = 0; i < 4; i++) add(s, kit.cyl(0.08, 0.08, 0.02, 16), M.bulb, -4.3 + i * 1.1, 2.235, C.Z0 + 0.7, { cast: false, receive: false });
  // Pasaplatos con lámparas de calor y pedidos listos.
  const pz = -3.3;
  add(s, kit.rbox(7.4, 0.05, 0.6, 0.015, 1), M.steel, -2.0, 1.12, pz);
  for (const x of [-5.6, -2.0, 1.6]) add(s, kit.box(0.05, 1.12, 0.05), M.steelDark, x, 0.56, pz);
  add(s, kit.rbox(7.4, 0.04, 0.4, 0.012, 1), M.steel, -2.0, 1.6, pz);
  for (const x of [-5.6, -2.0, 1.6]) add(s, kit.box(0.04, 0.5, 0.04), M.steelDark, x, 1.38, pz);
  for (let i = 0; i < 6; i++) add(s, kit.cyl(0.045, 0.06, 0.08, 14), M.heat, -5.0 + i * 1.2, 1.54, pz, { cast: false, receive: false });
  for (let i = 0; i < 9; i++) {
    const fx = -5.3 + i * 0.8 + rand() * 0.2;
    if (i % 3 === 0) add(s, kit.rbox(0.13, 0.07, 0.13, 0.02, 1), M.cheese, fx, 1.18, pz + 0.05, { cast: false });
    else if (i % 3 === 1) { add(s, kit.rbox(0.1, 0.14, 0.06, 0.01, 1), M.counterRed, fx, 1.215, pz, { cast: false }); for (let k = 0; k < 5; k++) add(s, kit.box(0.01, 0.07, 0.01), M.fries, fx - 0.035 + k * 0.018, 1.31, pz, { cast: false }); }
    else { add(s, kit.cyl(0.045, 0.035, 0.15, 14), M.paperWhite, fx, 1.22, pz, { cast: false }); add(s, kit.cyl(0.047, 0.047, 0.02, 14), M.counterRed, fx, 1.3, pz, { cast: false }); }
  }
}

function table(kit, M, grp, x, z, w) {
  add(grp, kit.rbox(w, 0.04, 0.76, 0.012, 1), M.steel, x, 0.9, z);
  add(grp, kit.rbox(w - 0.1, 0.03, 0.66, 0.01, 1), M.steel, x, 0.25, z);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) add(grp, kit.box(0.04, 0.9, 0.04), M.steelDark, x + dx * (w / 2 - 0.06), 0.45, z + dz * 0.32);
}

// ───────────────────────── Sala del personal ─────────────────────────
function staffRoom(kit, M, g, notes) {
  const s = g.statics, px = 4.7;
  // Mampara baja con vidrio superior.
  add(s, kit.box(0.12, 1.1, -2.7 - C.Z0), M.plaster, px, 0.55, (C.Z0 - 2.7) / 2);
  add(s, kit.box(0.04, 1.0, -2.7 - C.Z0), M.glass, px, 1.6, (C.Z0 - 2.7) / 2, { cast: false, receive: false });
  add(s, kit.box(1.6, 1.1, 0.12), M.plaster, 8.2, 0.55, -2.7);
  add(s, kit.box(1.4, 1.1, 0.12), M.plaster, 5.4, 0.55, -2.7);
  add(s, kit.rbox(1.62, 0.05, 0.16, 0.02, 1), M.counterRed, 8.2, 1.12, -2.7, { cast: false });
  add(s, kit.rbox(1.42, 0.05, 0.16, 0.02, 1), M.counterRed, 5.4, 1.12, -2.7, { cast: false });
  add(s, kit.rbox(0.16, 0.05, -2.7 - C.Z0, 0.02, 1), M.counterRed, px, 1.12, (C.Z0 - 2.7) / 2, { cast: false });
  // Taquillas rojas.
  for (let i = 0; i < 4; i++) {
    const lx = 5.25 + i * 0.56;
    add(s, kit.rbox(0.54, 1.9, 0.5, 0.02), M.steelDark, lx, 0.95, C.Z0 + 0.27);
    add(s, kit.rbox(0.48, 1.8, 0.02, 0.01, 1), M.counterRed, lx, 0.97, C.Z0 + 0.53, { cast: false });
    for (let k = 0; k < 3; k++) add(s, kit.box(0.26, 0.012, 0.01), M.black, lx, 1.65 - k * 0.04, C.Z0 + 0.545, { cast: false });
    add(s, kit.box(0.02, 0.1, 0.02), M.chrome, lx + 0.17, 1.0, C.Z0 + 0.55, { cast: false });
  }
  // Puerta «Solo personal».
  add(s, kit.rbox(1.0, 2.2, 0.06, 0.02), M.black, 8.0, 1.1, C.Z0 + 0.04);
  add(s, kit.rbox(0.56, 0.16, 0.02, 0.01, 1), M.counterRed, 8.0, 1.75, C.Z0 + 0.08, { cast: false });
  add(s, kit.box(0.03, 0.14, 0.04), M.chrome, 7.65, 1.05, C.Z0 + 0.09, { cast: false });
  // Tablón de avisos.
  add(s, kit.rbox(1.5, 0.8, 0.04, 0.02, 1), M.cork, 6.1, 2.45, C.Z0 + 0.04, { cast: false });
  add(s, kit.plane(1.42, 0.72), notes, 6.1, 2.45, C.Z0 + 0.065, { cast: false, receive: false });
  // Mesa de descanso con taburetes.
  add(s, kit.cyl(0.5, 0.5, 0.04, 40), M.tableTop, 6.9, 0.76, -4.4);
  add(s, kit.cyl(0.04, 0.05, 0.74, 12), M.chrome, 6.9, 0.38, -4.4);
  add(s, kit.cyl(0.25, 0.28, 0.03, 24), M.chrome, 6.9, 0.015, -4.4);
  for (const [x, zz] of [[6.35, -4.0], [7.45, -4.0], [6.9, -5.2]]) stool(kit, M, s, x, zz, 0.6);
  // Barra de café.
  add(s, kit.rbox(0.6, 0.9, 1.6, 0.03), M.wainscot, 8.6, 0.45, -4.6);
  add(s, kit.rbox(0.64, 0.04, 1.64, 0.015, 1), M.quartz, 8.6, 0.92, -4.6);
  add(s, kit.rbox(0.36, 0.42, 0.34, 0.03), M.black, 8.62, 1.15, -4.95);
  add(s, kit.rbox(0.2, 0.05, 0.12, 0.01, 1), M.chrome, 8.5, 1.1, -4.95);
  for (let i = 0; i < 3; i++) add(s, kit.cyl(0.04, 0.035, 0.09, 14), M.white, 8.55, 0.985, -4.45 + i * 0.14);
}

function stool(kit, M, grp, x, z, h) {
  add(grp, kit.cyl(0.19, 0.19, 0.06, 24), M.vinyl, x, h, z);
  add(grp, kit.cyl(0.025, 0.03, h, 10), M.chrome, x, h / 2, z);
  add(grp, kit.torus(0.15, 0.012, 6, 24), M.chrome, x, h * 0.42, z, { rx: Math.PI / 2, cast: false });
  add(grp, kit.cyl(0.18, 0.2, 0.025, 24), M.chrome, x, 0.012, z);
}

// ───────────────────────── Comedor ─────────────────────────
function dining(kit, M, g, posters) {
  const s = g.statics;
  // Reservados tapizados junto al muro izquierdo.
  for (const zc of [0.9, 3.05, 5.2]) {
    for (const side of [-1, 1]) {
      const bz = zc + side * 0.78, back = bz + side * 0.29;
      add(s, kit.rbox(2.1, 0.4, 0.5, 0.03), M.vinylDark, -7.85, 0.2, bz);
      add(s, kit.rbox(2.06, 0.12, 0.52, 0.05), M.vinyl, -7.85, 0.46, bz);
      add(s, kit.rbox(2.06, 0.7, 0.16, 0.06), M.vinyl, -7.85, 0.86, back);
      for (let k = -2; k <= 2; k++) add(s, kit.box(0.012, 0.58, 0.012), M.vinylDark, -7.85 + k * 0.38, 0.86, back - side * 0.081, { cast: false });
      add(s, kit.rbox(2.1, 0.05, 0.2, 0.02, 1), M.wainscot, -7.85, 1.235, back);
    }
    add(s, kit.rbox(1.55, 0.05, 0.82, 0.02), M.tableTop, -7.75, 0.75, zc);
    add(s, kit.rbox(1.58, 0.02, 0.85, 0.01, 1), M.chrome, -7.75, 0.72, zc, { cast: false });
    add(s, kit.cyl(0.05, 0.06, 0.7, 14), M.chrome, -7.4, 0.37, zc);
    add(s, kit.rbox(0.5, 0.03, 0.3, 0.01, 1), M.chrome, -7.4, 0.015, zc);
    tableSet(kit, M, s, -7.6, 0.775, zc);
  }
  // Mesas centrales de cuatro plazas.
  for (const tx of [-3.8, -1.0]) for (const tz of [1.55, 3.85]) {
    add(s, kit.rbox(0.9, 0.05, 0.9, 0.02), M.tableTop, tx, 0.75, tz);
    add(s, kit.cyl(0.045, 0.055, 0.72, 14), M.chrome, tx, 0.37, tz);
    add(s, kit.cyl(0.28, 0.3, 0.025, 24), M.chrome, tx, 0.012, tz);
    for (const [dx, dz, ry] of [[0, -0.68, 0], [0, 0.68, Math.PI], [-0.68, 0, Math.PI / 2], [0.68, 0, -Math.PI / 2]]) chair(kit, M, s, tx + dx, tz + dz, ry);
    tableSet(kit, M, s, tx, 0.775, tz);
  }
  // Mesas de dos plazas junto al muro derecho.
  for (const tz of [2.3, 4.3]) {
    add(s, kit.rbox(0.75, 0.05, 0.75, 0.02), M.tableTop, 7.9, 0.75, tz);
    add(s, kit.cyl(0.045, 0.055, 0.72, 14), M.chrome, 7.9, 0.37, tz);
    add(s, kit.cyl(0.26, 0.28, 0.025, 24), M.chrome, 7.9, 0.012, tz);
    chair(kit, M, s, 7.25, tz, Math.PI / 2);
    chair(kit, M, s, 8.55, tz, -Math.PI / 2);
  }
  // Barra junto al ventanal con taburetes altos.
  add(s, kit.rbox(8.6, 0.05, 0.46, 0.02), M.tableTop, -1.75, 1.05, 6.08);
  for (const x of [-5.6, -1.75, 2.1]) add(s, kit.rbox(0.05, 1.03, 0.05, 0.01, 1), M.chrome, x, 0.52, 6.12);
  for (let i = 0; i < 7; i++) {
    const x = -5.4 + i * 1.12;
    add(s, kit.cyl(0.18, 0.18, 0.06, 24), M.seatBlack, x, 0.78, 5.5);
    add(s, kit.cyl(0.025, 0.03, 0.78, 10), M.chrome, x, 0.39, 5.5);
    add(s, kit.torus(0.14, 0.012, 6, 24), M.chrome, x, 0.3, 5.5, { rx: Math.PI / 2, cast: false });
    add(s, kit.cyl(0.18, 0.2, 0.025, 24), M.chrome, x, 0.012, 5.5);
  }
  // Estación de bebidas y salsas de autoservicio y punto de bandejas.
  add(s, kit.rbox(0.7, 0.95, 1.6, 0.03), M.counterRed, 8.55, 0.475, 0.3);
  add(s, kit.rbox(0.74, 0.04, 1.64, 0.015, 1), M.quartz, 8.55, 0.97, 0.3);
  add(s, kit.rbox(0.55, 0.65, 0.9, 0.04), M.steel, 8.62, 1.32, 0.1);
  for (let i = 0; i < 4; i++) add(s, kit.cyl(0.02, 0.016, 0.06, 8), M.chrome, 8.36, 1.12, -0.2 + i * 0.2);
  for (let i = 0; i < 3; i++) add(s, kit.cyl(0.035, 0.035, 0.16, 12), [M.counterRed, M.cheese, M.leaves][i], 8.45, 1.07, 0.75 + i * 0.1);
  add(s, kit.rbox(0.7, 1.1, 0.55, 0.04), M.wainscot, 6.75, 0.55, 6.08);
  add(s, kit.rbox(0.5, 0.06, 0.36, 0.02, 1), M.black, 6.75, 1.12, 6.08, { cast: false });
  // Carteles enmarcados con las fotos del menú existentes.
  posters.forEach((mat, i) => {
    const zc = [0.9, 3.05, 5.2][i];
    add(s, kit.rbox(0.05, 0.72, 1.04, 0.015, 1), M.black, C.X0 + 0.05, 2.05, zc, { cast: false });
    add(s, kit.plane(0.96, 0.64), mat, C.X0 + 0.08, 2.05, zc, { cast: false, receive: false, ry: Math.PI / 2 });
  });
  // Apliques de pared.
  for (const zc of [-0.2, 1.95, 4.1, 6.2]) {
    add(s, kit.rbox(0.06, 0.26, 0.14, 0.02, 1), M.gold, C.X0 + 0.04, 2.6, zc, { cast: false });
    add(s, kit.sphere(0.07, 16, 10), M.bulb, C.X0 + 0.14, 2.62, zc, { cast: false, receive: false });
  }
}

function chair(kit, M, grp, x, z, ry) {
  const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry;
  add(c, kit.rbox(0.44, 0.06, 0.44, 0.025), M.vinyl, 0, 0.46, 0);
  add(c, kit.rbox(0.44, 0.36, 0.05, 0.025), M.vinyl, 0, 0.74, -0.2);
  for (const dx of [-0.19, 0.19]) for (const dz of [-0.19, 0.19]) add(c, kit.cyl(0.014, 0.014, 0.45, 8), M.black, dx, 0.225, dz);
  for (const dx of [-0.19, 0.19]) add(c, kit.cyl(0.012, 0.012, 0.34, 8), M.black, dx, 0.62, -0.21);
  grp.add(c);
}

function tableSet(kit, M, grp, x, y, z) {
  add(grp, kit.rbox(0.09, 0.12, 0.06, 0.012, 1), M.steel, x - 0.12, y + 0.06, z - 0.1, { cast: false });
  add(grp, kit.cyl(0.018, 0.018, 0.14, 10), M.counterRed, x + 0.02, y + 0.07, z - 0.12, { cast: false });
  add(grp, kit.cyl(0.018, 0.018, 0.14, 10), M.cheese, x + 0.07, y + 0.07, z - 0.12, { cast: false });
}

// ───────────────────────── Exterior y entorno ─────────────────────────
function exterior(kit, M, F, g, rand, lightsOut) {
  const s = g.statics, { X0, X1, Z1 } = C;
  add(s, kit.box(90, 0.1, 90), M.ground, 0, -0.27, 0, { cast: false });
  add(s, kit.box(34, 0.22, 4.1), M.concrete, 0, -0.11, Z1 + 2.05, { cast: false });
  add(s, kit.box(3.6, 0.22, 17), M.concreteSide, X0 - 1.8, -0.11, -1.9, { cast: false });
  add(s, kit.box(34, 0.24, 0.25), M.curb, 0, -0.1, Z1 + 4.22, { cast: false });
  add(s, kit.box(60, 0.1, 14), M.asphalt, 0, -0.2, Z1 + 11.4, { cast: false });
  for (let x = -26; x <= 26; x += 4) add(s, kit.box(2.0, 0.012, 0.14), M.lane, x, -0.145, Z1 + 11.0, { cast: false });
  // Jardineras con cempasúchil, velas y calabazas (temporada).
  const flowers = [];
  const planter = (x0, x1) => {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    add(s, kit.rbox(w, 0.5, 0.62, 0.04), M.planter, cx, 0.25, Z1 + 0.62);
    add(s, kit.box(w - 0.1, 0.04, 0.52), M.soil, cx, 0.49, Z1 + 0.62, { cast: false });
    for (let x = x0 + 0.12; x < x1 - 0.1; x += 0.11) for (let k = 0; k < 3; k++) flowers.push([x + rand() * 0.06, 0.55 + rand() * 0.08, Z1 + 0.45 + k * 0.17 + rand() * 0.05]);
  };
  planter(X0 + 0.3, 2.6);
  planter(6.4, X1 - 0.3);
  g.flowers = flowers;
  // Bolardos con anillo de luz.
  for (const x of [2.9, 6.3]) {
    add(s, kit.cyl(0.09, 0.1, 0.8, 16), M.black, x, 0.4, Z1 + 3.4);
    add(s, kit.cyl(0.092, 0.092, 0.05, 16), M.bulb, x, 0.68, Z1 + 3.4, { cast: false, receive: false });
  }
  // Farolas.
  for (const [x, z] of [[-7.5, Z1 + 3.75], [10.2, Z1 + 3.75]]) {
    add(g.ext, kit.cyl(0.07, 0.09, 6.2, 12), F.ext(M.black), x, 3.1, z, { cast: false });
    add(g.ext, kit.rbox(0.9, 0.08, 0.08, 0.02, 1), F.ext(M.black), x + (x < 0 ? 0.42 : -0.42), 6.1, z, { cast: false });
    add(g.ext, kit.rbox(0.5, 0.12, 0.28, 0.03, 1), F.ext(M.black), x + (x < 0 ? 0.8 : -0.8), 6.05, z, { cast: false });
    add(g.ext, kit.box(0.42, 0.01, 0.2), F.ext(M.bulb), x + (x < 0 ? 0.8 : -0.8), 5.985, z, { cast: false, receive: false });
    lightsOut.push({ kind: 'lamp', pos: [x + (x < 0 ? 0.8 : -0.8), 5.7, z] });
  }
  // Palmeras.
  for (const [x, z, h, lean] of [[-12.6, Z1 + 3.3, 8.4, -0.08], [13.2, Z1 + 3.1, 7.6, 0.1], [-11.6, -4.2, 9.2, -0.05], [12.4, -5.6, 8.8, 0.06]]) palm(kit, M, F, g, x, z, h, lean, rand);
}

function palm(kit, M, F, g, x, z, h, lean, rand) {
  const tree = new THREE.Group(); tree.position.set(x, 0, z); tree.rotation.z = lean;
  const segs = 9;
  for (let i = 0; i < segs; i++) {
    const r = 0.2 - i * 0.012;
    add(tree, kit.cyl(r * 0.92, r, h / segs + 0.02, 12), F.ext(M.trunk), Math.sin(i / segs * 1.4) * 0.25, h / segs * (i + 0.5), 0, { cast: false });
  }
  const top = new THREE.Vector3(Math.sin(1.4) * 0.25, h, 0);
  const fronds = 11;
  for (let i = 0; i < fronds; i++) {
    const frond = new THREE.Mesh(kit.geo('frond', () => {
      const geo = new THREE.PlaneGeometry(1.0, 3.4, 1, 8); geo.translate(0, 1.7, 0);
      const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) { const t = Math.max(0, p.getY(k) / 3.4); p.setZ(k, -Math.pow(t, 1.8) * 1.6); }
      geo.computeVertexNormals(); return geo;
    }), F.ext(M.palm));
    frond.position.copy(top);
    frond.rotation.order = 'YXZ';
    frond.rotation.set(-0.95 - rand() * 0.35, (i / fronds) * Math.PI * 2 + rand() * 0.3, 0);
    tree.add(frond);
  }
  g.ext.add(tree);
}

function flowersMesh(kit, M, positions, rand) {
  const petal = new THREE.IcosahedronGeometry(0.055, 1);
  petal.scale(1, 0.72, 1);
  const inner = new THREE.IcosahedronGeometry(0.03, 0);
  inner.translate(0, 0.03, 0);
  const geo = kit.geo('marigold', () => {
    const a = petal;
    const merged = new THREE.BufferGeometry();
    const pos = new Float32Array(a.attributes.position.array.length + inner.attributes.position.array.length);
    pos.set(a.attributes.position.array); pos.set(inner.attributes.position.array, a.attributes.position.array.length);
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();
    inner.dispose(); petal.dispose();
    return merged;
  });
  const mesh = new THREE.InstancedMesh(geo, M.flowers, positions.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), color = new THREE.Color();
  const tones = ['#ff8a1c', '#ffa62b', '#f06b12', '#ffb93a', '#e4561a'];
  positions.forEach(([x, y, z], i) => {
    const k = 0.8 + rand() * 0.5;
    e.set(rand() * 0.4, rand() * 6, rand() * 0.4); q.setFromEuler(e); sc.set(k, k, k);
    m.compose(new THREE.Vector3(x, y, z), q, sc); mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, color.set(tones[i % tones.length]));
  });
  mesh.castShadow = false; mesh.receiveShadow = true; mesh.userData.keep = true;
  return mesh;
}

// ───────────────────────── Temporada: velas, calabazas, papel picado, ofrenda ─────────────────────────
function seasonal(kit, M, F, g, rand, candles) {
  const s = g.statics, { Z1, door } = C;
  const candle = (x, y, z, hgt = 0.16) => {
    add(s, kit.cyl(0.035, 0.038, hgt, 12), M.wax, x, y + hgt / 2, z, { cast: false });
    add(s, kit.geo('flameGeo', () => { const geo = new THREE.SphereGeometry(0.022, 10, 8); geo.scale(1, 1.9, 1); return geo; }), M.flame, x, y + hgt + 0.035, z, { cast: false, receive: false });
    candles.push(new THREE.Vector3(x, y + hgt + 0.04, z));
  };
  for (let x = -8.2; x < 2.4; x += 1.05) candle(x, 0.5, Z1 + 0.86, 0.12 + rand() * 0.1);
  for (let x = 6.7; x < 8.6; x += 0.95) candle(x, 0.5, Z1 + 0.86, 0.12 + rand() * 0.1);
  const pumpkin = (x, y, z, r, ry) => {
    const geo = kit.geo('pumpkinGeo', () => {
      const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, a = t * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 1.0, -Math.cos(a) * 0.78)); }
      const lathe = new THREE.LatheGeometry(pts, 36);
      const p = lathe.attributes.position;
      for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vz = p.getZ(i), ang = Math.atan2(vz, vx), k = 1 + 0.07 * Math.cos(ang * 8); p.setX(i, vx * k); p.setZ(i, vz * k); }
      lathe.computeVertexNormals(); return lathe;
    });
    const mesh = add(s, geo, M.pumpkin, x, y + r * 0.78, z, { scale: [r, r, r], ry });
    add(s, kit.cyl(0.02, 0.03, 0.1, 8), M.stem, x, y + r * 1.58, z, { cast: false });
    return mesh;
  };
  pumpkin(door.x - 1.65, 0, Z1 + 1.55, 0.26, Math.PI - 0.45);
  pumpkin(door.x + 1.7, 0, Z1 + 1.5, 0.21, Math.PI - 0.6);
  pumpkin(door.x - 1.25, 0, Z1 + 1.8, 0.15, Math.PI - 0.3);
  // Papel picado: tiras sobre la marquesina, la fachada y el muro del comedor.
  const papers = kit.papelPicado(['papel-naranja', 'papel-morado', 'papel-rosa', 'papel-turquesa']);
  const papelMats = papers.map((map, i) => kit.std(`papel${i}`, { map, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.7, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.18 }));
  const flags = [];
  const garland = (a, b, sag, count, parent, faded) => {
    const pa = new THREE.Vector3(...a), pb = new THREE.Vector3(...b);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count, p = pa.clone().lerp(pb, t); p.y -= Math.sin(t * Math.PI) * sag;
      const mat = faded ? F.ext(papelMats[i % 4]) : papelMats[i % 4];
      const pivot = new THREE.Group(); pivot.position.copy(p); pivot.userData.keep = true;
      pivot.lookAt(p.x - (pb.z - pa.z), p.y, p.z + (pb.x - pa.x));
      const flag = add(pivot, kit.plane(0.36, 0.42), mat, 0, -0.21, 0, { cast: false, receive: false });
      flag.userData.phase = i * 0.7; flag.userData.faded = faded;
      parent.add(pivot);
      flags.push(flag);
    }
  };
  garland([C.X0 + 0.2, 3.5, Z1 + 1.2], [2.9, 3.5, Z1 + 1.2], 0.35, 18, g.ext, true);
  garland([door.x - 1.65, 2.9, Z1 + 1.66], [door.x + 1.65, 2.9, Z1 + 1.66], 0.12, 7, g.ext, true);
  garland([C.X0 + 0.12, 3.35, 6.2], [C.X0 + 0.12, 3.35, -0.9], 0.18, 14, g.dynamic, false);
  // Ofrenda pequeña junto a la entrada interior.
  const ox = 8.15, oz = 6.0;
  add(s, kit.rbox(1.2, 0.5, 0.6, 0.02), kit.std('clothOrange', { color: '#e06a12', roughness: 0.85 }), ox, 0.25, oz);
  add(s, kit.rbox(0.9, 0.3, 0.4, 0.02), kit.std('clothPurple', { color: '#6a3270', roughness: 0.85 }), ox, 0.65, oz + 0.04);
  add(s, kit.rbox(0.6, 0.25, 0.26, 0.02), M.white, ox, 0.925, oz + 0.07);
  for (const [dx, y] of [[-0.45, 0.5], [0.45, 0.5], [-0.32, 0.8], [0.32, 0.8], [0, 1.05]]) candle(ox + dx, y, oz - 0.18, 0.14);
  pumpkin(ox - 0.1, 1.05, oz + 0.1, 0.12, Math.PI);
  const local = [];
  for (let i = 0; i < 26; i++) local.push([ox - 0.55 + rand() * 1.1, 0.53 + rand() * 0.04, oz - 0.25 + rand() * 0.15]);
  g.flowers.push(...local);
  return flags;
}

// ───────────────────────── Texturas con datos reales ─────────────────────────
function screens(kit) {
  const pos = kit.canvasTex('posScreen', 256, 168, (ctx, w, h) => {
    ctx.fillStyle = '#150c10'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c0111c'; ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = '#fff0df'; ctx.font = '700 17px Figtree, sans-serif'; ctx.fillText('BURGER SHOT · CAJA', 12, 21);
    ctx.fillStyle = 'rgba(255,240,223,.14)';
    for (let i = 0; i < 4; i++) ctx.fillRect(12, 44 + i * 22, w * 0.56, 14);
    ctx.fillStyle = '#ff891c'; ctx.fillRect(w * 0.64, 44, w * 0.3, h - 60);
  }, { wrap: false });
  const customer = kit.canvasTex('custScreen', 128, 76, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5c0a12'); gr.addColorStop(1, '#c0111c');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd48a'; ctx.font = '800 15px Fraunces, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('¡Bienvenido!', w / 2, h / 2 + 5);
  }, { wrap: false });
  const notes = kit.canvasTex('notes', 384, 196, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const papers = [['#fff4d6', 24, 18, -0.06], ['#ffe0e3', 140, 26, 0.05], ['#e5f3ff', 262, 14, -0.03], ['#fff4d6', 70, 108, 0.04], ['#f0ffe6', 210, 104, -0.05]];
    for (const [c, x, y, r] of papers) {
      ctx.save(); ctx.translate(x + 50, y + 36); ctx.rotate(r); ctx.fillStyle = c; ctx.fillRect(-50, -36, 100, 72);
      ctx.fillStyle = 'rgba(60,40,30,.45)'; for (let i = 0; i < 4; i++) ctx.fillRect(-38, -18 + i * 12, 64 - i * 8, 4);
      ctx.fillStyle = '#c0111c'; ctx.beginPath(); ctx.arc(0, -30, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }, { wrap: false });
  return {
    pos: kit.basic('posScreenMat', { map: pos, toneMapped: false }),
    customer: kit.basic('custScreenMat', { map: customer, toneMapped: false }),
    notes: kit.std('notesMat', { map: notes, transparent: true, alphaTest: 0.1, roughness: 0.9 })
  };
}

/* Tableros del menú: productos y precios reales del catálogo cargado (nunca valores de ejemplo). */
function menuBoards(kit, M, g, logoUrl) {
  const W = 1536, H = 384;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const base = new THREE.CanvasTexture(canvas); base.colorSpace = THREE.SRGBColorSpace; base.anisotropy = kit.aniso;
  kit.track(base);
  const panels = 4, maps = [];
  for (let i = 0; i < panels; i++) {
    const t = base.clone(); t.repeat.set(1 / panels, 1); t.offset.set(i / panels, 0); kit.track(t); maps.push(t);
    const mat = kit.basic(`menuPanel${i}`, { map: t, toneMapped: false, color: '#e9e1d8' });
    const x = -6.0 + i * 2.55, y = 3.32, z = C.Z0 + 0.07;
    add(g.statics, kit.rbox(2.5, 0.8, 0.06, 0.02, 1), M.black, x, y, C.Z0 + 0.03, { cast: false, rx: -0.12 });
    add(g.statics, kit.plane(2.4, 0.72), mat, x, y, z, { cast: false, receive: false, rx: -0.12 });
  }
  const images = new Map(), logo = new Image(); logo.src = logoUrl;
  let last = null, pending = 0;
  const cats = [['combos', 'Combos'], ['individuales', 'Individuales'], ['extras', 'Extras'], ['cajas', 'Cajas felices']];
  function draw(products, money, photoKey) {
    const pw = W / panels;
    ctx.fillStyle = '#120a0d'; ctx.fillRect(0, 0, W, H);
    cats.forEach(([key, label], i) => {
      const x0 = i * pw, rows = (products || []).filter(p => p.active && p.category === key).slice(0, 4);
      const gr = ctx.createLinearGradient(x0, 0, x0, H); gr.addColorStop(0, '#2a0c12'); gr.addColorStop(1, '#120a0d');
      ctx.fillStyle = gr; ctx.fillRect(x0 + 6, 6, pw - 12, H - 12);
      ctx.fillStyle = '#c0111c'; ctx.fillRect(x0 + 6, 6, pw - 12, 58);
      ctx.fillStyle = '#fff0df'; ctx.font = '800 34px Fraunces, Georgia, serif'; ctx.textAlign = 'left'; ctx.fillText(label, x0 + 22, 47);
      if (!rows.length) {
        if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, x0 + pw / 2 - 110, 100, 220, 185);
        return;
      }
      rows.forEach((p, r) => {
        const y = 78 + r * 74, key2 = photoKey ? photoKey(p) : '';
        if (key2) {
          let img = images.get(key2);
          if (!img) { img = new Image(); pending++; img.onload = img.onerror = () => { pending--; if (!pending && last) draw(...last); }; img.src = `assets/menu/thumb/${key2}.webp`; images.set(key2, img); }
          if (img.complete && img.naturalWidth) ctx.drawImage(img, x0 + 18, y + 4, 96, 64);
        }
        ctx.fillStyle = '#fff0df'; ctx.font = '700 25px Figtree, sans-serif';
        const name = String(p.name), max = pw - 270;
        let text = name; while (ctx.measureText(text).width > max && text.length > 4) text = text.slice(0, -2);
        ctx.fillText(text === name ? name : text + '…', x0 + 128, y + 44);
        ctx.fillStyle = '#ffb347'; ctx.font = '800 27px Figtree, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(money ? money(p.price) : '', x0 + pw - 22, y + 44); ctx.textAlign = 'left';
      });
    });
    base.needsUpdate = true; maps.forEach(t => { t.needsUpdate = true; });
  }
  logo.onload = () => { if (last) draw(...last); };
  return {
    update(products, money, photoKey) {
      last = [products, money, photoKey];
      if (document.fonts?.ready) document.fonts.ready.then(() => draw(...last)); else draw(...last);
    }
  };
}

export function buildRestaurant(kit, { logoUrl, season = true, quality = 'medium' } = {}) {
  const rand = rng(20261031);
  const M = materials(kit, logoUrl), F = fader(kit), S = screens(kit);
  const root = new THREE.Group(); root.name = 'restaurant';
  const g = { statics: new THREE.Group(), ext: new THREE.Group(), int: new THREE.Group(), dynamic: new THREE.Group(), flowers: [] };
  g.dynamic.userData.keep = true;
  Object.entries(g).forEach(([k, v]) => { if (v.isObject3D) { v.name = k; root.add(v); } });
  const lightSpots = [], candles = [], extLoose = [];

  shell(kit, M, F, g);
  const door = doors(kit, M, F, g, extLoose);
  counter(kit, M, g, S);
  kitchen(kit, M, g, rand);
  staffRoom(kit, M, g, S.notes);
  const posters = ['combo-burger', 'burger', 'happybox'].map(k => kit.std(`poster:${k}`, { map: kit.imageTex(`assets/menu/webp/${k}.webp`), roughness: 0.5 }));
  dining(kit, M, g, posters);
  exterior(kit, M, F, g, rand, lightSpots);
  const flags = season ? seasonal(kit, M, F, g, rand, candles) : [];
  const menu = menuBoards(kit, M, g, logoUrl);
  if (g.flowers.length) g.dynamic.add(flowersMesh(kit, M, g.flowers, rand));

  // Sombras de contacto bajo el mobiliario principal (suavizan el contacto con el suelo).
  const blob = (x, z, sx, sz) => add(g.statics, kit.plane(1, 1), M.blob, x, 0.006, z, { cast: false, receive: false, rx: -Math.PI / 2, scale: [sx, sz, 1] });
  blob(C.counter.x0 / 2 + C.counter.x1 / 2, C.counter.z + 0.1, 10, 1.6);
  for (const zc of [0.9, 3.05, 5.2]) blob(-7.75, zc, 2.6, 2.4);
  for (const tx of [-3.8, -1.0]) for (const tz of [1.55, 3.85]) blob(tx, tz, 2.0, 2.0);
  blob(-2.6, -5.8, 12, 1.6);

  // Halos de las velas (sprites aditivos, siempre de frente a la cámara).
  const flameSprites = [];
  const spriteMat = kit.mat('candleSprite', () => new THREE.SpriteMaterial({ map: kit.glow(), color: '#ff9a3a', transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  candles.forEach((p, i) => { const sp = new THREE.Sprite(spriteMat); sp.position.copy(p); sp.scale.setScalar(0.22); sp.userData.phase = i * 1.37; g.dynamic.add(sp); flameSprites.push(sp); });
  for (const p of lightSpots) { const sp = new THREE.Sprite(kit.mat('lampSprite', () => new THREE.SpriteMaterial({ map: kit.glow(), color: '#ffd7a0', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))); sp.position.set(p.pos[0], p.pos[1] + 0.28, p.pos[2]); sp.scale.setScalar(1.3); g.ext.add(sp); }

  // Volúmenes invisibles para seleccionar zonas con el puntero.
  const picks = [];
  const proxy = (kind, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(kit.box(w, h, d), kit.basic('pickProxy', { visible: false }));
    m.position.set(x, y, z); m.userData.pick = kind; m.userData.keep = true; root.add(m); picks.push(m); return m;
  };
  proxy('door', 3.0, 3.0, 1.6, C.door.x, 1.5, C.Z1 + 0.4);
  proxy('counter', 9.6, 1.5, 1.3, (C.counter.x0 + C.counter.x1) / 2, 0.75, C.counter.z);
  proxy('kitchen', 13, 2.4, 3.0, -2.4, 1.2, -5.0);
  proxy('staff', 4.2, 2.0, 3.6, 6.85, 1.0, -4.6);
  proxy('dining', 9.5, 1.2, 6.0, -3.2, 0.6, 3.3);

  // Fusión de lo estático: pocas llamadas de dibujo en lugar de cientos.
  kit.batch(g.statics);
  kit.batch(g.ext);
  kit.batch(g.int);

  const extMaterials = F.list.filter(m => m.userData.stage === 'exterior');
  const intMaterials = F.list.filter(m => m.userData.stage === 'interior');
  const applyFade = (mat, k) => {
    const base = mat.userData.baseOpacity;
    mat.opacity = base * k;
    mat.transparent = mat.userData.baseTransparent || k < 0.999;
    mat.depthWrite = k >= 0.999 ? mat.userData.baseDepthWrite : false;
  };
  let stageMix = -1;
  const stage = {
    set(m) {
      if (m === stageMix) return; stageMix = m;
      for (const mat of extMaterials) applyFade(mat, 1 - m);
      for (const mat of intMaterials) applyFade(mat, m);
      g.ext.visible = m < 0.999; g.int.visible = m > 0.001;
      for (const mesh of extLoose) mesh.visible = m < 0.999;
      for (const f of flags) if (f.userData.faded) f.visible = m < 0.999;
    }
  };
  stage.set(0);

  let neon = 1;
  return {
    root, door, stage, picks, menu, lightSpots,
    anchors: Object.fromEntries(Object.entries(ANCHORS).map(([k, v]) => [k, new THREE.Vector3(...v)])),
    setNeon(v) {
      neon = v;
      const lit = new Set([M.neon, M.neonGlow, M.halo, M.logo, M.bulb]);
      for (const mat of extMaterials) if (lit.has(mat.userData.source) && mat.userData.baseColor) mat.color.copy(mat.userData.baseColor).multiplyScalar(mat.userData.source === M.logo ? 0.35 + 0.65 * v : 0.12 + 0.88 * v);
    },
    update(t, still) {
      if (still) return;
      for (const sp of flameSprites) { const f = 0.85 + Math.sin(t * 9 + sp.userData.phase) * 0.08 + Math.sin(t * 23 + sp.userData.phase * 2) * 0.05; sp.scale.setScalar(0.22 * f); }
      for (const f of flags) if (f.visible) f.rotation.x = Math.sin(t * 1.7 + f.userData.phase) * 0.14;
      return neon;
    }
  };
}
