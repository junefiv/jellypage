import { loadBitmap, type Bitmap } from './bitmap';
import { deltaE2000, hueDelta, labChroma, labHue, rgbToHex, rgbToLab, type Lab } from './lab';
import type { ExtractResult, PaletteColor } from './types';

const EXTRACT_W = 240;
const COUNT = 6;

type ScoredPixel = {
  r: number;
  g: number;
  b: number;
  lab: Lab;
  nx: number;
  ny: number;
  score: number;
};

export async function extractPalette(uri: string): Promise<ExtractResult> {
  try {
    const bmp = await loadBitmap(uri, EXTRACT_W);
    if (!bmp) return { ok: false, reason: 'PALETTE FAIL', colors: [] };

    const pixels = buildPixels(bmp);
    if (pixels.length < COUNT * 4) return { ok: false, reason: 'PALETTE FAIL', colors: [] };

    const mean = meanLab(pixels);
    const scored = pixels.map((p) => ({ ...p, score: vividScore(p, mean, bmp) }));
    const picked = selectAdobeVivid(scored, COUNT);
    if (picked.length < COUNT) {
      return {
        ok: false,
        reason: 'PALETTE FAIL',
        colors: toPalette(picked),
      };
    }

    const colors = toPalette(picked);
    return { ok: true, colors, vec: toVec(colors) };
  } catch {
    return { ok: false, reason: 'PALETTE FAIL', colors: [] };
  }
}

export function toVec(colors: PaletteColor[]): number[] {
  const five = [...colors];
  while (five.length < 5) {
    five.push({ hex: '#000000', r: 0, g: 0, b: 0, l: 0, a: 0, lab_b: 0, ratio: 0 });
  }
  return five.slice(0, 5).flatMap((c) => [c.l, c.a, c.lab_b]);
}

function buildPixels(bmp: Bitmap): ScoredPixel[] {
  const { w, h, data } = bmp;
  const out: ScoredPixel[] = [];
  const step = w * h > 28_000 ? 2 : 1;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 16) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      out.push({
        r,
        g,
        b,
        lab: rgbToLab(r, g, b),
        nx: (x + 0.5) / w,
        ny: (y + 0.5) / h,
        score: 0,
      });
    }
  }
  return out;
}

function localMeanLab(bmp: Bitmap, x: number, y: number): Lab {
  const { w, h, data } = bmp;
  let l = 0;
  let a = 0;
  let b = 0;
  let n = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const px = Math.min(w - 1, Math.max(0, x + dx));
      const py = Math.min(h - 1, Math.max(0, y + dy));
      const i = (py * w + px) * 4;
      if (data[i + 3] < 16) continue;
      const lab = rgbToLab(data[i], data[i + 1], data[i + 2]);
      l += lab.l;
      a += lab.a;
      b += lab.b;
      n += 1;
    }
  }
  if (!n) return { l: 50, a: 0, b: 0 };
  return { l: l / n, a: a / n, b: b / n };
}

function vividScore(pixel: ScoredPixel, mean: Lab, bmp: Bitmap): number {
  const c = labChroma(pixel.lab);
  const l = pixel.lab.l;
  const x = Math.round(pixel.nx * (bmp.w - 1));
  const y = Math.round(pixel.ny * (bmp.h - 1));
  const local = localMeanLab(bmp, x, y);

  if (c < 5 && (l > 88 || l < 10)) return 0;

  const sat = (c / 42) ** 1.65;
  const pop = Math.sqrt(dist2(pixel.lab, mean)) / 24;
  const localPop = Math.sqrt(dist2(pixel.lab, local)) / 18;
  const light = l > 14 && l < 94 ? 1 : 0.28;

  let score = light * (0.12 + sat) * (0.45 + pop) * (0.7 + localPop);

  if (l < 30 && c > 7) score *= 1.35;
  if (l > 72 && c > 14) score *= 1.2;
  if (c > 28) score *= 1.15;

  return score;
}

function selectAdobeVivid(scored: ScoredPixel[], count: number): ScoredPixel[] {
  const pool = [...scored]
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!pool.length) return [];

  const cap = Math.min(pool.length, Math.max(count * 10, 96));
  const candidates = pool.slice(0, cap);
  const out: ScoredPixel[] = [candidates[0]];

  while (out.length < count) {
    let best: ScoredPixel | null = null;
    let bestRank = -1;

    for (const p of candidates) {
      if (out.includes(p)) continue;

      const minDE = Math.min(...out.map((s) => deltaE2000(p.lab, s.lab)));
      const minXY = Math.min(...out.map((s) => Math.hypot(p.nx - s.nx, p.ny - s.ny)));

      if (out.length < count - 1 && minDE < 9 && minXY < 0.055) continue;

      const chroma = labChroma(p.lab);
      if (chroma > 12 && out.length >= 2) {
        const hueClash = out.some((s) => {
          if (labChroma(s.lab) < 12) return false;
          const hueGap = hueDelta(labHue(p.lab), labHue(s.lab));
          return hueGap < 16 && Math.hypot(p.nx - s.nx, p.ny - s.ny) < 0.14;
        });
        if (hueClash) continue;
      }

      const rank = p.score * (1 + minDE / 16) * (1 + minXY * 5);
      if (rank > bestRank) {
        bestRank = rank;
        best = p;
      }
    }

    if (!best) {
      best = candidates.find((p) => !out.includes(p)) ?? null;
    }
    if (!best) break;
    out.push(best);
  }

  return spreadPixels(out, candidates).slice(0, count);
}

function spreadPixels(selected: ScoredPixel[], pool: ScoredPixel[]): ScoredPixel[] {
  const out = [...selected];
  for (let i = 0; i < out.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (Math.hypot(out[i].nx - out[j].nx, out[i].ny - out[j].ny) >= 0.07) continue;
      const alt = pool.find(
        (p) =>
          !out.includes(p) &&
          out.every((s, k) => k === i || Math.hypot(p.nx - s.nx, p.ny - s.ny) >= 0.07),
      );
      if (alt) out[i] = alt;
    }
  }
  return out;
}

function toPalette(picked: ScoredPixel[]): PaletteColor[] {
  const sum = picked.reduce((s, p) => s + p.score, 0) || 1;
  return picked
    .map((p) => ({
      hex: rgbToHex(p.r, p.g, p.b),
      r: p.r,
      g: p.g,
      b: p.b,
      l: round(p.lab.l),
      a: round(p.lab.a),
      lab_b: round(p.lab.b),
      ratio: p.score / sum,
      x: p.nx,
      y: p.ny,
    }))
    .sort((a, b) => b.ratio - a.ratio);
}

function meanLab(pixels: ScoredPixel[]): Lab {
  let l = 0;
  let a = 0;
  let b = 0;
  for (const p of pixels) {
    l += p.lab.l;
    a += p.lab.a;
    b += p.lab.b;
  }
  const n = pixels.length || 1;
  return { l: l / n, a: a / n, b: b / n };
}

function dist2(x: Lab, y: Lab): number {
  return (x.l - y.l) ** 2 + (x.a - y.a) ** 2 + (x.b - y.b) ** 2;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
