import type { Take, TakePublic } from '@/src/lib/database.types';
import { queryClient } from '@/src/lib/query';
import { supabase, supabaseUrl } from '@/src/lib/supabase';
import type { MatchRow } from '@/src/match/types';
import { makeBlurThumb, makeUploadOriginal } from '@/src/palette/blur';
import { toVec } from '@/src/palette/extract';
import type { PaletteColor } from '@/src/palette/types';

import type { DraftTake } from '../cam/draft';

export async function persistTake(draft: DraftTake): Promise<Take> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('AUTH');

  const { data: seq, error: seqErr } = await supabase.rpc('next_take_seq');
  if (seqErr) throw seqErr;

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_match_public')
    .eq('id', uid)
    .maybeSingle();

  const ready = draft.palette.length >= 5;
  const { data, error } = await supabase
    .from('takes')
    .insert({
      owner_id: uid,
      seq,
      captured_at: draft.capturedAt,
      city: draft.city,
      palette: draft.palette,
      palette_vec: ready ? toVec(draft.palette) : null,
      match_public: draft.source !== 'raw' && ready && (profile?.default_match_public ?? true),
      source: draft.source,
      status: 'processing',
      match_status: ready ? 'pending' : 'idle',
    })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('TAKE');

  const take = data as Take;
  void uploadAndMatch(take, draft.localUri);
  return take;
}

async function uploadAndMatch(take: Take, localUri: string | null) {
  try {
    let originalPath: string | null = null;
    let blurPath: string | null = null;

    if (localUri && take.source !== 'palette_copy' && take.source !== 'raw') {
      const originalUri = await makeUploadOriginal(localUri);
      const blurUri = await makeBlurThumb(localUri);
      originalPath = `${take.owner_id}/${take.id}/original.jpg`;
      blurPath = `${take.owner_id}/${take.id}/blur.jpg`;
      await uploadFile('takes-original', originalPath, originalUri);
      await uploadFile('takes-blur', blurPath, blurUri);
    } else if (localUri && take.source === 'raw') {
      const originalUri = await makeUploadOriginal(localUri);
      originalPath = `${take.owner_id}/${take.id}/original.jpg`;
      await uploadFile('takes-original', originalPath, originalUri);
    }

    await supabase
      .from('takes')
      .update({
        original_path: originalPath,
        blur_path: blurPath,
        status: take.source === 'raw' ? 'failed' : 'ready',
      })
      .eq('id', take.id);

    if (take.source !== 'raw' && take.palette.length >= 5) {
      await supabase.functions.invoke('match_take', { body: { take_id: take.id } });
    }
    await queryClient.invalidateQueries({ queryKey: ['takes'] });
    await queryClient.invalidateQueries({ queryKey: ['matches', take.id] });
  } catch {
    await supabase.from('takes').update({ status: 'failed', match_status: 'failed' }).eq('id', take.id);
  }
}

async function uploadFile(bucket: string, path: string, uri: string) {
  const res = await fetch(uri);
  const blob = await res.blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
}

export async function listMyTakes(query?: string): Promise<Take[]> {
  let q = supabase
    .from('takes')
    .select('*')
    .neq('status', 'deleted')
    .order('captured_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as Take[];
  if (query) {
    const qn = query.trim().toUpperCase();
    rows = rows.filter((t) => {
      const date = t.captured_at.slice(0, 10);
      const hex = t.palette.map((c) => c.hex).join(' ');
      return date.includes(qn) || hex.includes(qn) || String(t.seq).includes(qn);
    });
  }
  return rows;
}

export async function getMyTake(id: string): Promise<Take | null> {
  const { data } = await supabase.from('takes').select('*').eq('id', id).maybeSingle();
  return (data as Take | null) ?? null;
}

export async function deleteTake(id: string, ownerId: string) {
  const take = await getMyTake(id);
  if (take?.original_path) {
    await supabase.storage.from('takes-original').remove([take.original_path]);
  }
  if (take?.blur_path) {
    await supabase.storage.from('takes-blur').remove([take.blur_path]);
  }
  const { error } = await supabase.rpc('delete_take', { p_take_id: id });
  if (error) throw error;
  void ownerId;
}

export async function updateTakePalette(id: string, palette: PaletteColor[]) {
  const ready = palette.length >= 5;
  const { error } = await supabase
    .from('takes')
    .update({
      palette,
      palette_vec: ready ? toVec(palette) : null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setTakePublic(id: string, matchPublic: boolean) {
  const { error } = await supabase.from('takes').update({ match_public: matchPublic }).eq('id', id);
  if (error) throw error;
}

export async function copyPalette(takeId: string): Promise<Take> {
  const { data, error } = await supabase.rpc('copy_palette', { p_take_id: takeId });
  if (error || !data) throw error ?? new Error('COPY');
  const take = data as Take;
  void supabase.functions.invoke('match_take', { body: { take_id: take.id } });
  return take;
}

export async function listMatches(takeId: string): Promise<MatchRow[]> {
  const { data: rows, error } = await supabase
    .from('take_matches')
    .select('*')
    .eq('source_take_id', takeId)
    .order('rank', { ascending: true });
  if (error) throw error;

  const byRank = new Map((rows ?? []).map((r) => [r.rank as number, r]));
  const targetIds = (rows ?? []).map((r) => r.target_take_id as string);
  let publics: TakePublic[] = [];
  if (targetIds.length) {
    const { data } = await supabase.from('takes_public').select('*').in('id', targetIds);
    publics = (data ?? []) as TakePublic[];
  }
  const pubMap = new Map(publics.map((t) => [t.id, t]));

  const slots: MatchRow[] = [];
  for (let rank = 1; rank <= 5; rank++) {
    const row = byRank.get(rank);
    const band = rank <= 3 ? 'open' : 'close';
    if (!row) {
      slots.push({ rank, band, score: 0, delta: 0, target: null });
      continue;
    }
    const target = pubMap.get(row.target_take_id as string) ?? null;
    slots.push({
      rank,
      band: row.band as 'open' | 'close',
      score: row.score as number,
      delta: row.delta as number,
      target: target
        ? {
            id: target.id,
            owner_id: target.owner_id,
            handle: target.handle,
            city: target.city,
            captured_at: target.captured_at,
            palette: target.palette as PaletteColor[],
            blur_path: target.blur_path,
          }
        : null,
    });
  }
  return slots;
}

export async function originalSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from('takes-original').createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export function publicBlur(path: string | null): string | null {
  if (!path) return null;
  return `${supabaseUrl()}/storage/v1/object/public/takes-blur/${path}`;
}
