"""Core helpers: alpha extraction, line cuts, part export."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import os, io, math

SRC = os.path.join(os.path.dirname(__file__), 'src')
OUT = os.path.join(os.path.dirname(__file__), 'assets')
os.makedirs(OUT, exist_ok=True)


def load_rgba(path):
    """Load image, key out the EXTERIOR white background only (keep interior whites)."""
    im = Image.open(path).convert('RGB')
    a = np.array(im).astype(np.float32)
    mn = a.min(2)                      # min channel
    near_white = mn >= 238             # background is 253-255
    # flood from border
    lbl, n = ndimage.label(near_white)
    border = np.concatenate([lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]])
    bg_ids = np.unique(border[border > 0])
    exterior = np.isin(lbl, bg_ids)
    # soft edge: pixels adjacent to exterior with high luminance become semi-transparent
    dil = ndimage.binary_dilation(exterior, iterations=2)
    alpha = np.where(exterior, 0.0, 1.0).astype(np.float32)
    edge_band = dil & ~exterior & (mn > 200)
    alpha[edge_band] = np.clip((238.0 - mn[edge_band]) / 38.0, 0.0, 1.0)
    # kill isolated specks
    solid = alpha > 0.02
    lbl2, n2 = ndimage.label(solid)
    if n2 > 0:
        sizes = ndimage.sum(solid, lbl2, range(1, n2 + 1))
        keep = np.isin(lbl2, np.where(sizes > 60)[0] + 1)
        alpha[~keep] = 0.0
    # --- defringe: replace edge RGB with the nearest fully-opaque colour
    rgb = a[:, :, :3].copy()
    opaque = alpha > 0.92
    if opaque.any():
        # nearest opaque pixel for every pixel
        ind = ndimage.distance_transform_edt(~opaque, return_distances=False, return_indices=True)
        near = rgb[ind[0], ind[1]]
        dist = ndimage.distance_transform_edt(~opaque)
        band = (alpha > 0.02) & ((alpha < 0.995) | (dist <= 1.6))
        rgb[band] = near[band]
    out = np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(out, 'RGBA'), alpha


def halfplane(w, h, x1, y1, x2, y2, keep='left'):
    """Boolean mask of the half plane. keep='left' => the sign() side <0 is kept."""
    yy, xx = np.mgrid[0:h, 0:w]
    cross = (xx - x1) * (y2 - y1) - (yy - y1) * (x2 - x1)
    if keep == 'left':
        return cross <= 0
    return cross >= 0


def ellipse(w, h, cx, cy, rx, ry):
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1.0


def rect(w, h, x0, y0, x1, y1):
    yy, xx = np.mgrid[0:h, 0:w]
    return (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)


def poly_mask(w, h, pts):
    from PIL import ImageDraw
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    return np.array(m) > 127


def cut(img_rgba, mask, bbox=None, feather=1.2):
    a = np.array(img_rgba)
    al = a[:, :, 3].astype(np.float32) / 255.0
    al = al * mask.astype(np.float32)
    if feather > 0:
        al = np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(feather))).astype(np.float32) / 255.0
        al = np.minimum(al, a[:, :, 3].astype(np.float32) / 255.0)
    out = a.copy()
    out[:, :, 3] = (al * 255).astype(np.uint8)
    if bbox is None:
        ys, xs = np.where(out[:, :, 3] > 3)
        bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    x0, y0, x1, y1 = [int(v) for v in bbox]
    crop = out[y0:y1, x0:x1]
    return Image.fromarray(crop, 'RGBA'), (x0, y0, x1, y1)


def save(img, name, scale=1.0):
    if scale != 1.0:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    p = os.path.join(OUT, name)
    img.save(p, optimize=True)
    return p


def b64(path):
    import base64
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()


def defringe_rgba(img, rim_dist=9.0):
    """Bleed the nearest solid colour into all transparent pixels.

    The source art has a light outline baked into the hair/silhouette, so we
    keep RGB as-is and only make sure transparent pixels do not carry white
    (otherwise downscaling bleeds a halo into the artwork).
    """
    a = np.array(img).astype(np.float32)
    al = a[:, :, 3] / 255.0
    solid = al > 0.05
    if not solid.any():
        return img
    ind = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    near = a[:, :, :3][ind[0], ind[1]]
    out = a[:, :, :3].copy()
    out[~solid] = near[~solid]
    a[:, :, :3] = np.clip(out, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')
