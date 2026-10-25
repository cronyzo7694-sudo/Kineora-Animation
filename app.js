/* Stick Studio — chibi rig with stick limbs, pose clips, real lids and a voice mouth.
   Everything is drawn from the uploaded art: bust, 16-frame mouth chart, and the eye
   is rebuilt as polygons so the pupil can slide behind the lid when it closes. */
(() => {
'use strict';

const RM = window.CHIBI;
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let DC = ctx;

const RIG = RM.rig;
const FACE = RM.face;
const INK = `rgb(${RM.ink.join(',')})`;
const SKIN = `rgb(${RM.skin.join(',')})`;
const LID = 'rgb(206,150,106)';

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ state */
const S = {
  aspect: '9:16', quality: 'fhd', fps: 30,
  bg: 'paper', bgImage: null,
  zoom: 1, panX: 0, panY: 0, safe: false, depth: 0,
  autoBlink: true, holdClosed: false, blinkRate: 0.5,
  followMouse: true, pupilSize: 1, eyeSize: 1,
  eyeDX: 0, eyeDY: 0, mouthDX: 0, mouthDY: 0,
  breath: 0.55, headMotion: 0.5, sway: 0.45, idle: true,
  stickW: 26, stickColor: '#191411', armLen: 1, legLen: 1,
  mouthMode: 'auto', sens: 1, manual: 0,
  anim: null, walkPhase: 0, walkSpeed: 0.55,
  depth: 0, depthMode: false,
  openness: 0, t: 0,
  // blink machine
  blink: 0, blinkPhase: 'idle', blinkT: 0, nextBlink: 2200, doubleArmed: false,
  look: [0, 0], mouse: [0, 0], sac: [0, 0], sacT: 0,
};

const P = {
  headRot: 0, breath: 0, bob: 0, swayV: 0,
};

/* --------------------------------------------------------------- geometry */
const ARM_REACH = () => RIG.upperArm * S.armLen + RIG.foreArm * S.armLen;
const LEG_REACH = () => RIG.thigh * S.legLen + RIG.shin * S.legLen;

function defaultPose() {
  const sL = RIG.shoulderL, sR = RIG.shoulderR, hL = RIG.hipL, hR = RIG.hipR;
  const arm = ARM_REACH() - 10, leg = LEG_REACH() - 8;
  // a relaxed standing human: arms hang almost straight down (elbow just a
  // touch outward), legs straight with the feet a little apart
  return {
    armL: { mode: 'ik', target: [sL[0] - 34, sL[1] + arm], bend: 1, z: 1, elbow: 0, fore: 0 },
    armR: { mode: 'ik', target: [sR[0] + 34, sR[1] + arm], bend: -1, z: 1, elbow: 0, fore: 0 },
    legL: { mode: 'ik', target: [hL[0] - 26, hL[1] + leg], bend: 1, z: -0.6, elbow: 0, fore: 0 },
    legR: { mode: 'ik', target: [hR[0] + 26, hR[1] + leg], bend: -1, z: -0.6, elbow: 0, fore: 0 },
  };
}
let POSE = defaultPose();

/* pole = the direction the joint is pulled towards.
   Elbows bow outwards, knees stay a hair inwards — that is how a person stands. */
const LIMB_META = {
  armL: () => ({ root: RIG.shoulderL, l1: RIG.upperArm * S.armLen, l2: RIG.foreArm * S.armLen, kind: 'arm', pole: [-1, 0.15] }),
  armR: () => ({ root: RIG.shoulderR, l1: RIG.upperArm * S.armLen, l2: RIG.foreArm * S.armLen, kind: 'arm', pole: [1, 0.15] }),
  legL: () => ({ root: RIG.hipL, l1: RIG.thigh * S.legLen, l2: RIG.shin * S.legLen, kind: 'leg', pole: [-0.35, 0.94] }),
  legR: () => ({ root: RIG.hipR, l1: RIG.thigh * S.legLen, l2: RIG.shin * S.legLen, kind: 'leg', pole: [0.35, 0.94] }),
};

/* Two-bone IK. `bend` only says which way the elbow is *allowed* to leave the
   shoulder–hand line; the pole decides where it actually goes, so an elbow can
   never bend into the body by accident. */
function solve(meta, target, bend) {
  const [ax, ay] = meta.root, [tx, ty] = target;
  const l1 = meta.l1, l2 = meta.l2;
  let dx = tx - ax, dy = ty - ay;
  let d = Math.hypot(dx, dy) || 0.001;
  const dmin = Math.abs(l1 - l2) + 1;
  const dmax = l1 + l2 - 0.5;
  const dc = clamp(d, dmin, dmax);
  const ang = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1);
  const A = Math.acos(cosA) * (bend >= 0 ? 1 : -1);
  // two candidates; keep the one on the pole's side
  const e1 = ang + A, e2 = ang - A;
  const px = meta.pole ? meta.pole[0] : 0, py = meta.pole ? meta.pole[1] : 1;
  const side = (a) => Math.cos(a) * px + Math.sin(a) * py;
  const ea = side(e1) >= side(e2) ? e1 : e2;
  return {
    elbow: [ax + Math.cos(ea) * l1, ay + Math.sin(ea) * l1],
    end: [ax + Math.cos(ang) * dc, ay + Math.sin(ang) * dc],
    ang, clampScale: d > dmax ? dmax / d : 1,
  };
}

function limbPoints(key) {
  const m = LIMB_META[key]();
  const st = POSE[key];
  if (st.mode === 'ik') {
    const r = solve(m, st.target, st.bend);
    return { root: m.root, elbow: r.elbow, end: r.end, kind: m.kind };
  }
  const ea = st.elbow;
  const el = [m.root[0] + Math.cos(ea) * m.l1, m.root[1] + Math.sin(ea) * m.l1];
  const fa = st.fore;
  const end = [el[0] + Math.cos(fa) * m.l2, el[1] + Math.sin(fa) * m.l2];
  return { root: m.root, elbow: el, end, kind: m.kind };
}

/* ------------------------------------------------------------------- images */
const IMG = {};
let loaded = 0;
const NEEDED = ['head', 'body', 'neck', 'eye_open', 'mouth_sheet'];
function addImg(key, src) {
  const im = new Image();
  im.onload = () => { loaded++; checkReady(); };
  im.onerror = () => setStatus('image load fail: ' + src, true);
  im.src = src;
  IMG[key] = im;
}
addImg('head', 'assets/head.png');
addImg('body', 'assets/body.png');
addImg('neck', 'assets/neck.png');
addImg('eye_open', 'assets/eye_open.png');
addImg('mouth_sheet', 'assets/mouth_sheet.png');
function checkReady() {
  if (loaded >= NEEDED.length) setStatus('ready — chibi rig loaded');
}

/* ------------------------------------------------------------------ framing */
const ASPECTS = { '9:16': [9, 16], '16:9': [16, 9], '1:1': [1, 1], '4:5': [4, 5] };
const QUALITY = { hd: 720, fhd: 1080, uhd: 2160 };

function outSize() {
  const [a, b] = ASPECTS[S.aspect] || [9, 16];
  const base = QUALITY[S.quality] || 1080;
  let w, h;
  if (a <= b) { w = base; h = Math.round(base * b / a); }
  else { h = base; w = Math.round(base * a / b); }
  return [w - (w % 2), h - (h % 2)];
}

const VIEW = { sc: 1, ox: 0, oy: 0, W: 0, H: 0 };

function depthScale() { return lerp(1.0, 0.40, Math.pow(clamp(S.depth, 0, 1), 0.9)); }

function computeFit() {
  const W = cv.width, H = cv.height;
  const box = { x: 60, y: 0, w: RIG.canvas[0] - 120, h: 1500 };
  const padX = 0.07 * W, padTop = 0.045 * H, padBot = 0.06 * H;
  const sc0 = Math.min((W - padX * 2) / box.w, (H - padTop - padBot) / box.h);
  // going "into" the picture = smaller + higher up, so the floor stays put
  const dk = depthScale();
  const sc = sc0 * S.zoom * dk;
  const groundY = (H - (padTop + padBot)) / 2 + padTop - (box.y + box.h / 2) * sc0 + box.h / 2 * sc0;
  VIEW.W = W; VIEW.H = H; VIEW.sc = sc; VIEW.depth = S.depth;
  VIEW.ox = W / 2 - (box.x + box.w / 2) * sc + S.panX;
  VIEW.oy = groundY - box.h * sc + S.panY;
  return VIEW;
}

function applyOutputSize() {
  const [w, h] = outSize();
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; invalidateBackground(); }
  const q = S.quality === 'uhd' ? 'UHD' : S.quality === 'fhd' ? 'FHD' : 'HD';
  $('outInfo').textContent = `${w} × ${h} · ${S.aspect} · ${q} · ${S.fps} fps`;
  fitCanvasCss();
}

function fitCanvasCss() {
  const box = cv.parentElement.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const k = Math.min(box.width / cv.width, box.height / cv.height);
  cv.style.width = Math.max(40, Math.round(cv.width * k)) + 'px';
  cv.style.height = Math.max(40, Math.round(cv.height * k)) + 'px';
}

/* --------------------------------------------------------------- background */
/* The backdrop never changes between frames, so it is painted once into an
   offscreen canvas and blitted — a full-HD gradient fill every frame was one of
   the two things that made the studio feel slow. */
const bgCv = document.createElement('canvas');
const bctx = bgCv.getContext('2d');
let bgKey = '';
function paintBackground(W, H) {
  const mode = S.bg;
  if (mode === 'transparent') return;
  const key = `${W}x${H}|${mode}|${S.bgImage ? S.bgImage.src.length + S.bgImage.naturalWidth : 0}`;
  if (bgKey !== key) {
    if (bgCv.width !== W || bgCv.height !== H) { bgCv.width = W; bgCv.height = H; }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, W, H);
    if (mode === 'image' && S.bgImage) {
      const im = S.bgImage;
      const k = Math.max(W / im.width, H / im.height);
      const dw = im.width * k, dh = im.height * k;
      bctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else if (mode === 'paper') {
      const g = bctx.createRadialGradient(W * 0.5, H * 0.32, Math.min(W, H) * 0.05,
                                          W * 0.5, H * 0.32, Math.max(W, H) * 0.78);
      g.addColorStop(0, '#fffaf1');
      g.addColorStop(0.45, '#f6e8d4');
      g.addColorStop(1, '#e8d3b8');
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, W, H);
    } else {
      const solids = { white: '#ffffff', green: '#00b140', blue: '#0b57d0', black: '#0a0a0a' };
      bctx.fillStyle = solids[mode] || '#ffffff';
      bctx.fillRect(0, 0, W, H);
    }
    bgKey = key;
  }
  ctx.drawImage(bgCv, 0, 0);
}

