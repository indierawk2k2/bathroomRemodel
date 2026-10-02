// FirstPersonControls: WASD move, arrows yaw/pitch, Q/E (or Space/C) down/up,
// Shift = faster, mouse drag looks; Xbox controller via the Gamepad API
// (left stick move, right stick look, LT/RT or LB/RB down/up).  Gamepad
// buttons fire callbacks registered with onButton(name, fn) for
// 'A' 'B' 'X' 'Y' 'LB' 'RB' 'LT' 'RT' 'Back' 'Start' 'LS' 'RS' 'Up' 'Down' 'Left' 'Right'.
// The eye is clamped inside the room's walkable rectangles (10" margin).
import * as THREE from 'three';

const BUTTONS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'Up', 'Down', 'Left', 'Right'];
const DEAD = 0.15;

const dz = (v) => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));

export class FirstPersonControls {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLElement} dom   element that receives mouse drags
   * @param {object} opts { walkRects:[[x0,z0,x1,z1]...], minY, maxY, speed }
   */
  constructor(camera, dom, opts = {}) {
    this.camera = camera;
    this.dom = dom;
    this.walkRects = opts.walkRects || null;
    this.minY = opts.minY ?? 0.3;
    this.maxY = opts.maxY ?? 2.8;
    this.speed = opts.speed ?? 1.1; // m/s
    this.lookSpeed = 1.6; // rad/s for arrows / stick
    this.yaw = 0; // 0 = looking -Z (toward the vanity)
    this.pitch = 0;
    this.enabled = true;
    this.keys = new Set();
    this.handlers = new Map();
    this.prevButtons = [];
    this.gamepadIndex = null;
    this.onGamepadChange = null; // (connected:boolean, id:string) => void
    this._bind();
  }

  _bind() {
    const typing = (e) => /INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || '') && e.target.type !== 'range';
    addEventListener('keydown', (e) => {
      if (typing(e)) return;
      this.keys.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    let drag = null;
    this.dom.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY };
      this.dom.setPointerCapture?.(e.pointerId);
    });
    this.dom.addEventListener('pointermove', (e) => {
      if (!drag || !this.enabled) return;
      const k = 0.0042;
      this.yaw -= (e.clientX - drag.x) * k;
      this.pitch -= (e.clientY - drag.y) * k;
      drag = { x: e.clientX, y: e.clientY };
      this._clampPitch();
    });
    const end = () => (drag = null);
    this.dom.addEventListener('pointerup', end);
    this.dom.addEventListener('pointercancel', end);
    addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.onGamepadChange?.(true, e.gamepad.id);
    });
    addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) this.gamepadIndex = null;
      this.onGamepadChange?.(false, e.gamepad.id);
    });
  }

  /** Register a gamepad button callback; returns an unsubscribe function. */
  onButton(name, fn) {
    if (!BUTTONS.includes(name)) throw new Error(`unknown gamepad button ${name}`);
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name).add(fn);
    return () => this.handlers.get(name).delete(fn);
  }
  /** Remove every callback for a button (e.g. to replace the defaults). */
  clearButton(name) {
    this.handlers.get(name)?.clear();
  }

  _fire(name) {
    for (const fn of this.handlers.get(name) || []) fn(name);
  }

  _clampPitch() {
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.45, 1.45);
  }

  /** Put the eye at pos (Vector3/array) looking toward target. */
  setPose(pos, target) {
    const p = Array.isArray(pos) ? new THREE.Vector3(...pos) : pos.clone();
    const t = Array.isArray(target) ? new THREE.Vector3(...target) : target.clone();
    this.camera.position.copy(p);
    const d = t.sub(p).normalize();
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    this._apply();
  }

  _apply() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  /** Clamp an (x, z) to the nearest point of the walkable rectangles. */
  clampXZ(x, z) {
    if (!this.walkRects) return [x, z];
    let best = null, bestD = Infinity;
    for (const [x0, z0, x1, z1] of this.walkRects) {
      const cx = Math.min(Math.max(x, x0), x1), cz = Math.min(Math.max(z, z0), z1);
      const d = (cx - x) ** 2 + (cz - z) ** 2;
      if (d < bestD) (bestD = d), (best = [cx, cz]);
      if (d === 0) break;
    }
    return best;
  }

  _gamepad() {
    if (this.gamepadIndex === null || !navigator.getGamepads) return null;
    return navigator.getGamepads()[this.gamepadIndex] || null;
  }

  update(dt) {
    if (!this.enabled) return;
    dt = Math.min(dt, 0.1);
    const k = this.keys;
    let fwd = 0, strafe = 0, up = 0, yawIn = 0, pitchIn = 0;
    if (k.has('KeyW')) fwd += 1;
    if (k.has('KeyS')) fwd -= 1;
    if (k.has('KeyD')) strafe += 1;
    if (k.has('KeyA')) strafe -= 1;
    if (k.has('KeyE') || k.has('Space')) up += 1;
    if (k.has('KeyQ') || k.has('KeyC')) up -= 1;
    if (k.has('ArrowLeft')) yawIn += 1;
    if (k.has('ArrowRight')) yawIn -= 1;
    if (k.has('ArrowUp')) pitchIn += 1;
    if (k.has('ArrowDown')) pitchIn -= 1;
    let fast = k.has('ShiftLeft') || k.has('ShiftRight');

    const gp = this._gamepad();
    if (gp) {
      const ax = gp.axes;
      strafe += dz(ax[0] || 0);
      fwd -= dz(ax[1] || 0);
      yawIn -= dz(ax[2] || 0);
      pitchIn -= dz(ax[3] || 0);
      const b = gp.buttons;
      const val = (i) => (b[i] ? (typeof b[i] === 'object' ? b[i].value : b[i]) : 0);
      const pressed = (i) => (b[i] ? (typeof b[i] === 'object' ? b[i].pressed : b[i] > 0.5) : false);
      up += val(7) - val(6); // RT up, LT down
      up += (pressed(5) ? 1 : 0) - (pressed(4) ? 1 : 0); // RB up, LB down
      if (pressed(10)) fast = true; // left stick click
      BUTTONS.forEach((name, i) => {
        const now = pressed(i);
        if (now && !this.prevButtons[i]) this._fire(name);
        this.prevButtons[i] = now;
      });
    }

    const sp = this.speed * (fast ? 2.5 : 1);
    this.yaw += yawIn * this.lookSpeed * dt;
    this.pitch += pitchIn * this.lookSpeed * 0.75 * dt;
    this._clampPitch();
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const p = this.camera.position;
    if (fwd || strafe || up) {
      const len = Math.max(1, Math.hypot(fwd, strafe));
      let x = p.x + ((-sin * fwd + cos * strafe) / len) * sp * dt;
      let z = p.z + ((-cos * fwd - sin * strafe) / len) * sp * dt;
      [x, z] = this.clampXZ(x, z);
      p.x = x;
      p.z = z;
      p.y = THREE.MathUtils.clamp(p.y + up * sp * 0.7 * dt, this.minY, this.maxY);
    }
    this._apply();
  }
}
