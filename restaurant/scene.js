/* Burger Shot 3D · escena principal.
   Se carga bajo demanda con import() desde restaurant.js. Solo dibuja y comunica selecciones:
   no conoce importes, permisos ni Supabase. */
import * as THREE from 'three';
import { Kit } from './kit.js?v=13.0.0';
import { buildRestaurant, VIEWS, SLOTS, LAYOUT, SERVICE, serviceRoute } from './building.js?v=13.0.0';
import { hashString } from './kit.js?v=13.0.0';
import { setupLighting } from './lighting.js?v=13.0.0';
import { CameraRig, positionOf } from './camera.js?v=13.0.0';
import { AvatarFactory } from './avatars.js?v=13.0.0';

const LIMITS = {
  exterior: { az: [-0.95, -0.25], pol: [1.1, 1.42], dist: [16, 36], box: [-3, 5, 2.5, 9], minY: 1.6 },
  interior: { az: [0.22, 1.1], pol: [0.62, 1.12], dist: [7.2, 33], box: [-7.5, 7.5, -5.6, 6.2], minY: 4.2 }
};
const MAX_PEOPLE = { high: 14, medium: 12, low: 8 };
const ZONES = { counter: ['counter', 'kitchen', 'staff'], floor: ['kitchen', 'staff'], away: ['staff', 'dining'] };
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = t => t * t * (3 - 2 * t);

