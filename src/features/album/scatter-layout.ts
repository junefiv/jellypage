import { POLAROID_H, POLAROID_W } from '@/src/components/ui/AlbumPolaroid';

export type ScatterSlot = {
  id: string;
  x: number;
  y: number;
  rot: number;
};

const GAP = 36;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: number, n: number) {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function aabb(w: number, h: number, rotDeg: number) {
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { w: w * c + h * s, h: w * s + h * c };
}

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return Math.abs(ax - bx) < (aw + bw) / 2 + GAP && Math.abs(ay - by) < (ah + bh) / 2 + GAP;
}

export function scatterLayout(ids: string[], salt = 0): ScatterSlot[] {
  if (!ids.length) return [];

  const out: ScatterSlot[] = [];
  const cols = Math.max(2, Math.ceil(Math.sqrt(ids.length * 1.35)));

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const seed = hash(`${id}:${salt}`);
    let placed: ScatterSlot | null = null;

    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = (col - (cols - 1) / 2) * (POLAROID_W + GAP + 18);
    const baseY = (row - (Math.ceil(ids.length / cols) - 1) / 2) * (POLAROID_H + GAP + 24);

    for (let attempt = 0; attempt < 180; attempt += 1) {
      const jitterX = (rand(seed, attempt) - 0.5) * (POLAROID_W * 0.9);
      const jitterY = (rand(seed, attempt + 5) - 0.5) * (POLAROID_H * 0.9);
      const x = baseX + jitterX + (rand(seed, attempt + 9) - 0.5) * 48;
      const y = baseY + jitterY + (rand(seed, attempt + 13) - 0.5) * 48;
      const rot = (rand(seed, attempt + 17) - 0.5) * 90;

      const hit = out.some((p) => {
        const pb = aabb(POLAROID_W, POLAROID_H, p.rot);
        const cb = aabb(POLAROID_W, POLAROID_H, rot);
        return overlaps(x, y, cb.w, cb.h, p.x, p.y, pb.w, pb.h);
      });
      if (!hit) {
        placed = { id, x, y, rot };
        break;
      }
    }

    if (!placed) {
      placed = {
        id,
        x: baseX + (rand(seed, 90) - 0.5) * 30,
        y: baseY + (rand(seed, 91) - 0.5) * 30,
        rot: (rand(seed, 92) - 0.5) * 90,
      };
    }
    out.push(placed);
  }

  return out;
}

export function scatterBounds(slots: ScatterSlot[]) {
  if (!slots.length) return { minX: -200, maxX: 200, minY: -200, maxY: 200 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const s of slots) {
    const box = aabb(POLAROID_W, POLAROID_H, s.rot);
    minX = Math.min(minX, s.x - box.w / 2);
    maxX = Math.max(maxX, s.x + box.w / 2);
    minY = Math.min(minY, s.y - box.h / 2);
    maxY = Math.max(maxY, s.y + box.h / 2);
  }
  const pad = 120;
  return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
}

export type CanvasView = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function canvasView(
  vw: number,
  vh: number,
  panX: number,
  panY: number,
  zoom: number,
): CanvasView {
  return {
    left: -panX / zoom,
    right: (vw - panX) / zoom,
    top: -panY / zoom,
    bottom: (vh - panY) / zoom,
  };
}

/** Start center off-screen relative to the current viewport (canvas coords). */
export function offscreenSpawn(endCx: number, endCy: number, seed: number, view: CanvasView) {
  const edge = Math.floor(rand(seed, 40) * 4);
  const margin = POLAROID_W + 64;
  const spanX = Math.max(view.right - view.left, POLAROID_W);
  const spanY = Math.max(view.bottom - view.top, POLAROID_H);
  const t = rand(seed, 41);

  switch (edge) {
    case 0:
      return { x: view.left + t * spanX, y: view.top - margin };
    case 1:
      return { x: view.right + margin, y: view.top + t * spanY };
    case 2:
      return { x: view.left + t * spanX, y: view.bottom + margin };
    default:
      return { x: view.left - margin, y: view.top + t * spanY };
  }
}
