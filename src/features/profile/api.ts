import type { Profile, TakePublic } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('handle', handle).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function listPublicTakes(ownerId: string): Promise<TakePublic[]> {
  const { data, error } = await supabase
    .from('takes_public')
    .select('*')
    .eq('owner_id', ownerId)
    .order('captured_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TakePublic[];
}

export async function updateDefaultMatchPublic(value: boolean) {
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id;
  if (!uid) throw new Error('AUTH');
  const { error } = await supabase.from('profiles').update({ default_match_public: value }).eq('id', uid);
  if (error) throw error;
}
