import type { CanSend, DmMessage, Profile } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

export async function canSend(peerId: string): Promise<CanSend> {
  const { data, error } = await supabase.rpc('can_send', { p_peer_id: peerId });
  if (error) throw error;
  return data as CanSend;
}

export async function openThread(peerId: string): Promise<string> {
  const { data, error } = await supabase.rpc('open_or_get_thread', { p_peer_id: peerId });
  if (error || !data) throw error ?? new Error('THREAD');
  return data as string;
}

export async function sendDm(peerId: string, body: string, attachedTakeId?: string | null) {
  const { data, error } = await supabase.rpc('send_dm', {
    p_peer_id: peerId,
    p_body: body,
    p_attached_take_id: attachedTakeId ?? null,
  });
  if (error) throw error;
  return data as DmMessage;
}

export async function listThreads() {
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id;
  if (!uid) return [];

  const { data: threads, error } = await supabase
    .from('dm_threads')
    .select('*')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .order('opened_at', { ascending: false });
  if (error) throw error;

  const ids = (threads ?? []).flatMap((t) => [t.user_a as string, t.user_b as string]);
  const unique = [...new Set(ids)].filter((id) => id !== uid);
  const { data: profiles } = unique.length
    ? await supabase.from('profiles').select('id, handle').in('id', unique)
    : { data: [] as Profile[] };
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));

  const out = [];
  for (const th of threads ?? []) {
    const peerId = th.user_a === uid ? th.user_b : th.user_a;
    const { data: last } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('thread_id', th.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const gate = await canSend(peerId as string);
    out.push({
      id: th.id as string,
      peerId: peerId as string,
      handle: map.get(peerId as string)?.handle ?? 'user',
      last: (last?.body as string) ?? '',
      unpaid: gate.reason === 'needs_unlock',
      open: gate.ok,
    });
  }
  return out;
}

export async function listMessages(threadId: string): Promise<DmMessage[]> {
  const { data, error } = await supabase
    .from('dm_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DmMessage[];
}

export function subscribeMessages(threadId: string, onInsert: (msg: DmMessage) => void) {
  return supabase
    .channel(`dm:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${threadId}` },
      (payload) => onInsert(payload.new as DmMessage),
    )
    .subscribe();
}