function invalidateBackground() { bgKey = ''; }

/* background set karna — marker aur panel dono yahi use karte hain */
function syncBgButtons() {
  document.querySelectorAll('#bgSeg button').forEach(b =>
    b.classList.toggle('on', b.dataset.bg === S.bg));
}
function setBg(mode, dataUrl, quiet) {
  if (mode === 'image') {
    const url = dataUrl || S.bgDataUrl;
    if (!url) { setStatus('background image nahi mili — dobara upload karo', true); return; }
    if (S.bg === 'image' && S.bgDataUrl === url && S.bgImage) { invalidateBackground(); syncBgButtons(); return; }
    const im = new Image();
    im.onload = () => {
      S.bgImage = im; S.bgDataUrl = url; S.bg = 'image';
      invalidateBackground(); syncBgButtons();
      if (!quiet) setStatus('background: photo');
    };
    im.src = url;
    if (!quiet) setStatus('background image laga raha hoon…');
  } else {
    S.bg = mode; S.bgImage = null;
    invalidateBackground(); syncBgButtons();
    if (!quiet) setStatus('background: ' + mode);
  }
}

/* ------------------------------------------------------------------ sticks */
function stroke(points, w, color) {
  DC.save();
  DC.strokeStyle = color;
  DC.lineWidth = w;
  DC.lineCap = 'round';
  DC.lineJoin = 'round';
  DC.beginPath();
  DC.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) DC.lineTo(points[i][0], points[i][1]);
  DC.stroke();
  DC.restore();
}

/* a little hand: palm along the forearm + a thumb that faces the body */
function drawHand(x, y, ang, w, col, side) {
  const L = Math.max(15, w * 0.80), R = Math.max(10, w * 0.58);
  DC.save();
  DC.translate(x, y);
  DC.rotate(ang);
  DC.scale(1, side);                       // mirror so both thumbs point inward
  DC.fillStyle = col;
  DC.beginPath(); DC.ellipse(L * 0.42, 0, L, R, 0, 0, 7); DC.fill();
  DC.beginPath(); DC.ellipse(-L * 0.05, -R * 0.80, R * 0.82, R * 0.58, -0.6, 0, 7); DC.fill();
  DC.restore();
}

/* a foot: heel + sole, pointing out from the ankle */
function drawFoot(x0, y0, x1, y1, w, col) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(x1 - x0, y1 - y0);
  DC.save();
  DC.translate(x0, y0);
  DC.rotate(ang);
  DC.fillStyle = col;
  DC.beginPath();
  DC.moveTo(0, -w * 0.5);
  DC.lineTo(len * 0.55, -w * 0.46);
  DC.quadraticCurveTo(len, -w * 0.36, len, 0);
  DC.quadraticCurveTo(len, w * 0.42, len * 0.55, w * 0.46);
  DC.lineTo(0, w * 0.5);
  DC.closePath();
  DC.fill();
  DC.restore();
}

function drawOneLimb(key) {
  const col = S.stickColor;
  const p = limbPoints(key);
  const isArm = key.startsWith('arm');
  const z = limbZ(key);
  // a limb nearer the camera reads a touch thicker — cheap but convincing depth
  const w = S.stickW * (1 + 0.16 * z);
  stroke([p.root, p.elbow, p.end], w, col);
  const ang = Math.atan2(p.end[1] - p.elbow[1], p.end[0] - p.elbow[0]);
  if (isArm) {
    drawHand(p.end[0], p.end[1], ang, w, col, key === 'armL' ? -1 : 1);
  } else {
    const dir = key === 'legL' ? -1 : 1;
    const fl = RIG.foot * (0.55 + 0.5 * S.legLen) * (1 + 0.12 * z);
    // foot points outward and lies flat; the toe lifts a little when it swings
    const lifted = clamp((p.root[1] + LEG_REACH() - 6 - p.end[1]) / 90, 0, 1);
    const fa = (dir < 0 ? Math.PI : 0) + dir * (0.30 - 0.22 * lifted);
    const fx = p.end[0] + Math.cos(fa) * fl;
    const fy = p.end[1] + Math.sin(fa) * fl;
    drawFoot(p.end[0], p.end[1], fx, fy, w, col);
  }
}

/* limb depth: z > 0 = in front of the torso, z < 0 = behind it */
function limbZ(key) {
  const st = POSE[key];
  return st && typeof st.z === 'number' ? st.z : (key.startsWith('arm') ? 1 : 0);
}

function drawLimbs(side) {
  // side: 'back' draws behind the body, 'front' draws over the shirt
  const order = ['legL', 'legR', 'armL', 'armR']
    .map(k => [k, limbZ(k)])
    .sort((a, b) => a[1] - b[1])
    .map(x => x[0]);
  for (const key of order) {
    const z = limbZ(key);
    const isLeg = key.startsWith('leg');
    // legs always come out from under the shirt hem; arms can pass in front of
    // or behind the chest depending on z
    if (isLeg) { if (side !== 'back') continue; }
    else { if (side === 'back' && z >= 0) continue; if (side === 'front' && z < 0) continue; }
    drawOneLimb(key);
  }
}

/* -------------------------------------------------------------------- face */
function eyeBoxes() {
  const w = FACE.eyeW * S.eyeSize, h = FACE.eyeH * S.eyeSize;
  const y = FACE.eyeY + S.eyeDY;
  return [
    { cx: FACE.cx - FACE.eyeDX + S.eyeDX, cy: y, w, h },
    { cx: FACE.cx + FACE.eyeDX + S.eyeDX, cy: y, w, h },
  ];
}

function eyePath(g, bx, poly, dx = 0, dy = 0) {
  g.beginPath();
  for (let i = 0; i < poly.length; i++) {
    const px = bx.cx + (poly[i][0] - 0.5) * bx.w + dx;
    const py = bx.cy + (poly[i][1] - 0.5) * bx.h + dy;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
}

/* upper / lower lid curves. t 0..1 across the eye, o = openness (1 open, 0 shut).
   When the eye shuts both lids meet in the middle, so no sclera can peek out. */
function lidCurves(bx, o) {
  // f = how open the eye is. Both lids move linearly towards each other and
  // overlap once f gets small, so the white can never peek through.
  const f = Math.pow(clamp(o, 0, 1), 0.85);
  const top = lerp(0.60, 0.045, f);
  // the lower lid barely lifts until the eye is nearly shut — that keeps the
  // eye looking like an eye and not like a pair of sunglasses
  const bot = lerp(0.42, 1.02, Math.pow(f, 0.32));
  const arc = 0.05 * (0.35 + 0.65 * f);
  return {
    up: t => bx.cy + (top - 0.5 - Math.sin(Math.PI * t) * arc) * bx.h,
    lo: t => bx.cy + (bot - 0.5 - Math.sin(Math.PI * t) * arc) * bx.h,
  };
}

function drawEye(bx, idx, o) {
  const g = DC;
  const poly = RM.eye.outer, inner = RM.eye.inner;

  // sclera + the artwork's own black ring
  g.save();
  eyePath(g, bx, poly);
  g.fillStyle = INK;
  g.fill();
  eyePath(g, bx, inner);
  g.fillStyle = '#ffffff';
  g.fill();
  g.restore();

  const look = S.look;
  const pr = 0.205 * bx.w * S.pupilSize;
  const px = bx.cx + look[0] * bx.w * 0.17 * (idx === 0 ? 1 : 0.92) + (idx === 0 ? -0.02 : 0.02) * bx.w;
  const py = bx.cy + look[1] * bx.h * 0.13 + 0.035 * bx.h;
  const c = lidCurves(bx, o);

  const N = 28;
  g.save();
  eyePath(g, bx, inner);
  g.clip();

  // pupil — hides behind the lid as it closes
  g.fillStyle = '#141010';
  g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.92)';
  g.beginPath(); g.arc(px - pr * 0.34, py - pr * 0.38, pr * 0.26, 0, 7); g.fill();

  // skin above the upper lid …
  g.beginPath();
  g.moveTo(bx.cx - bx.w, c.up(0));
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    g.lineTo(bx.cx + (t - 0.5) * bx.w * 1.08, c.up(t));
  }
  g.lineTo(bx.cx + bx.w, bx.cy - bx.h);
  g.lineTo(bx.cx - bx.w, bx.cy - bx.h);
  g.closePath();
  g.fillStyle = LID;
  g.fill();

  // … and below the lower lid
  g.beginPath();
  g.moveTo(bx.cx - bx.w, c.lo(0));
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    g.lineTo(bx.cx + (t - 0.5) * bx.w * 1.08, c.lo(t));
  }
  g.lineTo(bx.cx + bx.w, bx.cy + bx.h);
  g.lineTo(bx.cx - bx.w, bx.cy + bx.h);
  g.closePath();
  g.fillStyle = LID;
  g.fill();

  // lash line on the upper lid
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = bx.cx + (t - 0.5) * bx.w * 1.08;
    const y = c.up(t);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.strokeStyle = INK;
  g.lineWidth = bx.h * 0.062;
  g.lineCap = 'round';
  g.stroke();
  g.restore();

  // rebuild the ring edge so the lid never bleeds outside the outline
  g.save();
  eyePath(g, bx, poly);
  g.strokeStyle = INK;
  g.lineWidth = bx.w * 0.055;
  g.stroke();
  g.restore();
}

function drawEyes() {
  const o = 1 - S.blink;
  const boxes = eyeBoxes();
  boxes.forEach((bx, i) => drawEye(bx, i, o));
}

function mouthFrame() {
  const n = RM.mouth.n;
  const idx = Math.round(Math.pow(clamp(S.openness, 0, 1), 1.35) * (n - 1));
  return n - 1 - idx;                       // sheet runs widest -> flat line
}

function drawMouth() {
  const m = RM.mouth, im = IMG.mouth_sheet;
  if (!im || !im.width) return;
  const f = mouthFrame();
  const tw = m.tw, th = m.th;
  const x = FACE.mouthX + S.mouthDX - tw / 2;
  const y = FACE.mouthY + S.mouthDY;
  DC.drawImage(im, f * m.fw, 0, m.fw, m.fh, x, y, tw, th);
}

