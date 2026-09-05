import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/src/components/ui/Field';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { signInWithGoogle } from '@/src/features/auth/google';
import { useSession } from '@/src/features/auth/session';
import { persistTake } from '@/src/features/take/api';
import { useDraft } from '@/src/features/cam/draft';
import { supabase } from '@/src/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const refreshProfile = useSession((s) => s.refreshProfile);
  const draft = useDraft((s) => s.draft);

  async function afterAuth() {
    await refreshProfile();
    if (draft) {
      const take = await persistTake(draft);
      router.replace(`/take/${take.id}`);
      return;
    }
    router.replace('/(tabs)/cam');
  }

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
        <MonoText size={18}>AUTH</MonoText>
        <Tap
          label="GOOGLE"
          onPress={async () => {
            const res = await signInWithGoogle();
            if (!res.ok) {
              setNote(res.error ?? 'GOOGLE');
              return;
            }
            await afterAuth();
          }}
        />
        <Field
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="EMAIL"
        />
        <Tap
          label="MAGIC LINK"
          onPress={async () => {
            const { error } = await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: 'hexy://auth' },
            });
            setNote(error ? error.message : 'SENT');
          }}
        />
        {note ? <MonoText dim>{note}</MonoText> : null}
      </View>
    </Screen>
  );
}
