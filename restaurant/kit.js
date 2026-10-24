/* Burger Shot 3D · kit compartido.
   Geometrías, materiales y texturas se crean una sola vez y se liberan juntos en dispose().
   Las texturas son procedurales (canvas) o recursos existentes del proyecto: no se descarga nada externo. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const COLORS = {
  night: '#0b050b', plum: '#1d0b1c', wine: '#230910', neon: '#ff3038', red: '#c8141f', redDeep: '#8f0d16',
  orange: '#ff891c', gold: '#ffb347', cream: '#fff0df', ink: '#1a1114'
};

export function hashString(value) {
  let h = 2166136261 >>> 0;
  for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Caja con aristas redondeadas. Adaptado de RoundedBoxGeometry de three.js (MIT). */
export function roundedBox(width, height, depth, radius = 0.03, segments = 2) {
  segments = segments * 2 + 1;
  radius = Math.min(width / 2, height / 2, depth / 2, radius);
  const base = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments).toNonIndexed();
  const positions = base.attributes.position.array, normals = base.attributes.normal.array;
  const box = new THREE.Vector3(width, height, depth).divideScalar(2).subScalar(radius);
  const p = new THREE.Vector3(), n = new THREE.Vector3(), half = 0.5 / segments;
  for (let i = 0; i < positions.length; i += 3) {
    p.fromArray(positions, i);
    n.copy(p);
    n.x -= Math.sign(n.x) * half; n.y -= Math.sign(n.y) * half; n.z -= Math.sign(n.z) * half;
    n.normalize();
    positions[i] = box.x * Math.sign(p.x) + n.x * radius;
    positions[i + 1] = box.y * Math.sign(p.y) + n.y * radius;
    positions[i + 2] = box.z * Math.sign(p.z) + n.z * radius;
    normals[i] = n.x; normals[i + 1] = n.y; normals[i + 2] = n.z;
  }
  base.attributes.position.needsUpdate = true;
  base.computeBoundingSphere();
  return base;
}

