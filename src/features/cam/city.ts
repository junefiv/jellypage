import * as Location from 'expo-location';

import { formatGeo } from '@/src/lib/format';

const TTL_MS = 30 * 60 * 1000;

let cached: { geo: string | null; at: number } | null = null;
let warming: Promise<string | null> | null = null;

export function peekCity(): string | null {
  return cached?.geo ?? null;
}

export async function resolveCity(): Promise<string | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.geo;
  return warmCity();
}

export function warmCity(): Promise<string | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(cached.geo);
  if (warming) return warming;
  warming = refreshGeo().finally(() => {
    warming = null;
  });
  return warming;
}

async function refreshGeo(): Promise<string | null> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      perm = await Location.requestForegroundPermissionsAsync();
    }
    if (perm.status !== 'granted') return cached?.geo ?? null;

    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      cached = {
        geo: formatGeo(last.coords.latitude, last.coords.longitude),
        at: Date.now(),
      };
    }

    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest })
      .then((pos) => {
        cached = {
          geo: formatGeo(pos.coords.latitude, pos.coords.longitude),
          at: Date.now(),
        };
      })
      .catch(() => {});

    return cached?.geo ?? null;
  } catch {
    return cached?.geo ?? null;
  }
}
