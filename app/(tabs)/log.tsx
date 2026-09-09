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
import { deleteLocalTake, listLocalTakes, type LocalTake } from '@/src/features/take/local-album';
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
  const localQ = useQuery({
    queryKey: ['local-takes'],
    queryFn: listLocalTakes,
    enabled: pane === 'log',
  });
  const inboxQ = useQuery({
    queryKey: ['inbox'],
    queryFn: listThreads,
    enabled: Boolean(session) && pane === 'inbox',
  });

  const sections = useMemo(() => {
    const remote = session ? (takesQ.data ?? []) : [];
    const remoteIds = new Set(remote.map((take) => take.id));
    const local = (localQ.data ?? [])
      .filter((take) => !take.remoteId || !remoteIds.has(take.remoteId))
      .filter((take) => matchesLocalQuery(take, q));
    const rows: AlbumRow[] = [
      ...remote.map((take) => ({
        kind: 'remote' as const,
        id: take.id,
        seq: take.seq,
        capturedAt: take.captured_at,
        palette: take.palette,
        photoUri: publicBlur(take.blur_path),
        take,
      })),
      ...local.map((take) => ({
        kind: 'local' as const,
        id: take.id,
        seq: take.seq,
        capturedAt: take.capturedAt,
        palette: take.palette,
        photoUri: take.photoUri,
        take,
      })),
    ].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

    const map = new Map<string, AlbumRow[]>();
    for (const row of rows) {
      const key = formatDateKey(row.capturedAt);
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()].map(([title, data]) => ({ title, data }));
  }, [localQ.data, q, session, takesQ.data]);

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
        <CamSwitch label="ALBUM" on={pane === 'log'} onPress={() => setPane('log')} />
        <View style={{ width: 8 }} />
        <CamSwitch label="INBOX" on={pane === 'inbox'} onPress={() => setPane('inbox')} />
        <View style={{ flex: 1 }} />
        <MeMark />
      </View>
      {pane === 'log' ? (
        <>
          {!session ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Well style={{ gap: 8 }}>
                <MonoText>SIGN IN TO FIND PHOTOS WITH SIMILAR COLORS</MonoText>
                <MonoText dim size={11}>YOUR LOCAL ALBUM STAYS ON THIS DEVICE</MonoText>
                <Tap
                  label="SIGN IN"
                  onPress={() => router.push({ pathname: '/(auth)', params: { next: 'log' } })}
                />
              </Well>
            </View>
          ) : null}
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
                row={item}
                onOpen={() =>
                  item.kind === 'local'
                    ? router.push({ pathname: '/local/[id]', params: { id: item.id } } as never)
                    : router.push(`/take/${item.id}`)
                }
                onDelete={async () => {
                  if (item.kind === 'local') {
                    await deleteLocalTake(item.id);
                    await queryClient.invalidateQueries({ queryKey: ['local-takes'] });
                  } else {
                    await deleteTake(item.id, item.take.owner_id);
                    await queryClient.invalidateQueries({ queryKey: ['takes'] });
                  }
                }}
              />
            )}
            ListEmptyComponent={
              <View style={{ paddingVertical: 32 }}>
                <MonoText dim>NO SAVED TAKES</MonoText>
              </View>
            }
          />
        </>
      ) : !session ? (
        <View style={{ padding: 24, gap: 12 }}>
          <MonoText>SIGN IN TO SEE MATCHES AND DM</MonoText>
          <Tap
            label="SIGN IN"
            onPress={() => router.push({ pathname: '/(auth)', params: { next: 'log' } })}
          />
        </View>
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

type AlbumRow =
  | {
      kind: 'remote';
      id: string;
      seq: number;
      capturedAt: string;
      palette: Take['palette'];
      photoUri: string | null;
      take: Take;
    }
  | {
      kind: 'local';
      id: string;
      seq: number;
      capturedAt: string;
      palette: LocalTake['palette'];
      photoUri: string;
      take: LocalTake;
    };

function matchesLocalQuery(take: LocalTake, query: string) {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return true;
  const hex = take.palette.map((color) => color.hex).join(' ');
  return (
    take.capturedAt.slice(0, 10).includes(normalized) ||
    hex.includes(normalized) ||
    String(take.seq).includes(normalized)
  );
}

function LogRow({ row, onOpen, onDelete }: { row: AlbumRow; onOpen: () => void; onDelete: () => void }) {
  const [startX, setStartX] = useState<number | null>(null);
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
          <ChipStrip colors={row.palette} height={10} />
          <MonoText size={12} style={{ marginTop: 6 }}>
            {formatTake(row.seq)}  {formatClock(row.capturedAt)}{'  '}
            {row.kind === 'local' ? row.take.syncState.toUpperCase() : 'CLOUD'}
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
          {row.photoUri ? (
            <Image source={{ uri: row.photoUri }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: colors.line }} />
          )}
        </View>
      </Pressable>
    </View>
  );
}
