// Room reflection probe (br-uio): renders the actual bathroom into a cube
// map from the middle of the vanity area, prefilters it with PMREM, and
// hands it to the metals (chrome, brushed nickel, brass, the Schluter
// strip, the mirror brackets) as their envMap.  The generic
// RoomEnvironment stays on scene.environment for the soft ambient fill.
//
// The scene is static, so the probe is only re-captured when something that
// shows in it changes (scenario, option, day / night, lights); captures are
// debounced and wait a few frames for the on-demand shadow maps.
//
//   const probe = createEnvProbe({ THREE, renderer, scene, frameRef, position });
//   probe.request()     // schedule a capture
//   probe.frame()       // call once per frame (runs a pending capture)
export function createEnvProbe({ THREE, renderer, scene, frameRef, position, size = 256 }) {
  const cubeRT = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType, generateMipmaps: false });
  const cam = new THREE.CubeCamera(0.03, 20, cubeRT);
  cam.position.copy(position);
  scene.add(cam);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;
  let due = -1;

  // Metals only: their look is all reflection.  Dielectrics (tile glaze,
  // porcelain, varnish) would also take their diffuse ambient from the probe,
  // which shifts their colour; they keep the generic environment.
  const shiny = (m) => m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) && !m.userData.noProbe &&
    (m.metalness ?? 0) >= 0.5;

  function apply() {
    if (!envRT) return;
    scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        if (!shiny(m)) continue;
        if (m.envMap !== envRT.texture) {
          if (m.userData.probeBaseIntensity === undefined) m.userData.probeBaseIntensity = m.envMapIntensity ?? 1;
          m.envMap = envRT.texture;
          // The probe holds the room's real radiance: no extra gain.
          m.envMapIntensity = 1.0;
          m.needsUpdate = true;
        }
      }
    });
  }

  function capture() {
    const hidden = [];
    scene.traverse((o) => {
      // the planar mirrors and the debug overlays stay out of the probe
      if ((o.isReflector || o.name === 'junctionInspector' || o.isSprite) && o.visible) { o.visible = false; hidden.push(o); }
    });
    frameRef.inOverride = true;
    const tm = renderer.toneMapping;
    cam.update(renderer, scene);
    renderer.toneMapping = tm;
    frameRef.inOverride = false;
    for (const o of hidden) o.visible = true;
    const next = pmrem.fromCubemap(cubeRT.texture);
    if (envRT) envRT.dispose();
    envRT = next;
    // Re-point materials that already use the probe at the new texture.
    scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) if (m && m.userData.probeBaseIntensity !== undefined) { m.envMap = envRT.texture; }
    });
    apply();
  }

  return {
    get texture() { return envRT ? envRT.texture : null; },
    /** Capture after `frames` frames (lets shadows and new geometry settle). */
    request(frames = 6) { due = due < 0 ? frames : Math.max(due, frames); },
    frame() {
      if (due < 0) return;
      if (due-- === 0) capture();
    },
    captureNow: capture,
  };
}
