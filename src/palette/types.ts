export type PaletteColor = {
  hex: string;
  r: number;
  g: number;
  b: number;
  l: number;
  a: number;
  lab_b: number;
  ratio: number;
  x?: number;
  y?: number;
};

export type ExtractResult =
  | { ok: true; colors: PaletteColor[]; vec: number[] }
  | { ok: false; reason: 'PALETTE FAIL'; colors: PaletteColor[] };
