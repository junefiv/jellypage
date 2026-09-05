import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import { kmeans, mergeLightVariants, sameLightFamily, type Cluster, type Sample } from './kmeans';
import { hueDelta, labChroma, labHue, rgbToHex, rgbToLab, type Lab } from './lab';
import type { ExtractResult, PaletteColor } from './types';

export async function extractPalette(uri: string): Promise<ExtractResult> {
  try {
    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 56 } }],
      {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );
    if (!resized.base64) return { ok: false, reason: 'PALETTE FAIL', colors: [] };

    const decoded = jpeg.decode(Buffer.from(resized.base64, 'base64'), { useTArray: true });
    const raw: Sample[] = [];
    const data = decoded.data;
    const iw = decoded.width || 1;
    const ih = decoded.height || 1;
    const stride = data.length > 16_000 ? 16 : 8;
    for (let i = 0; i < data.length; i += stride) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 16) continue;
      const px = Math.floor(i / 4);
      raw.push({
        r,
        g,
        b,
        lab: rgbToLab(r, g, b),
        w: 1,
        nx: ((px % iw) + 0.5) / iw,
        ny: (Math.floor(px / iw) + 0.5) / ih,
      });
    }

    if (raw.length < 16) return { ok: false, reason: 'PALETTE FAIL', colors: [] };

    const mean = meanLab(raw);
    const samples = raw.map((s) => ({ ...s, w: pointWeight(s.lab, mean) }));

    const clustered = mergeLightVariants(kmeans(samples, 12, 6, hueSeeds(samples, 12)));
    const ranked = rankPoint(clustered, mean);
    const picked = pickDistinct(ranked);
    const filled = fillSix(picked, ranked, samples);
    if (filled.length < 6) {
      const origins = spreadOrigins(filled.map((c) => locateOrigin(c, samples)));
      return {
        ok: false,
        reason: 'PALETTE FAIL',
        colors: toColors(filled, 1).map((c, i) => ({ ...c, x: origins[i]?.x, y: origins[i]?.y })),
      };
    }

    const total = filled.reduce((s, c) => s + c.count, 0) || 1;
    const origins = spreadOrigins(filled.map((c) => locateOrigin(c, samples)));
    const colors = toColors(filled, total).map((c, i) => ({ ...c, x: origins[i]?.x, y: origins[i]?.y }));
    const scores = filled.map((c, i) => (i < picked.length ? Math.max(pointScore(c, mean, total), 0.01) : 0.008));
    const scoreSum = scores.reduce((s, n) => s + n, 0) || 1;
    const normalized = colors.map((c, i) => ({ ...c, ratio: scores[i] / scoreSum }));
    return { ok: true, colors: normalized, vec: toVec(normalized) };
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

function dist2(x: Lab, y: Lab): number {
  return (x.l - y.l) ** 2 + (x.a - y.a) ** 2 + (x.b - y.b) ** 2;
}

function meanLab(samples: Sample[]): Lab {
  let l = 0;
  let a = 0;
  let b = 0;
  for (const s of samples) {
    l += s.lab.l;
    a += s.lab.a;
    b += s.lab.b;
  }
  const n = samples.length || 1;
  return { l: l / n, a: a / n, b: b / n };
}

function pointWeight(lab: Lab, mean: Lab): number {
  const c = labChroma(lab);
  if (lab.l > 82 && c < 14) return 0.05;
  if (lab.l < 16 && c < 10) return 0.05;
  const mid = lab.l > 18 && lab.l < 86 ? 1 : 0.12;
  const sat = 0.2 + (c / 38) ** 1.45;
  const off = 0.3 + dist2(lab, mean) / 2200;
  return mid * sat * off;
}

function pointScore(c: Cluster, mean: Lab, total: number): number {
  const ch = labChroma(c.lab);
  const share = c.count / total;
  let score = (ch + 3) * (Math.sqrt(dist2(c.lab, mean)) + 6) / (share + 0.025) ** 0.42;
  if (ch < 10 && (c.lab.l > 80 || c.lab.l < 18)) score *= 0.2;
  return score;
}

function hueSeeds(samples: Sample[], k: number): Lab[] {
  const ranked = [...samples].sort((a, b) => labChroma(b.lab) - labChroma(a.lab));
  const seeds: Lab[] = [];
  for (const s of ranked) {
    if (seeds.length >= k) break;
    if (seeds.every((c) => seedOk(c, s.lab))) seeds.push({ ...s.lab });
  }
  let i = 0;
  while (seeds.length < k && i < samples.length) {
    seeds.push({ ...samples[i].lab });
    i += Math.max(1, Math.floor(samples.length / k));
  }
  return seeds;
}

