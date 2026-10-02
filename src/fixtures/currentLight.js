// buildCurrentLight(ctx): chrome 2-bulb vanity bar, 24" wide (spans the
// mirror, photo 37), bottom 80.5", two squared frosted shades either side
// of a small chrome backplate; each shade holds a warm PointLight with shadows.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { inch } from '../units.js';
import { box, stdMaterials } from './util.js';

export function buildCurrentLight(ctx) {
  const { CURRENT_LIGHT: L } = ctx.config;
  const std = stdMaterials();
  const g = new THREE.Group();
  g.name = 'currentLight';
  const cx = L.centerX, y0 = L.bottom;
  const shadeW = inch(10), shadeH = inch(4.2), shadeD = inch(4.2), zc = inch(3.6);
  const cy = y0 + shadeH / 2;

  // backplate + bar + centre clamp
  g.add(box(cx - inch(2.4), cy - inch(2.0), 0, cx + inch(2.4), cy + inch(2.0), inch(0.7), std.chrome, { name: 'currentLight_plate' }));
  g.add(box(cx - inch(0.6), cy - inch(0.5), inch(0.7), cx + inch(0.6), cy + inch(0.5), zc, std.chrome));
  g.add(box(cx - L.width / 2 + inch(1), cy - inch(0.25), zc - inch(0.6), cx + L.width / 2 - inch(1), cy + inch(0.25), zc + inch(0.6), std.chrome));
  g.add(box(cx - inch(3), cy - inch(1.6), zc + shadeD / 2 - inch(0.2), cx + inch(3), cy - inch(1.1), zc + shadeD / 2 + inch(0.4), std.chrome));

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff6ea, emissive: 0xffd7a6, emissiveIntensity: 1.6, roughness: 0.6, transparent: true, opacity: 0.97,
  });
  const lights = [];
  for (const s of [-1, 1]) {
    const x = cx + s * (inch(2.8) + shadeW / 2);
    const shade = new THREE.Mesh(new RoundedBoxGeometry(shadeW, shadeH, shadeD, 3, inch(0.35)), shadeMat);
    shade.position.set(x, cy, zc);
    shade.castShadow = false; // the bulb's own light must pass through
    g.add(shade);
    // end caps (chrome)
    g.add(box(x + s * (shadeW / 2) - inch(0.15), cy - shadeH / 2 - inch(0.05), zc - shadeD / 2, x + s * (shadeW / 2) + inch(0.15), cy + shadeH / 2 + inch(0.05), zc + shadeD / 2, std.chrome));
    const pl = new THREE.PointLight(0xffc78f, 0.9, 0, 2); // display-referred units (see main.js exposure)
    pl.name = 'currentLight_bulb';
    pl.position.set(x, cy, zc + inch(0.3));
    pl.castShadow = true;
    pl.shadow.mapSize.set(512, 512);
    pl.shadow.camera.near = inch(2.6);
    // the light grazes the wall it is mounted on: normal bias kills the acne
    pl.shadow.bias = -0.0008;
    pl.shadow.normalBias = 0.012;
    pl.shadow.radius = 4;
    g.add(pl);
    lights.push(pl);
  }
  g.userData.lights = lights;
  return g;
}
