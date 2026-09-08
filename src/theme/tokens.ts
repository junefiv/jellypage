export const colors = {
  bg: '#0B0B0B',
  fg: '#E8E8E8',
  muted: '#6B6B6B',
  line: '#1C1C1C',
  danger: '#C45C5C',
  paper: '#F3EFE6',
  paperEdge: '#E2DCD0',
  ink: '#1A1A1A',
  metalHi: '#5A5A5A',
  metal: '#2A2A2A',
  metalLo: '#101010',
  chrome: '#C8C8C8',
  jelly: '#F4F4F6',
  jellyHi: '#FAFAFC',
  jellyDim: 'rgba(255,255,255,0.14)',
  jellyStroke: 'rgba(255,255,255,0.42)',
  jellyGlow: 'rgba(255,255,255,0.1)',
} as const;

export const copy = {
  take: 'TAKE',
  match5: 'MATCH 5',
  openClose: '3 OPEN · 2 CLOSE',
  lock: 'LOCK',
  unlockSoon: 'UNLOCK SOON',
  deleteTake: 'DELETE TAKE',
  firstDm: 'FIRST DM  ₩500',
  noMatch: 'NO MATCH',
  paletteFail: 'PALETTE FAIL',
  copyPalette: 'COPY PALETTE',
  follow: 'FOLLOW',
  following: 'FOLLOWING',
  dm: 'DM',
  retry: 'RETRY',
  saveRaw: 'SAVE RAW',
  del: 'DEL',
  cam: 'CAM',
  back: 'BACK',
  takeSeg: 'TAKE',
  matchSeg: 'MATCH',
  closeMatch: 'CLOSE MATCH',
} as const;

export const font = {
  mono: 'SpaceMono',
} as const;

/** Pantone FHI TCX screen hex */
export const chips = [
  '#F0EEE9', // 11-4201 Cloud Dancer
  '#A767A2', // 17-3323 Iris Orchid
  '#44BBCA', // 15-4722 Capri
  '#BCCA25', // 14-0443 Kiwi Colada
  '#DFEF87', // 12-0741 Sunny Lime
  '#FF8D00', // 15-1164 Bright Marigold
  '#E4455E', // 17-1755 Paradise Pink
  '#FEE715', // 12-0643 Blazing Yellow
] as const;

export const chip = {
  dancer: chips[0],
  orchid: chips[1],
  capri: chips[2],
  kiwi: chips[3],
  lime: chips[4],
  marigold: chips[5],
  pink: chips[6],
  yellow: chips[7],
} as const;

export function nextChip(prev?: string) {
  const pool = prev ? chips.filter((hex) => hex !== prev) : chips;
  return pool[Math.floor(Math.random() * pool.length)] ?? chips[0];
}

function hexLum(hex: string) {
  const n = hex.replace('#', '');
  if (n.length < 6) return 0.5;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Label on a chip fill — ink on light, paper on dark. */
export function inkOn(hex: string) {
  return hexLum(hex) > 0.6 ? '#1A1A1A' : '#F4F4F6';
}

/** Two distinct chips. Prefer the shot palette; else same random pool as CAM. */
export function pickActionChips(palette?: { hex: string }[]) {
  const shot = (palette ?? []).map((c) => c.hex).filter((h) => h.startsWith('#'));
  if (shot.length >= 2) {
    return { back: shot[0], take: shot[1] === shot[0] ? nextChip(shot[0]) : shot[1] };
  }
  if (shot.length === 1) {
    return { back: nextChip(shot[0]), take: shot[0] };
  }
  const take = nextChip();
  return { back: nextChip(take), take };
}
