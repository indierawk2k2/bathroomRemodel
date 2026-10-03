#!/usr/bin/env python3
"""Regenerate every PBR texture in assets/textures/ from the photos.

    python3 tools/make_textures.py              # everything
    python3 tools/make_textures.py --only quartz --only rattan
    python3 tools/make_textures.py --no-preview

Photo-derived textures are cut from photos/jpg/ (EXIF-transposed), perspective
corrected with a 4-point homography, colour balanced to a neutral target,
illumination-flattened and made tileable.  The new tile options are drawn
procedurally.  Everything is deterministic (fixed seeds), so re-running the
script reproduces byte-identical files.

Conventions (consumed by src/textures.js):
  * albedo  = sRGB JPEG q90           (colorSpace SRGB)
  * normal  = PNG, OpenGL convention (+X right, +Y up = green, as Three.js wants)
  * rough   = greyscale PNG (Three.js reads the G channel; all channels equal)
  * alpha   = greyscale PNG (Three.js reads the G channel)
  * physicalSizeM = real-world [width, height] in metres of ONE repeat of the image
See docs/textures.md for the source of every texture.

Dependencies: Python 3 standard library, Pillow, numpy.
"""
import argparse
import glob
import json
import math
import os
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTO_DIR = os.path.join(ROOT, "photos", "jpg")
OUT_DIR = os.path.join(ROOT, "assets", "textures")
MANIFEST = os.path.join(OUT_DIR, "manifest.json")
WALLPAPER_SRC = os.path.join(ROOT, "assets", "source", "wallpapers")   # see SOURCES.md there
IN = 0.0254  # metres per inch

ORDER = [
    "floor_plank", "wainscot", "accent_band", "vanity_wood", "quartz",
    "wall_paint", "rattan", "wood_frame", "frosted_glass", "curtain",
    "tile_sage_fan", "tile_white_subway_stacked", "wallpaper_sample",
    "door_slab", "wallpaper_cole_son_feather_fan_soft_olive",
    "wallpaper_rebel_walls_ripple_blue", "wallpaper_debona_crystal_trellis_blue_silver",
    "wallpaper_wow_metro_prism_emerald_gold",
]

# --------------------------------------------------------------------------
# colour helpers (float arrays, 0..1)
# --------------------------------------------------------------------------

def s2l(a):
    a = np.clip(a, 0.0, 1.0)
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def l2s(a):
    a = np.clip(a, 0.0, 1.0)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(a, 1 / 2.4) - 0.055)


def hex2lin(h):
    h = h.lstrip("#")
    return s2l(np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float64) / 255.0)


def lin2hex(lin):
    s = np.round(l2s(np.asarray(lin, np.float64)) * 255).astype(int)
    return "#%02X%02X%02X" % tuple(int(v) for v in s)


def lum(lin):
    return lin[..., 0] * 0.2126 + lin[..., 1] * 0.7152 + lin[..., 2] * 0.0722


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------
# photo access + geometry
# --------------------------------------------------------------------------

_PHOTOS = None
_CACHE = {}


def photo(idx):
    """Photo by its index in sorted(photos/jpg) (== sorted thumbs, 00-54)."""
    global _PHOTOS
    if _PHOTOS is None:
        _PHOTOS = sorted(glob.glob(os.path.join(PHOTO_DIR, "*.jpg")))
    if idx not in _CACHE:
        if len(_CACHE) > 3:
            _CACHE.clear()
        _CACHE[idx] = ImageOps.exif_transpose(Image.open(_PHOTOS[idx])).convert("RGB")
    return _CACHE[idx]


def _persp_coeffs(dst, src):
    A, B = [], []
    for (x, y), (X, Y) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); B.append(X)
        A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); B.append(Y)
    return tuple(np.linalg.solve(np.array(A, float), np.array(B, float)))


def warp(img, quad, w, h, ss=2):
    """Rectify quad [TL, TR, BR, BL] (source px) to a w x h float sRGB array.

    Returns (rgb float array, validity mask) -- the mask is <1 where the quad
    left the photo.  Supersampled ss x then Lanczos-reduced to avoid aliasing.
    """
    W, H = w * ss, h * ss
    co = _persp_coeffs([(0, 0), (W, 0), (W, H), (0, H)], quad)
    out = img.transform((W, H), Image.PERSPECTIVE, co, Image.BICUBIC)
    m = Image.new("L", img.size, 255).transform((W, H), Image.PERSPECTIVE, co, Image.BILINEAR)
    out = out.resize((w, h), Image.LANCZOS)
    m = m.resize((w, h), Image.BILINEAR)
    return np.asarray(out, np.float64) / 255.0, np.asarray(m, np.float64) / 255.0


def rot_rect(cx, cy, w, h, deg):
    """Quad [TL,TR,BR,BL] of a w x h rectangle centred at (cx,cy) rotated by deg
    (positive = clockwise in image coordinates)."""
    a = math.radians(deg)
    ux, uy = math.cos(a), math.sin(a)      # rectangle +x axis
    vx, vy = -math.sin(a), math.cos(a)     # rectangle +y axis
    pts = []
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        pts.append((cx + sx * w / 2 * ux + sy * h / 2 * vx, cy + sx * w / 2 * uy + sy * h / 2 * vy))
    return pts


# --------------------------------------------------------------------------
# image processing
# --------------------------------------------------------------------------

def gblur(a, sigma, wrap=False):
    """Gaussian blur via FFT. wrap=True for tileable images, else reflect-padded."""
    if sigma <= 0:
        return a.copy()
    a = np.asarray(a, np.float64)
    H0, W0 = a.shape[:2]
    p = 0
    if not wrap:
        p = int(min(3 * sigma, H0 - 1, W0 - 1))
        pad = ((p, p), (p, p)) + ((0, 0),) * (a.ndim - 2)
        a = np.pad(a, pad, mode="reflect")
    H, W = a.shape[:2]
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.rfftfreq(W)[None, :]
    g = np.exp(-2 * (math.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    if a.ndim == 3:
        g = g[..., None]
    out = np.fft.irfft2(np.fft.rfft2(a, axes=(0, 1)) * g, s=(H, W), axes=(0, 1))
    return out[p:p + H0, p:p + W0]


def flatten(lin, sigma, mask=None):
    """Divide out low-frequency illumination (per channel), keep the mean."""
    if mask is None:
        low = gblur(lin, sigma)
    else:
        m = mask[..., None]
        low = gblur(lin * m, sigma) / np.maximum(gblur(np.repeat(m, 3, 2), sigma), 1e-4)
    mean = lin.reshape(-1, 3).mean(0)
    return lin / np.maximum(low, 1e-5) * mean


def match_mean(lin, target_hex, mask=None):
    """Scale channels (linear light) so the mean equals target colour."""
    t = hex2lin(target_hex)
    if mask is None:
        m = lin.reshape(-1, 3).mean(0)
    else:
        w = mask.reshape(-1)
        m = (lin.reshape(-1, 3) * w[:, None]).sum(0) / max(w.sum(), 1)
    return lin * (t / np.maximum(m, 1e-6))


def set_contrast(lin, k):
    """Scale deviations from the mean (in sRGB space) by k."""
    s = l2s(lin)
    m = s.reshape(-1, 3).mean(0)
    return s2l(m + (s - m) * k)


def _ramp(n, band):
    """Weight 0 at the image edges rising to 1 within band*n pixels."""
    x = np.arange(n) + 0.5
    d = np.minimum(x, n - x) / max(band * n, 1e-6)
    return smoothstep(0.0, 1.0, d)


def make_tileable(a, band=0.18, axes=(0, 1)):
    """Seamless wrap by cross-fading with a half-rolled copy near the edges.
    Variance-preserving so the blend zone does not look washed out."""
    a = np.asarray(a, np.float64)
    m = a.reshape(-1, *a.shape[2:]).mean(0)
    for ax in axes:
        n = a.shape[ax]
        w = _ramp(n, band)
        shape = [1] * a.ndim
        shape[ax] = n
        w = w.reshape(shape)
        b = np.roll(a, n // 2, axis=ax)
        a = m + ((a - m) * w + (b - m) * (1 - w)) / np.sqrt(w * w + (1 - w) ** 2)
    return np.maximum(a, 0.0)


def local_std(x, sigma, wrap=True):
    mu = gblur(x, sigma, wrap)
    return np.sqrt(np.maximum(gblur(x * x, sigma, wrap) - mu * mu, 0))


def normal_map(h_mm, px_mm, strength=1.0):
    """Tangent-space normal map (OpenGL, +Y up) from a height field in mm.
    Gradients wrap around, so a tileable height gives a tileable normal map."""
    dx = (np.roll(h_mm, -1, 1) - np.roll(h_mm, 1, 1)) / (2 * px_mm)
    dy = (np.roll(h_mm, -1, 0) - np.roll(h_mm, 1, 0)) / (2 * px_mm)
    nx, ny, nz = -dx * strength, dy * strength, np.ones_like(h_mm)
    inv = 1 / np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx * inv, ny * inv, nz * inv], -1) * 0.5 + 0.5


def value_noise(shape, cells, seed, octaves=1, persistence=0.5):
    """Tileable smooth noise in [-1, 1].  cells = lattice cells across (int)."""
    H, W = shape
    rng = np.random.default_rng(seed)
    out = np.zeros(shape)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        cy, cx = max(1, int(round(cells * H / W)) * 2 ** o), cells * 2 ** o
        g = rng.uniform(-1, 1, (cy, cx))
        y = np.arange(H) / H * cy
        x = np.arange(W) / W * cx
        y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int)
        fy = smoothstep(0, 1, y - y0)[:, None]; fx = smoothstep(0, 1, x - x0)[None, :]
        y1 = (y0 + 1) % cy; x1 = (x0 + 1) % cx; y0 %= cy; x0 %= cx
        v = (g[y0][:, x0] * (1 - fx) + g[y0][:, x1] * fx) * (1 - fy) + \
            (g[y1][:, x0] * (1 - fx) + g[y1][:, x1] * fx) * fy
        out += amp * v
        tot += amp
        amp *= persistence
    return out / tot