export function supported() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export async function mount(host, opts = {}) {
  const quality = opts.quality || 'medium';
  const still = () => Boolean(opts.reduced?.());
  const canvas = document.createElement('canvas');
  canvas.className = 'rs-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-roledescription', 'escena 3D');
  canvas.setAttribute('aria-label', 'Restaurante Burger Shot en 3D. Flechas para desplazarte, más y menos para acercar, Q y E para girar, 0 para restablecer.');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', powerPreference: quality === 'low' ? 'low-power' : 'high-performance', stencil: false });
  } catch (error) { const e = new Error('WebGL no disponible'); e.cause = error; e.code = 'webgl'; throw e; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = quality !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const dprCap = { high: 2, medium: 1.5, low: 1 }[quality] || 1.5;
  let dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  renderer.setPixelRatio(dpr);
  host.append(canvas);

  const scene = new THREE.Scene();
  const kit = new Kit(renderer, quality);
  scene.background = kit.sky();
  scene.fog = new THREE.Fog('#1a0b17', 34, 82);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 170);

  const building = buildRestaurant(kit, { logoUrl: opts.logoUrl || 'assets/logo/burgershot-3d-512.webp', season: opts.season !== false, quality });
  scene.add(building.root);
  const lighting = setupLighting(scene, renderer, { quality, lamps: building.lightSpots });
  const rig = new CameraRig(camera, canvas);
  const factory = new AvatarFactory(kit);
  if (opts.debug) window.__burgerScene = { scene, camera, renderer, rig, building, avatars: () => avatars, served: () => served };

  // Brillo de invitación en la puerta y resalte del mostrador.
  const doorGlow = new THREE.Mesh(kit.plane(LAYOUT.door.w, LAYOUT.door.h), new THREE.MeshBasicMaterial({ color: '#ffb76a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  doorGlow.position.set(LAYOUT.door.x, LAYOUT.door.h / 2, LAYOUT.Z1 + 0.12); scene.add(doorGlow);
  const counterGlow = new THREE.Mesh(kit.box(9.5, 1.12, 0.98), new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  counterGlow.position.set((LAYOUT.counter.x0 + LAYOUT.counter.x1) / 2, 0.56, LAYOUT.counter.z); scene.add(counterGlow);
  kit.track(doorGlow.material); kit.track(counterGlow.material);

  let stage = 'exterior', mix = 0, doorT = 0, active = true, raf = 0, last = performance.now(), time = 0, disposed = false;
  let frameDirty = true, shadowDirty = true, hover = null, avatarsShown = false, adaptive = { sum: 0, n: 0 };
  const avatars = new Map(), places = new Map();
  let people = [], selected = null;

  // En pantallas verticales se aleja un poco la cámara, sin llegar a empequeñecer el local: el resto se recorre arrastrando.
  const aspectFactor = () => { const a = camera.aspect || 1.6; return a < 1.45 ? Math.min(1.3, Math.pow(1.45 / a, 0.8)) : 1; };
  const fit = v => ({ ...v, dist: v.dist * aspectFactor() });
  const limitsFor = name => { const l = LIMITS[name]; return { ...l, dist: [l.dist[0], l.dist[1] * aspectFactor()] }; };

  function setMix(m) { mix = m; building.stage.set(m); lighting.setStage(m); scene.fog.near = 34 + m * 10; scene.fog.far = 82 + m * 18; frameDirty = true; }
  function setDoor(t) { doorT = t; building.door.set(t); frameDirty = true; }

  setMix(0);
  rig.setLimits(limitsFor('exterior'));
  rig.setHome(fit(VIEWS.exterior));
  rig.snap(fit(VIEWS.exterior));
  building.setNeon(1);

  // ── Tamaño y calidad adaptativa ──
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const name = stage === 'exterior' || stage === 'entering' ? 'exterior' : 'interior';
    if (!rig.busy) { rig.setLimits(limitsFor(name)); rig.setHome(fit(name === 'exterior' ? VIEWS.exterior : VIEWS.overview)); }
    frameDirty = true;
  };
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
  ro?.observe(host); window.addEventListener('resize', resize);
  resize();

  // ── Selección con el puntero ──
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(x, y) {
    const r = canvas.getBoundingClientRect(); if (!r.width) return null;
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (stage === 'interior') {
      const hit = ray.intersectObjects([...avatars.values()].filter(a => !a.leaving).map(a => a.proxy), false)[0];
      if (hit) return { kind: 'avatar', uid: hit.object.userData.uid };
    }
    const allowed = stage === 'exterior' ? ['door'] : stage === 'interior' ? ['counter', 'kitchen', 'staff', 'dining', 'door'] : [];
    const hit = ray.intersectObjects(building.picks.filter(p => allowed.includes(p.userData.pick)), false)[0];
    if (!hit) return null;
    const kind = hit.object.userData.pick;
    return { kind: stage === 'interior' && kind === 'door' ? 'entrance' : kind };
  }
  rig.onTap = (x, y) => { const p = pickAt(x, y); opts.onPick?.(p); };
  let hoverQueued = null;
  rig.onHover = (x, y) => { hoverQueued = x == null ? { none: true } : { x, y }; };
  rig.onInteract = () => { frameDirty = true; opts.onInteract?.(); };

  // ── Personajes ──
  function freeSlot(zone, uid) {
    const list = SLOTS[zone] || [];
    for (let i = 0; i < list.length; i++) {
      const taken = [...places.entries()].some(([id, p]) => id !== uid && p.zone === zone && p.index === i);
      if (!taken) return i;
    }
    return -1;
  }
  function assign(person) {
    const prefs = ZONES[person.zone] || ZONES.floor, current = places.get(person.uid);
    if (current && prefs.includes(current.zone) && (current.zone === prefs[0] || freeSlot(prefs[0], person.uid) < 0)) return current;
    for (const zone of prefs) { const i = freeSlot(zone, person.uid); if (i >= 0) return { zone, index: i }; }
    return current || null;
  }
  function syncAvatars() {
    if (!avatarsShown) return;
    const max = MAX_PEOPLE[quality] || 12, shown = people.slice(0, max), ids = new Set(shown.map(p => p.uid));
    for (const [uid, a] of avatars) if (!ids.has(uid) && !a.leaving) { a.leave(); places.delete(uid); }
    shown.forEach((person, order) => {
      const place = assign(person); if (!place) return;
      const slot = SLOTS[place.zone][place.index];
      let a = avatars.get(person.uid);
      const prev = places.get(person.uid);
      places.set(person.uid, place);
      if (!a || a.leaving && !a.nextSlot) {
        if (a) { scene.remove(a.root); a.dispose(); }
        a = factory.create(person.uid, { self: person.self });
        // Con sombras estáticas, los personajes solo usan su sombra de contacto (evita sombras «fantasma» al caminar).
        if (quality !== 'high') a.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
        a.setPlace(slot); a.spawnT = still() ? 1 : -order * 0.12;
        avatars.set(person.uid, a); scene.add(a.root);
      } else if (!prev || prev.zone !== place.zone || prev.index !== place.index) a.relocate(slot);
      a.setSelected(person.uid === selected);
      const activity = person.activity || '';
      if (activity === 'deliver' && a.activity !== 'deliver') startDelivery(a);
      a.activity = activity;
    });
    shadowDirty = true; frameDirty = true;
    return { shown: shown.length, overflow: Math.max(0, people.length - shown.length) };
  }

  // ── Reparto: el personaje lleva el pedido a una mesa y deja la bandeja servida un rato ──
  const served = [];
  function startDelivery(a) {
    const tables = SERVICE.tables, table = tables[hashString(`${a.uid}:${Math.floor(Date.now() / 4000)}`) % tables.length];
    const from = a.home || { x: a.root.position.x, z: a.root.position.z };
    const route = serviceRoute(from, table);
    if (route) route.face = table.dir;
    a.deliver(route, {
      still: still(),
      back: home => { const r = serviceRoute(home || from, table); return r ? r.reverse() : null; },
      arrive: () => serve(table)
    });
  }
  function serve(table) {
    const tray = factory.tray();
    tray.position.set(table.top[0] + (Math.random() - 0.5) * 0.2, table.top[1], table.top[2] + (Math.random() - 0.5) * 0.15);
    tray.rotation.y = Math.random() * 0.6 - 0.3;
    scene.add(tray); served.push({ tray, t: 28 });
    while (served.length > 4) scene.remove(served.shift().tray);
    shadowDirty = true; frameDirty = true;
  }

  // ── Proyección de anclas para las etiquetas del DOM ──
  const v3 = new THREE.Vector3();
  function project(world) {
    v3.copy(world).project(camera);
    const r = { x: (v3.x + 1) / 2, y: (1 - v3.y) / 2, visible: v3.z < 1 && v3.x > -1.05 && v3.x < 1.05 && v3.y > -1.05 && v3.y < 1.05 };
    return r;
  }
  function emitFrame() {
    if (!opts.onFrame) return;
    const w = host.clientWidth, h = host.clientHeight, anchors = {}, labels = [];
    for (const [id, p] of Object.entries(building.anchors)) { const s = project(p); anchors[id] = { x: s.x * w, y: s.y * h, visible: s.visible }; }
    for (const [uid, a] of avatars) {
      if (a.leaving && !a.nextSlot) continue;
      a.anchor.getWorldPosition(v3); const s = project(v3);
      labels.push({ uid, x: s.x * w, y: s.y * h, visible: s.visible && a.spawnT > 0.4 });
    }
    opts.onFrame({ stage, mix, anchors, labels, hover });
  }

  // ── Bucle ──
  const idleFps = quality === 'high' ? 60 : 30;
  let accum = 0;
  function frame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!active) return;
    time += dt;
    const camMoving = rig.update(dt);
    const animating = !still();
    if (hoverQueued) {
      const q = hoverQueued; hoverQueued = null;
      const p = q.none ? null : pickAt(q.x, q.y), key = p ? `${p.kind}:${p.uid || ''}` : '';
      if (key !== (hover ? `${hover.kind}:${hover.uid || ''}` : '')) {
        hover = p; canvas.style.cursor = p ? 'pointer' : '';
        for (const a of avatars.values()) a.setHovered(p?.kind === 'avatar' && p.uid === a.uid);
        opts.onHover?.(p); frameDirty = true;
      }
    }
    accum += dt;
    const transient = rig.busy || [...avatars.values()].some(a => a.spawnT < 1 || a.leaving || a.busy);
    if (!camMoving && !frameDirty && !transient && (!animating || accum < 1 / idleFps - 0.002)) return;
    accum = 0;
    building.update(time, !animating);
    if (animating) lighting.flicker(time);
    let labelsDirty = false;
    for (const [uid, a] of avatars) {
      if (a.spawnT < 0) { a.spawnT += dt / 0.55; labelsDirty = true; if (a.spawnT < 0) continue; a.spawnT = 0; }
      if (a.spawnT < 1 || a.leaving || a.busy) labelsDirty = true;
      if (!a.update(time, dt, !animating)) { scene.remove(a.root); a.dispose(); avatars.delete(uid); labelsDirty = true; shadowDirty = true; }
    }
    for (let i = served.length - 1; i >= 0; i--) {
      const s = served[i]; s.t -= dt;
      if (s.t < 0.4) s.tray.scale.setScalar(Math.max(0.001, s.t / 0.4));
      if (s.t <= 0) { scene.remove(s.tray); served.splice(i, 1); shadowDirty = true; }
    }
    // Puerta y mostrador: pistas visuales suaves.
    const doorTarget = stage === 'exterior' ? (hover?.kind === 'door' ? 0.22 : 0.07 + (animating ? Math.sin(time * 2.2) * 0.05 : 0.04)) : 0;
    const ease = animating ? Math.min(1, dt * 6) : 1;
    doorGlow.material.opacity += (doorTarget * (1 - doorT) - doorGlow.material.opacity) * ease;
    doorGlow.visible = doorGlow.material.opacity > 0.002;
    const counterTarget = stage === 'interior' && (hover?.kind === 'counter' || opts.counterOpen?.()) ? 0.1 : 0;
    counterGlow.material.opacity += (counterTarget - counterGlow.material.opacity) * (animating ? Math.min(1, dt * 8) : 1);
    counterGlow.visible = counterGlow.material.opacity > 0.002;

    if (renderer.shadowMap.enabled && (shadowDirty || (quality === 'high' && animating && avatars.size && ([...avatars.values()].some(a => a.busy) || Math.floor(time * 15) % 2 === 0)))) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
    renderer.render(scene, camera);
    if (camMoving || frameDirty || rig.busy || labelsDirty) emitFrame();
    frameDirty = false;
    // Si el equipo no da abasto durante el movimiento, se reduce la resolución antes que las funciones.
    if (camMoving || rig.busy) {
      adaptive.sum += dt; adaptive.n++;
      if (adaptive.n >= 45) {
        const avg = adaptive.sum / adaptive.n; adaptive = { sum: 0, n: 0 };
        if (avg > 0.03 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); opts.onQuality?.(dpr); }
      }
    }
  }
  raf = requestAnimationFrame(frame);

  const onLost = e => { e.preventDefault(); active = false; opts.onLost?.(); };
  canvas.addEventListener('webglcontextlost', onLost);
  const onVisibility = () => { if (!document.hidden) { last = performance.now(); frameDirty = true; } };
  document.addEventListener('visibilitychange', onVisibility);

  // ── Secuencias ──
  async function playIntro() {
    if (stage !== 'exterior') return;
    if (still()) { building.setNeon(1); rig.snap(fit(VIEWS.exterior)); frameDirty = true; return; }
    const start = { ...VIEWS.exterior, az: -0.86, pol: 1.16, dist: 36, target: [0.2, 3.2, 5.5] };
    rig.snap(fit(start));
    const flick = [[0, 0], [0.25, 0.15], [0.33, 0.02], [0.5, 0.7], [0.6, 0.25], [0.78, 1]];
    let t = 0;
    const tick = () => {
      if (disposed || stage !== 'exterior') return;
      t += 1 / 60;
      let level = 1; for (const [at, v] of flick) if (t >= at) level = v;
      building.setNeon(level); frameDirty = true;
      if (t < 0.8) setTimeout(tick, 16);
    };
    tick();
    await rig.animateTo(fit(VIEWS.exterior), 1.9, 'out');
  }

  async function enter({ skip = false } = {}) {
    if (stage === 'interior' || stage === 'entering') return;
    const quick = skip || still();
    stage = 'entering'; opts.onStage?.(stage);
    building.setNeon(1);
    rig.setLimits(null);
    if (quick) {
      rig.finish(); setDoor(1); setMix(1);
      rig.snap(fit(VIEWS.overview));
    } else {
      const d = LAYOUT.door, Z1 = LAYOUT.Z1, from = camera.position.clone(), look = rig.cur.target.clone();
      await rig.playPath({
        points: [from.toArray(), [d.x - 0.6, 2.3, Z1 + 5.6], [d.x, 1.75, Z1 + 2.2], [d.x - 0.2, 1.8, Z1 - 1.2], [d.x - 1.6, 3.6, Z1 - 4.4]],
        looks: [look.toArray(), [d.x, 1.5, Z1], [d.x - 0.4, 1.45, Z1 - 3], [-1.0, 1.1, -1.2], [-0.8, 0.7, -0.8]],
        duration: 4.1, easing: 'sine', fovs: [camera.fov, VIEWS.overview.fov], final: fit(VIEWS.overview),
        onProgress: t => { setDoor(smooth(clamp01((t - 0.16) / 0.16))); setMix(smooth(clamp01((t - 0.5) / 0.22))); }
      });
    }
    if (disposed) return;
    setDoor(1); setMix(1);
    rig.setLimits(limitsFor('interior')); rig.setHome(fit(VIEWS.overview));
    stage = 'interior';
    avatarsShown = true; syncAvatars();
    opts.onStage?.(stage);
  }

  async function exit() {
    if (stage !== 'interior') return;
    stage = 'exiting'; opts.onStage?.(stage);
    rig.setLimits(null);
    const quick = still();
    if (quick) { setMix(0); rig.snap(fit(VIEWS.exterior)); }
    else {
      const start = performance.now();
      const fade = () => { if (disposed || stage !== 'exiting') return; const t = clamp01((performance.now() - start) / 900); setMix(1 - smooth(t)); if (t < 1) requestAnimationFrame(fade); };
      fade();
      await rig.animateTo(fit(VIEWS.exterior), 1.8, 'inOut');
    }
    if (disposed) return;
    setMix(0);
    const closeStart = performance.now();
    const close = () => { if (disposed || stage !== 'exterior') return; const t = clamp01((performance.now() - closeStart) / 700); setDoor(1 - smooth(t)); if (t < 1) requestAnimationFrame(close); };
    stage = 'exterior'; rig.setLimits(limitsFor('exterior')); rig.setHome(fit(VIEWS.exterior));
    if (quick) setDoor(0); else close();
    opts.onStage?.(stage);
  }

  function focus(name) {
    if (stage !== 'interior') return Promise.resolve();
    if (name === 'avatar') return Promise.resolve();
    const v = VIEWS[name === 'entrance' ? 'entrance' : name] || VIEWS.overview;
    return rig.animateTo(fit(v), still() ? 0.25 : 1.1);
  }

  function focusAvatar(uid) {
    const a = avatars.get(uid); if (!a || stage !== 'interior') return;
    const p = a.root.position, c = rig.cur;
    return rig.animateTo({ target: [p.x, 0.9, p.z], az: c.az, pol: Math.min(c.pol, 1.0), dist: Math.min(c.dist, 12.5 * aspectFactor()), fov: c.fov }, still() ? 0.25 : 0.9);
  }

  return {
    get stage() { return stage; },
    playIntro, enter, exit, focus, focusAvatar,
    skip: () => rig.finish(),
    reset: () => rig.reset(still() ? 0.25 : 0.9),
    zoom: dir => rig.zoomBy(dir > 0 ? 0.84 : 1.19),
    rotate: dir => rig.rotateBy(dir * 0.16),
    pan: (dx, dz) => rig.panBy(dx, dz),
    setPeople(list) { people = Array.isArray(list) ? list : []; return syncAvatars() || { shown: 0, overflow: 0 }; },
    select(uid) { selected = uid || null; for (const a of avatars.values()) a.setSelected(a.uid === selected); frameDirty = true; },
    celebrate(uid) { avatars.get(uid)?.celebrate(); },
    setMenu(products, money, photoKey) { building.menu.update(products, money, photoKey); frameDirty = true; },
    setActive(v) { active = Boolean(v); if (active) { last = performance.now(); frameDirty = true; resize(); } },
    invalidate() { frameDirty = true; },
    focusCanvas() { canvas.focus({ preventScroll: true }); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf);
      ro?.disconnect(); window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      rig.dispose();
      for (const a of avatars.values()) a.dispose();
      lighting.dispose(); kit.dispose();
      renderer.dispose(); renderer.forceContextLoss?.();
      canvas.remove();
    }
  };
}

export { VIEWS, positionOf };
