type Pt = { x: number; y: number };

function hash(hex: string, salt: number): number {
  let h = (salt + 1) * 2654435761;
  for (let i = 0; i < hex.length; i++) {
    h = Math.imul(h ^ hex.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function smoothClosed(pts: Pt[], tension: number): string {
  const n = pts.length;
  if (!n) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

function clampPts(pts: Pt[], w: number, h: number, pad: number): Pt[] {
  return pts.map((p) => ({
    x: Math.min(w - pad, Math.max(pad, p.x)),
    y: Math.min(h - pad, Math.max(pad, p.y)),
  }));
}

function polarBlob(
  rand: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  rot: number,
): Pt[] {
  const lobes = 2;
  const phase = rand() * Math.PI * 2;
  const amp = 0.05 + rand() * 0.05;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const wobble = 0.86 + rand() * 0.16;
    const wave = 1 + Math.sin(t * lobes + phase) * amp;
    const a = t + rot;
    pts.push({
      x: cx + Math.cos(a) * rx * wobble * wave,
      y: cy + Math.sin(a) * ry * wobble * wave,
    });
  }
  return pts;
}

export type PaintMark = {
  body: string;
  smear: string;
  ridge: string;
};

export function paintMark(hex: string, index: number, w = 80, h = 92): PaintMark {
  const rand = rng(hash(hex, index * 17 + hex.length));
  const kind = Math.floor(rand() * 3);
  const pad = 8;
  const cx = w * (0.46 + rand() * 0.08);
  const cy = h * (0.46 + rand() * 0.08);
  const n = 11 + Math.floor(rand() * 2);
  const rot = (rand() - 0.5) * 0.45;
  const tension = 0.2;

  const stretch = kind === 0 ? 1.12 : kind === 1 ? 0.9 : 1;
  const rx = Math.min(w, h) * (0.3 + rand() * 0.05) * stretch;
  const ry = Math.min(w, h) * (0.28 + rand() * 0.05) / stretch;

  const body = smoothClosed(clampPts(polarBlob(rand, cx, cy, rx, ry, n, rot), w, h, pad), tension);

  const sx = cx + (rand() - 0.5) * 6;
  const sy = cy + (rand() - 0.4) * 6;
  const smear = smoothClosed(
    clampPts(polarBlob(rand, sx, sy, rx * 0.62, ry * 0.48, 10, rot + 0.35), w, h, pad),
    tension,
  );

  const ridge = smoothClosed(
    clampPts(polarBlob(rand, cx - rx * 0.08, cy - ry * 0.1, rx * 0.22, ry * 0.16, 10, rot), w, h, pad + 2),
    0.2,
  );

  return { body, smear, ridge };
}

export function luma(hex: string): number {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function liftHex(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const ch = (i: number) =>
    Math.max(0, Math.min(255, parseInt(n.slice(i, i + 2), 16) + amt))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(0)}${ch(2)}${ch(4)}`.toUpperCase();
}
