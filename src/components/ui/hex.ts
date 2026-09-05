export function shade(hex: string, amount: number) {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const k = 1 - amount;
  return `rgb(${Math.round(rgb.r * k)},${Math.round(rgb.g * k)},${Math.round(rgb.b * k)})`;
}

export function parseHex(hex: string) {
  const raw = hex.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (n.length !== 6) return null;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

export function hexAlpha(hex: string, a: number) {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(216,216,216,${a})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

export function liftGlow(hex: string) {
  const rgb = parseHex(hex);
  if (!rgb) return '#D8D8D8';
  const lum = (rgb.r * 0.22 + rgb.g * 0.7 + rgb.b * 0.08) / 255;
  if (lum >= 0.45) return hex;
  const t = 0.55;
  const r = Math.round(rgb.r + (216 - rgb.r) * t);
  const g = Math.round(rgb.g + (216 - rgb.g) * t);
  const b = Math.round(rgb.b + (216 - rgb.b) * t);
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function toByte(n: number) {
  return n.toString(16).padStart(2, '0');
}
