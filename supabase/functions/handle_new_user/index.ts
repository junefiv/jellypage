import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.109.0';

// Backup if the auth.users trigger did not fire. Primary path is SQL trigger.
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'METHOD' }), { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const body = await req.json().catch(() => ({}));
  const userId = String(body.user_id ?? '');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'USER' }), { status: 400 });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ ok: true, existed: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (let i = 0; i < 8; i++) {
    const handle = `user${crypto.randomUUID().replace(/-/g, '').slice(0, 6)}`;
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      handle,
      display_name: handle,
    });
    if (!error) {
      await supabase.from('user_counters').upsert({ user_id: userId, take_seq: 0 });
      return new Response(JSON.stringify({ ok: true, handle }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'HANDLE' }), { status: 500 });
});
