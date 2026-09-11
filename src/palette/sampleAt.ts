import { loadBitmap, pixelAt, warmBitmap } from './bitmap';
import { rgbToHex, rgbToLab } from './lab';
import type { PaletteColor } from './types';

const SAMPLE_W = 320;

export function warmSample(uri: string) {
  warmBitmap(uri, SAMPLE_W);
}

export async function sampleAt(uri: string, nx: number, ny: number): Promise<PaletteColor | null> {
  const bmp = await loadBitmap(uri, SAMPLE_W);
  if (!bmp) return null;

  const px = pixelAt(bmp, nx, ny);
  const lab = rgbToLab(px.r, px.g, px.b);
  return {
    hex: rgbToHex(px.r, px.g, px.b),
    r: px.r,
    g: px.g,
    b: px.b,
    l: Math.round(lab.l * 100) / 100,
    a: Math.round(lab.a * 100) / 100,
    lab_b: Math.round(lab.b * 100) / 100,
    ratio: 0,
    x: nx,
    y: ny,
  };
}
