import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { useSession } from '@/src/features/auth/session';
import { useDraft } from '@/src/features/cam/draft';
import { persistTake } from '@/src/features/take/api';
import { formatTake } from '@/src/lib/format';
import { chip, copy, pickActionChips } from '@/src/theme/tokens';

const PAD = 16;
const GAP = 10;
const PAINT_H = 136;

export default function TakePreview() {
  const draft = useDraft((s) => s.draft);
  const setDraft = useDraft((s) => s.setDraft);
  const session = useSession((s) => s.session);
  const { width } = useWindowDimensions();
  const [seq, setSeq] = useState(0);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const started = useRef(false);
  const awaitingAuth = useRef(false);
  const paintW = Math.floor((width - PAD * 2 - GAP) / 2);
  const tones = useMemo(() => pickActionChips(draft?.palette), [draft?.capturedAt]);

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
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', paddingBottom: 12 }}>
            <MonoText size={20} style={{ color: tones.take }}>
              {seq ? formatTake(seq) : 'TAKE ----'}
            </MonoText>
          </View>
          <TakeFrame
            photoUri={draft.localUri}
            capturedAt={draft.capturedAt}
            geo={draft.city}
            palette={draft.palette}
            onPaletteChange={(palette) => setDraft({ ...draft, palette })}
            onDragChange={setDrag}
          />
          {draft.fail ? (
            <View style={{ paddingHorizontal: 28, paddingTop: 10 }}>
              <MonoText style={{ color: chip.pink }}>{copy.paletteFail}</MonoText>
            </View>
          ) : null}
        </View>
        {err ? (
          <View style={{ paddingHorizontal: PAD, paddingBottom: 6 }}>
            <MonoText style={{ color: chip.pink }}>{err}</MonoText>
          </View>
        ) : null}
        <View
          style={{
            zIndex: 20,
            elevation: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: PAD,
            paddingTop: 8,
            paddingBottom: 18,
            gap: GAP,
          }}
        >
          <Tap
            label={copy.back}
            fill={tones.back}
            size="md"
            box={{ w: paintW, h: PAINT_H }}
            onPress={discard}
          />
          <Tap
            label={busy ? '…' : copy.take}
            fill={tones.take}
            size="md"
            box={{ w: paintW, h: PAINT_H }}
            onPress={() => void persist()}
          />
        </View>
      </View>
    </Screen>
  );
}
