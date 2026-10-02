// Shared pieces for light options: chains, bulbs, point lights, on/off.
import { inch, mm, warmWhite } from '../../remodel/cfg.js';

/**
 * Point light at a bulb.  `candela` is THREE's physical intensity (r155+);
 * values are tuned for exposure 1 + RoomEnvironment and meant to be tuned by
 * the integration pass via group.userData.lights.
 */
export function bulbLight(THREE, { candela = 6, shadow = true, mapSize = 512, near = 0.03 } = {}) {
  const l = new THREE.PointLight(warmWhite(THREE), candela, 0, 2);
  l.castShadow = shadow;
  if (shadow) {
    l.shadow.mapSize.set(mapSize, mapSize);
    l.shadow.camera.near = near;
    l.shadow.camera.far = 8;
    l.shadow.bias = -0.0015;
    l.shadow.normalBias = 0.01;
    l.shadow.radius = 3;
  }
  l.userData.baseIntensity = candela;
  return l;
}

/** Emissive "glowing" material; its emissiveIntensity is driven by onOff. */
export function glowMaterial(THREE, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: opts.color ?? 0xfff3df,
    emissive: warmWhite(THREE),
    emissiveIntensity: opts.intensity ?? 6,
    roughness: 0.4,
    ...opts.extra,
  });
  m.userData.onIntensity = m.emissiveIntensity;
  return m;
}

/** Chain of alternating links (InstancedMesh) from a to b (Vector3s). */
export function chain(THREE, a, b, { linkLen = inch(1.0), wire = mm(2.2), material } = {}) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const n = Math.max(1, Math.round(len / (linkLen * 0.78)));
  const geo = new THREE.TorusGeometry(linkLen * 0.32, wire, 6, 12);
  geo.scale(1, 1.45, 1);                    // oval link
  const mesh = new THREE.InstancedMesh(geo, material, n);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const twist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) {
    p.copy(a).addScaledVector(dir, (i + 0.5) / n);
    const qi = q.clone(); if (i & 1) qi.multiply(twist);
    m.compose(p, qi, s);
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  mesh.name = 'chain';
  return mesh;
}

/** Thin cylinder between two points (rods, frame edges). */
export function rod(THREE, a, b, radius, material, radial = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(radius, radius, dir.length(), radial, 1);
  const m = new THREE.Mesh(g, material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

/** Install userData.lights / onOff / dispose on a fixture group. */
export function finishFixture(group, lights, glowMats) {
  group.userData.lights = lights;
  group.userData.glowMaterials = glowMats;
  group.userData.on = true;
  group.userData.onOff = (on) => {
    group.userData.on = !!on;
    // Intensity, not visibility: changing the light count recompiles shaders.
    for (const l of lights) { l.intensity = on ? (l.userData.baseIntensity ?? 1) : 0; }
    for (const m of glowMats) {
      m.emissiveIntensity = on ? (m.userData.onIntensity ?? 1) : 0;
      if (m.userData.offColor && m.color) m.color.copy(on ? m.userData.onColor : m.userData.offColor);
    }
  };
  group.userData.dispose = () => {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    });
  };
  return group;
}

export { inch, mm };
