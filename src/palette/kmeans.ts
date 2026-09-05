import { deltaE2000, hueDelta, labChroma, labHue, type Lab } from './lab';

export type Sample = {
  r: number;
  g: number;
  b: number;
  lab: Lab;
  w: number;
  nx?: number;
  ny?: number;
};

export type Cluster = {
  r: number;
  g: number;
  b: number;
  lab: Lab;
  count: number;
};

export function kmeans(samples: Sample[], k: number, iters = 12, seeds?: Lab[]): Cluster[] {
  if (samples.length === 0) return [];
  const kk = Math.min(k, samples.length);
  const centers: Lab[] = [];
  if (seeds?.length) {
    for (let i = 0; i < kk; i++) centers.push({ ...(seeds[i] ?? seeds[seeds.length - 1]) });
  } else {
    const step = Math.max(1, Math.floor(samples.length / kk));
    for (let i = 0; i < kk; i++) centers.push({ ...samples[i * step].lab });
  }

  const assign = new Int16Array(samples.length);
  for (let iter = 0; iter < iters; iter++) {
    for (let i = 0; i < samples.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < kk; c++) {
        const d = shadeDist(samples[i].lab, centers[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
    }
    const acc = Array.from({ length: kk }, () => ({ l: 0, a: 0, b: 0, w: 0 }));
    for (let i = 0; i < samples.length; i++) {
      const c = assign[i];
      const w = samples[i].w;
      acc[c].l += samples[i].lab.l * w;
      acc[c].a += samples[i].lab.a * w;
      acc[c].b += samples[i].lab.b * w;
      acc[c].w += w;
    }
    for (let c = 0; c < kk; c++) {
      if (acc[c].w === 0) continue;
      centers[c] = {
        l: acc[c].l / acc[c].w,
        a: acc[c].a / acc[c].w,
        b: acc[c].b / acc[c].w,
      };
    }
  }

  const buckets = Array.from({ length: kk }, () => ({
    r: 0,
    g: 0,
    b: 0,
    count: 0,
    lab: centers[0],
  }));
  for (let i = 0; i < samples.length; i++) {
    const c = assign[i];
    const w = samples[i].w;
    buckets[c].r += samples[i].r * w;
    buckets[c].g += samples[i].g * w;
    buckets[c].b += samples[i].b * w;
    buckets[c].count += w;
  }
  return buckets
    .map((x, i) => ({
      r: x.count ? x.r / x.count : 0,
      g: x.count ? x.g / x.count : 0,
      b: x.count ? x.b / x.count : 0,
      lab: centers[i] ?? rgbFallback(x),
      count: x.count,
    }))
    .filter((x) => x.count > 0);
}

export function mergeClose(clusters: Cluster[], threshold = 8): Cluster[] {
  const out = clusters.map((c) => ({ ...c, lab: { ...c.lab } }));
  let merged = true;
  while (merged && out.length > 1) {
    merged = false;
    outer: for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (deltaE2000(out[i].lab, out[j].lab) < threshold) {
          const a = out[i];
          const b = out[j];
          const n = a.count + b.count;
          out[i] = {
            r: (a.r * a.count + b.r * b.count) / n,
            g: (a.g * a.count + b.g * b.count) / n,
            b: (a.b * a.count + b.b * b.count) / n,
            lab: {
              l: (a.lab.l * a.count + b.lab.l * b.count) / n,
              a: (a.lab.a * a.count + b.lab.a * b.count) / n,
              b: (a.lab.b * a.count + b.lab.b * b.count) / n,
            },
            count: n,
          };
          out.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return out;
}

export function mergeLightVariants(clusters: Cluster[]): Cluster[] {
  const out = clusters.map((c) => ({ ...c, lab: { ...c.lab } }));
  let merged = true;
  while (merged && out.length > 1) {
    merged = false;
    outer: for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (sameLightFamily(out[i], out[j])) {
          out[i] = fuseBody(out[i], out[j]);
          out.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return out;
}

export function sameLightFamily(a: Cluster, b: Cluster): boolean {
  const ca = labChroma(a.lab);
  const cb = labChroma(b.lab);
  const dh = hueDelta(labHue(a.lab), labHue(b.lab));
  const dL = Math.abs(a.lab.l - b.lab.l);
  const [cLo, cHi] = ca <= cb ? [ca, cb] : [cb, ca];
  const lo = ca <= cb ? a : b;

  if (cHi < 8) {
    return dL < 10 && deltaE2000(a.lab, b.lab) < 10;
  }

  if (cLo < 10) {
    const wash = lo.lab.l > 76 || lo.lab.l < 24;
    if (wash && dL > 6) return dh < 30 || cLo < 4;
    return dh < 20 && dL > 5;
  }

  const dc = Math.abs(ca - cb);
  const rel = cLo / cHi;
  if (dh < 14) return dc < 36 || rel > 0.28;
  if (dh < 22) return dc < 20 || rel > 0.48;
  return false;
}

function fuseBody(a: Cluster, b: Cluster): Cluster {
  const body = bodyScore(a) >= bodyScore(b) ? a : b;
  return {
    r: body.r,
    g: body.g,
    b: body.b,
    lab: { ...body.lab },
    count: a.count + b.count,
  };
}

function bodyScore(c: Cluster): number {
  return labChroma(c.lab) - Math.abs(c.lab.l - 50) * 0.22;
}

export function splitLargest(clusters: Cluster[]): Cluster[] {
  if (clusters.length === 0) return clusters;
  let idx = 0;
  for (let i = 1; i < clusters.length; i++) {
    if (clusters[i].count > clusters[idx].count) idx = i;
  }
  const c = clusters[idx];
  const a: Cluster = {
    ...c,
    count: c.count / 2,
    r: Math.min(255, c.r + 18),
    lab: { ...c.lab, a: c.lab.a + 8 },
  };
  const b: Cluster = {
    ...c,
    count: c.count / 2,
    r: Math.max(0, c.r - 18),
    lab: { ...c.lab, a: c.lab.a - 8 },
  };
  return [...clusters.filter((_, i) => i !== idx), a, b];
}

function shadeDist(x: Lab, y: Lab) {
  const dL = x.l - y.l;
  const dA = x.a - y.a;
  const dB = x.b - y.b;
  return 0.16 * dL * dL + dA * dA + dB * dB;
}

function rgbFallback(x: { r: number; g: number; b: number }): Lab {
  return { l: 50, a: 0, b: 0 };
}
