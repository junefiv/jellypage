export function formatTake(seq: number | null | undefined): string {
  if (seq == null || seq < 0) return 'TAKE ----';
  if (seq < 10000) return `TAKE ${String(seq).padStart(4, '0')}`;
  return `TAKE ${seq}`;
}

export function formatGeo(lat: number, lng: number): string {
  return `${lat.toFixed(4)}  ${lng.toFixed(4)}`;
}

export function formatDelta(delta: number): string {
  return `Δ ${delta.toFixed(2)}`;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

export function formatDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}.${mm}.${dd}`;
}

export function blurPublicUrl(path: string | null | undefined, baseUrl: string): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${baseUrl}/storage/v1/object/public/takes-blur/${path}`;
}
