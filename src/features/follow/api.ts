import { supabase } from '@/src/lib/supabase';

export async function isFollowing(followeeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('followee_id', followeeId)
    .maybeSingle();
  return Boolean(data);
}

export async function follow(followeeId: string) {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) throw new Error('AUTH');
  const { error } = await supabase.from('follows').insert({
    follower_id: uid,
    followee_id: followeeId,
  });
  if (error) throw error;
}

export async function unfollow(followeeId: string) {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) throw new Error('AUTH');
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', uid)
    .eq('followee_id', followeeId);
  if (error) throw error;
}

export async function listFollowing() {
  const { data, error } = await supabase
    .from('follows')
    .select('followee_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listBlocks() {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function blockUser(id: string) {
  const { error } = await supabase.rpc('block_user', { p_blocked_id: id });
  if (error) throw error;
}
