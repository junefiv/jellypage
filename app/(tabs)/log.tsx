import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AlbumScatter } from '@/src/components/ui/AlbumScatter';
import { CamSwitch } from '@/src/components/ui/CamSwitch';
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
import { queryClient } from '@/src/lib/query';

export default function LogScreen() {
  const session = useSession((s) => s.session);
  const pane = useDock((s) => s.pane);
  const setPane = useDock((s) => s.setPane);
  const albumReplay = useDock((s) => s.albumReplay);
  const bumpAlbumReplay = useDock((s) => s.bumpAlbumReplay);
  const [q, setQ] = useState('');

  const wasInbox = useRef(pane === 'inbox');
  useEffect(() => {
    if (wasInbox.current && pane === 'log') bumpAlbumReplay();
    wasInbox.current = pane === 'inbox';
  }, [bumpAlbumReplay, pane]);

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

  const rows = useMemo(() => {
    const remote = session ? (takesQ.data ?? []) : [];
    const remoteIds = new Set(remote.map((take) => take.id));
    const local = (localQ.data ?? [])
      .filter((take) => !take.remoteId || !remoteIds.has(take.remoteId))
      .filter((take) => matchesLocalQuery(take, q));
    const merged: AlbumRow[] = [
      ...remote.map((take) => ({
        kind: 'remote' as const,
        id: take.id,
        capturedAt: take.captured_at,
        palette: take.palette,
        photoUri: publicBlur(take.blur_path),
        take,
      })),
      ...local.map((take) => ({
        kind: 'local' as const,
        id: take.id,
        capturedAt: take.capturedAt,
        palette: take.palette,
        photoUri: take.photoUri,
        take,
      })),
    ].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    return merged;
  }, [localQ.data, q, session, takesQ.data]);

  const scatterItems = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        photoUri: row.photoUri,
        palette: row.palette,
        capturedAt: row.capturedAt,
        geo: row.take.city,
        onOpen: () =>
          row.kind === 'local'
            ? router.push({ pathname: '/local/[id]', params: { id: row.id } } as never)
            : router.push(`/take/${row.id}`),
        onLongPress: async () => {
          if (row.kind === 'local') {
            await deleteLocalTake(row.id);
            await queryClient.invalidateQueries({ queryKey: ['local-takes'] });
          } else {
            await deleteTake(row.id, row.take.owner_id);
            await queryClient.invalidateQueries({ queryKey: ['takes'] });
          }
        },
      })),
    [rows],
  );

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
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Field
              value={q}
              onChangeText={setQ}
              placeholder="DATE / HEX"
              autoCapitalize="characters"
            />
          </View>
          <AlbumScatter items={scatterItems} replayKey={albumReplay} />
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
      capturedAt: string;
      palette: Take['palette'];
      photoUri: string | null;
      take: Take;
    }
  | {
      kind: 'local';
      id: string;
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
