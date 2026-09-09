import { queryClient } from '@/src/lib/query';

import type { DraftTake } from '../cam/draft';
import { persistTake } from './api';
import { listLocalTakes, updateLocalTake } from './local-album';

let activeSync: Promise<void> | null = null;
let rerunRequested = false;

export function syncLocalAlbum(): Promise<void> {
  if (activeSync) {
    rerunRequested = true;
    return activeSync;
  }
  activeSync = drainSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

async function drainSync() {
  do {
    rerunRequested = false;
    await runSync();
  } while (rerunRequested);
}

async function runSync() {
  const pending = (await listLocalTakes()).filter((take) => !take.remoteId && !take.fail);
  for (const local of pending) {
    await updateLocalTake(local.id, { syncState: 'syncing' });
    try {
      const draft: DraftTake = {
        localUri: local.photoUri,
        palette: local.palette,
        city: local.city,
        capturedAt: local.capturedAt,
        source: local.source,
        fail: local.fail,
      };
      const remote = await persistTake(draft, { runMatch: false });
      await updateLocalTake(local.id, { remoteId: remote.id, syncState: 'synced' });
    } catch {
      await updateLocalTake(local.id, { syncState: 'failed' });
    }
  }
  await queryClient.invalidateQueries({ queryKey: ['local-takes'] });
  await queryClient.invalidateQueries({ queryKey: ['local-take'] });
  await queryClient.invalidateQueries({ queryKey: ['takes'] });
}