/* --------------------------------------------------------------- character */
function drawCharacter() {
  const g = DC;
  const canvasH = RIG.canvas[1];

  g.save();
  // breathing bob + a slow whole-body sway, pivoting at the hips
  const hipMid = [(RIG.hipL[0] + RIG.hipR[0]) / 2, (RIG.hipL[1] + RIG.hipR[1]) / 2];
  g.translate(hipMid[0], hipMid[1] + P.bob + (P.walkBob || 0));
  g.rotate(P.swayV + (P.walkSway || 0));
  g.translate(-hipMid[0], -hipMid[1]);

  // limbs that are behind the body are painted before the shirt
  drawLimbs('back');

  // neck stub behind the head
  const nk = RM.neck;
  if (IMG.neck.width) g.drawImage(IMG.neck, nk.x, nk.y, nk.w, nk.h);

  // body
  const b = RM.body;
  if (IMG.body.width) g.drawImage(IMG.body, b.x, b.y, b.w, b.h);

  // everything in front of the shirt goes on top
  drawLimbs('front');

  // head rotates about the neck
  g.save();
  g.translate(FACE.headPivot[0], FACE.headPivot[1]);
  g.rotate(P.headRot);
  g.translate(-FACE.headPivot[0], -FACE.headPivot[1]);
  const h = RM.head;
  if (IMG.head.width) g.drawImage(IMG.head, h.x, h.y, h.w, h.h);
  if (IMG.mouth_sheet.width) drawMouth();
  drawEyes();
  g.restore();

  if (S.debug) debug();
  g.restore();

  if (S.debug) {
    g.save();
    g.strokeStyle = 'rgba(0,200,255,.85)';
    g.setLineDash([9, 9]);
    g.strokeRect(40, 0, RIG.canvas[0] - 80, 1560);
    g.restore();
  }
}

function debug() {
  const g = DC;
  g.save();
  g.fillStyle = 'rgba(255,80,120,.95)';
  for (const key of ['armL', 'armR', 'legL', 'legR']) {
    const p = limbPoints(key);
    g.strokeStyle = 'rgba(0,200,255,.85)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(p.root[0], p.root[1]); g.lineTo(p.elbow[0], p.elbow[1]); g.lineTo(p.end[0], p.end[1]); g.stroke();
    for (const pt of [p.root, p.elbow, p.end]) { g.beginPath(); g.arc(pt[0], pt[1], 9, 0, 7); g.fill(); }
  }
  g.restore();
}

/* --------------------------------------------------------------- drawFrame */
function drawFloorShadow() {
  const box = { x: 60, w: RIG.canvas[0] - 120 };
  const gy = 1560;
  const gx = box.x + box.w / 2;
  const gr = box.w * 0.30 * (0.55 + 0.45 * depthScale());
  const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, gr);
  const a = 0.26 * (0.45 + 0.55 * depthScale());
  g.addColorStop(0, `rgba(120,80,40,${a.toFixed(3)})`);
  g.addColorStop(1, 'rgba(120,80,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(gx, gy, gr, gr * 0.14, 0, 0, 7); ctx.fill();
}

function drawFrame() {
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);

  paintBackground(W, H);
  computeFit();

  ctx.save();
  ctx.setTransform(VIEW.sc, 0, 0, VIEW.sc, VIEW.ox, VIEW.oy);
  DC = ctx;
  drawFloorShadow();
  // distant = slightly washed into the background, like real atmospheric depth
  ctx.globalAlpha = 1 - 0.20 * S.depth;
  drawCharacter();
  ctx.globalAlpha = 1;
  ctx.restore();

  if (S.safe) drawSafe();
}

function drawSafe() {
  const W = cv.width, H = cv.height;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.32)';
  ctx.lineWidth = Math.max(1, W / 900);
  ctx.setLineDash([12, 10]);
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(W * i / 3, 0); ctx.lineTo(W * i / 3, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H * i / 3); ctx.lineTo(W, H * i / 3); ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ blink */
function triggerBlink() {
  if (S.blinkPhase !== 'idle') return;
  S.blinkPhase = 'closing';
  S.blinkT = 0;
}

function updateBlink(dt) {
  if (S.blinkLock != null) { S.blink = S.blinkLock; return; }
  const speed = 1.35 - S.blinkRate * 0.7;      // slider -> seconds scale
  if (S.holdClosed) {
    S.blink += (1 - S.blink) * Math.min(1, dt / 90);
    if (S.blink > 0.985) S.blink = 1;
    S.blinkPhase = 'idle';
  } else if (S.blinkPhase === 'closing') {
    S.blinkT += dt;
    const k = clamp(S.blinkT / 92, 0, 1);
    S.blink = 1 - Math.pow(1 - k, 2.6);         // fast start, soft landing
    if (k >= 1) { S.blinkPhase = 'hold'; S.blinkT = 0; }
  } else if (S.blinkPhase === 'hold') {
    S.blinkT += dt;
    S.blink = 1;
    if (S.blinkT > 46) { S.blinkPhase = 'opening'; S.blinkT = 0; }
  } else if (S.blinkPhase === 'opening') {
    S.blinkT += dt;
    const k = clamp(S.blinkT / 165, 0, 1);
    S.blink = 1 - Math.pow(k, 0.55);            // unhurried, heavy-lidded open
    if (k >= 1) {
      S.blink = 0;
      S.blinkPhase = 'idle';
      if (S.doubleArmed) { S.doubleArmed = false; S.nextBlink = 200; }
    }
  } else {
    S.blink += (0 - S.blink) * Math.min(1, dt / 120);
    if (!S.autoBlink) return;
    S.nextBlink -= dt;
    if (S.nextBlink <= 0) {
      triggerBlink();
      const base = (2100 + 4200 * (1 - S.blinkRate)) * (0.6 + Math.random() * 0.85);
      S.nextBlink = base;
      if (Math.random() < 0.16) S.doubleArmed = true;
    }
  }
}

/* ------------------------------------------------------------------- audio */
let audioCtx = null, micStream = null, analyser = null, micBuf = null;
let voiceSrc = null, voiceDest = null;
S.voiceAudio = null; S.voiceEnv = null; S.voiceRate = 100; S.voicePlaying = false;
S.voiceStart = 0; S.voiceOffset = 0; S.voiceDur = 0;

function ensureCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

async function loadVoiceFile(file) {
  const info = $('voiceInfo');
  try {
    const ac = ensureCtx();
    if (ac.state === 'suspended') await ac.resume();
    const raw = await file.arrayBuffer();
    const audio = await ac.decodeAudioData(raw.slice(0));
    const ch = audio.numberOfChannels, len = audio.length;
    const mix = new Float32Array(len);
    for (let c = 0; c < ch; c++) {
      const d = audio.getChannelData(c);
      for (let i = 0; i < len; i++) mix[i] += d[i] / ch;
    }
    const rate = 100, hop = Math.max(1, Math.round(audio.sampleRate / rate));
    const n = Math.floor(len / hop);
    const env = new Float32Array(n);
    let peak = 1e-6;
    for (let i = 0; i < n; i++) {
      let sum = 0, off = i * hop;
      for (let j = 0; j < hop; j++) { const v = mix[off + j] || 0; sum += v * v; }
      const rms = Math.sqrt(sum / hop);
      env[i] = rms;
      if (rms > peak) peak = rms;
    }
    const floor = peak * 0.055, span = Math.max(1e-5, peak - floor);
    for (let i = 0; i < n; i++) {
      const v = clamp((env[i] - floor) / span, 0, 1);
      env[i] = Math.pow(v, 0.62);
    }
    let prev = 0;
    for (let i = 0; i < n; i++) { prev += (env[i] - prev) * (env[i] > prev ? 0.68 : 0.30); env[i] = prev; }

    stopVoiceSrc();
    S.voiceAudio = audio; S.voiceEnv = env; S.voiceRate = rate; S.voiceDur = audio.duration;
    S.voiceOffset = 0;
    $('btnVoicePlay').disabled = false;
    if (info) info.textContent = `${file.name} · ${audio.duration.toFixed(1)}s`;
    /* timeline utni lambi jitni audio hai */
    TL.dur = Math.max(1, Math.round(audio.duration * 100) / 100);
    if (TL.head > TL.dur) TL.head = 0;
    TL.marks = TL.marks.filter(m => m.t <= TL.dur);
    tlSave(); tlSyncLen(); drawWave(); tlSeek(0);
    if (S.mouthMode !== 'file') { S.mouthMode = 'file'; syncModeButtons(); }
    setStatus(`audio loaded — timeline ${TL.dur.toFixed(2)}s · Play dabao`);
  } catch (e) {
    if (info) info.textContent = 'ye file decode nahi hui: ' + e.message;
    setStatus('audio decode fail: ' + e.message, true);
  }
}

/* track ke peeche halka waveform — pata chale kahan bol raha hai */
function drawWave() {
  const el = $('tlWave');
  if (!el || !S.voiceEnv) return;
  const W = 900, H = 46;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const env = S.voiceEnv, n = env.length;
  for (let x = 0; x < W; x++) {
    const a = Math.floor(x * n / W), b = Math.max(a + 1, Math.floor((x + 1) * n / W));
    let m = 0;
    for (let i = a; i < b && i < n; i++) if (env[i] > m) m = env[i];
    const h = Math.max(1, m * H * 0.94);
    g.fillStyle = 'rgba(255,154,77,.22)';
    g.fillRect(x, (H - h) / 2, 1, h);
  }
  el.style.backgroundImage = `url(${c.toDataURL()})`;
}

/* audio transport — buffer source ko offset se start karte hain, isliye seek possible hai */
function voiceTime() {
  if (!S.voiceAudio) return 0;
  if (!S.voicePlaying) return clamp(S.voiceOffset, 0, S.voiceDur);
  return clamp(S.voiceOffset + (audioCtx.currentTime - S.voiceStart), 0, S.voiceDur);
}

function stopVoiceSrc() {
  const s = voiceSrc;
  voiceSrc = null; S.voicePlaying = false;
  if (s) { try { s.onended = null; s.stop(0); } catch (e) {} }
}

async function playVoice(from) {
  if (!S.voiceAudio) return;
  const ac = ensureCtx();
  if (ac.state === 'suspended') await ac.resume();
  const off = clamp(from == null ? S.voiceOffset : from, 0, Math.max(0, S.voiceDur - 0.02));
  stopVoiceSrc();
  const src = ac.createBufferSource();
  src.buffer = S.voiceAudio;
  if (!voiceDest) voiceDest = ac.createMediaStreamDestination();
  src.connect(ac.destination);
  src.connect(voiceDest);
  const t0 = ac.currentTime + 0.03;
  src.start(t0, off);
  src.onended = () => {
    if (voiceSrc !== src) return;          // manual stop — ignore
    voiceSrc = null; S.voicePlaying = false; S.voiceOffset = S.voiceDur;
    syncTransport();
  };
  voiceSrc = src; S.voiceStart = t0; S.voiceOffset = off; S.voicePlaying = true;
  syncTransport();
}

