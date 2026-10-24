"""Chibi stick-figure rig — asset build.

Splits the uploaded bust into head / body / neck, cuts a clean eye out of the
blink sheet (as a shape + polygons, so the pupil can hide behind the lid) and
turns the 16-frame mouth chart into one aligned sprite sheet.
"""
import json, os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from lib import load_rgba

cv2.setNumThreads(0)
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
OUT = os.path.join(HERE, 'assets')
os.makedirs(OUT, exist_ok=True)

MAN = {}

# ------------------------------------------------------------------ character
char, _ = load_rgba(os.path.join(SRC, 'char.png'))
CW, CH = char.size
A = np.array(char)
alpha = A[:, :, 3]
solid = alpha > 40

# --- find the neck: narrowest row in the chin..collar band
band = solid[600:720].sum(1)
neck_y = 600 + int(np.argmin(band))
print('neck row', neck_y, 'width', band.min())

SPLIT = neck_y + 2                     # head keeps everything above
head = A.copy(); head[SPLIT:] = 0
body = A.copy(); body[:SPLIT] = 0

# trim both to their content boxes and remember where they sit
def crop_rgba(arr):
    a = arr[:, :, 3]
    ys, xs = np.where(a > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return arr[y0:y1, x0:x1], (int(x0), int(y0))

head_a, head_xy = crop_rgba(head)
body_a, body_xy = crop_rgba(body)
Image.fromarray(head_a, 'RGBA').save(os.path.join(OUT, 'head.png'))
Image.fromarray(body_a, 'RGBA').save(os.path.join(OUT, 'body.png'))
print('head', head_a.shape[1], 'x', head_a.shape[0], head_xy, ' body', body_a.shape[1], 'x', body_a.shape[0], body_xy)

# --- neck stub (drawn behind the head so a tilted head never opens a hole)
nx0, nx1 = 655 - 88, 655 + 88
stub_top, stub_bot = neck_y - 70, neck_y + 70
stub = Image.new('RGBA', (nx1 - nx0, stub_bot - stub_top), (0, 0, 0, 0))
d = ImageDraw.Draw(stub)
d.rounded_rectangle([0, 0, stub.width - 1, stub.height - 1], radius=40, fill=(218, 155, 109, 255))
# soft shading at the bottom (chin shadow) so it never looks like a flat bar
arr = np.array(stub).astype(np.float32)
h = arr.shape[0]
for i in range(h):
    k = i / (h - 1)
    shade = 1.0 - 0.16 * (k ** 2)
    arr[i, :, :3] *= shade
stub = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')
stub.save(os.path.join(OUT, 'neck.png'))
MAN['neck'] = dict(file='neck', x=nx0, y=stub_top, w=stub.width, h=stub.height)

# --- face geometry (where the features live on the 1312x1199 canvas)
FACE = dict(cx=655, eyeY=396, eyeDX=112, eyeW=122, eyeH=134,
            mouthX=655, mouthY=505, headPivot=[655, 646])
MAN['canvas'] = [CW, CH]
MAN['head'] = dict(file='head', x=head_xy[0], y=head_xy[1], w=head_a.shape[1], h=head_a.shape[0])
MAN['body'] = dict(file='body', x=body_xy[0], y=body_xy[1], w=body_a.shape[1], h=body_a.shape[0])
MAN['face'] = FACE
MAN['split'] = int(SPLIT)
MAN['rig'] = dict(
    canvas=[CW, 1600],
    shoulderL=[body_xy[0] + 12, body_xy[1] + 112],
    shoulderR=[body_xy[0] + body_a.shape[1] - 12, body_xy[1] + 112],
    hipL=[body_xy[0] + 128, body_xy[1] + body_a.shape[0] - 14],
    hipR=[body_xy[0] + body_a.shape[1] - 128, body_xy[1] + body_a.shape[0] - 14],
    upperArm=205, foreArm=200, thigh=215, shin=205, hand=15, foot=30,
)
MAN['skin'] = [243, 191, 148]
MAN['ink'] = [10, 8, 8]

# ------------------------------------------------------------------ eye shape
sheet = Image.open(os.path.join(SRC, 'eyes_sheet.png')).convert('RGB')
S = np.array(sheet).astype(int)
nz = ~((S.min(2) > 236) & (np.abs(S[:, :, 0] - S[:, :, 2]) < 12))
# cell 0 = first frame, both eyes; take the LEFT eye only
cell = nz[174:338, 34:200]
cell = ndimage.binary_fill_holes(cell)
_lbl, _n = ndimage.label(cell)
if _n > 1:
    _sz = ndimage.sum(cell, _lbl, range(1, _n + 1))
    cell = _lbl == (int(np.argmax(_sz)) + 1)          # drop the neighbour eye's sliver
ys, xs = np.where(cell)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
eye_m = cell[y0:y1, x0:x1]
EH, EW = eye_m.shape
print('eye native', EW, 'x', EH)

# outline thickness: distance from the outside to the sclera
inner = ndimage.binary_erosion(eye_m, iterations=int(round(min(EW, EH) * 0.048)))
# clean the inner blob a little (rounder, no lash specks)
inner = ndimage.binary_opening(inner, np.ones((5, 5)))
inner = ndimage.binary_closing(inner, np.ones((7, 7)))
inner = ndimage.binary_fill_holes(inner)
lbl, n = ndimage.label(inner)
if n > 1:
    sizes = ndimage.sum(inner, lbl, range(1, n + 1))
    inner = lbl == (int(np.argmax(sizes)) + 1)

# eye sprite: white sclera + the artwork's own black ring
eye_rgb = np.zeros((EH, EW, 3), np.uint8) + 255
ring = eye_m & ~inner
dists = ndimage.distance_transform_edt(inner)        # distance from the sclera edge
hard = (dists < min(EW, EH) * 0.055) & ring          # ink ring hugs the sclera
eye_rgb[hard] = (10, 8, 8)
eye_rgba = np.dstack([eye_rgb, (eye_m * 255).astype(np.uint8)])
eye_rgba[~eye_m] = (0, 0, 0, 0)
Image.fromarray(eye_rgba, 'RGBA').save(os.path.join(OUT, 'eye_open.png'))

# polygons for the app (outer silhouette + sclera) — normalised 0..1
def poly(mask, eps=0.9):
    cs, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cs, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2).astype(float)
    return [[round(float(px) / EW, 4), round(float(py) / EH, 4)] for px, py in ap]


