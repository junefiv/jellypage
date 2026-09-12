import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { Field } from '@/src/components/ui/Field';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { Well } from '@/src/components/ui/Well';
import { useSession } from '@/src/features/auth/session';
import { canSend, listMessages, sendDm, subscribeMessages } from '@/src/features/dm/api';
import { listMyTakes, publicBlur } from '@/src/features/take/api';
import { purchaseDmUnlock } from '@/src/lib/iap';
import type { DmMessage } from '@/src/lib/database.types';
import { msg, msgError } from '@/src/lib/messages';
import { colors, copy } from '@/src/theme/tokens';

export default function DmThread() {
  const { threadId, peer } = useLocalSearchParams<{ threadId: string; peer: string }>();
  const me = useSession((s) => s.session?.user.id);
  const [body, setBody] = useState('');
  const [attach, setAttach] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const [msgs, setMsgs] = useState<DmMessage[]>([]);
  const [err, setErr] = useState('');

  const gateQ = useQuery({
    queryKey: ['can-send', peer],
    queryFn: () => canSend(peer),
    enabled: Boolean(peer),
  });
  const takesQ = useQuery({
    queryKey: ['takes'],
    queryFn: () => listMyTakes(),
    enabled: pick,
  });

  const msgQ = useQuery({
    queryKey: ['dm', threadId],
    queryFn: () => listMessages(threadId),
    enabled: Boolean(threadId),
  });

  useEffect(() => {
    if (msgQ.data) setMsgs(msgQ.data);
  }, [msgQ.data]);

  useEffect(() => {
    if (!threadId) return;
    const ch = subscribeMessages(threadId, (m) => {
      setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });
    return () => {
      void ch.unsubscribe();
    };
  }, [threadId]);

  async function submit() {
    if (!peer) return;
    setErr('');
    let gate = gateQ.data ?? (await canSend(peer));
    if (!gate.ok && gate.reason === 'needs_unlock') {
      const pay = await purchaseDmUnlock(peer);
      if (!pay.ok) {
        setErr(msgError(pay.error ?? 'IAP'));
        return;
      }
    }
    if (!gate.ok) {
      setErr(msgError(gate.reason));
      return;
    }
    await sendDm(peer, body, attach);
    setBody('');
    setAttach(null);
    await gateQ.refetch();
  }

  const unpaid = gateQ.data && !gateQ.data.ok && gateQ.data.reason === 'needs_unlock';

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }}>
          {msgs.map((m) => (
            <View key={m.id} style={{ alignSelf: m.sender_id === me ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <Well style={{ paddingVertical: 8 }}>
                <MonoText>{m.body}</MonoText>
              </Well>
            </View>
          ))}
        </ScrollView>
        {unpaid ? (
          <MonoText style={{ marginBottom: 8 }}>{copy.firstDm}</MonoText>
        ) : null}
        {attach ? <MonoText dim>{msg.attachTake(attach)}</MonoText> : null}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Field value={body} onChangeText={setBody} placeholder="…" wrapStyle={{ flex: 1 }} />
          <Tap label="TAKE" dim onPress={() => setPick((v) => !v)} />
          <Tap label="SEND" onPress={() => void submit()} />
        </View>
        {err ? <MonoText danger>{err}</MonoText> : null}
        {pick ? (
          <ScrollView horizontal style={{ marginTop: 8 }}>
            {(takesQ.data ?? []).slice(0, 12).map((t) => {
              const blur = publicBlur(t.blur_path);
              return (
                <Pressable key={t.id} onPress={() => { setAttach(t.id); setPick(false); }} style={{ width: 64, marginRight: 8 }}>
                  <View
                    style={{
                      backgroundColor: colors.paper,
                      padding: 4,
                      paddingBottom: 8,
                      shadowColor: '#000',
                      shadowOpacity: 0.35,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    {blur ? (
                      <Image source={{ uri: blur }} style={{ width: 56, height: 56 }} contentFit="cover" />
                    ) : (
                      <View style={{ width: 56, height: 56, backgroundColor: colors.line }} />
                    )}
                  </View>
                  <ChipStrip colors={t.palette} height={8} />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </Screen>
  );
}
