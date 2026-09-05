import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.109.0';

const PRODUCT_ID = 'dm_open_500';
const PACKAGE_NAME = Deno.env.get('ANDROID_PACKAGE') ?? 'com.hexy.app';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  if (req.method === 'POST' && isRtdn(req)) {
    return handleRtdn(req, supabase);
  }

  if (req.method !== 'POST') {
    return json({ error: 'METHOD' }, 405);
  }

  const auth = req.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: auth } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'AUTH' }, 401);

  const body = await req.json().catch(() => ({}));
  const purchaseToken = String(body.purchase_token ?? '');
  const peerId = String(body.peer_id ?? '');
  if (!purchaseToken || !peerId) return json({ error: 'INPUT' }, 400);

  const verified = await verifyPlayPurchase(purchaseToken);
  if (!verified.ok) return json({ error: verified.error }, 402);

  const { error: evErr } = await supabase.from('iap_events').upsert(
    {
      store: 'google',
      store_tx_id: purchaseToken,
      payload: verified.payload,
      processed_at: new Date().toISOString(),
    },
    { onConflict: 'store_tx_id' },
  );
  if (evErr) return json({ error: 'EVENT' }, 500);

  const { error: unlockErr } = await supabase.from('dm_unlocks').upsert(
    {
      payer_id: userData.user.id,
      peer_id: peerId,
      amount_krw: 500,
      store: 'google',
      product_id: PRODUCT_ID,
      store_tx_id: purchaseToken,
      status: 'paid',
    },
    { onConflict: 'store_tx_id' },
  );
  if (unlockErr) return json({ error: 'UNLOCK' }, 500);

  return json({ ok: true });
});

function isRtdn(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get('type') === 'rtdn' || req.headers.get('x-goog-rtdn') === '1';
}

async function handleRtdn(req: Request, supabase: ReturnType<typeof createClient>) {
  const payload = await req.json().catch(() => ({}));
  const token =
    payload?.message?.data
      ? JSON.parse(atob(payload.message.data))?.oneTimeProductNotification?.purchaseToken
      : payload?.purchaseToken;
  if (!token) return json({ ok: true, skipped: true });

  await supabase
    .from('dm_unlocks')
    .update({ status: 'refunded' })
    .eq('store', 'google')
    .eq('store_tx_id', token)
    .eq('status', 'paid');

  await supabase.from('iap_events').upsert(
    {
      store: 'google',
      store_tx_id: `rtdn:${token}`,
      payload,
      processed_at: new Date().toISOString(),
    },
    { onConflict: 'store_tx_id' },
  );

  return json({ ok: true });
}

async function verifyPlayPurchase(token: string) {
  const email = Deno.env.get('GOOGLE_PLAY_CLIENT_EMAIL');
  const key = Deno.env.get('GOOGLE_PLAY_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  if (!email || !key) {
    return { ok: false as const, error: 'PLAY_CONFIG', payload: {} };
  }

  try {
    const access = await googleAccessToken(email, key);
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
      `${PACKAGE_NAME}/purchases/products/${PRODUCT_ID}/tokens/${encodeURIComponent(token)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
    const payload = await res.json();
    if (!res.ok) return { ok: false as const, error: 'PLAY_VERIFY', payload };
    if (payload.purchaseState !== 0) {
      return { ok: false as const, error: 'PLAY_STATE', payload };
    }
    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, error: 'PLAY_VERIFY', payload: {} };
  }
}

async function googleAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBuf(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) throw new Error('TOKEN');
  return tokenJson.access_token as string;
}

function pemToBuf(pem: string) {
  const b64 = pem.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function b64url(input: string | ArrayBuffer) {
  const str =
    typeof input === 'string'
      ? btoa(input)
      : btoa(String.fromCharCode(...new Uint8Array(input)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
