// buildCurrentMirror(ctx): frameless 24" x 36" mirror, centred x = 54,
// bottom 43" (photo 37), as a real planar reflection.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { inch } from '../units.js';
import { box } from './util.js';

export function buildCurrentMirror(ctx) {
  const { CURRENT_MIRROR: M } = ctx.config;
  const g = new THREE.Group();
  g.name = 'currentMirror';
  const thick = inch(0.25);
  const cy = M.bottom + M.height / 2;
  // 1024 x 1536 keeps the 2:3 aspect and is sharp at mirror close-up range
  // without doubling the frame cost on a HiDPI screen.
  const reflector = new Reflector(new THREE.PlaneGeometry(M.width - inch(0.3), M.height - inch(0.3)), {
    textureWidth: 1024,
    textureHeight: 1536,
    color: 0xc9cdcc,
    clipBias: 0.002,
    multisample: Number(new URLSearchParams(location.hash.slice(1)).get('mirrorMsaa') ?? 0),
  });
  reflector.name = 'currentMirror_glass';
  reflector.position.set(M.centerX, cy, thick + inch(0.01));
  g.add(reflector);
  // polished edge + backing (greenish glass edge)
  const edge = new THREE.MeshStandardMaterial({ color: 0x9fb3ac, roughness: 0.15, metalness: 0.2 });
  const x0 = M.centerX - M.width / 2, x1 = M.centerX + M.width / 2;
  g.add(box(x0, M.bottom, inch(0.02), x1, M.bottom + M.height, thick, edge, { name: 'currentMirror_back', receive: false }));
  g.userData.reflector = reflector;
  return g;
}