MAN['eye'] = dict(file='eye_open', w=EW, h=EH,
                  outer=poly(eye_m, 1.2), inner=poly(inner, 1.2))

# ---- lid curves: for every frame, the lowest y of the skin-coloured lid
cells_x = [(40, 190), (371, 520), (693, 843), (1015, 1165), (1336, 1486),
           (1662, 1812), (32, 182), (365, 515), (684, 834), (1008, 1158),
           (1332, 1482), (1658, 1808)]
rows_y = [(174, 338)] * 6 + [(455, 619)] * 6


def lid_curve(ci):
    x0, x1 = cells_x[ci]; y0, y1 = rows_y[ci]
    sub = S[y0:y1, x0:x1]
    msk = nz[y0:y1, x0:x1]
    r, g, b = sub[:, :, 0], sub[:, :, 1], sub[:, :, 2]
    brown = (r > 120) & (r < 235) & (g > 80) & (g < 200) & (b < 175) & ((r - b) > 25)
    white = sub.min(2) > 225
    return msk, brown, white


NS = 21
curves = []
open_frac = []
for ci in range(12):
    msk, brown, white = lid_curve(ci)
    msk2 = ndimage.binary_fill_holes(msk)
    _l, _n2 = ndimage.label(msk2)
    if _n2 > 1:
        _s2 = ndimage.sum(msk2, _l, range(1, _n2 + 1))
        msk2 = _l == (int(np.argmax(_s2)) + 1)
    ys, xs = np.where(msk2)
    # rescale to the reference eye box so frames are comparable
    X0, X1, Y0, Y1 = xs.min(), xs.max(), ys.min(), ys.max()
    ref = (EW, EH)
    curve = []
    for i in range(NS):
        t = i / (NS - 1)
        px = int(round(X0 + t * (X1 - X0)))
        col = np.where(brown[:, px])[0] if px < brown.shape[1] else np.array([])
        if len(col):
            yy = col.max()
            curve.append(round(float(yy - Y0) / max(1, Y1 - Y0), 4))
        else:
            curve.append(1.0)
    curves.append(curve)
    wfrac = white.sum() / max(1, white.sum() + brown.sum())
    open_frac.append(round(float(wfrac), 4))

print('eye polys ready')


