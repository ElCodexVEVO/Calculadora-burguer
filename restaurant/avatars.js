/* Burger Shot 3D · RestaurantAvatar.
   Personajes de cuerpo completo con articulaciones (cadera, columna, cuello, hombros, codos, rodillas).
   La apariencia se deriva del identificador del usuario: es la misma en cada render y en cada sesión.
   Las geometrías y el uniforme se comparten entre todos los personajes; solo piel y pelo varían. */
import * as THREE from 'three';
import { hashString, rng, roundedBox } from './kit.js?v=13.0.0';

const SKIN = ['#f3cfae', '#e2ae88', '#cd9066', '#ad714a', '#8c5636', '#6a3d25', '#f7dcc4', '#b97f58'];
const HAIR = ['#1a1210', '#2d1c13', '#4b2e1b', '#6b4423', '#9c673a', '#c79a5c', '#38383d', '#5a1a20'];
const STYLES = ['short', 'crop', 'ponytail', 'bun', 'long', 'buzz'];
const HEADWEAR = ['cap', 'cap', 'visor', 'none'];

const easeOutBack = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export function appearance(uid) {
  const r = rng(hashString(uid || 'burgershot'));
  const pick = list => list[Math.floor(r() * list.length) % list.length];
  return {
    skin: pick(SKIN), hair: pick(HAIR), style: pick(STYLES), headwear: pick(HEADWEAR),
    glasses: r() < 0.22, beard: r() < 0.2, height: 0.96 + r() * 0.08, build: 0.95 + r() * 0.1, phase: r() * 100
  };
}

