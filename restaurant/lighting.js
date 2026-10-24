/* Burger Shot 3D · RestaurantLighting.
   Noche exterior con neón y farolas; interior cálido. Las sombras del mobiliario se calculan una sola vez
   (el edificio no se mueve) y los personajes usan sombras de contacto, así el coste por fotograma es bajo. */
import * as THREE from 'three';

const BUDGET = { high: 10, medium: 7, low: 4 };

export function setupLighting(scene, renderer, { quality = 'medium', lamps = [] } = {}) {
  const lights = [], disposables = [];
  const addLight = (light, priority = 1) => { light.userData.priority = priority; lights.push(light); scene.add(light); return light; };

  // Reflejos suaves: entorno generado a partir de paneles emisivos (sin descargar HDRI).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const panel = (color, w, h, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m); disposables.push(m.geometry, m.material);
  };
  env.background = new THREE.Color('#120910');
  panel('#ffcf9a', 14, 2.2, 0, 6, 0, 0, Math.PI / 2);
  panel('#ffb27a', 6, 1.4, -6, 4, -4, Math.PI / 4);
  panel('#ff2a3a', 12, 0.7, 0, 2.5, 8);
  panel('#3d2f70', 8, 1.2, 8, 3, -6, -Math.PI / 3);
  panel('#2a1a24', 30, 30, 0, -2, 0, 0, Math.PI / 2);
  const envMap = pmrem.fromScene(env, 0.035).texture;
  scene.environment = envMap;
  pmrem.dispose();

  const hemi = addLight(new THREE.HemisphereLight('#4a2a52', '#120808', 0.7), 0);

  // Luz principal: «techo» cálido que proyecta sombras del mobiliario.
  const key = addLight(new THREE.DirectionalLight('#ffe3c6', 1.25), 0);
  key.position.set(7, 16, 9); key.target.position.set(-0.5, 0, -0.5); scene.add(key.target);
  const shadows = quality !== 'low';
  key.castShadow = shadows;
  if (shadows) {
    const size = quality === 'high' ? 2048 : 1024;
    key.shadow.mapSize.set(size, size);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 11, bottom: -11, near: 2, far: 40 });
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.025;
    key.shadow.camera.updateProjectionMatrix();
  }
  // Luz de luna morada desde atrás para separar la silueta del edificio.
  const moon = addLight(new THREE.DirectionalLight('#8a74ff', 0.45), 0);
  moon.position.set(-14, 18, -16);

  const point = (color, intensity, distance, x, y, z, priority) => {
    const l = new THREE.PointLight(color, intensity, distance, 2);
    l.position.set(x, y, z);
    l.userData.base = intensity;
    return addLight(l, priority);
  };
  // Prácticos ordenados por importancia: con menos presupuesto se apagan los de prioridad mayor.
  point('#ffb06a', 26, 11, -1.8, 2.6, 0.6, 1);         // mostrador
  point('#ff3040', 60, 15, -1.0, 4.2, 9.0, 1);          // neón de la fachada sobre la acera
  point('#ffc58a', 18, 9, -3.2, 2.7, 3.2, 2);           // comedor
  point('#fff0dc', 18, 9, -2.6, 2.6, -4.6, 2);          // cocina
  point('#ffd09a', 16, 7, 4.6, 2.7, 8.0, 2);            // marquesina
  point('#ff8a3a', 6, 4, -2.0, 1.45, -3.3, 3);          // lámparas de calor
  point('#ffcf9e', 12, 8, 6.9, 2.4, -4.4, 3);           // sala del personal
  point('#ffb886', 12, 8, 6.5, 2.4, 3.4, 3);            // comedor derecho
  for (const lamp of lamps) point('#ffd7a6', 34, 14, ...lamp.pos, 2);
  const budget = BUDGET[quality] ?? BUDGET.medium;
  const points = lights.filter(l => l.isPointLight).sort((a, b) => a.userData.priority - b.userData.priority);
  points.forEach((l, i) => { l.visible = i < budget; });

  let mix = 0;
  return {
    key,
    shadowsEnabled: shadows,
    /* 0 = fachada nocturna, 1 = interior. */
    setStage(m) {
      mix = m;
      hemi.intensity = 0.7 + m * 0.15;
      hemi.color.set('#4a2a52').lerp(new THREE.Color('#7a6252'), m);
      key.intensity = 1.05 + m * 0.45;
      moon.intensity = 0.45 * (1 - m);
    },
    flicker(t) {
      // Parpadeo mínimo de las fuentes cálidas, como velas en las mesas.
      for (const l of points) if (l.visible && l.userData.priority >= 2) l.intensity = l.userData.base * (0.96 + Math.sin(t * 7.3 + l.position.x) * 0.025 + Math.sin(t * 17 + l.position.z) * 0.015);
    },
    get mix() { return mix; },
    dispose() {
      for (const l of lights) { scene.remove(l); l.shadow?.map?.dispose(); l.dispose?.(); }
      scene.remove(key.target);
      envMap.dispose();
      for (const d of disposables) d.dispose();
      scene.environment = null;
    }
  };
}