def per_tile_jitter(lin, amount, seed, hue=0.0):
    rng = np.random.default_rng(seed)
    k = 1 + rng.uniform(-amount, amount)
    c = 1 + rng.uniform(-hue, hue, 3)
    return lin * k * c


# --------------------------------------------------------------------------
# output
# --------------------------------------------------------------------------

WRITTEN = []


def _save(img, fname, **kw):
    path = os.path.join(OUT_DIR, fname)
    img.save(path, **kw)
    sz = os.path.getsize(path)
    WRITTEN.append((fname, sz))
    print(f"  wrote {fname:44s} {img.size[0]}x{img.size[1]}  {sz / 1024:8.1f} KB")
    return fname


def save_albedo(lin, fname):
    s = np.round(l2s(lin) * 255).astype(np.uint8)
    return _save(Image.fromarray(s), fname, quality=90, subsampling=0, optimize=True)


def save_srgb(srgb, fname):
    s = np.round(np.clip(srgb, 0, 1) * 255).astype(np.uint8)
    return _save(Image.fromarray(s), fname, quality=90, subsampling=0, optimize=True)


def save_normal(n, fname):
    s = np.round(np.clip(n, 0, 1) * 255).astype(np.uint8)
    return _save(Image.fromarray(s), fname, optimize=True)


def save_gray(g, fname):
    s = np.round(np.clip(g, 0, 1) * 255).astype(np.uint8)
    return _save(Image.fromarray(s), fname, optimize=True)


def entry(name, lin, size_m, normal=None, rough=None, alpha=None, metal=None, **extra):
    e = {"name": name, "map": save_albedo(lin, f"{name}_albedo.jpg")}
    if normal is not None:
        e["normalMap"] = save_normal(normal, f"{name}_normal.png")
    if rough is not None:
        e["roughnessMap"] = save_gray(rough, f"{name}_rough.png")
    if metal is not None:
        e["metalnessMap"] = save_gray(metal, f"{name}_metal.png")
    if alpha is not None:
        e["alphaMap"] = save_gray(alpha, f"{name}_alpha.png")
    e["physicalSizeM"] = [round(float(size_m[0]), 4), round(float(size_m[1]), 4)]
    e["repeat"] = [round(1 / float(size_m[0]), 4), round(1 / float(size_m[1]), 4)]
    e.update(extra)
    return e


# --------------------------------------------------------------------------
# tile layout compositor (running bond / stacked) for grouted surfaces
# --------------------------------------------------------------------------