export class AvatarFactory {
  constructor(kit) {
    this.kit = kit;
    const k = kit;
    const torsoProfile = [[0.0, 0.0], [0.135, 0.0], [0.148, 0.1], [0.162, 0.26], [0.172, 0.38], [0.168, 0.45], [0.14, 0.52], [0.075, 0.565], [0.0, 0.57]].map(([x, y]) => new THREE.Vector2(x, y));
    this.g = {
      torso: k.geo('av:torso', () => { const g = new THREE.LatheGeometry(torsoProfile, 28); g.scale(1, 1, 0.7); return g; }),
      pelvis: k.geo('av:pelvis', () => roundedBox(0.3, 0.17, 0.2, 0.06, 2)),
      thigh: k.capsule(0.074, 0.3, 6, 14), shin: k.capsule(0.06, 0.32, 6, 14),
      shoe: k.geo('av:shoe', () => roundedBox(0.115, 0.075, 0.26, 0.035, 2)),
      sole: k.geo('av:sole', () => roundedBox(0.12, 0.025, 0.27, 0.01, 1)),
      upperArm: k.capsule(0.056, 0.2, 6, 12), sleeve: k.capsule(0.068, 0.08, 6, 14), forearm: k.capsule(0.047, 0.2, 6, 12),
      hand: k.geo('av:hand', () => { const g = new THREE.SphereGeometry(0.05, 14, 10); g.scale(0.82, 1.05, 0.62); return g; }),
      neck: k.cyl(0.046, 0.052, 0.11, 14), head: k.sphere(0.118, 32, 24),
      ear: k.geo('av:ear', () => { const g = new THREE.SphereGeometry(0.03, 10, 8); g.scale(0.45, 1, 0.8); return g; }),
      nose: k.sphere(0.02, 10, 8), eye: k.sphere(0.015, 10, 8), brow: k.geo('av:brow', () => roundedBox(0.048, 0.012, 0.014, 0.005, 1)),
      hairTop: k.geo('av:hairTop', () => new THREE.SphereGeometry(0.126, 30, 16, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      hairCrop: k.geo('av:hairCrop', () => new THREE.SphereGeometry(0.123, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.46)),
      hairBack: k.geo('av:hairBack', () => new THREE.SphereGeometry(0.127, 30, 16, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.2, Math.PI * 0.5)),
      ponytail: k.capsule(0.042, 0.17, 6, 12), bun: k.sphere(0.06, 16, 12),
      longHair: k.geo('av:longHair', () => roundedBox(0.25, 0.3, 0.07, 0.035, 2)),
      beard: k.geo('av:beard', () => new THREE.SphereGeometry(0.121, 26, 12, Math.PI * -0.35, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.3)),
      capCrown: k.geo('av:capCrown', () => new THREE.SphereGeometry(0.13, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
      brim: k.geo('av:brim', () => { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.014, 28, 1, false, -Math.PI / 2, Math.PI); g.scale(1, 1, 1.35); return g; }),
      band: k.torus(0.124, 0.014, 6, 32), button: k.sphere(0.016, 8, 6),
      apron: k.geo('av:apron', () => new THREE.CylinderGeometry(0.176, 0.205, 0.38, 24, 1, true, -1.15, 2.3)),
      apronTie: k.torus(0.168, 0.012, 6, 32), collar: k.torus(0.062, 0.017, 8, 24),
      tag: k.geo('av:tag', () => roundedBox(0.065, 0.022, 0.01, 0.004, 1)),
      lens: k.torus(0.022, 0.0045, 6, 18), bridge: k.cyl(0.003, 0.003, 0.03, 6),
      ring: k.geo('av:ring', () => new THREE.RingGeometry(0.34, 0.43, 48)),
      shadow: k.plane(0.95, 0.95), proxy: k.capsule(0.3, 1.15, 4, 8)
    };
    this.m = {
      shirt: k.std('av:shirt', { color: '#b5121c', roughness: 0.62 }),
      pants: k.std('av:pants', { color: '#1c1a20', roughness: 0.72 }),
      apron: k.std('av:apron', { color: '#16121a', roughness: 0.58, side: THREE.DoubleSide }),
      trim: k.std('av:trim', { color: '#d9a23c', roughness: 0.4, metalness: 0.4 }),
      shoe: k.std('av:shoe', { color: '#ece7df', roughness: 0.5 }),
      sole: k.std('av:sole', { color: '#262224', roughness: 0.8 }),
      cap: k.std('av:cap', { color: '#c0111c', roughness: 0.55 }),
      brim: k.std('av:brim', { color: '#f2a93b', roughness: 0.5 }),
      white: k.std('av:white', { color: '#f4efe8', roughness: 0.5 }),
      eye: k.std('av:eye', { color: '#1a1312', roughness: 0.25 }),
      lens: k.std('av:lens', { color: '#2a2a2e', metalness: 0.7, roughness: 0.3 }),
      shadow: k.basic('av:shadow', { map: k.blob(), transparent: true, depthWrite: false, opacity: 0.9 }),
      hidden: k.basic('av:proxy', { visible: false }),
      tray: k.std('av:tray', { color: '#b8121c', roughness: 0.4 }),
      bun: k.std('av:bun', { color: '#d4924a', roughness: 0.6 }),
      patty: k.std('av:patty', { color: '#4a2412', roughness: 0.7 }),
      lettuce: k.std('av:lettuce', { color: '#5c9b35', roughness: 0.7 }),
      fries: k.std('av:fries', { color: '#e8b54c', roughness: 0.6 }),
      paper: k.std('av:paper', { color: '#f4efe6', roughness: 0.7 })
    };
    Object.assign(this.g, {
      trayBase: k.geo('av:trayBase', () => roundedBox(0.44, 0.022, 0.32, 0.01, 1)),
      bunTop: k.geo('av:bunTop', () => { const g = new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.7, 1); return g; }),
      bunBottom: k.cyl(0.06, 0.058, 0.022, 16), pattyDisc: k.cyl(0.062, 0.062, 0.018, 16), leaf: k.cyl(0.066, 0.066, 0.006, 16),
      carton: k.geo('av:carton', () => roundedBox(0.075, 0.095, 0.05, 0.008, 1)), fry: k.box(0.009, 0.06, 0.009),
      cup: k.cyl(0.04, 0.032, 0.13, 14), lid: k.cyl(0.042, 0.042, 0.012, 14), straw: k.cyl(0.004, 0.004, 0.09, 6)
    });
  }

  /* Bandeja con hamburguesa, papas y bebida (se usa en las manos y servida en la mesa). */
  tray() {
    const g = this.g, m = this.m, t = new THREE.Group();
    t.add(mesh(g.trayBase, m.tray, 0, 0, 0, false));
    t.add(mesh(g.bunBottom, m.bun, -0.1, 0.022, 0.02, false));
    t.add(mesh(g.leaf, m.lettuce, -0.1, 0.036, 0.02, false));
    t.add(mesh(g.pattyDisc, m.patty, -0.1, 0.048, 0.02, false));
    t.add(mesh(g.bunTop, m.bun, -0.1, 0.058, 0.02, false));
    t.add(mesh(g.carton, m.tray, 0.04, 0.058, -0.06, false));
    for (let i = 0; i < 5; i++) t.add(mesh(g.fry, m.fries, 0.017 + i * 0.012, 0.115, -0.06 + (i % 2) * 0.01, false));
    t.add(mesh(g.cup, m.paper, 0.13, 0.076, 0.05, false));
    t.add(mesh(g.lid, m.tray, 0.13, 0.145, 0.05, false));
    t.add(mesh(g.straw, m.paper, 0.14, 0.19, 0.05, false));
    return t;
  }

  skin(color) { return this.kit.std(`av:skin:${color}`, { color, roughness: 0.62 }); }
  hair(color) { return this.kit.std(`av:hair:${color}`, { color, roughness: 0.68 }); }

  create(uid, opts = {}) { return new Avatar(this, uid, opts); }
}

function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = false; return m;
}

class Avatar {
  constructor(f, uid, { self = false } = {}) {
    this.uid = uid; this.self = self; this.look = appearance(uid);
    const g = f.g, m = f.m, L = this.look, skin = f.skin(L.skin), hairMat = f.hair(L.hair);
    const root = this.root = new THREE.Group(); root.name = `avatar:${uid}`;
    const body = this.body = new THREE.Group(); root.add(body);
    body.scale.set(L.build, L.height, L.build);

    // Sombra de contacto y anillo de selección.
    const shadow = mesh(g.shadow, m.shadow, 0, 0.008, 0, false); shadow.rotation.x = -Math.PI / 2; root.add(shadow);
    this.ringMat = new THREE.MeshBasicMaterial({ color: self ? '#ffcc66' : '#ff8a3a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.ring = mesh(g.ring, this.ringMat, 0, 0.012, 0, false); this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; root.add(this.ring);

    const hips = this.hips = new THREE.Group(); hips.position.y = 0.93; body.add(hips);
    hips.add(mesh(g.pelvis, m.pants, 0, 0, 0));
    this.legs = [-1, 1].map(side => {
      const leg = new THREE.Group(); leg.position.set(side * 0.086, -0.03, 0); hips.add(leg);
      leg.add(mesh(g.thigh, m.pants, 0, -0.21, 0));
      const knee = new THREE.Group(); knee.position.y = -0.43; leg.add(knee);
      knee.add(mesh(g.shin, m.pants, 0, -0.2, 0));
      knee.add(mesh(g.shoe, m.shoe, 0, -0.43, 0.045));
      knee.add(mesh(g.sole, m.sole, 0, -0.468, 0.045, false));
      return { leg, knee };
    });
    // Delantal de cintura con ribete dorado.
    hips.add(mesh(g.apron, m.apron, 0, -0.1, 0.01));
    const tie = mesh(g.apronTie, m.trim, 0, 0.08, 0, false); tie.rotation.x = Math.PI / 2; tie.scale.set(1, 0.72, 1); hips.add(tie);

    const spine = this.spine = new THREE.Group(); spine.position.y = 0.05; hips.add(spine);
    spine.add(mesh(g.torso, m.shirt, 0, 0, 0));
    const collar = mesh(g.collar, m.white, 0, 0.555, 0, false); collar.rotation.x = Math.PI / 2; collar.scale.set(1, 0.85, 1); spine.add(collar);
    spine.add(mesh(g.tag, m.trim, 0.08, 0.4, 0.118, false));

    this.arms = [-1, 1].map(side => {
      const shoulder = new THREE.Group(); shoulder.position.set(side * 0.205, 0.47, 0); spine.add(shoulder);
      shoulder.add(mesh(g.sleeve, m.shirt, 0, -0.05, 0));
      shoulder.add(mesh(g.upperArm, skin, 0, -0.16, 0));
      const elbow = new THREE.Group(); elbow.position.y = -0.31; shoulder.add(elbow);
      elbow.add(mesh(g.forearm, skin, 0, -0.13, 0));
      elbow.add(mesh(g.hand, skin, 0, -0.29, 0.005));
      return { shoulder, elbow, side };
    });

    const neck = new THREE.Group(); neck.position.y = 0.56; spine.add(neck);
    neck.add(mesh(g.neck, skin, 0, 0.04, 0));
    const head = this.head = new THREE.Group(); head.position.y = 0.155; neck.add(head);
    const skull = mesh(g.head, skin, 0, 0, 0); skull.scale.set(0.94, 1.06, 0.98); head.add(skull);
    for (const s of [-1, 1]) {
      head.add(mesh(g.ear, skin, s * 0.112, -0.005, -0.005, false));
      head.add(mesh(g.eye, m.eye, s * 0.04, 0.012, 0.105, false));
      const brow = mesh(g.brow, hairMat, s * 0.042, 0.045, 0.104, false); brow.rotation.z = s * -0.12; head.add(brow);
    }
    head.add(mesh(g.nose, skin, 0, -0.012, 0.118, false));
    this.hair(f, head, hairMat);
    if (L.beard) { const b = mesh(g.beard, hairMat, 0, -0.012, 0.004, false); b.scale.set(0.95, 1.05, 0.99); head.add(b); }
    if (L.glasses) {
      for (const s of [-1, 1]) head.add(mesh(g.lens, m.lens, s * 0.04, 0.012, 0.112, false));
      const br = mesh(g.bridge, m.lens, 0, 0.014, 0.115, false); br.rotation.z = Math.PI / 2; head.add(br);
    }
    this.headwear(f, head, L.headwear);

    // Punto de anclaje para la etiqueta con el nombre y volumen invisible para seleccionar.
    this.anchor = new THREE.Object3D(); this.anchor.position.y = 2.06; root.add(this.anchor);
    this.proxy = mesh(g.proxy, m.hidden, 0, 0.9, 0, false); this.proxy.userData.pick = 'avatar'; this.proxy.userData.uid = uid; root.add(this.proxy);

    this.carry = f.tray(); this.carry.visible = false; this.carry.position.set(0, 1.07, 0.36); root.add(this.carry);
    this.walk = null; this.home = null; this.activity = ''; this.carryT = 0;
    this.pose = 'stand'; this.seatY = 0.5; this.spawnT = 0; this.leaving = null; this.celebrateT = -1;
    this.selected = false; this.hovered = false;
    root.scale.setScalar(0.001);
  }

  hair(f, head, mat) {
    const g = f.g, style = this.look.style;
    if (style === 'buzz') { const h = mesh(g.hairCrop, mat, 0, 0.01, -0.004, false); h.scale.set(0.96, 1.02, 1); head.add(h); return; }
    const top = mesh(style === 'crop' ? g.hairCrop : g.hairTop, mat, 0, 0.014, -0.006, false); top.scale.set(0.97, 1.05, 1.02); head.add(top);
    head.add(mesh(g.hairBack, mat, 0, 0.006, -0.008, false));
    if (style === 'ponytail') { const p = mesh(g.ponytail, mat, 0, -0.04, -0.15, false); p.rotation.x = 0.45; head.add(p); }
    if (style === 'bun') head.add(mesh(g.bun, mat, 0, 0.08, -0.11, false));
    if (style === 'long') head.add(mesh(g.longHair, mat, 0, -0.13, -0.085, false));
  }

  headwear(f, head, kind) {
    const g = f.g, m = f.m;
    if (kind === 'cap') {
      const crown = mesh(g.capCrown, m.cap, 0, 0.03, -0.004, false); crown.scale.set(0.98, 0.82, 1.02); head.add(crown);
      head.add(mesh(g.brim, m.brim, 0, 0.034, 0.118, false));
      head.add(mesh(g.button, m.cap, 0, 0.138, -0.004, false));
      const badge = mesh(g.button, m.trim, 0, 0.09, 0.122, false); badge.scale.set(1.4, 1.4, 0.5); head.add(badge);
    } else if (kind === 'visor') {
      const band = mesh(g.band, m.cap, 0, 0.045, 0, false); band.rotation.x = Math.PI / 2; band.scale.set(0.97, 1.04, 1); head.add(band);
      head.add(mesh(g.brim, m.brim, 0, 0.04, 0.118, false));
    }
  }

  setPlace(slot) {
    this.home = slot;
    this.root.position.set(slot.x, 0, slot.z);
    this.root.rotation.y = slot.dir;
    this.pose = slot.pose; this.seatY = slot.seatY ?? 0.5;
    this.anchor.position.y = slot.pose === 'seated' ? 1.66 : 2.06;
  }

  setSelected(v) { this.selected = v; }
  setHovered(v) { this.hovered = v; }
  celebrate() { this.celebrateT = 0; }

  /* Reparto: camina con la bandeja por la ruta, la deja en la mesa y vuelve a su puesto. */
  deliver(route, { back, arrive, still = false } = {}) {
    if (this.walk || this.leaving || this.pose === 'seated') return false;
    if (still || !route || route.length < 2) { this.carryT = 3; this.carry.visible = true; return true; }
    this.walk = { pts: route.map(([x, z]) => new THREE.Vector2(x, z)), i: 0, pause: 0, phase: 0, returning: false, back, arrive, face: route.face ?? 0 };
    this.carry.visible = true;
    return true;
  }
  leave() { this.nextSlot = null; if (!this.leaving) this.leaving = { t: 0 }; return this; }
  /* Cambio de zona: se retira y reaparece en el nuevo puesto (sin atravesar el mobiliario). */
  relocate(slot) {
    if (this.walk) { this.home = slot; return; }
    if (this.spawnT < 1 && !this.leaving) { this.setPlace(slot); return; }
    this.nextSlot = slot; if (!this.leaving) this.leaving = { t: 0 };
  }

  update(t, dt, still) {
    const L = this.look, p = L.phase, tt = t + p;
    // Aparición y salida.
    if (this.leaving) {
      this.leaving.t += still ? 1 : dt / 0.3;
      this.root.scale.setScalar(Math.max(0.001, 1 - EASE_OUT(this.leaving.t)));
      if (this.leaving.t >= 1) {
        if (!this.nextSlot) return false;
        this.setPlace(this.nextSlot); this.nextSlot = null; this.leaving = null; this.spawnT = 0;
      }
    } else if (this.spawnT < 1) {
      this.spawnT = still ? 1 : Math.min(1, this.spawnT + dt / 0.55);
      this.root.scale.setScalar(Math.max(0.001, easeOutBack(this.spawnT)));
    }
    // Anillo de selección.
    const ringOn = this.selected || this.hovered || this.spawnT < 1;
    this.ring.visible = ringOn;
    if (ringOn) {
      const target = this.selected ? 0.95 : this.hovered ? 0.45 : (1 - this.spawnT) * 0.9;
      this.ringMat.opacity += (target - this.ringMat.opacity) * Math.min(1, dt * 10);
      const pulse = this.selected && !still ? 1 + Math.sin(t * 3.2) * 0.04 : 1;
      this.ring.scale.setScalar(pulse * (this.spawnT < 1 ? 0.7 + this.spawnT * 0.3 : 1));
    }
    if (this.walk) { this.stepWalk(dt, still); return true; }
    if (this.carryT > 0) { this.carryT -= dt; if (this.carryT <= 0) this.carry.visible = false; }
    // Pose base.
    const seated = this.pose === 'seated';
    this.hips.position.y = seated ? this.seatY + 0.09 : 0.93;
    for (const { leg, knee } of this.legs) { leg.rotation.x = seated ? -1.5 : 0; knee.rotation.x = seated ? 1.45 : 0; }
    const forward = this.pose === 'register' ? [-0.62, -0.95] : this.pose === 'work' ? [-0.42, -0.9] : seated ? [-0.5, -0.75] : [0, 0];
    if (still) {
      for (const a of this.arms) { a.shoulder.rotation.set(forward[0], 0, a.side * 0.1); a.elbow.rotation.set(forward[1], 0, 0); }
      this.spine.scale.y = 1; this.spine.rotation.set(0, 0, 0); this.head.rotation.set(0, 0, 0);
      return true;
    }
    // Reposo: respiración, cambio de peso, mirada y manos.
    this.spine.scale.y = 1 + Math.sin(tt * 1.7) * 0.012;
    this.spine.rotation.z = Math.sin(tt * 0.55) * 0.022;
    this.spine.rotation.x = seated ? 0.06 : Math.sin(tt * 0.4) * 0.01;
    if (!seated) this.hips.position.x = Math.sin(tt * 0.55) * 0.012;
    const look = Math.sin(tt * 0.23) * Math.sin(tt * 0.11 + 1.3);
    this.head.rotation.y = look * (this.pose === 'register' ? 0.25 : 0.42);
    this.head.rotation.x = Math.sin(tt * 0.3) * 0.04 + (this.pose === 'work' ? 0.18 : 0);
    for (const a of this.arms) {
      const w = (this.pose === 'register' || this.pose === 'work') ? Math.sin(tt * (this.pose === 'work' ? 2.6 : 5.5) + a.side) * 0.06 : Math.sin(tt * 1.1 + a.side) * 0.035;
      a.shoulder.rotation.set(forward[0] + w, 0, a.side * (0.1 + Math.sin(tt * 0.8) * 0.01));
      a.elbow.rotation.set(forward[1] + w * 0.8, 0, 0);
    }
    if (this.celebrateT >= 0) {
      this.celebrateT += dt / 1.5;
      const k = Math.sin(Math.min(1, this.celebrateT) * Math.PI), arm = this.arms[1];
      arm.shoulder.rotation.set(forward[0] * (1 - k) - 2.6 * k, 0, 0.35 * k);
      arm.elbow.rotation.set(forward[1] * (1 - k) - 0.4 * k + Math.sin(t * 14) * 0.25 * k, 0, 0);
      if (this.celebrateT >= 1) this.celebrateT = -1;
    }
    return true;
  }

  stepWalk(dt, still) {
    const w = this.walk, p = this.root.position;
    const carrying = this.carry.visible;
    if (w.pause > 0) {
      w.pause -= dt;
      this.turnTo(w.face, dt);
      this.walkPose(0, carrying, true);
      if (w.pause <= 0) {
        const back = w.back?.(this.home);
        if (!back || back.length < 2) { this.endWalk(); return; }
        Object.assign(w, { pts: back.map(([x, z]) => new THREE.Vector2(x, z)), i: 0, returning: true });
      }
      return;
    }
    const a = w.pts[w.i], b = w.pts[w.i + 1];
    if (!b) {
      if (!w.returning) { this.carry.visible = false; w.arrive?.(); w.pause = 1.2; return; }
      this.endWalk(); return;
    }
    const speed = 1.6, dx = b.x - p.x, dz = b.y - p.z, dist = Math.hypot(dx, dz), step = speed * dt;
    if (dist <= step) { p.x = b.x; p.z = b.y; w.i++; }
    else { p.x += dx / dist * step; p.z += dz / dist * step; this.turnTo(Math.atan2(dx, dz), dt * 1.6); }
    w.phase += dt * speed * 5.4;
    this.walkPose(w.phase, carrying, false);
  }

  turnTo(angle, dt) {
    let d = angle - this.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.root.rotation.y += d * Math.min(1, dt * 9);
  }

  walkPose(phase, carrying, standing) {
    const s = standing ? 0 : Math.sin(phase);
    this.hips.position.set(0, 0.93 + (standing ? 0 : Math.abs(Math.cos(phase)) * 0.025), 0);
    this.legs[0].leg.rotation.x = s * 0.5; this.legs[1].leg.rotation.x = -s * 0.5;
    this.legs[0].knee.rotation.x = Math.max(0, -s) * 0.75; this.legs[1].knee.rotation.x = Math.max(0, s) * 0.75;
    this.spine.rotation.set(standing ? 0 : 0.05, 0, 0); this.spine.scale.y = 1;
    this.head.rotation.set(0, 0, 0);
    for (const arm of this.arms) {
      if (carrying) { arm.shoulder.rotation.set(-0.95, 0, arm.side * -0.18); arm.elbow.rotation.set(-0.6, 0, 0); }
      else { arm.shoulder.rotation.set(-s * arm.side * 0.4, 0, arm.side * 0.08); arm.elbow.rotation.set(-0.25, 0, 0); }
    }
    this.carry.position.y = 1.07 + (standing ? 0 : Math.abs(Math.cos(phase)) * 0.02);
  }

  endWalk() {
    this.walk = null; this.carry.visible = false;
    for (const { leg, knee } of this.legs) { leg.rotation.x = 0; knee.rotation.x = 0; }
    if (this.home) this.setPlace(this.home);
  }

  get busy() { return Boolean(this.walk); }

  dispose() { this.ringMat.dispose(); }
}

const EASE_OUT = t => 1 - Math.pow(1 - Math.min(1, t), 3);
