import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { CamSwitch } from '@/src/components/ui/CamSwitch';
import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { Field } from '@/src/components/ui/Field';
import { MeMark } from '@/src/components/ui/MeMark';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { Well } from '@/src/components/ui/Well';
import { useSession } from '@/src/features/auth/session';
import { listThreads } from '@/src/features/dm/api';
import { useDock } from '@/src/features/nav/dock';
import { deleteTake, listMyTakes, publicBlur } from '@/src/features/take/api';
import type { Take } from '@/src/lib/database.types';
import { formatClock, formatDateKey, formatTake } from '@/src/lib/format';
import { queryClient } from '@/src/lib/query';
import { colors } from '@/src/theme/tokens';

export default function LogScreen() {
  const session = useSession((s) => s.session);
  const pane = useDock((s) => s.pane);
  const setPane = useDock((s) => s.setPane);
  const [q, setQ] = useState('');
  const takesQ = useQuery({
    queryKey: ['takes', q],
    queryFn: () => listMyTakes(q),
    enabled: Boolean(session) && pane === 'log',
  });
  const inboxQ = useQuery({
    queryKey: ['inbox'],
    queryFn: listThreads,
    enabled: Boolean(session) && pane === 'inbox',
  });

  const sections = useMemo(() => {
    const map = new Map<string, Take[]>();
    for (const t of takesQ.data ?? []) {
      const key = formatDateKey(t.captured_at);
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map.entries()].map(([title, data]) => ({ title, data }));
  }, [takesQ.data]);

  if (!session) {
    return (
      <Screen>
        <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <MeMark />
        </View>
        <View style={{ padding: 24 }}>
          <Tap label="AUTH" onPress={() => router.push('/(auth)')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CamSwitch label="LOG" on={pane === 'log'} onPress={() => setPane('log')} />
        <View style={{ width: 8 }} />
        <CamSwitch label="INBOX" on={pane === 'inbox'} onPress={() => setPane('inbox')} />
        <View style={{ flex: 1 }} />
        <MeMark />
      </View>
      {pane === 'log' ? (
        <>
          <View style={{ paddingHorizontal: 16 }}>
            <Field
              value={q}
              onChangeText={setQ}
              placeholder="DATE / HEX"
              autoCapitalize="characters"
            />
          </View>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}
            renderSectionHeader={({ section }) => (
              <MonoText dim style={{ marginTop: 12 }}>
                {section.title}
              </MonoText>
            )}
            renderItem={({ item }) => (
              <LogRow
                take={item}
                onOpen={() => router.push(`/take/${item.id}`)}
                onDelete={async () => {
                  await deleteTake(item.id, item.owner_id);
                  await queryClient.invalidateQueries({ queryKey: ['takes'] });
                }}
              />
            )}
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}>
          {(inboxQ.data ?? []).map((th) => (
            <Pressable key={th.id} onPress={() => router.push(`/dm/${th.id}?peer=${th.peerId}`)}>
              <Well>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <MonoText>@{th.handle}</MonoText>
                  <MonoText dim>{th.unpaid ? 'UNPAID' : th.open ? 'OPEN' : '—'}</MonoText>
                </View>
                <MonoText dim numberOfLines={1}>
                  {th.last || '—'}
                </MonoText>
              </Well>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function LogRow({ take, onOpen, onDelete }: { take: Take; onOpen: () => void; onDelete: () => void }) {
  const [startX, setStartX] = useState<number | null>(null);
  const thumb = publicBlur(take.blur_path);
  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => setStartX(e.nativeEvent.pageX)}
      onResponderRelease={(e) => {
        if (startX != null && e.nativeEvent.pageX - startX < -72) onDelete();
        setStartX(null);
      }}
    >
      <Pressable
        onPress={onOpen}
        onLongPress={onDelete}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <ChipStrip colors={take.palette} height={10} />
          <MonoText size={12} style={{ marginTop: 6 }}>
            {formatTake(take.seq)}  {formatClock(take.captured_at)}
          </MonoText>
        </View>
        <View
          style={{
            width: 44,
            height: 52,
            backgroundColor: colors.paper,
            padding: 4,
            paddingBottom: 8,
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: colors.line }} />
          )}
        </View>
      </Pressable>
    </View>
  );
}
