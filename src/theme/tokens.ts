/** Pantone FHI TCX — hex literals show inline color chips in Cursor/VS Code */
export const pantone = {
  dancer: '#F0EEE9', // 11-4201 Cloud Dancer · rgb(240, 238, 233)
  nimbus: '#D5D5D8', // 13-4108 Nimbus Cloud · rgb(213, 213, 216)
  fusion: '#496275', // 18-4218 Blue Fusion · rgb(73, 98, 117)
} as const;

/** Pantone FHI TCX — accent chips */
export const chips = [
  pantone.dancer, // 11-4201 Cloud Dancer
  '#A767A2', // 17-3323 Iris Orchid · rgb(167, 103, 162)
  '#44BBCA', // 15-4722 Capri · rgb(68, 187, 202)
  '#BCCA25', // 14-0443 Kiwi Colada · rgb(188, 202, 37)
  '#DFEF87', // 12-0741 Sunny Lime · rgb(223, 239, 135)
  '#FF8D00', // 15-1164 Bright Marigold · rgb(255, 141, 0)
  '#E4455E', // 17-1755 Paradise Pink · rgb(228, 69, 94)
  '#FEE715', // 12-0643 Blazing Yellow · rgb(254, 231, 21)
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

/** Shell + buttons — pantone + chips only */
export const colors = {
  bg: pantone.fusion, // 18-4218 Blue Fusion
  fg: pantone.dancer, // 11-4201 Cloud Dancer
  muted: pantone.nimbus, // 13-4108 Nimbus Cloud
  line: pantone.nimbus,
  danger: chip.pink, // 17-1755 Paradise Pink
  paper: pantone.dancer,
  paperEdge: pantone.nimbus,
  ink: pantone.fusion,
  metalHi: pantone.nimbus,
  metal: pantone.fusion,
  metalLo: pantone.fusion,
  chrome: pantone.nimbus,
  jelly: pantone.dancer,
  jellyHi: pantone.dancer,
  jellyDim: 'rgba(240, 238, 233, 0.14)', // dancer
  jellyStroke: 'rgba(240, 238, 233, 0.42)', // dancer
  jellyGlow: 'rgba(240, 238, 233, 0.1)', // dancer
  btnOn: chip.kiwi, // 14-0443 Kiwi Colada · primary
  btnOff: pantone.nimbus,
  btnBack: pantone.nimbus,
  btnDanger: chip.pink,
  btnSave: chip.capri, // 15-4722 Capri
  btnMatch: chip.kiwi,
  btnDock: chip.capri,
} as const;

export type ButtonRole = 'primary' | 'secondary' | 'back' | 'danger' | 'save' | 'match';

export function buttonFill(role: ButtonRole) {
  const map: Record<ButtonRole, string> = {
    primary: colors.btnOn,
    secondary: colors.btnOff,
    back: colors.btnBack,
    danger: colors.btnDanger,
    save: colors.btnSave,
    match: colors.btnMatch,
  };
  return map[role];
}

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

function alertMix(hex: string, pct: number) {
  return `color-mix(in srgb, ${hex} ${pct}%, ${colors.bg})`;
}

function alertIcon(hex: string) {
  return `color-mix(in srgb, ${hex} 88%, #ffffff)`;
}

/** jelly-alert washes — info: Capri, danger: Paradise Pink */
export const alertTone = {
  info: {
    base: chip.capri,
    fill: alertMix(chip.capri, 18),
    border: alertMix(chip.capri, 42),
    icon: alertIcon(chip.capri),
  },
  danger: {
    base: chip.pink,
    fill: alertMix(chip.pink, 18),
    border: alertMix(chip.pink, 42),
    icon: alertIcon(chip.pink),
  },
} as const;

export type AlertKind = keyof typeof alertTone;

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
  return hexLum(hex) > 0.6 ? colors.ink : colors.jelly;
}

/** SAVE / MATCH fills. Shot palette when available; else semantic button colors. */
export function pickActionChips(palette?: { hex: string }[]) {
  const shot = (palette ?? []).map((c) => c.hex).filter((h) => h.startsWith('#'));
  if (shot.length >= 2) {
    return {
      back: shot[0],
      take: shot[1] === shot[0] ? colors.btnMatch : shot[1],
    };
  }
  if (shot.length === 1) {
    return { back: colors.btnSave, take: shot[0] };
  }
  return { back: colors.btnSave, take: colors.btnMatch };
}
