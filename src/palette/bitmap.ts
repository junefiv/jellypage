import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

export type Bitmap = { w: number; h: number; data: Uint8Array };

const cache = new Map<string, Promise<Bitmap | null>>();

export function warmBitmap(uri: string, width = 320) {
  void loadBitmap(uri, width);
}

export async function loadBitmap(uri: string, width = 320): Promise<Bitmap | null> {
  const key = `${uri}|${width}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const next = decodeBitmap(uri, width);
  cache.set(key, next);
  return next;
}

async function decodeBitmap(uri: string, width: number): Promise<Bitmap | null> {
  try {
    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (!resized.base64) return null;
    const decoded = jpeg.decode(Buffer.from(resized.base64, 'base64'), { useTArray: true });
    return { w: decoded.width, h: decoded.height, data: decoded.data };
  } catch {
    return null;
  }
}

export function pixelAt(bmp: Bitmap, nx: number, ny: number) {
  const x = clamp(Math.round(nx * (bmp.w - 1)), 0, bmp.w - 1);
  const y = clamp(Math.round(ny * (bmp.h - 1)), 0, bmp.h - 1);
  const i = (y * bmp.w + x) * 4;
  return {
    x,
    y,
    r: bmp.data[i],
    g: bmp.data[i + 1],
    b: bmp.data[i + 2],
    nx: (x + 0.5) / bmp.w,
    ny: (y + 0.5) / bmp.h,
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