def compose_tiles(W, H, tw, th, offset_frac, tile_fn, grout_hw, grout_lin,
                  bevel_px, bevel_mm, grout_depth_mm, grout_rough, seed):
    """Lay rectangular tiles tw x th (px, may be fractional) in rows; row r is
    shifted by r*offset_frac*tw.  The repeat W x H must contain whole rows and
    whole tiles.  tile_fn(row, col, TW, TH) -> (albedo lin, height mm, rough)
    for one tile face of integer size TW x TH.  Returns albedo, height, rough."""
    nrows = int(round(H / th))
    ncols = int(round(W / tw))
    TW, TH = int(round(tw)), int(round(th))
    y = np.arange(H) + 0.5
    x = np.arange(W) + 0.5
    alb = np.zeros((H, W, 3)); hgt = np.zeros((H, W)); rgh = np.zeros((H, W)); dist = np.zeros((H, W))
    for r in range(nrows):
        y0 = int(round(r * th)); y1 = int(round((r + 1) * th))
        ys = slice(y0, y1)
        v = (y[ys] - r * th)                         # 0..th
        xr = np.mod(x - r * offset_frac * tw, W)
        col = np.minimum((xr // tw).astype(int), ncols - 1)
        u = xr - col * tw                            # 0..tw
        vi = np.clip((v / th * TH).astype(int), 0, TH - 1)
        ui = np.clip((u / tw * TW).astype(int), 0, TW - 1)
        dv = np.minimum(v, th - v)[:, None]
        du = np.minimum(u, tw - u)[None, :]
        dist[ys] = np.minimum(dv, du)
        for c in range(ncols):
            a, h, ro = tile_fn(r, c, TW, TH)
            sel = col == c
            alb[ys, sel] = a[vi][:, ui[sel]]
            hgt[ys, sel] = h[vi][:, ui[sel]]
            rgh[ys, sel] = ro[vi][:, ui[sel]]
    # grout + bevel
    rng = np.random.default_rng(seed)
    gnoise = gblur(rng.standard_normal((H, W)), 0.8, wrap=True)
    gnoise /= gnoise.std() + 1e-9
    t = smoothstep(grout_hw - 0.6, grout_hw + 0.6, dist)          # 0 grout, 1 tile
    p = np.clip((dist - grout_hw) / max(bevel_px, 1e-6), 0, 1)
    bevel = -bevel_mm * (1 - np.sqrt(np.maximum(0, 1 - (1 - p) ** 2)))
    g_alb = grout_lin[None, None, :] * (1 + 0.06 * gnoise[..., None])
    alb = alb * t[..., None] + g_alb * (1 - t[..., None])
    g_h = -grout_depth_mm + 0.03 * gnoise
    hgt = (hgt + bevel) * t + g_h * (1 - t)
    rgh = rgh * t + np.clip(grout_rough + 0.03 * gnoise, 0, 1) * (1 - t)
    return alb, hgt, rgh, dist


def hp_height(lin, sigma_px, amp_mm, blur=0.7, invert=False):
    """Micro height (mm) from the luminance high-pass of a (tileable) albedo."""
    L = np.log(lum(lin) + 1e-3)
    hp = L - gblur(L, sigma_px, wrap=True)
    hp = gblur(hp, blur, wrap=True)
    hp /= hp.std() + 1e-9
    return (-hp if invert else hp) * amp_mm


def contrast_rough(lin, base, gain, sigma=3, lo=0.04, hi=1.0, sign=1.0):
    """Roughness from local contrast: busier / brighter-speckled areas rougher."""
    L = np.log(lum(lin) + 1e-3)
    hp = L - gblur(L, 12, wrap=True)
    ls = local_std(hp, sigma)
    ls = (ls - ls.mean()) / (ls.std() + 1e-9)
    return np.clip(base + sign * gain * ls, lo, hi)


def prep_photo_patch(a, mask=None, flat_sigma=None, target=None, contrast=1.0):
    lin = s2l(a)
    if flat_sigma:
        lin = flatten(lin, flat_sigma, mask)
    if contrast != 1.0:
        lin = set_contrast(lin, contrast)
    if target:
        lin = match_mean(lin, target, mask)
    return lin


def trim(a, frac):
    """Cut frac of the size off every side (to lose grout / edges) and
    resize back to the original size."""
    H, W = a.shape[:2]
    dy, dx = int(H * frac), int(W * frac)
    im = Image.fromarray(np.round(np.clip(a, 0, 1) * 255).astype(np.uint8))
    im = im.crop((dx, dy, W - dx, H - dy)).resize((W, H), Image.LANCZOS)
    return np.asarray(im, np.float64) / 255.0


def resize_f(a, w, h):
    """Resize a float array (H,W[,C]) with Lanczos via per-channel 'F' images."""
    if a.ndim == 2:
        return np.asarray(Image.fromarray(a.astype(np.float32)).resize((w, h), Image.LANCZOS), np.float64)
    return np.stack([resize_f(a[..., c], w, h) for c in range(a.shape[2])], -1)


# --------------------------------------------------------------------------
# photo-derived textures
# --------------------------------------------------------------------------

def tex_floor_plank():
    """12x24 wood-look porcelain plank, running bond 1/3 offset.  Planks run
    along V (image vertical); repeat = 3 planks across (36") x 1 plank long (24")."""
    PPI = 2048 / 36.0
    L, Wd = int(round(24 * PPI)), int(round(12 * PPI))          # 1365 x 683
    p20 = photo(20)
    # plank B: full plank near the door, photo 20
    B, _ = warp(p20, [(1652, 2966), (2300, 3106), (2376, 3463), (1590, 3260)], L, Wd)
    # plank A: the plank below it; its far end corner leaves the frame, so keep
    # the first 70% of its length and stretch it (the streaks run lengthwise)
    A, mA = warp(p20, [(1836, 3333), (2691, 3550), (2908, 4168), (1803, 3805)], L, Wd)
    A = resize_f(A[:, :int(0.70 * L)], L, Wd)
    srcs = []
    for a in (B, A, B[::-1, ::-1]):
        a = trim(a, 0.025)
        srcs.append(prep_photo_patch(a, flat_sigma=90))
    allm = np.mean([s.reshape(-1, 3).mean(0) for s in srcs], 0)
    t = hex2lin("#4A433F")
    srcs = [per_tile_jitter(s * (t / allm), 0.05, 100 + i, 0.015) for i, s in enumerate(srcs)]
    srcs = [set_contrast(s, 1.15) for s in srcs]

    def tile_fn(r, c, TW, TH):
        a = srcs[r % 3]
        if a.shape[1] != TW or a.shape[0] != TH:
            a = resize_f(a, TW, TH)
        h = hp_height(a, 4, 0.04)
        ro = contrast_rough(a, 0.58, 0.05)
        return a, h, ro

    # lay out with planks along x, then transpose so they run along V
    alb, hgt, rgh, _ = compose_tiles(L, 3 * Wd, L, Wd, 1 / 3, tile_fn, grout_hw=0.0625 * PPI,
                                     grout_lin=hex2lin("#85827D"), bevel_px=0.06 * PPI, bevel_mm=1.0,
                                     grout_depth_mm=1.2, grout_rough=0.92, seed=11)
    alb, hgt, rgh = alb.transpose(1, 0, 2), hgt.T, rgh.T
    alb = resize_f(alb, 2048, 1365); hgt = resize_f(hgt, 2048, 1365); rgh = resize_f(rgh, 2048, 1365)
    px_mm = 36 * 25.4 / 2048
    return entry("floor_plank", alb, (36 * IN, 24 * IN), normal_map(hgt, px_mm), rgh,
                 plankAxis="v", tileSizeIn=[12, 24],
                 note="planks run along V (image vertical): map V to world Z (N-S)")


def tex_wainscot():
    """12x24 grey stone-look porcelain, running bond 1/2 offset, light grout.
    Repeat = 2 tiles wide x 2 rows (48" x 24")."""
    PPI = 2048 / 48.0
    a, _ = warp(photo(53), [(2850, 2045), (5600, 1815), (5430, 2860), (2835, 3850)], 1024, 512)
    a = trim(a, 0.02)
    A = prep_photo_patch(a, flat_sigma=120, target="#8A8581", contrast=1.0)
    variants = [A, A[::-1, ::-1], A[:, ::-1], A[::-1, :]]
    srcs = {}
    for k, v in enumerate(variants):
        srcs[k] = per_tile_jitter(v, 0.035, 200 + k, 0.012)

    def tile_fn(r, c, TW, TH):
        a = srcs[(r * 2 + c) % 4]
        if a.shape[1] != TW or a.shape[0] != TH:
            a = resize_f(a, TW, TH)
        return a, hp_height(a, 3, 0.03), contrast_rough(a, 0.5, 0.06)

    alb, hgt, rgh, _ = compose_tiles(2048, 1024, 1024, 512, 0.5, tile_fn, grout_hw=0.0625 * PPI,
                                     grout_lin=hex2lin("#B3B0AA"), bevel_px=0.08 * PPI, bevel_mm=0.8,
                                     grout_depth_mm=1.0, grout_rough=0.9, seed=21)
    px_mm = 48 * 25.4 / 2048
    return entry("wainscot", alb, (48 * IN, 24 * IN), normal_map(hgt, px_mm), rgh, tileSizeIn=[24, 12])


def tex_accent_band():
    """Charcoal 12x24 band tile (one course).  Repeat = 2 tiles wide x 1 tall."""
    PPI = 2048 / 48.0
    # the band in photo 32 from the inside corner to the image edge: exactly
    # two 24" tiles; the joint sits at 680/1400 of the rectified strip
    a, _ = warp(photo(32), [(1632, 1037), (3024, 897), (3024, 1309), (1632, 1372)], 2108, 512)
    t1, t2 = a[:, 0:1024], a[:, 1040:2064]
    srcs = []
    for t in (t1, t2):
        t = trim(t, 0.025)
        srcs.append(prep_photo_patch(t, flat_sigma=140, target="#383637", contrast=1.0))

    def tile_fn(r, c, TW, TH):
        a = srcs[c % 2]
        if a.shape[1] != TW or a.shape[0] != TH:
            a = resize_f(a, TW, TH)
        return a, hp_height(a, 3, 0.03), contrast_rough(a, 0.45, 0.06)

    alb, hgt, rgh, _ = compose_tiles(2048, 512, 1024, 512, 0.0, tile_fn, grout_hw=0.0625 * PPI,
                                     grout_lin=hex2lin("#8E8B86"), bevel_px=0.08 * PPI, bevel_mm=0.8,
                                     grout_depth_mm=1.0, grout_rough=0.9, seed=31)
    px_mm = 48 * 25.4 / 2048
    return entry("accent_band", alb, (48 * IN, 12 * IN), normal_map(hgt, px_mm), rgh, tileSizeIn=[24, 12])


def tex_vanity_wood():
    """Grey horizontal wood-grain laminate: the right-hand door in photo 24."""
    a, _ = warp(photo(24), [(1733, 2483), (2517, 2842), (2400, 3633), (1742, 3133)], 900, 1100)
    a = a[210:1090, 0:880]                       # below the door pull, inside the edges
    a = np.asarray(Image.fromarray(np.round(a * 255).astype(np.uint8)).resize((1024, 1024), Image.LANCZOS)) / 255.0
    lin = prep_photo_patch(a, flat_sigma=110, contrast=1.1)
    lin = make_tileable(lin, band=0.2, axes=(1,))
    lin = make_tileable(lin, band=0.08, axes=(0,))
    lin = match_mean(lin, "#5A5550")
    h = hp_height(lin, 6, 0.04)
    rough = contrast_rough(lin, 0.5, 0.05)
    px_mm = 17.6 * 25.4 / 1024
    return entry("vanity_wood", lin, (17.6 * IN, 17.6 * IN), normal_map(h, px_mm), rough,
                 grain="horizontal (along U)")


def tex_quartz():
    """White speckled quartz from photo 51 (between the soap and the glass)."""
    # 620 x 954 px of counter at ~280 px/in; stretch y by 1.25 to undo the
    # oblique view, then resample to 256 px/in -> 567 x 1090
    p = photo(51).crop((4070, 3330, 4690, 4284)).resize((567, 1090), Image.LANCZOS)
    a = np.asarray(p, np.float64) / 255.0
    lin = prep_photo_patch(a, flat_sigma=50)[33:33 + 1024]
    # the patch and its 180-degree rotation side by side, soft seams, cyclic
    W = 1024
    canvas = np.zeros((1024, W, 3)); wsum = np.zeros((1024, W, 1))
    w = _ramp(567, 0.09)[None, :, None]
    for i, src in enumerate((lin, lin[::-1, ::-1])):
        xs = (np.arange(567) + i * (W // 2) - 22) % W
        canvas[:, xs] += src * w; wsum[:, xs] += w
    lin = canvas / np.maximum(wsum, 1e-6)
    lin = make_tileable(lin, band=0.1, axes=(0,))
    lin = match_mean(lin, "#DAD7D2")
    h = hp_height(lin, 3, 0.004)
    rough = np.clip(0.1 + 0.04 * (lum(lin) < lum(lin).mean() * 0.8), 0, 1)
    px_mm = 4 * 25.4 / 1024
    return entry("quartz", lin, (4 * IN, 4 * IN), normal_map(h, px_mm), rough)


def paint_swatch(idx, box, target, size_in, amp_mm, rough_base, name, contrast):
    a = np.asarray(photo(idx).crop(box).resize((512, 512), Image.LANCZOS), np.float64) / 255.0
    lin = prep_photo_patch(a, flat_sigma=40)
    lin = make_tileable(lin, band=0.25)
    lin = set_contrast(lin, contrast)
    lin = match_mean(lin, target)
    h = hp_height(lin, 6, amp_mm)
    rough = np.clip(rough_base + 0.02 * (h / (amp_mm + 1e-9)), 0, 1)
    px_mm = size_in * 25.4 / 512
    mean = lin.reshape(-1, 3).mean(0)
    return entry(name, lin, (size_in * IN, size_in * IN), normal_map(h, px_mm), rough, color=lin2hex(mean))


def tex_wall_paint():
    """Gray-sage drywall paint: roller stipple from the lit wall in photo 20
    (left of the door), colour set to SPEC's #B8BFBB."""
    return paint_swatch(20, (1250, 1000, 1650, 1400), "#B8BFBB", 12, 0.015, 0.82, "wall_paint", 0.6)


def tex_door_slab():
    """The gray door's flat paint, photo 19 between the 2nd and 3rd grooves."""
    return paint_swatch(19, (1000, 1460, 1400, 1860), "#6B6C6B", 16, 0.01, 0.6, "door_slab", 0.7)


def tex_rattan():
    """Natural rattan weave, centre of the oval chandelier body in photo 00.
    Rotated 3 deg and sheared so reeds are horizontal and stakes vertical; the
    crop is exactly 7 stake periods (103 px) x 13 reed rows (37.6 px)."""
    im = photo(0).rotate(3.25, Image.BICUBIC, center=(1700, 900))
    x0, y0 = 1350, 651
    x1, y1 = x0 + 721, y0 + 489
    s = 0.08 * (y1 - y0)

    def quad(dy, dx):
        # dy lifts the right edge (aligns wavy reeds across the U wrap),
        # dx shifts the bottom edge (aligns leaning stakes across the V wrap)
        return [(x0 + s, y0), (x1 + s, y0 - dy), (x1 + dx, y1 - dy), (x0 + dx, y1)]

    def edge_corr(a, axis):
        L = lum(a)
        if axis == 0:
            p, q = L[:, :12].mean(1), L[:, -12:].mean(1)
        else:
            p, q = L[:12].mean(0), L[-12:].mean(0)
        return np.corrcoef(p, q)[0, 1]

    dy = max(range(-20, 21, 2), key=lambda d: edge_corr(warp(im, quad(d, 0), 721, 489, ss=1)[0], 0))
    dx = max(range(-50, 51, 5), key=lambda d: edge_corr(warp(im, quad(dy, d), 721, 489, ss=1)[0], 1))
    print(f"  rattan edge alignment: dy={dy} dx={dx}")
    a, _ = warp(im, quad(dy, dx), 1024, 694)
    lin = s2l(a)
    # alpha: rattan is warm/saturated and mid-bright; gaps are grey sky/ceiling or deep shadow
    R, G, B = lin[..., 0], lin[..., 1], lin[..., 2]
    L = lum(lin)
    warm = (R - B) / (L + 0.02)
    al = smoothstep(0.25, 0.55, warm) * smoothstep(0.012, 0.035, L)
    al = gblur(al, 0.8)
    al = np.clip((al - 0.15) / 0.7, 0, 1)
    # albedo: flatten using only rattan pixels, then fill gaps with local rattan colour
    lin = flatten(lin, 60, mask=al)
    m = al[..., None]
    fill = gblur(lin * m, 6) / np.maximum(gblur(np.repeat(m, 3, 2), 6), 1e-3)
    lin = lin * m + fill * (1 - m)
    lin = make_tileable(lin, band=0.07)
    al = make_tileable(al, band=0.07)
    al = np.clip(al, 0, 1)
    lin = match_mean(lin, "#8D7865", mask=al)
    # height: brightness within the strands (round reeds catch light on top) + deep gaps
    Ls = np.log(lum(lin) + 1e-3)
    hp = Ls - gblur(Ls, 10, wrap=True)
    hp = gblur(hp / (hp.std() + 1e-9), 1.2, wrap=True)
    h = 0.6 * hp + 2.2 * gblur(al, 2.0, wrap=True)
    rough = np.clip(0.72 + 0.08 * (1 - al) - 0.04 * hp, 0, 1)
    px_mm = 7.36 * 25.4 / 1024
    return entry("rattan", lin, (7.36 * IN, 4.99 * IN), normal_map(h, px_mm), rough, alpha=al)


def tex_wood_frame():
    """Cherry/mahogany of the oval mirror's frame (photo 09, rotated 16.7 deg so
    the face runs vertical).  Six 4"-long strips of the 0.66"-wide flat face are
    laid side by side with soft seams along the grain."""
    im = photo(9).rotate(16.7, Image.BICUBIC)
    starts = [(1000, False), (1520, False), (2040, False), (2552, False), (1260, True), (1800, True)]
    n = len(starts)
    W = 1024
    sw = int(W / n + 40)
    canvas = np.zeros((1024, W, 3)); wsum = np.zeros((1024, W, 1))
    w = _ramp(sw, 0.11)[None, :, None]
    for i, (ys, flip) in enumerate(starts):
        st = im.crop((2180, ys, 2520, ys + 2048)).resize((sw, 1024), Image.LANCZOS)
        a = s2l(np.asarray(st, np.float64) / 255.0)
        a = flatten(a, 120)
        # the face is slightly rounded: divide out the across-grain shading
        col = a.mean(0, keepdims=True)
        a = a / np.maximum(col, 1e-5) * a.reshape(-1, 3).mean(0)
        a = a * (1 + 0.02 * ((i * 37) % 7 - 3) / 3)
        if flip:
            a = a[::-1, ::-1]
        xs = (np.arange(sw) + int(round(i * W / n)) - 20) % W
        canvas[:, xs] += a * w; wsum[:, xs] += w
    lin = canvas / np.maximum(wsum, 1e-6)
    lin = make_tileable(lin, band=0.15, axes=(0,))
    lin = match_mean(lin, "#7A4238")
    lin = set_contrast(lin, 1.1)
    h = hp_height(lin, 4, 0.02)
    rough = contrast_rough(lin, 0.38, 0.04)
    px_mm = 4 * 25.4 / 1024
    return entry("wood_frame", lin, (4 * IN, 4 * IN), normal_map(h, px_mm), rough, grain="along V")


def tex_frosted_glass():
    """Obscure (rolled 'rain'/stipple) glass of the window, photo 54 (straight on).
    Albedo is near-white; the look lives in the normal + roughness maps."""
    a = np.asarray(photo(54).crop((2300, 400, 3800, 1900)).resize((1024, 1024), Image.LANCZOS), np.float64) / 255.0
    lin = prep_photo_patch(a, flat_sigma=50)
    lin = make_tileable(lin, band=0.15)
    L = np.log(lum(lin) + 1e-3)
    hp = L - gblur(L, 14, wrap=True)
    hp = gblur(hp, 1.0, wrap=True)
    hp /= hp.std() + 1e-9
    h = hp * 0.12                                    # mm
    alb = match_mean(set_contrast(lin, 0.15), "#E3E8E5")
    rough = np.clip(0.18 + 0.06 * np.abs(hp), 0, 1)
    px_mm = 6.5 * 25.4 / 1024
    return entry("frosted_glass", alb, (6.5 * IN, 6.5 * IN), normal_map(h, px_mm), rough)


# --------------------------------------------------------------------------
# procedural textures
# --------------------------------------------------------------------------

def tex_curtain():
    """Dark grey waffle-weave fabric (photos 12, 25): ~10 mm waffle cells with a
    plain-weave thread texture.  Procedural so the grid tiles exactly; colour
    and cell proportions measured from the photos."""
    N = 1024
    cells = 16                                       # 16 cells of 10 mm -> 160 mm repeat
    x = (np.arange(N) + 0.5) / N * cells
    u = (x - np.floor(x)) - 0.5
    U, V = np.meshgrid(u, u)
    # pocket = recessed square in each cell, ridges between
    r = np.maximum(np.abs(U), np.abs(V))
    pocket = 1 - smoothstep(0.24, 0.36, r)          # 1 inside pocket
    # threads: plain weave, 7 threads per cell each way
    th = 7 * cells
    X, Y = np.meshgrid((np.arange(N) + 0.5) / N * th, (np.arange(N) + 0.5) / N * th)
    parity = (np.floor(X) + np.floor(Y)) % 2
    weave = np.where(parity == 0, np.sin(np.pi * (Y - np.floor(Y))), np.sin(np.pi * (X - np.floor(X))))
    rng = np.random.default_rng(41)
    fuzz = gblur(rng.standard_normal((N, N)), 0.7, wrap=True)
    fuzz /= fuzz.std()
    slub = value_noise((N, N), 24, 42, octaves=3)
    h = -0.9 * pocket + 0.12 * weave + 0.02 * fuzz        # mm
    base = hex2lin("#6E6F77")
    shade = (1 - 0.22 * pocket) * (1 + 0.06 * weave - 0.03) * (1 + 0.03 * fuzz) * (1 + 0.05 * slub)
    alb = base[None, None, :] * shade[..., None]
    alb = match_mean(alb, "#6B6C74")
    rough = np.clip(0.92 + 0.04 * pocket - 0.03 * weave, 0, 1)
    px_mm = 160 / N
    return entry("curtain", alb, (0.16, 0.16), normal_map(h, px_mm), rough)


def voronoi_cracks(shape, ncell, seed, width=1.0):
    """Tileable crack network (F2-F1 of jittered-grid Voronoi). 1 on cracks."""
    H, W = shape
    rng = np.random.default_rng(seed)
    cs = W / ncell
    ny = int(round(H / cs))
    jit = rng.uniform(0, 1, (ny, ncell, 2))
    y = (np.arange(H) + 0.5)[:, None]; x = (np.arange(W) + 0.5)[None, :]
    gy = (y // cs).astype(int); gx = (x // cs).astype(int)
    f1 = np.full((H, W), 1e9); f2 = np.full((H, W), 1e9)
    for oy in (-1, 0, 1):
        for ox in (-1, 0, 1):
            cy = gy + oy; cx = gx + ox
            jj = jit[cy % ny, cx % ncell]
            py = (cy + jj[..., 0]) * cs; px = (cx + jj[..., 1]) * cs
            d = np.sqrt((y - py) ** 2 + (x - px) ** 2)
            f2 = np.where(d < f1, f1, np.minimum(f2, d))
            f1 = np.minimum(f1, d)
    return 1 - smoothstep(0, width, f2 - f1)


def tex_tile_sage_fan():
    """Daltile Handcrafted Sage Fan: fish-scale fans 4" wide, rows 2" apart,
    alternate rows offset half a fan; lower rows overlap upper ones.  Repeat =
    6 fans x 12 rows = 24" x 24"."""
    N = 2048
    PPI = N / 24.0
    R = 2.0 * PPI                                    # fan radius (px) = half width
    pitch = R
    ncol, nrow = 6, 12
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64) + 0.5
    best_key = np.full((N, N), np.inf); best_id = np.full((N, N), -1, int)
    best_d = np.zeros((N, N)); best_dy = np.zeros((N, N))
    fans = []
    for r in range(nrow):
        for c in range(ncol):
            fans.append(((c + 0.5 * (r % 2)) * 2 * R, r * pitch))
    # pass 1: winner = lowest-centred fan that covers the pixel (lower rows on top)
    for k, (cx, cy) in enumerate(fans):
        dx = np.mod(xx - cx + N / 2, N) - N / 2
        dy = np.mod(yy - cy + N / 2, N) - N / 2
        d = np.sqrt(dx * dx + dy * dy)
        cov = d < R
        key = dy                                     # smaller = this fan centred lower
        upd = cov & (key < best_key)
        best_key = np.where(upd, key, best_key); best_id = np.where(upd, k, best_id)
        best_d = np.where(upd, d, best_d); best_dy = np.where(upd, dy, best_dy)
    # pass 2: distance to the visible edge = own arc or the arcs of fans lying over it
    edge = R - best_d
    for k, (cx, cy) in enumerate(fans):
        dx = np.mod(xx - cx + N / 2, N) - N / 2
        dy = np.mod(yy - cy + N / 2, N) - N / 2
        d = np.sqrt(dx * dx + dy * dy)
        over = (dy < best_key) & (best_id != k)
        edge = np.where(over, np.minimum(edge, np.abs(d - R)), edge)
    rng = np.random.default_rng(51)
    nf = len(fans)
    light = 1 + rng.uniform(-0.06, 0.06, nf)
    hue = rng.uniform(-1, 1, (nf, 3)) * np.array([0.03, 0.015, 0.035])
    base = hex2lin("#7E8676")
    fan_col = base[None, :] * light[:, None] * (1 + hue)
    alb = fan_col[best_id]
    t_down = np.clip(best_dy / R, -1, 1)            # -1 top of fan .. +1 tip
    grout_hw = 0.06 * PPI
    e = edge - grout_hw
    rim = np.exp(-np.maximum(e, 0) / (0.12 * PPI))  # glaze thins over the rounded rim
    mott = value_noise((N, N), 18, 52, octaves=4)
    crack = voronoi_cracks((N, N), 34, 53, width=1.1)
    pool = smoothstep(0, 0.45 * R, e)             # thicker, darker glaze away from the rim
    shade = (1 + 0.20 * rim) * (1 - 0.10 * pool) * (1 + 0.07 * mott) * (1 - 0.05 * crack)
    alb = alb * shade[..., None]
    # pooled glaze near the tip is a touch more saturated
    g = lum(alb)[..., None]
    sat = 1 + 0.12 * np.clip(t_down, 0, 1)[..., None]
    alb = np.clip(g + (alb - g) * sat, 0, 1)
    # height (mm): pillowed handmade face, wavy glaze, grout recess
    pill = np.sqrt(np.clip(e / (0.16 * PPI), 0, 1))
    wav = value_noise((N, N), 10, 54, octaves=3)
    h_tile = -1.6 * (1 - pill) + 0.08 * wav - 0.006 * crack
    t = smoothstep(-0.6, 0.6, e)
    gn = gblur(rng.standard_normal((N, N)), 0.8, wrap=True); gn /= gn.std()
    grout = hex2lin("#BDBAB2")[None, None, :] * (1 + 0.05 * gn[..., None])
    alb = alb * t[..., None] + grout * (1 - t[..., None])
    h = h_tile * t + (-2.0 + 0.03 * gn) * (1 - t)
    rough = (np.clip(0.11 + 0.025 * mott + 0.05 * crack, 0, 1)) * t + np.clip(0.9 + 0.03 * gn, 0, 1) * (1 - t)
    px_mm = 24 * 25.4 / N
    return entry("tile_sage_fan", alb, (24 * IN, 24 * IN), normal_map(h, px_mm), rough,
                 fanWidthIn=4, rowPitchIn=2, fans=[6, 12])


def tex_tile_white_subway_stacked():
    """3x6 white glass subway, stacked grid, long edge horizontal, 1/16" white
    grout.  Repeat = 4 x 8 tiles = 24" x 24"."""
    N = 2048
    PPI = N / 24.0
    rng = np.random.default_rng(61)
    base = hex2lin("#F1F3F1")

    def tile_fn(r, c, TW, TH):
        k = r * 4 + c
        rr = np.random.default_rng(600 + k)
        yy, xx = np.mgrid[0:TH, 0:TW].astype(np.float64) + 0.5
        d = np.minimum(np.minimum(xx, TW - xx), np.minimum(yy, TH - yy))
        depth = rr.uniform(-1, 1)                    # how much the backing reads through
        cloud = value_noise((TH, TW), 6, 610 + k, octaves=3)
        edge = np.exp(-d / (0.10 * PPI))             # thicker glass seen at the eased edge
        col = base * (1 + 0.012 * depth) * np.array([1 - 0.004 * depth, 1.0, 1 + 0.006 * depth])
        a = col[None, None, :] * (1 + 0.012 * cloud[..., None])
        tint = np.array([0.90, 0.96, 0.95])          # glass edge: a little green-grey
        a = a * (1 - edge[..., None] * (1 - tint))
        h = 0.02 * cloud
        ro = np.clip(0.08 + 0.01 * cloud, 0, 1)
        return a, h, ro

    alb, hgt, rgh, _ = compose_tiles(N, N, 6 * PPI, 3 * PPI, 0.0, tile_fn, grout_hw=1 / 32 * PPI,
                                     grout_lin=hex2lin("#F6F6F3"), bevel_px=0.09 * PPI, bevel_mm=1.2,
                                     grout_depth_mm=1.4, grout_rough=0.85, seed=62)
    px_mm = 24 * 25.4 / N
    return entry("tile_white_subway_stacked", alb, (24 * IN, 24 * IN), normal_map(hgt, px_mm), rgh,
                 tileSizeIn=[6, 3], layout="stacked 4 x 8")


def tex_wallpaper_sample():
    """Placeholder muted botanical wallpaper: sage + eucalyptus leaves on
    brass stems over warm off-white.  Drawn at 2x and reduced; seamless
    because every motif is also drawn at its wrapped positions."""
    N = 1024
    S = 2 * N
    bg = (232, 227, 216)
    img = Image.new("RGB", (S, S), bg)
    dr = ImageDraw.Draw(img)
    rng = np.random.default_rng(71)
    sage, euc, brass = (141, 155, 133), (94, 110, 98), (168, 143, 92)

    def leaf(cx, cy, ang, ln, wd, col):
        t = np.linspace(0, 1, 24)
        xs = t * ln; ys = np.sin(np.pi * t) ** 0.9 * wd / 2
        pts = list(zip(xs, ys)) + list(zip(xs[::-1], -ys[::-1]))
        ca, sa = math.cos(ang), math.sin(ang)
        P = [(cx + px * ca - py * sa, cy + px * sa + py * ca) for px, py in pts]
        mid = [(cx, cy), (cx + ln * 0.9 * ca, cy + ln * 0.9 * sa)]
        return P, mid, col

    shapes = []
    grid = 3
    for gy in range(grid):
        for gx in range(grid):
            ox = (gx + 0.5 + rng.uniform(-0.18, 0.18) + 0.5 * (gy % 2)) * S / grid
            oy = (gy + 0.5 + rng.uniform(-0.15, 0.15)) * S / grid
            base_ang = rng.uniform(-0.9, 0.9) - math.pi / 2
            L = rng.uniform(0.22, 0.30) * S
            # curved stem as a quadratic curve
            bend = rng.uniform(-0.25, 0.25)
            ts = np.linspace(0, 1, 40)
            ang = base_ang + bend * (ts - 0.5) * 2
            sx = ox + np.cumsum(np.cos(ang)) * L / 40 - L / 2 * math.cos(base_ang)
            sy = oy + np.cumsum(np.sin(ang)) * L / 40 - L / 2 * math.sin(base_ang)
            shapes.append(("stem", list(zip(sx, sy)), brass))
            nleaf = rng.integers(5, 8)
            for j in range(nleaf):
                i = int((j + 0.6) / (nleaf + 0.2) * 39)
                side = 1 if j % 2 == 0 else -1
                la = ang[i] + side * rng.uniform(0.6, 1.0)
                ln = rng.uniform(0.07, 0.10) * S * (1 - 0.35 * j / nleaf)
                col = sage if rng.uniform() < 0.6 else euc
                shapes.append(("leaf",) + leaf(sx[i], sy[i], la, ln, ln * rng.uniform(0.38, 0.48), col))
            tl = ang[-1]
            shapes.append(("leaf",) + leaf(sx[-1], sy[-1], tl, 0.07 * S, 0.03 * S, euc))
    # small berries / buds in brass between sprigs
    for _ in range(14):
        bx, by = rng.uniform(0, S, 2)
        shapes.append(("dot", (bx, by), brass))
    for ox in (-S, 0, S):
        for oy in (-S, 0, S):
            for sh in shapes:
                if sh[0] == "stem":
                    dr.line([(x + ox, y + oy) for x, y in sh[1]], fill=sh[2], width=7, joint="curve")
                elif sh[0] == "leaf":
                    P, mid, col = sh[1], sh[2], sh[3]
                    dr.polygon([(x + ox, y + oy) for x, y in P], fill=col)
                    dk = tuple(int(v * 0.86) for v in col)
                    dr.line([(x + ox, y + oy) for x, y in mid], fill=dk, width=3)
                else:
                    (bx, by), col = sh[1], sh[2]
                    dr.ellipse([bx + ox - 9, by + oy - 9, bx + ox + 9, by + oy + 9], fill=col)
    img = img.resize((N, N), Image.LANCZOS)
    s = np.asarray(img, np.float64) / 255.0
    paper = value_noise((N, N), 64, 72, octaves=3)
    grain = gblur(np.random.default_rng(73).standard_normal((N, N)), 0.6, wrap=True)
    grain /= grain.std()
    lin = s2l(s) * (1 + 0.015 * paper + 0.01 * grain)[..., None]
    ink = 1 - smoothstep(0.0, 0.05, np.abs(s - np.array(bg) / 255.0).sum(-1))
    h = 0.01 * grain + 0.004 * paper + 0.01 * (1 - ink)
    rough = np.clip(0.86 - 0.04 * (1 - ink) + 0.02 * grain, 0, 1)
    px_mm = 530 / N
    return entry("wallpaper_sample", lin, (0.53, 0.53), normal_map(h, px_mm), rough)


# --------------------------------------------------------------------------
# product wallpapers (manufacturer images in assets/source/wallpapers/)
# --------------------------------------------------------------------------

def wallpaper_src(fname):
    """A downloaded product image (sRGB float array); see SOURCES.md."""
    return np.asarray(Image.open(os.path.join(WALLPAPER_SRC, fname)).convert("RGB"), np.float64) / 255.0


def resize_wrap(a, w, h, pad):
    """Resize a tileable float image to w x h without edge seams: wrap-pad
    `pad` source px on every side, resize, crop (pick pad so pad * scale is
    close to whole; the residual is a sub-pixel stretch)."""
    H0, W0 = a.shape[:2]
    py, px = int(round(pad * h / H0)), int(round(pad * w / W0))
    p = np.pad(a, ((pad, pad), (pad, pad)) + ((0, 0),) * (a.ndim - 2), mode="wrap")
    r = resize_f(p, w + 2 * px, h + 2 * py)
    return np.clip(r[py:py + h, px:px + w], 0, 1)


def paper_height(shape, seed, amp_mm=0.012):
    """Faint, tileable paper / non-woven grain (mm), for near-flat normals."""
    H, W = shape
    fine = gblur(np.random.default_rng(seed).standard_normal((H, W)), 0.8, wrap=True)
    fine /= fine.std() + 1e-9
    cloud = value_noise((H, W), max(2, W // 64), seed + 1, octaves=3)
    return amp_mm * (fine + 0.6 * cloud)


def tex_wallpaper_cole_son_feather_fan_soft_olive():
    """Cole & Son Icons Feather Fan, Soft Olive 112/10037 (Perigold QWH8178,
    "Old Olive").  Roll 0.53 m x 10.05 m, pattern repeat 10.6 cm, straight
    match.  Source: Perigold's 1200 px flat artwork = 3 fans (one roll width,
    53 cm) x 5 repeats (53 cm); fans 400 px wide, rows 120 px apart with
    alternate rows offset half a fan, so one rectangular repeat is 400 x 240 px
    = 17.67 cm x 10.6 cm.  The 15 repeats are averaged (removes JPEG noise;
    the artwork is digital, autocorrelation 0.997) and that single repeat,
    upscaled 3x, is the texture.  White dots are a slightly raised, satin ink
    on a matte paper ground."""
    src = wallpaper_src("Icons+Feather+Fan+Geometric+Wallpaper+Roll-29098963.jpg")
    assert src.shape[:2] == (1200, 1200), src.shape
    CW, CH, NX, NY = 400, 240, 3, 5
    lin = s2l(src)
    cell = np.mean([lin[j * CH:(j + 1) * CH, i * CW:(i + 1) * CW] for j in range(NY) for i in range(NX)], axis=0)
    K = 3
    W, H = CW * K, CH * K
    big = resize_wrap(cell, W, H, 20)                # wrapped, so the edges stay seamless
    size = (0.53 / NX, 0.106)
    px_mm = size[1] * 1000 / H
    L = lum(big)
    lo, hi = np.percentile(L, 5), np.percentile(L, 95)
    ink = smoothstep(0.25, 0.75, (L - lo) / max(hi - lo, 1e-6))      # 1 = white dot
    h = paper_height((H, W), 811) + 0.025 * gblur(ink, 1.0, wrap=True)
    rough = np.clip(0.86 - 0.24 * ink + 0.02 * gblur(np.random.default_rng(812).standard_normal((H, W)), 1, wrap=True), 0, 1)
    return entry("wallpaper_cole_son_feather_fan_soft_olive", big, size, normal_map(h, px_mm), rough,
                 source="assets/source/wallpapers/Icons+Feather+Fan+Geometric+Wallpaper+Roll-29098963.jpg",
                 rollWidthM=0.53, patternRepeatM=0.106, match="straight", color=lin2hex(big.reshape(-1, 3).mean(0)))


def tex_wallpaper_rebel_walls_ripple_blue():
    """Rebel Walls Ripple Blue (R19317), printed to wall size but a repeating
    design: the maker's pattern tile is 1000 x 1200 mm (horizontal + vertical
    repeat).  Source: the 2000 x 2401 Cloudinary original, one full repeat at
    0.5 mm/px (the 2401st row is an extra row: the period is 2400).  Reduced
    to 2048 px tall.  Rebel Mattic non-woven, matte."""
    src = wallpaper_src("R19317_product.jpg")
    assert src.shape[:2] == (2401, 2000), src.shape
    lin = s2l(src[:2400])
    H = 2048
    W = int(round(2000 * H / 2400))              # 1707
    small = resize_wrap(lin, W, H, 75)               # 75 src px -> 64 px
    size = (1.0, 1.2)
    px_mm = size[1] * 1000 / H
    h = paper_height((H, W), 821, 0.015)
    rough = np.clip(0.88 + 0.02 * gblur(np.random.default_rng(822).standard_normal((H, W)), 1, wrap=True), 0, 1)
    return entry("wallpaper_rebel_walls_ripple_blue", small, size, normal_map(h, px_mm), rough,
                 source="assets/source/wallpapers/R19317_product.jpg", match="straight (printed to wall size)",
                 color=lin2hex(small.reshape(-1, 3).mean(0)))


def tex_wallpaper_debona_crystal_trellis_blue_silver():
    """Debona Crystal Trellis, Blue / Silver 8894 (World of Wallpaper DEB052,
    B&Q 5060119353966).  Roll 0.53 m x 10.05 m, pattern repeat 16 cm,
    "offset" match.  Source: B&Q's 1502 x 1814 flat (the Scene7 original,
    scl=1) = one roll width (53 cm) x 4 repeats (64 cm), 0.353 mm/px.  World
    of Wallpaper's 1200 px flat is the top of the same artwork scaled 0.8x.
    Autocorrelation of the trellis mask: 0.9997 at (0, 751) and (907, 0)
    px; lanterns are 375.5 px (13.25 cm) wide, rows 453.5 px (16 cm) apart,
    alternate columns dropped half a row.  The crinkled "gathered silk"
    ground repeats with the trellis (0.95 luminance correlation).  Four
    lanterns fit the roll width exactly, so the strips butt with the lattice
    continuous: the whole image is the texture, unchanged (2 x 2 of the
    751 x 907 px tile, which is seamless when wrapped).
    Finish: metallic silver trellis ink (slightly raised, satin metal) on a
    matte midnight-blue textured ground with sparse glitter flecks.  The
    roughness PNG carries roughness in R/G and metalness in B (Three.js reads
    metalness from B), so the option uses it as both maps."""
    fname = "debona-crystal-trellis-navy-wallpaper-8894~5060119353966_01c_MP.jpg"
    src = wallpaper_src(fname)
    assert src.shape[:2] == (1814, 1502), src.shape
    lin = s2l(src)
    H, W = lin.shape[:2]
    size = (0.53, 0.64)                                  # 1 roll width x 4 x 16 cm repeats
    px_mm = size[1] * 1000 / H                           # 0.353 mm / px
    Ls = src.mean(2)                                     # sRGB: ground ~0.11, silver ~0.45
    ink = smoothstep(0.24, 0.36, gblur(Ls, 0.6, wrap=True))   # 1 = silver trellis
    ground = 1 - ink
    # crinkle relief of the ground (its printed shading), trellis ink raised ~0.03 mm
    L = np.log(lum(lin) + 1e-3)
    hp = L - gblur(L, 8, wrap=True)
    hp = gblur(hp * ground, 0.7, wrap=True)
    hp /= hp[ground > 0.5].std() + 1e-9
    h = 0.03 * hp + 0.03 * gblur(ink, 1.2, wrap=True) + paper_height((H, W), 831, 0.006)
    # sparse glitter flecks in the ground: ~0.4 % of texels, about 1 px across;
    # mip-mapping averages them into a faint lift of the ground sheen at distance
    rng = np.random.default_rng(832)
    fleck = gblur((rng.random((H, W)) > 0.996).astype(np.float64), 0.6, wrap=True)
    fleck = np.clip(fleck / (fleck.max() + 1e-9), 0, 1) * ground
    grain = gblur(rng.standard_normal((H, W)), 1, wrap=True)
    rough = np.clip(0.66 * ground + 0.38 * ink - 0.30 * fleck + 0.02 * grain, 0, 1)
    metal = np.clip(0.45 * ink + 0.35 * fleck, 0, 1)
    name = "wallpaper_debona_crystal_trellis_blue_silver"
    e = entry(name, lin, size, normal_map(h, px_mm))
    rm = np.round(np.clip(np.stack([rough, rough, metal], -1), 0, 1) * 255).astype(np.uint8)
    e["roughnessMap"] = _save(Image.fromarray(rm), f"{name}_rough.png", optimize=True)   # B = metalness
    e.update(source="assets/source/wallpapers/" + fname, rollWidthM=0.53, patternRepeatM=0.16,
             match="offset (lattice continuous across strips)", metalnessInRoughnessB=True,
             color=lin2hex(lin.reshape(-1, 3).mean(0)))
    return e


def tex_wallpaper_wow_metro_prism_emerald_gold():
    """World of Wallpaper Metro Prism geometric triangle, Emerald Green / Gold
    (WOW037; B&Q 3294270361047, "A361.AN-BUR").  Roll 0.53 m x 10.05 m,
    pattern repeat 17.6 cm, offset match, paste the paper, spongeable.
    Source: World of Wallpaper's 1200 x 1200 flat (the Magento original; B&Q's
    Scene7 image 04 is the same file, mean abs diff 0.04/255; neither stockist
    has a larger one) = one roll width x 3 repeats, 0.44 mm/px.
    Mask autocorrelation (zero-padded, overlap-normalised): lattice
    (dy, dx) = (400, 0) and (200, 300) px, i.e. a 600 x 400 px rectangular
    repeat holding two half-dropped motifs; 400 px = 17.6 cm sets the scale
    and 4 x 300 px = 1200 px = 53 cm, so the roll width is a lattice vector
    (the "offset" match is the half drop inside the artwork; the strips run on
    across the seams).  Texture = that 600 x 400 px repeat = 26.5 x 17.67 cm
    (53 / 2 x 53 / 3: the label's 17.6 cm is rounded), the six copies in the
    image averaged and upscaled 3x.
    Colour: a flat matte ground (sRGB 58,89,84 everywhere) with thin gold
    lines (~2 mm).  The flat bakes a light sweep into the gold (sRGB R 100..150
    across the image, different in every copy, so it is lighting, not print);
    the line coverage is taken from R - B, which the sweep leaves unchanged,
    and the lines are drawn in the median gold.  The renderer's metalness
    gives the angle-dependent sheen the page describes.
    Finish: metallic gold ink (partial metal, satin) on matte paper; the
    roughness PNG carries roughness in R/G and metalness in B."""
    fname = "wow037-metro-prism-geometric-triangle-wallpaper-green-gold.jpg"
    src = wallpaper_src(fname)
    assert src.shape[:2] == (1200, 1200), src.shape
    CH, CW = 400, 600
    # ink coverage from R - B: ground (58 - 84) = -26, gold ~ +62 at any sweep brightness
    rb = (src[..., 0] - src[..., 2]) * 255
    cov = np.clip((rb + 26) / 88, 0, 1)
    ground_s = np.median(src[cov < 0.05], 0)
    gold_s = np.median(src[cov > 0.95], 0)
    cell = np.mean([cov[j * CH:(j + 1) * CH, i * CW:(i + 1) * CW] for j in range(3) for i in range(2)], axis=0)
    K = 3
    W, H = CW * K, CH * K                               # 1800 x 1200
    big = resize_wrap(cell[..., None], W, H, 20)[..., 0]
    ink = smoothstep(0.3, 0.7, big)                     # re-sharpen the upscaled antialiased lines
    ink = gblur(ink, 0.6, wrap=True)
    size = (0.53 / 2, 0.53 / 3)                         # 0.265 x 0.1767 m
    px_mm = size[1] * 1000 / H                          # 0.147 mm / px
    g_lin, k_lin = s2l(ground_s), s2l(gold_s)
    rng = np.random.default_rng(841)
    paper = value_noise((H, W), 36, 842, octaves=3)     # faint print / paper mottle (tileable)
    grain = gblur(rng.standard_normal((H, W)), 0.8, wrap=True)
    grain /= grain.std() + 1e-9
    lin = (g_lin * (1 - ink)[..., None] + k_lin * ink[..., None]) * (1 + 0.012 * paper + 0.006 * grain)[..., None]
    lin = np.clip(lin, 0, 1)
    h = paper_height((H, W), 843, 0.008) + 0.02 * gblur(ink, 1.5, wrap=True)   # ink sits ~0.02 mm proud
    rough = np.clip(0.86 * (1 - ink) + 0.34 * ink + 0.02 * gblur(rng.standard_normal((H, W)), 1, wrap=True), 0, 1)
    metal = np.clip(0.5 * ink, 0, 1)
    name = "wallpaper_wow_metro_prism_emerald_gold"
    e = entry(name, lin, size, normal_map(h, px_mm))
    rm = np.round(np.clip(np.stack([rough, rough, metal], -1), 0, 1) * 255).astype(np.uint8)
    e["roughnessMap"] = _save(Image.fromarray(rm), f"{name}_rough.png", optimize=True)   # B = metalness
    e.update(source="assets/source/wallpapers/" + fname, rollWidthM=0.53, patternRepeatM=0.176,
             match="offset (half drop inside the artwork; lattice continuous across strips)",
             metalnessInRoughnessB=True, groundSrgb=lin2hex(g_lin), inkSrgb=lin2hex(k_lin),
             color=lin2hex(lin.reshape(-1, 3).mean(0)))
    return e


BUILDERS = {
    "floor_plank": tex_floor_plank,
    "wainscot": tex_wainscot,
    "accent_band": tex_accent_band,
    "vanity_wood": tex_vanity_wood,
    "quartz": tex_quartz,
    "wall_paint": tex_wall_paint,
    "rattan": tex_rattan,
    "wood_frame": tex_wood_frame,
    "frosted_glass": tex_frosted_glass,
    "curtain": tex_curtain,
    "tile_sage_fan": tex_tile_sage_fan,
    "tile_white_subway_stacked": tex_tile_white_subway_stacked,
    "wallpaper_sample": tex_wallpaper_sample,
    "door_slab": tex_door_slab,
    "wallpaper_cole_son_feather_fan_soft_olive": tex_wallpaper_cole_son_feather_fan_soft_olive,
    "wallpaper_rebel_walls_ripple_blue": tex_wallpaper_rebel_walls_ripple_blue,
    "wallpaper_debona_crystal_trellis_blue_silver": tex_wallpaper_debona_crystal_trellis_blue_silver,
    "wallpaper_wow_metro_prism_emerald_gold": tex_wallpaper_wow_metro_prism_emerald_gold,
}


# --------------------------------------------------------------------------
# preview contact sheet
# --------------------------------------------------------------------------

def make_preview(entries):
    """Each albedo tiled 2x2 (so seams show) next to its normal map tiled 2x2."""
    cell = 300
    cols = 2
    rows = (len(entries) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (2 * cell + 30), rows * (cell + 26)), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    for i, e in enumerate(entries):
        gx, gy = (i % cols) * (2 * cell + 30), (i // cols) * (cell + 26)
        w_m, h_m = e["physicalSizeM"]
        # keep aspect: 2x2 tiles inside a cell x cell box
        sc = cell / (2 * max(w_m, h_m))
        tw, th = max(1, int(w_m * sc)), max(1, int(h_m * sc))
        for k, key in enumerate(("map", "normalMap")):
            if key not in e:
                continue
            im = Image.open(os.path.join(OUT_DIR, e[key])).convert("RGB").resize((tw, th), Image.LANCZOS)
            for ty in range(2):
                for tx in range(2):
                    sheet.paste(im, (gx + k * (cell + 10) + tx * tw, gy + 22 + ty * th))
        label = f"{e['name']}  {w_m:.3f} x {h_m:.3f} m" + (f"  {e['color']}" if "color" in e else "")
        d.text((gx + 4, gy + 5), label, fill=(255, 255, 210))
    path = os.path.join(OUT_DIR, "_preview.jpg")
    sheet.save(path, quality=85)
    print(f"  wrote _preview.jpg (contact sheet) {os.path.getsize(path) / 1024:.1f} KB")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", action="append", choices=ORDER, help="build just this texture (repeatable)")
    ap.add_argument("--no-preview", action="store_true", help="skip the _preview.jpg contact sheet")
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    names = args.only or ORDER
    old = {}
    if args.only and os.path.exists(MANIFEST):
        with open(MANIFEST) as f:
            old = {e["name"]: e for e in json.load(f)}
    t0 = time.time()
    new = {}
    for n in names:
        t = time.time()
        print(f"[{n}]")
        new[n] = BUILDERS[n]()
        print(f"  ({time.time() - t:.1f} s)")
    merged = [new.get(n) or old.get(n) for n in ORDER if (n in new or n in old)]
    with open(MANIFEST, "w") as f:
        json.dump(merged, f, indent=2)
        f.write("\n")
    print(f"  wrote manifest.json ({len(merged)} textures)")
    if not args.no_preview:
        make_preview(merged)
    total = sum(os.path.getsize(p) for p in glob.glob(os.path.join(OUT_DIR, "*")) if os.path.isfile(p))
    print(f"done in {time.time() - t0:.1f} s; assets/textures total {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
