export type Lab = { l: number; a: number; b: number };
export type PaletteColor = {
  hex: string;
  r: number;
  g: number;
  b: number;
  l: number;
  a: number;
  lab_b: number;
  ratio: number;
};

export const MATCH = {
  CANDIDATE_LIMIT: 50,
  RECENT_DAYS: 90,
  CLOSE_MIN_SCORE: 0.82,
  OPEN_MIN_SCORE: 0.48,
  OPEN_SLOTS: 3,
  CLOSE_SLOTS: 2,
} as const;

export function deltaE2000(x: Lab, y: Lab): number {
  const rad = Math.PI / 180;
  const L1 = x.l;
  const a1 = x.a;
  const b1 = x.b;
  const L2 = y.l;
  const a2 = y.a;
  const b2 = y.b;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = Cbar ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = h2p - h1p;
  if (C1p * C2p === 0) dhp = 0;
  else if (dhp > 180) dhp -= 360;
  else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) {
      hbarp += hbarp < 360 ? 360 : -360;
    }
    hbarp /= 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * rad) +
    0.24 * Math.cos(2 * hbarp * rad) +
    0.32 * Math.cos((3 * hbarp + 6) * rad) -
    0.2 * Math.cos((4 * hbarp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt(
    (dLp / Sl) ** 2 +
      (dCp / Sc) ** 2 +
      (dHp / Sh) ** 2 +
      Rt * (dCp / Sc) * (dHp / Sh),
  );
}

function hue(b: number, ap: number): number {
  if (b === 0 && ap === 0) return 0;
  const h = (Math.atan2(b, ap) * 180) / Math.PI;
  return h >= 0 ? h : h + 360;
}

function permutations(n: number): number[][] {
  const nums = Array.from({ length: n }, (_, i) => i);
  const out: number[][] = [];
  const walk = (used: boolean[], cur: number[]) => {
    if (cur.length === n) {
      out.push([...cur]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(i);
      walk(used, cur);
      cur.pop();
      used[i] = false;
    }
  };
  walk(Array(n).fill(false), []);
  return out;
}

export function paletteScore(
  a: PaletteColor[],
  b: PaletteColor[],
): { score: number; delta: number } {
  const n = Math.min(5, a.length, b.length);
  if (n === 0) return { score: 0, delta: 100 };

  const aa = a.slice(0, n);
  const bb = b.slice(0, n);
  const cost: number[][] = aa.map((ca) =>
    bb.map((cb) =>
      deltaE2000(
        { l: ca.l, a: ca.a, b: ca.lab_b },
        { l: cb.l, a: cb.a, b: cb.lab_b },
      ),
    ),
  );

  let best = Infinity;
  for (const perm of permutations(n)) {
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const w = (aa[i].ratio + bb[perm[i]].ratio) / 2;
      num += cost[i][perm[i]] * w;
      den += w;
    }
    const d = den === 0 ? 100 : num / den;
    if (d < best) best = d;
  }

  const score = 1 / (1 + best / 20);
  return { score, delta: best };
}

export function normalizePalette(raw: unknown): PaletteColor[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item as Record<string, number | string>;
    return {
      hex: String(o.hex ?? '#000000'),
      r: Number(o.r ?? 0),
      g: Number(o.g ?? 0),
      b: Number(o.b ?? 0),
      l: Number(o.l ?? 0),
      a: Number(o.a ?? 0),
      lab_b: Number(o.lab_b ?? o.labB ?? 0),
      ratio: Number(o.ratio ?? 0),
    };
  });
}
