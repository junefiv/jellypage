import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import { rgbToHex, rgbToLab } from './lab';
import type { PaletteColor } from './types';

type Bitmap = { w: number; h: number; data: Uint8Array };

const cache = new Map<string, Promise<Bitmap | null>>();

export function warmSample(uri: string) {
  void loadBitmap(uri);
}

async function loadBitmap(uri: string): Promise<Bitmap | null> {
  const hit = cache.get(uri);
  if (hit) return hit;
  const next = (async () => {
    try {
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 160 } }],
        { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!resized.base64) return null;
      const decoded = jpeg.decode(Buffer.from(resized.base64, 'base64'), { useTArray: true });
      return { w: decoded.width, h: decoded.height, data: decoded.data };
    } catch {
      return null;
    }
  })();
  cache.set(uri, next);
  return next;
}

export async function sampleAt(uri: string, nx: number, ny: number): Promise<PaletteColor | null> {
  const bmp = await loadBitmap(uri);
  if (!bmp) return null;
  const x = clamp(Math.round(nx * (bmp.w - 1)), 0, bmp.w - 1);
  const y = clamp(Math.round(ny * (bmp.h - 1)), 0, bmp.h - 1);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const px = clamp(x + dx, 0, bmp.w - 1);
      const py = clamp(y + dy, 0, bmp.h - 1);
      const i = (py * bmp.w + px) * 4;
      r += bmp.data[i];
      g += bmp.data[i + 1];
      b += bmp.data[i + 2];
      n += 1;
    }
  }
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  const lab = rgbToLab(r, g, b);
  return {
    hex: rgbToHex(r, g, b),
    r,
    g,
    b,
    l: Math.round(lab.l * 100) / 100,
    a: Math.round(lab.a * 100) / 100,
    lab_b: Math.round(lab.b * 100) / 100,
    ratio: 0,
    x: nx,
    y: ny,
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
