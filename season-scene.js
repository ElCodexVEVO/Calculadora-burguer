/* Burger Shot · escena 3D de la insignia de temporada.
   Vela, cempasúchil y calabaza modelados en Blender (design/temporada/escena_3d.py → .glb)
   y mostrados con Three.js. Se carga solo cuando la insignia es visible y el equipo puede;
   la imagen de respaldo queda debajo y sigue visible si algo falla. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL = 'assets/season/escena-temporada.glb';
const FRAME = 1000 / 30; // 30 fps bastan para una llama

export async function mount(host, { still = () => false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'season-card-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 132 / 104, 0.1, 60);
  let gltf;
  try { gltf = await new GLTFLoader().loadAsync(MODEL); }
  catch (error) { renderer.dispose(); throw error; } // sin modelo no queda contexto abierto
  const model = gltf.scene;
  const world = new THREE.Group();
  world.add(model);
  scene.add(world);

  // Encuadre: centra el modelo y aleja la cámara lo justo para que quepa con un margen.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(box.getCenter(new THREE.Vector3()));
  const half = Math.tan(THREE.MathUtils.degToRad(12));
  const fit = Math.max(size.y * 1.06 / (2 * half), size.x * 1.04 / (2 * half * camera.aspect));
  camera.position.set(0, size.y * 0.12, fit);
  camera.lookAt(0, -size.y * 0.035, 0);

  // Luz: ambiente tenue, una principal cálida, un contraluz morado muy leve y la llama.
  scene.add(new THREE.HemisphereLight(0xffe6cc, 0x2a150e, 1.25));
  const key = new THREE.DirectionalLight(0xfff1de, 2.3);
  key.position.set(-2.5, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb48cff, 0.4);
  rim.position.set(4, 2.5, -4);
  scene.add(rim);

  const flame = model.getObjectByName('Llama');
  const core = model.getObjectByName('LlamaNucleo');
  // La llama no recibe luz: degradado propio de la base naranja a la punta clara,
  // sin pasar por el mapeo de tonos. El núcleo se dibuja siempre por delante.
  if (flame) {
    const pos = flame.geometry.attributes.position;
    flame.geometry.computeBoundingBox();
    const { min, max } = flame.geometry.boundingBox;
    const stops = [new THREE.Color(0xf0741a), new THREE.Color(0xffae33), new THREE.Color(0xffe6a0)];
    const colors = new Float32Array(pos.count * 3);
    const mixed = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) - min.y) / (max.y - min.y || 1);
      if (t < 0.5) mixed.lerpColors(stops[0], stops[1], t * 2); else mixed.lerpColors(stops[1], stops[2], (t - 0.5) * 2);
      colors.set([mixed.r, mixed.g, mixed.b], i * 3);
    }
    flame.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    flame.material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  }
  if (core) {
    core.material = new THREE.MeshBasicMaterial({ color: 0xfff3cc, toneMapped: false, depthTest: false });
    core.renderOrder = 2;
  }
  const wick = model.getObjectByName('Mecha');
  if (wick) wick.material = new THREE.MeshBasicMaterial({ color: 0x2c1a10 });
  const light = new THREE.PointLight(0xffa24a, 0, 9, 2);
  const BASE_LIGHT = 14;
  if (flame) {
    flame.getWorldPosition(light.position);
    world.worldToLocal(light.position);
    light.position.y += 0.3;
    light.position.z += 0.5;
  }
  world.add(light);

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  host.append(canvas);

  // Perspectiva: el cursor inclina la escena unos grados, con amortiguación.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const target = { x: 0, y: 0 };
  let boost = 1, boostTarget = 1;
  const onMove = e => {
    if (!fine.matches) return;
    const r = host.getBoundingClientRect();
    target.y = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / 420, -1, 1) * 0.17;
    target.x = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / 420, -1, 1) * 0.07;
  };
  const card = host.closest('.season-card') || host;
  const onEnter = () => { boostTarget = 1.35; };
  const onLeave = () => { boostTarget = 1; };
  window.addEventListener('pointermove', onMove, { passive: true });
  card.addEventListener('pointerenter', onEnter);
  card.addEventListener('pointerleave', onLeave);

  const draw = seconds => {
    // Ruido irregular con tres senos: la llama respira y titila sin repetirse a la vista.
    const flick = 0.5 * Math.sin(seconds * 9.1) + 0.3 * Math.sin(seconds * 14.7 + 1.3) + 0.2 * Math.sin(seconds * 23.3 + 0.4);
    const sway = 0.5 * Math.sin(seconds * 1.7) + 0.5 * Math.sin(seconds * 0.9 + 2);
    if (flame) {
      flame.scale.set(1 + 0.05 * flick, 1 + 0.09 * sway + 0.04 * flick, 1 + 0.05 * flick);
      flame.rotation.z = 0.07 * sway + 0.03 * flick;
      flame.rotation.x = 0.04 * Math.sin(seconds * 2.3);
    }
    if (core) {
      core.scale.set(1 - 0.06 * flick, 1 + 0.1 * flick, 1 - 0.06 * flick);
      core.rotation.z = 0.05 * sway;
    }
    boost += (boostTarget - boost) * 0.12;
    light.intensity = BASE_LIGHT * (1 + 0.16 * flick + 0.08 * sway) * boost;
    world.rotation.y += (target.y - world.rotation.y) * 0.08;
    world.rotation.x += (target.x - world.rotation.x) * 0.08;
    renderer.render(scene, camera);
  };

  let visible = true, raf = 0, last = 0, alive = true;
  const active = () => alive && visible && !document.hidden && !still();
  const loop = now => {
    raf = 0;
    if (!active()) return;
    if (now - last >= FRAME) { last = now; draw(now / 1000); }
    raf = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (!alive) return;
    if (still()) { target.x = target.y = 0; world.rotation.set(0, 0, 0); draw(0.35); return; } // un fotograma quieto
    if (!raf && active()) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); wake(); });
  io.observe(host);
  const ro = new ResizeObserver(() => { resize(); if (!raf) draw(performance.now() / 1000); });
  ro.observe(host);
  document.addEventListener('visibilitychange', wake);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', wake);
  const bodyWatch = new MutationObserver(wake);
  bodyWatch.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  const dispose = () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    io.disconnect(); ro.disconnect(); bodyWatch.disconnect();
    window.removeEventListener('pointermove', onMove);
    card.removeEventListener('pointerenter', onEnter);
    card.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', wake);
    motion.removeEventListener('change', wake);
    scene.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
    renderer.dispose();
    canvas.remove();
    host.classList.remove('is-3d');
  };
  // Si el navegador pierde el contexto, vuelve la imagen de respaldo.
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dispose(); });

  draw(0.35);
  host.classList.add('is-3d');
  wake();
  return {
    dispose,
    isRunning: () => Boolean(raf),
    triangles: renderer.info.render.triangles,
    state: () => ({ tiltX: world.rotation.x, tiltY: world.rotation.y, light: light.intensity, boost })
  };
}
