import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { DraftTake } from '@/src/features/cam/draft';
import type { PaletteColor } from '@/src/palette/types';

export type LocalTake = {
  id: string;
  seq: number;
  capturedAt: string;
  city: string | null;
  palette: PaletteColor[];
  photoUri: string;
  source: DraftTake['source'];
  fail: boolean;
  remoteId: string | null;
  syncState: 'local' | 'syncing' | 'synced' | 'failed';
};

const root = new Directory(Paths.document, 'hexy-album');
const photos = new Directory(root, 'photos');
const index = new File(root, 'takes.json');

let mutation = Promise.resolve();

function ensureAlbum() {
  root.create({ idempotent: true, intermediates: true });
  photos.create({ idempotent: true, intermediates: true });
}

async function readIndex(): Promise<LocalTake[]> {
  ensureAlbum();
  if (!index.exists) return [];
  try {
    const parsed = JSON.parse(await index.text()) as LocalTake[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(takes: LocalTake[]) {
  ensureAlbum();
  if (!index.exists) index.create({ intermediates: true });
  index.write(JSON.stringify(takes));
}

function mutate<T>(task: () => Promise<T>): Promise<T> {
  const next = mutation.then(task, task);
  mutation = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function listLocalTakes(): Promise<LocalTake[]> {
  await mutation;
  return (await readIndex()).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function getLocalTake(id: string): Promise<LocalTake | null> {
  return (await listLocalTakes()).find((take) => take.id === id) ?? null;
}

export async function saveLocalTake(draft: DraftTake): Promise<LocalTake> {
  if (!draft.localUri) throw new Error('PHOTO');
  const localUri = draft.localUri;
  return mutate(async () => {
    const takes = await readIndex();
    const id = Crypto.randomUUID();
    const source = new File(localUri);
    const extension = source.extension || '.jpg';
    const destination = new File(photos, `${id}${extension}`);
    await source.copy(destination, { overwrite: true });

    const take: LocalTake = {
      id,
      seq: Math.max(0, ...takes.map((item) => item.seq)) + 1,
      capturedAt: draft.capturedAt,
      city: draft.city,
      palette: draft.palette,
      photoUri: destination.uri,
      source: draft.source,
      fail: draft.fail,
      remoteId: null,
      syncState: 'local',
    };
    writeIndex([take, ...takes]);
    return take;
  });
}

export async function updateLocalTake(
  id: string,
  patch: Partial<Pick<LocalTake, 'remoteId' | 'syncState'>>,
): Promise<void> {
  await mutate(async () => {
    const takes = await readIndex();
    writeIndex(takes.map((take) => (take.id === id ? { ...take, ...patch } : take)));
  });
}

export async function deleteLocalTake(id: string): Promise<void> {
  await mutate(async () => {
    const takes = await readIndex();
    const target = takes.find((take) => take.id === id);
    if (target) {
      const photo = new File(target.photoUri);
      if (photo.exists) photo.delete();
    }
    writeIndex(takes.filter((take) => take.id !== id));
  });
}
