import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { useSession } from '@/src/features/auth/session';
import { useDraft } from '@/src/features/cam/draft';
import { persistTake } from '@/src/features/take/api';
import { formatTake } from '@/src/lib/format';
import { copy } from '@/src/theme/tokens';

export default function TakePreview() {
  const draft = useDraft((s) => s.draft);
  const setDraft = useDraft((s) => s.setDraft);
  const session = useSession((s) => s.session);
  const [seq, setSeq] = useState(0);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const started = useRef(false);
  const awaitingAuth = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSeq((n) => (n >= 1 ? n : n + 1));
    }, 80);
    return () => clearInterval(t);
  }, []);

  async function persist() {
    if (!draft || started.current) return;
    if (!session) {
      awaitingAuth.current = true;
      router.push('/(auth)');
      return;
    }
    started.current = true;
    setBusy(true);
    try {
      const take = await persistTake(draft);
      router.replace(`/take/${take.id}`);
    } catch (e) {
      started.current = false;
      setErr(e instanceof Error ? e.message : 'TAKE');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (session && awaitingAuth.current && draft && !draft.fail) {
      awaitingAuth.current = false;
      void persist();
    }
    // persist after auth only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, draft?.capturedAt]);

  function discard() {
    setDraft(null);
    router.replace('/(tabs)/cam');
  }

  if (!draft) {
    return (
      <Screen>
        <View style={{ padding: 24 }}>
          <Tap label={copy.cam} onPress={() => router.replace('/(tabs)/cam')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView scrollEnabled={!drag} contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tap label={copy.back} onPress={discard} />
          <MonoText size={20}>{seq ? formatTake(seq) : 'TAKE ----'}</MonoText>
        </View>
        <TakeFrame
          photoUri={draft.localUri}
          capturedAt={draft.capturedAt}
          geo={draft.city}
          palette={draft.palette}
          onPaletteChange={(palette) => setDraft({ ...draft, palette })}
          onDragChange={setDrag}
        />
        {draft.fail ? <MonoText danger>{copy.paletteFail}</MonoText> : null}
        <Tap
          label={busy ? '…' : copy.take}
          onPress={() => void persist()}
          style={{ alignItems: 'center' }}
        />
        {err ? <MonoText danger>{err}</MonoText> : null}
      </ScrollView>
    </Screen>
  );
}
