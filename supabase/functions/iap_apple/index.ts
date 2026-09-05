// iOS IAP stub. 1st store is Google Play. Same contract as iap_google.
Deno.serve(() =>
  new Response(JSON.stringify({ error: 'IOS_STUB', store: 'apple' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  }),
);