function pauseVoice() {
  if (!S.voicePlaying) { syncTransport(); return; }
  const t = voiceTime();            // pehle nikalo — offset badalne se pehle
  stopVoiceSrc();
  S.voiceOffset = clamp(t, 0, S.voiceDur);
  syncTransport();
}

/* --------------------------------------------------------------- timeline */
/* Audio jitni lambi utni timeline. Har marker = {t, name, pose} — us time par
   wahi clip chalega. Play par head aage badhta hai (audio ke saath sync). */
const TL = { dur: 12, marks: [], head: 0, prev: 0, playing: false, sel: -1 };

function tlAll() { return BUILTIN.concat(CLIPS); }

function tlLoad() {
  try {
    const raw = localStorage.getItem('chibi.tl.v1');
    if (raw) {
      const o = JSON.parse(raw);
      if (typeof o.dur === 'number' && o.dur >= 1) TL.dur = o.dur;
      if (Array.isArray(o.marks)) TL.marks = o.marks.filter(m => m && typeof m.t === 'number');
      if (o.bgData) S.bgDataUrl = o.bgData;
    }
  } catch (e) {}
  TL.marks.sort((a, b) => a.t - b.t);
}
function tlSave() {
  try {
    localStorage.setItem('chibi.tl.v1', JSON.stringify({ dur: TL.dur, marks: TL.marks, bgData: S.bgDataUrl || null }));
  } catch (e) {
    setStatus('timeline save nahi hua (storage full?) — background photo hata ke try karo', true);
  }
}
function tlSyncLen() {
  const d = $('tlDur'); if (d) d.value = String(Math.round(TL.dur * 100) / 100);
  const e = $('tlEnd'); if (e) e.textContent = TL.dur.toFixed(2);
}
function syncTransport() {
  const b = $('tlPlay');
  if (b) { b.textContent = TL.playing ? '❚❚' : '▶'; b.classList.toggle('on', TL.playing); }
  const v = $('btnVoicePlay');
  if (v && !v.disabled) {
    v.textContent = S.voicePlaying ? '❚❚ Pause' : '▶ Play';
    v.classList.toggle('on', S.voicePlaying);
  }
}
function tlSeek(t) {
  TL.head = clamp(t, 0, TL.dur);
  TL.prev = TL.head;
  if (S.voiceAudio) {
    S.voiceOffset = clamp(TL.head, 0, S.voiceDur);
    if (TL.playing) playVoice(S.voiceOffset);
  }
  if (!TL.playing) {                       // seek karte waqt stage bhi wahi pose dikhaye
    const i = tlStateAt(TL.head);
    if (i >= 0) tlFire(TL.marks[i], true);
    const b = bgStateAt(TL.head);
    if (b) tlFire(b, true);
  }
  renderTimeline();
}
function tlPlay() {
  if (TL.playing) return;
  if (TL.head >= TL.dur - 0.02) { TL.head = 0; TL.prev = 0; }
  TL.playing = true;
  if (S.voiceAudio) playVoice(TL.head);
  syncTransport(); renderTimeline();
}
function tlPause() {
  if (!TL.playing) return;
  TL.playing = false;
  if (S.voiceAudio && S.voicePlaying) {
    pauseVoice();
    TL.head = clamp(S.voiceOffset, 0, TL.dur);   // head aur audio exactly ek jagah
    TL.prev = TL.head;
  }
  syncTransport(); renderTimeline();
}
function tlToggle() { TL.playing ? tlPause() : tlPlay(); }

function tlFire(m, instant) {
  if (m.kind === 'bg') { setBg(m.bg, m.img, true); return; }
  const list = tlAll();
  let i = -1;
  if (m.builtin != null && m.builtin >= 0 && BUILTIN[m.builtin]) i = m.builtin;
  else {
    const j = BUILTIN.concat(CLIPS).findIndex(c => c.name === m.name);
    if (j >= BUILTIN.length) i = j;                // custom clip abhi bhi maujood hai
  }
  if (i >= 0) {
    if (!instant) { playClip(i); return; }
    activeClip = i;
    S.anim = list[i].anim || null;
    if (S.anim === 'walk') S.walkPhase = 0;
    applyPose(list[i].pose || defaultPose(), false);
    $('badge').textContent = list[i].name;
    renderClips();
    return;
  }
  if (!m.pose) return;                       // clip delete ho gayi
  activeClip = -1;
  S.anim = m.anim || null;
  if (m.anim === 'walk') S.walkPhase = 0;
  applyPose(m.pose, !instant);
  $('badge').textContent = m.name;
  renderClips();
}

/* is waqt kaunsi clip chal rahi hai (jo marker sabse aakhir me aaya) */
function tlStateAt(t) {
  let last = -1;
  TL.marks.forEach((m, i) => { if (m.kind !== 'bg' && m.t <= t + 1e-9) last = i; });
  return last;
}

/* seek par background bhi us waqt wala dikhna chahiye */
function bgStateAt(t) {
  let last = null;
  TL.marks.forEach(m => { if (m.kind === 'bg' && m.t <= t + 1e-9) last = m; });
  return last;
}

function updateTimeline(dt) {
  if (!TL.playing) return;
  const prev = TL.head;
  if (S.voiceAudio && S.voicePlaying) TL.head = Math.min(TL.dur, voiceTime());
  else TL.head = Math.min(TL.dur, TL.head + dt / 1000);
  for (const m of TL.marks) if (m.t > prev && m.t <= TL.head) tlFire(m);
  if (TL.head >= TL.dur - 0.002 && !(S.voiceAudio && S.voicePlaying)) tlPause();
  else moveHead();
}

/* agar naya marker kisi purane band ke beech me aa raha hai to us band ko chhota kar do */
function trimOverlaps(atT, skipIdx) {
  TL.marks.forEach((m, j) => {
    if (j === skipIdx || m.kind === 'bg') return;
    if (typeof m.dur !== 'number') return;
    const end = m.t + m.dur;
    if (m.t < atT - 1e-6 && end > atT + 1e-6) m.dur = Math.round((atT - m.t) * 100) / 100;
  });
}

function tlAdd() {
  const list = tlAll();
  const sel = $('tlClipSel');
  const i = sel ? clamp(+sel.value || 0, 0, list.length - 1) : 0;
  const c = list[i];
  if (!c) return;
  const t = Math.round(TL.head * 100) / 100;
  trimOverlaps(t, -1);
  TL.marks = TL.marks.filter(m => Math.abs(m.t - t) > 0.02);
  const bi = c.builtin ? BUILTIN.indexOf(c) : null;
  TL.marks.push({ t, name: c.name, anim: c.anim || null, builtin: bi, pose: clonePose(c.pose || defaultPose()) });
  TL.marks.sort((a, b) => a.t - b.t);
  TL.sel = TL.marks.findIndex(m => Math.abs(m.t - t) < 1e-6);
  tlSave(); renderTimeline();
  setStatus(`${c.name} → ${t.toFixed(2)}s par fix`);
}

function tlAddBg() {
  const t = Math.round(TL.head * 100) / 100;
  const m = { t, kind: 'bg', name: BG_LABEL[S.bg] || S.bg, bg: S.bg };
  if (S.bg === 'image') m.img = S.bgDataUrl;
  TL.marks = TL.marks.filter(x => !(x.kind === 'bg' && Math.abs(x.t - t) < 0.02));
  TL.marks.push(m);
  TL.marks.sort((a, b) => a.t - b.t);
  TL.sel = TL.marks.findIndex(x => x === m);
  tlSave(); renderTimeline();
  setStatus(`background ${m.name} → ${t.toFixed(2)}s par fix`);
}

const BG_LABEL = { paper: 'Paper', white: 'White', green: 'Green', blue: 'Blue', black: 'Black', transparent: 'None', image: 'Photo' };

function tlPickStep(dur) {
  const want = dur / 8;
  const steps = [0.5, 1, 2, 5, 10, 15, 20, 30, 60];
  for (const s of steps) if (s >= want) return s;
  return 120;
}

function moveHead() {
  const head = $('tlHead'), now = $('tlNow');
  if (head) head.style.left = (TL.head / TL.dur * 100) + '%';
  if (now) now.textContent = TL.head.toFixed(2);
}

function renderTimeline() {
  const lane = $('tlLane'), ruler = $('tlRuler'), head = $('tlHead'), now = $('tlNow');
  if (!lane) return;
  moveHead();
  const info = $('tlInfo');
  const clipM = TL.marks.filter(m => m.kind !== 'bg').length;
  const bgM = TL.marks.length - clipM;
  if (info) info.textContent = TL.marks.length
    ? `${clipM} clip · ${bgM} bg · ${TL.marks.map(m => m.t.toFixed(1) + 's ' + m.name).join('  ·  ')}`
    : 'koi marker nahi — clip chuno, playhead set karo, + marker dabao';

  const step = tlPickStep(TL.dur);
  const key = step + '|' + TL.dur;
  if (ruler.dataset.key !== key) {
    ruler.dataset.key = key;
    let h = '';
    for (let t = 0; t <= TL.dur + 1e-6; t += step) {
      const major = Math.abs(t % (step * 2)) < 1e-6;
      h += `<span class="tick${major ? ' major' : ''}" style="left:${(t / TL.dur * 100).toFixed(4)}%"><b>${step < 1 ? t.toFixed(1) : Math.round(t)}s</b></span>`;
    }
    ruler.innerHTML = h;
  }

  const bgLane = $('tlBgLane');
  lane.innerHTML = '';
  if (bgLane) bgLane.innerHTML = '';

  const clips = [], bgs = [];
  TL.marks.forEach((m, i) => (m.kind === 'bg' ? bgs : clips).push([m, i]));

  const laneW = lane.clientWidth || 800;
  const total = TL.dur || 1;

  /* har clip band: start se lekar apni duration tak (duration na ho to next clip tak) */
  clips.forEach(([m, i]) => {
    const st = m.t, en = tlSegEnd(i);
    const d = document.createElement('div');
    d.className = 'tl-seg' + (TL.sel === i ? ' sel' : '');
    d.style.left = (st / total * 100) + '%';
    d.style.width = Math.max(0.7, (en - st) / total * 100) + '%';
    const px = (en - st) / total * laneW;
    const showX = px > 92, showName = px > 38, showT = px > 150;
    d.innerHTML = (showX ? '<span class="mx">×</span>' : '')
      + `<span class="mn">${showName ? m.name : ''}</span>`
      + (showT ? `<span class="mt">${st.toFixed(2)}s</span>` : '')
      + `<span class="tl-edge" title="kheencho = duration badlo"></span>`;
    if (!showX && showName) d.classList.add('sm');
    if (!showName) d.classList.add('tiny');
    d.title = `${m.name} · ${st.toFixed(2)}s → ${en.toFixed(2)}s `
      + `(${(en - st).toFixed(2)}s)${m.dur == null ? ' · agle marker tak' : ''}\n`
      + 'band kheencho = time · right edge = duration · click = yahan jao';
    const mx = d.querySelector('.mx');
    if (mx) mx.onclick = ev => {
      ev.stopPropagation();
      TL.marks.splice(i, 1); TL.sel = -1;
      tlSave(); renderTimeline();
    };
    d.querySelector('.tl-edge').addEventListener('pointerdown', ev => {
      ev.stopPropagation(); ev.preventDefault(); tlResizeSeg(ev, i);
    });
    d.addEventListener('pointerdown', ev => {
      if (ev.target.classList.contains('tl-edge')) return;
      tlDragMark(ev, i);
    });
    lane.appendChild(d);
  });

  /* background chips (neeche wali patti) */
  if (bgLane) {
    bgs.forEach(([m, i]) => {
      const d = document.createElement('div');
      d.className = 'tl-mark bgm' + (TL.sel === i ? ' sel' : '');
      d.style.left = (m.t / total * 100) + '%';
      d.innerHTML = `<span class="mn">${String(m.name).slice(0, 9)}</span>`
        + `<span class="mt">${m.t.toFixed(2)}s</span><span class="mx">×</span>`;
      d.querySelector('.mx').onclick = ev => {
        ev.stopPropagation();
        TL.marks.splice(i, 1); TL.sel = -1;
        tlSave(); renderTimeline();
      };
      d.title = `${m.name} @ ${m.t.toFixed(2)}s — pakad ke khincho = time, click = wahan jao`;
      d.addEventListener('pointerdown', ev => tlDragMark(ev, i));
      bgLane.appendChild(d);
    });
  }
}