# ------------------------------------------------------------------ mouth sheet
msheet = Image.open(os.path.join(SRC, 'mouth_sheet.png')).convert('RGB')
M = np.array(msheet).astype(int)
mnz = ~((M.min(2) > 236) & (np.abs(M[:, :, 0] - M[:, :, 2]) < 12))
cells = []
for (ry0, ry1) in [(130, 350), (432, 552)]:
    cs = mnz[ry0:ry1].sum(0)
    cols, inr = [], False
    for i, v in enumerate(cs):
        if v > 2 and not inr:
            s = i; inr = True
        elif v <= 2 and inr:
            cols.append((s, i - 1)); inr = False
    if inr:
        cols.append((s, len(cs) - 1))
    merged = []
    for c in cols:
        if merged and c[0] - merged[-1][1] < 25:
            merged[-1] = (merged[-1][0], c[1])
        else:
            merged.append(c)
    for c in merged:
        cells.append((c[0], ry0, c[1] + 1, ry1))

fr = []
for (x0, y0, x1, y1) in cells:
    sub = mnz[y0:y1, x0:x1]
    ys, xs = np.where(sub)
    fr.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
print('mouth frames', len(fr))

# every frame is centred in a common cell; frame 15 (the flat line) sets the
# resting height so an open mouth grows around the lip line
MW = max(b[2] - b[0] for b in fr) + 8
MH = max(b[3] - b[1] for b in fr) + 8
PAD_TOP = 3
mouth_rgba, _ = load_rgba(os.path.join(SRC, 'mouth_sheet.png'))
MO = np.array(mouth_rgba)
sheet_out = Image.new('RGBA', (MW * len(fr), MH), (0, 0, 0, 0))
rest_cy = None
for i, b in enumerate(fr):
    cellim = mouth_rgba.crop(tuple(int(v) for v in b))
    ca = np.array(cellim)
    ys, xs = np.where(ca[:, :, 3] > 8)
    cw, chh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    cellim = cellim.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    px = i * MW + (MW - cw) // 2
    py = PAD_TOP
    sheet_out.alpha_composite(cellim, (px, py))
    if i == len(fr) - 1:
        rest_cy = py + chh / 2
sheet_out.save(os.path.join(OUT, 'mouth_sheet.png'))
print('mouth cell', MW, 'x', MH, 'sheet', sheet_out.size, 'rest_cy', rest_cy)

# target box on the character canvas
TGT_W = 132
mouth_h = int(round(MH * TGT_W / MW))
MAN['mouth'] = dict(img='mouth_sheet', n=len(fr), fw=MW, fh=MH,
                    x=FACE['mouthX'] - TGT_W / 2, y=FACE['mouthY'],
                    tw=TGT_W, th=mouth_h)

def _py(o):
    import numpy as _np
    if isinstance(o, (_np.integer,)):
        return int(o)
    if isinstance(o, (_np.floating,)):
        return float(o)
    if isinstance(o, _np.ndarray):
        return o.tolist()
    raise TypeError(str(type(o)))


with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(MAN, f, indent=1, default=_py)
with open(os.path.join(OUT, 'manifest.js'), 'w') as f:
    f.write('window.CHIBI = ' + json.dumps(MAN, default=_py) + ';\n')
print('manifest written')

# small preview so the build can be eyeballed
prev = Image.new('RGBA', (CW, CH), (255, 255, 255, 255))
prev.alpha_composite(char, (0, 0))
d = ImageDraw.Draw(prev)
for k in ('x',):
    x = FACE['cx'] - FACE['eyeDX']
    d.rectangle([x - FACE['eyeW'] / 2, FACE['eyeY'] - FACE['eyeH'] / 2,
                 x + FACE['eyeW'] / 2, FACE['eyeY'] + FACE['eyeH'] / 2], outline=(255, 0, 0))
    x = FACE['cx'] + FACE['eyeDX']
    d.rectangle([x - FACE['eyeW'] / 2, FACE['eyeY'] - FACE['eyeH'] / 2,
                 x + FACE['eyeW'] / 2, FACE['eyeY'] + FACE['eyeH'] / 2], outline=(255, 0, 0))
m = MAN['mouth']
d.rectangle([m['x'], m['y'], m['x'] + m['tw'], m['y'] + m['th']], outline=(0, 120, 255))
prev.save(os.path.join(HERE, 'build_preview.png'))
print('ok')
