import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.109.0';
import {
  MATCH,
  normalizePalette,
  paletteScore,
} from '../_shared/color.ts';

type Candidate = {
  id: string;
  owner_id: string;
  palette: unknown;
  l2: number;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'METHOD' }, 405);
  }

  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: auth } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: 'AUTH' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const takeId = String(body.take_id ?? '');
  if (!takeId) return json({ error: 'TAKE' }, 400);

  const { data: source, error: srcErr } = await supabase
    .from('takes')
    .select('id, owner_id, palette, status')
    .eq('id', takeId)
    .maybeSingle();

  if (srcErr || !source || source.owner_id !== userData.user.id) {
    return json({ error: 'TAKE' }, 404);
  }

  await supabase
    .from('takes')
    .update({ match_status: 'pending' })
    .eq('id', takeId);

  const { data: candidates, error: candErr } = await supabase.rpc(
    'match_take_candidates',
    { p_take_id: takeId, p_limit: MATCH.CANDIDATE_LIMIT },
  );

  if (candErr) {
    await supabase.from('takes').update({ match_status: 'failed' }).eq('id', takeId);
    return json({ error: 'CANDIDATES' }, 500);
  }

  const srcPalette = normalizePalette(source.palette);
  const scored = ((candidates ?? []) as Candidate[])
    .map((c) => {
      const { score, delta } = paletteScore(srcPalette, normalizePalette(c.palette));
      return { ...c, score, delta };
    })
    .sort((a, b) => b.score - a.score);

  const close: typeof scored = [];
  const closeOwners = new Set<string>();
  for (const row of scored) {
    if (close.length >= MATCH.CLOSE_SLOTS) break;
    if (row.score < MATCH.CLOSE_MIN_SCORE) continue;
    if (closeOwners.has(row.owner_id)) continue;
    close.push(row);
    closeOwners.add(row.owner_id);
  }

  const open: typeof scored = [];
  const openOwners = new Set<string>();
  for (const row of scored) {
    if (open.length >= MATCH.OPEN_SLOTS) break;
    if (row.score < MATCH.OPEN_MIN_SCORE || row.score >= MATCH.CLOSE_MIN_SCORE) continue;
    if (closeOwners.has(row.owner_id) || openOwners.has(row.owner_id)) continue;
    open.push(row);
    openOwners.add(row.owner_id);
  }

  await supabase.from('take_matches').delete().eq('source_take_id', takeId);

  const rows = [
    ...open.map((row, i) => ({
      source_take_id: takeId,
      target_take_id: row.id,
      band: 'open',
      rank: i + 1,
      score: row.score,
      delta: row.delta,
    })),
    ...close.map((row, i) => ({
      source_take_id: takeId,
      target_take_id: row.id,
      band: 'close',
      rank: 4 + i,
      score: row.score,
      delta: row.delta,
    })),
  ];

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('take_matches').insert(rows);
    if (insErr) {
      await supabase.from('takes').update({ match_status: 'failed' }).eq('id', takeId);
      return json({ error: 'WRITE' }, 500);
    }
  }

  const matchStatus = rows.length === 0 ? 'empty' : 'ready';
  await supabase.from('takes').update({ match_status: matchStatus }).eq('id', takeId);

  return json({ status: matchStatus, count: rows.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