/* clip band ka end — duration set ho to wahi, warna agla clip marker / timeline end */
function tlSegEnd(i) {
  const m = TL.marks[i];
  if (!m || m.kind === 'bg') return m ? m.t : 0;
  if (typeof m.dur === 'number') return Math.min(TL.dur, m.t + m.dur);
  for (let j = i + 1; j < TL.marks.length; j++) {
    const n = TL.marks[j];
    if (n.kind !== 'bg' && n.t > m.t + 1e-9) return Math.min(TL.dur, n.t);
  }
  return TL.dur;
}

/* right edge kheencho = duration badlo */
function tlResizeSeg(ev, i) {
  ev.stopPropagation(); ev.preventDefault();
  const track = $('tlTrack');
  const r = track.getBoundingClientRect();
  const m = TL.marks[i];
  TL.sel = i; renderTimeline();
  const move = e2 => {
    const t = clamp((e2.clientX - r.left) / Math.max(1, r.width), 0, 1) * TL.dur;
    m.dur = Math.max(0.08, Math.round((t - m.t) * 100) / 100);
    renderTimeline();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    TL.sel = -1; tlSave(); renderTimeline();
    setStatus(`${m.name} ki duration ${(tlSegEnd(i) - m.t).toFixed(2)}s`);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

/* split — playhead par clip do hisson me */
function tlSplit() {
  const idx = tlStateAt(TL.head);
  if (idx < 0) { setStatus('playhead ke pehle koi clip nahi — pehle marker lagao', true); return; }
  const m = TL.marks[idx];
  const end = tlSegEnd(idx);
  if (TL.head <= m.t + 0.05 || TL.head >= end - 0.05) {
    setStatus('split ke liye playhead clip ke beech me rakho', true);
    return;
  }
  const cut = Math.round(TL.head * 100) / 100;
  const second = Object.assign({}, m, {
    t: cut,
    dur: Math.round((end - cut) * 100) / 100,
    pose: m.pose ? JSON.parse(JSON.stringify(m.pose)) : null,
  });
  delete second.img;
  m.dur = Math.round((cut - m.t) * 100) / 100;
  TL.marks.push(second);
  TL.marks.sort((a, b) => a.t - b.t);
  TL.sel = TL.marks.indexOf(second);
  tlSave(); renderTimeline();
  setStatus(`${m.name} split @ ${cut.toFixed(2)}s — dono hisse alag se badal sakte ho`);
}

function tlDragMark(ev, i) {
  ev.stopPropagation(); ev.preventDefault();
  const track = $('tlTrack');
  const r = track.getBoundingClientRect();
  TL.sel = i; renderTimeline();
  const t0 = TL.marks[i].t;
  let moved = false;
  const move = e2 => {
    const t = clamp((e2.clientX - r.left) / Math.max(1, r.width), 0, 1) * TL.dur;
    if (Math.abs(t - t0) > 0.02) moved = true;
    const m = TL.marks[i];
    m.t = Math.round(t * 100) / 100;
    if (typeof m.dur === 'number') m.dur = Math.min(m.dur, Math.max(0.08, TL.dur - m.t));
    trimOverlaps(m.t, i);
    renderTimeline();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    TL.marks.sort((a, b) => a.t - b.t);
    TL.sel = -1; tlSave();
    if (!moved) tlSeek(t0);            // sirf click = us marker par jump
    else renderTimeline();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function bindTimeline() {
  const track = $('tlTrack');
  if (!track) return;
  let scrubbing = false;
  const seekFrom = e => {
    const r = track.getBoundingClientRect();
    tlSeek(clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1) * TL.dur);
  };
  track.addEventListener('pointerdown', e => {
    if (e.target.closest('.tl-mark') || e.target.closest('.tl-seg')) return;
    scrubbing = true; track.classList.add('scrub');
    try { track.setPointerCapture(e.pointerId); } catch (_) {}
    seekFrom(e);
  });
  track.addEventListener('pointermove', e => { if (scrubbing) seekFrom(e); });
  const end = () => { scrubbing = false; track.classList.remove('scrub'); };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('pointerleave', () => { if (scrubbing) end(); });

  $('tlPlay').onclick = () => tlToggle();
  $('tlBack').onclick = () => tlSeek(TL.head - 5);
  $('tlFwd').onclick = () => tlSeek(TL.head + 5);
  $('btnTlAdd').onclick = tlAdd;
  $('btnTlSplit').onclick = tlSplit;
  $('btnBgMark').onclick = tlAddBg;
  $('btnTlClear').onclick = () => { TL.marks = []; TL.sel = -1; tlSave(); renderTimeline(); setStatus('timeline clear'); };
  $('btnTlFit').onclick = () => {
    if (!S.voiceAudio) { setStatus('pehle audio file daalo, phir fit audio', true); return; }
    TL.dur = Math.max(1, Math.round(S.voiceDur * 100) / 100);
    if (TL.head > TL.dur) tlSeek(TL.dur);
    tlSyncLen(); tlSave(); renderTimeline();
    setStatus(`timeline = audio length (${TL.dur.toFixed(2)}s)`);
  };
  const d = $('tlDur');
  if (d) {
    const apply = () => {
      const v = clamp(parseFloat(d.value) || 1, 1, 900);
      TL.dur = Math.round(v * 100) / 100;
      if (TL.head > TL.dur) TL.head = TL.dur;
      tlSyncLen(); tlSave(); renderTimeline();
    };
    d.addEventListener('input', apply);
    d.addEventListener('change', () => { d.value = String(TL.dur); });
  }
  window.addEventListener('resize', () => renderTimeline());
}

function renderTlSelect() {
  const sel = $('tlClipSel');
  if (!sel) return;
  const keep = sel.value;
  const list = tlAll();
  sel.innerHTML = list.map((c, i) => `<option value="${i}">${c.name}</option>`).join('');
  sel.value = keep && +keep < list.length ? keep : String(Math.max(0, Math.min(list.length - 1, activeClip || 0)));
}

async function enableMic() {
  if (micStream) return true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ac = ensureCtx();
    const src = ac.createMediaStreamSource(micStream);
    analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    src.connect(analyser);
    micBuf = new Uint8Array(analyser.fftSize);
    setStatus('mic live — bolo');
    return true;
  } catch (e) {
    setStatus('mic permission nahi mili: ' + e.message, true);
    return false;
  }
}

function autoEnvelope(t) {
  const phrase = Math.sin(t * 0.00042) * 0.5 + 0.5;
  const gate = Math.pow(phrase, 2.2);
  const s1 = Math.sin(t * 0.021) * 0.5 + 0.5;
  const s2 = Math.sin(t * 0.037 + 1.7) * 0.5 + 0.5;
  const s3 = Math.sin(t * 0.011 + 0.4) * 0.5 + 0.5;
  let v = (s1 * 0.5 + s2 * 0.3 + s3 * 0.2);
  v = Math.pow(v, 1.5);
  const grain = Math.sin(t * 0.09) > 0.35 ? 1 : 0.55;
  return Math.min(1, gate * (0.25 + v * 1.05) * grain);
}

function updateMouth(dt) {
  let target = 0;
  if (S.mouthMode === 'auto') target = autoEnvelope(S.t);
  else if (S.mouthMode === 'manual') target = S.manual;
  else if (S.mouthMode === 'mic') {
    if (!analyser) { target = 0; }
    else {
      analyser.getByteTimeDomainData(micBuf);
      let sum = 0;
      for (let i = 0; i < micBuf.length; i++) { const v = (micBuf[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / micBuf.length);
      const db = 20 * Math.log10(rms + 1e-6);
      target = Math.pow(clamp((db + 55) / 42, 0, 1), 1.25) * S.sens;
    }
  } else if (S.mouthMode === 'file') {
    if (S.voiceEnv && S.voiceAudio) {
      const tSec = voiceTime();                 // seek / pause par bhi wahi frame
      const i = clamp(Math.floor(tSec * S.voiceRate), 0, S.voiceEnv.length - 1);
      target = Math.min(1, S.voiceEnv[i] * S.sens);
    }
  }
  target = clamp(target, 0, 1);
  const k = target > S.openness ? 0.62 : 0.30;
  S.openness += (target - S.openness) * Math.min(1, k * dt / 16.7 * 1.5);
  const m = $('meter');
  if (m) m.style.width = (S.openness * 100).toFixed(0) + '%';
}

/* -------------------------------------------------------------- walk cycle */
/* A real walking read on a front-facing character: feet lift one at a time,
   knees bend as the foot leaves the ground, arms counter-swing and every limb
   crosses the body plane (z) so it goes in front of / behind the torso. */
function updateWalk(dt) {
  const spd = 0.62 + S.walkSpeed * 0.85;          // cycles per second
  S.walkPhase = (S.walkPhase + dt * spd / 1000) % 1;
  const p = S.walkPhase;
  const TAU = Math.PI * 2;

  const arm = ARM_REACH(), leg = LEG_REACH();
  const liftH = leg * 0.075;
  const stride = 26 + 22 * S.walkSpeed;

  for (const [key, i, dir] of [['legL', 0, -1], ['legR', 1, 1]]) {
    const ph = p + i * 0.5;
    const s1 = Math.sin(TAU * ph), c1 = Math.cos(TAU * ph);
    const lift = Math.max(0, s1);
    const st = POSE[key];
    st.mode = 'ik';
    const hip = key === 'legL' ? RIG.hipL : RIG.hipR;
    // the foot travels a short arc; raising it shortens the leg, which is what
    // makes the knee bend — exactly like a person stepping in place
    st.target = [
      hip[0] + dir * (22 + s1 * stride * 0.30),
      hip[1] + leg - 4 - Math.pow(lift, 0.85) * liftH,
    ];
    st.z = -0.30 + c1 * 0.45;                      // back leg slides behind
    st.bend = dir;
  }

  for (const [key, i, dir] of [['armL', 0, -1], ['armR', 1, 1]]) {
    const ph = p + (1 - i) * 0.5;                  // arms opposite the legs
    const s1 = Math.sin(TAU * ph), c1 = Math.cos(TAU * ph);
    const st = POSE[key];
    st.mode = 'ik';
    const sh = key === 'armL' ? RIG.shoulderL : RIG.shoulderR;
    // keep the arm nearly straight; the trick is a short vertical arc plus the
    // hand crossing in front of / behind the shirt as it swings
    const swing = Math.max(0, -c1);                 // 1 when the arm is forward
    st.target = [
      sh[0] + dir * (34 + 8 * swing) - c1 * dir * 10,
      sh[1] + arm * (0.985 - 0.05 * swing) - 24 * swing,
    ];
    st.z = c1 * 0.85;                              // forward arm in front
    st.bend = dir;
  }

  // two small bobs per stride + a gentle shoulder roll
  P.walkBob = -Math.abs(Math.sin(TAU * p * 1)) * 7 * (0.4 + S.walkSpeed);
  P.walkSway = Math.sin(TAU * p) * 0.028 * (0.3 + S.walkSpeed);
}

/* ------------------------------------------------------------------ motion */
function updateMotion(dt) {
  const t = S.t;
  const idle = S.idle ? 1 : 0;
  const br = Math.sin(t * 0.0021);
  P.breath = S.breath * idle * (0.7 + 0.3 * br);
  P.bob = S.breath * idle * br * 2.0;
  P.swayV = S.sway * idle * 0.006 * Math.sin(t * 0.00085) + S.sway * idle * 0.002 * Math.sin(t * 0.0023 + 1);
  if (S.anim === 'walk') updateWalk(dt);
  else { P.walkBob = 0; P.walkSway = 0; }

  const headWob = S.headMotion * idle;
  P.headRot = (headWob * 0.028 * Math.sin(t * 0.0011) + headWob * 0.011 * Math.sin(t * 0.0027 + 2)) + S.headTwist;

  // idle arm sway rides on top of the IK targets
  if (idle && !dragState.key) {
    const a = S.sway * idle;
    for (const key of ['armL', 'armR', 'legL', 'legR']) {
      const st = POSE[key];
      if (st.mode !== 'ik') continue;
      const ph = key === 'armL' ? 0 : key === 'armR' ? 1.6 : key === 'legL' ? 3.1 : 4.4;
      const amp = (key.startsWith('arm') ? 5.5 : 2.2) * a;
      st.jx = Math.sin(t * 0.0012 + ph) * amp;
      st.jy = Math.cos(t * 0.0017 + ph) * amp * 0.6;
    }
  }

  // pointer look
  let lx = 0, ly = 0;
  if (S.followMouse) {
    const W = cv.width, H = cv.height;
    lx = clamp((S.mouse[0] - VIEW.ox) / (VIEW.sc * RIG.canvas[0]) - 0.5 + 0.5, -1, 1);
    const rx = (S.mouse[0] - VIEW.ox) / VIEW.sc / RIG.canvas[0];
    const ry = (S.mouse[1] - VIEW.oy) / VIEW.sc / RIG.canvas[1];
    lx = clamp((rx - 0.5) * 2.6, -1, 1);
    ly = clamp((ry - 0.28) * 2.0, -1, 1);
  }
  S.sacT = (S.sacT || 0) - dt;
  if (S.sacT <= 0) {
    S.sacT = 900 + Math.random() * 2200;
    S.sac = [(Math.random() - 0.5) * 0.30, (Math.random() - 0.5) * 0.20];
  }
  lx += S.sac[0];
  ly += S.sac[1];
  S.look[0] += (lx - S.look[0]) * Math.min(1, dt / 70);
  S.look[1] += (ly - S.look[1]) * Math.min(1, dt / 95);
}

/* ------------------------------------------------------------------- clips */
const sL0 = () => RIG.shoulderL, sR0 = () => RIG.shoulderR;
const hL0 = () => RIG.hipL, hR0 = () => RIG.hipR;
const DOWN_ARM = 395, DOWN_LEG = 400;

const BUILTIN = [
  { name: 'Idle', builtin: true, pose: null },
  { name: 'Wave', pose: {
      armR: { mode: 'ik', target: [sR0()[0] + 250, sR0()[1] - 250], bend: -1 },
      armL: { mode: 'ik', target: [sL0()[0] - 96, sL0()[1] + DOWN_ARM], bend: 1 },
      legL: { mode: 'ik', target: [hL0()[0] - 34, hL0()[1] + DOWN_LEG], bend: 1 },
      legR: { mode: 'ik', target: [hR0()[0] + 34, hR0()[1] + DOWN_LEG], bend: -1 },
      headTwist: 0.05,
  } },
  { name: 'Think', pose: {
      armR: { mode: 'ik', target: [FACE.cx + 175, FACE.mouthY + 30], bend: -1 },
      armL: { mode: 'ik', target: [sL0()[0] - 96, sL0()[1] + DOWN_ARM], bend: 1 },
      legL: { mode: 'ik', target: [hL0()[0] - 44, hL0()[1] + DOWN_LEG - 10], bend: 1 },
      legR: { mode: 'ik', target: [hR0()[0] + 60, hR0()[1] + DOWN_LEG - 16], bend: -1 },
      headTwist: 0.10,
  } },
  { name: 'Point', pose: {
      armR: { mode: 'ik', target: [sR0()[0] + 330, sR0()[1] + 40], bend: -1 },
      armL: { mode: 'ik', target: [sL0()[0] - 96, sL0()[1] + DOWN_ARM], bend: 1 },
      legL: { mode: 'ik', target: [hL0()[0] - 34, hL0()[1] + DOWN_LEG], bend: 1 },
      legR: { mode: 'ik', target: [hR0()[0] + 34, hR0()[1] + DOWN_LEG], bend: -1 },
      headTwist: -0.06,
  } },
  { name: 'Stretch', pose: {
      armL: { mode: 'ik', target: [sL0()[0] - 160, sL0()[1] - 290], bend: 1 },
      armR: { mode: 'ik', target: [sR0()[0] + 160, sR0()[1] - 290], bend: -1 },
      legL: { mode: 'ik', target: [hL0()[0] - 60, hL0()[1] + DOWN_LEG - 6], bend: 1 },
      legR: { mode: 'ik', target: [hR0()[0] + 60, hR0()[1] + DOWN_LEG - 6], bend: -1 },
      headTwist: 0,
  } },
  { name: 'Walk', anim: 'walk', pose: {
      armL: { mode: 'ik', target: [sL0()[0] - 60, sL0()[1] + DOWN_ARM - 20], bend: 1 },
      armR: { mode: 'ik', target: [sR0()[0] + 130, sR0()[1] + DOWN_ARM - 120], bend: -1 },
      legL: { mode: 'ik', target: [hL0()[0] - 150, hL0()[1] + DOWN_LEG - 60], bend: 1 },
      legR: { mode: 'ik', target: [hR0()[0] + 110, hR0()[1] + DOWN_LEG - 10], bend: -1 },
      headTwist: 0.03,
  } },
];

let CLIPS = [];
function loadClips() {
  try {
    const raw = localStorage.getItem('chibi.clips.v1');
    CLIPS = raw ? JSON.parse(raw) : [];
  } catch (e) { CLIPS = []; }
}
function saveClips() {
  try { localStorage.setItem('chibi.clips.v1', JSON.stringify(CLIPS)); } catch (e) {}
}

let tween = null;
function clonePose(p) {
  const out = {};
  for (const k of ['armL', 'armR', 'legL', 'legR']) {
    const s = p[k] || {};
    out[k] = { mode: s.mode || 'ik', target: (s.target || [0, 0]).slice(), bend: s.bend || 1,
               z: typeof s.z === 'number' ? s.z : (k.startsWith('arm') ? 1 : -0.6),
               elbow: s.elbow || 0, fore: s.fore || 0 };
  }
  out.headTwist = p.headTwist || 0;
  return out;
}
function currentPose() {
  const p = clonePose(POSE);
  p.headTwist = S.headTwist;
  return p;
}
function applyPose(p, animate = true) {
  const target = clonePose(p);
  if (!animate) {
    POSE = target;
    S.headTwist = target.headTwist;
    return;
  }
  tween = { from: clonePose(POSE), to: target, t: 0, dur: 260, fromT: S.headTwist, toT: target.headTwist };
}
function stepTween(dt) {
  if (!tween) return;
  tween.t += dt;
  const k = clamp(tween.t / tween.dur, 0, 1);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  for (const key of ['armL', 'armR', 'legL', 'legR']) {
    const a = tween.from[key], b = tween.to[key];
    POSE[key].mode = 'ik';
    POSE[key].bend = b.bend;
    POSE[key].z = lerp(a.z, b.z, e);
    POSE[key].target = [lerp(a.target[0], b.target[0], e), lerp(a.target[1], b.target[1], e)];
  }
  S.headTwist = lerp(tween.fromT, tween.toT, e);
  if (k >= 1) tween = null;
}

let activeClip = null;
function renderClips() {
  const bars = [$('clipbar'), $('clipGrid')];
  const all = BUILTIN.concat(CLIPS);
  bars.forEach((bar, bi) => {
    if (!bar) return;
    bar.innerHTML = '';
    all.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'clip' + (activeClip === i ? ' hot' : '');
      const key = i < 9 ? `<small>${bi === 0 ? 'key ' + (i + 1) : ''}</small>` : '';
      b.innerHTML = `<span>${c.name}</span>${key}`;
      if (c.builtin === false || i >= BUILTIN.length) {
        const x = document.createElement('span');
        x.className = 'x'; x.textContent = '×';
        x.onclick = ev => {
          ev.stopPropagation();
          CLIPS.splice(i - BUILTIN.length, 1);
          saveClips(); renderClips();
        };
        b.appendChild(x);
      }
      b.onclick = ev => {
        playClip(i);
        const sel = $('tlClipSel');
        if (sel) sel.value = String(i);
        if (ev.shiftKey) tlAdd();          // Shift+click = playhead par marker
      };
      bar.appendChild(b);
    });
  });
  renderTlSelect();
}
function playClip(i) {
  const all = BUILTIN.concat(CLIPS);
  const c = all[i];
  if (!c) return;
  activeClip = i;
  S.anim = c.anim || null;
  if (c.anim === 'walk') {
    S.walkPhase = 0;
    applyPose(c.pose || defaultPose(), true);
  } else {
    applyPose(c.pose || defaultPose(), true);
  }
  $('badge').textContent = c.name;
  const sel = $('tlClipSel');
  if (sel) sel.value = String(i);
  renderClips();
}

/* --------------------------------------------------------------- interaction */
const dragState = { key: null, mode: '', grab: null, px: 0, py: 0, dx0: 0, dy0: 0 };
const HIT = 46;

function toRig(clientX, clientY) {
  const r = cv.getBoundingClientRect();
  const x = (clientX - r.left) * (cv.width / r.width);
  const y = (clientY - r.top) * (cv.height / r.height);
  return [(x - VIEW.ox) / VIEW.sc, (y - VIEW.oy) / VIEW.sc, x, y];
}

function mouthRect() {
  const m = RM.mouth;
  return { x: FACE.mouthX + S.mouthDX - m.tw / 2, y: FACE.mouthY + S.mouthDY, w: m.tw, h: m.th };
}

function hitTest(rx, ry) {
  // hands / feet first
  for (const key of ['armL', 'armR', 'legL', 'legR']) {
    const p = limbPoints(key);
    if (Math.hypot(p.end[0] - rx, p.end[1] - ry) < HIT) return { key, mode: 'end' };
  }
  for (const key of ['armL', 'armR', 'legL', 'legR']) {
    const p = limbPoints(key);
    if (Math.hypot(p.elbow[0] - rx, p.elbow[1] - ry) < HIT * 0.85) return { key, mode: 'elbow' };
  }
  // mouth
  const m = mouthRect();
  if (rx > m.x - 10 && rx < m.x + m.w + 10 && ry > m.y - 14 && ry < m.y + m.h + 10) return { key: 'mouth', mode: 'drag' };
  // eyes
  for (const bx of eyeBoxes()) {
    if (Math.abs(rx - bx.cx) < bx.w * 0.72 && Math.abs(ry - bx.cy) < bx.h * 0.72) return { key: 'eyes', mode: 'drag' };
  }
  return { key: null, mode: 'pan' };
}

function onDown(ev) {
  cv.setPointerCapture(ev.pointerId);
  const [rx, ry, cx, cy] = toRig(ev.clientX, ev.clientY);
  const hit = hitTest(rx, ry);
  dragState.key = hit.key; dragState.mode = hit.mode;
  dragState.px = cx; dragState.py = cy;
  dragState.rx = rx; dragState.ry = ry;
  dragState.dx0 = S.mouthDX; dragState.dy0 = S.mouthDY;
  dragState.ex0 = S.eyeDX; dragState.ey0 = S.eyeDY;
  if (hit.key && hit.mode !== 'pan') {
    const st = POSE[hit.key];
    if (st) {
      dragState.startTarget = st.target.slice();
      dragState.startBend = st.bend;
    }
    if (hit.mode === 'end') {
      const p = limbPoints(hit.key);
      dragState.lastRx = rx; dragState.lastRy = ry;
      st.mode = 'ik';
      st.target = p.end.slice();
    }
  }
  cv.style.cursor = 'grabbing';
}

function onMove(ev) {
  const [rx, ry, cx, cy] = toRig(ev.clientX, ev.clientY);
  S.mouse = [cx, cy];
  if (!dragState.key && dragState.mode !== 'pan') {
    const h = hitTest(rx, ry);
    cv.style.cursor = h.key ? 'grab' : 'default';
    return;
  }
  if (dragState.mode === 'pan') {
    if (S.depthMode) {
      // depth mode: horizontal = left/right, vertical = andar (up) / bahar (down)
      const limX = cv.width * 0.42;
      S.panX = clamp(S.panX + (cx - dragState.px), -limX, limX);
      S.depth = clamp(S.depth + (dragState.py - cy) / (cv.height * 0.42), 0, 1);
      dragState.px = cx; dragState.py = cy;
      const dEl = $('depth');
      if (dEl) { dEl.value = Math.round(S.depth * 100); $('lblDepth').textContent = dEl.value + '%'; }
      computeFit();
      return;
    }
    // free move: the character follows the pointer 1:1 in x and y
    const limX = cv.width * 0.48, limY = cv.height * 0.42;
    S.panX = clamp(S.panX + (cx - dragState.px), -limX, limX);
    S.panY = clamp(S.panY + (cy - dragState.py), -limY, limY);
    dragState.px = cx; dragState.py = cy;
    computeFit();
    return;
  }
  if (dragState.key === 'mouth') {
    S.mouthDX = clamp(dragState.dx0 + (rx - dragState.rx), -260, 260);
    S.mouthDY = clamp(dragState.dy0 + (ry - dragState.ry), -260, 260);
    $('mouthX').value = clamp(S.mouthDX, -140, 140);
    $('mouthY').value = clamp(S.mouthDY, -120, 120);
    return;
  }
  if (dragState.key === 'eyes') {
    S.eyeDX = clamp(dragState.ex0 + (rx - dragState.rx), -200, 200);
    S.eyeDY = clamp(dragState.ey0 + (ry - dragState.ry), -200, 200);
    $('eyeX').value = clamp(S.eyeDX, -120, 120);
    $('eyeY').value = clamp(S.eyeDY, -120, 120);
    return;
  }
  const key = dragState.key;
  if (!key) return;
  const st = POSE[key];
  const meta = LIMB_META[key]();
  if (dragState.mode === 'end') {
    st.mode = 'ik';
    st.target = st.target.slice();
    st.target[0] += rx - (dragState.lastRx ?? rx);
    st.target[1] += ry - (dragState.lastRy ?? ry);
    dragState.lastRx = rx; dragState.lastRy = ry;
    activeClip = null; renderClips();
  } else if (dragState.mode === 'elbow') {
    // rotate only that segment: shoulder swings, forearm keeps its world angle
    const p = limbPoints(key);
    const ang = Math.atan2(ry - p.root[1], rx - p.root[0]);
    const foreAng = Math.atan2(p.end[1] - p.elbow[1], p.end[0] - p.elbow[0]);
    st.mode = 'fk';
    st.elbow = ang;
    st.fore = foreAng;
    st.target = p.end.slice();
    activeClip = null; renderClips();
  }
}

function onUp(ev) {
  dragState.key = null; dragState.mode = '';
  dragState.lastRx = null; dragState.lastRy = null;
  cv.style.cursor = 'default';
  try { cv.releasePointerCapture(ev.pointerId); } catch (e) {}
}

function zoomAt(cx, cy, factor) {
  const before = [(cx - VIEW.ox) / VIEW.sc, (cy - VIEW.oy) / VIEW.sc];
  S.zoom = clamp(S.zoom * factor, 0.3, 3);
  computeFit();
  const after = [VIEW.ox + before[0] * VIEW.sc, VIEW.oy + before[1] * VIEW.sc];
  S.panX += cx - after[0];
  S.panY += cy - after[1];
  computeFit();
  $('zoom').value = Math.round(S.zoom * 100);
  $('lblZoom').textContent = Math.round(S.zoom * 100) + '%';
}

/* ------------------------------------------------------------------ record */
const REC_TYPES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];
let recorder = null, recChunks = [], recMime = '', recExt = 'webm';

function pickMime() {
  for (const t of REC_TYPES) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) {}
  }
  return '';
}
function stamp(ext) {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `chibi-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function togglePause() {
  const pbtn = $('btnPause');
  if (!recorder) return;
  if (recorder.state === 'recording') {
    recorder.pause();
    if (TL.playing) tlPause();          // audio bhi ruke — warna awaaz aage nikal jayegi
    if (pbtn) pbtn.textContent = '▶ Resume';
    setStatus('recording paused — ab background badal lo, phir Resume');
  } else if (recorder.state === 'paused') {
    recorder.resume();
    if (S.voiceAudio && !TL.playing) tlPlay();   // wahin se aage
    if (pbtn) pbtn.textContent = '❚❚ Pause';
    setStatus('recording resumed');
  }
}

function toggleRecord() {
  const btn = $('btnRec');
  const pbtn = $('btnPause');
  if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
  if (recorder && recorder.state === 'paused') { recorder.stop(); return; }

  if (S.voiceAudio) {
    const ac = ensureCtx();
    if (!voiceDest) voiceDest = ac.createMediaStreamDestination();
  }
  const stream = cv.captureStream(S.fps);
  if (micStream) micStream.getAudioTracks().forEach(t => stream.addTrack(t));
  if (voiceDest) voiceDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));

  recMime = pickMime();
  recExt = recMime.includes('mp4') ? 'mp4' : 'webm';
  const bitrate = Math.round(Math.min(90e6, Math.max(8e6, cv.width * cv.height * S.fps * 0.18)));
  const opts = { videoBitsPerSecond: bitrate };
  if (recMime) opts.mimeType = recMime;
  try { recorder = new MediaRecorder(stream, opts); }
  catch (e) { recorder = new MediaRecorder(stream); recExt = 'webm'; }

  recChunks = [];
  recorder.ondataavailable = e => { if (e.data.size) recChunks.push(e.data); };
  recorder.onstop = () => {
    const type = (recorder.mimeType || recMime || 'video/webm').split(';')[0];
    const blob = new Blob(recChunks, { type });
    download(blob, stamp(recExt));
    btn.classList.remove('recording');
    btn.textContent = '● Record';
    if (pbtn) { pbtn.disabled = true; pbtn.textContent = '❚❚ Pause'; }
    if (TL.playing) tlPause();
    setStatus(`video saved — ${cv.width}×${cv.height} @${S.fps}fps · ${(blob.size / 1e6).toFixed(1)} MB`);
  };
  recorder.start(1000);
  tlSeek(0);                       // recording hamesha timeline ke 0 se
  if (!TL.playing) tlPlay();
  btn.classList.add('recording');
  btn.textContent = '■ Stop';
  if (pbtn) { pbtn.disabled = false; pbtn.textContent = '❚❚ Pause'; }
  const q = S.quality === 'uhd' ? 'Ultra HD' : S.quality === 'fhd' ? 'Full HD' : 'HD';
  setStatus(`recording ${q} ${cv.width}×${cv.height} @${S.fps}fps…`);
}

/* -------------------------------------------------------------------- UI */
function setStatus(t, bad) {
  const el = $('status');
  if (!el) return;
  el.textContent = t;
  el.style.color = bad ? '#ff9d95' : '';
}

function syncModeButtons() {
  document.querySelectorAll('#mouthMode button').forEach(b =>
    b.classList.toggle('on', b.dataset.mode === S.mouthMode));
}

function bindUI() {
  const seg = (id, attr, fn) => {
    document.querySelectorAll(`#${id} button`).forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll(`#${id} button`).forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        fn(b.dataset[attr]);
      });
    });
  };
  seg('aspectSeg', 'aspect', v => { S.aspect = v; applyOutputSize(); });
  seg('qualitySeg', 'quality', v => { S.quality = v; applyOutputSize(); });
  seg('fpsSeg', 'fps', v => { S.fps = +v; applyOutputSize(); });
  seg('bgSeg', 'bg', v => { S.bg = v; invalidateBackground(); });

  $('btnRec').onclick = toggleRecord;
  $('btnPause').onclick = togglePause;
  $('depthMode').onchange = e => {
    S.depthMode = e.target.checked;
    setStatus(S.depthMode ? 'depth ON — character ko upar kheencho: andar chala jayega' : 'depth OFF');
  };
  $('depth').oninput = e => {
    S.depth = e.target.value / 100;
    $('lblDepth').textContent = e.target.value + '%';
  };
  $('btnDepthReset').onclick = () => {
    S.depth = 0; S.panX = 0; S.panY = 0;
    $('depth').value = 0; $('lblDepth').textContent = '0%';
    computeFit();
  };
  $('walkSpeed').oninput = e => {
    S.walkSpeed = e.target.value / 100;
    $('lblWalk').textContent = (S.walkSpeed * 2).toFixed(1) + '×';
  };
  $('btnShot').onclick = () => {
    drawFrame();
    cv.toBlob(b => download(b, stamp('png')), 'image/png');
    setStatus('PNG saved');
  };

  $('zoom').oninput = e => {
    S.zoom = e.target.value / 100;
    $('lblZoom').textContent = e.target.value + '%';
    computeFit();
  };
  $('btnReset').onclick = () => {
    S.panX = 0; S.panY = 0; S.zoom = 1;
    $('zoom').value = 100; $('lblZoom').textContent = '100%';
    computeFit();
  };
  $('safeGuides').onchange = e => { S.safe = e.target.checked; };

  $('btnBlink').onclick = () => triggerBlink();
  $('holdClosed').onchange = e => { S.holdClosed = e.target.checked; };
  $('autoBlink').onchange = e => { S.autoBlink = e.target.checked; };
  $('blinkRate').oninput = e => {
    S.blinkRate = e.target.value / 100;
    $('lblBlink').textContent = S.blinkRate < 0.33 ? 'slow' : S.blinkRate > 0.66 ? 'fast' : 'normal';
  };
  $('followMouse').onchange = e => { S.followMouse = e.target.checked; };
  $('pupilSize').oninput = e => {
    S.pupilSize = e.target.value / 100;
    $('lblPupil').textContent = e.target.value + '%';
  };
  $('eyeSize').oninput = e => {
    S.eyeSize = e.target.value / 100;
    $('lblEyeSize').textContent = e.target.value + '%';
  };
  $('mouthX').oninput = e => { S.mouthDX = +e.target.value; };
  $('mouthY').oninput = e => { S.mouthDY = +e.target.value; };
  $('eyeX').oninput = e => { S.eyeDX = +e.target.value; };
  $('eyeY').oninput = e => { S.eyeDY = +e.target.value; };
  $('btnResetFace').onclick = () => {
    S.mouthDX = S.mouthDY = S.eyeDX = S.eyeDY = 0;
    ['mouthX', 'mouthY', 'eyeX', 'eyeY'].forEach(id => { $(id).value = 0; });
  };

  document.querySelectorAll('#mouthMode button').forEach(b => {
    b.addEventListener('click', async () => {
      S.mouthMode = b.dataset.mode;
      syncModeButtons();
      if (S.mouthMode === 'mic') await enableMic();
      if (S.mouthMode === 'file' && S.voiceAudio && !TL.playing) tlPlay();
      setStatus('mouth mode: ' + S.mouthMode);
    });
  });
  $('sens').oninput = e => { S.sens = e.target.value / 100; $('lblSens').textContent = S.sens.toFixed(1) + '×'; };
  $('manual').oninput = e => {
    S.manual = e.target.value / 100;
    $('lblOpen').textContent = e.target.value + '%';
    if (S.mouthMode !== 'manual') { S.mouthMode = 'manual'; syncModeButtons(); }
  };
  $('voiceFile').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) loadVoiceFile(f); };
  $('btnVoicePlay').onclick = () => { if (S.voiceAudio) tlToggle(); };

  $('stickW').oninput = e => { S.stickW = +e.target.value; $('lblStickW').textContent = e.target.value; };
  $('stickColor').oninput = e => { S.stickColor = e.target.value; };
  $('armLen').oninput = e => { S.armLen = e.target.value / 100; $('lblArmLen').textContent = e.target.value + '%'; };
  $('legLen').oninput = e => { S.legLen = e.target.value / 100; $('lblLegLen').textContent = e.target.value + '%'; };
  $('debug').onchange = e => { S.debug = e.target.checked; };

  $('breath').oninput = e => { S.breath = e.target.value / 100; $('lblBreath').textContent = e.target.value + '%'; };
  $('headMotion').oninput = e => { S.headMotion = e.target.value / 100; $('lblHeadM').textContent = e.target.value + '%'; };
  $('sway').oninput = e => { S.sway = e.target.value / 100; $('lblSway').textContent = e.target.value + '%'; };
  $('idleOn').onchange = e => { S.idle = e.target.checked; };

  $('bgFile').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      const raw = new Image();
      raw.onload = () => {
        /* timeline me save karne ke liye chhota kar dete hain */
        const MAX = 1280;
        const k = Math.min(1, MAX / Math.max(raw.width, raw.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(raw.width * k));
        c.height = Math.max(1, Math.round(raw.height * k));
        c.getContext('2d').drawImage(raw, 0, 0, c.width, c.height);
        S.bgDataUrl = c.toDataURL('image/jpeg', 0.82);
        setBg('image', S.bgDataUrl);
      };
      raw.src = fr.result;
    };
    fr.readAsDataURL(f);
  };

  $('btnAddClip').onclick = () => {
    const name = ($('clipName').value || '').trim() || ('Pose ' + (CLIPS.length + 1));
    CLIPS.push({ name, pose: currentPose(), at: Date.now() });
    saveClips(); renderClips();
    $('clipName').value = '';
    setStatus(`clip saved: ${name}`);
  };

  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (cv.width / r.width);
    const cy = (e.clientY - r.top) * (cv.height / r.height);
    zoomAt(cx, cy, e.deltaY < 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '9') { playClip(+k - 1); return; }
    if (k === 'b') triggerBlink();
    if (k === 'c') {
      S.holdClosed = !S.holdClosed;
      $('holdClosed').checked = S.holdClosed;
    }
    if (k === 'p') togglePause();
    if (k === 'l') {
      e.preventDefault();
      if (TL.playing) tlPause(); else tlPlay();
    }
    if (k === 'm') { e.preventDefault(); tlAdd(); }
    if (k === 'g') { e.preventDefault(); tlAddBg(); }
    if (k === 's') { e.preventDefault(); tlSplit(); }
    if (k === 'delete' || k === 'backspace') {
      if (TL.sel >= 0 && TL.sel < TL.marks.length) {
        e.preventDefault();
        TL.marks.splice(TL.sel, 1); TL.sel = -1;
        tlSave(); renderTimeline(); setStatus('marker delete');
      }
    }
    if (k === 'arrowleft') { e.preventDefault(); tlSeek(TL.head - (e.shiftKey ? 1 : 0.25)); }
    if (k === 'arrowright') { e.preventDefault(); tlSeek(TL.head + (e.shiftKey ? 1 : 0.25)); }
    if (k === 'home') { e.preventDefault(); tlSeek(0); }
    if (k === 'end') { e.preventDefault(); tlSeek(TL.dur); }
    if (k === 'd') {
      S.depthMode = !S.depthMode;
      $('depthMode').checked = S.depthMode;
    }
    if (k === ' ') {                    // sabse natural: play / pause
      e.preventDefault();
      tlToggle();
    }
    if (k === 'o') {
      S.mouthMode = S.mouthMode === 'auto' ? 'manual' : 'auto';
      syncModeButtons();
      setStatus('mouth: ' + S.mouthMode);
    }
  });

  window.addEventListener('resize', fitCanvasCss);
  new ResizeObserver(fitCanvasCss).observe($('stage'));
}

/* ------------------------------------------------------------------- loop */
let last = performance.now();
function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  S.t += dt;
  stepTween(dt);
  updateMotion(dt);
  updateBlink(dt);
  updateTimeline(dt);
  updateMouth(dt);
  drawFrame();
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------- init */
loadClips();
tlLoad();
bindUI();
bindTimeline();
tlSyncLen();
renderTimeline();
S.mouse = [cv.width / 2, cv.height * 0.42];
renderClips();
applyOutputSize();
computeFit();
requestAnimationFrame(loop);
setTimeout(() => setStatus('ready — chibi rig'), 400);

window.__chibi = { S, POSE, RM, playClip, triggerBlink, drawFrame, applyPose, defaultPose, CLIPS, TL, BV: BUILTIN,
  setBg, tlAddBg, bgStateAt, tlSplit, tlSegEnd, tlResizeSeg,
  voiceTime, playVoice, pauseVoice, tlSeek, tlPlay, tlPause, tlAdd, tlFire, loadVoiceFile, ensureCtx,
  view: VIEW, eyes: eyeBoxes, lockBlink: v => { S.blinkLock = v; } };
})();
