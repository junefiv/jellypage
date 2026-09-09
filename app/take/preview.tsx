import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { JellyActionPair } from '@/src/components/ui/JellyActionPair';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { useSession } from '@/src/features/auth/session';
import { useDraft } from '@/src/features/cam/draft';
import { persistTake } from '@/src/features/take/api';
import { saveLocalTake } from '@/src/features/take/local-album';
import { syncLocalAlbum } from '@/src/features/take/sync-local-album';
import { formatTake } from '@/src/lib/format';
import { queryClient } from '@/src/lib/query';
import { chip, copy, pickActionChips } from '@/src/theme/tokens';

const PAD = 30;
const GAP = 1;
const PAINT_H = 140;
const ACTION_LIFT = 0;

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

  async function save() {
    if (!draft || started.current) return;
    started.current = true;
    setBusy(true);
    setErr('');
    try {
      await saveLocalTake(draft);
      await queryClient.invalidateQueries({ queryKey: ['local-takes'] });
      setDraft(null);
      if (session) void syncLocalAlbum();
      router.replace('/(tabs)/log');
    } catch (e) {
      started.current = false;
      setErr(e instanceof Error ? e.message : 'SAVE');
    } finally {
      setBusy(false);
    }
  }

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
            <Pressable
              disabled={busy}
              hitSlop={12}
              onPress={discard}
              style={{ position: 'absolute', left: PAD, top: 0, zIndex: 30 }}
            >
              <MonoText dim={busy}>← BACK</MonoText>
            </Pressable>
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
        {!session ? (
          <View style={{ paddingHorizontal: PAD, paddingBottom: 2 }}>
            <MonoText dim size={11}>
              SAVE TO ALBUM · SIGN IN TO FIND PHOTOS WITH SIMILAR COLORS
            </MonoText>
          </View>
        ) : null}
        <View
          style={{
            zIndex: 20,
            elevation: 20,
            overflow: 'visible',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: PAD,
            paddingTop: 8,
            paddingBottom: 18,
            gap: GAP,
            transform: [{ translateY: -ACTION_LIFT }],
          }}
        >
          <JellyActionPair
            width={paintW * 2 + GAP}
            height={PAINT_H}
            gap={GAP}
            leftLabel="SAVE"
            rightLabel="MATCH"
            leftTone={tones.back}
            rightTone={tones.take}
            busy={busy}
            onLeft={() => void save()}
            onRight={() => void persist()}
          />
        </View>
      </View>
    </Screen>
  );
}
