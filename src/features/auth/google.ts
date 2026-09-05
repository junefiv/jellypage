import { supabase } from '@/src/lib/supabase';

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) return { ok: false, error: 'GOOGLE' };
    GoogleSignin.configure({ webClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const idToken =
      'data' in result
        ? (result.data as { idToken?: string } | null)?.idToken
        : (result as { idToken?: string }).idToken;
    if (!idToken) return { ok: false, error: 'TOKEN' };
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'GOOGLE' };
  }
}