function seedOk(a: Lab, b: Lab): boolean {
  const ca = labChroma(a);
  const cb = labChroma(b);
  if (ca < 8 && cb < 8) return Math.abs(a.l - b.l) > 18;
  if (ca < 8 || cb < 8) return true;
  return hueDelta(labHue(a), labHue(b)) > 24;
}

function rankPoint(clusters: Cluster[], mean: Lab): Cluster[] {
  const total = clusters.reduce((s, c) => s + c.count, 0) || 1;
  const maxC = Math.max(...clusters.map((c) => labChroma(c.lab)), 0);
  if (maxC < 6) {
    return [...clusters].sort((a, b) => b.count - a.count);
  }
  return [...clusters].sort((a, b) => pointScore(b, mean, total) - pointScore(a, mean, total));
}

function pickDistinct(ranked: Cluster[]): Cluster[] {
  const out: Cluster[] = [];
  for (const c of ranked) {
    if (out.length >= 6) break;
    if (out.every((p) => !sameLightFamily(p, c) && hueFar(p, c))) out.push(c);
  }
  return out;
}

function hueFar(a: Cluster, b: Cluster): boolean {
  const ca = labChroma(a.lab);
  const cb = labChroma(b.lab);
  if (ca < 8 && cb < 8) return Math.abs(a.lab.l - b.lab.l) > 12;
  if (ca < 8 || cb < 8) return true;
  return hueDelta(labHue(a.lab), labHue(b.lab)) > 20;
}

function fillSix(picked: Cluster[], ranked: Cluster[], samples: Sample[]): Cluster[] {
  const out = [...picked];
  for (const c of ranked) {
    if (out.length >= 6) break;
    if (out.some((p) => p === c || sameLightFamily(p, c))) continue;
    out.push(c);
  }
  for (const extra of supportTones(samples)) {
    if (out.length >= 6) break;
    if (out.every((p) => !sameLightFamily(p, extra))) out.push(extra);
  }
  for (const extra of [...ranked, ...supportTones(samples)]) {
    if (out.length >= 6) break;
    if (out.includes(extra)) continue;
    out.push(extra);
  }
  let n = 0;
  while (out.length < 6 && out[0]) {
    const src = out[n % out.length];
    out.push({
      r: src.r,
      g: src.g,
      b: src.b,
      lab: { ...src.lab },
      count: 1,
    });
    n += 1;
  }
  return out.slice(0, 6);
}

function supportTones(samples: Sample[]): Cluster[] {
  let dark = samples[0];
  let light = samples[0];
  const mean = meanLab(samples);
  let acc = { r: 0, g: 0, b: 0 };
  for (const s of samples) {
    acc.r += s.r;
    acc.g += s.g;
    acc.b += s.b;
    if (s.lab.l < dark.lab.l) dark = s;
    if (s.lab.l > light.lab.l) light = s;
  }
  const n = samples.length;
  return [
    { r: acc.r / n, g: acc.g / n, b: acc.b / n, lab: mean, count: 1 },
    { r: dark.r, g: dark.g, b: dark.b, lab: dark.lab, count: 1 },
    { r: light.r, g: light.g, b: light.b, lab: light.lab, count: 1 },
  ];
}

function locateOrigin(cluster: Cluster, samples: Sample[]): { x: number; y: number } {
  let best = samples[0];
  let bestD = Infinity;
  let sx = 0;
  let sy = 0;
  let w = 0;
  for (const s of samples) {
    if (s.nx == null || s.ny == null) continue;
    const d = dist2(s.lab, cluster.lab);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
    if (d < 220) {
      sx += s.nx * s.w;
      sy += s.ny * s.w;
      w += s.w;
    }
  }
  if (w > 0) return { x: sx / w, y: sy / w };
  return { x: best?.nx ?? 0.5, y: best?.ny ?? 0.5 };
}

function spreadOrigins(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const out = points.map((p) => ({ ...p }));
  for (let i = 0; i < out.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const dx = out[i].x - out[j].x;
      const dy = out[i].y - out[j].y;
      if (Math.hypot(dx, dy) >= 0.08) continue;
      const ang = i * 2.39996;
      out[i].x = clamp01(out[j].x + Math.cos(ang) * 0.09);
      out[i].y = clamp01(out[j].y + Math.sin(ang) * 0.09);
    }
  }
  return out;
}

function clamp01(n: number) {
  return Math.min(0.92, Math.max(0.08, n));
}

function toColors(clusters: Cluster[], total: number): PaletteColor[] {
  return clusters.map((c) => ({
    hex: rgbToHex(c.r, c.g, c.b),
    r: Math.round(c.r),
    g: Math.round(c.g),
    b: Math.round(c.b),
    l: round(c.lab.l),
    a: round(c.lab.a),
    lab_b: round(c.lab.b),
    ratio: c.count / total,
  }));
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
