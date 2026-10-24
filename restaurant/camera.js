/* Burger Shot 3D · RestaurantCamera y RestaurantEntranceTransition.
   Cámara de tres cuartos en coordenadas esféricas alrededor de un objetivo, con límites estrictos,
   amortiguación y transiciones. Nunca gira libremente: el usuario no puede perder el restaurante de vista. */
import * as THREE from 'three';

export const EASE = {
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  linear: t => t
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const view = v => ({ target: new THREE.Vector3(...(v.target.isVector3 ? v.target.toArray() : v.target)), az: v.az, pol: v.pol, dist: v.dist, fov: v.fov ?? 30 });
const copyState = (dst, src) => { dst.target.copy(src.target); dst.az = src.az; dst.pol = src.pol; dst.dist = src.dist; dst.fov = src.fov; };

export function positionOf(state, out = new THREE.Vector3()) {
  const s = Math.sin(state.pol);
  return out.set(s * Math.sin(state.az), Math.cos(state.pol), s * Math.cos(state.az)).multiplyScalar(state.dist).add(state.target);
}

export class CameraRig {
  constructor(camera, element) {
    this.camera = camera; this.el = element;
    this.cur = view({ target: [0, 0, 0], az: 0, pol: 1, dist: 20, fov: 30 });
    this.goal = view({ target: [0, 0, 0], az: 0, pol: 1, dist: 20, fov: 30 });
    this.limits = null; this.home = null; this.tween = null; this.path = null;
    this.enabled = true; this.moving = true;
    this.pointers = new Map(); this.drag = null; this.pinch = null;
    this.onTap = null; this.onHover = null; this.onInteract = null;
    this._look = new THREE.Vector3(); this._pos = new THREE.Vector3();
    this.bind();
  }

  setLimits(limits) { this.limits = limits; this.clamp(this.goal); }
  setHome(v) { this.home = view(v); }

  snap(v) {
    this.tween = null; this.path = null;
    const s = view(v); copyState(this.cur, s); copyState(this.goal, s); this.clamp(this.goal); copyState(this.cur, this.goal);
    this.apply(); this.moving = true;
  }

  animateTo(v, duration = 1.2, easing = 'inOut') {
    const to = view(v); this.clamp(to, true);
    if (duration <= 0) { this.snap(to); return Promise.resolve(); }
    const from = view(this.cur);
    this.path = null;
    return new Promise(resolve => { this.tween = { from, to, t: 0, duration, easing: EASE[easing] || EASE.inOut, resolve }; });
  }

  /* Recorrido de cámara libre (por ejemplo, atravesar la puerta). Termina exactamente en `final`. */
  playPath({ points, looks, duration = 3.5, easing = 'inOut', fovs = null, final, onProgress }) {
    const end = view(final);
    const pts = [...points.map(p => new THREE.Vector3(...p)), positionOf(end)];
    const lks = [...looks.map(p => new THREE.Vector3(...p)), end.target.clone()];
    this.tween = null;
    return new Promise(resolve => {
      this.path = {
        pos: new THREE.CatmullRomCurve3(pts, false, 'centripetal'),
        look: new THREE.CatmullRomCurve3(lks, false, 'centripetal'),
        fovs: fovs || [this.camera.fov, end.fov], t: 0, duration, easing: EASE[easing] || EASE.inOut, end, onProgress, resolve
      };
    });
  }

  finish() {
    if (this.path) { const p = this.path; this.path = null; this.snap(p.end); p.onProgress?.(1); p.resolve(); }
    if (this.tween) { const t = this.tween; this.tween = null; this.snap(t.to); t.resolve(); }
  }

  get busy() { return Boolean(this.tween || this.path); }

  zoomBy(factor) { if (!this.enabled || this.busy) return; this.goal.dist *= factor; this.clamp(this.goal); this.onInteract?.(); }
  rotateBy(da, dp = 0) { if (!this.enabled || this.busy) return; this.goal.az += da; this.goal.pol += dp; this.clamp(this.goal); this.onInteract?.(); }
  panBy(dx, dz) {
    if (!this.enabled || this.busy) return;
    const a = this.goal.az, right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), fwd = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a));
    this.goal.target.addScaledVector(right, dx).addScaledVector(fwd, dz); this.clamp(this.goal); this.onInteract?.();
  }
  reset(duration = 0.9) { if (this.home) return this.animateTo(this.home, duration); return Promise.resolve(); }

  clamp(s, soft = false) {
    const l = this.limits; if (!l) return s;
    s.az = clamp(s.az, l.az[0], l.az[1]);
    s.dist = clamp(s.dist, l.dist[0], l.dist[1]);
    s.pol = clamp(s.pol, l.pol[0], l.pol[1]);
    if (l.box && !soft) { s.target.x = clamp(s.target.x, l.box[0], l.box[1]); s.target.z = clamp(s.target.z, l.box[2], l.box[3]); }
    if (l.minY != null) {
      const need = (l.minY - s.target.y) / s.dist;
      if (need > -1 && need < 1) s.pol = Math.min(s.pol, Math.acos(clamp(need, -1, 1)));
    }
    return s;
  }

  update(dt) {
    let moving = false;
    if (this.path) {
      const p = this.path; p.t = Math.min(1, p.t + dt / p.duration);
      const u = p.easing(p.t);
      p.pos.getPoint(u, this._pos); p.look.getPoint(u, this._look);
      this.camera.position.copy(this._pos); this.camera.lookAt(this._look);
      const fov = p.fovs[0] + (p.fovs[1] - p.fovs[0]) * u;
      if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
      p.onProgress?.(p.t);
      if (p.t >= 1) { this.path = null; this.snap(p.end); p.resolve(); }
      return true;
    }
    if (this.tween) {
      const w = this.tween; w.t = Math.min(1, w.t + dt / w.duration);
      const k = w.easing(w.t);
      this.cur.target.lerpVectors(w.from.target, w.to.target, k);
      this.cur.az = w.from.az + (w.to.az - w.from.az) * k;
      this.cur.pol = w.from.pol + (w.to.pol - w.from.pol) * k;
      this.cur.dist = w.from.dist + (w.to.dist - w.from.dist) * k;
      this.cur.fov = w.from.fov + (w.to.fov - w.from.fov) * k;
      copyState(this.goal, this.cur);
      if (w.t >= 1) { this.tween = null; copyState(this.goal, w.to); copyState(this.cur, w.to); w.resolve(); }
      moving = true;
    } else {
      const k = 1 - Math.exp(-9 * dt), c = this.cur, g = this.goal;
      const d = Math.abs(g.az - c.az) + Math.abs(g.pol - c.pol) + Math.abs(g.dist - c.dist) * 0.05 + c.target.distanceTo(g.target) + Math.abs(g.fov - c.fov) * 0.01;
      if (d > 1e-4) {
        c.target.lerp(g.target, k); c.az += (g.az - c.az) * k; c.pol += (g.pol - c.pol) * k; c.dist += (g.dist - c.dist) * k; c.fov += (g.fov - c.fov) * k;
        moving = true;
      }
    }
    if (moving || this.moving) this.apply();
    this.moving = moving;
    return moving;
  }

  apply() {
    positionOf(this.cur, this.camera.position);
    this.camera.lookAt(this.cur.target);
    if (Math.abs(this.camera.fov - this.cur.fov) > 0.01) { this.camera.fov = this.cur.fov; this.camera.updateProjectionMatrix(); }
  }

  // ── Entrada: ratón, táctil, rueda y teclado ──
  bind() {
    const el = this.el, on = (type, fn, opts) => { el.addEventListener(type, fn, opts); (this.listeners ||= []).push([type, fn, opts]); };
    on('contextmenu', e => e.preventDefault());
    on('pointerdown', e => {
      el.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) this.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), rotate: e.button === 2 || e.shiftKey, moved: 0 };
      if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; this.drag = null; }
    });
    on('pointermove', e => {
      if (!this.pointers.has(e.pointerId)) { this.onHover?.(e.clientX, e.clientY); return; }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (this.pinch.d > 0) this.zoomBy(this.pinch.d / Math.max(1, d));
        this.panPixels(mx - this.pinch.mx, my - this.pinch.my);
        Object.assign(this.pinch, { d, mx, my });
        return;
      }
      const d = this.drag; if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.sx, e.clientY - d.sy));
      if (d.moved < 4) return;
      el.classList.add('is-dragging');
      if (d.rotate) this.rotateBy(-dx * 0.006, -dy * 0.003); else this.panPixels(dx, dy);
    });
    const up = e => {
      const d = this.drag;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (d && this.pointers.size === 0) {
        this.drag = null; el.classList.remove('is-dragging');
        if (e.type === 'pointerup' && d.moved < 6 && performance.now() - d.t < 600 && e.button !== 2) this.onTap?.(e.clientX, e.clientY);
      }
    };
    on('pointerup', up); on('pointercancel', up);
    on('pointerleave', () => this.onHover?.(null, null));
    on('wheel', e => {
      if (!this.enabled) return;
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      this.zoomBy(Math.exp(clamp(delta, -240, 240) * 0.0014));
    }, { passive: false });
    on('keydown', e => {
      if (!this.enabled || e.altKey || e.ctrlKey || e.metaKey) return;
      const step = this.goal.dist * 0.06, k = e.key;
      const map = {
        ArrowLeft: () => this.panBy(-step, 0), ArrowRight: () => this.panBy(step, 0), ArrowUp: () => this.panBy(0, step), ArrowDown: () => this.panBy(0, -step),
        '+': () => this.zoomBy(0.88), '=': () => this.zoomBy(0.88), '-': () => this.zoomBy(1.14), _: () => this.zoomBy(1.14),
        q: () => this.rotateBy(0.12), Q: () => this.rotateBy(0.12), e: () => this.rotateBy(-0.12), E: () => this.rotateBy(-0.12),
        '0': () => this.reset(), Home: () => this.reset()
      };
      if (map[k]) { e.preventDefault(); map[k](); }
    });
  }

  panPixels(dx, dy) {
    const h = this.el.clientHeight || 600, scale = 2 * this.goal.dist * Math.tan(THREE.MathUtils.degToRad(this.goal.fov / 2)) / h;
    this.panBy(-dx * scale, dy * scale / Math.max(0.45, Math.cos(this.goal.pol)));
  }

  dispose() { for (const [type, fn, opts] of this.listeners || []) this.el.removeEventListener(type, fn, opts); this.listeners = []; }
}