function noiseFill(ctx, w, h, base, amount, seed = 1) {
  const random = rng(seed), img = ctx.getImageData(0, 0, w, h), d = img.data;
  const c = new THREE.Color(base), r = c.r * 255, g = c.g * 255, b = c.b * 255;
  for (let i = 0; i < d.length; i += 4) {
    const k = (random() - 0.5) * amount;
    d[i] = r + k; d[i + 1] = g + k; d[i + 2] = b + k; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export class Kit {
  constructor(renderer, quality = 'medium') {
    this.renderer = renderer;
    this.quality = quality;
    this.geos = new Map(); this.mats = new Map(); this.texs = new Map(); this.extra = new Set();
    this.aniso = Math.min(quality === 'high' ? 8 : 4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
    this.texSize = quality === 'low' ? 256 : 512;
    this.loader = new THREE.TextureLoader();
  }

  track(obj) { this.extra.add(obj); return obj; }
  geo(key, make) { if (!this.geos.has(key)) this.geos.set(key, make()); return this.geos.get(key); }
  mat(key, make) { if (!this.mats.has(key)) this.mats.set(key, make()); return this.mats.get(key); }

  box(w, h, d) { return this.geo(`b:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)); }
  rbox(w, h, d, r = 0.03, s = 2) { return this.geo(`rb:${w}:${h}:${d}:${r}:${s}`, () => roundedBox(w, h, d, r, s)); }
  cyl(rt, rb, h, s = 24, open = false) { return this.geo(`c:${rt}:${rb}:${h}:${s}:${open}`, () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open)); }
  sphere(r, w = 24, h = 16) { return this.geo(`s:${r}:${w}:${h}`, () => new THREE.SphereGeometry(r, w, h)); }
  capsule(r, l, cs = 6, rs = 16) { return this.geo(`cap:${r}:${l}:${cs}:${rs}`, () => new THREE.CapsuleGeometry(r, l, cs, rs)); }
  plane(w, h) { return this.geo(`p:${w}:${h}`, () => new THREE.PlaneGeometry(w, h)); }
  torus(r, t, rs = 12, ts = 32, arc = Math.PI * 2) { return this.geo(`t:${r}:${t}:${rs}:${ts}:${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)); }

  std(key, params) { return this.mat(key, () => new THREE.MeshStandardMaterial(params)); }
  basic(key, params) { return this.mat(key, () => new THREE.MeshBasicMaterial(params)); }

  canvasTex(key, w, h, draw, { repeat = [1, 1], srgb = true, wrap = true } = {}) {
    if (this.texs.has(key)) return this.texs.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    if (wrap) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); }
    tex.anisotropy = this.aniso;
    this.texs.set(key, tex);
    return tex;
  }

  /* Variante con repetición propia que comparte el mismo lienzo. */
  repeatOf(key, base, rx, ry) {
    return this.mat(`tex:${key}:${rx}:${ry}`, () => {
      const t = base.clone();
      t.repeat.set(rx, ry); t.needsUpdate = true;
      this.extra.add(t);
      return t;
    });
  }

  imageTex(url, { srgb = true } = {}) {
    if (this.texs.has(url)) return this.texs.get(url);
    const tex = this.loader.load(url);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.aniso;
    this.texs.set(url, tex);
    return tex;
  }

  // ── Texturas procedurales ──
  terrazzo() {
    const s = this.texSize;
    return this.canvasTex('terrazzo', s, s, (ctx, w, h) => {
      noiseFill(ctx, w, h, '#bba893', 10, 7);
      const random = rng(11), chips = ['#8e7a69', '#efe4d6', '#a23b2d', '#3d2b27', '#d9a56a'];
      for (let i = 0; i < (s === 512 ? 2600 : 900); i++) {
        ctx.fillStyle = chips[Math.floor(random() * chips.length)];
        ctx.globalAlpha = 0.45 + random() * 0.5;
        const x = random() * w, y = random() * h, r = 0.6 + random() * (s / 260);
        ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + random() * 0.6), random() * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(70,50,40,.35)'; ctx.lineWidth = Math.max(1, s / 340);
      ctx.strokeRect(0, 0, w, h); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    });
  }

  quarry() {
    const s = this.texSize;
    return this.canvasTex('quarry', s, s, (ctx, w, h) => {
      ctx.fillStyle = '#3a1a15'; ctx.fillRect(0, 0, w, h);
      const n = 8, t = w / n, random = rng(3);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const k = random() * 0.14;
        ctx.fillStyle = `rgb(${Math.round(136 - k * 160)},${Math.round(42 - k * 40)},${Math.round(32 - k * 30)})`;
        ctx.fillRect(x * t + 2, y * t + 2, t - 4, t - 4);
        ctx.fillStyle = 'rgba(255,220,200,.05)'; ctx.fillRect(x * t + 2, y * t + 2, t - 4, (t - 4) * 0.35);
      }
    });
  }

  subway(tint = '#f3eee7', grout = '#c9bfb2', key = 'subway') {
    const s = this.texSize;
    return this.canvasTex(key, s, s, (ctx, w, h) => {
      ctx.fillStyle = grout; ctx.fillRect(0, 0, w, h);
      const tw = w / 4, th = h / 8;
      for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
        const ox = x * tw + (y % 2 ? tw / 2 : 0);
        const g = ctx.createLinearGradient(0, y * th, 0, y * th + th);
        g.addColorStop(0, tint); g.addColorStop(1, new THREE.Color(tint).multiplyScalar(0.9).getStyle());
        ctx.fillStyle = g; ctx.fillRect(ox + 2, y * th + 2, tw - 4, th - 4);
      }
    });
  }

  plaster(color = '#e6d7c3', key = 'plaster') {
    return this.canvasTex(key, 256, 256, (ctx, w, h) => noiseFill(ctx, w, h, color, 9, 21));
  }

  wood(color = '#6b3a22', key = 'wood') {
    const s = this.texSize;
    return this.canvasTex(key, s, s, (ctx, w, h) => {
      const random = rng(5);
      ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const y = random() * h, a = 0.05 + random() * 0.12;
        ctx.strokeStyle = random() > 0.5 ? `rgba(30,12,4,${a})` : `rgba(255,210,160,${a * 0.6})`;
        ctx.lineWidth = 0.5 + random() * 2.5;
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 60 + i) * 3);
        ctx.stroke();
      }
    });
  }

  concrete() {
    const s = this.texSize;
    return this.canvasTex('concrete', s, s, (ctx, w, h) => {
      noiseFill(ctx, w, h, '#4a4245', 22, 9);
      ctx.strokeStyle = 'rgba(15,10,12,.55)'; ctx.lineWidth = Math.max(1.5, s / 220);
      ctx.strokeRect(0, 0, w, h);
    });
  }

  asphalt() {
    const s = this.texSize;
    return this.canvasTex('asphalt', s, s, (ctx, w, h) => {
      noiseFill(ctx, w, h, '#19161a', 26, 13);
      const random = rng(17);
      for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(255,255,255,${random() * 0.07})`; ctx.fillRect(random() * w, random() * h, 2, 2); }
    });
  }

  facade() {
    return this.canvasTex('facade', 256, 256, (ctx, w, h) => {
      noiseFill(ctx, w, h, '#221519', 8, 4);
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 2, h);
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      for (let x = 2; x < w; x += 64) ctx.fillRect(x, 0, 2, h);
    });
  }

  blob() {
    return this.canvasTex('blob', 128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(0.55, 'rgba(0,0,0,.26)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, { wrap: false, srgb: false });
  }

  glow() {
    return this.canvasTex('glow', 128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, { wrap: false });
  }

  stripGlow() {
    return this.canvasTex('stripGlow', 16, 64, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, { wrap: false });
  }

  sky() {
    return this.canvasTex('sky', 4, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#07030a'); g.addColorStop(0.55, '#1c0b1d'); g.addColorStop(0.82, '#3a1222'); g.addColorStop(1, '#4c1a24');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, { wrap: false });
  }

  palmLeaf() {
    return this.canvasTex('palmLeaf', 128, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#3d4a1f'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(w / 2, 0); ctx.stroke();
      for (let y = 18; y < h - 8; y += 9) {
        const t = y / h, len = (w / 2 - 4) * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95));
        ctx.strokeStyle = `rgb(${38 + t * 20},${66 + t * 30},${26 + t * 8})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w / 2 - len, y + 22); ctx.moveTo(w / 2, y); ctx.lineTo(w / 2 + len, y + 22); ctx.stroke();
      }
    }, { wrap: false });
  }

  /* Rostro tallado de calabaza (emisivo). */
  pumpkinFace() {
    return this.canvasTex('pumpkinFace', 256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd27a';
      const tri = (x, y, s) => { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s * 0.7); ctx.lineTo(x - s, y + s * 0.7); ctx.fill(); };
      // El rostro ocupa la franja central (≈70°) para quedar en una sola cara de la calabaza.
      tri(w * 0.445, h * 0.4, 9); tri(w * 0.555, h * 0.4, 9); tri(w * 0.5, h * 0.56, 5);
      ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.68);
      for (let i = 0; i <= 8; i++) ctx.lineTo(w * (0.42 + i * 0.02), h * (i % 2 ? 0.88 : 0.72));
      ctx.lineTo(w * 0.58, h * 0.68); ctx.quadraticCurveTo(w * 0.5, h * 0.96, w * 0.42, h * 0.68); ctx.fill();
    }, { wrap: false });
  }

  /* Papel picado a partir de los SVG existentes de assets/season. */
  papelPicado(names) {
    return names.map(name => {
      const key = `papel:${name}`;
      if (this.texs.has(key)) return this.texs.get(key);
      const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
      const img = new Image();
      img.onload = () => { const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 128, 128); tex.needsUpdate = true; };
      img.src = `assets/season/${name}.svg`;
      this.texs.set(key, tex);
      return tex;
    });
  }

  /* Fusiona en una malla por material los objetos estáticos de un grupo. */
  batch(root, { castShadow = true, receiveShadow = true } = {}) {
    root.updateMatrixWorld(true);
    const groups = new Map(), remove = [];
    root.traverse(obj => {
      if (!obj.isMesh || obj.isInstancedMesh || obj.userData.keep) return;
      let skip = false; for (let p = obj.parent; p && p !== root; p = p.parent) if (p.userData.keep) skip = true;
      if (skip) return;
      const g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.applyMatrix4(obj.matrixWorld);
      const cast = obj.castShadow ?? castShadow, receive = obj.receiveShadow ?? receiveShadow;
      const key = `${obj.material.uuid}:${cast}:${receive}`;
      if (!groups.has(key)) groups.set(key, { material: obj.material, cast, receive, list: [] });
      groups.get(key).list.push(g);
      remove.push(obj);
    });
    for (const obj of remove) obj.parent.remove(obj);
    const out = new THREE.Group(); out.name = 'batched';
    const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
    for (const { material, cast, receive, list } of groups.values()) {
      const merged = mergeGeometries(list, false);
      list.forEach(g => g.dispose());
      if (!merged) continue;
      merged.applyMatrix4(inverse);
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.matrixAutoUpdate = false;
      this.extra.add(merged);
      out.add(mesh);
    }
    root.add(out);
    return out;
  }

  dispose() {
    for (const g of this.geos.values()) g.dispose?.();
    for (const m of this.mats.values()) m.dispose?.();
    for (const t of this.texs.values()) t.dispose?.();
    for (const x of this.extra) x.dispose?.();
    this.geos.clear(); this.mats.clear(); this.texs.clear(); this.extra.clear();
  }
}

/* Marca un mesh con sombras y lo coloca. */
export function place(mesh, x = 0, y = 0, z = 0, { cast = true, receive = true, ry = 0, rx = 0, rz = 0 } = {}) {
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = cast; mesh.receiveShadow = receive;
  return mesh;
}
