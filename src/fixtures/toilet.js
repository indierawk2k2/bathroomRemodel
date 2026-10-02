// buildToilet(ctx): elongated two-piece toilet, tank against the north wall,
// centred x = 87.5 (under the window, photo 37).  Tank top 30", seat 16",
// ~28" overall depth.  Built from rounded boxes and lathed profiles that are
// scaled into ovals.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { inch } from '../units.js';
import { mesh, stdMaterials } from './util.js';

const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

export function buildToilet(ctx) {
  const { TOILET } = ctx.config;
  const std = stdMaterials();
  const p = std.porcelain;
  const g = new THREE.Group();
  g.name = 'toilet';
  const cx = TOILET.centerX;

  // tank + lid
  const tank = new RoundedBoxGeometry(inch(19.5), inch(13.6), inch(7.8), 4, inch(0.9));
  tank.translate(cx, inch(16.2) + inch(13.6) / 2, inch(0.6) + inch(7.8) / 2);
  g.add(mesh(tank, p, { name: 'toilet_tank' }));
  const lid = new RoundedBoxGeometry(inch(20.3), inch(1.0), inch(8.6), 3, inch(0.4));
  lid.translate(cx, inch(29.5), inch(0.4) + inch(8.6) / 2);
  g.add(mesh(lid, p, { name: 'toilet_lid' }));

  // bowl: lathed vase profile (radius in units of the rim radius), scaled into an oval
  const RX = inch(7.2), RZ = inch(9.6), bz = inch(8.5) + RZ - inch(1.8);
  const bowl = lathe([
    [0.0, 0], [0.52, 0], [0.55, inch(0.4)], [0.5, inch(3)], [0.52, inch(6)], [0.62, inch(9)],
    [0.8, inch(11.5)], [0.95, inch(13.6)], [1.0, inch(14.6)], [0.98, inch(15.0)], [0.86, inch(15.05)],
  ]);
  bowl.scale(RX, 1, RZ);
  bowl.translate(cx, 0, bz);
  g.add(mesh(bowl, p, { name: 'toilet_bowl' }));
  // neck joining bowl and tank
  const neck = new RoundedBoxGeometry(inch(10), inch(9), inch(7), 3, inch(1.5));
  neck.translate(cx, inch(10.5), inch(8.5));
  g.add(mesh(neck, p));

  // closed seat + lid: lathed rounded disc, slightly larger than the rim
  const disc = (y0, th, scale) => {
    const geo = lathe([[0, 0], [0.9, 0], [0.98, th * 0.25], [1.0, th * 0.55], [0.97, th * 0.9], [0.85, th], [0, th]]);
    geo.scale(RX * scale, 1, RZ * scale);
    geo.translate(cx, y0, bz + inch(0.4));
    return geo;
  };
  g.add(mesh(disc(inch(15.05), inch(0.75), 1.02), p, { name: 'toilet_seat' }));
  g.add(mesh(disc(inch(15.85), inch(0.7), 1.0), p, { name: 'toilet_cover' }));
  // hinge posts
  for (const s of [-1, 1]) {
    const h = new RoundedBoxGeometry(inch(1.4), inch(1.1), inch(2), 2, inch(0.3));
    h.translate(cx + s * inch(3.2), inch(15.6), inch(9.4));
    g.add(mesh(h, p));
  }
  // flush lever, front left of the tank
  const lever = new THREE.Mesh(new THREE.BoxGeometry(inch(2.6), inch(0.5), inch(0.4)), std.chrome);
  lever.position.set(cx - inch(6.5), inch(27.4), inch(8.6));
  g.add(lever);
  // supply line
  const sup = new THREE.Mesh(new THREE.CylinderGeometry(inch(0.2), inch(0.2), inch(9), 10), std.chrome);
  sup.position.set(cx - inch(6), inch(10.5), inch(2));
  g.add(sup);
  return g;
}
