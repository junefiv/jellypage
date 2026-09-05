import { Platform } from 'react-native';

import { supabase } from './supabase';

export const IAP_PRODUCT_ID = process.env.EXPO_PUBLIC_IAP_PRODUCT_ID ?? 'dm_open_500';

type ExpoIap = typeof import('expo-iap');

async function loadIap(): Promise<ExpoIap | null> {
  try {
    return await import('expo-iap');
  } catch {
    return null;
  }
}

export async function purchaseDmUnlock(peerId: string): Promise<{ ok: boolean; error?: string }> {
  if (Platform.OS !== 'android') {
    return { ok: false, error: 'IOS_STUB' };
  }

  const iap = await loadIap();
  if (!iap) return { ok: false, error: 'IAP' };

  try {
    await iap.initConnection();
    await iap.fetchProducts({ skus: [IAP_PRODUCT_ID], type: 'in-app' });
    const result = await iap.requestPurchase({
      request: {
        google: { skus: [IAP_PRODUCT_ID] },
      },
      type: 'in-app',
    });

    const purchase = Array.isArray(result) ? result[0] : result;
    const token =
      (purchase as { purchaseToken?: string } | null)?.purchaseToken ??
      (purchase as { purchaseTokenAndroid?: string } | null)?.purchaseTokenAndroid;
    if (!token) return { ok: false, error: 'TOKEN' };

    const { data, error } = await supabase.functions.invoke('iap_google', {
      body: { purchase_token: token, peer_id: peerId },
    });
    if (error || (data as { error?: string } | null)?.error) {
      return { ok: false, error: (data as { error?: string })?.error ?? 'VERIFY' };
    }

    if (purchase) {
      await iap.finishTransaction({ purchase, isConsumable: true });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'IAP' };
  }
}

export async function restorePurchaseCheck(): Promise<{ paid: number }> {
  const { data, error } = await supabase
    .from('dm_unlocks')
    .select('id')
    .eq('status', 'paid');
  if (error) return { paid: 0 };
  return { paid: data?.length ?? 0 };
}
